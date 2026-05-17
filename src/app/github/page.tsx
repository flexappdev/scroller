import { getStars } from "@/lib/fetchers";

export const revalidate = 1800;

export default async function GithubPage() {
  const { stars, truncated } = await getStars();
  const byLang = new Map<string, typeof stars>();
  for (const s of stars) {
    const key = s.language ?? "Other";
    if (!byLang.has(key)) byLang.set(key, []);
    byLang.get(key)!.push(s);
  }
  const groups = Array.from(byLang.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          FAD · GitHub Stars
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">GitHub Stars</h1>
        <p className="mt-2 text-zinc-400">
          {stars.length} repos starred by{" "}
          <a className="underline" href="https://github.com/flexappdev?tab=stars" target="_blank" rel="noreferrer">
            @flexappdev
          </a>
          {truncated && <span className="ml-2 text-amber-400">· rate-limited, list may be partial</span>}
        </p>
      </header>

      {groups.map(([lang, items]) => (
        <section key={lang} className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">
            {lang} <span className="ml-2 text-xs text-zinc-500">{items.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .slice()
              .sort((a, b) => b.stargazers_count - a.stargazers_count)
              .map((s) => (
                <a
                  key={s.full_name}
                  href={s.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
                  style={{ borderLeftWidth: 3, borderLeftColor: "var(--app-accent)" }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-zinc-100">{s.full_name}</h3>
                    <span className="shrink-0 text-[11px] text-zinc-500">★ {s.stargazers_count.toLocaleString()}</span>
                  </div>
                  {s.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{s.description}</p>}
                  {s.topics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.topics.slice(0, 5).map((t) => (
                        <span key={t} className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
