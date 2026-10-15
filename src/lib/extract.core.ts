import { type ExtractedImage, type ImageFormat, type ImageSource } from "./types";

/** A raw, unresolved reference found while walking markup. */
export interface RawCandidate {
  /** The attribute value as authored (may be relative, protocol-relative, srcset, ...). */
  value: string;
  source: ImageSource;
  /** Alt text or filename hint, when available. */
  alt?: string;
}

const EXTENSION_FORMATS: Record<string, ImageFormat> = {
  jpg: "jpg",
  jpeg: "jpg",
  jpe: "jpg",
  jfif: "jpg",
  png: "png",
  webp: "webp",
  svg: "svg",
  svgz: "svg",
  gif: "gif",
  ico: "ico",
  cur: "ico",
  avif: "avif",
  bmp: "bmp",
  tif: "tiff",
  tiff: "tiff",
  heic: "heic",
  heif: "heic",
  apng: "png",
};

const MIME_FORMATS: Record<string, ImageFormat> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/apng": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "image/tiff": "tiff",
  "image/heic": "heic",
  "image/heif": "heic",
};

/** Query parameters some image CDNs use instead of a real file extension. */
const FORMAT_QUERY_KEYS = [
  "format",
  "fm",
  "f",
  "output-format",
  "outputformat",
  "img-format",
  "type",
];

/**
 * Work out the image format from a data URI, file extension or CDN query hints —
 * in that order of confidence.
 */
export function guessFormat(rawUrl: string): ImageFormat {
  const value = rawUrl.trim();
  if (!value) return "other";

  if (value.startsWith("data:")) {
    const mime = value.slice(5).split(/[;,]/)[0]?.toLowerCase() ?? "";
    return MIME_FORMATS[mime] ?? "other";
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(value, "https://placeholder.invalid");
  } catch {
    parsed = null;
  }

  if (parsed) {
    const segments = parsed.pathname.split("/");
    const last = segments[segments.length - 1] ?? "";
    const dot = last.lastIndexOf(".");
    const ext = dot > -1 ? last.slice(dot + 1).toLowerCase() : "";
    if (ext && EXTENSION_FORMATS[ext]) return EXTENSION_FORMATS[ext];

    for (const key of FORMAT_QUERY_KEYS) {
      const hinted = parsed.searchParams.get(key);
      if (!hinted) continue;
      const normalized = hinted.replace(/^image\//, "").replace(/\+xml$/, "").toLowerCase();
      if (EXTENSION_FORMATS[normalized]) return EXTENSION_FORMATS[normalized];
      if (MIME_FORMATS[`image/${normalized}`]) return MIME_FORMATS[`image/${normalized}`];
    }

    // Last-resort heuristic for extensionless URLs (e.g. /image/upload/v123/pic).
    if (/\bsvg\b/i.test(value)) return "svg";
  }

  return "other";
}

/** Pull every URL out of a `srcset`-style list, discarding the descriptors. */
export function parseSrcset(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0]?.trim() ?? "")
    .filter((candidate) => candidate.length > 0);
}

/** Extract every `url(...)` reference from a CSS declaration block. */
export function parseCssUrls(css: string): string[] {
  const found: string[] = [];
  const regex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(css)) !== null) {
    const url = match[2]?.trim();
    if (url) found.push(url);
  }
  return found;
}

/** Skip things that are definitely not downloadable images. */
function isUsableReference(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (/^(javascript|mailto|tel|sms|blob|about|chrome|file):/i.test(trimmed)) return false;
  if (trimmed.startsWith("data:")) {
    const mime = trimmed.slice(5).split(/[;,]/)[0]?.toLowerCase() ?? "";
    return mime.startsWith("image/");
  }
  return true;
}

/** Turn a possibly-relative reference into an absolute URL. */
export function resolveUrl(value: string, baseUrl: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return trimmed;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Accept `example.com`, `http://example.com` or a full URL and normalise it. */
export function normalizeSiteUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Build a safe, unique download filename for an image. */
export function buildFilename(image: ExtractedImage, index: number, used: Set<string>): string {
  const extension = image.format === "other" ? "img" : image.format;

  let stem = image.name ? image.name : "";
  if (!stem) {
    try {
      const parsed = new URL(image.url);
      stem = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "");
      stem = stem.replace(/\.[a-z0-9]{1,6}$/i, "");
    } catch {
      stem = "";
    }
  }

  stem = stem
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60);

  if (!stem) stem = `image-${String(index + 1).padStart(3, "0")}`;

  let candidate = `${stem}.${extension}`;
  let counter = 1;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${stem}-${counter}.${extension}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Convert collected raw candidates into a clean, de-duplicated image list. */
export function finalizeCandidates(
  candidates: RawCandidate[],
  baseUrl: string,
  pageOrigin: string | null,
): ExtractedImage[] {
  const seen = new Set<string>();
  const images: ExtractedImage[] = [];

  for (const candidate of candidates) {
    const parts =
      candidate.source === "srcset" || candidate.source === "picture"
        ? parseSrcset(candidate.value)
        : [candidate.value];

    for (const part of parts) {
      if (!isUsableReference(part)) continue;
      const absolute = resolveUrl(part, baseUrl);
      if (!absolute) continue;
      if (seen.has(absolute)) continue;
      seen.add(absolute);

      let crossOrigin = false;
      if (!absolute.startsWith("data:") && pageOrigin) {
        try {
          crossOrigin = new URL(absolute).origin !== pageOrigin;
        } catch {
          crossOrigin = false;
        }
      }

      images.push({
        url: absolute,
        format: guessFormat(absolute),
        name: candidate.alt?.trim() ?? "",
        source: candidate.source,
        crossOrigin,
      });
    }
  }

  return images;
}

export const ALL_FORMATS: ImageFormat[] = [
  "jpg",
  "png",
  "webp",
  "svg",
  "gif",
  "ico",
  "avif",
  "bmp",
  "tiff",
  "heic",
  "other",
];

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  jpg: "JPG",
  png: "PNG",
  webp: "WebP",
  svg: "SVG",
  gif: "GIF",
  ico: "ICO",
  avif: "AVIF",
  bmp: "BMP",
  tiff: "TIFF",
  heic: "HEIC",
  other: "Other",
};

export const SOURCE_LABELS: Record<ImageSource, string> = {
  img: "img src",
  srcset: "srcset",
  picture: "picture",
  lazy: "lazy-load",
  "css-background": "CSS background",
  "inline-svg": "inline SVG",
  meta: "meta tag",
  link: "link rel",
  "video-poster": "video poster",
};

