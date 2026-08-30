"use client";

import Link from "next/link";
import { X, Layers3 } from "lucide-react";
import { useEffect } from "react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";

export default function BrowseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Browse all Scroller sources"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTopWidth: 3, borderTopColor: "var(--accent)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-zinc-900/80 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          aria-label="Close browse"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent)" }}>
            <Layers3 className="h-4 w-4 text-white" />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] font-mono" style={{ color: "var(--accent)" }}>Browse</div>
            <h2 className="text-lg font-semibold text-zinc-100">Every source in Scroller</h2>
          </div>
        </header>

        <section className="p-3 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SCROLL_SOURCES.map((s) => (
              <Link
                key={s.id}
                href={s.id === "all" ? "/browse" : s.href}
                onClick={onClose}
                className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-600"
                style={{ borderLeftWidth: 3, borderLeftColor: s.accent }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-mono" style={{ color: s.accent }}>
                      {s.id}
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-sm font-semibold text-zinc-100 group-hover:text-white">{s.label}</h3>
                  <p className="mt-1 text-[12px] leading-5 text-zinc-400 line-clamp-2">{s.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/browse"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
              style={{ borderColor: "var(--accent)", background: "color-mix(in oklch, var(--accent) 18%, transparent)", color: "var(--accent)" }}
            >
              <Layers3 className="h-4 w-4" />
              Open combined /browse
            </Link>
            <Link
              href="/"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              Home feed
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
