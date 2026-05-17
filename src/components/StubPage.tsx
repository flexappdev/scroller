type Props = {
  title: string;
  slug: string;
  note?: string;
};

export default function StubPage({ title, slug, note }: Props) {
  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--app-accent)" }}
          />
          FAD · {slug}
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">{title}</h1>
        <p className="mt-2 text-zinc-400">
          {note ?? `Migrated from flexappdev.com/${slug}. Content coming soon.`}
        </p>
      </header>

      <section
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400"
        style={{ borderLeftWidth: 3, borderLeftColor: "var(--app-accent)" }}
      >
        <p>This page is a stub. The original flexappdev.com page contained no body content at time of migration.</p>
        <p className="mt-2">Use this slot to publish the {title.toLowerCase()} list, dashboard, or guide.</p>
      </section>
    </div>
  );
}
