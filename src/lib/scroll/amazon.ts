// Amazon Associates picks — primary source is Mongo (AzDB.MAIN +
// AmazonDB.topSellers), falling back to a Google Sheet CSV if Mongo
// returns nothing. The Mongo collections already contain pre-tagged
// `cta` URLs (?tag=fs08-21).

import { tryGetDb } from "@/lib/mongo-admin";

export const AMAZON_TAG = process.env.AMAZON_ASSOCIATES_TAG || "fs08-21";

const SHEET_ID = process.env.AMAZON_SHEET_ID || "1xSHXo4zF-Lrh2QS2bgvyIubQ2N32dAqnQF_RdXqjk7c";
const SHEET_GID = process.env.AMAZON_SHEET_GID || "1514657824";

export type AmazonItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  category: string;
  price: string | null;
  rating: string | null;
  rank: number;
  asin: string | null;
};

export function withAmazonTag(url: string, tag: string = AMAZON_TAG): string {
  try {
    const u = new URL(url);
    if (!/amazon\./i.test(u.hostname)) return url;
    u.searchParams.set("tag", tag);
    return u.toString();
  } catch {
    return url;
  }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") {/* skip */}
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function extractAsin(url: string): string | null {
  const m = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i.exec(url);
  return m ? m[1].toUpperCase() : null;
}

type MongoListEntry = {
  status?: string;
  cat?: string;
  rank?: string | number;
  id?: string;
  name?: string;
  title?: string;
  tagline?: string;
  description?: string;
  cta?: string;
  data?: string;
  year?: string;
  image?: string;
  asin?: string;
  price?: string;
  rating?: string;
};

function entryToItem(it: MongoListEntry, sourceKey: string, idx: number): AmazonItem | null {
  const rawUrl = it.cta || it.data || "";
  if (!rawUrl || !/amazon\./i.test(rawUrl)) return null;
  const url = withAmazonTag(rawUrl);
  const asin = it.asin || extractAsin(rawUrl);
  return {
    id: asin ?? it.id ?? `${sourceKey}-${idx}`,
    title: it.title || it.name || asin || "Amazon",
    description: it.description || it.tagline || null,
    url,
    image: it.image || null,
    category: it.cat || sourceKey,
    price: it.price ?? null,
    rating: it.rating ?? null,
    rank: Number(it.rank ?? idx) || idx,
    asin,
  };
}

let mongoCache: { items: AmazonItem[]; expires: number } | null = null;
const MONGO_TTL_MS = 10 * 60 * 1000;

async function getMongoAmazonItems(limit: number): Promise<AmazonItem[]> {
  if (mongoCache && mongoCache.expires > Date.now() && mongoCache.items.length >= limit) {
    return mongoCache.items.slice(0, limit);
  }

  const items: AmazonItem[] = [];
  const seen = new Set<string>();

  function ingest(arr: unknown, key: string) {
    if (!Array.isArray(arr)) return;
    arr.forEach((entry, idx) => {
      const it = entryToItem(entry as MongoListEntry, key, idx);
      if (!it || seen.has(it.url)) return;
      seen.add(it.url);
      items.push(it);
    });
  }

  try {
    // 1. AzDB.MAIN — latest docs, each has listItems[]
    const azDb = await tryGetDb("AzDB");
    if (azDb) {
      const docs = await azDb
        .collection("MAIN")
        .find({})
        .sort({ _id: -1 })
        .limit(10)
        .toArray();
      for (const d of docs) {
        ingest((d as { listItems?: unknown }).listItems, `AzDB.MAIN`);
        if (items.length >= limit) break;
      }
    }

    // 2. AmazonDB.topSellers — same shape under mainItems[]
    if (items.length < limit) {
      const amzDb = await tryGetDb("AmazonDB");
      if (amzDb) {
        const docs = await amzDb
          .collection("topSellers")
          .find({})
          .sort({ _id: -1 })
          .limit(5)
          .toArray();
        for (const d of docs) {
          ingest((d as { mainItems?: unknown }).mainItems, "AmazonDB.topSellers");
          if (items.length >= limit) break;
        }
      }
    }
  } catch (err) {
    console.warn("[amazon] mongo fetch failed:", (err as Error).message);
  }

  if (items.length) {
    mongoCache = { items, expires: Date.now() + MONGO_TTL_MS };
  }
  return items.slice(0, limit);
}

export async function getAmazonItems(opts: { limit?: number } = {}): Promise<{ items: AmazonItem[]; source: string; reachable: boolean }> {
  const limit = opts.limit ?? 200;

  // Primary: Mongo (AzDB + AmazonDB)
  const fromMongo = await getMongoAmazonItems(limit);
  if (fromMongo.length > 0) {
    return { items: fromMongo, source: "mongo:AzDB.MAIN+AmazonDB.topSellers", reachable: true };
  }

  // Fallback: Google Sheet CSV
  const source = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  try {
    const res = await fetch(source, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "scroller" },
    });
    if (!res.ok) return { items: [], source, reachable: false };
    const csv = await res.text();
    if (!csv || csv.trim().length === 0) return { items: [], source, reachable: true };
    const rows = parseCSV(csv);
    if (rows.length < 2) return { items: [], source, reachable: true };

    const header = rows[0].map((h) => h.toLowerCase().trim());
    const col = (name: string) => header.indexOf(name);
    const urlIdx = col("url");
    if (urlIdx < 0) return { items: [], source, reachable: true };

    const titleIdx = col("title");
    const descIdx = col("description");
    const imgIdx = col("image");
    const catIdx = col("category");
    const priceIdx = col("price");
    const ratingIdx = col("rating");
    const rankIdx = col("rank");
    const asinIdx = col("asin");

    const items: AmazonItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const url = (r[urlIdx] ?? "").trim();
      if (!url || !/amazon\./i.test(url)) continue;
      const tagged = withAmazonTag(url);
      const asin = (asinIdx >= 0 ? r[asinIdx]?.trim() : null) || extractAsin(url);
      const title = (titleIdx >= 0 ? r[titleIdx]?.trim() : "") || asin || tagged;
      items.push({
        id: asin ?? `aa-${i}`,
        title,
        description: descIdx >= 0 ? (r[descIdx]?.trim() || null) : null,
        url: tagged,
        image: imgIdx >= 0 ? (r[imgIdx]?.trim() || null) : null,
        category: (catIdx >= 0 ? r[catIdx]?.trim() : "") || "Amazon",
        price: priceIdx >= 0 ? (r[priceIdx]?.trim() || null) : null,
        rating: ratingIdx >= 0 ? (r[ratingIdx]?.trim() || null) : null,
        rank: rankIdx >= 0 ? Number(r[rankIdx] ?? i) : i,
        asin,
      });
    }
    return { items, source, reachable: true };
  } catch {
    return { items: [], source, reachable: false };
  }
}
