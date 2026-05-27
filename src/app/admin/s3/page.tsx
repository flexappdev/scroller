import { Cloud } from "lucide-react";
import { S3_BUCKET, S3_REGION, bucketReachable, listObjectsV2 } from "@/lib/s3";

export const dynamic = "force-dynamic";

async function loadStatus() {
  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_ACCESS_KEY) {
    return { ok: false as const, error: "S3 credentials not set (S3_ACCESS_KEY / S3_SECRET_ACCESS_KEY)" };
  }
  const start = Date.now();
  const reach = await bucketReachable();
  const latencyMs = Date.now() - start;
  if (!reach.ok) return { ok: false as const, error: reach.error ?? "HeadBucket failed" };

  let topPrefixes: { name: string; prefix: string }[] = [];
  try {
    const list = await listObjectsV2("");
    topPrefixes = list.entries
      .filter((e): e is { kind: "folder"; prefix: string; name: string } => e.kind === "folder")
      .map((e) => ({ name: e.name, prefix: e.prefix }));
  } catch {}

  return { ok: true as const, latencyMs, topPrefixes };
}

export default async function S3ConsolePage() {
  const status = await loadStatus();

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
          <Cloud className="h-3.5 w-3.5" />
          Admin · S3
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">S3 console</h1>
        <p className="mt-1 text-sm text-zinc-400">Bucket connection and top-level prefix browser.</p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Bucket</h2>
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
          <Row k="Bucket" v={S3_BUCKET} mono />
          <Row k="Region" v={S3_REGION} mono />
          {status.ok ? (
            <Row k="HeadBucket latency" v={`${status.latencyMs} ms`} />
          ) : (
            <Row k="Error" v={status.error} />
          )}
        </dl>
      </section>

      {status.ok && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-3">
            Top-level prefixes in <code className="text-emerald-400">{S3_BUCKET}/</code>
          </h2>
          {status.topPrefixes.length === 0 ? (
            <p className="text-sm text-zinc-500">No subfolders at root or bucket is empty.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {status.topPrefixes.map((p) => (
                <li key={p.prefix}>
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-sm">
                    <span className="text-zinc-500">📁</span>
                    <span className="font-mono text-xs text-zinc-300 truncate">{p.name || "/"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
