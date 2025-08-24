// offline-manager.js - Gestionnaire de connectivité et sauvegarde d'urgence (VERSION CORRIGÉE COMPLÈTE)

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

// ===== FONCTION LOADEMERGENCYBACKUP (DÉFINIE EN PREMIER) =====
function loadEmergencyBackup() {
  console.log("ℹ️ loadEmergencyBackup() => redirection vers waitAndRestoreEmergency()");
  
  // Si waitAndRestoreEmergency existe, l'utiliser
  if (typeof waitAndRestoreEmergency === 'function') {
    return waitAndRestoreEmergency();
  }
  
  // Sinon, restauration basique
  try {
    const backupRaw = localStorage.getItem('jsas_last_backup') || 
                      sessionStorage.getItem('jsas_emergency_backup');
    
    if (!backupRaw) {
      console.log("ℹ️ Aucune sauvegarde d'urgence trouvée");
      return false;
    }
    
    const backupData = JSON.parse(backupRaw);
    console.log("📦 Sauvegarde trouvée:", new Date(backupData.timestamp).toLocaleString());
    
    // Vérifier l'âge de la sauvegarde
    const age = Date.now() - backupData.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      console.log("🗑️ Sauvegarde trop ancienne, nettoyage");
      localStorage.removeItem('jsas_last_backup');
      sessionStorage.removeItem('jsas_emergency_backup');
      return false;
    }
    
    // Restauration basique des métadonnées DP
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
      
      console.log("✅ Métadonnées DP restaurées (mode basique)");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur restauration basique:", error);
    return false;
  }
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
        if (typeof showNotification === 'function') {
          showNotification("🟢 Connexion rétablie ! Synchronisation...","success");
        }
        await forceSyncToFirebase();
      }else if(wasOnline && !isOnline){
        if (typeof showNotification === 'function') {
          showNotification("🔴 Connexion perdue. Mode hors ligne activé.","warning");
        }
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
      version: "2.5.2-fixed",
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
  if(!userAuthenticationCompleted || !currentUser){ 
    if (typeof showNotification === 'function') {
      showNotification("⚠️ Synchronisation impossible","warning"); 
    }
    return false; 
  }
  const syncBtn=document.getElementById('manual-sync-btn');
  const statusIcon=document.getElementById('status-icon');
  try{
    if(statusIcon) statusIcon.textContent='🔄';
    if(syncBtn){ syncBtn.textContent='⏳'; syncBtn.disabled=true; }
    if (typeof showNotification === 'function') {
      showNotification("🔄 Synchronisation en cours...","info");
    }
    const connected=await checkFirebaseConnection();
    if(!connected) throw new Error("Connexion Firebase indisponible");
    if(typeof syncToDatabase==='function'){ await syncToDatabase(); }
    else{ 
      await Promise.all([
        db.ref('plongeurs').set(plongeurs||[]), 
        db.ref('palanquees').set(palanquees||[])
      ]); 
      if(typeof saveSessionData==='function') await saveSessionData(); 
    }
    lastSyncTimestamp=Date.now(); offlineDataPending=false;
    sessionStorage.removeItem('jsas_emergency_backup');
    if (typeof showNotification === 'function') {
      showNotification("✅ Synchronisation réussie !","success");
    }
    updateConnectionIndicator(true);
    return true;
  }catch(e){ 
    console.error("⏹ Erreur sync:",e); 
    if (typeof showNotification === 'function') {
      showNotification(`⏹ Échec sync : ${e.message}`,"error");
    }
    updateConnectionIndicator(false); 
    return false; 
  }
  finally{ 
    if(statusIcon) statusIcon.textContent=isOnline?'🟢':'🔴'; 
    if(syncBtn){ syncBtn.textContent='🔄'; syncBtn.disabled=false; } 
  }
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
////
// ===== PERSISTANCE F5 FORCE BRUTE - TOUS LES CHAMPS =====
// Sauvegarde TOUS les champs de saisie sans exception
// À ajouter à la fin de offline-manager.js

let bruteForceActive = true;
let bruteForceTimeout = null;
const BRUTE_FORCE_KEY = 'jsas_brute_force_f5';

// ===== DIAGNOSTIC COMPLET DE TOUS LES CHAMPS =====
function scanAllInputFields() {
  console.log('🔍 === SCAN COMPLET DE TOUS LES CHAMPS ===');
  
  const allFields = [];
  
  // 1. TOUS les inputs
  const inputs = document.querySelectorAll('input');
  console.log(`📝 ${inputs.length} inputs trouvés:`);
  
  inputs.forEach((input, index) => {
    const fieldInfo = {
      type: 'input',
      index: index,
      element: input,
      tag: input.tagName,
      id: input.id || '',
      name: input.name || '',
      type_attr: input.type || '',
      value: input.value || '',
      placeholder: input.placeholder || '',
      className: input.className || '',
      // Créer un sélecteur unique
      selector: input.id ? `#${input.id}` : 
                input.name ? `input[name="${input.name}"]` : 
                `input:nth-of-type(${index + 1})`
    };
    
    allFields.push(fieldInfo);
    
    // Log détaillé seulement pour les champs avec contenu ou identifiants
    if (fieldInfo.value || fieldInfo.id || fieldInfo.name || 
        fieldInfo.placeholder.includes('nom') || fieldInfo.placeholder.includes('DP') ||
        fieldInfo.placeholder.includes('date') || fieldInfo.type_attr === 'date') {
      console.log(`  [${index}] 🎯`, fieldInfo);
    }
  });
  
  // 2. TOUS les selects
  const selects = document.querySelectorAll('select');
  console.log(`📋 ${selects.length} selects trouvés:`);
  
  selects.forEach((select, index) => {
    const fieldInfo = {
      type: 'select',
      index: index,
      element: select,
      tag: select.tagName,
      id: select.id || '',
      name: select.name || '',
      value: select.value || '',
      selectedText: select.selectedIndex >= 0 ? select.options[select.selectedIndex]?.text : '',
      optionsCount: select.options.length,
      className: select.className || '',
      selector: select.id ? `#${select.id}` : 
                select.name ? `select[name="${select.name}"]` : 
                `select:nth-of-type(${index + 1})`
    };
    
    allFields.push(fieldInfo);
    
    if (fieldInfo.value || fieldInfo.id || fieldInfo.name) {
      console.log(`  [${index}] 📋`, fieldInfo);
    }
  });
  
  // 3. TOUS les textareas
  const textareas = document.querySelectorAll('textarea');
  console.log(`📄 ${textareas.length} textareas trouvés:`);
  
  textareas.forEach((textarea, index) => {
    const fieldInfo = {
      type: 'textarea',
      index: index,
      element: textarea,
      tag: textarea.tagName,
      id: textarea.id || '',
      name: textarea.name || '',
      value: textarea.value || '',
      placeholder: textarea.placeholder || '',
      className: textarea.className || '',
      selector: textarea.id ? `#${textarea.id}` : 
                textarea.name ? `textarea[name="${textarea.name}"]` : 
                `textarea:nth-of-type(${index + 1})`
    };
    
    allFields.push(fieldInfo);
    
    if (fieldInfo.value || fieldInfo.id || fieldInfo.name) {
      console.log(`  [${index}] 📄`, fieldInfo);
    }
  });
  
  console.log(`\n🎯 RÉSUMÉ: ${allFields.length} champs au total`);
  console.log('=== FIN SCAN ===\n');
  
  return allFields;
}

// ===== SAUVEGARDE FORCE BRUTE =====
function saveBruteForceF5() {
  if (!bruteForceActive) return false;
  
  try {
    console.log('💾 Sauvegarde force brute de TOUS les champs...');
    
    const allFields = scanAllInputFields();
    const savedData = {
      timestamp: Date.now(),
      version: 'brute-force-v1.0',
      fields: []
    };
    
    let savedCount = 0;
    
    allFields.forEach(fieldInfo => {
      // Sauvegarder seulement les champs avec du contenu
      if (fieldInfo.value && fieldInfo.value.trim()) {
        const savedField = {
          selector: fieldInfo.selector,
          id: fieldInfo.id,
          name: fieldInfo.name,
          value: fieldInfo.value,
          type: fieldInfo.type,
          type_attr: fieldInfo.type_attr || '',
          selectedText: fieldInfo.selectedText || ''
        };
        
        savedData.fields.push(savedField);
        savedCount++;
        
        console.log(`  💾 [${savedCount}] ${fieldInfo.type} sauvegardé:`, {
          selector: savedField.selector,
          value: savedField.value.substring(0, 30) + (savedField.value.length > 30 ? '...' : '')
        });
      }
    });
    
    if (savedCount > 0) {
      sessionStorage.setItem(BRUTE_FORCE_KEY, JSON.stringify(savedData));
      console.log(`✅ ${savedCount} champs sauvegardés en force brute`);
      
      // Notification discrète
      if (typeof showNotification === 'function') {
        showNotification(`💾 ${savedCount} champs auto-sauvegardés`, "info");
      }
      
      return true;
    } else {
      console.log('ℹ️ Aucun champ avec contenu à sauvegarder');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde force brute:', error);
    return false;
  }
}

// ===== RESTAURATION FORCE BRUTE =====
async function restoreBruteForceF5() {
  try {
    console.log('📥 Restauration force brute...');
    
    const storedData = sessionStorage.getItem(BRUTE_FORCE_KEY);
    if (!storedData) {
      console.log('ℹ️ Aucune sauvegarde force brute trouvée');
      return false;
    }
    
    const data = JSON.parse(storedData);
    console.log(`📦 Sauvegarde force brute trouvée: ${data.fields.length} champs`);
    
    // Vérifier l'âge (max 2 heures)
    const age = Date.now() - data.timestamp;
    if (age > 2 * 60 * 60 * 1000) {
      console.log('🗑️ Sauvegarde force brute trop ancienne');
      sessionStorage.removeItem(BRUTE_FORCE_KEY);
      return false;
    }
    
    // Attendre un peu que la page soit prête
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let restoredCount = 0;
    const restoredFields = [];
    
    // Tentative de restauration pour chaque champ sauvegardé
    for (const fieldData of data.fields) {
      try {
        let element = null;
        
        // Essayer différentes méthodes pour trouver l'élément
        const searchMethods = [
          () => document.querySelector(fieldData.selector),
          () => fieldData.id ? document.getElementById(fieldData.id) : null,
          () => fieldData.name ? document.querySelector(`[name="${fieldData.name}"]`) : null,
          () => fieldData.name ? document.querySelector(`input[name="${fieldData.name}"]`) : null,
          () => fieldData.name ? document.querySelector(`select[name="${fieldData.name}"]`) : null,
          () => fieldData.name ? document.querySelector(`textarea[name="${fieldData.name}"]`) : null
        ];
        
        for (const method of searchMethods) {
          element = method();
          if (element) break;
        }
        
        if (element) {
          // Vérifier si le champ est vide ou contient une valeur par défaut
          const isEmpty = !element.value || 
                         element.value.trim() === '' ||
                         element.value === 'Nom du DP' ||
                         element.value === 'Sélectionnez...' ||
                         element.value === '--';
          
          if (isEmpty) {
            // Restaurer la valeur
            element.value = fieldData.value;
            
            // Déclencher les événements
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            
            restoredCount++;
            restoredFields.push({
              selector: fieldData.selector,
              value: fieldData.value.substring(0, 20) + (fieldData.value.length > 20 ? '...' : '')
            });
            
            console.log(`  ✅ [${restoredCount}] Restauré ${fieldData.selector}: "${fieldData.value}"`);
            
            // Petit délai entre les restaurations
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.log(`  ⚠️ Champ déjà rempli ${fieldData.selector}: "${element.value}"`);
          }
        } else {
          console.log(`  ❌ Élément non trouvé: ${fieldData.selector}`);
        }
        
      } catch (fieldError) {
        console.error(`❌ Erreur restauration champ ${fieldData.selector}:`, fieldError);
      }
    }
    
    if (restoredCount > 0) {
      console.log(`🎉 ${restoredCount} champs restaurés avec succès !`);
      
      // Notification utilisateur
      if (typeof showNotification === 'function') {
        showNotification(`📥 ${restoredCount} champs restaurés automatiquement`, "success");
      }
      
      // Nettoyer la sauvegarde après succès
      sessionStorage.removeItem(BRUTE_FORCE_KEY);
      
      // Log détaillé des champs restaurés
      console.log('📋 Champs restaurés:', restoredFields);
      
      return true;
    } else {
      console.log('ℹ️ Aucun champ restauré (probablement déjà remplis)');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur restauration force brute:', error);
    return false;
  }
}

// ===== SURVEILLANCE FORCE BRUTE =====
function setupBruteForceListeners() {
  console.log('🎛️ Configuration surveillance force brute...');
  
  // Surveiller TOUS les changements dans TOUS les inputs, selects, textareas
  const saveWithDelay = (event) => {
    if (bruteForceTimeout) {
      clearTimeout(bruteForceTimeout);
    }
    
    bruteForceTimeout = setTimeout(() => {
      saveBruteForceF5();
    }, 1000); // 1 seconde après le dernier changement
  };
  
  // Event delegation pour capturer tous les changements
  document.addEventListener('input', saveWithDelay, true);
  document.addEventListener('change', saveWithDelay, true);
  
  // Aussi surveiller les nouveaux éléments ajoutés dynamiquement
  const observer = new MutationObserver(() => {
    // Redéclencher la surveillance si de nouveaux éléments sont ajoutés
    clearTimeout(bruteForceTimeout);
    bruteForceTimeout = setTimeout(() => {
      saveBruteForceF5();
    }, 1500);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Surveillance force brute active sur TOUS les champs');
}

// ===== FONCTIONS UTILITAIRES =====
function getBruteForceStats() {
  try {
    const storedData = sessionStorage.getItem(BRUTE_FORCE_KEY);
    if (!storedData) {
      return { hasSave: false };
    }
    
    const data = JSON.parse(storedData);
    const age = Date.now() - data.timestamp;
    
    return {
      hasSave: true,
      fieldsCount: data.fields.length,
      age: Math.round(age / 1000),
      ageFormatted: age < 60000 ? `${Math.round(age/1000)}s` : `${Math.round(age/60000)}min`,
      version: data.version,
      timestamp: new Date(data.timestamp).toLocaleString('fr-FR'),
      fields: data.fields.map(f => ({
        selector: f.selector,
        value: f.value.substring(0, 20) + (f.value.length > 20 ? '...' : '')
      }))
    };
    
  } catch (error) {
    return { hasSave: false, error: error.message };
  }
}

function showBruteForceStats() {
  const stats = getBruteForceStats();
  
  let message = `📊 Statistiques Force Brute F5 :\n\n`;
  
  if (stats.hasSave) {
    message += `💾 Sauvegarde : ✅ ${stats.fieldsCount} champs\n`;
    message += `⏰ Âge : ${stats.ageFormatted}\n`;
    message += `📅 Créée le : ${stats.timestamp}\n\n`;
    message += `📋 Champs sauvegardés :\n`;
    
    stats.fields.forEach((field, index) => {
      message += `  ${index + 1}. ${field.selector}: "${field.value}"\n`;
    });
  } else {
    message += `💾 Sauvegarde : ❌ Aucune\n\n`;
    message += `ℹ️ Remplissez des champs et ils seront\nsauvegardés automatiquement.`;
    
    if (stats.error) {
      message += `\n\n❌ Erreur : ${stats.error}`;
    }
  }
  
  alert(message);
  console.log('📊 Stats force brute:', stats);
}

function clearBruteForceData() {
  sessionStorage.removeItem(BRUTE_FORCE_KEY);
  console.log('🗑️ Données force brute effacées');
  
  if (typeof showNotification === 'function') {
    showNotification("🗑️ Sauvegarde F5 effacée", "info");
  }
}

// ===== TEST COMPLET FORCE BRUTE =====
function testBruteForceComplete() {
  console.log('🧪 === TEST COMPLET FORCE BRUTE ===');
  
  // 1. Scan de tous les champs
  console.log('1. Scan complet...');
  const allFields = scanAllInputFields();
  
  // 2. Test de sauvegarde
  console.log('2. Test sauvegarde...');
  const saved = saveBruteForceF5();
  console.log(`Sauvegarde: ${saved ? 'Réussie' : 'Aucune donnée'}`);
  
  // 3. Voir les stats
  console.log('3. Statistiques...');
  const stats = getBruteForceStats();
  console.log('Stats:', stats);
  
  // 4. Test de restauration
  setTimeout(() => {
    console.log('4. Test restauration dans 3 secondes...');
    restoreBruteForceF5().then(result => {
      console.log(`Restauration: ${result ? 'Réussie' : 'Échec'}`);
      console.log('=== FIN TEST FORCE BRUTE ===');
    });
  }, 3000);
}

// ===== INTÉGRATION =====
// Remplacer complètement les fonctions F5 existantes
window.saveCompleteSessionF5 = saveBruteForceF5;
window.restoreCompleteSessionF5 = restoreBruteForceF5;

// Initialisation force brute
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('🚀 Initialisation force brute F5...');
    setupBruteForceListeners();
    
    // Restauration automatique après chargement
    setTimeout(() => {
      restoreBruteForceF5();
    }, 2000);
    
  }, 1000);
});

// Sauvegarde avant fermeture
window.addEventListener('beforeunload', () => {
  if (bruteForceActive) {
    saveBruteForceF5();
  }
});

// ===== EXPORTS =====
window.scanAllInputFields = scanAllInputFields;
window.saveBruteForceF5 = saveBruteForceF5;
window.restoreBruteForceF5 = restoreBruteForceF5;
window.setupBruteForceListeners = setupBruteForceListeners;
window.getBruteForceStats = getBruteForceStats;
window.showBruteForceStats = showBruteForceStats;
window.clearBruteForceData = clearBruteForceData;
window.testBruteForceComplete = testBruteForceComplete;

console.log("💪 Persistance FORCE BRUTE F5 activée - Surveille et sauvegarde TOUS les champs !");
////
// ===== CORRECTIF ULTRA-SPÉCIALISÉ CHAMPS DATE =====
// Les champs input type="date" ont des comportements spéciaux
// À ajouter à la fin de offline-manager.js

let dateFieldsWatcher = null;
const DATE_PERSISTENCE_KEY = 'jsas_date_fields_f5';

// ===== DIAGNOSTIC APPROFONDI DES CHAMPS DATE =====
function deepScanDateFields() {
  console.log('🗓️ === DIAGNOSTIC APPROFONDI CHAMPS DATE ===');
  
  const dateFields = [];
  
  // 1. Tous les input type="date"
  const dateInputs = document.querySelectorAll('input[type="date"]');
  console.log(`📅 ${dateInputs.length} input[type="date"] trouvés:`);
  
  dateInputs.forEach((input, index) => {
    const info = {
      index: index,
      element: input,
      id: input.id || `date_${index}`,
      name: input.name || `date_${index}`,
      value: input.value || '',
      valueLength: input.value ? input.value.length : 0,
      min: input.min || '',
      max: input.max || '',
      step: input.step || '',
      required: input.required || false,
      disabled: input.disabled || false,
      readonly: input.readOnly || false,
      className: input.className || '',
      // Différents sélecteurs possibles
      selectors: {
        byId: input.id ? `#${input.id}` : null,
        byName: input.name ? `input[name="${input.name}"]` : null,
        byType: `input[type="date"]:nth-of-type(${index + 1})`,
        generic: `input:nth-of-type(${Array.from(document.querySelectorAll('input')).indexOf(input) + 1})`
      }
    };
    
    dateFields.push(info);
    console.log(`  [${index}] 📅`, {
      id: info.id,
      name: info.name,
      value: info.value,
      selectors: Object.values(info.selectors).filter(Boolean)
    });
  });
  
  // 2. Chercher aussi des champs qui pourraient être des dates (par nom/id/classe)
  const potentialDateFields = document.querySelectorAll([
    'input[name*="date"]',
    'input[id*="date"]', 
    'input[class*="date"]',
    'input[name*="Date"]',
    'input[id*="Date"]',
    'input[placeholder*="date"]',
    'input[placeholder*="Date"]'
  ].join(','));
  
  console.log(`🔍 ${potentialDateFields.length} champs potentiellement liés aux dates:`);
  potentialDateFields.forEach((input, index) => {
    if (input.type !== 'date') { // Éviter les doublons
      console.log(`  [${index}] 🤔`, {
        id: input.id,
        name: input.name,
        type: input.type,
        value: input.value,
        placeholder: input.placeholder
      });
    }
  });
  
  console.log(`\n📊 TOTAL: ${dateFields.length} champs date confirmés`);
  console.log('=== FIN DIAGNOSTIC DATE ===\n');
  
  return dateFields;
}

// ===== SAUVEGARDE SPÉCIALISÉE DATE =====
function saveDateFieldsSpecific() {
  try {
    console.log('💾 Sauvegarde spécialisée des champs date...');
    
    const dateFields = deepScanDateFields();
    const savedDates = {
      timestamp: Date.now(),
      version: 'date-specialist-v1.0',
      dates: []
    };
    
    let savedCount = 0;
    
    dateFields.forEach(dateInfo => {
      if (dateInfo.value && dateInfo.value.trim()) {
        const savedDate = {
          // Informations de l'élément
          id: dateInfo.id,
          name: dateInfo.name,
          value: dateInfo.value,
          
          // Tous les sélecteurs possibles
          selectors: dateInfo.selectors,
          
          // Propriétés du champ
          min: dateInfo.min,
          max: dateInfo.max,
          required: dateInfo.required,
          disabled: dateInfo.disabled,
          readonly: dateInfo.readonly,
          
          // Informations de debug
          valueLength: dateInfo.valueLength,
          className: dateInfo.className
        };
        
        savedDates.dates.push(savedDate);
        savedCount++;
        
        console.log(`  💾 Date sauvegardée [${savedCount}]:`, {
          selector: savedDate.selectors.byId || savedDate.selectors.byName,
          value: savedDate.value
        });
      }
    });
    
    if (savedCount > 0) {
      sessionStorage.setItem(DATE_PERSISTENCE_KEY, JSON.stringify(savedDates));
      console.log(`✅ ${savedCount} champs date sauvegardés`);
      
      // Notification spéciale pour les dates
      if (typeof showNotification === 'function') {
        showNotification(`📅 ${savedCount} date(s) sauvegardée(s)`, "info");
      }
      
      return true;
    } else {
      console.log('ℹ️ Aucun champ date avec valeur à sauvegarder');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde dates:', error);
    return false;
  }
}

// ===== RESTAURATION SPÉCIALISÉE DATE AVEC RETRY AGRESSIF =====
async function restoreDateFieldsSpecific(maxRetries = 15) {
  console.log('📥 Restauration spécialisée des champs date...');
  
  const storedData = sessionStorage.getItem(DATE_PERSISTENCE_KEY);
  if (!storedData) {
    console.log('ℹ️ Aucune sauvegarde de dates trouvée');
    return false;
  }
  
  try {
    const savedDates = JSON.parse(storedData);
    console.log(`📦 ${savedDates.dates.length} dates à restaurer`);
    
    // Vérifier l'âge
    const age = Date.now() - savedDates.timestamp;
    if (age > 2 * 60 * 60 * 1000) {
      console.log('🗑️ Dates sauvegardées trop anciennes');
      sessionStorage.removeItem(DATE_PERSISTENCE_KEY);
      return false;
    }
    
    let globalRetry = 0;
    let totalRestored = 0;
    
    while (globalRetry < maxRetries && totalRestored < savedDates.dates.length) {
      globalRetry++;
      console.log(`🔄 Tentative globale ${globalRetry}/${maxRetries}`);
      
      for (const dateData of savedDates.dates) {
        // Ignorer si déjà restauré
        if (dateData.restored) continue;
        
        let element = null;
        let usedSelector = null;
        
        // Essayer tous les sélecteurs possibles
        const selectorsToTry = [
          dateData.selectors.byId,
          dateData.selectors.byName,
          dateData.selectors.byType,
          dateData.selectors.generic,
          // Sélecteurs de secours
          `input[type="date"][name="${dateData.name}"]`,
          `input[type="date"]#${dateData.id}`,
          `input[value="${dateData.value}"]`,
          // Dernier recours: tous les champs date
          `input[type="date"]:empty`
        ].filter(Boolean);
        
        for (const selector of selectorsToTry) {
          try {
            const elements = document.querySelectorAll(selector);
            
            // Essayer chaque élément trouvé
            for (const el of elements) {
              if (el && el.tagName === 'INPUT' && el.type === 'date') {
                // Vérifier si c'est le bon élément (par ID/name si possible)
                const isMatch = (dateData.id && el.id === dateData.id) ||
                              (dateData.name && el.name === dateData.name) ||
                              !el.value.trim(); // Ou si vide
                
                if (isMatch) {
                  element = el;
                  usedSelector = selector;
                  break;
                }
              }
            }
            
            if (element) break;
            
          } catch (selectorError) {
            // Ignorer les erreurs de sélecteur invalide
          }
        }
        
        if (element) {
          // Vérifier que le champ est vide ou a une valeur par défaut
          const isEmpty = !element.value || 
                         element.value.trim() === '' ||
                         element.value === '1900-01-01' ||
                         element.value.length < 8;
          
          if (isEmpty) {
            try {
              // Méthodes multiples de définition de valeur pour les dates
              const originalValue = element.value;
              
              // Méthode 1: Définition directe
              element.value = dateData.value;
              
              // Méthode 2: Via setAttribute si la première échoue
              if (element.value !== dateData.value) {
                element.setAttribute('value', dateData.value);
              }
              
              // Méthode 3: Via propriété valueAsDate si c'est une date valide
              if (element.value !== dateData.value) {
                try {
                  const dateObject = new Date(dateData.value + 'T00:00:00');
                  if (!isNaN(dateObject)) {
                    element.valueAsDate = dateObject;
                  }
                } catch (dateError) {
                  // Ignorer si pas une date valide
                }
              }
              
              // Vérifier que la valeur a été définie
              if (element.value === dateData.value) {
                // Déclencher TOUS les événements possibles pour les dates
                const events = ['input', 'change', 'blur', 'focus', 'keyup', 'click'];
                events.forEach(eventType => {
                  try {
                    element.dispatchEvent(new Event(eventType, { 
                      bubbles: true, 
                      cancelable: true 
                    }));
                  } catch (eventError) {
                    // Ignorer les erreurs d'événement
                  }
                });
                
                // Forcer le focus/blur pour déclencher les validations
                try {
                  element.focus();
                  setTimeout(() => element.blur(), 50);
                } catch (focusError) {
                  // Ignorer
                }
                
                dateData.restored = true;
                totalRestored++;
                
                console.log(`  ✅ Date restaurée via ${usedSelector}: "${dateData.value}"`);
                
                // Petit délai entre les restaurations
                await new Promise(resolve => setTimeout(resolve, 200));
                
              } else {
                console.log(`  ⚠️ Échec définition valeur pour ${usedSelector}: "${originalValue}" -> "${element.value}"`);
              }
              
            } catch (valueError) {
              console.error(`❌ Erreur définition valeur:`, valueError);
            }
          } else {
            console.log(`  ⚠️ Champ date déjà rempli ${usedSelector}: "${element.value}"`);
            dateData.restored = true; // Considérer comme fait
          }
        } else {
          console.log(`  ❌ Champ date non trouvé:`, dateData.selectors);
        }
      }
      
      // Attendre avant le prochain retry global
      if (totalRestored < savedDates.dates.length && globalRetry < maxRetries) {
        const delay = 300 * globalRetry; // Délai progressif
        console.log(`⏳ Attente ${delay}ms avant retry global...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (totalRestored > 0) {
      console.log(`🎉 ${totalRestored} dates restaurées avec succès !`);
      
      // Notification spécifique aux dates
      if (typeof showNotification === 'function') {
        showNotification(`📅 ${totalRestored} date(s) restaurée(s)`, "success");
      }
      
      // Nettoyer après succès
      sessionStorage.removeItem(DATE_PERSISTENCE_KEY);
      
      return true;
    } else {
      console.log('❌ Aucune date n\'a pu être restaurée');
      
      // Diagnostic final
      console.log('🔍 Diagnostic final des champs date:');
      deepScanDateFields();
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur restauration dates:', error);
    return false;
  }
}

// ===== SURVEILLANCE SPÉCIALISÉE DATE =====
function setupDateFieldsWatcher() {
  console.log('🎛️ Configuration surveillance spécialisée dates...');
  
  // Nettoyer l'ancien watcher
  if (dateFieldsWatcher) {
    clearTimeout(dateFieldsWatcher);
  }
  
  let dateTimeout = null;
  
  const saveDateWithDelay = () => {
    if (dateTimeout) clearTimeout(dateTimeout);
    dateTimeout = setTimeout(() => {
      saveDateFieldsSpecific();
    }, 500); // Délai court pour les dates
  };
  
  // Surveiller spécifiquement les champs date
  document.addEventListener('input', (event) => {
    if (event.target.type === 'date') {
      console.log('📅 Changement détecté dans champ date:', event.target.value);
      saveDateWithDelay();
    }
  }, true);
  
  document.addEventListener('change', (event) => {
    if (event.target.type === 'date') {
      console.log('📅 Change détecté dans champ date:', event.target.value);
      saveDateWithDelay();
    }
  }, true);
  
  // Surveillance additionnelle pour les dates (blur, focus, etc.)
  ['blur', 'focus', 'click'].forEach(eventType => {
    document.addEventListener(eventType, (event) => {
      if (event.target.type === 'date' && event.target.value) {
        saveDateWithDelay();
      }
    }, true);
  });
  
  console.log('✅ Surveillance dates active');
}

// ===== FONCTIONS UTILITAIRES DATES =====
function getDateFieldsStats() {
  const storedData = sessionStorage.getItem(DATE_PERSISTENCE_KEY);
  if (!storedData) {
    return { hasDates: false };
  }
  
  try {
    const savedDates = JSON.parse(storedData);
    const age = Date.now() - savedDates.timestamp;
    
    return {
      hasDates: true,
      count: savedDates.dates.length,
      age: Math.round(age / 1000),
      ageFormatted: age < 60000 ? `${Math.round(age/1000)}s` : `${Math.round(age/60000)}min`,
      dates: savedDates.dates.map(d => ({
        id: d.id,
        name: d.name,
        value: d.value
      }))
    };
  } catch (error) {
    return { hasDates: false, error: error.message };
  }
}

function showDateFieldsStats() {
  const stats = getDateFieldsStats();
  
  let message = `📅 Statistiques Champs Date :\n\n`;
  
  if (stats.hasDates) {
    message += `💾 Dates sauvegardées : ${stats.count}\n`;
    message += `⏰ Âge : ${stats.ageFormatted}\n\n`;
    message += `📋 Dates sauvegardées :\n`;
    
    stats.dates.forEach((date, index) => {
      message += `  ${index + 1}. ${date.id || date.name}: "${date.value}"\n`;
    });
  } else {
    message += `💾 Aucune date sauvegardée\n\n`;
    message += `ℹ️ Remplissez des champs date et ils seront\nsauvegardés automatiquement.`;
    
    if (stats.error) {
      message += `\n\n❌ Erreur : ${stats.error}`;
    }
  }
  
  alert(message);
  console.log('📅 Stats dates:', stats);
}

function testDateFields() {
  console.log('🧪 === TEST COMPLET CHAMPS DATE ===');
  
  // 1. Diagnostic
  const dateFields = deepScanDateFields();
  
  // 2. Test sauvegarde
  const saved = saveDateFieldsSpecific();
  console.log(`Sauvegarde dates: ${saved}`);
  
  // 3. Stats
  showDateFieldsStats();
  
  // 4. Test restauration
  setTimeout(() => {
    console.log('Test restauration dates dans 3 secondes...');
    restoreDateFieldsSpecific().then(result => {
      console.log(`Restauration dates: ${result}`);
    });
  }, 3000);
  
  console.log('=== FIN TEST DATES ===');
}

// ===== INTÉGRATION =====
// Modifier les fonctions force brute existantes pour inclure la spécialisation date
const originalSaveBrute = window.saveBruteForceF5;
window.saveBruteForceF5 = function() {
  const bruteResult = originalSaveBrute ? originalSaveBrute() : false;
  const dateResult = saveDateFieldsSpecific();
  return bruteResult || dateResult;
};

const originalRestoreBrute = window.restoreBruteForceF5;
window.restoreBruteForceF5 = async function() {
  console.log('📅 Restauration avec spécialisation dates...');
  
  // D'abord la restauration spécialisée des dates
  const dateRestored = await restoreDateFieldsSpecific();
  
  // Puis la restauration force brute normale
  let bruteRestored = false;
  if (originalRestoreBrute) {
    bruteRestored = await originalRestoreBrute();
  }
  
  return dateRestored || bruteRestored;
};

// ===== INITIALISATION DATES =====
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('📅 Initialisation spécialiste dates...');
    setupDateFieldsWatcher();
    
    // Restauration spécialisée des dates en premier
    setTimeout(() => {
      restoreDateFieldsSpecific();
    }, 1500);
    
  }, 500);
});

// ===== EXPORTS DATES =====
window.deepScanDateFields = deepScanDateFields;
window.saveDateFieldsSpecific = saveDateFieldsSpecific;
window.restoreDateFieldsSpecific = restoreDateFieldsSpecific;
window.setupDateFieldsWatcher = setupDateFieldsWatcher;
window.getDateFieldsStats = getDateFieldsStats;
window.showDateFieldsStats = showDateFieldsStats;
window.testDateFields = testDateFields;

console.log("📅 Spécialiste champs DATE activé - Gestion ultra-spécialisée des dates !");
////
console.log("🎯 Gestionnaire offline chargé - Version 2.5.2 CORRIGÉE - Problème loadEmergencyBackup résolu");