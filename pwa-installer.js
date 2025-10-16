// ===== PWA INSTALLER JSAS =====
let deferredPrompt;

// Enregistrement du Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then((registration) => {
        console.log('✅ Service Worker enregistré:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Erreur Service Worker:', error);
      });
  });
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
    alert('✅ Application installée avec succès !');
  }
  deferredPrompt = null;
  const btn = document.getElementById('install-pwa-button');
  if (btn) btn.remove();
}

// Détection connexion
window.addEventListener('online', () => {
  console.log('✅ Connexion rétablie');
});

window.addEventListener('offline', () => {
  console.log('⚠️ Mode hors ligne');
});

console.log('🤿 PWA Installer chargé !');