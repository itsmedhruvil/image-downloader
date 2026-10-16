"use client";

import * as React from "react";
import { CheckSquare, Download, Loader2, Package, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ImageFormat } from "@/lib/types";

interface SelectionBarProps {
  selectedCount: number;
  matchedCount: number;
  totalCount: number;
  convertTarget: ImageFormat | "original";
  onConvertChange: (value: ImageFormat | "original") => void;
  onSelectAll: () => void;
  onClear: () => void;
  onDownloadZip: () => void;
  onDownloadSelected: () => void;
  zipping: boolean;
  progress: { done: number; total: number } | null;
  storage: "r2" | "stream";
}

export function SelectionBar({
  selectedCount,
  matchedCount,
  totalCount,
  convertTarget,
  onConvertChange,
  onSelectAll,
  onClear,
  onDownloadZip,
  onDownloadSelected,
  zipping,
  progress,
  storage,
}: SelectionBarProps) {
  const disabled = selectedCount === 0 || zipping;

  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]">
            {selectedCount} selected
          </p>
          <span className="text-xs opacity-60">
            of {matchedCount} shown · {totalCount} extracted
          </span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={onSelectAll} disabled={matchedCount === 0}>
              <CheckSquare className="size-3.5" /> Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={onClear} disabled={selectedCount === 0}>
              <X className="size-3.5" /> Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="convert-format" className="whitespace-nowrap">
              Format
            </Label>
            <Select
              value={convertTarget}
              onValueChange={(value) => onConvertChange(value as ImageFormat | "original")}
            >
              <SelectTrigger id="convert-format" className="h-8 w-[8.5rem] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Keep original</SelectItem>
                <SelectItem value="png">Convert to PNG</SelectItem>
                <SelectItem value="jpg">Convert to JPG</SelectItem>
                <SelectItem value="webp">Convert to WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={onDownloadSelected} disabled={disabled}>
            <Download className="size-4" /> Download {selectedCount > 1 ? "files" : "file"}
          </Button>

          <Button onClick={onDownloadZip} disabled={disabled} className="min-w-[13rem]">
            {zipping ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {progress ? `Packaging ${progress.done}/${progress.total}` : "Packaging…"}
              </>
            ) : (
              <>
                <Package className="size-4" /> Download {selectedCount}{" "}
                {selectedCount === 1 ? "image" : "images"} as ZIP
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="mx-auto w-full max-w-[1600px] px-4 pb-3 text-[11px] uppercase tracking-[0.12em] opacity-50 sm:px-6 lg:px-8">
        {storage === "r2"
          ? "Archives are stored briefly in Cloudflare R2 and expire automatically."
          : "Archives are streamed straight to you — nothing is stored."}
      </p>
    </div>
  );
}
