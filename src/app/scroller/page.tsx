import Link from "next/link";
import { listScrollerPacks } from "@/lib/scroller";

export const metadata = {
  title: "Scroller",
  description: "Fast, focused vertical guides built from reusable Scroller Packs.",
};

export default async function ScrollerIndexPage() {
  const packs = await listScrollerPacks();

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-16 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6cc4e8]">Scroller</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-7xl">One engine. Many focused feeds.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">
          Each Scroller is generated from a small manifest and item list, then rendered by the same revenue-ready runtime.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {packs.map(({ manifest, items }) => (
            <Link
              key={manifest.slug}
              href={`/scroller/${manifest.slug}`}
              className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 transition hover:border-[#006699]/70 hover:bg-white/[0.08]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#006699] px-3 py-1 text-xs font-semibold">{items.length} cards</span>
                {manifest.monetization ? (
                  <span className="text-xs uppercase tracking-[0.16em] text-white/40">{manifest.monetization.type}</span>
                ) : null}
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">{manifest.name}</h2>
              <p className="mt-3 text-white/60">{manifest.tagline}</p>
              <span className="mt-7 inline-flex text-sm font-semibold text-[#6cc4e8]">Open Scroller →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
