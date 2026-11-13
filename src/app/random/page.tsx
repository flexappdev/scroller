import type { Metadata } from "next";
import RandomClient from "./RandomClient";
import { getRandomCard, getRandomPage, newSeed, parseSeed } from "@/lib/random-feed";

// Fresh shuffle on every visit unless the link carries a seed.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Search = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const card = await getRandomCard(one((await searchParams).card));
  const description = "One endless shuffle of every Scroller pack, the most-read Wikipedia articles and our book chapters.";
  if (!card) {
    return {
      title: "Random",
      description,
      alternates: { canonical: "/random" },
      openGraph: { title: "Random · Scroller", description, url: "/random" },
    };
  }
  const text = card.body || card.kicker;
  return {
    title: `${card.title} · Random`,
    description: text,
    alternates: { canonical: "/random" },
    openGraph: {
      title: card.title,
      description: text,
      url: `/random?card=${encodeURIComponent(card.id)}`,
      images: card.image ? [{ url: card.image }] : undefined,
    },
    twitter: { card: card.image ? "summary_large_image" : "summary", title: card.title, description: text },
  };
}

export default async function RandomPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const seed = parseSeed(params.seed) ?? newSeed();
  const [page, shared] = await Promise.all([getRandomPage({ seed, offset: 0, limit: 20 }), getRandomCard(one(params.card))]);
  const items = shared ? [shared, ...page.items.filter((c) => c.id !== shared.id)] : page.items;
  return <RandomClient seed={seed} initial={items} nextOffset={page.nextOffset} counts={page.counts} />;
}
