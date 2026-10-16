import { getProviderStatus, searchProvider } from "./providers";
import {
  DEFAULT_GROUP_COUNT,
  MAX_GROUP_COUNT,
  MAX_GROUPS,
  MAX_TOTAL_IMAGES,
  type StockGroup,
  type StockGroupResult,
  type StockSearchRequest,
  type StockSearchResponse,
  type StockProvider,
} from "./types";

/**
 * Provider requests are the scarce resource here (Unsplash's demo tier allows
 * ~50 requests/hour), so the fan-out is bounded and executed sequentially.
 */
const MAX_REQUESTS = 24;

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/** Trim, de-duplicate and bound the incoming keyword groups. */
export function normalizeGroups(groups: StockGroup[]): StockGroup[] {
  const seen = new Set<string>();
  const normalized: StockGroup[] = [];

  for (const group of Array.isArray(groups) ? groups : []) {
    const keyword = (group?.keyword ?? "").trim().slice(0, 80);
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      name: (group?.name ?? "").trim().slice(0, 80) || keyword,
      keyword,
      count: clamp(Math.round(Number(group?.count) || DEFAULT_GROUP_COUNT), 1, MAX_GROUP_COUNT),
    });
    if (normalized.length >= MAX_GROUPS) break;
  }

  return normalized;
}

export async function searchStockGroups(
  request: StockSearchRequest,
): Promise<StockSearchResponse> {
  const startedAt = Date.now();
  const status = getProviderStatus();
  const warnings: string[] = [];

  const configured = new Set(
    (Object.entries(status) as [StockProvider, boolean][])
      .filter(([, enabled]) => enabled)
      .map(([provider]) => provider),
  );

  const requested = (Array.isArray(request.providers) ? request.providers : []).filter(
    (provider): provider is StockProvider => provider in status,
  );
  const providers = requested.filter((provider) => configured.has(provider));

  const skippedUnconfigured = requested.filter((provider) => !configured.has(provider));
  if (skippedUnconfigured.length > 0) {
    warnings.push(
      `Skipped ${skippedUnconfigured.join(", ")} — no API key configured on this server.`,
    );
  }

  const groups = normalizeGroups(request.groups);
  const orientation = request.orientation ?? null;

  if (providers.length === 0) {
    return {
      results: groups.map((group) => ({
        name: group.name,
        keyword: group.keyword,
        images: [],
        error: "No image source is configured.",
      })),
      usedProviders: [],
      warnings,
      durationMs: Date.now() - startedAt,
    };
  }

  const results: StockGroupResult[] = [];
  const seenIds = new Set<string>();
  let requests = 0;
  let totalImages = 0;
  let truncated = false;

  for (const group of groups) {
    const images: StockGroupResult["images"] = [];
    const errors: string[] = [];

    for (const provider of providers) {
      if (requests >= MAX_REQUESTS) {
        truncated = true;
        break;
      }
      if (totalImages >= MAX_TOTAL_IMAGES) {
        truncated = true;
        break;
      }

      requests += 1;
      const remaining = MAX_TOTAL_IMAGES - totalImages;
      const { images: found, error } = await searchProvider(
        provider,
        group.keyword,
        Math.min(group.count, remaining),
        orientation,
      );

      if (error) errors.push(error);

      for (const image of found) {
        if (seenIds.has(image.id)) continue;
        seenIds.add(image.id);
        images.push(image);
        totalImages += 1;
      }
    }

    results.push({
      name: group.name,
      keyword: group.keyword,
      images,
      ...(errors.length > 0 && images.length === 0 ? { error: errors.join("; ") } : {}),
    });

    if (truncated) break;
  }

  if (truncated) {
    warnings.push(
      `Stopped early to stay within provider rate limits (${requests} requests, ${totalImages} images). Narrow the search or try again later.`,
    );
  }

  return {
    results,
    usedProviders: providers,
    warnings,
    durationMs: Date.now() - startedAt,
  };
}
