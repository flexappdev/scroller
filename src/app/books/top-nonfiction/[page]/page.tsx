import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BooksFeed from "@/components/books/BooksFeed";
import { getTopNonfiction, TOP_PAGE_SIZE } from "@/lib/books";
import { rankedCard } from "@/lib/books-cards";

type PageProps = { params: Promise<{ page: string }> };

export async function generateStaticParams() {
  const first = await getTopNonfiction(1);
  if (!first) return [];
  return Array.from({ length: first.pages }, (_, i) => ({ page: String(i + 1) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  const n = Number(page);
  const from = (n - 1) * TOP_PAGE_SIZE + 1;
  return {
    title: `Top non-fiction books of all time · #${from}–${from + TOP_PAGE_SIZE - 1}`,
    description: "The most-read non-fiction books of all time, ranked by Goodreads ratings.",
    alternates: { canonical: `/books/top-nonfiction/${page}` },
  };
}

export default async function TopNonfictionPage({ params }: PageProps) {
  const { page } = await params;
  const data = await getTopNonfiction(Number(page));
  if (!data) notFound();
  const cards = data.books.map((b) => rankedCard(b, data.target));
  const first = data.books[0]?.rank ?? 1;
  const last = data.books.at(-1)?.rank ?? first;
  return (
    <BooksFeed
      title={`Top non-fiction · #${first}–${last}`}
      cards={cards}
      footer={
        <div className="max-w-xl rounded-[1.75rem] border border-white/15 bg-white/[0.05] p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#f9a8d4]">#{first}–{last} done</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.page > 1 ? (
              <a href={`/books/top-nonfiction/${data.page - 1}`} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold">← Previous 100</a>
            ) : null}
            {data.page < data.pages ? (
              <a href={`/books/top-nonfiction/${data.page + 1}`} className="rounded-full bg-[#ec4899] px-5 py-2.5 text-sm font-semibold">Next 100 →</a>
            ) : null}
            <a href="/books" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold">All books</a>
          </div>
          <p className="mt-6 text-xs leading-5 text-white/45">
            Ranked by {data.rankedBy}. Data:{" "}
            {data.sources.map((s, i) => (
              <span key={s.url}>
                {i ? "; " : ""}
                <a href={s.url} className="underline">{s.name}</a> ({s.licence})
              </span>
            ))}
            . Facts only, shown without ads.
          </p>
        </div>
      }
    />
  );
}
