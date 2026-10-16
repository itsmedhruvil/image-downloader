import * as cheerio from "cheerio";

import type { UrlSectionSuggestion } from "./types";

/**
 * Derives stock-photo search keywords from a page's own structure.
 *
 * The page is walked in document order: each heading opens a section, and the
 * paragraphs, list items and quotes that follow it are attributed to that
 * section. Keywords are then ranked by term frequency, with two-word phrases
 * preferred when they repeat.
 */

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "their", "this", "that", "these", "those",
  "from", "into", "onto", "over", "under", "about", "after", "again", "against", "all", "also",
  "any", "are", "was", "were", "been", "being", "but", "can", "could", "did", "does", "doing",
  "down", "each", "few", "get", "got", "has", "have", "having", "here", "how", "its",
  "just", "like", "more", "most", "not", "now", "off", "once", "only", "other", "out", "own",
  "same", "she", "should", "some", "such", "than", "them", "then", "there", "they", "too", "use",
  "used", "using", "very", "want", "what", "when", "where", "which", "while", "who", "why", "will",
  "would", "yes", "yet", "able", "make", "makes", "made", "way", "ways", "new", "one", "two",
  "first", "last", "next", "back", "find", "know", "need", "see", "look", "learn", "read",
  // Site chrome that appears on almost every page.
  "menu", "close", "search", "cookie", "cookies", "privacy", "policy", "terms", "subscribe",
  "newsletter", "share", "follow", "sign", "signup", "log", "login", "logout", "account", "cart",
  "checkout", "shop", "copyright", "rights", "reserved", "contact", "home", "blog", "skip",
  "content", "navigation", "toggle", "loading", "javascript", "browser", "click", "here", "page",
  "pages", "site", "website", "email", "phone", "accept", "decline", "allow", "settings",
  "preferences", "enabled", "disabled", "facebook", "twitter", "instagram", "linkedin", "youtube",
  "tiktok", "pinterest",
]);

const MAX_SECTIONS = 12;
const MIN_WORDS_IN_SECTION = 4;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[-]+|[-]+$/g, ""))
    .filter((token) => token.length >= 3 && token.length <= 24 && !STOPWORDS.has(token));
}

/** Rank the most representative keywords for a block of text. */
export function deriveKeywords(text: string, limit = 5): string[] {
  const words = tokenize(text);
  if (words.length === 0) return [];

  // Track the first position of each term so ties resolve to whichever phrase
  // the author introduced first — usually the actual subject of the section.
  const unigrams = new Map<string, { count: number; first: number }>();
  words.forEach((word, index) => {
    const entry = unigrams.get(word);
    if (entry) entry.count += 1;
    else unigrams.set(word, { count: 1, first: index });
  });

  const bigrams = new Map<string, { count: number; first: number }>();
  for (let index = 0; index < words.length - 1; index += 1) {
    const phrase = `${words[index]} ${words[index + 1]}`;
    const entry = bigrams.get(phrase);
    if (entry) entry.count += 1;
    else bigrams.set(phrase, { count: 1, first: index });
  }

  const scored: { term: string; score: number; first: number }[] = [];
  for (const [term, { count, first }] of unigrams) scored.push({ term, score: count, first });
  // A repeated two-word phrase is a stronger signal than its individual words.
  for (const [term, { count, first }] of bigrams) {
    if (count >= 2) scored.push({ term, score: count * 2.5, first });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.first - b.first || a.term.localeCompare(b.term),
  );

  const chosen: string[] = [];
  for (const { term } of scored) {
    if (chosen.length >= limit) break;
    // Skip terms already covered by a chosen phrase (and vice versa).
    const covered = chosen.some((existing) => existing.includes(term) || term.includes(existing));
    if (!covered) chosen.push(term);
  }

  return chosen;
}

interface DraftSection {
  name: string;
  text: string[];
}

/** Walk the document and group its text under the nearest preceding heading. */
function collectSections($: cheerio.CheerioAPI): DraftSection[] {
  const sections: DraftSection[] = [];
  let current: DraftSection | null = null;

  $("h1, h2, h3, h4, p, li, blockquote, figcaption").each((_, element) => {
    const node = $(element);
    const tag = (node.prop("tagName") as string | undefined)?.toLowerCase() ?? "";
    const text = node.text().replace(/\s+/g, " ").trim();
    if (!text) return;

    if (tag.startsWith("h")) {
      // Avoid nested duplicates (e.g. a heading inside a link inside a heading).
      if (node.parents("h1, h2, h3, h4").length > 0) return;
      current = { name: text.slice(0, 90), text: [] };
      sections.push(current);
      return;
    }

    if (current && text.length > 2) current.text.push(text);
  });

  return sections;
}

export function extractSections(html: string, title: string | null): UrlSectionSuggestion[] {
  const $ = cheerio.load(html);
  const drafts = collectSections($);
  const suggestions: UrlSectionSuggestion[] = [];
  const seenKeywords = new Set<string>();

  const push = (name: string, body: string) => {
    if (tokenize(body).length < MIN_WORDS_IN_SECTION) return;

    const keywords = deriveKeywords(body, 5);
    const primary = keywords[0];
    if (!primary || seenKeywords.has(primary)) return;

    seenKeywords.add(primary);
    suggestions.push({
      name: name.replace(/\s+/g, " ").trim().slice(0, 90),
      suggestedKeyword: primary,
      allSuggestions: keywords,
    });
  };

  for (const draft of drafts) {
    if (suggestions.length >= MAX_SECTIONS) break;
    push(draft.name, draft.text.join(" "));
  }

  // No usable headings: fall back to the page title plus its whole body text.
  if (suggestions.length === 0) {
    push(title?.trim() || "Page", $("body").text().replace(/\s+/g, " ").trim());
  }

  return suggestions;
}

/** Read the document title, preferring Open Graph when present. */
export function readTitle(html: string): string | null {
  const $ = cheerio.load(html);
  const og = $('meta[property="og:title"]').attr("content")?.trim();
  const title = $("head title").first().text().trim();
  return og || title || null;
}

