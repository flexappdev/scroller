"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";
import type { WikiCard } from "@/lib/fetchers";

export default function WikiClient({ items }: { items: WikiCard[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openItem(w: WikiCard) {
    setModal({
      id: `wiki:${w.id}`,
      title: w.title,
      subtitle: "Wikipedia",
      description: w.extract,
      image: w.thumbnail ?? null,
      url: w.url,
      urlLabel: "Read on Wikipedia",
      accent: "#e5e7eb",
      internalHref: `/items/${encodeURIComponent(`wiki:${w.id}`)}`,
    });
  }

  return (
    <>
      <PageBrowser<WikiCard>
        pageKey="wiki"
        items={items}
        placeholder={`Search ${items.length} articles…`}
        searchFields={(w) => `${w.title} ${w.extract}`}
        alphaOf={(w) => w.title}
        rankOf={(_, i) => i}
        toScrollerCard={(w): ScrollerCard => ({
          kind: "wiki",
          id: w.id,
          title: w.title,
          extract: w.extract,
          url: w.url,
          thumbnail: w.thumbnail,
          source: "wiki",
        })}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => openItem(w)}
                className="text-left rounded-lg border border-zinc-800/60 hover:border-zinc-600/50 bg-zinc-950/40 overflow-hidden transition-colors group"
              >
                {w.thumbnail ? (
                  <div className="aspect-[16/9] bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.thumbnail} alt={w.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-zinc-900/50 flex items-center justify-center">
                    <span className="text-2xl text-zinc-700">W</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-300 line-clamp-1">{w.title}</h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{w.extract}</p>
                </div>
              </button>
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => openItem(w)}
                  className="w-full text-left flex items-baseline gap-3 rounded-md border border-zinc-800/60 hover:border-zinc-600/50 bg-zinc-950/40 px-4 py-3 transition-colors group"
                >
                  <span className="h-2 w-2 rounded-full bg-zinc-500 shrink-0 mt-2" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-300">{w.title}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{w.extract}</p>
                    <p className="mt-1 text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                      en.wikipedia.org <ExternalLink className="h-2.5 w-2.5" />
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      />
      <ItemModal item={modal} onClose={() => setModal(null)} />
    </>
  );
}
