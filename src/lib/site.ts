export const SITE = {
  name: "Website Image Extractor",
  shortName: "ImgExtractor",
  tagline: "Internal image extraction tool",
  description:
    "Internal tool for pulling images from a page, pasted HTML, a batch of URLs, or Unsplash / Pexels / Pixabay — then filtering, reviewing and downloading them as a ZIP.",
  /** Set NEXT_PUBLIC_SITE_URL to the internal hostname for absolute URLs. */
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Extractor" },
  { href: "/documentation", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
  { href: "/status", label: "Status" },
  { href: "/feedback", label: "Feedback" },
] as const;

export const FOOTER_LINKS = [
  { href: "/documentation", label: "Docs" },
  { href: "/documentation#api", label: "API" },
  { href: "/documentation#self-hosting", label: "Self-hosting" },
  { href: "/changelog", label: "Changelog" },
  { href: "/status", label: "Status" },
  { href: "/feedback", label: "Feedback" },
] as const;
