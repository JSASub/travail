// config-firebase.js - Configuration Firebase et services de base (VERSION ULTRA-SÉCURISÉE)

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
let pageLoadTime = Date.now();

// Firebase instances
let app, db, auth;

// État d'authentification
let currentUser = null;

// Variables pour le système de verrous - INITIALISÉES PROPREMENT
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
    console.warn(`⚠️ Élément '${elementId}' non trouvé - event listener ignoré`);
    return false;
  }
}

// Initialisation Firebase
function initializeFirebase() {
  try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    
    console.log("✅ Firebase initialisé");
    
    // Écouter les changements d'authentification
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("✅ Utilisateur connecté:", user.email);
        currentUser = user;
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
          console.log("🔄 Chargement des données après connexion...");
          await initializeAppData();
		  initializeAfterAuth();
        }
      } else {
        console.log("❌ Utilisateur non connecté");
        currentUser = null;
        lockSystemInitialized = false;
        showAuthContainer();
      }
    });
    
    return true;
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase:", error);
    return false;
  }
}

// ===== SYSTÈME DE VERROUILLAGE SÉCURISÉ =====

function initializeLockSystemSafe() {
  if (lockSystemInitialized || !currentUser || !db) {
    return;
  }
  
  console.log("🔒 Initialisation du système de verrouillage DP...");
  
  try {
    // Déterminer le niveau de l'utilisateur
    const dpNomField = $("dp-nom");
    if (dpNomField && dpNomField.value) {
      dpInfo.nom = dpNomField.value;
    }
    
    // Marquer comme en ligne
    markDPOnlineSafe();
    
    // Écouter les verrous
    listenToLocksSafe();
    
    // Nettoyer à la fermeture
    window.addEventListener('beforeunload', cleanupOnExitSafe);
    
    lockSystemInitialized = true;
    console.log("✅ Système de verrouillage initialisé pour:", dpInfo);
    
  } catch (error) {
    console.error("❌ Erreur initialisation système de verrouillage:", error);
    lockSystemInitialized = false;
  }
}

function markDPOnlineSafe() {
  if (!currentUser || !db) return;
  
  try {
    const dpNom = $("dp-nom")?.value || currentUser.email;
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
    console.error("❌ Erreur marquage DP en ligne:", error);
  }
}

function listenToLocksSafe() {
  if (!db) return;
  
  try {
    const locksRef = db.ref('palanquee_locks');
    locksRef.on('value', (snapshot) => {
      palanqueeLocks = snapshot.val() || {};
      
      // Mettre à jour l'UI seulement si la fonction existe
      if (typeof updatePalanqueeLockUI === 'function') {
        updatePalanqueeLockUI();
      }
    });
  } catch (error) {
    console.error("❌ Erreur écoute verrous:", error);
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
          userName: dpInfo.nom || currentUser.email,
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
      console.log(`🔒 Verrou acquis pour palanquée ${palanqueeIndex}`);
      currentlyEditingPalanquee = palanqueeIndex;
      
      // Auto-libération avec vérification
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
            userName: dpInfo.nom || currentUser.email,
            niveau: dpInfo.niveau,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            palanqueeIndex: palanqueeIndex,
            forced: true
          });
          
          currentlyEditingPalanquee = palanqueeIndex;
          return true;
        } catch (forceError) {
          console.error("❌ Erreur forçage verrou:", forceError);
          return false;
        }
      }
      return false;
    }
    
    console.error("❌ Erreur lors de la prise de verrou:", error);
    return false;
  }
  
  return false;
}

async function releasePalanqueeLockSafe(palanqueeIndex) {
  if (!db || palanqueeIndex === undefined) return;
  
  const palanqueeId = `palanquee-${palanqueeIndex}`;
  
  try {
    await db.ref(`palanquee_locks/${palanqueeId}`).remove();
    console.log(`🔓 Verrou libéré pour palanquée ${palanqueeIndex}`);
    
    currentlyEditingPalanquee = null;
    
    // Nettoyer le timer en sécurité
    if (lockTimers && lockTimers[palanqueeId]) {
      clearTimeout(lockTimers[palanqueeId]);
      delete lockTimers[palanqueeId];
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la libération du verrou:", error);
  }
}

function cleanupOnExitSafe() {
  try {
    if (currentlyEditingPalanquee !== null) {
      releasePalanqueeLockSafe(currentlyEditingPalanquee);
    }
    
    // Nettoyer tous les timers
    if (lockTimers) {
      Object.values(lockTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    }
    
    // Marquer comme hors ligne
    if (currentUser && db) {
      db.ref(`dp_online/${currentUser.uid}`).remove();
    }
  } catch (error) {
    console.error("❌ Erreur nettoyage sortie:", error);
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
    console.log(firebaseConnected ? "✅ Firebase connecté" : "⚠️ Firebase déconnecté");
    return true;
    
  } catch (error) {
    console.error("❌ Test Firebase échoué:", error.message);
    firebaseConnected = false;
    return true; // Continue en mode dégradé
  }
}

async function loadFromFirebase() {
  try {
    console.log("🔥 Chargement des données depuis Firebase...");
    
    if (!db) {
      console.warn("⚠️ DB non disponible");
      return;
    }
    
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    if (plongeursSnapshot.exists()) {
      plongeurs = plongeursSnapshot.val() || [];
      console.log("✅ Plongeurs chargés:", plongeurs.length);
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
          console.log(`🔧 Correction palanquée ${index + 1}: conversion objet vers tableau`);
          
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
          
          console.log(`✅ Palanquée ${index + 1} corrigée: ${nouveauTableau.length} plongeurs`);
          return nouveauTableau;
        }
        
        // Palanquée vide par défaut
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
    
    // Rendu sécurisé
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
  }
}

// Sauvegarde sécurisée avec vérification de connexion
// Sauvegarde sécurisée avec vérification de connexion
async function syncToDatabase() {
  // VÉRIFICATION PRÉALABLE - SORTIE SILENCIEUSE
  if (!currentUser) {
    console.log("⚠️ Utilisateur non connecté - sauvegarde ignorée");
    return false;
  }
  
  if (!firebaseConnected || !db) {
    console.log("⚠️ Firebase non connecté - sauvegarde locale uniquement");
    return false;
  }
  
  console.log("💾 Synchronisation Firebase...");
  
  try {
    plongeursOriginaux = [...plongeurs];
    
    // Rendu sécurisé
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    // Sauvegarde Firebase SEULEMENT si connecté
    await Promise.all([
      db.ref('plongeurs').set(plongeurs || []),
      db.ref('palanquees').set(palanquees || [])
    ]);
    
    await saveSessionData();
    console.log("✅ Sauvegarde Firebase réussie");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur sync Firebase:", error.message);
    
    // NE PAS afficher d'alert ou d'erreur à l'utilisateur
    // Juste logger l'erreur et continuer
    return false;
  }
}
  // Vérifier si l'utilisateur est connecté
  if (!currentUser) {
    console.log("⚠️ Utilisateur non connecté - sauvegarde ignorée");
    return false;
  }
  
  // Vérifier si Firebase est connecté
  if (!firebaseConnected || !db) {
    console.log("⚠️ Firebase non connecté - sauvegarde en mode local uniquement");
    
    // Sauvegarde d'urgence locale si disponible
    if (typeof emergencyLocalSave === 'function') {
      emergencyLocalSave();
    }
    
    // Mettre à jour l'interface sans erreur
    plongeursOriginaux = [...plongeurs];
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    return false;
  }
  
  try {
    // Synchronisation normale
    plongeursOriginaux = [...plongeurs];
    
    // Rendu sécurisé
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    // Sauvegarde Firebase
    await Promise.all([
      db.ref('plongeurs').set(plongeurs || []),
      db.ref('palanquees').set(palanquees || [])
    ]);
    
    await saveSessionData();
    console.log("✅ Sauvegarde Firebase réussie");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur sync Firebase:", error.message);
    
    // Sauvegarde d'urgence en cas d'erreur
    if (typeof emergencyLocalSave === 'function') {
      emergencyLocalSave();
    }
    
    // Ne pas afficher d'erreur si l'utilisateur n'est pas connecté
    if (error.code === 'auth/unauthenticated' || error.code === 'PERMISSION_DENIED') {
      console.log("⚠️ Session expirée - sauvegarde locale effectuée");
      return false;
    }
    
    // Pour les autres erreurs, ne pas afficher d'alerte gênante
    console.warn("⚠️ Synchronisation échouée, données conservées localement");
    return false;
  }
}

async function saveSessionData() {
  const dpNom = $("dp-nom")?.value?.trim();
  const dpDate = $("dp-date")?.value;
  const dpPlongee = $("dp-plongee")?.value;
  
  if (!dpNom || !dpDate || !dpPlongee || !db) {
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
    console.log("✅ Session sauvegardée avec succès:", sessionKey);
  } catch (error) {
    console.error("❌ Erreur sauvegarde session:", error);
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
    console.error("❌ Erreur chargement sessions:", error);
    return [];
  }
}

// Charger une session spécifique
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
        
        if (pal && typeof pal === 'object') {
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
          
          return nouveauTableau;
        } else {
          const nouveauTableau = [];
          nouveauTableau.horaire = '';
          nouveauTableau.profondeurPrevue = '';
          nouveauTableau.dureePrevue = '';
          nouveauTableau.profondeurRealisee = '';
          nouveauTableau.dureeRealisee = '';
          nouveauTableau.paliers = '';
          return nouveauTableau;
        }
      });
    } else {
      palanquees = [];
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Charger les métadonnées
    if (sessionData.meta) {
      if ($("dp-nom")) $("dp-nom").value = sessionData.meta.dp || "";
      if ($("dp-date")) $("dp-date").value = sessionData.meta.date || "";
      if ($("dp-lieu")) $("dp-lieu").value = sessionData.meta.lieu || "";
      if ($("dp-plongee")) $("dp-plongee").value = sessionData.meta.plongee || "matin";
    } else {
      if ($("dp-nom")) $("dp-nom").value = sessionData.dp || "";
      if ($("dp-date")) $("dp-date").value = sessionData.date || "";
      if ($("dp-lieu")) $("dp-lieu").value = sessionData.lieu || "";
      if ($("dp-plongee")) $("dp-plongee").value = sessionData.plongee || "matin";
    }
    
    // Rendu sécurisé
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
    } catch (renderError) {
      console.error("❌ Erreur rendu:", renderError);
    }
    
    console.log("✅ Session chargée avec succès:", sessionKey);
    return true;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
}