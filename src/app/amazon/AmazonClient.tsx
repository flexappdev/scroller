"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";
import type { AmazonItem } from "@/lib/scroll/amazon";

export default function AmazonClient({ items, source }: { items: AmazonItem[]; source: string }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openItem(it: AmazonItem) {
    setModal({
      id: `amazon:${it.id}`,
      title: it.title,
      subtitle: `Amazon · ${it.category}${it.asin ? ` · ${it.asin}` : ""}`,
      description: it.description,
      url: it.url,
      urlLabel: "View on Amazon",
      accent: "#ff9900",
    });
  }

  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  return (
    <>
      <PageBrowser<AmazonItem>
        pageKey="amazon"
        items={items}
        placeholder={`Search ${items.length} Best-Sellers…`}
        searchFields={(i) => `${i.title} ${i.description ?? ""} ${i.category} ${i.asin ?? ""}`}
        alphaOf={(i) => i.title}
        rankOf={(i, idx) => i.rank ?? idx}
        kindOf={(i) => i.category}
        kindOptions={categories.map((c) => ({ value: c, label: c }))}
        toScrollerCard={(i): ScrollerCard => ({
          kind: "amazon",
          id: i.id,
          title: i.title,
          description: i.description,
          url: i.url,
          image: i.image,
          category: i.category,
          price: i.price,
          rating: i.rating,
        })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((it, i) => (
              <button
                key={`${it.id}-${i}`}
                type="button"
                onClick={() => openItem(it)}
                className="text-left rounded-lg border border-zinc-800/60 hover:border-amber-700/50 bg-zinc-950/40 overflow-hidden transition-colors group"
                style={{ borderLeftWidth: 3, borderLeftColor: "#ff9900" }}
              >
                {it.image ? (
                  <div className="aspect-[4/3] bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : null}
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1">
                    {it.category}{it.asin && <> · <span className="text-zinc-400">{it.asin}</span></>}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300 line-clamp-2">
                    {it.title}
                  </h3>
                  {it.description && <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{it.description}</p>}
                  <div className="mt-2 flex gap-3 text-[10px] font-mono text-zinc-500">
                    {it.price && <span className="text-emerald-400">{it.price}</span>}
                    {it.rating && <span>★ {it.rating}</span>}
                  </div>
                </div>
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((it, i) => (
              <li key={`${it.id}-${i}`}>
                <button
                  type="button"
                  onClick={() => openItem(it)}
                  className="w-full text-left flex items-baseline gap-3 rounded-md border border-zinc-800/60 hover:border-amber-700/50 bg-zinc-950/40 px-4 py-3 transition-colors group"
                >
                  <span className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: "#ff9900" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300">{it.title}</h3>
                      {it.asin && <span className="text-[10px] font-mono text-zinc-500">{it.asin}</span>}
                    </div>
                    {it.description && <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{it.description}</p>}
                    <p className="mt-1 text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                      {it.category} <ExternalLink className="h-2.5 w-2.5" />
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      />
      <p className="text-[10px] font-mono text-zinc-600">source: {source}</p>
      <ItemModal item={modal} onClose={() => setModal(null)} />
    </>
  );
}
