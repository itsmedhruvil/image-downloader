/**
 * Content shapes for the in-app documentation. Kept separate from the docs data
 * so the renderer and the content can both depend on it without a cycle.
 */

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang?: string; text: string }
  | { type: "quote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface DocSection {
  id: string;
  title: string;
  summary: string;
  blocks: ContentBlock[];
}
