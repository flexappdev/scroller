// VaultAI SDK — nascent stub. See docs/PRD-ALIGNMENT.md §7 (VaultAI
// storage abstraction) and §19 (public Scroller must never touch PRIVATE).
//
// Slice-2: a single façade `getContentItems({source, audience, limit})`
// that delegates to the existing per-source fetchers and returns the
// unified `ContentItem[]` shape via `cardToContentItem`.
//
// Zero breaking changes — the legacy `getVideos()` / `getWiki()` etc.
// still work; this layer is opt-in for callers that want ContentItem.
//
// Next slice will move the ingest path (SHA256 + perceptual hash) here
// and start rejecting direct Mongo/S3 reads from public app code.

import {
  cardToContentItem,
  type ContentAudience,
  type ContentItem,
} from "./types";
import { getVideos, getStars, getPrompts, getWiki, getWikiVoyage } from "./fetchers";

export type VaultSource = "video" | "wiki" | "wikivoyage" | "prompt" | "github";

export interface VaultQuery {
  source: VaultSource;
  audience?: ContentAudience;
  limit?: number;
}

export interface VaultResult {
  items: ContentItem[];
  source: VaultSource;
  audience: ContentAudience;
  total: number;
}

// PRD §19 — public app code must never request PRIVATE. Enforce here
// rather than in every fetcher.
function assertAudience(audience: ContentAudience): asserts audience is "public" | "shared" {
  if (audience === "private") {
    throw new Error("[vault] public Scroller may not request PRIVATE assets (PRD §19)");
  }
}

export async function getContentItems(query: VaultQuery): Promise<VaultResult> {
  const audience: ContentAudience = query.audience ?? "public";
  assertAudience(audience);

  const items = await loadItems(query.source, query.limit ?? 100);
  return {
    items,
    source: query.source,
    audience,
    total: items.length,
  };
}

async function loadItems(source: VaultSource, limit: number): Promise<ContentItem[]> {
  switch (source) {
    case "video": {
      const { videos } = await getVideos();
      return videos.slice(0, limit).map((v) =>
        cardToContentItem({ kind: "video", ...v }),
      );
    }
    case "github": {
      const { stars } = await getStars();
      return stars.slice(0, limit).map((s) =>
        cardToContentItem({
          kind: "star",
          full_name: s.full_name,
          description: s.description,
          html_url: s.html_url,
          stars: s.stargazers_count,
          language: s.language,
        }),
      );
    }
    case "prompt": {
      const { prompts } = await getPrompts();
      return prompts.slice(0, limit).map((p) =>
        cardToContentItem({ kind: "prompt", ...p }),
      );
    }
    case "wiki": {
      const { items } = await getWiki(limit);
      return items.map((w) =>
        cardToContentItem({ kind: "wiki", ...w }),
      );
    }
    case "wikivoyage": {
      const { items } = await getWikiVoyage(limit);
      return items.map((w) =>
        cardToContentItem({ kind: "wiki", ...w }),
      );
    }
  }
}
