import { getApps } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  const { apps, domains, target } = await getApps();
  const real = apps.filter((a) => !a.placeholder);
  const byDomain = domains.map((d) => ({
    domain: d,
    items: apps.filter((a) => a.domain === d.id),
  }));

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          FAD · Apps
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">Apps</h1>
        <p className="mt-2 text-zinc-400">
          {real.length} live · {target} target · {domains.length} domains · {domains.reduce((n, d) => n + d.subdomains.length, 0)} subdomains
        </p>
      </header>

      {byDomain.map(({ domain, items }) => (
        <section key={domain.id} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: domain.accent }} />
            <h2 className="text-lg font-semibold text-zinc-100">{domain.name}</h2>
            <span className="text-xs text-zinc-500">{items.length} apps · {domain.subdomains.join(" · ")}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((a) => (
              <article
                key={a.id}
                className={`rounded-lg border border-zinc-800 p-4 transition-colors hover:border-zinc-700 ${
                  a.placeholder ? "bg-zinc-950/60" : "bg-zinc-900/60"
                }`}
                style={{ borderLeftWidth: 3, borderLeftColor: a.accent }}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${a.placeholder ? "text-zinc-500" : "text-zinc-100"}`}>
                    {a.display_name}
                  </h3>
                  <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                    {a.proptype}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {a.monorepo ? `${a.monorepo} · ${a.subdomain}` : `placeholder · ${a.subdomain}`}
                </p>
                {(a.port_v1 || a.port_v2) && (
                  <p className="mt-2 font-mono text-[10px] text-zinc-500">
                    {a.port_v1 && `v1:${a.port_v1}`} {a.port_v2 && `v2:${a.port_v2}`}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
