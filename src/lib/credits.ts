/**
 * Attribution file shared by both ZIP paths (server-side R2 archive and the
 * browser-side archive used when converting formats).
 */

export const CREDITS_FILENAME = "credits.txt";

export const CREDITS_FOOTER =
  "(Attribution is required by the Unsplash, Pexels and Pixabay API terms — keep this file if you republish these images.)";

/** `filename — credit` per line, followed by the required attribution note. */
export function buildCreditsFile(entries: string[]): string {
  return `${entries.join("\n")}\n\n${CREDITS_FOOTER}\n`;
}
