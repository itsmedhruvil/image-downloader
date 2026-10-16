/**
 * Content, layout and internal-tool invariants.
 *
 *   npm run test:content
 */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

import { CHANGELOG } from "../src/lib/content/changelog";
import { DOC_SECTIONS } from "../src/lib/content/docs";
import { FOOTER_LINKS, NAV_LINKS, SITE } from "../src/lib/site";

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

/** Every route that has a page in the app directory. */
function routeExists(href: string): boolean {
  const clean = href.split("#")[0]?.split("?")[0] ?? "";
  if (clean === "/") return existsSync("src/app/page.tsx");
  return existsSync(`src/app${clean}/page.tsx`);
}

console.log("\nInternal-tool surface");

await test("no public marketing pages remain", () => {
  for (const removed of [
    "pricing",
    "blog",
    "contact",
    "privacy",
    "terms",
    "disclaimer",
    "imprint",
    "report-issue",
    "feature-request",
  ]) {
    assert.equal(
      existsSync(`src/app/${removed}`),
      false,
      `src/app/${removed} should have been removed for an internal tool`,
    );
  }
});

await test("no marketing modules or ad plumbing remain", () => {
  for (const file of [
    "src/components/ad-slot.tsx",
    "src/components/stats-row.tsx",
    "src/components/accordion-faq.tsx",
    "src/components/json-ld.tsx",
    "src/lib/structured-data.ts",
    "src/lib/activity-stats.ts",
    "src/lib/content/blog.ts",
    "src/lib/content/faq.ts",
    "src/app/sitemap.ts",
    "src/app/rss.xml",
  ]) {
    assert.equal(existsSync(file), false, `${file} should have been removed`);
  }
});

await test("every navigation and footer link resolves to a real route", () => {
  for (const link of [...NAV_LINKS, ...FOOTER_LINKS]) {
    assert.ok(routeExists(link.href), `${link.href} (${link.label}) has no page`);
  }
});

await test("the app opts out of search indexing", () => {
  const layout = readSource("src/app/layout.tsx");
  assert.match(layout, /robots:\s*{\s*index:\s*false/);

  const robots = readSource("src/app/robots.ts");
  assert.match(robots, /disallow:\s*"\/"/);
});

await test("no marketing copy is left in the UI", () => {
  const offenders: string[] = [];
  for (const file of [...walk("src/app"), ...walk("src/components")]) {
    const source = readSource(file);
    for (const phrase of [
      "100% free",
      "Free forever",
      "free forever",
      "No signup required",
      "no signup required",
      "Product Hunt",
      "Ad Space",
      "Requires a paid API",
      "premium tier",
    ]) {
      if (source.includes(phrase)) offenders.push(`${file}: ${phrase}`);
    }
  }
  assert.deepEqual(offenders, []);
});

await test("the site identity describes an internal tool", () => {
  assert.match(SITE.tagline, /internal/i);
  assert.ok(!("social" in SITE), "internal tools do not need social links");
  assert.ok(!("productHunt" in SITE));
});

console.log("\nLayout uniformity");

await test("no page uses a legacy narrow container width", () => {
  const offenders: string[] = [];
  for (const file of walk("src/app")) {
    for (const match of readSource(file).matchAll(/max-w-(?!\[1600px\]|full)[a-z0-9[\]/.-]+/g)) {
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
    const source = readSource(file);
    // Either the Container component (single source of truth) or its exact class.
    assert.ok(
      source.includes('from "@/components/container"') || source.includes("max-w-[1600px]"),
      `${file} must use the shared container width`,
    );
  }
});

await test("content cards share one surface treatment", () => {
  const card = readSource("src/components/container.tsx");
  assert.match(card, /CARD_CLASS/);
  assert.match(card, /CARD_GRID_CLASS/);

  const feedback = readSource("src/app/feedback/page.tsx");
  assert.match(feedback, /grid gap-8 lg:grid-cols-2/);
});

await test("gallery tiles are uniform across breakpoints", () => {
  const source = readSource("src/components/extractor/extractor.tsx");
  assert.match(source, /grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5/);

  const card = readSource("src/components/extractor/image-card.tsx");
  assert.match(card, /aspect-square/);
  assert.match(card, /overflow-hidden whitespace-nowrap/);
});

console.log("\nDocs and changelog");

await test("documentation covers the operational essentials", () => {
  const ids = DOC_SECTIONS.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "section ids must be unique");
  for (const required of ["getting-started", "api", "self-hosting", "troubleshooting"]) {
    assert.ok(ids.includes(required), `missing docs section: ${required}`);
  }
});

await test("documented API endpoints match the real routes", () => {
  const apiSection = DOC_SECTIONS.find((section) => section.id === "api");
  const table = apiSection?.blocks.find((block) => block.type === "table");
  assert.ok(table && table.type === "table", "the API section needs an endpoint table");

  for (const row of table.rows) {
    const endpoint = row[0] ?? "";
    if (!endpoint.startsWith("/api/")) continue;
    const path = endpoint.replace(/^\/api\//, "");
    assert.ok(
      existsSync(`src/app/api/${path}/route.ts`),
      `documented endpoint ${endpoint} has no route`,
    );
  }
});

await test("the changelog is ordered newest first", () => {
  const dates = CHANGELOG.map((entry) => entry.date);
  assert.deepEqual([...dates].sort((a, b) => b.localeCompare(a)), dates);
  assert.ok(CHANGELOG.every((entry) => entry.items.length > 0));
});

console.log(
  `\n${failures.length === 0 ? "PASS" : "FAIL"} ${passed} passed, ${failures.length} failed\n`,
);

if (failures.length > 0) {
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
