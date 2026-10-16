# Website Image Extractor

Internal tool for pulling images off the web. Four modes, one gallery, one ZIP pipeline.

- **Website URL** — fetch a page server-side and collect every image reference.
- **HTML code** — paste markup (or CSS) and parse it locally in the browser.
- **Bulk URLs** — scan up to five pages and merge the results.
- **Stock photos** — search Unsplash, Pexels and Pixabay by keyword, or derive keywords from a
  page's own sections.

Results land in a shared gallery with format, dimension and size filters, per-image download,
clipboard copy, in-browser format conversion, and bulk ZIP download.

This is an **internal tool**: it is marked `noindex`, `robots.txt` disallows crawling, there is no
account layer, and the public-site surface (pricing, blog, contact, legal pages, ads, marketing
sections) has been removed. Put it behind your own access control if it should not be reachable.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 with monochrome CSS-variable tokens |
| Components | Radix UI primitives (hand-rolled shadcn-style wrappers) |
| Parsing | cheerio (server) / `DOMParser` (client) |
| ZIP | `jszip` (server and browser) |
| Archive storage | Cloudflare R2 via `@aws-sdk/client-s3` (optional) |
| Hosting | Vercel (or any Node host) |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are required. Without R2 configured, ZIP archives are streamed straight
back to the browser instead of being stored; without stock API keys, the Stock photos tab shows its
providers as inactive.

```bash
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
```

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute base URL for metadata (defaults to `http://localhost:3000`) |
| `R2_ACCOUNT_ID` | No | Cloudflare account id used to build the R2 endpoint |
| `R2_ACCESS_KEY_ID` | No | R2 API token access key id |
| `R2_SECRET_ACCESS_KEY` | No | R2 API token secret |
| `R2_BUCKET` | No | Bucket that holds generated archives |
| `R2_ENDPOINT` | No | Override the S3 endpoint (MinIO or other S3-compatible stores) |
| `R2_ZIP_TTL_SECONDS` | No | Archive lifetime in seconds (default `3600`) |
| `FETCH_USER_AGENT` | No | Override the outbound user agent |
| `UNSPLASH_ACCESS_KEY` | No | Unsplash access key for stock photo search |
| `PEXELS_API_KEY` | No | Pexels API key for stock photo search |
| `PIXABAY_API_KEY` | No | Pixabay API key for stock photo search |

Add an R2 lifecycle rule that deletes everything under the `zips/` prefix after a day, as a backstop
for archives that are generated but never downloaded.

## Architecture

```
src/
  app/
    page.tsx                     # the tool
    documentation/ changelog/ status/ feedback/
    api/
      extract/route.ts           # scan a URL, a batch of URLs, or pasted markup
      proxy/route.ts             # stream images (hotlink-safe) + ?meta=1 size probe
      zip/route.ts               # build a ZIP, store in R2 or stream it back
      download/[...key]/route.ts # stream a stored archive from R2
      providers/route.ts         # which stock sources have API keys configured
      stock/search/route.ts      # multi-source stock photo search
      analyze-url/route.ts       # suggest keywords from a page's structure
      feedback/route.ts          # record feedback in R2
      health/route.ts            # readiness probe for the status page
  components/
    container.tsx                # the single page container + card classes
    extractor/                   # extractor, image card, filter bar, selection bar, stock panel
    ui/                          # monochrome shadcn-style primitives
  lib/
    extract.core.ts              # shared, DOM-free extraction helpers
    extract.server.ts            # cheerio collector
    extract.client.ts            # DOMParser collector
    stock/providers.ts           # Unsplash / Pexels / Pixabay clients + normalisers
    stock/search.ts              # bounded provider fan-out
    stock/keywords.ts            # heading-aware keyword derivation
    zip.ts                       # server ZIP builder with limits
    credits.ts                   # attribution file shared by both ZIP paths
    r2.ts                        # Cloudflare R2 (S3 API) wrapper
    net.ts                       # SSRF guard + page fetcher
    download.ts                  # client download/convert helpers
public/
  sw.js manifest.webmanifest offline.html icons
scripts/generate_icons.py        # regenerates the monochrome PWA icons
tests/                           # extraction, content/layout, stock, R2, UI suites
```

## Layout conventions

The whole app shares **one** container width so nothing drifts out of alignment:

- `CONTAINER_CLASS` in `src/components/container.tsx` is the single source of truth
  (`mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8`). The header, footer, selection bar, page
  heroes and every page use it.
- `SECTION_PADDING` (`py-12 lg:py-16`) gives every section the same vertical rhythm.
- `CARD_CLASS` / `CARD_GRID_CLASS` make content cards equal-height flex columns on a single gap.
- Long-form prose (docs) fills the full width using balanced CSS columns (`.prose-columns`).

`tests/content.test.mts` enforces this, along with the internal-tool surface (no marketing pages or
copy, `noindex`, working nav links).

## Security notes

- All server-side fetches pass through an SSRF guard (`src/lib/net.ts`) that rejects non-http(s)
  schemes, `localhost`/`.internal` hostnames, and any host that resolves to a private, link-local,
  loopback or cloud-metadata address.
- The image proxy only ever returns image content types, caps responses at 25 MB, and applies a
  restrictive `Content-Security-Policy` with `sandbox`.
- ZIP archives are addressed by random, unguessable keys under the `zips/` prefix; only that prefix
  is servable, and keys containing `..` are rejected.

## Request limits

| Limit | Value |
| --- | --- |
| Images per ZIP | 400 |
| Bytes per image | 30 MB |
| Total archive bytes | 150 MB |
| Download timeout per image | 20 s |
| Page fetch timeout | 20 s |
| Max page size scanned | 8 MB |
| Bulk URLs per request | 5 |
| Provider calls per stock search | 24 |
| Images per stock search | 200 |

## Testing

All suites run without a browser or network access, using `tsx` + `jsdom`:

```bash
npm test              # all suites
npm run test:extract  # shared helpers, cheerio collector, DOMParser collector, ZIP builder
npm run test:content  # internal-tool invariants, layout uniformity, docs and changelog
npm run test:stock    # provider normalisation, fan-out limits, keyword derivation, credits.txt
npm run test:r2       # Cloudflare R2 round trip against an in-memory S3 mock
npm run test:ui       # React extractor flow in jsdom (gallery, filters, selection, ZIP, stock)
```

`npm run typecheck` checks the app; `npm run typecheck:tests` checks the test sources.

### Manual end-to-end R2 check

```bash
npx tsx tests/s3-mock-server.mts          # terminal 1 — in-memory S3 on :9999

R2_ACCOUNT_ID=test R2_ACCESS_KEY_ID=test R2_SECRET_ACCESS_KEY=test \
R2_BUCKET=test-bucket R2_ENDPOINT=http://127.0.0.1:9999 npm start   # terminal 2

curl -X POST localhost:3000/api/zip -H 'content-type: application/json' \
  -d '{"images":[{"url":"https://example.com/a.png"}]}'
```

## Regenerating the icons

```bash
python3 scripts/generate_icons.py
```

## Attribution

Images extracted from the web remain the property of their owners. Stock results from Unsplash,
Pexels and Pixabay require attribution — keep the generated `credits.txt` with any images you
republish.
