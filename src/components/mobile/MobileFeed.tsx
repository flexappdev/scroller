"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, ChevronDown, Heart, Monitor, Share2, Sparkles, X } from "lucide-react";
import StructuredArticle from "./StructuredArticle";
import { createMobileFeed, MOBILE_SOURCE_ACCENTS, MOBILE_SOURCE_LABELS, type MobileFeedItem, type MobileSource } from "@/lib/mobile/adapters";
import type { Card } from "@/components/ScrollerFeed";

const LIKED_KEY = "scroller.mobile.liked.v1";
const SAVED_KEY = "scroller.mobile.saved.v1";
const POINTS_KEY = "scroller-points";

function readSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]") as string[]); } catch { return new Set(); }
}

function writeSet(key: string, value: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...value])); } catch {}
}

export default function MobileFeed({ cards }: { cards: Card[] }) {
  const allItems = useMemo(() => createMobileFeed(cards), [cards]);
  const [source, setSource] = useState<MobileSource | "all">("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<MobileFeedItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState(0);
  const viewed = useRef<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => source === "all" ? allItems : allItems.filter((item) => item.source === source), [allItems, source]);
  const counts = useMemo(() => allItems.reduce<Partial<Record<MobileSource, number>>>((result, item) => {
    result[item.source] = (result[item.source] || 0) + 1;
    return result;
  }, {}), [allItems]);

  useEffect(() => {
    setLiked(readSet(LIKED_KEY));
    setSaved(readSet(SAVED_KEY));
    const stored = Number(localStorage.getItem(POINTS_KEY) || 0);
    setPoints(Number.isFinite(stored) ? stored : 0);
  }, []);

  const addPoints = useCallback((amount: number) => {
    setPoints((current) => {
      const next = current + amount;
      try { localStorage.setItem(POINTS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const item = items[activeIndex];
    if (!item || viewed.current.has(item.id)) return;
    viewed.current.add(item.id);
    addPoints(1);
  }, [activeIndex, addPoints, items]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      const next = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
      setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  const changeSource = (next: MobileSource | "all") => {
    setSource(next);
    setActiveIndex(0);
    setPickerOpen(false);
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  const toggle = (kind: "liked" | "saved", id: string) => {
    const setter = kind === "liked" ? setLiked : setSaved;
    const key = kind === "liked" ? LIKED_KEY : SAVED_KEY;
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else { next.add(id); addPoints(kind === "liked" ? 2 : 3); }
      writeSet(key, next);
      return next;
    });
  };

  return (
    <div data-testid="mobile-feed" className="mobile-feed fixed inset-0 z-50 overflow-hidden bg-black" style={{ color: "white" }}>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <button type="button" onClick={() => setPickerOpen(true)} className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full" style={{ background: source === "all" ? "#10b981" : MOBILE_SOURCE_ACCENTS[source] }} />
          {source === "all" ? "Every source" : MOBILE_SOURCE_LABELS[source]}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 text-xs font-bold text-white/90 backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5 text-amber-300" /> {points.toLocaleString()}</span>
          <Link href="/?view=desktop" prefetch={false} className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/90 backdrop-blur-xl" aria-label="Open desktop view"><Monitor className="h-[18px] w-[18px]" /></Link>
        </div>
      </header>

      <div ref={feedRef} data-testid="mobile-snap-container" className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <FeedCard key={item.id} item={item} index={index} total={items.length} active={index === activeIndex} liked={liked.has(item.id)} saved={saved.has(item.id)} onOpen={() => setSelected(item)} onLike={() => toggle("liked", item.id)} onSave={() => toggle("saved", item.id)} />
        ))}
      </div>

      {pickerOpen && <SourcePicker selected={source} counts={counts} onSelect={changeSource} onClose={() => setPickerOpen(false)} />}
      {selected && <StructuredArticle item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FeedCard({ item, index, total, active, liked, saved, onOpen, onLike, onSave }: { item: MobileFeedItem; index: number; total: number; active: boolean; liked: boolean; saved: boolean; onOpen: () => void; onLike: () => void; onSave: () => void }) {
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: item.title, text: item.description, url: item.externalUrl });
      else await navigator.clipboard.writeText(item.externalUrl);
    } catch {}
  };

  return (
    <section className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-zinc-950" aria-label={`${item.sourceLabel}: ${item.title}`}>
      <div className="absolute inset-0" style={{ background: item.fallback }} />
      {item.image && <img src={item.image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading={active ? "eager" : "lazy"} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.06)_31%,rgba(0,0,0,.38)_58%,rgba(0,0,0,.96)_100%)]" />
      <button type="button" onClick={onOpen} className="absolute inset-0 z-[2] cursor-pointer" aria-label={`Open ${item.title}`} />

      <div className="absolute right-3 z-[6] flex flex-col gap-4" style={{ bottom: "calc(205px + env(safe-area-inset-bottom))" }}>
        <Action icon={Heart} label={liked ? "Liked" : "Like"} active={liked} accent="#f472b6" onClick={onLike} />
        <Action icon={BookOpen} label="Read" onClick={onOpen} />
        <Action icon={Bookmark} label={saved ? "Saved" : "Save"} active={saved} accent="#34d399" onClick={onSave} />
        <Action icon={Share2} label="Share" onClick={share} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] pr-[82px]" style={{ paddingLeft: 18, paddingBottom: "calc(34px + env(safe-area-inset-bottom))" }}>
        <div className="mb-2 flex items-center gap-2"><span className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white/90 backdrop-blur" style={{ borderColor: `${item.accent}99`, background: `${item.accent}38` }}>{item.sourceLabel}</span><span className="text-[10px] font-bold tabular-nums text-white/60">{index + 1} / {total}</span></div>
        <h1 className="line-clamp-3 text-[clamp(2rem,9vw,3.5rem)] font-black leading-[0.94] tracking-[-0.045em] text-white/95 [text-shadow:0_2px_18px_rgba(0,0,0,.65)]">{item.title}</h1>
        <p className="mt-3 line-clamp-3 text-[15px] font-medium leading-6 text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,.75)]">{item.description}</p>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-white/65"><span>{item.meta}</span><span aria-hidden>·</span><span style={{ color: item.accent }}>Tap to explore</span></div>
      </div>
    </section>
  );
}

function Action({ icon: Icon, label, active = false, accent = "#fff", onClick }: { icon: typeof Heart; label: string; active?: boolean; accent?: string; onClick: () => void | Promise<void> }) {
  return (
    <button type="button" onClick={(event) => { event.stopPropagation(); void onClick(); }} className="flex min-w-12 flex-col items-center gap-1 text-white/90" style={{ color: active ? accent : undefined }}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl"><Icon className="h-5 w-5" fill={active ? "currentColor" : "none"} strokeWidth={active ? 2.4 : 1.9} /></span>
      <span className="text-[10px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.8)]">{label}</span>
    </button>
  );
}

function SourcePicker({ selected, counts, onSelect, onClose }: { selected: MobileSource | "all"; counts: Partial<Record<MobileSource, number>>; onSelect: (source: MobileSource | "all") => void; onClose: () => void }) {
  const sources = Object.keys(MOBILE_SOURCE_LABELS) as MobileSource[];
  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Choose a source" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 text-zinc-950" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300" />
        <div className="mb-4 flex items-center justify-between px-1"><h2 className="text-xl font-black tracking-tight">Choose your scroll</h2><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100" aria-label="Close source picker"><X className="h-5 w-5" /></button></div>
        <div className="grid grid-cols-2 gap-2">
          <SourceOption label="Every source" count={Object.values(counts).reduce((sum, count) => sum + (count || 0), 0)} accent="#10b981" active={selected === "all"} onClick={() => onSelect("all")} />
          {sources.filter((itemSource) => counts[itemSource]).map((itemSource) => <SourceOption key={itemSource} label={MOBILE_SOURCE_LABELS[itemSource]} count={counts[itemSource] || 0} accent={MOBILE_SOURCE_ACCENTS[itemSource]} active={selected === itemSource} onClick={() => onSelect(itemSource)} />)}
        </div>
      </div>
    </div>
  );
}

function SourceOption({ label, count, accent, active, onClick }: { label: string; count: number; accent: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left ${active ? "border-black bg-black text-white/95" : "border-zinc-200 bg-zinc-50 text-zinc-900"}`}><span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} /><span className="min-w-0 flex-1 text-sm font-bold">{label}</span><span className={`text-xs font-semibold ${active ? "text-white/55" : "text-zinc-400"}`}>{count}</span></button>;
}
