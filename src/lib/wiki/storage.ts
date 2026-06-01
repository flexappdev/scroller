import { cmsAdmin, cmsAdminOrNull, isMissingTable } from "@/lib/cms/supabase";
import { getMongoDb } from "@/lib/mongo";
import type { WikiFullDoc, WikiIndexRow } from "./types";

export const WIKI_COLLECTION = "WIKI_articles";

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

export async function listWikiIndex(opts: ListWikiOptions = {}): Promise<ListWikiResult> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return { rows: [], total: 0 };
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
    if (isMissingTable(error)) return { rows: [], total: 0 };
    throw new Error(error.message);
  }
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

export async function listWikiCategories(): Promise<Array<{ category: string; count: number }>> {
  const supabase = cmsAdminOrNull();
  if (!supabase) return [];
  // Supabase has no group-by in the simple client; aggregate client-side over the
  // category column. The index stays small relative to Mongo so this is cheap.
  const { data, error } = await supabase.from("scroller_wiki_index").select("category");
  if (error) {
    if (isMissingTable(error)) return [];
    throw new Error(error.message);
  }
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
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
