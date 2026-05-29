import { getApps, getPrompts, getStars, getVideos, getWiki, getWikiVoyage } from "@/lib/fetchers";
import { listSites } from "@/lib/cms/sites";
import { getAmazonItems } from "@/lib/scroll/amazon";
import { getImageItems } from "@/lib/scroll/images";
import HomeClient from "./HomeClient";
import type { Card } from "@/components/ScrollerFeed";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source: sourceParam } = await searchParams;

  // Map ?source= to an initial kind filter when it corresponds to a card kind.
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

  // When a single source is requested, load 100 of that source. For the
  // mixed "all" feed, load smaller counts so the page doesn't choke.
  const isWiki = sourceParam === "wiki";
  const isVoyage = sourceParam === "wikivoyage";
  const wikiCount = isWiki ? 100 : 20;
  const voyageCount = isVoyage ? 100 : 12;

  const [
    videosRes, starsRes, promptsRes, appsRes, sites, wikiRes, voyageRes, amazonRes, imagesRes,
  ] = await Promise.all([
    getVideos(),
    getStars(),
    getPrompts(),
    getApps(),
    listSites({ status: "published" }),
    getWiki(wikiCount),
    getWikiVoyage(voyageCount),
    getAmazonItems({ limit: 200 }),
    getImageItems({ limit: 100 }),
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

  return (
    <HomeClient
      initialCards={cards}
      initialImageCursor={imagesRes.nextCursor}
      initialKind={initialKind}
    />
  );
}
