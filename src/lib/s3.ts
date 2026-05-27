import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
  type _Object,
  type CommonPrefix,
} from "@aws-sdk/client-s3";

export const S3_BUCKET = process.env.S3_BUCKET_NAME || "com27";
export const S3_REGION = process.env.S3_REGION || "eu-west-2";

let _client: S3Client | null = null;

export function s3Client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return _client;
}

export async function bucketReachable(): Promise<{ ok: boolean; error?: string }> {
  try {
    await s3Client().send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "HeadBucket failed" };
  }
}

export type S3Entry =
  | { kind: "folder"; prefix: string; name: string }
  | { kind: "file"; key: string; name: string; size: number; lastModified?: Date };

export type ListV2Result = {
  entries: S3Entry[];
  isTruncated: boolean;
  nextContinuationToken?: string;
};

export async function listObjectsV2(prefix: string, continuationToken?: string): Promise<ListV2Result> {
  const cleaned = prefix.replace(/^\/+/, "");
  const res = await s3Client().send(
    new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: cleaned || undefined,
      Delimiter: "/",
      MaxKeys: 200,
      ContinuationToken: continuationToken,
    }),
  );
  const folders: S3Entry[] = (res.CommonPrefixes ?? [])
    .filter((p): p is CommonPrefix & { Prefix: string } => Boolean(p.Prefix))
    .map((p) => ({
      kind: "folder" as const,
      prefix: p.Prefix,
      name: p.Prefix.replace(cleaned, "").replace(/\/$/, ""),
    }));
  const files: S3Entry[] = (res.Contents ?? [])
    .filter((o): o is _Object & { Key: string } => Boolean(o.Key) && o.Key !== cleaned)
    .map((o) => ({
      kind: "file" as const,
      key: o.Key,
      name: o.Key.replace(cleaned, ""),
      size: o.Size ?? 0,
      lastModified: o.LastModified,
    }));
  return {
    entries: [...folders, ...files],
    isTruncated: res.IsTruncated ?? false,
    nextContinuationToken: res.NextContinuationToken,
  };
}
