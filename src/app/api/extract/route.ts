import { NextResponse } from "next/server";

import { normalizeSiteUrl } from "@/lib/extract.core";
import { extractImagesFromHtml, extractTitle } from "@/lib/extract.server";
import { assertPublicHttpUrl, fetchPageHtml, UnsafeUrlError } from "@/lib/net";
import type { ExtractResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_BULK_URLS = 5;

interface ExtractBody {
  method?: "url" | "html" | "bulk";
  url?: string;
  html?: string;
}

/** Raised for input the user can fix, so the API can answer 400 instead of 502. */
class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

/** POST /api/extract — scan a page (or raw markup) and return every image. */
export async function POST(request: Request) {
  const startedAt = Date.now();

  let body: ExtractBody;
  try {
    body = (await request.json()) as ExtractBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const method = body.method ?? "url";

  try {
    if (method === "html") {
      const html = body.html ?? "";
      if (!html.trim()) {
        return NextResponse.json({ error: "Paste some HTML to scan." }, { status: 400 });
      }
      const base = normalizeSiteUrl(body.url ?? "") ?? "https://html-paste.local/";
      const response: ExtractResponse = {
        images: extractImagesFromHtml(html, base),
        resolvedUrl: null,
        title: extractTitle(html),
        pagesScanned: 1,
        warnings: [],
        durationMs: Date.now() - startedAt,
      };
      return NextResponse.json(response);
    }

    const rawInput = (body.url ?? "").trim();
    if (!rawInput) {
      return NextResponse.json({ error: "Enter a website URL." }, { status: 400 });
    }

    const inputs =
      method === "bulk"
        ? rawInput
            .split(/[\n,]+/)
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, MAX_BULK_URLS)
        : [rawInput];

    if (inputs.length === 0) {
      return NextResponse.json({ error: "Enter at least one website URL." }, { status: 400 });
    }

    const warnings: string[] = [];
    const allImages: ExtractResponse["images"] = [];
    const seen = new Set<string>();
    let pagesScanned = 0;
    let invalidInputs = 0;
    let firstTitle: string | null = null;
    let firstResolved: string | null = null;

    const results = await Promise.allSettled(
      inputs.map(async (input) => {
        const normalized = normalizeSiteUrl(input);
        if (!normalized) throw new InvalidInputError(`"${input}" is not a valid URL.`);
        const safeUrl = await assertPublicHttpUrl(normalized);
        const page = await fetchPageHtml(safeUrl.toString());
        return { page, input };
      }),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const reason = result.reason;
        const isInvalid =
          reason instanceof InvalidInputError || reason instanceof UnsafeUrlError;
        if (isInvalid) invalidInputs += 1;
        const message =
          reason instanceof Error ? reason.message : "Unknown error";
        warnings.push(`${inputs[index]}: ${message}`);
        return;
      }

      const { page } = result.value;
      pagesScanned += 1;
      if (page.truncated) {
        warnings.push(`${inputs[index]}: page was very large and was partially scanned.`);
      }

      const images = extractImagesFromHtml(page.html, page.finalUrl);
      if (!firstTitle) firstTitle = extractTitle(page.html);
      if (!firstResolved) firstResolved = page.finalUrl;

      for (const image of images) {
        if (seen.has(image.url)) continue;
        seen.add(image.url);
        allImages.push(image);
      }
    });

    if (pagesScanned === 0) {
      const allInvalid = invalidInputs === inputs.length;
      return NextResponse.json(
        {
          error: allInvalid
            ? (warnings[0]?.split(": ").slice(1).join(": ") ??
              "That URL cannot be fetched.")
            : "Could not fetch that page.",
          details: warnings,
        },
        { status: allInvalid ? 400 : 502 },
      );
    }

    const response: ExtractResponse = {
      images: allImages,
      resolvedUrl: firstResolved,
      title: firstTitle,
      pagesScanned,
      warnings,
      durationMs: Date.now() - startedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
