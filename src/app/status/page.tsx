import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { StatusPanel } from "@/components/status-panel";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Live status of the website image extractor: API availability, archive storage backend and browser capability checks.",
  alternates: { canonical: "/status" },
};

export default function StatusPage() {
  return (
    <>
      <PageHero
        eyebrow="Status"
        title="Service status"
        description="A live view of the extractor's moving parts. Extraction itself has no database dependency, so it keeps working even when storage is unavailable."
      />
      <StatusPanel />
    </>
  );
}
