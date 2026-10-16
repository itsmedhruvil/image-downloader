import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import { AccordionFaq } from "@/components/accordion-faq";
import { PageHero } from "@/components/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Website Image Extractor is free forever. No account, no API key, no premium tier gating the core features.",
  alternates: { canonical: "/pricing" },
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: true,
    description: "Everything the tool can do, for everyone.",
    features: [
      "Unlimited URL extractions",
      "HTML & CSS paste mode",
      "Bulk URLs (up to 5 pages)",
      "Format, dimension and size filters",
      "Individual downloads and ZIP archives",
      "Browser-side format conversion",
      "Installable PWA with offline shell",
      "No account, no API key, no ads",
    ],
  },
  {
    name: "Self-hosted",
    price: "$0",
    period: "your own free tiers",
    highlight: false,
    description: "Run the whole thing yourself on Vercel and Cloudflare R2.",
    features: [
      "Next.js app deployable to Vercel's free tier",
      "Cloudflare R2 free tier for ZIP archives",
      "Works with no storage configured at all",
      "Server-side SSRF protection included",
      "No database required",
      "Simple, readable project layout",
    ],
  },
] as const;

const MATRIX = [
  ["Unlimited extractions", true, true],
  ["HTML code input", true, true],
  ["Bulk URL scanning", true, true],
  ["Advanced filters", true, true],
  ["ZIP bulk download", true, true],
  ["Format conversion", true, true],
  ["Cloudflare R2 archive storage", true, true],
  ["Account required", false, false],
  ["Paid API key required", false, false],
  ["Data retention of your URLs", false, false],
] as const;

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Free forever — no tiers, no paywalls"
        description="Every feature on this site is available to everyone. There is no account to create and no API key to buy. Hosting it yourself is also free on Vercel and Cloudflare's free tiers."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/#scraper">
              Start extracting <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/documentation#self-hosting">Self-hosting guide</Link>
          </Button>
        </div>
      </PageHero>

      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className="flex flex-col rounded-lg border border-border p-6 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{tier.name}</h2>
                  <p className="mt-1 text-sm opacity-70">{tier.description}</p>
                </div>
                {tier.highlight ? <Badge>Recommended</Badge> : null}
              </div>

              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                <span className="text-xs uppercase tracking-[0.14em] opacity-60">{tier.period}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0" />
                    <span className="opacity-85">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-8" variant={tier.highlight ? "default" : "outline"}>
                <Link href={tier.highlight ? "/#scraper" : "/documentation#self-hosting"}>
                  {tier.highlight ? "Extract images now" : "Read the setup guide"}
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What is included</h2>
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Capability
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Hosted
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Self-hosted
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map(([label, hosted, selfHosted]) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{label}</td>
                    {[hosted, selfHosted].map((value, index) => (
                      <td key={index} className="px-4 py-3">
                        {value ? (
                          <Check className="size-4" />
                        ) : (
                          <Minus className="size-4 opacity-40" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 space-y-4">
            <h3 className="text-lg font-bold tracking-tight">A note on infrastructure costs</h3>
            <p className="text-sm leading-relaxed opacity-75">
              The hosted version runs on Vercel&apos;s free tier and, when archive storage is enabled,
              Cloudflare R2&apos;s free tier (10 GB of storage plus generous operation allowances).
              Archives are deleted on a one-hour schedule by default, so storage usage stays
              negligible. Nothing here requires a paid plan.
            </p>
            <p className="text-sm leading-relaxed opacity-75">
              Questions about usage limits or commercial deployments?{" "}
              <Link className="underline underline-offset-4" href="/contact">
                Get in touch
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Common questions</h2>
          <AccordionFaq limit={5} />
          <p className="mt-8 text-xs uppercase tracking-[0.14em] opacity-50">
            {SITE.name} · no hidden fees · no premium tiers
          </p>
        </div>
      </section>

    </>
  );
}
