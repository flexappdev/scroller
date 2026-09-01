import { tryGetDb } from "@/lib/mongo-admin";

export type MediaAiArticle = {
  id: string;
  assetId: string;
  topic: string;
  imageUrl: string | null;
  videoUrls: string[];
  audioUrl: string | null;
  sourceUrl: string;
  updatedAt: number;
  assetCount: number;
};

export type MediaAiPage = {
  items: MediaAiArticle[];
  nextOffset: number | null;
};

type AssetKind = "image" | "video" | "audio";

type NormalizedAsset = {
  id: string;
  baseId: string;
  topic: string;
  kind: AssetKind;
  url: string;
  sourceUrl: string | null;
  ts: number;
};

const DB_NAME = process.env.MEDIAI_MONGO_DB || "AIDB";
const COLLECTION = process.env.MEDIAI_MONGO_COLLECTION || "media_baseline";
const DEFAULT_RAW_PAGE = 220;
const MAX_RAW_PAGE = 800;

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime() / 1000;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed / 1000;
  }
  return 0;
}

function normalizeKind(value: unknown): AssetKind | null {
  const kind = String(value ?? "").toLowerCase();
  if (kind === "image" || kind === "image_archive") return "image";
  if (kind === "kenburns" || kind === "ltx" || kind === "video" || kind === "motion") return "video";
  if (kind === "audio" || kind === "voice" || kind === "tts") return "audio";
  return null;
}

function publicS3Url(key: string): string {
  const bucket = process.env.S3_BUCKET_NAME || "com27";
  return `https://${bucket}.s3.amazonaws.com/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function wikaiUrl(topic: string): string {
  const title = topic.replaceAll(" ", "_").replaceAll("/", "_");
  return `https://wikai.matsiems.com/a/${encodeURIComponent(title)}`;
}

function normalizeAsset(doc: Record<string, unknown>): NormalizedAsset | null {
  const kind = normalizeKind(doc.kind ?? doc.type ?? doc.media_type);
  const topic = stringValue(doc.topic ?? doc.title ?? doc.article_title ?? doc.subject);
  const rawId = doc.id ?? doc.asset_id ?? doc.media_id ?? doc._id;
  const id = rawId == null ? null : String(rawId);
  const s3Key = stringValue(doc.s3_key ?? doc.key);
  const url = stringValue(doc.url ?? doc.s3_url ?? doc.public_url) || (s3Key ? publicS3Url(s3Key) : null);

  if (!kind || !topic || !id || !url) return null;

  return {
    id,
    baseId: id.replace(/_[abc]$/i, ""),
    topic,
    kind,
    url,
    sourceUrl: stringValue(doc.source_url ?? doc.article_url ?? doc.wikipedia_url ?? doc.wikivoyage_url),
    ts: numberValue(doc.ts ?? doc.updated_at ?? doc.created_at ?? doc.modified_at),
  };
}

function groupAssets(assets: NormalizedAsset[]): MediaAiArticle[] {
  const grouped = new Map<string, MediaAiArticle>();

  for (const asset of assets) {
    // MediaAI can regenerate the same article under several asset IDs. One
    // topic card should expose every available variant without repeating the
    // article later in the feed.
    const key = `topic:${asset.topic}`;
    const current = grouped.get(key) || {
      id: key,
      assetId: asset.baseId,
      topic: asset.topic,
      imageUrl: null,
      videoUrls: [],
      audioUrl: null,
      sourceUrl: asset.sourceUrl || wikaiUrl(asset.topic),
      updatedAt: asset.ts,
      assetCount: 0,
    };

    current.updatedAt = Math.max(current.updatedAt, asset.ts);
    current.assetCount += 1;
    if (asset.sourceUrl) current.sourceUrl = asset.sourceUrl;

    if (asset.kind === "image" && !current.imageUrl) current.imageUrl = asset.url;
    if (asset.kind === "audio" && !current.audioUrl) current.audioUrl = asset.url;
    if (asset.kind === "video" && !current.videoUrls.includes(asset.url)) current.videoUrls.push(asset.url);

    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

async function getMediaAiSnapshotPage(offset: number, limit: number): Promise<MediaAiPage> {
  const snapshotUrl = process.env.MEDIAI_SNAPSHOT_URL || "https://mediai-public.vercel.app/data.json";
  try {
    const response = await fetch(snapshotUrl, { next: { revalidate: 300 } });
    if (!response.ok) return { items: [], nextOffset: null };
    const snapshot = (await response.json()) as { items?: Array<Record<string, unknown>> };
    const all = Array.isArray(snapshot.items) ? snapshot.items : [];
    const docs = all.slice(offset, offset + limit);
    const assets = docs
      .map((doc) => normalizeAsset(doc))
      .filter((asset): asset is NormalizedAsset => Boolean(asset));
    return {
      items: groupAssets(assets),
      nextOffset: offset + docs.length < all.length ? offset + docs.length : null,
    };
  } catch (error) {
    console.warn("[mediai] public snapshot fallback failed", error);
    return { items: [], nextOffset: null };
  }
}

/**
 * Read MediaAI's continuously-updated AIDB.media_baseline collection and
 * collapse the generated image + motion variants + narration into one
 * swipeable Wikipedia-topic card.
 *
 * Pagination is deliberately based on raw media rows rather than grouped
 * articles. A page boundary can therefore repeat an article; the client
 * merges repeated article IDs so no asset is lost.
 */
export async function getMediaAiPage({
  offset = 0,
  rawLimit = DEFAULT_RAW_PAGE,
}: {
  offset?: number;
  rawLimit?: number;
} = {}): Promise<MediaAiPage> {
  const db = await tryGetDb(DB_NAME);
  if (!db) return getMediaAiSnapshotPage(Math.max(0, Math.floor(offset)), Math.max(20, Math.min(MAX_RAW_PAGE, Math.floor(rawLimit))));

  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.max(20, Math.min(MAX_RAW_PAGE, Math.floor(rawLimit)));

  const usableAsset = {
    $or: [
      { url: { $type: "string", $ne: "" } },
      { s3_url: { $type: "string", $ne: "" } },
      { public_url: { $type: "string", $ne: "" } },
      { s3_key: { $type: "string", $ne: "" } },
      { key: { $type: "string", $ne: "" } },
    ],
  };

  const docs = await db
    .collection(COLLECTION)
    .find(usableAsset)
    .sort({ updated_at: -1, ts: -1, _id: -1 })
    .skip(safeOffset)
    .limit(safeLimit)
    .toArray();

  const assets = docs
    .map((doc) => normalizeAsset(doc as Record<string, unknown>))
    .filter((asset): asset is NormalizedAsset => Boolean(asset));

  return {
    items: groupAssets(assets),
    nextOffset: docs.length === safeLimit ? safeOffset + docs.length : null,
  };
}
