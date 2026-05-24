/**
 * Write-through MongoDB backup for the scroller CMS.
 *
 * Every Supabase write that matters (scroller_sites, ...) fires
 * mirrorUpsert(collection, doc) after the Supabase commit. If Mongo is
 * unreachable, log and continue — Supabase remains authoritative.
 *
 * Connection is created lazily; if MONGO_URI is unset, mirror is a no-op
 * (development without Mongo still works).
 */

type ScrollerCollection = "SCROLLER_sites" | "SCROLLER_publish_log";

interface MirrorClient {
  upsert: (col: ScrollerCollection, doc: Record<string, unknown>, filter?: Record<string, unknown>) => Promise<void>;
  remove: (col: ScrollerCollection, filter: Record<string, unknown>) => Promise<void>;
}

let cached: MirrorClient | null = null;
let cachedPromise: Promise<MirrorClient | null> | null = null;

async function build(): Promise<MirrorClient | null> {
  const url = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!url) return null;
  let mod: typeof import("mongodb");
  try {
    mod = await import("mongodb");
  } catch {
    return null;
  }
  const dbName = process.env.MONGO_DB || "AIDB";
  const client = new mod.MongoClient(url, { serverSelectionTimeoutMS: 2000 });
  await client.connect();
  const db = client.db(dbName);

  return {
    async upsert(col, doc, filter) {
      const f = filter ?? (doc.id ? { id: doc.id } : doc);
      await db.collection(col).updateOne(f, { $set: doc }, { upsert: true });
    },
    async remove(col, filter) {
      await db.collection(col).deleteMany(filter);
    },
  };
}

async function getClient(): Promise<MirrorClient | null> {
  if (cached) return cached;
  if (!cachedPromise) {
    cachedPromise = build().then((c) => {
      cached = c;
      return c;
    }).catch((err) => {
      console.warn("[cms/mongo-mirror] connect failed:", err?.message || err);
      return null;
    });
  }
  return cachedPromise;
}

export async function mirrorUpsert(
  col: ScrollerCollection,
  doc: Record<string, unknown>,
  filter?: Record<string, unknown>,
): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await c.upsert(col, doc, filter);
  } catch (err) {
    console.warn(`[cms/mongo-mirror] upsert ${col} failed:`, (err as Error)?.message);
  }
}

export async function mirrorRemove(col: ScrollerCollection, filter: Record<string, unknown>): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await c.remove(col, filter);
  } catch (err) {
    console.warn(`[cms/mongo-mirror] remove ${col} failed:`, (err as Error)?.message);
  }
}
