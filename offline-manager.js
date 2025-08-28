// offline-manager.js - Gestionnaire de connectivité et sauvegarde d'urgence

// ===== VARIABLES GLOBALES =====
let isOnline = false;
let lastSyncTimestamp = null;
let emergencySaveInterval = null;
let connectionCheckInterval = null;
let offlineDataPending = false;
let userAuthenticationCompleted = false;

// ===== INDICATEUR DE STATUT =====
function createConnectionIndicator() {
  if (!userAuthenticationCompleted || !currentUser) {
    return null;
  }

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
  
  document.getElementById('manual-sync-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    forceSyncToFirebase();
  });
  
  indicator.addEventListener('click', showConnectionDetails);
  
  return indicator;
}

function updateConnectionIndicator(online, details = '') {
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
  
  if (offlineDataPending && !online) {
    statusText.textContent = 'Hors ligne - Données à synchroniser';
    statusIcon.textContent = '⚠️';
  }
}

function showConnectionDetails() {
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
  if (!userAuthenticationCompleted || !currentUser) {
    return false;
  }

  try {
    if (!db) {
      console.warn("⚠️ DB non initialisée pour check connexion");
      return false;
    }
    
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
  if (!userAuthenticationCompleted || !currentUser) {
    return false;
  }

  try {
    // Récupérer le DP sélectionné avec plusieurs méthodes
    const getDPSelected = () => {
      // Méthode 1: variable globale
      if (window.dpSelected) {
        return window.dpSelected;
      }
      
      // Méthode 2: fonction getCurrentDPName si elle existe
      if (typeof getCurrentDPName === 'function') {
        const dpName = getCurrentDPName();
        if (dpName) return dpName;
      }
      
      // Méthode 3: sélecteur HTML
      const dpSelect = document.getElementById("dp-select");
      if (dpSelect && dpSelect.selectedIndex > 0) {
        return dpSelect.options[dpSelect.selectedIndex].text.trim();
      }
      
      return "";
    };

    const emergencyData = {
      timestamp: Date.now(),
      plongeurs: plongeurs || [],
      palanquees: (palanquees || []).map(pal => {
        const palanqueeComplete = {
          plongeurs: [],
          parametres: {
            horaire: pal.horaire || "",
            profondeurPrevue: pal.profondeurPrevue || "",
            dureePrevue: pal.dureePrevue || "",
            profondeurRealisee: pal.profondeurRealisee || "",
            dureeRealisee: pal.dureeRealisee || "",
            paliers: pal.paliers || ""
          }
        };
        
        for (let i = 0; i < pal.length; i++) {
          if (pal[i] && pal[i].nom) {
            palanqueeComplete.plongeurs.push(pal[i]);
          }
        }
        
        return palanqueeComplete;
      }),
      metadata: {
        dp: getDPSelected(),
        date: document.getElementById("dp-date")?.value || "",
        lieu: document.getElementById("dp-lieu")?.value || "",
        plongee: document.getElementById("dp-plongee")?.value || "matin"
      },
      version: "2.5.0-offline",
      userEmail: currentUser.email
    };
    
    sessionStorage.setItem('jsas_emergency_backup', JSON.stringify(emergencyData));
    localStorage.setItem('jsas_last_backup', JSON.stringify(emergencyData));
    
    console.log("💾 Sauvegarde d'urgence effectuée - DP:", emergencyData.metadata.dp);
    
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
  if (!userAuthenticationCompleted || !currentUser) {
    console.log("ℹ️ Utilisateur non authentifié - pas de proposition de restauration");
    return false;
  }

  try {
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
    
    if (data.userEmail && data.userEmail !== currentUser.email) {
      console.log("⚠️ Sauvegarde d'un autre utilisateur détectée - ignorée");
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
        palanquees = data.palanquees.map(palData => {
          const palanqueeArray = [];
          
          if (palData.plongeurs && Array.isArray(palData.plongeurs)) {
            palData.plongeurs.forEach(plongeur => {
              palanqueeArray.push(plongeur);
            });
          } else if (Array.isArray(palData)) {
            palData.forEach(plongeur => {
              if (plongeur && plongeur.nom) {
                palanqueeArray.push(plongeur);
              }
            });
          }
          
          if (palData.parametres) {
            palanqueeArray.horaire = palData.parametres.horaire || "";
            palanqueeArray.profondeurPrevue = palData.parametres.profondeurPrevue || "";
            palanqueeArray.dureePrevue = palData.parametres.dureePrevue || "";
            palanqueeArray.profondeurRealisee = palData.parametres.profondeurRealisee || "";
            palanqueeArray.dureeRealisee = palData.parametres.dureeRealisee || "";
            palanqueeArray.paliers = palData.parametres.paliers || "";
          } else {
            palanqueeArray.horaire = palData.horaire || "";
            palanqueeArray.profondeurPrevue = palData.profondeurPrevue || "";
            palanqueeArray.dureePrevue = palData.dureePrevue || "";
            palanqueeArray.profondeurRealisee = palData.profondeurRealisee || "";
            palanqueeArray.dureeRealisee = palData.dureeRealisee || "";
            palanqueeArray.paliers = palData.paliers || "";
          }
          
          return palanqueeArray;
        });
      }
      
      // Restaurer les métadonnées avec patience pour le DP
      if (data.metadata) {
        const dpDate = document.getElementById("dp-date");
        const dpLieu = document.getElementById("dp-lieu");
        const dpPlongee = document.getElementById("dp-plongee");
        
        if (dpDate) dpDate.value = data.metadata.date || "";
        if (dpLieu) dpLieu.value = data.metadata.lieu || "";
        if (dpPlongee) dpPlongee.value = data.metadata.plongee || "matin";
        
        // Restaurer le DP avec attente
        const dpNomSauvegarde = data.metadata.dp;
        if (dpNomSauvegarde) {
          console.log("🔄 Restauration du DP:", dpNomSauvegarde);
          
          const restaurerDP = () => {
            const dpSelect = document.getElementById("dp-select");
            
            if (!dpSelect || dpSelect.options.length <= 1) {
              setTimeout(restaurerDP, 300);
              return;
            }
            
            let dpTrouve = false;
            
            // Recherche exacte d'abord
            for (let i = 0; i < dpSelect.options.length; i++) {
              if (dpSelect.options[i].text.trim() === dpNomSauvegarde.trim()) {
                dpSelect.selectedIndex = i;
                dpSelect.value = dpSelect.options[i].value;
                window.dpSelected = dpNomSauvegarde;
                dpTrouve = true;
                console.log("✅ DP restauré (exact):", dpNomSauvegarde);
                break;
              }
            }
            
            // Recherche partielle si exact échoue
            if (!dpTrouve) {
              const nomFamille = dpNomSauvegarde.split(' ')[0];
              for (let i = 0; i < dpSelect.options.length; i++) {
                if (dpSelect.options[i].text.includes(nomFamille)) {
                  dpSelect.selectedIndex = i;
                  dpSelect.value = dpSelect.options[i].value;
                  window.dpSelected = dpNomSauvegarde;
                  dpTrouve = true;
                  console.log("✅ DP restauré (partiel):", nomFamille);
                  break;
                }
              }
            }
            
            if (dpTrouve) {
              dpSelect.dispatchEvent(new Event('change', { bubbles: true }));
              dpSelect.dispatchEvent(new Event('input', { bubbles: true }));
              
              // Vérification finale
              setTimeout(() => {
                console.log("🎯 DP final:", dpSelect.options[dpSelect.selectedIndex]?.text);
              }, 500);
            } else {
              console.log("❌ DP non trouvé:", dpNomSauvegarde);
            }
          };
          
          // Délai pour laisser le DOM et Firebase se stabiliser
          setTimeout(restaurerDP, 1000);
        }
      }

      // Re-rendre l'interface
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      showNotification("✅ Sauvegarde d'urgence restaurée avec succès !", "success");
      
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
  if (!userAuthenticationCompleted || !currentUser) {
    showNotification("⚠️ Synchronisation impossible - utilisateur non connecté", "warning");
    return false;
  }

  const syncBtn = document.getElementById('manual-sync-btn');
  const statusIcon = document.getElementById('status-icon');
  
  try {
    if (statusIcon) statusIcon.textContent = '🔄';
    if (syncBtn) {
      syncBtn.textContent = '⏳';
      syncBtn.disabled = true;
    }
    
    showNotification("🔄 Synchronisation en cours...", "info");
    
    const connected = await checkFirebaseConnection();
    
    if (!connected) {
      throw new Error("Connexion Firebase indisponible");
    }
    
    if (typeof syncToDatabase === 'function') {
      await syncToDatabase();
    } else {
      await Promise.all([
        db.ref('plongeurs').set(plongeurs || []),
        db.ref('palanquees').set(palanquees || [])
      ]);
      
      if (typeof saveSessionData === 'function') {
        await saveSessionData();
      }
    }
    
    lastSyncTimestamp = Date.now();
    offlineDataPending = false;
    
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
    if (statusIcon) statusIcon.textContent = isOnline ? '🟢' : '🔴';
    if (syncBtn) {
      syncBtn.textContent = '🔄';
      syncBtn.disabled = false;
    }
  }
}

// ===== NOTIFICATIONS =====
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
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
    
  } catch (error) {
    console.error("❌ Erreur notification:", error);
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
    if (!userAuthenticationCompleted || !currentUser) {
      console.log("ℹ️ Utilisateur non authentifié - gestionnaire hors ligne en attente");
      return;
    }

    createConnectionIndicator();
    
    checkFirebaseConnection();
    
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
    connectionCheckInterval = setInterval(checkFirebaseConnection, 10000);
    
    if (emergencySaveInterval) {
      clearInterval(emergencySaveInterval);
    }
    emergencySaveInterval = setInterval(emergencyLocalSave, 30000);
    
    setTimeout(() => {
      if (userAuthenticationCompleted && currentUser) {
        loadEmergencyBackup();
      }
    }, 2000);
    
    const originalSyncToDatabase = window.syncToDatabase;
    if (originalSyncToDatabase) {
      window.syncToDatabase = async function() {
        if (userAuthenticationCompleted && currentUser) {
          emergencyLocalSave();
        }
        
        try {
          const result = await originalSyncToDatabase.apply(this, arguments);
          
          lastSyncTimestamp = Date.now();
          offlineDataPending = false;
          updateConnectionIndicator(isOnline);
          
          return result;
          
        } catch (error) {
          console.warn("⚠️ Sync Firebase échouée, données conservées localement:", error.message);
          offlineDataPending = true;
          updateConnectionIndicator(false);
          
          return false;
        }
      };
    }
    
    window.addEventListener('beforeunload', () => {
      if (emergencySaveInterval) clearInterval(emergencySaveInterval);
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);
      
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

// ===== CONTRÔLE UTILISATEUR =====
function setUserAuthenticated(authenticated = true) {
  userAuthenticationCompleted = authenticated;
  
  if (authenticated && currentUser) {
    console.log("✅ Utilisateur authentifié - activation du gestionnaire hors ligne");
    initializeOfflineManager();
  } else {
    console.log("ℹ️ Utilisateur déconnecté - désactivation du gestionnaire hors ligne");
    cleanupOfflineManager();
  }
}

function cleanupOfflineManager() {
  try {
    if (emergencySaveInterval) {
      clearInterval(emergencySaveInterval);
      emergencySaveInterval = null;
    }
    
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
    
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    isOnline = false;
    lastSyncTimestamp = null;
    offlineDataPending = false;
    
    console.log("🧹 Gestionnaire hors ligne nettoyé");
    
  } catch (error) {
    console.error("❌ Erreur nettoyage gestionnaire hors ligne:", error);
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

// ===== EXPORTS GLOBAUX =====
window.forceSyncToFirebase = forceSyncToFirebase;
window.emergencyLocalSave = emergencyLocalSave;
window.loadEmergencyBackup = loadEmergencyBackup;
window.clearOfflineData = clearOfflineData;
window.getOfflineStats = getOfflineStats;
window.setUserAuthenticated = setUserAuthenticated;
window.showOfflineManagerPanel = () => {
  if (!userAuthenticationCompleted || !currentUser) {
    alert("⚠️ Vous devez être connecté pour accéder au gestionnaire hors ligne");
    return;
  }
  console.log("📱 Panneau de gestion hors ligne disponible via console");
};

console.log("📱 Module de gestion hors ligne chargé (version complète)");