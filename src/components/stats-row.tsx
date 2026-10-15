"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { getServerStats, getStats, reloadStats, STATS_STORAGE_KEY, subscribe } from "@/lib/activity-stats";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

function useActivityStats() {
  return React.useSyncExternalStore(subscribe, getStats, getServerStats);
}

/**
 * The stats strip under the extractor: how much this visitor has extracted
 * (counted locally on their own device) plus the Product Hunt badge.
 */
export function StatsRow({ className }: { className?: string }) {
  const stats = useActivityStats();
  const mounted = React.useSyncExternalStore(noopSubscribe, getTrue, getFalse);

  // Keep the counters in sync when another tab extracts something.
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STATS_STORAGE_KEY || event.key === null) reloadStats();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const items = [
    { label: "URLs extracted", value: stats.urls },
    { label: "Images extracted", value: stats.images },
  ];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-wrap items-baseline gap-3 rounded-lg border border-border px-5 py-4"
        >
          <span
            aria-hidden={mounted ? undefined : true}
            className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              item.value === 0 && "opacity-30",
            )}
          >
            {mounted ? item.value.toLocaleString() : "—"}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
            {item.label}
          </span>
        </div>
      ))}

      {SITE.productHunt ? (
        <a
          href={SITE.productHunt}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border px-5 py-4 transition-colors hover:border-primary"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            P
          </span>
          <span className="min-w-0">
            <span className="block text-[9px] uppercase tracking-[0.16em] opacity-60">
              Find us on
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-sm font-bold tracking-tight">
              Product Hunt <ExternalLink className="size-3 opacity-60" />
            </span>
          </span>
        </a>
      ) : null}
    </div>
  );
}
