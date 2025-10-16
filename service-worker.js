// ===== SERVICE WORKER JSAS - VERSION 1.0 =====
const CACHE_VERSION = 'jsas-v1.0.0';
const CACHE_NAME = `jsas-palanquees-${CACHE_VERSION}`;

const ESSENTIAL_FILES = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './images/logo-jsas.png'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('🤿 [Service Worker] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [Service Worker] Mise en cache');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => self.skipWaiting())
      .catch((error) => console.error('❌ Erreur installation:', error))
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('🔄 [Service Worker] Activation...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('jsas-') && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') return;
  
  if (request.url.includes('firebase') || 
      request.url.includes('googleapis') ||
      request.url.includes('gstatic') ||
      request.url.includes('cdnjs')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, responseToCache));
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📦 Chargé depuis cache:', request.url);
              return cachedResponse;
            }
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

console.log('🤿 Service Worker chargé !');