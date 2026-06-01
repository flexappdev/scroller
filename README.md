# Scroller

> One feed. Every source.

Mobile-first vertical feed that mixes nine sources into a single daily-shuffled stream, with snap-scroll UI, modal-first navigation, per-item detail pages, and a sticky source selector. Live at **[scroller-psi.vercel.app](https://scroller-psi.vercel.app)** + **[scroller-bay.vercel.app](https://scroller-bay.vercel.app)**.

Next.js 15 · React 19 · Tailwind · Supabase · MongoDB · S3 · Port **19013** · Accent **#10b981**

## Sources

| id | what | where it comes from |
|---|---|---|
| `videos` | YouTube videos | RSS · @mat-siems-production |
| `github` | GitHub stars | REST · @flexappdev's starred repos |
| `prompts` | Top 100 AI prompts | `f/awesome-chatgpt-prompts` CSV |
| `apps` | Fleet apps catalogue | `data/apps-registry.json` |
| `sites` | Curated sites | Supabase `scroller_sites` |
| `wiki` | Random Wikipedia | REST · `/page/random/summary` (batched, 10-min cached) |
| `wikivoyage` | Random WikiVoyage | REST · same shape, voyage host |
| `amazon` | Amazon Associates picks | Mongo `AzDB.MAIN` + `AmazonDB.topSellers` (fallback: Google Sheet) |
| `images` | S3 image gallery | `com27` bucket, signed URLs, 100-at-a-time pagination |

## Routes

- `/` — home feed (mixed source feed with kind dropdown + 3 views + 3 sorts)
- `/?source=<id>` — single source feed
- `/sites` — fleet + curated + scroll sources, full-width browser
- `/apps`, `/videos`, `/github`, `/prompts` — single-source browser pages
- `/wiki` — Wikipedia master index (Mongo + Supabase)
- `/items/[id]` — per-item detail page (e.g. `/items/wiki:Paris`, `/items/site:hn`)
- `/about` — sources, stack, attribution
- `/admin` — Supabase-gated console (sites CRUD, Mongo + S3 consoles)

## Run locally

```sh
cp .env.example .env.local       # fill in Supabase/Mongo/S3 keys
npm install
npm run dev                       # http://localhost:19013
```

## Build & deploy

```sh
npm run build                     # 18 routes; smoke check before deploy
vercel deploy --prod              # deploys to the linked Vercel project
```

GitHub auto-deploy is wired only on the `matsiems/scroller` Vercel project (which serves `scroller-bay`). The canonical `scroller-psi` (cleverfox-71aa03f5 scope) requires manual `vercel deploy --prod` after a `vercel login` as mat-flexappdev.

## Supabase migrations

```sh
ls supabase/migrations/           # 0001_sites.sql — scroller_sites + publish log
# Apply via: Studio SQL Editor for project tciqizkiseraumwdzxya
# (or `npx supabase db query --linked --file supabase/migrations/0001_sites.sql`
# after `supabase login` as mat@matsiems.com)
```

## Architecture notes

- **Sticky shell** — `AppShell` mounts `AppNav` (sidebar) + `StickyHeader` (source selector) + `StickyFooter` (prev/random/next + version + GitHub/About/Account). Both header + footer use `position: fixed` and a `--sidebar-w` CSS var so the layout reflows when the sidebar collapses.
- **Source registry** — `src/lib/scroll/sources.ts` is the single source of truth for the sidebar, header dropdown, and per-source colors.
- **PageBrowser primitive** — every list page (and the home) wraps a list in `<PageBrowser>` which provides search, view toggle (scroller/list/grid), sort toggle (ranked/alpha/random), and an optional kind filter. Per-page prefs persist in `localStorage`. Default view is scroller on mobile, grid on desktop.
- **Modal-first nav** — clicking any card opens `<ItemModal>` with "View details" → `/items/[id]`, "Open external" (per-kind), and "Copy link" CTAs. The `/items/[id]` route resolves any `<kind>:<inner>` composite id back to the source detail.
- **Random sort** — uses a `Math.random()` seed per-mount so a refresh = new order. Clicking the Random toggle re-shuffles via a nonce bump.
- **Daily-seeded shuffle** — the initial home feed order is randomized at request time via `seededShuffle(cards, randomNonce)` inside `PageBrowser`. SSR-stable inside a single page render.
- **Amazon tag enforcement** — `withAmazonTag()` rewrites any `amazon.*` URL to include `?tag=fs08-21` (configurable via `AMAZON_ASSOCIATES_TAG`). Applied to Mongo and Sheet sources both.

## Owned + pending

- ✅ v0.4.0 prod-ready Phase 6 (error boundaries, robots, sitemap, security headers, OG, per-route metadata, CTAs everywhere)
- 📋 Apply `0001_sites.sql` to Supabase (needs CLI re-login as mat@matsiems.com)
- 📋 Deploy v0.4.0 to scroller-psi (needs `vercel login` as mat-flexappdev)
- 📋 v0.5.0 — Playwright E2E, ESLint CLI migration, Vercel Analytics, Sentry
