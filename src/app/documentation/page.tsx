import type { Metadata } from "next";
import Link from "next/link";

import { ContentBlocks } from "@/components/content-blocks";
import { PageHero } from "@/components/page-hero";
import { DOC_SECTIONS } from "@/lib/content/docs";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "How the website image extractor works: URL, HTML and bulk extraction, filtering, format conversion, ZIP downloads, the JSON API and self-hosting on Vercel with Cloudflare R2.",
  alternates: { canonical: "/documentation" },
};

export default function DocumentationPage() {
  return (
    <>
      <PageHero
        eyebrow="Documentation"
        title="Everything about extracting, filtering and downloading"
        description="How each mode works, what the filters do, how archives are stored, and how to deploy the whole thing yourself on free tiers."
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">
            On this page
          </p>
          <ul className="mt-4 space-y-1 border-l border-border pl-4">
            {DOC_SECTIONS.map((section) => (
              <li key={section.id}>
                <Link
                  href={`#${section.id}`}
                  className="block py-1 text-sm opacity-70 transition-opacity hover:opacity-100 hover:underline"
                >
                  {section.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">Quick start</p>
            <p className="mt-2 text-xs opacity-70">
              Paste a URL on the{" "}
              <Link className="underline underline-offset-4" href="/#scraper">
                extractor page
              </Link>{" "}
              and press Extract.
            </p>
          </div>
        </nav>

        <div className="min-w-0 space-y-14">
          {DOC_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{section.title}</h2>
              <p className="mt-2 text-sm opacity-70">{section.summary}</p>
              <div className="mt-6">
                <ContentBlocks blocks={section.blocks} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
