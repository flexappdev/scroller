"use client";

import type { ScrollerItem, ScrollerManifest } from "@/lib/scroller";

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}

export default function ScrollerFeed({
  manifest,
  items,
  totalCount,
}: {
  manifest: ScrollerManifest;
  items: ScrollerItem[];
  totalCount: number;
}) {
  const monetization = manifest.monetization;
  const dark = manifest.theme !== "light";

  return (
    <main
      className={[
        "h-[100svh] overflow-y-auto snap-y snap-mandatory",
        dark ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-950",
      ].join(" ")}
    >
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-4 py-3 text-sm backdrop-blur md:px-8">
        <a href="/scroller" className="font-semibold tracking-tight">
          {manifest.name}
        </a>
        <span className="text-xs text-white/60">{totalCount} cards</span>
      </header>

      {items.map((item, index) => (
        <section
          key={item.id}
          className="relative flex min-h-[100svh] snap-start items-center justify-center px-5 py-20 md:px-10"
        >
          <article className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur md:p-12">
            <div className="mb-8 flex items-center justify-between gap-4">
              <span className="rounded-full bg-[#006699] px-3 py-1 text-xs font-semibold text-white">
                {String(index + 1).padStart(2, "0")} / {String(totalCount).padStart(2, "0")}
              </span>
              {item.tags?.[0] ? (
                <span className="text-xs uppercase tracking-[0.18em] text-white/45">{item.tags[0]}</span>
              ) : null}
            </div>

            {item.hook ? <p className="mb-3 text-sm font-medium text-[#6cc4e8]">{item.hook}</p> : null}
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">{item.title}</h1>
            <p className="mt-6 text-pretty text-lg leading-8 text-white/75 md:text-xl md:leading-9">{item.content}</p>
            {item.explanation ? <p className="mt-5 text-base leading-7 text-white/55">{item.explanation}</p> : null}

            {item.cta ? (
              <a
                href={item.cta.url}
                target={isExternalUrl(item.cta.url) ? "_blank" : undefined}
                rel={isExternalUrl(item.cta.url) ? "noreferrer" : undefined}
                className="mt-8 inline-flex rounded-full bg-[#006699] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {item.cta.label}
              </a>
            ) : null}
          </article>

          <div className="absolute bottom-5 text-xs text-white/35">Scroll for next</div>
        </section>
      ))}

      {monetization ? (
        <section className="flex min-h-[100svh] snap-start items-center justify-center px-5 py-20 md:px-10">
          <article className="w-full max-w-3xl rounded-[2rem] border border-[#006699]/50 bg-[#006699]/10 p-8 text-center shadow-2xl md:p-14">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6cc4e8]">
              {monetization.type}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              {monetization.offer ?? "Put this into practice"}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">
              You have seen {items.length} of {totalCount} cards. Continue with the offer that turns the ideas into an outcome.
            </p>
            <a
              href={monetization.ctaUrl}
              target={isExternalUrl(monetization.ctaUrl) ? "_blank" : undefined}
              rel={isExternalUrl(monetization.ctaUrl) ? "noreferrer" : undefined}
              className="mt-8 inline-flex rounded-full bg-[#006699] px-6 py-3 font-semibold text-white transition hover:brightness-110"
            >
              {monetization.ctaLabel}
            </a>
          </article>
        </section>
      ) : null}
    </main>
  );
}
