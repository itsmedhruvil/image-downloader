import { buildCreditsFile, CREDITS_FILENAME } from "@/lib/credits";
import { buildFilename, guessFormat } from "@/lib/extract.core";
import type { ExtractedImage, ImageFormat } from "@/lib/types";

/** Proxy previews so hotlink-protected images still render. */
export function proxiedUrl(url: string): string {
  if (url.startsWith("data:")) return url;
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
}

export function triggerDownload(url: string, filename?: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  if (filename) anchor.download = filename;
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Fetch an image as a blob, preferring the server proxy and falling back to direct. */
export async function fetchImageBlob(url: string): Promise<Blob> {
  const attempts = url.startsWith("data:") ? [url] : [proxiedUrl(url), url];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt, { credentials: "omit" });
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        lastError = new Error("Empty response");
        continue;
      }
      return blob;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Image could not be downloaded");
}

const CANVAS_MIME: Partial<Record<ImageFormat, string>> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
};

/** Re-encode a raster image in the browser using the Canvas API. */
export async function convertImageBlob(
  blob: Blob,
  target: ImageFormat,
  quality = 0.92,
): Promise<Blob> {
  const mime = CANVAS_MIME[target];
  if (!mime) return blob;

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close?.();
    return blob;
  }

  // JPEG has no alpha channel; flatten onto white so transparency does not go black.
  if (target === "jpg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const converted = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mime, target === "png" ? undefined : quality);
  });

  return converted && converted.size > 0 ? converted : blob;
}

export function filenameFor(image: ExtractedImage, index: number, format?: ImageFormat): string {
  const used = new Set<string>();
  const effective = format && format !== "other" ? format : guessFormat(image.url);
  const filename = buildFilename({ ...image, format: effective }, index, used);
  return filename;
}

/** Download a single image, optionally converting it first. */
export async function downloadSingleImage(
  image: ExtractedImage,
  index: number,
  targetFormat: ImageFormat | "original",
): Promise<void> {
  const filename = filenameFor(image, index, targetFormat === "original" ? undefined : targetFormat);

  if (targetFormat === "original" || image.format === "svg") {
    try {
      const blob = await fetchImageBlob(image.url);
      downloadBlob(blob, filename);
      return;
    } catch {
      // Fall back to letting the browser fetch the asset directly.
      triggerDownload(proxiedUrl(image.url), filename);
      return;
    }
  }

  const blob = await fetchImageBlob(image.url);
  const converted = await convertImageBlob(blob, targetFormat);
  downloadBlob(converted, filename);
}

/**
 * Build a ZIP entirely in the browser. Used when the selection is being
 * re-encoded, since conversion happens client-side and nothing needs to be
 * uploaded anywhere.
 */
export async function buildClientZip(
  images: ExtractedImage[],
  targetFormat: ImageFormat | "original",
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; filename: string; included: number; skipped: number }> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  const credits: string[] = [];
  let included = 0;
  let skipped = 0;
  let done = 0;

  const results = await mapLimit(images, 4, async (image, index) => {
    try {
      const blob = await fetchImageBlob(image.url);
      const format = targetFormat === "original" ? guessFormat(image.url) : targetFormat;
      const output =
        targetFormat !== "original" && image.format !== "svg"
          ? await convertImageBlob(blob, targetFormat)
          : blob;
      const filename = buildFilename({ ...image, format }, index, used);
      zip.file(filename, output);
      if (image.credit?.trim()) credits.push(`${filename} — ${image.credit.trim()}`);
      included += 1;
    } catch {
      skipped += 1;
    } finally {
      done += 1;
      onProgress?.(done, images.length);
    }
  });

  void results;

  if (credits.length > 0) {
    zip.file(CREDITS_FILENAME, buildCreditsFile(credits));
  }

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return { blob, filename: `website-images-${stamp}.zip`, included, skipped };
}

async function mapLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index] as T, index);
    }
  });
  await Promise.all(runners);
}
