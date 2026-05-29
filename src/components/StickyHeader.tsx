"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Dices, ChevronDown } from "lucide-react";
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
    <header className="fixed top-0 right-0 z-30 flex h-12 items-center gap-3 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md px-4" style={{ left: "var(--sidebar-w, 180px)" }}>
      <Link href="/" className="flex items-center gap-2 text-zinc-100 hover:text-emerald-400 transition-colors">
        <Dices className="h-5 w-5" style={{ color: "var(--app-accent)" }} />
        <span className="text-sm font-semibold tracking-tight">Scroller</span>
      </Link>
      <span className="text-zinc-700">/</span>
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-300 hover:border-emerald-700/50 transition-colors"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: active.accent }} />
          <span className="font-mono">{active.label}</span>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
            <ul className="py-1">
              {SCROLL_SOURCES.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-900 transition-colors ${
                      s.id === active.id ? "text-emerald-400" : "text-zinc-300"
                    }`}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.accent }} />
                    <span className="font-mono font-medium">{s.label}</span>
                    <span className="ml-auto text-[10px] text-zinc-600 truncate">{s.description}</span>
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
