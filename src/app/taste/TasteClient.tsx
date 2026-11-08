"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, ThumbsDown, ThumbsUp } from "lucide-react";
import type { FBit, KBit } from "@/lib/play";
import { DEFAULT_TASTE, loadTaste, nudge, readLocal, saveTaste, type TasteState } from "@/lib/taste";

type Card = KBit | FBit;
const ROUND = 20;

function keysOf(card: Card) {
  return card.kind === "kbit" ? ["kind:kbit", `pack:${card.pack}`, ...card.tags.map((t) => `tag:${t}`)] : ["kind:fbit", `cat:${card.category}`];
}

export default function TasteClient({ pool }: { pool: Card[] }) {
  const [taste, setTaste] = useState<TasteState>(DEFAULT_TASTE);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    setTaste(loadTaste());
    setReady(true);
  }, []);

  const round = useMemo(() => pool.filter((c) => !(c.id in taste.votes)).slice(0, ROUND), [pool, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const card = round[index];

  const update = (next: TasteState) => {
    setTaste(next);
    saveTaste(next);
  };

  const vote = (v: 1 | -1) => {
    if (!card) return;
    let next = nudge(taste, keysOf(card), v);
    next = { ...next, votes: { ...next.votes, [card.id]: v } };
    if (card.kind === "fbit") next = { ...next, funnyShare: Math.max(0.1, Math.min(0.6, next.funnyShare + v * 0.02)) };
    if (note.trim()) next = { ...next, notes: [...next.notes, { at: new Date().toISOString(), card: card.id, text: note.trim() }] };
    update(next);
    setNote("");
    setIndex((i) => i + 1);
  };

  const exportJson = () => {
    const payload = {
      schema: "scroller-taste/v1",
      exportedAt: new Date().toISOString(),
      taste,
      vault: readLocal("scroller-vault", []),
      learned: readLocal("scroller-learned", { date: null, ids: [] }),
      bestStreak: readLocal("scroller-best-streak", 0),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `taste-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const topWeights = Object.entries(taste.weights).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-8 md:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Taste nudge · private</p>
      <h1 className="mt-2 text-3xl font-black md:text-4xl">Twenty cards. Thumbs up or down.</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Ten minutes, twice a week. Your votes steer <Link href="/play" className="underline">Play</Link> straight away and export as a taste brief for the Editor agent.
      </p>

      {!ready ? null : card ? (
        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
          <p className="text-xs text-zinc-500">
            {index + 1} of {round.length} · {card.kind === "kbit" ? `Kbit · ${card.packName}` : `Fbit · ${card.category}`}
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {card.kind === "fbit" ? `${card.emoji} ` : ""}
            {card.title}
          </h2>
          <p className="mt-3 text-zinc-300">{card.content}</p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional one-line note (why?)"
            className="mt-5 w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => vote(-1)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-500/20 py-3 font-bold text-rose-200">
              <ThumbsDown className="h-5 w-5" /> Less
            </button>
            <button type="button" onClick={() => vote(1)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500/20 py-3 font-bold text-emerald-200">
              <ThumbsUp className="h-5 w-5" /> More
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-emerald-800 bg-emerald-950/40 p-6">
          <h2 className="text-xl font-black">Round done.</h2>
          <p className="mt-1 text-sm text-zinc-300">Play now uses these votes. Export the brief below or come back on Thursday.</p>
        </section>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 p-5">
          <h3 className="font-bold">Funny share</h3>
          <p className="text-xs text-zinc-500">How many cards in Play are fbits.</p>
          <input
            type="range"
            min={10}
            max={60}
            value={Math.round(taste.funnyShare * 100)}
            onChange={(e) => update({ ...taste, funnyShare: Number(e.target.value) / 100 })}
            className="mt-3 w-full"
            aria-label="Funny share"
          />
          <p className="text-sm">{Math.round(taste.funnyShare * 100)}% funny</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 p-5">
          <h3 className="font-bold">What the feed thinks you like</h3>
          <ul className="mt-2 space-y-1 text-xs">
            {topWeights.slice(0, 5).map(([k, w]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="text-emerald-400">+{w.toFixed(1)}</span></li>
            ))}
            {topWeights.slice(-3).filter(([, w]) => w < 0).map(([k, w]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><span className="text-rose-400">{w.toFixed(1)}</span></li>
            ))}
            {topWeights.length === 0 && <li className="text-zinc-500">Nothing yet. Vote or play.</li>}
          </ul>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={exportJson} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">
          <Download className="h-4 w-4" /> Export taste brief (JSON)
        </button>
        <button
          type="button"
          onClick={() => {
            update({ ...DEFAULT_TASTE });
            setIndex(0);
          }}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm"
        >
          Reset taste
        </button>
      </div>
    </main>
  );
}
