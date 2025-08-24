// offline-manager.js - Gestionnaire de connectivité et sauvegarde d'urgence (VERSION CORRIGÉE)

// ===== VARIABLES GLOBALES =====
let isOnline = false;
let lastSyncTimestamp = null;
let emergencySaveInterval = null;
let connectionCheckInterval = null;
let offlineDataPending = false;

// NOUVELLE VARIABLE GLOBALE pour bloquer les propositions tant que pas connecté
let userAuthenticationCompleted = false;

// ===== INDICATEUR DE STATUT =====
function createConnectionIndicator() {
  // Ne pas créer l'indicateur si l'utilisateur n'est pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    return null;
  }

  // Supprimer l'ancien indicateur s'il existe
  const existingIndicator = document.getElementById('connection-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const indicator = document.createElement('div');
  indicator.id = 'connection-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    z-index: 1001;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    user-select: none;
  `;
  
  // Ajouter un bouton de sync manuel
  indicator.innerHTML = `
    <span id="status-icon">🔄</span>
    <span id="status-text">Vérification...</span>
    <button id="manual-sync-btn" style="
      background: rgba(255,255,255,0.3);
      border: none;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 11px;
      cursor: pointer;
      display: none;
    ">🔄</button>
  `;
  
  document.body.appendChild(indicator);
  
  // Event listener pour sync manuel
  document.getElementById('manual-sync-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    forceSyncToFirebase();
  });
  
  // Click sur l'indicateur pour afficher des détails
  indicator.addEventListener('click', showConnectionDetails);
  
  return indicator;
}

function updateConnectionIndicator(online, details = '') {
  // Ne pas mettre à jour si l'utilisateur n'est pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    return;
  }

  const indicator = document.getElementById('connection-indicator');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const syncBtn = document.getElementById('manual-sync-btn');
  
  if (!indicator || !statusIcon || !statusText) return;
  
  if (online) {
    indicator.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
    indicator.style.border = '1px solid #28a745';
    indicator.style.color = '#155724';
    statusIcon.textContent = '🟢';
    statusText.textContent = 'En ligne - Sauvegarde auto';
    if (syncBtn) syncBtn.style.display = 'none';
  } else {
    indicator.style.background = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
    indicator.style.border = '1px solid #dc3545';
    indicator.style.color = '#721c24';
    statusIcon.textContent = '🔴';
    statusText.textContent = 'Hors ligne - Mode local';
    if (syncBtn) syncBtn.style.display = 'block';
  }
  
  // Afficher l'état des données pendantes
  if (offlineDataPending && !online) {
    statusText.textContent = 'Hors ligne - Données à synchroniser';
    statusIcon.textContent = '⚠️';
  }
}

function showConnectionDetails() {
  // Ne pas afficher les détails si l'utilisateur n'est pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    return;
  }

  const details = `
📊 État de la connexion :
• Statut : ${isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
• Dernière sync : ${lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString('fr-FR') : 'Jamais'}
• Données pendantes : ${offlineDataPending ? '⚠️ Oui' : '✅ Non'}
• Sauvegarde d'urgence : ${emergencySaveInterval ? '✅ Active' : '❌ Inactive'}

📱 Capacités actuelles :
• Édition : ✅ Disponible
• Sauvegarde locale : ✅ Active
• Sync Firebase : ${isOnline ? '✅ Disponible' : '❌ Indisponible'}
• Partage temps réel : ${isOnline ? '✅ Actif' : '❌ Désactivé'}
  `;
  
  alert(details);
}

// ===== VÉRIFICATION DE CONNEXION =====
async function checkFirebaseConnection() {
  // Ne pas vérifier la connexion si l'utilisateur n'est pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    return false;
  }

  try {
    if (!db) {
      console.warn("⚠️ DB non initialisée pour check connexion");
      return false;
    }
    
    // Test rapide de connexion
    const testPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 3000);
      
      db.ref('.info/connected').once('value', (snapshot) => {
        clearTimeout(timeout);
        resolve(snapshot.val() === true);
      }, () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    
    const connected = await testPromise;
    
    if (connected !== isOnline) {
      const wasOnline = isOnline;
      isOnline = connected;
      firebaseConnected = connected;
      
      updateConnectionIndicator(isOnline);
      
      if (!wasOnline && isOnline) {
        showNotification("🟢 Connexion rétablie ! Synchronisation...", "success");
        await forceSyncToFirebase();
      } else if (wasOnline && !isOnline) {
        showNotification("🔴 Connexion perdue. Mode hors ligne activé.", "warning");
      }
    }
    
    return connected;
    
  } catch (error) {
    console.error("❌ Erreur vérification connexion:", error);
    isOnline = false;
    firebaseConnected = false;
    updateConnectionIndicator(false);
    return false;
  }
}

// ===== SAUVEGARDE D'URGENCE =====
function emergencyLocalSave() {
  // NOUVELLE VÉRIFICATION : Ne pas sauvegarder si pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    return false;
  }

  try {
    const emergencyData = {
      timestamp: Date.now(),
      plongeurs: plongeurs || [],
      palanquees: palanquees || [],
      metadata: {
        dp: document.getElementById("dp-nom")?.value || "",
        date: document.getElementById("dp-date")?.value || "",
        lieu: document.getElementById("dp-lieu")?.value || "",
        plongee: document.getElementById("dp-plongee")?.value || "matin"
      },
      version: "2.5.0-offline",
      userEmail: currentUser.email // Ajouter l'email de l'utilisateur pour sécurité
    };
    
    // Sauvegarder dans sessionStorage ET localStorage
    sessionStorage.setItem('jsas_emergency_backup', JSON.stringify(emergencyData));
    localStorage.setItem('jsas_last_backup', JSON.stringify(emergencyData));
////
// NOUVEAU : Sauvegarder aussi le DP sélectionné
const dpSelect = document.getElementById('dp-select');
if (dpSelect && dpSelect.value) {
  localStorage.setItem('emergency_dp_selected', dpSelect.value);
  localStorage.setItem('emergency_dp_text', dpSelect.options[dpSelect.selectedIndex].text);
  console.log('💾 DP sélectionné sauvegardé:', dpSelect.options[dpSelect.selectedIndex].text);
}
////    
    console.log("✅ Sauvegarde d'urgence effectuée");

//// NOUVEAU : Restaurer le DP sélectionné après sauvegarde d'urgence
setTimeout(() => {
  const savedDpId = localStorage.getItem('emergency_dp_selected');
  if (savedDpId) {
    const dpSelect = document.getElementById('dp-select');
    if (dpSelect) {
      dpSelect.value = savedDpId;
      console.log('🔄 DP restauré après rechargement:', localStorage.getItem('emergency_dp_text'));
      
      // Déclencher l'événement de changement si la fonction existe
      if (typeof onDpSelectionChange === 'function') {
        onDpSelectionChange();
      }
    }
    
    // Nettoyer les données temporaires
    localStorage.removeItem('emergency_dp_selected');
    localStorage.removeItem('emergency_dp_text');
  }
}, 1000);
////
    
    // Marquer comme données pendantes si hors ligne
    if (!isOnline) {
      offlineDataPending = true;
      updateConnectionIndicator(false);
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde d'urgence:", error);
    return false;
  }
}

function loadEmergencyBackup() {
  // NOUVELLE VÉRIFICATION CRITIQUE : Ne pas proposer de restauration si pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    console.log("ℹ️ Utilisateur non authentifié - pas de proposition de restauration");
    return false;
  }

  try {
    // Essayer sessionStorage en premier, puis localStorage
    let backupData = sessionStorage.getItem('jsas_emergency_backup');
    if (!backupData) {
      backupData = localStorage.getItem('jsas_last_backup');
    }
    
    if (!backupData) {
      console.log("ℹ️ Aucune sauvegarde d'urgence trouvée");
      return false;
    }
    
    const data = JSON.parse(backupData);
    const backupDate = new Date(data.timestamp).toLocaleString('fr-FR');
    
    // NOUVELLE VÉRIFICATION : Vérifier que la sauvegarde appartient au bon utilisateur
    if (data.userEmail && data.userEmail !== currentUser.email) {
      console.log("⚠️ Sauvegarde d'un autre utilisateur détectée - ignorée");
      // Nettoyer les sauvegardes d'autres utilisateurs
      sessionStorage.removeItem('jsas_emergency_backup');
      localStorage.removeItem('jsas_last_backup');
      return false;
    }
    
    const confirmRestore = confirm(
      `🔄 Sauvegarde d'urgence trouvée du ${backupDate}\n\n` +
      `📊 Contenu :\n` +
      `• ${data.plongeurs?.length || 0} plongeurs\n` +
      `• ${data.palanquees?.length || 0} palanquées\n` +
      `• DP : ${data.metadata?.dp || 'Non défini'}\n\n` +
      `Voulez-vous restaurer ces données ?`
    );
    
    if (confirmRestore) {
      // Restaurer les données
      if (Array.isArray(data.plongeurs)) {
        plongeurs = data.plongeurs;
        plongeursOriginaux = [...data.plongeurs];
      }
      
      if (Array.isArray(data.palanquees)) {
        palanquees = data.palanquees;
      }
      
      // Restaurer les métadonnées
      if (data.metadata) {
        const dpNom = document.getElementById("dp-nom");
        const dpDate = document.getElementById("dp-date");
        const dpLieu = document.getElementById("dp-lieu");
        const dpPlongee = document.getElementById("dp-plongee");
        
        if (dpNom) dpNom.value = data.metadata.dp || "";
        if (dpDate) dpDate.value = data.metadata.date || "";
        if (dpLieu) dpLieu.value = data.metadata.lieu || "";
        if (dpPlongee) dpPlongee.value = data.metadata.plongee || "matin";
      }
      
      // Re-rendre l'interface
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      showNotification("✅ Sauvegarde d'urgence restaurée avec succès !", "success");
      
      // Marquer comme données pendantes
      offlineDataPending = true;
      
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error("❌ Erreur chargement sauvegarde d'urgence:", error);
    alert("❌ Erreur lors du chargement de la sauvegarde d'urgence");
    return false;
  }
}

// ===== SYNCHRONISATION FORCÉE =====
async function forceSyncToFirebase() {
  // Ne pas synchroniser si l'utilisateur n'est pas authentifié
  if (!userAuthenticationCompleted || !currentUser) {
    showNotification("⚠️ Synchronisation impossible - utilisateur non connecté", "warning");
    return false;
  }

  const syncBtn = document.getElementById('manual-sync-btn');
  const statusIcon = document.getElementById('status-icon');
  
  try {
    // Animation de synchronisation
    if (statusIcon) statusIcon.textContent = '🔄';
    if (syncBtn) {
      syncBtn.textContent = '⏳';
      syncBtn.disabled = true;
    }
    
    showNotification("🔄 Synchronisation en cours...", "info");
    
    // Vérifier la connexion d'abord
    const connected = await checkFirebaseConnection();
    
    if (!connected) {
      throw new Error("Connexion Firebase indisponible");
    }
    
    // Effectuer la synchronisation
    if (typeof syncToDatabase === 'function') {
      await syncToDatabase();
    } else {
      // Synchronisation manuelle si la fonction n'existe pas
      await Promise.all([
        db.ref('plongeurs').set(plongeurs || []),
        db.ref('palanquees').set(palanquees || [])
      ]);
      
      // Sauvegarder la session si les métadonnées sont remplies
      if (typeof saveSessionData === 'function') {
        await saveSessionData();
      }
    }
    
    // Mettre à jour les timestamps
    lastSyncTimestamp = Date.now();
    offlineDataPending = false;
    
    // Nettoyer les sauvegardes d'urgence après sync réussie
    sessionStorage.removeItem('jsas_emergency_backup');
    
    showNotification("✅ Synchronisation réussie !", "success");
    updateConnectionIndicator(true);
    
    console.log("✅ Synchronisation forcée réussie");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur synchronisation forcée:", error);
    showNotification(`❌ Échec de synchronisation : ${error.message}`, "error");
    updateConnectionIndicator(false);
    return false;
    
  } finally {
    // Restaurer l'interface
    if (statusIcon) statusIcon.textContent = isOnline ? '🟢' : '🔴';
    if (syncBtn) {
      syncBtn.textContent = '🔄';
      syncBtn.disabled = false;
    }
  }
}

// ===== NOTIFICATIONS AMÉLIORÉES =====
function showNotification(message, type = "info", duration = 4000) {
  try {
    let container = document.getElementById("offline-notifications");
    
    if (!container) {
      container = document.createElement("div");
      container.id = "offline-notifications";
      container.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        z-index: 1500;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    
    const notification = document.createElement("div");
    notification.style.cssText = `
      background: white;
      border-left: 4px solid ${getNotificationColor(type)};
      border-radius: 6px;
      padding: 12px 16px;
      margin: 8px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      pointer-events: auto;
    `;
    
    notification.innerHTML = `
      <span style="flex: 1;">${message}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none; 
        border: none; 
        font-size: 16px; 
        cursor: pointer; 
        margin-left: 10px;
        opacity: 0.7;
      ">×</button>
    `;
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-suppression
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
    
  } catch (error) {
    console.error("❌ Erreur notification:", error);
    // Fallback vers alert
    alert(message);
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#28a745';
    case 'warning': return '#ffc107';
    case 'error': return '#dc3545';
    case 'info': 
    default: return '#007bff';
  }
}

// ===== GESTIONNAIRE PRINCIPAL =====
function initializeOfflineManager() {
  console.log("🌐 Initialisation du gestionnaire hors ligne...");
  
  try {
    // NOUVELLE VÉRIFICATION : Ne s'initialiser que si l'utilisateur est authentifié
    if (!userAuthenticationCompleted || !currentUser) {
      console.log("ℹ️ Utilisateur non authentifié - gestionnaire hors ligne en attente");
      return;
    }

    // Créer l'indicateur de connexion
    createConnectionIndicator();
    
    // Vérification initiale de la connexion
    checkFirebaseConnection();
    
    // Vérifications périodiques de connexion (toutes les 10 secondes)
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
    connectionCheckInterval = setInterval(checkFirebaseConnection, 10000);
    
    // Sauvegarde d'urgence automatique (toutes les 30 secondes)
    if (emergencySaveInterval) {
      clearInterval(emergencySaveInterval);
    }
    emergencySaveInterval = setInterval(emergencyLocalSave, 30000);
    
    // MODIFICATION : Proposer de restaurer une sauvegarde d'urgence seulement après authentification
    setTimeout(() => {
      if (userAuthenticationCompleted && currentUser) {
        loadEmergencyBackup();
      }
    }, 2000);
    
    // Intercepter les modifications pour déclencher la sauvegarde d'urgence
    const originalSyncToDatabase = window.syncToDatabase;
    if (originalSyncToDatabase) {
      window.syncToDatabase = async function() {
        // Sauvegarde d'urgence immédiate (seulement si authentifié)
        if (userAuthenticationCompleted && currentUser) {
          emergencyLocalSave();
        }
        
        try {
          // Appeler la fonction originale
          const result = await originalSyncToDatabase.apply(this, arguments);
          
          // Si la sync réussit, mettre à jour le statut
          lastSyncTimestamp = Date.now();
          offlineDataPending = false;
          updateConnectionIndicator(isOnline);
          
          return result;
          
        } catch (error) {
          console.warn("⚠️ Sync Firebase échouée, données conservées localement:", error.message);
          offlineDataPending = true;
          updateConnectionIndicator(false);
          
          // Ne pas propager l'erreur pour éviter de casser l'application
          return false;
        }
      };
    }
    
    // Nettoyage à la fermeture
    window.addEventListener('beforeunload', () => {
      if (emergencySaveInterval) clearInterval(emergencySaveInterval);
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);
      
      // Sauvegarde finale (seulement si authentifié)
      if (userAuthenticationCompleted && currentUser) {
        emergencyLocalSave();
      }
    });
    
    console.log("✅ Gestionnaire hors ligne initialisé");
    showNotification("🌐 Gestionnaire hors ligne activé", "info", 2000);
    
  } catch (error) {
    console.error("❌ Erreur initialisation gestionnaire hors ligne:", error);
  }
}

// ===== NOUVELLE FONCTION : Marquer l'utilisateur comme authentifié =====
function setUserAuthenticated(authenticated = true) {
  userAuthenticationCompleted = authenticated;
  
  if (authenticated && currentUser) {
    console.log("✅ Utilisateur authentifié - activation du gestionnaire hors ligne");
    // Initialiser le gestionnaire hors ligne maintenant que l'utilisateur est connecté
    initializeOfflineManager();
  } else {
    console.log("ℹ️ Utilisateur déconnecté - désactivation du gestionnaire hors ligne");
    // Nettoyer le gestionnaire hors ligne
    cleanupOfflineManager();
  }
}

// ===== NOUVELLE FONCTION : Nettoyage du gestionnaire =====
function cleanupOfflineManager() {
  try {
    // Arrêter les intervalles
    if (emergencySaveInterval) {
      clearInterval(emergencySaveInterval);
      emergencySaveInterval = null;
    }
    
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
    
    // Supprimer l'indicateur de connexion
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    // Réinitialiser les variables
    isOnline = false;
    lastSyncTimestamp = null;
    offlineDataPending = false;
    
    console.log("🧹 Gestionnaire hors ligne nettoyé");
    
  } catch (error) {
    console.error("❌ Erreur nettoyage gestionnaire hors ligne:", error);
  }
}

// ===== PANNEAU DE GESTION HORS LIGNE =====
function showOfflineManagerPanel() {
  if (!userAuthenticationCompleted || !currentUser) {
    alert("⚠️ Vous devez être connecté pour accéder au gestionnaire hors ligne");
    return;
  }

  const stats = getOfflineStats();
  
  if (!stats) {
    alert("❌ Impossible de récupérer les statistiques hors ligne");
    return;
  }
  
  const formatAge = (ms) => {
    if (!ms) return "Jamais";
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };
  
  const panelContent = `
🌐 GESTIONNAIRE HORS LIGNE

📊 État actuel :
• Connexion : ${stats.isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
• Dernière sync : ${stats.lastSync ? new Date(stats.lastSync).toLocaleString('fr-FR') : 'Jamais'}
• Données pendantes : ${stats.pendingData ? '⚠️ Oui' : '✅ Non'}

💾 Sauvegardes disponibles :
• Session active : ${stats.hasSessionBackup ? '✅ Oui (' + formatAge(stats.sessionBackupAge) + ')' : '❌ Non'}
• Sauvegarde locale : ${stats.hasLocalBackup ? '✅ Oui (' + formatAge(stats.localBackupAge) + ')' : '❌ Non'}

🔧 Actions disponibles :
[1] Synchroniser maintenant
[2] Charger sauvegarde d'urgence
[3] Effacer données hors ligne
[4] Forcer sauvegarde locale
[Annuler]
  `;
  
  const choice = prompt(panelContent + "\nChoisissez une action (1-4) :");
  
  switch(choice) {
    case '1':
      forceSyncToFirebase();
      break;
      
    case '2':
      loadEmergencyBackup();
      break;
      
    case '3':
      if (confirm("⚠️ Effacer toutes les données hors ligne ?\n\nCette action est irréversible !")) {
        clearOfflineData();
      }
      break;
      
    case '4':
      emergencyLocalSave();
      showNotification("💾 Sauvegarde locale forcée effectuée", "success");
      break;
      
    default:
      // Annulation - ne rien faire
      break;
  }
}

// ===== FONCTIONS UTILITAIRES =====
function clearOfflineData() {
  try {
    sessionStorage.removeItem('jsas_emergency_backup');
    localStorage.removeItem('jsas_last_backup');
    offlineDataPending = false;
    updateConnectionIndicator(isOnline);
    showNotification("🗑️ Données hors ligne effacées", "info");
  } catch (error) {
    console.error("❌ Erreur nettoyage données hors ligne:", error);
  }
}

function getOfflineStats() {
  try {
    const sessionData = sessionStorage.getItem('jsas_emergency_backup');
    const localData = localStorage.getItem('jsas_last_backup');
    
    return {
      hasSessionBackup: !!sessionData,
      hasLocalBackup: !!localData,
      sessionBackupAge: sessionData ? Date.now() - JSON.parse(sessionData).timestamp : null,
      localBackupAge: localData ? Date.now() - JSON.parse(localData).timestamp : null,
      isOnline: isOnline,
      lastSync: lastSyncTimestamp,
      pendingData: offlineDataPending
    };
  } catch (error) {
    console.error("❌ Erreur stats hors ligne:", error);
    return null;
  }
}

// ===== INITIALISATION MODIFIÉE =====
// Ne plus attendre automatiquement - l'initialisation se fera via setUserAuthenticated()
function waitForInitialization() {
  // Cette fonction est maintenant vide - l'initialisation est contrôlée manuellement
  console.log("ℹ️ Gestionnaire hors ligne en attente de l'authentification utilisateur");
}

// Commencer l'attente (mais ne rien faire automatiquement)
waitForInitialization();

// Export des fonctions pour usage global
window.forceSyncToFirebase = forceSyncToFirebase;
window.emergencyLocalSave = emergencyLocalSave;
window.loadEmergencyBackup = loadEmergencyBackup;
window.clearOfflineData = clearOfflineData;
window.getOfflineStats = getOfflineStats;
window.setUserAuthenticated = setUserAuthenticated; // NOUVELLE EXPORT
window.showOfflineManagerPanel = showOfflineManagerPanel;

console.log("📱 Module de gestion hors ligne chargé (version sécurisée)");