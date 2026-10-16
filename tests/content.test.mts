/**
 * Verification for the content/SEO layer and the local activity store.
 *
 *   npm run test:content
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { JSDOM } from "jsdom";

import { FAQ_ENTRIES, blocksToPlainText } from "../src/lib/content/faq";
import { BLOG_POSTS } from "../src/lib/content/blog";
import { TIPS, FOOTER_GROUPS } from "../src/lib/site";
import {
  blogPostingLd,
  breadcrumbLd,
  faqPageLd,
  homeStructuredData,
  howToLd,
  organizationLd,
  softwareApplicationLd,
  webApplicationLd,
  webSiteLd,
} from "../src/lib/structured-data";

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

// The activity store touches window.localStorage.
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const globals = globalThis as unknown as Record<string, unknown>;
globals.window = dom.window;
globals.document = dom.window.document;
Object.defineProperty(globalThis, "localStorage", {
  value: dom.window.localStorage,
  configurable: true,
  writable: true,
});

const { getStats, recordArchive, recordExtraction, reloadStats, resetStats, subscribe } = await import(
  "../src/lib/activity-stats"
);

console.log("\nStructured data");

await test("every JSON-LD block is valid and well-formed", () => {
  for (const block of homeStructuredData()) {
    assert.equal(block["@context"], "https://schema.org");
    assert.ok(typeof block["@type"] === "string", "each block needs an @type");
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(block)));
  }
});

await test("homepage advertises the expected schema types", () => {
  const types = homeStructuredData().map((block) => block["@type"]);
  for (const expected of ["WebApplication", "SoftwareApplication", "FAQPage", "HowTo"]) {
    assert.ok(types.includes(expected), `missing ${expected}`);
  }
  // Organization/WebSite are emitted once, globally, from the root layout.
  assert.ok(!types.includes("Organization"), "Organization belongs to the layout only");
  assert.ok(!types.includes("WebSite"), "WebSite belongs to the layout only");
});

await test("global and homepage schema blocks never overlap", () => {
  const globalTypes: unknown[] = [organizationLd()["@type"], webSiteLd()["@type"]];
  const homeTypes = homeStructuredData().map((block) => block["@type"]);
  assert.equal(
    globalTypes.some((type) => homeTypes.includes(type as string)),
    false,
    "a schema type is emitted twice on the homepage",
  );
});

await test("WebApplication marks the tool as free", () => {
  const app = webApplicationLd() as { offers: { price: string }; featureList: string[] };
  assert.equal(app.offers.price, "0");
  assert.ok(app.featureList.length >= 5);
});

await test("FAQPage mirrors every FAQ entry with a non-empty answer", () => {
  const page = faqPageLd() as {
    mainEntity: { name: string; acceptedAnswer: { text: string } }[];
  };
  assert.equal(page.mainEntity.length, FAQ_ENTRIES.length);
  for (const entry of page.mainEntity) {
    assert.ok(entry.name.length > 5, "question text is too short");
    assert.ok(entry.acceptedAnswer.text.length > 20, `thin answer for: ${entry.name}`);
    assert.ok(!entry.acceptedAnswer.text.includes("\n"), "answers must be single-line for JSON-LD");
  }
});

await test("blocksToPlainText flattens lists, code and tables", () => {
  const text = blocksToPlainText([
    { type: "p", text: "Intro." },
    { type: "ul", items: ["One", "Two"] },
    { type: "code", text: "example.com" },
    { type: "table", headers: ["A", "B"], rows: [["1", "2"]] },
  ]);
  assert.ok(text.includes("Intro."));
  assert.ok(text.includes("One Two"));
  assert.ok(text.includes("example.com"));
  assert.ok(text.includes("A — B"));
  assert.ok(text.includes("1 — 2"));
});

await test("HowTo describes three ordered steps", () => {
  const howTo = howToLd() as { step: { position: number; name: string; text: string }[] };
  assert.equal(howTo.step.length, 3);
  assert.deepEqual(
    howTo.step.map((step) => step.position),
    [1, 2, 3],
  );
  assert.ok(howTo.step.every((step) => step.text.length > 20));
});

await test("Organization and WebSite reference the canonical URL", () => {
  const org = organizationLd() as { url: string; sameAs: string[] };
  assert.ok(org.url.startsWith("https://"));
  assert.ok(org.sameAs.length >= 2);

  const site = webSiteLd() as { potentialAction: { target: { urlTemplate: string } } };
  assert.ok(site.potentialAction.target.urlTemplate.includes("{search_term_string}"));
});

await test("every blog post produces a BlogPosting plus breadcrumbs", () => {
  for (const post of BLOG_POSTS) {
    const ld = blogPostingLd(post) as { headline: string; wordCount: number; datePublished: string };
    assert.equal(ld.headline, post.title);
    assert.equal(ld.datePublished, post.date);
    assert.ok(ld.wordCount > 100, `wordCount looks wrong for ${post.slug}`);

    const crumbs = breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]) as { itemListElement: { position: number }[] };
    assert.deepEqual(
      crumbs.itemListElement.map((item) => item.position),
      [1, 2],
    );
  }
});

await test("software application schema omits fabricated ratings", () => {
  const app = softwareApplicationLd();
  assert.ok(!("aggregateRating" in app), "self-supplied ratings are not allowed");
});

console.log("\nRSS feed");

await test("/rss.xml returns well-formed XML with every post", async () => {
  const { GET } = await import("../src/app/rss.xml/route");
  const response = await GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/rss\+xml/);

  const xml = await response.text();
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<rss version="2.0"'));
  assert.ok(xml.trimEnd().endsWith("</rss>"));

  const items = xml.match(/<item>/g) ?? [];
  assert.equal(items.length, BLOG_POSTS.length);
  for (const post of BLOG_POSTS) {
    assert.ok(xml.includes(`https://websiteimagextractor.com/blog/${post.slug}`));
  }
  // No bare ampersands (they would break strict feed readers).
  assert.equal(/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(xml), false);
});

console.log("\nActivity stats store");

await test("stats start empty and increment independently", () => {
  resetStats();
  assert.deepEqual(getStats(), { urls: 0, images: 0, archives: 0 });

  recordExtraction({ urls: 2, images: 41 });
  assert.deepEqual(getStats(), { urls: 2, images: 41, archives: 0 });

  recordExtraction({ urls: 1, images: 9 });
  recordArchive();
  assert.deepEqual(getStats(), { urls: 3, images: 50, archives: 1 });
});

await test("subscribers are notified on every change", () => {
  resetStats();
  let notifications = 0;
  const unsubscribe = subscribe(() => {
    notifications += 1;
  });

  recordExtraction({ images: 5 });
  recordArchive();
  assert.equal(notifications, 2);

  unsubscribe();
  recordExtraction({ images: 5 });
  assert.equal(notifications, 2, "unsubscribed listeners must not fire");
});

await test("stats are persisted to localStorage", () => {
  resetStats();
  recordExtraction({ urls: 4, images: 12 });
  const stored = JSON.parse(dom.window.localStorage.getItem("wie-stats") ?? "{}");
  assert.deepEqual(stored, { urls: 4, images: 12, archives: 0 });
});

await test("corrupt stored data degrades to zeroes instead of throwing", () => {
  resetStats();
  recordExtraction({ urls: 9, images: 9 });
  dom.window.localStorage.setItem("wie-stats", "not json");
  reloadStats();
  assert.deepEqual(getStats(), { urls: 0, images: 0, archives: 0 });
});

await test("reloadStats picks up changes made by another tab", () => {
  resetStats();
  dom.window.localStorage.setItem("wie-stats", JSON.stringify({ urls: 7, images: 70, archives: 2 }));
  reloadStats();
  assert.deepEqual(getStats(), { urls: 7, images: 70, archives: 2 });
  resetStats();
});

console.log("\nSite content");

await test("tips and footer groups are complete", () => {
  assert.equal(TIPS.length, 5);
  assert.ok(TIPS.every((tip) => tip.length > 20));
  assert.ok(FOOTER_GROUPS.length >= 3);
  for (const group of FOOTER_GROUPS) {
    assert.ok(group.links.length >= 3, `${group.title} has too few links`);
    assert.ok(group.links.every((link) => link.href.startsWith("/")));
  }
});

await test("FAQ questions are unique", () => {
  const questions = FAQ_ENTRIES.map((entry) => entry.question);
  assert.equal(new Set(questions).size, questions.length);
});

console.log("\nLayout uniformity");

/** Recursively list source files under a directory. */
function walk(dir: string, extension = ".tsx"): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) found.push(...walk(path, extension));
    else if (path.endsWith(extension)) found.push(path);
  }
  return found;
}

const readSource = (path: string) => readFileSync(path, "utf8");

await test("no page uses a legacy narrow container width", () => {
  const offenders: string[] = [];
  for (const file of walk("src/app")) {
    const source = readSource(file);
    for (const match of source.matchAll(/max-w-(?!\[1600px\]|full)[a-z0-9[\]/.-]+/g)) {
      offenders.push(`${file}: ${match[0]}`);
    }
  }
  assert.deepEqual(offenders, [], "every page must use the single container width");
});

await test("shared chrome sits on the same container width", () => {
  for (const file of [
    "src/components/site-header.tsx",
    "src/components/site-footer.tsx",
    "src/components/page-hero.tsx",
    "src/components/extractor/selection-bar.tsx",
  ]) {
    assert.match(
      readSource(file),
      /max-w-\[1600px\]/,
      `${file} should use the shared container width`,
    );
  }
});

await test("ad slots span the full container width", () => {
  const source = readSource("src/components/ad-slot.tsx");
  assert.match(source, /w-full min-h-\[120px\]/);
  assert.ok(!/max-w-\[\d+px\]/.test(source), "ad slots must not be narrower than the container");
});

await test("content cards share one surface treatment", () => {
  const page = readSource("src/app/page.tsx");
  // Every card in the marketing sections is an equal-height flex column.
  const cards = page.match(/flex h-full flex-col rounded-lg border border-border bg-card/g) ?? [];
  assert.ok(cards.length >= 4, `expected uniform cards, found ${cards.length}`);

  const blog = readSource("src/app/blog/page.tsx");
  assert.match(blog, /grid gap-4 sm:grid-cols-2 lg:grid-cols-3/);
});

await test("gallery tiles are uniform across breakpoints", () => {
  const source = readSource("src/components/extractor/extractor.tsx");
  const grid = source.match(/grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5/g) ?? [];
  assert.ok(grid.length >= 1, "gallery grid should use one consistent definition");

  const card = readSource("src/components/extractor/image-card.tsx");
  assert.match(card, /aspect-square/, "tiles must share one aspect ratio");
  assert.match(card, /overflow-hidden whitespace-nowrap/, "tile metadata must stay on one line");
});

console.log(
  `\n${failures.length === 0 ? "PASS" : "FAIL"} ${passed} passed, ${failures.length} failed\n`,
);

if (failures.length > 0) {
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

