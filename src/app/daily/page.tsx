import type { Metadata } from "next";
import ScrollerFeed from "@/components/scroller/ScrollerFeed";
import { isScrollerLoggedIn } from "@/lib/auth-state";
import { listScrollerPacks, type ScrollerPack } from "@/lib/scroller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DAILY_SLUG = /^news-(\d{4}-\d{2}-\d{2})-/;

function getDailyDate(pack: ScrollerPack): string | null {
  const match = pack.manifest.slug.match(DAILY_SLUG);
  return match?.[1] ?? null;
}

async function getLatestDailyPack(): Promise<ScrollerPack | null> {
  const packs = await listScrollerPacks();

  return (
    packs
      .map((pack) => ({ pack, date: getDailyDate(pack) }))
      .filter(
        (entry): entry is { pack: ScrollerPack; date: string } =>
          Boolean(entry.date),
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.pack ?? null
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const pack = await getLatestDailyPack();

  if (!pack) {
    return {
      title: "ScrollAI Daily | Scroller",
      description: "The latest ScrollAI Daily news pack.",
    };
  }

  return {
    title: `${pack.manifest.name} | ScrollAI Daily`,
    description: pack.manifest.description,
  };
}

export default async function DailyPage() {
  const pack = await getLatestDailyPack();

  if (!pack) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-zinc-950 px-6 text-white">
        <section className="max-w-xl text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/45">
            ScrollAI Daily
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            No Daily pack found
          </h1>
          <p className="mt-4 text-white/60">
            Add a pack with a slug beginning with news-YYYY-MM-DD- to show it here.
          </p>
        </section>
      </main>
    );
  }

  const gateAfter = pack.manifest.monetization?.gateAfter;
  const visibleCount = gateAfter
    ? Math.min(Math.max(gateAfter, 1), pack.items.length)
    : pack.items.length;
  const loggedIn = await isScrollerLoggedIn();

  return (
    <ScrollerFeed
      manifest={pack.manifest}
      items={pack.items.slice(0, visibleCount)}
      totalCount={pack.items.length}
      showAds={!loggedIn}
      adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null}
      adsenseSlot={process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim() || null}
    />
  );
}
