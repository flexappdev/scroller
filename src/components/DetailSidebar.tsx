"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Link as LinkIcon, Check, ArrowUpRight, Share2, Copy } from "lucide-react";
import type { ItemModalDetail } from "./ItemModal";
import CardActions from "./CardActions";

type SectionKey = "article" | "media" | "metadata" | "share";

export default function DetailSidebar({
  item,
  onClose,
  onNavigate,
}: {
  item: ItemModalDetail;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    article: true,
    media: false,
    metadata: false,
    share: false,
  });
  const [copied, setCopied] = useState(false);

  const toggle = (k: SectionKey) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));

  const internalHref = item.internalHref;
  const articleScrollerHref = internalHref ? `${internalHref}/scroller` : null;

  async function copyLink() {
    if (!internalHref) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    try {
      await navigator.clipboard.writeText(`${base}${internalHref}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function shareNative() {
    if (!internalHref || typeof navigator === "undefined") return;
    const base = window.location.origin;
    const url = `${base}${internalHref}`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: item.title, url }); return; } catch {}
    }
    copyLink();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Hero */}
      {item.embed?.kind === "youtube" ? (
        <div className="relative w-full bg-black">
          <iframe src={item.embed.url} title={item.title} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : item.embed?.kind === "mp4" ? (
        <div className="relative w-full bg-black">
          <video src={item.embed.url} controls playsInline preload="metadata" poster={item.image ?? undefined} className="w-full aspect-video bg-black" />
        </div>
      ) : item.image ? (
        <div className="relative w-full bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.title} className="w-full aspect-video object-cover" />
        </div>
      ) : null}

      <div className="border-b border-zinc-800 px-4 py-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {item.subtitle && (
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{item.subtitle}</div>
          )}
          <h2 className="mt-1 text-lg font-semibold text-zinc-100 break-words leading-tight">{item.title}</h2>
        </div>
        <CardActions id={item.id} size={16} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Article" open={open.article} onToggle={() => toggle("article")}>
          {item.description ? (
            <p className="text-sm text-zinc-300 whitespace-pre-line">{item.description}</p>
          ) : (
            <p className="text-sm text-zinc-500 italic">No description available.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-3">
            {articleScrollerHref && (
              <Link
                href={articleScrollerHref}
                onClick={onNavigate}
                className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Open Article
              </Link>
            )}
            {internalHref && (
              <Link
                href={internalHref}
                onClick={onNavigate}
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Item page
              </Link>
            )}
          </div>
        </Section>

        <Section title="Media" open={open.media} onToggle={() => toggle("media")}>
          <MediaBlock item={item} />
        </Section>

        <Section title="Metadata" open={open.metadata} onToggle={() => toggle("metadata")}>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-xs">
            <Meta k="ID" v={item.id} mono />
            {item.subtitle && <Meta k="Kind" v={item.subtitle} />}
            {item.url && <Meta k="Source" v={item.url} link />}
            {item.accent && (
              <>
                <dt className="text-zinc-500">Accent</dt>
                <dd className="flex items-center gap-2 text-zinc-300">
                  <span className="inline-block h-3 w-3 rounded-sm border border-white/10" style={{ background: item.accent }} />
                  <span className="font-mono">{item.accent}</span>
                </dd>
              </>
            )}
          </dl>
        </Section>

        <Section title="Share" open={open.share} onToggle={() => toggle("share")}>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={shareNative} className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button type="button" onClick={copyLink} className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
                {item.urlLabel ?? "Open source"}
              </a>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-200 hover:bg-zinc-900/40 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Meta({ k, v, mono, link }: { k: string; v: string; mono?: boolean; link?: boolean }) {
  return (
    <>
      <dt className="text-zinc-500">{k}</dt>
      <dd className={`text-zinc-300 break-words ${mono ? "font-mono" : ""}`}>
        {link ? (
          <a href={v} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{v}</a>
        ) : v}
      </dd>
    </>
  );
}

function MediaBlock({ item }: { item: ItemModalDetail }) {
  const [tab, setTab] = useState<"image" | "audio" | "video" | "status">(
    item.embed?.kind === "mp4" || item.embed?.kind === "youtube" ? "video" : item.image ? "image" : "status"
  );
  const has = {
    image: !!item.image,
    audio: false,
    video: !!item.embed,
    status: true,
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 text-xs">
        {(["image", "audio", "video", "status"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            disabled={!has[t]}
            className={`px-2 py-1 rounded border transition-colors ${
              tab === t
                ? "border-emerald-600/60 bg-emerald-950/40 text-emerald-300"
                : has[t]
                ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                : "border-zinc-800 bg-zinc-950/40 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "image" && item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.title} className="w-full rounded border border-zinc-800" />
      )}
      {tab === "video" && item.embed?.kind === "youtube" && (
        <a href={item.embed.url.replace("/embed/", "/watch?v=")} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">
          Open on YouTube ↗
        </a>
      )}
      {tab === "video" && item.embed?.kind === "mp4" && (
        <video src={item.embed.url} controls className="w-full rounded border border-zinc-800" />
      )}
      {tab === "audio" && <p className="text-xs text-zinc-500 italic">No audio track.</p>}
      {tab === "status" && (
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• Image: {has.image ? "yes" : "—"}</li>
          <li>• Video: {has.video ? "yes" : "—"}</li>
          <li>• Audio: —</li>
          <li>• Source URL: {item.url ? "yes" : "—"}</li>
        </ul>
      )}
    </div>
  );
}
