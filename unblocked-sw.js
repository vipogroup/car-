const UNBLOCKED_PWA_VERSION = 2;
const CACHE = 'unblocked-pwa-v' + UNBLOCKED_PWA_VERSION;
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/manifest.json', '/car-music-icon.png', '/unblocked-sw.js'])
    )
  );
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((n) => {
          if (n !== CACHE) {
            return caches.delete(n);
          }
          return Promise.resolve();
        })
      )
    )
  );
  return self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  const u = new URL(event.request.url);
  if (u.origin !== self.location.origin) {
    return;
  }
  if (event.request.mode === 'navigate' || u.pathname === '/') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
    );
    return;
  }
  if (u.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          const c = res.clone();
          caches.open(CACHE).then((cache) => {
            try {
              cache.put(event.request, c);
            } catch (e) {}
          });
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});