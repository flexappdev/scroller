---
name: scroller-chatgpt-images
description: Turn generated images from ChatGPT conversations, shared ChatGPT URLs, exports, or local image folders into a deduplicated, ordered Scroller feed. Use when Mat asks to push generated images to Scroller, rebuild the image feed, ingest a Siema image thread, create vertical/horizontal scrollers, or keep Scroller synchronized with newly generated images.
---

# Scroller — ChatGPT Generated Images

## Goal

Convert generated images into a production-ready Scroller feed with minimal manual work.

Default seed source:
- https://chatgpt.com/share/6a7eb7a1-30f8-83ed-b8e8-c0459a7e2d75?ogimg=plain

The workflow must be incremental: a later run adds new images without re-adding old ones.

## Non-negotiable invariants

1. **ONE GENERATED IMAGE = ONE SCROLLER ITEM.**
2. Never merge images into collages, grids, diptychs, contact sheets, montages, or multi-panel composites.
3. Preserve the original generated image as the canonical asset.
4. Never destructively crop the canonical asset just to fit a portrait feed.
5. For vertical/mobile presentation, fit the full original inside a 9:16 item shell. Background treatment may use a blurred/extended derivative, but the original image must remain completely visible.
6. Preserve source order unless the user explicitly requests another sort.
7. Deduplicate before publishing.
8. Never invent missing prompts, timestamps, authors, or source URLs. Use null/unknown where necessary.
9. Reuse the existing Scroller app architecture, components, storage, routing, analytics, and deployment conventions when a repository is available. Do not create a parallel stack unless no Scroller implementation exists.
10. A run is complete only after validating the manifest and rendering the feed without broken items.

## Inputs

Accept any combination of:

- `source_url`: one or more ChatGPT conversation/share URLs.
- `source_export`: a user-provided ChatGPT/export archive or conversation data file.
- `source_dir`: a local folder containing generated images.
- `repo`: the Scroller repository or current working repository.
- `feed`: feed slug; default `siema` for Siema sources, otherwise infer a stable slug from the source title.
- `mode`: `vertical`, `horizontal`, or `both`; default `both`.
- `publish`: whether to integrate/publish or only build/preview; default to integrate when working inside the Scroller repo.

## Preferred execution order

### 1. Inspect the Scroller repository first

If a repository is available:

- Inspect `package.json`, routes, app/pages directories, existing feed components, image storage, API/data layer, and deployment config.
- Search for existing concepts such as `scroller`, `feed`, `media`, `image`, `siema`, `manifest`, `content`, or `gallery`.
- Extend existing abstractions instead of rebuilding them.
- If the repo is Next.js, prefer an existing App Router/Page Router convention already used by the repo.
- If there is already an image/media model, map this workflow to that model and add only missing fields.

If no repository exists, use the static fallback builder in `scripts/build_scroller.py`.

### 2. Discover generated images

For each source, collect image candidates in source order.

For a ChatGPT shared URL:

- Use a real browser/Playwright page load when simple HTTP parsing does not expose the generated images.
- Inspect rendered assistant messages for image elements/assets.
- Ignore avatars, logos, icons, thumbnails, UI sprites, emoji, and tiny assets.
- Prefer the original downloadable image URL when exposed.
- If only a rendered image is available, capture the rendered image as a fallback and mark `source_quality: rendered`.
- Associate an image with the nearest preceding user prompt only when the DOM/message structure supports this reliably.

For local folders:

- Accept PNG, JPEG/JPG, WEBP, and AVIF where supported.
- Sort deterministically by explicit manifest order first, then file timestamp/name only as a fallback.

### 3. Normalize assets

For every canonical image:

- Compute SHA-256.
- Record width, height, aspect ratio, bytes, MIME type, and filename.
- Store canonical originals under the Scroller project’s existing media convention; static fallback uses `public/media/<feed>/original/`.
- Generate optimized web derivatives only if the existing app already does so or if performance requires it.
- Keep the canonical original untouched.

Optional derivative targets:

- `landscape`: optimized full-frame display copy.
- `portrait-shell`: 9:16 presentation derivative or CSS presentation that keeps the entire canonical image visible.
- `thumb`: lightweight preload/list thumbnail.

Do not generate duplicates merely because both orientations are supported; derivatives belong to one manifest item.

### 4. Deduplicate

Deduplicate in this order:

1. Exact SHA-256 match.
2. Existing source asset ID/source URL match.
3. Optional perceptual-hash near-match only when a library is already available and confidence is high.

Never remove two visually similar but genuinely distinct generations just because the prompts are similar.

### 5. Build/update the manifest

Use one item per generated image.

Minimum item shape:

```json
{
  "id": "stable-id",
  "feed": "siema",
  "ordinal": 1,
  "type": "image",
  "src": "/media/siema/original/example.webp",
  "width": 1536,
  "height": 864,
  "aspect_ratio": 1.7778,
  "sha256": "...",
  "prompt": "... or null",
  "caption": "... or null",
  "source_title": "Siema Hourly Random",
  "source_url": "https://chatgpt.com/share/...",
  "source_message_id": null,
  "created_at": null,
  "source_quality": "original",
  "tags": ["siema", "chatgpt", "generated"]
}
```

Rules:

- `id` must remain stable across reruns.
- `ordinal` is monotonic within the feed.
- Keep existing ordinals for already-published items.
- Append newly discovered items by default.
- Do not rewrite existing metadata unless a better verified value becomes available.

### 6. Render the Scroller UX

Prefer the app’s existing scroller component. If none exists, implement the minimum viable version:

#### Vertical mode

- One item per viewport/card.
- CSS scroll snapping on the Y axis.
- Full image visible with `object-fit: contain` or equivalent.
- 9:16 mobile presentation shell.
- Minimal overlay: sequence number, source/feed, optional caption/prompt toggle.
- Lazy-load items beyond the immediate next items.
- Preload the next 1–2 items.

#### Horizontal mode

- One item per snap position.
- X-axis snap scrolling.
- Arrow-key and touch/trackpad support.
- Preserve the canonical image aspect ratio.

#### Shared behavior

- No grid as the primary consumption UX.
- Deep-linkable item IDs where practical.
- Keyboard navigation where practical.
- Avoid autoplay video logic in this image-only skill, but do not block the app’s future mixed-media model.

### 7. Incremental sync

Persist ingestion state using the project’s existing database/store where possible; otherwise keep a feed manifest plus a source-state file.

A rerun must:

1. Load existing item hashes/source IDs.
2. discover the current source images;
3. skip existing assets;
4. append only new images;
5. rebuild affected indexes/feed pages;
6. report added/skipped/failed counts.

Never wipe the feed merely to sync it.

### 8. Validate before completion

Run all relevant checks available in the repo, plus these feed checks:

- Manifest parses successfully.
- Every manifest `src` resolves to an existing asset.
- No duplicate SHA-256 hashes among canonical items.
- Ordinals are unique and ordered.
- Width/height are positive.
- Image count in the rendered feed equals manifest item count.
- Vertical viewport at ~390x844 shows one complete item with no horizontal overflow.
- Desktop viewport shows working snap/navigation.
- First, middle, and last images render.
- Existing Scroller routes/tests still pass.

If browser testing is available, take screenshots of mobile and desktop states and inspect them visually.

## Static fallback

When there is no existing Scroller repository, use:

```bash
python scripts/build_scroller.py --input <image-folder> --output ./scroller-output --feed siema
```

This creates:

- `scroller-output/manifest.json`
- `scroller-output/index.html`
- `scroller-output/horizontal.html`
- `scroller-output/media/...`

It is a preview/fallback, not a replacement for integrating with the real Scroller app when the repo is available.

## Completion report

Return a compact run report:

- Source(s)
- Feed slug
- Images discovered
- New images added
- Duplicates skipped
- Failures
- Total feed size
- Vertical route/view
- Horizontal route/view
- Files/routes changed
- Validation status
- Deployment/publish status if applicable

## Failure policy

- If a ChatGPT share page does not expose downloadable originals, do not pretend it did. Use a rendered capture only if acceptable and label it accurately.
- If authentication blocks a source, stop ingestion for that source, preserve completed work for other sources, and report the exact blocked source.
- If metadata cannot be proven, keep it null rather than hallucinating it.
- If publishing/deployment credentials are missing, still complete ingestion and local integration/testing, then report only the blocked publish step.
