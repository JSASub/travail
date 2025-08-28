// dp-online-manager.js - Gestionnaire des utilisateurs connectés (VERSION CORRIGÉE)

// ===== VARIABLES GLOBALES =====
let onlineUsersData = {};
let onlineUsersWindow = null;
let onlineUsersInterval = null;
let isUserAuthenticated = false;
let searchTimeout = null; // NOUVEAU: Timeout de sécurité

// ===== ÉCOUTEUR DES UTILISATEURS EN LIGNE =====
function initializeOnlineUsersListener() {
  if (!db || !currentUser) {
    console.warn("⚠️ Firebase ou utilisateur non disponible pour l'écoute des utilisateurs en ligne");
    return;
  }

  console.log("👥 Initialisation de l'écoute des utilisateurs connectés...");

  try {
    isUserAuthenticated = true;
    
    const onlineRef = db.ref('dp_online');
    
    onlineRef.on('value', (snapshot) => {
      if (!isUserAuthenticated || !currentUser) {
        console.log("🚫 Utilisateur déconnecté - ignore les mises à jour");
        return;
      }
      
      onlineUsersData = snapshot.val() || {};
      console.log(`👥 ${Object.keys(onlineUsersData).length} utilisateur(s) connecté(s)`);
      
      // NOUVEAU: Nettoyer le timeout si les données arrivent
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
      
      // Mettre à jour la fenêtre si elle est ouverte
      if (onlineUsersWindow && !onlineUsersWindow.closed) {
        updateOnlineUsersWindow();
      }
      
      updateOnlineUsersIndicator();
    });

    window.onlineUsersRef = onlineRef;
    console.log("✅ Écoute des utilisateurs connectés initialisée");
    
  } catch (error) {
    console.error("❌ Erreur initialisation écoute utilisateurs:", error);
  }
}

// ===== INDICATEUR DANS L'INTERFACE PRINCIPALE =====
function updateOnlineUsersIndicator() {
  if (!isUserAuthenticated || !currentUser) {
    const indicator = document.getElementById('online-users-indicator');
    if (indicator) {
      indicator.remove();
    }
    return;
  }

  let indicator = document.getElementById('online-users-indicator');
  
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'online-users-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 57px;
      left: 10px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border: 1px solid #2196f3;
      border-radius: 20px;
      padding: 8px 15px;
      font-size: 12px;
      font-weight: bold;
      color: #1565c0;
      cursor: pointer;
      z-index: 1002;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      user-select: none;
    `;
    
    indicator.addEventListener('click', openOnlineUsersWindowSafe); // CORRIGÉ: Fonction sécurisée
    indicator.addEventListener('mouseenter', () => {
      indicator.style.transform = 'scale(1.05)';
      indicator.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    indicator.addEventListener('mouseleave', () => {
      indicator.style.transform = 'scale(1)';
      indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
    
    document.body.appendChild(indicator);
  }

  const userCount = Object.keys(onlineUsersData).length;
  
  if (userCount <= 1) {
    indicator.innerHTML = '👤 Vous seul';
    indicator.style.background = 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)';
    indicator.style.borderColor = '#9c27b0';
    indicator.style.color = '#6a1b9a';
  } else {
    indicator.innerHTML = `👥 ${userCount} connectés`;
    indicator.style.background = 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)';
    indicator.style.borderColor = '#4caf50';
    indicator.style.color = '#2e7d32';
  }
  
  indicator.title = `Cliquer pour voir qui est connecté (${userCount} utilisateur${userCount > 1 ? 's' : ''})`;
}

// ===== FONCTION SÉCURISÉE POUR OUVRIR LA FENÊTRE =====
function openOnlineUsersWindowSafe() {
  if (!isUserAuthenticated || !currentUser) {
    alert("⚠️ Vous devez être connecté pour voir les utilisateurs en ligne");
    return;
  }

  // Éviter les clics multiples
  if (searchTimeout) {
    console.log("Recherche déjà en cours...");
    return;
  }

  console.log("🔍 Début recherche utilisateurs connectés...");

  // NOUVEAU: Timeout de sécurité de 8 secondes
  searchTimeout = setTimeout(() => {
    console.error("⏰ Timeout: La recherche des utilisateurs connectés a pris trop de temps");
    handleSearchTimeout();
  }, 8000);

  // Essayer d'ouvrir la fenêtre
  try {
    openOnlineUsersWindow();
  } catch (error) {
    console.error("❌ Erreur ouverture fenêtre:", error);
    handleSearchError(error);
  }
}

// ===== FENÊTRE DES UTILISATEURS CONNECTÉS (ORIGINALE MODIFIÉE) =====
function openOnlineUsersWindow() {
  if (onlineUsersWindow && !onlineUsersWindow.closed) {
    onlineUsersWindow.focus();
    return;
  }

  const windowFeatures = `
    width=450,
    height=600,
    left=${screen.width - 500},
    top=100,
    scrollbars=yes,
    resizable=yes,
    status=no,
    menubar=no,
    toolbar=no,
    location=no
  `;

  onlineUsersWindow = window.open('', 'OnlineUsers', windowFeatures);
  
  if (!onlineUsersWindow) {
    handleSearchError(new Error('Impossible d\'ouvrir la fenêtre popup'));
    return;
  }

  // Contenu initial avec message de chargement amélioré
  onlineUsersWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>👥 Utilisateurs Connectés - JSAS</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          overflow: hidden;
          max-width: 100%;
        }
        
        .header {
          background: linear-gradient(135deg, #004080 0%, #007bff 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .header p {
          opacity: 0.9;
          font-size: 14px;
        }
        
        .content {
          padding: 20px;
          max-height: 450px;
          overflow-y: auto;
        }
        
        .user-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .user-card.current-user {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: #2196f3;
        }
        
        .user-card.current-user::before {
          content: "👤 C'est vous";
          position: absolute;
          top: -8px;
          right: 10px;
          background: #2196f3;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
        }
        
        .user-name {
          font-size: 18px;
          font-weight: bold;
          color: #004080;
          margin-bottom: 5px;
        }
        
        .user-email {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .user-level {
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .user-time {
          font-size: 11px;
          color: #999;
        }
        
        .status-online {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #28a745;
          border-radius: 50%;
          margin-right: 5px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .footer {
          background: #f8f9fa;
          padding: 15px 20px;
          text-align: center;
          border-top: 1px solid #dee2e6;
          font-size: 12px;
          color: #666;
        }
        
        .refresh-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 10px;
        }
        
        .refresh-btn:hover {
          background: #0056b3;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .empty-state h3 {
          margin-bottom: 10px;
          color: #999;
        }
        
        .error-state {
          text-align: center;
          padding: 40px 20px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 10px;
          color: #721c24;
        }
        
        .error-state h3 {
          margin-bottom: 10px;
          color: #721c24;
        }
        
        /* Scrollbar personnalisée */
        .content::-webkit-scrollbar {
          width: 6px;
        }
        
        .content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .content::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👥 Utilisateurs Connectés</h1>
          <p id="last-update">Dernière mise à jour : En cours...</p>
        </div>
        <div class="content" id="users-content">
          <div class="empty-state">
            <div class="loading-spinner"></div>
            <h3>🔄 Recherche en cours...</h3>
            <p>Récupération des utilisateurs connectés...</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
              Timeout automatique dans 8 secondes si aucune donnée n'arrive
            </p>
          </div>
        </div>
        <div class="footer">
          <button class="refresh-btn" onclick="window.opener.updateOnlineUsersWindow()">🔄 Actualiser</button>
          <div style="margin-top: 8px;">
            Système temps réel JSAS - Les données se mettent à jour automatiquement
          </div>
        </div>
      </div>
    </body>
    </html>
  `);

  onlineUsersWindow.document.close();
  
  // CORRIGÉ: Attendre plus longtemps et vérifier les données
  setTimeout(() => {
    updateOnlineUsersWindowSafe();
  }, 1000); // Augmenté à 1 seconde

  // Nettoyer quand la fenêtre se ferme
  onlineUsersWindow.addEventListener('beforeunload', () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    onlineUsersWindow = null;
  });

  console.log("✅ Fenêtre des utilisateurs connectés ouverte");
}

// ===== MISE À JOUR SÉCURISÉE DE LA FENÊTRE =====
function updateOnlineUsersWindowSafe() {
  try {
    updateOnlineUsersWindow();
    
    // NOUVEAU: Nettoyer le timeout si la mise à jour réussit
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
  } catch (error) {
    console.error("❌ Erreur mise à jour fenêtre:", error);
    handleSearchError(error);
  }
}

// ===== MISE À JOUR DE LA FENÊTRE (MODIFIÉE) =====
function updateOnlineUsersWindow() {
  if (!isUserAuthenticated || !currentUser) {
    if (onlineUsersWindow && !onlineUsersWindow.closed) {
      onlineUsersWindow.close();
    }
    return;
  }

  if (!onlineUsersWindow || onlineUsersWindow.closed) {
    return;
  }

  const contentDiv = onlineUsersWindow.document.getElementById('users-content');
  const lastUpdateDiv = onlineUsersWindow.document.getElementById('last-update');
  
  if (!contentDiv || !lastUpdateDiv) {
    console.warn("⚠️ Éléments de la fenêtre non trouvés");
    return;
  }

  // Mettre à jour l'heure de dernière mise à jour
  lastUpdateDiv.textContent = `Dernière mise à jour : ${new Date().toLocaleTimeString('fr-FR')}`;

  const users = Object.values(onlineUsersData);
  
  // CORRIGÉ: Meilleure gestion du cas "pas de données"
  if (users.length === 0) {
    // Vérifier si on attend encore des données ou si c'est vraiment vide
    const isStillLoading = searchTimeout !== null;
    
    if (isStillLoading) {
      // On attend encore
      contentDiv.innerHTML = `
        <div class="empty-state">
          <div class="loading-spinner"></div>
          <h3>🔄 Recherche en cours...</h3>
          <p>Récupération des utilisateurs connectés...</p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            ${Math.ceil((8000 - (Date.now() - (Date.now() - 8000))) / 1000)} secondes restantes avant timeout
          </p>
        </div>
      `;
    } else {
      // Plus d'attente, afficher le résultat final
      contentDiv.innerHTML = `
        <div class="empty-state">
          <h3>👤 Vous êtes seul connecté</h3>
          <p>Aucun autre utilisateur n'est actuellement connecté</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Les autres utilisateurs apparaîtront ici quand ils se connecteront
          </p>
        </div>
      `;
    }
    return;
  }

  // Suite du code original pour afficher les utilisateurs...
  users.sort((a, b) => {
    if (a.email === currentUser?.email) return -1;
    if (b.email === currentUser?.email) return 1;
    return (a.nom || a.email).localeCompare(b.nom || b.email);
  });

  let html = '';
  
  users.forEach(user => {
    const isCurrentUser = user.email === currentUser?.email;
    const cardClass = isCurrentUser ? 'user-card current-user' : 'user-card';
    
    const connectionTime = user.timestamp ? 
      new Date(user.timestamp).toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }) : 'Heure inconnue';
    
    const userName = user.nom || user.email.split('@')[0];
    const userLevel = user.niveau || 'Utilisateur';
    
    html += `
      <div class="${cardClass}">
        <div class="user-name">
          <span class="status-online"></span>
          ${userName}
        </div>
        <div class="user-email">${user.email}</div>
        <div class="user-info">
          <span class="user-level">${userLevel}</span>
          <span class="user-time">Connecté à ${connectionTime}</span>
        </div>
      </div>
    `;
  });
  
  if (users.length === 1 && users[0].email === currentUser?.email) {
    html += `
      <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f0f8ff; border-radius: 10px; border: 1px dashed #007bff;">
        <h3 style="color: #007bff; margin-bottom: 10px;">🎯 Vous êtes seul connecté</h3>
        <p style="color: #666; margin: 0;">Les autres utilisateurs apparaîtront ici quand ils se connecteront</p>
      </div>
    `;
  }
  
  contentDiv.innerHTML = html;
  
  console.log("✅ Fenêtre mise à jour avec succès");
}

// ===== NOUVELLES FONCTIONS DE GESTION D'ERREUR =====
function handleSearchTimeout() {
  console.warn("⏰ Timeout de recherche des utilisateurs connectés");
  searchTimeout = null;
  
  if (onlineUsersWindow && !onlineUsersWindow.closed) {
    const contentDiv = onlineUsersWindow.document.getElementById('users-content');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div class="error-state">
          <h3>⏰ Timeout de recherche</h3>
          <p>La recherche des utilisateurs connectés a pris trop de temps</p>
          <p style="margin-top: 15px;">
            <button onclick="window.opener.retrySearch()" style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
              🔄 Réessayer
            </button>
          </p>
        </div>
      `;
    }
  }
}

function handleSearchError(error) {
  console.error("❌ Erreur lors de la recherche:", error);
  
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  
  if (onlineUsersWindow && !onlineUsersWindow.closed) {
    const contentDiv = onlineUsersWindow.document.getElementById('users-content');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div class="error-state">
          <h3>❌ Erreur de recherche</h3>
          <p>Impossible de récupérer les utilisateurs connectés</p>
          <p style="font-size: 12px; color: #999; margin: 10px 0;">
            Erreur: ${error.message}
          </p>
          <p>
            <button onclick="window.opener.retrySearch()" style="background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
              🔄 Réessayer
            </button>
          </p>
        </div>
      `;
    }
  } else {
    // Si pas de fenêtre, afficher une alerte
    alert(`❌ Erreur lors de la recherche des utilisateurs connectés:\n\n${error.message}\n\nVeuillez réessayer.`);
  }
}

// ===== FONCTION DE RÉESSAI =====
function retrySearch() {
  console.log("🔄 Nouvelle tentative de recherche...");
  
  if (onlineUsersWindow && !onlineUsersWindow.closed) {
    onlineUsersWindow.close();
  }
  
  // Attendre un peu avant de réessayer
  setTimeout(() => {
    openOnlineUsersWindowSafe();
  }, 1000);
}

// ===== NETTOYAGE À LA DÉCONNEXION =====
function cleanupOnlineUsersManager() {
  try {
    console.log("🧹 Nettoyage du gestionnaire des utilisateurs en ligne...");
    
    isUserAuthenticated = false;
    
    // NOUVEAU: Nettoyer le timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    
    if (window.onlineUsersRef) {
      window.onlineUsersRef.off();
      window.onlineUsersRef = null;
      console.log("✅ Écouteur Firebase supprimé");
    }
    
    if (onlineUsersWindow && !onlineUsersWindow.closed) {
      onlineUsersWindow.close();
      console.log("✅ Fenêtre utilisateurs fermée");
    }
    
    const indicator = document.getElementById('online-users-indicator');
    if (indicator) {
      indicator.remove();
      console.log("✅ Indicateur supprimé");
    }
    
    onlineUsersData = {};
    onlineUsersWindow = null;
    
    if (currentUser && db) {
      try {
        db.ref(`dp_online/${currentUser.uid}`).remove();
        console.log("✅ Entrée Firebase supprimée");
      } catch (error) {
        console.warn("⚠️ Erreur suppression Firebase:", error);
      }
    }
    
    console.log("✅ Gestionnaire des utilisateurs en ligne nettoyé complètement");
    
  } catch (error) {
    console.error("❌ Erreur nettoyage gestionnaire utilisateurs:", error);
  }
}

// ===== INITIALISATION AUTOMATIQUE =====
function initOnlineUsersManager() {
  if (typeof currentUser !== 'undefined' && currentUser) {
    initializeOnlineUsersListener();
  } else {
    const checkInterval = setInterval(() => {
      if (typeof currentUser !== 'undefined' && currentUser && isUserAuthenticated !== false) {
        clearInterval(checkInterval);
        initializeOnlineUsersListener();
      }
    }, 2000);
    
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }
}

// ===== NOUVELLE FONCTION : Activer/Désactiver le gestionnaire =====
function setOnlineUsersManagerActive(active) {
  if (active) {
    isUserAuthenticated = true;
    console.log("✅ Gestionnaire utilisateurs en ligne activé");
    if (currentUser && db) {
      initializeOnlineUsersListener();
    }
  } else {
    console.log("🚫 Gestionnaire utilisateurs en ligne désactivé");
    cleanupOnlineUsersManager();
  }
}

// ===== EXPORTS GLOBAUX =====
window.openOnlineUsersWindow = openOnlineUsersWindowSafe; // CORRIGÉ: Version sécurisée
window.updateOnlineUsersWindow = updateOnlineUsersWindow;
window.cleanupOnlineUsersManager = cleanupOnlineUsersManager;
window.setOnlineUsersManagerActive = setOnlineUsersManagerActive;
window.retrySearch = retrySearch; // NOUVEAU

// ===== INITIALISATION =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnlineUsersManager);
} else {
  initOnlineUsersManager();
}

console.log("👥 Gestionnaire des utilisateurs connectés chargé (VERSION SÉCURISÉE)");