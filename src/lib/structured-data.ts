import type { BlogPost } from "./content/blog";
import { FAQ_ENTRIES, blocksToPlainText } from "./content/faq";
import { SITE } from "./site";

const FEATURE_LIST = [
  "Extract images from any public website",
  "Paste raw HTML or CSS to extract images offline",
  "Bulk scan up to five URLs at once",
  "Filter by format (JPG, PNG, SVG, WebP, GIF, ICO, AVIF)",
  "Filter by minimum width, height and file size",
  "Bulk download as a single ZIP archive",
  "Convert raster formats in the browser",
  "No signup required",
  "100% private — no URLs logged",
];

export const webApplicationLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web Browser",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: FEATURE_LIST,
});

export const softwareApplicationLd = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  url: SITE.url,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  softwareVersion: "1.0",
  datePublished: "2026-01-14",
  applicationSubCategory: "WebApplication",
  downloadUrl: SITE.url,
  installUrl: SITE.url,
});

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  description: SITE.tagline,
  sameAs: [SITE.social.x, SITE.social.linkedin, SITE.social.github],
});

export const webSiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/?url={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const faqPageLd = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ENTRIES.map((entry) => ({
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: blocksToPlainText(entry.blocks) },
  })),
});

export const howToLd = () => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to extract images from a website",
  description:
    "Use the free Website Image Extractor to download every image from any website in three steps.",
  totalTime: "PT1M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Paste the website URL",
      text: "Copy the URL of the page you want to extract images from and paste it into the input box on the homepage.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Press Extract",
      text: "The tool scans the page and collects every image reference, including lazy-loaded and CSS background images.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Filter and download",
      text: "Use the filters to narrow down by format, dimensions or file size, then download individually or as a single ZIP.",
    },
  ],
});

export const blogPostingLd = (post: BlogPost) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  dateModified: post.date,
  articleSection: post.tag,
  wordCount: blocksToPlainText(post.body).split(/\s+/).length,
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}/blog/${post.slug}` },
  author: { "@type": "Organization", name: SITE.name, url: SITE.url },
  publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
});

export const breadcrumbLd = (trail: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${SITE.url}${item.path}`,
  })),
});

/**
 * Homepage-only structured data. Organization and WebSite blocks are emitted
 * once, globally, from the root layout — emitting them again here would duplicate
 * them on every visit to the homepage.
 */
export const homeStructuredData = () => [
  webApplicationLd(),
  softwareApplicationLd(),
  faqPageLd(),
  howToLd(),
];
