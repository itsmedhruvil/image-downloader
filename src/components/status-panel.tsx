"use client";

import * as React from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HealthPayload {
  status: string;
  archiveStorage: string;
  region: string;
  time: string;
}

interface Check {
  label: string;
  detail: string;
  ok: boolean | null;
}

export function StatusPanel() {
  const [health, setHealth] = React.useState<HealthPayload | null>(null);
  const [checkedAt, setCheckedAt] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [client, setClient] = React.useState<{ sw: boolean; canvas: boolean; clipboard: boolean }>({
    sw: false,
    canvas: false,
    clipboard: false,
  });

  const check = React.useCallback(async () => {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("unhealthy");
      const data = (await response.json()) as HealthPayload;
      setHealth(data);
      setCheckedAt(new Date().toLocaleTimeString());
    } catch {
      setFailed(true);
      setHealth(null);
    } finally {
      setBusy(false);
    }
  }, []);

  React.useEffect(() => {
    void check();
    setClient({
      sw: "serviceWorker" in navigator,
      canvas: typeof document !== "undefined" && Boolean(document.createElement("canvas").getContext),
      clipboard: typeof navigator !== "undefined" && Boolean(navigator.clipboard),
    });
  }, [check]);

  const checks: Check[] = [
    {
      label: "Application API",
      detail: failed ? "Unreachable from this browser" : "Responding to /api/health",
      ok: failed ? false : health ? true : null,
    },
    {
      label: "Archive storage",
      detail: health
        ? health.archiveStorage === "cloudflare-r2"
          ? "Cloudflare R2 (stored archives with expiry)"
          : "Direct streaming (nothing persisted)"
        : "Unknown",
      ok: health ? true : null,
    },
    {
      label: "Service worker",
      detail: client.sw ? "Registered — app is installable" : "Not supported in this browser",
      ok: client.sw,
    },
    {
      label: "Canvas conversion",
      detail: client.canvas ? "Available — format conversion enabled" : "Unavailable in this browser",
      ok: client.canvas,
    },
    {
      label: "Clipboard access",
      detail: client.clipboard ? "Available — copy image URL enabled" : "Unavailable in this browser",
      ok: client.clipboard,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm opacity-70">
          {checkedAt ? `Last checked at ${checkedAt}` : "Checking…"}
          {health?.region ? ` · region ${health.region}` : ""}
        </p>
        <Button variant="outline" size="sm" onClick={() => void check()} disabled={busy}>
          <RefreshCw className={busy ? "size-3.5 animate-spin" : "size-3.5"} /> Re-check
        </Button>
      </div>

      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border">
        {checks.map((item) => (
          <li key={item.label} className="flex items-start gap-4 p-5">
            {item.ok === null ? (
              <span className="mt-0.5 size-4 shrink-0 animate-pulse rounded-full bg-foreground/30" />
            ) : item.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs opacity-70">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs opacity-60">
        Component-level checks reflect this browser session. The application API check reflects the
        deployment you are currently talking to.
      </p>
    </div>
  );
}
