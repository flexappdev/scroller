import type { Metadata } from "next";
import MediaiFeed from "@/components/MediaiFeed";
import { getMediaiPage, type MediaiPage } from "@/lib/mediai";
import { isScrollerLoggedIn } from "@/lib/auth-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "ChatGPT Image Archive",
  description: "Every ChatGPT-generated image archived in MediaAI and available as a Scroller feed.",
};

export default async function ChatGPTArchivePage() {
  let initial: MediaiPage = { items: [], nextOffset: null };

  try {
    initial = await getMediaiPage({ rawLimit: 800, provider: "chatgpt" });
  } catch (error) {
    console.error("[chatgpt] archive feed failed", error);
  }

  const loggedIn = await isScrollerLoggedIn();

  return (
    <MediaiFeed
      initial={initial}
      provider="chatgpt"
      showAds={!loggedIn}
      adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null}
      adsenseSlot={process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim() || null}
    />
  );
}
