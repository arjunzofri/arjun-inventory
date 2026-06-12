const CACHE_STATIC = "arjun-static-v1";
const CACHE_PAGES  = "arjun-pages-v1";

const STATIC_PATTERN = /\/_next\/static\//;
const API_PATTERN    = /\/api\//;

// ── Install: precache shell ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll([
        "/reconciliacion",
        "/login",
        "/manifest.json",
        "/icons/icon-192.svg",
        "/icons/icon-512.svg",
      ])
    )
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_PAGES)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API: network-first
  if (API_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static assets: cache-first
  if (STATIC_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
    return;
  }

  // Navigation / pages: network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      networkFirst(event.request).catch(() =>
        caches.match("/reconciliacion")
      )
    );
    return;
  }

  // Other: network-first
  event.respondWith(networkFirst(event.request));
});

// ── Strategies ───────────────────────────────────────────────────────
async function cacheFirst(request, cacheName = CACHE_STATIC) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request).catch(() => null);
  if (response && response.ok) {
    const clone = response.clone();
    (await caches.open(cacheName)).put(request, clone);
  }
  return response || offlineResponse();
}

async function networkFirst(request, cacheName = CACHE_PAGES) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      (await caches.open(cacheName)).put(request, clone);
      return response;
    }
    throw new Error("bad response");
  } catch {
    const cached = await caches.match(request);
    return cached || offlineResponse();
  }
}

function offlineResponse() {
  return new Response(
    "<html><body style='font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;background:#e8ecef;color:#2d3748;margin:0'><div style='text-align:center'><h1>📡 Sin conexión</h1><p>Recargá cuando tengas internet.</p></div></body></html>",
    { status: 503, headers: { "Content-Type": "text/html" } }
  );
}
