# Scroller — PRD Alignment (v0.1)

_Last updated: 2026-09-02 · maps ~/APPS/scroller @ v3.5 → PRD "ABC + VaultAI + MediaAI + ScrollerAI v0.1" (2026-09-02)_

## Purpose

The morning brainstorm (2026-09-02) locked a working PRD:

> Mat + SkayAI → ABC → VaultAI + MediaAI + ScrollerAI → 100 Apps → Trinity / Users.

Scroller stops being a standalone site and becomes the **experience/distribution plane** for every app in the fleet. This doc maps what the current codebase already does, what it doesn't, and the ordered work to close the gap.

**Non-negotiable from the PRD:** do not build a new Scroller for every site. One engine, per-site config.

## Where we are

- **v3.5** (`36e0c52` fall back to public MediaAI snapshot)
- Home = `MediaAiFeed` immersive swipe, wikai skin, pink accent
- `AppShell` sticky header + footer
- 9 source fetchers (videos · github · prompts · apps · sites · wiki · wikivoyage · amazon · images) + MediaAI as default
- Mongo `AIDB.*` + S3 `com27/scroller/*` read directly from Next server routes
- Port `19013`, repo `flexappdev/scroller`
- `STATUS.md` is stale at v0.4.0 (drift of 5 versions — separate housekeeping fix)

## Gap matrix

| PRD § | Requirement | Scroller today | Gap |
|---|---|---|---|
| §6 | One logical VaultAI with PRIVATE / SHARED / PUBLIC zones | No zone concept; all Mongo/S3 reads assumed public | **High** — public Scroller must be provably unable to read PRIVATE |
| §7 | VaultAI abstracts storage (Mongo metadata, S3 binaries, MD long-form) via one API | Fetchers hit Mongo + S3 + Wikipedia + Amazon directly | **High** — no `vault-sdk` |
| §9 | Universal asset record (id, storage, media, security, tags, apps[], generation, status) | Ad-hoc per source | **Medium** |
| §10 | Universal `ContentItem` (id, rank, title, slug, markdown, imageAssetId, videoAssetId, audioAssetId…) | `Card` union in `src/lib/types.ts` — 9 shapes, source-specific | **High** — blocks every downstream item |
| §11 | Sticky header + 5 universal actions (Home · Explore · Create · Saved · Me) | Sticky header ✅; 5-button nav ❌ (Saved queued in v3.1 BACKLOG) | **High** — small change, high leverage |
| §12 | Desktop = same 5 destinations as left rail, same routes | Responsive works; no dedicated desktop rail | **Medium** |
| §13 | `site.config.ts` per app (id, brand, content, scroller mode, navigation) | wikai/siema skins are ad-hoc, not configs | **High** — blocks the 100-app promise |
| §14 | Launch standard: 100 items × MD + image + ≥25 audio + ≥25 video | Scroller itself has ~200 items across sources; no per-app launch checklist | **Medium** — becomes concrete once §13 exists |
| §19 | Public Scroller ≠ PRIVATE Vault (technical enforcement) | No boundary | **High** — must ship before Vault ingest |
| §20 | Universal analytics events (app_open, item_view, scroll_next, save, share, ai_question, conversion, …) | Vercel Analytics only | **Medium** |
| §21 | First vertical slice: ABC → VaultAI → MediaAI/XPS16 → Scroller → one real site | Scroller runs standalone; no ABC/Vault/Media boundaries | Scroller IS the reference — clarify boundaries here first |

## Ordered work (maps to PRD phases)

### v4.0 — Foundation (PRD Phase 1)

The three items that unblock everything else. Ship as one release.

1. **Universal `ContentItem` in `src/lib/types.ts`** — collapse the 9 `Card` variants into one shape with `imageAssetId` / `videoAssetId` / `audioAssetId` / `markdown` / `topic` / `tags[]` / `sources[]` / `apps[]` / `status`. Fetchers keep source-specific loaders but return `ContentItem`.
2. **Extract `packages/scroller` shell** — pull `AppShell` + `MediaAiFeed` + `ItemModal` + `StickyHeader` + `StickyFooter` out of `src/components/`, into a package the next 100 apps consume. Scroller itself becomes the first consumer.
3. **`site.config.ts` stub** — schema for `{ id, brand: {name, accent}, content: {collection, defaultLimit}, scroller: {mode, ranking, comments, audio, video}, navigation: {home, explore, create, saved, profile} }`. Scroller's own config = the first file.

Also: **refresh `STATUS.md`** to reflect v3.1 → v3.5. (Not architecture — just stops the drift.)

### v4.1 — Five-button nav (PRD §11 + §12)

Standardize on **Home · Explore · Create · Saved · Me**. Bottom nav on mobile, left rail on desktop, same routes.

- `/` → Home
- `/explore` → source picker + filter chips (folds the current source dropdown into a real page)
- `/create` → context-aware CTA (defaults to "Ask MediaAI"; each `site.config.ts` overrides)
- `/saved` → localStorage-backed bookmarks (already in v3.1 BACKLOG)
- `/me` → profile / settings / theme toggle

Half of the previous v3.1 BACKLOG collapses into this (Saved, filter chips, search overlay).

### v4.2 — VaultAI SDK boundary (PRD Phase 2 + §7 + §19)

- Introduce `packages/vault-sdk` with one method: `getAsset(id)` / `getItems(query)`.
- Kill direct Mongo + S3 imports from `src/app/**` and route them through the SDK.
- Zone enforcement: SDK requires an `audience: "public" | "shared"` param. `"private"` is rejected outright when called from a public app.
- Fingerprint (SHA256 + perceptual hash) added to the ingest path so §8's dedup story is real.

### v4.3 — Analytics event schema (PRD §20)

Emit the universal events. One helper (`packages/analytics`) writes to Mongo `AIDB.scroller_events` + Vercel Analytics + Sentry (whenever the DSN arrives).

### v4.4 — First non-Scroller consumer (PRD Phase 5)

Take **WikiAI** (existing wikai codebase, big media corpus) and rebuild it as `Scroller Engine + wikai/site.config.ts + dataset + branding`. Proof-of-configurability. If this works, LawAI / ArtAI / CVAI / SpaceAI are configuration exercises.

## What we drop or re-scope

- **v2.6 mobile port from wikai v1.6** — obsolete. v3.x already ate the wikai skin. Delete section.
- **v3.1 "Ultimate home scroller" items** — most fold into v4.1 (Saved, search, filter chips, related rail) or v4.3 (analytics). A few stay as v4.x polish: PWA, RSS feed, MediaAI sitemap, IntersectionObserver.
- **`AIDB.reactions` in Mongo** — hold. Reactions are content, so they belong in VaultAI, not a fresh Mongo collection.
- **v2.7 "10K items"** — not a scroller task. Belongs upstream in VaultAI ingest (§8).
- **v2.8 admin CMS extensions** — hold until VaultAI SDK lands; the admin will consume the SDK, not Mongo direct.

## Definition of done — v4.0

A fresh Claude Code agent can:

1. `cd ~/APPS/scroller && cat docs/PRD-ALIGNMENT.md` — read this file.
2. Open `src/lib/types.ts` — see one `ContentItem` type, not nine `Card` variants.
3. Open `packages/scroller/` — see the shell exports.
4. Open `sites/scroller/site.config.ts` — see the schema in action.
5. `npm run dev` — see the same v3.5 UI, working the same way, but backed by the new types.

No new pixels for the user. Foundation only.
