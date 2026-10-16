import { NextResponse } from "next/server";

import { searchStockGroups } from "@/lib/stock/search";
import type { StockSearchRequest } from "@/lib/stock/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/stock/search — multi-source stock image search.
 *
 * Body: `{ providers: string[], orientation: "landscape"|"portrait"|"square"|null,
 *          groups: [{ name, keyword, count }] }`
 *
 * Returns one result group per keyword. Image URLs are returned as-is (not
 * base64) so the gallery, filters and the R2 ZIP pipeline can be reused.
 */
export async function POST(request: Request) {
  let body: StockSearchRequest;
  try {
    body = (await request.json()) as StockSearchRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body?.groups) || body.groups.length === 0) {
    return NextResponse.json({ error: "Add at least one keyword to search for." }, { status: 400 });
  }

  try {
    const response = await searchStockGroups({
      providers: Array.isArray(body.providers) ? body.providers : [],
      orientation: body.orientation ?? null,
      groups: body.groups,
    });

    const found = response.results.reduce((total, group) => total + group.images.length, 0);

    if (found === 0) {
      const reason =
        response.warnings[0] ??
        response.results.find((group) => group.error)?.error ??
        "No images matched that search.";
      return NextResponse.json({ error: reason, ...response }, { status: 502 });
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
