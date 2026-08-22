"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { SCROLL_SOURCES, sourceById } from "@/lib/scroll/sources";

export default function StickyHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = (() => {
    if (pathname === "/" && params.get("source")) return sourceById(params.get("source"));
    if (pathname === "/") return sourceById("all");
    const match = SCROLL_SOURCES.find((s) => !s.external && s.href.split("?")[0] === pathname);
    return match ?? sourceById("all");
  })();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-12 items-center gap-3 px-4 chrome-glass-top"
      style={{ left: "var(--sidebar-w, 200px)" }}
    >
      <Link href="/" className="flex items-baseline gap-2 transition-colors" style={{ color: "var(--foreground)" }}>
        <span className="text-sm font-semibold tracking-tight">Scroller</span>
        <span
          className="hidden md:inline text-[10px] font-mono"
          style={{ color: "var(--foreground-muted)", letterSpacing: "0.06em" }}
        >
          one feed · every source
        </span>
      </Link>
      <span style={{ color: "var(--foreground-muted)" }}>/</span>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono transition-colors"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-soft)",
            color: "var(--foreground-subtle)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "color-mix(in oklch, var(--accent) 45%, transparent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: active.accent }} />
          <span>{active.label}</span>
          <ChevronDown className="h-3 w-3" style={{ color: "var(--foreground-muted)" }} />
        </button>
        {open && (
          <div
            className="absolute left-0 top-full mt-1 w-64 rounded-lg overflow-hidden shadow-xl"
            style={{
              border: "1px solid var(--border)",
              background: "var(--popover)",
              backdropFilter: "blur(14px)",
            }}
          >
            <ul className="py-1">
              {SCROLL_SOURCES.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                    style={{
                      color: s.id === active.id ? "var(--accent)" : "var(--foreground-subtle)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.accent }} />
                    <span className="font-mono font-medium">{s.label}</span>
                    <span
                      className="ml-auto text-[10px] font-mono truncate"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      {s.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
