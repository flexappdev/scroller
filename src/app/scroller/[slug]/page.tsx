import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScrollerFeed from "@/components/scroller/ScrollerFeed";
import { getScrollerPack, listScrollerPacks } from "@/lib/scroller";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const packs = await listScrollerPacks();
  return packs.map(({ manifest }) => ({ slug: manifest.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getScrollerPack(slug);

  if (!pack) return {};

  return {
    title: `${pack.manifest.name} | Scroller`,
    description: pack.manifest.description,
  };
}

export default async function ScrollerPage({ params }: PageProps) {
  const { slug } = await params;
  const pack = await getScrollerPack(slug);

  if (!pack) notFound();

  const gateAfter = pack.manifest.monetization?.gateAfter;
  const visibleCount = gateAfter
    ? Math.min(Math.max(gateAfter, 1), pack.items.length)
    : pack.items.length;

  return (
    <ScrollerFeed
      manifest={pack.manifest}
      items={pack.items.slice(0, visibleCount)}
      totalCount={pack.items.length}
    />
  );
}
