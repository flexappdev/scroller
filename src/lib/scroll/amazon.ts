// Amazon Associates picks — sourced from a Google Sheet.
//
// Sheet must be either public ("Anyone with the link can view") or published
// via File → Publish to web. Until then the fetcher returns [] gracefully.
//
// CSV columns (case-insensitive, all optional except url):
//   title, description, url, image, category, price, rating, rank, asin

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

export async function getAmazonItems(): Promise<{ items: AmazonItem[]; source: string; reachable: boolean }> {
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
