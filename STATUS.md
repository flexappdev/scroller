# Scroller — Status

_Last updated: 2026-05-30 · v0.4.0_

## Latest

- **Repo**: [flexappdev/scroller](https://github.com/flexappdev/scroller) · port `19013` · accent `#10b981`
- **Local UAT**: http://localhost:19013/
- **Prod**:
  - `https://scroller-psi.vercel.app` — canonical (cleverfox-71aa03f5 scope, manual deploy)
  - `https://scroller-bay.vercel.app` — auto-deploys from GitHub via the matsiems Vercel scope
- **Version**: v0.4.0 — prod-ready Phase 6 + CTAs everywhere
- **Recent feature highlights** (most recent first):
  - **v0.4.0** — CTAs on every card kind (App "Open app"/"View on GitHub", Prompts "Try in Claude/ChatGPT", modal "Copy link"); empty-state CTAs; header tagline; footer GitHub+About links; About page rewrite; README + STATUS refresh; `.env.example`; `/scroller` duplicate dropped; user-added `/wiki` master index (Mongo + Supabase) + admin
  - **v0.3.0** — Error boundaries (error/global-error/not-found + admin + items), SEO surfaces (robots, sitemap, dynamic icon, dynamic OG image), security headers (HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options, Permissions-Policy), per-route metadata + `generateMetadata` on items, middleware semantics flipped to admin-only denylist
  - **v0.2.2** — Mongo Amazon (`AzDB.MAIN` + `AmazonDB.topSellers`, 10-min cache, `fs08-21` tag enforcement); wiki/wikivoyage batched 8-per-chunk parallelism + 10-min cache; full-width `/sites`; home page loader skeleton
  - **v0.2.1** — Home page parity with PageBrowser + kind dropdown; fresh-on-mount random seed; S3 images source with cursor pagination; "Sources" sidebar section; `/items/[id]` resolves all 8 kinds
  - **v0.2.0** — Unified view+sort, modal-first nav, `/items/[id]` generic detail route, Amazon source
  - **v0.1.0** — Sticky shell, source registry, wiki + wikivoyage sources, `/sites` merge

## Sources (9)

videos · github · prompts · apps · sites · wiki · wikivoyage · amazon · images

## Owed

1. **Apply Supabase migration** `supabase/migrations/0001_sites.sql` against project `tciqizkiseraumwdzxya` — unblocks the `/sites` Curated section (8 starter sites). Path: `supabase logout && supabase login` as mat@matsiems.com → `npx supabase db query --linked --file supabase/migrations/0001_sites.sql`. Or paste into Studio SQL Editor.
2. **Deploy v0.4.0 to scroller-psi** — `vercel logout && vercel login` as mat-flexappdev → `vercel deploy --prod`. Bay auto-deploys via GitHub webhook on the matsiems Vercel project.
3. **v0.5.0 backlog**: Playwright E2E (auth, modal flow, kind dropdown), ESLint CLI migration (Next.js 16 prep), Vercel Analytics, Sentry, next/image migration, loading skeletons on non-home pages.
