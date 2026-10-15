import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ContentBlocks } from "@/components/content-blocks";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, formatPostDate, getPost } from "@/lib/content/blog";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const index = BLOG_POSTS.findIndex((entry) => entry.slug === post.slug);
  const previous = index > 0 ? BLOG_POSTS[index - 1] : undefined;
  const next = index < BLOG_POSTS.length - 1 ? BLOG_POSTS[index + 1] : undefined;

  return (
    <>
      <PageHero
        eyebrow={`${post.tag} · ${formatPostDate(post.date)} · ${post.readingMinutes} min read`}
        title={post.title}
        description={post.description}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/blog">
            <ArrowLeft className="size-3.5" /> All posts
          </Link>
        </Button>
      </PageHero>

      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <ContentBlocks blocks={post.body} />
      </article>

      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6">
          {previous ? (
            <Link
              href={`/blog/${previous.slug}`}
              className="group rounded-lg border border-border p-5 hover:border-primary"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
                Previous
              </span>
              <p className="mt-2 text-sm font-semibold group-hover:underline">{previous.title}</p>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="group rounded-lg border border-border p-5 text-right hover:border-primary sm:text-right"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
                Next
              </span>
              <p className="mt-2 text-sm font-semibold group-hover:underline">{next.title}</p>
            </Link>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 pb-14 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-6">
            <p className="text-sm font-semibold">Ready to pull images off a page?</p>
            <Button asChild>
              <Link href="/#scraper">
                Open the extractor <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
