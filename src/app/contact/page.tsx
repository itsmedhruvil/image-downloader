import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch about the website image extractor — support, feature requests, bug reports, privacy questions and commercial use.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  {
    title: "General & commercial",
    email: SITE.email,
    body: "Questions about the tool, licensing, or using it in a commercial workflow.",
  },
  {
    title: "Support",
    email: SITE.supportEmail,
    body: "A page that would not extract, a ZIP that failed, or anything that looks broken.",
  },
  {
    title: "Privacy",
    email: SITE.email,
    body: "Data handling questions, deletion requests, or anything in the privacy policy.",
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the people who build this"
        description="There is no support portal to sign into and no ticket number to remember. Email works."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((channel) => (
            <article key={channel.title} className="rounded-lg border border-border p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em]">{channel.title}</h2>
              <p className="mt-3 text-sm opacity-80">{channel.body}</p>
              <a
                className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
                href={`mailto:${channel.email}`}
              >
                {channel.email}
              </a>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Before you write</h2>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              <li>
                • Extraction problems are usually explained in the{" "}
                <Link className="underline underline-offset-4" href="/documentation#troubleshooting">
                  troubleshooting section
                </Link>
                .
              </li>
              <li>
                • Ideas and feature requests are best filed on the{" "}
                <Link className="underline underline-offset-4" href="/feature-request">
                  feature request page
                </Link>
                .
              </li>
              <li>• Include the exact URL and the time you tried, if a page failed.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Response time</h2>
            <p className="mt-4 text-sm opacity-80">
              This is a small, independent project. Most messages get a reply within a couple of
              working days. Security reports are prioritised.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
