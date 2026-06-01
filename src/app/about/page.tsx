import Link from "next/link";
import { ExternalLink, Github, Dices } from "lucide-react";
import { SCROLL_SOURCES } from "@/lib/scroll/sources";

export const metadata = {
  title: "About",
  description: "About Scroller — one feed for everything worth scrolling. Sources, stack, attribution.",
};

const STACK = [
  { name: "Next.js 15", desc: "App Router · React 19 · Server Components" },
  { name: "Tailwind CSS", desc: "Dark theme · zinc/emerald tokens" },
  { name: "Supabase", desc: "Auth + Postgres CMS (scroller_sites)" },
  { name: "MongoDB", desc: "AmazonDB.topSellers + AzDB.MAIN for Amazon picks" },
  { name: "AWS S3", desc: "com27 bucket with signed URLs for the image source" },
  { name: "Vercel", desc: "Hosting + edge caching · deployed to scroller-psi + scroller-bay" },
];

export default function AboutPage() {
  return (
    <div className="px-6 py-12 max-w-3xl mx-auto space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
          <Dices className="h-3.5 w-3.5 text-emerald-400" />
          Scroller · About
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-100">One feed. Every source.</h1>
        <p className="text-base text-zinc-400 max-w-2xl leading-relaxed">
          Scroller is a mobile-first vertical feed that mixes content from {SCROLL_SOURCES.length - 1} curated
          sources into a single daily-shuffled stream — YouTube videos, GitHub stars,
          AI prompts, the cleverfox/flexappdev app fleet, curated sites, random Wikipedia
          and WikiVoyage articles, Amazon Associates picks, and the com27 S3 image library.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 transition-colors"
          >
            <Dices className="h-3.5 w-3.5" />
            Start scrolling
          </Link>
          <a
            href="https://github.com/flexappdev/scroller"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            Source on GitHub
          </a>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">Sources</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCROLL_SOURCES.filter((s) => s.id !== "all").map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="flex items-start gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-4 py-3 hover:border-emerald-700/50 transition-colors group"
                style={{ borderLeftWidth: 3, borderLeftColor: s.accent }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400">{s.label}</div>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">Stack</h2>
        <ul className="space-y-2">
          {STACK.map((s) => (
            <li key={s.name} className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-4 py-2.5">
              <div className="text-sm font-medium text-zinc-100">{s.name}</div>
              <div className="text-xs text-zinc-500">{s.desc}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">Attribution &amp; disclosures</h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400 space-y-2">
          <p>
            <strong className="text-zinc-200">Amazon Associates.</strong> Amazon links on this site include the
            tag <code className="text-emerald-400">fs08-21</code>. As an Amazon Associate, the operator earns from
            qualifying purchases.
          </p>
          <p>
            <strong className="text-zinc-200">Wikipedia / WikiVoyage.</strong> Article excerpts are pulled live
            from the public REST API under{" "}
            <a className="underline hover:text-emerald-400" href="https://en.wikipedia.org/wiki/Wikipedia:Reusing_Wikipedia_content" target="_blank" rel="noreferrer">
              CC BY-SA 4.0
            </a>
            . All content links back to the source.
          </p>
          <p>
            <strong className="text-zinc-200">YouTube / GitHub.</strong> Feeds are read from public RSS / REST
            endpoints. Click-through opens the canonical YouTube / GitHub page.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono">Part of the fleet</h2>
        <p className="text-sm text-zinc-400">
          Scroller is one of 15+ sites Mat Siems ships under the{" "}
          <a className="text-emerald-400 hover:underline" href="https://github.com/flexappdev" target="_blank" rel="noreferrer">
            flexappdev
          </a>{" "}
          and{" "}
          <a className="text-emerald-400 hover:underline" href="https://github.com/cleverfox-ai" target="_blank" rel="noreferrer">
            cleverfox-ai
          </a>{" "}
          GitHub orgs. The full catalogue is browsable in{" "}
          <Link className="text-emerald-400 hover:underline inline-flex items-center gap-1" href="/apps">
            /apps
            <ExternalLink className="h-3 w-3" />
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
