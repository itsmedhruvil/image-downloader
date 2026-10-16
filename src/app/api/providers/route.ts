import { NextResponse } from "next/server";

import { getProviderStatus } from "@/lib/stock/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/providers — which stock image sources have API keys configured.
 * Shape matches the ImageForge contract: `{ unsplash, pexels, pixabay }`.
 */
export async function GET() {
  return NextResponse.json(getProviderStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
