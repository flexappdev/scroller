# Scroller

> One feed. Every source.

Mobile-first vertical feed that mixes nine sources into a single daily-shuffled stream, with snap-scroll UI, modal-first navigation, per-item detail pages, and a sticky source selector. Live at **[scroller-psi.vercel.app](https://scroller-psi.vercel.app)** + **[scroller-bay.vercel.app](https://scroller-bay.vercel.app)**.

Next.js 15 · React 19 · Tailwind · Supabase · MongoDB · S3 · Port **19013** · Accent **#10b981**

## Sources

| id | what | where it comes from |
|---|---|---|
| `videos` | YouTube videos | RSS · @mat-siems-production (UC2lkM6tg...) + @MatSiems handle resolved at request time |
| `github` | GitHub stars | REST · @flexappdev's starred repos |
| `prompts` | Top 100 AI prompts | `f/awesome-chatgpt-prompts` CSV |
| `apps` | Fleet apps catalogue | `data/apps-registry.json` + auto-screenshots from S3 |
| `sites` | Curated sites | Supabase `scroller_sites` + auto-screenshots from S3 |
| `wiki` | Random Wikipedia (live + cached) | Action API `generator=random` (1 call → 50 items); 10-min `unstable_cache` shared across Vercel lambdas |
| `wikivoyage` | Random WikiVoyage destinations | Same Action API path, 100 destinations per load |
| `amazon` | Amazon Associates picks | Mongo `AzDB.MAIN` + `AmazonDB.topSellers` (fallback: Google Sheet); `?tag=fs08-21` enforced via `withAmazonTag()` |
| `images` | S3 image gallery | `com27` bucket, signed URLs, 100-at-a-time pagination |

## Routes

- `/` — home feed (mixed source feed with kind dropdown + 3 views + 3 sorts)
- `/?source=<id>` — single-source feed
- `/sites`, `/apps`, `/videos`, `/github`, `/prompts` — single-source browser pages
- `/wiki`, `/wikivoyage`, `/amazon`, `/images` — dedicated source pages with their own browser/scroller view
- `/items/[id]` — per-item detail page (e.g. `/items/wiki:Paris`, `/items/site:hn`, `/items/amazon:B07X...`)
- `/about` — sources, stack, attribution, fleet links
- `/admin` — Supabase-gated console (sites CRUD, Mongo + S3 + wiki seeds)
- `/api/scroll/images` — paginated image cursor
- `/api/wiki/*` — sync, index, categories, article
- `/api/diag` — JSON diagnostics (mongo, supabase, wiki counts)
- `/robots.txt`, `/sitemap.xml`, `/icon`, `/opengraph-image` — SEO surfaces

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
ls supabase/migrations/
# 0001_sites.sql — scroller_sites + publish log
# 0002_wiki.sql  — scroller_wiki_index + seeds + run log
# Apply via: Studio SQL Editor for project tciqizkiseraumwdzxya
# (or `npx supabase db query --linked --file supabase/migrations/0001_sites.sql`
# after `supabase login` as mat@matsiems.com)
```

While the migrations are pending, every page degrades gracefully:
- `/sites` Curated section hides
- `/wiki` falls back to live random Wikipedia (REST API)
- `/admin/sites` + `/admin/wiki` show empty-state with seed CTAs

## Architecture notes

- **Sticky shell** — `AppShell` mounts `AppNav` (sidebar) + `StickyHeader` (source selector with tagline) + `StickyFooter` (prev/random/next + version + GitHub/About/Account). Both header + footer use `position: fixed` and a `--sidebar-w` CSS var so the layout reflows when the sidebar collapses.
- **Source registry** — `src/lib/scroll/sources.ts` is the single source of truth for the sidebar, header dropdown, and per-source colours.
- **PageBrowser primitive** — every list page (and the home) wraps a list in `<PageBrowser>` which provides search, view toggle (scroller/list/grid), sort toggle (ranked/alpha/random), an optional kind filter, and optional load-more cursor. Per-page prefs persist in `localStorage`. Default view: scroller on mobile, grid on desktop.
- **Modal-first nav** — clicking any card opens `<ItemModal>` with "View details" → `/items/[id]`, "Open external" (per-kind), per-kind extra actions ("Try in Claude/ChatGPT" on prompts, "Open app/View on GitHub" on apps), and a "Copy link" button.
- **Random sort** — uses a `Math.random()` seed per-mount so a refresh = new order. Clicking the Random toggle re-shuffles via a nonce bump.
- **Wiki fetcher** — uses the Action API's `generator=random` to pull 50 page summaries (title + extract + thumbnail + canonical URL) in a single request. Paginated for counts >50, with a unique `_iter=<n>-<timestamp>` param per loop iteration to defeat Next.js fetch dedup. Two-layer cache: `unstable_cache` shared across Vercel lambdas (10-min revalidate) + module-level fallback for HMR.
- **Amazon tag enforcement** — `withAmazonTag()` rewrites any `amazon.*` URL to include `?tag=fs08-21` (configurable via `AMAZON_ASSOCIATES_TAG`). Applied to Mongo and Sheet sources both.
- **Auth** — Supabase middleware with `PROTECTED_PREFIXES = ["/admin", "/api/admin"]`. Single-email allowlist (`mat@matsiems.com`). Public routes flow through to Next, so unknown URLs hit the custom `not-found.tsx` instead of redirecting to /login.

## Owned + pending

- ✅ v0.4.0 prod-ready (error boundaries, robots, sitemap, security headers, OG, per-route metadata, CTAs everywhere, dedicated source pages, /wikivoyage 100-item fix)
- 📋 Apply `0001_sites.sql` + `0002_wiki.sql` to Supabase (needs CLI re-login as mat@matsiems.com)
- 📋 Deploy v0.4.0 to scroller-psi (needs `vercel login` as mat-flexappdev)
- 📋 v0.5.0 — Playwright E2E, ESLint CLI migration, Vercel Analytics, Sentry
