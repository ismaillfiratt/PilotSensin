const CACHE_NAME = "pilotsensin-v4";

// Sadece gerçekten statik varlıkları önbelleğe al — sayfaları değil
const PRECACHE_URLS = [
  "/manifest.json",
  "/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Tüm eski cache'leri temizle
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strateji — sadece statik varlıklar için cache fallback
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Yalnızca GET — API, Supabase ve navigation istekleri hariç
  if (event.request.method !== "GET") return;
  if (url.hostname.includes("supabase.co")) return;
  if (url.pathname.startsWith("/api/")) return;

  // HTML navigation isteklerini (sayfa geçişleri) hiç yakalamıyoruz —
  // doğrudan ağa git, cache fallback kullanma.
  if (event.request.mode === "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Yalnızca başarılı, aynı-origin statik varlıkları cache'e yaz
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          // Cache de yoksa ağ hatasını doğal şekilde ilet
          if (cached) return cached;
          return new Response("Ağ bağlantısı yok", { status: 503, statusText: "Offline" });
        })
      )
  );
});
