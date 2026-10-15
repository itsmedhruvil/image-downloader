import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { CHANGELOG } from "@/lib/content/changelog";
import { getStorageMode } from "@/lib/storage-mode";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every release of Website Image Extractor — new extraction modes, filters, R2 archive storage and PWA support.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogPage() {
  const storage = getStorageMode();

  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title="What shipped, and when"
        description="The extractor is built in the open. Here is every notable change."
      >
        <Badge variant="outline">
          Current archive backend: {storage === "r2" ? "Cloudflare R2" : "direct streaming"}
        </Badge>
      </PageHero>

      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <ol className="space-y-10 border-l border-border pl-6">
          {CHANGELOG.map((entry) => (
            <li key={entry.version} className="relative">
              <span
                className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full border border-border bg-background"
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold tracking-tight">v{entry.version}</h2>
                <span className="text-xs uppercase tracking-[0.14em] opacity-60">{entry.date}</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{entry.title}</p>
              <ul className="mt-3 space-y-2">
                {entry.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm opacity-80">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
