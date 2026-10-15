import { finalizeCandidates, parseCssUrls, type RawCandidate } from "./extract.core";
import type { ExtractedImage } from "./types";

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

const DEFAULT_BASE = "https://html-paste.local/";

function svgToDataUri(element: Element): string | null {
  const outer = element.outerHTML;
  if (!outer || outer.length > 200_000) return null;
  const withNamespace = outer.includes("xmlns=")
    ? outer
    : outer.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNamespace)}`;
}

/** Pure-browser twin of the server-side collector, backed by DOMParser. */
export function extractImagesFromMarkupClient(
  html: string,
  baseUrl?: string,
): ExtractedImage[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const baseHref = doc.querySelector("base[href]")?.getAttribute("href") ?? null;
  let base = baseUrl?.trim() ? baseUrl.trim() : DEFAULT_BASE;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(base)) base = `https://${base.replace(/^\/+/, "")}`;
  if (baseHref) {
    try {
      base = new URL(baseHref, base).toString();
    } catch {
      /* keep the provided base */
    }
  }

  const candidates: RawCandidate[] = [];
  const push = (value: string | null, source: RawCandidate["source"], alt?: string) => {
    if (value && value.trim()) candidates.push({ value, source, alt });
  };

  // <img> — src, lazy variants and srcset.
  doc.querySelectorAll("img").forEach((element) => {
    const alt = element.getAttribute("alt") ?? undefined;
    let pushed = false;
    for (const attribute of IMG_URL_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value) {
        push(value, attribute === "src" ? "img" : "lazy", alt);
        pushed = true;
      }
    }
    for (const attribute of SRCSET_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value) {
        push(value, "srcset", alt);
        pushed = true;
      }
    }
    if (!pushed) {
      const style = element.getAttribute("style");
      if (style) for (const url of parseCssUrls(style)) push(url, "css-background", alt);
    }
  });

  doc.querySelectorAll("picture source, video source").forEach((element) => {
    for (const attribute of SRCSET_ATTRIBUTES) push(element.getAttribute(attribute), "picture");
    push(element.getAttribute("src"), "picture");
  });

  doc.querySelectorAll("video[poster]").forEach((element) => {
    push(element.getAttribute("poster"), "video-poster");
  });

  doc.querySelectorAll("link[href]").forEach((element) => {
    const rel = (element.getAttribute("rel") ?? "").toLowerCase();
    const isIcon = rel.includes("icon") || rel.includes("image_src");
    const isImagePreload = rel === "preload" && (element.getAttribute("as") ?? "") === "image";
    if (isIcon || isImagePreload) push(element.getAttribute("href"), "link");
  });

  doc.querySelectorAll("meta[content]").forEach((element) => {
    const property = (
      element.getAttribute("property") ??
      element.getAttribute("name") ??
      element.getAttribute("itemprop") ??
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
      push(element.getAttribute("content"), "meta");
    }
  });

  // Inline SVG.
  let svgCount = 0;
  doc.querySelectorAll("svg").forEach((element) => {
    if (svgCount++ > 2000) return;
    const dataUri = svgToDataUri(element);
    if (dataUri) push(dataUri, "inline-svg");
  });

  // Inline styles and <style> blocks.
  doc.querySelectorAll("[style]").forEach((element) => {
    const style = element.getAttribute("style");
    if (style) for (const url of parseCssUrls(style)) push(url, "css-background");
  });

  doc.querySelectorAll("style").forEach((element) => {
    const css = element.textContent ?? "";
    for (const url of parseCssUrls(css)) push(url, "css-background");
  });

  let origin: string | null = null;
  try {
    origin = new URL(base).origin;
  } catch {
    origin = null;
  }

  const primary = finalizeCandidates(candidates, base, origin);
  const seen = new Set(primary.map((image) => image.url));

  // Supplementary sweep of inline scripts (hydration payloads, JSON-LD).
  const scriptRegex = new RegExp(IMAGE_URL_REGEX.source, "gi");
  const scriptUrlCandidates: RawCandidate[] = [];
  doc.querySelectorAll("script").forEach((element) => {
    const text = element.textContent ?? "";
    let match: RegExpExecArray | null;
    while ((match = scriptRegex.exec(text)) !== null) {
      scriptUrlCandidates.push({ value: match[0], source: "meta" });
      if (scriptUrlCandidates.length >= 500) break;
    }
  });

  const extras = finalizeCandidates(scriptUrlCandidates, base, origin).filter(
    (image) => !seen.has(image.url),
  );

  return [...primary, ...extras];
}

/** Read <title> from pasted markup. */
export function extractTitleClient(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.querySelector("title")?.textContent?.trim() || null;
}
