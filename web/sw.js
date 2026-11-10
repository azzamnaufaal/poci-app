/* Service worker Pocil: cache shell aplikasi supaya dibuka instan dan
   antrean terakhir tetap bisa dilihat saat luring. Aksi simpan dan
   kategorisasi tetap butuh jaringan; cache tidak pernah menulis data. */
const CACHE = "pocil-shell-v5";
const SHELL = [
  "/",
  "/styles.css?v=5",
  "/app.js?v=5",
  "/manifest.webmanifest?v=5",
  "/icon-192.png?v=5",
  "/apple-touch-icon.png?v=5",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  event.respondWith(
    fetch(event.request).then((resp) => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return resp;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});
