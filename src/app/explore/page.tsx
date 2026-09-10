import MediaiFeed from "@/components/MediaiFeed";
import { getMediaiPage, type MediaiPage } from "@/lib/mediai";

export const revalidate = 20;

export const metadata = {
  title: "Explore · Scroller",
  description: "Fullscreen Mediai feed across every source.",
};

export default async function ExplorePage() {
  let initial: MediaiPage = { items: [], nextOffset: null };
  try {
    initial = await getMediaiPage({ rawLimit: 400 });
  } catch (error) {
    console.error("[explore] feed failed", error);
  }
  return <MediaiFeed initial={initial} />;
}
