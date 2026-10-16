import type { Metadata } from "next";
import Link from "next/link";

import { PageBody, PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms that govern use of Website Image Extractor, including acceptable use, intellectual property and liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of service"
        description={`Last updated ${new Date().getFullYear()}. Use the tool lawfully and respect other people's work.`}
      />

      <PageBody>
        <div className="prose-mono prose-columns">
          <h2>1. Acceptance</h2>
          <p>
            By using {SITE.name} you agree to these terms. If you do not agree, please do not use the
            service.
          </p>

          <h2>2. What the service does</h2>
          <p>
            The service scans a web page you specify and lists the image references it can find. It
            can package a selection of those images into a ZIP archive. It does not grant you any
            rights to the images themselves.
          </p>

          <h2>3. Acceptable use</h2>
          <ul>
            <li>Do not use the service to access content you are not permitted to access.</li>
            <li>
              Do not use it to overwhelm, overload or circumvent protections on any third-party site.
            </li>
            <li>Do not use it for unlawful purposes or to infringe intellectual property rights.</li>
            <li>
              Do not attempt to disrupt the service, exceed reasonable request volumes, or automate
              bulk use in a way that degrades it for others.
            </li>
          </ul>

          <h2>4. Intellectual property</h2>
          <p>
            Images you extract remain the property of their respective owners and may be protected by
            copyright, trademark or other rights. You are solely responsible for how you use them and
            for complying with the terms of the site you extracted them from. Extracting an image does
            not transfer any licence to you.
          </p>

          <h2>5. No warranty</h2>
          <p>
            The service is provided &ldquo;as is&rdquo; without warranties of any kind, express or
            implied, including fitness for a particular purpose or non-infringement. Extraction may
            fail for reasons outside our control, including sites that block automated access.
          </p>

          <h2>6. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, we are not liable for any indirect, incidental or
            consequential damages, or for any loss of data, profits or goodwill arising from use of
            the service.
          </p>

          <h2>7. Availability</h2>
          <p>
            The service is free and may change, be interrupted, or be discontinued at any time without
            notice. Generated archives expire automatically and are not a backup service.
          </p>

          <h2>8. Privacy</h2>
          <p>
            Data handling is described in the{" "}
            <Link href="/privacy">privacy &amp; cookie policy</Link>, which forms part of these terms.
          </p>

          <h2>9. Changes</h2>
          <p>
            We may update these terms. Continued use after a change constitutes acceptance of the
            revised terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
        </div>
      </PageBody>
    </>
  );
}
