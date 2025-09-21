// service-worker.js — Margin Rush PWA
const CACHE = 'mr-v49';
const CORE = [
  './',            // root
  'index.html',
  'style.css',
  'app.js',        // rimuovi se non lo usi
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'readme.html'    // opzionale, toglilo se non vuoi il manuale offline
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );
  self.skipWaiting(); // aggiorna subito lo SW
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // prendi subito controllo delle pagine aperte
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigazioni (barra indirizzi, link interni) → fallback a index.html
  if (req.mode === 'navigate' && sameOrigin) {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Core asset: cache-first
  if (sameOrigin && CORE.some(path => url.pathname.endsWith(path) || url.pathname === '/' )) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
    return;
  }

  // Default: stale-while-revalidate per altre richieste same-origin
  if (sameOrigin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetched = fetch(req).then(resp => {
        if (resp && resp.status === 200) cache.put(req, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || fetched;
    })());
    return;
  }

  // Cross-origin → lascio passare
});
