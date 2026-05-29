"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import PageBrowser from "@/components/PageBrowser";
import ItemModal, { type ItemModalDetail } from "@/components/ItemModal";
import type { Card as ScrollerCard } from "@/components/ScrollerFeed";
import { toModalDetail, cardItemId } from "@/components/ScrollerFeed";

const KIND_LABELS: Record<string, string> = {
  video: "Videos",
  star: "GitHub",
  prompt: "Prompts",
  app: "Apps",
  site: "Sites",
  wiki: "Wikipedia",
  amazon: "Amazon",
  image: "Images",
};

export default function HomeClient({
  initialCards,
  initialImageCursor,
  initialKind,
}: {
  initialCards: ScrollerCard[];
  initialImageCursor: string | null;
  initialKind?: string;
}) {
  const [cards, setCards] = useState<ScrollerCard[]>(initialCards);
  const [imageCursor, setImageCursor] = useState<string | null>(initialImageCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modal, setModal] = useState<ItemModalDetail | null>(null);

  const kindOptions = (() => {
    const present = new Set(cards.map((c) => c.kind));
    const opts = [{ value: "all", label: `All (${cards.length})` }];
    for (const k of Object.keys(KIND_LABELS)) {
      if (present.has(k as ScrollerCard["kind"])) {
        const count = cards.filter((c) => c.kind === k).length;
        opts.push({ value: k, label: `${KIND_LABELS[k]} (${count})` });
      }
    }
    return opts;
  })();

  const loadMoreImages = useCallback(async () => {
    if (!imageCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/scroll/images?cursor=${encodeURIComponent(imageCursor)}&limit=100`);
      if (!res.ok) return;
      const j = (await res.json()) as { items: { id: string; key: string; url: string; title: string; size: number }[]; nextCursor: string | null };
      const more: ScrollerCard[] = j.items.map((it) => ({ kind: "image", id: it.id, key: it.key, url: it.url, title: it.title, size: it.size }));
      setCards((prev) => [...prev, ...more]);
      setImageCursor(j.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [imageCursor, loadingMore]);

  return (
    <div className="px-6 py-8 space-y-4">
      <PageBrowser<ScrollerCard>
        pageKey="home"
        items={cards}
        placeholder={`Search ${cards.length} items across all sources…`}
        searchFields={(c) => {
          switch (c.kind) {
            case "video": return c.title;
            case "star": return `${c.full_name} ${c.description ?? ""} ${c.language ?? ""}`;
            case "prompt": return `${c.act} ${c.prompt}`;
            case "app": return `${c.display_name} ${c.id} ${c.domain_name} ${c.subdomain}`;
            case "site": return `${c.title} ${c.description ?? ""} ${c.category}`;
            case "wiki": return `${c.title} ${c.extract}`;
            case "amazon": return `${c.title} ${c.description ?? ""} ${c.category}`;
            case "image": return `${c.title} ${c.key}`;
          }
        }}
        alphaOf={(c) => {
          switch (c.kind) {
            case "video": return c.title;
            case "star": return c.full_name;
            case "prompt": return c.act;
            case "app": return c.display_name;
            case "site": return c.title;
            case "wiki": return c.title;
            case "amazon": return c.title;
            case "image": return c.title;
          }
        }}
        rankOf={(c, i) => {
          if (c.kind === "star") return -c.stars;
          if (c.kind === "video") return -new Date(c.published).getTime() || i;
          return i;
        }}
        toScrollerCard={(c) => c}
        kindOf={(c) => c.kind}
        kindOptions={kindOptions}
        initialKind={initialKind && Object.keys(KIND_LABELS).includes(initialKind) ? initialKind : "all"}
        onLoadMore={imageCursor ? loadMoreImages : undefined}
        hasMore={!!imageCursor}
        loading={loadingMore}
        renderGrid={(filtered) => (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <HomeTile key={cardItemId(c)} card={c} onOpen={() => setModal(toModalDetail(c))} />
            ))}
          </section>
        )}
        renderList={(filtered) => (
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={cardItemId(c)}>
                <HomeRow card={c} onOpen={() => setModal(toModalDetail(c))} />
              </li>
            ))}
          </ul>
        )}
      />
      <ItemModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function kindAccent(c: ScrollerCard): string {
  switch (c.kind) {
    case "app": return c.accent;
    case "site": return c.accent ?? "#10b981";
    case "wiki": return c.source === "wikivoyage" ? "#3b82f6" : "#e5e7eb";
    case "amazon": return "#ff9900";
    case "image": return "#22d3ee";
    case "video": return "#ef4444";
    case "star": return "#a78bfa";
    case "prompt": return "#f59e0b";
  }
}

function kindBadge(c: ScrollerCard): string {
  return KIND_LABELS[c.kind] ?? c.kind;
}

function HomeTile({ card, onOpen }: { card: ScrollerCard; onOpen: () => void }) {
  const accent = kindAccent(card);
  const title = (() => {
    switch (card.kind) {
      case "star": return card.full_name;
      case "prompt": return card.act;
      case "app": return card.display_name;
      default: return (card as { title?: string }).title ?? card.kind;
    }
  })();
  const image = (() => {
    if (card.kind === "video") return card.thumbnail;
    if (card.kind === "amazon") return card.image;
    if (card.kind === "wiki") return card.thumbnail;
    if (card.kind === "image") return card.url;
    return null;
  })();
  const subtitle = (() => {
    if (card.kind === "amazon") return card.category;
    if (card.kind === "wiki") return card.source === "wikivoyage" ? "WikiVoyage" : "Wikipedia";
    if (card.kind === "site") return card.category;
    if (card.kind === "app") return `${card.domain_name} · ${card.subdomain}`;
    if (card.kind === "star") return `★ ${card.stars.toLocaleString()}${card.language ? ` · ${card.language}` : ""}`;
    if (card.kind === "video") return new Date(card.published).toLocaleDateString();
    if (card.kind === "image") return `${(card.size / 1024).toFixed(0)} KB`;
    return null;
  })();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-lg border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 overflow-hidden transition-colors group"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title} className="aspect-video w-full object-cover bg-zinc-900" />
        </>
      )}
      <div className="p-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color: accent }}>{kindBadge(card)}</div>
        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 line-clamp-2">{title}</h3>
        {subtitle && <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>}
      </div>
    </button>
  );
}

function HomeRow({ card, onOpen }: { card: ScrollerCard; onOpen: () => void }) {
  const accent = kindAccent(card);
  const title = (() => {
    switch (card.kind) {
      case "star": return card.full_name;
      case "prompt": return card.act;
      case "app": return card.display_name;
      default: return (card as { title?: string }).title ?? card.kind;
    }
  })();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left flex items-center gap-3 rounded-md border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 px-4 py-2.5 transition-colors group"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <span className="text-[10px] uppercase tracking-wider font-mono w-16 shrink-0" style={{ color: accent }}>{kindBadge(card)}</span>
      <span className="text-sm font-medium text-zinc-100 group-hover:text-emerald-400 truncate flex-1 min-w-0">{title}</span>
    </button>
  );
}

// Keep imports used (Link, ExternalLink reserved for future link rendering)
void Link;
void ExternalLink;
