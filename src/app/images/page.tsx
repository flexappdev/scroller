import { getImageItems } from "@/lib/scroll/images";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Images · Scroller",
  description: "Fullscreen S3 image feed.",
};

export default async function ImagesPage() {
  const { items } = await getImageItems({ limit: 200 });
  const initial = {
    items: items.map((i) => cardToMediai({ kind: "image", id: i.id, key: i.key, url: i.url, title: i.title, size: i.size })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
