import type { Metadata } from "next";
import { SystemArchitecture } from "@/components/admin/diagrams/SystemArchitecture";
import { CacheFlow } from "@/components/admin/diagrams/CacheFlow";
import { ContentPipeline } from "@/components/admin/diagrams/ContentPipeline";
import { SourceFetchers } from "@/components/admin/diagrams/SourceFetchers";
import { ImageResolver } from "@/components/admin/diagrams/ImageResolver";
import { MobileFeedAnatomy } from "@/components/admin/diagrams/MobileFeedAnatomy";
import { AuthGate } from "@/components/admin/diagrams/AuthGate";
import { StackOverview } from "@/components/admin/diagrams/StackOverview";

export const metadata: Metadata = {
  title: "Diagrams · Scroller",
  description:
    "Eight editorial tech diagrams of the Scroller codebase — stack, architecture, cache flow, source fetchers, image resolver, mobile card anatomy, auth gate, content pipeline.",
};

const ACCENT = "#10b981";

type Panel = {
  slug: string;
  type: string;
  title: string;
  caption: string;
  Component: React.ComponentType;
};

const PANELS: Panel[] = [
  {
    slug: "stack",
    type: "Layered",
    title: "Stack overview",
    caption:
      "Seven layers from the browser down. Read this first — everything else is a zoom into one of these bands.",
    Component: StackOverview,
  },
  {
    slug: "architecture",
    type: "Architecture",
    title: "System architecture",
    caption:
      "Nine parallel sources land in Next.js, get shuffled + normalised, and are served to desktop, mobile, admin, or edge.",
    Component: SystemArchitecture,
  },
  {
    slug: "cache-flow",
    type: "Flow",
    title: "Cache + fallback chain",
    caption:
      "Three-layer fallback: unstable_cache (hot · ISR 300s) → Mongo warm cache → S3 signed URL. Dashed = fallback path.",
    Component: CacheFlow,
  },
  {
    slug: "source-fetchers",
    type: "Fan-out",
    title: "Parallel source fetchers",
    caption:
      "Every source runs concurrently with its own `.catch()` fallback. A dead upstream shrinks the feed, never crashes it.",
    Component: SourceFetchers,
  },
  {
    slug: "image-resolver",
    type: "Decision",
    title: "imageFor(card) resolver",
    caption:
      "Each of the eight card kinds hits a different upstream. Any 404 collapses to a hashed 5-gradient background swatch.",
    Component: ImageResolver,
  },
  {
    slug: "mobile-anatomy",
    type: "Anatomy",
    title: "Mobile ArticleCard anatomy",
    caption:
      "Cover image + gradient overlay + emerald source chip + bottom-left title/extract + right-side 42px action rail. Cloned from wikai v1.6.",
    Component: MobileFeedAnatomy,
  },
  {
    slug: "auth-gate",
    type: "Sequence",
    title: "Supabase auth gate",
    caption:
      "Middleware allowlist gates /admin and /api/admin. Missing env returns 503 instead of 500 so the public app stays up during outages.",
    Component: AuthGate,
  },
  {
    slug: "content-pipeline",
    type: "Pipeline",
    title: "Content generation pipeline",
    caption:
      "ABC skills + bespoke scripts feed Runware FLUX, Seedance, and thum.io. Everything lands under s3://com27/scroller/*.",
    Component: ContentPipeline,
  },
];

export default function DiagramsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
          Editorial · abc-diagrams · {PANELS.length} sheets
        </div>
        <h1 className="mt-3 text-3xl font-bold text-zinc-100">Diagrams</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Eight editorial tech diagrams of the Scroller codebase in the{" "}
          <span style={{ fontStyle: "italic" }}>abc-diagrams</span> style — 4-grid, single accent (
          <span style={{ fontFamily: "ui-monospace, monospace" }}>#10b981</span>), hairline borders,
          no shadows. Inline SVG, no Mermaid.
        </p>
      </header>

      <nav
        className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs"
        aria-label="Diagram index"
      >
        <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">Index</div>
        <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {PANELS.map((p, i) => (
            <li key={p.slug}>
              <a
                href={`#${p.slug}`}
                className="text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                <span className="font-mono text-zinc-600">{String(i + 1).padStart(2, "0")}</span>{" "}
                {p.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {PANELS.map(({ slug, type, title, caption, Component }) => (
          <section key={slug} id={slug} className="space-y-3 scroll-mt-16">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-medium text-zinc-100" style={{ fontStyle: "italic" }}>
                {title}
              </h2>
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{type}</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <Component />
            </div>
            <p className="text-xs text-zinc-500" style={{ maxWidth: 720 }}>
              {caption}
            </p>
          </section>
        ))}
      </div>

      <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        Generated in the <code className="rounded bg-zinc-800/50 px-1 py-0.5">/abc-diagrams</code>{" "}
        style. Source components live under{" "}
        <code className="rounded bg-zinc-800/50 px-1 py-0.5">
          src/components/admin/diagrams/
        </code>
        .
      </footer>
    </div>
  );
}
