import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md border border-border bg-foreground/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
