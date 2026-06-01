import { randomUUID } from "node:crypto";
import {
  fetchCategoryTitles,
  fetchFeaturedTitle,
  fetchFullArticleByTitle,
  fetchRandomTitles,
} from "./fetch";
import {
  logSeedRun,
  markSeedRun,
  upsertWikiFullToMongo,
  upsertWikiIndex,
} from "./storage";
import { listSeeds } from "./seeds";
import type { WikiRunReport, WikiSeed } from "./types";

const CONCURRENCY = 4;

async function resolveTitles(seed: WikiSeed): Promise<string[]> {
  const max = Math.max(1, Math.min(100, seed.max_pages));
  switch (seed.kind) {
    case "random":
      return fetchRandomTitles(max, seed.lang);
    case "category":
      if (!seed.value) return [];
      return fetchCategoryTitles(seed.value, max, seed.lang);
    case "featured": {
      const t = await fetchFeaturedTitle(seed.lang);
      return t ? [t] : [];
    }
    case "title":
      return seed.value ? [seed.value] : [];
    case "pageid":
      return seed.value ? [seed.value] : [];
    default:
      return [];
  }
}

async function processSeed(seed: WikiSeed, runId: string): Promise<{
  fetched: number;
  upserted: number;
  failed: number;
  status: "ok" | "partial" | "error";
}> {
  const startedAt = new Date().toISOString();
  let fetched = 0;
  let upserted = 0;
  let failed = 0;
  let firstError: string | null = null;

  try {
    const titles = await resolveTitles(seed);
    fetched = titles.length;

    for (let i = 0; i < titles.length; i += CONCURRENCY) {
      const batch = titles.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (title) => {
          const doc = await fetchFullArticleByTitle(title, {
            lang: seed.lang,
            category: seed.id,
          });
          if (!doc) throw new Error(`no-doc:${title}`);
          const mongoRef = await upsertWikiFullToMongo(doc);
          await upsertWikiIndex(doc, mongoRef, mongoRef ? "ok" : "partial");
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled") upserted += 1;
        else {
          failed += 1;
          if (!firstError) firstError = (r.reason as Error)?.message ?? "unknown";
        }
      }
    }

    const status: "ok" | "partial" | "error" =
      failed === 0 ? "ok" : upserted === 0 ? "error" : "partial";

    await logSeedRun({
      run_id: runId,
      seed_id: seed.id,
      status,
      fetched,
      upserted,
      failed,
      message: firstError,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    await markSeedRun(seed.id, status, upserted);

    return { fetched, upserted, failed, status };
  } catch (err) {
    const message = (err as Error)?.message ?? "seed-failed";
    await logSeedRun({
      run_id: runId,
      seed_id: seed.id,
      status: "error",
      fetched,
      upserted,
      failed: fetched - upserted,
      message,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });
    await markSeedRun(seed.id, "error", upserted);
    return { fetched, upserted, failed: fetched - upserted, status: "error" };
  }
}

export interface RunOptions {
  seedIds?: string[];      // explicit subset, otherwise all enabled
  forceAll?: boolean;      // ignore enabled flag (admin runs)
}

export async function runWikiConverter(opts: RunOptions = {}): Promise<WikiRunReport> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  const all = await listSeeds({ enabledOnly: !opts.forceAll });
  const seeds = opts.seedIds?.length
    ? all.filter((s) => opts.seedIds!.includes(s.id))
    : all;

  let totalFetched = 0;
  let totalUpserted = 0;
  let totalFailed = 0;
  let degraded = false;
  let fullyFailed = 0;

  for (const seed of seeds) {
    const r = await processSeed(seed, runId);
    totalFetched += r.fetched;
    totalUpserted += r.upserted;
    totalFailed += r.failed;
    if (r.status === "partial") degraded = true;
    if (r.status === "error") fullyFailed += 1;
  }

  const status: "ok" | "partial" | "error" =
    seeds.length === 0
      ? "error"
      : fullyFailed === seeds.length
      ? "error"
      : fullyFailed > 0 || degraded
      ? "partial"
      : "ok";

  return {
    run_id: runId,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    seeds: seeds.length,
    fetched: totalFetched,
    upserted: totalUpserted,
    failed: totalFailed,
    status,
  };
}

export async function syncOneTitle(
  title: string,
  category = "manual",
  lang = "en",
): Promise<{ ok: boolean; pageid?: number; error?: string }> {
  const doc = await fetchFullArticleByTitle(title, { lang, category });
  if (!doc) return { ok: false, error: "no-doc" };
  const mongoRef = await upsertWikiFullToMongo(doc);
  await upsertWikiIndex(doc, mongoRef, mongoRef ? "ok" : "partial");
  return { ok: true, pageid: doc.pageid };
}
