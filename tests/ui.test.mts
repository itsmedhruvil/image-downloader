/**
 * Client-side interaction tests for the extractor UI.
 *
 * Runs the real React components inside jsdom, so the gallery, filters,
 * selection, preview dialog and ZIP request path are executed rather than
 * assumed. Run with `npm run test:ui`.
 */

import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

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
    const detail = error instanceof Error ? error.message : String(error);
    const lines = detail
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);
    console.log(lines.map((line) => `       ${line}`).join("\n") || "       (no message)");
    // React's act() wraps handler failures in an AggregateError.
    const nested = (error as { errors?: unknown[] })?.errors;
    if (Array.isArray(nested)) {
      for (const inner of nested.slice(0, 3)) {
        const message = inner instanceof Error ? inner.message : String(inner);
        console.log(`       cause: ${message.split("\n")[0]?.slice(0, 240) ?? ""}`);
      }
    }
  } finally {
    // Without a test-runner, auto-cleanup does not fire — reset between tests.
    try {
      const { cleanup } = await import("@testing-library/react");
      cleanup();
    } catch {
      /* first call happens before the library is imported */
    }
    if (typeof document !== "undefined") document.body.innerHTML = "";
  }
}

// ---------------------------------------------------------------------------
// jsdom environment (must exist before React is imported)
// ---------------------------------------------------------------------------

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
  url: "http://localhost:3000/",
  pretendToBeVisual: true,
});

const win = dom.window as unknown as Window & typeof globalThis;
const globals = globalThis as unknown as Record<string, unknown>;

// Expose the DOM globals that React and Radix expect.
for (const key of Object.getOwnPropertyNames(win)) {
  if (key in globals) continue;
  try {
    globals[key] = (win as unknown as Record<string, unknown>)[key];
  } catch {
    /* some window properties are getter-only */
  }
}
globals.window = win;
globals.document = win.document;
globals.self = win;
// navigator is a getter-only global in modern Node.
Object.defineProperty(globalThis, "navigator", {
  value: win.navigator,
  configurable: true,
  writable: true,
});

// Node 24 defines its own Event/CustomEvent/EventTarget globals. jsdom's
// dispatchEvent rejects events built from those, so force the jsdom classes.
for (const key of [
  "Event",
  "CustomEvent",
  "EventTarget",
  "MessageEvent",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "InputEvent",
  "DOMException",
]) {
  const value = (win as unknown as Record<string, unknown>)[key];
  if (value !== undefined) globals[key] = value;
}

// Polyfills Radix primitives need under jsdom.
win.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof win.matchMedia;
globals.matchMedia = win.matchMedia;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globals.ResizeObserver = ResizeObserverStub;
(win as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverStub;

const elementProto = win.HTMLElement.prototype as unknown as Record<string, unknown>;
elementProto.scrollIntoView = () => {};
elementProto.hasPointerCapture = () => false;
elementProto.setPointerCapture = () => {};
elementProto.releasePointerCapture = () => {};
// jsdom has no PointerEvent; mouse events are close enough for Radix.
globals.PointerEvent = win.PointerEvent ?? win.MouseEvent;
globals.IS_REACT_ACT_ENVIRONMENT = true;

// Downloads create and click an anchor; keep jsdom from attempting navigation.
win.HTMLAnchorElement.prototype.click = function click() {};

// A minimal clipboard so "Copy URL" can be exercised.
const clipboard: string[] = [];
Object.defineProperty(win.navigator, "clipboard", {
  value: {
    writeText: async (text: string) => {
      clipboard.push(text);
    },
  },
  configurable: true,
});

interface FetchCall {
  url: string;
  body: unknown;
}

const fetchCalls: FetchCall[] = [];

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

globals.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  fetchCalls.push({ url, body });

  if (url.includes("/api/proxy?meta=1")) {
    return jsonResponse({ size: 2048, contentType: "image/png" });
  }
  if (url.includes("/api/zip")) {
    return jsonResponse({
      downloadUrl: "/api/download/zips/test.zip",
      filename: "website-images-test.zip",
      size: 4096,
      stored: true,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      skipped: [],
    });
  }
  if (url.includes("/api/extract")) {
    return jsonResponse({
      images: [
        {
          url: "https://cdn.example.com/from-server.jpg",
          format: "jpg",
          name: "Server image",
          source: "img",
          crossOrigin: true,
        },
      ],
      resolvedUrl: "https://example.com/",
      title: "Mocked page",
      pagesScanned: 1,
      warnings: [],
      durationMs: 12,
    });
  }
  return jsonResponse({ error: "unexpected request" }, 500);
}) as unknown as typeof fetch;

// ---------------------------------------------------------------------------
// Components (imported after the environment is ready)
// ---------------------------------------------------------------------------

const React = (await import("react")).default;
const { render, screen, fireEvent, waitFor, cleanup } = await import("@testing-library/react");
const { Extractor } = await import("../src/components/extractor/extractor");
const { ThemeToggle, THEME_INIT_SCRIPT } = await import("../src/components/theme-toggle");
const { TooltipProvider } = await import("../src/components/ui/tooltip");

/** Mirrors the provider composition from the root layout. */
function withProviders(node: React.ReactElement) {
  return React.createElement(TooltipProvider, { delayDuration: 0, children: node });
}

const MARKUP = `<img src="/a.png" alt="Alpha image">
<img src="/b.jpg" alt="Beta image">
<img src="/c.webp" alt="Gamma image">
<div style="background:url(/d.png)"></div>`;

/** Normalised text of the rendered document, for aggregate labels split across nodes. */
function bodyText(): string {
  return (win.document.body.textContent ?? "").replace(/\s+/g, " ");
}

function assertText(fragment: string) {
  assert.ok(
    bodyText().includes(fragment),
    `expected rendered text to include "${fragment}" but got: ${bodyText().slice(0, 240)}`,
  );
}

/** Radix tabs activate on mousedown, so dispatch that before the click. */
function activateTab(name: RegExp) {
  const tab = screen.getByRole("tab", { name });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
}

async function renderExtractor() {
  const result = render(withProviders(React.createElement(Extractor, { storage: "stream" })));
  activateTab(/html code/i);
  const textarea = await screen.findByRole("textbox", { name: /html or css to scan/i });
  fireEvent.change(textarea, { target: { value: MARKUP } });
  fireEvent.click(screen.getByRole("button", { name: /^extract$/i }));
  await screen.findByText("Alpha image");
  return result;
}

console.log("\nExtractor UI (jsdom)");

await test("HTML paste mode renders a gallery for every extracted image", async () => {
  await renderExtractor();
  assert.ok(screen.getByText("Alpha image"));
  assert.ok(screen.getByText("Beta image"));
  assert.ok(screen.getByText("Gamma image"));
  // The CSS background image has no alt text, so it is labelled by filename.
  assert.ok(screen.getByText("d.png"));
  assertText("4 images extracted");
  cleanup();
});

await test("format filters narrow the gallery", async () => {
  await renderExtractor();
  assertText("Showing 4 of 4 images");

  fireEvent.click(screen.getByRole("button", { name: /^PNG · 2$/ }));
  await waitFor(() => assertText("Showing 2 of 4 images"));
  assert.ok(screen.getByText("Alpha image"));
  assert.equal(screen.queryByText("Beta image"), null);

  fireEvent.click(screen.getByRole("button", { name: /^JPG · 1$/ }));
  await waitFor(() => assertText("Showing 3 of 4 images"));
  cleanup();
});

await test("select all then ZIP posts exactly the selected images", async () => {
  await renderExtractor();
  fetchCalls.length = 0;

  fireEvent.click(screen.getByRole("button", { name: /select all/i }));
  await waitFor(() => assert.ok(screen.getByText("4 selected")));

  fireEvent.click(screen.getByRole("button", { name: /download as zip/i }));

  await waitFor(() => {
    const call = fetchCalls.find((entry) => entry.url.includes("/api/zip"));
    assert.ok(call, "a ZIP request should have been made");
    const body = call.body as { images: { url: string }[] };
    assert.equal(body.images.length, 4);
    assert.deepEqual(
      body.images.map((image) => image.url).sort(),
      [
        "http://localhost:3000/a.png",
        "http://localhost:3000/b.jpg",
        "http://localhost:3000/c.webp",
        "http://localhost:3000/d.png",
      ].sort(),
    );
  });
  cleanup();
});

await test("selection is cleared when a new extraction runs", async () => {
  await renderExtractor();
  fireEvent.click(screen.getByRole("button", { name: /select all/i }));
  await waitFor(() => assert.ok(screen.getByText("4 selected")));

  const textarea = screen.getByRole("textbox", { name: /html or css to scan/i });
  fireEvent.change(textarea, { target: { value: '<img src="/only.png" alt="Only one">' } });
  fireEvent.click(screen.getByRole("button", { name: /^extract$/i }));
  await screen.findByText("Only one");
  await waitFor(() => assert.ok(screen.getByText("0 selected")));
  cleanup();
});

await test("URL mode renders images returned by the API", async () => {
  render(withProviders(React.createElement(Extractor, { storage: "r2" })));
  const input = screen.getByRole("textbox", { name: /website url/i });
  fireEvent.change(input, { target: { value: "example.com" } });
  fireEvent.click(screen.getByRole("button", { name: /extract/i }));

  await screen.findByText("Server image");
  assertText("1 image extracted");
  assertText("Mocked page");
  assertText("ZIP via Cloudflare R2");
  cleanup();
});

await test("preview dialog shows the image URL and download action", async () => {
  await renderExtractor();
  fireEvent.click(screen.getAllByRole("button", { name: /preview this image/i })[0]!);

  await waitFor(() => assert.ok(screen.getByRole("dialog")));
  assert.ok(screen.getByText("http://localhost:3000/a.png"));
  assert.ok(screen.getByRole("button", { name: /download image/i }));
  assert.ok(screen.getByRole("button", { name: /add to selection/i }));
  cleanup();
});

await test("copy URL writes the image URL to the clipboard", async () => {
  clipboard.length = 0;
  await renderExtractor();
  fireEvent.click(screen.getAllByRole("button", { name: /copy image url/i })[0]!);
  await waitFor(() => assert.equal(clipboard[0], "http://localhost:3000/a.png"));
  cleanup();
});

await test("per-card selection toggles the selected counter", async () => {
  await renderExtractor();
  assert.ok(screen.getByText("0 selected"));
  fireEvent.click(screen.getAllByRole("checkbox")[0]!);
  await waitFor(() => assert.ok(screen.getByText("1 selected")));
  cleanup();
});

await test("empty markup reports that nothing was found", async () => {
  render(withProviders(React.createElement(Extractor, { storage: "stream" })));
  activateTab(/html code/i);
  const textarea = await screen.findByRole("textbox", { name: /html or css to scan/i });
  fireEvent.change(textarea, { target: { value: "<p>no images here</p>" } });
  fireEvent.click(screen.getByRole("button", { name: /^extract$/i }));
  await screen.findByText(/no images found/i);
  cleanup();
});

console.log("\nTheme");

await test("theme bootstrap script applies the stored preference", () => {
  win.localStorage.setItem("wie-theme", "dark");
  win.eval(THEME_INIT_SCRIPT);
  assert.equal(win.document.documentElement.classList.contains("dark"), true);

  win.localStorage.setItem("wie-theme", "light");
  win.eval(THEME_INIT_SCRIPT);
  assert.equal(win.document.documentElement.classList.contains("dark"), false);
});

await test("theme toggle exposes light, dark and system choices", async () => {
  render(withProviders(React.createElement(ThemeToggle)));
  const trigger = screen.getByRole("button", { name: /change colour theme/i });
  trigger.focus();
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  await waitFor(() => assert.ok(screen.getByText("Dark")));
  assert.ok(screen.getByText("Light"));
  assert.ok(screen.getByText("System"));
  cleanup();
});

console.log(
  `\n${failures.length === 0 ? "PASS" : "FAIL"} ${passed} passed, ${failures.length} failed\n`,
);

if (failures.length > 0) {
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}


