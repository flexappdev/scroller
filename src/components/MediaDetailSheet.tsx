"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink, Volume2, Film, BookOpen, Link as LinkIcon, Check, ChevronDown, Image as ImageIcon, Send, Share2, Copy, ArrowUpRight } from "lucide-react";
import type { MediaiArticle } from "@/lib/mediai";
import CardActions from "./CardActions";
import { cardBadge } from "@/lib/card-label";
import { wikiBlocks, wordCount as countWords } from "@/lib/wiki-text";

type WikiSummary = {
  extract: string;
  description?: string;
  thumbnail?: string;
  desktopUrl?: string;
  fullText?: string;
  disambiguation?: boolean;
};

async function fetchWikiSummary(topic: string): Promise<WikiSummary | null> {
  const title = topic.replaceAll(" ", "_").replaceAll("/", "_");
  try {
    // Summary + full plaintext extract in parallel — summary gives the
    // description + thumbnail, action=query gives the whole article.
    const [summaryRes, fullRes] = await Promise.all([
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: { accept: "application/json" } }),
      fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&origin=*&titles=${encodeURIComponent(topic)}`, { headers: { accept: "application/json" } }),
    ]);
    const summary = summaryRes.ok ? await summaryRes.json() : null;
    let fullText: string | undefined;
    if (fullRes.ok) {
      const j = await fullRes.json();
      const pages = j?.query?.pages;
      if (pages && typeof pages === "object") {
        const first = Object.values(pages)[0] as { extract?: string } | undefined;
        if (first?.extract) fullText = first.extract;
      }
    }
    return {
      extract: typeof summary?.extract === "string" ? summary.extract : "",
      description: typeof summary?.description === "string" ? summary.description : undefined,
      thumbnail: summary?.thumbnail?.source,
      desktopUrl: summary?.content_urls?.desktop?.page,
      fullText,
      disambiguation: summary?.type === "disambiguation",
    };
  } catch {
    return null;
  }
}

const SIDE_PANEL_BREAKPOINT_PX = 1024;
const PREVIEW_OPEN_FLAG = "data-preview-open";

export default function MediaDetailSheet({
  item,
  onClose,
}: {
  item: MediaiArticle | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [loadingWiki, setLoadingWiki] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  // All sections closed by default — headers scannable without scrolling.
  const [open, setOpen] = useState({ article: false, images: false, audio: false, videos: false, share: false });
  const toggle = (k: "article" | "images" | "audio" | "videos" | "share") => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(min-width: ${SIDE_PANEL_BREAKPOINT_PX}px)`);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!item) {
      setWiki(null);
      return;
    }
    if (item.provider === "chatgpt" || item.book) {
      setWiki(null);
      setLoadingWiki(false);
      return;
    }
    let cancelled = false;
    setLoadingWiki(true);
    setWiki(null);
    fetchWikiSummary(item.topic).then((w) => {
      if (!cancelled) {
        setWiki(w);
        setLoadingWiki(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.topic]);

  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    if (isDesktop === false) document.body.style.overflow = "hidden";
    if (isDesktop) document.documentElement.setAttribute(PREVIEW_OPEN_FLAG, "1");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.documentElement.removeAttribute(PREVIEW_OPEN_FLAG);
    };
  }, [item, onClose, isDesktop]);

  if (!item) return null;

  async function copyLink() {
    if (typeof window === "undefined" || !item) return;
    const base = item.provider === "chatgpt" ? "/chatgpt" : "/";
    const url = `${window.location.origin}${base}?card=${encodeURIComponent(item.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const wikaiTopic = item.topic.replaceAll(" ", "_").replaceAll("/", "_");
  const heroImage = item.imageUrl ?? wiki?.thumbnail ?? null;
  const scrollerHref = `/items/${encodeURIComponent(`wiki:${wikaiTopic}`)}/scroller`;
  const wordCount = countWords(wiki?.fullText ?? wiki?.extract ?? "");
  const blocks = wiki?.disambiguation ? [] : wikiBlocks(wiki?.fullText ?? wiki?.extract ?? "");

  const description = item.book ? item.book.part : wiki?.description ?? item.description ?? null;
  const shortDesc = item.provider === "chatgpt"
    ? item.prompt
    : item.book
      ? item.book.tease
      : wiki?.extract
        ? wiki.extract.split(/(?<=[.!?])\s/)[0]?.trim()
        : null;
  const assetChips = [
    item.imageUrl ? "image" : null,
    item.videoUrls.length ? `${item.videoUrls.length} video${item.videoUrls.length === 1 ? "" : "s"}` : null,
    item.audioUrl ? "audio" : null,
    item.assetCount > 0 ? `${item.assetCount} asset${item.assetCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean) as string[];

  const body = (
    <>
      {/* Persistent close button — always top-right, over the hero. */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-20 rounded-full bg-black/70 p-1.5 text-white/85 hover:text-white hover:bg-black/85 backdrop-blur-md border border-white/15 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Full-width hero image */}
      {heroImage ? (
        <div className="relative w-full bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={item.topic} className="w-full aspect-[16/10] object-cover" />
        </div>
      ) : null}

      {/* Header: Title · tagline · tags · short description · like/favorite */}
      <div className="border-b border-zinc-800 px-4 pt-4 pb-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-mono">{cardBadge(item)}</div>
        <h2 className="text-lg font-black tracking-tight text-zinc-100 break-words leading-tight">{item.topic}</h2>
        {description && (
          <p className="text-xs uppercase tracking-wide text-zinc-400">{description}</p>
        )}
        {assetChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {assetChips.map((chip) => (
              <span key={chip} className="rounded-full border border-zinc-700 bg-zinc-950/60 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                {chip}
              </span>
            ))}
          </div>
        )}
        {shortDesc && (
          <p className="pt-1 text-sm text-zinc-300 leading-5 line-clamp-3">{shortDesc}</p>
        )}
        <div className="flex items-center gap-2 pt-2">
          <CardActions id={`mediai:${item.id}`} size={16} />
        </div>
      </div>

      <div className="flex-1">
        <Section
          title={item.provider === "chatgpt" ? "Prompt" : item.book ? "Chapter" : "Article"}
          icon={<BookOpen className="h-4 w-4" />}
          chip={item.provider === "chatgpt" ? (item.prompt ? "saved" : "no prompt") : item.book ? `${item.book.chapter} of ${item.book.chapters}` : loadingWiki ? "…" : wordCount ? `${wordCount} words` : "no copy"}
          open={open.article}
          onToggle={() => toggle("article")}
        >
          {item.provider === "chatgpt" ? (
            <p className="whitespace-pre-line text-sm leading-6 text-zinc-300">
              {item.prompt || "No generation prompt was available in the imported metadata."}
            </p>
          ) : item.book ? (
            <div className="space-y-3 text-sm leading-6 text-zinc-300">
              <p>{item.book.tease}</p>
              {item.book.facts.length > 0 && (
                <dl className="grid grid-cols-3 gap-2">
                  {item.book.facts.map((fact) => (
                    <div key={fact.label} className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2">
                      <dt className="text-[10px] uppercase tracking-wide text-zinc-500">{fact.label}</dt>
                      <dd className="text-sm font-bold text-zinc-100">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {item.book.read && (
                  <a href={item.book.read} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-500">
                    <ArrowUpRight className="h-3.5 w-3.5" /> {item.book.free ? "Read this chapter free" : "Read the chapter"}
                  </a>
                )}
                {item.book.buy && (
                  <a href={item.book.buy} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500">
                    <BookOpen className="h-3.5 w-3.5" /> {item.book.price ? `Get the book · £${item.book.price}` : "Get the book"}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              {loadingWiki && <p className="text-xs text-zinc-500">Loading article…</p>}
              {!loadingWiki && wiki?.disambiguation && (
                <p className="text-xs italic text-zinc-500">“{item.topic}” is a Wikipedia disambiguation page, so there is no article to show.</p>
              )}
              {!loadingWiki && blocks.length > 0 && (
                <div className="space-y-2 text-sm leading-6 text-zinc-300">
                  {blocks.map((block, i) =>
                    block.type === "heading" ? (
                      block.level <= 2 ? (
                        <h3 key={i} className="pt-3 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>{block.text}</h3>
                      ) : (
                        <h4 key={i} className="pt-2 text-[13px] font-bold text-zinc-100">{block.text}</h4>
                      )
                    ) : (
                      <p key={i} className="whitespace-pre-line">{block.text}</p>
                    ),
                  )}
                </div>
              )}
              {!loadingWiki && !wiki?.disambiguation && blocks.length === 0 && (
                <p className="text-xs text-zinc-500 italic">No Wikipedia article available for this topic.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-3">
                <Link href={scrollerHref} onClick={onClose} className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Open Article
                </Link>
              </div>
            </>
          )}
        </Section>

        <Section title="Images" icon={<ImageIcon className="h-4 w-4" />} chip={item.imageUrl ? "1" : "0"} disabled={!item.imageUrl} open={open.images} onToggle={() => toggle("images")}>
          {item.imageUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.topic} className="w-full rounded border border-zinc-800" />
              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                <ExternalLink className="h-3 w-3" /> Open full size
              </a>
            </div>
          ) : (<p className="text-xs text-zinc-500 italic">No image attached.</p>)}
        </Section>

        <Section title="Audio" icon={<Volume2 className="h-4 w-4" />} chip={item.audioUrl ? "1" : "0"} disabled={!item.audioUrl} open={open.audio} onToggle={() => toggle("audio")}>
          {item.audioUrl ? (
            <div className="space-y-2">
              <audio src={item.audioUrl} controls preload="metadata" className="w-full" />
              <a href={item.audioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                <ExternalLink className="h-3 w-3" /> Audio file
              </a>
            </div>
          ) : (<p className="text-xs text-zinc-500 italic">No audio track.</p>)}
        </Section>

        <Section title="Videos" icon={<Film className="h-4 w-4" />} chip={item.videoUrls.length ? String(item.videoUrls.length) : "0"} disabled={item.videoUrls.length === 0} open={open.videos} onToggle={() => toggle("videos")}>
          {item.videoUrls.length ? (
            <ul className="space-y-2">
              {item.videoUrls.map((url, i) => (
                <li key={url}>
                  <video src={url} controls playsInline preload="metadata" className="w-full rounded border border-zinc-800 bg-black" aria-label={`Motion clip ${i + 1}`} />
                </li>
              ))}
            </ul>
          ) : (<p className="text-xs text-zinc-500 italic">No video attached.</p>)}
        </Section>

        <Section title="Share" icon={<Send className="h-4 w-4" />} open={open.share} onToggle={() => toggle("share")}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => { try { if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: item.topic, url: `${window.location.origin}/?card=${encodeURIComponent(item.id)}` }); else copyLink(); } catch {} }}
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Share…
            </button>
            <button type="button" onClick={copyLink} className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={item.sourceUrl || wiki?.desktopUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikaiTopic)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" /> Open source
            </a>
          </div>
        </Section>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <aside
        className="fixed top-14 bottom-[4.25rem] right-0 z-40 w-[28rem] max-w-[90vw] border-l border-zinc-800 bg-zinc-950 shadow-2xl overflow-y-auto"
        role="dialog"
        aria-modal="false"
        aria-label={`Details: ${item.topic}`}
        style={{ borderTopWidth: 3, borderTopColor: "var(--accent)" }}
      >
        {body}
      </aside>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTopWidth: 3, borderTopColor: "var(--accent)" }}
      >
        {body}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  chip,
  disabled,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  chip?: string;
  disabled?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
          disabled ? "text-zinc-600" : "text-zinc-100 hover:bg-zinc-900/40"
        }`}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className={disabled ? "text-zinc-700" : "text-zinc-500"}>{icon}</span>
          <span className="font-medium">{title}</span>
          {chip && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${
              disabled ? "border-zinc-800 text-zinc-600" : "border-zinc-700 text-zinc-400"
            }`}>{chip}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
