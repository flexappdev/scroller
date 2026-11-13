import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BooksFeed from "@/components/books/BooksFeed";
import { getBooksChannel, getOurBook } from "@/lib/books";
import { chapterCard } from "@/lib/books-cards";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const channel = await getBooksChannel();
  return channel.ours.filter((b) => b.hasFeed).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getOurBook(slug);
  if (!data) return {};
  return {
    title: `${data.book.title} · Books`,
    description: data.book.blurb ?? `${data.book.chapters} chapters to scroll.`,
    alternates: { canonical: `/books/${slug}` },
  };
}

export default async function OurBookPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getOurBook(slug);
  if (!data || !data.chapters.length) notFound();
  const { book, chapters } = data;
  const cards = chapters.map((ch) => chapterCard(book, ch, chapters.length));
  return (
    <BooksFeed
      title={book.title}
      cards={cards}
      footer={
        <div className="max-w-xl rounded-[1.75rem] border border-[#ec4899]/40 bg-[#ec4899]/10 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#f9a8d4]">End of the scroll</p>
          <h2 className="mt-3 text-3xl font-semibold">{book.title}</h2>
          <p className="mt-3 text-white/70">{book.blurb}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <a href={book.url} className="rounded-full bg-[#ec4899] px-5 py-2.5 text-sm font-semibold">Read on matsiems.com</a>
            {book.buy ? <a href={book.buy} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold">Get the book</a> : null}
            <a href="/books" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold">All books</a>
          </div>
        </div>
      }
    />
  );
}
