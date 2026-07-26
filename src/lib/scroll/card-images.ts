// Single image resolver for every scroller card kind. Prior to v2.3 only
// video/amazon/wiki/image rendered a hero; star/prompt/app/site fell back
// to plain text tiles. This module maps every kind to a best-effort image
// URL so the feed feels visual across all sources.
//
// Sources (per README v0.5.0 / v0.6.0):
//   - scroller/screenshots/<id>.png — apps + curated sites (thum.io pipeline)
//   - scroller/prompts/<slug>.png   — 100 FLUX prompt heroes
//   - opengraph.githubassets.com    — GitHub's public OG-hero endpoint for repos
//
// Anything that resolves to a 404 (missing prompt hero, no wiki thumb, empty
// amazon image) is handled by the consumer via <img onError> falling back
// to a gradient — see HomeTile / ArticleCard.

import type { Card } from "@/components/ScrollerFeed";

export const S3_PUBLIC_BASE = "https://com27.s3.eu-west-2.amazonaws.com";

export function slugifyAct(act: string): string {
  return act.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function imageFor(card: Card): string | null {
  switch (card.kind) {
    case "video":
      return card.thumbnail || null;
    case "star":
      // GitHub's public OG endpoint renders a 1280×640 repo card. No auth needed.
      return `https://opengraph.githubassets.com/1/${card.full_name}`;
    case "prompt":
      return `${S3_PUBLIC_BASE}/scroller/prompts/${slugifyAct(card.act)}.png`;
    case "app":
      return `${S3_PUBLIC_BASE}/scroller/screenshots/${card.id}.png`;
    case "site":
      return `${S3_PUBLIC_BASE}/scroller/screenshots/${card.id}.png`;
    case "wiki":
      return card.thumbnail || null;
    case "amazon":
      return card.image || null;
    case "image":
      return card.url;
  }
}

// Deterministic gradient fallback keyed off card identity. Same seed → same
// gradient across renders so the placeholder feels stable.
const GRADIENTS = [
  "linear-gradient(135deg,#0f766e 0%,#0f172a 100%)",
  "linear-gradient(135deg,#1e40af 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#7c2d12 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#701a75 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#065f46 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#3730a3 0%,#0a0a0a 100%)",
];

export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}
