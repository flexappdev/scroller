import Link from "next/link";
import { listSites } from "@/lib/cms/sites";
import { NewSiteForm } from "./NewSiteForm";

export const dynamic = "force-dynamic";

export default async function AdminSitesPage() {
  const sites = await listSites({ status: "all" });

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Sites</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Curate the public <Link href="/sites" className="text-emerald-400 hover:underline">/sites</Link> listing. Order is by <code className="font-mono text-xs text-emerald-400">sort_order</code>, then title.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono">{sites.length} total · {sites.filter((s) => s.status === "published").length} published</div>
      </header>

      <NewSiteForm />

      {sites.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <p className="text-sm text-zinc-400">No sites yet.</p>
          <p className="text-xs text-zinc-500 mt-2">
            Run the migration <code className="font-mono text-emerald-400">supabase/migrations/0001_sites.sql</code> to seed 8 starter sites, or add your first one above.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/80 border-b border-zinc-800">
              <tr>
                <th className="text-left p-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">#</th>
                <th className="text-left p-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">ID</th>
                <th className="text-left p-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Title</th>
                <th className="text-left p-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Category</th>
                <th className="text-left p-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Status</th>
                <th className="text-left p-3 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">URL</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-950/40">
                  <td className="p-3 text-xs text-zinc-500 font-mono">{s.sort_order}</td>
                  <td className="p-3"><code className="font-mono text-xs text-emerald-400">{s.id}</code></td>
                  <td className="p-3">
                    <Link href={`/admin/sites/${encodeURIComponent(s.id)}`} className="text-zinc-100 hover:text-emerald-400 transition-colors">
                      {s.title}
                    </Link>
                  </td>
                  <td className="p-3 text-xs text-zinc-400">{s.category}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                      s.status === "published" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-900 text-zinc-500"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-emerald-400 truncate max-w-xs inline-block">
                      {s.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
