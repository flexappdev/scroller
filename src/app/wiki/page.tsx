import { getWiki } from "@/lib/fetchers";
import SourceHero from "@/components/SourceHero";
import WikiClient from "./WikiClient";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata = {
  title: "Wiki · Scroller",
  description: "Random Wikipedia articles — full content via the Wikipedia REST API.",
};

export default async function WikiPage() {
  const { items } = await getWiki(100);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
      <SourceHero
        source="wiki"
        accent="#e5e7eb"
        label="Scroller · Wikipedia"
        title="Wiki"
        subtitle="Random articles from en.wikipedia.org. Refresh to rotate. Cache layer: unstable_cache → Supabase index → MongoDB."
        rightChip={`${items.length} articles`}
      />
      <WikiClient items={items} />
    </main>
  );
}
