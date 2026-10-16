import { Container } from "@/components/container";
import { Extractor } from "@/components/extractor/extractor";
import { getStorageMode } from "@/lib/storage-mode";

export default function HomePage() {
  const storage = getStorageMode();

  return (
    <Container className="py-8 lg:py-10" id="extractor">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Website Image Extractor
          </h1>
          <p className="mt-2 text-sm opacity-70">
            Pull images from a page URL, pasted HTML, a batch of URLs, or Unsplash / Pexels /
            Pixabay. Filter, review, then download individually or as one ZIP.
          </p>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-50">
          {storage === "r2" ? "Archive storage: Cloudflare R2" : "Archive storage: streamed"}
        </p>
      </div>

      <Extractor storage={storage} />
    </Container>
  );
}
