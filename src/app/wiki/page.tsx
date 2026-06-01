import Link from "next/link";
import { listWikiCategories, listWikiIndex } from "@/lib/wiki/storage";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wiki · Scroller",
  description: "Master index of cached Wikipedia articles — switchable by category.",
};

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}

const PAGE_SIZE = 30;

export default async function WikiPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page ?? "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const [{ rows, total }, categories] = await Promise.all([
    listWikiIndex({ category, q, limit: PAGE_SIZE, offset }),
    listWikiCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const empty = rows.length === 0;
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Wikipedia · master index</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Wiki</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {totalCount.toLocaleString()} articles cached across {categories.length} categories.
          Daily converter pulls full content, sections, and media into MongoDB; this index lives in Supabase for fast paginated browsing.
        </p>
      </header>

      <form className="mb-6 flex flex-wrap gap-2" action="/wiki">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search titles…"
          className="h-9 min-w-[200px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none"
        />
        <select
          name="category"
          defaultValue={category}
          className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-emerald-600 focus:outline-none"
        >
          <option value="all">All categories ({totalCount})</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category} ({c.count})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Apply
        </button>
        {(q || category !== "all") && (
          <Link href="/wiki" className="h-9 self-center text-sm text-zinc-500 hover:text-zinc-300">
            Reset
          </Link>
        )}
      </form>

      {empty ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-8 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">No articles cached yet.</p>
          <p className="mt-2">
            Run the daily converter to populate the index:
            <code className="ml-2 rounded bg-zinc-900 px-2 py-0.5 text-emerald-300">
              POST /api/wiki/sync
            </code>
            , or open{" "}
            <Link href="/admin/wiki" className="text-emerald-400 hover:underline">
              /admin/wiki
            </Link>{" "}
            to manage seeds and trigger a run.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li
                key={r.pageid}
                className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition hover:border-emerald-700/60"
              >
                {r.lead_image_url ? (
                  <Link href={`/wiki/${r.pageid}`} className="block aspect-[16/9] overflow-hidden bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.lead_image_url}
                      alt={r.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </Link>
                ) : null}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-400">
                      {r.category}
                    </Badge>
                    <span className="text-[11px] text-zinc-500">{r.read_mins} min read</span>
                    <span className="text-[11px] text-zinc-600">· {r.media_count} media</span>
                  </div>
                  <Link href={`/wiki/${r.pageid}`} className="text-base font-medium text-zinc-100 hover:text-emerald-300">
                    {r.title}
                  </Link>
                  {r.description ? (
                    <p className="text-[12px] uppercase tracking-wide text-zinc-500">{r.description}</p>
                  ) : null}
                  {r.extract ? (
                    <p className="line-clamp-3 text-sm text-zinc-400">{r.extract}</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-zinc-600">
                    <span>pageid {r.pageid}</span>
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
                      Wikipedia ↗
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-between text-sm text-zinc-400">
              <span>
                Page {page} / {totalPages} · {total.toLocaleString()} articles
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={`/wiki?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}&page=${page - 1}`}
                    className="rounded-md border border-zinc-800 px-3 py-1 hover:border-zinc-600"
                  >
                    ← Prev
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link
                    href={`/wiki?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}&page=${page + 1}`}
                    className="rounded-md border border-zinc-800 px-3 py-1 hover:border-zinc-600"
                  >
                    Next →
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}
