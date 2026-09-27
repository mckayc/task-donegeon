// v209
const CACHE_NAME = 'task-donegeon-cache-v209';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install a service worker
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Opened cache', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Listen for a message from the client to skip waiting.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache and return requests
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Prevent service worker from intercepting API calls, uploads, or websocket
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('/uploads/') ||
    event.request.url.includes('/socket.io/')
  ) {
    return;
  }

  const url = new URL(event.request.url);
  const isNavigationOrHtml =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/index.html');

  // NETWORK-FIRST FOR NAVIGATION / HTML:
  // Ensures user always gets the latest asset hash manifest upon opening or reloading
  if (isNavigationOrHtml) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // CACHE-FIRST WITH NETWORK FALLBACK FOR OTHER ASSETS
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Update a service worker & delete obsolete caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
