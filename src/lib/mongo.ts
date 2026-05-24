import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB ?? "AIDB";

let cachedClient: MongoClient | null = null;
let cachedPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient | null> {
  if (!uri) return null;
  if (cachedClient) return cachedClient;
  if (!cachedPromise) {
    cachedPromise = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 3000,
    }).connect();
  }
  cachedClient = await cachedPromise;
  return cachedClient;
}

export async function getMongoDb(): Promise<Db | null> {
  const client = await getClient();
  return client ? client.db(dbName) : null;
}

export function isMongoConfigured(): boolean {
  return Boolean(uri);
}

export const SCROLLER_COLLECTION = "SCROLLER";
