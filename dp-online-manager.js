// dp-online-manager.js - Gestionnaire des utilisateurs connectés

// ===== VARIABLES GLOBALES =====
let onlineUsersData = {};
let onlineUsersWindow = null;
let onlineUsersInterval = null;

// ===== ÉCOUTEUR DES UTILISATEURS EN LIGNE =====
function initializeOnlineUsersListener() {
  if (!db || !currentUser) {
    console.warn("⚠️ Firebase ou utilisateur non disponible pour l'écoute des utilisateurs en ligne");
    return;
  }

  console.log("👥 Initialisation de l'écoute des utilisateurs connectés...");

  try {
    const onlineRef = db.ref('dp_online');
    
    onlineRef.on('value', (snapshot) => {
      onlineUsersData = snapshot.val() || {};
      console.log(`👥 ${Object.keys(onlineUsersData).length} utilisateur(s) connecté(s)`);
      
      // Mettre à jour la fenêtre si elle est ouverte
      if (onlineUsersWindow && !onlineUsersWindow.closed) {
        updateOnlineUsersWindow();
      }
      
      // Mettre à jour l'indicateur dans l'interface principale
      updateOnlineUsersIndicator();
    });

    // Nettoyer à la déconnexion
    onlineRef.onDisconnect().remove();
    
    console.log("✅ Écoute des utilisateurs connectés initialisée");
    
  } catch (error) {
    console.error("❌ Erreur initialisation écoute utilisateurs:", error);
  }
}

// ===== INDICATEUR DANS L'INTERFACE PRINCIPALE =====
function updateOnlineUsersIndicator() {
  if (!currentUser) return;

  let indicator = document.getElementById('online-users-indicator');
  
  if (!indicator) {
    // Créer l'indicateur s'il n'existe pas
    indicator = document.createElement('div');
    indicator.id = 'online-users-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 60px;
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
    
    indicator.addEventListener('click', openOnlineUsersWindow);
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
  const otherUsers = userCount - 1; // Exclure soi-même
  
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

// ===== FENÊTRE DES UTILISATEURS CONNECTÉS =====
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
    alert('❌ Impossible d\'ouvrir la fenêtre. Veuillez autoriser les pop-ups.');
    return;
  }

  // Contenu initial de la fenêtre
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
            <h3>🔄 Chargement...</h3>
            <p>Récupération des utilisateurs connectés...</p>
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
  
  // Mettre à jour immédiatement
  setTimeout(() => {
    updateOnlineUsersWindow();
  }, 500);

  // Nettoyer quand la fenêtre se ferme
  onlineUsersWindow.addEventListener('beforeunload', () => {
    onlineUsersWindow = null;
  });

  console.log("✅ Fenêtre des utilisateurs connectés ouverte");
}

// ===== MISE À JOUR DE LA FENÊTRE =====
function updateOnlineUsersWindow() {
  if (!onlineUsersWindow || onlineUsersWindow.closed) {
    return;
  }

  const contentDiv = onlineUsersWindow.document.getElementById('users-content');
  const lastUpdateDiv = onlineUsersWindow.document.getElementById('last-update');
  
  if (!contentDiv || !lastUpdateDiv) {
    return;
  }

  // Mettre à jour l'heure de dernière mise à jour
  lastUpdateDiv.textContent = `Dernière mise à jour : ${new Date().toLocaleTimeString('fr-FR')}`;

  const users = Object.values(onlineUsersData);
  
  if (users.length === 0) {
    contentDiv.innerHTML = `
      <div class="empty-state">
        <h3>😴 Personne en ligne</h3>
        <p>Aucun utilisateur connecté actuellement</p>
      </div>
    `;
    return;
  }

  // Trier les utilisateurs : utilisateur actuel en premier, puis par nom
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
  
  contentDiv.innerHTML = html;
}

// ===== NETTOYAGE À LA DÉCONNEXION =====
function cleanupOnlineUsersManager() {
  try {
    // Fermer la fenêtre
    if (onlineUsersWindow && !onlineUsersWindow.closed) {
      onlineUsersWindow.close();
    }
    
    // Supprimer l'indicateur
    const indicator = document.getElementById('online-users-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    // Nettoyer les écouteurs Firebase
    if (db) {
      db.ref('dp_online').off();
    }
    
    // Réinitialiser les variables
    onlineUsersData = {};
    onlineUsersWindow = null;
    
    console.log("🧹 Gestionnaire des utilisateurs en ligne nettoyé");
    
  } catch (error) {
    console.error("❌ Erreur nettoyage gestionnaire utilisateurs:", error);
  }
}

// ===== INITIALISATION AUTOMATIQUE =====
function initOnlineUsersManager() {
  // Attendre que l'utilisateur soit connecté
  if (typeof currentUser !== 'undefined' && currentUser) {
    initializeOnlineUsersListener();
  } else {
    // Réessayer toutes les 2 secondes jusqu'à ce que l'utilisateur soit connecté
    const checkInterval = setInterval(() => {
      if (typeof currentUser !== 'undefined' && currentUser) {
        clearInterval(checkInterval);
        initializeOnlineUsersListener();
      }
    }, 2000);
    
    // Arrêter après 30 secondes max
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }
}

// ===== EXPORTS GLOBAUX =====
window.openOnlineUsersWindow = openOnlineUsersWindow;
window.updateOnlineUsersWindow = updateOnlineUsersWindow;
window.cleanupOnlineUsersManager = cleanupOnlineUsersManager;

// ===== INITIALISATION =====
// Lancer l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnlineUsersManager);
} else {
  initOnlineUsersManager();
}

console.log("👥 Gestionnaire des utilisateurs connectés chargé");