/**
 * Canonical content item for every MS Scroll channel (scroller.tv, wikai.tv,
 * mediai.tv). One contract across Scroll, TV, metrics and money.
 * MSS-008 in docs/MS-SCROLL-BACKLOG.md; field guide in docs/CONTENT-ITEM.md.
 *
 * Frozen at v1: add optional fields only. Renaming or removing a field, or
 * making one required, means a new CONTENT_ITEM_SCHEMA version.
 */

export const CONTENT_ITEM_SCHEMA = "msscroll.item/v1" as const;

export type ContentItemKind =
  | "wiki"
  | "wikivoyage"
  | "youtube"
  | "github"
  | "prompt"
  | "amazon"
  | "image"
  | "site"
  | "app"
  | "book"
  | "place"
  | "list";

export interface ContentMedia {
  kind: "image" | "video" | "audio" | "youtube";
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  poster?: string;
  /** MediaAI / VaultAI asset id when the binary lives in an asset bundle. */
  assetId?: string;
  duration?: number;
}

export interface AffiliateBlock {
  provider: "amazon" | "bookshop" | "audible" | "booking" | "skimlinks";
  tag: string;
  href: string;
  label?: string;
}

export interface PaywallBlock {
  tier: "free" | "premium";
  stripePriceId?: string;
  cta?: string;
}

export interface AdBlock {
  slot: string;
  provider: "adsense" | "ezoic" | "mediavine";
}

export type ContentAudience = "public" | "shared" | "private";
export type PublishState = "draft" | "review" | "published" | "archived";
export type QualityState = "raw" | "checked" | "approved" | "rejected";
export type RankPeriod = "day" | "week" | "month" | "year" | "all-time";

/** Where the item came from and what we owe the source. */
export interface Provenance {
  sourceUrl?: string;
  licence?: string;
  attribution?: string;
  /** VaultAI KBIT id, when the item is mirrored in the vault. */
  vaultId?: string;
}

/** Membership of a ranked list, e.g. Top 100 of the week. */
export interface RankEntry {
  list: string;
  position: number;
  period?: RankPeriod;
}

/** Joins to the rest of the graph by id; nothing is duplicated here. */
export interface ItemRefs {
  topicId?: string;
  scheduleSlots?: string[];
  analyticsId?: string;
  revenueId?: string;
  costId?: string;
}

export interface ContentItem {
  /** Stable across modes (Scroll, TV, Latest, Top) and channels. */
  id: string;
  kind: ContentItemKind;
  title: string;
  slug?: string;
  tagline?: string;
  /** Short description shown on the card. */
  body?: string;
  /** Long-form article/context in Markdown. */
  article?: string;
  media?: ContentMedia[];
  /** Adapter or feed the item was read from, e.g. "wiki", "mediai". */
  source: string;
  href?: string;
  tags?: string[];
  ranks?: RankEntry[];
  code?: { repo?: string; demoUrl?: string };
  provenance?: Provenance;
  createdAt?: string;
  refreshedAt?: string;
  publishedAt?: string;
  quality?: QualityState;
  publish?: PublishState;
  /** Defaults to "public". Public channels must never render "private". */
  audience?: ContentAudience;
  /** Channel ids (SiteConfig.id) the item may appear on; absent means all. */
  channels?: string[];
  accent?: string;
  affiliate?: AffiliateBlock;
  paywall?: PaywallBlock;
  ad?: AdBlock;
  refs?: ItemRefs;
  meta?: Record<string, unknown>;
}

/** True when the item may be shown on the given public channel. */
export function isEligible(item: ContentItem, channelId: string): boolean {
  if ((item.audience ?? "public") === "private") return false;
  if (item.publish && item.publish !== "published") return false;
  if (item.quality === "rejected") return false;
  return !item.channels || item.channels.includes(channelId);
}

/** Returns contract violations; an empty array means the item is valid. */
export function validateContentItem(item: unknown): string[] {
  const errors: string[] = [];
  if (!item || typeof item !== "object") return ["item must be an object"];
  const it = item as Record<string, unknown>;
  for (const key of ["id", "kind", "title", "source"]) {
    if (typeof it[key] !== "string" || (it[key] as string).trim() === "") {
      errors.push(`${key} must be a non-empty string`);
    }
  }
  if (it.media !== undefined) {
    if (!Array.isArray(it.media)) errors.push("media must be an array");
    else it.media.forEach((m, i) => {
      if (!m || typeof m.src !== "string" || m.src === "") errors.push(`media[${i}].src must be a non-empty string`);
    });
  }
  if (it.ranks !== undefined) {
    if (!Array.isArray(it.ranks)) errors.push("ranks must be an array");
    else it.ranks.forEach((r, i) => {
      if (!r || typeof r.list !== "string" || !Number.isInteger(r.position) || r.position < 1) {
        errors.push(`ranks[${i}] needs a list and a position of 1 or more`);
      }
    });
  }
  for (const key of ["createdAt", "refreshedAt", "publishedAt"]) {
    const v = it[key];
    if (v !== undefined && (typeof v !== "string" || Number.isNaN(Date.parse(v)))) {
      errors.push(`${key} must be an ISO date string`);
    }
  }
  return errors;
}
