import { Database } from "lucide-react";
import { getClient, getDefaultDbName, pingDb } from "@/lib/mongo-admin";

export const dynamic = "force-dynamic";

async function loadStatus() {
  try {
    const latencyMs = await pingDb();
    if (latencyMs === null) return { ok: false as const, error: "MONGO_URI not set or unreachable" };
    const client = await getClient();
    const admin = client.db().admin();
    const buildInfo = await admin.buildInfo();
    const { databases } = await admin.listDatabases();
    const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || "";
    let host = "(unparsable)";
    try {
      const u = new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "https://"));
      host = u.host;
    } catch {}
    return {
      ok: true as const,
      host,
      version: buildInfo.version as string,
      latencyMs,
      defaultDb: getDefaultDbName(),
      databases: (databases as { name: string; sizeOnDisk?: number }[]).map((d) => ({
        name: d.name,
        sizeOnDisk: d.sizeOnDisk,
      })),
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "ping failed" };
  }
}

export default async function MongoConsolePage() {
  const status = await loadStatus();

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
          <Database className="h-3.5 w-3.5" />
          Admin · Mongo
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Mongo console</h1>
        <p className="mt-1 text-sm text-zinc-400">Cluster connection, databases, and collections.</p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Connection</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              status.ok
                ? "bg-emerald-950 text-emerald-400"
                : "bg-red-950 text-red-400"
            }`}
          >
            {status.ok ? "OK" : "ERROR"}
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {status.ok ? (
            <>
              <Row k="Host" v={status.host} mono />
              <Row k="Server version" v={status.version} mono />
              <Row k="Default DB" v={status.defaultDb} mono />
              <Row k="Ping" v={`${status.latencyMs} ms`} />
            </>
          ) : (
            <Row k="Error" v={status.error} />
          )}
        </dl>
      </section>

      {status.ok && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-3">Databases</h2>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-950/80 border-b border-zinc-800">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Name</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Size</th>
                </tr>
              </thead>
              <tbody>
                {status.databases.map((d) => (
                  <tr key={d.name} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-950/40">
                    <td className="px-4 py-2.5 font-mono text-xs text-emerald-400">{d.name}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-zinc-500 tabular-nums">
                      {typeof d.sizeOnDisk === "number" ? (d.sizeOnDisk / 1024 / 1024).toFixed(1) + " MB" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-800/60 py-1.5 last:border-0">
      <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
      <dd className={mono ? "font-mono text-xs text-zinc-300" : "text-sm text-zinc-300"}>{v}</dd>
    </div>
  );
}
