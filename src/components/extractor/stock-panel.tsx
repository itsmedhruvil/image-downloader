"use client";

import * as React from "react";
import { Link2, Loader2, Plus, Search, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { guessFormat } from "@/lib/extract.core";
import {
  DEFAULT_GROUP_COUNT,
  MAX_GROUP_COUNT,
  MAX_GROUPS,
  ORIENTATIONS,
  STOCK_PROVIDERS,
  type AnalyzeUrlResponse,
  type Orientation,
  type ProviderStatus,
  type StockImage,
  type StockProvider,
  type StockSearchResponse,
} from "@/lib/stock/types";
import type { ExtractedImage } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "if-recent-searches";
const RECENT_URLS_KEY = "if-recent-urls";

export interface StockMeta {
  title: string | null;
  warnings: string[];
  durationMs: number;
}

interface StockPanelProps {
  onResults: (images: ExtractedImage[], meta: StockMeta) => void;
  onError: (message: string | null) => void;
  setBusy: (busy: boolean) => void;
}

interface KeywordRow {
  id: string;
  keyword: string;
  count: number;
  include: boolean;
}

function newRow(keyword = "", count = DEFAULT_GROUP_COUNT): KeywordRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    keyword,
    count,
    include: true,
  };
}

/** Provider hit → the gallery's image shape. */
export function stockImageToExtracted(image: StockImage): ExtractedImage {
  return {
    url: image.url,
    format: guessFormat(image.url),
    name: image.filename,
    source: "stock",
    crossOrigin: true,
    previewUrl: image.previewUrl,
    provider: image.provider,
    credit: image.credit,
    attributionUrl: image.attributionUrl ?? undefined,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  };
}

export function StockPanel({ onResults, onError, setBusy }: StockPanelProps) {
  const [providers, setProviders] = React.useState<ProviderStatus | null>(null);
  const [enabled, setEnabled] = React.useState<StockProvider[]>([]);
  const [mode, setMode] = React.useState<"keywords" | "url">("keywords");
  const [orientation, setOrientation] = React.useState<Orientation | "all">("all");
  const [rows, setRows] = React.useState<KeywordRow[]>(() => [newRow()]);
  const [url, setUrl] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [recents, setRecents] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch("/api/providers")
      .then((response) => response.json())
      .then((status: ProviderStatus) => {
        setProviders(status);
        setEnabled(STOCK_PROVIDERS.filter((provider) => status[provider]));
      })
      .catch(() => {
        setProviders({ unsplash: false, pexels: false, pixabay: false });
        toast.error("Could not load image sources. Check the server configuration.");
      });

    try {
      setRecents(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]"));
    } catch {
      setRecents([]);
    }
  }, []);

  const activeCount = enabled.length;
  const readyRows = rows.filter((row) => row.include && row.keyword.trim().length > 0);

  const toggleProvider = (provider: StockProvider) => {
    setEnabled((current) =>
      current.includes(provider)
        ? current.filter((value) => value !== provider)
        : [...current, provider],
    );
  };

  const updateRow = (id: string, patch: Partial<KeywordRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const rememberSearches = (keywords: string[]) => {
    try {
      const next = [...keywords.filter((keyword) => !recents.includes(keyword)), ...recents].slice(
        0,
        10,
      );
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      setRecents(next);
    } catch {
      /* best effort */
    }
  };

  const analyzeUrl = async () => {
    if (!url.trim()) {
      onError("Enter a website URL first.");
      return;
    }
    onError(null);
    setAnalyzing(true);
    setBusy(true);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await response.json()) as AnalyzeUrlResponse & { error?: string };

      if (!response.ok) {
        onError(data.error ?? "Could not analyze that page.");
        return;
      }

      setRows(data.sections.map((section) => newRow(section.suggestedKeyword, 8)));
      // Show the editable keyword list so results can be tuned before searching.
      setMode("keywords");

      try {
        const stored = JSON.parse(window.localStorage.getItem(RECENT_URLS_KEY) ?? "[]") as string[];
        const next = [url.trim(), ...stored.filter((entry) => entry !== url.trim())].slice(0, 5);
        window.localStorage.setItem(RECENT_URLS_KEY, JSON.stringify(next));
      } catch {
        /* best effort */
      }

      toast.success(
        `Found ${data.sections.length} ${data.sections.length === 1 ? "section" : "sections"} with suggested keywords.`,
      );
    } catch {
      onError("Could not analyze that page.");
    } finally {
      setAnalyzing(false);
      setBusy(false);
    }
  };

  const runSearch = async () => {
    if (activeCount === 0) {
      onError("Enable at least one image source above.");
      return;
    }
    if (readyRows.length === 0) {
      onError("Add at least one keyword, or suggest keywords from a website URL.");
      return;
    }

    onError(null);
    setSearching(true);
    setBusy(true);

    try {
      const response = await fetch("/api/stock/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providers: enabled,
          orientation: orientation === "all" ? null : orientation,
          groups: readyRows.map((row) => ({
            name: row.keyword.trim(),
            keyword: row.keyword.trim(),
            count: row.count,
          })),
        }),
      });

      const data = (await response.json()) as StockSearchResponse & { error?: string };

      if (!response.ok) {
        onError(data.error ?? "The search failed.");
        return;
      }

      const images = data.results.flatMap((group) => group.images).map(stockImageToExtracted);

      rememberSearches(readyRows.map((row) => row.keyword.trim()));
      onResults(images, {
        title: readyRows.map((row) => row.keyword.trim()).join(", "),
        warnings: data.warnings,
        durationMs: data.durationMs,
      });

      if (images.length === 0) {
        toast("No images matched that search.");
      } else {
        toast(`${images.length} ${images.length === 1 ? "image" : "images"} found.`);
      }
    } catch {
      onError("The search failed. Please try again.");
    } finally {
      setSearching(false);
      setBusy(false);
    }
  };

  const addRow = (keyword = "") => {
    setRows((current) => (current.length >= MAX_GROUPS ? current : [...current, newRow(keyword)]));
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border p-1">
        {(
          [
            { value: "keywords", label: "By keywords", icon: Search },
            { value: "url", label: "By website URL", icon: Link2 },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
              mode === option.value
                ? "bg-primary text-primary-foreground"
                : "opacity-70 hover:opacity-100",
            )}
          >
            <option.icon className="size-3.5" /> {option.label}
          </button>
        ))}
      </div>

      {mode === "keywords" ? (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.id} className="flex items-center gap-2">
              <Checkbox
                checked={row.include}
                onCheckedChange={() => updateRow(row.id, { include: !row.include })}
                aria-label={`Include keyword ${index + 1}`}
              />
              <Input
                value={row.keyword}
                onChange={(event) => updateRow(row.id, { keyword: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder={index === 0 ? "e.g. mountain landscape" : "another keyword"}
                aria-label={`Keyword ${index + 1}`}
                className="flex-1"
              />
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_GROUP_COUNT}
                value={row.count}
                onChange={(event) =>
                  updateRow(row.id, {
                    count: Math.min(
                      MAX_GROUP_COUNT,
                      Math.max(1, Number(event.target.value) || DEFAULT_GROUP_COUNT),
                    ),
                  })
                }
                aria-label={`Images for keyword ${index + 1}`}
                className="w-20"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
                aria-label={`Remove keyword ${index + 1}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRow()}
              disabled={rows.length >= MAX_GROUPS}
            >
              <Plus className="size-3.5" /> Add keyword
            </Button>
            <span className="text-xs opacity-60">
              Images per keyword (1–{MAX_GROUP_COUNT}) · up to {MAX_GROUPS} keywords
            </span>
          </div>

          {recents.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-50">
                Recent
              </span>
              {recents.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => addRow(term)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-[11px] transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {term}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void analyzeUrl();
                }
              }}
              placeholder="https://example.com"
              inputMode="url"
              aria-label="Website URL to analyze"
              className="flex-1"
            />
            <Button
              onClick={() => void analyzeUrl()}
              disabled={analyzing}
              className="sm:w-56"
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              Suggest keywords
            </Button>
          </div>
          <p className="text-xs opacity-60">
            Reads the page&apos;s own headings and copy, then turns them into search keywords you can
            edit before running the search.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="stock-orientation">Orientation</Label>
          <Select
            value={orientation}
            onValueChange={(value) => setOrientation(value as Orientation | "all")}
          >
            <SelectTrigger id="stock-orientation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORIENTATIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Image sources</Label>
          <div className="flex flex-wrap gap-1.5">
            {STOCK_PROVIDERS.map((provider) => {
              const available = providers?.[provider] ?? false;
              const active = enabled.includes(provider);
              return (
                <button
                  key={provider}
                  type="button"
                  disabled={!available}
                  onClick={() => toggleProvider(provider)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    !available && "cursor-not-allowed opacity-40",
                    active && available
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {provider}
                  {!available ? <span className="normal-case tracking-normal">· no key</span> : null}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed opacity-60">
            {providers === null
              ? "Checking configured sources…"
              : activeCount === 0
                ? "No source configured — set UNSPLASH_ACCESS_KEY, PEXELS_API_KEY or PIXABAY_API_KEY."
                : `${activeCount} source${activeCount === 1 ? "" : "s"} active. Images are fetched server-side and each ZIP includes credits.txt attribution.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => void runSearch()}
          disabled={searching || analyzing || activeCount === 0}
          className="min-w-[12rem]"
        >
          {searching ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Searching…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Search images
            </>
          )}
        </Button>
        <span className="text-xs opacity-60">
          {readyRows.length} keyword{readyRows.length === 1 ? "" : "s"} ready
        </span>
      </div>
    </div>
  );
}
