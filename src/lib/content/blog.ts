export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang?: string; text: string }
  | { type: "quote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
  tag: string;
  body: ContentBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-download-all-images-from-a-website",
    title: "How to download all images from a website",
    description:
      "A practical walkthrough of pulling every image off a page — including lazy-loaded ones — and packaging them into a single ZIP.",
    date: "2026-01-14",
    readingMinutes: 6,
    tag: "Guide",
    body: [
      {
        type: "p",
        text: "Right-clicking 200 images one at a time is not a workflow, it is a punishment. Here is the fast path from a URL to a tidy ZIP of assets.",
      },
      { type: "h2", text: "1. Paste the URL" },
      {
        type: "p",
        text: "Drop the page address into the Extractor and hit Extract. The page is fetched server-side with browser-like headers, so sites that block bare scrapers still usually respond.",
      },
      { type: "h2", text: "2. Understand what gets found" },
      { type: "p", text: "The extractor does not stop at an img src. It also resolves:" },
      {
        type: "ul",
        items: [
          "Lazy-load attributes such as data-src, data-lazy-src and data-original",
          "srcset and picture sources, deduplicated down to the actual URLs",
          "CSS background images, from both style attributes and style blocks",
          "Inline SVG elements, converted to data URIs",
          "Open Graph, Twitter card and icon links",
        ],
      },
      { type: "h2", text: "3. Filter before you download" },
      {
        type: "p",
        text: "Set a minimum width and height to drop favicons and tracking pixels, or restrict the gallery to a single format. Filtering happens instantly in the browser — no re-scan required.",
      },
      { type: "h2", text: "4. Select and ZIP" },
      {
        type: "p",
        text: "Click images to select them, or use Select all. Download as ZIP fetches each image server-side and packages them into one archive. Failures are reported per image instead of breaking the whole batch.",
      },
      { type: "h2", text: "A note on etiquette" },
      {
        type: "p",
        text: "Extracting images for reference, research or audit is normal. Republishing someone else's photography is not. Check the licence on the source site before you ship anything you did not create.",
      },
    ],
  },
  {
    slug: "why-lazy-loaded-images-break-scrapers",
    title: "Why lazy-loaded images break most scrapers",
    description:
      "Modern pages keep image URLs in attributes and hydration payloads rather than in src. Here is how to read all of them.",
    date: "2026-01-22",
    readingMinutes: 5,
    tag: "Engineering",
    body: [
      {
        type: "p",
        text: "A naive extractor grabs every src attribute and calls it a day. On a modern storefront that returns a handful of placeholder gifs.",
      },
      { type: "h2", text: "The placeholder problem" },
      {
        type: "p",
        text: "Lazy loading swaps the real URL into src only when the image scrolls into view. Until then the real value sits in a data-* attribute. Frameworks differ wildly in naming, so a robust extractor keeps a candidate list:",
      },
      {
        type: "code",
        lang: "html",
        text: '<img\n  src="data:image/gif;base64,R0lGOD..."\n  data-src="/media/hero@2x.webp"\n  data-srcset="/media/hero.webp 1x, /media/hero@2x.webp 2x"\n  alt="Product hero"\n/>',
      },
      { type: "h2", text: "srcset is a list, not a URL" },
      {
        type: "p",
        text: "A srcset value contains multiple URLs separated by commas with width or density descriptors. Split on commas, keep the first token of each part, and resolve relative paths against the document base.",
      },
      { type: "h2", text: "Hydration payloads are a goldmine" },
      {
        type: "p",
        text: "Server-rendered apps often serialise their entire data tree into a script tag. A single regex sweep for absolute image URLs across the document catches gallery items that never made it into the DOM.",
      },
      { type: "h2", text: "Backgrounds and vectors" },
      {
        type: "p",
        text: "Do not forget CSS: url(...) references in style attributes and stylesheets are images too, and inline SVG deserves to be exported as a real, downloadable file.",
      },
    ],
  },
  {
    slug: "web-image-formats-explained",
    title: "Web image formats explained: JPEG, PNG, WebP, AVIF and SVG",
    description:
      "Which format to keep, which to convert, and what each one costs you in bytes and fidelity.",
    date: "2026-02-03",
    readingMinutes: 7,
    tag: "Reference",
    body: [
      {
        type: "p",
        text: "Auditing a page's images usually raises the same question: is this the right format for the job? A quick field guide.",
      },
      { type: "h2", text: "JPEG — the safe default for photos" },
      {
        type: "p",
        text: "Lossy, universally supported, no transparency. For photographic content it still wins on compatibility.",
      },
      { type: "h2", text: "PNG — lossless and transparent" },
      {
        type: "p",
        text: "Perfect for screenshots, UI assets and anything needing an alpha channel. File sizes balloon on photographic content.",
      },
      { type: "h2", text: "WebP — the pragmatic middle" },
      {
        type: "p",
        text: "Roughly 25–35% smaller than JPEG at comparable quality, with transparency support. Supported by every current browser.",
      },
      { type: "h2", text: "AVIF — the smallest, with caveats" },
      {
        type: "p",
        text: "Excellent compression, but encoding is slow and older tooling chokes on it. Great for delivery, occasionally awkward for a design pipeline.",
      },
      { type: "h2", text: "SVG — vectors, not pixels" },
      {
        type: "p",
        text: "Resolution independent and tiny for logos and icons. Never convert an SVG to a raster format unless you genuinely need pixels: you lose the scalability that made it valuable.",
      },
      { type: "h2", text: "Practical advice" },
      {
        type: "ul",
        items: [
          "Keep SVG as SVG — it is already optimal.",
          "Convert WebP to PNG or JPEG only when a downstream tool demands it.",
          "Prefer WebP over JPEG for delivery when every target browser is modern.",
          "Watch dimensions, not just format: a 4000px-wide JPEG is the real problem.",
        ],
      },
    ],
  },
  {
    slug: "building-a-privacy-first-web-tool",
    title: "Building a privacy-first web tool",
    description:
      "How the extractor keeps URL handling, previews and archive storage free of logs and long-lived data.",
    date: "2026-02-18",
    readingMinutes: 5,
    tag: "Engineering",
    body: [
      {
        type: "p",
        text: "A tool that reads arbitrary URLs could learn a lot about you. It should not. Here is the design that keeps that promise.",
      },
      { type: "h2", text: "Nothing about you is persisted" },
      {
        type: "p",
        text: "URLs you submit are processed in memory and discarded when the response is written. There is no database of submissions and no per-user history.",
      },
      { type: "h2", text: "Previews are proxied, not archived" },
      {
        type: "p",
        text: "Image previews are streamed through the server purely so hotlink-protected assets render. Nothing is written to disk.",
      },
      { type: "h2", text: "Archives expire by design" },
      {
        type: "p",
        text: "ZIP archives are the one thing that touches storage, because packaging hundreds of images needs somewhere to live briefly. They are written to Cloudflare R2 under a random key with a one-hour lifetime, and an R2 lifecycle rule deletes anything older automatically.",
      },
      {
        type: "code",
        lang: "ts",
        text: "// archives are addressed by an unguessable key and never listed publicly\nconst key = `zips/${Date.now()}-${random}-${filename}`;",
      },
      { type: "h2", text: "No third-party analytics in the hot path" },
      {
        type: "p",
        text: "The extractor itself does not depend on any tracking script to function, which also means it keeps working when a content blocker is active.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

