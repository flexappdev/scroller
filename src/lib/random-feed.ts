import { promises as fs } from "node:fs";
import path from "node:path";
import { listScrollerPacks } from "@/lib/scroller";

// /random (msrandom): one shuffled, endless feed across every source we hold
// on disk. Each source is read only if its data is present, so the feed grows
// on its own as data lands:
//   - pack:  every Scroller Pack in data/scrollers/*
//   - wiki:  the top 10,000 Wikipedia articles (data/wiki/top10k.json)
//   - book:  every bookai chapter (data/books/channel.json + data/books/bookai/*)
// The order is fixed by a seed, so a shared link (?seed=) replays the same
// feed and infinite scroll can page through it by offset. When a source runs
// out it is reshuffled and starts again, so the feed never ends.

export type RandomSource = "pack" | "wiki" | "book";

export type RandomCard = {
  id: string;
  source: RandomSource;
  title: string;
  body: string;
  kicker: string;
  image: string | null;
  href: string | null;
  hrefLabel: string;
  cta: { label: string; url: string } | null;
};

export type RandomPage = {
  seed: number;
  items: RandomCard[];
  nextOffset: number;
  counts: Record<RandomSource, number>;
};

const DATA = path.join(process.cwd(), "data");
const WIKAI = "https://wikai.tv/a/";
/** Rough share of the feed per source, before the per-card dice roll. */
const WEIGHTS: Record<RandomSource, number> = { wiki: 5, pack: 3, book: 2 };
const MAX_OFFSET = 20_000;

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function clip(text: string | null | undefined, max = 420): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function wikaiHref(title: string): string {
  return `${WIKAI}${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

// ---- sources ---------------------------------------------------------------

async function loadPackCards(): Promise<RandomCard[]> {
  const packs = await listScrollerPacks().catch(() => []);
  return packs.flatMap(({ manifest, items }) =>
    items.map((item) => ({
      id: `pack:${manifest.slug}:${item.id}`,
      source: "pack" as const,
      title: item.title,
      body: clip(item.content),
      kicker: item.hook ? `${manifest.name} · ${item.hook}` : manifest.name,
      image: item.image ?? null,
      href: `/scroller/${manifest.slug}`,
      hrefLabel: `Open ${manifest.name}`,
      cta: item.cta?.url ? { label: item.cta.label, url: item.cta.url } : null,
    })),
  );
}

type TopFile = {
  thumbPrefix?: string;
  rows?: [string, number, string | null, string | null][];
};

async function loadWikiCards(): Promise<RandomCard[]> {
  const file = await readJson<TopFile>(path.join(DATA, "wiki", "top10k.json"));
  if (!file?.rows) return [];
  const prefix = file.thumbPrefix ?? "";
  return file.rows
    .filter(([title]) => typeof title === "string" && !/^(XXX|\.)/i.test(title))
    .map(([title, , description, thumb], index) => ({
      id: `wiki:${title}`,
      source: "wiki" as const,
      title,
      body: clip(description),
      kicker: `Wikipedia · #${(index + 1).toLocaleString("en-GB")} most read`,
      image: thumb ? (thumb.startsWith("http") ? thumb : `${prefix}${thumb}`) : null,
      href: wikaiHref(title),
      hrefLabel: "Read on WikAI",
      cta: null,
    }));
}

type ChannelBook = { slug: string; title: string; url?: string | null; cover?: string | null; buy?: string | null; hasFeed?: boolean };
type Chapter = { n: number; part?: string | null; title: string; tease?: string; image?: string | null; poster?: string | null; read?: string | null };

async function loadBookCards(): Promise<RandomCard[]> {
  const channel = await readJson<{ ours?: ChannelBook[] }>(path.join(DATA, "books", "channel.json"));
  const books = (channel?.ours ?? []).filter((b) => b.hasFeed !== false && /^[a-z0-9-]+$/.test(b.slug));
  const feeds = await Promise.all(
    books.map((b) => readJson<{ chapters?: Chapter[] }>(path.join(DATA, "books", "bookai", `${b.slug}.json`))),
  );
  return books.flatMap((book, i) => {
    const chapters = feeds[i]?.chapters ?? [];
    return chapters.map((ch) => ({
      id: `book:${book.slug}:${ch.n}`,
      source: "book" as const,
      title: ch.title,
      body: clip(ch.tease),
      kicker: `${book.title} · Chapter ${ch.n} of ${chapters.length}`,
      image: ch.poster ?? ch.image ?? book.cover ?? null,
      href: ch.read ?? book.url ?? `/books/${book.slug}`,
      hrefLabel: "Read the chapter",
      cta: book.buy ? { label: "Get the book", url: book.buy } : null,
    }));
  });
}

let pool: Promise<Record<RandomSource, RandomCard[]>> | null = null;

function loadPool() {
  pool ??= Promise.all([loadPackCards(), loadWikiCards(), loadBookCards()]).then(([pack, wiki, book]) => ({
    pack,
    wiki,
    book,
  }));
  return pool;
}

// ---- seeded order ----------------------------------------------------------

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

function permutation(length: number, rand: () => number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

type Ref = { s: RandomSource; i: number };
type Stream = { refs: Ref[]; rand: () => number; queues: Partial<Record<RandomSource, number[]>> };

const streams = new Map<number, Stream>();

function extend(stream: Stream, pools: Record<RandomSource, RandomCard[]>, upTo: number) {
  const live = (Object.keys(WEIGHTS) as RandomSource[]).filter((s) => pools[s].length > 0);
  if (live.length === 0) return;
  const total = live.reduce((sum, s) => sum + WEIGHTS[s], 0);
  while (stream.refs.length < upTo) {
    let roll = stream.rand() * total;
    let source = live[live.length - 1];
    for (const s of live) {
      roll -= WEIGHTS[s];
      if (roll < 0) {
        source = s;
        break;
      }
    }
    // Never show the same source three times running: it reads as a list, not a mix.
    const [a, b] = stream.refs.slice(-2);
    if (live.length > 1 && a?.s === source && b?.s === source) {
      source = live[(live.indexOf(source) + 1 + Math.floor(stream.rand() * (live.length - 1))) % live.length];
    }
    let queue = stream.queues[source];
    if (!queue || queue.length === 0) queue = stream.queues[source] = permutation(pools[source].length, stream.rand);
    stream.refs.push({ s: source, i: queue.pop()! });
  }
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function parseSeed(value: string | string[] | null | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,10}$/.test(raw)) return null;
  const n = Number(raw);
  return n < 2 ** 31 ? n : null;
}

export async function getRandomPage({
  seed,
  offset = 0,
  limit = 20,
}: {
  seed: number;
  offset?: number;
  limit?: number;
}): Promise<RandomPage> {
  const pools = await loadPool();
  const start = Math.min(MAX_OFFSET, Math.max(0, Math.floor(offset) || 0));
  const size = Math.max(1, Math.min(50, Math.floor(limit) || 20));

  let stream = streams.get(seed);
  if (!stream) {
    stream = { refs: [], rand: rng(seed), queues: {} };
    streams.set(seed, stream);
    if (streams.size > 64) streams.delete(streams.keys().next().value!);
  }
  extend(stream, pools, start + size);

  const items = stream.refs.slice(start, start + size).map((r) => pools[r.s][r.i]);
  return {
    seed,
    items,
    nextOffset: Math.min(MAX_OFFSET, start + items.length),
    counts: { pack: pools.pack.length, wiki: pools.wiki.length, book: pools.book.length },
  };
}

/** One card by id, for ?card= share links (pack:<slug>:<id>, wiki:<title>, book:<slug>:<n>). */
export async function getRandomCard(id: string | null | undefined): Promise<RandomCard | null> {
  if (!id || id.length > 300) return null;
  const pools = await loadPool();
  const source = id.split(":", 1)[0] as RandomSource;
  return pools[source]?.find((card) => card.id === id) ?? null;
}
