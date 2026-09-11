"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, Info, Share2, Volume2, VolumeX } from "lucide-react";
import type { MediaiArticle, MediaiPage } from "@/lib/mediai";
import MediaDetailSheet from "./MediaDetailSheet";
import AdSenseFeedCard from "./AdSenseFeedCard";
import CardActions from "./CardActions";
import { pushHistory } from "@/lib/likes-saves";

function mergeArticles(current: MediaiArticle[], incoming: MediaiArticle[]): MediaiArticle[] {
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

export default function MediaiFeed({
  initial,
  showAds = false,
  adsenseClient,
  adsenseSlot,
}: {
  initial: MediaiPage;
  showAds?: boolean;
  adsenseClient?: string | null;
  adsenseSlot?: string | null;
}) {
  const adsEnabled = Boolean(showAds && adsenseClient && adsenseSlot);
  const [items, setItems] = useState<MediaiArticle[]>(initial.items);
  const [nextOffset, setNextOffset] = useState<number | null>(initial.nextOffset);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detail, setDetail] = useState<MediaiArticle | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const rows = JSON.parse(localStorage.getItem("scroller:saved") || "[]") as Array<{ id?: string }>;
      setSavedIds(new Set(rows.map((row) => row.id).filter((id): id is string => Boolean(id))));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  const toggleSave = useCallback((item: MediaiArticle) => {
    try {
      const key = "scroller:saved";
      const rows = JSON.parse(localStorage.getItem(key) || "[]") as Array<{
        id: string;
        topic: string;
        sourceUrl: string;
        imageUrl: string | null;
        savedAt: number;
      }>;
      const exists = rows.some((row) => row.id === item.id);
      const next = exists
        ? rows.filter((row) => row.id !== item.id)
        : [{ id: item.id, topic: item.topic, sourceUrl: item.sourceUrl, imageUrl: item.imageUrl, savedAt: Date.now() }, ...rows];
      localStorage.setItem(key, JSON.stringify(next.slice(0, 250)));
      setSavedIds(new Set(next.map((row) => row.id)));
      window.dispatchEvent(new CustomEvent("scroller:saved-changed"));
    } catch {
      // Saving is a progressive enhancement; the feed still works if storage is unavailable.
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetail(null);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("card")) return;
    url.searchParams.delete("card");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const openDetail = useCallback((item: MediaiArticle) => {
    setDetail((current) => (current?.id === item.id ? null : item));
    pushHistory(`mediai:${item.id}`, { title: item.topic, kind: "mediai", href: `/items/${encodeURIComponent(`wiki:${item.assetId}`)}` });
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const already = url.searchParams.get("card") === item.id;
    if (already) url.searchParams.delete("card");
    else url.searchParams.set("card", item.id);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const loadMore = useCallback(async () => {
    if (nextOffset == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/mediai?offset=${nextOffset}&limit=220`);
      if (!response.ok) return;
      const page = (await response.json()) as MediaiPage;
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
    if (!el || typeof IntersectionObserver === "undefined") return;
    // v3.4 — IO picks the card the user is actually on, which stays correct
    // under fast swipes where scrollTop maths lags a frame or two.
    const sections = Array.from(el.querySelectorAll<HTMLElement>("[data-card-index]"));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number(visible.target.getAttribute("data-card-index"));
        if (Number.isFinite(idx)) setActiveIndex(idx);
      },
      { root: el, threshold: [0.5, 0.75, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
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
    const targetCard = el.querySelector<HTMLElement>(`[data-card-index="${target}"]`);
    targetCard?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(target);
  }, [items.length]);

  // Links copied from the detail sheet are real restorable deep links. The
  // topic card is part of the initial Mediai window, even though its display
  // order is shuffled on each request.
  useEffect(() => {
    const cardId = new URLSearchParams(window.location.search).get("card");
    if (!cardId) return;
    const index = items.findIndex((item) => item.id === cardId);
    if (index < 0) return;
    setDetail(items[index]);
    goTo(index);
  }, [goTo, items]);

  const shuffle = useCallback(() => {
    setRefreshing(true);
    setItems((current) => shuffled(current));
    setActiveIndex(0);
    feedRef.current?.scrollTo({ top: 0, behavior: "instant" });
    window.setTimeout(() => setRefreshing(false), 220);
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-400">Scroller · Mediai</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">No Mediai rows yet.</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">The home feed now reads AIDB.media_baseline directly. Check the Mediai Mongo sync if this stays empty.</p>
          <Link href="/browse" className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white/85">Open legacy browser</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-20 overflow-hidden bg-black text-white" data-testid="mediai-feed" aria-busy={refreshing}>
      <div
        ref={feedRef}
        className={[
          "h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "transition-[opacity,transform] duration-200",
          refreshing ? "scale-[0.992] opacity-60" : "scale-100 opacity-100",
        ].join(" ")}
      >
        {items.map((item, index) => (
          <Fragment key={item.id}>
            <MediaCard
              item={item}
              index={index}
              total={items.length}
              active={index === activeIndex}
              onOpenDetail={() => openDetail(item)}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSave(item)}
            />
            {adsEnabled && (index + 1) % 20 === 0 ? (
              <AdSenseFeedCard
                client={adsenseClient!}
                slot={adsenseSlot!}
                afterItem={index + 1}
              />
            ) : null}
          </Fragment>
        ))}
        {loadingMore && <div className="h-1 w-full bg-pink-500/60" aria-label="Loading more Mediai items" />}
      </div>
      <MediaDetailSheet item={detail} onClose={closeDetail} />
    </main>
  );
}

function MediaCard({
  item,
  index,
  total,
  active,
  onOpenDetail,
  saved,
  onToggleSave,
}: {
  item: MediaiArticle;
  index: number;
  total: number;
  active: boolean;
  onOpenDetail: () => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
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
    <section data-card-index={index} className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-zinc-950" aria-label={item.topic}>
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
        <Action label={saved ? "Saved" : "Save"} onClick={onToggleSave}>
          <Bookmark className={saved ? "h-5 w-5 fill-current" : "h-5 w-5"} />
        </Action>
        {item.audioUrl && (
          <Action label={audioPlaying ? "Mute" : "Listen"} onClick={toggleAudio}>
            {audioPlaying ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Action>
        )}
        <Action label="Share" onClick={share}><Share2 className="h-5 w-5" /></Action>
        <Link
          href={`/items/${encodeURIComponent(`wiki:${item.assetId}`)}/scroller`}
          className="flex min-w-12 flex-col items-center gap-1 text-white/90"
          aria-label={`Open article page for ${item.topic}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl"><ExternalLink className="h-5 w-5" /></span>
          <span className="text-[10px] font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.8)]">Article</span>
        </Link>
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
          <span className="rounded-full border border-[color-mix(in_oklch,var(--accent)_52%,transparent)] bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--accent)] backdrop-blur">Wikipedia · Mediai</span>
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
