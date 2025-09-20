/// <reference lib="webworker" />

const CACHE_NAME = 'tanklog-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache app shell
self.addEventListener('install', (event: Event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: Event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: Event) => {
  const e = event as FetchEvent;
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(e.request);
    })
  );
});
