# Scroller — UX

_Snapshot: v3.6.0 · 2026-09-11_

One feed. Every source. Mobile-first vertical swipe feed with a
universal navigation contract shared with future MS Core consumers.

---

## Chrome (persistent on every route)

### Sticky header (top, `h-14`)

Left → right:

| Element | Behavior |
|---|---|
| **Logo + wordmark** | Link `/`. On `/` a second click dispatches `scroller:random` + `router.refresh()` — shuffles the feed. |
| **Version chip** (`v3.6.0`) | Links to `/version` — dated release history, latest at top. |
| **Sort** dropdown | Random (default) · Ranked · A–Z. Writes `localStorage:scroller:sort` and dispatches `scroller:sort` (random also fires `scroller:random`). |
| **View** dropdown | Scroll (default) · Grid (tiny boxes) · Table (compact rows). Writes `localStorage:scroller:view` and dispatches `scroller:view`. |
| **Browse** | Opens `BrowseModal` — every source + topics. |
| **Assets** menu | Grouped nav — Watch (Mediai/All/Videos/Images), Knowledge (Wikipedia/WikiVoyage/Prompts/Apps), Sources (GitHub/Sites/Amazon/Funny), Stores (S3/Mongo/Mediai studio/Repo). |
| **Gen** menu (pink) | Publish destinations — Gorai, Siems Production, WIKAI, Mediai. |
| **About** | `/about`. |
| **Login** (icon) | `/login` — Google auth entry point. |

### Sticky footer (bottom, `h-[4.5rem]`)

Universal contract: **Home · Explore · Random · Saved · Me** (5 slots).

| Slot | Action |
|---|---|
| Home | `/`. On `/` dispatches `scroller:random`. |
| Explore | `/explore` — fleet stats page. |
| **Random** (dice icon, primary/floating) | Dispatches `scroller:random` on the current feed. |
| Saved | `/saved`. |
| Me | `/me`. |

---

## Pages

### `/` — Home (Mediai feed)

- Fullscreen vertical swipe (`snap-y snap-mandatory`) over MediaAI-topic
  bundles from `AIDB.media_baseline`.
- Card visuals: FLUX hero image + optional Ken Burns / LTX video loop +
  optional narration audio + gradient overlay + title + assets label.
- Card actions (right rail, top-pinned): **CardActions** (heart + bookmark).
- Card actions (right rail, bottom): Details · Listen (if audio) · Share ·
  **Article** (→ `/items/wiki:{assetId}/scroller`) · Books (Amazon search).
- Tap card → toggles `DetailSidebar` (right side-panel on desktop lg+,
  bottom-sheet on mobile). Second tap on same card closes it.
- `pushHistory` fires on open → surfaces in `/saved` History tab.
- Keyboard: ↑ / ↓ / PageUp / PageDown navigate; wrap-around at ends.
- Events consumed: `scroller:nav`, `scroller:random`, `scroller:position`.

### `/explore` — Fleet stats

- Grid of source cards — every `ScrollSource` except `all`.
- Per-card: total assets · description · by-type breakdown chips (Mediai
  splits into `image/video/audio`) · "Open feed" CTA.
- Grand total banner up top.
- Server-rendered (`revalidate = 300`), fault-tolerant (per-source
  `safe()` wrapper).

### `/browse` — Legacy unified browser

- All 9 sources merged into one `Card[]`, rendered via `HomeClient`
  (PageBrowser shell) with view+sort switchers already built-in.
- URL params: `?source=<id>` filters to one kind; `?view=desktop` forces
  desktop even on mobile UA; `?legacy=1` uses the old mobile shell.

### `/saved` — Keep pile

Two stacked systems (both localStorage, this device only):

1. **SavedPageClient** (existing) — cards you tapped Save on in the
   Mediai feed (`scroller:saved` key). Tap to reopen.
2. **SavedClient** (new) — Favorites / Likes / History tabs:
   - **Favorites** — items you toggled the bookmark on (`scroller.mobile.saved.v1`).
   - **Likes** — items you toggled the heart on (`scroller.mobile.liked.v1`).
   - **History** — last 500 items you opened (`scroller.history.v1`),
     newest first, with clear-history button.

### `/me` — Profile

- **MeStats** card: anonymous avatar · counts (Favorites / Likes / History)
  · points chip (`scroller-points` accumulator: +1 seen · +2 like · +3 save)
  · CTA button → `/saved`.
- **Scroller Live** link (`/live`) — private dashboard for scroller.tv +
  wikai.tv + mediai.tv (sign-in required, 307 for anon).
- **Appearance** — ThemeToggle (dark default).
- Universal-nav explainer footer.

### Source feeds (all render via `MediaiFeed`)

Every source page below is a fullscreen swipe feed with the same shape
as home — hero image, title, description, CardActions, sidebar-on-tap.

| Route | Source | Adapter | Cache |
|---|---|---|---|
| `/images` | S3 `com27` gallery | `cardToMediai({kind:"image"})` | `revalidate=0` |
| `/videos` | @MatSiems + @mat-siems-production YouTube RSS | `{kind:"video"}` | 600s |
| `/wiki` | Random Wikipedia (REST API) | `{kind:"wiki"}` | 600s |
| `/wikivoyage` | Random WikiVoyage (REST API) | `{kind:"wiki",source:"wikivoyage"}` | 600s |
| `/amazon` | Amazon Best-Sellers (zgbs, ASIN-tagged) | `{kind:"amazon"}` | 3600s |
| `/prompts` | f/awesome-chatgpt-prompts | `{kind:"prompt"}` | 3600s |
| `/apps` | Fleet apps registry | `{kind:"app"}` | force-dynamic |
| `/github` | @flexappdev stars | `{kind:"star"}` | 1800s |
| `/mediai-videos` | Mediai items with a video asset | filter `videoUrls.length>0` | 20s |
| `/mediai-audio` | Mediai items with an audio asset | filter `Boolean(audioUrl)` | 20s |

### `/sites` — Curated + fleet

- Fleet sites (from apps registry, `proptype === "site"`) + curated
  entries (Supabase `sites` table, status published) + every scroll
  source, rendered via bespoke `SitesBrowser` — this route intentionally
  stays out of MediaiFeed shape (it's navigation, not an asset feed).

### `/funny` — Editorial

- Top 100 funniest things ever (static data), unique layout.

### `/items/[id]` — Item detail (fullscreen hero)

- Server-rendered detail page for any prefixed id: `image:`, `amazon:`,
  `wiki:`, `wikivoyage:`, `video:`, `star:`, `prompt:`, `app:`, `site:`.
- Fullscreen hero image + Back button + `CardActions` overlay +
  accent-bordered content block (subtitle · title · description ·
  metadata `dl` · Open external · Open in scroller CTA).
- Resolves via `resolveDetail(id)` in `src/lib/item-detail.ts`.

### `/items/[id]/scroller` — Per-item scroller page

- Same visual language as home feed but with a single card — the
  destination for the sidebar's "Open Article" button.
- Back CTA links to `/items/[id]`.

### `/version` — Release history

- Static list of dated releases (latest at top). Linked from the header
  version chip.

### `/about` — About Scroller

- Product blurb + brand marks. Linked from header.

### `/login` — Sign in (Google)

- Auth entry. Google provider not yet wired end-to-end (Supabase provider
  enable pending — see BACKLOG).

### `/create` — Gen

- Publish/generation destinations (video/article/audio drafts). Kept
  accessible via header Gen menu (removed from footer).

### `/live` — Private dashboard

- Live health, stats and tasks for scroller.tv / wikai.tv / mediai.tv.
  Sign-in required (returns 307 for anon).

### Admin

- `/admin/s3` — com27 buckets + prefixes.
- `/admin/mongo` — Mediai AIDB.media_baseline records.
- `/admin/sites` — CMS for the `sites` table.

---

## `DetailSidebar` (feed sidebar)

Right side-panel (desktop `lg+`) or bottom sheet (mobile). Opens on
card tap, closes on second tap / Escape / close button.

All accordions **closed by default** — the seven section headers are
visible without scrolling:

| Section | Content |
|---|---|
| **Article** | Description + word count chip · buttons: Open Article (→ per-item scroller page) · Item page (→ `/items/[id]`) · Open source (external). |
| **Images** | Preview + Open full size. Disabled when none. |
| **Video** | Inline YouTube embed or MP4 player + external link. Disabled when none. |
| **Audio** | Placeholder (no audio in `ItemModalDetail` yet). |
| **Metadata** | ID · Kind · Host · Source URL · Local href · Accent swatch · Word count. |
| **Share** | Native Share · Copy link · Copy title · Open source. |
| **Actions** | Inline heart + bookmark (`CardActions`) with hint copy. |

---

## Local persistence keys

| Key | Written by | Consumed by |
|---|---|---|
| `scroller.mobile.liked.v1` | `useLikesSaves.toggleLike` | Heart button, `/saved` Likes tab |
| `scroller.mobile.saved.v1` | `useLikesSaves.toggleSave` | Bookmark button, `/saved` Favorites tab |
| `scroller.history.v1` | `pushHistory` (on card open) | `/saved` History tab |
| `scroller-points` | Home + mobile feed on view/like/save | `/me` points chip |
| `scroller:sort` | Header Sort menu | (future) MediaiFeed sort listener |
| `scroller:view` | Header View menu | (future) MediaiFeed view switcher |
| `scroller:saved` | Home feed toggleSave rail | `SavedPageClient` |

Cross-tab sync: `scroller:likes-saves-change` custom event + `storage`
window event.

---

## Custom events

| Event | Emitter | Listener |
|---|---|---|
| `scroller:random` | Header logo (on `/`), footer Random, Sort=Random | MediaiFeed shuffles |
| `scroller:nav` (`{direction:"prev"\|"next"}`) | (external nav components) | MediaiFeed navigates |
| `scroller:position` (`{index,total}`) | MediaiFeed on active-card change | (progress chrome) |
| `scroller:sort` (`SortKey`) | Header Sort menu | *(TODO — feed listener)* |
| `scroller:view` (`ViewKey`) | Header View menu | *(TODO — feed listener)* |
| `scroller:likes-saves-change` | `useLikesSaves` writes | `SavedClient` / `MeStats` re-hydrate |
| `scroller:saved-changed` | Home feed toggleSave | `SavedPageClient` |

---

## Workflows

### 1. Discover → keep

1. Land on `/` → MediaiFeed autoplays.
2. Tap heart or bookmark → persists to `useLikesSaves`.
3. Tap footer Saved → see Favorites / Likes / History.

### 2. Deep-read

1. Tap card → `DetailSidebar` opens.
2. Expand **Article** accordion → tap **Open Article** →
   `/items/wiki:{assetId}/scroller` (fullscreen single-item page).
3. Or **Item page** → `/items/[id]` (fullscreen hero + metadata `dl`).
4. External source only when the user asks (**Open source** in Share
   or Article buttons).

### 3. Explore the fleet

1. Tap footer Explore → `/explore` grid of all sources with asset
   counts and by-type chips.
2. Tap any card → that source's feed (Mediai-shaped, fullscreen).
3. Or use header Browse (modal) or Assets menu.

### 4. Reshuffle

- Tap logo (when on `/`) → shuffle current feed.
- Tap footer Random dice → shuffle current feed.
- Header Sort → Random → shuffle current feed.
- Any of the above dispatches `scroller:random`.

### 5. Sign in

- Header Login icon → `/login`. Google OAuth wiring pending (needs
  Supabase Google provider enable via `/abc-google` + `/abc-supabase`).

---

## Not yet wired

- `scroller:sort` and `scroller:view` events land, but `MediaiFeed`
  doesn't listen yet — View toggle currently no-ops on the fullscreen
  swipe view.
- `/login` currently a stub — Google OAuth end-to-end pending.
- Header **Assets** menu doesn't yet show per-category total asset counts.
- Grid view (`view=grid`) and Table view (`view=table`) alternate
  renderers for MediaiFeed not yet built.

See `BACKLOG.md` for the queue.
