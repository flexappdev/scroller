import { getAmazonItems } from "@/lib/scroll/amazon";
import AmazonClient from "./AmazonClient";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata = {
  title: "Amazon · Scroller",
  description: "Amazon UK Best-Sellers (zgbs) — categorised, searchable, with ASIN ids.",
};

export default async function AmazonPage() {
  const { items, source, reachable } = await getAmazonItems({ limit: 500 });
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#ff9900" }} />
          Scroller · Amazon Best-Sellers
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Amazon</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          UK Best-Sellers from{" "}
          <a
            href="https://www.amazon.co.uk/Best-Sellers/zgbs"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-amber-300"
          >
            amazon.co.uk/Best-Sellers/zgbs
          </a>
          . {items.length} items, each tagged with its ASIN where known.
          {!reachable && " · source unreachable"}
        </p>
      </header>
      <AmazonClient items={items} source={source} />
    </main>
  );
}
