"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Volume2, Film, BookOpen, Link as LinkIcon, Check } from "lucide-react";
import type { MediaAiArticle } from "@/lib/mediai";

type WikiSummary = {
  extract: string;
  description?: string;
  thumbnail?: string;
  desktopUrl?: string;
  fullText?: string;
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
  item: MediaAiArticle | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [loadingWiki, setLoadingWiki] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

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
    const url = `${window.location.origin}/?card=${encodeURIComponent(item.id)}`;
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

  const body = (
    <>
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-10 rounded-full bg-zinc-900/80 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {item.videoUrls[0] ? (
        <div className="relative w-full bg-black">
          <video
            src={item.videoUrls[0]}
            poster={heroImage ?? undefined}
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full aspect-video bg-black object-cover"
            aria-label={`Video for ${item.topic}`}
          />
        </div>
      ) : heroImage ? (
        <div className="relative w-full bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={item.topic} className="w-full aspect-video object-cover" />
        </div>
      ) : null}

      <div className="p-5 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-mono">
            Wikipedia · MediaAI
          </div>
          <h2 className="mt-1 text-xl font-semibold text-zinc-100 break-words">{item.topic}</h2>
          {wiki?.description && (
            <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">{wiki.description}</p>
          )}
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          {[
            item.imageUrl ? "1 image" : null,
            item.videoUrls.length ? `${item.videoUrls.length} motion` : null,
            item.audioUrl ? "audio narration" : null,
            `${item.assetCount} generated assets`,
          ].filter(Boolean).join(" · ")}
        </div>

        <article className="text-sm leading-6 text-zinc-300">
          {loadingWiki && <p className="text-zinc-500">Loading article…</p>}
          {!loadingWiki && (wiki?.fullText || wiki?.extract) && (
            <div className="space-y-3">
              {(wiki?.fullText ?? wiki?.extract ?? "")
                .split(/\n{2,}/)
                .filter((para) => para.trim().length > 0)
                .map((para, i) => {
                  // Wikipedia plaintext uses '\n\n== Heading ==\n\n' — surface headings.
                  const heading = para.match(/^==+\s*(.+?)\s*==+$/);
                  if (heading) {
                    return (
                      <h3 key={i} className="mt-3 text-[13px] font-black uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
                        {heading[1]}
                      </h3>
                    );
                  }
                  return <p key={i} className="whitespace-pre-line">{para}</p>;
                })}
            </div>
          )}
          {!loadingWiki && !wiki?.fullText && !wiki?.extract && (
            <p className="text-zinc-500">No Wikipedia article available for this topic.</p>
          )}
        </article>

        {item.videoUrls.length > 1 && (
          <section className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">More motion clips</div>
            <ul className="space-y-2">
              {item.videoUrls.slice(1).map((url, i) => (
                <li key={url}>
                  <video src={url} controls playsInline preload="metadata" className="w-full rounded-md border border-zinc-800 bg-black" aria-label={`Motion clip ${i + 2}`} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.audioUrl && (
          <section className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Narration</div>
            <audio src={item.audioUrl} controls preload="metadata" className="w-full" />
          </section>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={item.sourceUrl || wiki?.desktopUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikaiTopic)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors"
            style={{ borderColor: "var(--accent)", background: "color-mix(in oklch, var(--accent) 18%, transparent)", color: "var(--accent)" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Open article
          </a>
          <a
            href={`https://wikai.matsiems.com/read/${encodeURIComponent(wikaiTopic)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Read on WIKAI
          </a>
          {item.audioUrl && (
            <a
              href={item.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Audio file
            </a>
          )}
          {item.videoUrls[0] && (
            <a
              href={item.videoUrls[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
            >
              <Film className="h-3.5 w-3.5" />
              Motion file
            </a>
          )}
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
            title="Copy deep-link to this card"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : <LinkIcon className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
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
