import { NextResponse } from "next/server";

import { normalizeSiteUrl } from "@/lib/extract.core";
import { assertPublicHttpUrl, fetchPageHtml, UnsafeUrlError } from "@/lib/net";
import { extractSections, readTitle } from "@/lib/stock/keywords";
import type { AnalyzeUrlResponse } from "@/lib/stock/types";

export const runtime = "nodejs";
export const maxDuration = 45;
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze-url — suggest stock-photo keywords from a page's structure.
 *
 * Body: `{ url }` → `{ sections: [{ name, suggestedKeyword, allSuggestions }] }`
 */
export async function POST(request: Request) {
  const startedAt = Date.now();

  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalized = normalizeSiteUrl(body.url ?? "");
  if (!normalized) {
    return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 });
  }

  try {
    const safeUrl = await assertPublicHttpUrl(normalized);
    const page = await fetchPageHtml(safeUrl.toString());
    const title = readTitle(page.html);
    const sections = extractSections(page.html, title);

    if (sections.length === 0) {
      return NextResponse.json(
        { error: "Could not find enough text on that page to suggest keywords." },
        { status: 422 },
      );
    }

    const payload: AnalyzeUrlResponse = {
      url: page.finalUrl,
      title,
      sections,
      durationMs: Date.now() - startedAt,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const status = error instanceof UnsafeUrlError ? 400 : 502;
    const message =
      error instanceof Error ? error.message : "Could not analyze that page.";
    return NextResponse.json({ error: message }, { status });
  }
}
