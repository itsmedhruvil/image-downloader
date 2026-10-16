import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The single page container used by every bar, section and page.
 *
 * One width for the whole app means nothing drifts out of alignment: the header,
 * the footer, the extractor, the galleries and every marketing section all start
 * and end at the same x position, and every full-width surface (ads, stats, tips)
 * spans exactly this width too.
 */
export const CONTAINER_CLASS = "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8";

/** Uniform vertical rhythm between sections. */
export const SECTION_PADDING = "py-12 lg:py-16";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "nav" | "header" | "footer" | "article" | "main";
}

export function Container({ as = "div", className, children, ...props }: ContainerProps) {
  const Tag = as as React.ElementType;
  return (
    <Tag className={cn(CONTAINER_CLASS, className)} {...props}>
      {children}
    </Tag>
  );
}

/** A bordered, full-width section with the shared container and padding. */
export function Section({
  className,
  contentClassName,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { contentClassName?: string }) {
  return (
    <section className={cn("border-b border-border", className)} {...props}>
      <Container className={cn(SECTION_PADDING, contentClassName)}>{children}</Container>
    </section>
  );
}

/**
 * Card surface shared by every content card so tiles are the same size
 * regardless of how much copy they hold.
 */
export const CARD_CLASS =
  "flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-5";

/** Uniform grid for content cards. */
export const CARD_GRID_CLASS = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
