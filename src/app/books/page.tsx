import type { Metadata } from "next";
import Link from "next/link";
import { compactCount, getBooksChannel, getTopNonfiction, goodreadsUrl, TOP_PAGE_SIZE } from "@/lib/books";

export const metadata: Metadata = {
  title: "Books",
  description:
    "Scroll books: our illustrated bookai books chapter by chapter, then the most-read non-fiction books of all time.",
  alternates: { canonical: "/books" },
};

const COLLECTIONS: Record<string, string> = {
  unbothered: "The Unbothered",
  encyclopaedia: "Visual encyclopaedias",
  "field-guides": "Field guides",
  "top-100": "Top 100s",
  authority: "Authority",
  legacai: "LegacAI",
};

export default async function BooksPage() {
  const [channel, top] = await Promise.all([getBooksChannel(), getTopNonfiction(1)]);
  const groups = new Map<string, typeof channel.ours>();
  for (const book of channel.ours) {
    const key = book.collection ?? "other";
    groups.set(key, [...(groups.get(key) ?? []), book]);
  }
  const total = top?.total ?? 0;
  const target = top?.target ?? 10_000;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ec4899]">Scroller channel</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Books</h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-400">
          {channel.counts.ours} of our own illustrated books, {channel.counts.ourChapters.toLocaleString("en-GB")} chapters
          you can scroll, then the {total.toLocaleString("en-GB")} most-read non-fiction books of all time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/books/scroll" className="rounded-full bg-[#ec4899] px-5 py-2.5 text-sm font-semibold text-white">
            Start scrolling
          </Link>
          <a href="#top-nonfiction" className="rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-semibold">
            Top non-fiction
          </a>
        </div>
      </header>

      <section aria-labelledby="ours" className="mb-14">
        <h2 id="ours" className="text-2xl font-semibold">Our books</h2>
        <p className="mt-1 text-sm text-zinc-400">Written and illustrated with bookai. Tap a book to scroll its chapters.</p>
        {[...groups.entries()].map(([key, books]) => (
          <div key={key} className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              {COLLECTIONS[key] ?? key} · {books.length}
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {books.map((book) => (
                <Link
                  key={book.slug}
                  href={book.hasFeed ? `/books/${book.slug}` : book.url}
                  className="group min-w-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ec4899]"
                >
                  <div className="aspect-[9/16] overflow-hidden bg-zinc-800">
                    {book.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover}
                        alt={book.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center p-3 text-sm font-semibold">{book.title}</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-2 text-xs font-semibold leading-tight">{book.title}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">{book.chapters} chapters</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="top-nonfiction" aria-labelledby="top-h" className="scroll-mt-20">
        <h2 id="top-h" className="text-2xl font-semibold">Top non-fiction books of all time</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">
          {total.toLocaleString("en-GB")} of {target.toLocaleString("en-GB")} ranked so far, by {top?.rankedBy ?? "ratings"}
          {top ? ` (at least ${top.minRatings} ratings)` : ""}. Pick a block of 100 to scroll.
        </p>
        {top ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: top.pages }, (_, i) => (
                <Link
                  key={i}
                  href={`/books/top-nonfiction/${i + 1}`}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs tabular-nums hover:border-[#ec4899]"
                >
                  {(i * TOP_PAGE_SIZE + 1).toLocaleString("en-GB")}–
                  {Math.min((i + 1) * TOP_PAGE_SIZE, total).toLocaleString("en-GB")}
                </Link>
              ))}
            </div>
            <ol className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
              {top.books.slice(0, 20).map((b) => (
                <li key={b.rank} className="flex min-w-0 items-baseline gap-3 border-b border-zinc-800 py-2">
                  <span className="w-8 shrink-0 text-right text-sm tabular-nums text-[#ec4899]">{b.rank}</span>
                  <a href={goodreadsUrl(b.gr)} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{b.title}</span>
                    <span className="block truncate text-xs text-zinc-400">
                      {b.author}
                      {b.year ? ` · ${b.year}` : ""} · {compactCount(b.ratings)} ratings
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs leading-5 text-zinc-500">
              Data:{" "}
              {top.sources.map((s, i) => (
                <span key={s.url}>
                  {i ? "; " : ""}
                  <a href={s.url} className="underline">{s.name}</a> ({s.licence})
                </span>
              ))}
              . Titles, authors and counts only; no blurbs or covers are copied, and these pages carry no ad slots.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
