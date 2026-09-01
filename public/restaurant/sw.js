/*
 * Yalı PWA Service Worker
 * Kapsam: /restaurant/ (yalnızca müşteri menü alanı — yönetim paneli etkilenmez)
 *
 * ÖNBELLİK SÜRÜMÜ: Menü şeması/strateji değiştiğinde VERSION değerini
 * artırın (örn. "v2") — eski önbellekler activate adımında silinir.
 */
const VERSION = "v1";

const MENU_CACHE = `yali-menu-${VERSION}`;
const ASSET_CACHE = `yali-assets-${VERSION}`;
const PAGE_CACHE = `yali-pages-${VERSION}`;
const ALL_CACHES = [MENU_CACHE, ASSET_CACHE, PAGE_CACHE];

// Stale-while-revalidate ile yönetilen menü API'leri
const MENU_API_PREFIXES = ["/api/products", "/api/categories"];

// Kurulumda ısınmaya alınan kaynaklar (çevrimdışı güven ağı)
const PRECACHE_URLS = [
  "/restaurant",
  "/restaurant/offline.html",
  "/logo.png",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ---------- Strateji yardımcıları ---------- */

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached || network || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return Response.error();
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    const offline = await cache.match("/restaurant/offline.html");
    if (offline) return offline;
    return new Response(
      "<!doctype html><meta charset='utf-8'><title>Çevrimdışı</title><p>İnternet bağlantısı yok.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/* ---------- Yönlendirme ---------- */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Sipariş/sepet istekleri (POST dahil) her zaman canlı gider
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Service worker kapsamı dışına (yönetim paneli vb.) müdahale etme
  if (!url.pathname.startsWith("/restaurant/") && !url.pathname.startsWith("/api/")) {
    return;
  }

  // Sipariş/sepet/oturum API'leri asla önbelleklenmez
  if (url.pathname.startsWith("/api/table/")) return;

  // Menü verileri: çevrimdışı görüntüle + arka planda tazele
  if (MENU_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(staleWhileRevalidate(request, MENU_CACHE));
    return;
  }

  // Görseller ve statik varlıklar: cache-first
  const isImage =
    request.destination === "image" ||
    /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname);
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo.png";
  if (isImage || isStatic) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Sayfa gezinmeleri: önce ağ, düşerse önbellek, o da yoksa offline sayfası
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  }
});
