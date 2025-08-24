// offline-manager.js - Gestionnaire de connectivité et sauvegarde d'urgence (VERSION CORRIGÉE)

// ===== VARIABLES GLOBALES =====
let isOnline = false;
let lastSyncTimestamp = null;
let emergencySaveInterval = null;
let connectionCheckInterval = null;
let offlineDataPending = false;
let userAuthenticationCompleted = false;

// ===== CONFIGURATION SÉLECTEURS UNIFIÉE =====
const SELECTORS = {
  dp: {
    nom: "#dp-nom",
    niveau: "#dp-niveau",
    date: "#dp-date", 
    lieu: "#dp-lieu",
    plongee: "#dp-plongee", // Unifié : toujours dp-plongee
    select: "#dp-select"
  },
  palanquee: {
    container: ".palanquee",
    horaire: ".palanquee-horaire",
    profPrevue: ".palanquee-prof-prevue",
    dureePrevue: ".palanquee-duree-prevue", 
    profRealisee: ".palanquee-prof-realisee",
    dureeRealisee: ".palanquee-duree-realisee",
    paliers: ".palanquee-paliers"
  },
  plongeur: {
    container: ".plongeur",
    inputs: "input, select, textarea"
  }
};

// ===== UTILITAIRES DOM =====
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: élément ${selector} non trouvé après ${timeout}ms`));
        return;
      }
      
      setTimeout(check, 100);
    }
    
    check();
  });
}

function verifyRequiredElements() {
  const required = [
    SELECTORS.dp.nom,
    SELECTORS.dp.date,
    SELECTORS.dp.lieu,
    SELECTORS.dp.plongee
  ];
  
  const missing = required.filter(selector => !document.querySelector(selector));
  return missing.length === 0 ? null : missing;
}

// ===== INDICATEUR DE STATUT =====
function createConnectionIndicator() {
  if (!userAuthenticationCompleted || !currentUser) return null;

  const existingIndicator = document.getElementById('connection-indicator');
  if (existingIndicator) existingIndicator.remove();

  const indicator = document.createElement('div');
  indicator.id = 'connection-indicator';
  indicator.style.cssText = `
    position: fixed; top: 10px; left: 10px; padding: 8px 15px;
    border-radius: 20px; font-size: 12px; font-weight: bold;
    z-index: 1001; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease;
    cursor: pointer; user-select: none;
  `;

  indicator.innerHTML = `
    <span id="status-icon">🔄</span>
    <span id="status-text">Vérification...</span>
    <button id="manual-sync-btn" style="
      background: rgba(255,255,255,0.3); border: none; border-radius: 10px;
      padding: 2px 6px; font-size: 11px; cursor: pointer; display: none;
    ">🔄</button>
  `;
  document.body.appendChild(indicator);

  document.getElementById('manual-sync-btn').addEventListener('click', e=>{
    e.stopPropagation(); forceSyncToFirebase();
  });
  indicator.addEventListener('click', showConnectionDetails);

  return indicator;
}

function updateConnectionIndicator(online, details='') {
  if (!userAuthenticationCompleted || !currentUser) return;

  const indicator = document.getElementById('connection-indicator');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const syncBtn = document.getElementById('manual-sync-btn');
  if (!indicator || !statusIcon || !statusText) return;

  if(online){
    indicator.style.background='linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
    indicator.style.border='1px solid #28a745'; indicator.style.color='#155724';
    statusIcon.textContent='🟢'; statusText.textContent='En ligne - Sauvegarde auto';
    if(syncBtn) syncBtn.style.display='none';
  }else{
    indicator.style.background='linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
    indicator.style.border='1px solid #dc3545'; indicator.style.color='#721c24';
    statusIcon.textContent='🔴'; statusText.textContent='Hors ligne - Mode local';
    if(syncBtn) syncBtn.style.display='block';
  }
  if(offlineDataPending && !online){
    statusText.textContent='Hors ligne - Données à synchroniser';
    statusIcon.textContent='⚠️';
  }
}

function showConnectionDetails(){
  if(!userAuthenticationCompleted || !currentUser) return;

  const details = `
📊 État de la connexion :
• Statut : ${isOnline?'🟢 En ligne':'🔴 Hors ligne'}
• Dernière sync : ${lastSyncTimestamp?new Date(lastSyncTimestamp).toLocaleString('fr-FR'):'Jamais'}
• Données pendantes : ${offlineDataPending?'⚠️ Oui':'✅ Non'}

📱 Capacités actuelles :
• Édition : ✅ Disponible
• Sauvegarde locale : ✅ Active
• Sync Firebase : ${isOnline?'✅ Disponible':'⏳ Indisponible'}
• Partage temps réel : ${isOnline?'✅ Actif':'⏳ Désactivé'}
  `;
  alert(details);
}

// ===== VÉRIFICATION DE CONNEXION =====
async function checkFirebaseConnection(){
  if(!userAuthenticationCompleted || !currentUser) return false;
  try{
    if(!db){ console.warn("⚠️ DB non initialisée"); return false; }
    const connected = await new Promise(resolve=>{
      const timeout = setTimeout(()=>resolve(false), 3000);
      db.ref('.info/connected').once('value', snap=>{
        clearTimeout(timeout); resolve(snap.val()===true);
      }, ()=>{ clearTimeout(timeout); resolve(false); });
    });
    if(connected!==isOnline){
      const wasOnline=isOnline; isOnline=connected; firebaseConnected=connected;
      updateConnectionIndicator(isOnline);
      if(!wasOnline && isOnline){
        showNotification("🟢 Connexion rétablie ! Synchronisation...","success");
        await forceSyncToFirebase();
      }else if(wasOnline && !isOnline){
        showNotification("🔴 Connexion perdue. Mode hors ligne activé.","warning");
      }
    }
    return connected;
  }catch(e){ console.error("⏹ Erreur check connexion:", e); isOnline=false; firebaseConnected=false; updateConnectionIndicator(false); return false; }
}

// ===== SAUVEGARDE D'URGENCE UNIFIÉE =====
function emergencyLocalSave() {
  if (!userAuthenticationCompleted || !currentUser) return false;

  try {
    console.log("💾 Sauvegarde d'urgence en cours...");

    // Vérifier que les éléments essentiels existent
    const missing = verifyRequiredElements();
    if (missing) {
      console.warn("⚠️ Éléments manquants pour sauvegarde:", missing);
      return false;
    }

    // Métadonnées DP avec sélecteurs unifiés
    const dpMetadata = {
      dpNom: document.querySelector(SELECTORS.dp.nom)?.value || "",
      dpNiveau: document.querySelector(SELECTORS.dp.niveau)?.value || "",
      dpDate: document.querySelector(SELECTORS.dp.date)?.value || "",
      dpLieu: document.querySelector(SELECTORS.dp.lieu)?.value || "",
      dpPlongee: document.querySelector(SELECTORS.dp.plongee)?.value || "matin"
    };

    // Sélection DP si disponible
    const dpSelect = document.querySelector(SELECTORS.dp.select);
    const dpSelection = dpSelect && dpSelect.value ? {
      id: dpSelect.value,
      text: dpSelect.options[dpSelect.selectedIndex]?.text || ""
    } : null;

    // Palanquées avec leurs détails complets
    const palanqueesData = [];
    const palanqueeElements = document.querySelectorAll(SELECTORS.palanquee.container);

    palanqueeElements.forEach((element, index) => {
      const palanquee = {
        id: element.dataset?.index || index.toString(),
        // Détails de la palanquée
        horaire: element.querySelector(SELECTORS.palanquee.horaire)?.value || '',
        profondeurPrevue: element.querySelector(SELECTORS.palanquee.profPrevue)?.value || '',
        dureePrevue: element.querySelector(SELECTORS.palanquee.dureePrevue)?.value || '',
        profondeurRealisee: element.querySelector(SELECTORS.palanquee.profRealisee)?.value || '',
        dureeRealisee: element.querySelector(SELECTORS.palanquee.dureeRealisee)?.value || '',
        paliers: element.querySelector(SELECTORS.palanquee.paliers)?.value || '',
        // Plongeurs de cette palanquée
        plongeurs: []
      };

      // Collecter les plongeurs
      const plongeurElements = element.querySelectorAll(SELECTORS.plongeur.container);
      plongeurElements.forEach(plongeurEl => {
        const plongeur = {};
        const inputs = plongeurEl.querySelectorAll(SELECTORS.plongeur.inputs);
        inputs.forEach(input => {
          if (input.name && input.value) {
            plongeur[input.name] = input.value;
          }
        });
        if (Object.keys(plongeur).length > 0) {
          palanquee.plongeurs.push(plongeur);
        }
      });

      palanqueesData.push(palanquee);
    });

    // Structure unifiée de sauvegarde d'urgence
    const emergencyData = {
      timestamp: Date.now(),
      version: "2.5.1-fixed",
      userEmail: currentUser.email,
      metadata: dpMetadata,
      dpSelection: dpSelection,
      palanquees: palanqueesData,
      globalData: {
        // Sauvegarder aussi les variables globales si elles existent
        plongeurs: typeof plongeurs !== 'undefined' ? plongeurs : [],
        palanquees: typeof palanquees !== 'undefined' ? palanquees : []
      },
      stats: {
        totalPalanquees: palanqueesData.length,
        totalPlongeurs: palanqueesData.reduce((sum, p) => sum + p.plongeurs.length, 0)
      }
    };

    // Double sauvegarde pour sécurité
    sessionStorage.setItem('jsas_emergency_backup', JSON.stringify(emergencyData));
    localStorage.setItem('jsas_last_backup', JSON.stringify(emergencyData));

    offlineDataPending = true;
    updateConnectionIndicator(false);
    
    console.log(`✅ Sauvegarde d'urgence: ${emergencyData.stats.totalPalanquees} palanquées, ${emergencyData.stats.totalPlongeurs} plongeurs`);
    return true;
    
  } catch (error) {
    console.error("⏹ Erreur sauvegarde d'urgence:", error);
    return false;
  }
}

// ===== RESTAURATION D'URGENCE AVEC RETRY INTELLIGENT =====
async function waitAndRestoreEmergency(maxRetries = 25) {
  if (!userAuthenticationCompleted || !currentUser) return false;

  console.log("🔄 Démarrage de la restauration d'urgence...");

  // Chercher une sauvegarde
  const backupRaw = localStorage.getItem('jsas_last_backup') || 
                    sessionStorage.getItem('jsas_emergency_backup');
  
  if (!backupRaw) {
    console.log("ℹ️ Aucune sauvegarde d'urgence trouvée");
    return false;
  }

  let retryCount = 0;

  async function attemptRestore() {
    try {
      retryCount++;
      console.log(`🔄 Tentative de restauration ${retryCount}/${maxRetries}`);

      // Vérifier que les éléments DOM sont prêts
      const missing = verifyRequiredElements();
      if (missing) {
        throw new Error(`Éléments DOM manquants: ${missing.join(', ')}`);
      }

      const backupData = JSON.parse(backupRaw);
      console.log(`📦 Sauvegarde trouvée: ${new Date(backupData.timestamp).toLocaleString()}`);

      // Vérifier que ce n'est pas trop ancien (24h max)
      const age = Date.now() - backupData.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        console.log("🗑️ Sauvegarde trop ancienne, nettoyage");
        localStorage.removeItem('jsas_last_backup');
        sessionStorage.removeItem('jsas_emergency_backup');
        return false;
      }

      // Vérifier si les champs sont vides (éviter d'écraser des données)
      const currentNom = document.querySelector(SELECTORS.dp.nom)?.value?.trim();
      if (currentNom && currentNom.length > 2) {
        console.log("⚠️ Données déjà présentes, restauration annulée");
        return false;
      }

      // 1. RESTAURER LES MÉTADONNÉES DP
      console.log("📝 Restauration métadonnées DP...");
      if (backupData.metadata) {
        const dpElements = {
          nom: document.querySelector(SELECTORS.dp.nom),
          niveau: document.querySelector(SELECTORS.dp.niveau),
          date: document.querySelector(SELECTORS.dp.date),
          lieu: document.querySelector(SELECTORS.dp.lieu),
          plongee: document.querySelector(SELECTORS.dp.plongee)
        };

        Object.entries(dpElements).forEach(([key, element]) => {
          const value = backupData.metadata[`dp${key.charAt(0).toUpperCase()}${key.slice(1)}`];
          if (element && value) {
            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`  ✅ DP ${key}: "${value}"`);
          }
        });
      }

      // 2. RESTAURER LA SÉLECTION DP
      if (backupData.dpSelection && backupData.dpSelection.id) {
        await waitForElement(SELECTORS.dp.select, 5000);
        const dpSelect = document.querySelector(SELECTORS.dp.select);
        if (dpSelect && dpSelect.options.length > 1) {
          dpSelect.value = backupData.dpSelection.id;
          dpSelect.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`  ✅ Sélection DP: "${backupData.dpSelection.text}"`);
        }
      }

      // 3. ATTENDRE ET RESTAURER LES PALANQUÉES
      console.log("📋 Attente des palanquées...");
      await waitForElement(SELECTORS.palanquee.container, 8000);
      
      const palanqueeElements = document.querySelectorAll(SELECTORS.palanquee.container);
      if (palanqueeElements.length === 0) {
        throw new Error("Aucune palanquée trouvée dans le DOM");
      }

      console.log(`📋 Restauration de ${backupData.palanquees.length} palanquées...`);

      // Restaurer chaque palanquée
      backupData.palanquees.forEach((palanqueeData, index) => {
        const element = document.querySelector(`[data-index="${palanqueeData.id}"]`) || 
                       palanqueeElements[index];

        if (!element) {
          console.warn(`⚠️ Palanquée ${index} non trouvée`);
          return;
        }

        // Restaurer les détails de la palanquée
        const fieldMappings = [
          { selector: SELECTORS.palanquee.horaire, value: palanqueeData.horaire, name: 'horaire' },
          { selector: SELECTORS.palanquee.profPrevue, value: palanqueeData.profondeurPrevue, name: 'prof prévue' },
          { selector: SELECTORS.palanquee.dureePrevue, value: palanqueeData.dureePrevue, name: 'durée prévue' },
          { selector: SELECTORS.palanquee.profRealisee, value: palanqueeData.profondeurRealisee, name: 'prof réalisée' },
          { selector: SELECTORS.palanquee.dureeRealisee, value: palanqueeData.dureeRealisee, name: 'durée réalisée' },
          { selector: SELECTORS.palanquee.paliers, value: palanqueeData.paliers, name: 'paliers' }
        ];

        fieldMappings.forEach(({ selector, value, name }) => {
          const fieldElement = element.querySelector(selector);
          if (fieldElement && value) {
            fieldElement.value = value;
            fieldElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`    ✅ ${name}: "${value}"`);
          }
        });

        // Restaurer les plongeurs de cette palanquée
        if (palanqueeData.plongeurs && palanqueeData.plongeurs.length > 0) {
          palanqueeData.plongeurs.forEach((plongeurData, pIndex) => {
            const plongeurElements = element.querySelectorAll(SELECTORS.plongeur.container);
            const plongeurEl = plongeurElements[pIndex];

            if (plongeurEl) {
              Object.entries(plongeurData).forEach(([fieldName, value]) => {
                const input = plongeurEl.querySelector(`[name="${fieldName}"]`);
                if (input && value) {
                  input.value = value;
                  input.dispatchEvent(new Event('change', { bubbles: true }));
                }
              });
              console.log(`      ✅ Plongeur ${pIndex} restauré`);
            }
          });
        }
      });

      // 4. RESTAURER LES VARIABLES GLOBALES SI DISPONIBLES
      if (backupData.globalData) {
        if (typeof plongeurs !== 'undefined' && backupData.globalData.plongeurs) {
          plongeurs.splice(0, plongeurs.length, ...backupData.globalData.plongeurs);
        }
        if (typeof palanquees !== 'undefined' && backupData.globalData.palanquees) {
          palanquees.splice(0, palanquees.length, ...backupData.globalData.palanquees);
        }
      }

      // 5. FINALISATION
      console.log("🎉 Restauration d'urgence terminée avec succès !");

      // Notification utilisateur
      if (typeof showNotification === 'function') {
        showNotification("✅ Données restaurées automatiquement", "success");
      }

      // Nettoyer la sauvegarde après succès
      localStorage.removeItem('jsas_last_backup');
      sessionStorage.removeItem('jsas_emergency_backup');

      // Synchronisation différée si disponible
      if (typeof syncToDatabase === 'function') {
        setTimeout(syncToDatabase, 2000);
      }

      return true;

    } catch (error) {
      console.warn(`⚠️ Tentative ${retryCount} échouée:`, error.message);

      if (retryCount >= maxRetries) {
        console.error(`❌ Restauration échouée après ${maxRetries} tentatives`);
        return false;
      }

      // Délai progressif avant nouvelle tentative
      const delay = Math.min(200 * retryCount, 3000);
      console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);

      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await attemptRestore();
          resolve(result);
        }, delay);
      });
    }
  }

  return await attemptRestore();
}

// ===== FONCTION UTILITAIRE DE RESTAURATION MÉTADONNÉES =====
function restoreEmergencyMetadata(metadata) {
  if (!metadata) return false;

  try {
    const elements = {
      nom: document.querySelector(SELECTORS.dp.nom),
      niveau: document.querySelector(SELECTORS.dp.niveau),
      date: document.querySelector(SELECTORS.dp.date),
      lieu: document.querySelector(SELECTORS.dp.lieu),
      plongee: document.querySelector(SELECTORS.dp.plongee)
    };

    let restored = 0;
    Object.entries(elements).forEach(([key, element]) => {
      const value = metadata[`dp${key.charAt(0).toUpperCase()}${key.slice(1)}`];
      if (element && value) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        restored++;
      }
    });

    console.log(`✅ ${restored} métadonnées DP restaurées`);
    return restored > 0;

  } catch (error) {
    console.error("❌ Erreur restauration métadonnées:", error);
    return false;
  }
}

// ===== SYNCHRONISATION FORCÉE =====
async function forceSyncToFirebase(){
  if(!userAuthenticationCompleted || !currentUser){ showNotification("⚠️ Synchronisation impossible","warning"); return false; }
  const syncBtn=document.getElementById('manual-sync-btn');
  const statusIcon=document.getElementById('status-icon');
  try{
    if(statusIcon) statusIcon.textContent='🔄';
    if(syncBtn){ syncBtn.textContent='⏳'; syncBtn.disabled=true; }
    showNotification("🔄 Synchronisation en cours...","info");
    const connected=await checkFirebaseConnection();
    if(!connected) throw new Error("Connexion Firebase indisponible");
    if(typeof syncToDatabase==='function'){ await syncToDatabase(); }
    else{ await Promise.all([db.ref('plongeurs').set(plongeurs||[]), db.ref('palanquees').set(palanquees||[])]); if(typeof saveSessionData==='function') await saveSessionData(); }
    lastSyncTimestamp=Date.now(); offlineDataPending=false;
    sessionStorage.removeItem('jsas_emergency_backup');
    showNotification("✅ Synchronisation réussie !","success");
    updateConnectionIndicator(true);
    return true;
  }catch(e){ console.error("⏹ Erreur sync:",e); showNotification(`⏹ Échec sync : ${e.message}`,"error"); updateConnectionIndicator(false); return false; }
  finally{ if(statusIcon) statusIcon.textContent=isOnline?'🟢':'🔴'; if(syncBtn){ syncBtn.textContent='🔄'; syncBtn.disabled=false; } }
}

// ===== FONCTIONS UTILITAIRES DE SAUVEGARDE =====
function loadEmergencyBackup() {
  // Cette fonction est maintenant intégrée dans waitAndRestoreEmergency
  console.log("ℹ️ loadEmergencyBackup() => utilisez waitAndRestoreEmergency()");
  return waitAndRestoreEmergency();
}

// ===== INITIALISATION =====
function initializeOfflineManager(){
  if(!userAuthenticationCompleted || !currentUser){ 
    console.log("ℹ️ Gestionnaire offline en attente d'authentification"); 
    return; 
  }

  console.log("🚀 Initialisation du gestionnaire offline...");

  // Créer l'indicateur de connexion
  createConnectionIndicator();
  
  // Vérifier la connexion initiale
  checkFirebaseConnection();
  
  // Intervalle de vérification de connexion
  if(connectionCheckInterval) clearInterval(connectionCheckInterval);
  connectionCheckInterval = setInterval(checkFirebaseConnection, 10000);
  
  // Intervalle de sauvegarde d'urgence
  if(emergencySaveInterval) clearInterval(emergencySaveInterval);
  emergencySaveInterval = setInterval(emergencyLocalSave, 30000);
  
  // Tentative de restauration après un délai (permettre au DOM de se charger)
  setTimeout(async () => {
    if(userAuthenticationCompleted && currentUser) {
      console.log("🔄 Lancement restauration d'urgence...");
      await waitAndRestoreEmergency();
    }
  }, 3000);
  
  // Sauvegarde avant fermeture de page
  window.addEventListener('beforeunload', () => {
    if(emergencySaveInterval) clearInterval(emergencySaveInterval);
    if(connectionCheckInterval) clearInterval(connectionCheckInterval);
    if(userAuthenticationCompleted && currentUser) {
      console.log("💾 Sauvegarde avant fermeture...");
      emergencyLocalSave();
    }
  });

  console.log("✅ Gestionnaire offline initialisé");
}

// ===== AUTHENTIFICATION UTILISATEUR =====
function setUserAuthenticated(authenticated=true){
  const wasAuthenticated = userAuthenticationCompleted;
  userAuthenticationCompleted = authenticated;
  
  console.log(`🔐 Authentification: ${authenticated ? 'activée' : 'désactivée'}`);
  
  if(authenticated && currentUser){ 
    // Démarrer le gestionnaire
    initializeOfflineManager(); 
    
    // Si c'était la première authentification, tenter restauration
    if (!wasAuthenticated) {
      setTimeout(async () => {
        console.log("🔄 Première authentification - tentative de restauration...");
        await waitAndRestoreEmergency();
      }, 2000);
    }
  }
  else{ 
    cleanupOfflineManager(); 
  }
}

// ===== NETTOYAGE =====
function cleanupOfflineManager(){
  console.log("🧹 Nettoyage du gestionnaire offline...");
  
  if(emergencySaveInterval) { 
    clearInterval(emergencySaveInterval); 
    emergencySaveInterval=null; 
  }
  if(connectionCheckInterval) { 
    clearInterval(connectionCheckInterval); 
    connectionCheckInterval=null; 
  }
  
  const indicator=document.getElementById('connection-indicator'); 
  if(indicator) indicator.remove();
  
  isOnline=false; 
  lastSyncTimestamp=null; 
  offlineDataPending=false;
  
  console.log("✅ Nettoyage terminé");
}

// ===== STATISTIQUES ET DEBUGGING =====
function getOfflineStats() {
  const sessionBackup = sessionStorage.getItem('jsas_emergency_backup');
  const localBackup = localStorage.getItem('jsas_last_backup');
  
  const stats = {
    hasSessionBackup: !!sessionBackup,
    hasLocalBackup: !!localBackup,
    sessionBackupAge: null,
    localBackupAge: null,
    isOnline,
    lastSync: lastSyncTimestamp,
    pendingData: offlineDataPending,
    userAuthenticated: userAuthenticationCompleted
  };
  
  try {
    if (sessionBackup) {
      const data = JSON.parse(sessionBackup);
      stats.sessionBackupAge = Date.now() - data.timestamp;
      stats.sessionStats = data.stats;
    }
    
    if (localBackup) {
      const data = JSON.parse(localBackup);
      stats.localBackupAge = Date.now() - data.timestamp;
      stats.localStats = data.stats;
    }
  } catch (error) {
    console.error("❌ Erreur calcul stats:", error);
  }
  
  return stats;
}

function clearOfflineData() {
  sessionStorage.removeItem('jsas_emergency_backup');
  localStorage.removeItem('jsas_last_backup');
  
  // Nettoyer aussi d'anciennes sauvegardes
  localStorage.removeItem('emergency_palanquee_details');
  
  offlineDataPending = false;
  updateConnectionIndicator(isOnline);
  
  if (typeof showNotification === 'function') {
    showNotification("🗑️ Données offline effacées","info");
  }
  
  console.log("🗑️ Toutes les données offline supprimées");
}

function showOfflineStats() {
  const stats = getOfflineStats();
  const formatAge = (age) => age ? `${Math.round(age / 1000)}s` : 'N/A';
  
  const message = `
📊 Statistiques du gestionnaire offline :

🔧 État : ${userAuthenticationCompleted ? '✅ Actif' : '❌ Inactif'}
🌐 Connexion : ${isOnline ? '✅ En ligne' : '❌ Hors ligne'}
🔄 Dernière sync : ${lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Jamais'}
⏳ Données pendantes : ${offlineDataPending ? '⚠️ Oui' : '✅ Non'}

💾 Sauvegarde session : ${stats.hasSessionBackup ? '✅ Disponible' : '❌ Aucune'}
   Âge : ${formatAge(stats.sessionBackupAge)}
   ${stats.sessionStats ? `Palanquées : ${stats.sessionStats.totalPalanquees}, Plongeurs : ${stats.sessionStats.totalPlongeurs}` : ''}

🗄️ Sauvegarde locale : ${stats.hasLocalBackup ? '✅ Disponible' : '❌ Aucune'}
   Âge : ${formatAge(stats.localBackupAge)}
   ${stats.localStats ? `Palanquées : ${stats.localStats.totalPalanquees}, Plongeurs : ${stats.localStats.totalPlongeurs}` : ''}
  `;
  
  alert(message);
  console.log("📊 Stats offline:", stats);
}

// ===== EXPORTS GLOBAUX =====
window.forceSyncToFirebase = forceSyncToFirebase;
window.emergencyLocalSave = emergencyLocalSave;
window.loadEmergencyBackup = loadEmergencyBackup;
window.waitAndRestoreEmergency = waitAndRestoreEmergency;
window.restoreEmergencyMetadata = restoreEmergencyMetadata;
window.clearOfflineData = clearOfflineData;
window.getOfflineStats = getOfflineStats;
window.showOfflineStats = showOfflineStats;
window.setUserAuthenticated = setUserAuthenticated;
window.initializeOfflineManager = initializeOfflineManager;
window.cleanupOfflineManager = cleanupOfflineManager;

// Export des utilitaires pour compatibilité
window.waitForElement = waitForElement;
window.verifyRequiredElements = verifyRequiredElements;

console.log("🎯 Gestionnaire offline chargé - Version 2.5.1 corrigée - Tous problèmes de restauration résolus");