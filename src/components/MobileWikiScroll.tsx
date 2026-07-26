"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Globe, Monitor } from "lucide-react";
import type { WikiCard } from "@/lib/fetchers";

const INITIAL_TARGET = 30;
const APPEND_BATCH = 8;
const NEAR_END = 3;

const COVER_GRADIENTS = [
  "linear-gradient(135deg,#134e4a 0%,#0f172a 100%)",
  "linear-gradient(135deg,#1e3a8a 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#4a044e 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#7c2d12 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#064e3b 0%,#0a0a0a 100%)",
];

function coverFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return COVER_GRADIENTS[Math.abs(h) % COVER_GRADIENTS.length];
}

export default function MobileWikiScroll({ initial }: { initial: WikiCard[] }) {
  const [articles, setArticles] = useState<WikiCard[]>(initial);
  const [activeIdx, setActiveIdx] = useState(0);
  const [appending, setAppending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set(initial.map((a) => a.id)));

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
    } finally {
      setAppending(false);
    }
  }, [appending]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => {
      const h = el.clientHeight;
      if (!h) return;
      const idx = Math.round(el.scrollTop / h);
      if (idx !== activeIdx) setActiveIdx(idx);
      if (
        articles.length &&
        !appending &&
        idx >= articles.length - NEAR_END &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - el.clientHeight
      ) {
        void appendBatch();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeIdx, articles.length, appending, appendBatch]);

  // Kick off an initial top-up when server seed was thin.
  useEffect(() => {
    if (initial.length < INITIAL_TARGET) void appendBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // z-50 lifts the feed above AppNav (z-40) and Sticky* (z-30). Without
    // this the sidebar covers the left ~180 px of every article card because
    // AppShell's <main> keeps its sidebar margin even on mobile.
    <div className="fixed inset-0 z-50 bg-black">
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
          />
        ))}
        {appending && (
          <div className="flex h-24 items-center justify-center text-xs text-zinc-500">
            Loading more articles…
          </div>
        )}
      </div>
      <TopBar />
    </div>
  );
}

function TopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-300 backdrop-blur">
        <Globe className="h-3 w-3" />
        Scroller · Wiki
      </div>
      <Link
        href="/?view=desktop"
        prefetch={false}
        className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-300 backdrop-blur hover:text-emerald-400"
      >
        <Monitor className="h-3 w-3" />
        Desktop
      </Link>
    </div>
  );
}

function ArticleCard({
  article,
  active,
  index,
  total,
}: {
  article: WikiCard;
  active: boolean;
  index: number;
  total: number;
}) {
  const cover = useMemo(() => coverFor(article.id), [article.id]);
  const readMins = Math.max(1, Math.ceil((article.extract || "").length / 800));

  return (
    <section
      className="relative flex h-[100dvh] w-full items-end overflow-hidden"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      {article.thumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnail}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            loading={active ? "eager" : "lazy"}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.15) 30%,rgba(0,0,0,.55) 70%,rgba(0,0,0,.92) 100%)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: cover }} />
      )}

      <div className="relative z-[1] flex w-full flex-col gap-3 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-mono">
          <span>Wikipedia</span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400">{readMins} min read</span>
          <span className="ml-auto text-zinc-500">{index + 1}/{total}</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-white drop-shadow">
          {article.title}
        </h1>
        {article.extract && (
          <p className="line-clamp-[9] text-[15px] leading-relaxed text-zinc-100/90">
            {article.extract}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
          >
            Read on Wikipedia
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link
            href={`/items/${encodeURIComponent(`wiki:${article.id}`)}`}
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-emerald-400"
          >
            Details
          </Link>
        </div>
      </div>
    </section>
  );
}
