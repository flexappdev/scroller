# Scroller — Status

_Last updated: 2026-09-02 · v3.5_

## Latest

- **Repo**: [flexappdev/scroller](https://github.com/flexappdev/scroller) · port `19013` · accent `#ec4899` (pink)
- **Local UAT**: http://localhost:19013/
- **Prod**:
  - `https://scroller-bay.vercel.app` — auto-deploys from GitHub via the matsiems Vercel scope
  - `https://scroller-psi.vercel.app` — cleverfox-71aa03f5 scope, manual deploy (owed since v2.4)
- **Version**: v3.5 — MediaAI-first immersive scroller, wikai design system
- **PRD alignment**: [`docs/PRD-ALIGNMENT.md`](docs/PRD-ALIGNMENT.md) — mapped to ABC + VaultAI + MediaAI + ScrollerAI PRD v0.1 (2026-09-02). Next release = **v4.0 foundation** (ContentItem unify + packages/scroller extract + site.config.ts).
- **Recent feature highlights** (most recent first):
  - **v3.5** — Home polish: deep-link URL on open, IO-based active card, drop dead `AppNav`. Snapshot fallback for MediaAI when Mongo is cold.
  - **v3.4** — Header + full article + inline video + pink favicon.
  - **v3.3** — Browse: all sources + sticky-chrome consistency + inline video playback.
  - **v3.2** — Home: pink accent, article-rich detail sheet, folded nav, wrap-around scroll.
  - **v3.1** — Tap-to-details on home feed + wikai skin (dark tokens, 60px icon rail, ambient bg, glass chrome).
  - **v3.0** — MediaAI becomes the default immersive feed.
  - **v2.6** — Revenue-first Scroller Pack runtime; ChatGPT + Siema image scrollers; Scroller skill fallback builder.
  - **v2.5** — Playwright E2E scaffold, Vercel Analytics, `next/image` for Wiki/Video/Amazon/Image cards, `/diagrams`, light-mode default.
  - **v0.4.0 → v2.4** — see git log for full history.

## Sources (9)

videos · github · prompts · apps · sites · wiki · wikivoyage · amazon · images
(plus **MediaAI** as the default home feed)

## Owed

1. **Ship v4.0 foundation** — see `docs/PRD-ALIGNMENT.md`. Blocks the 100-app promise. Ordered items in `BACKLOG.md`.
2. **Apply Supabase migration** `supabase/migrations/0001_sites.sql` against project `tciqizkiseraumwdzxya` — unblocks `/sites` Curated section.
3. **Deploy to `scroller-psi` (cleverfox scope)** — deferred since v2.4; needs `vercel login` as mat-flexappdev. Bay auto-deploys.
4. **`npm audit fix`** — 3 high-severity flags from `@playwright/test`.
