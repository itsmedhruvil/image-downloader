"use client";

import * as React from "react";
import { Download, WifiOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "wie-install-dismissed";

/**
 * Registers the service worker and surfaces a small monochrome install banner
 * plus an offline indicator. The worker is what makes the app installable and
 * gives the gallery a cached image layer.
 */
export function PwaRegistrar() {
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(true);
  const [offline, setOffline] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* registration is best-effort */
        });
      };
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    setOffline(!navigator.onLine);
    setReady(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const dismiss = () => {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <>
      {offline ? (
        <div className="fixed inset-x-0 top-0 z-[60] border-b border-border bg-foreground px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-background">
          <span className="inline-flex items-center gap-2">
            <WifiOff className="size-3.5" /> Offline — the extractor will resume when you reconnect
          </span>
        </div>
      ) : null}

      {ready && installEvent && !dismissed ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-none">
          <Download className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install the app</p>
            <p className="text-xs opacity-70">Faster access, works offline.</p>
          </div>
          <Button size="sm" onClick={install}>
            Install
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={dismiss}>
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
    </>
  );
}
