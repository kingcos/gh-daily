const CACHE_NAME = 'gh-daily-v3';
const SCOPE = new URL(self.registration.scope).pathname;
const APP_SHELL = [
  SCOPE,
  `${SCOPE}index.html`,
  `${SCOPE}history/`,
  `${SCOPE}persistent/`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}favicon.ico`,
  `${SCOPE}favicon.svg`,
  `${SCOPE}icon-192.png`,
  `${SCOPE}icon-512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map(async (asset) => {
          try {
            const resp = await fetch(asset, { cache: 'no-store' });
            if (resp.ok) {
              await cache.put(asset, resp.clone());
            }
          } catch {
            // Ignore install-time fetch failures and rely on runtime cache.
          }
        })
      ).then(() => self.skipWaiting())
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  const isNavigate = request.mode === 'navigate';
  const isDataJson = url.pathname.includes('/data/') && url.pathname.endsWith('.json');
  const isIndexJson = url.pathname.endsWith('/data/index.json');

  // HTML navigation should still work offline.
  if (isNavigate) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return resp;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          return (
            (await caches.match(`${SCOPE}index.html`)) ||
            (await caches.match(SCOPE))
          );
        })
    );
    return;
  }

  // index.json changes daily; prefer network and fallback to cache.
  if (isIndexJson) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Daily snapshot files are immutable after commit, so cache-first is safe.
  if (isDataJson) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => cached || fetch(request).then((resp) => {
          if (resp.ok) cache.put(request, resp.clone());
          return resp;
        }))
      )
    );
  } else {
    event.respondWith(
      fetch(request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return resp;
      }).catch(() => caches.match(request))
    );
  }
});
