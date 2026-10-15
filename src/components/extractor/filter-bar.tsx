"use client";

import * as React from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMAT_LABELS } from "@/lib/extract.core";
import type { ExtractedImage, ImageFormat } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SortKey = "source" | "name" | "format" | "size" | "dimensions";

export interface Filters {
  formats: ImageFormat[];
  minWidth: number;
  minHeight: number;
  minSizeKb: number;
  sort: SortKey;
}

export const DEFAULT_FILTERS: Filters = {
  formats: [],
  minWidth: 0,
  minHeight: 0,
  minSizeKb: 0,
  sort: "source",
};

interface FilterBarProps {
  images: ExtractedImage[];
  filters: Filters;
  onChange: (next: Filters) => void;
  matched: number;
  total: number;
}

export function FilterBar({ images, filters, onChange, matched, total }: FilterBarProps) {
  const formatCounts = React.useMemo(() => {
    const counts = new Map<ImageFormat, number>();
    for (const image of images) {
      counts.set(image.format, (counts.get(image.format) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [images]);

  const toggleFormat = (format: ImageFormat) => {
    const active = filters.formats.includes(format);
    onChange({
      ...filters,
      formats: active
        ? filters.formats.filter((value) => value !== format)
        : [...filters.formats, format],
    });
  };

  const dirty =
    filters.formats.length > 0 ||
    filters.minWidth > 0 ||
    filters.minHeight > 0 ||
    filters.minSizeKb > 0;

  return (
    <section aria-label="Image filters" className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <Filter className="size-3.5" /> Filters
        </p>
        <p className="text-xs opacity-70">
          Showing <span className="font-bold">{matched}</span> of {total} images
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ ...filters, formats: [] })}
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
            filters.formats.length === 0
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-primary hover:text-primary-foreground",
          )}
        >
          All formats
        </button>
        {formatCounts.map(([format, count]) => {
          const active = filters.formats.includes(format);
          return (
            <button
              key={format}
              type="button"
              onClick={() => toggleFormat(format)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {FORMAT_LABELS[format]} · {count}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="filter-min-width">Min width (px)</Label>
          <Input
            id="filter-min-width"
            type="number"
            inputMode="numeric"
            min={0}
            max={20000}
            placeholder="0"
            value={filters.minWidth || ""}
            onChange={(event) =>
              onChange({ ...filters, minWidth: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-min-height">Min height (px)</Label>
          <Input
            id="filter-min-height"
            type="number"
            inputMode="numeric"
            min={0}
            max={20000}
            placeholder="0"
            value={filters.minHeight || ""}
            onChange={(event) =>
              onChange({ ...filters, minHeight: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-min-size">Min size (KB)</Label>
          <Input
            id="filter-min-size"
            type="number"
            inputMode="numeric"
            min={0}
            max={102400}
            placeholder="0"
            value={filters.minSizeKb || ""}
            onChange={(event) =>
              onChange({ ...filters, minSizeKb: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-sort">Sort by</Label>
          <Select
            value={filters.sort}
            onValueChange={(value) => onChange({ ...filters, sort: value as SortKey })}
          >
            <SelectTrigger id="filter-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source">Page order</SelectItem>
              <SelectItem value="dimensions">Largest dimensions</SelectItem>
              <SelectItem value="size">Largest file</SelectItem>
              <SelectItem value="format">Format</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {dirty ? (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
            <RotateCcw className="size-3.5" /> Reset filters
          </Button>
        </div>
      ) : null}

    </section>
  );
}
