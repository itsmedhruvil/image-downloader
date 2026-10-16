import type { Metadata } from "next";
import Link from "next/link";

import { PageBody, PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Imprint",
  description:
    "Imprint and provider information for Website Image Extractor, including contact details, hosting providers and responsibility for content.",
  alternates: { canonical: "/imprint" },
};

export default function ImprintPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Imprint"
        description="Provider information, contact details and hosting arrangements for this service."
      />

      <PageBody>
        <div className="prose-mono prose-columns">
          <h2>Provider</h2>
          <p>
            {SITE.name} is an independently operated, free web utility. It is not a registered
            company and sells no goods or services.
          </p>
          <ul>
            <li>
              Contact: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
            <li>
              Support: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
            </li>
            <li>
              Website: <a href={SITE.url}>{SITE.url}</a>
            </li>
          </ul>

          <h2>Responsibility for content</h2>
          <p>
            All content on this site — text, interface, and code — is operated by the provider. The
            tool does not host, store or publish third-party images. Images are fetched on demand
            from the site you ask it to scan and are never retained.
          </p>

          <h2>Hosting and infrastructure</h2>
          <ul>
            <li>
              <strong>Application hosting:</strong> Vercel — the Next.js app and API routes run on
              Vercel&apos;s edge network.
            </li>
            <li>
              <strong>Temporary archive storage:</strong> Cloudflare R2 — generated ZIP archives are
              stored for a short, fixed window and then expire automatically.
            </li>
          </ul>

          <h2>External links</h2>
          <p>
            This site links to external resources for reference. The provider is not responsible for
            the content, availability or privacy practices of those external sites.
          </p>

          <h2>Copyright</h2>
          <p>
            Images located by this tool remain the property of their respective owners. Extracting an
            image does not transfer any licence to you. See the{" "}
            <Link href="/disclaimer">disclaimer</Link> and{" "}
            <Link href="/terms">terms of service</Link> for details.
          </p>

          <h2>Corrections</h2>
          <p>
            If anything here is inaccurate or you believe content infringes your rights, email{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and it will be reviewed promptly.
          </p>
        </div>
      </PageBody>
    </>
  );
}
