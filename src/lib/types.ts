// Universal types for the ABC + VaultAI + Mediai + ScrollerAI platform.
// See docs/PRD-ALIGNMENT.md §10 (ContentItem) and §9 (AssetRef).
//
// v4.0 introduces ContentItem alongside the legacy per-source `Card` union in
// ScrollerFeed.tsx. Fetchers migrate one at a time via `cardToContentItem()`.

export interface AppConfig {
  id: string;
  monorepo: string;
  port: number;
}

// ---------- Asset layer (PRD §9) ------------------------------------------

export type MediaKind = "image" | "video" | "audio" | "document" | "gallery";

export interface AssetRef {
  id: string;
  type: MediaKind;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
}

// ---------- Universal content record (PRD §10) ----------------------------
// The canonical item lives in the shared engine (MSS-008). This app used to
// keep a parallel shape here; it now re-exports the engine contract so there
// is exactly one item type across Scroll, TV, metrics and money.

export type {
  ContentItem,
  ContentAudience,
  PublishState as ContentStatus,
} from "@fleet/scroller";
export { fromScrollerCard as cardToContentItem } from "@fleet/scroller";
