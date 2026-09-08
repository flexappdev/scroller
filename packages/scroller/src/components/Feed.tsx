"use client";

import { useRef, useEffect } from "react";
import type { ContentItem } from "../types/ContentItem";
import { Card, accentFor } from "./Cards";

export interface FeedProps {
  items: ContentItem[];
  embedded?: boolean;
  onOpenItem?: (item: ContentItem, index: number) => void;
}

export function Feed({ items, embedded = false, onOpenItem }: FeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onNav(e: Event) {
      const ce = e as CustomEvent<{ direction: "prev" | "next" }>;
      const el = containerRef.current;
      if (!el) return;
      const cardHeight = el.clientHeight;
      const current = Math.round(el.scrollTop / cardHeight);
      const target = ce.detail.direction === "next" ? current + 1 : current - 1;
      const clamped = Math.max(0, Math.min(items.length - 1, target));
      el.scrollTo({ top: clamped * cardHeight, behavior: "smooth" });
    }
    window.addEventListener("scroller:nav", onNav as EventListener);
    return () => window.removeEventListener("scroller:nav", onNav as EventListener);
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className={`w-full snap-y snap-mandatory overflow-y-scroll ${
        embedded ? "h-[calc(100dvh-12rem)]" : "h-[calc(100dvh-6rem)]"
      }`}
    >
      {items.map((item, i) => (
        <section
          key={`${item.kind}-${item.id}-${i}`}
          className={`relative flex w-full snap-start items-center justify-center bg-zinc-950 p-4 cursor-pointer ${
            embedded ? "h-[calc(100dvh-12rem)]" : "h-[calc(100dvh-6rem)]"
          }`}
          style={{ borderLeftWidth: 4, borderLeftColor: accentFor(item) }}
          onClick={() => onOpenItem?.(item, i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenItem?.(item, i); } }}
        >
          <div className="absolute right-4 top-4 text-[10px] uppercase tracking-wider text-zinc-500 font-mono pointer-events-none">
            {item.kind} · {i + 1}/{items.length}
          </div>
          <Card item={item} />
        </section>
      ))}
    </div>
  );
}
