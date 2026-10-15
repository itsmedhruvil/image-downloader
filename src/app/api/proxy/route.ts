import { NextResponse } from "next/server";

import { assertPublicHttpUrl, UnsafeUrlError } from "@/lib/net";
import type { ImageFormat } from "@/lib/types";
import { guessFormat } from "@/lib/extract.core";

export const runtime = "nodejs";
export const maxDuration = 30;

const PROXY_TIMEOUT_MS = 20_000;
const MAX_PROXY_BYTES = 25 * 1024 * 1024;

const CONTENT_TYPES: Record<ImageFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  ico: "image/x-icon",
  avif: "image/avif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  heic: "image/heic",
  other: "application/octet-stream",
};

/**
 * GET /api/proxy?url=... — streams an image through the server.
 *
 * Many sites reject hotlinked images unless a same-origin `Referer` is present,
 * and browsers refuse to let a page set one. Routing previews through here keeps
 * the gallery reliable without ever persisting anything.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  if (target.startsWith("data:")) {
    const commaIndex = target.indexOf(",");
    if (commaIndex === -1) {
      return NextResponse.json({ error: "Malformed data URI." }, { status: 400 });
    }
    const meta = target.slice(5, commaIndex);
    const payload = target.slice(commaIndex + 1);
    const mime = meta.split(";")[0] || "image/svg+xml";
    const isBase64 = /;base64/i.test(meta);
    const bytes = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertPublicHttpUrl(target);
  } catch (error) {
    const message = error instanceof UnsafeUrlError ? error.message : "Invalid URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const upstreamHeaders: Record<string, string> = {
    "User-Agent":
      process.env.FETCH_USER_AGENT?.trim() ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8",
    Referer: `${safeUrl.origin}/`,
  };

  // `?meta=1` reports the upstream size without transferring the whole file, so
  // the gallery can show file sizes cheaply.
  if (searchParams.get("meta") === "1") {
    try {
      const head = await fetch(safeUrl.toString(), {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
        headers: upstreamHeaders,
      });
      let size = Number(head.headers.get("content-length") ?? "0");
      const contentType = (head.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";

      if (!size) {
        const ranged = await fetch(safeUrl.toString(), {
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
          headers: { ...upstreamHeaders, Range: "bytes=0-0" },
        });
        const contentRange = ranged.headers.get("content-range");
        if (contentRange) {
          const total = Number(contentRange.split("/")[1] ?? "0");
          if (Number.isFinite(total)) size = total;
        }
      }

      return NextResponse.json(
        { size: size > 0 ? size : null, contentType: contentType || null },
        { headers: { "Cache-Control": "public, max-age=3600" } },
      );
    } catch {
      return NextResponse.json({ size: null, contentType: null });
    }
  }

  try {
    const response = await fetch(safeUrl.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      headers: upstreamHeaders,
    });

    if (!response.ok) {
      // Let the client fall back to loading the image directly.
      return NextResponse.json(
        { error: `Upstream responded with ${response.status}.` },
        { status: 502 },
      );
    }

    const declaredLength = Number(response.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_PROXY_BYTES) {
      return NextResponse.json({ error: "Image is too large to preview." }, { status: 413 });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_PROXY_BYTES) {
      return NextResponse.json({ error: "Image could not be loaded." }, { status: 502 });
    }

    const upstreamType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
    const contentType = upstreamType.startsWith("image/")
      ? upstreamType
      : CONTENT_TYPES[guessFormat(safeUrl.toString())];

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image could not be loaded." }, { status: 504 });
  }
}
