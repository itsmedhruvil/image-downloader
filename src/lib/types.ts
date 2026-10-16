import type { StockProvider } from "./stock/types";

/** Every image format the extractor can recognise. */
export type ImageFormat =
  | "jpg"
  | "png"
  | "webp"
  | "svg"
  | "gif"
  | "ico"
  | "avif"
  | "bmp"
  | "tiff"
  | "heic"
  | "other";

export type ImageSource =
  | "img"
  | "srcset"
  | "picture"
  | "lazy"
  | "css-background"
  | "inline-svg"
  | "meta"
  | "link"
  | "video-poster"
  | "stock";

/** A single extracted image reference. */
export interface ExtractedImage {
  /** Absolute, de-duplicated URL (or a data URI for inline SVG). */
  url: string;
  /** Detected format, derived from extension, query hints or data-URI mime type. */
  format: ImageFormat;
  /** Alt text / filename hint used for the download name. */
  name: string;
  /** Where the reference was found in the markup. */
  source: ImageSource;
  /** True when the image lives on a different origin than the page. */
  crossOrigin: boolean;
  /** Present for multi-source stock search results. */
  provider?: StockProvider;
  /** Smaller variant of the same image, used for gallery tiles. */
  previewUrl?: string;
  /** Attribution line required by the provider's API terms. */
  credit?: string;
  /** Page the image belongs to, for attribution links. */
  attributionUrl?: string;
  /** Dimensions reported by the provider API (avoids measuring them). */
  width?: number;
  height?: number;
}

export type ExtractMethod = "url" | "html" | "bulk" | "stock";

export interface ExtractRequest {
  method: ExtractMethod;
  /** Present for `url` and `bulk`, absent (or empty) for `html`. */
  url?: string;
  /** Present for `html`. */
  html?: string;
  /** Optional per-request override of the image format filter. */
  formats?: ImageFormat[];
}

export interface ExtractResponse {
  images: ExtractedImage[];
  /** Final URL after redirects — useful when a shortlink was pasted. */
  resolvedUrl: string | null;
  title: string | null;
  /** Number of separate pages scanned (bulk mode). */
  pagesScanned: number;
  /** Non-fatal problems, e.g. a URL in a bulk batch that timed out. */
  warnings: string[];
  durationMs: number;
}

export interface ZipRequest {
  images: { url: string; name: string }[];
  /** Optional target format for raster conversion (already applied client-side). */
  format?: string;
}

export interface ZipResponse {
  /** Where the archive can be downloaded from (R2 presigned URL or local API). */
  downloadUrl: string;
  /** Suggested filename. */
  filename: string;
  /** Archive size in bytes, when known. */
  size: number;
  /** Whether the archive was persisted to Cloudflare R2. */
  stored: boolean;
  /** ISO timestamp after which a stored archive expires. */
  expiresAt: string | null;
  /** Images that could not be fetched and were skipped. */
  skipped: string[];
  /** How many included images carried an attribution line (credits.txt written). */
  credited?: number;
}

export interface FeatureRequestPayload {
  title: string;
  email: string;
  details: string;
}
