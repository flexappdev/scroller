import { ListObjectsV2Command, GetObjectCommand, type _Object } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET } from "@/lib/s3";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const PREFIX = process.env.S3_SCROLLER_IMAGE_PREFIX ?? "";
const SIGNED_URL_EXPIRES = 60 * 60; // 1h

export type ImageItem = {
  id: string;        // url-safe encoded key
  key: string;       // raw S3 key
  url: string;       // signed URL (expires in 1h)
  title: string;     // filename stem
  size: number;      // bytes
  lastModified: string | null;
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
      return {
        id: encodeURIComponent(key),
        key,
        url: await signKey(key),
        title: filenameStem(key),
        size: o.Size ?? 0,
        lastModified: o.LastModified ? o.LastModified.toISOString() : null,
      };
    }),
  );

  return { items, nextCursor: continuationToken ?? null };
}

export async function getImageByKey(key: string): Promise<ImageItem | null> {
  if (!key) return null;
  try {
    return {
      id: encodeURIComponent(key),
      key,
      url: await signKey(key),
      title: filenameStem(key),
      size: 0,
      lastModified: null,
    };
  } catch {
    return null;
  }
}
