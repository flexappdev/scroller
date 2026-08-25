import MediaAiFeed from "@/components/MediaAiFeed";
import { getMediaAiPage, type MediaAiPage } from "@/lib/mediai";

// MediaAI is continuously producing new Wikipedia-derived assets. Keep the
// initial swipe feed fresh while still allowing Vercel to cache the route.
export const revalidate = 20;

export default async function HomePage() {
  let initial: MediaAiPage = { items: [], nextOffset: null };

  try {
    initial = await getMediaAiPage({ rawLimit: 220 });
  } catch (error) {
    console.error("[home] MediaAI feed failed", error);
  }

  return <MediaAiFeed initial={initial} />;
}
