import { getWiki } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const revalidate = 600;

export const metadata = {
  title: "Wikipedia feed: the most-read articles",
  description: "Scroll Wikipedia's most-read articles as full-screen cards: a short summary first, the full article one tap away.",
  alternates: { canonical: "/wiki" },
};

export default async function WikiPage() {
  const { items } = await getWiki(100);
  const initial = {
    items: items.map((w) => cardToMediai({ kind: "wiki", ...w })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
