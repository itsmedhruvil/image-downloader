import { NextResponse } from "next/server";

import { getR2Bucket, getR2Client, isR2Configured } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const maxDuration = 30;

interface FeatureRequestBody {
  title?: string;
  email?: string;
  details?: string;
}

/**
 * POST /api/feature-request — records a product suggestion.
 *
 * With R2 configured the request is stored as a small JSON object under
 * `feature-requests/`, which the team can review from the bucket. Without R2 the
 * endpoint reports that storage is unavailable so the UI can offer the mailto
 * fallback instead of silently dropping the message.
 */
export async function POST(request: Request) {
  let body: FeatureRequestBody;
  try {
    body = (await request.json()) as FeatureRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const email = (body.email ?? "").trim();
  const details = (body.details ?? "").trim();

  if (title.length < 3) {
    return NextResponse.json({ error: "Give the idea a short title." }, { status: 400 });
  }
  if (title.length > 140) {
    return NextResponse.json({ error: "Keep the title under 140 characters." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email address looks invalid." }, { status: 400 });
  }
  if (details.length > 4000) {
    return NextResponse.json({ error: "Keep the details under 4000 characters." }, { status: 400 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Server-side submission is not configured on this deployment. Email your idea to hello@websiteimagextractor.com instead.",
        fallbackEmail: "hello@websiteimagextractor.com",
      },
      { status: 503 },
    );
  }

  const record = {
    title,
    email: email || null,
    details,
    submittedAt: new Date().toISOString(),
    userAgent: request.headers.get("user-agent") ?? null,
    referer: request.headers.get("referer") ?? null,
  };

  const key = `feature-requests/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.json`;

  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
        Body: Buffer.from(JSON.stringify(record, null, 2), "utf8"),
        ContentType: "application/json",
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Could not record that right now. Please try again in a moment." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
