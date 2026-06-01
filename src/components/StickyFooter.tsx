"use client";
import { useRouter, usePathname } from "next/navigation";
import { Shuffle, ChevronLeft, ChevronRight, User, Github, Info } from "lucide-react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";
import pkg from "../../package.json";

export default function StickyFooter() {
  const router = useRouter();
  const pathname = usePathname();

  function randomSource() {
    const pickable = SCROLL_SOURCES.filter((s) => s.id !== "all");
    const pick = pickable[Math.floor(Math.random() * pickable.length)];
    router.push(pick.href);
  }

  function emitScrollerNav(direction: "prev" | "next") {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("scroller:nav", { detail: { direction } }));
  }

  const onScroller = pathname === "/";

  return (
    <footer className="fixed bottom-0 right-0 z-30 flex h-12 items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-950/85 backdrop-blur-md px-4" style={{ left: "var(--sidebar-w, 180px)" }}>
      <button
        type="button"
        onClick={() => emitScrollerNav("prev")}
        disabled={!onScroller}
        className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={onScroller ? "Previous card" : "Open the scroller to navigate"}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Prev</span>
      </button>
      <button
        type="button"
        onClick={randomSource}
        className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
        title="Jump to a random scroll source"
      >
        <Shuffle className="h-3.5 w-3.5" />
        Random
      </button>
      <button
        type="button"
        onClick={() => emitScrollerNav("next")}
        disabled={!onScroller}
        className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={onScroller ? "Next card" : "Open the scroller to navigate"}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <span className="ml-auto text-[10px] font-mono text-zinc-600" title={`scroller v${pkg.version}`}>
        v{pkg.version}
      </span>
      <a
        href="https://github.com/flexappdev/scroller"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
        title="Source on GitHub"
      >
        <Github className="h-3.5 w-3.5" />
        <span>GitHub</span>
      </a>
      <a
        href="/about"
        className="hidden md:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
        title="About Scroller"
      >
        <Info className="h-3.5 w-3.5" />
        <span>About</span>
      </a>
      <a
        href="/admin"
        className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
        title="Account / admin"
      >
        <User className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Account</span>
      </a>
    </footer>
  );
}
