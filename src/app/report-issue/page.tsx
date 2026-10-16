import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Bug, Clock, Mail, ShieldAlert } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Report an issue",
  description:
    "Report a bug or a page that would not extract. Include the URL, the browser you used and what you expected to happen.",
  alternates: { canonical: "/report-issue" },
};

const CHECKLIST = [
  "The exact URL you tried (or the page source you pasted)",
  "Which tab you used — Website URL, HTML code or Bulk URLs",
  "What you expected versus what actually happened",
  "Whether the page needs a login to view",
  "Your browser and version, if the interface misbehaved",
];

const COMMON = [
  {
    icon: ShieldAlert,
    title: "The site blocks automated access",
    body: "Open the page in your browser, use View Page Source, copy the markup and paste it into the HTML tab. You will get exactly the images your logged-in browser sees.",
  },
  {
    icon: Clock,
    title: "The request timed out",
    body: "Very large pages can exceed the request window. Try a more specific page instead of the homepage, or split the work across a couple of extractions.",
  },
  {
    icon: AlertTriangle,
    title: "Some images in a ZIP were skipped",
    body: "Individual files that return an error are skipped so the rest of the archive still arrives. The response lists which ones failed — usually they were removed upstream.",
  },
];

export default function ReportIssuePage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Report an issue"
        description="Something broken? Tell us what you tried and we will investigate. No account or ticket number required."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={`mailto:${SITE.supportEmail}?subject=Issue%20report%20%E2%80%94%20Website%20Image%20Extractor`}>
              <Bug className="size-4" /> Email a report
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/documentation#troubleshooting">Read troubleshooting first</Link>
          </Button>
        </div>
      </PageHero>

      <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-16 lg:grid-cols-2">
        <section className="rounded-lg border border-border p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">What to include</h2>
          <ul className="mt-4 space-y-3 text-sm opacity-80">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 inline-flex items-center gap-2 text-sm opacity-70">
            <Mail className="size-3.5" />
            <a className="underline underline-offset-4" href={`mailto:${SITE.supportEmail}`}>
              {SITE.supportEmail}
            </a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
            Before you write: common causes
          </h2>
          {COMMON.map((item) => (
            <article key={item.title} className="rounded-lg border border-border p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <item.icon className="size-4 shrink-0" /> {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed opacity-75">{item.body}</p>
            </article>
          ))}
          <p className="text-xs opacity-60">
            Reporting a security problem? Email{" "}
            <a className="underline underline-offset-4" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{" "}
            and it will be prioritised.
          </p>
        </section>
      </div>
    </>
  );
}
