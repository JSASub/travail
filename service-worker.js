// ===== SERVICE WORKER JSAS - VERSION 1.0 =====
// Cache version - Incrémenter à chaque modification
const CACHE_VERSION = 'jsas-v1.0.0';
const CACHE_NAME = `jsas-palanquees-${CACHE_VERSION}`;

// Fichiers à mettre en cache (essentiels pour le fonctionnement hors ligne)
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/images/logo-jsas.png',
  // JavaScript files
  '/js/config-firebase.js',
  '/js/ui-interface.js',
  '/js/render-dom.js',
  '/js/pdf-manager.js',
  '/js/plongeurs-manager.js',
  '/js/dp-sessions-manager.js',
  '/js/auto-palanquee-trick.js',
  '/js/improved-auto-save-fixed.js',
  '/js/main-core.js',
  '/js/simple-lock-system.js',
  '/js/password-manager.js',
  '/js/dp-online-manager.js',
  '/js/dp-management.js',
  '/js/dp-save-improved.js',
  '/js/floating-menus-manager.js'
];

// Fichiers optionnels (chargés en arrière-plan)
const OPTIONAL_FILES = [
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// ===== INSTALLATION DU SERVICE WORKER =====
self.addEventListener('install', (event) => {
  console.log('🤿 [Service Worker] Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [Service Worker] Mise en cache des fichiers essentiels');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        console.log('✅ [Service Worker] Installation terminée');
        return self.skipWaiting(); // Active immédiatement le nouveau SW
      })
      .catch((error) => {
        console.error('❌ [Service Worker] Erreur lors de l\'installation:', error);
      })
  );
});

// ===== ACTIVATION DU SERVICE WORKER =====
self.addEventListener('activate', (event) => {
  console.log('🔄 [Service Worker] Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Supprimer les anciens caches
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('jsas-') && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ [Service Worker] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ [Service Worker] Activation terminée');
        return self.clients.claim(); // Prend le contrôle immédiatement
      })
  );
});

// ===== STRATÉGIE DE CACHE : Network First avec Cache Fallback =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer Firebase et autres API externes
  if (request.url.includes('firebase') || 
      request.url.includes('googleapis') ||
      request.url.includes('gstatic') ||
      request.url.includes('cdnjs')) {
    return;
  }

  event.respondWith(
    // 1. Essayer de récupérer depuis le réseau
    fetch(request)
      .then((response) => {
        // Vérifier que la réponse est valide
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Cloner la réponse (nécessaire car on l'utilise deux fois)
        const responseToCache = response.clone();

        // Mettre à jour le cache avec la nouvelle version
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // 2. Si le réseau échoue, utiliser le cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📦 [Service Worker] Chargé depuis le cache:', request.url);
              return cachedResponse;
            }

            // 3. Si pas dans le cache, retourner une page d'erreur
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }

            return new Response('Contenu non disponible hors ligne', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// ===== GESTION DES MESSAGES DU CLIENT =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Forcer la mise à jour du cache
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }

  // Vider le cache
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        event.ports[0].postMessage({ success: true });
      });
  }
});

// ===== SYNCHRONISATION EN ARRIÈRE-PLAN (optionnel) =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-palanquees') {
    event.waitUntil(
      // Synchroniser les données avec Firebase quand la connexion revient
      syncPalanquees()
    );
  }
});

function syncPalanquees() {
  // Cette fonction sera appelée quand la connexion internet revient
  console.log('🔄 [Service Worker] Synchronisation des palanquées...');
  // Implémenter la logique de synchronisation si nécessaire
  return Promise.resolve();
}

// ===== NOTIFICATIONS PUSH (optionnel) =====
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification JSAS',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('JSAS Palanquées', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('🤿 [Service Worker] Chargé et prêt !');