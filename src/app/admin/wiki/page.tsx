import Link from "next/link";
import { listSeeds } from "@/lib/wiki/seeds";
import { listWikiCategories, recentWikiLogs } from "@/lib/wiki/storage";
import {
  deleteSeedAction,
  runConverterAction,
  saveSeedAction,
  syncOneAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminWikiPage() {
  const [seeds, categories, logs] = await Promise.all([
    listSeeds(),
    listWikiCategories(),
    recentWikiLogs(20),
  ]);

  const totalCached = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Wiki</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Daily Wikipedia converter — full content (copy, sections, media) into
            <code className="mx-1 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-emerald-400">AIDB.WIKI_articles</code>
            with a master index in
            <code className="mx-1 rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-emerald-400">scroller_wiki_index</code>.
          </p>
        </div>
        <div className="text-xs font-mono text-zinc-500">
          {totalCached.toLocaleString()} cached · {categories.length} categories · {seeds.length} seeds
        </div>
      </header>

      {/* Manual run controls */}
      <section className="grid gap-4 md:grid-cols-2">
        <form
          action={runConverterAction}
          className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3"
        >
          <h2 className="text-sm font-medium text-zinc-200">Run converter now</h2>
          <p className="text-xs text-zinc-500">
            Runs all enabled seeds. Each seed contributes up to <code>max_pages</code> articles.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="force_all" id="force_all" className="accent-emerald-500" />
            <label htmlFor="force_all">Include disabled seeds</label>
          </div>
          <select
            name="seed_id"
            defaultValue=""
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">All seeds</option>
            {seeds.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.kind}{s.value ? `:${s.value}` : ""})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Run now
          </button>
        </form>

        <form
          action={syncOneAction}
          className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3"
        >
          <h2 className="text-sm font-medium text-zinc-200">Pull single article</h2>
          <p className="text-xs text-zinc-500">
            Fetches one article by exact Wikipedia title (e.g. <code>Albert Einstein</code>).
          </p>
          <input
            type="text"
            name="title"
            placeholder="Wikipedia title"
            required
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
          <input
            type="text"
            name="category"
            placeholder="category (default: manual)"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            className="rounded-md border border-emerald-700/60 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/40"
          >
            Pull title
          </button>
        </form>
      </section>

      {/* Seeds editor */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Seeds</h2>
          <Link href="/wiki" className="text-xs text-emerald-400 hover:underline">
            View public /wiki →
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/80 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Label</th>
                <th className="p-2 text-left">Kind</th>
                <th className="p-2 text-left">Value</th>
                <th className="p-2 text-left">Lang</th>
                <th className="p-2 text-left">Max</th>
                <th className="p-2 text-left">Pri</th>
                <th className="p-2 text-left">On</th>
                <th className="p-2 text-left">Last run</th>
                <th className="p-2 text-left" />
              </tr>
            </thead>
            <tbody>
              {seeds.map((s) => (
                <tr key={s.id} className="border-t border-zinc-900 align-top">
                  <td className="p-2 font-mono text-xs text-emerald-400">{s.id}</td>
                  <td className="p-2 text-zinc-200">{s.label}</td>
                  <td className="p-2 text-zinc-400">{s.kind}</td>
                  <td className="p-2 text-zinc-400">{s.value ?? "—"}</td>
                  <td className="p-2 text-zinc-400">{s.lang}</td>
                  <td className="p-2 text-zinc-400">{s.max_pages}</td>
                  <td className="p-2 text-zinc-400">{s.priority}</td>
                  <td className="p-2 text-zinc-400">{s.enabled ? "✓" : "—"}</td>
                  <td className="p-2 text-xs text-zinc-500">
                    {s.last_run_at ? (
                      <>
                        <span className="block">{new Date(s.last_run_at).toLocaleString()}</span>
                        <span className="block text-zinc-600">
                          {s.last_run_status ?? "?"} · {s.last_run_count ?? 0} rows
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <form action={deleteSeedAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-xs text-zinc-500 hover:text-red-400"
                        aria-label={`Delete seed ${s.id}`}
                      >
                        delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {seeds.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-sm text-zinc-500">
                    No seeds yet. Run the migration to load defaults, or add one below.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <form
          action={saveSeedAction}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-7"
        >
          <input
            name="id"
            placeholder="seed-id"
            required
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
          />
          <input
            name="label"
            placeholder="Label"
            required
            className="md:col-span-2 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
          />
          <select
            name="kind"
            defaultValue="random"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
          >
            <option value="random">random</option>
            <option value="category">category</option>
            <option value="featured">featured</option>
            <option value="title">title</option>
            <option value="pageid">pageid</option>
          </select>
          <input
            name="value"
            placeholder="value (e.g. Physics)"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
          />
          <input
            name="max_pages"
            type="number"
            defaultValue={25}
            min={1}
            max={200}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
          />
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="enabled" defaultChecked className="accent-emerald-500" />
            enabled
          </label>
          <button
            type="submit"
            className="md:col-span-7 justify-self-start rounded-md border border-emerald-700/60 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/40"
          >
            Save seed
          </button>
        </form>
      </section>

      {/* Categories */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Cached categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <span className="text-sm text-zinc-500">No categories yet.</span>
          ) : (
            categories.map((c) => (
              <Link
                key={c.category}
                href={`/wiki?category=${encodeURIComponent(c.category)}`}
                className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:border-emerald-700/60 hover:text-emerald-300"
              >
                {c.category} · {c.count}
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Logs */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Recent runs</h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950/80 text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-2 text-left">Started</th>
                <th className="p-2 text-left">Seed</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Fetched</th>
                <th className="p-2 text-left">Upserted</th>
                <th className="p-2 text-left">Failed</th>
                <th className="p-2 text-left">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-zinc-900">
                  <td className="p-2 text-xs text-zinc-500">{new Date(l.started_at).toLocaleString()}</td>
                  <td className="p-2 font-mono text-xs text-emerald-400">{l.seed_id ?? "—"}</td>
                  <td className="p-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] uppercase ${
                        l.status === "ok"
                          ? "bg-emerald-950/60 text-emerald-300"
                          : l.status === "partial"
                          ? "bg-amber-950/60 text-amber-300"
                          : "bg-red-950/60 text-red-300"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-2 text-zinc-300">{l.fetched}</td>
                  <td className="p-2 text-zinc-300">{l.upserted}</td>
                  <td className="p-2 text-zinc-300">{l.failed}</td>
                  <td className="p-2 text-xs text-zinc-500">{l.message ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-zinc-500">
                    No runs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
