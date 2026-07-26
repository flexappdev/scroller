"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  Monitor,
  ChevronUp,
  Sparkles,
  BookOpen,
  Globe,
} from "lucide-react";
import type { WikiCard } from "@/lib/fetchers";

const INITIAL_TARGET = 30;
const APPEND_BATCH = 8;
const NEAR_END = 3;
const LS_LIKED = "scroller.wiki.liked.v1";
const LS_SAVED = "scroller.wiki.saved.v1";

// Wikai-style gradient palette — matches the "coverFallback" kinds
// (aquatic / mechanism / aurora / manuscript / abyss).
const COVER_GRADIENTS = [
  "linear-gradient(135deg,#134e4a 0%,#0f172a 100%)", // aquatic
  "linear-gradient(135deg,#312e81 0%,#020617 100%)", // mechanism
  "linear-gradient(135deg,#4a044e 0%,#0a0a0a 100%)", // aurora
  "linear-gradient(135deg,#7c2d12 0%,#1c1917 100%)", // manuscript
  "linear-gradient(135deg,#0c4a6e 0%,#020617 100%)", // abyss
];

function coverFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
}

// Wikai's read-minutes / points heuristics.
function readMins(extract: string): number {
  return Math.max(1, Math.ceil((extract || "").length / 800));
}
function pointsFor(extract: string): number {
  return 5 + Math.min(10, Math.floor((extract || "").length / 200));
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set();
  } catch {
    return new Set();
  }
}
function saveSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch {}
}

export default function MobileWikiScroll({ initial }: { initial: WikiCard[] }) {
  const [articles, setArticles] = useState<WikiCard[]>(initial);
  const [activeIdx, setActiveIdx] = useState(0);
  const [appending, setAppending] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set(initial.map((a) => a.id)));

  useEffect(() => { setLiked(loadSet(LS_LIKED)); setSaved(loadSet(LS_SAVED)); }, []);

  const appendBatch = useCallback(async () => {
    if (appending) return;
    setAppending(true);
    try {
      const res = await fetch(`/api/wiki/scroll?n=${APPEND_BATCH}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { items: WikiCard[] };
      const fresh = j.items.filter((a) => !seenIds.current.has(a.id));
      fresh.forEach((a) => seenIds.current.add(a.id));
      if (fresh.length) setArticles((prev) => [...prev, ...fresh]);
    } finally { setAppending(false); }
  }, [appending]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      const h = el.clientHeight;
      if (!h) return;
      const idx = Math.round(el.scrollTop / h);
      if (idx !== activeIdx) {
        setActiveIdx(idx);
        // Award 1 point per new card seen — wikai parity.
        setPoints((p) => p + 1);
      }
      if (
        articles.length && !appending &&
        idx >= articles.length - NEAR_END &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - el.clientHeight
      ) {
        void appendBatch();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeIdx, articles.length, appending, appendBatch]);

  useEffect(() => {
    if (initial.length < INITIAL_TARGET) void appendBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else { next.add(id); setPoints((p) => p + 2); }
      saveSet(LS_LIKED, next);
      return next;
    });
  }, []);
  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else { next.add(id); setPoints((p) => p + 3); }
      saveSet(LS_SAVED, next);
      return next;
    });
  }, []);

  return (
    // z-50 lifts feed above AppNav (z-40) + Sticky*Header/Footer (z-30).
    <div className="fixed inset-0 z-50 bg-black text-white">
      <div
        ref={feedRef}
        className="h-[100dvh] w-full overflow-y-auto"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
      >
        {articles.map((a, i) => (
          <ArticleCard
            key={a.id}
            article={a}
            active={i === activeIdx}
            index={i}
            total={articles.length}
            liked={liked.has(a.id)}
            saved={saved.has(a.id)}
            onToggleLike={() => toggleLike(a.id)}
            onToggleSave={() => toggleSave(a.id)}
          />
        ))}
        {appending && (
          <div className="flex h-24 items-center justify-center text-xs text-white/60">
            Loading more articles…
          </div>
        )}
      </div>
      <TopBar points={points} />
    </div>
  );
}

function TopBar({ points }: { points: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-3 pt-[calc(env(safe-area-inset-top)+8px)]">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
        <Globe className="h-3 w-3 text-emerald-400" />
        Scroller · Wiki
      </div>
      <div className="flex items-center gap-2">
        <span className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
          <Sparkles className="h-3 w-3 text-amber-400" />
          {points.toLocaleString()} pts
        </span>
        <Link
          href="/?view=desktop"
          prefetch={false}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur hover:text-emerald-400"
        >
          <Monitor className="h-3 w-3" />
          <span className="hidden xs:inline">Desktop</span>
        </Link>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active = false,
  accent = "#e5e7eb",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; fill?: string }>;
  label: string;
  active?: boolean;
  accent?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className="flex flex-col items-center gap-1 text-white/90 select-none"
      style={{ color: active ? accent : undefined }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 backdrop-blur"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={active ? 2.4 : 1.8}
          fill={active ? "currentColor" : "none"}
        />
      </span>
      <span className="text-[10px] font-semibold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}>
        {label}
      </span>
    </button>
  );
}

function ArticleCard({
  article,
  active,
  index,
  total,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
}: {
  article: WikiCard;
  active: boolean;
  index: number;
  total: number;
  liked: boolean;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
}) {
  const gradient = useMemo(() => coverFor(article.id), [article.id]);
  const mins = readMins(article.extract);
  const pts = pointsFor(article.extract);

  const openInWikipedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(article.url, "_blank", "noopener,noreferrer");
  };
  const doShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & { share?: (d: { title?: string; url?: string }) => Promise<void> };
    if (nav.share) nav.share({ title: article.title, url: article.url }).catch(() => {});
    else nav.clipboard?.writeText(article.url).catch(() => {});
  };

  return (
    <Link
      href={`/items/${encodeURIComponent(`wiki:${article.id}`)}`}
      prefetch={false}
      className="relative block h-[100dvh] w-full overflow-hidden"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      {/* Cover */}
      {article.thumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnail}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading={active ? "eager" : "lazy"}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.15) 30%,rgba(0,0,0,0.55) 68%,rgba(0,0,0,0.94) 100%)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: gradient }} />
      )}

      {/* Right-side action rail (Like / Read / Save / Share) */}
      <div
        className="absolute right-3 z-[6] flex flex-col gap-4"
        style={{ bottom: "calc(230px + env(safe-area-inset-bottom))" }}
      >
        <ActionButton
          icon={Heart}
          label={liked ? "Liked" : "Like"}
          active={liked}
          accent="#f472b6"
          onClick={onToggleLike}
        />
        <ActionButton
          icon={BookOpen}
          label="Read"
          onClick={openInWikipedia}
        />
        <ActionButton
          icon={Bookmark}
          label={saved ? "Saved" : "Save"}
          active={saved}
          accent="#34d399"
          onClick={onToggleSave}
        />
        <ActionButton
          icon={Share2}
          label="Share"
          onClick={doShare}
        />
      </div>

      {/* Bottom-left content overlay */}
      <div
        className="absolute inset-x-0 bottom-0 z-[5] text-white"
        style={{ padding: "28px 88px calc(110px + env(safe-area-inset-bottom)) 20px" }}
      >
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.12em] text-white"
          >
            Wikipedia
          </span>
          <span className="text-[10px] font-mono uppercase text-white/60">
            {index + 1} / {total}
          </span>
        </div>

        <h2
          className="mb-2 font-bold leading-[1.05] tracking-tight text-white"
          style={{ fontSize: 32, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
        >
          {article.title}
        </h2>

        {article.extract && (
          <p
            className="mb-3 text-[15px] leading-relaxed text-white/85"
            style={{
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.extract}
          </p>
        )}

        <div className="flex items-center justify-between text-[12px] text-white/75">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {mins} min read
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" /> +{pts} pts
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            Tap for details <ChevronUp className="h-3 w-3" strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </Link>
  );
}
