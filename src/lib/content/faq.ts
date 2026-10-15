import type { ContentBlock } from "./blog";

export interface FaqEntry {
  question: string;
  blocks: ContentBlock[];
}

/**
 * The home-page FAQ. Answers are structured blocks so they can include lists,
 * tables and code samples — and so the FAQPage JSON-LD can be generated from the
 * same source of truth.
 */
export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "Is this website image extractor free to use?",
    blocks: [
      {
        type: "p",
        text: "Yes, our website image extractor is completely free to use. You can extract and download images from any public website with no account or signup required.",
      },
      {
        type: "ul",
        items: [
          "No signup required",
          "No hidden fees",
          "No premium tiers for basic features",
          "No API key requirements",
          "Unlimited extractions",
        ],
      },
    ],
  },
  {
    question: "Does it work on JavaScript-heavy or dynamic websites?",
    blocks: [
      {
        type: "p",
        text: "When you paste a URL, the page is fetched and parsed on the server before we scan it, and the extractor also sweeps the page's hydration payloads — the JSON blobs React, Vue and Angular apps ship with their markup. On top of that it looks for lazy-load attributes (data-src, data-lazy-src), srcset and CSS background images, which is where most standard scrapers fall short.",
      },
      { type: "p", text: "What we handle:" },
      {
        type: "ul",
        items: [
          "Server-rendered markup from React, Vue and Angular apps",
          "Hydration payloads, JSON-LD and inline JSON state",
          "Lazy-loaded images (data-src, data-lazy-src and friends)",
          "Responsive images via srcset and picture sources",
          "CSS background images and inline SVGs",
        ],
      },
      {
        type: "p",
        text: "Note: this applies to the URL and Bulk tabs. The HTML paste tab parses exactly the markup you give it and never executes JavaScript — if you paste static source that does not yet contain images a script would inject client-side, those will not show up.",
      },
    ],
  },
  {
    question: "Can I download multiple images at once in bulk?",
    blocks: [
      {
        type: "p",
        text: "Absolutely. You can select all images and download them in a single ZIP file, or use the filters to narrow the selection first.",
      },
      { type: "p", text: "How to bulk download:" },
      {
        type: "ol",
        items: [
          "Extract images from any URL, HTML or bulk URL set",
          "Use filters to narrow down by format, dimensions or file size",
          "Click “Select all” or pick individual images",
          "Click “Download as ZIP” — the archive is packaged server-side",
        ],
      },
      {
        type: "p",
        text: "Individual failures are skipped rather than failing the whole archive, and the response tells you which images could not be fetched.",
      },
    ],
  },
  {
    question: "Is my data stored or logged when I use this tool?",
    blocks: [
      {
        type: "p",
        text: "No. We do not store, log, or share the URLs you enter or the images you extract. Your usage is 100% private.",
      },
      { type: "p", text: "We do NOT:" },
      {
        type: "ul",
        items: [
          "Store any of your URLs",
          "Log which websites you extract from",
          "Save your extracted images",
          "Track your personal information",
          "Share data with third parties",
          "Retain session data after you close the tool",
        ],
      },
      {
        type: "p",
        text: "The one exception is the temporary ZIP archive, which exists only so a large download can be assembled. It is stored under a random, unguessable key and expires automatically — see the privacy policy for details.",
      },
    ],
  },
  {
    question: "What image formats does the extractor support?",
    blocks: [
      {
        type: "p",
        text: "All major web image formats are detected, including JPG, JPEG, PNG, GIF, WebP, SVG, ICO, AVIF, BMP, TIFF and HEIC.",
      },
      {
        type: "p",
        text: "Format detection works from the file extension in the URL first, then falls back to CDN query-string hints that some image hosts use instead of an extension:",
      },
      {
        type: "code",
        lang: "text",
        text: "https://cdn.example.com/hero.webp        → webp\nhttps://images.example.com/photo?fm=avif  → avif\nhttps://cdn.example.com/render?format=png → png",
      },
      {
        type: "p",
        text: "Once extracted, most raster formats (PNG, JPG, WebP, GIF, AVIF, BMP) can be re-encoded at download time — useful if a page ships WebP but you need PNG or JPG for a downstream tool. SVGs are captured as-is and never run through the raster converter, since converting a vector to pixels would lose that advantage.",
      },
    ],
  },
  {
    question: "Can I extract images from a website URL?",
    blocks: [
      {
        type: "p",
        text: "Yes — extracting images from a website URL is the primary feature. Here is how it works:",
      },
      {
        type: "ol",
        items: [
          "Copy the website URL (for example www.example.com)",
          "Paste it into the extractor and press Extract",
          "Browse every image found, usually within a second or two",
          "Use filters to narrow down by size, format or dimensions",
          "Download individually or grab the selection as one ZIP",
        ],
      },
      {
        type: "p",
        text: "The tool scans the page and identifies every image reference it can resolve, including JPEG, PNG, GIF, WebP, SVG and BMP files.",
      },
    ],
  },
  {
    question: "Can I extract images from HTML code?",
    blocks: [
      {
        type: "p",
        text: "Yes. This is one of the features that sets the tool apart: you can extract images directly from HTML and CSS, which is perfect for developers working with local files, staging environments or code snippets.",
      },
      { type: "p", text: "Simply:" },
      {
        type: "ol",
        items: [
          "Copy your HTML or CSS",
          "Paste it into the HTML code tab",
          "Add an optional base URL so relative paths resolve correctly",
          "Press Extract — results appear instantly",
        ],
      },
      {
        type: "p",
        text: "The markup is parsed locally in your browser with DOMParser, so nothing is uploaded anywhere.",
      },
    ],
  },
  {
    question: "Which websites does the extractor work with?",
    blocks: [
      { type: "p", text: "Virtually any publicly accessible website, including:" },
      {
        type: "ul",
        items: [
          "News and media sites",
          "E-commerce platforms (Amazon, eBay, Shopify stores)",
          "Portfolio and design sites (Behance, Dribbble)",
          "Blog platforms (Medium, WordPress, Tumblr)",
          "Stock photo sites (Unsplash, Pexels, Pixabay)",
          "Any custom or personal website",
        ],
      },
      {
        type: "p",
        text: "Private and internal addresses (localhost, RFC1918 ranges, link-local and cloud metadata endpoints) are refused before any request is made.",
      },
    ],
  },
  {
    question: "Why might image extraction fail?",
    blocks: [
      { type: "p", text: "Extraction occasionally fails for legitimate reasons:" },
      {
        type: "table",
        headers: ["Cause", "What to do"],
        rows: [
          [
            "The website requires a login",
            "Some sites hide images behind paywalls or accounts. Open the page while signed in and paste the page source into the HTML tab.",
          ],
          [
            "The website blocks automated access",
            "Some sites deliberately prevent scraping. Save the images manually, or use the HTML tab with your browser's page source.",
          ],
          [
            "The website is very large or slow",
            "Extremely large pages can time out. Try a more specific URL instead of the homepage.",
          ],
          [
            "Upstream rate limits",
            "Very rapid or large bulk requests can get throttled. Space out large batches, or retry after a short wait.",
          ],
        ],
      },
    ],
  },
  {
    question: "How is this different from other image extractors?",
    blocks: [
      { type: "p", text: "Here is how the tool compares to typical alternatives:" },
      {
        type: "table",
        headers: ["Feature", "This tool", "Others"],
        rows: [
          ["Free forever", "Yes", "Often requires a paid API"],
          ["HTML code input", "Yes", "Rarely supported"],
          ["Bulk URL scanning", "Yes", "Rarely supported"],
          ["Advanced filters", "Yes", "Limited"],
          ["No signup required", "Yes", "Usually requires an account"],
          ["Privacy guaranteed", "Yes — nothing logged", "Data retention unclear"],
          ["Batch download as ZIP", "Yes", "Sometimes, behind a paywall"],
        ],
      },
    ],
  },
  {
    question: "Can I extract images from Pinterest, Instagram or TikTok?",
    blocks: [
      {
        type: "p",
        text: "It depends on the page, and results are less reliable than on a typical website. These platforms require a login to view most content, aggressively rate-limit or block automated requests, and load feeds with client-side scripts that change constantly — so a public pin, profile or post page will sometimes yield images and sometimes return little to nothing.",
      },
      {
        type: "p",
        text: "If a specific page will not extract, the most reliable fallback is to open it in your browser, use “View Page Source” (or the inspector) to copy the relevant HTML, and paste that into the HTML tab instead — you will get whatever images are actually present in the markup your logged-in browser sees.",
      },
      {
        type: "p",
        text: "Whatever the source, always respect copyright, the original creator's rights and the platform's own terms of use.",
      },
    ],
  },
  {
    question: "Do I need an API key or account to use this tool?",
    blocks: [
      { type: "p", text: "No. Zero friction." },
      {
        type: "ul",
        items: [
          "No registration required",
          "No email verification",
          "No API key required",
          "No profile setup",
        ],
      },
      {
        type: "p",
        text: "Whether you are a professional developer or a student doing research, you can start extracting images in about ten seconds — no setup, no delays, no barriers.",
      },
    ],
  },
];

/** Flatten structured answer blocks into plain text, used for JSON-LD output. */
export function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "p":
        case "h2":
        case "h3":
        case "quote":
          return block.text;
        case "ul":
        case "ol":
          return block.items.join(" ");
        case "code":
          return block.text;
        case "table":
          return [block.headers.join(" — "), ...block.rows.map((row) => row.join(" — "))].join(" ");
        default:
          return "";
      }
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}


