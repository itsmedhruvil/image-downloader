"use client";

import { ContentBlocks } from "@/components/content-blocks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ENTRIES } from "@/lib/content/faq";

/**
 * The homepage FAQ. Answers are structured content blocks (lists, tables, code)
 * so they can carry the same depth as the rest of the site, and the FAQPage
 * JSON-LD is generated from the very same source.
 */
export function AccordionFaq({ limit }: { limit?: number }) {
  const entries = typeof limit === "number" ? FAQ_ENTRIES.slice(0, limit) : FAQ_ENTRIES;

  return (
    <Accordion type="single" collapsible className="mt-11 border-t border-border">
      {entries.map((entry, index) => (
        <AccordionItem key={entry.question} value={`faq-${index}`}>
          <AccordionTrigger>
            <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums opacity-60">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1">{entry.question}</span>
          </AccordionTrigger>
          <AccordionContent>
            <ContentBlocks blocks={entry.blocks} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
