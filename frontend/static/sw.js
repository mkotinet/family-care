/**
 * 우리가족챙기기 (Family Care) - PWA Service Worker (v1.9.0)
 * Handles App Shell Precaching, Network-First Runtime Caching, Real Web Push (iOS 16.4+ APNs / Android FCM) & One-Tap Auto-Ping
 */

const CACHE_NAME = 'family-care-pwa-v1.9.0';
const PRECACHE_URLS = [
  '/',
  '/static/style.css?v=1.9.0',
  '/static/js/core.js?v=1.9.0',
  '/static/app.js?v=1.9.0',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/apple-touch-icon.png'
];

// 1. Service Worker Installation & App Shell Precache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// 2. Service Worker Activation & Stale Cache Cleanup
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

// 3. Fetch Event Listener (API bypass & Network-First with Runtime Cache Update + Offline Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Bypass cache completely for API endpoints, location updates, version & manifest checks
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname === '/version.json' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first strategy: cache successful responses for genuine offline fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});

// 4. Push Notification Event Listener (긴급 위치 호출 & 가족 채팅 실시간 푸시)
self.addEventListener('push', (event) => {
  let data = {
    title: '🛡️ 우리가족챙기기 알림',
    body: '새로운 가족 알림이 도착했습니다.',
    url: '/?pwa=1',
    tag: 'family-care-push',
    urgency: 'normal'
  };
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    } catch (e) {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body,
    icon: '/static/icons/icon-192.png',
    badge: '/static/icons/icon-192.png',
    tag: data.tag || 'family-care-push',
    renotify: true,
    requireInteraction: data.urgency === 'high',
    vibrate: data.urgency === 'high' ? [300, 100, 300, 100, 400] : [200, 100, 200],
    data: { url: data.url || '/?pwa=1' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Event Listener (?auto_ping=1 / ?open_chat= 원탭 즉시 실행)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/?pwa=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          if (targetUrl.includes('auto_ping=1')) {
            client.postMessage({ type: 'AUTO_PING_REQUEST', url: targetUrl });
          } else if (targetUrl.includes('open_chat=')) {
            client.postMessage({ type: 'OPEN_CHAT_REQUEST', url: targetUrl });
          } else if ('navigate' in client) {
            try { await client.navigate(targetUrl); } catch (e) {}
          }
          return client;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
