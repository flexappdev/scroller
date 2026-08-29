# Scroller — BACKLOG

Living list of what's queued after v2.5. Prune when items ship; move to
`/version` page on release.

## v3.1 — Ultimate home scroller (wikai parity)

Ship on top of the v3.0 wikai skin. `/` is now `MediaAiFeed` (immersive
swipe) with `StickyHeader` + `StickyFooter` from `AppShell` — the goal is
to make the home feed the best-in-class scroller across the fleet.

- [x] **Tap-to-details on home cards** — full-card tap zone + `Details`
      action opens `ItemModal` with image, media summary, article link,
      audio, motion clips, WIKAI read link. (`MediaAiFeed.tsx`, 2026-08-29)
- [ ] **Deep-link a card** — `/?card=<mediai-id>` opens the detail sheet
      on load and scrolls the feed to that card. Powers share links.
- [ ] **Copy-link + native share sheet** — replace the current
      `navigator.share`-with-clipboard-fallback with a two-tier: primary
      = share sheet, secondary = copy `/?card=<id>` link.
- [ ] **Swipe-left / swipe-right hint** — left = open details, right =
      save/bookmark. Reuse existing snap-y feed; horizontal swipe on a
      card should not scroll vertically.
- [ ] **Bookmarks / Saved** — `localStorage` list of saved MediaAI ids
      surfaced at `/saved` and a "Save" action on each card.
- [ ] **Sticky header polish (wikai parity)** — active-tab underline,
      breadcrumbs on non-home routes, per-source accent chip on left.
- [ ] **Sticky footer polish (wikai parity)** — progress bar for
      `activeIndex/total`, keyboard-cheatsheet popover (↑ ↓ Space R),
      "Jump to top" chevron on scroll.
- [ ] **Home search overlay** — `/` opens command-K sheet that searches
      MediaAI topics + all sources.
- [ ] **Filter chips overlay** — image-only, motion-only, audio-only
      toggles (mirrors `HomeClient` kindOptions on the immersive feed).
- [ ] **Playlist / queue mode** — pause after N cards, "watch next 10",
      autoplay through motion clips.
- [ ] **Related rail inside detail sheet** — "More like this" list of
      sibling MediaAI topics (topic-cluster or same domain).
- [ ] **Reactions** — 👍 / 🔥 / 🎯 tallies persisted in Mongo
      `AIDB.reactions` keyed by mediai id.
- [ ] **PWA install + offline shell** — manifest + service-worker cache
      of last-N cards for offline swiping.
- [ ] **Card metadata footer** — dominant colour + provenance line
      (`bucket/prefix/id`) toggled behind an "i" tap.
- [ ] **Per-source accent theming** — pull accent from
      `KIND_LABELS`/source registry so cards + header chip match.
- [ ] **A11y sweep** — swipe-feed `role=feed`, live-region for
      `Loading more MediaAI items`, focus ring restore on modal close,
      reduced-motion path.
- [ ] **Cheatsheet page** — `/keys` renders every keyboard binding
      (currently only ↑ ↓ PageUp PageDown documented in code).
- [ ] **RSS feed** — `/rss.xml` from MediaAI topics (mirrors wikai v1.13
      shorts feed pattern).
- [ ] **Sitemap for MediaAI topics** — expand `sitemap.ts` beyond the
      static routes to include one entry per MediaAI card.
- [ ] **Prev/next skip smoothing** — use IntersectionObserver instead of
      the current `scrollTop / clientHeight` maths so `activeIndex` stays
      accurate on rapid swipes.

## v2.6 — Mobile port + observability

- [ ] **Mobile port based on wikai v1.6** — full plan in `docs/MOBILE-V16.md`.
      Port `Feed.tsx` + `Cover.tsx` + `StructuredArticle.tsx` from
      `~/APPS/wikai/`, adapt to the heterogeneous `Card` union, keep
      `MobileWikiScroll` behind `?legacy=1`.
- [ ] **Sentry** — `@sentry/nextjs` scaffold. Deferred from v2.5 because the
      wizard is interactive and needs a DSN. Small envelope once the DSN is
      known — `sentry.client.config.ts`, `sentry.server.config.ts`,
      `sentry.edge.config.ts`, source-map upload token in Vercel envs.
- [ ] **`next/image` full sweep** — v2.5 converted `WikiCard` +
      `VideoCard` + `AmazonCard` + `ImageCard`. Remaining sites still on
      `<img>`:
      - `ScrollerFeed.tsx` — `StarCard`, `PromptCard`, `AppCard`, `SiteCard`
        (all four rely on the `onError → element.style.display = 'none'`
        pattern which needs a rewrite to use next/image's `onError` +
        state fallback)
      - `MobileWikiScroll.tsx` — ArticleCard cover (snap-scroll +
        `next/image fill` interaction, needs verification)
      - `ItemModal.tsx`, `SitesBrowser.tsx`, `HomeClient.tsx`, per-source
        Client components (`AppsClient`, `GithubClient`, `WikiClient`,
        `WikiVoyageClient`, `PromptsClient`, `AmazonClient`, `ImagesClient`,
        `VideosClient`), `items/[id]`, `wiki/[id]`
- [ ] **Sentry-adjacent** — Web Vitals reporting via `useReportWebVitals`
      → `/api/vitals` endpoint feeding Mongo.

## v2.7 — Item universe expansion

- [ ] **~200 → 10K items** — from `~/APPS/appai/BACKLOG.md`. Needs
      item-universe expansion + wiki + audio plumbing per the fleet 10K
      rollout project. Design at
      `~/APPS/appai/docs/FLEET-GENERATION.md`.
- [ ] **`/audio` source** — parallel to `/images`, `/prompts`, `/videos`.
      Backed by S3 `com27/scroller/audio/`. Kind: `audio` card in the
      `Card` union.
- [ ] **`/podcasts` source** — RSS aggregation.

## v2.8 — Editor + admin

- [ ] **Admin CMS** — `scroller_sites` CRUD is live; extend to
      `scroller_prompts` (currently CSV-sourced) so editors can pin
      curated prompts without a redeploy.
- [ ] **Featured pins** — surface a `featured` boolean on `scroller_sites`
      and float those cards to the top of `/`.

## Housekeeping

- [ ] Delete `public/diagrams/*.html` — the 3 iframe HTML files are now
      superseded by the inline-SVG panels in
      `src/components/admin/diagrams/`. Keep for one release, then delete.
- [ ] Delete `MobileWikiScroll.tsx` — retire two weeks after v2.6 mobile
      port stabilises.
- [ ] `next audit fix` — 3 high-severity vulnerabilities flagged by
      `npm install @playwright/test` in v2.5. Review + apply during v2.6.
- [ ] **Deploy to scroller-psi (cleverfox scope)** — deferred from v2.4;
      requires `vercel login` as mat-flexappdev.

## Done — v2.5 (2026-07-27)

Moved to `/version` page. Kept here as reference:

- Light mode default + `ThemeToggle` in footer
- `/diagrams` page (8 inline-SVG panels)
- `/about` architecture section rebuilt as a single link
- 9 route skeletons (`loading.tsx`)
- Playwright E2E scaffold + 7 smoke tests
- Vercel Analytics wired
- `WikiCard` + `VideoCard` + `AmazonCard` + `ImageCard` → `next/image`
- `remotePatterns` extended for `opengraph.githubassets.com` +
  `image.thum.io` + `raw.githubusercontent.com`
