import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Filter,
  Gauge,
  Layers,
  Link2,
  Minus,
  Package,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { AccordionFaq } from "@/components/accordion-faq";
import { AdSlot } from "@/components/ad-slot";
import { Extractor } from "@/components/extractor/extractor";
import { JsonLd } from "@/components/json-ld";
import { StatsRow } from "@/components/stats-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, formatPostDate } from "@/lib/content/blog";
import { FEATURES, SITE, TIPS } from "@/lib/site";
import { getStorageMode } from "@/lib/storage-mode";
import { homeStructuredData } from "@/lib/structured-data";

const STEPS = [
  {
    icon: Link2,
    title: "Paste any website URL",
    body: "Drop in a page address and extract every image instantly. It works on any publicly accessible site — blogs, storefronts, portfolios and single-page apps.",
  },
  {
    icon: Code2,
    title: "Or paste raw HTML and CSS",
    body: "Handy for local files, staging environments or code you have not deployed. The markup is parsed in your browser, so nothing is uploaded anywhere.",
  },
  {
    icon: Package,
    title: "Filter, then download as ZIP",
    body: "Set a minimum size or format, select what you need, then download individually or as one archive in PNG, JPG, WebP, SVG and more.",
  },
] as const;

const AUDIENCES = [
  {
    title: "Designers",
    body: "Build mood boards from five competitor sites without right-clicking 200 images. Filter out icons by minimum size and export the set as one ZIP.",
  },
  {
    title: "Developers",
    body: "Audit what formats and sizes a page actually ships before a migration or a performance pass — including CSS backgrounds and lazy-loaded assets.",
  },
  {
    title: "Marketers",
    body: "Review how competitors present their product pages. Extract each full image set, filter to the hero shots and compare side by side.",
  },
  {
    title: "E-commerce",
    body: "Onboard a supplier catalogue or check what a marketplace listing uses. Keep the large product photos and skip the badges and trust icons.",
  },
] as const;

type Verdict = "yes" | "no" | "partial";

const COMPARISON: { feature: string; theirs: Verdict; note?: string }[] = [
  { feature: "Free forever", theirs: "no", note: "Requires a paid API" },
  { feature: "HTML code input", theirs: "no" },
  { feature: "Bulk URL scanning", theirs: "no" },
  { feature: "Advanced filters", theirs: "partial", note: "Limited" },
  { feature: "No signup required", theirs: "no", note: "Account required" },
  { feature: "Privacy guaranteed", theirs: "partial", note: "Data retention unclear" },
  { feature: "Batch download as ZIP", theirs: "partial", note: "Often paywalled" },
];

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  if (verdict === "yes") return <Check className="size-4" strokeWidth={3} />;
  if (verdict === "partial") return <Minus className="size-4 opacity-70" />;
  return <X className="size-4 opacity-70" />;
}

export default function HomePage() {
  const storage = getStorageMode();

  return (
    <>
      <JsonLd data={homeStructuredData()} />
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-paper pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-5">
              <Sparkles className="size-3" /> 100% free &amp; private
            </Badge>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Extract images from any website
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base opacity-75 sm:text-lg">
              Paste a URL or HTML, preview every image on the page, filter by format, dimensions and
              file size, then download what you need — one by one or as a single ZIP.
            </p>
          </div>

          <div className="mt-10">
            <Extractor storage={storage} />
          </div>

          <StatsRow className="mt-4 max-w-[960px] sm:mx-auto" />

          <div className="mt-4 max-w-[960px] rounded-lg border border-border bg-card p-5 sm:mx-auto sm:p-6">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">
              Tips
            </p>
            <ul className="grid list-none gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-5">
              {TIPS.map((tip) => (
                <li
                  key={tip}
                  className="relative border-t border-border pt-3 text-[13px] leading-relaxed opacity-75"
                >
                  <span
                    className="absolute -top-px left-0 h-[2px] w-[22px] bg-foreground"
                    aria-hidden
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 max-w-[728px] sm:mx-auto">
            <AdSlot size="leaderboard" />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
              01 — Definition
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              What is a website image extractor?
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed opacity-80 sm:text-base">
            <p>
              A website image extractor scans a web page and pulls out every image on it — photos,
              icons, background graphics, SVGs — so you can preview, filter and save them without
              opening dozens of tabs or right-clicking one file at a time.
            </p>
            <p>
              Paste a page&apos;s URL and within seconds the tool has scanned the markup, resolved
              every image reference it can find (including lazy-loaded and CSS background images),
              and laid the results out in a gallery you can sort by format or size before downloading
              anything.
            </p>
            <p>
              The typical use case is collecting reference material fast: a designer pulling
              inspiration from competitor sites, a developer auditing which image formats a page
              actually ships, a marketer gathering visual assets for a competitive review.
            </p>
            <p className="font-medium">
              No account, no API key, no browser extension. Extraction happens in real time and
              nothing is retained afterwards.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
            02 — Three methods
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            How to download all images from a website in 3 steps
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-md border border-border">
                    <step.icon className="size-4" />
                  </span>
                  <span className="text-3xl font-bold opacity-15">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
              03 — Filters
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Advanced image filters — PNG, JPG, SVG, WebP &amp; more
            </h2>
            <div className="mt-8 space-y-5">
              <div className="flex gap-4 rounded-lg border border-border p-5">
                <Filter className="mt-0.5 size-5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Filter by format</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">
                    Narrow the results to only the formats you need — JPG, PNG, WebP, SVG, GIF, ICO,
                    AVIF. One click removes every other format from view.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-lg border border-border p-5">
                <Gauge className="mt-0.5 size-5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
                    Preview size and dimensions
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">
                    Set minimum width, height or file-size thresholds to skip icons, tracking pixels
                    and thumbnails. Only the large, high-quality images survive.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-lg border border-border p-5">
                <Wand2 className="mt-0.5 size-5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
                    Convert before download
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">
                    Re-encode raster images to PNG, JPG or WebP in your browser when a downstream tool
                    demands a specific format. SVG stays vector.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:pt-16">
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Our tool
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Others
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3">
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-col items-center gap-1">
                          <VerdictIcon verdict={row.theirs} />
                          {row.note ? (
                            <span className="text-[10px] uppercase tracking-[0.08em] opacity-60">
                              ({row.note})
                            </span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
            04 — Who uses it
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Why designers, developers &amp; marketers use it
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <article key={audience.title} className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-bold tracking-tight">{audience.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{audience.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
            05 — What powers it
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            100% private, secure &amp; always free
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-background p-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.1em]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed opacity-75">{feature.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.12em] opacity-70">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-3.5" /> No URLs logged
            </span>
            <span className="inline-flex items-center gap-2">
              <Layers className="size-3.5" /> No API keys
            </span>
            <span className="inline-flex items-center gap-2">
              <Package className="size-3.5" /> Archives expire automatically
            </span>
          </div>
        </div>
      </section>



      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
            06 — Answers
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>

          <AccordionFaq />

          <p className="mt-6 text-sm opacity-70">
            Still stuck?{" "}
            <Link href="/documentation" className="underline underline-offset-4">
              Read the documentation
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="underline underline-offset-4">
              get in touch
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
                07 — Blog
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Guides, engineering notes &amp; references
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/blog">
                All posts <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-lg border border-border p-6 transition-colors hover:border-primary"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
                  {post.tag} · {post.readingMinutes} min read
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight group-hover:underline">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed opacity-75">{post.description}</p>
                <span className="mt-4 text-xs opacity-60">{formatPostDate(post.date)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-[728px] px-4 py-10 sm:px-6">
          <AdSlot size="leaderboard" />
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Grab every image from any page
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-sm opacity-75 sm:text-base">
            No account, no API key, no limits. Paste a link and hit Extract — everything stays free
            and private.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="#scraper">
                <Sparkles className="size-4" /> Extract images now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.14em] opacity-50">
            {SITE.name} · 100% free &amp; private
          </p>
        </div>
      </section>

    </>
  );
}
