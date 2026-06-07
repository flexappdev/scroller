import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAmazonItems, withAmazonTag } from "@/lib/scroll/amazon";
import { AMAZON_ZGBS_CATEGORIES } from "@/lib/scroll/amazon-categories";
import AmazonClient from "./AmazonClient";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata = {
  title: "Amazon · Scroller",
  description: "Amazon UK Best-Sellers (zgbs) — every category landing page + ASIN-tagged Mongo picks.",
};

export default async function AmazonPage() {
  const { items, source, reachable } = await getAmazonItems({ limit: 500 });
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
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
          . {AMAZON_ZGBS_CATEGORIES.length} category landing pages + {items.length} ASIN-tagged picks.
          {!reachable && " · source unreachable"}
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">
            Browse Categories <span className="text-zinc-700">· {AMAZON_ZGBS_CATEGORIES.length}</span>
          </h2>
          <a
            href="https://www.amazon.co.uk/Best-Sellers/zgbs"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-mono text-zinc-500 hover:text-amber-300 flex items-center gap-1"
          >
            zgbs root <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {AMAZON_ZGBS_CATEGORIES.map((c) => (
            <li key={c.id}>
              <a
                href={withAmazonTag(c.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 hover:border-amber-700/50 transition-colors group"
                style={{ borderLeftWidth: 3, borderLeftColor: c.accent }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{c.id}</div>
                  <div className="text-xs font-medium text-zinc-100 truncate group-hover:text-amber-300">{c.name}</div>
                </div>
                <ExternalLink className="h-3 w-3 mt-1 text-zinc-600 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">
          ASIN-tagged picks <span className="text-zinc-700">· {items.length}</span>
        </h2>
        <AmazonClient items={items} source={source} />
      </section>
    </main>
  );
}

// Re-export Link to avoid unused-import lint
void Link;
