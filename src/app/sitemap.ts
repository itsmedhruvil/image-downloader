import type { MetadataRoute } from "next";

import { BLOG_POSTS } from "@/lib/content/blog";
import { DOC_SECTIONS } from "@/lib/content/docs";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/pricing",
    "/blog",
    "/documentation",
    "/changelog",
    "/feature-request",
    "/contact",
    "/status",
    "/privacy",
    "/terms",
    "/disclaimer",
  ].map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: now,
    changeFrequency: (route === "" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  const posts = BLOG_POSTS.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00Z`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const docs = DOC_SECTIONS.map((section) => ({
    url: `${SITE.url}/documentation#${section.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...posts, ...docs];
}
