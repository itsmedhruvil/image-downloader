export const SITE = {
  name: "Website Image Extractor",
  shortName: "ImgExtractor",
  tagline: "Extract every image from any website",
  description:
    "Paste a URL or HTML and preview every image on the page, filter by format, size and dimensions, then download them one by one or as a single ZIP. Free, private and instant.",
  url: "https://websiteimagextractor.com",
  email: "hello@websiteimagextractor.com",
  supportEmail: "support@websiteimagextractor.com",
  productHunt:
    "https://www.producthunt.com/products/free-website-image-extractor?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-free-website-image-extractor",
  social: {
    x: "https://x.com/imgextractor",
    linkedin: "https://linkedin.com/company/websiteimagextractor",
    github: "https://github.com/itsmedhruvil/image-downloader",
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Extract images" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/documentation", label: "Docs" },
  { href: "/feature-request", label: "Ask for a feature" },
] as const;

export const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/#scraper", label: "Extract images" },
      { href: "/pricing", label: "Pricing" },
      { href: "/blog", label: "Blog" },
      { href: "/documentation", label: "Documentation" },
      { href: "/changelog", label: "Changelog" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/feature-request", label: "Ask for a new feature" },
      { href: "/report-issue", label: "Report an issue" },
      { href: "/imprint", label: "Imprint" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy & cookie policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/sitemap.xml", label: "Sitemap" },
    ],
  },
] as const;

/** Practical tips shown in the card under the extractor. */
export const TIPS = [
  "Paste any website URL to extract every image on the page.",
  "Right-click → View Page Source → paste the HTML instead.",
  "Use the format pills to filter by PNG, JPG, WebP or SVG.",
  "Click any image to select it for download.",
  "Select multiple images and download them as one ZIP.",
] as const;

export const FEATURES = [
  {
    title: "Instant extraction",
    body: "No queues, no waiting rooms. Your page is scanned the moment you hit Extract.",
  },
  {
    title: "Every web format",
    body: "JPG, PNG, WebP, SVG, GIF, ICO, AVIF, BMP, TIFF and HEIC are all detected and previewed.",
  },
  {
    title: "Real filters",
    body: "Narrow by format, minimum width and height, or file size to skip icons and thumbnails.",
  },
  {
    title: "Any public website",
    body: "Works on blogs, storefronts, portfolios and single-page apps alike.",
  },
  {
    title: "Private by design",
    body: "Nothing is logged. Archives are transient and expire on their own.",
  },
  {
    title: "Bulk ZIP download",
    body: "Package a whole selection into one archive, or convert raster formats first.",
  },
] as const;
