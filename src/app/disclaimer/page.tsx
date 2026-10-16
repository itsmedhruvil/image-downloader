import type { Metadata } from "next";
import Link from "next/link";

import { PageBody, PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer for Website Image Extractor: the tool is provided as-is, extracted images remain the property of their owners, and you are responsible for lawful use.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Disclaimer"
        description="What this tool is, what it is not, and where responsibility sits."
      />

      <PageBody>
        <div className="prose-mono prose-columns">
          <h2>No affiliation</h2>
          <p>
            {SITE.name} is not affiliated with, endorsed by, or sponsored by any website you choose to
            scan. Trademarks and brand names referenced anywhere on this site belong to their
            respective owners.
          </p>

          <h2>Images remain the property of their owners</h2>
          <p>
            The tool locates and retrieves publicly reachable image files. It does not grant you a
            licence to use them. Copyright, trademark, personality and database rights may apply.
            Before publishing, redistributing or selling anything you extract, confirm that you have
            permission or that your use falls within an applicable exception.
          </p>

          <h2>Respect site terms</h2>
          <p>
            Some websites prohibit automated access in their terms of service or robots directives.
            You are responsible for respecting those terms. If a page resists extraction, the
            appropriate response is usually to ask the site owner rather than to work around their
            protections.
          </p>

          <h2>No guarantee of completeness or accuracy</h2>
          <p>
            Extraction results depend on the markup a site returns at the moment you request it.
            Dynamic pages, login walls, rate limits and network conditions can all change what is
            found. Dimensions and file sizes are measured as reported by the source server or your
            browser and may differ from the original asset.
          </p>

          <h2>Availability</h2>
          <p>
            The service is offered free of charge, without warranty, and may be unavailable at any
            time. Generated ZIP archives expire and should not be treated as storage or a backup.
          </p>

          <h2>Not legal advice</h2>
          <p>
            Nothing on this site constitutes legal advice. If you are unsure whether a particular use
            is permitted, consult a qualified professional.
          </p>

          <h2>Questions</h2>
          <p>
            Contact <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, or read the{" "}
            <Link href="/terms">terms of service</Link> and{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>
        </div>
      </PageBody>
    </>
  );
}
