const CACHE_NAME = "english-learning-system-v16-desktop-fullwidth";
const BASE = self.location.pathname.replace(/\/sw\.js$/, "").replace(/\/$/, "") || "";
const STATIC_ASSETS = [`${BASE}/manifest.webmanifest`, `${BASE}/icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  // Always prefer network for HTML/JS/CSS so bad chunk mixes don't stick as a white screen.
  const url = new URL(event.request.url);
  const isAppShell =
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("/") ||
    url.pathname.includes("/_next/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css");

  if (isAppShell) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
