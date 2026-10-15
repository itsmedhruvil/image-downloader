import { NextResponse } from "next/server";

import { getArchive, getR2Bucket, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/download/[...key] — streams a ZIP archive previously stored in R2.
 * Keys live under the `zips/` prefix and expire on their own via R2 lifecycle.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "Archive storage is not configured." }, { status: 503 });
  }

  const { key: segments } = await context.params;
  const key = (segments ?? []).map(decodeURIComponent).join("/");

  if (!key || !key.startsWith("zips/") || key.includes("..")) {
    return NextResponse.json({ error: "Invalid archive key." }, { status: 400 });
  }

  // Guard against a bucket mismatch producing confusing 500s.
  getR2Bucket();

  const archive = await getArchive(key);
  if (!archive) {
    return NextResponse.json(
      { error: "That archive has expired. Generate it again to download." },
      { status: 404 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${archive.filename.replace(/"/g, "")}"`,
    "Cache-Control": "private, max-age=3600",
  };
  if (archive.contentLength) headers["Content-Length"] = String(archive.contentLength);

  return new NextResponse(archive.body, { headers });
}
