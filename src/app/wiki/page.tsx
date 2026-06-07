import Link from "next/link";
import { Globe, ExternalLink, ArrowRight } from "lucide-react";
import { listWikiCategories, listWikiIndex } from "@/lib/wiki/storage";
import { getWiki } from "@/lib/fetchers";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Wiki",
  description: "Master index of cached Wikipedia articles — switchable by category, with live random fallback while the index is empty.",
};

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}

const PAGE_SIZE = 30;
// Keep this low enough to stay under Wikipedia's parallel-request throttle in
// a single page render. fetchWikiRandom batches 8 at a time → 24 = 3 batches.
const LIVE_FALLBACK_COUNT = 24;

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
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
  const indexEmpty = totalCount === 0;

  // When the Supabase index is empty (migration not applied yet OR no sync has
  // run), fall back to live random Wikipedia articles via the existing in-memory
  // 10-min cache. The page stays useful immediately, no ops handoff required.
  const liveItems = indexEmpty
    ? (await getWiki(LIVE_FALLBACK_COUNT)).items.filter((i) => !q || i.title.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-12">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono mb-2">
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          Wikipedia · master index
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Wiki</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          {indexEmpty ? (
            <>
              Index is empty (migration not applied or no sync run yet). Showing live random
              articles via the Wikipedia REST API — refresh to rotate.
            </>
          ) : (
            <>
              {totalCount.toLocaleString()} articles cached across {categories.length} categories.
              Daily converter pulls full content, sections, and media into MongoDB; this index lives
              in Supabase for fast paginated browsing.
            </>
          )}
        </p>
        {indexEmpty && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/?source=wiki"
              className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300 hover:border-emerald-500 transition-colors"
            >
              <ArrowRight className="h-3 w-3" />
              Open scroller feed
            </Link>
            <Link
              href="/wikivoyage"
              className="flex items-center gap-1.5 rounded-md border border-blue-700/40 bg-blue-950/40 px-3 py-2 text-xs text-blue-300 hover:border-blue-500 transition-colors"
            >
              Open WikiVoyage
            </Link>
            <Link
              href="/admin/wiki"
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              Manage seeds &amp; trigger sync
            </Link>
          </div>
        )}
      </header>

      <form className="mb-6 flex flex-wrap gap-2" action="/wiki">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search titles…"
          className="h-9 min-w-[200px] rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none"
        />
        {!indexEmpty && (
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
        )}
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

      {indexEmpty ? (
        liveItems.length === 0 ? (
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-8 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">Live fetch returned nothing.</p>
            <p className="mt-2">
              Wikipedia REST may be rate-limiting. Try again in a few seconds, or open the{" "}
              <Link href="/?source=wiki" className="text-emerald-400 hover:underline">
                scroller feed
              </Link>{" "}
              instead.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveItems.map((item) => (
              <li
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition hover:border-emerald-700/60"
              >
                {item.thumbnail ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="block aspect-[16/9] overflow-hidden bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </a>
                ) : null}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-700 text-[10px] uppercase tracking-wider text-zinc-400">
                      live
                    </Badge>
                    <span className="text-[11px] text-zinc-500">via REST</span>
                  </div>
                  <Link
                    href={`/items/${encodeURIComponent(`wiki:${item.id}`)}`}
                    className="text-base font-medium text-zinc-100 hover:text-emerald-300"
                  >
                    {item.title}
                  </Link>
                  {item.extract ? <p className="line-clamp-3 text-sm text-zinc-400">{item.extract}</p> : null}
                  <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-zinc-600">
                    <Link href={`/items/${encodeURIComponent(`wiki:${item.id}`)}`} className="hover:text-emerald-400">
                      Details →
                    </Link>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-emerald-400">
                      Wikipedia <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-8 text-sm text-zinc-400">
          <p className="font-medium text-zinc-200">No matches for that filter.</p>
          <p className="mt-2">
            Try a broader search or{" "}
            <Link href="/wiki" className="text-emerald-400 hover:underline">
              reset
            </Link>
            .
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
