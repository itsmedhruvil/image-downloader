import Link from "next/link";

import { Container } from "@/components/container";
import { LogoMark } from "@/components/logo";
import { getStorageMode } from "@/lib/storage-mode";
import { FOOTER_LINKS, SITE } from "@/lib/site";

/** Deliberately minimal: this is an internal tool, not a public site. */
export function SiteFooter() {
  const storage = getStorageMode();

  return (
    <footer className="border-t border-border">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6">
        <div className="flex items-center gap-2.5 text-xs opacity-70">
          <LogoMark className="size-5" />
          <span className="font-semibold">{SITE.name}</span>
          <span aria-hidden>·</span>
          <span>internal tool</span>
          <span aria-hidden>·</span>
          <span>{storage === "r2" ? "ZIP storage: R2" : "ZIP storage: streamed"}</span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="opacity-70 underline-offset-4 transition-opacity hover:underline hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
