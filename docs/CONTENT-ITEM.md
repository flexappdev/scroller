# Canonical content item (`msscroll.item/v1`)

MSS-008. One item contract for scroller.tv, wikai.tv and mediai.tv, across Scroll, TV, Latest/Top, analytics and monetisation.

- Type: `ContentItem` in `packages/scroller/src/types/ContentItem.ts`, exported from `@fleet/scroller`.
- Version: `CONTENT_ITEM_SCHEMA = "msscroll.item/v1"`.
- Helpers: `validateContentItem(item)` returns a list of violations; `isEligible(item, channelId)` gates public rendering.
- `src/lib/types.ts` re-exports the engine type, so the app no longer keeps a second item shape.

## Freeze rules

- v1 changes are additive: new fields must be optional.
- Renaming, removing or making a field required is a v2 and needs a migration note here.
- `id` is stable across modes and channels. Switching Scroll ↔ TV never re-keys an item.
- Binaries are referenced (`media[].src`, `media[].assetId`), never copied into the item.

## Fields

| Field | Required | Purpose |
|---|---|---|
| `id` | yes | Stable item id (spec §7 `item_id`) |
| `kind` | yes | Card renderer (`wiki`, `youtube`, `image`, …) |
| `title` | yes | Display title |
| `source` | yes | Adapter/feed the item came from |
| `slug`, `tagline`, `body`, `article` | no | Slug, one-liner, card description, Markdown article |
| `media[]` | no | Image/video/audio refs; `assetId` points at a MediaAI/VaultAI asset |
| `href`, `tags` | no | Outbound link, tags |
| `ranks[]` | no | List membership: `{ list, position, period }` (Top 100 → 10 → 1) |
| `code` | no | `{ repo, demoUrl }` |
| `provenance` | no | `{ sourceUrl, licence, attribution, vaultId }` |
| `createdAt`, `refreshedAt`, `publishedAt` | no | ISO timestamps |
| `quality` | no | `raw` · `checked` · `approved` · `rejected` |
| `publish` | no | `draft` · `review` · `published` · `archived` |
| `audience` | no | `public` (default) · `shared` · `private`; public channels never render `private` |
| `channels[]` | no | Eligible `SiteConfig.id`s; absent means every channel |
| `affiliate`, `paywall`, `ad` | no | Monetisation metadata |
| `refs` | no | Graph joins: `topicId`, `scheduleSlots`, `analyticsId`, `revenueId`, `costId` |
| `meta` | no | Adapter-specific extras; nothing the shell depends on |

## Adapter mapping

| Source shape | `id` | `kind` | Key mappings |
|---|---|---|---|
| scroller legacy `Card` | card id | per card | `fromScrollerCard` (done) |
| wikai `WikiArticle` (MSS-014) | `id` | `wiki` | `extract`→`body`, `image`/`video`→`media`, `rank`+`sourcePath`→`ranks`, `url`→`provenance.sourceUrl`, licence `CC BY-SA 4.0`, `lang`→`meta.lang` |
| mediai `MediaAiAsset` / `data.json` item (MSS-015) | `id` | `image` or video kind | `topic`→`title` and `refs.topicId`, `url`→`media[0].src`, `id`→`media[0].assetId`, `ts`/`updatedAt`→`refreshedAt` |

Next step (MSS-010): GA4 events (`item_view`, `affiliate_click`, `ad_slot_view`) should carry `item.id` alongside the channel id so metrics and revenue join on the same key. Today `item_view` sends index and title only.
