"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface the error in the browser console for debugging.
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">
        Something broke
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        The page failed to render
      </h1>
      <p className="mt-4 max-w-md text-sm opacity-75">
        A client-side error interrupted rendering. Retrying usually resolves it — extraction state is
        never stored server-side.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs opacity-50">Reference: {error.digest}</p>
      ) : null}
      <Button className="mt-8" onClick={reset}>
        <RotateCcw className="size-4" /> Try again
      </Button>
    </section>
  );
}
