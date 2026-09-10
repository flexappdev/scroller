import MediaiFeed from "@/components/MediaiFeed";
import { getMediaiPage, type MediaiPage } from "@/lib/mediai";
import { isScrollerLoggedIn } from "@/lib/auth-state";

// Home must feel fresh on every visit. Do not reuse a previously rendered
// order; repeated Home taps also reshuffle instantly on the client.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function shuffled<T>(input: T[]): T[] {
  const next = [...input];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export default async function HomePage() {
  let initial: MediaiPage = { items: [], nextOffset: null };

  try {
    initial = await getMediaiPage({ rawLimit: 220 });
    initial = { ...initial, items: shuffled(initial.items) };
  } catch (error) {
    console.error("[home] Mediai feed failed", error);
  }

  const loggedIn = await isScrollerLoggedIn();

  return (
    <MediaiFeed
      initial={initial}
      showAds={!loggedIn}
      adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null}
      adsenseSlot={process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim() || null}
    />
  );
}
