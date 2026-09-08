"use client";

import { useState, useMemo } from "react";
import { Feed, fromScrollerCards } from "@fleet/scroller";
import ItemModal, { type ItemModalDetail, youtubeEmbedFrom } from "./ItemModal";
import { liveUrl, githubUrl } from "@/lib/scroll/fleet-urls";

export type Card =
  | { kind: "video"; id: string; title: string; url: string; thumbnail: string; published: string }
  | { kind: "star"; full_name: string; description: string | null; html_url: string; stars: number; language: string | null }
  | { kind: "prompt"; act: string; prompt: string }
  | { kind: "app"; id: string; display_name: string; domain_name: string; subdomain: string; accent: string }
  | { kind: "site"; id: string; title: string; description: string | null; url: string; accent: string | null; category: string }
  | { kind: "wiki"; id: string; title: string; extract: string; url: string; thumbnail: string | null; source: "wiki" | "wikivoyage" }
  | { kind: "amazon"; id: string; title: string; description: string | null; url: string; image: string | null; category: string; price: string | null; rating: string | null }
  | { kind: "image"; id: string; key: string; url: string; title: string; size: number };

export default function ScrollerFeed({ cards, embedded = false }: { cards: Card[]; embedded?: boolean }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);
  const items = useMemo(() => fromScrollerCards(cards), [cards]);

  return (
    <>
      <Feed
        items={items}
        embedded={embedded}
        onOpenItem={(_item, index) => setModal(toModalDetail(cards[index]))}
      />
      <ItemModal item={modal} onClose={() => setModal(null)} />
    </>
  );
}

export function cardItemId(card: Card): string {
  switch (card.kind) {
    case "video": return `video:${card.id}`;
    case "star": return `star:${encodeURIComponent(card.full_name)}`;
    case "prompt": return `prompt:${encodeURIComponent(card.act)}`;
    case "app": return `app:${card.id}`;
    case "site": return `site:${card.id}`;
    case "wiki": return `${card.source}:${card.id}`;
    case "amazon": return `amazon:${card.id}`;
    case "image": return `image:${card.id}`;
  }
}

export function toModalDetail(card: Card): ItemModalDetail {
  const id = cardItemId(card);
  switch (card.kind) {
    case "video": {
      const embedUrl = youtubeEmbedFrom(card.url);
      const isMp4 = /\.mp4($|\?)/i.test(card.url);
      const embed = embedUrl
        ? ({ kind: "youtube" as const, url: embedUrl })
        : isMp4
          ? ({ kind: "mp4" as const, url: card.url })
          : undefined;
      return { id, title: card.title, subtitle: "Video · YouTube", image: card.thumbnail, url: card.url, urlLabel: "Watch on YouTube", internalHref: `/items/${encodeURIComponent(id)}`, embed };
    }
    case "star":
      return { id, title: card.full_name, subtitle: `GitHub · ${card.language ?? "Repo"} · ★ ${card.stars.toLocaleString()}`, description: card.description, url: card.html_url, urlLabel: "Open on GitHub", internalHref: `/items/${encodeURIComponent(id)}` };
    case "prompt": {
      const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(card.prompt)}`;
      const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(card.prompt)}`;
      return {
        id,
        title: card.act,
        subtitle: "AI Prompt",
        description: card.prompt,
        url: claudeUrl,
        urlLabel: "Try in Claude",
        internalHref: `/items/${encodeURIComponent(id)}`,
        extraActions: [
          { href: chatGptUrl, label: "Try in ChatGPT", external: true },
        ],
      };
    }
    case "app": {
      const live = liveUrl(card.id);
      const gh = githubUrl(card.id);
      const isLive = !live.includes("github.com");
      return {
        id,
        title: card.display_name,
        subtitle: `${card.domain_name} · ${card.subdomain}`,
        description: `App id: ${card.id}`,
        accent: card.accent,
        url: isLive ? live : gh,
        urlLabel: isLive ? "Open app" : "View on GitHub",
        internalHref: `/items/${encodeURIComponent(id)}`,
        extraActions: isLive ? [{ href: gh, label: "View on GitHub", external: true }] : [],
      };
    }
    case "site":
      return { id, title: card.title, subtitle: `Site · ${card.category}`, description: card.description, url: card.url, urlLabel: "Visit site", accent: card.accent ?? undefined, internalHref: `/items/${encodeURIComponent(id)}` };
    case "wiki":
      return { id, title: card.title, subtitle: card.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia", description: card.extract, image: card.thumbnail, url: card.url, urlLabel: `Read on ${card.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia"}`, internalHref: `/items/${encodeURIComponent(id)}` };
    case "amazon":
      return { id, title: card.title, subtitle: `Amazon · ${card.category}${card.price ? ` · ${card.price}` : ""}`, description: card.description, image: card.image, url: card.url, urlLabel: "Buy on Amazon", accent: "#ff9900", internalHref: `/items/${encodeURIComponent(id)}` };
    case "image":
      return { id, title: card.title, subtitle: `Image · ${(card.size / 1024).toFixed(0)} KB`, image: card.url, url: card.url, urlLabel: "Open full size", accent: "#22d3ee", internalHref: `/items/${encodeURIComponent(id)}` };
  }
}
