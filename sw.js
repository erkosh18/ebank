const CACHE_VERSION = 'qpay-pwa-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE, API_CACHE].includes(key))
          .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isApiRequest(request) {
  return request.url.includes('/api/') || request.headers.get('Accept')?.includes('application/json');
}

function isHtmlRequest(request) {
  return request.mode === 'navigate' ||
         request.destination === 'document' ||
         request.url.endsWith('.html') ||
         request.url.endsWith('/');
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (isApiRequest(request)) {
    event.respondWith(networkFirstApi(request));
  } else if (isHtmlRequest(request)) {
    event.respondWith(networkFirstHtml(request));
  } else {
    event.respondWith(cacheFirstStatic(request));
  }
});

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await caches.match(request)) ||
           (await caches.match('./index.html')) ||
           (await caches.match('./offline.html'));
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && new URL(request.url).origin === location.origin) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return caches.match('./offline.html');
  }
}

async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return (await caches.match(request)) ||
      new Response(JSON.stringify({ offline: true, message: 'Офлайн-режим' }), {
        headers: { 'Content-Type': 'application/json' }
      });
  }
}

// Push scaffold: ready for a real push service/backend.
self.addEventListener('push', event => {
  let data = { title: 'QPay', body: 'Новое уведомление', icon: './icons/icon-192.png' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: './icons/icon-72.png',
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if ('focus' in client) return client.focus();
    }
    return clients.openWindow('./index.html');
  }));
});
