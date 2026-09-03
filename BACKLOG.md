# Scroller — BACKLOG

Living list of what's queued. Prune when items ship; move to `/version` page on release.

**Anchor doc:** [`docs/PRD-ALIGNMENT.md`](docs/PRD-ALIGNMENT.md) — how this
backlog maps to the ABC + VaultAI + MediaAI + ScrollerAI PRD v0.1 (2026-09-02).

**Working principle:** Scroller is the fleet's experience/distribution
plane. One engine, per-site config. Do not build a new Scroller per app.

## v4.0 — Foundation (blocks everything else)

Ship as one release. No new pixels — the current v3.5 UI stays; the
guts change so the next 100 apps can reuse them.

- [x] **Refresh `STATUS.md`** — v0.4.0 → v3.5. (2026-09-02, `b71dd4e`)
- [x] **Universal `ContentItem` type + adapter** — added in
      `src/lib/types.ts` alongside `AssetRef`, `MediaKind`,
      `ContentAudience`, `ContentSource`, `ContentStatus`, and
      `cardToContentItem()`. The 9-shape `Card` union in
      `ScrollerFeed.tsx` still ships v3.5 UI unchanged; fetchers migrate
      one at a time. (PRD §10, 2026-09-02)
- [x] **`SiteConfig` schema + first consumer** — `src/lib/site-config.ts`
      defines `SiteConfig` (brand, content, scroller mode, navigation).
      `sites/scroller.config.ts` = first instance. `src/lib/site.ts`
      resolves the active site via `SITE_ID` env or defaults to
      scroller. (PRD §13, 2026-09-02)
- [~] **Migrate fetchers to return `ContentItem`** — slice-2
      (2026-09-03): added `src/lib/vault.ts` façade
      `getContentItems({source, audience, limit})` covering 5 sources
      (video, wiki, wikivoyage, prompt, github). Wraps existing fetchers
      through `cardToContentItem()`. Enforces PRD §19 (rejects
      audience: "private"). Legacy `getVideos()` / `getWiki()` etc.
      still ship unchanged. Remaining sources: apps, sites, amazon,
      images, mediai. Then routes migrate one at a time to consume
      `getContentItems` instead of raw fetchers.
- [ ] **Extract `packages/scroller` shell** — move `AppShell`,
      `MediaAiFeed`, `ItemModal`, `StickyHeader`, `StickyFooter` out of
      `src/components/` into a package the next 100 apps consume.
      Requires npm workspaces setup. (PRD §17)
- [ ] **Wire `getSite()` into `AppShell`** — read `brand.accent` and
      `brand.name` from the resolved SiteConfig; drop the hard-coded pink
      and "Scroller" strings.

## v4.1 — Five-button nav (PRD §11 + §12)

Standardize on **Home · Explore · Create · Saved · Me**. Bottom nav on
mobile, left rail on desktop, same routes.

- [ ] `/explore` — source picker + filter chips (folds today's source
      dropdown into a real page). Absorbs the old "Filter chips overlay"
      and "Home search overlay" items.
- [ ] `/create` — context-aware CTA. Default label "Ask MediaAI".
      Each `site.config.ts` overrides (LawAI → "Ask LawAI", ArtAI →
      "Create collection", etc.).
- [ ] `/saved` — `localStorage`-backed bookmarks. Adds a "Save" action
      to every card. (Was v3.1 "Bookmarks / Saved".)
- [ ] `/me` — profile + settings + theme toggle. Move `ThemeToggle` out
      of the footer.
- [ ] **Bottom-nav component** — five-icon bar, active state, keyboard
      shortcuts (1–5).
- [ ] **Desktop left rail** — same five destinations, vertical, with
      contextual right panel for the active card. (PRD §12)

## v4.2 — VaultAI SDK boundary (PRD Phase 2 + §7 + §19)

Kill direct Mongo + S3 access from public app code. This is what makes
the public/private zone story enforceable rather than aspirational.

- [ ] **`packages/vault-sdk`** — `getAsset(id)`, `getItems(query)`.
      Requires an `audience: "public" | "shared"` param. `"private"`
      rejected outright when called from a public app.
- [ ] **Route `src/app/**` reads through the SDK** — remove direct
      Mongoose + S3 imports from `page.tsx` / `route.ts`. Fetchers
      become SDK consumers.
- [ ] **Fingerprint on ingest** — SHA256 + perceptual hash + size +
      dimensions + duration written to VaultAI at asset creation time.
      (PRD §8)

## v4.3 — Analytics event schema (PRD §20)

Emit the universal events so ABC can rank the fleet.

- [ ] **`packages/analytics`** — one helper, dual sink (Mongo
      `AIDB.scroller_events` + Vercel Analytics). Events:
      `app_open, item_view, item_complete, scroll_next, video_play,
      audio_play, save, share, search, ai_question, outbound_click,
      conversion`.
- [ ] **Sentry** — `@sentry/nextjs` scaffold once the DSN arrives.
      Client/server/edge configs, source-map upload token in Vercel envs.
      (Deferred since v2.5; still valid.)
- [ ] **Web Vitals → Mongo** — `useReportWebVitals` → `/api/vitals`.

## v4.4 — First non-Scroller consumer (PRD Phase 5)

Prove the platform by rebuilding **WikiAI** (existing wikai codebase,
big media corpus) as `Scroller Engine + wikai/site.config.ts + dataset
+ branding`. If this works, LawAI / ArtAI / CVAI / SpaceAI become
configuration exercises, not architectural experiments.

- [ ] Add `wikai/site.config.ts` in the scroller repo (or the wikai
      repo, TBD once `packages/scroller` is published).
- [ ] Point wikai's content collection at the shared VaultAI SDK.
- [ ] Ship one Vercel preview that runs wikai on the shared engine.

## v4.x polish (defer behind foundation)

Items surviving from the old v3.1 list — good, not blocking.

- [ ] **Deep-link a card** — `/?card=<id>` opens detail on load + scrolls
      the feed. (Powers share links.)
- [ ] **Copy-link + native share sheet** — two-tier: share sheet primary,
      copy-link fallback.
- [ ] **Swipe-left / swipe-right hint** — left = details, right = save.
- [ ] **Sticky header polish** — active-tab underline, breadcrumbs on
      non-home routes, per-source accent chip.
- [ ] **Sticky footer polish** — progress bar, keyboard-cheatsheet
      popover (↑ ↓ Space R), "Jump to top" chevron.
- [ ] **Playlist / queue mode** — pause after N, "watch next 10",
      autoplay motion clips.
- [ ] **Related rail in detail sheet** — "More like this" via
      topic-cluster or same domain.
- [ ] **PWA install + offline shell** — manifest + service-worker cache
      of last-N cards.
- [ ] **Card metadata footer** — dominant colour + provenance line,
      behind an "i" tap.
- [ ] **Per-source accent theming** — pull accent from `KIND_LABELS` /
      source registry so cards + header chip match.
- [ ] **A11y sweep** — `role=feed`, live-region for "Loading more…",
      focus ring restore on modal close, reduced-motion path.
- [ ] **Cheatsheet page** — `/keys` renders every keyboard binding.
- [ ] **RSS feed** — `/rss.xml` from MediaAI topics (mirrors wikai v1.13
      shorts feed pattern).
- [ ] **Sitemap for MediaAI topics** — expand `sitemap.ts` beyond static
      routes.
- [ ] **Prev/next skip smoothing** — IntersectionObserver instead of
      `scrollTop / clientHeight` maths.
- [ ] **`next/image` full sweep** — remaining `<img>` sites:
      `ScrollerFeed.tsx` (StarCard/PromptCard/AppCard/SiteCard),
      `ItemModal.tsx`, `SitesBrowser.tsx`, `HomeClient.tsx`, per-source
      Client components, `items/[id]`, `wiki/[id]`.

## Housekeeping

- [ ] Delete `public/diagrams/*.html` — superseded by inline-SVG panels
      in `src/components/admin/diagrams/`. Keep one release, then delete.
- [ ] Delete `MobileWikiScroll.tsx` — obsolete since v3.x ate the wikai
      skin. Retire after v4.0 lands.
- [ ] `npm audit fix` — 3 high-severity flags from `@playwright/test`.
- [ ] **Deploy to `scroller-psi` (cleverfox scope)** — deferred from
      v2.4; needs `vercel login` as mat-flexappdev.

## Held / re-scoped (do not re-add without a reason)

- ~~**Mobile port based on wikai v1.6**~~ — obsolete; v3.x already ate
  the wikai skin.
- ~~**Reactions in `AIDB.reactions`**~~ — reactions are content, so they
  belong in VaultAI, not a fresh Mongo collection. Revisit after v4.2.
- ~~**200 → 10K items**~~ — not a scroller task; belongs upstream in
  VaultAI ingest (PRD §8).
- ~~**Admin CMS extensions (scroller_prompts CRUD, featured pins)**~~ —
  hold until VaultAI SDK lands; admin consumes SDK, not Mongo direct.

## Done — v3.5 (2026-09-02)

- **v3.5** — Home polish: deep-link URL on open, IO-based active card,
  drop dead `AppNav`.
- **v3.4** — Header + full article + inline video + pink favicon.
- **v3.3** — Browse: all sources + sticky-chrome consistency + inline
  video playback.
- **v3.2** — Home: pink accent, article-rich detail sheet, folded nav,
  wrap-around scroll.
- **v3.1** — Groundwork: tap-to-details on home feed + ultimate-scroller
  backlog; MediaAI stabilised; wikai skin (dark tokens, 60px icon rail,
  ambient bg).
