"use client";

import * as React from "react";
import { AlertTriangle, Code2, Layers, Link2, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageCard, type Measured } from "@/components/extractor/image-card";
import { FilterBar, DEFAULT_FILTERS, type Filters } from "@/components/extractor/filter-bar";
import { SelectionBar } from "@/components/extractor/selection-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { extractImagesFromMarkupClient, extractTitleClient } from "@/lib/extract.client";
import { FORMAT_LABELS, SOURCE_LABELS, normalizeSiteUrl } from "@/lib/extract.core";
import {
  buildClientZip,
  downloadBlob,
  downloadSingleImage,
  proxiedUrl,
  triggerDownload,
} from "@/lib/download";
import type { ExtractMethod, ExtractResponse, ExtractedImage, ImageFormat, ZipResponse } from "@/lib/types";
import { cn, formatBytes, pluralize, shortenUrl } from "@/lib/utils";

const SUGGESTIONS = ["shopify.com", "unsplash.com", "behance.net", "dribbble.com", "wikipedia.org"];
const SIZE_MEASURE_LIMIT = 120;

interface ExtractorProps {
  storage: "r2" | "stream";
}

async function mapLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index] as T, index);
    }
  });
  await Promise.all(runners);
}

export function Extractor({ storage }: ExtractorProps) {
  const [method, setMethod] = React.useState<ExtractMethod>("url");
  const [urlInput, setUrlInput] = React.useState("");
  const [bulkInput, setBulkInput] = React.useState("");
  const [htmlInput, setHtmlInput] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");

  const [images, setImages] = React.useState<ExtractedImage[]>([]);
  const [summary, setSummary] = React.useState<ExtractResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [extracted, setExtracted] = React.useState(false);

  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [measured, setMeasured] = React.useState<Record<string, Measured>>({});
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [convertTarget, setConvertTarget] = React.useState<ImageFormat | "original">("original");
  const [zipping, setZipping] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [preview, setPreview] = React.useState<ExtractedImage | null>(null);

  const notify = React.useCallback((message: string) => {
    toast(message);
  }, []);

  const handleMeasure = React.useCallback((url: string, data: Measured) => {
    setMeasured((current) => {
      const previous = current[url];
      const merged: Measured = {
        width: data.width ?? previous?.width,
        height: data.height ?? previous?.height,
        size: data.size ?? previous?.size,
        failed: data.failed ?? previous?.failed,
      };
      if (
        previous &&
        previous.width === merged.width &&
        previous.height === merged.height &&
        previous.size === merged.size &&
        previous.failed === merged.failed
      ) {
        return current;
      }
      return { ...current, [url]: merged };
    });
  }, []);

  /** Ask the proxy for each file's byte size without downloading the pixels. */
  const measureSizes = React.useCallback(
    async (list: ExtractedImage[]) => {
      await mapLimit(list.slice(0, SIZE_MEASURE_LIMIT), 5, async (image) => {
        if (image.url.startsWith("data:")) return;
        try {
          const response = await fetch(
            `/api/proxy?meta=1&url=${encodeURIComponent(image.url)}`,
          );
          if (!response.ok) return;
          const data = (await response.json()) as { size: number | null };
          if (typeof data.size === "number" && data.size > 0) {
            handleMeasure(image.url, { size: data.size });
          }
        } catch {
          /* size is optional */
        }
      });
    },
    [handleMeasure],
  );

  const resetResults = React.useCallback(() => {
    setImages([]);
    setSummary(null);
    setSelected(new Set());
    setMeasured({});
    setExtracted(false);
    setError(null);
  }, []);

  const runExtract = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    setSelected(new Set());
    setMeasured({});
    setProgress(null);

    try {
      if (method === "html") {
        if (!htmlInput.trim()) {
          setError("Paste some HTML or CSS to scan.");
          setLoading(false);
          return;
        }
        // Parsed locally — the markup never leaves the browser.
        const found = extractImagesFromMarkupClient(htmlInput, baseUrl || undefined);
        setImages(found);
        setSummary({
          images: found,
          resolvedUrl: null,
          title: extractTitleClient(htmlInput),
          pagesScanned: 1,
          warnings: [],
          durationMs: 0,
        });
        setExtracted(true);
        if (found.length === 0) {
          toast("No images found in that markup.");
        } else {
          toast(`${found.length} ${pluralize(found.length, "image")} found.`);
        }
        void measureSizes(found);
        return;
      }

      const raw = method === "bulk" ? bulkInput : urlInput;
      if (!raw.trim()) {
        setError(method === "bulk" ? "Paste at least one URL." : "Paste a website URL.");
        return;
      }

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method, url: raw }),
      });

      const data = (await response.json()) as ExtractResponse & { error?: string; details?: string[] };

      if (!response.ok) {
        setError(data.error ?? "Extraction failed.");
        setImages([]);
        setSummary(null);
        setExtracted(true);
        return;
      }

      setImages(data.images);
      setSummary(data);
      setExtracted(true);

      if (data.images.length === 0) {
        toast("No images found on that page.");
      } else {
        toast(`${data.images.length} ${pluralize(data.images.length, "image")} found.`);
      }

      void measureSizes(data.images);
    } catch {
      setError("Something went wrong while extracting. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, bulkInput, htmlInput, measureSizes, method, urlInput]);

  const filtered = React.useMemo(() => {
    const list = images.filter((image) => {
      if (filters.formats.length > 0 && !filters.formats.includes(image.format)) return false;
      const size = measured[image.url]?.size ?? null;
      if (filters.minSizeKb > 0 && size !== null && size < filters.minSizeKb * 1024) return false;
      const width = measured[image.url]?.width ?? null;
      const height = measured[image.url]?.height ?? null;
      if (filters.minWidth > 0 && width !== null && width < filters.minWidth) return false;
      if (filters.minHeight > 0 && height !== null && height < filters.minHeight) return false;
      return true;
    });

    const sorted = [...list];
    switch (filters.sort) {
      case "size":
        sorted.sort((a, b) => (measured[b.url]?.size ?? 0) - (measured[a.url]?.size ?? 0));
        break;
      case "dimensions":
        sorted.sort(
          (a, b) =>
            (measured[b.url]?.width ?? 0) * (measured[b.url]?.height ?? 0) -
            (measured[a.url]?.width ?? 0) * (measured[a.url]?.height ?? 0),
        );
        break;
      case "format":
        sorted.sort((a, b) => a.format.localeCompare(b.format));
        break;
      case "name":
        sorted.sort((a, b) => (a.name || a.url).localeCompare(b.name || b.url));
        break;
      default:
        break;
    }
    return sorted;
  }, [filters, images, measured]);

  const toggleSelect = React.useCallback((url: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const selectAll = React.useCallback(() => {
    setSelected(new Set(filtered.map((image) => image.url)));
  }, [filtered]);

  const clearSelection = React.useCallback(() => setSelected(new Set()), []);

  const selectedImages = React.useMemo(
    () => images.filter((image) => selected.has(image.url)),
    [images, selected],
  );

  const downloadZip = React.useCallback(async () => {
    if (selectedImages.length === 0) return;
    setZipping(true);
    setProgress(null);

    try {
      if (convertTarget !== "original") {
        // Conversion happens with the Canvas API, so the ZIP is assembled locally.
        setProgress({ done: 0, total: selectedImages.length });
        const result = await buildClientZip(selectedImages, convertTarget, (done, total) =>
          setProgress({ done, total }),
        );
        if (result.included === 0) {
          toast.error("None of the selected images could be converted.");
          return;
        }
        downloadBlob(result.blob, result.filename);
        toast.success(
          `ZIP ready — ${result.included} ${pluralize(result.included, "image")} converted in your browser.`,
        );
        return;
      }

      const response = await fetch("/api/zip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          images: selectedImages.map((image) => ({ url: image.url, name: image.name })),
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "The ZIP could not be created.");
        return;
      }

      if (contentType.includes("application/json")) {
        const data = (await response.json()) as ZipResponse;
        triggerDownload(data.downloadUrl, data.filename);
        toast.success(
          `ZIP ready — ${formatBytes(data.size)}${data.stored ? ", stored in R2" : ""}.`,
        );
        if (data.skipped?.length) {
          toast.warning(`${data.skipped.length} ${pluralize(data.skipped.length, "image")} could not be fetched.`);
        }
        return;
      }

      const blob = await response.blob();
      const skipped = Number(response.headers.get("x-archive-skipped") ?? "0");
      downloadBlob(blob, `website-images-${Date.now()}.zip`);
      toast.success(`ZIP ready — ${formatBytes(blob.size)}.`);
      if (skipped > 0) {
        toast.warning(`${skipped} ${pluralize(skipped, "image")} could not be fetched.`);
      }
    } catch {
      toast.error("The ZIP could not be created. Try a smaller selection.");
    } finally {
      setZipping(false);
      setProgress(null);
    }
  }, [convertTarget, selectedImages]);

  const downloadSelected = React.useCallback(async () => {
    if (selectedImages.length === 0) return;
    if (selectedImages.length > 12) {
      toast(`Downloading ${selectedImages.length} files individually — this may take a moment.`);
    }
    await mapLimit(selectedImages, 3, async (image, index) => {
      try {
        await downloadSingleImage(image, index, convertTarget);
      } catch {
        /* reported by the aggregate toast below */
      }
    });
  }, [convertTarget, selectedImages]);


  return (
    <section id="scraper" className="scroll-mt-24">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <Tabs value={method} onValueChange={(value) => setMethod(value as ExtractMethod)}>
          <TabsList>
            <TabsTrigger value="url">
              <Link2 className="size-3.5" /> Website URL
            </TabsTrigger>
            <TabsTrigger value="html">
              <Code2 className="size-3.5" /> HTML code
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <Layers className="size-3.5" /> Bulk URLs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void runExtract();
              }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <Input
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder="https://example.com/page"
                inputMode="url"
                autoComplete="url"
                aria-label="Website URL"
                className="h-11"
              />
              <Button type="submit" size="lg" disabled={loading} className="sm:w-40">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {loading ? "Scanning…" : "Extract"}
              </Button>
            </form>

            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="uppercase tracking-[0.12em] opacity-60">Try</span>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setUrlInput(suggestion)}
                  className="underline underline-offset-4 opacity-80 hover:opacity-100"
                >
                  {suggestion}
                </button>
              ))}
            </p>
          </TabsContent>

          <TabsContent value="html">
            <Textarea
              value={htmlInput}
              onChange={(event) => setHtmlInput(event.target.value)}
              placeholder={'<img src="/hero.webp" alt="Hero" />\n<div style="background-image:url(bg.jpg)"></div>'}
              aria-label="HTML or CSS to scan"
              spellCheck={false}
              className="min-h-40 font-mono text-xs"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="Optional base URL for relative paths (https://example.com)"
                inputMode="url"
                aria-label="Base URL"
              />
              <Button onClick={() => void runExtract()} disabled={loading} className="sm:w-40">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Extract
              </Button>
            </div>
            <p className="mt-3 text-xs opacity-60">
              Parsed locally in your browser — the markup never leaves this device.
            </p>
          </TabsContent>

          <TabsContent value="bulk">
            <Textarea
              value={bulkInput}
              onChange={(event) => setBulkInput(event.target.value)}
              placeholder={"https://example.com\nhttps://example.com/pricing\nexample.org/gallery"}
              aria-label="Website URLs, one per line"
              spellCheck={false}
              className="min-h-32 font-mono text-xs"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs opacity-60">Up to 5 URLs, one per line or comma separated.</p>
              <Button onClick={() => void runExtract()} disabled={loading} className="sm:w-40">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
                Extract all
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4 text-[11px] uppercase tracking-[0.12em] opacity-60">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3" /> No signup required
          </span>
          <span>100% free</span>
          <span>Nothing is logged</span>
          <span>{storage === "r2" ? "ZIP via Cloudflare R2" : "ZIP streamed directly"}</span>
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border border-border p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="opacity-90">{error}</p>
        </div>
      ) : null}

      {summary?.warnings?.length ? (
        <ul className="mt-4 space-y-1 rounded-md border border-border p-3 text-xs opacity-80">
          {summary.warnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      ) : null}

      {summary && !error && images.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70">
          <span>
            <span className="font-bold">{images.length}</span>{" "}
            {pluralize(images.length, "image")} extracted
          </span>
          {summary.title ? <span className="truncate">from “{summary.title}”</span> : null}
          {summary.pagesScanned > 1 ? <span>{summary.pagesScanned} pages scanned</span> : null}
          {summary.durationMs > 0 ? <span>in {(summary.durationMs / 1000).toFixed(1)}s</span> : null}
          <Button variant="ghost" size="sm" onClick={resetResults}>
            <Trash2 className="size-3.5" /> Clear results
          </Button>
        </div>
      ) : null}


      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-lg border border-border p-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && extracted && images.length === 0 && !error ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-semibold">No images found</p>
          <p className="mx-auto mt-2 max-w-md text-sm opacity-70">
            The page may require a login, block automated access, or only build its images after
            client-side scripts run. Try the HTML tab with the page source from your browser.
          </p>
        </div>
      ) : null}

      {!loading && images.length > 0 ? (
        <div className="mt-6 space-y-4">
          <FilterBar
            images={images}
            filters={filters}
            onChange={setFilters}
            matched={filtered.length}
            total={images.length}
          />

          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm opacity-70">
              No images match the current filters.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.slice(0, 400).map((image, index) => (
                  <ImageCard
                    key={image.url}
                    image={image}
                    index={index}
                    measured={measured[image.url]}
                    selected={selected.has(image.url)}
                    convertTarget={convertTarget}
                    onToggle={toggleSelect}
                    onMeasure={handleMeasure}
                    onPreview={setPreview}
                    onNotify={notify}
                  />
                ))}
              </div>
              {filtered.length > 400 ? (
                <p className="text-center text-xs opacity-60">
                  Showing the first 400 of {filtered.length} matches — narrow the filters to see the
                  rest.
                </p>
              ) : null}

              <SelectionBar
                selectedCount={selected.size}
                matchedCount={filtered.length}
                totalCount={images.length}
                convertTarget={convertTarget}
                onConvertChange={setConvertTarget}
                onSelectAll={selectAll}
                onClear={clearSelection}
                onDownloadZip={() => void downloadZip()}
                onDownloadSelected={() => void downloadSelected()}
                zipping={zipping}
                progress={progress}
                storage={storage}
              />
            </>
          )}
        </div>
      ) : null}

      <Dialog open={preview !== null} onOpenChange={(open) => (!open ? setPreview(null) : null)}>
        <DialogContent className="max-w-3xl">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle className="truncate pr-8">
                  {preview.name || shortenUrl(preview.url, 60)}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.1em]">
                  <span>{FORMAT_LABELS[preview.format]}</span>
                  <span>{SOURCE_LABELS[preview.source]}</span>
                  {measured[preview.url]?.width && measured[preview.url]?.height ? (
                    <span>
                      {measured[preview.url]?.width} × {measured[preview.url]?.height}
                    </span>
                  ) : null}
                  {measured[preview.url]?.size ? (
                    <span>{formatBytes(measured[preview.url]?.size)}</span>
                  ) : null}
                </DialogDescription>
              </DialogHeader>

              <div className="flex max-h-[55vh] items-center justify-center overflow-hidden rounded-md border border-border bg-background p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url.startsWith("data:") ? preview.url : proxiedUrl(preview.url)}
                  alt={preview.name || "Extracted image preview"}
                  className="max-h-[52vh] w-auto max-w-full object-contain"
                />
              </div>

              <p className="break-all font-mono text-[11px] opacity-60">{preview.url}</p>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    toggleSelect(preview.url);
                    setPreview(null);
                  }}
                >
                  {selected.has(preview.url) ? "Remove from selection" : "Add to selection"}
                </Button>
                <Button
                  onClick={() => {
                    const index = images.findIndex((image) => image.url === preview.url);
                    void downloadSingleImage(preview, index < 0 ? 0 : index, convertTarget).catch(
                      () => toast.error("That image could not be downloaded."),
                    );
                  }}
                >
                  Download image
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>


    </section>
  );

}
