// ===== SERVICE WORKER - JSA PALANQUÉES =====
// Version : 2.6.2 - MISE À JOUR FORCÉE
// Date : 2026-04-20
// Auteur : RA - JSA Subaquatique
// IMPORTANT : Cette version force le téléchargement de tous les fichiers JS

// Configuration de la version et du cache
const APP_VERSION = '2.6.2';
const CACHE_VERSION = `jsas-v${APP_VERSION}`;
const CACHE_NAME = `jsas-palanquees-${CACHE_VERSION}`;

// Liste des fichiers à mettre en cache
const urlsToCache = [
  './',
  './index.html',
  './bilan-palanquees.html',
  './styles.css',
  './manifest.json',
  './pwa-installer.js',
  './images/icon-72.png',
  './images/icon-96.png',
  './images/icon-128.png',
  './images/icon-144.png',
  './images/icon-152.png',
  './images/icon-192.png',
  './images/icon-384.png',
  './images/icon-512.png',
  // FORCER LE RECHARGEMENT DES FICHIERS JS
  './js/fiche-securite.js?v=2.6.0',
  './js/pdf-manager.js?v=2.6.0',
  './js/main-core.js?v=2.6.0'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log(`[SW v${APP_VERSION}] ⚡ Installation FORCÉE en cours...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW v${APP_VERSION}] 🔄 Mise en cache FORCÉE des ressources`);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`[SW v${APP_VERSION}] ✅ Installation terminée - TOUS LES CACHES VIDÉS`);
        // Force l'activation immédiate
        return self.skipWaiting();
      })
      .catch(error => {
        console.error(`[SW v${APP_VERSION}] ❌ Erreur lors de l'installation:`, error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log(`[SW v${APP_VERSION}] 🚀 Activation FORCÉE en cours...`);
  
  event.waitUntil(
    // Nettoyer TOUS les anciens caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Supprimer TOUS les caches qui commencent par 'jsas-palanquees-' 
            return cacheName.startsWith('jsas-palanquees-') && 
                   cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log(`[SW v${APP_VERSION}] 🗑️ SUPPRESSION FORCÉE du cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log(`[SW v${APP_VERSION}] ✅ Activation terminée - Version ${APP_VERSION} active`);
      // Prendre le contrôle immédiatement de TOUTES les pages
      return self.clients.claim();
    })
    .then(() => {
      // Notifier tous les clients de recharger
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_ACTIVATED',
            version: APP_VERSION,
            message: '🎉 Nouvelle version ${APP_VERSION} installée ! Rechargez la page.'
          });
        });
      });
    })
  );
});

// Interception des requêtes - STRATÉGIE NETWORK FIRST POUR LES JS
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // FORCER LE RECHARGEMENT DES FICHIERS JS (NETWORK FIRST)
  if (url.pathname.endsWith('.js') || url.pathname.includes('/js/')) {
    console.log(`[SW v${APP_VERSION}] 🔄 NETWORK FIRST pour JS: ${url.pathname}`);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cloner et mettre en cache la nouvelle version
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
              console.log(`[SW v${APP_VERSION}] ✅ JS mis en cache: ${url.pathname}`);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback sur le cache si hors ligne
          console.log(`[SW v${APP_VERSION}] 📵 Hors ligne - Utilisation du cache pour: ${url.pathname}`);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // STRATÉGIE CACHE FIRST pour les autres ressources
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch(error => {
            console.error(`[SW v${APP_VERSION}] Erreur réseau:`, error);
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Gestion des messages depuis la page
self.addEventListener('message', event => {
  console.log(`[SW v${APP_VERSION}] 📨 Message reçu:`, event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[SW v${APP_VERSION}] ⚡ Activation forcée de la nouvelle version`);
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: APP_VERSION,
      cacheVersion: CACHE_VERSION
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      Promise.all(
        cacheNames.map(cacheName => {
          console.log(`[SW v${APP_VERSION}] 🗑️ Suppression du cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      ).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          success: true
        });
      });
    });
  }
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', event => {
  console.log(`[SW v${APP_VERSION}] 🔄 Événement de synchronisation:`, event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log(`[SW v${APP_VERSION}] ✅ Synchronisation des données terminée`);
      })
    );
  }
});

// Notifications push
self.addEventListener('push', event => {
  console.log(`[SW v${APP_VERSION}] 📬 Notification push reçue`);
  
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification JSA Palanquées',
    icon: './images/icon-192.png',
    badge: './images/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('JSA Palanquées', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log(`[SW v${APP_VERSION}] 👆 Clic sur notification`);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

console.log(`[SW v${APP_VERSION}] 🚀 Service Worker VERSION ${APP_VERSION} chargé et prêt - MISE À JOUR FORCÉE`);