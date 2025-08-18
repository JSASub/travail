// config-firebase.js - Configuration Firebase ULTRA-SÉCURISÉE (VERSION CORRIGÉE)

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

// ===== GESTIONNAIRE D'ERREURS GLOBAL =====
class FirebaseErrorHandler {
  static handleError(error, context = "Firebase") {
    console.error(`🔥 Erreur ${context}:`, error);
    
    const errorMessages = {
      'PERMISSION_DENIED': 'Accès refusé - Vérifiez vos droits d\'accès',
      'NETWORK_ERROR': 'Problème de connexion réseau',
      'DISCONNECTED': 'Connexion Firebase perdue',
      'EXPIRED_TOKEN': 'Session expirée - Reconnexion nécessaire',
      'auth/user-not-found': 'Utilisateur non trouvé',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives - Réessayez plus tard',
      'auth/network-request-failed': 'Problème de connexion réseau'
    };
    
    const userMessage = errorMessages[error.code] || error.message || 'Erreur inconnue';
    
    // Notifier l'utilisateur
    if (typeof showNotification === 'function') {
      showNotification(`🔥 ${userMessage}`, 'error');
    } else {
      console.warn("Fonction showNotification non disponible");
    }
    
    // Actions spécifiques
    switch (error.code) {
      case 'PERMISSION_DENIED':
        console.log("🔒 Accès refusé - Vérifier les règles Firebase");
        break;
      case 'auth/expired-action-code':
      case 'EXPIRED_TOKEN':
        console.log("⏰ Session expirée - Déconnexion");
        if (typeof signOut === 'function') {
          signOut();
        }
        break;
      case 'NETWORK_ERROR':
      case 'auth/network-request-failed':
        console.log("🌐 Problème réseau - Mode hors ligne activé");
        if (typeof window.isOnline !== 'undefined') {
          window.isOnline = false;
        }
        break;
    }
    
    return userMessage;
  }
}

// ===== GESTIONNAIRE DE LISTENERS FIREBASE =====
class FirebaseListenerManager {
  constructor() {
    this.listeners = new Map();
  }
  
  addListener(name, ref, callback) {
    // Supprimer l'ancien listener s'il existe
    this.removeListener(name);
    
    // Ajouter le nouveau listener
    ref.on('value', callback);
    this.listeners.set(name, { ref, callback });
    console.log(`📡 Listener '${name}' ajouté`);
  }
  
  removeListener(name) {
    const listener = this.listeners.get(name);
    if (listener) {
      listener.ref.off('value', listener.callback);
      this.listeners.delete(name);
      console.log(`📡 Listener '${name}' supprimé`);
    }
  }
  
  removeAllListeners() {
    console.log(`📡 Suppression de ${this.listeners.size} listeners`);
    for (const [name] of this.listeners) {
      this.removeListener(name);
    }
  }
  
  getActiveListeners() {
    return Array.from(this.listeners.keys());
  }
}

// ===== INITIALISATION SÉCURISÉE DES VARIABLES GLOBALES =====
function initializeGlobalVariables() {
  console.log("🔧 Initialisation des variables globales...");
  
  // Variables principales
  if (typeof window.plongeurs === 'undefined') {
    window.plongeurs = [];
  }
  if (typeof window.palanquees === 'undefined') {
    window.palanquees = [];
  }
  if (typeof window.plongeursOriginaux === 'undefined') {
    window.plongeursOriginaux = [];
  }
  
  // Variables système de verrous
  if (typeof window.palanqueeLocks === 'undefined') {
    window.palanqueeLocks = {};
  }
  if (typeof window.currentlyEditingPalanquee === 'undefined') {
    window.currentlyEditingPalanquee = null;
  }
  if (typeof window.lockTimers === 'undefined') {
    window.lockTimers = {};
  }
  if (typeof window.dpOnline === 'undefined') {
    window.dpOnline = {};
  }
  if (typeof window.dpInfo === 'undefined') {
    window.dpInfo = { niveau: 'DP', nom: '' };
  }
  
  // Variables Firebase
  if (typeof window.firebaseConnected === 'undefined') {
    window.firebaseConnected = false;
  }
  if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
  }
  if (typeof window.lockSystemInitialized === 'undefined') {
    window.lockSystemInitialized = false;
  }
  if (typeof window.pageLoadTime === 'undefined') {
    window.pageLoadTime = Date.now();
  }
  if (typeof window.currentSort === 'undefined') {
    window.currentSort = 'none';
  }
  
  // Gestionnaire de listeners
  if (typeof window.firebaseListeners === 'undefined') {
    window.firebaseListeners = new FirebaseListenerManager();
  }
  
  console.log("✅ Variables globales initialisées");
}

// Firebase instances
let app, db, auth;

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

// ===== INITIALISATION FIREBASE SÉCURISÉE =====
function initializeFirebase() {
  try {
    console.log("🔥 Initialisation Firebase...");
    
    // Initialiser les variables globales D'ABORD
    initializeGlobalVariables();
    
    // Initialiser Firebase
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    
    console.log("✅ Firebase initialisé");
    
    // Gestionnaire d'erreurs global pour les promesses non gérées
    window.addEventListener('unhandledrejection', event => {
      if (event.reason && event.reason.code) {
        FirebaseErrorHandler.handleError(event.reason, 'Promise non gérée');
        event.preventDefault(); // Empêcher l'affichage d'erreur dans la console
      }
    });
    
    // Écouter les changements d'authentification
    auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          console.log("✅ Utilisateur connecté:", user.email);
          currentUser = user;
          
          // Nettoyer l'ancien état avant de configurer le nouveau
          cleanupUserSession();
          
          showMainApp();
          updateUserInfo(user);
          
          // Initialiser le système de verrous avec délai
          setTimeout(() => {
            if (!lockSystemInitialized) {
              initializeLockSystemSafe();
            }
          }, 2000);
          
          // Charger les données
          if (document.readyState === 'complete') {
            console.log("📄 Chargement des données après connexion...");
            await initializeAppData();
          }
        } else {
          console.log("❌ Utilisateur non connecté");
          
          // Nettoyage complet lors de la déconnexion
          cleanupUserSession();
          currentUser = null;
          lockSystemInitialized = false;
          
          showAuthContainer();
        }
      } catch (error) {
        FirebaseErrorHandler.handleError(error, 'Auth state change');
      }
    });
    
    return true;
  } catch (error) {
    FirebaseErrorHandler.handleError(error, 'Initialisation Firebase');
    return false;
  }
}

// ===== NETTOYAGE DE SESSION UTILISATEUR =====
function cleanupUserSession() {
  console.log("🧹 Nettoyage de la session utilisateur...");
  
  try {
    // Supprimer tous les listeners Firebase
    if (window.firebaseListeners) {
      window.firebaseListeners.removeAllListeners();
    }
    
    // Nettoyer les timers de verrous
    if (window.lockTimers) {
      Object.values(window.lockTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      window.lockTimers = {};
    }
    
    // Libérer le verrou actuel
    if (window.currentlyEditingPalanquee !== null) {
      releasePalanqueeLockSafe(window.currentlyEditingPalanquee);
    }
    
    // Réinitialiser les variables d'état
    window.palanqueeLocks = {};
    window.currentlyEditingPalanquee = null;
    window.dpOnline = {};
    
    // Marquer comme hors ligne si nécessaire
    if (currentUser && db) {
      try {
        db.ref(`dp_online/${currentUser.uid}`).remove();
      } catch (error) {
        console.warn("⚠️ Erreur suppression statut en ligne:", error);
      }
    }
    
    console.log("✅ Session nettoyée");
  } catch (error) {
    console.error("❌ Erreur nettoyage session:", error);
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
    
    // Écouter les verrous avec le gestionnaire de listeners
    listenToLocksSafe();
    
    // Nettoyer à la fermeture
    window.addEventListener('beforeunload', cleanupOnExitSafe);
    
    lockSystemInitialized = true;
    console.log("✅ Système de verrouillage initialisé pour:", dpInfo);
    
  } catch (error) {
    FirebaseErrorHandler.handleError(error, 'Initialisation système verrous');
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
    }).catch(error => {
      FirebaseErrorHandler.handleError(error, 'Marquage DP en ligne');
    });
    
    dpOnlineRef.onDisconnect().remove();
  } catch (error) {
    FirebaseErrorHandler.handleError(error, 'Marquage DP en ligne');
  }
}

function listenToLocksSafe() {
  if (!db || !window.firebaseListeners) return;
  
  try {
    const locksRef = db.ref('palanquee_locks');
    
    // Utiliser le gestionnaire de listeners pour éviter les fuites
    window.firebaseListeners.addListener('palanquee_locks', locksRef, (snapshot) => {
      try {
        palanqueeLocks = snapshot.val() || {};
        
        // Mettre à jour l'UI seulement si la fonction existe
        if (typeof updatePalanqueeLockUI === 'function') {
          updatePalanqueeLockUI();
        }
      } catch (error) {
        FirebaseErrorHandler.handleError(error, 'Traitement verrous');
      }
    });
    
  } catch (error) {
    FirebaseErrorHandler.handleError(error, 'Écoute verrous');
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
        // Pas de verrou, on peut prendre
        return {
          userId: currentUser.uid,
          userName: dpInfo.nom || currentUser.email,
          niveau: dpInfo.niveau,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          palanqueeIndex: palanqueeIndex
        };
      } else if (currentLock.userId === currentUser.uid) {
        // C'est notre verrou
        return currentLock;
      } else {
        // Conflit détecté - annuler la transaction
        return undefined;
      }
    });
    
    if (result.committed && result.snapshot.val()) {
      console.log(`🔒 Verrou acquis pour palanquée ${palanqueeIndex}`);
      currentlyEditingPalanquee = palanqueeIndex;
      
      // Auto-libération avec vérification
      if (!lockTimers[palanqueeId]) {
        lockTimers[palanqueeId] = setTimeout(() => {
          releasePalanqueeLockSafe(palanqueeIndex);
          if (typeof showNotification === 'function') {
            showNotification("⏰ Verrou libéré automatiquement", "warning");
          }
        }, 3 * 60 * 1000);
      }
      
      return true;
    } else {
      // Gérer le conflit
      const existingLock = result.snapshot.val();
      if (existingLock && existingLock.userId !== currentUser.uid) {
        const userConfirm = confirm(
          `${existingLock.userName} modifie cette palanquée.\n\nVoulez-vous prendre le contrôle ?`
        );
        
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
            console.log(`🔒 Verrou forcé pour palanquée ${palanqueeIndex}`);
            return true;
          } catch (forceError) {
            FirebaseErrorHandler.handleError(forceError, 'Forçage verrou');
            return false;
          }
        }
      }
      return false;
    }
    
  } catch (error) {
    FirebaseErrorHandler.handleError(error, 'Acquisition verrou');
    return false;
  }
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
    FirebaseErrorHandler.handleError(error, 'Libération verrou');
  }
}

function cleanupOnExitSafe() {
  try {
    console.log("🧹 Nettoyage à la sortie...");
    cleanupUserSession();
  } catch (error) {
    console.error("❌ Erreur nettoyage sortie:", error);
  }
}

// Export des fonctions sécurisées
window.acquirePalanqueeLock = acquirePalanqueeLockSafe;
window.releasePalanqueeLock = releasePalanqueeLockSafe;
window.cleanupUserSession = cleanupUserSession;
window.FirebaseErrorHandler = FirebaseErrorHandler;

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

// ===== FIREBASE DATA AVEC GESTION D'ERREURS =====
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
    FirebaseErrorHandler.handleError(error, 'Test Firebase');
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
    
    // Charger les plongeurs avec gestion d'erreur
    try {
      const plongeursSnapshot = await db.ref('plongeurs').once('value');
      if (plongeursSnapshot.exists()) {
        plongeurs = plongeursSnapshot.val() || [];
        console.log("✅ Plongeurs chargés:", plongeurs.length);
      }
    } catch (error) {
      FirebaseErrorHandler.handleError(error, 'Chargement plongeurs');
      plongeurs = [];
    }
    
    // Charger les palanquées avec gestion d'erreur
    try {
      const palanqueesSnapshot = await db.ref('palanquees').once('value');
      if (palanqueesSnapshot.exists()) {
        const rawPalanquees = palanqueesSnapshot.val() || [];
        
        palanquees = rawPalanquees.map((pal, index) => {
          if (Array.isArray(pal)) {
            // Ajouter les propriétés manquantes
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
            
            // Ajouter les propriétés spéciales
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
    } catch (error) {
      FirebaseErrorHandler.handleError(error, 'Chargement palanquées');
      palanquees = [];
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Rendu sécurisé
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
    } catch (renderError) {
      console.error("❌ Erreur rendu:", renderError);
    }
    
  } catch (error) {
    FirebaseErrorHandler.handleError(error, 'Chargement Firebase');
  }
}

// Sauvegarde sécurisée
async function syncToDatabase() {
  plongeursOriginaux = [...plongeurs];
  
  // Rendu sécurisé
  try {
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
  } catch (renderError) {
    console.error("❌ Erreur rendu lors sync:", renderError);
  }
  
  if (firebaseConnected && db) {
    try {
      await Promise.all([
        db.ref('plongeurs').set(plongeurs),
        db.ref('palanquees').set(palanquees)
      ]);
      
      await saveSessionData();
      console.log("✅ Sauvegarde Firebase réussie");
      
    } catch (error) {
      FirebaseErrorHandler.handleError(error, 'Sync Firebase');
    }
  } else {
    console.warn("⚠️ Firebase non connecté, données non sauvegardées");
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
    FirebaseErrorHandler.handleError(error, 'Sauvegarde session');
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
    FirebaseErrorHandler.handleError(error, 'Chargement sessions');
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
    FirebaseErrorHandler.handleError(error, 'Chargement session');
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
}