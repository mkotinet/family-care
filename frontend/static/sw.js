/**
 * 우리가족챙기기 (Family Care) - PWA Service Worker
 * Handles App Lifecycle, Background Sync, Offline Fallback & A2HS Installability
 */

const CACHE_NAME = 'family-care-pwa-v1.3.1';

// 1. Service Worker Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Listener (API bypass & Network-First)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass cache completely for API endpoints, location updates, and version checks
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/data/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first strategy with graceful cache match fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
