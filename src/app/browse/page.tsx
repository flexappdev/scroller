import { headers } from "next/headers";
import { getApps, getPrompts, getStars, getVideos, getWiki, getWikiVoyage } from "@/lib/fetchers";
import { DOMAINS } from "@/lib/taxonomy";
import { listSites } from "@/lib/cms/sites";
import { getAmazonItems } from "@/lib/scroll/amazon";
import { getImageItems } from "@/lib/scroll/images";
import HomeClient from "../HomeClient";
import type { Card } from "@/components/ScrollerFeed";

export const revalidate = 300;

function warn(label: string, err: unknown): void {
  console.warn(`[browse] ${label} failed, using fallback:`, err instanceof Error ? err.message : err);
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
    amazon: "amazon",
    images: "image",
  };
  const initialKind = sourceParam ? sourceToKind[sourceParam] : undefined;
  const isWiki = sourceParam === "wiki";
  const isVoyage = sourceParam === "wikivoyage";
  const wikiCount = isWiki ? 100 : 20;
  const voyageCount = isVoyage ? 100 : 12;

  const [
    videosRes, starsRes, promptsRes, appsRes, sites, wikiRes, voyageRes, amazonRes, imagesRes,
  ] = await Promise.all([
    getVideos().catch((e) => { warn("videos", e); return { videos: [], source: "" }; }),
    getStars().catch((e) => { warn("stars", e); return { stars: [], truncated: false }; }),
    getPrompts().catch((e) => { warn("prompts", e); return { prompts: [], source: "" }; }),
    getApps().catch((e) => { warn("apps", e); return { apps: [], domains: DOMAINS, target: 0 }; }),
    listSites({ status: "published" }).catch((e) => { warn("sites", e); return []; }),
    getWiki(wikiCount).catch((e) => { warn("wiki", e); return { items: [] }; }),
    getWikiVoyage(voyageCount).catch((e) => { warn("wikivoyage", e); return { items: [] }; }),
    getAmazonItems({ limit: 200 }).catch((e) => { warn("amazon", e); return { items: [] }; }),
    getImageItems({ limit: 100 }).catch((e) => { warn("images", e); return { items: [], nextCursor: null }; }),
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

  const ua = (await headers()).get("user-agent");
  const forceDesktop = viewParam === "desktop";
  const wikiOnly = await getWiki(30).catch((e) => { warn("wiki-mobile", e); return { items: [] }; });

  return (
    <HomeClient
      initialCards={cards}
      initialImageCursor={imagesRes.nextCursor}
      initialKind={initialKind}
      isMobileUA={isMobileUA(ua) && !forceDesktop}
      wikiInitial={wikiOnly.items}
      legacyMobile={legacyParam === "1"}
    />
  );
}
