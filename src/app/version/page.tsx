import Link from "next/link";
import { GitCommit, ExternalLink, Tag } from "lucide-react";
import pkg from "../../../package.json";

export const metadata = {
  title: "Version history · Scroller",
  description: "Scroller release notes — every version with a short summary of what shipped.",
};

// Fully static — no data deps. Cached at the edge indefinitely once built.
export const dynamic = "force-static";

type Release = {
  version: string;
  date: string;
  headline: string;
  commit?: string;
  bullets: string[];
};

// Newest first. Keep bullets tight (one-liners). Reflect what the code actually
// does, not marketing polish — this page doubles as an engineering changelog.
const RELEASES: Release[] = [
  {
    version: "2.2.0",
    date: "2026-07-26",
    headline: "Version page + footer version-link",
    bullets: [
      "New /version page listing every release with dated feature bullets",
      "StickyFooter version chip now links to /version",
      "Home + all 15 routes re-verified 200 under curl smoke",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-07-25",
    commit: "18e9f82",
    headline: "Mobile wiki-scroll + home crash fix + ISR",
    bullets: [
      "MobileWikiScroll component — wikai-pattern snap feed served as default at / on mobile UAs",
      "?view=desktop escape hatch back to the mixed feed on any device",
      "Home page: per-source .catch() fallbacks on all 9 fetchers — one bad source no longer pops error.tsx",
      "Dropped force-dynamic on / (revalidate=300 ISR); cleared contradictory force-dynamic + revalidate=600 on /wiki",
      "New /api/wiki/scroll?n=8 endpoint powers the mobile feed's near-end append",
      "QA: all 15 routes 200 including with stale S3 keys + failing Supabase fetch",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-06-10",
    commit: "37916e1",
    headline: "Content drop — video loops, wiki backfill, SourceHero",
    bullets: [
      "10 ambient 5s 864×480 MP4 loops on s3://com27/scroller/video-loops/ (Seedance bytedance:2@2)",
      "SourceHero component wired into 9 source pages",
      "Wiki Supabase backfill: 68,176 articles into scroller_wiki_index in 54s",
      "Third architecture diagram (content-pipeline.html) on /about",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-06-10",
    commit: "3f5b5d5",
    headline: "Desktop side-panel + S3 metadata + wiki PageBrowser",
    bullets: [
      "Desktop side-panel preview (lg+ screens shift <main> so grid + panel coexist)",
      "15-field S3 image metadata via HeadObjectCommand on /items/image:*",
      "/wiki converted to PageBrowser (same scroller/list/grid views as every other source page)",
      "WikiVoyage bulk cache — 67,856 articles via generator=allpages",
      "Runware FLUX OG hero + 100 FLUX prompt heroes on s3://com27/scroller/prompts/",
      "Two Cleverfox HTML+SVG architecture diagrams on /about (data-flow, cache-flow)",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-06-07",
    commit: "c419180",
    headline: "Dedicated source routes + screenshot pipeline",
    bullets: [
      "Dedicated /amazon, /wikivoyage, /images routes with their own browser/scroller views",
      "17 site screenshots + 100 prompt PNGs shipped to com27",
      "Global view-persistence (default = scroller on mobile, grid on desktop)",
      "Dual-channel YouTube (RSS + handle resolver)",
      "Mongo wiki cache fallback + com27 PublicReadScroller bucket policy",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-05-24",
    headline: "Prod-readiness baseline",
    bullets: [
      "Error boundaries (error.tsx, global-error.tsx, not-found.tsx)",
      "robots.txt + sitemap.xml + security headers + per-route OG metadata",
      "Supabase auth middleware + /admin shell + curated /sites",
      "First Vercel deploy to scroller-psi + scroller-bay",
    ],
  },
];

export default function VersionPage() {
  return (
    <div className="px-6 py-12 max-w-3xl mx-auto space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
          <Tag className="h-3.5 w-3.5 text-emerald-400" />
          Scroller · Version history
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">
          v{pkg.version}
        </h1>
        <p className="text-base text-zinc-400 max-w-2xl leading-relaxed">
          Every release of Scroller with a short summary of what shipped. Newest first.
          Source of truth: {" "}
          <a
            href="https://github.com/flexappdev/scroller"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            flexappdev/scroller
            <ExternalLink className="h-3 w-3" />
          </a>
          .
        </p>
      </header>

      <ol className="space-y-8">
        {RELEASES.map((r) => (
          <li
            key={r.version}
            className="relative rounded-lg border border-zinc-800/70 bg-zinc-950/40 p-5"
            style={{ borderLeftWidth: 3, borderLeftColor: "#10b981" }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-semibold text-zinc-100">
                v{r.version}
              </h2>
              <time className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                {r.date}
              </time>
            </div>
            <p className="mt-1 text-sm text-zinc-300">{r.headline}</p>
            {r.commit && (
              <a
                href={`https://github.com/flexappdev/scroller/commit/${r.commit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-emerald-400"
                title="View commit on GitHub"
              >
                <GitCommit className="h-3 w-3" />
                {r.commit}
              </a>
            )}
            <ul className="mt-4 space-y-1.5">
              {r.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <footer className="pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
        <Link href="/about" className="hover:text-emerald-400">← About Scroller</Link>
        <Link href="/" className="hover:text-emerald-400">Back to feed →</Link>
      </footer>
    </div>
  );
}
