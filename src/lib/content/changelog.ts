export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.3.0",
    date: "2026-02-25",
    title: "Stock photo sources and internal-tool cleanup",
    items: [
      "New Stock photos tab: search Unsplash, Pexels and Pixabay by keyword, or derive keywords from a page's own sections.",
      "Stock results use the same gallery, filters and ZIP pipeline; archives that include them ship a credits.txt with the required attribution.",
      "Removed the public-site surface (pricing, blog, contact, legal pages, ads, marketing sections and FAQ).",
      "Every page now shares one full-width container and one card size.",
      "The app is marked noindex and robots.txt disallows crawling.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-02-18",
    title: "Cloudflare R2 archives and installable PWA",
    items: [
      "ZIP archives are now stored in Cloudflare R2 and served from a short-lived, unguessable download URL.",
      "Direct streaming fallback keeps bulk download working when R2 is not configured.",
      "The app is installable: web manifest, offline shell and service worker with a stale-while-revalidate image cache.",
      "New status page reporting which archive backend is active.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-02-04",
    title: "Bulk URLs, dimension filters and format conversion",
    items: [
      "Bulk tab accepts up to five URLs at once and merges the results into one gallery.",
      "Minimum width and height filters alongside the existing format and size filters.",
      "Convert raster formats (PNG, JPG, WebP) in the browser before downloading.",
      "Per-image download and clipboard copy for direct image URLs.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-14",
    title: "First public release",
    items: [
      "URL, HTML and bulk extraction modes.",
      "Lazy-load, srcset, picture, CSS background and inline SVG detection.",
      "Hydration payload sweep for JavaScript-rendered pages.",
      "Gallery with selection, filters and ZIP download.",
      "Strictly monochrome interface with dark mode.",
    ],
  },
];
