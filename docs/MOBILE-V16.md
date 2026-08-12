# Scroller v2.6 — Mobile port based on wikai v1.6

> Scope for the follow-up session. v2.5 shipped `/diagrams`, light-mode default,
> Playwright + skeletons + Vercel Analytics; **the mobile experience below is
> the next session's work**, per the user's original v2.23 goal that flagged
> this bullet as "(seperate session wip)".

## What we're replacing

Today `MobileWikiScroll.tsx` (~830 lines) drives every mobile route via a
wiki-only snap feed. v2.5 already made that feed wikai-parity for the article
anatomy (v2.4 commit `7c7de5d`) — but the underlying navigation model is still
"one wiki article per card, source picker in TopBar." wikai v1.6 introduced a
richer shape we want to inherit.

## What wikai v1.6 gives us

Reference paths (all under `~/APPS/wikai/`):

- `app/page.tsx` (22 lines) — thin server shell that decides mobile vs desktop
  and hands to `<Feed>` or `<DesktopShell>`
- `components/Feed.tsx` (3049 lines) — the mobile snap feed with:
  - Vertical scroll-snap article cards
  - `Cover.tsx` (464 lines) — image + gradient + article overlay
  - `StructuredArticle.tsx` (281 lines) — expanded reader when a card is tapped
  - Bottom sheet interactions (Like / Read / Save / Share)
  - Points HUD + localStorage streaks
  - Category picker + topics panel + language picker (RTL-aware)
  - Pipeline panel for generation status
- `components/DesktopShell.tsx` (262 lines) — sibling desktop chrome

We want the shape of `Feed.tsx` + `Cover.tsx` + `StructuredArticle.tsx` — not
the wiki-specific data model.

## Port plan (v2.6)

1. **Copy the shell.** Bring `Feed.tsx`, `Cover.tsx`, `StructuredArticle.tsx`,
   `CategoryPicker.tsx`, `TopicsPanel.tsx` into `src/components/mobile/` and
   rename `Feed` → `MobileFeed` to avoid collision with the desktop scroller.
2. **Adapt the data layer.** wikai's `Feed` expects wiki summaries; scroller
   already has a heterogeneous `Card` union (in `src/components/ScrollerFeed.tsx`).
   Write a `toWikaiCard(card: Card): WikaiFeedItem` adapter in
   `src/lib/mobile/adapters.ts` — 8 kinds → single normalized shape.
3. **Route swap.** In `AppShell` (or a new `MobileShell`), detect UA + swap
   `MobileWikiScroll` for `<MobileFeed cards={cards} />`. Keep the current
   `MobileWikiScroll` behind `?legacy=1` for a rollback window.
4. **Language picker — skip.** Scroller has no i18n. Delete `LangPicker.tsx`
   from the port.
5. **Pipeline panel — repurpose.** wikai uses it for AI-generation status.
   Scroller can reuse it for `/api/wiki/scroll` prefetch progress if we want,
   or drop it entirely for v2.6.
6. **Reader (`StructuredArticle`).** Wire it to `/items/[id]` data (existing
   route). Card tap → reader open, no navigation.
7. **Points HUD.** wikai's points system uses `localStorage.wikai-points`.
   Rename to `scroller-points` and keep the same +1 seen / +2 like / +3 save
   scoring already documented in v2.4 release notes.
8. **Tests.** Add `e2e/mobile.spec.ts` — smoke test with the iPhone 14 Playwright
   device preset that hits `/`, expects `MobileFeed` root, expects a snap-scroll
   container.

## Risks + gotchas

- **`Feed.tsx` is 3049 lines** — resist the urge to refactor mid-port. Copy
  verbatim first, prove the shape, then split later.
- **Cover overlay in light mode.** wikai's overlay assumes a dark backdrop;
  scroller now defaults to light. The mobile feed is image-covered, so the
  card interior stays dark regardless — but the surrounding chrome (TopBar,
  bottom sheet) needs a light variant. The existing `[data-theme="light"]`
  attribute-selector overrides in `globals.css` should catch this; verify.
- **Bundle size.** Adding wikai's `Feed` will roughly double the mobile JS.
  Consider dynamic import: `const MobileFeed = dynamic(() => import(...), { ssr: false })`.

## Handoff signals

- Bundle target: keep mobile route JS under 200 kB gzipped
- Target device: iPhone 14 (Playwright preset)
- Version: bump to `v2.6.0`
- Rollback flag: `?legacy=1` on `/` should still serve `MobileWikiScroll`
- Delete `MobileWikiScroll.tsx` in v2.7 after two weeks of prod stability

## Cross-references

- v2.5 release notes: `/version` on prod
- `/diagrams` panel `MobileFeedAnatomy` — the current v2.4 shape (which is
  wikai-parity in look, not in structure)
- wikai memory: `project_wikai_v1_6_auth_swap.md` in
  `~/.claude/projects/-home-matsiems-APPS-appai/memory/`
