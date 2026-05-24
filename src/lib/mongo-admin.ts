import { MongoClient, type Db } from "mongodb";

const URI =
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.MONGODB_URI ||
  "";
const DB_NAME = process.env.MONGO_DB || process.env.MONGODB_DB || "AIDB";

type Cache = {
  client?: MongoClient;
  db?: Db;
  promise?: Promise<{ client: MongoClient; db: Db }>;
};

const g = globalThis as unknown as { _scrollerMongoAdmin?: Cache };
if (!g._scrollerMongoAdmin) g._scrollerMongoAdmin = {};
const cache = g._scrollerMongoAdmin;

async function build() {
  if (!URI) throw new Error("MONGO_URI not set");
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 2000, maxPoolSize: 5 });
  await client.connect();
  const db = client.db(DB_NAME);
  return { client, db };
}

export async function getClient(): Promise<MongoClient> {
  if (cache.client) return cache.client;
  if (!cache.promise) {
    cache.promise = build().then((r) => {
      cache.client = r.client;
      cache.db = r.db;
      return r;
    });
  }
  const { client } = await cache.promise;
  return client;
}

export async function getDb(dbName?: string): Promise<Db> {
  const client = await getClient();
  return dbName ? client.db(dbName) : client.db(DB_NAME);
}

export async function tryGetDb(dbName?: string): Promise<Db | null> {
  try {
    return await getDb(dbName);
  } catch (err) {
    console.warn("[scroller/mongo-admin] unreachable:", (err as Error)?.message);
    return null;
  }
}

export function getDefaultDbName(): string {
  return DB_NAME;
}

export async function pingDb(): Promise<number | null> {
  try {
    const db = await getDb();
    const t0 = Date.now();
    await db.command({ ping: 1 });
    return Date.now() - t0;
  } catch {
    return null;
  }
}
