/**
 * 우리가족챙기기 (Family Care) - PWA Service Worker
 * Handles App Lifecycle, Background Sync, Offline Fallback & A2HS Installability
 */

const CACHE_NAME = 'family-care-pwa-v1.3.6';

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

// 4. Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = { title: '🚌 버스 도착 알림', body: '버스가 곧 도착합니다!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body,
    icon: '/static/icons/icon-192.png',
    badge: '/static/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 300],
    data: { url: '/?pwa=1' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('danminlove.com') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/?pwa=1');
      }
    })
  );
});
