"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export default function AdSenseFeedCard({
  client,
  slot,
  afterItem,
}: {
  client: string;
  slot: string;
  afterItem: number;
}) {
  useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers, consent state, or an unfilled unit must never break scrolling.
    }
  }, [client, slot]);

  return (
    <section
      className="relative flex min-h-[100dvh] w-full snap-start snap-always items-center justify-center bg-zinc-950 px-5 py-24 text-white"
      aria-label={`Advertisement after item ${afterItem}`}
      data-testid="adsense-feed-card"
      data-after-item={afterItem}
    >
      <div className="w-full max-w-3xl">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Advertisement
        </p>
        <div className="min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </section>
  );
}
