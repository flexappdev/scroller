import Link from "next/link";
import { Hero } from "@/components/Hero";
import { APP, FEATURES, CATEGORIES } from "@/lib/app-config";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Hero
        warm
        eyebrow={APP.name}
        title={APP.tagline}
        subtitle={APP.description}
        primaryCta={{ href: "/about", label: "What's inside" }}
        secondaryCta={{ href: "/contact", label: "Get in touch →" }}
      />

      <section className="container max-w-5xl py-10">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {APP.long}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="container max-w-5xl py-14">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          What's inside
        </div>
        <h2 className="mt-2 font-serif text-3xl font-medium">
          Six surfaces. One source of truth.
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.anchor}
              href={`/about#${f.anchor}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 hover:border-foreground/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{f.title}</h3>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/30">
        <div className="container max-w-5xl py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Built by
              </div>
              <div className="mt-2 font-serif text-2xl font-medium">Mat + Claude</div>
              <p className="mt-2 text-sm text-muted-foreground">
                A small operator and an AI pair, shipping every week.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Designed for
              </div>
              <div className="mt-2 font-serif text-2xl font-medium">Mobile-first</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Vertical scroller next to chips, tiles, and a clean table view.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Updated
              </div>
              <div className="mt-2 font-serif text-2xl font-medium">Weekly</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Content refreshes on a weekly cadence — Wikipedia + manual edits.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            >
              Read the longer story
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href={`https://github.com/flexappdev/${APP.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
