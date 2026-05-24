import { listSites } from "@/lib/cms/sites";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sites · Scroller",
  description: "Curated sites worth scrolling — tech, design, travel, news.",
};

export default async function PublicSitesPage() {
  const sites = await listSites({ status: "published" });

  if (sites.length === 0) {
    return (
      <div className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Sites</h1>
        <p className="mt-3 text-sm text-zinc-400">
          No sites curated yet. Coming soon — a hand-picked list of sites worth scrolling.
        </p>
      </div>
    );
  }

  const byCategory = sites.reduce<Record<string, typeof sites>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="px-6 py-12 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Sites</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          A curated set of sites worth scrolling. Updated when something new earns a spot.
        </p>
      </header>

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category} className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-4">{category}</h2>
          <ul className="space-y-3">
            {items.map((s) => (
              <li key={s.id} className="group">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline gap-4 rounded-lg border border-zinc-800/60 hover:border-emerald-700/50 bg-zinc-950/40 p-4 transition-colors"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0 mt-2"
                    style={{ background: s.accent || "#10b981" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {s.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono truncate">
                        {new URL(s.url).hostname.replace(/^www\./, "")}
                      </span>
                    </div>
                    {s.description && (
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{s.description}</p>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="mt-12 pt-6 border-t border-zinc-800 text-xs text-zinc-500">
        {sites.length} {sites.length === 1 ? "site" : "sites"}, curated.
      </footer>
    </div>
  );
}
