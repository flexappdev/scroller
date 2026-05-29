"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, ExternalLink } from "lucide-react";

export type SiteItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  href: string;          // canonical link (may equal url, or be a /sources/<id> for an internal source)
  accent: string;
  category: string;      // section header — 'Fleet', 'Curated', 'Sources', etc.
  badge?: string;        // small badge (e.g. monorepo, host)
  internal?: boolean;
};

export default function SitesBrowser({ items }: { items: SiteItem[] }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) =>
      [i.title, i.description ?? "", i.url, i.category, i.badge ?? "", i.id]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [q, items]);

  const grouped = useMemo(() => {
    const out: Record<string, SiteItem[]> = {};
    for (const i of filtered) (out[i.category] ||= []).push(i);
    return out;
  }, [filtered]);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <header className="mb-6 space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Sites</h1>
        <p className="text-sm text-zinc-400 max-w-xl">
          The fleet, curated picks, and every scroll source — searchable.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${items.length} sites…`}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-700/60"
          />
        </div>
        <div className="flex rounded-md border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors ${view === "list" ? "bg-zinc-900 text-emerald-400" : "bg-zinc-950/60 text-zinc-500 hover:text-zinc-300"}`}
            title="List view"
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors ${view === "grid" ? "bg-zinc-900 text-emerald-400" : "bg-zinc-950/60 text-zinc-500 hover:text-zinc-300"}`}
            title="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
        </div>
        <span className="text-xs text-zinc-500 font-mono ml-auto">{filtered.length}/{items.length}</span>
      </div>

      {Object.entries(grouped).map(([category, list]) => (
        <section key={category} className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-3">
            {category} <span className="text-zinc-700">· {list.length}</span>
          </h2>

          {view === "list" ? (
            <ul className="space-y-2">
              {list.map((s) => (
                <li key={s.id}>
                  <SiteRow item={s} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <SiteCardTile key={s.id} item={s} />
              ))}
            </div>
          )}
        </section>
      ))}

      {filtered.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <p className="text-sm text-zinc-400">No matches for &ldquo;{q}&rdquo;.</p>
        </div>
      )}
    </div>
  );
}

function SiteRow({ item }: { item: SiteItem }) {
  const host = (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return item.url; } })();
  const body = (
    <>
      <span className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: item.accent }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
            {item.title}
          </h3>
          {item.badge && (
            <span className="text-[10px] font-mono text-zinc-500">{item.badge}</span>
          )}
        </div>
        {item.description && <p className="mt-0.5 text-xs text-zinc-400">{item.description}</p>}
        <p className="mt-1 text-[10px] font-mono text-zinc-600 flex items-center gap-1">
          {host} {!item.internal && <ExternalLink className="h-2.5 w-2.5" />}
        </p>
      </div>
    </>
  );
  const className = "flex items-baseline gap-3 rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 px-4 py-3 transition-colors group";
  return item.internal ? (
    <Link href={item.href} className={className}>{body}</Link>
  ) : (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>{body}</a>
  );
}

function SiteCardTile({ item }: { item: SiteItem }) {
  const host = (() => { try { return new URL(item.url).hostname.replace(/^www\./, ""); } catch { return item.url; } })();
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
          {item.title}
        </h3>
        {item.badge && <span className="text-[10px] font-mono text-zinc-500 shrink-0">{item.badge}</span>}
      </div>
      {item.description && <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>}
      <p className="mt-2 text-[10px] font-mono text-zinc-600 truncate">{host}</p>
    </>
  );
  const className = "block rounded-lg border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-4 transition-colors group";
  const style = { borderLeftWidth: 3, borderLeftColor: item.accent };
  return item.internal ? (
    <Link href={item.href} className={className} style={style}>{body}</Link>
  ) : (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className} style={style}>{body}</a>
  );
}
