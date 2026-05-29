"use client";

import { useState, useMemo } from "react";
import { Search, LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

export default function PageSearch<T>({
  items,
  searchFields,
  placeholder,
  defaultView = "grid",
  renderGrid,
  renderList,
}: {
  items: T[];
  searchFields: (item: T) => string;
  placeholder?: string;
  defaultView?: ViewMode;
  renderGrid: (filtered: T[]) => React.ReactNode;
  renderList: (filtered: T[]) => React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>(defaultView);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) => searchFields(i).toLowerCase().includes(needle));
  }, [q, items, searchFields]);

  return (
    <div className="space-y-6">
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

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <p className="text-sm text-zinc-400">No matches for &ldquo;{q}&rdquo;.</p>
        </div>
      ) : view === "grid" ? renderGrid(filtered) : renderList(filtered)}
    </div>
  );
}
