import * as cheerio from "cheerio";

import { finalizeCandidates, parseCssUrls, type RawCandidate } from "./extract.core";
import type { ExtractedImage } from "./types";

/** Attributes commonly used for lazy-loaded images, in rough priority order. */
const IMG_URL_ATTRIBUTES = [
  "src",
  "data-src",
  "data-lazy-src",
  "data-original",
  "data-original-src",
  "data-image",
  "data-img",
  "data-thumb",
  "data-cfsrc",
  "data-hi-res-src",
  "data-large-src",
];

const SRCSET_ATTRIBUTES = ["srcset", "data-srcset", "data-lazy-srcset", "imagesrcset"];

const IMAGE_URL_REGEX =
  /https?:\/\/[^\s"'<>()\\]+?\.(?:jpe?g|png|webp|svg|gif|ico|avif|bmp|tiff?|heic)(?:\?[^\s"'<>()\\]*)?/gi;

/** Build a data URI for an inline <svg> element so it can be previewed/downloaded. */
function svgToDataUri(outerHtml: string): string | null {
  const trimmed = outerHtml.trim();
  if (!trimmed.toLowerCase().startsWith("<svg")) return null;
  if (trimmed.length > 200_000) return null;
  const withNamespace = trimmed.includes("xmlns=")
    ? trimmed
    : trimmed.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNamespace)}`;
}

/**
 * Walk the markup and collect every raw image reference we can find, including
 * lazy-load attributes, srcset/sizes pairs, CSS background images, inline SVG
 * and social/meta image declarations.
 */
export function collectCandidates(html: string, documentUrl: string): RawCandidate[] {
  const $ = cheerio.load(html);
  const candidates: RawCandidate[] = [];

  // <base href> wins over the document URL when resolving relative paths.
  const baseHref = $("base[href]").first().attr("href");
  let base = documentUrl;
  if (baseHref) {
    try {
      base = new URL(baseHref, documentUrl).toString();
    } catch {
      base = documentUrl;
    }
  }

  $("img").each((_, element) => {
    const node = $(element);
    const alt = node.attr("alt") ?? undefined;
    let pushed = false;

    for (const attribute of IMG_URL_ATTRIBUTES) {
      const value = node.attr(attribute);
      if (value && value.trim()) {
        candidates.push({ value, source: attribute === "src" ? "img" : "lazy", alt });
        pushed = true;
      }
    }

    for (const attribute of SRCSET_ATTRIBUTES) {
      const value = node.attr(attribute);
      if (value && value.trim()) {
        candidates.push({ value, source: "srcset", alt });
        pushed = true;
      }
    }

    if (!pushed) {
      const style = node.attr("style");
      if (style) {
        for (const url of parseCssUrls(style)) {
          candidates.push({ value: url, source: "css-background", alt });
        }
      }
    }
  });

  // <source> children of <picture> / <video>.
  $("picture source, video source").each((_, element) => {
    const node = $(element);
    for (const attribute of SRCSET_ATTRIBUTES) {
      const value = node.attr(attribute);
      if (value && value.trim()) candidates.push({ value, source: "picture" });
    }
    const src = node.attr("src");
    if (src && src.trim()) candidates.push({ value: src, source: "picture" });
  });

  $("video[poster]").each((_, element) => {
    const poster = $(element).attr("poster");
    if (poster && poster.trim()) candidates.push({ value: poster, source: "video-poster" });
  });

  // Icons & apple touch icons referenced from <link>.
  $("link[href]").each((_, element) => {
    const rel = ($(element).attr("rel") ?? "").toLowerCase();
    const isIcon =
      rel.includes("icon") || rel.includes("apple-touch-icon") || rel.includes("image_src");
    const as = ($(element).attr("as") ?? "").toLowerCase();
    const isImagePreload = rel === "preload" && as === "image";
    if (!isIcon && !isImagePreload) return;
    const href = $(element).attr("href");
    if (href && href.trim()) candidates.push({ value: href, source: "link" });
  });

  // Social preview / structured data images.
  $("meta[content]").each((_, element) => {
    const property = (
      $(element).attr("property") ??
      $(element).attr("name") ??
      $(element).attr("itemprop") ??
      ""
    ).toLowerCase();
    if (
      property === "og:image" ||
      property === "og:image:url" ||
      property === "og:image:secure_url" ||
      property === "twitter:image" ||
      property === "twitter:image:src" ||
      property === "image" ||
      property === "msapplication-tileimage"
    ) {
      const content = $(element).attr("content");
      if (content && content.trim()) candidates.push({ value: content, source: "meta" });
    }
  });

  const rest = collectInlineCandidates($);
  candidates.push(...rest);

  return { base, candidates };
}

/** Inline SVG elements plus CSS `url(...)` references from style attributes/blocks. */
function collectInlineCandidates($: cheerio.CheerioAPI): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  $("svg").each((_, element) => {
    if (candidates.length > 2000) return;
    const dataUri = svgToDataUri($.html(element) ?? "");
    if (dataUri) candidates.push({ value: dataUri, source: "inline-svg" });
  });

  $("[style]").each((_, element) => {
    const style = $(element).attr("style");
    if (!style) return;
    for (const url of parseCssUrls(style)) {
      candidates.push({ value: url, source: "css-background" });
    }
  });

  $("style").each((_, element) => {
    const css = $(element).html();
    if (!css) return;
    for (const url of parseCssUrls(css)) {
      candidates.push({ value: url, source: "css-background" });
    }
  });

  return candidates;
}

/**
 * Supplementary sweep over inline scripts / JSON payloads (__NEXT_DATA__, __NUXT__,
 * JSON-LD, hydration state). Server-rendered frameworks often ship image URLs
 * inside these blobs even when the visible DOM is built later on the client.
 */
export function scanScriptsForImageUrls(html: string): RawCandidate[] {
  const candidates: RawCandidate[] = [];
  const seen = new Set<string>();
  const regex = new RegExp(IMAGE_URL_REGEX.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const url = match[0];
    if (seen.has(url)) continue;
    seen.add(url);
    candidates.push({ value: url, source: "meta" });
    if (candidates.length >= 500) break;
  }

  return candidates;
}

/** Extract every image from a page's HTML, resolved against `documentUrl`. */
export function extractImagesFromHtml(html: string, documentUrl: string): ExtractedImage[] {
  const { base, candidates } = collectCandidates(html, documentUrl);

  let documentOrigin: string | null = null;
  try {
    documentOrigin = new URL(base).origin;
  } catch {
    documentOrigin = null;
  }

  const primary = finalizeCandidates(candidates, base, documentOrigin);
  const seen = new Set(primary.map((image) => image.url));
  const extras = finalizeCandidates(scanScriptsForImageUrls(html), base, documentOrigin).filter(
    (image) => !seen.has(image.url),
  );

  // Real markup references come first; script-discovered URLs fill the gaps.
  return [...primary, ...extras];
}

/** Read the <title> of a document, if present. */
export function extractTitle(html: string): string | null {
  const $ = cheerio.load(html);
  const title = $("head title").first().text().trim();
  return title || null;
}
