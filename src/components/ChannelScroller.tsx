"use client";

import Link from "next/link";
import { ExternalLink, Grid3X3, Home, Rows3, Tv, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChannelProfile, RuntimeItem } from "@/lib/ms-scroll-runtime";

const FALLBACKS = [
  "from-fuchsia-500 via-pink-600 to-zinc-950",
  "from-cyan-500 via-blue-700 to-zinc-950",
  "from-amber-400 via-orange-600 to-zinc-950",
  "from-violet-500 via-indigo-700 to-zinc-950",
  "from-emerald-400 via-teal-700 to-zinc-950",
];

function Media({ item, index, active = false, compact = false }: { item: RuntimeItem; index: number; active?: boolean; compact?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || compact) return;
    if (active) void video.play().catch(() => undefined);
    else video.pause();
  }, [active, compact, item.video]);

  if (item.video) {
    return (
      <video
        ref={ref}
        src={item.video}
        poster={item.image}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        preload={compact ? "none" : "metadata"}
      />
    );
  }

  if (item.image) {
    const safe = item.image.replaceAll('"', "%22");
    return <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${safe}")` }} />;
  }

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${FALLBACKS[index % FALLBACKS.length]}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${compact ? "text-3xl" : "text-[20vw]"} font-black tracking-[-0.08em] text-white/10`}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

function Story({ item, index, total, onOpen }: { item: RuntimeItem; index: number; total: number; onOpen: (item: RuntimeItem) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting && entry.intersectionRatio >= 0.55),
      { threshold: [0.25, 0.55, 0.8] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} onClick={() => onOpen(item)} className="relative h-[100dvh] snap-start cursor-pointer overflow-hidden bg-zinc-950">
      <Media item={item} index={index} active={active} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/35" />
      <div className="absolute inset-x-0 bottom-0 max-w-4xl p-6 pb-10 md:p-10 md:pb-14">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
          {item.packName} · {String(index + 1).padStart(2, "0")}/{total}
        </p>
        <h2 className="mt-3 text-5xl font-semibold leading-[0.92] tracking-[-0.04em] md:text-7xl">{item.title}</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 md:text-lg">{item.hook || item.content}</p>
        <button type="button" className="mt-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur hover:bg-white hover:text-black">
          Open details
        </button>
      </div>
      <span className="absolute bottom-7 right-5 text-[9px] uppercase tracking-[0.2em] text-white/30">swipe ↑</span>
    </section>
  );
}

function Drawer({ item, channel, onClose }: { item: RuntimeItem | null; channel: ChannelProfile; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <>
      <button type="button" aria-label="Close details" onClick={onClose} className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-[2px]" />
      <aside className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-[460px] flex-col overflow-y-auto border-l border-white/10 bg-zinc-950 text-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">{channel.name}</p>
            <p className="mt-1 text-sm font-semibold">{item.packName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-white/10 p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 p-6">
          <h2 className="text-4xl font-semibold leading-[0.98] tracking-tight">{item.title}</h2>
          {item.hook ? <p className="mt-4 text-lg leading-snug text-white/75">{item.hook}</p> : null}
          <p className="mt-6 whitespace-pre-line text-sm leading-7 text-white/60">{item.content}</p>
          {item.explanation ? <p className="mt-6 border-t border-white/10 pt-6 text-sm leading-7 text-white/60">{item.explanation}</p> : null}
          {item.tags.length ? (
            <div className="mt-7 flex flex-wrap gap-2">
              {item.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50">#{tag}</span>)}
            </div>
          ) : null}
        </div>
        <div className="sticky bottom-0 space-y-2 border-t border-white/10 bg-zinc-950/95 p-4 backdrop-blur">
          {item.cta ? (
            <a href={item.cta.url} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-black" style={{ backgroundColor: channel.accent }}>
              {item.cta.label} <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
          <Link href={item.href} className="flex w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 hover:bg-white/10">
            Open focused feed
          </Link>
        </div>
      </aside>
    </>
  );
}

export default function ChannelScroller({ items, channel }: { items: RuntimeItem[]; channel: ChannelProfile }) {
  const [mode, setMode] = useState<"scroll" | "grid">("scroll");
  const [selected, setSelected] = useState<RuntimeItem | null>(null);

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-white">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[105] flex items-start justify-between p-3 md:p-4">
        <div className="pointer-events-auto flex gap-2">
          <Link href="/" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium backdrop-blur-xl">
            <Home className="h-3.5 w-3.5" /> {channel.name}
          </Link>
          <Link href="/tv" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium backdrop-blur-xl">
            <Tv className="h-3.5 w-3.5" /> TV
          </Link>
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-full border border-white/15 bg-black/45 p-1 backdrop-blur-xl">
          <button type="button" onClick={() => setMode("scroll")} aria-label="Scroll view" className={`rounded-full p-2 ${mode === "scroll" ? "bg-white text-black" : "text-white/60"}`}><Rows3 className="h-4 w-4" /></button>
          <button type="button" onClick={() => setMode("grid")} aria-label="Grid view" className={`rounded-full p-2 ${mode === "grid" ? "bg-white text-black" : "text-white/60"}`}><Grid3X3 className="h-4 w-4" /></button>
        </div>
      </header>

      {mode === "scroll" ? (
        <main className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-y-contain">
          {items.map((item, index) => <Story key={item.id} item={item} index={index} total={items.length} onOpen={setSelected} />)}
        </main>
      ) : (
        <main className="h-[100dvh] overflow-y-auto px-2 pb-10 pt-20">
          <div className="mx-auto mb-3 flex max-w-[1900px] items-end justify-between px-1">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">{channel.name} Grid</p>
              <h1 className="mt-1 text-2xl font-semibold">{items.length.toLocaleString()} items</h1>
            </div>
            <p className="text-[9px] text-white/30">10K-ready · video → image → poster</p>
          </div>
          <div className="mx-auto grid max-w-[1900px] gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))" }}>
            {items.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelected(item)}
                className="relative aspect-[4/5] overflow-hidden rounded-lg border border-white/[0.07] bg-zinc-900 text-left hover:border-white/30"
                style={{ contentVisibility: "auto", containIntrinsicSize: "135px 169px" }}
              >
                <Media item={item} index={index} compact />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <p className="line-clamp-1 text-[8px] uppercase tracking-wider text-white/40">{item.packName}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight">{item.title}</p>
                </div>
              </button>
            ))}
          </div>
        </main>
      )}

      <Drawer item={selected} channel={channel} onClose={() => setSelected(null)} />
    </div>
  );
}
