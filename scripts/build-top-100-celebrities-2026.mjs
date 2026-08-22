#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const USER_AGENT = "ScrollerTop100/1.0 (https://www.matsiems.com/)";
const YEAR = 2026;
const LAST_COMPLETE_MONTH = 7;
const START = "2026010100";
const END = "2026073100";
const OUTPUT_DIR = path.resolve("data/scrollers/top-100-celebrities-2026");
const RETRIEVED_AT = new Date().toISOString();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December",
];

const INCLUDE_RE = /\b(actor|actress|singer|rapper|musician|songwriter|record producer|composer|disc jockey|comedian|filmmaker|film director|film producer|screenwriter|television host|television presenter|presenter|broadcaster|journalist|media personality|internet personality|social media personality|youtuber|streamer|content creator|model|fashion designer|professional wrestler|footballer|soccer player|basketball player|tennis player|cricketer|golfer|racing driver|formula one driver|baseball player|american football player|rugby player|mixed martial artist|boxer|athlete|gymnast|swimmer|skier|skateboarder|surfer|chess grandmaster|chef|author|writer|dancer)\b/i;
const EXCLUDE_PRIMARY_RE = /\b(politician|political figure|royal family|monarch|king of|queen of|prince of|princess of|business magnate|business executive|chief executive|criminal|murderer|terrorist|military officer|religious leader)\b/i;
const ENTERTAINMENT_OVERRIDE_RE = /\b(actor|actress|singer|rapper|musician|comedian|filmmaker|television|presenter|model|athlete|player|driver|boxer|wrestler|youtuber|streamer)\b/i;

const EXCLUDED_TITLES = new Set([
  "Donald Trump", "Barack Obama", "Joe Biden", "JD Vance", "Vladimir Putin",
  "Volodymyr Zelenskyy", "Narendra Modi", "Keir Starmer", "Emmanuel Macron",
  "Benjamin Netanyahu", "Kim Jong Un", "Xi Jinping", "Pope Leo XIV",
  "Charles III", "Prince William, Prince of Wales", "Catherine, Princess of Wales",
  "Prince Harry, Duke of Sussex", "Meghan, Duchess of Sussex", "Elon Musk",
  "Jeff Bezos", "Mark Zuckerberg", "Sam Altman",
]);

const ROLE_PRIORITY = [
  /actor|actress/i,
  /singer|rapper|musician|songwriter/i,
  /footballer|soccer player/i,
  /basketball player/i,
  /tennis player/i,
  /cricketer/i,
  /racing driver|formula one/i,
  /professional wrestler/i,
  /mixed martial artist|boxer/i,
  /comedian/i,
  /television host|television presenter|presenter|broadcaster/i,
  /internet personality|social media personality|youtuber|streamer|content creator/i,
  /model|fashion designer/i,
  /film director|filmmaker|film producer|screenwriter/i,
  /athlete|gymnast|swimmer|golfer|baseball|american football|rugby|skier|skateboarder|surfer/i,
  /chef|author|writer|dancer|journalist/i,
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(400 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function claimIds(entity, property, currentOnly = false) {
  const claims = entity?.claims?.[property] ?? [];
  const usable = currentOnly
    ? claims.filter((claim) => !claim.qualifiers?.P582 && claim.rank !== "deprecated")
    : claims.filter((claim) => claim.rank !== "deprecated");
  return usable
    .sort((a, b) => Number(b.rank === "preferred") - Number(a.rank === "preferred"))
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function firstSentence(text = "") {
  const clean = text.replace(/\s+/g, " ").trim();
  const match = clean.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] ?? clean).slice(0, 280);
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function csvCell(value) {
  const string = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${string.replaceAll('"', '""')}"`;
}

function encodedTitle(title) {
  return encodeURIComponent(title.replaceAll(" ", "_"));
}

function visualMotif(role) {
  if (/singer|rapper|musician|songwriter|record producer|composer|disc jockey/i.test(role)) return "layered stage light, waveform geometry and vinyl-like arcs";
  if (/footballer|soccer|basketball|tennis|cricket|driver|wrestler|fighter|boxer|athlete|gymnast|swimmer|golfer|baseball|rugby|skier|skateboarder|surfer/i.test(role)) return "kinetic arena light, speed trails and abstract score-line geometry";
  if (/actor|actress|filmmaker|director|producer|screenwriter/i.test(role)) return "cinematic spotlights, fragmented film frames and deep theatre shadows";
  if (/youtuber|streamer|internet|social media|content creator/i.test(role)) return "electric interface fragments, scrolling light and digital audience energy";
  if (/model|fashion designer/i.test(role)) return "architectural runway light, fabric-like forms and high-fashion negative space";
  if (/chef/i.test(role)) return "dramatic kitchen light, steam-like brushwork and geometric plating forms";
  if (/author|writer|journalist/i.test(role)) return "paper textures, typographic shapes without readable text and pools of reading light";
  return "broadcast light, layered editorial shapes and a subtle global-audience motif";
}

function makePrompt(person) {
  return `Stylized editorial landscape portrait of ${person.name}, ${person.role}${person.organisation === "Independent" ? "" : ` associated with ${person.organisation}`}; recognizable but clearly illustrated, not photorealistic; ${visualMotif(person.role)}; sophisticated magazine-cover composition, subject offset for 16:9 framing, bold restrained palette, crisp facial structure, cinematic depth, original artwork, no copied photograph, no logos, no readable text, no watermark, 1280x720.`;
}

async function discoverCandidates() {
  const appearances = new Map();
  const discoverySources = [];
  for (let month = 1; month <= LAST_COMPLETE_MONTH; month += 1) {
    const mm = String(month).padStart(2, "0");
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/${YEAR}/${mm}/all-days`;
    const data = await fetchJson(url);
    discoverySources.push(url);
    for (const article of data.items?.[0]?.articles ?? []) {
      if (/^(Main_Page|Special:|Wikipedia:|Portal:|File:|Template:|Category:|List_of_|Deaths_in_)/.test(article.article)) continue;
      const title = article.article.replaceAll("_", " ");
      const entry = appearances.get(title) ?? { title, discoveryViews: 0, months: [] };
      entry.discoveryViews += article.views;
      entry.months.push({ month, views: article.views, monthlyRank: article.rank });
      appearances.set(title, entry);
    }
  }
  return { appearances, discoverySources };
}

async function loadWikipediaPages(titles) {
  const pages = new Map();
  for (const batch of chunks(titles, 45)) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      redirects: "1",
      prop: "pageprops|info|extracts|description",
      inprop: "url",
      exintro: "1",
      explaintext: "1",
      titles: batch.join("|"),
    });
    const data = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
    for (const page of data.query?.pages ?? []) {
      if (!page.missing) pages.set(page.title, page);
    }
  }
  return pages;
}

async function loadWikidataEntities(ids, props = "labels|descriptions|claims") {
  const entities = new Map();
  for (const batch of chunks([...new Set(ids)], 45)) {
    const params = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      props,
      languages: "en",
      ids: batch.join("|"),
    });
    const data = await fetchJson(`https://www.wikidata.org/w/api.php?${params}`);
    for (const [id, entity] of Object.entries(data.entities ?? {})) entities.set(id, entity);
  }
  return entities;
}

async function exactPageviews(title) {
  const article = encodedTitle(title);
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user/${article}/monthly/${START}/${END}`;
  const data = await fetchJson(url);
  const months = (data.items ?? []).map((item) => ({
    month: Number(String(item.timestamp).slice(4, 6)),
    views: item.views,
  }));
  return { url, views: months.reduce((sum, item) => sum + item.views, 0), months };
}

async function mapConcurrent(values, concurrency, mapper) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
      await sleep(40);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const { appearances, discoverySources } = await discoverCandidates();
  const discovery = [...appearances.values()].sort((a, b) => b.discoveryViews - a.discoveryViews);
  const wikiPages = await loadWikipediaPages(discovery.map((entry) => entry.title));
  const pageByQid = new Map();
  for (const page of wikiPages.values()) {
    const qid = page.pageprops?.wikibase_item;
    if (qid) pageByQid.set(qid, page);
  }

  const entities = await loadWikidataEntities([...pageByQid.keys()]);
  const labelIds = [];
  for (const entity of entities.values()) {
    labelIds.push(...claimIds(entity, "P106"));
    labelIds.push(...claimIds(entity, "P54", true));
    labelIds.push(...claimIds(entity, "P264"));
    labelIds.push(...claimIds(entity, "P108", true));
    labelIds.push(...claimIds(entity, "P463", true));
  }
  const labelEntities = await loadWikidataEntities(labelIds, "labels");
  const label = (id) => labelEntities.get(id)?.labels?.en?.value ?? null;

  const eligible = [];
  for (const [qid, page] of pageByQid) {
    const entity = entities.get(qid);
    const isHuman = claimIds(entity, "P31").includes("Q5");
    const isLiving = !(entity?.claims?.P570?.length > 0);
    if (!isHuman || !isLiving || EXCLUDED_TITLES.has(page.title)) continue;

    const occupations = claimIds(entity, "P106").map(label).filter(Boolean);
    const description = page.description ?? entity?.descriptions?.en?.value ?? "";
    const classificationText = `${description}; ${occupations.join("; ")}`;
    if (!INCLUDE_RE.test(classificationText)) continue;
    if (EXCLUDE_PRIMARY_RE.test(description) && !ENTERTAINMENT_OVERRIDE_RE.test(description)) continue;

    const appearance = appearances.get(page.title);
    if (!appearance) continue;
    const sortedOccupations = occupations
      .filter((occupation) => INCLUDE_RE.test(occupation))
      .sort((a, b) => {
        const ai = ROLE_PRIORITY.findIndex((pattern) => pattern.test(a));
        const bi = ROLE_PRIORITY.findIndex((pattern) => pattern.test(b));
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      });
    const role = sortedOccupations.length
      ? sortedOccupations.slice(0, 2).map(titleCase).join(" and ")
      : titleCase(description.replace(/\s*\(.+$/, ""));

    let organisationIds = [];
    if (/player|footballer|driver|wrestler|athlete|boxer|fighter/i.test(role)) {
      organisationIds = claimIds(entity, "P54", true);
    }
    if (!organisationIds.length && /singer|rapper|musician|songwriter|producer|composer/i.test(role)) {
      organisationIds = claimIds(entity, "P264");
    }
    if (!organisationIds.length) organisationIds = claimIds(entity, "P108", true);
    if (!organisationIds.length) organisationIds = claimIds(entity, "P463", true);
    const organisations = organisationIds.map(label).filter(Boolean);

    eligible.push({
      title: page.title,
      qid,
      page,
      role,
      organisation: organisations.slice(0, 2).join(" / ") || "Independent",
      discoveryViews: appearance.discoveryViews,
      discoveryMonths: appearance.months,
    });
  }

  const shortlist = eligible.sort((a, b) => b.discoveryViews - a.discoveryViews).slice(0, 220);
  const measured = await mapConcurrent(shortlist, 6, async (candidate) => ({
    ...candidate,
    pageviews: await exactPageviews(candidate.title),
  }));
  const ranked = measured.sort((a, b) => b.pageviews.views - a.pageviews.views).slice(0, 100);

  const items = ranked.map((candidate, index) => {
    const rank = index + 1;
    const name = candidate.title;
    const peak = [...candidate.pageviews.months].sort((a, b) => b.views - a.views)[0];
    const activeMonths = candidate.pageviews.months.filter((month) => month.views > 0).length;
    const views = candidate.pageviews.views;
    const formattedViews = new Intl.NumberFormat("en-GB").format(views);
    const peakViews = new Intl.NumberFormat("en-GB").format(peak?.views ?? 0);
    const bioUrl = candidate.page.fullurl ?? `https://en.wikipedia.org/wiki/${encodedTitle(name)}`;
    const justification = `Ranked #${rank} by ${formattedViews} verified English Wikipedia user pageviews from 1 January to 31 July 2026. Attention was recorded in ${activeMonths} monthly periods and peaked in ${MONTH_NAMES[(peak?.month ?? 1) - 1]} at ${peakViews} views.`;
    const narration = `At number ${rank}, ${name}, ${candidate.role.toLowerCase()}${candidate.organisation === "Independent" ? "" : ` associated with ${candidate.organisation}`}. The biography drew ${formattedViews} English Wikipedia user pageviews through July 2026, with its biggest month in ${MONTH_NAMES[(peak?.month ?? 1) - 1]}.`;
    const person = {
      rank,
      name,
      role: candidate.role,
      organisation: candidate.organisation,
      justification,
      narration,
      editorial_image_prompt: "",
      evidence: {
        metric: "English Wikipedia user pageviews",
        period_start: "2026-01-01",
        period_end: "2026-07-31",
        pageviews: views,
        peak_month: `${YEAR}-${String(peak?.month ?? 1).padStart(2, "0")}`,
        peak_month_pageviews: peak?.views ?? 0,
        ranking_type: "published_metric_rank",
      },
      summary: firstSentence(candidate.page.extract),
      sources: [
        { title: `${name} biography`, publisher: "English Wikipedia", url: bioUrl, kind: "role_and_context", retrieved_at: RETRIEVED_AT },
        { title: `${name} pageview series`, publisher: "Wikimedia Analytics API", url: candidate.pageviews.url, kind: "ranking_metric", retrieved_at: RETRIEVED_AT },
        { title: `${name} structured data`, publisher: "Wikidata", url: `https://www.wikidata.org/wiki/${candidate.qid}`, kind: "occupation_and_affiliation", retrieved_at: RETRIEVED_AT },
      ],
    };
    person.editorial_image_prompt = makePrompt(person);
    return person;
  });

  const methodology = {
    title: "Top 100 Celebrities 2026",
    scope: "Living public figures whose primary notability is entertainment, sport, media, digital culture, food, publishing or fashion.",
    exclusions: "Serving politicians, royalty, business-only figures, criminals, religious leaders and people who died before retrieval were excluded. Celebrity is used as an editorial category, not a Wikimedia classification.",
    discovery: "Candidates had to appear in at least one English Wikipedia monthly Top 1000 most-viewed pages list from January through July 2026.",
    ranking: "Eligible candidates were ordered solely by exact cumulative English Wikipedia all-access user pageviews from 1 January through 31 July 2026. No subjective score or paid placement was used.",
    caveats: [
      "This measures English-language Wikipedia attention, not favourability, income, talent or global popularity.",
      "Breaking news and releases can create temporary spikes.",
      "August 2026 is excluded because it was incomplete when the list was produced.",
      "Roles and affiliations come from live Wikipedia/Wikidata metadata and may lag real-world changes; Independent means no durable current organisation was available in the structured record.",
    ],
    source_policy: "Ranking data is CC0 Wikimedia Analytics data. Biographical context is linked to its live Wikipedia and Wikidata source. All generated-image prompts specify original, clearly illustrated editorial art.",
  };

  const json = {
    ...methodology,
    slug: "top-100-celebrities-2026",
    generated_at: RETRIEVED_AT,
    status: "draft_for_review",
    media_generated: false,
    source_dataset: {
      project: "en.wikipedia",
      access: "all-access",
      agent: "user",
      discovery_urls: discoverySources,
      documentation: [
        "https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html",
        "https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html",
      ],
    },
    items,
  };

  const csvHeaders = [
    "rank", "name", "role", "organisation", "justification", "pageviews",
    "period_start", "period_end", "peak_month", "peak_month_pageviews", "summary",
    "narration", "editorial_image_prompt", "wikipedia_url", "pageviews_url", "wikidata_url",
  ];
  const csvRows = items.map((item) => [
    item.rank, item.name, item.role, item.organisation, item.justification, item.evidence.pageviews,
    item.evidence.period_start, item.evidence.period_end, item.evidence.peak_month,
    item.evidence.peak_month_pageviews, item.summary, item.narration, item.editorial_image_prompt,
    item.sources[0].url, item.sources[1].url, item.sources[2].url,
  ].map(csvCell).join(","));
  const csv = `${csvHeaders.map(csvCell).join(",")}\n${csvRows.join("\n")}\n`;

  const methodologyMd = [
    "# Top 100 Celebrities 2026",
    "",
    `**Status:** Draft for review · **Generated:** ${RETRIEVED_AT} · **Media:** Not generated`,
    "",
    "## Transparent methodology",
    "",
    `- **Scope:** ${methodology.scope}`,
    `- **Candidate discovery:** ${methodology.discovery}`,
    `- **Ranking:** ${methodology.ranking}`,
    `- **Exclusions:** ${methodology.exclusions}`,
    `- **Sources:** ${methodology.source_policy}`,
    "",
    "### Caveats",
    "",
    ...methodology.caveats.map((caveat) => `- ${caveat}`),
    "",
    "## Ranked list",
    "",
    "| Rank | Name | Role | Organisation | Jan-Jul pageviews | Peak month | Sources |",
    "|---:|---|---|---|---:|---|---|",
    ...items.map((item) => `| ${item.rank} | ${item.name} | ${item.role} | ${item.organisation} | ${new Intl.NumberFormat("en-GB").format(item.evidence.pageviews)} | ${item.evidence.peak_month} | [Bio](${item.sources[0].url}) · [Views](${item.sources[1].url}) · [Data](${item.sources[2].url}) |`),
    "",
    "## Editorial records",
    "",
    ...items.flatMap((item) => [
      `### ${item.rank}. ${item.name}`,
      "",
      `- **Role:** ${item.role}`,
      `- **Organisation:** ${item.organisation}`,
      `- **Justification:** ${item.justification}`,
      `- **Context:** ${item.summary}`,
      `- **Narration:** ${item.narration}`,
      `- **Editorial image prompt:** ${item.editorial_image_prompt}`,
      `- **Sources:** [English Wikipedia](${item.sources[0].url}) · [Wikimedia pageviews](${item.sources[1].url}) · [Wikidata](${item.sources[2].url})`,
      "",
    ]),
  ].join("\n");

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(OUTPUT_DIR, "top-100-celebrities-2026.json"), `${JSON.stringify(json, null, 2)}\n`),
    writeFile(path.join(OUTPUT_DIR, "top-100-celebrities-2026.csv"), csv),
    writeFile(path.join(OUTPUT_DIR, "top-100-celebrities-2026.md"), `${methodologyMd}\n`),
  ]);

  console.log(JSON.stringify({ outputDir: OUTPUT_DIR, eligible: eligible.length, measured: measured.length, items: items.length, top10: items.slice(0, 10).map(({ rank, name, evidence }) => ({ rank, name, pageviews: evidence.pageviews })) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
