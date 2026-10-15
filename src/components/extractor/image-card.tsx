"use client";

import * as React from "react";
import { Check, Copy, Download, ExternalLink, ImageOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadSingleImage, proxiedUrl } from "@/lib/download";
import { FORMAT_LABELS, SOURCE_LABELS } from "@/lib/extract.core";
import type { ExtractedImage, ImageFormat } from "@/lib/types";
import { cn, formatBytes, shortenUrl } from "@/lib/utils";

export interface Measured {
  width?: number;
  height?: number;
  size?: number | null;
  failed?: boolean;
}

interface ImageCardProps {
  image: ExtractedImage;
  index: number;
  measured?: Measured;
  selected: boolean;
  convertTarget: ImageFormat | "original";
  onToggle: (url: string) => void;
  onMeasure: (url: string, data: Measured) => void;
  onPreview: (image: ExtractedImage) => void;
  onNotify: (message: string) => void;
}

export const ImageCard = React.memo(function ImageCard({
  image,
  index,
  measured,
  selected,
  convertTarget,
  onToggle,
  onMeasure,
  onPreview,
  onNotify,
}: ImageCardProps) {
  const [src, setSrc] = React.useState(() => proxiedUrl(image.url));
  const [stage, setStage] = React.useState<"loading" | "ready" | "failed">("loading");
  const [busy, setBusy] = React.useState(false);
  const fallbackTried = React.useRef(false);

  const handleError = () => {
    if (!fallbackTried.current && !image.url.startsWith("data:")) {
      fallbackTried.current = true;
      setSrc(image.url);
      return;
    }
    setStage("failed");
    onMeasure(image.url, { ...measured, failed: true });
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const element = event.currentTarget;
    setStage("ready");
    onMeasure(image.url, {
      width: element.naturalWidth || undefined,
      height: element.naturalHeight || undefined,
      size: measured?.size,
      failed: false,
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadSingleImage(image, index, convertTarget);
    } catch {
      onNotify("That image could not be downloaded. It may be protected or offline.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      onNotify("Image URL copied to clipboard.");
    } catch {
      onNotify("Could not access the clipboard.");
    }
  };

  const dimensions =
    measured?.width && measured?.height ? `${measured.width} × ${measured.height}` : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors",
        selected ? "border-primary ring-2 ring-ring/30" : "border-border hover:border-primary",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(image.url)}
        aria-pressed={selected}
        aria-label={`Select ${image.name || shortenUrl(image.url)}`}
        className="relative block aspect-square w-full cursor-pointer overflow-hidden bg-background"
      >
        {stage === "failed" ? (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-[11px] uppercase tracking-[0.12em] opacity-60">
            <ImageOff className="size-5" />
            Unavailable
          </span>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={image.name || `Extracted image ${index + 1}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "h-full w-full object-contain p-2 transition-opacity duration-200",
                stage === "ready" ? "opacity-100" : "opacity-0",
              )}
            />
            {stage === "loading" ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-4 animate-spin opacity-40" />
              </span>
            ) : null}
          </>
        )}

        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]">
          {FORMAT_LABELS[image.format]}
        </span>

        <span
          className={cn(
            "absolute right-2 top-2 flex size-6 items-center justify-center rounded-sm border border-border bg-background transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          aria-hidden
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </button>

      <div className="flex flex-col gap-2 border-t border-border p-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold" title={image.url}>
            {image.name || shortenUrl(image.url)}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] uppercase tracking-[0.1em] opacity-60">
            <span>{SOURCE_LABELS[image.source]}</span>
            {dimensions ? <span>{dimensions}</span> : null}
            {measured?.size ? <span>{formatBytes(measured.size)}</span> : null}
            {image.crossOrigin ? <span>external</span> : null}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Download this image"
                disabled={busy || stage === "failed"}
                onClick={handleDownload}
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Preview this image"
                disabled={stage === "failed"}
                onClick={() => onPreview(image)}
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Preview</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Copy image URL" onClick={handleCopy}>
                <Copy className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy URL</TooltipContent>
          </Tooltip>

          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
            <Checkbox checked={selected} onCheckedChange={() => onToggle(image.url)} />
            Pick
          </label>
        </div>
      </div>
    </div>
  );
});

