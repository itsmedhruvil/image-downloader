/**
 * Verification suite for the extraction engine, the ZIP builder and the shared
 * URL helpers. Runs with `npm test` (tsx + jsdom, no browser required).
 */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import {
  buildFilename,
  decodeHtmlEntities,
  finalizeCandidates,
  guessFormat,
  isLikelyAssetUrl,
  normalizeSiteUrl,
  parseCssUrls,
  parseSrcset,
} from "../src/lib/extract.core";
import { extractImagesFromHtml, extractTitle } from "../src/lib/extract.server";
import { buildImageZip } from "../src/lib/zip";
import type { ExtractedImage } from "../src/lib/types";

// The browser collector relies on DOMParser, which Node does not provide.
const dom = new JSDOM("");
(globalThis as unknown as { DOMParser: unknown }).DOMParser = dom.window.DOMParser;
const { extractImagesFromMarkupClient, extractTitleClient } = await import(
  "../src/lib/extract.client"
);

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

const FIXTURE = `<!doctype html>
<html>
  <head>
    <base href="https://example.com/blog/">
    <title>Fixture page</title>
    <link rel="icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="touch.png">
    <link rel="preload" as="image" href="preload.webp">
    <link rel="preload" as="script" href="not-an-image.png">
    <meta property="og:image" content="https://cdn.example.com/og.png?w=1200&amp;h=630">
    <meta name="twitter:image" content="//cdn.example.com/twitter.jpg">
    <style>
      .hero { background-image: url("/media/hero-bg.jpg"); }
      .icon { background: url('data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E') no-repeat; }
      .font { src: url(https://fonts.example.com/font.woff2); }
    </style>
  </head>
  <body>
    <img src="photo.jpg" alt="A photo">
    <img src="/root-relative.png">
    <img data-src="lazy.jpg" data-lazy-src="lazy-two.jpg" alt="Lazy">
    <img srcset="small.webp 480w, large.webp 1200w" sizes="100vw" alt="Responsive">
    <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="pixel">
    <picture>
      <source srcset="picture-a.avif 1x, picture-b.avif 2x">
      <img src="picture-fallback.jpg">
    </picture>
    <video poster="poster.jpg"><source src="clip.mp4"></video>
    <div style="background:url(bg-inline.png)"></div>
    <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>
    <img src="javascript:void(0)">
    <a href="mailto:hi@example.com">mail</a>
    <script type="application/json">
      {"image":"https://cdn.example.com/hydrated.webp?x=1&amp;y=2",
       "page":"https://example.com/wiki/File:Cat.jpg"}
    </script>
  </body>
</html>`;

const EXPECTED_URLS = [
  "https://example.com/favicon.ico",
  "https://example.com/blog/touch.png",
  "https://example.com/blog/preload.webp",
  "https://cdn.example.com/og.png?w=1200&h=630",
  "https://cdn.example.com/twitter.jpg",
  "https://example.com/media/hero-bg.jpg",
  "https://example.com/blog/photo.jpg",
  "https://example.com/root-relative.png",
  "https://example.com/blog/lazy.jpg",
  "https://example.com/blog/lazy-two.jpg",
  "https://example.com/blog/small.webp",
  "https://example.com/blog/large.webp",
  "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  "https://example.com/blog/picture-a.avif",
  "https://example.com/blog/picture-b.avif",
  "https://example.com/blog/picture-fallback.jpg",
  "https://example.com/blog/poster.jpg",
  "https://example.com/blog/bg-inline.png",
  "https://cdn.example.com/hydrated.webp?x=1&y=2",
];

console.log("\nShared helpers");

await test("guessFormat reads extensions, CDN hints and data URIs", () => {
  assert.equal(guessFormat("https://a.com/x.JPEG"), "jpg");
  assert.equal(guessFormat("https://a.com/x.webp?w=100"), "webp");
  assert.equal(guessFormat("https://a.com/img?id=1&format=png"), "png");
  assert.equal(guessFormat("https://a.com/img?fm=avif"), "avif");
  assert.equal(guessFormat("https://a.com/image/upload/w_300/photo.jpg"), "jpg");
  assert.equal(guessFormat("data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E"), "svg");
  assert.equal(guessFormat("data:image/png;base64,AAA"), "png");
  assert.equal(guessFormat("https://a.com/logo"), "other");
  assert.equal(guessFormat("https://a.com/thing.svg?v=2"), "svg");
});

await test("parseSrcset strips descriptors and keeps every candidate", () => {
  assert.deepEqual(parseSrcset("a.jpg 1x, b.jpg 2x"), ["a.jpg", "b.jpg"]);
  assert.deepEqual(parseSrcset("only.webp"), ["only.webp"]);
  assert.deepEqual(parseSrcset("  "), []);
});

await test("parseCssUrls handles quotes and multiple declarations", () => {
  assert.deepEqual(parseCssUrls('background:url("a.png"), url(b.jpg)'), ["a.png", "b.jpg"]);
  assert.deepEqual(parseCssUrls("background:url( 'c.webp' )"), ["c.webp"]);
  assert.deepEqual(parseCssUrls("color:red"), []);
});

await test("decodeHtmlEntities resolves named and numeric entities", () => {
  assert.equal(decodeHtmlEntities("a&amp;b"), "a&b");
  assert.equal(decodeHtmlEntities("a&#38;b"), "a&b");
  assert.equal(decodeHtmlEntities("a&#x26;b"), "a&b");
  assert.equal(decodeHtmlEntities("plain"), "plain");
  assert.equal(decodeHtmlEntities("&unknown;"), "&unknown;");
});

await test("isLikelyAssetUrl rejects wiki-style page URLs", () => {
  assert.equal(isLikelyAssetUrl("https://en.wikipedia.org/wiki/File:Cat.jpg"), false);
  assert.equal(isLikelyAssetUrl("https://cdn.example.com/cat.jpg"), true);
});

await test("normalizeSiteUrl adds a protocol and rejects non-http(s)", () => {
  assert.equal(normalizeSiteUrl("example.com"), "https://example.com/");
  assert.equal(normalizeSiteUrl("http://example.com/a"), "http://example.com/a");
  assert.equal(normalizeSiteUrl("ftp://example.com"), null);
  assert.equal(normalizeSiteUrl(""), null);
});

await test("buildFilename sanitises names and de-duplicates", () => {
  const used = new Set<string>();
  const base: ExtractedImage = {
    url: "https://a.com/x.jpg",
    name: "My Photo!! (1)",
    format: "jpg",
    source: "img",
    crossOrigin: false,
  };
  assert.equal(buildFilename(base, 0, used), "My-Photo-1.jpg");
  assert.equal(buildFilename(base, 1, used), "My-Photo-1-1.jpg");
  assert.equal(buildFilename({ ...base, name: "" }, 2, used), "x.jpg");
});

await test("finalizeCandidates decodes entities and de-duplicates", () => {
  const images = finalizeCandidates(
    [
      { value: "https://a.com/p.jpg?a=1&amp;b=2", source: "meta" },
      { value: "https://a.com/p.jpg?a=1&b=2", source: "meta" },
      { value: "javascript:void(0)", source: "img" },
      { value: "#anchor", source: "img" },
    ],
    "https://a.com/",
    "https://a.com",
  );
  assert.equal(images.length, 1);
  assert.equal(images[0]?.url, "https://a.com/p.jpg?a=1&b=2");
});

console.log("\nServer collector (cheerio)");

await test("extractImagesFromHtml finds every documented source", () => {
  const images = extractImagesFromHtml(FIXTURE, "https://example.com/blog/");
  const urls = images.map((image) => image.url);
  for (const expected of EXPECTED_URLS) {
    assert.ok(urls.includes(expected), `missing ${expected}`);
  }
  assert.ok(
    !urls.some((url) => url.includes("not-an-image.png")),
    "preload without as=image must be ignored",
  );
  assert.ok(!urls.some((url) => url.includes("font.woff2")), "fonts must be ignored");
  assert.ok(!urls.some((url) => url.includes("File:Cat.jpg")), "wiki page URLs must be rejected");
  assert.ok(!urls.some((url) => url.includes("&amp;")), "entities must be decoded");
  assert.equal(new Set(urls).size, urls.length, "URLs must be unique");
  assert.ok(
    images.some(
      (image) => image.source === "inline-svg" && image.url.startsWith("data:image/svg+xml"),
    ),
    "inline SVG must be exported as a data URI",
  );
});

await test("extractTitle reads the document title", () => {
  assert.equal(extractTitle(FIXTURE), "Fixture page");
});

console.log("\nClient collector (DOMParser)");

await test("extractImagesFromMarkupClient matches the server result", () => {
  const images = extractImagesFromMarkupClient(FIXTURE, "https://example.com/blog/");
  const urls = new Set(images.map((image) => image.url));
  for (const expected of EXPECTED_URLS) {
    assert.ok(urls.has(expected), `missing ${expected}`);
  }
  assert.ok(![...urls].some((url) => url.includes("File:Cat.jpg")));
  assert.ok(![...urls].some((url) => url.includes("&amp;")));
  assert.equal(urls.size, images.length, "URLs must be unique");
});

await test("extractImagesFromMarkupClient resolves relative paths against the given base", () => {
  const images = extractImagesFromMarkupClient(
    '<img src="/hero.png"><div style="background-image:url(bg.webp)"></div>',
    "https://pasted.example.com/deep/page/",
  );
  const urls = images.map((image) => image.url).sort();
  assert.deepEqual(urls, [
    "https://pasted.example.com/deep/page/bg.webp",
    "https://pasted.example.com/hero.png",
  ]);
});

await test("extractTitleClient reads pasted markup", () => {
  assert.equal(extractTitleClient("<html><head><title>Hi</title></head></html>"), "Hi");
});

console.log("\nZIP builder");

await test("buildImageZip packages successful downloads and reports failures", async () => {
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const svg =
    "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E";

  const result = await buildImageZip([
    { url: png, name: "dot" },
    { url: svg, name: "vector mark" },
    { url: "https://127.0.0.1:1/unreachable.png", name: "broken" },
  ]);

  assert.equal(result.included, 2);
  assert.equal(result.skipped.length, 1);
  assert.ok(result.bytes > 0);
  assert.match(result.filename, /^website-images-\d{8}-\d{6}\.zip$/);

  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(result.buffer);
  assert.deepEqual(Object.keys(zip.files).sort(), ["dot.png", "vector-mark.svg"]);
});

await test("buildImageZip throws when nothing can be downloaded", async () => {
  await assert.rejects(
    () => buildImageZip([{ url: "https://127.0.0.1:1/none.png", name: "x" }]),
    /No images could be downloaded/,
  );
});

console.log(`\n${failures.length === 0 ? "PASS" : "FAIL"} ${passed} passed, ${failures.length} failed\n`);

if (failures.length > 0) {
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}


