"use client";

import { useEffect, useRef } from "react";

export type BookCard = {
  id: string;
  badge: string;
  kicker?: string | null;
  title: string;
  body?: string | null;
  meta?: string | null;
  facts?: { label: string; value: string }[];
  image?: string | null;
  video?: string | null;
  poster?: string | null;
  ctas?: { label: string; url: string; primary?: boolean }[];
};

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

function CardVideo({ src, poster, title }: { src: string; poster?: string | null; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-label={title}
      className="h-full w-full object-cover"
    />
  );
}

export default function BooksFeed({
  title,
  backHref = "/books",
  cards,
  footer,
}: {
  title: string;
  backHref?: string;
  cards: BookCard[];
  footer?: React.ReactNode;
}) {
  return (
    // AppShell already reserves the fixed header (3.5rem) and footer (4.5rem).
    <div className="relative bg-zinc-950 text-white">
      <a
        href={backHref}
        className="absolute left-3 top-2 z-10 max-w-[70%] truncate rounded-full bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur"
      >
        ← {title}
      </a>
      <span className="absolute right-3 top-2 z-10 rounded-full bg-black/70 px-3 py-1 text-xs text-white/70 backdrop-blur">
        {cards.length} cards
      </span>
      <div className="h-[calc(100svh-8rem)] snap-y snap-mandatory overflow-y-auto">
      {cards.map((card, index) => {
        const media = card.video || card.image;
        return (
          <section
            key={card.id}
            id={card.id}
            className="flex h-[calc(100svh-8rem)] snap-start snap-always items-stretch justify-center px-3 pb-3 pt-10 md:px-10"
          >
            <article className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-900 shadow-2xl md:max-w-3xl md:flex-row">
              {media ? (
                <div className="relative h-[42%] shrink-0 bg-black md:h-auto md:flex-1">
                  {card.video ? (
                    <CardVideo src={card.video} poster={card.poster ?? card.image} title={card.title} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.image!}
                      alt={card.title}
                      loading={index < 2 ? "eager" : "lazy"}
                      className={
                        card.image!.endsWith(".svg") ? "h-full w-full bg-white object-contain" : "h-full w-full object-contain"
                      }
                    />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {card.badge}
                  </span>
                </div>
              ) : null}
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5 md:p-7">
                {!media ? (
                  <span className="w-fit rounded-full bg-[#ec4899] px-3 py-1 text-xs font-semibold">{card.badge}</span>
                ) : null}
                {card.kicker ? <p className="text-xs uppercase tracking-[0.16em] text-[#f9a8d4]">{card.kicker}</p> : null}
                <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{card.title}</h1>
                {card.meta ? <p className="text-sm text-white/55">{card.meta}</p> : null}
                {card.body ? <p className="text-pretty text-base leading-7 text-white/75">{card.body}</p> : null}
                {card.facts?.length ? (
                  <dl className="grid grid-cols-3 gap-2">
                    {card.facts.map((f) => (
                      <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
                        <dt className="truncate text-[10px] uppercase tracking-wider text-white/45">{f.label}</dt>
                        <dd className="mt-1 text-sm font-semibold leading-tight">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {card.ctas?.length ? (
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {card.ctas.map((cta) => (
                      <a
                        key={cta.url + cta.label}
                        href={cta.url}
                        target={isExternal(cta.url) ? "_blank" : undefined}
                        rel={isExternal(cta.url) ? "noreferrer" : undefined}
                        className={
                          cta.primary
                            ? "rounded-full bg-[#ec4899] px-4 py-2 text-sm font-semibold transition hover:brightness-110"
                            : "rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          </section>
        );
      })}

      {footer ? (
        <section className="flex h-[calc(100svh-8rem)] snap-start items-center justify-center px-5 py-10">{footer}</section>
      ) : null}
      </div>
    </div>
  );
}
