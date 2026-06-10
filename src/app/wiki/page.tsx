import { getWiki } from "@/lib/fetchers";
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
      <header>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-2">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
          Scroller · Wikipedia
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Wiki</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {items.length} random articles from{" "}
          <a className="underline hover:text-zinc-300" href="https://en.wikipedia.org" target="_blank" rel="noreferrer">
            en.wikipedia.org
          </a>
          . Refresh to rotate.
        </p>
      </header>
      <WikiClient items={items} />
    </main>
  );
}
