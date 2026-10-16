/**
 * Verification for the multi-source stock search: provider normalisation,
 * orientation mapping, keyword derivation, the fan-out limits and the
 * attribution file written into ZIP archives.
 *
 *   npm run test:stock
 */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  buildProviderUrl,
  filterByOrientation,
  getProviderStatus,
  mapPexels,
  mapPixabay,
  mapUnsplash,
  searchProvider,
  stockFilename,
} from "../src/lib/stock/providers";
import { normalizeGroups, searchStockGroups } from "../src/lib/stock/search";
import { deriveKeywords, extractSections, readTitle } from "../src/lib/stock/keywords";
import { buildImageZip } from "../src/lib/zip";
import { buildCreditsFile, CREDITS_FILENAME } from "../src/lib/credits";
import type { StockImage } from "../src/lib/stock/types";

let passed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error: unknown) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`  FAIL ${name}`);
    console.log(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

// A DOM is needed because the ZIP builder is exercised via jsdom-free paths only,
// but the credit helper and keyword extraction run in Node.
new JSDOM("<!doctype html><html><body></body></html>");

console.log("\nProvider normalisation");

const UNSPLASH_PAYLOAD = {
  results: [
    {
      id: "abc123",
      width: 4000,
      height: 3000,
      urls: {
        raw: "https://images.unsplash.com/photo-abc?raw",
        full: "https://images.unsplash.com/photo-abc?q=85",
        regular: "https://images.unsplash.com/photo-abc?w=1080",
        small: "https://images.unsplash.com/photo-abc?w=400",
      },
      links: { html: "https://unsplash.com/photos/abc123" },
      user: { name: "Jane Doe", username: "jane", links: { html: "https://unsplash.com/@jane" } },
    },
    // Malformed entry must be skipped, not crash.
    { id: "no-urls" },
  ],
};

await test("Unsplash payloads map to gallery images with attribution", () => {
  const images = mapUnsplash(UNSPLASH_PAYLOAD);
  assert.equal(images.length, 1, "malformed entries must be dropped");

  const image = images[0] as StockImage;
  assert.equal(image.id, "unsplash-abc123");
  assert.equal(image.provider, "unsplash");
  assert.equal(image.url, "https://images.unsplash.com/photo-abc?q=85");
  assert.equal(image.previewUrl, "https://images.unsplash.com/photo-abc?w=400");
  assert.equal(image.width, 4000);
  assert.equal(image.height, 3000);
  assert.match(image.credit, /Photo by Jane Doe on Unsplash/);
  assert.equal(image.attributionUrl, "https://unsplash.com/photos/abc123");
  assert.equal(image.filename, "unsplash-abc123.jpg");
});

await test("Pexels payloads map to gallery images with attribution", () => {
  const images = mapPexels({
    photos: [
      {
        id: 7788,
        width: 1920,
        height: 1280,
        url: "https://www.pexels.com/photo/7788/",
        photographer: "Sam Smith",
        photographer_url: "https://www.pexels.com/@sam",
        src: {
          original: "https://images.pexels.com/photos/7788/original.jpg",
          large: "https://images.pexels.com/photos/7788/large.jpg",
          medium: "https://images.pexels.com/photos/7788/medium.jpg",
        },
      },
    ],
  });

  assert.equal(images.length, 1);
  const image = images[0] as StockImage;
  assert.equal(image.id, "pexels-7788");
  assert.equal(image.url, "https://images.pexels.com/photos/7788/original.jpg");
  assert.equal(image.previewUrl, "https://images.pexels.com/photos/7788/medium.jpg");
  assert.match(image.credit, /Photo by Sam Smith on Pexels/);
});

await test("Pixabay payloads map to gallery images with attribution", () => {
  const images = mapPixabay({
    hits: [
      {
        id: 4242,
        imageWidth: 1000,
        imageHeight: 1000,
        largeImageURL: "https://pixabay.com/get/4242_large.jpg",
        webformatURL: "https://pixabay.com/get/4242_640.jpg",
        pageURL: "https://pixabay.com/photos/4242/",
        user: "Pix User",
      },
      { id: 1 },
    ],
  });

  assert.equal(images.length, 1);
  const image = images[0] as StockImage;
  assert.equal(image.id, "pixabay-4242");
  assert.equal(image.url, "https://pixabay.com/get/4242_large.jpg");
  assert.match(image.credit, /Image by Pix User on Pixabay/);
});

await test("unknown payload shapes return an empty list instead of throwing", () => {
  for (const payload of [null, undefined, {}, [], { results: "nope" }, { hits: [null, 3] }]) {
    assert.deepEqual(mapUnsplash(payload), []);
    assert.deepEqual(mapPexels(payload), []);
    assert.deepEqual(mapPixabay(payload), []);
  }
});

await test("stock filenames are predictable and filesystem-safe", () => {
  assert.equal(stockFilename("unsplash", "abc/../123", "https://x.com/a.webp"), "unsplash-abc-..-123.webp");
  assert.equal(stockFilename("pexels", "99", "https://x.com/a.jpeg"), "pexels-99.jpg");
  assert.equal(stockFilename("pixabay", "7", "https://x.com/no-extension"), "pixabay-7.jpg");
});

console.log("\nOrientation and URL building");

await test("orientation is translated to each provider's own vocabulary", () => {
  assert.match(buildProviderUrl("unsplash", "cat", 10, "square"), /orientation=squarish/);
  assert.match(buildProviderUrl("unsplash", "cat", 10, "landscape"), /orientation=landscape/);
  assert.match(buildProviderUrl("pexels", "cat", 10, "square"), /orientation=square/);
  assert.match(buildProviderUrl("pixabay", "cat", 10, "landscape"), /orientation=horizontal/);
  assert.match(buildProviderUrl("pixabay", "cat", 10, "portrait"), /orientation=vertical/);
  // Pixabay has no square filter — the parameter must simply be absent.
  assert.doesNotMatch(buildProviderUrl("pixabay", "cat", 10, "square"), /orientation=/);
  assert.doesNotMatch(buildProviderUrl("unsplash", "cat", 10, null), /orientation=/);
});

await test("provider URLs carry the keyword, count and safety filters", () => {
  const unsplash = new URL(buildProviderUrl("unsplash", "mountain landscape", 5, null));
  assert.equal(unsplash.searchParams.get("query"), "mountain landscape");
  assert.equal(unsplash.searchParams.get("per_page"), "5");
  assert.equal(unsplash.searchParams.get("content_filter"), "high");

  const pixabay = new URL(buildProviderUrl("pixabay", "cat", 2, null));
  assert.equal(pixabay.searchParams.get("image_type"), "photo");
  assert.equal(pixabay.searchParams.get("safesearch"), "true");
  // Pixabay rejects per_page values below 3.
  assert.equal(pixabay.searchParams.get("per_page"), "3");
});

await test("square filtering drops clearly non-square Pixabay results", () => {
  const images: StockImage[] = [
    { id: "a", provider: "pixabay", url: "u", previewUrl: "u", filename: "a.jpg", width: 1000, height: 1000, credit: "c", attributionUrl: null },
    { id: "b", provider: "pixabay", url: "u", previewUrl: "u", filename: "b.jpg", width: 1600, height: 900, credit: "c", attributionUrl: null },
    { id: "c", provider: "pixabay", url: "u", previewUrl: "u", filename: "c.jpg", width: null, height: null, credit: "c", attributionUrl: null },
  ];

  const square = filterByOrientation(images, "square");
  assert.deepEqual(square.map((image) => image.id), ["a", "c"], "unknown dimensions are kept");
  assert.equal(filterByOrientation(images, "landscape").length, 3, "other orientations pass through");
});

console.log("\nSearch fan-out");

await test("normalizeGroups trims, de-duplicates, clamps and caps", () => {
  const groups = normalizeGroups([
    { name: "", keyword: "  cats  ", count: 5 },
    { name: "dup", keyword: "CATS", count: 5 },
    { name: "big", keyword: "dogs", count: 5000 },
    { name: "small", keyword: "birds", count: 0 },
    { name: "blank", keyword: "   ", count: 3 },
    { name: "x", keyword: "x".repeat(200), count: 4 },
  ]);

  assert.deepEqual(
    groups.map((group) => group.keyword),
    ["cats", "dogs", "birds", "x".repeat(80)],
  );
  assert.equal(groups[0]?.count, 5);
  assert.equal(groups[1]?.count, 50, "count is clamped to the maximum");
  assert.equal(groups[2]?.count, 12, "zero falls back to the default");
});

await test("searchStockGroups skips providers without keys and runs the rest", async () => {
  delete process.env.UNSPLASH_ACCESS_KEY;
  process.env.PEXELS_API_KEY = "test-pexels";
  delete process.env.PIXABAY_API_KEY;

  assert.deepEqual(getProviderStatus(), { unsplash: false, pexels: true, pixabay: false });

  const requested: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    requested.push(url);
    return new Response(
      JSON.stringify({
        photos: [
          {
            id: 1,
            width: 100,
            height: 100,
            photographer: "Tester",
            photographer_url: "https://pexels.com/@tester",
            url: "https://pexels.com/photo/1/",
            src: { original: "https://images.pexels.com/1.jpg", medium: "https://images.pexels.com/1m.jpg" },
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as unknown as typeof fetch;

  const response = await searchStockGroups({
    providers: ["unsplash", "pexels", "pixabay"],
    orientation: null,
    groups: [{ name: "cats", keyword: "cats", count: 3 }],
  });

  assert.deepEqual(response.usedProviders, ["pexels"]);
  assert.equal(requested.length, 1, "only the configured provider should be queried");
  assert.match(requested[0] ?? "", /api\.pexels\.com\/v1\/search/);
  assert.equal(response.results[0]?.images.length, 1);
  assert.ok(
    response.warnings.some((warning) => warning.includes("unsplash")),
    "unconfigured providers must be reported",
  );

  delete process.env.PEXELS_API_KEY;
});

await test("provider errors surface per group instead of failing the request", async () => {
  process.env.PEXELS_API_KEY = "test-pexels";
  globalThis.fetch = (async () =>
    new Response("rate limited", { status: 429 })) as unknown as typeof fetch;

  const response = await searchStockGroups({
    providers: ["pexels"],
    orientation: null,
    groups: [{ name: "cats", keyword: "cats", count: 3 }],
  });

  assert.equal(response.results[0]?.images.length, 0);
  assert.match(response.results[0]?.error ?? "", /rate limit/);

  delete process.env.PEXELS_API_KEY;
});

await test("unconfigured provider requests fail cleanly", async () => {
  delete process.env.UNSPLASH_ACCESS_KEY;
  const result = await searchProvider("unsplash", "cats", 5, null);
  assert.equal(result.images.length, 0);
  assert.match(result.error ?? "", /not configured/);
});

console.log("\nKeyword suggestions from a page");

const FIXTURE = `<!doctype html>
<html>
  <head>
    <title>Alpine Adventures — Hiking in the Dolomites</title>
    <meta property="og:title" content="Alpine Adventures">
  </head>
  <body>
    <nav><a href="/">Home</a><a href="/blog">Blog</a><a href="/contact">Contact</a>
      Cookie settings. Subscribe to our newsletter.</nav>
    <h1>Mountain hiking in the Dolomites</h1>
    <p>The Dolomites offer dramatic mountain hiking routes. Mountain hiking here means
       long ridges, alpine meadows and quiet valleys.</p>
    <h2>Alpine wildflowers in spring</h2>
    <p>Alpine wildflowers carpet the meadows in spring. Photographers chase alpine
       wildflowers every spring for colour and texture.</p>
    <h2>Lakes and reflections</h2>
    <p>Still lakes mirror the peaks at dawn. These lakes reflect the mountains and are
       a favourite subject for landscape photography at dawn.</p>
    <footer>Copyright 2026. All rights reserved.</footer>
  </body>
</html>`;

await test("sections follow the page's own headings", () => {
  const sections = extractSections(FIXTURE, readTitle(FIXTURE));
  const names = sections.map((section) => section.name);
  assert.ok(names.some((name) => /Dolomites/.test(name)), `got: ${names.join(" | ")}`);
  assert.ok(names.some((name) => /wildflowers/i.test(name)));
  assert.ok(names.some((name) => /Lakes/i.test(name)));
});

await test("suggested keywords reflect the section's own copy", () => {
  const sections = extractSections(FIXTURE, readTitle(FIXTURE));
  const wildflowers = sections.find((section) => /wildflowers/i.test(section.name));
  assert.ok(wildflowers, "expected a wildflowers section");
  assert.match(wildflowers.suggestedKeyword, /alpine wildflowers|wildflowers/);
  assert.ok(wildflowers.allSuggestions.length >= 1);
  assert.ok(wildflowers.allSuggestions.length <= 5);
});

await test("navigation and footer chrome do not become keywords", () => {
  const sections = extractSections(FIXTURE, readTitle(FIXTURE));
  const flattened = sections.flatMap((section) => section.allSuggestions).join(" ");
  for (const noise of ["cookie", "newsletter", "copyright", "reserved"]) {
    assert.ok(!flattened.includes(noise), `"${noise}" should be filtered out`);
  }
});

await test("readTitle prefers Open Graph", () => {
  assert.equal(readTitle(FIXTURE), "Alpine Adventures");
  assert.equal(readTitle("<html><head><title>Plain</title></head></html>"), "Plain");
});

await test("deriveKeywords ranks repeated phrases above one-off words", () => {
  const keywords = deriveKeywords(
    "wedding photography wedding photography wedding photography candid portrait session",
    3,
  );
  assert.equal(keywords[0], "wedding photography");
  assert.ok(keywords.length <= 3);
});

await test("deriveKeywords returns nothing for empty or stopword-only text", () => {
  assert.deepEqual(deriveKeywords(""), []);
  assert.deepEqual(deriveKeywords("the and for with you your"), []);
});

await test("pages without headings fall back to a single titled section", () => {
  const sections = extractSections(
    "<html><head><title>Plain page</title></head><body><p>Sunset beach photography at golden hour, sunset beach photography is popular.</p></body></html>",
    "Plain page",
  );
  assert.equal(sections.length, 1);
  assert.equal(sections[0]?.name, "Plain page");
  assert.match(sections[0]?.suggestedKeyword ?? "", /sunset beach/);
});

console.log("\nAttribution in ZIP archives");

await test("credits.txt lists every credited image with the required note", async () => {
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const svg =
    "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E";

  const result = await buildImageZip([
    { url: png, name: "unsplash-abc", credit: "Photo by Jane Doe on Unsplash — https://unsplash.com/photos/abc" },
    { url: svg, name: "local-vector" },
  ]);

  assert.equal(result.included, 2);
  assert.equal(result.credited, 1, "only the credited image counts");

  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(result.buffer);
  const names = Object.keys(zip.files).sort();
  assert.deepEqual(names, ["credits.txt", "local-vector.svg", "unsplash-abc.png"]);

  const credits = await zip.file(CREDITS_FILENAME)!.async("string");
  assert.match(credits, /unsplash-abc\.png — Photo by Jane Doe on Unsplash/);
  assert.match(credits, /Unsplash, Pexels and Pixabay API terms/);
  assert.ok(!credits.includes("local-vector"), "uncredited images must not be listed");
});

await test("archives without credited images omit credits.txt", async () => {
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const result = await buildImageZip([{ url: png, name: "plain" }]);

  assert.equal(result.credited, 0);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(result.buffer);
  assert.deepEqual(Object.keys(zip.files), ["plain.png"]);
  assert.equal(buildCreditsFile([]).includes("API terms"), true, "helper always ends with the note");
});

await test("/api/providers reports the configured sources", async () => {
  process.env.PEXELS_API_KEY = "test-pexels";
  delete process.env.UNSPLASH_ACCESS_KEY;
  delete process.env.PIXABAY_API_KEY;

  const { GET } = await import("../src/app/api/providers/route");
  const response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { unsplash: false, pexels: true, pixabay: false });

  delete process.env.PEXELS_API_KEY;
});

console.log(
  `\n${failures.length === 0 ? "PASS" : "FAIL"} ${passed} passed, ${failures.length} failed\n`,
);

if (failures.length > 0) {
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}


