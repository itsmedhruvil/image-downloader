import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { isArchiveStorageConfigured } from "./storage-mode";

/**
 * Cloudflare R2 (S3-compatible) archive storage.
 *
 * R2's free tier covers 10 GB of storage and the Class A/B operations this app
 * needs, which makes it a good home for generated ZIP archives. When the four
 * required environment variables are absent the whole feature degrades
 * gracefully: the API streams the archive straight back to the browser instead.
 */

let cachedClient: S3Client | null = null;

export function isR2Configured(): boolean {
  return isArchiveStorageConfigured();
}

export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not configured");
  return bucket;
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID is not configured");

  // R2_ENDPOINT allows any S3-compatible service (MinIO, local mocks, other
  // providers) and defaults to the Cloudflare R2 endpoint.
  const endpoint =
    process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;

  cachedClient = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });

  return cachedClient;
}

/** How long an archive stays downloadable, in seconds. */
export function getArchiveTtlSeconds(): number {
  const parsed = Number(process.env.R2_ZIP_TTL_SECONDS ?? "");
  if (!Number.isFinite(parsed) || parsed <= 0) return 3600;
  return Math.min(parsed, 60 * 60 * 24);
}

export async function putArchive(key: string, body: Buffer, filename: string): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: body,
      ContentType: "application/zip",
      ContentLength: body.byteLength,
      ContentDisposition: `attachment; filename="${filename}"`,
      Metadata: { filename },
    }),
  );
}

export interface ArchiveObject {
  body: ReadableStream<Uint8Array>;
  contentLength?: number;
  filename: string;
}

export async function getArchive(key: string): Promise<ArchiveObject | null> {
  try {
    const response = await getR2Client().send(
      new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    );

    if (!response.Body) return null;

    const body = response.Body;
    const webStream =
      typeof (body as { transformToWebStream?: () => ReadableStream<Uint8Array> })
        .transformToWebStream === "function"
        ? (body as { transformToWebStream: () => ReadableStream<Uint8Array> }).transformToWebStream()
        : (body as unknown as ReadableStream<Uint8Array>);

    return {
      body: webStream,
      contentLength: response.ContentLength,
      filename: response.Metadata?.filename ?? "website-images.zip",
    };
  } catch {
    return null;
  }
}

export async function deleteArchive(key: string): Promise<void> {
  try {
    await getR2Client().send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }));
  } catch {
    /* best effort — archives also expire via R2 lifecycle rules */
  }
}

/** Build the object key for a freshly generated archive. */
export function buildArchiveKey(filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const random = Math.random().toString(36).slice(2, 10);
  return `zips/${Date.now()}-${random}-${safe}`;
}
