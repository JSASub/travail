// ===== PWA INSTALLER - JSAS PALANQUÉES =====

let deferredPrompt;
let installButton;

// ===== ENREGISTREMENT DU SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker enregistré:', registration.scope);
        
        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          registration.update();
        }, 3600000); // 1 heure
      })
      .catch((error) => {
        console.error('❌ Erreur enregistrement Service Worker:', error);
      });

    // Écouter les mises à jour du Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Nouvelle version disponible');
      showUpdateNotification();
    });
  });
}

// ===== NOTIFICATION DE MISE À JOUR =====
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.id = 'update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #0077be;
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 15px;
      animation: slideUp 0.3s ease;
    ">
      <span>🔄 Nouvelle version disponible !</span>
      <button onclick="reloadApp()" style="
        background: white;
        color: #0077be;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      ">
        Actualiser
      </button>
      <button onclick="closeUpdateNotification()" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
      ">
        Plus tard
      </button>
    </div>
  `;
  document.body.appendChild(notification);
}

function reloadApp() {
  window.location.reload();
}

function closeUpdateNotification() {
  const notification = document.getElementById('update-notification');
  if (notification) {
    notification.remove();
  }
}

// ===== GESTION DE L'INSTALLATION PWA =====
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA peut être installée');
  
  // Empêcher l'affichage automatique
  e.preventDefault();
  
  // Stocker l'événement pour l'utiliser plus tard
  deferredPrompt = e;
  
  // Afficher le bouton d'installation personnalisé
  showInstallButton();
});

function showInstallButton() {
  // Créer le bouton d'installation s'il n'existe pas
  if (!document.getElementById('install-pwa-button')) {
    installButton = document.createElement('button');
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
      transition: all 0.3s ease;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    installButton.addEventListener('mouseenter', () => {
      installButton.style.transform = 'translateY(-2px)';
      installButton.style.boxShadow = '0 6px 20px rgba(0, 119, 190, 0.6)';
    });
    
    installButton.addEventListener('mouseleave', () => {
      installButton.style.transform = 'translateY(0)';
      installButton.style.boxShadow = '0 4px 15px rgba(0, 119, 190, 0.4)';
    });
    
    installButton.addEventListener('click', installPWA);
    
    document.body.appendChild(installButton);
    
    // Animation d'entrée
    setTimeout(() => {
      installButton.style.animation = 'pulse 2s infinite';
    }, 1000);
  }
}

async function installPWA() {
  if (!deferredPrompt) {
    console.log('❌ Prompt d\'installation non disponible');
    return;
  }
  
  // Afficher le prompt d'installation
  deferredPrompt.prompt();
  
  // Attendre la réponse de l'utilisateur
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`👤 Choix utilisateur: ${outcome}`);
  
  if (outcome === 'accepted') {
    console.log('✅ PWA installée avec succès');
    showInstallSuccessMessage();
  } else {
    console.log('❌ Installation annulée par l\'utilisateur');
  }
  
  // Réinitialiser le prompt
  deferredPrompt = null;
  
  // Masquer le bouton
  if (installButton) {
    installButton.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      if (installButton && installButton.parentNode) {
        installButton.remove();
      }
    }, 300);
  }
}

function showInstallSuccessMessage() {
  const message = document.createElement('div');
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      z-index: 10001;
      text-align: center;
      max-width: 400px;
      animation: scaleIn 0.3s ease;
    ">
      <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
      <h2 style="color: #0077be; margin: 0 0 10px 0;">Installation réussie !</h2>
      <p style="color: #666; margin: 0 0 20px 0;">
        L'application JSAS Palanquées est maintenant installée sur votre appareil.
      </p>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #0077be;
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
      ">
        Fermer
      </button>
    </div>
  `;
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 5000);
}

// ===== DÉTECTION QUAND L'APP EST INSTALLÉE =====
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installée avec succès');
  
  // Masquer le bouton d'installation
  if (installButton && installButton.parentNode) {
    installButton.remove();
  }
  
  // Envoyer un événement analytics (optionnel)
  // gtag('event', 'pwa_installed');
});

// ===== DÉTECTION DU MODE STANDALONE =====
function isStandalone() {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         (window.navigator.standalone) || 
         document.referrer.includes('android-app://');
}

if (isStandalone()) {
  console.log('📱 Application lancée en mode standalone');
  // Ajouter des styles ou comportements spécifiques au mode app
  document.body.classList.add('standalone-mode');
}

// ===== GESTION DE LA CONNEXION HORS LIGNE =====
window.addEventListener('online', () => {
  console.log('✅ Connexion internet rétablie');
  showConnectionStatus('Connexion rétablie', 'success');
  
  // Synchroniser les données en attente
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register('sync-palanquees');
    });
  }
});

window.addEventListener('offline', () => {
  console.log('⚠️ Connexion internet perdue');
  showConnectionStatus('Mode hors ligne', 'warning');
});

function showConnectionStatus(message, type) {
  const statusDiv = document.createElement('div');
  const bgColor = type === 'success' ? '#28a745' : '#ffc107';
  const textColor = type === 'success' ? 'white' : '#212529';
  
  statusDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${bgColor};
      color: ${textColor};
      padding: 12px 20px;
      border-radius: 25px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 9999;
      font-weight: bold;
      animation: slideDown 0.3s ease;
    ">
      ${type === 'success' ? '✅' : '⚠️'} ${message}
    </div>
  `;
  
  document.body.appendChild(statusDiv);
  
  setTimeout(() => {
    statusDiv.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => statusDiv.remove(), 300);
  }, 3000);
}

// ===== ANIMATIONS CSS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translate(-50%, -100px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -100px);
      opacity: 0;
    }
  }
  
  @keyframes scaleIn {
    from {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
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
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  .standalone-mode {
    /* Styles spécifiques en mode app */
  }
`;
document.head.appendChild(style);

console.log('🤿 PWA Installer chargé et prêt !');