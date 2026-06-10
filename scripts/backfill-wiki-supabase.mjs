// Backfill scroller_wiki_index from MongoDB AIDB.wiki — projects the heavy
// payload (html, sections, media, infobox) into the lightweight Supabase
// index used for fast paginated browsing and search.
//
// Mongo holds ~67,856 articles; Supabase index is empty post-migration.
// This script chunks 500 docs at a time and batch-upserts via PostgREST.
//
// Usage:
//   node scripts/backfill-wiki-supabase.mjs [--limit=N] [--batch=500] [--resume]
//
//   --limit=N     stop after upserting N rows total (default: all)
//   --batch=500   how many rows per Supabase upsert call (default 500)
//   --resume      skip pageids already present in Supabase
//
// Env (reads .env.local first, then ~/context-2026/agents/.env):
//   MONGODB_URI (or MONGO_URI)
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { MongoClient } from "mongodb";

function parseEnv(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  }
  return out;
}

function loadEnv() {
  const merged = {};
  const sources = [
    path.join(os.homedir(), "context-2026/agents/.env"),
    new URL("../.env.local", import.meta.url).pathname,
  ];
  for (const f of sources) {
    if (fs.existsSync(f)) {
      Object.assign(merged, parseEnv(fs.readFileSync(f, "utf8")));
    }
  }
  return merged;
}

const ENV = loadEnv();
const MONGO_URI = ENV.MONGODB_URI || ENV.MONGO_URI;
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGO_URI) throw new Error("MONGODB_URI not set");
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase URL or service key missing");

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0", 10) || Infinity;
const BATCH = parseInt(args.find((a) => a.startsWith("--batch="))?.split("=")[1] ?? "500", 10);
const RESUME = args.includes("--resume");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function toIndexRow(doc) {
  const pageid = Number(doc.pageid);
  if (!Number.isFinite(pageid)) return null;
  return {
    pageid,
    title: doc.title ?? "Untitled",
    slug: doc.slug ?? String(pageid),
    lang: doc.lang ?? "en",
    category: doc.category ?? "random",
    description: doc.description ?? null,
    extract: doc.extract ?? null,
    lead_image_url: doc.lead_image_url ?? null,
    source_url: doc.source_url ?? `https://en.wikipedia.org/wiki?curid=${pageid}`,
    read_mins: doc.read_mins ?? 1,
    word_count: doc.word_count ?? 0,
    media_count: Array.isArray(doc.media) ? doc.media.length : 0,
    section_count: Array.isArray(doc.sections) ? doc.sections.length : 0,
    mongo_ref: String(pageid),
    sync_status: "ok",
    data: { infobox_keys: doc.infobox ? Object.keys(doc.infobox).length : 0 },
    fetched_at: doc.fetched_at ?? new Date().toISOString(),
  };
}

async function supabaseUpsertBatch(rows) {
  // PostgREST batch upsert with on_conflict=pageid
  const url = `${SUPABASE_URL}/rest/v1/scroller_wiki_index?on_conflict=pageid`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase ${res.status}: ${txt.slice(0, 300)}`);
  }
}

async function getExistingPageIds() {
  // Used only with --resume. Paginate through pageids already in Supabase.
  const seen = new Set();
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/scroller_wiki_index?select=pageid&order=pageid.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) throw new Error(`Supabase pageid scan ${res.status}: ${await res.text()}`);
    const rows = await res.json();
    if (!rows.length) break;
    for (const r of rows) seen.add(r.pageid);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return seen;
}

async function main() {
  console.log("Connecting to MongoDB…");
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db("AIDB");
  const coll = db.collection("wiki");

  const total = await coll.countDocuments({ pageid: { $exists: true } });
  console.log(`Found ${total.toLocaleString()} candidate docs in AIDB.wiki`);

  let skip = new Set();
  if (RESUME) {
    console.log("Resume mode — fetching existing pageids from Supabase…");
    skip = await getExistingPageIds();
    console.log(`Will skip ${skip.size.toLocaleString()} already-indexed pageids`);
  }

  const cursor = coll.find({ pageid: { $exists: true } }).project({
    pageid: 1, title: 1, slug: 1, lang: 1, category: 1, description: 1,
    extract: 1, lead_image_url: 1, source_url: 1, read_mins: 1, word_count: 1,
    media: 1, sections: 1, infobox: 1, fetched_at: 1,
  }).batchSize(BATCH);

  let buffer = [];
  let upserted = 0, skipped = 0, malformed = 0, batchNum = 0;
  const t0 = Date.now();

  for await (const doc of cursor) {
    if (upserted >= LIMIT) break;
    if (skip.has(Number(doc.pageid))) { skipped++; continue; }
    const row = toIndexRow(doc);
    if (!row) { malformed++; continue; }
    buffer.push(row);

    if (buffer.length >= BATCH) {
      batchNum++;
      try {
        await supabaseUpsertBatch(buffer);
        upserted += buffer.length;
        const elapsed = (Date.now() - t0) / 1000;
        const rate = (upserted / elapsed).toFixed(0);
        console.log(`  batch ${batchNum}: +${buffer.length} rows  · total=${upserted.toLocaleString()}  · ${rate}/s`);
      } catch (err) {
        console.error(`  batch ${batchNum} failed: ${err.message}`);
      }
      buffer = [];
      await sleep(50); // gentle on PostgREST
    }
  }

  // Flush tail
  if (buffer.length) {
    batchNum++;
    try {
      await supabaseUpsertBatch(buffer);
      upserted += buffer.length;
      console.log(`  batch ${batchNum}: +${buffer.length} rows (tail)`);
    } catch (err) {
      console.error(`  tail batch failed: ${err.message}`);
    }
  }

  await mongo.close();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone. upserted=${upserted.toLocaleString()} skipped=${skipped.toLocaleString()} malformed=${malformed} in ${elapsed}s`);
}

main().catch((err) => { console.error(err); process.exit(1); });
