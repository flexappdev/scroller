import { cmsAdmin, cmsAdminOrNull, isMissingTable } from "@/lib/cms/supabase";
import { getMongoDb } from "@/lib/mongo";
import type { WikiFullDoc, WikiIndexRow } from "./types";

// AIDB.WIKI_articles can't be created — Mongo Atlas free-tier cluster is at the
// 500-collection cap. Reuse the existing `wiki` collection in AIDB instead.
// Documents from the converter carry the same shape (pageid, html, sections,
// media) regardless of which collection they live in.
export const WIKI_COLLECTION = "wiki";

export async function upsertWikiFullToMongo(doc: WikiFullDoc): Promise<string | null> {
  try {
    const db = await getMongoDb();
    if (!db) return null;
    await db.collection(WIKI_COLLECTION).updateOne(
      { _id: String(doc.pageid) as unknown as never },
      {
        $set: {
          _id: String(doc.pageid),
          pageid: doc.pageid,
          title: doc.title,
          slug: doc.slug,
          lang: doc.lang,
          category: doc.category,
          description: doc.description,
          extract: doc.extract,
          source_url: doc.source_url,
          lead_image_url: doc.lead_image_url,
          html: doc.html,
          sections: doc.sections,
          media: doc.media,
          infobox: doc.infobox,
          read_mins: doc.read_mins,
          word_count: doc.word_count,
          fetched_at: doc.fetched_at,
        },
      },
      { upsert: true },
    );
    return String(doc.pageid);
  } catch (err) {
    console.warn("[wiki/storage] mongo upsert failed:", (err as Error)?.message);
    return null;
  }
}

export async function getWikiFullFromMongo(pageid: number): Promise<WikiFullDoc | null> {
  try {
    const db = await getMongoDb();
    if (!db) return null;
    const doc = await db.collection(WIKI_COLLECTION).findOne(
      { _id: String(pageid) as unknown as never },
      { projection: { _id: 0 } },
    );
    return (doc as unknown as WikiFullDoc) ?? null;
  } catch (err) {
    console.warn("[wiki/storage] mongo read failed:", (err as Error)?.message);
    return null;
  }
}

export async function upsertWikiIndex(
  doc: WikiFullDoc,
  mongoRef: string | null,
  syncStatus: "ok" | "partial" | "error" = "ok",
): Promise<WikiIndexRow | null> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return null;
  const payload = {
    pageid: doc.pageid,
    title: doc.title,
    slug: doc.slug,
    lang: doc.lang,
    category: doc.category,
    description: doc.description,
    extract: doc.extract,
    lead_image_url: doc.lead_image_url,
    source_url: doc.source_url,
    read_mins: doc.read_mins,
    word_count: doc.word_count,
    media_count: doc.media.length,
    section_count: doc.sections.length,
    mongo_ref: mongoRef,
    sync_status: syncStatus,
    data: { infobox_keys: doc.infobox ? Object.keys(doc.infobox).length : 0 },
    fetched_at: doc.fetched_at,
  };
  const { data, error } = await supabase
    .from("scroller_wiki_index")
    .upsert(payload, { onConflict: "pageid" })
    .select()
    .single();
  if (error) {
    if (isMissingTable(error)) return null;
    console.warn("[wiki/storage] supabase upsert failed:", error.message);
    return null;
  }
  return data as WikiIndexRow;
}

export interface ListWikiOptions {
  category?: string;
  limit?: number;
  offset?: number;
  q?: string;
}

export interface ListWikiResult {
  rows: WikiIndexRow[];
  total: number;
}

async function listWikiIndexFromMongo(opts: ListWikiOptions): Promise<ListWikiResult> {
  try {
    const db = await getMongoDb();
    if (!db) return { rows: [], total: 0 };
    const limit = Math.min(200, Math.max(1, opts.limit ?? 30));
    const offset = Math.max(0, opts.offset ?? 0);
    const filter: Record<string, unknown> = { pageid: { $exists: true } };
    if (opts.category && opts.category !== "all") filter.category = opts.category;
    if (opts.q && opts.q.trim()) filter.title = { $regex: opts.q.trim(), $options: "i" };
    const coll = db.collection(WIKI_COLLECTION);
    const total = await coll.countDocuments(filter);
    const docs = await coll.find(filter).sort({ fetched_at: -1 }).skip(offset).limit(limit).toArray();
    const rows: WikiIndexRow[] = docs.map((d) => {
      const doc = d as unknown as WikiFullDoc & { _id?: unknown };
      return {
        pageid: doc.pageid,
        title: doc.title,
        slug: doc.slug,
        lang: doc.lang,
        category: doc.category,
        description: doc.description,
        extract: doc.extract,
        lead_image_url: doc.lead_image_url,
        source_url: doc.source_url,
        read_mins: doc.read_mins,
        word_count: doc.word_count,
        media_count: doc.media?.length ?? 0,
        section_count: doc.sections?.length ?? 0,
        mongo_ref: String(doc.pageid),
        sync_status: "ok",
        data: {},
        fetched_at: doc.fetched_at,
        updated_at: doc.fetched_at,
      };
    });
    return { rows, total };
  } catch (err) {
    console.warn("[wiki/storage] mongo index read failed:", (err as Error).message);
    return { rows: [], total: 0 };
  }
}

export async function listWikiIndex(opts: ListWikiOptions = {}): Promise<ListWikiResult> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return listWikiIndexFromMongo(opts);
  const limit = Math.min(200, Math.max(1, opts.limit ?? 30));
  const offset = Math.max(0, opts.offset ?? 0);
  let q = supabase
    .from("scroller_wiki_index")
    .select("*", { count: "exact" })
    .order("fetched_at", { ascending: false });
  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  if (opts.q && opts.q.trim()) {
    const term = opts.q.trim();
    q = q.ilike("title", `%${term}%`);
  }
  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) {
    // Table missing OR Supabase down → fall back to Mongo. The Mongo cache is
    // the heavy payload regardless; the Supabase index is just a flat copy.
    if (isMissingTable(error)) return listWikiIndexFromMongo(opts);
    throw new Error(error.message);
  }
  // Supabase reachable but empty → cover with Mongo too so the page never reads
  // as "0 cached" when the converter has populated Mongo from a prior run.
  if ((count ?? 0) === 0) return listWikiIndexFromMongo(opts);
  return { rows: (data ?? []) as WikiIndexRow[], total: count ?? 0 };
}

export async function getWikiIndexByPageid(pageid: number): Promise<WikiIndexRow | null> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("scroller_wiki_index")
    .select("*")
    .eq("pageid", pageid)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) return null;
    throw new Error(error.message);
  }
  return (data ?? null) as WikiIndexRow | null;
}

async function listWikiCategoriesFromMongo(): Promise<Array<{ category: string; count: number }>> {
  try {
    const db = await getMongoDb();
    if (!db) return [];
    const cursor = db.collection(WIKI_COLLECTION).aggregate([
      { $match: { category: { $exists: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", count: 1 } },
      { $sort: { count: -1 } },
    ]);
    return (await cursor.toArray()) as Array<{ category: string; count: number }>;
  } catch (err) {
    console.warn("[wiki/storage] mongo categories read failed:", (err as Error).message);
    return [];
  }
}

export async function listWikiCategories(): Promise<Array<{ category: string; count: number }>> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return listWikiCategoriesFromMongo();
  const { data, error } = await supabase.from("scroller_wiki_index").select("category");
  if (error) {
    if (isMissingTable(error)) return listWikiCategoriesFromMongo();
    throw new Error(error.message);
  }
  if (!data || data.length === 0) return listWikiCategoriesFromMongo();
  const counts = new Map<string, number>();
  for (const r of data) {
    const c = (r as { category?: string }).category ?? "random";
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return Array.from(counts, ([category, count]) => ({ category, count })).sort(
    (a, b) => b.count - a.count,
  );
}

export async function logSeedRun(entry: {
  run_id: string;
  seed_id: string | null;
  status: "ok" | "partial" | "error";
  fetched: number;
  upserted: number;
  failed: number;
  message?: string | null;
  started_at: string;
  finished_at: string;
}): Promise<void> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return;
  const { error } = await supabase.from("scroller_wiki_log").insert(entry);
  if (error && !isMissingTable(error)) {
    console.warn("[wiki/storage] log insert failed:", error.message);
  }
}

export async function recentWikiLogs(limit = 50): Promise<
  Array<{
    id: string;
    run_id: string;
    seed_id: string | null;
    status: string;
    fetched: number;
    upserted: number;
    failed: number;
    message: string | null;
    started_at: string;
    finished_at: string | null;
  }>
> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("scroller_wiki_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as Array<{
    id: string;
    run_id: string;
    seed_id: string | null;
    status: string;
    fetched: number;
    upserted: number;
    failed: number;
    message: string | null;
    started_at: string;
    finished_at: string | null;
  }>;
}

export async function markSeedRun(
  seedId: string,
  status: string,
  count: number,
): Promise<void> {
  try {
    const supabase = cmsAdmin();
    await supabase
      .from("scroller_wiki_seeds")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
        last_run_count: count,
      })
      .eq("id", seedId);
  } catch (err) {
    console.warn("[wiki/storage] seed mark failed:", (err as Error)?.message);
  }
}
