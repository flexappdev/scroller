/**
 * Universal card shape for the shared scroller feed.
 * Collapses the 9-shape Card union in ~/APPS/scroller/src/lib/scroller.ts.
 * PBI-S-2 in ~/.claude/plans/staus-of-all-apps-groovy-turing.md.
 */

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

export interface ContentItem {
  id: string;
  kind: ContentItemKind;
  title: string;
  body?: string;
  media?: ContentMedia[];
  source: string;
  href?: string;
  tags?: string[];
  createdAt?: string;
  accent?: string;
  affiliate?: AffiliateBlock;
  paywall?: PaywallBlock;
  ad?: AdBlock;
  meta?: Record<string, unknown>;
}
