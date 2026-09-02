// Universal types for the ABC + VaultAI + MediaAI + ScrollerAI platform.
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

export type ContentAudience = "public" | "shared" | "private";

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

export type ContentStatus = "draft" | "review" | "published" | "archived";

export interface ContentSource {
  kind: string;
  id?: string;
  url?: string;
  label?: string;
}

export interface ContentItem {
  id: string;
  rank?: number;
  title: string;
  slug?: string;
  summary?: string;
  markdown?: string;
  topic?: string;
  tags?: string[];

  imageAsset?: AssetRef;
  videoAsset?: AssetRef;
  audioAsset?: AssetRef;
  galleryAssets?: AssetRef[];

  sources?: ContentSource[];
  apps?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

  status?: ContentStatus;
  audience?: ContentAudience;
  score?: number;
  metadata?: Record<string, unknown>;
}

// ---------- Legacy Card → ContentItem adapter -----------------------------
// Import the Card union locally to avoid a circular type import at module
// evaluation time.

type LegacyCard =
  | { kind: "video"; id: string; title: string; url: string; thumbnail: string; published: string }
  | { kind: "star"; full_name: string; description: string | null; html_url: string; stars: number; language: string | null }
  | { kind: "prompt"; act: string; prompt: string }
  | { kind: "app"; id: string; display_name: string; domain_name: string; subdomain: string; accent: string }
  | { kind: "site"; id: string; title: string; description: string | null; url: string; accent: string | null; category: string }
  | { kind: "wiki"; id: string; title: string; extract: string; url: string; thumbnail: string | null; source: "wiki" | "wikivoyage" }
  | { kind: "amazon"; id: string; title: string; description: string | null; url: string; image: string | null; category: string; price: string | null; rating: string | null }
  | { kind: "image"; id: string; key: string; url: string; title: string; size: number };

export function cardToContentItem(card: LegacyCard): ContentItem {
  const base = {
    audience: "public" as const,
    sources: [{ kind: card.kind }] as ContentSource[],
  };
  switch (card.kind) {
    case "video":
      return {
        ...base,
        id: card.id,
        title: card.title,
        publishedAt: card.published,
        videoAsset: { id: card.id, type: "video", url: card.url },
        imageAsset: card.thumbnail ? { id: `${card.id}-thumb`, type: "image", url: card.thumbnail } : undefined,
      };
    case "star":
      return {
        ...base,
        id: card.full_name,
        title: card.full_name,
        summary: card.description ?? undefined,
        sources: [{ kind: "github", url: card.html_url }],
        metadata: { stars: card.stars, language: card.language },
      };
    case "prompt":
      return {
        ...base,
        id: card.act,
        title: card.act,
        markdown: card.prompt,
      };
    case "app":
      return {
        ...base,
        id: card.id,
        title: card.display_name,
        sources: [{ kind: "app", url: `https://${card.domain_name}`, label: card.subdomain }],
        metadata: { accent: card.accent, domain: card.domain_name },
      };
    case "site":
      return {
        ...base,
        id: card.id,
        title: card.title,
        summary: card.description ?? undefined,
        topic: card.category,
        sources: [{ kind: "site", url: card.url }],
        metadata: { accent: card.accent ?? undefined },
      };
    case "wiki":
      return {
        ...base,
        id: card.id,
        title: card.title,
        summary: card.extract,
        sources: [{ kind: card.source, url: card.url }],
        imageAsset: card.thumbnail ? { id: `${card.id}-thumb`, type: "image", url: card.thumbnail } : undefined,
      };
    case "amazon":
      return {
        ...base,
        id: card.id,
        title: card.title,
        summary: card.description ?? undefined,
        topic: card.category,
        sources: [{ kind: "amazon", url: card.url }],
        imageAsset: card.image ? { id: `${card.id}-img`, type: "image", url: card.image } : undefined,
        metadata: { price: card.price, rating: card.rating },
      };
    case "image":
      return {
        ...base,
        id: card.id,
        title: card.title,
        imageAsset: { id: card.id, type: "image", url: card.url },
        metadata: { s3Key: card.key, size: card.size },
      };
  }
}
