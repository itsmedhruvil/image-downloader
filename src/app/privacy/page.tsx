import type { Metadata } from "next";
import Link from "next/link";

import { PageBody, PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy & cookie policy",
  description:
    "How Website Image Extractor handles URLs, images and archives: nothing is logged, previews are streamed, and generated ZIP archives expire automatically.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy & cookie policy"
        description={`Last updated ${new Date().getFullYear()}. Plain language, no dark patterns.`}
      />

      <PageBody>
        <div className="prose-mono">
          <h2>Summary</h2>
          <p>
            We do not store, log, sell or share the URLs you submit, the images you extract, or any
            personal information. The tool works without an account, and there is nothing to sign
            into.
          </p>

          <h2>What we process</h2>
          <ul>
            <li>
              <strong>Submitted URLs</strong> — fetched on the server so the page can be parsed, then
              discarded when the response is written. They are not written to a database or a log
              line.
            </li>
            <li>
              <strong>Image previews</strong> — streamed through the server so that hotlink-protected
              assets render correctly. Nothing is written to disk.
            </li>
            <li>
              <strong>Pasted HTML</strong> — parsed entirely in your browser. It never leaves your
              device.
            </li>
            <li>
              <strong>Generated ZIP archives</strong> — the only data that touches persistent storage.
              When Cloudflare R2 is configured, an archive is stored under a random, unguessable key
              with a default lifetime of one hour, then expires.
            </li>
          </ul>

          <h2>What we do not do</h2>
          <ul>
            <li>We do not keep a history of the URLs you extract from.</li>
            <li>We do not retain copies of the images you download.</li>
            <li>We do not build user profiles or share data with advertisers.</li>
            <li>We do not require an email address to use the tool.</li>
          </ul>

          <h2>Cookies and local storage</h2>
          <p>
            No tracking cookies are set. Your browser&apos;s local storage is used for two things
            only: remembering your light/dark theme preference and whether you dismissed the install
            prompt. Both stay on your device and can be cleared at any time from your browser
            settings.
          </p>

          <h2>Service worker cache</h2>
          <p>
            When installed as a progressive web app, a service worker caches the application shell so
            the interface loads offline. Cached entries are static assets and previously viewed image
            responses; they can be cleared by uninstalling the app or clearing site data.
          </p>

          <h2>Third parties</h2>
          <p>
            The hosted deployment runs on Vercel and, when archive storage is enabled, Cloudflare R2.
            Those providers process requests on our behalf as infrastructure. Images are fetched
            directly from the sites you choose to scan, so those sites will see the request as coming
            from our server, not from you.
          </p>

          <h2>Your rights</h2>
          <p>
            Because we do not store personal data, there is generally nothing to export or delete. If
            you believe we hold something that relates to you, email{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will investigate.
          </p>

          <h2>Changes</h2>
          <p>
            Material changes to this policy will be noted in the{" "}
            <Link href="/changelog">changelog</Link>. Continued use after a change constitutes
            acceptance.
          </p>
        </div>
      </PageBody>
    </>
  );
}
