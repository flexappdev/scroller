import { getApps } from "@/lib/fetchers";
import AppsClient from "./AppsClient";

export const dynamic = "force-dynamic";

export default async function AppsPage() {
  const { apps, domains, target } = await getApps();
  const real = apps.filter((a) => !a.placeholder);

  return (
    <div className="space-y-8 p-8">
      <header className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
          Scroller · Apps
        </div>
        <h1 className="mt-3 text-4xl font-bold text-zinc-100">Apps</h1>
        <p className="mt-2 text-zinc-400">
          {real.length} live · {target} target · {domains.length} domains · {domains.reduce((n, d) => n + d.subdomains.length, 0)} subdomains
        </p>
      </header>

      <AppsClient apps={apps} />
    </div>
  );
}
