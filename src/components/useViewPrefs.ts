"use client";

import { useEffect, useState } from "react";
import type { ViewMode, SortMode } from "@/lib/scroll/view";

const MOBILE_BREAKPOINT = 768;

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

/**
 * View + sort preferences with per-page key persistence in localStorage.
 *
 * Defaults:
 *   mobile  → view: scroller, sort: random
 *   desktop → view: grid, sort: random
 */
export function useViewPrefs(pageKey: string) {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortMode>("random");

  useEffect(() => {
    const mobile = isMobile();
    const defaultView: ViewMode = mobile ? "scroller" : "grid";
    const defaultSort: SortMode = "random";

    try {
      const storedView = localStorage.getItem(`scroller:view:${pageKey}`) as ViewMode | null;
      const storedSort = localStorage.getItem(`scroller:sort:${pageKey}`) as SortMode | null;
      setView(storedView ?? defaultView);
      setSort(storedSort ?? defaultSort);
    } catch {
      setView(defaultView);
      setSort(defaultSort);
    }
    setHydrated(true);
  }, [pageKey]);

  function updateView(v: ViewMode) {
    setView(v);
    try { localStorage.setItem(`scroller:view:${pageKey}`, v); } catch {}
  }

  function updateSort(s: SortMode) {
    setSort(s);
    try { localStorage.setItem(`scroller:sort:${pageKey}`, s); } catch {}
  }

  return { view, sort, setView: updateView, setSort: updateSort, hydrated };
}
