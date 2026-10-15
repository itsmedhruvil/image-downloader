/* ---------------------------------------------------------------------------
   Website Image Extractor — service worker.

   Strategy:
   - App shell + navigations: network first, falling back to cache, then /offline.html
   - Image previews (/api/proxy): stale-while-revalidate, capped cache
   - Next.js build output: cache first (immutable, content-hashed)
   - Extraction, ZIP and download endpoints: never cached
   --------------------------------------------------------------------------- */

const VERSION = "v1.0.0";
const SHELL_CACHE = `wie-shell-${VERSION}`;
const ASSET_CACHE = `wie-assets-${VERSION}`;
const IMAGE_CACHE = `wie-images-${VERSION}`;
const MAX_IMAGE_ENTRIES = 80;

const SHELL_URLS = ["/", "/offline.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.disable();
      }
      await self.clients.claim();
    })(),
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match("/offline.html");
    if (offline) return offline;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).then(() => trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES));
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const response = await network;
  if (response) return response;

  return new Response("", { status: 504, statusText: "Image unavailable offline" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Never cache extraction, archive or download traffic.
  if (sameOrigin && /^\/api\/(extract|zip|download|feature-request|health)/.test(url.pathname)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (sameOrigin && url.pathname === "/api/proxy") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (sameOrigin && /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
