import {
  type Orientation,
  type ProviderStatus,
  type StockImage,
  type StockProvider,
} from "./types";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const REQUEST_TIMEOUT_MS = 15_000;

/** How each provider expresses orientation (Pixabay has no square option). */
const ORIENTATION_PARAMS: Record<StockProvider, Partial<Record<Orientation, string>>> = {
  unsplash: { landscape: "landscape", portrait: "portrait", square: "squarish" },
  pexels: { landscape: "landscape", portrait: "portrait", square: "square" },
  pixabay: { landscape: "horizontal", portrait: "vertical" },
};

/** Which providers have API keys configured. Mirrors ImageForge's env names. */
export function getProviderStatus(): ProviderStatus {
  return {
    unsplash: Boolean(process.env.UNSPLASH_ACCESS_KEY?.trim()),
    pexels: Boolean(process.env.PEXELS_API_KEY?.trim()),
    pixabay: Boolean(process.env.PIXABAY_API_KEY?.trim()),
  };
}

export function isStockConfigured(): boolean {
  return Object.values(getProviderStatus()).some(Boolean);
}

// ---------------------------------------------------------------------------
// Defensive JSON helpers — provider payloads are third-party and unchecked.
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fileExtension(url: string): string {
  try {
    const path = new URL(url).pathname;
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  } catch {
    /* fall through */
  }
  return "jpg";
}

/** Predictable, filesystem-safe download name. */
export function stockFilename(provider: StockProvider, id: string, url: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40);
  return `${provider}-${safeId}.${fileExtension(url)}`;
}

// ---------------------------------------------------------------------------
// Normalisers (pure — these are what the tests exercise)
// ---------------------------------------------------------------------------

export function mapUnsplash(payload: unknown): StockImage[] {
  return asArray(asRecord(payload).results).flatMap((entry) => {
    const item = asRecord(entry);
    const id = str(item.id);
    const urls = asRecord(item.urls);
    const full = str(urls.full) ?? str(urls.regular) ?? str(urls.raw);
    if (!id || !full) return [];

    const user = asRecord(item.user);
    const author = str(user.name) ?? str(user.username) ?? "Unknown photographer";
    const profile = str(asRecord(user.links).html);
    const page = str(asRecord(item.links).html);

    return [
      {
        id: `unsplash-${id}`,
        provider: "unsplash" as const,
        url: full,
        previewUrl: str(urls.small) ?? str(urls.thumb) ?? full,
        filename: stockFilename("unsplash", id, full),
        width: num(item.width),
        height: num(item.height),
        credit: `Photo by ${author} on Unsplash${page ? ` — ${page}` : profile ? ` — ${profile}` : ""}`,
        attributionUrl: page ?? profile,
      },
    ];
  });
}

export function mapPexels(payload: unknown): StockImage[] {
  return asArray(asRecord(payload).photos).flatMap((entry) => {
    const item = asRecord(entry);
    const id = num(item.id);
    const src = asRecord(item.src);
    const full = str(src.original) ?? str(src.large2x) ?? str(src.large);
    if (id === null || !full) return [];

    const author = str(item.photographer) ?? "Unknown photographer";
    const profile = str(item.photographer_url);
    const page = str(item.url);

    return [
      {
        id: `pexels-${id}`,
        provider: "pexels" as const,
        url: full,
        previewUrl: str(src.medium) ?? str(src.small) ?? full,
        filename: stockFilename("pexels", String(id), full),
        width: num(item.width),
        height: num(item.height),
        credit: `Photo by ${author} on Pexels${page ? ` — ${page}` : profile ? ` — ${profile}` : ""}`,
        attributionUrl: page ?? profile,
      },
    ];
  });
}

export function mapPixabay(payload: unknown): StockImage[] {
  return asArray(asRecord(payload).hits).flatMap((entry) => {
    const item = asRecord(entry);
    const id = num(item.id);
    const full = str(item.largeImageURL) ?? str(item.webformatURL);
    if (id === null || !full) return [];

    const author = str(item.user) ?? "Unknown contributor";
    const page = str(item.pageURL);

    return [
      {
        id: `pixabay-${id}`,
        provider: "pixabay" as const,
        url: full,
        previewUrl: str(item.webformatURL) ?? full,
        filename: stockFilename("pixabay", String(id), full),
        width: num(item.imageWidth),
        height: num(item.imageHeight),
        credit: `Image by ${author} on Pixabay${page ? ` — ${page}` : ""}`,
        attributionUrl: page,
      },
    ];
  });
}


// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/** Build the provider search URL (exported so tests can assert the mapping). */
export function buildProviderUrl(
  provider: StockProvider,
  keyword: string,
  count: number,
  orientation: Orientation | null,
): string {
  const orientationValue = orientation ? ORIENTATION_PARAMS[provider][orientation] : undefined;

  switch (provider) {
    case "unsplash": {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", keyword);
      url.searchParams.set("per_page", String(count));
      url.searchParams.set("content_filter", "high");
      if (orientationValue) url.searchParams.set("orientation", orientationValue);
      return url.toString();
    }
    case "pexels": {
      const url = new URL("https://api.pexels.com/v1/search");
      url.searchParams.set("query", keyword);
      url.searchParams.set("per_page", String(count));
      if (orientationValue) url.searchParams.set("orientation", orientationValue);
      return url.toString();
    }
    case "pixabay": {
      const url = new URL("https://pixabay.com/api/");
      url.searchParams.set("key", process.env.PIXABAY_API_KEY ?? "");
      url.searchParams.set("q", keyword);
      url.searchParams.set("per_page", String(Math.max(3, count)));
      url.searchParams.set("image_type", "photo");
      url.searchParams.set("safesearch", "true");
      if (orientationValue) url.searchParams.set("orientation", orientationValue);
      return url.toString();
    }
  }
}

function authHeaders(provider: StockProvider): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": process.env.FETCH_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
    Accept: "application/json",
  };
  if (provider === "unsplash") {
    headers.Authorization = `Client-ID ${process.env.UNSPLASH_ACCESS_KEY ?? ""}`;
  }
  if (provider === "pexels") {
    headers.Authorization = process.env.PEXELS_API_KEY ?? "";
  }
  return headers;
}

function mapFor(provider: StockProvider, payload: unknown): StockImage[] {
  if (provider === "unsplash") return mapUnsplash(payload);
  if (provider === "pexels") return mapPexels(payload);
  return mapPixabay(payload);
}

/**
 * Pixabay cannot filter for square images, so the aspect ratio is applied
 * afterwards to keep the orientation filter honest across providers.
 */
export function filterByOrientation(
  images: StockImage[],
  orientation: Orientation | null,
): StockImage[] {
  if (orientation !== "square") return images;
  return images.filter((image) => {
    if (!image.width || !image.height) return true;
    return Math.abs(image.width / image.height - 1) <= 0.15;
  });
}

/** Query one provider for one keyword. Never throws — errors come back inline. */
export async function searchProvider(
  provider: StockProvider,
  keyword: string,
  count: number,
  orientation: Orientation | null,
): Promise<{ images: StockImage[]; error?: string }> {
  if (!getProviderStatus()[provider]) {
    return { images: [], error: `${provider} is not configured on this server.` };
  }

  const url = buildProviderUrl(provider, keyword, count, orientation);

  try {
    const response = await fetch(url, {
      headers: authHeaders(provider),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const hint =
        response.status === 401 || response.status === 403
          ? "check the API key"
          : response.status === 429
            ? "rate limit reached — try again shortly"
            : `HTTP ${response.status}`;
      return {
        images: [],
        error: `${provider}: ${hint}${detail ? ` (${detail.slice(0, 120)})` : ""}`,
      };
    }

    const payload: unknown = await response.json();
    return { images: filterByOrientation(mapFor(provider, payload), orientation) };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "the provider took too long to respond"
        : error instanceof Error
          ? error.message
          : "unknown error";
    return { images: [], error: `${provider}: ${message}` };
  }
}
