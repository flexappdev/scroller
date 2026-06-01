"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, ExternalLink, Globe, Plane, ShoppingBag, ImageIcon } from "lucide-react";
import ItemModal, { type ItemModalDetail } from "./ItemModal";
import { liveUrl, githubUrl } from "@/lib/scroll/fleet-urls";

export type Card =
  | { kind: "video"; id: string; title: string; url: string; thumbnail: string; published: string }
  | { kind: "star"; full_name: string; description: string | null; html_url: string; stars: number; language: string | null }
  | { kind: "prompt"; act: string; prompt: string }
  | { kind: "app"; id: string; display_name: string; domain_name: string; subdomain: string; accent: string }
  | { kind: "site"; id: string; title: string; description: string | null; url: string; accent: string | null; category: string }
  | { kind: "wiki"; id: string; title: string; extract: string; url: string; thumbnail: string | null; source: "wiki" | "wikivoyage" }
  | { kind: "amazon"; id: string; title: string; description: string | null; url: string; image: string | null; category: string; price: string | null; rating: string | null }
  | { kind: "image"; id: string; key: string; url: string; title: string; size: number };

export default function ScrollerFeed({ cards, embedded = false }: { cards: Card[]; embedded?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  useEffect(() => {
    function onNav(e: Event) {
      const ce = e as CustomEvent<{ direction: "prev" | "next" }>;
      const el = containerRef.current;
      if (!el) return;
      const cardHeight = el.clientHeight;
      const current = Math.round(el.scrollTop / cardHeight);
      const target = ce.detail.direction === "next" ? current + 1 : current - 1;
      const clamped = Math.max(0, Math.min(cards.length - 1, target));
      el.scrollTo({ top: clamped * cardHeight, behavior: "smooth" });
    }
    window.addEventListener("scroller:nav", onNav as EventListener);
    return () => window.removeEventListener("scroller:nav", onNav as EventListener);
  }, [cards.length]);

  function openCard(card: Card) {
    setModal(toModalDetail(card));
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`w-full snap-y snap-mandatory overflow-y-scroll ${
          embedded ? "h-[calc(100dvh-12rem)]" : "h-[calc(100dvh-6rem)]"
        }`}
      >
        {cards.map((c, i) => (
          <ScrollerCardSection key={`${c.kind}-${i}`} card={c} index={i} total={cards.length} embedded={embedded} onOpen={() => openCard(c)} />
        ))}
      </div>
      <ItemModal item={modal} onClose={() => setModal(null)} />
    </>
  );
}

function ScrollerCardSection({ card, index, total, embedded, onOpen }: { card: Card; index: number; total: number; embedded: boolean; onOpen: () => void }) {
  const accent =
    card.kind === "app" ? card.accent :
    card.kind === "site" ? (card.accent ?? "var(--app-accent)") :
    card.kind === "wiki" ? (card.source === "wikivoyage" ? "#3b82f6" : "#e5e7eb") :
    card.kind === "amazon" ? "#ff9900" :
    card.kind === "image" ? "#22d3ee" :
    "var(--app-accent)";

  return (
    <section
      className={`relative flex w-full snap-start items-center justify-center bg-zinc-950 p-4 cursor-pointer ${
        embedded ? "h-[calc(100dvh-12rem)]" : "h-[calc(100dvh-6rem)]"
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      <div className="absolute right-4 top-4 text-[10px] uppercase tracking-wider text-zinc-500 font-mono pointer-events-none">
        {card.kind} · {index + 1}/{total}
      </div>
      {card.kind === "video" && <VideoCard c={card} />}
      {card.kind === "star" && <StarCard c={card} />}
      {card.kind === "prompt" && <PromptCard c={card} />}
      {card.kind === "app" && <AppCard c={card} />}
      {card.kind === "site" && <SiteCard c={card} />}
      {card.kind === "wiki" && <WikiCard c={card} />}
      {card.kind === "amazon" && <AmazonCard c={card} />}
      {card.kind === "image" && <ImageCard c={card} />}
    </section>
  );
}

export function cardItemId(card: Card): string {
  switch (card.kind) {
    case "video": return `video:${card.id}`;
    case "star": return `star:${encodeURIComponent(card.full_name)}`;
    case "prompt": return `prompt:${encodeURIComponent(card.act)}`;
    case "app": return `app:${card.id}`;
    case "site": return `site:${card.id}`;
    case "wiki": return `${card.source}:${card.id}`;
    case "amazon": return `amazon:${card.id}`;
    case "image": return `image:${card.id}`;
  }
}

export function toModalDetail(card: Card): ItemModalDetail {
  const id = cardItemId(card);
  switch (card.kind) {
    case "video":
      return { id, title: card.title, subtitle: "Video · YouTube", image: card.thumbnail, url: card.url, urlLabel: "Watch on YouTube", internalHref: `/items/${encodeURIComponent(id)}` };
    case "star":
      return { id, title: card.full_name, subtitle: `GitHub · ${card.language ?? "Repo"} · ★ ${card.stars.toLocaleString()}`, description: card.description, url: card.html_url, urlLabel: "Open on GitHub", internalHref: `/items/${encodeURIComponent(id)}` };
    case "prompt": {
      const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(card.prompt)}`;
      const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(card.prompt)}`;
      return {
        id,
        title: card.act,
        subtitle: "AI Prompt",
        description: card.prompt,
        url: claudeUrl,
        urlLabel: "Try in Claude",
        internalHref: `/items/${encodeURIComponent(id)}`,
        extraActions: [
          { href: chatGptUrl, label: "Try in ChatGPT", external: true },
        ],
      };
    }
    case "app": {
      const live = liveUrl(card.id);
      const gh = githubUrl(card.id);
      const isLive = !live.includes("github.com");
      return {
        id,
        title: card.display_name,
        subtitle: `${card.domain_name} · ${card.subdomain}`,
        description: `App id: ${card.id}`,
        accent: card.accent,
        url: isLive ? live : gh,
        urlLabel: isLive ? "Open app" : "View on GitHub",
        internalHref: `/items/${encodeURIComponent(id)}`,
        extraActions: isLive ? [{ href: gh, label: "View on GitHub", external: true }] : [],
      };
    }
    case "site":
      return { id, title: card.title, subtitle: `Site · ${card.category}`, description: card.description, url: card.url, urlLabel: "Visit site", accent: card.accent ?? undefined, internalHref: `/items/${encodeURIComponent(id)}` };
    case "wiki":
      return { id, title: card.title, subtitle: card.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia", description: card.extract, image: card.thumbnail, url: card.url, urlLabel: `Read on ${card.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia"}`, internalHref: `/items/${encodeURIComponent(id)}` };
    case "amazon":
      return { id, title: card.title, subtitle: `Amazon · ${card.category}${card.price ? ` · ${card.price}` : ""}`, description: card.description, image: card.image, url: card.url, urlLabel: "Buy on Amazon", accent: "#ff9900", internalHref: `/items/${encodeURIComponent(id)}` };
    case "image":
      return { id, title: card.title, subtitle: `Image · ${(card.size / 1024).toFixed(0)} KB`, image: card.url, url: card.url, urlLabel: "Open full size", accent: "#22d3ee", internalHref: `/items/${encodeURIComponent(id)}` };
  }
}

function VideoCard({ c }: { c: Extract<Card, { kind: "video" }> }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.thumbnail} alt={c.title} className="aspect-video w-full rounded-lg object-cover" />
      <h2 className="text-xl font-bold text-zinc-100">{c.title}</h2>
      <p className="text-xs text-zinc-500">{new Date(c.published).toLocaleDateString()}</p>
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        Tap to preview <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  );
}

function StarCard({ c }: { c: Extract<Card, { kind: "star" }> }) {
  return (
    <div className="max-w-2xl space-y-3 pointer-events-none">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{c.language ?? "Repo"} · ★ {c.stars.toLocaleString()}</div>
      <h2 className="text-2xl font-bold text-zinc-100">{c.full_name}</h2>
      {c.description && <p className="text-sm text-zinc-400">{c.description}</p>}
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        Tap to preview <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  );
}

function PromptCard({ c }: { c: Extract<Card, { kind: "prompt" }> }) {
  const [copied, setCopied] = useState(false);
  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(c.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="max-w-2xl space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">Prompt</div>
      <h2 className="text-2xl font-bold text-zinc-100">{c.act}</h2>
      <p className="line-clamp-[10] text-sm text-zinc-400">{c.prompt}</p>
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AppCard({ c }: { c: Extract<Card, { kind: "app" }> }) {
  return (
    <div className="max-w-2xl space-y-3 pointer-events-none">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.accent }} />
        {c.domain_name} · {c.subdomain}
      </div>
      <h2 className="text-3xl font-bold text-zinc-100">{c.display_name}</h2>
      <p className="text-sm text-zinc-500">App id: {c.id}</p>
    </div>
  );
}

function SiteCard({ c }: { c: Extract<Card, { kind: "site" }> }) {
  const host = (() => { try { return new URL(c.url).hostname.replace(/^www\./, ""); } catch { return c.url; } })();
  return (
    <div className="max-w-2xl space-y-3 pointer-events-none">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.accent ?? "#10b981" }} />
        Site · {c.category}
      </div>
      <h2 className="text-3xl font-bold text-zinc-100">{c.title}</h2>
      {c.description && <p className="text-sm text-zinc-400">{c.description}</p>}
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        {host} <ExternalLink className="h-3 w-3" />
      </span>
    </div>
  );
}

function WikiCard({ c }: { c: Extract<Card, { kind: "wiki" }> }) {
  const Icon = c.source === "wikivoyage" ? Plane : Globe;
  const label = c.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia";
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      {c.thumbnail && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.thumbnail} alt={c.title} className="aspect-video w-full rounded-lg object-cover bg-zinc-900" />
        </>
      )}
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <h2 className="text-2xl font-bold text-zinc-100">{c.title}</h2>
      {c.extract && <p className="line-clamp-[6] text-sm text-zinc-400">{c.extract}</p>}
    </div>
  );
}

function AmazonCard({ c }: { c: Extract<Card, { kind: "amazon" }> }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3 pointer-events-none">
      {c.image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image} alt={c.title} className="aspect-video w-full rounded-lg object-cover bg-zinc-900" />
        </>
      )}
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        <ShoppingBag className="h-3 w-3" />
        Amazon · {c.category}
        {c.price && <span className="text-amber-400 ml-1">· {c.price}</span>}
        {c.rating && <span className="text-amber-400 ml-1">· {c.rating}</span>}
      </div>
      <h2 className="text-2xl font-bold text-zinc-100">{c.title}</h2>
      {c.description && <p className="line-clamp-[6] text-sm text-zinc-400">{c.description}</p>}
    </div>
  );
}

function ImageCard({ c }: { c: Extract<Card, { kind: "image" }> }) {
  return (
    <div className="flex max-w-3xl flex-col gap-3 pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.url} alt={c.title} className="max-h-[60vh] w-full rounded-lg object-contain bg-zinc-900" />
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        <ImageIcon className="h-3 w-3" />
        Image · {(c.size / 1024).toFixed(0)} KB
      </div>
      <h2 className="text-lg font-semibold text-zinc-100 truncate" title={c.key}>{c.title}</h2>
    </div>
  );
}
