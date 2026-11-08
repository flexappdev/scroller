#!/usr/bin/env node
// Build data/wiki/top10k.json: the 10,000 most-viewed English Wikipedia
// articles over the last N days (default 365), with disambiguation pages,
// non-article namespaces and low-value list/meta pages removed.
//
// Source: Wikimedia pageviews "top" API (one top-1000 list per day, summed),
// then the MediaWiki API for description, thumbnail and disambiguation flag.
// Needs network access to wikimedia.org and en.wikipedia.org, so it runs in
// GitHub Actions (.github/workflows/wiki-top10k.yml), not in the app.
//
// Usage: node scripts/wiki-top10k.mjs [--days 365] [--target 10000]

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const DAYS = arg("days", 365);
const TARGET = arg("target", 10_000);
const UA = "scroller.tv top10k builder (https://github.com/flexappdev/scroller)";
const OUT = path.join(process.cwd(), "data", "wiki", "top10k.json");

// Non-article namespaces and pages that are never worth a card.
const NAMESPACE = /^(Special|Wikipedia|WP|File|Image|Portal|Help|Category|Template|Talk|User|User_talk|Draft|Module|MediaWiki|Book|TimedText|Media):/i;
const LOW_VALUE = [
  /^Main_Page$/i,
  /^-$/,
  /^Undefined$/i,
  /^(List|Lists|Index|Outline|Timeline|Glossary)_of_/i,
  /^Deaths_in_/i,
  /^\d{4}$/, // bare years
  /^\d{4}_in_/i,
  /_\(disambiguation\)$/i,
  /^(XXX|XXXX|XHamster|XVideos|Pornhub|Cleavage_\(breasts\)|Bible_\(disambiguation\))$/i,
];
const SKIP_TITLE = (t) => NAMESPACE.test(t) || LOW_VALUE.some((re) => re.test(t));

async function getJson(url, tries = 4) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (error) {
      if (attempt >= tries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const pad = (n) => String(n).padStart(2, "0");

async function aggregateViews() {
  const days = [];
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // yesterday is the latest complete day
  for (let i = 0; i < DAYS; i += 1) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    days.push(d);
  }
  const views = new Map();
  let ok = 0;
  await pool(days, 8, async (d) => {
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
    const json = await getJson(url).catch((e) => {
      console.warn(`skip ${url}: ${e.message}`);
      return null;
    });
    const articles = json?.items?.[0]?.articles ?? [];
    if (articles.length) ok += 1;
    for (const { article, views: v } of articles) {
      if (SKIP_TITLE(article)) continue;
      views.set(article, (views.get(article) ?? 0) + v);
    }
  });
  console.log(`days with data: ${ok}/${DAYS}; distinct articles: ${views.size}`);
  return [...views.entries()].sort((a, b) => b[1] - a[1]);
}

async function enrich(titles) {
  const batches = [];
  for (let i = 0; i < titles.length; i += 50) batches.push(titles.slice(i, i + 50));
  const info = new Map();
  await pool(batches, 4, async (batch) => {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      redirects: "1",
      prop: "pageprops|pageimages|description",
      ppprop: "disambiguation",
      piprop: "thumbnail",
      pithumbsize: "640",
      titles: batch.map((t) => t.replaceAll("_", " ")).join("|"),
    });
    const json = await getJson(`https://en.wikipedia.org/w/api.php?${params}`);
    const q = json?.query ?? {};
    const alias = new Map();
    for (const n of q.normalized ?? []) alias.set(n.to, n.from);
    for (const r of q.redirects ?? []) alias.set(r.to, alias.get(r.from) ?? r.from);
    for (const page of q.pages ?? []) {
      const canonical = page.title;
      const from = alias.get(canonical) ?? canonical;
      info.set(from.replaceAll(" ", "_"), {
        title: canonical,
        missing: Boolean(page.missing || page.invalid),
        ns: page.ns,
        disambiguation: page.pageprops && "disambiguation" in page.pageprops,
        description: page.description ?? null,
        thumb: page.thumbnail?.source ?? null,
      });
      // Redirect targets also answer for themselves.
      info.set(canonical.replaceAll(" ", "_"), info.get(from.replaceAll(" ", "_")));
    }
  });
  return info;
}

const THUMB_PREFIX = "https://upload.wikimedia.org/wikipedia/";

async function main() {
  const ranked = await aggregateViews();
  if (ranked.length < 1000) throw new Error(`only ${ranked.length} articles; refusing to write`);
  // Over-fetch: disambiguation, redirects and missing pages fall out below.
  const candidates = ranked.slice(0, Math.ceil(TARGET * 1.3)).map(([t]) => t);
  const info = await enrich(candidates);

  const merged = new Map();
  let dropped = { disambiguation: 0, missing: 0, namespace: 0, lowValue: 0 };
  for (const [raw, v] of ranked) {
    const meta = info.get(raw);
    if (!meta) continue;
    if (meta.missing) { dropped.missing += 1; continue; }
    if (meta.ns !== 0) { dropped.namespace += 1; continue; }
    if (meta.disambiguation) { dropped.disambiguation += 1; continue; }
    const key = meta.title.replaceAll(" ", "_");
    if (SKIP_TITLE(key)) { dropped.lowValue += 1; continue; }
    const current = merged.get(meta.title);
    if (current) current.views += v; // redirects fold into their target
    else merged.set(meta.title, { title: meta.title, views: v, description: meta.description, thumb: meta.thumb });
  }

  const rows = [...merged.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, TARGET)
    .map((r) => [
      r.title,
      r.views,
      r.description,
      r.thumb?.startsWith(THUMB_PREFIX) ? r.thumb.slice(THUMB_PREFIX.length) : r.thumb,
    ]);

  const out = {
    generatedAt: new Date().toISOString(),
    windowDays: DAYS,
    target: TARGET,
    source: "Wikimedia pageviews top API (en.wikipedia, all-access, daily top 1,000 summed) + MediaWiki API",
    thumbPrefix: THUMB_PREFIX,
    columns: ["title", "views", "description", "thumb"],
    dropped,
    rows,
  };
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out) + "\n");
  console.log(`wrote ${rows.length} rows to ${OUT}`, dropped);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
