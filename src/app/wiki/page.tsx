import { getWiki } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const revalidate = 600;

export const metadata = {
  title: "Wiki · Scroller",
  description: "Fullscreen Wikipedia feed.",
};

export default async function WikiPage() {
  const { items } = await getWiki(100);
  const initial = {
    items: items.map((w) => cardToMediai({ kind: "wiki", ...w })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
