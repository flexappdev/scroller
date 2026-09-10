import type { MediaiArticle } from "@/lib/mediai";
import type { Card } from "@/components/ScrollerFeed";

const PLACEHOLDER = "https://placehold.co/1200x1600/0a0a0a/ec4899?text=Scroller";

export function cardToMediai(card: Card): MediaiArticle {
  const now = Date.now() / 1000;
  const base = {
    videoUrls: [] as string[],
    audioUrl: null,
    updatedAt: now,
    assetCount: 1,
  };

  switch (card.kind) {
    case "video":
      return {
        ...base,
        id: `video:${card.id}`,
        assetId: card.id,
        topic: card.title,
        imageUrl: card.thumbnail || null,
        videoUrls: [],
        sourceUrl: card.url,
      };
    case "image":
      return {
        ...base,
        id: `image:${encodeURIComponent(card.key)}`,
        assetId: card.id,
        topic: card.title,
        imageUrl: card.url,
        sourceUrl: card.url,
      };
    case "wiki":
      return {
        ...base,
        id: `${card.source === "wikivoyage" ? "wikivoyage" : "wiki"}:${card.id}`,
        assetId: String(card.id),
        topic: card.title,
        imageUrl: card.thumbnail ?? PLACEHOLDER,
        sourceUrl: card.url,
      };
    case "amazon":
      return {
        ...base,
        id: `amazon:${card.id}`,
        assetId: card.id,
        topic: card.title,
        imageUrl: card.image ?? PLACEHOLDER,
        sourceUrl: card.url,
      };
    case "prompt":
      return {
        ...base,
        id: `prompt:${encodeURIComponent(card.act)}`,
        assetId: card.act,
        topic: card.act,
        imageUrl: PLACEHOLDER,
        sourceUrl: "#",
      };
    case "app":
      return {
        ...base,
        id: `app:${card.id}`,
        assetId: card.id,
        topic: card.display_name,
        imageUrl: PLACEHOLDER,
        sourceUrl: `https://${card.subdomain}.${card.domain_name}`,
      };
    case "site":
      return {
        ...base,
        id: `site:${card.id}`,
        assetId: card.id,
        topic: card.title,
        imageUrl: PLACEHOLDER,
        sourceUrl: card.url,
      };
    case "star":
      return {
        ...base,
        id: `star:${encodeURIComponent(card.full_name)}`,
        assetId: card.full_name,
        topic: card.full_name,
        imageUrl: `https://opengraph.githubassets.com/scroller/${card.full_name}`,
        sourceUrl: card.html_url,
      };
    default:
      return {
        ...base,
        id: "unknown",
        assetId: "unknown",
        topic: "Untitled",
        imageUrl: PLACEHOLDER,
        sourceUrl: "#",
      };
  }
}
