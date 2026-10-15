"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Monochrome toast surface. All sonner colours are forced to the current
 * foreground/background pair so notifications stay strictly black & white.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-md !border !border-border !bg-background !text-foreground !shadow-none font-sans",
          title: "!text-sm !font-semibold",
          description: "!text-xs !opacity-70",
          actionButton: "!bg-primary !text-primary-foreground !rounded-sm",
          cancelButton: "!bg-background !text-foreground !border !border-border !rounded-sm",
          success: "!text-foreground",
          error: "!text-foreground",
          warning: "!text-foreground",
          info: "!text-foreground",
        },
      }}
    />
  );
}
