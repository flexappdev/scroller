import type { Metadata } from "next";
import BooksFeed from "@/components/books/BooksFeed";
import { getBooksChannel, getTopNonfiction } from "@/lib/books";
import { ourBookCard, rankedCard } from "@/lib/books-cards";

export const metadata: Metadata = {
  title: "Scroll all books",
  description: "Our books first, then the most-read non-fiction books of all time.",
  alternates: { canonical: "/books/scroll" },
};

export default async function BooksScrollPage() {
  const [channel, top] = await Promise.all([getBooksChannel(), getTopNonfiction(1)]);
  const cards = [
    ...channel.ours.map((b, i) => ourBookCard(b, i, channel.ours.length)),
    ...(top?.books ?? []).map((b) => rankedCard(b, top!.target)),
  ];
  return (
    <BooksFeed
      title="Books"
      cards={cards}
      footer={
        <div className="max-w-xl text-center">
          <h2 className="text-3xl font-semibold">Keep going</h2>
          <a href="/books/top-nonfiction/2" className="mt-6 inline-flex rounded-full bg-[#ec4899] px-5 py-2.5 text-sm font-semibold">Non-fiction #101–200 →</a>
        </div>
      }
    />
  );
}
