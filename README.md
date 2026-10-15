# Website Image Extractor

Extract every image from any website or raw HTML — preview them, filter by format, dimensions and
file size, then download individually or as a single ZIP. Free, private and instant.

A production-ready [Next.js 15](https://nextjs.org) app with a strictly monochrome (black & white)
interface, deployable to **Vercel's free tier**, using **Cloudflare R2's free tier** for transient
ZIP archive storage, and installable as a **PWA**.

---

## Features

- **Three extraction modes** — website URL, pasted HTML/CSS (parsed entirely in the browser), and
  bulk URLs (up to five pages merged into one gallery).
- **Real detection, not just `img src`** — lazy-load attributes (`data-src`, `data-lazy-src`,
  `data-original`, …), `srcset`/`data-srcset` lists, `<picture>`/`<video>` sources, video posters,
  CSS `url(...)` backgrounds, inline `<svg>`, icons and Open Graph images.
- **Hydration payload sweep** — absolute image URLs inside Next.js/Nuxt/JSON-LD script blobs are
  picked up too, which is where a plain HTML scraper falls short.
- **Advanced filters** — format pills with live counts, minimum width/height, minimum file size, and
  sorting by page order, dimensions, file size, format or name.
- **Bulk ZIP download** — packaged server-side with a bounded concurrency pool; individual failures
  are skipped and reported instead of failing the archive.
- **Browser-side conversion** — re-encode raster images to PNG/JPG/WebP with the Canvas API. SVG is
  always delivered untouched.
- **Privacy first** — submitted URLs are processed in memory and never logged; pasted markup never
  leaves the device; archives expire automatically.
- **PWA** — web manifest, installable, service worker with an offline shell and a
  stale-while-revalidate image cache.
- **Monetisation-ready ad slots** — dashboard ad placeholders by default; set
  `NEXT_PUBLIC_ADSENSE_CLIENT`/`NEXT_PUBLIC_ADSENSE_SLOT` to swap in real AdSense units that load
  after idle.
- **SEO built in** — JSON-LD for WebApplication, SoftwareApplication, FAQPage, HowTo, Organization,
  WebSite/SearchAction, BlogPosting and BreadcrumbList, plus a generated `sitemap.xml`, `robots.txt`
  and an RSS 2.0 feed at `/rss.xml`.
- **Local-only activity stats** — "URLs extracted / Images extracted" counters live in
  `localStorage`, sync across tabs, and are never sent anywhere.
- **Mobile-first, responsive, accessible** — keyboard navigable, focus-visible rings, skip link.

## Tech stack (all free tiers)

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 with shadcn-style CSS variable tokens |
| Components | Radix UI primitives (hand-rolled shadcn-style wrappers) |
| Parsing | cheerio (server) / `DOMParser` (client) |
| ZIP | `jszip` (server and browser) |
| Archive storage | Cloudflare R2 via `@aws-sdk/client-s3` (optional) |
| Hosting | Vercel (free tier) |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are required to run locally — without R2 configured, ZIP archives are
streamed straight back to the browser instead of being stored.

```bash
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel — the Next.js preset is detected automatically, no build settings to change.
3. (Optional) Add the R2 environment variables below.
4. Deploy.

## Cloudflare R2 setup (optional)

R2 is only needed if you want generated archives to live in object storage rather than being streamed
directly. Its free tier includes 10 GB of storage and generous Class A/B operations.

1. Create a bucket, e.g. `image-extractor-zips`.
2. Create an R2 API token with **Object Read & Write** for that bucket.
3. Add a lifecycle rule to delete objects under the `zips/` prefix after 1 day (a backstop for
   archives that are generated but never downloaded).
4. Set the environment variables in Vercel:

| Variable | Required | Purpose |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | No | Cloudflare account id used to build the R2 endpoint |
| `R2_ACCESS_KEY_ID` | No | R2 API token access key id |
| `R2_SECRET_ACCESS_KEY` | No | R2 API token secret |
| `R2_BUCKET` | No | Bucket that holds generated archives |
| `R2_ENDPOINT` | No | Override the S3 endpoint (MinIO, local mocks, other S3-compatible stores) |
| `R2_ZIP_TTL_SECONDS` | No | Archive lifetime in seconds (default `3600`) |
| `R2_PUBLIC_URL` | No | Reserved for a public bucket base URL (not required) |
| `FETCH_USER_AGENT` | No | Override the outbound user agent |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | No | AdSense publisher id; unset renders monochrome ad placeholders |
| `NEXT_PUBLIC_ADSENSE_SLOT` | No | Default AdSense ad-unit slot id |

The `/status` page reports which backend is active.

## Architecture

```
src/
  app/
    page.tsx                     # hero + extractor + marketing sections + FAQ
    pricing/ blog/ documentation/ changelog/ feature-request/ contact/ status/
    privacy/ terms/ disclaimer/ imprint/ report-issue/  # legal & support pages
    rss.xml/route.ts             # RSS 2.0 feed
    api/
      extract/route.ts           # scan a URL, a batch of URLs, or pasted markup
      proxy/route.ts             # stream images (hotlink-safe) + ?meta=1 size probe
      zip/route.ts               # build a ZIP, store in R2 or stream it back
      download/[...key]/route.ts # stream a stored archive from R2
      feature-request/route.ts   # record suggestions in R2
      health/route.ts            # readiness probe for the status page
    sitemap.ts robots.ts
  components/
    extractor/                   # extractor, image card, filter bar, selection bar
    accordion-faq.tsx            # rich FAQ (Radix accordion + content blocks)
    ad-slot.tsx                  # AdSense unit or monochrome placeholder
    stats-row.tsx                # local-only activity counters + Product Hunt badge
    json-ld.tsx                  # structured-data emitter
    ui/                          # monochrome shadcn-style primitives
  lib/
    structured-data.ts           # JSON-LD builders (WebApplication, FAQPage, HowTo, ...)
    activity-stats.ts            # localStorage counters with cross-tab sync
    extract.core.ts              # shared, DOM-free extraction helpers
    extract.server.ts            # cheerio collector
    extract.client.ts            # DOMParser collector
    zip.ts                       # server ZIP builder with limits
    r2.ts                        # Cloudflare R2 (S3 API) wrapper
    net.ts                       # SSRF guard + page fetcher
    download.ts                  # client download/convert helpers
public/
  sw.js manifest.webmanifest offline.html icons
scripts/generate_icons.py        # regenerates the monochrome PWA icons
```

### Security notes

- All server-side fetches pass through an SSRF guard (`src/lib/net.ts`) that rejects non-http(s)
  schemes, `localhost`/`.internal` hostnames, and any host that resolves to a private, link-local,
  loopback or cloud-metadata address.
- The image proxy only ever returns image content types, caps responses at 25 MB, and applies a
  restrictive `Content-Security-Policy` with `sandbox`.
- ZIP archives are addressed by random, unguessable keys under the `zips/` prefix, only that prefix
  is servable, and keys containing `..` are rejected.

### Request limits

| Limit | Value |
| --- | --- |
| Images per ZIP | 400 |
| Bytes per image | 30 MB |
| Total archive bytes | 150 MB |
| Download timeout per image | 20 s |
| Page fetch timeout | 20 s |
| Max page size scanned | 8 MB |
| Bulk URLs per request | 5 |

## Testing

Three suites run without a browser or network access, using `tsx` + `jsdom`:

```bash
npm test              # all suites
npm run test:extract  # shared helpers, cheerio collector, DOMParser collector, ZIP builder
npm run test:r2       # Cloudflare R2 round trip against an in-memory S3 mock
npm run test:ui       # React extractor flow in jsdom (gallery, filters, selection, ZIP, dialog)
```

| Suite | Covers |
| --- | --- |
| `extract` | Format detection, srcset/CSS parsing, entity decoding, false-positive filters, both collectors, filename generation, ZIP packaging and failure handling |
| `content` | JSON-LD schema shapes, FAQ → FAQPage generation, blog post schema, RSS well-formedness, activity-stat store semantics and persistence |
| `r2` | `isR2Configured`, key generation, TTL parsing, PUT/GET/DELETE against an S3-compatible mock, bucket scoping |
| `ui` | Tab switching, HTML-mode extraction, gallery rendering, format filters, select-all, ZIP request payload, selection reset, preview dialog, clipboard copy, ad-slot placeholder, FAQ accordion, stats row, theme bootstrap and theme menu |

`npm run typecheck` checks the app; `npm run typecheck:tests` checks the test sources.

### Manual end-to-end R2 check

The R2 archive flow can be exercised against a running server using the bundled S3 mock:

```bash
npx tsx tests/s3-mock-server.mts          # terminal 1 — in-memory S3 on :9999

R2_ACCOUNT_ID=test R2_ACCESS_KEY_ID=test R2_SECRET_ACCESS_KEY=test \
R2_BUCKET=test-bucket R2_ENDPOINT=http://127.0.0.1:9999 npm start   # terminal 2

curl -X POST localhost:3000/api/zip -H 'content-type: application/json' \
  -d '{"images":[{"url":"https://example.com/a.png"}]}'
# → {"downloadUrl":"/api/download/zips/…","stored":true,…}
```

## Regenerating the icons

The PWA icons are generated with the standard library only (no image dependencies):

```bash
python3 scripts/generate_icons.py
```

## License and etiquette

The tool is free to use. Images you extract remain the property of their owners and may be protected
by copyright — check the source site's licence before republishing anything. See `/disclaimer` and
`/terms` for details.
