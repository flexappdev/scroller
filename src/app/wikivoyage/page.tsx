import { getWikiVoyage } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata = {
  title: "WikiVoyage · Scroller",
  description: "Fullscreen WikiVoyage feed.",
};

export default async function WikiVoyagePage() {
  const { items } = await getWikiVoyage(100);
  const initial = {
    items: items.map((w) => cardToMediai({ kind: "wiki", ...w })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
