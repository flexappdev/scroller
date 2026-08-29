"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Info, Share2, Volume2, VolumeX } from "lucide-react";
import type { MediaAiArticle, MediaAiPage } from "@/lib/mediai";
import MediaDetailSheet from "./MediaDetailSheet";

function mergeArticles(current: MediaAiArticle[], incoming: MediaAiArticle[]): MediaAiArticle[] {
  const byId = new Map(current.map((item) => [item.id, { ...item, videoUrls: [...item.videoUrls] }]));

  for (const item of incoming) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, { ...item, videoUrls: [...item.videoUrls] });
      continue;
    }

    existing.imageUrl ||= item.imageUrl;
    existing.audioUrl ||= item.audioUrl;
    existing.sourceUrl ||= item.sourceUrl;
    existing.updatedAt = Math.max(existing.updatedAt, item.updatedAt);
    existing.assetCount += item.assetCount;
    existing.videoUrls = [...new Set([...existing.videoUrls, ...item.videoUrls])];
  }

  // Map preserves the existing display order. New pages append without moving
  // the card currently under the user's finger.
  return [...byId.values()];
}

function shuffled<T>(input: T[]): T[] {
  const next = [...input];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default function MediaAiFeed({ initial }: { initial: MediaAiPage }) {
  const [items, setItems] = useState<MediaAiArticle[]>(initial.items);
  const [nextOffset, setNextOffset] = useState<number | null>(initial.nextOffset);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detail, setDetail] = useState<MediaAiArticle | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (nextOffset == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/mediai?offset=${nextOffset}&limit=220`);
      if (!response.ok) return;
      const page = (await response.json()) as MediaAiPage;
      setItems((current) => mergeArticles(current, shuffled(page.items)));
      setNextOffset(page.nextOffset);
    } catch (error) {
      console.warn("[mediai-feed] load more failed", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextOffset]);

  useEffect(() => {
    if (activeIndex >= items.length - 6) void loadMore();
  }, [activeIndex, items.length, loadMore]);

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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("scroller:position", { detail: { index: activeIndex, total: items.length } }));
  }, [activeIndex, items.length]);

  const goTo = useCallback((index: number) => {
    const el = feedRef.current;
    if (!el || items.length === 0) return;
    // v3.2 — wrap around so prev on card 0 lands on the last card
    // and next on the last card lands on card 0. Always scrollable.
    const total = items.length;
    const target = ((index % total) + total) % total;
    el.scrollTo({ top: target * el.clientHeight, behavior: "smooth" });
    setActiveIndex(target);
  }, [items.length]);

  const shuffle = useCallback(() => {
    setItems((current) => shuffled(current));
    setActiveIndex(0);
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    function onNavigate(event: Event) {
      const detail = (event as CustomEvent<{ direction: "prev" | "next" }>).detail;
      goTo(activeIndex + (detail?.direction === "prev" ? -1 : 1));
    }
    function onRandom() {
      shuffle();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        goTo(activeIndex + 1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        goTo(activeIndex - 1);
      }
    }
    window.addEventListener("scroller:nav", onNavigate as EventListener);
    window.addEventListener("scroller:random", onRandom);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroller:nav", onNavigate as EventListener);
      window.removeEventListener("scroller:random", onRandom);
      window.removeEventListener("keydown", onKey);
    };
  }, [activeIndex, goTo, shuffle]);

  if (items.length === 0) {
    return (
      <main className="fixed inset-0 z-20 flex items-center justify-center bg-black px-8 text-white">
        <div className="max-w-sm text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-400">Scroller · MediaAI</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">No MediaAI rows yet.</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">The home feed now reads AIDB.media_baseline directly. Check the MediaAI Mongo sync if this stays empty.</p>
          <Link href="/browse" className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/85">Open legacy browser</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-20 overflow-hidden bg-black text-white" data-testid="mediai-feed">
      <div ref={feedRef} className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            active={index === activeIndex}
            onOpenDetail={() => setDetail(item)}
          />
        ))}
        {loadingMore && <div className="h-1 w-full bg-pink-500/60" aria-label="Loading more MediaAI items" />}
      </div>
      <MediaDetailSheet item={detail} onClose={() => setDetail(null)} />
    </main>
  );
}

function MediaCard({ item, index, total, active, onOpenDetail }: { item: MediaAiArticle; index: number; total: number; active: boolean; onOpenDetail: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const videoUrl = item.videoUrls.length ? item.videoUrls[index % item.videoUrls.length] : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) void video.play().catch(() => undefined);
    else video.pause();
  }, [active, videoUrl]);

  useEffect(() => {
    if (active) return;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setAudioPlaying(false);
  }, [active]);

  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setAudioPlaying(true);
      } catch {}
    } else {
      audio.pause();
      setAudioPlaying(false);
    }
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: item.topic, url: item.sourceUrl });
      else await navigator.clipboard.writeText(item.sourceUrl);
    } catch {}
  };

  const mediaLabel = [
    item.imageUrl ? "image" : null,
    item.videoUrls.length ? `${item.videoUrls.length} motion` : null,
    item.audioUrl ? "audio" : null,
  ].filter(Boolean).join(" · ");

  return (
    <section className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-zinc-950" aria-label={item.topic}>
      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`Open details for ${item.topic}`}
        className="absolute inset-0 z-[5] cursor-pointer bg-transparent"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#3f0a2a_0%,#111_48%,#000_100%)]" />
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading={active ? "eager" : "lazy"} />
      )}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={item.imageUrl || undefined}
          muted
          loop
          playsInline
          preload={active ? "auto" : "metadata"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.52)_0%,rgba(0,0,0,.04)_34%,rgba(0,0,0,.25)_58%,rgba(0,0,0,.94)_100%)]" />

      {item.audioUrl && <audio ref={audioRef} src={item.audioUrl} preload="none" onEnded={() => setAudioPlaying(false)} />}

      <div className="absolute right-3 z-20 flex flex-col gap-4" style={{ bottom: "calc(184px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <Action label="Details" onClick={onOpenDetail}><Info className="h-5 w-5" /></Action>
        {item.audioUrl && (
          <Action label={audioPlaying ? "Mute" : "Listen"} onClick={toggleAudio}>
            {audioPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Action>
        )}
        <Action label="Share" onClick={share}><Share2 className="h-5 w-5" /></Action>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex min-w-12 flex-col items-center gap-1 text-white/90" aria-label={`Open article for ${item.topic}`} onClick={(e) => e.stopPropagation()}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl"><ExternalLink className="h-5 w-5" /></span>
          <span className="text-[10px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.8)]">Article</span>
        </a>
      </div>

      {/* v3.2 — sits between sticky header (56px) and sticky footer (~72px);
          title clamped to two lines so the tagline is always visible. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 flex flex-col justify-end pr-[78px]"
        style={{
          top: "calc(56px + env(safe-area-inset-top))",
          bottom: "calc(84px + env(safe-area-inset-bottom))",
          paddingLeft: 18,
          paddingBottom: 12,
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[color-mix(in_oklch,var(--accent)_52%,transparent)] bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--accent)] backdrop-blur">Wikipedia · MediaAI</span>
          <span className="text-[10px] font-bold tabular-nums text-white/55">{index + 1} / {total}</span>
        </div>
        <h1 className="scroller-display line-clamp-2 max-w-5xl text-[clamp(1.5rem,6.5vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.055em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.75)]">{item.topic}</h1>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]/85">{mediaLabel || `${item.assetCount} generated assets`}</p>
        <p className="mt-1 text-sm font-medium text-white/70 line-clamp-1">Tap card for details · ↑↓ or swipe to scroll.</p>
      </div>
    </section>
  );
}

function Action({ label, onClick, children }: { label: string; onClick: () => void | Promise<void>; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => void onClick()} className="flex min-w-12 flex-col items-center gap-1 text-white/90">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl">{children}</span>
      <span className="text-[10px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.8)]">{label}</span>
    </button>
  );
}
