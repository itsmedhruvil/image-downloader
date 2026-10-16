"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AdSize = "leaderboard" | "rectangle" | "inline";

/**
 * Every ad slot spans the full container width with the same height, so the
 * layout stays uniform whether or not a slot is filled.
 */
const SIZE_CLASSES: Record<AdSize, string> = {
  leaderboard: "w-full min-h-[120px]",
  rectangle: "w-full min-h-[120px]",
  inline: "w-full min-h-[120px]",
};

const SIZE_LABELS: Record<AdSize, string> = {
  leaderboard: "Ad Space · full width",
  rectangle: "Ad Space · full width",
  inline: "Ad Space · full width",
};

interface AdSlotProps {
  size?: AdSize;
  /** Optional override; falls back to NEXT_PUBLIC_ADSENSE_SLOT. */
  slot?: string;
  className?: string;
}

/**
 * Advertising slot.
 *
 * With `NEXT_PUBLIC_ADSENSE_CLIENT` and a slot id configured it renders a real
 * AdSense unit; otherwise it renders the monochrome placeholder so the layout
 * reserves the same space. Ads are deliberately loaded lazily (after idle or
 * first interaction) so they never block rendering.
 */
export function AdSlot({ size = "leaderboard", slot, className }: AdSlotProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slotId = slot ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const enabled = Boolean(client && slotId);

  React.useEffect(() => {
    if (!enabled) return;

    const load = () => {
      if (!document.querySelector("script[data-adsense-loader]")) {
        const script = document.createElement("script");
        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.adsenseLoader = "true";
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
        document.head.appendChild(script);
      }
      try {
        const queue = ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
        queue.push({});
      } catch {
        /* ad blockers may block this entirely — layout stays intact */
      }
    };

    const idleWindow = window as unknown as {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      const handle = idleWindow.requestIdleCallback(load, { timeout: 4000 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(load, 3000);
    return () => window.clearTimeout(timer);
  }, [client, enabled]);

  if (!enabled) {
    return (
      <div
        role="complementary"
        aria-label="Advertisement placeholder"
        className={cn(
          "ad-slot-frame flex items-center justify-center rounded-lg",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-50">
          {SIZE_LABELS[size]}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(SIZE_CLASSES[size], className)} aria-label="Advertisement">
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
