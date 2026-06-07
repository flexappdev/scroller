// Populate MongoDB AIDB.WIKI_articles with random Wikipedia + WikiVoyage articles.
// Bypasses the Supabase index (migration 0003 still owed). The heavy payload —
// full content, sections, media — lands in Mongo so the wiki cache is no longer
// empty. The Supabase index can be reconstructed from Mongo once the migration
// applies.

import fs from "node:fs";
import { MongoClient } from "mongodb";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (k) => envText.match(new RegExp("^" + k + "=(.*)", "m"))?.[1] || "";

const MONGO_URI = env("MONGO_URI");
const MONGO_DB = env("MONGO_DB") || "AIDB";
const USER_AGENT = "Scroller/0.5 (+https://scroller-psi.vercel.app; claude@cleverfox-ai.com)";

const argv = process.argv.slice(2);
const PER_HOST = Number((argv.find((a) => a.startsWith("--per-host=")) || "--per-host=120").split("=")[1]) || 120;

function stripHtml(s) { return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

async function fetchJson(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": USER_AGENT, accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; } finally { clearTimeout(timer); }
}

async function fetchText(url) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": USER_AGENT } });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; } finally { clearTimeout(timer); }
}

async function randomTitles(host, count) {
  const out = new Set();
  let safety = 0;
  while (out.size < count && safety < 8) {
    safety++;
    const url = `https://${host}/w/api.php?action=query&format=json&origin=*&generator=random&grnnamespace=0&grnlimit=${Math.min(50, count - out.size + 5)}`;
    const j = await fetchJson(url);
    const pages = j?.query?.pages;
    if (!pages) break;
    for (const p of Object.values(pages)) if (p?.title) out.add(p.title);
  }
  return Array.from(out).slice(0, count);
}

async function fullArticle(host, title) {
  // 1. REST summary — gives extract, lead image, description, pageid
  const summary = await fetchJson(`https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!summary?.pageid) return null;
  // 2. Parse API for html sections + media + infobox
  const parse = await fetchJson(`https://${host}/w/api.php?action=parse&format=json&origin=*&page=${encodeURIComponent(title)}&prop=text|sections|images|displaytitle&disabletoc=1`);
  const html = parse?.parse?.text?.["*"] ?? null;
  const sections = (parse?.parse?.sections ?? []).map((s) => ({
    toclevel: s.toclevel, level: s.level, line: s.line, anchor: s.anchor, index: s.index,
  }));
  const images = (parse?.parse?.images ?? []).slice(0, 24);
  const wordCount = stripHtml(html ?? summary.extract ?? "").split(/\s+/).filter(Boolean).length;
  return {
    pageid: summary.pageid,
    title: summary.title,
    slug: slug(summary.title),
    lang: "en",
    category: host.includes("voyage") ? "wikivoyage" : "random",
    description: summary.description ?? null,
    extract: summary.extract ?? null,
    source_url: summary.content_urls?.desktop?.page ?? `https://${host}/wiki/${encodeURIComponent(title)}`,
    lead_image_url: summary.originalimage?.source ?? summary.thumbnail?.source ?? null,
    html,
    sections,
    media: images.map((file) => ({ title: file, type: "image" })),
    infobox: null,
    read_mins: Math.max(1, Math.round(wordCount / 220)),
    word_count: wordCount,
    fetched_at: new Date().toISOString(),
  };
}

async function cacheHost(db, host, count) {
  console.log(`\n[${host}] resolving ${count} random titles…`);
  const titles = await randomTitles(host, count);
  console.log(`[${host}] got ${titles.length} titles`);

  const coll = db.collection("wiki");
  let ok = 0, fail = 0;
  const CONC = 4;
  for (let i = 0; i < titles.length; i += CONC) {
    const batch = titles.slice(i, i + CONC);
    const results = await Promise.allSettled(batch.map(async (t) => {
      const doc = await fullArticle(host, t);
      if (!doc) throw new Error(`no doc for ${t}`);
      await coll.updateOne(
        { _id: String(doc.pageid) },
        { $set: { _id: String(doc.pageid), ...doc } },
        { upsert: true },
      );
      return doc.title;
    }));
    for (const r of results) {
      if (r.status === "fulfilled") ok++; else fail++;
    }
    process.stdout.write(`  ${ok + fail}/${titles.length} ok=${ok} fail=${fail}\r`);
  }
  console.log(`\n[${host}] ok=${ok} fail=${fail}`);
  return { ok, fail };
}

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(MONGO_DB);
console.log(`Connected to ${MONGO_DB}; existing wiki collection count: ${await db.collection("wiki").countDocuments()}`);

const skipWp = argv.includes("--skip-wp");
const skipVoy = argv.includes("--skip-voy");

const wiki = skipWp ? { ok: 0, fail: 0 } : await cacheHost(db, "en.wikipedia.org", PER_HOST);
const voy = skipVoy ? { ok: 0, fail: 0 } : await cacheHost(db, "en.wikivoyage.org", Math.round(PER_HOST / 2));

console.log(`\n--- TOTAL ---`);
console.log(`After run: ${await db.collection("wiki").countDocuments()} documents`);
console.log(`Wikipedia: ok=${wiki.ok} fail=${wiki.fail}`);
console.log(`WikiVoyage: ok=${voy.ok} fail=${voy.fail}`);

await client.close();
