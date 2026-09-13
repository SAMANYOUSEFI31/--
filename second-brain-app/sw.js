/**
 * Service Worker - Offline-first
 * Second Brain App v1.0.0
 */
const APP_VERSION = "1.0.0";
const STATIC_CACHE = `second-brain-static-v${APP_VERSION}`;
const DYNAMIC_CACHE = `second-brain-dynamic-v${APP_VERSION}`;

const STATIC_ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./src/styles/tokens.css", "./src/styles/base.css",
  "./src/styles/components.css", "./src/styles/layout.css",
  "./src/styles/notifications.css", "./src/app.js",
  "./src/core/storage.js", "./src/core/router.js",
  "./src/core/state.js", "./src/core/events.js", "./src/core/utils.js",
  "./src/modules/notification.js", "./src/modules/modal.js",
  "./src/modules/theme.js", "./src/modules/search.js",
  "./src/pages/dashboard.js", "./src/components/forms.js",
  "./public/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(e => console.warn("[SW] Cache partial fail:", e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => ![STATIC_CACHE, DYNAMIC_CACHE].includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => null);
      return cached || fetchPromise || new Response("Offline", { status: 503 });
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
