"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Dices, Flame, Share2, ThumbsDown, ThumbsUp, Timer, Trophy, X } from "lucide-react";
import type { DuelPack, FBit, KBit, PlayDeck } from "@/lib/play";
import { trackEvent } from "@/lib/analytics";
import { loadTaste, nudge, readLocal, saveTaste, weightOf, writeLocal, type TasteState } from "@/lib/taste";

type DuelCard = { kind: "duel"; id: string; pack: string; packName: string; a: KBit; b: KBit };
type Card = KBit | FBit | DuelCard;
type Slot = { key: string; card: Card; gold: boolean };

const GOLD_ODDS = 50;
const SURPRISE_SHARE = 0.1;
const SKIP_MS = 1200;
const LEARN_MS = 3500;

const today = () => new Date().toISOString().slice(0, 10);

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function weightedPick<T>(list: T[], weight: (item: T) => number): T {
  const weights = list.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

function keysOf(card: Card): string[] {
  if (card.kind === "kbit") return ["kind:kbit", `pack:${card.pack}`, ...card.tags.map((t) => `tag:${t}`)];
  if (card.kind === "fbit") return ["kind:fbit", `cat:${card.category}`];
  return ["kind:duel", `pack:${card.pack}`];
}

function hue(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

function wikaiLink(card: KBit): string | null {
  const wiki = card.sources.find((s) => /wikipedia\.org\/wiki\//.test(s.url));
  if (!wiki) return null;
  const title = wiki.url.split("/wiki/")[1];
  return title ? `https://wikai.tv/a/${title}` : null;
}

export default function PlayClient({ deck, duelParam }: { deck: PlayDeck; duelParam?: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [taste, setTaste] = useState<TasteState | null>(null);
  const [active, setActive] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [learnedToday, setLearnedToday] = useState(0);
  const [sessionLearned, setSessionLearned] = useState(0);
  const [sessionGold, setSessionGold] = useState(0);
  const [drawer, setDrawer] = useState<KBit | null>(null);
  const [spinLabel, setSpinLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [timerMin, setTimerMin] = useState(0);
  const [timerHit, setTimerHit] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const scroller = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string>>(new Set());
  const enteredAt = useRef<{ index: number; at: number }>({ index: 0, at: Date.now() });
  const sessionStart = useRef(Date.now());
  const tasteRef = useRef<TasteState | null>(null);
  tasteRef.current = taste;

  const kbitsByPack = useMemo(() => {
    const map = new Map<string, KBit[]>();
    for (const k of deck.kbits) map.set(k.pack, [...(map.get(k.pack) ?? []), k]);
    return map;
  }, [deck.kbits]);
  const kbitIndex = useMemo(() => new Map(deck.kbits.map((k) => [k.id, k])), [deck.kbits]);

  const flash = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const makeDuel = useCallback(
    (pack: DuelPack, idA?: string, idB?: string): DuelCard | null => {
      const ids = pack.ids;
      const a = kbitIndex.get(`${pack.slug}~${idA ?? pick(ids)}`);
      let b = kbitIndex.get(`${pack.slug}~${idB ?? pick(ids)}`);
      let guard = 0;
      while (!idB && a && b && a.id === b.id && guard < 10) {
        b = kbitIndex.get(`${pack.slug}~${pick(ids)}`);
        guard += 1;
      }
      if (!a || !b || a.id === b.id) return null;
      return { kind: "duel", id: `duel~${a.id}~${b.id}`, pack: pack.slug, packName: pack.name, a, b };
    },
    [kbitIndex],
  );

  const pickKbit = useCallback(
    (state: TasteState, packSlug?: string): KBit | null => {
      const packs = packSlug ? [packSlug] : [...kbitsByPack.keys()];
      if (packs.length === 0) return null;
      const slug = weightedPick(packs, (p) => weightOf(state, [`pack:${p}`]));
      const pool = kbitsByPack.get(slug) ?? [];
      const candidates = Array.from({ length: 8 }, () => pick(pool)).filter(
        (k) => k && !seen.current.has(k.id) && !state.never.includes(k.id),
      );
      if (candidates.length === 0) return pick(pool) ?? null;
      return weightedPick(candidates, (k) => weightOf(state, keysOf(k)));
    },
    [kbitsByPack],
  );

  const makeBatch = useCallback(
    (state: TasteState, n: number, packSlug?: string): Slot[] => {
      const out: Slot[] = [];
      for (let i = 0; i < n; i += 1) {
        let card: Card | null = null;
        let gold = false;
        const r = Math.random();
        if (packSlug) {
          card = pickKbit(state, packSlug);
        } else if (r < SURPRISE_SHARE) {
          if (deck.duelPacks.length && Math.random() < 0.6) card = makeDuel(pick(deck.duelPacks));
          if (!card) {
            card = pickKbit(state);
            gold = true;
          }
        } else if (r < SURPRISE_SHARE + state.funnyShare * (1 - SURPRISE_SHARE)) {
          const fresh = deck.fbits.filter((f) => !seen.current.has(f.id) && !state.never.includes(f.id));
          card = pick(fresh.length ? fresh : deck.fbits);
        } else {
          card = pickKbit(state);
        }
        if (!card) continue;
        if (card.kind === "kbit" && Math.random() < 1 / GOLD_ODDS) gold = true;
        seen.current.add(card.id);
        out.push({ key: `${card.id}~${Date.now()}~${Math.random().toString(36).slice(2, 7)}`, card, gold });
      }
      return out;
    },
    [deck.duelPacks, deck.fbits, makeDuel, pickKbit],
  );

  // First deal happens on the client only, so the shuffle never fights hydration.
  useEffect(() => {
    const state = loadTaste();
    setTaste(state);
    const learned = readLocal<{ date: string; ids: string[] }>("scroller-learned", { date: today(), ids: [] });
    setLearnedToday(learned.date === today() ? learned.ids.length : 0);
    setBest(readLocal<number>("scroller-best-streak", 0));
    setTimerMin(readLocal<number>("scroller-timer", 0));
    const first: Slot[] = [];
    if (duelParam) {
      const [slug, a, b] = duelParam.split("~");
      const pack = deck.duelPacks.find((p) => p.slug === slug);
      const duel = pack ? makeDuel(pack, a, b) : null;
      if (duel) first.push({ key: `${duel.id}~shared`, card: duel, gold: false });
    }
    setSlots([...first, ...makeBatch(state, 20)]);
    trackEvent("play_start", { shared_duel: Boolean(duelParam) });
  }, [deck.duelPacks, duelParam, makeBatch, makeDuel]);

  const updateTaste = useCallback((next: TasteState) => {
    setTaste(next);
    saveTaste(next);
  }, []);

  const markLearned = useCallback((id: string) => {
    const learned = readLocal<{ date: string; ids: string[] }>("scroller-learned", { date: today(), ids: [] });
    const ids = learned.date === today() ? learned.ids : [];
    if (ids.includes(id)) return;
    ids.push(id);
    writeLocal("scroller-learned", { date: today(), ids });
    setLearnedToday(ids.length);
    setSessionLearned((n) => n + 1);
  }, []);

  const onLeave = useCallback(
    (index: number, dwell: number) => {
      const slot = slots[index];
      const state = tasteRef.current;
      if (!slot || !state) return;
      if (slot.card.kind === "duel") return;
      if (dwell < SKIP_MS) {
        updateTaste(nudge(state, keysOf(slot.card), -0.25));
        trackEvent("play_skip", { kind: slot.card.kind });
      } else if (dwell > LEARN_MS) {
        updateTaste(nudge(state, keysOf(slot.card), 0.1));
        if (slot.card.kind === "kbit") markLearned(slot.card.id);
      }
    },
    [markLearned, slots, updateTaste],
  );

  const onEnter = useCallback(
    (index: number) => {
      const slot = slots[index];
      if (!slot) return;
      trackEvent("play_card_view", { kind: slot.card.kind, gold: slot.gold, index });
      if (slot.gold && slot.card.kind === "kbit") {
        const vault = readLocal<{ id: string; title: string; pack: string; at: string }[]>("scroller-vault", []);
        if (!vault.some((v) => v.id === slot.card.id)) {
          vault.unshift({ id: slot.card.id, title: slot.card.title, pack: slot.card.packName, at: today() });
          writeLocal("scroller-vault", vault.slice(0, 200));
        }
        setSessionGold((n) => n + 1);
        flash("Gold drop! Saved to your vault");
        trackEvent("play_gold", { id: slot.card.id });
      }
    },
    [flash, slots],
  );

  // Track which card fills the screen, how long it stayed, and deal more near the end.
  useEffect(() => {
    const root = scroller.current;
    if (!root || slots.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          const prev = enteredAt.current;
          if (prev.index === index) continue;
          onLeave(prev.index, Date.now() - prev.at);
          enteredAt.current = { index, at: Date.now() };
          setActive(index);
          onEnter(index);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onEnter, onLeave, slots]);

  useEffect(() => {
    if (!taste || slots.length === 0) return;
    if (active > slots.length - 6) setSlots((s) => [...s, ...makeBatch(taste, 15)]);
  }, [active, makeBatch, slots.length, taste]);

  // Self-set session timer.
  useEffect(() => {
    if (!timerMin || timerHit) return;
    const id = window.setInterval(() => {
      if (Date.now() - sessionStart.current >= timerMin * 60_000) setTimerHit(true);
    }, 10_000);
    return () => window.clearInterval(id);
  }, [timerHit, timerMin]);

  // Keyboard: arrows or j/k move one card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = scroller.current;
      if (!root || drawer) return;
      if (e.key === "ArrowDown" || e.key === "j") root.scrollBy({ top: root.clientHeight, behavior: "smooth" });
      if (e.key === "ArrowUp" || e.key === "k") root.scrollBy({ top: -root.clientHeight, behavior: "smooth" });
      if (e.key === "Escape") setDrawer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const goTo = (index: number) => {
    const root = scroller.current;
    if (root) root.scrollTo({ top: index * root.clientHeight, behavior: "smooth" });
  };

  const spin = () => {
    if (!taste || spinLabel) return;
    const names = [...kbitsByPack.values()].map((list) => list[0].packName).concat("Funny 100");
    let ticks = 0;
    const id = window.setInterval(() => {
      setSpinLabel(pick(names));
      ticks += 1;
      if (ticks < 12) return;
      window.clearInterval(id);
      const slugs = [...kbitsByPack.keys()];
      const choice = Math.random() < 1 / (slugs.length + 1) ? null : pick(slugs);
      const batch = choice ? makeBatch(taste, 5, choice) : makeBatch({ ...taste, funnyShare: 1 }, 5);
      const label = choice ? kbitsByPack.get(choice)?.[0].packName ?? "Surprise" : "Funny 100";
      setSpinLabel(label);
      setSlots((s) => [...s.slice(0, active + 1), ...batch, ...s.slice(active + 1)]);
      trackEvent("play_spin", { landed: choice ?? "funny" });
      window.setTimeout(() => {
        setSpinLabel(null);
        goTo(active + 1);
      }, 700);
    }, 80);
  };

  const more = (card: Card) => {
    if (!taste) return;
    let next = nudge(taste, keysOf(card), 1);
    if (card.kind === "fbit") next = { ...next, funnyShare: Math.min(0.6, next.funnyShare + 0.03) };
    updateTaste(next);
    flash("More like this");
    trackEvent("play_more", { kind: card.kind });
  };

  const never = (card: Card) => {
    if (!taste) return;
    let next = nudge(taste, keysOf(card), -1);
    next = { ...next, never: [...next.never, card.id].slice(-2000) };
    if (card.kind === "fbit") next = { ...next, funnyShare: Math.max(0.1, next.funnyShare - 0.03) };
    updateTaste(next);
    flash("Never again");
    trackEvent("play_never", { kind: card.kind });
    goTo(active + 1);
  };

  const share = async (card: Card) => {
    const url =
      card.kind === "duel"
        ? `${window.location.origin}/play?duel=${card.pack}~${card.a.id.split("~")[1]}~${card.b.id.split("~")[1]}`
        : `${window.location.origin}/play`;
    const text = card.kind === "duel" ? `${card.a.title} or ${card.b.title}? Which ranks higher?` : card.title;
    try {
      if (navigator.share) await navigator.share({ title: "Scroller", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        flash("Link copied");
      }
      trackEvent("play_share", { kind: card.kind });
    } catch {
      // user cancelled
    }
  };

  const answerDuel = (card: DuelCard, choice: KBit) => {
    if (answers[card.id]) return;
    const winner = (card.a.rank ?? 0) < (card.b.rank ?? 0) ? card.a : card.b;
    const correct = choice.id === winner.id;
    setAnswers((a) => ({ ...a, [card.id]: choice.id }));
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    if (nextStreak > best) {
      setBest(nextStreak);
      writeLocal("scroller-best-streak", nextStreak);
    }
    const gap = Math.abs((card.a.rank ?? 0) - (card.b.rank ?? 0));
    if (correct) flash(nextStreak >= 3 ? `${nextStreak} in a row!` : "Correct");
    else flash(gap <= 5 ? `So close: only ${gap} places apart` : "Not this time");
    markLearned(card.a.id);
    markLearned(card.b.id);
    trackEvent("play_duel_answer", { correct, streak: nextStreak, gap });
  };

  const setTimer = (min: number) => {
    setTimerMin(min);
    writeLocal("scroller-timer", min);
    sessionStart.current = Date.now();
    setTimerHit(false);
    flash(min ? `Timer set: ${min} min` : "Timer off");
  };

  if (slots.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black text-white">
        <p className="animate-pulse text-sm tracking-widest text-zinc-400">SHUFFLING…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white">
      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent p-3 md:p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link href="/" aria-label="Leave Play" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-4 w-4" />
          </Link>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">🧠 {learnedToday} today</span>
          <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${streak >= 3 ? "bg-orange-500/90" : "bg-white/10"}`}>
            <Flame className="h-3.5 w-3.5" /> {streak}
            <span className="hidden text-white/60 sm:inline">· best {best}</span>
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link href="/tv" className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 sm:block">
            TV mode
          </Link>
          <label className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-xs">
            <Timer className="h-3.5 w-3.5" />
            <select
              aria-label="Session timer"
              value={timerMin}
              onChange={(e) => setTimer(Number(e.target.value))}
              className="bg-transparent text-xs outline-none [&>option]:text-black"
            >
              <option value={0}>Off</option>
              <option value={10}>10m</option>
              <option value={20}>20m</option>
              <option value={30}>30m</option>
            </select>
          </label>
          <button
            type="button"
            onClick={spin}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black shadow-lg"
          >
            <Dices className="h-4 w-4" /> Spin
          </button>
        </div>
      </div>

      {/* Feed */}
      <div ref={scroller} className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none]">
        {slots.map((slot, index) => (
          <section key={slot.key} data-index={index} className="relative h-[100dvh] snap-start snap-always overflow-hidden">
            {slot.card.kind === "kbit" && <KbitCard card={slot.card} gold={slot.gold} onDeeper={() => setDrawer(slot.card as KBit)} />}
            {slot.card.kind === "fbit" && <FbitCard card={slot.card} />}
            {slot.card.kind === "duel" && (
              <DuelView card={slot.card} answer={answers[slot.card.id]} onAnswer={(k) => answerDuel(slot.card as DuelCard, k)} />
            )}
            {/* Action rail */}
            <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-4 md:right-6">
              {slot.card.kind !== "duel" && (
                <>
                  <RailButton label="More" onClick={() => more(slot.card)}>
                    <ThumbsUp className="h-5 w-5" />
                  </RailButton>
                  <RailButton label="Never" onClick={() => never(slot.card)}>
                    <ThumbsDown className="h-5 w-5" />
                  </RailButton>
                </>
              )}
              {slot.card.kind === "kbit" && (
                <RailButton label="Deeper" onClick={() => setDrawer(slot.card as KBit)}>
                  <BookOpen className="h-5 w-5" />
                </RailButton>
              )}
              <RailButton label="Share" onClick={() => share(slot.card)}>
                <Share2 className="h-5 w-5" />
              </RailButton>
            </div>
          </section>
        ))}
      </div>

      {/* Spin reel */}
      {spinLabel && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-3xl border-2 border-amber-400 bg-zinc-950 px-8 py-6 text-center shadow-[0_0_60px_rgba(251,191,36,0.4)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Spinning</p>
            <p className="mt-2 max-w-xs text-2xl font-black">{spinLabel}</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-xl">
          {toast}
        </div>
      )}

      {drawer && <Drawer card={drawer} onClose={() => setDrawer(null)} />}

      {timerHit && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/85 p-6">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-950 p-6 text-center">
            <Trophy className="mx-auto h-10 w-10 text-amber-400" />
            <h2 className="mt-3 text-2xl font-black">Time&apos;s up</h2>
            <p className="mt-2 text-zinc-300">
              You learned <b>{sessionLearned}</b> things in {timerMin} minutes, best streak <b>{best}</b>, gold drops <b>{sessionGold}</b>.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setTimer(5)} className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-semibold">
                5 more minutes
              </button>
              <Link href="/" className="flex-1 rounded-full bg-white py-2.5 text-sm font-bold text-black">
                Done
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 text-[10px] font-semibold text-white/80">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">{children}</span>
      {label}
    </button>
  );
}

function KbitCard({ card, gold, onDeeper }: { card: KBit; gold: boolean; onDeeper: () => void }) {
  const h = hue(card.pack);
  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ background: `radial-gradient(120% 80% at 20% 10%, hsl(${h} 70% 28%), hsl(${(h + 60) % 360} 60% 8%) 70%)` }}
    >
      {card.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      {gold && <div className="pointer-events-none absolute inset-0 border-[6px] border-amber-400 shadow-[inset_0_0_80px_rgba(251,191,36,0.45)]" />}
      <div className="relative z-10 max-w-2xl p-6 pb-28 pr-20 md:p-12 md:pb-16">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]">
          {gold && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-black">Gold · 1 in 50</span>}
          <span className="text-emerald-300">Kbit</span>
          <span className="text-white/60">{card.packName}</span>
          {card.rank !== undefined && <span className="text-white/60">#{card.rank}</span>}
        </div>
        <h2 className="text-balance text-3xl font-black leading-tight tracking-tight md:text-5xl">{card.title}</h2>
        <p className="mt-4 line-clamp-6 text-lg leading-relaxed text-white/90 md:text-xl">{card.content}</p>
        <button type="button" onClick={onDeeper} className="mt-5 text-sm font-semibold text-emerald-300 underline-offset-4 hover:underline">
          Go deeper →
        </button>
      </div>
    </div>
  );
}

function FbitCard({ card }: { card: FBit }) {
  const h = hue(card.category);
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center py-6 pl-6 pr-20 text-center md:px-24"
      style={{ background: `linear-gradient(160deg, hsl(${h} 80% 55%), hsl(${(h + 40) % 360} 70% 25%))` }}
    >
      <div className="text-[96px] leading-none md:text-[140px]">{card.emoji}</div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black/70">Fbit · {card.category}</p>
      <h2 className="mt-2 max-w-xl text-balance text-3xl font-black leading-tight text-black md:text-5xl">{card.title}</h2>
      <p className="mt-4 max-w-lg text-lg font-medium text-black/80 md:text-xl">{card.content}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-black/15 px-3 py-1.5 text-black">{card.setup}</span>
        <span className="rounded-full bg-black/25 px-3 py-1.5 text-black">{card.turn}</span>
        <span className="rounded-full bg-black px-3 py-1.5 text-white">{card.punchline}</span>
      </div>
    </div>
  );
}

function DuelView({ card, answer, onAnswer }: { card: DuelCard; answer?: string; onAnswer: (k: KBit) => void }) {
  const winner = (card.a.rank ?? 0) < (card.b.rank ?? 0) ? card.a : card.b;
  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950">
      <div className="px-6 pt-20 text-center md:pt-24">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-400">Duel · {card.packName}</p>
        <h2 className="mt-2 text-2xl font-black md:text-4xl">Which ranks higher?</h2>
      </div>
      <div className="grid flex-1 grid-rows-2 gap-3 p-4 pb-24 pr-20 md:grid-cols-2 md:grid-rows-1 md:p-8 md:pr-24">
        {[card.a, card.b].map((k) => {
          const picked = answer === k.id;
          const reveal = Boolean(answer);
          const isWinner = k.id === winner.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => onAnswer(k)}
              disabled={reveal}
              className={`relative overflow-hidden rounded-3xl border-4 text-left transition ${
                reveal ? (isWinner ? "border-emerald-400" : "border-rose-500/70 opacity-70") : "border-white/10 hover:border-white/40"
              }`}
            >
              {k.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={k.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 p-5">
                {reveal && <p className="text-4xl font-black text-amber-300">#{k.rank}</p>}
                <p className="text-2xl font-black md:text-3xl">{k.title}</p>
                {picked && <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/70">Your pick</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Drawer({ card, onClose }: { card: KBit; onClose: () => void }) {
  const wikai = wikaiLink(card);
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[80dvh] w-full overflow-y-auto rounded-t-3xl border-t border-zinc-700 bg-zinc-950 p-6 md:mx-auto md:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-700" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">{card.packName}</p>
        <h3 className="mt-1 text-2xl font-black">{card.title}</h3>
        {card.hook && <p className="mt-2 text-sm font-semibold text-amber-300">{card.hook}</p>}
        <p className="mt-3 leading-relaxed text-zinc-200">{card.content}</p>
        <div className="mt-5 flex flex-col gap-2">
          {card.cta && (
            <a
              href={card.cta.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() => trackEvent("affiliate_click", { source: "play_drawer", pack: card.pack })}
              className="rounded-full bg-amber-400 px-4 py-3 text-center text-sm font-bold text-black"
            >
              {card.cta.label}
            </a>
          )}
          {wikai && (
            <a href={wikai} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-semibold">
              Read the full story on wikai.tv
            </a>
          )}
          <Link href={`/scroller/${card.pack}`} className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-semibold">
            Open the whole pack
          </Link>
        </div>
        {card.sources.length > 0 && (
          <ul className="mt-5 space-y-1 text-xs text-zinc-400">
            {card.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Source: {s.title}
                </a>
              </li>
            ))}
          </ul>
        )}
        {card.cta && /amazon\./.test(card.cta.url) && <p className="mt-4 text-[10px] text-zinc-500">As an Amazon Associate we earn from qualifying purchases.</p>}
      </div>
    </div>
  );
}
