import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { FOOTER_GROUPS, SITE } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <LogoMark />
              <span className="text-sm font-bold tracking-tight">{SITE.name}</span>
            </Link>
            <p className="max-w-xs text-sm opacity-70">{SITE.tagline}. Free, private and instant.</p>
            <p className="text-xs opacity-60">
              <a className="underline underline-offset-4" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em]">
              <a className="underline underline-offset-4" href={SITE.social.x} rel="noreferrer" target="_blank">
                X
              </a>
              <a
                className="underline underline-offset-4"
                href={SITE.social.linkedin}
                rel="noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
              <a
                className="underline underline-offset-4"
                href={SITE.social.github}
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </div>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}`}>
                    <Link href={link.href} className="text-sm opacity-80 hover:opacity-100 hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs opacity-70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}. 100% free &amp; private.
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Built with Next.js on Vercel</span>
            <span aria-hidden>·</span>
            <span>Archives on Cloudflare R2</span>
            <span aria-hidden>·</span>
            <span>All free tiers</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
