// Cache every WikiVoyage article (main namespace) into AIDB.wiki.
// Pages through `action=query&list=allpages&aplimit=500` so nothing is missed.
// For each title: REST /page/summary (extract, lead image, description) +
// parse API (html, sections, media list).
//
// Usage:
//   node scripts/cache-wikivoyage-all.mjs                  # default cap 5000
//   node scripts/cache-wikivoyage-all.mjs --max=20000      # higher cap
//   node scripts/cache-wikivoyage-all.mjs --max=20000 --resume

import fs from "node:fs";
import { MongoClient } from "mongodb";

const envText = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = (k) => envText.match(new RegExp("^" + k + "=(.*)", "m"))?.[1] || "";

const MONGO_URI = env("MONGO_URI");
const MONGO_DB = env("MONGO_DB") || "AIDB";
const USER_AGENT = "Scroller/0.5 (+https://scroller-psi.vercel.app; claude@cleverfox-ai.com)";
const HOST = "en.wikivoyage.org";

const argv = process.argv.slice(2);
const MAX = Number((argv.find((a) => a.startsWith("--max=")) || "--max=5000").split("=")[1]) || 5000;
const RESUME = argv.includes("--resume");
const CONC = 2;
const BATCH_DELAY_MS = 250;

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

async function fullArticle(titleIn, pageidIn) {
  // Single Action API call carries everything we need: parse (html, sections,
  // images), extracts (plain summary), pageimages (lead), and pageprops
  // (description). Cuts request count in half vs REST + parse and tolerates
  // pages REST returns 404 for.
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    redirects: "1",
    prop: "extracts|pageimages|pageprops|info",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    piprop: "original|thumbnail",
    pithumbsize: "640",
  });
  if (pageidIn) params.set("pageids", String(pageidIn));
  else params.set("titles", titleIn);
  const j = await fetchJson(`https://${HOST}/w/api.php?${params.toString()}`);
  const page = j?.query?.pages ? Object.values(j.query.pages)[0] : null;
  if (!page || page.missing || !page.pageid) return null;

  const parse = await fetchJson(`https://${HOST}/w/api.php?action=parse&format=json&origin=*&page=${encodeURIComponent(page.title)}&prop=text|sections|images|displaytitle&disabletoc=1&redirects=1`);
  const html = parse?.parse?.text?.["*"] ?? null;
  const sections = (parse?.parse?.sections ?? []).map((s) => ({
    toclevel: s.toclevel, level: s.level, line: s.line, anchor: s.anchor, index: s.index,
  }));
  const images = (parse?.parse?.images ?? []).slice(0, 24);
  const extract = page.extract ?? null;
  const wordCount = stripHtml(html ?? extract ?? "").split(/\s+/).filter(Boolean).length;
  if (wordCount < 30) return null; // skip stubs

  return {
    pageid: page.pageid,
    title: page.title,
    slug: slug(page.title),
    lang: "en",
    category: "wikivoyage",
    description: page.pageprops?.["wikibase-shortdesc"] ?? page.pageprops?.["wikibase-description"] ?? null,
    extract,
    source_url: page.fullurl ?? `https://${HOST}/wiki/${encodeURIComponent(page.title)}`,
    lead_image_url: page.original?.source ?? page.thumbnail?.source ?? null,
    html,
    sections,
    media: images.map((file) => ({ title: file, type: "image" })),
    infobox: null,
    read_mins: Math.max(1, Math.round(wordCount / 220)),
    word_count: wordCount,
    fetched_at: new Date().toISOString(),
  };
}

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(MONGO_DB);
const coll = db.collection("wiki");

const startCount = await coll.countDocuments({ category: "wikivoyage" });
console.log(`Starting WikiVoyage count: ${startCount} · target cap: ${MAX}`);

let alreadyTitles = new Set();
if (RESUME) {
  console.log("Loading existing titles to skip…");
  const cursor = coll.find({ category: "wikivoyage" }, { projection: { title: 1, _id: 0 } });
  for await (const d of cursor) if (d?.title) alreadyTitles.add(d.title);
  console.log(`Skipping ${alreadyTitles.size} already-cached titles`);
}

let apcontinue = null;
let processed = 0, ok = 0, fail = 0, skip = 0;
let safety = 0;
const startedAt = Date.now();

outer: while (processed + skip < MAX && safety < 200) {
  safety++;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    list: "allpages",
    apnamespace: "0",
    apfilterredir: "nonredirects",
    apminsize: "500",                  // skip stubs/disambig pages
    aplimit: "500",
  });
  if (apcontinue) params.set("apcontinue", apcontinue);
  let j = await fetchJson(`https://${HOST}/w/api.php?${params.toString()}`);
  // Retry once on transient failure so a single network blip doesn't break the
  // pagination loop early.
  if (!j) {
    await new Promise((r) => setTimeout(r, 1500));
    j = await fetchJson(`https://${HOST}/w/api.php?${params.toString()}`);
  }
  const pages = j?.query?.allpages ?? [];
  if (!pages.length) { console.log("No more pages (or list query failed twice)"); break; }
  apcontinue = j?.continue?.apcontinue ?? null;

  console.log(`\nBatch ${safety}: ${pages.length} titles (apcontinue=${apcontinue ? apcontinue.slice(0, 30) : "DONE"})`);

  // Filter already-cached
  const todo = pages.filter((p) => !alreadyTitles.has(p.title));
  skip += pages.length - todo.length;

  for (let i = 0; i < todo.length; i += CONC) {
    if (processed >= MAX) break outer;
    const batch = todo.slice(i, i + CONC);
    const results = await Promise.allSettled(batch.map(async (p) => {
      const doc = await fullArticle(p.title, p.pageid);
      if (!doc) throw new Error("no-doc");
      await coll.updateOne(
        { _id: String(doc.pageid) },
        { $set: { _id: String(doc.pageid), ...doc } },
        { upsert: true },
      );
      return doc.title;
    }));
    for (const r of results) {
      processed++;
      if (r.status === "fulfilled") ok++; else fail++;
    }
    const rate = (ok / ((Date.now() - startedAt) / 1000)).toFixed(1);
    process.stdout.write(`  processed=${processed} ok=${ok} fail=${fail} skip=${skip} (${rate}/s)\r`);
    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }
  if (!apcontinue) break;
}

const endCount = await coll.countDocuments({ category: "wikivoyage" });
console.log(`\n\n--- DONE ---`);
console.log(`Processed: ${processed} (ok=${ok} fail=${fail}, skipped existing=${skip})`);
console.log(`WikiVoyage in Mongo: ${startCount} → ${endCount} (${endCount - startCount > 0 ? "+" : ""}${endCount - startCount})`);
console.log(`Continue token: ${apcontinue ? apcontinue : "exhausted"}`);

await client.close();
