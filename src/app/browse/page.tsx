import { headers } from "next/headers";
import { getApps, getPrompts, getStars, getVideos, getWiki, getWikiVoyage } from "@/lib/fetchers";
import { DOMAINS } from "@/lib/taxonomy";
import { listSites } from "@/lib/cms/sites";
import { getAmazonItems } from "@/lib/scroll/amazon";
import { getImageItems } from "@/lib/scroll/images";
import { getMediaAiPage } from "@/lib/mediai";
import { funnyThings } from "@/lib/funny";
import HomeClient from "../HomeClient";
import type { Card } from "@/components/ScrollerFeed";

export const revalidate = 300;

const SOURCE_TIMEOUT_MS = 8_000;

function warn(label: string, err: unknown): void {
  console.warn(`[browse] ${label} failed, using fallback:`, err instanceof Error ? err.message : err);
}

async function sourceOrFallback<T>(label: string, load: () => Promise<T>, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      load(),
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`timed out after ${SOURCE_TIMEOUT_MS}ms`)), SOURCE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    warn(label, error);
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function isMobileUA(ua: string | null): boolean {
  if (!ua) return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ source?: string; view?: string; legacy?: string }> }) {
  const { source: sourceParam, view: viewParam, legacy: legacyParam } = await searchParams;

  const sourceToKind: Record<string, string> = {
    videos: "video",
    github: "star",
    prompts: "prompt",
    apps: "app",
    sites: "site",
    wiki: "wiki",
    wikivoyage: "wiki",
    mediai: "wiki",
    amazon: "amazon",
    images: "image",
    funny: "site",
  };
  const initialKind = sourceParam ? sourceToKind[sourceParam] : undefined;
  const isWiki = sourceParam === "wiki";
  const isVoyage = sourceParam === "wikivoyage";
  // The mobile feed needs 30 Wikipedia cards too. Reuse this result instead
  // of making a second random-Wikipedia request after every other source.
  const wikiCount = isWiki ? 100 : 30;
  const voyageCount = isVoyage ? 100 : 12;

  const [
    videosRes, starsRes, promptsRes, appsRes, sites, wikiRes, voyageRes, amazonRes, imagesRes, mediaiRes,
  ] = await Promise.all([
    sourceOrFallback("videos", getVideos, { videos: [], source: "" }),
    sourceOrFallback("stars", getStars, { stars: [], truncated: false }),
    sourceOrFallback("prompts", getPrompts, { prompts: [], source: "" }),
    sourceOrFallback("apps", getApps, { apps: [], domains: DOMAINS, target: 0 }),
    sourceOrFallback("sites", () => listSites({ status: "published" }), []),
    sourceOrFallback("wiki", () => getWiki(wikiCount), { items: [] }),
    sourceOrFallback("wikivoyage", () => getWikiVoyage(voyageCount), { items: [] }),
    sourceOrFallback("amazon", () => getAmazonItems({ limit: 200 }), { items: [], source: "", reachable: false }),
    sourceOrFallback("images", () => getImageItems({ limit: 100 }), { items: [], nextCursor: null }),
    sourceOrFallback("mediai", () => getMediaAiPage({ rawLimit: 220 }), { items: [], nextOffset: null }),
  ]);

  const cards: Card[] = [];
  cards.push(...videosRes.videos.slice(0, 30).map((v) => ({ kind: "video" as const, ...v })));
  cards.push(...starsRes.stars.slice(0, 60).map((s) => ({
    kind: "star" as const,
    full_name: s.full_name,
    description: s.description,
    html_url: s.html_url,
    stars: s.stargazers_count,
    language: s.language,
  })));
  cards.push(...promptsRes.prompts.slice(0, 60).map((p) => ({ kind: "prompt" as const, ...p })));
  cards.push(...appsRes.apps.filter((a) => !a.placeholder).map((a) => ({
    kind: "app" as const,
    id: a.id,
    display_name: a.display_name,
    domain_name: a.domain_name,
    subdomain: a.subdomain,
    accent: a.accent,
  })));
  cards.push(...sites.map((s) => ({
    kind: "site" as const,
    id: s.id,
    title: s.title,
    description: s.description,
    url: s.url,
    accent: s.accent,
    category: s.category,
  })));
  cards.push(...wikiRes.items.map((w) => ({ kind: "wiki" as const, ...w })));
  cards.push(...voyageRes.items.map((w) => ({ kind: "wiki" as const, ...w })));
  cards.push(...amazonRes.items.map((a) => ({
    kind: "amazon" as const,
    id: a.id,
    title: a.title,
    description: a.description,
    url: a.url,
    image: a.image,
    category: a.category,
    price: a.price,
    rating: a.rating,
  })));
  cards.push(...imagesRes.items.map((i) => ({
    kind: "image" as const,
    id: i.id,
    key: i.key,
    url: i.url,
    title: i.title,
    size: i.size,
  })));
  // MediaAI generated media — surfaced as wiki cards (Wikipedia-derived) with
  // the generated image as thumbnail.
  cards.push(...mediaiRes.items.slice(0, 80).map((m) => ({
    kind: "wiki" as const,
    id: `mediai:${m.id}`,
    title: m.topic,
    extract: [
      m.imageUrl ? "image" : null,
      m.videoUrls.length ? `${m.videoUrls.length} motion clip${m.videoUrls.length === 1 ? "" : "s"}` : null,
      m.audioUrl ? "audio narration" : null,
      `${m.assetCount} generated assets`,
    ].filter(Boolean).join(" · "),
    url: m.sourceUrl,
    thumbnail: m.imageUrl,
    source: "wiki" as const,
  })));
  // Funny 100 — one card per item, rendered as internal "site" links to /funny.
  cards.push(...funnyThings.map((f) => ({
    kind: "site" as const,
    id: `funny:${f.rank}`,
    title: `${f.rank}. ${f.title}`,
    description: f.copy,
    url: `/funny#rank-${f.rank}`,
    accent: "#f472b6",
    category: `Funny 100 · ${f.category}`,
  })));

  const ua = (await headers()).get("user-agent");
  const forceDesktop = viewParam === "desktop";

  return (
    <HomeClient
      initialCards={cards}
      initialImageCursor={imagesRes.nextCursor}
      initialKind={initialKind}
      isMobileUA={isMobileUA(ua) && !forceDesktop}
      wikiInitial={wikiRes.items.slice(0, 30)}
      legacyMobile={legacyParam === "1"}
    />
  );
}
