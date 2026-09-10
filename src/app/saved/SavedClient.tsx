"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, History, Trash2 } from "lucide-react";
import { useLikesSaves, readHistory, clearHistory } from "@/lib/likes-saves";

type Tab = "favorites" | "likes" | "history";

export default function SavedClient() {
  const { liked, saved, toggleLike, toggleSave, hydrated } = useLikesSaves();
  const [tab, setTab] = useState<Tab>("favorites");
  const [history, setHistory] = useState<ReturnType<typeof readHistory>>([]);

  useEffect(() => {
    if (!hydrated) return;
    setHistory(readHistory());
    const sync = () => setHistory(readHistory());
    window.addEventListener("scroller:likes-saves-change", sync);
    return () => window.removeEventListener("scroller:likes-saves-change", sync);
  }, [hydrated]);

  if (!hydrated) return <div className="h-32" aria-hidden />;

  const savedList = [...saved];
  const likedList = [...liked];

  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Favorites · Likes · History</p>
      <p className="mt-3 text-sm" style={{ color: "var(--foreground-muted)" }}>
        {savedList.length} favorite{savedList.length === 1 ? "" : "s"} · {likedList.length} like{likedList.length === 1 ? "" : "s"} · {history.length} in history
      </p>

      <div className="mt-6 flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        <TabBtn active={tab === "favorites"} onClick={() => setTab("favorites")} icon={<Bookmark className="h-4 w-4" />} label={`Favorites (${savedList.length})`} />
        <TabBtn active={tab === "likes"} onClick={() => setTab("likes")} icon={<Heart className="h-4 w-4" />} label={`Likes (${likedList.length})`} />
        <TabBtn active={tab === "history"} onClick={() => setTab("history")} icon={<History className="h-4 w-4" />} label={`History (${history.length})`} />
      </div>

      {tab === "favorites" && (
        <ItemList
          ids={savedList}
          history={history}
          empty="Tap the bookmark on any card to favorite it."
          onRemove={toggleSave}
          removeLabel="Unsave"
        />
      )}
      {tab === "likes" && (
        <ItemList
          ids={likedList}
          history={history}
          empty="Tap the heart on any card to like it."
          onRemove={toggleLike}
          removeLabel="Unlike"
        />
      )}
      {tab === "history" && (
        <>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => { clearHistory(); setHistory([]); }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:text-white"
              style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear history
            </button>
          )}
          <ul className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
            {history.length === 0 ? (
              <li className="py-6 text-sm" style={{ color: "var(--foreground-muted)" }}>No viewing history yet.</li>
            ) : history.map((h) => (
              <li key={h.id + h.ts} className="flex items-center justify-between gap-3 py-3">
                <Link href={h.href ?? hrefFromId(h.id)} className="min-w-0 flex-1 truncate text-sm hover:underline">
                  <span className="text-[10px] uppercase tracking-wider font-mono mr-2" style={{ color: "var(--foreground-muted)" }}>{h.kind ?? kindFromId(h.id)}</span>
                  {h.title ?? h.id}
                </Link>
                <span className="shrink-0 text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>{timeAgo(h.ts)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${active ? "border-b-2" : ""}`}
      style={active ? { borderColor: "var(--accent)", color: "var(--accent)" } : { color: "var(--foreground-muted)" }}
    >
      {icon} {label}
    </button>
  );
}

function ItemList({ ids, history, empty, onRemove, removeLabel }: { ids: string[]; history: ReturnType<typeof readHistory>; empty: string; onRemove: (id: string) => void; removeLabel: string }) {
  const byId = new Map(history.map((h) => [h.id, h]));
  if (ids.length === 0) return <p className="mt-8 text-sm" style={{ color: "var(--foreground-muted)" }}>{empty}</p>;
  return (
    <ul className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
      {ids.map((id) => {
        const meta = byId.get(id);
        return (
          <li key={id} className="flex items-center justify-between gap-3 py-3">
            <Link href={meta?.href ?? hrefFromId(id)} className="min-w-0 flex-1 truncate text-sm hover:underline">
              <span className="text-[10px] uppercase tracking-wider font-mono mr-2" style={{ color: "var(--foreground-muted)" }}>{meta?.kind ?? kindFromId(id)}</span>
              {meta?.title ?? id}
            </Link>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="shrink-0 rounded-md border px-2 py-1 text-[10px] uppercase tracking-wider hover:text-white"
              style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
            >
              {removeLabel}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function kindFromId(id: string): string {
  const i = id.indexOf(":");
  return i < 0 ? "item" : id.slice(0, i);
}

function hrefFromId(id: string): string {
  if (id.startsWith("mediai:")) return `/items/${encodeURIComponent(id.replace("mediai:", "wiki:"))}`;
  if (id.startsWith("item:")) return `/items/${encodeURIComponent(id.slice(5))}`;
  return `/items/${encodeURIComponent(id)}`;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
