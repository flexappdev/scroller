export const metadata = {
  title: "About",
  description: "About Scroller — one feed for everything worth scrolling.",
};

export default function AboutPage() {
  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          Scroller
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">Scroller</h1>
        <p className="mt-2 text-zinc-400">
          Mobile-first vertical feed across videos, repos, prompts, and apps. Deterministic daily shuffle seeded by today&apos;s date.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400" style={{ borderLeftWidth: 3, borderLeftColor: "var(--app-accent)" }}>
        <p>The home page (<code>/</code>) is the scroller itself. Open in mobile portrait view for the snap-scroll experience.</p>
        <p className="mt-2">Sources: YouTube (@mat-siems-production), GitHub stars (@flexappdev), top-100 AI prompts, and the wider apps catalogue from <code>~/APPS/apps-registry.json</code>.</p>
      </section>
    </div>
  );
}
