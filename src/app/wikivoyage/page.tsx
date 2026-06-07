import { getWikiVoyage } from "@/lib/fetchers";
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
      <header>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#3b82f6" }} />
          Scroller · WikiVoyage
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">WikiVoyage</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {items.length} random destinations from{" "}
          <a className="underline hover:text-blue-300" href="https://en.wikivoyage.org" target="_blank" rel="noreferrer">
            en.wikivoyage.org
          </a>
          . Refresh to rotate. Caching pipeline lives in MongoDB · Supabase index for fast paginated browsing.
        </p>
      </header>
      <WikiVoyageClient items={items} />
    </main>
  );
}
