import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cmsAdmin, isMissingTable } from "@/lib/cms/supabase";

export const dynamic = "force-dynamic";

interface DashboardData {
  sites: number;
  sitesPublished: number;
  sitesByCategory: Record<string, number>;
}

async function loadDashboard(): Promise<DashboardData> {
  const supabase = cmsAdmin();
  const out: DashboardData = { sites: 0, sitesPublished: 0, sitesByCategory: {} };
  try {
    const { data, error } = await supabase.from("scroller_sites").select("status, category");
    if (error && !isMissingTable(error)) throw new Error(error.message);
    if (data) {
      out.sites = data.length;
      out.sitesPublished = (data as { status: string }[]).filter((s) => s.status === "published").length;
      for (const row of data as { category: string }[]) {
        out.sitesByCategory[row.category] = (out.sitesByCategory[row.category] ?? 0) + 1;
      }
    }
  } catch (err) {
    console.warn("[admin/dashboard] sites count failed:", (err as Error).message);
  }
  return out;
}

export default async function AdminHomePage() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  const email = session.session?.user.email ?? "dev (bypass cookie)";

  const dash = await loadDashboard();

  const sections = [
    { href: "/admin/sites", title: "Sites", desc: "Curate the /sites public listing" },
    { href: "/admin/mongo", title: "Mongo console", desc: "Browse AIDB collections and ping cluster" },
    { href: "/admin/s3", title: "S3 console", desc: "Browse com27/scroller/* files and prefixes" },
  ];

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <div className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Admin · <code className="font-mono text-emerald-400">{email}</code>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Admin console</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          Single-user editor cockpit for Scroller. Public site (/, /sites, /apps, /videos, /github, /prompts, /about) stays open; admin and writes are gated.
        </p>
      </header>

      {/* Stat tiles */}
      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Sites</div>
          <div className="text-3xl font-bold tracking-tight font-mono">{dash.sites}</div>
          <div className="text-xs text-zinc-500 mt-1">
            <span className="text-emerald-400">{dash.sitesPublished} published</span> · {dash.sites - dash.sitesPublished} draft
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Categories</div>
          <div className="text-3xl font-bold tracking-tight font-mono">{Object.keys(dash.sitesByCategory).length || 0}</div>
          <div className="text-xs text-zinc-500 mt-1">
            {Object.entries(dash.sitesByCategory).map(([cat, n]) => `${cat} ${n}`).join(" · ") || "—"}
          </div>
        </div>
      </section>

      {/* Consoles */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Consoles</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 hover:border-emerald-700/50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-zinc-100">{s.title}</h3>
              <p className="text-xs text-zinc-400 mt-1">{s.desc}</p>
              <p className="text-[10px] text-zinc-500 mt-3 font-mono">{s.href}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
