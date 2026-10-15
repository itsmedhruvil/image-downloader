import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Browser-like UA so ordinary sites serve their real markup. */
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export const PAGE_FETCH_TIMEOUT_MS = 20_000;
export const MAX_PAGE_BYTES = 8 * 1024 * 1024;

/** Raised when a URL is not fetchable by the extractor. */
export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fe80") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.replace("::ffff:", ""));
  }
  return false;
}

/**
 * Reject anything that is not a plain public http(s) endpoint. This blocks the
 * classic SSRF tricks (localhost, link-local metadata IPs, RFC1918 ranges) for
 * both literal IPs and hostnames that resolve to them.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("That does not look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs can be fetched.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal"
  ) {
    throw new UnsafeUrlError("Local and internal addresses cannot be fetched.");
  }

  if (isIP(hostname)) {
    if (isIP(hostname) === 4 ? isPrivateIpv4(hostname) : isPrivateIpv6(hostname)) {
      throw new UnsafeUrlError("Private network addresses cannot be fetched.");
    }
    return url;
  }

  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) {
      throw new UnsafeUrlError("That host could not be resolved.");
    }
    for (const record of records) {
      const address = record.address;
      const version = record.family === 6 ? 6 : 4;
      if (version === 6 ? isPrivateIpv6(address) : isPrivateIpv4(address)) {
        throw new UnsafeUrlError("That host resolves to a private network address.");
      }
    }
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw error;
    throw new UnsafeUrlError("That host could not be resolved.");
  }

  return url;
}

export interface FetchedPage {
  html: string;
  finalUrl: string;
  contentType: string;
  truncated: boolean;
}

/** Fetch a page's HTML with browser headers, a timeout and a size ceiling. */
export async function fetchPageHtml(url: string): Promise<FetchedPage> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": process.env.FETCH_USER_AGENT?.trim() || DEFAULT_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`The site responded with HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  const raw = await response.text();
  const truncated = raw.length > MAX_PAGE_BYTES || declaredLength > MAX_PAGE_BYTES;
  const html = truncated ? raw.slice(0, MAX_PAGE_BYTES) : raw;

  return {
    html,
    finalUrl: response.url || url,
    contentType,
    truncated,
  };
}
