/**
 * Lightweight, local-only activity counters powering the homepage stats row.
 *
 * Everything lives in localStorage on the visitor's own device — nothing is sent
 * anywhere, which keeps the privacy promise intact.
 */

export interface ActivityStats {
  /** Distinct page URLs scanned (URL + bulk tabs). */
  urls: number;
  /** Total images discovered across every extraction. */
  images: number;
  /** ZIP archives generated. */
  archives: number;
}

const STORAGE_KEY = "wie-stats";

/** Exposed so other tabs can detect changes to the same key. */
export const STATS_STORAGE_KEY = STORAGE_KEY;

const EMPTY: ActivityStats = { urls: 0, images: 0, archives: 0 };

let snapshot: ActivityStats = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): ActivityStats {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ActivityStats>;
    return {
      urls: Number(parsed.urls) || 0,
      images: Number(parsed.images) || 0,
      archives: Number(parsed.archives) || 0,
    };
  } catch {
    return EMPTY;
  }
}

function writeStorage(next: ActivityStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable (private mode) — counters are best-effort */
  }
}

function emit(next: ActivityStats) {
  snapshot = next;
  for (const listener of listeners) listener();
}

/** Current counters. Returns a stable reference until something changes. */
export function getStats(): ActivityStats {
  if (!loaded) {
    snapshot = readStorage();
    loaded = true;
  }
  return snapshot;
}

/** Server snapshot for useSyncExternalStore (always empty). */
export function getServerStats(): ActivityStats {
  return EMPTY;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordExtraction({ urls = 0, images = 0 }: { urls?: number; images?: number }) {
  const current = getStats();
  const next: ActivityStats = {
    urls: current.urls + urls,
    images: current.images + images,
    archives: current.archives,
  };
  writeStorage(next);
  emit(next);
}

export function recordArchive() {
  const current = getStats();
  const next: ActivityStats = { ...current, archives: current.archives + 1 };
  writeStorage(next);
  emit(next);
}

/** Re-read the counters from storage (used when another tab updates them). */
export function reloadStats() {
  const next = readStorage();
  const unchanged =
    next.urls === snapshot.urls &&
    next.images === snapshot.images &&
    next.archives === snapshot.archives;
  if (unchanged) return;
  emit(next);
}

export function resetStats() {
  writeStorage(EMPTY);
  emit(EMPTY);
}
