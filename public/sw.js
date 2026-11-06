// public/sw.js – Service Worker placeholder using Workbox (will be built by Vite)

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // For now, just perform a network fetch; offline handling can be added later.
  event.respondWith(fetch(event.request));
});
