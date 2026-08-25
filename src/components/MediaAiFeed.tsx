"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Layers3, Share2, Shuffle, Volume2, VolumeX } from "lucide-react";
import type { MediaAiArticle, MediaAiPage } from "@/lib/mediai";

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

  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
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
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    if (!shuffleNonce) return items;
    return shuffled(items);
    // shuffleNonce intentionally forces a fresh shuffled copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, shuffleNonce]);

  const loadMore = useCallback(async () => {
    if (nextOffset == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/mediai?offset=${nextOffset}&limit=220`);
      if (!response.ok) return;
      const page = (await response.json()) as MediaAiPage;
      setItems((current) => mergeArticles(current, page.items));
      setNextOffset(page.nextOffset);
    } catch (error) {
      console.warn("[mediai-feed] load more failed", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextOffset]);

  useEffect(() => {
    if (activeIndex >= visibleItems.length - 6) void loadMore();
  }, [activeIndex, loadMore, visibleItems.length]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      const next = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
      setActiveIndex(Math.max(0, Math.min(visibleItems.length - 1, next)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [visibleItems.length]);

  const shuffle = () => {
    setShuffleNonce((value) => value + 1);
    setActiveIndex(0);
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  if (visibleItems.length === 0) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-black px-8 text-white">
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
    <main className="fixed inset-0 z-[100] overflow-hidden bg-black text-white" data-testid="mediai-feed">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        <div className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-pink-500" />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">MediaAI</span>
          <span className="text-[10px] font-bold text-white/45">{visibleItems.length}{nextOffset != null ? "+" : ""}</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" onClick={shuffle} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/85 backdrop-blur-xl" aria-label="Shuffle MediaAI feed">
            <Shuffle className="h-[18px] w-[18px]" />
          </button>
          <Link href="/browse" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/85 backdrop-blur-xl" aria-label="Open all Scroller sources">
            <Layers3 className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>

      <div ref={feedRef} className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleItems.map((item, index) => (
          <MediaCard
            key={item.id}
            item={item}
            index={index}
            total={visibleItems.length}
            active={index === activeIndex}
          />
        ))}
        {loadingMore && <div className="h-1 w-full bg-pink-500/60" aria-label="Loading more MediaAI items" />}
      </div>
    </main>
  );
}

function MediaCard({ item, index, total, active }: { item: MediaAiArticle; index: number; total: number; active: boolean }) {
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

      <div className="absolute right-3 z-20 flex flex-col gap-4" style={{ bottom: "calc(170px + env(safe-area-inset-bottom))" }}>
        {item.audioUrl && (
          <Action label={audioPlaying ? "Mute" : "Listen"} onClick={toggleAudio}>
            {audioPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Action>
        )}
        <Action label="Share" onClick={share}><Share2 className="h-5 w-5" /></Action>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex min-w-12 flex-col items-center gap-1 text-white/90" aria-label={`Open article for ${item.topic}`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl"><ExternalLink className="h-5 w-5" /></span>
          <span className="text-[10px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.8)]">Article</span>
        </a>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pr-[78px]" style={{ paddingLeft: 18, paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-pink-400/50 bg-pink-500/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-pink-100 backdrop-blur">Wikipedia · MediaAI</span>
          <span className="text-[10px] font-bold tabular-nums text-white/55">{index + 1} / {total}</span>
        </div>
        <h1 className="line-clamp-3 text-[clamp(2.15rem,10vw,4.4rem)] font-black leading-[0.92] tracking-[-0.05em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,.7)]">{item.topic}</h1>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-white/55">{mediaLabel || `${item.assetCount} generated assets`}</p>
        <p className="mt-2 text-sm font-medium text-white/65">Swipe for the next Wikipedia topic.</p>
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
