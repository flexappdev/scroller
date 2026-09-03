# ScrollAI / ScrollerAI generation contract

ScrollAI is the control plane for creating and managing Scroller Packs. The detailed reusable skill lives at `skills/scrollai/SKILL.md`.

Use this contract whenever an AI agent creates content for Scroller.

## Goal

Turn a topic, dataset, course, book, Top 100 list or research set into the smallest valid Scroller Pack. Do not generate a new application.

## Build order

Always progress in this order:

**Page → List → Images → Audio → Video**

Text must be useful and publishable before paid media generation begins.

## Required output

Create a folder at `data/scrollers/<slug>/` containing:

- `manifest.json`
- `items.json`

Recommended for ScrollAI packs:

- `page.md`

### manifest.json

Required fields:

```json
{
  "slug": "ai-use-cases",
  "name": "100 AI Use Cases",
  "tagline": "100 practical ways to put AI to work.",
  "description": "A concise description.",
  "theme": "dark"
}
```

Optional monetisation block:

```json
{
  "monetization": {
    "type": "lead",
    "gateAfter": 20,
    "ctaLabel": "Turn this into a working AI workflow",
    "ctaUrl": "https://www.matsiems.com/",
    "offer": "Move from ideas to implementation"
  }
}
```

Supported monetisation types: `lead`, `product`, `affiliate`, `sponsor`.

### items.json

Each item must contain only three required fields:

```json
[
  {
    "id": "001",
    "title": "Research faster",
    "content": "Use AI to research and synthesise complex topics."
  }
]
```

Optional fields include `hook`, `explanation`, `tags`, `image`, `video`, `cta` and backward-compatible enrichment metadata.

## Universal experience contract

- Pink accent `#ec4899` by default.
- Dark mode by default; light toggle available.
- Sticky header.
- Sticky five-button primary navigation: **Home · Explore · Gen · Saved · Me**.
- `Gen` is the center action and routes to `/create`.
- Reuse the same destinations across mobile and desktop.
- Keep vertical scroll snap as the default feed interaction.

## Rules

1. Never generate application code for a new Scroller topic.
2. Reuse `/scroller/[slug]` and the shared `ScrollerFeed` runtime.
3. Keep platform concerns outside the content pack.
4. Prefer 100 concise, non-duplicative items for Top 100 Scrollers.
5. Put the strongest and most immediately useful items first.
6. Use `gateAfter` to expose a useful free sample before a revenue CTA.
7. For a consulting funnel, make the CTA outcome-specific rather than generic.
8. Run `npm run scroller:validate` before publishing.
9. A failed validation blocks deployment.
10. For current subjects, refresh research from live attributable sources before reranking.
11. Reuse MediaAI/VaultAI assets before generating new ones.
12. Video-provider promotions are configuration, never a schema dependency.

## Local workflow

If item JSON has already been generated:

```bash
npm run scroller:new -- "100 AI Agent Use Cases" ./tmp/items.json
npm run scroller:validate
npm run build
```

The resulting route is:

```text
/scroller/100-ai-agent-use-cases
```

## Minimum definition of done

- pack validates
- route builds
- first card renders
- vertical scroll snap works
- sticky header and five-button footer render
- all five navigation destinations resolve
- configured revenue CTA appears when used
- no premium/full dataset is passed to the browser before the configured gate
- no private VaultAI asset is exposed through a public pack
