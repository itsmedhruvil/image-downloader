import JSZip from "jszip";

import { buildFilename, guessFormat } from "./extract.core";
import type { ExtractedImage } from "./types";

/** Hard limits so a single ZIP request can never blow up a serverless function. */
export const ZIP_LIMITS = {
  maxImages: 400,
  maxImageBytes: 30 * 1024 * 1024,
  maxTotalBytes: 150 * 1024 * 1024,
  fetchTimeoutMs: 20_000,
  concurrency: 6,
};

export interface ZipInput {
  url: string;
  name: string;
}

export interface ZipBuildResult {
  buffer: Buffer;
  filename: string;
  included: number;
  skipped: string[];
  bytes: number;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function dataUriToBuffer(url: string): Buffer | null {
  const commaIndex = url.indexOf(",");
  if (commaIndex === -1) return null;
  const meta = url.slice(5, commaIndex);
  const payload = url.slice(commaIndex + 1);
  try {
    if (/;base64/i.test(meta)) return Buffer.from(payload, "base64");
    return Buffer.from(decodeURIComponent(payload), "utf8");
  } catch {
    return null;
  }
}

/** Fetch a single remote image with browser-like headers and a hard timeout. */
async function fetchImage(url: string): Promise<Buffer | null> {
  if (url.startsWith("data:")) return dataUriToBuffer(url);

  let referer: string | undefined;
  try {
    referer = new URL(url).origin + "/";
  } catch {
    referer = undefined;
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(ZIP_LIMITS.fetchTimeoutMs),
      headers: {
        "User-Agent": process.env.FETCH_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
        Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: referer ?? "",
      },
    });

    if (!response.ok) return null;

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > ZIP_LIMITS.maxImageBytes) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0 || arrayBuffer.byteLength > ZIP_LIMITS.maxImageBytes) {
      return null;
    }
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/** Run an async mapper over items with a bounded concurrency pool. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index] as T, index);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Download every requested image and package the successful ones into a ZIP
 * archive. Failures are reported instead of aborting the whole archive.
 */
export async function buildImageZip(inputs: ZipInput[]): Promise<ZipBuildResult> {
  const selected = inputs.slice(0, ZIP_LIMITS.maxImages);
  const used = new Set<string>();
  const zip = new JSZip();
  const skipped: string[] = [];
  let totalBytes = 0;

  const fetched = await mapWithConcurrency(selected, ZIP_LIMITS.concurrency, async (input) => {
    const buffer = await fetchImage(input.url);
    return { input, buffer };
  });

  let included = 0;
  for (const { input, buffer } of fetched) {
    if (!buffer) {
      skipped.push(input.url);
      continue;
    }
    if (totalBytes + buffer.byteLength > ZIP_LIMITS.maxTotalBytes) {
      skipped.push(input.url);
      continue;
    }

    const image: ExtractedImage = {
      url: input.url,
      name: input.name,
      format: guessFormat(input.url),
      source: "img",
      crossOrigin: false,
    };
    const filename = buildFilename(image, included, used);

    zip.file(filename, buffer);
    totalBytes += buffer.byteLength;
    included += 1;
  }

  if (included === 0) {
    throw new ZipEmptyError(skipped);
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    buffer,
    filename: `website-images-${stamp()}.zip`,
    included,
    skipped,
    bytes: buffer.byteLength,
  };
}

/** Raised when every image in the selection failed to download. */
export class ZipEmptyError extends Error {
  constructor(public skipped: string[]) {
    super("No images could be downloaded");
    this.name = "ZipEmptyError";
  }
}

function stamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(
    now.getUTCHours(),
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}
