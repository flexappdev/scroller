"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowDown, ChevronUp, Dices, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";

export default function StickyFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const [rolling, setRolling] = useState(false);
  const [position, setPosition] = useState({ index: 0, total: 0 });
  const onScroller = pathname === "/";

  useEffect(() => {
    function onPosition(event: Event) {
      const detail = (event as CustomEvent<{ index: number; total: number }>).detail;
      if (detail) setPosition(detail);
    }
    window.addEventListener("scroller:position", onPosition as EventListener);
    return () => window.removeEventListener("scroller:position", onPosition as EventListener);
  }, []);

  function randomSource() {
    setRolling(true);
    window.setTimeout(() => setRolling(false), 700);
    if (onScroller) {
      window.dispatchEvent(new CustomEvent("scroller:random"));
      return;
    }
    const pickable = SCROLL_SOURCES.filter((s) => s.id !== "all");
    const pick = pickable[Math.floor(Math.random() * pickable.length)];
    router.push(pick.href);
  }

  function emitScrollerNav(direction: "prev" | "next") {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("scroller:nav", { detail: { direction } }));
  }

  function nextScroll() {
    if (onScroller) emitScrollerNav("next");
    else router.push("/");
  }

  return (
    <footer
      className="fixed bottom-0 right-0 z-50 flex h-[4.25rem] items-center gap-2 px-2.5 chrome-glass-bottom sm:px-4"
      style={{ left: "var(--sidebar-w, 200px)" }}
    >
      <Link
        href="/browse"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-[var(--surface-hover)] sm:w-auto sm:px-3"
        style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
        aria-label="Browse every media source"
      >
        <Layers3 className="h-[18px] w-[18px]" />
        <span className="ml-2 hidden text-xs font-bold sm:inline">Sources</span>
      </Link>
      <button
        type="button"
        onClick={() => emitScrollerNav("prev")}
        disabled={!onScroller}
        className="hidden h-11 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 sm:flex"
        style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
        title={onScroller ? "Previous card" : "Open the scroller to navigate"}
      >
        <ChevronUp className="h-4 w-4" />
        Prev
      </button>
      {onScroller && position.total > 0 && (
        <span className="hidden min-w-[4.5rem] text-center font-mono text-[10px] font-semibold tabular-nums md:block" style={{ color: "var(--foreground-muted)" }}>
          {String(position.index + 1).padStart(2, "0")} / {String(position.total).padStart(2, "0")}
        </span>
      )}
      <button
        type="button"
        onClick={randomSource}
        className="flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-black transition-colors hover:bg-[var(--surface-hover)]"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-soft)",
        }}
        title={onScroller ? "Shuffle the MediaAI feed" : "Jump to a random source"}
        aria-label={onScroller ? "Shuffle MediaAI feed" : "Open a random Scroller source"}
      >
        <Dices className={`h-[18px] w-[18px] ${rolling ? "dice-is-rolling" : ""}`} />
        <span className="hidden sm:inline">Random</span>
      </button>
      <button
        type="button"
        onClick={nextScroll}
        className="group ml-auto flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black uppercase tracking-[0.04em] text-black shadow-[0_10px_32px_color-mix(in_oklch,var(--accent)_20%,transparent)] transition-transform hover:-translate-y-0.5 sm:max-w-[19rem]"
        style={{ borderColor: "var(--accent)", background: "var(--accent)" }}
        title="Next scroll"
      >
        Next scroll
        <ArrowDown className="h-[18px] w-[18px] transition-transform group-hover:translate-y-0.5" />
      </button>
    </footer>
  );
}
