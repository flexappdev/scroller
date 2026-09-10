import { getAmazonItems } from "@/lib/scroll/amazon";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata = {
  title: "Amazon · Scroller",
  description: "Fullscreen Amazon Best-Sellers feed.",
};

export default async function AmazonPage() {
  const { items } = await getAmazonItems({ limit: 500 });
  const initial = {
    items: items.map((a) => cardToMediai({
      kind: "amazon", id: a.id, title: a.title, description: a.description, url: a.url, image: a.image, category: a.category, price: a.price, rating: a.rating,
    })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
