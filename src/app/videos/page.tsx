import { getVideos } from "@/lib/fetchers";
import MediaiFeed from "@/components/MediaiFeed";
import { cardToMediai } from "@/lib/scroll/toMediai";

export const revalidate = 600;

export const metadata = {
  title: "Videos · Scroller",
  description: "Fullscreen video feed from @MatSiems + @mat-siems-production.",
};

export default async function VideosPage() {
  const { videos } = await getVideos();
  const initial = {
    items: videos.map((v) => cardToMediai({ kind: "video", id: v.id, title: v.title, url: v.url, thumbnail: v.thumbnail, published: v.published })),
    nextOffset: null,
  };
  return <MediaiFeed initial={initial} />;
}
