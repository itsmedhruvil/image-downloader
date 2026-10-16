import type { Metadata } from "next";

import { FeedbackForm } from "@/components/feedback-form";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Report a bug or request a change to the image extractor.",
};

const GUIDANCE = [
  "Which tab you used — Website URL, HTML code, Bulk URLs or Stock photos",
  "The exact URL or markup, if the problem is reproducible",
  "What you expected versus what happened",
  "Whether the page needs a login to view",
];

const COMMON_CAUSES = [
  {
    title: "The site blocks automated access",
    body: "Open the page, use View Page Source, copy the markup and paste it into the HTML tab. You will get exactly the images your logged-in browser sees.",
  },
  {
    title: "The request timed out",
    body: "Very large pages can exceed the request window. Try a more specific page instead of the homepage.",
  },
  {
    title: "Some files in a ZIP were skipped",
    body: "Individual failures are skipped so the rest of the archive still arrives. The response lists which ones failed.",
  },
];

export default function FeedbackPage() {
  return (
    <Container className="py-10 lg:py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Feedback</h1>
      <p className="mt-2 text-sm opacity-70">
        Bugs, rough edges and requests for this tool. Submissions are stored for the team to review.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <FeedbackForm />

        <div className="space-y-6">
          <section className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">What to include</h2>
            <ul className="mt-4 space-y-2 text-sm opacity-80">
              {GUIDANCE.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em]">Common causes</h2>
            {COMMON_CAUSES.map((item) => (
              <article key={item.title} className="rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{item.body}</p>
              </article>
            ))}
          </section>
        </div>
      </div>
    </Container>
  );
}
