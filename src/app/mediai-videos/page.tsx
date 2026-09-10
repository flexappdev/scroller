import MediaiFeed from "@/components/MediaiFeed";
import { getMediaiPage, type MediaiPage } from "@/lib/mediai";

export const revalidate = 20;

export const metadata = {
  title: "Mediai Videos · Scroller",
  description: "Vertical feed of Mediai topic bundles that include a video asset (kenburns / ltx).",
};

export default async function MediaiVideosPage() {
  let initial: MediaiPage = { items: [], nextOffset: null };
  try {
    initial = await getMediaiPage({ rawLimit: 400 });
  } catch (error) {
    console.error("[mediai-videos] feed failed", error);
  }
  const filtered = { ...initial, items: initial.items.filter((i) => i.videoUrls.length > 0) };
  return <MediaiFeed initial={filtered} />;
}
