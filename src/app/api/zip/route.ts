import { NextResponse } from "next/server";

import { buildArchiveKey, getArchiveTtlSeconds, isR2Configured, putArchive } from "@/lib/r2";
import type { ZipResponse } from "@/lib/types";
import { buildImageZip, ZipEmptyError, ZIP_LIMITS } from "@/lib/zip";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface ZipBodyRequest {
  images?: { url?: string; name?: string; credit?: string }[];
}

/**
 * POST /api/zip — download the selected images and package them into a ZIP.
 *
 * When Cloudflare R2 credentials are configured the archive is persisted there
 * and a stable download URL is returned. Otherwise the archive is streamed back
 * in the same response, so bulk download keeps working with zero configuration.
 */
export async function POST(request: Request) {
  let body: ZipBodyRequest;
  try {
    body = (await request.json()) as ZipBodyRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawImages = Array.isArray(body.images) ? body.images : [];
  const images = rawImages
    .filter((image): image is { url: string; name?: string; credit?: string } => typeof image?.url === "string")
    .map((image) => ({
      url: image.url,
      name: typeof image.name === "string" ? image.name : "",
      credit: typeof image.credit === "string" ? image.credit : undefined,
    }))
    .slice(0, ZIP_LIMITS.maxImages);

  if (images.length === 0) {
    return NextResponse.json({ error: "Select at least one image to download." }, { status: 400 });
  }

  try {
    const archive = await buildImageZip(images);

    if (isR2Configured()) {
      try {
        const key = buildArchiveKey(archive.filename);
        await putArchive(key, archive.buffer, archive.filename);
        const ttl = getArchiveTtlSeconds();

        const payload: ZipResponse = {
          downloadUrl: `/api/download/${key.split("/").map(encodeURIComponent).join("/")}`,
          filename: archive.filename,
          size: archive.bytes,
          stored: true,
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
          skipped: archive.skipped,
          credited: archive.credited,
        };
        return NextResponse.json(payload);
      } catch (error) {
        // Storage hiccup: log it and fall through to streaming the archive.
        console.error("[api/zip] R2 upload failed, streaming instead:", error);
      }
    }

    return new NextResponse(new Uint8Array(archive.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(archive.bytes),
        "Content-Disposition": `attachment; filename="${archive.filename}"`,
        "X-Archive-Images": String(archive.included),
        "X-Archive-Skipped": String(archive.skipped.length),
        "X-Archive-Credited": String(archive.credited),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ZipEmptyError) {
      return NextResponse.json(
        {
          error:
            "None of the selected images could be downloaded. They may be protected, private or no longer available.",
          skipped: error.skipped,
        },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
