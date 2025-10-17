// ===== SERVICE WORKER - JSA PALANQUÉES =====
// Version : 1.0.1
// Date : 2025-01-18
// Auteur : RA - JSA Subaquatique

// Configuration de la version et du cache
const APP_VERSION = '2.0.1';
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
  './images/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log(`[SW v${APP_VERSION}] Installation en cours...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[SW v${APP_VERSION}] Mise en cache des ressources`);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`[SW v${APP_VERSION}] Installation terminée avec succès`);
        // Force l'activation immédiate si une ancienne version existe
        return self.skipWaiting();
      })
      .catch(error => {
        console.error(`[SW v${APP_VERSION}] Erreur lors de l'installation:`, error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log(`[SW v${APP_VERSION}] Activation en cours...`);
  
  event.waitUntil(
    // Nettoyer les anciens caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Supprimer les caches qui commencent par 'jsas-palanquees-' 
            // mais qui ne correspondent pas à la version actuelle
            return cacheName.startsWith('jsas-palanquees-') && 
                   cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log(`[SW v${APP_VERSION}] Suppression de l'ancien cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log(`[SW v${APP_VERSION}] Activation terminée`);
      // Prendre le contrôle immédiatement
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Stratégie : Cache First avec fallback réseau
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si trouvé dans le cache, retourner la réponse
        if (response) {
          console.log(`[SW v${APP_VERSION}] Ressource depuis le cache: ${event.request.url}`);
          return response;
        }
        
        // Sinon, faire une requête réseau
        console.log(`[SW v${APP_VERSION}] Ressource depuis le réseau: ${event.request.url}`);
        return fetch(event.request)
          .then(response => {
            // Ne pas mettre en cache les réponses non valides
            if (!response || response.status !== 200 || response.type === 'basic') {
              return response;
            }
            
            // Cloner la réponse car elle ne peut être consommée qu'une fois
            const responseToCache = response.clone();
            
            // Mettre la nouvelle ressource en cache pour une utilisation future
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log(`[SW v${APP_VERSION}] Nouvelle ressource mise en cache: ${event.request.url}`);
              });
            
            return response;
          })
          .catch(error => {
            console.error(`[SW v${APP_VERSION}] Erreur réseau:`, error);
            
            // Si hors ligne, essayer de retourner une page de fallback
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Gestion des messages depuis la page
self.addEventListener('message', event => {
  console.log(`[SW v${APP_VERSION}] Message reçu:`, event.data);
  
  // Gérer les différents types de messages
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[SW v${APP_VERSION}] Activation forcée de la nouvelle version`);
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    // Répondre avec la version actuelle
    event.ports[0].postMessage({
      type: 'VERSION',
      version: APP_VERSION,
      cacheVersion: CACHE_VERSION
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Vider le cache si demandé
    caches.keys().then(cacheNames => {
      Promise.all(
        cacheNames.map(cacheName => {
          console.log(`[SW v${APP_VERSION}] Suppression du cache: ${cacheName}`);
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

// Gestion de la synchronisation en arrière-plan (si supportée)
self.addEventListener('sync', event => {
  console.log(`[SW v${APP_VERSION}] Événement de synchronisation:`, event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Ici vous pouvez ajouter la logique de synchronisation des données
      // Par exemple, envoyer les données stockées localement vers le serveur
      Promise.resolve()
        .then(() => {
          console.log(`[SW v${APP_VERSION}] Synchronisation des données terminée`);
        })
    );
  }
});

// Notifications push (si nécessaire)
self.addEventListener('push', event => {
  console.log(`[SW v${APP_VERSION}] Notification push reçue`);
  
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
  console.log(`[SW v${APP_VERSION}] Clic sur notification`);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

console.log(`[SW v${APP_VERSION}] Service Worker chargé et prêt`);