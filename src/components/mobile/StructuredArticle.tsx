"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { MobileFeedItem } from "@/lib/mobile/adapters";

export default function StructuredArticle({ item, onClose }: { item: MobileFeedItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${item.title} details`} onClick={onClose}>
      <article className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border-t border-black/10 bg-white px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-3 text-zinc-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300" />
        <button type="button" onClick={onClose} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-100 px-4 text-sm font-semibold" aria-label="Close details"><ArrowLeft className="h-4 w-4" /> Back to feed</button>
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: item.accent }}><span className="h-2 w-2 rounded-full" style={{ background: item.accent }} />{item.sourceLabel}</div>
        <h2 className="text-[clamp(2rem,10vw,3.5rem)] font-black leading-[0.98] tracking-[-0.045em]">{item.title}</h2>
        <p className="mt-4 text-sm font-medium text-zinc-500">{item.meta}</p>
        <p className="mt-6 whitespace-pre-line text-[17px] leading-7 text-zinc-700">{item.description}</p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link href={item.internalHref} className="flex min-h-12 items-center justify-center rounded-2xl bg-black px-4 text-sm font-bold text-white/95">Full details</Link>
          <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-900">{item.externalLabel} <ExternalLink className="h-4 w-4" /></a>
        </div>
      </article>
    </div>
  );
}
