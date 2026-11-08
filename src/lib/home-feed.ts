import { promises as fs } from "node:fs";
import path from "node:path";
import { getMediaiForTopics, wikaiUrl, type MediaiArticle, type MediaiPage } from "@/lib/mediai";

// scroller.tv home feed: the 10,000 most-viewed English Wikipedia articles
// (data/wiki/top10k.json, rebuilt weekly by .github/workflows/wiki-top10k.yml)
// interleaved with every chapter of our bookai books (data/books, from the
// Books channel). Order is a popularity-weighted shuffle, stable per seed so
// infinite scroll can page through it without repeats.

type TopFile = {
  generatedAt: string;
  thumbPrefix: string;
  columns: string[];
  rows: [string, number, string | null, string | null][];
};

type WikiRow = { title: string; views: number; description: string | null; thumb: string | null; rank: number };

type ChannelBook = {
  slug: string;
  title: string;
  chapters: number;
  cover?: string | null;
  url: string;
  buy?: string | null;
  price?: number | null;
  hasFeed: boolean;
};

type Chapter = {
  n: number;
  part?: string | null;
  title: string;
  tease: string;
  facts?: { label: string; value: string }[];
  image?: string | null;
  video?: string | null;
  poster?: string | null;
  read?: string | null;
  free?: boolean;
  minutes?: number | null;
};

type BookChapterRow = { book: ChannelBook; chapter: Chapter; total: number };

type Ref = { t: "w"; i: number } | { t: "b"; i: number };

const DATA = path.join(process.cwd(), "data");
/** One book chapter after every BOOK_EVERY - 1 Wikipedia cards. */
const BOOK_EVERY = 4;

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

let wikiCache: Promise<WikiRow[]> | null = null;
function loadWiki(): Promise<WikiRow[]> {
  wikiCache ??= readJson<TopFile>(path.join(DATA, "wiki", "top10k.json")).then((file) => {
    if (!file?.rows) return [];
    return file.rows.map(([title, views, description, thumb], index) => ({
      title,
      views,
      description,
      thumb: thumb ? (thumb.startsWith("http") ? thumb : `${file.thumbPrefix}${thumb}`) : null,
      rank: index + 1,
    }));
  });
  return wikiCache;
}

let bookCache: Promise<BookChapterRow[]> | null = null;
function loadBooks(): Promise<BookChapterRow[]> {
  bookCache ??= (async () => {
    const channel = await readJson<{ ours?: ChannelBook[] }>(path.join(DATA, "books", "channel.json"));
    const books = (channel?.ours ?? []).filter((b) => b.hasFeed && /^[a-z0-9-]+$/.test(b.slug));
    const feeds = await Promise.all(
      books.map((book) => readJson<{ chapters?: Chapter[] }>(path.join(DATA, "books", "bookai", `${book.slug}.json`))),
    );
    return books.flatMap((book, i) => {
      const chapters = feeds[i]?.chapters ?? [];
      return chapters.map((chapter) => ({ book, chapter, total: chapters.length }));
    });
  })();
  return bookCache;
}

/** mulberry32: small, fast, seedable. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const orderCache = new Map<number, Ref[]>();

async function feedOrder(seed: number): Promise<Ref[]> {
  const cached = orderCache.get(seed);
  if (cached) return cached;
  const [wiki, books] = await Promise.all([loadWiki(), loadBooks()]);
  const rand = rng(seed);

  // Weighted random order (Efraimidis–Spirakis): more-viewed articles tend to
  // come first, but every one of the 10,000 is reachable.
  const wikiOrder = wiki
    .map((row, i) => ({ i, key: Math.log(rand() || 1e-12) / Math.sqrt(Math.max(1, row.views)) }))
    .sort((a, b) => b.key - a.key)
    .map(({ i }) => i);

  const bookOrder = books.map((_, i) => i);
  for (let i = bookOrder.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [bookOrder[i], bookOrder[j]] = [bookOrder[j], bookOrder[i]];
  }

  const refs: Ref[] = [];
  let w = 0;
  let b = 0;
  while (w < wikiOrder.length || b < bookOrder.length) {
    const slot = refs.length % BOOK_EVERY === BOOK_EVERY - 1;
    if ((slot && b < bookOrder.length) || w >= wikiOrder.length) refs.push({ t: "b", i: bookOrder[b++] });
    else refs.push({ t: "w", i: wikiOrder[w++] });
  }

  orderCache.set(seed, refs);
  if (orderCache.size > 32) orderCache.delete(orderCache.keys().next().value!);
  return refs;
}

function wikiCard(row: WikiRow, media: MediaiArticle | undefined): MediaiArticle {
  return {
    id: `topic:${row.title}`,
    assetId: media?.assetId ?? `wiki:${row.title}`,
    topic: row.title,
    imageUrl: media?.imageUrl ?? row.thumb,
    videoUrls: media?.videoUrls ?? [],
    audioUrl: media?.audioUrl ?? null,
    sourceUrl: media?.sourceUrl ?? wikaiUrl(row.title),
    updatedAt: media?.updatedAt ?? 0,
    assetCount: media?.assetCount ?? 0,
    provider: media?.provider ?? null,
    prompt: media?.prompt ?? null,
    kind: "wiki",
    description: row.description,
    rank: row.rank,
    views: row.views,
  };
}

function bookCard({ book, chapter, total }: BookChapterRow): MediaiArticle {
  const read = chapter.read ?? book.url ?? null;
  return {
    id: `book:${book.slug}:${chapter.n}`,
    assetId: `book:${book.slug}:${chapter.n}`,
    topic: chapter.title,
    imageUrl: chapter.poster ?? chapter.image ?? book.cover ?? null,
    videoUrls: chapter.video ? [chapter.video] : [],
    audioUrl: null,
    sourceUrl: read ?? "",
    updatedAt: 0,
    assetCount: [chapter.image, chapter.video].filter(Boolean).length,
    provider: "book",
    prompt: null,
    kind: "book",
    description: chapter.part ?? null,
    book: {
      slug: book.slug,
      title: book.title,
      chapter: chapter.n,
      chapters: total,
      part: chapter.part ?? null,
      tease: chapter.tease,
      facts: chapter.facts ?? [],
      read,
      url: book.url ?? null,
      buy: book.buy ?? null,
      price: book.price ?? null,
      free: Boolean(chapter.free),
      minutes: chapter.minutes ?? null,
    },
  };
}

/** True once the weekly top 10,000 list has been built and committed. */
export async function hasHomeFeed(): Promise<boolean> {
  return (await loadWiki()).length > 0;
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export async function getHomePage({
  seed,
  offset = 0,
  limit = 40,
}: {
  seed: number;
  offset?: number;
  limit?: number;
}): Promise<MediaiPage> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.max(10, Math.min(100, Math.floor(limit)));
  const [order, wiki, books] = await Promise.all([feedOrder(seed), loadWiki(), loadBooks()]);
  const refs = order.slice(safeOffset, safeOffset + safeLimit);

  const topics = refs.filter((r) => r.t === "w").map((r) => wiki[r.i].title);
  const media = await getMediaiForTopics(topics);

  const items = refs.map((r) => (r.t === "w" ? wikiCard(wiki[r.i], media.get(wiki[r.i].title)) : bookCard(books[r.i])));
  const end = safeOffset + refs.length;
  return { items, nextOffset: end < order.length ? end : null, seed };
}

/** One card by its id (topic:<title> or book:<slug>:<n>), for ?card= deep links. */
export async function getHomeCard(id: string): Promise<MediaiArticle | null> {
  if (id.startsWith("topic:")) {
    const title = id.slice("topic:".length);
    const row = (await loadWiki()).find((r) => r.title === title);
    if (!row) return null;
    const media = await getMediaiForTopics([row.title]);
    return wikiCard(row, media.get(row.title));
  }
  const book = id.match(/^book:([a-z0-9-]+):(\d+)$/);
  if (book) {
    const row = (await loadBooks()).find((r) => r.book.slug === book[1] && r.chapter.n === Number(book[2]));
    return row ? bookCard(row) : null;
  }
  return null;
}
