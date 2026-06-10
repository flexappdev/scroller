import { getWikiVoyage } from "@/lib/fetchers";
import SourceHero from "@/components/SourceHero";
import WikiVoyageClient from "./WikiVoyageClient";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata = {
  title: "WikiVoyage · Scroller",
  description: "Random WikiVoyage destinations — full copy, sections, and media via the Wikivoyage REST API.",
};

export default async function WikiVoyagePage() {
  const { items } = await getWikiVoyage(100);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
      <SourceHero
        source="wikivoyage"
        accent="#3b82f6"
        label="Scroller · WikiVoyage"
        title="WikiVoyage"
        subtitle="Random destinations from en.wikivoyage.org. Refresh to rotate. 67,856 articles cached in MongoDB + Supabase index for fast paginated browsing."
        rightChip={`${items.length} destinations`}
      />
      <WikiVoyageClient items={items} />
    </main>
  );
}
