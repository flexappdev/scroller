"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Check, Dices, ExternalLink, Globe, Layers, Share2 } from "lucide-react";
import type { RandomCard, RandomPage, RandomSource } from "@/lib/random-feed";
import { trackEvent } from "@/lib/analytics";

const SOURCE_META: Record<RandomSource, { label: string; Icon: typeof Globe; tone: string }> = {
  wiki: { label: "Wikipedia", Icon: Globe, tone: "bg-sky-500/90" },
  pack: { label: "Pack", Icon: Layers, tone: "bg-[#006699]" },
  book: { label: "Book", Icon: BookOpen, tone: "bg-amber-500/90" },
};

function hue(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

export default function RandomClient({
  seed,
  initial,
  nextOffset: initialNext,
  counts,
}: {
  seed: number;
  initial: RandomCard[];
  nextOffset: number;
  counts: Record<RandomSource, number>;
}) {
  const [cards, setCards] = useState<RandomCard[]>(initial);
  const [nextOffset, setNextOffset] = useState(initialNext);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initial.length === 0);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set(initial.map((c) => c.id)));

  const total = counts.pack + counts.wiki + counts.book;

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/random?seed=${seed}&offset=${nextOffset}&limit=20`);
      if (!res.ok) throw new Error(String(res.status));
      const page = (await res.json()) as RandomPage;
      // Keys must stay unique even when the endless feed loops round.
      const fresh = page.items.map((card) => {
        const key = seen.current.has(card.id) ? `${card.id}#${nextOffset}` : card.id;
        seen.current.add(card.id);
        return { ...card, key };
      });
      setCards((prev) => [...prev, ...fresh]);
      if (page.nextOffset <= nextOffset) setDone(true);
      setNextOffset(page.nextOffset);
    } catch (error) {
      console.error("[random] load failed", error);
    } finally {
      setLoading(false);
    }
  }, [done, loading, nextOffset, seed]);

  // Track the card in view; fetch more when 5 from the end.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setActive(index);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [cards.length]);

  useEffect(() => {
    if (active >= cards.length - 5) void loadMore();
  }, [active, cards.length, loadMore]);

  const activeCard = cards[active];
  useEffect(() => {
    if (activeCard) trackEvent("random_card_view", { card_id: activeCard.id, source: activeCard.source, position: active });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Keyboard: j/k and arrow keys step through cards, r reshuffles.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const root = scroller.current;
      if (!root) return;
      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        root.scrollBy({ top: root.clientHeight, behavior: "smooth" });
      } else if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        root.scrollBy({ top: -root.clientHeight, behavior: "smooth" });
      } else if (event.key === "r") {
        window.location.href = "/random";
      }
    };
    // The footer's Random button reshuffles when you're already here.
    const onRandom = () => {
      window.location.href = "/random";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroller:random", onRandom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroller:random", onRandom);
    };
  }, []);

  async function share(card: RandomCard) {
    const url = new URL("/random", window.location.origin);
    url.searchParams.set("card", card.id);
    url.searchParams.set("seed", String(seed));
    const link = url.toString();
    trackEvent("share", { method: "random", content_type: card.source, item_id: card.id });
    try {
      if (navigator.share) {
        await navigator.share({ title: card.title, text: card.body || card.kicker, url: link });
        return;
      }
    } catch {
      // Cancelled or blocked: fall back to copying.
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(card.id);
      setTimeout(() => setCopied((id) => (id === card.id ? null : id)), 1800);
    } catch {
      window.prompt("Copy this link", link);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Dices className="h-10 w-10 opacity-60" />
        <p className="text-lg font-semibold">Nothing to shuffle yet.</p>
        <p className="text-sm opacity-60">Add a Scroller pack, the Wikipedia top list or the books channel and they appear here.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-[4.5rem] top-14 z-10 bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-3 pb-6 pt-2 md:px-5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
          <Dices className="h-4 w-4" /> Random
          <span className="font-normal normal-case tracking-normal text-white/50">
            · {total.toLocaleString("en-GB")} cards
          </span>
        </span>
        <a
          href="/random"
          onClick={() => trackEvent("random_reshuffle", { seed })}
          className="pointer-events-auto rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25"
        >
          Shuffle again
        </a>
      </div>

      <div
        ref={scroller}
        className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none]"
      >
        {cards.map((card, index) => {
          const meta = SOURCE_META[card.source];
          const key = (card as RandomCard & { key?: string }).key ?? card.id;
          const h = hue(card.title);
          return (
            <section
              key={key}
              data-index={index}
              data-card={card.id}
              className="relative h-full snap-start snap-always overflow-hidden"
              style={card.image ? undefined : { background: `linear-gradient(160deg, hsl(${h} 55% 22%), hsl(${(h + 60) % 360} 45% 8%))` }}
            >
              {card.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt=""
                    aria-hidden
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt=""
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="absolute inset-x-0 top-0 h-[62%] w-full object-contain"
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                </>
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-3xl flex-col gap-3 p-5 pr-20 md:p-8 md:pr-24">
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${meta.tone}`}>
                    <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
                  </span>
                  <span className="text-white/60">{card.kicker}</span>
                </span>
                <h2 className="text-2xl font-bold leading-tight md:text-4xl">{card.title}</h2>
                {card.body ? <p className="line-clamp-5 text-sm leading-6 text-white/80 md:text-base">{card.body}</p> : null}
                <div className="mt-1 flex flex-wrap gap-2">
                  {card.href ? (
                    <a
                      href={card.href}
                      target={isExternal(card.href) ? "_blank" : undefined}
                      rel={isExternal(card.href) ? "noopener" : undefined}
                      onClick={() => trackEvent("random_open", { card_id: card.id, source: card.source })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                    >
                      {card.hrefLabel} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  {card.cta ? (
                    <a
                      href={card.cta.url}
                      target="_blank"
                      rel="sponsored noopener"
                      onClick={() => trackEvent("affiliate_click", { card_id: card.id, source: card.source, url: card.cta?.url })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                    >
                      {card.cta.label}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="absolute bottom-6 right-3 z-10 flex flex-col items-center gap-4 md:right-6">
                <button
                  type="button"
                  onClick={() => void share(card)}
                  aria-label={`Share ${card.title}`}
                  className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/85"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
                    {copied === card.id ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                  </span>
                  {copied === card.id ? "Copied" : "Share"}
                </button>
                <a
                  href="/random"
                  aria-label="Shuffle again"
                  onClick={() => trackEvent("random_reshuffle", { seed })}
                  className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/85"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25">
                    <Dices className="h-5 w-5" />
                  </span>
                  Shuffle
                </a>
              </div>
            </section>
          );
        })}
        {loading ? <div className="flex h-24 items-center justify-center text-sm text-white/60">Shuffling…</div> : null}
      </div>
    </div>
  );
}
