"use client";

import { useMemo, useState } from "react";
import { Search, LayoutGrid, List, Smartphone, ArrowDownAZ, Star, Shuffle, MoreHorizontal } from "lucide-react";
import ScrollerFeed, { type Card as ScrollerCard } from "./ScrollerFeed";
import { useViewPrefs } from "./useViewPrefs";
import { seededShuffle, type ViewMode, type SortMode } from "@/lib/scroll/view";

export type KindOption = { value: string; label: string };

export default function PageBrowser<T>({
  pageKey,
  items,
  placeholder,
  searchFields,
  rankOf,
  alphaOf,
  renderGrid,
  renderList,
  toScrollerCard,
  kindOf,
  kindOptions,
  initialKind,
  onLoadMore,
  hasMore,
  loading,
}: {
  pageKey: string;
  items: T[];
  placeholder?: string;
  searchFields: (item: T) => string;
  rankOf?: (item: T, index: number) => number;
  alphaOf: (item: T) => string;
  renderGrid: (filtered: T[]) => React.ReactNode;
  renderList: (filtered: T[]) => React.ReactNode;
  toScrollerCard?: (item: T) => ScrollerCard;
  /** When provided, enables the type/kind dropdown. */
  kindOf?: (item: T) => string;
  kindOptions?: KindOption[];
  initialKind?: string;
  /** When provided, render a "Load more" button at the end of grid/list views. */
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}) {
  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<string>(initialKind ?? "all");
  // Random shuffle seed — fresh on mount (so refresh = new order); bumped on
  // each Random-toggle click (so re-clicking re-shuffles).
  const [randomNonce, setRandomNonce] = useState<number>(() => (Math.random() * 233280) | 0);
  const { view, sort, setView, setSort, hydrated } = useViewPrefs(pageKey);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let base = needle
      ? items.filter((i) => searchFields(i).toLowerCase().includes(needle))
      : items.slice();
    if (kindOf && kindFilter !== "all") {
      base = base.filter((i) => kindOf(i) === kindFilter);
    }
    if (sort === "alpha") return base.sort((a, b) => alphaOf(a).localeCompare(alphaOf(b)));
    if (sort === "ranked") {
      const rank = rankOf ?? ((_: T, idx: number) => idx);
      return base
        .map((it, i) => ({ it, r: rank(it, i) }))
        .sort((a, b) => a.r - b.r)
        .map((x) => x.it);
    }
    return seededShuffle(base, randomNonce);
  }, [q, items, sort, searchFields, alphaOf, rankOf, kindFilter, kindOf, randomNonce]);

  const supportsScroller = !!toScrollerCard;
  const effectiveView: ViewMode = view === "scroller" && !supportsScroller ? "grid" : view;

  if (!hydrated) {
    return <div className="h-32" aria-hidden />;
  }

  function pickRandom() {
    setSort("random");
    setRandomNonce((Math.random() * 233280) | 0);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder ?? `Search ${items.length} items…`}
            className="w-full rounded-md border border-zinc-800 bg-zinc-950/60 pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-700/60"
          />
        </div>

        {kindOptions && kindOptions.length > 1 && (
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-700/60"
            title="Filter by type"
          >
            {kindOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        <div className="flex rounded-md border border-zinc-800 overflow-hidden">
          {supportsScroller && (
            <ToggleBtn active={effectiveView === "scroller"} onClick={() => setView("scroller")} title="Scroller view">
              <Smartphone className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Scroller</span>
            </ToggleBtn>
          )}
          <ToggleBtn active={effectiveView === "list"} onClick={() => setView("list")} title="List view">
            <List className="h-3.5 w-3.5" /> <span className="hidden sm:inline">List</span>
          </ToggleBtn>
          <ToggleBtn active={effectiveView === "grid"} onClick={() => setView("grid")} title="Grid view">
            <LayoutGrid className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Grid</span>
          </ToggleBtn>
        </div>

        <div className="flex rounded-md border border-zinc-800 overflow-hidden">
          <ToggleBtn active={sort === "ranked"} onClick={() => setSort("ranked")} title="Ranked first">
            <Star className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ranked</span>
          </ToggleBtn>
          <ToggleBtn active={sort === "alpha"} onClick={() => setSort("alpha")} title="Alphabetic">
            <ArrowDownAZ className="h-3.5 w-3.5" /> <span className="hidden sm:inline">A–Z</span>
          </ToggleBtn>
          <ToggleBtn active={sort === "random"} onClick={pickRandom} title="Random (click again to re-shuffle)">
            <Shuffle className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Random</span>
          </ToggleBtn>
        </div>

        <span className="text-xs text-zinc-500 font-mono ml-auto">{filtered.length}/{items.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <p className="text-sm text-zinc-400">No matches{q ? ` for "${q}"` : ""}.</p>
        </div>
      ) : effectiveView === "scroller" && supportsScroller && toScrollerCard ? (
        <ScrollerFeed cards={filtered.map(toScrollerCard)} embedded />
      ) : effectiveView === "list" ? (
        renderList(filtered)
      ) : (
        renderGrid(filtered)
      )}

      {onLoadMore && hasMore && effectiveView !== "scroller" && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-200 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            {loading ? "Loading…" : "Load 100 more"}
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs transition-colors ${
        active ? "bg-zinc-900 text-emerald-400" : "bg-zinc-950/60 text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

export type { ViewMode, SortMode };
