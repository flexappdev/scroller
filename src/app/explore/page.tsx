import Link from "next/link";
import { listScrollerPacks } from "@/lib/scroller";

const SOURCES = [
  { href: "/browse", label: "All sources", description: "Mixed Scroller browser across every available source." },
  { href: "/wiki", label: "Wikipedia", description: "Knowledge cards and MediaAI-backed topics." },
  { href: "/wikivoyage", label: "WikiVoyage", description: "Places, guides and travel." },
  { href: "/videos", label: "Videos", description: "Video feeds and published media." },
  { href: "/images", label: "Images", description: "Generated image vault." },
  { href: "/amazon", label: "Amazon", description: "Ranked affiliate product picks." },
  { href: "/github", label: "GitHub", description: "Saved repositories worth exploring." },
  { href: "/prompts", label: "Prompts", description: "Reusable AI prompt library." },
];

export default async function ExplorePage() {
  const packs = await listScrollerPacks();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>Explore</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Pick a Scroller.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: "var(--foreground-muted)" }}>
        Browse published Top 100 packs or jump into one of the live content sources.
      </p>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.16em]">Scroller packs</h2>
          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{packs.length} available</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map(({ manifest, items }) => (
            <Link
              key={manifest.slug}
              href={`/scroller/${manifest.slug}`}
              className="rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                {items.length} cards
              </div>
              <h3 className="mt-2 text-lg font-black">{manifest.name}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5" style={{ color: "var(--foreground-muted)" }}>
                {manifest.tagline}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-sm font-black uppercase tracking-[0.16em]">Sources</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((source) => (
            <Link
              key={source.href}
              href={source.href}
              className="rounded-2xl border p-4 transition hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--border)", background: "var(--surface-soft)" }}
            >
              <div className="font-black">{source.label}</div>
              <p className="mt-1 text-xs leading-5" style={{ color: "var(--foreground-muted)" }}>{source.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
