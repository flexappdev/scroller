"use client";

import { useEffect, useState } from "react";
import type { ViewMode, SortMode } from "@/lib/scroll/view";

const GLOBAL_VIEW_KEY = "scroller:view";
const GLOBAL_SORT_KEY = "scroller:sort";

/**
 * Cross-page view + sort preferences. Choosing a view on /sites carries over to
 * /apps, /wiki, etc. Default view = scroller everywhere. pageKey is accepted
 * for legacy callers but no longer namespaces the storage key.
 */
export function useViewPrefs(pageKey: string) {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ViewMode>("scroller");
  const [sort, setSort] = useState<SortMode>("random");

  useEffect(() => {
    try {
      const legacy = localStorage.getItem(`scroller:view:${pageKey}`) as ViewMode | null;
      const storedView = (localStorage.getItem(GLOBAL_VIEW_KEY) as ViewMode | null) ?? legacy;
      const storedSort = localStorage.getItem(GLOBAL_SORT_KEY) as SortMode | null;
      setView(storedView ?? "scroller");
      setSort(storedSort ?? "random");
    } catch {
      setView("scroller");
      setSort("random");
    }
    setHydrated(true);
  }, [pageKey]);

  function updateView(v: ViewMode) {
    setView(v);
    try { localStorage.setItem(GLOBAL_VIEW_KEY, v); } catch {}
  }

  function updateSort(s: SortMode) {
    setSort(s);
    try { localStorage.setItem(GLOBAL_SORT_KEY, s); } catch {}
  }

  return { view, sort, setView: updateView, setSort: updateSort, hydrated };
}
