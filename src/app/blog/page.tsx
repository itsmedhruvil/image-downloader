import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AdSlot } from "@/components/ad-slot";
import { PageHero } from "@/components/page-hero";
import { BLOG_POSTS, formatPostDate } from "@/lib/content/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, engineering notes and references on extracting, filtering and understanding the images a website ships.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Notes on web images, scraping and privacy"
        description="Practical guides for pulling image assets off a page, plus the engineering behind the extractor itself."
      />

      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {featured ? (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block rounded-lg border border-border p-6 transition-colors hover:border-primary sm:p-8"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
                Latest · {featured.tag} · {featured.readingMinutes} min read
              </span>
              <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight group-hover:underline sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed opacity-75">
                {featured.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                Read post <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
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
        <div className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
          <AdSlot size="leaderboard" />
        </div>
      </section>
    </>
  );
}
