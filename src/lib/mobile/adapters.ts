import type { Card } from "@/components/ScrollerFeed";
import { cardItemId } from "@/components/ScrollerFeed";
import { imageFor, gradientFor } from "@/lib/scroll/card-images";

export type MobileSource = Card["kind"];

export interface MobileFeedItem {
  id: string;
  source: MobileSource;
  sourceLabel: string;
  title: string;
  description: string;
  image: string | null;
  fallback: string;
  accent: string;
  meta: string;
  externalUrl: string;
  externalLabel: string;
  internalHref: string;
}

export const MOBILE_SOURCE_LABELS: Record<MobileSource, string> = {
  video: "Videos", star: "GitHub", prompt: "Prompts", app: "Apps",
  site: "Sites", wiki: "Wikipedia", amazon: "Amazon", image: "Images",
};

export const MOBILE_SOURCE_ACCENTS: Record<MobileSource, string> = {
  video: "#ef4444", star: "#a78bfa", prompt: "#f59e0b", app: "#10b981",
  site: "#22c55e", wiki: "#38bdf8", amazon: "#ff9900", image: "#22d3ee",
};

function appUrl(card: Extract<Card, { kind: "app" }>): string {
  return card.subdomain ? `https://${card.subdomain}.${card.domain_name}` : `https://${card.domain_name}`;
}

export function toMobileFeedItem(card: Card): MobileFeedItem {
  const id = cardItemId(card);
  const base = {
    id, source: card.kind, sourceLabel: MOBILE_SOURCE_LABELS[card.kind],
    image: imageFor(card), fallback: gradientFor(id), accent: MOBILE_SOURCE_ACCENTS[card.kind],
    internalHref: `/items/${encodeURIComponent(id)}`,
  };

  switch (card.kind) {
    case "video": return { ...base, title: card.title, description: "A recent video from the Scroller channel feed.", meta: new Date(card.published).toLocaleDateString(), externalUrl: card.url, externalLabel: "Watch video" };
    case "star": return { ...base, title: card.full_name, description: card.description || "A starred open-source repository worth exploring.", meta: `${card.language || "Repository"} · ${card.stars.toLocaleString()} stars`, externalUrl: card.html_url, externalLabel: "Open GitHub" };
    case "prompt": return { ...base, title: card.act, description: card.prompt, meta: "AI prompt", externalUrl: `https://chatgpt.com/?q=${encodeURIComponent(card.prompt)}`, externalLabel: "Try prompt" };
    case "app": return { ...base, title: card.display_name, description: `${card.display_name} from the ${card.domain_name} app collection.`, accent: card.accent || base.accent, meta: `${card.domain_name} · ${card.subdomain}`, externalUrl: appUrl(card), externalLabel: "Open app" };
    case "site": return { ...base, title: card.title, description: card.description || "A curated website from the Scroller collection.", accent: card.accent || base.accent, meta: card.category, externalUrl: card.url, externalLabel: "Visit site" };
    case "wiki": return { ...base, sourceLabel: card.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia", title: card.title, description: card.extract, meta: `${Math.max(1, Math.ceil(card.extract.length / 800))} min read`, externalUrl: card.url, externalLabel: "Read article" };
    case "amazon": return { ...base, title: card.title, description: card.description || "A popular product from Amazon UK Best Sellers.", meta: [card.category, card.price, card.rating ? `${card.rating} ★` : null].filter(Boolean).join(" · "), externalUrl: card.url, externalLabel: "View product" };
    case "image": return { ...base, title: card.title, description: card.key, meta: `${Math.max(1, Math.round(card.size / 1024)).toLocaleString()} KB`, externalUrl: card.url, externalLabel: "Open image" };
  }
}

/** Round-robin sources so the mobile feed feels mixed from the first swipe. */
export function createMobileFeed(cards: Card[]): MobileFeedItem[] {
  const buckets = new Map<MobileSource, Card[]>();
  for (const card of cards) {
    const bucket = buckets.get(card.kind) || [];
    bucket.push(card);
    buckets.set(card.kind, bucket);
  }
  const sourceOrder = Object.keys(MOBILE_SOURCE_LABELS) as MobileSource[];
  const result: Card[] = [];
  let row = 0;
  let added = true;
  while (added) {
    added = false;
    for (const source of sourceOrder) {
      const card = buckets.get(source)?.[row];
      if (card) { result.push(card); added = true; }
    }
    row += 1;
  }
  return result.map(toMobileFeedItem);
}
