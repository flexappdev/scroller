// Bulk-cache every WikiVoyage article into AIDB.wiki using ONE call per 50
// articles via the Action API's generator=allpages + prop=extracts|pageimages|info.
// Way faster + lower failure rate than the per-title REST loop in
// cache-wikivoyage-all.mjs (which 90%+ failed at concurrency 6).
//
// Usage:
//   node scripts/cache-wikivoyage-bulk.mjs                   # paginate everything
//   node scripts/cache-wikivoyage-bulk.mjs --max=10000       # cap titles ingested
//   node scripts/cache-wikivoyage-bulk.mjs --resume          # default — skip cached

import fs from "node:fs";
import { MongoClient } from "mongodb";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (k) => envText.match(new RegExp("^" + k + "=(.*)", "m"))?.[1] || "";

const MONGO_URI = env("MONGO_URI");
const MONGO_DB = env("MONGO_DB") || "AIDB";
const HOST = "en.wikivoyage.org";
const USER_AGENT = "Scroller/0.5 (+https://scroller-psi.vercel.app; claude@cleverfox-ai.com)";

const argv = process.argv.slice(2);
const MAX = Number((argv.find((a) => a.startsWith("--max=")) || "--max=100000").split("=")[1]) || 100000;
const START = (argv.find((a) => a.startsWith("--start=")) || "").split("=")[1] || null;

function slug(t) { return (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

async function fetchJson(url, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30000);
    try {
      const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": USER_AGENT, accept: "application/json" } });
      clearTimeout(timer);
      if (r.status === 429 || r.status >= 500) {
        const wait = Math.min(15000, 1000 * Math.pow(2, attempt));
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      clearTimeout(timer);
      const wait = Math.min(15000, 1000 * Math.pow(2, attempt));
      await new Promise((res) => setTimeout(res, wait));
    }
  }
  return null;
}

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(MONGO_DB);
const coll = db.collection("wiki");

const startCount = await coll.countDocuments({ category: "wikivoyage" });
console.log(`Starting WikiVoyage count: ${startCount} · target cap: ${MAX}`);

// Load already-cached pageids so we skip upserts for unchanged titles fast.
const cachedIds = new Set();
{
  const cursor = coll.find({ category: "wikivoyage" }, { projection: { pageid: 1, _id: 0 } });
  for await (const d of cursor) if (d?.pageid) cachedIds.add(d.pageid);
}
console.log(`Already cached: ${cachedIds.size} pageids`);

let gapcontinue = START;
let safety = 0;
let totalSeen = 0, totalUpserted = 0, totalSkipped = 0;
const startedAt = Date.now();

outer: while (safety < 1200) {
  safety++;
  // Skip `extracts` prop here — it triggers a separate `excontinue` chain
  // (capped at 20 extracts per call) that blocks gapcontinue from advancing.
  // The daily converter / live /wiki page can backfill extracts on demand.
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "allpages",
    gapnamespace: "0",
    gaplimit: "50",
    prop: "pageimages|info|description",
    piprop: "thumbnail",
    pithumbsize: "600",
    inprop: "url",
  });
  if (gapcontinue) params.set("gapcontinue", gapcontinue);

  const j = await fetchJson(`https://${HOST}/w/api.php?${params.toString()}`);
  if (!j) { console.log(`\nBatch ${safety}: fetch failed — stopping`); break; }
  const pagesObj = j?.query?.pages ?? {};
  const pages = Object.values(pagesObj);
  gapcontinue = j?.continue?.gapcontinue ?? null;

  if (pages.length === 0) {
    console.log(`\nNo more pages at batch ${safety}`);
    break;
  }

  const ops = [];
  for (const p of pages) {
    totalSeen++;
    if (totalSeen + cachedIds.size > MAX) break outer;
    if (!p.pageid || !p.title) continue;
    if (cachedIds.has(p.pageid)) { totalSkipped++; continue; }
    const doc = {
      _id: String(p.pageid),
      pageid: p.pageid,
      title: p.title,
      slug: slug(p.title),
      lang: "en",
      category: "wikivoyage",
      description: p.description ?? null,
      extract: null, // backfilled lazily by the daily converter / live /wiki page
      source_url: p.fullurl ?? `https://${HOST}/wiki/${encodeURIComponent(p.title)}`,
      lead_image_url: p.thumbnail?.source ?? null,
      html: null,
      sections: [],
      media: [],
      infobox: null,
      read_mins: 1,
      word_count: 0,
      fetched_at: new Date().toISOString(),
    };
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true } });
    cachedIds.add(p.pageid);
  }

  if (ops.length > 0) {
    const r = await coll.bulkWrite(ops, { ordered: false });
    totalUpserted += (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
  }

  const elapsed = (Date.now() - startedAt) / 1000;
  const rate = (totalSeen / elapsed).toFixed(0);
  process.stdout.write(
    `Batch ${safety}: pages=${pages.length} new=${ops.length} skipped=${totalSkipped} total_seen=${totalSeen} upserted=${totalUpserted} (${rate}/s) gapcontinue=${gapcontinue ? gapcontinue.slice(0, 30) : "DONE"}\n`,
  );

  if (!gapcontinue) {
    console.log("\nAll pages exhausted");
    break;
  }
}

const endCount = await coll.countDocuments({ category: "wikivoyage" });
console.log(`\n--- DONE ---`);
console.log(`Seen: ${totalSeen} · Upserted: ${totalUpserted} · Skipped: ${totalSkipped} · Batches: ${safety}`);
console.log(`WikiVoyage in Mongo: ${startCount} → ${endCount} (+${endCount - startCount})`);
console.log(`Continue token: ${gapcontinue || "exhausted"}`);

await client.close();
