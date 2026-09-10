import MediaiFeed from "@/components/MediaiFeed";
import { getMediaiPage, type MediaiPage } from "@/lib/mediai";

export const revalidate = 20;

export const metadata = {
  title: "Mediai Audio · Scroller",
  description: "Vertical feed of Mediai topic bundles that include a narration audio asset.",
};

export default async function MediaiAudioPage() {
  let initial: MediaiPage = { items: [], nextOffset: null };
  try {
    initial = await getMediaiPage({ rawLimit: 400 });
  } catch (error) {
    console.error("[mediai-audio] feed failed", error);
  }
  const filtered = { ...initial, items: initial.items.filter((i) => Boolean(i.audioUrl)) };
  return <MediaiFeed initial={filtered} />;
}
