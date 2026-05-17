"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

type Card =
  | { kind: "video"; id: string; title: string; url: string; thumbnail: string; published: string }
  | { kind: "star"; full_name: string; description: string | null; html_url: string; stars: number; language: string | null }
  | { kind: "prompt"; act: string; prompt: string }
  | { kind: "app"; id: string; display_name: string; domain_name: string; subdomain: string; accent: string };

export default function ScrollerFeed({ cards }: { cards: Card[] }) {
  return (
    <div className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll">
      {cards.map((c, i) => (
        <ScrollerCard key={i} card={c} index={i} total={cards.length} />
      ))}
    </div>
  );
}

function ScrollerCard({ card, index, total }: { card: Card; index: number; total: number }) {
  return (
    <section
      className="relative flex h-[100dvh] w-full snap-start items-center justify-center bg-zinc-950 p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: "var(--app-accent)" }}
    >
      <div className="absolute right-4 top-4 text-[10px] uppercase tracking-wider text-zinc-500">
        {card.kind} · {index + 1}/{total}
      </div>
      {card.kind === "video" && <VideoCard c={card} />}
      {card.kind === "star" && <StarCard c={card} />}
      {card.kind === "prompt" && <PromptCard c={card} />}
      {card.kind === "app" && <AppCard c={card} />}
    </section>
  );
}

function VideoCard({ c }: { c: Extract<Card, { kind: "video" }> }) {
  return (
    <a href={c.url} target="_blank" rel="noreferrer" className="flex max-w-2xl flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.thumbnail} alt={c.title} className="aspect-video w-full rounded-lg object-cover" />
      <h2 className="text-xl font-bold text-zinc-100">{c.title}</h2>
      <p className="text-xs text-zinc-500">{new Date(c.published).toLocaleDateString()}</p>
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        Watch on YouTube <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

function StarCard({ c }: { c: Extract<Card, { kind: "star" }> }) {
  return (
    <a href={c.html_url} target="_blank" rel="noreferrer" className="max-w-2xl space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{c.language ?? "Repo"} · ★ {c.stars.toLocaleString()}</div>
      <h2 className="text-2xl font-bold text-zinc-100">{c.full_name}</h2>
      {c.description && <p className="text-sm text-zinc-400">{c.description}</p>}
      <span className="inline-flex items-center gap-1 text-sm text-zinc-300">
        Open repo <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

function PromptCard({ c }: { c: Extract<Card, { kind: "prompt" }> }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
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
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.accent }} />
        {c.domain_name} · {c.subdomain}
      </div>
      <h2 className="text-3xl font-bold text-zinc-100">{c.display_name}</h2>
      <p className="text-sm text-zinc-500">App id: {c.id}</p>
    </div>
  );
}
