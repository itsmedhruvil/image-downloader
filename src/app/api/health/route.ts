import { NextResponse } from "next/server";

import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — lightweight readiness probe used by the status page. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    archiveStorage: isR2Configured() ? "cloudflare-r2" : "streamed-direct",
    region: process.env.VERCEL_REGION ?? "local",
    time: new Date().toISOString(),
  });
}
