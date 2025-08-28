// config-firebase.js - Configuration Firebase et services de base (VERSION CORRIGÉE)

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9FO6BiHkm7dOQ3Z4-wpPQRgnsGKg3pmM",
  authDomain: "palanquees-jsas.firebaseapp.com",
  databaseURL: "https://palanquees-jsas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "palanquees-jsas",
  storageBucket: "palanquees-jsas.firebasestorage.app",
  messagingSenderId: "284449736616",
  appId: "1:284449736616:web:a0949a9b669def06323f9d"
};

// Variables globales
let plongeurs = [];
let palanquees = [];
let plongeursOriginaux = [];
let currentSort = 'none';
let firebaseConnected = false;
// Variables globales existantes...
let pageLoadTime = Date.now();

// CORRECTION IMMÉDIATE
window.dpSelected = "DP_TEMPORAIRE";
console.log("Variable dpSelected créée:", window.dpSelected);


// Firebase instances
let app, db, auth;

// État d'authentification
let currentUser = null;

// Variables pour le système de verrous
let palanqueeLocks = {};
let currentlyEditingPalanquee = null;
let lockTimers = {};
let dpOnline = {};
let dpInfo = {
  niveau: 'DP',
  nom: ''
};

// Variable pour éviter les doubles initialisations
let lockSystemInitialized = false;

// DOM helpers
function $(id) {
  return document.getElementById(id);
}

function addSafeEventListener(elementId, event, callback) {
  const element = $(elementId);
  if (element) {
    element.addEventListener(event, callback);
    return true;
  } else {
    console.warn(`Élément '${elementId}' non trouvé - event listener ignoré`);
    return false;
  }
}

// FONCTION UTILITAIRE CORRIGÉE pour récupérer le nom du DP
function getCurrentDPName() {
  const dpSelect = $("dp-select");
  if (dpSelect && dpSelect.selectedIndex > 0) {
    const selectedText = dpSelect.options[dpSelect.selectedIndex].text.trim();
    // Définir dpSelected globalement pour compatibilité
    window.dpSelected = selectedText;
    return selectedText;
  }
  
  // Fallback vers dpSelected si elle existe déjà
  if (typeof window.dpSelected !== 'undefined' && window.dpSelected) {
    return window.dpSelected;
  }
  
  return null;
}

// Initialiser dpSelected quand le select change
function initializeDPSelectedWatcher() {
  const dpSelect = $("dp-select");
  if (dpSelect) {
    dpSelect.addEventListener('change', function() {
      const newDPName = getCurrentDPName();
      console.log("DP sélectionné:", newDPName || "Aucun");
      
      // Mettre à jour dpInfo si nouveau DP sélectionné
      if (newDPName) {
        dpInfo.nom = newDPName;
      }
    });
    
    // Définir la valeur initiale
    getCurrentDPName();
  }
}

// Initialisation Firebase
function initializeFirebase() {
  try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    
    console.log("Firebase initialisé");
    
    // Initialiser le watcher DP
    initializeDPSelectedWatcher();
    
    // Écouter les changements d'authentification
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Utilisateur connecté:", user.email);
        currentUser = user;
        
        if (typeof setOnlineUsersManagerActive === 'function') {
          setOnlineUsersManagerActive(true);
        }
        
        if (typeof setUserAuthenticated === 'function') {
          setUserAuthenticated(true);
        }
        
        showMainApp();
        updateUserInfo(user);
        
        // Initialiser le système de verrous avec délai
        if (!lockSystemInitialized) {
          setTimeout(() => {
            initializeLockSystemSafe();
          }, 3000);
        }
        
        // Charger les données si ready
        if (document.readyState === 'complete') {
          console.log("Chargement des données après connexion...");
          await initializeAppData();
          initializeAfterAuth();
        }
      } else {
        console.log("Utilisateur non connecté");
        currentUser = null;
        lockSystemInitialized = false;
        window.dpSelected = null;
        
        if (typeof cleanupLockSystem === 'function') {
          cleanupLockSystem();
        }
        
        if (typeof setOnlineUsersManagerActive === 'function') {
          setOnlineUsersManagerActive(false);
        }
        
        if (typeof setUserAuthenticated === 'function') {
          setUserAuthenticated(false);
        }
        
        showAuthContainer();
      }
    });
    
    return true;
  } catch (error) {
    console.error("Erreur initialisation Firebase:", error);
    return false;
  }
}

// ===== SYSTÈME DE VERROUILLAGE SÉCURISÉ =====

function initializeLockSystemSafe() {
  if (lockSystemInitialized || !currentUser || !db) {
    return;
  }
  
  console.log("Initialisation du système de verrouillage DP...");
  
  try {
    // Déterminer le nom du DP depuis le select
    const dpNom = getCurrentDPName();
    if (dpNom) {
      dpInfo.nom = dpNom;
    }
    
    // Marquer comme en ligne
    markDPOnlineSafe();
    
    // Écouter les verrous
    listenToLocksSafe();
    
    // Nettoyer à la fermeture
    window.addEventListener('beforeunload', cleanupOnExitSafe);
    
    lockSystemInitialized = true;
    console.log("Système de verrouillage initialisé pour:", dpInfo);
    
  } catch (error) {
    console.error("Erreur initialisation système de verrouillage:", error);
    lockSystemInitialized = false;
  }
}

function markDPOnlineSafe() {
  if (!currentUser || !db) return;
  
  try {
    const dpNom = getCurrentDPName() || currentUser.email;
    const dpOnlineRef = db.ref(`dp_online/${currentUser.uid}`);
    
    dpOnlineRef.set({
      nom: dpNom,
      email: currentUser.email,
      niveau: dpInfo.niveau,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      sessionActive: true
    });
    
    dpOnlineRef.onDisconnect().remove();
  } catch (error) {
    console.error("Erreur marquage DP en ligne:", error);
  }
}

function listenToLocksSafe() {
  if (!db) return;
  
  try {
    const locksRef = db.ref('palanquee_locks');
    locksRef.on('value', (snapshot) => {
      palanqueeLocks = snapshot.val() || {};
      
      if (typeof updatePalanqueeLockUI === 'function') {
        updatePalanqueeLockUI();
      }
    });
  } catch (error) {
    console.error("Erreur écoute verrous:", error);
  }
}

async function acquirePalanqueeLockSafe(palanqueeIndex) {
  if (!db || !currentUser || palanqueeIndex === undefined) {
    return false;
  }
  
  const palanqueeId = `palanquee-${palanqueeIndex}`;
  const lockRef = db.ref(`palanquee_locks/${palanqueeId}`);
  
  try {
    const result = await lockRef.transaction((currentLock) => {
      if (currentLock === null) {
        return {
          userId: currentUser.uid,
          userName: dpInfo.nom || getCurrentDPName() || currentUser.email,
          niveau: dpInfo.niveau,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          palanqueeIndex: palanqueeIndex
        };
      } else if (currentLock.userId === currentUser.uid) {
        return currentLock;
      } else {
        throw new Error(`LOCK_EXISTS:${currentLock.userName}`);
      }
    });
    
    if (result.committed) {
      console.log(`Verrou acquis pour palanquée ${palanqueeIndex}`);
      currentlyEditingPalanquee = palanqueeIndex;
      
      if (!lockTimers[palanqueeId]) {
        lockTimers[palanqueeId] = setTimeout(() => {
          releasePalanqueeLockSafe(palanqueeIndex);
        }, 3 * 60 * 1000);
      }
      
      return true;
    }
    
  } catch (error) {
    if (error.message.startsWith('LOCK_EXISTS:')) {
      const otherDPName = error.message.split(':')[1];
      const userConfirm = confirm(`${otherDPName} modifie cette palanquée.\n\nVoulez-vous prendre le contrôle ?`);
      
      if (userConfirm) {
        try {
          await lockRef.set({
            userId: currentUser.uid,
            userName: dpInfo.nom || getCurrentDPName() || currentUser.email,
            niveau: dpInfo.niveau,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            palanqueeIndex: palanqueeIndex,
            forced: true
          });
          
          currentlyEditingPalanquee = palanqueeIndex;
          return true;
        } catch (forceError) {
          console.error("Erreur forçage verrou:", forceError);
          return false;
        }
      }
      return false;
    }
    
    console.error("Erreur lors de la prise de verrou:", error);
    return false;
  }
  
  return false;
}

async function releasePalanqueeLockSafe(palanqueeIndex) {
  if (!db || palanqueeIndex === undefined) return;
  
  const palanqueeId = `palanquee-${palanqueeIndex}`;
  
  try {
    await db.ref(`palanquee_locks/${palanqueeId}`).remove();
    console.log(`Verrou libéré pour palanquée ${palanqueeIndex}`);
    
    currentlyEditingPalanquee = null;
    
    if (lockTimers && lockTimers[palanqueeId]) {
      clearTimeout(lockTimers[palanqueeId]);
      delete lockTimers[palanqueeId];
    }
    
  } catch (error) {
    console.error("Erreur lors de la libération du verrou:", error);
  }
}

function cleanupOnExitSafe() {
  try {
    if (currentlyEditingPalanquee !== null) {
      releasePalanqueeLockSafe(currentlyEditingPalanquee);
    }
    
    if (lockTimers) {
      Object.values(lockTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    }
    
    if (currentUser && db) {
      db.ref(`dp_online/${currentUser.uid}`).remove();
    }
  } catch (error) {
    console.error("Erreur nettoyage sortie:", error);
  }
}

// Export des fonctions sécurisées
window.acquirePalanqueeLock = acquirePalanqueeLockSafe;
window.releasePalanqueeLock = releasePalanqueeLockSafe;

// ===== FONCTIONS D'AUTHENTIFICATION =====

function signIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function signOut() {
  return auth.signOut();
}

function showAuthContainer() {
  const authContainer = $("auth-container");
  const mainApp = $("main-app");
  const loadingScreen = $("loading-screen");
  
  if (loadingScreen) loadingScreen.style.display = "none";
  if (authContainer) authContainer.style.display = "block";
  if (mainApp) mainApp.style.display = "none";
}

function showMainApp() {
  const authContainer = $("auth-container");
  const mainApp = $("main-app");
  const loadingScreen = $("loading-screen");
  
  if (loadingScreen) loadingScreen.style.display = "none";
  if (authContainer) authContainer.style.display = "none";
  if (mainApp) mainApp.style.display = "block";
}

function updateUserInfo(user) {
  const userInfo = $("user-info");
  if (userInfo) {
    userInfo.textContent = `Connecté : ${user.email}`;
  }
}

// ===== FIREBASE DATA =====

async function testFirebaseConnection() {
  try {
    if (!db) {
      throw new Error("Instance Firebase Database non initialisée");
    }
    
    const testRef = db.ref('.info/connected');
    const connectedPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testRef.off('value');
        resolve(false);
      }, 8000);
      
      testRef.on('value', (snapshot) => {
        clearTimeout(timeout);
        testRef.off('value');
        firebaseConnected = snapshot.val() === true;
        resolve(firebaseConnected);
      });
    });
    
    await connectedPromise;
    console.log(firebaseConnected ? "Firebase connecté" : "Firebase déconnecté");
    return true;
    
  } catch (error) {
    console.error("Test Firebase échoué:", error.message);
    firebaseConnected = false;
    return true;
  }
}

async function loadFromFirebase() {
  try {
    console.log("Chargement des données depuis Firebase...");
    
    if (!db) {
      console.warn("DB non disponible");
      return;
    }
    
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    if (plongeursSnapshot.exists()) {
      plongeurs = plongeursSnapshot.val() || [];
      console.log("Plongeurs chargés:", plongeurs.length);
    }
    
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      const rawPalanquees = palanqueesSnapshot.val() || [];
      
      palanquees = rawPalanquees.map((pal, index) => {
        if (Array.isArray(pal)) {
          if (!pal.hasOwnProperty('horaire')) pal.horaire = '';
          if (!pal.hasOwnProperty('profondeurPrevue')) pal.profondeurPrevue = '';
          if (!pal.hasOwnProperty('dureePrevue')) pal.dureePrevue = '';
          if (!pal.hasOwnProperty('profondeurRealisee')) pal.profondeurRealisee = '';
          if (!pal.hasOwnProperty('dureeRealisee')) pal.dureeRealisee = '';
          if (!pal.hasOwnProperty('paliers')) pal.paliers = '';
          return pal;
        } else if (pal && typeof pal === 'object') {
          console.log(`Correction palanquée ${index + 1}: conversion objet vers tableau`);
          
          const nouveauTableau = [];
          Object.keys(pal).forEach(key => {
            if (!isNaN(key) && pal[key] && typeof pal[key] === 'object' && pal[key].nom) {
              nouveauTableau.push(pal[key]);
            }
          });
          
          nouveauTableau.horaire = pal.horaire || '';
          nouveauTableau.profondeurPrevue = pal.profondeurPrevue || '';
          nouveauTableau.dureePrevue = pal.dureePrevue || '';
          nouveauTableau.profondeurRealisee = pal.profondeurRealisee || '';
          nouveauTableau.dureeRealisee = pal.dureeRealisee || '';
          nouveauTableau.paliers = pal.paliers || '';
          
          console.log(`Palanquée ${index + 1} corrigée: ${nouveauTableau.length} plongeurs`);
          return nouveauTableau;
        }
        
        const nouveauTableau = [];
        nouveauTableau.horaire = '';
        nouveauTableau.profondeurPrevue = '';
        nouveauTableau.dureePrevue = '';
        nouveauTableau.profondeurRealisee = '';
        nouveauTableau.dureeRealisee = '';
        nouveauTableau.paliers = '';
        return nouveauTableau;
      });
    } else {
      palanquees = [];
    }
    
    plongeursOriginaux = [...plongeurs];
    
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
  } catch (error) {
    console.error("Erreur chargement Firebase:", error);
  }
}

// Sauvegarde sécurisée
async function syncToDatabase() {
  console.log("Synchronisation Firebase...");
  
  plongeursOriginaux = [...plongeurs];
  
  if (typeof renderPalanquees === 'function') renderPalanquees();
  if (typeof renderPlongeurs === 'function') renderPlongeurs();
  if (typeof updateAlertes === 'function') updateAlertes();
  
  if (firebaseConnected && db) {
    try {
      await Promise.all([
        db.ref('plongeurs').set(plongeurs),
        db.ref('palanquees').set(palanquees)
      ]);
      
      await saveSessionData();
      console.log("Sauvegarde Firebase réussie");
      
    } catch (error) {
      console.error("Erreur sync Firebase:", error.message);
    }
  } else {
    console.warn("Firebase non connecté, données non sauvegardées");
  }
}

// FONCTION SAVESESSIONDATA CORRIGÉE
async function saveSessionData() {
  const dpNom = getCurrentDPName();
  const dpDate = $("dp-date")?.value;
  const dpPlongee = $("dp-plongee")?.value;
  
  if (!dpNom || !dpDate || !dpPlongee || !db) {
    console.warn("Erreur sauvegarde session: données manquantes", {
      dpNom: dpNom || "manquant",
      dpDate: dpDate || "manquant", 
      dpPlongee: dpPlongee || "manquant",
      db: !!db
    });
    return;
  }
  
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
  
  const sessionData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: $("dp-lieu")?.value?.trim() || "Non défini",
      plongee: dpPlongee,
      timestamp: Date.now(),
      sessionKey: sessionKey
    },
    plongeurs: plongeurs,
    palanquees: palanquees,
    stats: {
      totalPlongeurs: plongeurs.length + palanquees.flat().length,
      nombrePalanquees: palanquees.length,
      plongeursNonAssignes: plongeurs.length
    }
  };
  
  try {
    await db.ref(`sessions/${sessionKey}`).set(sessionData);
    console.log("Session sauvegardée avec succès:", sessionKey);
  } catch (error) {
    console.error("Erreur sauvegarde session:", error);
  }
}

// Charger les sessions disponibles
async function loadAvailableSessions() {
  try {
    if (!db) return [];
    
    const sessionsSnapshot = await db.ref('sessions').once('value');
    if (!sessionsSnapshot.exists()) {
      return [];
    }
    
    const sessions = sessionsSnapshot.val();
    const sessionsList = [];
    
    for (const [key, data] of Object.entries(sessions)) {
      if (!data || typeof data !== 'object') {
        continue;
      }
      
      let sessionInfo;
      
      if (data.meta) {
        sessionInfo = {
          key: key,
          dp: data.meta.dp || "DP non défini",
          date: data.meta.date || "Date inconnue",
          lieu: data.meta.lieu || "Lieu non défini",
          plongee: data.meta.plongee || "Non défini",
          timestamp: data.meta.timestamp || Date.now(),
          stats: data.stats || {
            nombrePalanquees: data.palanquees ? data.palanquees.length : 0,
            totalPlongeurs: (data.plongeurs || []).length + (data.palanquees || []).flat().length,
            plongeursNonAssignes: (data.plongeurs || []).length
          }
        };
      } else {
        const keyParts = key.split('_');
        sessionInfo = {
          key: key,
          dp: data.dp || "DP non défini",
          date: data.date || keyParts[0] || "Date inconnue",
          lieu: data.lieu || "Lieu non défini",
          plongee: data.plongee || keyParts[keyParts.length - 1] || "Non défini",
          timestamp: data.timestamp || Date.now(),
          stats: {
            nombrePalanquees: data.palanquees ? data.palanquees.length : 0,
            totalPlongeurs: (data.plongeurs || []).length + (data.palanquees || []).flat().length,
            plongeursNonAssignes: (data.plongeurs || []).length
          }
        };
      }
      
      sessionsList.push(sessionInfo);
    }
    
    sessionsList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB - dateA;
      } else {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });
    
    return sessionsList;
    
  } catch (error) {
    console.error("Erreur chargement sessions:", error);
    return [];
  }
}

// FONCTION loadSession CORRIGÉE
async function loadSession(sessionKey) {
  try {
    if (!db) {
      alert("Base de données non disponible");
      return false;
    }
    
    const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!sessionSnapshot.exists()) {
      alert("Session non trouvée");
      return false;
    }
    
    const sessionData = sessionSnapshot.val();
    
    plongeurs = sessionData.plongeurs || [];
    
    if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
      palanquees = sessionData.palanquees.map((pal, index) => {
        if (Array.isArray(pal)) {
          if (!pal.hasOwnProperty('horaire')) pal.horaire = '';
          if (!pal.hasOwnProperty('profondeurPrevue')) pal.profondeurPrevue = '';
          if (!pal.hasOwnProperty('dureePrevue')) pal.dureePrevue = '';
          if (!pal.hasOwnProperty('profondeurRealisee')) pal.profondeurRealisee = '';
          if (!pal.hasOwnProperty('dureeRealisee')) pal.dureeRealisee = '';
          if (!pal.hasOwnProperty('paliers')) pal.paliers = '';
          return pal;
        }
        return pal;
      });
    } else {
      palanquees = [];
    }
    
    plongeursOriginaux = [...plongeurs];
    
    const meta = sessionData.meta || sessionData;
    const dpNom = meta.dp || "";
    const dpDate = meta.date || "";
    const dpLieu = meta.lieu || "";
    const dpPlongee = meta.plongee || "matin";
    
    // CORRECTION: Synchroniser avec la liste déroulante DP
    const dpSelect = $("dp-select");
    if (dpSelect && dpNom) {
      let dpFound = false;
      for (let i = 0; i < dpSelect.options.length; i++) {
        if (dpSelect.options[i].text.includes(dpNom)) {
          dpSelect.value = dpSelect.options[i].value;
          dpFound = true;
          console.log("DP trouvé et sélectionné:", dpNom);
          break;
        }
      }
      
      if (!dpFound && dpNom.trim() !== '') {
        const option = document.createElement('option');
        option.value = `temp_${Date.now()}`;
        option.textContent = `${dpNom} (P5)`;
        dpSelect.appendChild(option);
        dpSelect.value = option.value;
        console.log("DP ajouté à la liste:", dpNom);
      }
      
      dpSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Remplir les autres champs (CORRECTION: ne plus utiliser dp-nom)
    if ($("dp-date")) $("dp-date").value = dpDate;
    if ($("dp-lieu")) $("dp-lieu").value = dpLieu;
    if ($("dp-plongee")) $("dp-plongee").value = dpPlongee;
    
    // Définir dpSelected
    window.dpSelected = dpNom;
    
    try {
      setTimeout(() => {
        if (typeof renderPalanquees === 'function') renderPalanquees();
        if (typeof renderPlongeurs === 'function') renderPlongeurs();
        if (typeof updateAlertes === 'function') updateAlertes();
        if (typeof updateCompteurs === 'function') updateCompteurs();
      }, 200);
    } catch (renderError) {
      console.error("Erreur rendu:", renderError);
    }
    
    console.log("Session chargée avec succès:", sessionKey);
    return true;
    
  } catch (error) {
    console.error("Erreur chargement session:", error);
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
}