"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Globe, Plane, ShoppingBag, ImageIcon } from "lucide-react";
import type { ContentItem } from "../types/ContentItem";
import { gradientFor } from "../lib/gradient";

type ItemProps = { item: ContentItem };

function heroSrc(item: ContentItem): string | null {
  return item.media?.[0]?.src ?? null;
}

function HeroImage({ item }: ItemProps) {
  const src = heroSrc(item);
  const fb = gradientFor(`${item.kind}:${item.id}`);
  if (!src) return <div className="aspect-video w-full overflow-hidden rounded-lg" style={{ background: fb }} />;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg" style={{ background: fb }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={item.title}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

function VideoCard({ item }: ItemProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      <HeroImage item={item} />
      <h2 className="text-xl font-bold text-zinc-100">{item.title}</h2>
      {item.createdAt && <p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</p>}
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        Tap to preview <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  );
}

function GithubCard({ item }: ItemProps) {
  const language = (item.meta?.language as string | undefined) ?? "Repo";
  const stars = (item.meta?.stars as number | undefined) ?? 0;
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      <HeroImage item={item} />
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{language} · ★ {stars.toLocaleString()}</div>
      <h2 className="text-2xl font-bold text-zinc-100">{item.title}</h2>
      {item.body && <p className="text-sm text-zinc-400">{item.body}</p>}
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        Tap to preview <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  );
}

function PromptCard({ item }: ItemProps) {
  const [copied, setCopied] = useState(false);
  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(item.body ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <HeroImage item={item} />
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">Prompt</div>
      <h2 className="text-2xl font-bold text-zinc-100">{item.title}</h2>
      {item.body && <p className="line-clamp-[6] text-sm text-zinc-400">{item.body}</p>}
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 self-start rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AppCard({ item }: ItemProps) {
  const domain = (item.meta?.domain_name as string | undefined) ?? "";
  const subdomain = (item.meta?.subdomain as string | undefined) ?? "";
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      <HeroImage item={item} />
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.accent ?? "var(--app-accent)" }} />
        {domain}{subdomain ? ` · ${subdomain}` : ""}
      </div>
      <h2 className="text-3xl font-bold text-zinc-100">{item.title}</h2>
      <p className="text-sm text-zinc-500">App id: {item.id}</p>
    </div>
  );
}

function SiteCard({ item }: ItemProps) {
  const category = (item.meta?.category as string | undefined) ?? "";
  const host = (() => { try { return new URL(item.href ?? "").hostname.replace(/^www\./, ""); } catch { return item.href ?? ""; } })();
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      <HeroImage item={item} />
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.accent ?? "#10b981" }} />
        Site{category ? ` · ${category}` : ""}
      </div>
      <h2 className="text-3xl font-bold text-zinc-100">{item.title}</h2>
      {item.body && <p className="text-sm text-zinc-400">{item.body}</p>}
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        {host} <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  );
}

function WikiCard({ item }: ItemProps) {
  const isVoyage = item.kind === "wikivoyage";
  const Icon = isVoyage ? Plane : Globe;
  const label = isVoyage ? "WikiVoyage" : "Wikipedia";
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      {heroSrc(item) && <HeroImage item={item} />}
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <h2 className="text-2xl font-bold text-zinc-100">{item.title}</h2>
      {item.body && <p className="line-clamp-[6] text-sm text-zinc-400">{item.body}</p>}
    </div>
  );
}

function AmazonCard({ item }: ItemProps) {
  const category = (item.meta?.category as string | undefined) ?? "";
  const price = item.meta?.price as string | undefined;
  const rating = item.meta?.rating as string | undefined;
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      {heroSrc(item) && <HeroImage item={item} />}
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        <ShoppingBag className="h-3 w-3" />
        Amazon{category ? ` · ${category}` : ""}
        {price && <span className="text-amber-400 ml-1">· {price}</span>}
        {rating && <span className="text-amber-400 ml-1">· {rating}</span>}
      </div>
      <h2 className="text-2xl font-bold text-zinc-100">{item.title}</h2>
      {item.body && <p className="line-clamp-[6] text-sm text-zinc-400">{item.body}</p>}
    </div>
  );
}

function ImageCard({ item }: ItemProps) {
  const size = item.meta?.size as number | undefined;
  const key = (item.meta?.key as string | undefined) ?? item.id;
  return (
    <div className="flex max-w-3xl flex-col gap-3 pointer-events-none">
      <HeroImage item={item} />
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        <ImageIcon className="h-3 w-3" />
        Image{size ? ` · ${(size / 1024).toFixed(0)} KB` : ""}
      </div>
      <h2 className="text-lg font-semibold text-zinc-100 truncate" title={key}>{item.title}</h2>
    </div>
  );
}

export function accentFor(item: ContentItem): string {
  if (item.accent) return item.accent;
  switch (item.kind) {
    case "wikivoyage": return "#3b82f6";
    case "wiki": return "#e5e7eb";
    case "amazon": return "#ff9900";
    case "image": return "#22d3ee";
    default: return "var(--app-accent)";
  }
}

export function Card({ item }: ItemProps) {
  switch (item.kind) {
    case "youtube": return <VideoCard item={item} />;
    case "github": return <GithubCard item={item} />;
    case "prompt": return <PromptCard item={item} />;
    case "app": return <AppCard item={item} />;
    case "site": return <SiteCard item={item} />;
    case "wiki":
    case "wikivoyage":
    case "book":
    case "place":
    case "list":
      return <WikiCard item={item} />;
    case "amazon": return <AmazonCard item={item} />;
    case "image": return <ImageCard item={item} />;
    default: return <WikiCard item={item} />;
  }
}
