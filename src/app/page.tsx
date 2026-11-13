import MediaiFeed from "@/components/MediaiFeed";
import { getMediaiPage, type MediaiPage } from "@/lib/mediai";
import { isScrollerLoggedIn } from "@/lib/auth-state";
import { getHomeCard, getHomePage, hasHomeFeed, newSeed } from "@/lib/home-feed";

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

export default async function HomePage({ searchParams }: { searchParams: Promise<{ card?: string | string[] }> }) {
  let initial: MediaiPage = { items: [], nextOffset: null };
  let source: "home" | "mediai" = "mediai";

  // Home = Wikipedia's top 10,000 most-viewed articles plus every book
  // chapter, in a fresh popularity-weighted order per visit. Until the
  // weekly top-10k list exists, fall back to the raw Mediai feed.
  try {
    if (await hasHomeFeed()) {
      initial = await getHomePage({ seed: newSeed(), offset: 0, limit: 40 });
      source = "home";
      // A shared ?card= link opens on that card even though order is random.
      const card = (await searchParams).card;
      const shared = typeof card === "string" ? await getHomeCard(card) : null;
      if (shared) initial = { ...initial, items: [shared, ...initial.items.filter((i) => i.id !== shared.id)] };
    } else {
      initial = await getMediaiPage({ rawLimit: 220 });
      initial = { ...initial, items: shuffled(initial.items) };
    }
  } catch (error) {
    console.error("[home] feed failed", error);
  }

  const loggedIn = await isScrollerLoggedIn();

  return (
    <MediaiFeed
      initial={initial}
      source={source}
      showAds={!loggedIn}
      adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null}
      adsenseSlot={process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim() || null}
    />
  );
}
