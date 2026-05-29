"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import PageBrowser from "./PageBrowser";
import ItemModal, { type ItemModalDetail } from "./ItemModal";
import type { Card as ScrollerCard } from "./ScrollerFeed";

export type SiteItem = {
  id: string;            // composite (e.g. "site:hn", "fleet:fad", "source:wiki")
  title: string;
  description: string | null;
  url: string;
  href: string;          // canonical link (may equal url, or be internal /?source=…)
  accent: string;
  category: string;      // section header — 'Fleet', 'Curated', 'Sources'
  badge?: string;
  internal?: boolean;
  rank?: number;
};

export default function SitesBrowser({ items }: { items: SiteItem[] }) {
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  function openModal(item: SiteItem) {
    const isInternalSource = item.internal === true;
    setModal({
      id: item.id,
      title: item.title,
      subtitle: `${item.category}${item.badge ? ` · ${item.badge}` : ""}`,
      description: item.description,
      url: item.url,
      urlLabel: isInternalSource ? "Open source" : "Visit site",
      accent: item.accent,
      // No /items/<id> for fleet or source entries; only curated sites resolve
      internalHref: item.id.startsWith("curated:") ? `/items/site:${item.id.slice(8)}` : undefined,
    });
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Sites</h1>
        <p className="text-sm text-zinc-400 max-w-xl">
          The fleet, curated picks, and every scroll source — searchable, sortable, scrollable.
        </p>
      </header>

      <PageBrowser<SiteItem>
        pageKey="sites"
        items={items}
        placeholder={`Search ${items.length} sites…`}
        searchFields={(s) => `${s.title} ${s.description ?? ""} ${s.url} ${s.category} ${s.badge ?? ""}`}
        alphaOf={(s) => s.title}
        rankOf={(s, i) => s.rank ?? i}
        toScrollerCard={(s): ScrollerCard => ({
          kind: "site",
          id: s.id,
          title: s.title,
          description: s.description,
          url: s.url,
          accent: s.accent,
          category: s.category,
        })}
        renderGrid={(filtered) => (
          <SitesByCategory items={filtered}>
            {(group) => (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((s) => (
                  <Tile key={s.id} item={s} onOpen={() => openModal(s)} />
                ))}
              </div>
            )}
          </SitesByCategory>
        )}
        renderList={(filtered) => (
          <SitesByCategory items={filtered}>
            {(group) => (
              <ul className="space-y-2">
                {group.map((s) => (
                  <li key={s.id}>
                    <Row item={s} onOpen={() => openModal(s)} />
                  </li>
                ))}
              </ul>
            )}
          </SitesByCategory>
        )}
      />

      <ItemModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function SitesByCategory({
  items,
  children,
}: {
  items: SiteItem[];
  children: (group: SiteItem[]) => React.ReactNode;
}) {
  const grouped: Record<string, SiteItem[]> = {};
  for (const i of items) (grouped[i.category] ||= []).push(i);
  return (
    <>
      {Object.entries(grouped).map(([category, group]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">
            {category} <span className="text-zinc-700">· {group.length}</span>
          </h2>
          {children(group)}
        </section>
      ))}
    </>
  );
}

function Row({ item, onOpen }: { item: SiteItem; onOpen: () => void }) {
  const host = (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return item.url; } })();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left flex items-baseline gap-3 rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 px-4 py-3 transition-colors group"
    >
      <span className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: item.accent }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
            {item.title}
          </h3>
          {item.badge && <span className="text-[10px] font-mono text-zinc-500">{item.badge}</span>}
        </div>
        {item.description && <p className="mt-0.5 text-xs text-zinc-400">{item.description}</p>}
        <p className="mt-1 text-[10px] font-mono text-zinc-600 flex items-center gap-1">
          {host} {!item.internal && <ExternalLink className="h-2.5 w-2.5" />}
        </p>
      </div>
    </button>
  );
}

function Tile({ item, onOpen }: { item: SiteItem; onOpen: () => void }) {
  const host = (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return item.url; } })();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left block rounded-lg border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-4 transition-colors group"
      style={{ borderLeftWidth: 3, borderLeftColor: item.accent }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
          {item.title}
        </h3>
        {item.badge && <span className="text-[10px] font-mono text-zinc-500 shrink-0">{item.badge}</span>}
      </div>
      {item.description && <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>}
      <p className="mt-2 text-[10px] font-mono text-zinc-600 truncate">{host}</p>
    </button>
  );
}

// Re-export Link to avoid unused-import lint
void Link;
