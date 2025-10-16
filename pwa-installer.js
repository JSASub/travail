// ===== PWA INSTALLER JSAS - VERSION AMÉLIORÉE =====
let deferredPrompt;
let newWorker;

// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then((registration) => {
        console.log('✅ Service Worker enregistré:', registration.scope);
        
        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          registration.update();
          console.log('🔍 Vérification des mises à jour...');
        }, 3600000); // 1 heure = 3600000 ms
        
        // Détecter quand une nouvelle version est en attente
        registration.addEventListener('updatefound', () => {
          newWorker = registration.installing;
          console.log('🆕 Nouvelle version détectée !');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              console.log('✅ Nouvelle version prête à être installée');
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Erreur Service Worker:', error);
      });

    // Écouter les changements de contrôleur (quand une mise à jour est activée)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('🔄 Nouvelle version activée, rechargement...');
      window.location.reload();
    });
  });
}

// Afficher la notification de mise à jour
function showUpdateNotification() {
  // Retirer l'ancienne notification si elle existe
  const oldNotif = document.getElementById('update-notification');
  if (oldNotif) oldNotif.remove();
  
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #0077be, #0056b3);
      color: white;
      padding: 15px 25px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(0, 119, 190, 0.4);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 15px;
      animation: slideUp 0.3s ease;
      max-width: 90%;
    ">
      <span style="font-size: 24px;">🔄</span>
      <span style="flex: 1; font-weight: 500;">
        Nouvelle version disponible !
      </span>
      <button onclick="updateApp()" style="
        background: white;
        color: #0077be;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
      ">
        Actualiser
      </button>
      <button onclick="closeUpdateNotification()" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
      ">
        Plus tard
      </button>
    </div>
  `;
  document.body.appendChild(notification);
}

// Actualiser l'application
function updateApp() {
  if (newWorker) {
    // Envoyer un message au Service Worker pour qu'il s'active
    newWorker.postMessage({ type: 'SKIP_WAITING' });
  } else {
    // Sinon, recharger simplement
    window.location.reload(true);
  }
}

// Fermer la notification
function closeUpdateNotification() {
  const notification = document.getElementById('update-notification');
  if (notification) {
    notification.style.animation = 'slideDown 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }
}

// Gestion de l'installation PWA
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA installable');
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  if (!document.getElementById('install-pwa-button')) {
    const installButton = document.createElement('button');
    installButton.id = 'install-pwa-button';
    installButton.innerHTML = '📱 Installer l\'application';
    installButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #0077be, #0056b3);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0, 119, 190, 0.4);
      z-index: 9998;
      font-size: 14px;
      animation: pulse 2s infinite;
    `;
    installButton.addEventListener('click', installPWA);
    document.body.appendChild(installButton);
  }
}

async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Installation:', outcome);
  if (outcome === 'accepted') {
    showSuccessMessage('✅ Application installée avec succès !');
  }
  deferredPrompt = null;
  const btn = document.getElementById('install-pwa-button');
  if (btn) btn.remove();
}

function showSuccessMessage(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10001;
      animation: slideDown 0.3s ease;
    ">
      ${message}
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Détection connexion
window.addEventListener('online', () => {
  console.log('✅ Connexion rétablie');
  showSuccessMessage('✅ Connexion internet rétablie');
});

window.addEventListener('offline', () => {
  console.log('⚠️ Mode hors ligne');
  showSuccessMessage('⚠️ Mode hors ligne - Les données en cache restent accessibles');
});

// Animations CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translate(-50%, 100px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -100px);
      opacity: 0;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 4px 15px rgba(0, 119, 190, 0.4);
    }
    50% {
      box-shadow: 0 6px 25px rgba(0, 119, 190, 0.8);
    }
  }
`;
document.head.appendChild(style);

console.log('🤿 PWA Installer amélioré chargé !');