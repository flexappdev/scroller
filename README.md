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
| `amazon` | Amazon UK Best-Sellers | Static catalog of all 34 zgbs categories (`amazon-categories.ts`) + Mongo `AzDB.MAIN` + `AmazonDB.topSellers` (fallback: Google Sheet); `?tag=fs08-21` enforced via `withAmazonTag()` |
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
- **PageBrowser primitive** — every list page (and the home) wraps a list in `<PageBrowser>` which provides search, view toggle (scroller/list/grid), sort toggle (ranked/alpha/random), an optional kind filter, and optional load-more cursor. Per-page prefs persist in `localStorage`. Default view: scroller on mobile, grid on desktop. All pages — including `/wiki` — use this component so the view/sort controls are identical everywhere.
- **Desktop side-panel preview** — on lg+ screens (≥1024 px), clicking any card opens `<ItemModal>` as a fixed right side-panel (`w-[28rem]`) instead of a full overlay. `AppShell` listens for the `data-preview-open="1"` HTML attribute (set by `ItemModal`) via a `MutationObserver` and shifts `<main>` `marginRight` by 448 px so the grid and side panel coexist without overlap.
- **S3 image metadata** — `/images` detail cards show 15 fields: key, filename, extension, content-type, size, bytes, prefix, bucket, region, storage class, etag, last-modified, and public URL. The list-view loads from `ListObjectsV2` (lightweight); the `getImageByKey` resolver used by `/items/image:<key>` issues a `HeadObjectCommand` for accurate ContentType + ETag.
- **Modal-first nav** — clicking any card opens `<ItemModal>` with "View details" → `/items/[id]`, "Open external" (per-kind), per-kind extra actions ("Try in Claude/ChatGPT" on prompts, "Open app/View on GitHub" on apps), and a "Copy link" button.
- **Random sort** — uses a `Math.random()` seed per-mount so a refresh = new order. Clicking the Random toggle re-shuffles via a nonce bump.
- **Wiki fetcher** — uses the Action API's `generator=random` to pull 50 page summaries (title + extract + thumbnail + canonical URL) in a single request. Paginated for counts >50, with a unique `_iter=<n>-<timestamp>` param per loop iteration to defeat Next.js fetch dedup. Two-layer cache: `unstable_cache` shared across Vercel lambdas (10-min revalidate) + module-level fallback for HMR.
- **Wiki cache fallback** — `listWikiIndex` + `listWikiCategories` (in `src/lib/wiki/storage.ts`) read Supabase `scroller_wiki_index` first, and fall through to Mongo `AIDB.wiki` (collection name pinned via `WIKI_COLLECTION = "wiki"` — `WIKI_articles` can't be created on the free Atlas cluster, at 500-coll cap) whenever Supabase returns `PGRST205` (table missing) or an empty result set. The heavy payload (html, sections, media, infobox) lives in Mongo regardless; Supabase is purely the flat index. Three loaders feed it: `scripts/cache-wikipedia.mjs --per-host=N [--skip-wp|--skip-voy]` for random samples, `scripts/cache-wikivoyage-all.mjs --max=N --resume` for the per-title REST path, and the much faster `scripts/cache-wikivoyage-bulk.mjs [--max=N] [--start=<gapcontinue>]` which paginates `generator=allpages` + `prop=pageimages|info|description` (one Action API call per 50 titles, ~110/s, full corpus achievable; extracts/HTML backfilled later by the daily converter).
- **Screenshot pipeline** — `scripts/capture-screenshots.mjs` walks the fleet URL map, calls `thum.io/get/width/1280/wait/15/png/<url>`, and uploads to `s3://com27/scroller/screenshots/<id>.png`. `s3://com27/scroller/prompts/<slug>.png` is generated by `scripts/generate-prompt-images.mjs` (sharp + SVG gradient + act-name overlay — 100 PNGs in <30s, no model calls). Both prefixes are public-read via the `PublicReadScroller` bucket-policy statement.
- **Amazon tag enforcement** — `withAmazonTag()` rewrites any `amazon.*` URL to include `?tag=fs08-21` (configurable via `AMAZON_ASSOCIATES_TAG`). Applied to Mongo and Sheet sources both.
- **Auth** — Supabase middleware with `PROTECTED_PREFIXES = ["/admin", "/api/admin"]`. Single-email allowlist (`mat@matsiems.com`). Public routes flow through to Next, so unknown URLs hit the custom `not-found.tsx` instead of redirecting to /login.

## Owned + pending

- ✅ v0.6.0 — scroller app v2 (2026-06-10): desktop side-panel preview (lg+ opens right panel, grid keeps visible), full 15-field S3 image metadata (HeadObjectCommand for per-item detail), wiki page converted to PageBrowser (same scroller/list/grid views as all other pages), WikiVoyage 67,856-article bulk cache via `generator=allpages`. Two Cleverfox editorial HTML+SVG architecture diagrams embedded in `/about` (`public/diagrams/architecture.html` — data-flow, `public/diagrams/cache-flow.html` — cache & fallback). Runware FLUX OG hero image (`public/og-hero.png`, 1024×576). **100 AI-generated FLUX prompt heroes** live at `s3://com27/scroller/prompts/` — every `/prompts` card now shows an AI-illustrated image instead of an SVG gradient.
- ✅ v0.5.0 — scroller app v1 (2026-06-07): dedicated `/amazon`, `/wikivoyage`, `/images` routes; screenshot + prompt hero pipelines; global view-persistence; dual-channel YouTube; GitHub OG+avatar; Mongo wiki cache; com27 `PublicReadScroller`.
- ✅ v0.4.0 prod-ready (error boundaries, robots, sitemap, security headers, OG, per-route metadata)
- ✅ `supabase/migrations/0002_0003_wiki_combined.sql` applied (2026-06-10) — `scroller_wiki_index`, `scroller_wiki_log`, `scroller_wiki_seeds` (15 seeds) live on project `tciqizkiseraumwdzxya`. Wiki cron can now write to Supabase; Mongo remains the heavy-payload backing store.
- ✅ Wiki Supabase backfill (2026-06-10) — `scripts/backfill-wiki-supabase.mjs` projected **68,176 articles** from `AIDB.wiki` into `scroller_wiki_index` in 54s @ ~1,200 rows/s. PostgREST batch upsert with `on_conflict=pageid`. `--resume` flag skips already-indexed pageids.
- ✅ Seedance video loops (2026-06-10) — `scripts/generate-video-loops-runware.mjs` generated **10 ambient 5s 864×480 MP4 loops** (one per source) on `s3://com27/scroller/video-loops/`. Hard-pinned to `bytedance:2@2`. Async polling pattern (submit → poll `getResponse` until `status: "success"` → download).
- ✅ `<SourceHero>` component (`src/components/SourceHero.tsx`) — autoplaying muted video-loop hero banner with accent border + dark gradient overlay. Wired into 8 source pages: `/wiki`, `/wikivoyage`, `/amazon`, `/videos`, `/github`, `/prompts`, `/apps`, `/sites`, `/images`. Falls back to flat panel if the source has no loop.
- ✅ Third architecture diagram (`/about` — `public/diagrams/content-pipeline.html`): skill → script → S3 → render-target flow, accent on the two AI-generated paths.
- 📋 Deploy to scroller-psi (cleverfox-71aa03f5 scope — requires `vercel login` as mat-flexappdev).
- 📋 v0.7.0 — content enrichment: `/iad` hero images for prompts + wiki thumbnails, `/abc-diagrams` architecture diagrams, `/viadi` video; Playwright E2E; ESLint CLI migration.
