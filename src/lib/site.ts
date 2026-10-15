export const SITE = {
  name: "Website Image Extractor",
  shortName: "ImgExtractor",
  tagline: "Extract every image from any website",
  description:
    "Paste a URL or HTML and preview every image on the page, filter by format, size and dimensions, then download them one by one or as a single ZIP. Free, private and instant.",
  url: "https://websiteimagextractor.com",
  email: "hello@websiteimagextractor.com",
  supportEmail: "support@websiteimagextractor.com",
  social: {
    x: "https://x.com/imgextractor",
    linkedin: "https://linkedin.com/company/websiteimagextractor",
    github: "https://github.com/itsmedhruvil/image-downloader",
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Extractor" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/documentation", label: "Docs" },
  { href: "/feature-request", label: "Feature request" },
] as const;

export const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Extractor" },
      { href: "/pricing", label: "Pricing" },
      { href: "/feature-request", label: "Feature request" },
      { href: "/changelog", label: "Changelog" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/documentation", label: "Documentation" },
      { href: "/documentation#api", label: "API reference" },
      { href: "/documentation#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/feature-request", label: "Report an issue" },
      { href: "/privacy", label: "Privacy & cookies" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/privacy", label: "Data handling" },
    ],
  },
] as const;

export interface FaqItem {
  question: string;
  answer: string;
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: "Is this website image extractor free to use?",
    answer:
      "Yes. It is completely free: no account, no signup, no API key and no premium tier gating the core features. Unlimited extractions, unlimited ZIP downloads.",
  },
  {
    question: "Does it work on JavaScript-heavy or dynamic websites?",
    answer:
      "When you paste a URL the page is fetched and parsed on the server, and the extractor sweeps hydration payloads (Next.js, Nuxt, JSON-LD) in addition to the visible markup. On top of that it reads lazy-load attributes (data-src, data-lazy-src), srcset, picture sources, CSS background images and inline SVG — the places basic scrapers miss. The HTML paste tab parses exactly the markup you give it and never executes scripts.",
  },
  {
    question: "Can I download multiple images at once in bulk?",
    answer:
      "Yes. Use the filters to narrow the gallery, hit Select all (or pick images individually), then choose Download as ZIP. The archive is built server-side and either streamed straight to you or stored briefly in Cloudflare R2.",
  },
  {
    question: "Is my data stored or logged when I use this tool?",
    answer:
      "No. URLs you enter and images you extract are not logged, not associated with you and never used for anything else. Generated ZIP archives live in R2 only for a short window (one hour by default) and then expire automatically.",
  },
  {
    question: "What image formats does the extractor support?",
    answer:
      "JPG, JPEG, PNG, GIF, WebP, SVG, ICO, AVIF, BMP, TIFF and HEIC. Format detection uses the file extension first, then falls back to CDN query hints such as ?format=webp. Raster formats can be converted in the browser before download.",
  },
  {
    question: "Can I extract images from HTML code instead of a URL?",
    answer:
      "Yes — that is the HTML tab. Paste raw markup (or CSS) and every image reference is parsed locally in your browser, which is handy for local files, staging environments or code that is not deployed yet.",
  },
  {
    question: "Why might image extraction fail?",
    answer:
      "Some sites require a login, deliberately block automated access, or are simply too large and slow to finish inside the request window. Very rapid repeated requests can also get rate limited upstream. Try a more specific page, use the HTML tab with the page source, or wait a moment and retry.",
  },
  {
    question: "Do I need an API key or account to use this tool?",
    answer:
      "No. There is no registration, no email verification and no profile setup. Paste a link and hit Extract.",
  },
];

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
