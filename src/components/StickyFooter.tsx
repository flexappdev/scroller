"use client";
import { useRouter, usePathname } from "next/navigation";
import { Shuffle, ChevronLeft, ChevronRight, User, Github, Info } from "lucide-react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";
import pkg from "../../package.json";
import ThemeToggle from "./ThemeToggle";

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

  const chipStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    background: "var(--surface-soft)",
    color: "var(--foreground-subtle)",
  };

  return (
    <footer
      className="fixed bottom-0 right-0 z-30 flex h-12 items-center justify-center gap-2 px-4 chrome-glass-bottom"
      style={{ left: "var(--sidebar-w, 200px)" }}
    >
      <button
        type="button"
        onClick={() => emitScrollerNav("prev")}
        disabled={!onScroller}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={chipStyle}
        title={onScroller ? "Previous card" : "Open the scroller to navigate"}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Prev</span>
      </button>
      <button
        type="button"
        onClick={randomSource}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          border: "1px solid color-mix(in oklch, var(--accent) 45%, transparent)",
          background: "color-mix(in oklch, var(--accent) 14%, transparent)",
          color: "var(--accent)",
        }}
        title="Jump to a random scroll source"
      >
        <Shuffle className="h-3.5 w-3.5" />
        Random
      </button>
      <button
        type="button"
        onClick={() => emitScrollerNav("next")}
        disabled={!onScroller}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={chipStyle}
        title={onScroller ? "Next card" : "Open the scroller to navigate"}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <a
          href="/version"
          className="text-[10px] font-mono transition-colors"
          style={{ color: "var(--foreground-muted)" }}
          title={`scroller v${pkg.version} — release notes`}
        >
          v{pkg.version}
        </a>
      </div>
      <a
        href="https://github.com/flexappdev/scroller"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors"
        style={chipStyle}
        title="Source on GitHub"
      >
        <Github className="h-3.5 w-3.5" />
        <span>GitHub</span>
      </a>
      <a
        href="/about"
        className="hidden md:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors"
        style={chipStyle}
        title="About Scroller"
      >
        <Info className="h-3.5 w-3.5" />
        <span>About</span>
      </a>
      <a
        href="/admin"
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors"
        style={chipStyle}
        title="Account / admin"
      >
        <User className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Account</span>
      </a>
    </footer>
  );
}
