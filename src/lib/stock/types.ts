/**
 * Multi-source stock image search (the "ImageForge" capability) folded into the
 * extractor. Provider identifiers, filter shapes and the credit strings required
 * by each provider's API terms live here.
 */

export type StockProvider = "unsplash" | "pexels" | "pixabay";

export const STOCK_PROVIDERS: StockProvider[] = ["unsplash", "pexels", "pixabay"];

export type Orientation = "landscape" | "portrait" | "square";

export const ORIENTATIONS: { value: Orientation | "all"; label: string }[] = [
  { value: "all", label: "Any orientation" },
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "square", label: "Square" },
];

/** Which providers have credentials configured on the server. */
export type ProviderStatus = Record<StockProvider, boolean>;

/** A keyword request group: one search term and how many images to pull. */
export interface StockGroup {
  name: string;
  keyword: string;
  count: number;
}

export interface StockSearchRequest {
  providers: StockProvider[];
  orientation: Orientation | null;
  groups: StockGroup[];
}

/** One normalised search hit, ready to drop into the gallery. */
export interface StockImage {
  /** Stable provider-qualified id, used for de-duplication. */
  id: string;
  provider: StockProvider;
  /** Full-size download URL. */
  url: string;
  /** Small preview URL (kept separate so the gallery can load fast). */
  previewUrl: string;
  filename: string;
  width: number | null;
  height: number | null;
  /** Attribution string written into credits.txt. */
  credit: string;
  /** Page the image belongs to, for the credit link. */
  attributionUrl: string | null;
}

export interface StockGroupResult {
  name: string;
  keyword: string;
  images: StockImage[];
  /** Set when the provider call for this group failed. */
  error?: string;
}

export interface StockSearchResponse {
  results: StockGroupResult[];
  /** Providers that actually ran. */
  usedProviders: StockProvider[];
  warnings: string[];
  durationMs: number;
}

export interface UrlSectionSuggestion {
  name: string;
  suggestedKeyword: string;
  allSuggestions: string[];
}

export interface AnalyzeUrlResponse {
  url: string;
  title: string | null;
  sections: UrlSectionSuggestion[];
  durationMs: number;
}

/** Default number of images requested per keyword. */
export const DEFAULT_GROUP_COUNT = 12;
export const MAX_GROUP_COUNT = 50;
export const MAX_GROUPS = 12;
export const MAX_TOTAL_IMAGES = 200;
