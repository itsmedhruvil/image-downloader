import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Filter,
  Gauge,
  Layers,
  Link2,
  Package,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Extractor } from "@/components/extractor/extractor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, formatPostDate } from "@/lib/content/blog";
import { FEATURES, HOME_FAQ, SITE } from "@/lib/site";
import { getStorageMode } from "@/lib/storage-mode";

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

const COMPARISON = [
  ["Free forever", "Requires a paid API"],
  ["HTML code input", "Rarely supported"],
  ["Advanced filters", "Limited"],
  ["No signup required", "Account required"],
  ["Privacy guaranteed", "Data retention unclear"],
  ["Installable PWA", "Not offered"],
] as const;

export default function HomePage() {
  const storage = getStorageMode();

  return (
    <>
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

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {[
              { label: "Signup required", value: "None" },
              { label: "Cost", value: "Free" },
              { label: "Formats detected", value: "11" },
              { label: "Client-side preview", value: "Yes" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background p-4 text-center">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-xl font-bold tracking-tight">{stat.value}</dd>
              </div>
            ))}
          </dl>
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
                  {COMPARISON.map(([feature, theirs]) => (
                    <tr key={feature} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{feature}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                          ✓
                        </span>
                      </td>
                      <td className="px-4 py-3 opacity-60">{theirs}</td>
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

          <div className="mt-10 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {HOME_FAQ.map((item, index) => (
              <details key={item.question} className="group bg-background">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 hover:bg-primary hover:text-primary-foreground">
                  <span className="text-xs font-bold tabular-nums opacity-50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-semibold sm:text-base">{item.question}</span>
                  <span className="text-lg leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 pl-[3.25rem] text-sm leading-relaxed opacity-80">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>

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
