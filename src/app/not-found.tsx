import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">Error 404</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Page not found</h1>
      <p className="mt-4 text-sm opacity-75">
        That page does not exist. It may have been renamed, or the link may be incomplete.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to the extractor
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/documentation">
            <Search className="size-4" /> Browse documentation
          </Link>
        </Button>
      </div>
    </section>
  );
}
