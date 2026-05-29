import { getApps, getPrompts, getStars, getVideos, getWiki, getWikiVoyage } from "@/lib/fetchers";
import { listSites } from "@/lib/cms/sites";
import { getAmazonItems } from "@/lib/scroll/amazon";
import ScrollerFeed, { type Card } from "@/components/ScrollerFeed";
import { sourceById } from "@/lib/scroll/sources";
import { seededShuffle, dailySeed } from "@/lib/scroll/view";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const { source: sourceParam } = await searchParams;
  const source = sourceById(sourceParam);

  const wantsAll = source.id === "all";
  const cards: Card[] = [];

  if (wantsAll || source.id === "videos") {
    const { videos } = await getVideos();
    cards.push(...videos.slice(0, wantsAll ? 15 : 50).map((v) => ({ kind: "video" as const, ...v })));
  }
  if (wantsAll || source.id === "github") {
    const { stars } = await getStars();
    cards.push(...stars.slice(0, wantsAll ? 30 : 100).map((s) => ({
      kind: "star" as const,
      full_name: s.full_name,
      description: s.description,
      html_url: s.html_url,
      stars: s.stargazers_count,
      language: s.language,
    })));
  }
  if (wantsAll || source.id === "prompts") {
    const { prompts } = await getPrompts();
    cards.push(...prompts.slice(0, wantsAll ? 30 : 100).map((p) => ({ kind: "prompt" as const, ...p })));
  }
  if (wantsAll || source.id === "apps") {
    const { apps } = await getApps();
    cards.push(...apps.filter((a) => !a.placeholder).map((a) => ({
      kind: "app" as const,
      id: a.id,
      display_name: a.display_name,
      domain_name: a.domain_name,
      subdomain: a.subdomain,
      accent: a.accent,
    })));
  }
  if (wantsAll || source.id === "sites") {
    const sites = await listSites({ status: "published" });
    cards.push(...sites.map((s) => ({
      kind: "site" as const,
      id: s.id,
      title: s.title,
      description: s.description,
      url: s.url,
      accent: s.accent,
      category: s.category,
    })));
  }
  if (wantsAll || source.id === "wiki") {
    const { items } = await getWiki(wantsAll ? 8 : 20);
    cards.push(...items.map((w) => ({ kind: "wiki" as const, ...w })));
  }
  if (wantsAll || source.id === "wikivoyage") {
    const { items } = await getWikiVoyage(wantsAll ? 6 : 20);
    cards.push(...items.map((w) => ({ kind: "wiki" as const, ...w })));
  }
  if (wantsAll || source.id === "amazon") {
    const { items } = await getAmazonItems();
    cards.push(...items.map((a) => ({
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
  }

  const ordered = seededShuffle(cards, dailySeed());

  return <ScrollerFeed cards={ordered} />;
}
