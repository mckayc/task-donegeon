const CACHE_NAME = 'task-donegeon-cache-v0.1.53';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
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

self.addEventListener('fetch', event => {
  // Let the browser do its default thing for non-GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Prevent the service worker from intercepting API calls or file uploads
  if (event.request.url.includes('/api/') || event.request.url.includes('/uploads/')) {
    return;
  }

  // For HTML pages (navigation requests), try the network first.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, serve the cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // For all other assets (JS, CSS, images, etc.), use a cache-first strategy.
  // We do NOT add new assets to the cache here to prevent caching old, hashed files.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});


// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Take control of all open clients immediately
  );
});
