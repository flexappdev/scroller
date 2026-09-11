"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  Check,
  ArrowUpRight,
  Share2,
  Copy,
  BookOpen,
  Image as ImageIcon,
  Film,
  Volume2,
  Info,
  Send,
  Heart,
} from "lucide-react";
import type { ItemModalDetail } from "./ItemModal";
import CardActions from "./CardActions";

type SectionKey = "article" | "images" | "audio" | "video" | "share";

export default function DetailSidebar({
  item,
  onNavigate,
}: {
  item: ItemModalDetail;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const has = {
    article: Boolean(item.description || item.title),
    images: Boolean(item.image),
    video: Boolean(item.embed),
    audio: false, // ItemModalDetail doesn't carry audio today; kept as a section so the shape is stable.
  };

  // All sections closed by default so users can scan every section header at once.
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    article: false,
    images: false,
    audio: false,
    video: false,
    share: false,
  });
  const [copied, setCopied] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

  const toggle = (k: SectionKey) => setOpen((prev) => ({ ...prev, [k]: !prev[k] }));

  const internalHref = item.internalHref;
  const articleScrollerHref = internalHref ? `${internalHref}/scroller` : null;
  const wordCount = item.description ? item.description.trim().split(/\s+/).length : 0;
  const host = item.url ? safeHost(item.url) : null;

  async function copy(text: string, which: "link" | "title") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "link") { setCopied(true); setTimeout(() => setCopied(false), 1500); }
      else { setCopiedTitle(true); setTimeout(() => setCopiedTitle(false), 1500); }
    } catch {}
  }

  async function copyLink() {
    if (!internalHref) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    await copy(`${base}${internalHref}`, "link");
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
        <Section title="Article" icon={<BookOpen className="h-4 w-4" />} chip={wordCount ? `${wordCount} words` : "no copy"} open={open.article} onToggle={() => toggle("article")}>
          {item.description ? (
            <p className="text-sm text-zinc-200 leading-6 whitespace-pre-line">{item.description}</p>
          ) : (
            <p className="text-sm text-zinc-500 italic">No description available for this item.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-4">
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
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {item.urlLabel ?? "Open source"}
              </a>
            )}
          </div>
        </Section>

        <Section
          title="Images"
          icon={<ImageIcon className="h-4 w-4" />}
          chip={has.images ? "1" : "0"}
          disabled={!has.images}
          open={open.images}
          onToggle={() => toggle("images")}
        >
          {item.image ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.title} className="w-full rounded border border-zinc-800" />
              <a
                href={item.image}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open full size
              </a>
            </div>
          ) : (
            <EmptyLine text="No image attached." />
          )}
        </Section>

        <Section
          title="Audio"
          icon={<Volume2 className="h-4 w-4" />}
          chip="0"
          disabled
          open={open.audio}
          onToggle={() => toggle("audio")}
        >
          <EmptyLine text="No audio track for this item." />
        </Section>

        <Section
          title="Videos"
          icon={<Film className="h-4 w-4" />}
          chip={has.video ? (item.embed?.kind === "youtube" ? "YouTube" : "MP4") : "0"}
          disabled={!has.video}
          open={open.video}
          onToggle={() => toggle("video")}
        >
          {item.embed?.kind === "youtube" ? (
            <div className="space-y-2">
              <iframe
                src={item.embed.url}
                title={item.title}
                className="w-full aspect-video rounded border border-zinc-800"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <a href={item.embed.url.replace("/embed/", "/watch?v=")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">
                <ExternalLink className="h-3 w-3" /> Open on YouTube
              </a>
            </div>
          ) : item.embed?.kind === "mp4" ? (
            <video src={item.embed.url} controls playsInline className="w-full rounded border border-zinc-800" />
          ) : (
            <EmptyLine text="No video attached." />
          )}
        </Section>

        <Section title="Share" icon={<Send className="h-4 w-4" />} open={open.share} onToggle={() => toggle("share")}>
          <div className="flex flex-wrap gap-2">
            <ShareBtn onClick={shareNative} icon={<Share2 className="h-3.5 w-3.5" />} label="Share…" />
            <ShareBtn
              onClick={copyLink}
              icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              label={copied ? "Copied" : "Copy link"}
            />
            <ShareBtn
              onClick={() => copy(item.title, "title")}
              icon={copiedTitle ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              label={copiedTitle ? "Copied" : "Copy title"}
            />
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> {item.urlLabel ?? "Open source"}
              </a>
            )}
          </div>
        </Section>

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
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
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

function ShareBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500 transition-colors">
      {icon} {label}
    </button>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-xs text-zinc-500 italic">{text}</p>;
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

function safeHost(url: string): string | null {
  try { return new URL(url).host; } catch { return null; }
}
