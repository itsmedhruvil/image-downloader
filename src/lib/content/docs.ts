import type { ContentBlock } from "./blog";

export interface DocSection {
  id: string;
  title: string;
  summary: string;
  blocks: ContentBlock[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "From a URL to a folder of images in under a minute.",
    blocks: [
      {
        type: "p",
        text: "Website Image Extractor is a free, browser-based tool for pulling every image off a public web page. There is nothing to install and no account to create.",
      },
      {
        type: "ol",
        items: [
          "Paste a page address into the URL field and press Extract (or Enter).",
          "Review the gallery — each tile shows format, dimensions and file size.",
          "Narrow the results with the format, dimension and size filters.",
          "Select the images you want and choose Download as ZIP, or download them one by one.",
        ],
      },
      {
        type: "p",
        text: "Extraction runs entirely in memory. No URL you submit is logged and no image is retained after the request finishes.",
      },
    ],
  },
  {
    id: "extract-from-url",
    title: "Extracting from a URL",
    summary: "What the URL tab finds, and why dynamic pages still work.",
    blocks: [
      {
        type: "p",
        text: "The URL tab fetches the page server-side with browser-like headers, then parses the returned markup. It collects image references from:",
      },
      {
        type: "ul",
        items: [
          "img src, plus lazy-load attributes (data-src, data-lazy-src, data-original, data-cfsrc and friends)",
          "srcset and data-srcset lists, resolved to their individual URLs",
          "picture and video source elements, and video poster frames",
          "CSS background images in style attributes and style blocks",
          "Inline SVG elements, exported as data URIs",
          "link rel=icon and apple-touch-icon, Open Graph and Twitter card images",
          "Absolute image URLs found inside hydration payloads (Next.js, Nuxt, JSON-LD)",
        ],
      },
      {
        type: "p",
        text: "Relative paths are resolved against the document base URL, so protocol-relative and root-relative references behave exactly as they do in a browser.",
      },
      {
        type: "p",
        text: "Private and internal addresses (localhost, RFC1918 ranges, link-local and cloud metadata endpoints) are refused before any request is made.",
      },
    ],
  },
  {
    id: "extract-from-html",
    title: "Extracting from HTML",
    summary: "Paste raw markup and parse it locally in your browser.",
    blocks: [
      {
        type: "p",
        text: "The HTML tab never leaves your device. The markup you paste is parsed with the browser's own DOMParser, using the same detection rules as the server.",
      },
      {
        type: "p",
        text: "This is the right tool for local files, staging environments, code that has not been deployed, or a page that requires a login. Open the page in your browser, choose View Page Source, copy everything and paste it in.",
      },
      {
        type: "p",
        text: "Because no script is executed, images that only appear after client-side JavaScript runs will not be found here. Add an optional base URL if the markup uses relative paths, so they can be resolved correctly.",
      },
    ],
  },
  {
    id: "bulk-extraction",
    title: "Bulk extraction",
    summary: "Scan up to five pages at once and merge the results.",
    blocks: [
      {
        type: "p",
        text: "The Bulk tab accepts one URL per line (commas work too). Up to five pages are scanned in parallel and merged into a single gallery, with duplicates removed.",
      },
      {
        type: "p",
        text: "If one URL fails — a 404, a timeout, a blocked host — the others still complete. The failure is reported as a warning above the gallery instead of aborting the batch.",
      },
      {
        type: "code",
        lang: "text",
        text: "https://example.com\nhttps://example.com/pricing\nexample.org/gallery",
      },
    ],
  },
  {
    id: "filters",
    title: "Filtering results",
    summary: "Cut icons and tracking pixels out of the gallery.",
    blocks: [
      {
        type: "table",
        headers: ["Filter", "What it does"],
        rows: [
          ["Format", "Restrict the gallery to PNG, JPG, WebP, SVG, GIF, ICO, AVIF, BMP, TIFF or HEIC."],
          ["Min width", "Hide anything narrower than the threshold — great for skipping icons."],
          ["Min height", "The same idea vertically; combine both for meaningful content only."],
          ["Min size", "Skip tiny tracking pixels and spacer images by file size."],
        ],
      },
      {
        type: "p",
        text: "Filters apply instantly to the images already in memory, so changing them never triggers a new request. Dimensions are measured as each preview loads.",
      },
    ],
  },
  {
    id: "formats",
    title: "Formats and conversion",
    summary: "Download in the format your next tool expects.",
    blocks: [
      {
        type: "p",
        text: "Format detection checks the file extension first, then falls back to CDN query hints such as ?format=webp or ?fm=jpg, and finally to the mime type for data URIs.",
      },
      {
        type: "p",
        text: "Raster images (PNG, JPG, WebP, GIF, AVIF, BMP) can be re-encoded in the browser at download time. Vector SVG files are always delivered untouched, because rasterising them would destroy the reason to use SVG in the first place.",
      },
      {
        type: "p",
        text: "Conversions happen locally with the Canvas API — your image never has to leave the browser to change format.",
      },
    ],
  },
  {
    id: "zip-downloads",
    title: "ZIP downloads and storage",
    summary: "How bulk archives are built, stored and expired.",
    blocks: [
      {
        type: "p",
        text: "Selecting Download as ZIP sends the list of chosen URLs to the server, which fetches them concurrently and packages them into a single archive. Individual failures are skipped and reported rather than failing the whole archive.",
      },
      { type: "p", text: "Where the archive lives depends on configuration:" },
      {
        type: "table",
        headers: ["Backend", "Behaviour"],
        rows: [
          [
            "Cloudflare R2",
            "The archive is stored under a random key and served from a short-lived download URL (one hour by default).",
          ],
          [
            "No storage configured",
            "The archive is streamed straight back in the same response — nothing is persisted at all.",
          ],
        ],
      },
      {
        type: "p",
        text: "Limits per request: 400 images, 30 MB per image and 150 MB total, with a 20 second timeout per download.",
      },
    ],
  },
  {
    id: "api",
    title: "API reference",
    summary: "Four JSON endpoints power the whole interface.",
    blocks: [
      {
        type: "table",
        headers: ["Endpoint", "Method", "Purpose"],
        rows: [
          ["/api/extract", "POST", "Scan a URL, a batch of URLs, or pasted markup and return the image list."],
          ["/api/proxy", "GET", "Stream an image through the server so hotlink-protected assets preview correctly."],
          ["/api/zip", "POST", "Fetch the selected images and return a ZIP archive (stored or streamed)."],
          ["/api/download/[...key]", "GET", "Stream a previously stored archive from R2."],
        ],
      },
      {
        type: "code",
        lang: "bash",
        text: 'curl -X POST https://websiteimagextractor.com/api/extract \\\n  -H "content-type: application/json" \\\n  -d \'{"method":"url","url":"https://example.com"}\'',
      },
      {
        type: "code",
        lang: "json",
        text: '{\n  "images": [\n    {\n      "url": "https://example.com/hero.webp",\n      "format": "webp",\n      "name": "Hero image",\n      "source": "srcset",\n      "crossOrigin": false\n    }\n  ],\n  "resolvedUrl": "https://example.com/",\n  "title": "Example Domain",\n  "pagesScanned": 1,\n  "warnings": [],\n  "durationMs": 412\n}',
      },
      {
        type: "code",
        lang: "bash",
        text: 'curl -X POST https://websiteimagextractor.com/api/zip \\\n  -H "content-type: application/json" \\\n  -d \'{"images":[{"url":"https://example.com/hero.webp","name":"hero"}]}\' \\\n  -o images.zip',
      },
      {
        type: "p",
        text: "When R2 is configured the ZIP endpoint answers with JSON describing the stored archive; otherwise it answers with the archive itself and a Content-Disposition header.",
      },
    ],
  },
  {
    id: "self-hosting",
    title: "Self-hosting",
    summary: "Deploy to Vercel in a few minutes, all on free tiers.",
    blocks: [
      {
        type: "ol",
        items: [
          "Fork or clone the repository and import it into Vercel.",
          "Vercel detects Next.js automatically — no build settings to change.",
          "Optionally create a Cloudflare R2 bucket and add the environment variables below.",
          "Deploy. Everything except R2 runs on free tiers.",
        ],
      },
      {
        type: "table",
        headers: ["Variable", "Required", "Purpose"],
        rows: [
          ["R2_ACCOUNT_ID", "No", "Cloudflare account id used to build the R2 endpoint."],
          ["R2_ACCESS_KEY_ID", "No", "R2 API token access key id."],
          ["R2_SECRET_ACCESS_KEY", "No", "R2 API token secret."],
          ["R2_BUCKET", "No", "Bucket that holds generated archives."],
          ["R2_ENDPOINT", "No", "Override the S3 endpoint (MinIO or other S3-compatible stores)."],
          ["R2_ZIP_TTL_SECONDS", "No", "Archive lifetime in seconds (default 3600)."],
          ["FETCH_USER_AGENT", "No", "Override the outbound user agent."],
          ["NEXT_PUBLIC_ADSENSE_CLIENT", "No", "AdSense publisher id; unset renders placeholders."],
          ["NEXT_PUBLIC_ADSENSE_SLOT", "No", "Default AdSense ad-unit slot id."],
        ],
      },
      {
        type: "code",
        lang: "bash",
        text: "npm install\nnpm run dev     # http://localhost:3000\nnpm run build   # production build\nnpm start       # serve the production build",
      },
      {
        type: "p",
        text: "Add an R2 lifecycle rule on the bucket to delete everything under the zips/ prefix after a day, as a backstop for archives that are generated but never downloaded.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "What to do when a page returns nothing.",
    blocks: [
      {
        type: "table",
        headers: ["Symptom", "Likely cause", "Fix"],
        rows: [
          ["No images found", "The page needs a login", "Open the page while signed in and paste the page source into the HTML tab."],
          ["Extraction times out", "The site is very large or slow", "Try a more specific page instead of the homepage."],
          ["HTTP 403 from the site", "Automated access is blocked", "Use the HTML tab with the page source from your browser."],
          ["Previews are broken", "The host blocks hotlinking", "Previews are proxied automatically; if a tile still fails, the file is no longer available."],
          ["ZIP download is partial", "Some images could not be fetched", "The response reports which ones were skipped; retry those individually."],
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Short answers to the questions we get most.",
    blocks: [
      { type: "p", text: "Is it really free? Yes — no account, no API key, no paid tier for the core features." },
      { type: "p", text: "Do you keep my URLs? No. Submissions are processed in memory and never logged." },
      {
        type: "p",
        text: "Does it handle JavaScript-heavy sites? It handles server-rendered markup plus hydration payloads. Pages that build their image list purely from client-side fetches are best handled with the HTML tab.",
      },
      {
        type: "p",
        text: "Can I use it commercially? The tool is free to use; the images you extract are still subject to their owners' licences.",
      },
    ],
  },
];

export function getDocSection(id: string): DocSection | undefined {
  return DOC_SECTIONS.find((section) => section.id === id);
}


