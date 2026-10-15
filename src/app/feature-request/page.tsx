import type { Metadata } from "next";

import { FeatureRequestForm } from "@/components/feature-request-form";
import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Feature request",
  description:
    "Suggest a new feature or report an issue for the website image extractor. Ideas are reviewed in batches and shipped in the changelog.",
  alternates: { canonical: "/feature-request" },
};

const ROADMAP = [
  "Saved presets for recurring filter combinations",
  "Optional headless rendering for purely client-side galleries",
  "Direct export to Google Drive or Dropbox",
  "Per-image EXIF and colour profile readout",
];

export default function FeatureRequestPage() {
  return (
    <>
      <PageHero
        eyebrow="Feature request"
        title="Ask for a new feature"
        description="Tell us what would make the extractor more useful. Requests are read by the people who build the tool."
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_1fr]">
        <FeatureRequestForm />

        <aside className="space-y-8">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">What gets prioritised</h2>
            <ul className="mt-4 space-y-3 text-sm opacity-80">
              <li>• Anything that makes bulk extraction faster or more reliable.</li>
              <li>• Filtering improvements, especially around dimensions and formats.</li>
              <li>• Privacy-preserving additions — nothing that requires tracking users.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">On the roadmap</h2>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {ROADMAP.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Prefer email?</h2>
            <p className="mt-3 text-sm opacity-80">
              Write to{" "}
              <a className="underline underline-offset-4" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>{" "}
              with the subject line “Feature request”.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
