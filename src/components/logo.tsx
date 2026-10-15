import { cn } from "@/lib/utils";

/** Monochrome pictogram used in the header, footer and PWA icons. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="Website Image Extractor"
      className={cn("size-7", className)}
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="11" cy="11" r="3" fill="currentColor" />
      <path
        d="M4.5 25.5 13 15.5l5.5 6.5 3.5-3.5 5.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {withWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">Image Extractor</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-60">
            website → zip
          </span>
        </span>
      ) : null}
    </span>
  );
}
