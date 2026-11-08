import type { BookCard } from "@/components/books/BooksFeed";
import { compactCount, goodreadsUrl, type BookChapter, type OurBook, type RankedBook } from "@/lib/books";

export function ourBookCard(book: OurBook, index: number, total: number): BookCard {
  const ctas: BookCard["ctas"] = [];
  if (book.hasFeed) ctas.push({ label: "Scroll the chapters", url: `/books/${book.slug}`, primary: true });
  ctas.push({ label: "Read on matsiems.com", url: book.url });
  if (book.buy) ctas.push({ label: book.price ? `Get it · £${book.price}` : "Get it free", url: book.buy });
  return {
    id: `our-${book.slug}`,
    badge: `Our books · ${index + 1}/${total}`,
    kicker: [book.volume, book.collection?.replace(/-/g, " ")].filter(Boolean).join(" · ") || null,
    title: book.title,
    meta: `${book.chapters} chapters${book.free ? ` · ${book.free} free` : ""}`,
    body: book.blurb ?? book.subtitle ?? null,
    image: book.cover ?? null,
    ctas,
  };
}

export function chapterCard(book: OurBook, ch: BookChapter, total: number): BookCard {
  const ctas: BookCard["ctas"] = [];
  if (ch.read) ctas.push({ label: ch.free ? "Read this chapter free" : "Read the chapter", url: ch.read, primary: true });
  if (book.buy) ctas.push({ label: book.price ? `Get the book · £${book.price}` : "Get the book", url: book.buy });
  return {
    id: `c${ch.n}`,
    badge: `${String(ch.n).padStart(2, "0")} / ${total}`,
    kicker: ch.part ?? null,
    title: ch.title,
    meta: [ch.free ? "Free chapter" : null, ch.minutes ? `${ch.minutes} min read` : null].filter(Boolean).join(" · ") || null,
    body: ch.tease,
    facts: ch.facts,
    image: ch.image ?? null,
    video: ch.video ?? null,
    poster: ch.poster ?? null,
    ctas,
  };
}

export function rankedCard(b: RankedBook, target: number): BookCard {
  const meta = [b.author, b.year ? String(b.year) : null, b.pages ? `${b.pages} pages` : null].filter(Boolean).join(" · ");
  const facts = [
    { label: "Rank", value: `#${b.rank.toLocaleString("en-GB")}` },
    { label: "Rating", value: b.rating ? `${b.rating.toFixed(2)} ★` : "–" },
    { label: "Ratings", value: compactCount(b.ratings) },
  ];
  return {
    id: `r${b.rank}`,
    badge: `#${b.rank.toLocaleString("en-GB")} of ${target.toLocaleString("en-GB")}`,
    kicker: b.shelves.join(" · ") || "Non-fiction",
    title: b.title,
    meta,
    facts,
    ctas: [{ label: "See it on Goodreads", url: goodreadsUrl(b.gr), primary: true }],
  };
}
