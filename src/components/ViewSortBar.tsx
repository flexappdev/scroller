"use client";

import { useState } from "react";
import { LayoutGrid, List, Smartphone, ArrowDownAZ, Star, Shuffle } from "lucide-react";
import { useViewPrefs } from "./useViewPrefs";
import type { ViewMode, SortMode } from "@/lib/scroll/view";

export type ViewSortBarProps = {
  pageKey: string;
  supportsScroller?: boolean;
  onRandomNonce?: (nonce: number) => void;
  className?: string;
};

export default function ViewSortBar({
  pageKey,
  supportsScroller = true,
  onRandomNonce,
  className,
}: ViewSortBarProps) {
  const { view, sort, setView, setSort, hydrated } = useViewPrefs(pageKey);
  const [, setNonce] = useState(0);

  if (!hydrated) return <div className="h-9" aria-hidden />;

  const effectiveView: ViewMode = view === "scroller" && !supportsScroller ? "grid" : view;

  function pickRandom() {
    setSort("random");
    const n = (Math.random() * 233280) | 0;
    setNonce(n);
    onRandomNonce?.(n);
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
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
    </div>
  );
}

function ToggleBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
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
