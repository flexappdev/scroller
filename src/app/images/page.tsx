import { getImageItems } from "@/lib/scroll/images";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Images: a full-screen picture feed",
  description: "A full-screen feed of AI-made and curated images from the Scroller library. Swipe through or switch to the grid.",
  alternates: { canonical: "/images" },
};

export default async function ImagesPage() {
  const { items } = await getImageItems({ limit: 200 });
  const initial = {
    items: items.map((i) => cardToMediai({ kind: "image", id: i.id, key: i.key, url: i.url, title: i.title, size: i.size })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
