import {
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET, S3_REGION } from "@/lib/s3";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const PREFIX = process.env.S3_SCROLLER_IMAGE_PREFIX ?? "";
const SIGNED_URL_EXPIRES = 60 * 60; // 1h

export type ImageItem = {
  id: string;             // url-safe encoded key
  key: string;            // raw S3 key
  url: string;            // signed URL (expires in 1h)
  title: string;          // filename stem
  size: number;           // bytes
  lastModified: string | null;
  etag: string | null;
  contentType: string | null;
  ext: string;            // ".jpg", ".png", etc.
  filename: string;       // last segment with extension
  prefix: string;         // everything before the filename
  bucket: string;
  region: string;
  publicUrl: string;      // direct (un-signed) URL — works iff bucket policy allows public-read on this prefix
  storageClass: string | null;
};

async function signKey(key: string): Promise<string> {
  return getSignedUrl(
    s3Client(),
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: SIGNED_URL_EXPIRES },
  );
}

function filenameStem(key: string): string {
  const last = key.split("/").pop() ?? key;
  return last.replace(/\.[^.]+$/, "");
}

function filenameFull(key: string): string {
  return key.split("/").pop() ?? key;
}

function prefixOf(key: string): string {
  const idx = key.lastIndexOf("/");
  return idx >= 0 ? key.slice(0, idx + 1) : "";
}

function extOf(key: string): string {
  const m = /\.[^.]+$/.exec(key);
  return m ? m[0].toLowerCase() : "";
}

function publicUrlFor(key: string): string {
  // s3 virtual-hosted style
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function baseItem(o: _Object, key: string): Omit<ImageItem, "url"> {
  return {
    id: encodeURIComponent(key),
    key,
    title: filenameStem(key),
    size: o.Size ?? 0,
    lastModified: o.LastModified ? o.LastModified.toISOString() : null,
    etag: (o.ETag ?? "").replace(/^"|"$/g, "") || null,
    contentType: null, // not available in ListObjects response
    ext: extOf(key),
    filename: filenameFull(key),
    prefix: prefixOf(key),
    bucket: S3_BUCKET,
    region: S3_REGION,
    publicUrl: publicUrlFor(key),
    storageClass: o.StorageClass ?? null,
  };
}

/**
 * Page through the bucket until we've collected `limit` image-extension
 * keys (or hit the end). One call may issue multiple ListObjectsV2 pages
 * since non-image keys are skipped before the count.
 */
export async function getImageItems({
  limit = 100,
  cursor,
}: { limit?: number; cursor?: string } = {}): Promise<{
  items: ImageItem[];
  nextCursor: string | null;
}> {
  if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_ACCESS_KEY) {
    return { items: [], nextCursor: null };
  }
  const objects: _Object[] = [];
  let continuationToken: string | undefined = cursor;
  let safetyPages = 0;

  while (objects.length < limit && safetyPages < 20) {
    safetyPages++;
    const res = await s3Client().send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: PREFIX || undefined,
        ContinuationToken: continuationToken,
        MaxKeys: Math.max(limit * 2, 200),
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key || !IMAGE_EXT.test(obj.Key)) continue;
      objects.push(obj);
      if (objects.length >= limit) break;
    }
    if (!res.IsTruncated || !res.NextContinuationToken) {
      continuationToken = undefined;
      break;
    }
    continuationToken = res.NextContinuationToken;
  }

  const items = await Promise.all(
    objects.map(async (o): Promise<ImageItem> => {
      const key = o.Key as string;
      const url = await signKey(key);
      return { ...baseItem(o, key), url };
    }),
  );

  return { items, nextCursor: continuationToken ?? null };
}

/**
 * Single-key lookup. Issues a HeadObject to fetch ContentType + true
 * lastModified/etag/size (in case the listing was stale or this key
 * wasn't in the listing window).
 */
export async function getImageByKey(key: string): Promise<ImageItem | null> {
  if (!key) return null;
  try {
    const head = await s3Client().send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    const url = await signKey(key);
    return {
      id: encodeURIComponent(key),
      key,
      url,
      title: filenameStem(key),
      size: head.ContentLength ?? 0,
      lastModified: head.LastModified ? head.LastModified.toISOString() : null,
      etag: (head.ETag ?? "").replace(/^"|"$/g, "") || null,
      contentType: head.ContentType ?? null,
      ext: extOf(key),
      filename: filenameFull(key),
      prefix: prefixOf(key),
      bucket: S3_BUCKET,
      region: S3_REGION,
      publicUrl: publicUrlFor(key),
      storageClass: head.StorageClass ?? null,
    };
  } catch {
    return null;
  }
}
