import type { ContentItem } from "../types/ContentItem";

const S3_PUBLIC_BASE = "https://com27.s3.eu-west-2.amazonaws.com";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export type LegacyScrollerCard =
  | { kind: "video"; id: string; title: string; url: string; thumbnail: string; published: string }
  | { kind: "star"; full_name: string; description: string | null; html_url: string; stars: number; language: string | null }
  | { kind: "prompt"; act: string; prompt: string }
  | { kind: "app"; id: string; display_name: string; domain_name: string; subdomain: string; accent: string }
  | { kind: "site"; id: string; title: string; description: string | null; url: string; accent: string | null; category: string }
  | { kind: "wiki"; id: string; title: string; extract: string; url: string; thumbnail: string | null; source: "wiki" | "wikivoyage" }
  | { kind: "amazon"; id: string; title: string; description: string | null; url: string; image: string | null; category: string; price: string | null; rating: string | null }
  | { kind: "image"; id: string; key: string; url: string; title: string; size: number };

export function fromScrollerCard(card: LegacyScrollerCard): ContentItem {
  switch (card.kind) {
    case "video":
      return {
        id: card.id,
        kind: "youtube",
        title: card.title,
        source: "youtube",
        href: card.url,
        createdAt: card.published,
        media: card.thumbnail ? [{ kind: "image", src: card.thumbnail, alt: card.title }] : undefined,
      };
    case "star":
      return {
        id: encodeURIComponent(card.full_name),
        kind: "github",
        title: card.full_name,
        body: card.description ?? undefined,
        source: "github",
        href: card.html_url,
        media: [{ kind: "image", src: `https://opengraph.githubassets.com/1/${card.full_name}`, alt: card.full_name }],
        meta: { stars: card.stars, language: card.language, full_name: card.full_name },
      };
    case "prompt":
      return {
        id: encodeURIComponent(card.act),
        kind: "prompt",
        title: card.act,
        body: card.prompt,
        source: "prompt",
        media: [{ kind: "image", src: `${S3_PUBLIC_BASE}/scroller/prompts/${slugify(card.act)}.png`, alt: card.act }],
        meta: { prompt: card.prompt, act: card.act },
      };
    case "app":
      return {
        id: card.id,
        kind: "app",
        title: card.display_name,
        source: "app",
        accent: card.accent,
        media: [{ kind: "image", src: `${S3_PUBLIC_BASE}/scroller/screenshots/${card.id}.png`, alt: card.display_name }],
        meta: { domain_name: card.domain_name, subdomain: card.subdomain },
      };
    case "site":
      return {
        id: card.id,
        kind: "site",
        title: card.title,
        body: card.description ?? undefined,
        source: "site",
        href: card.url,
        accent: card.accent ?? undefined,
        media: [{ kind: "image", src: `${S3_PUBLIC_BASE}/scroller/screenshots/${card.id}.png`, alt: card.title }],
        meta: { category: card.category },
      };
    case "wiki":
      return {
        id: card.id,
        kind: card.source === "wikivoyage" ? "wikivoyage" : "wiki",
        title: card.title,
        body: card.extract,
        source: card.source,
        href: card.url,
        media: card.thumbnail ? [{ kind: "image", src: card.thumbnail, alt: card.title }] : undefined,
      };
    case "amazon":
      return {
        id: card.id,
        kind: "amazon",
        title: card.title,
        body: card.description ?? undefined,
        source: "amazon",
        href: card.url,
        accent: "#ff9900",
        media: card.image ? [{ kind: "image", src: card.image, alt: card.title }] : undefined,
        meta: { category: card.category, price: card.price, rating: card.rating },
      };
    case "image":
      return {
        id: card.id,
        kind: "image",
        title: card.title,
        source: "image",
        href: card.url,
        accent: "#22d3ee",
        media: [{ kind: "image", src: card.url, alt: card.title }],
        meta: { key: card.key, size: card.size },
      };
  }
}

export function fromScrollerCards(cards: LegacyScrollerCard[]): ContentItem[] {
  return cards.map(fromScrollerCard);
}
