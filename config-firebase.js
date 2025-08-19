// config-firebase.js - Configuration Firebase et services de base (VERSION ULTRA-SÉCURISÉE)

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA9FO6BiHkm7dOQ3Z4-wpPQRgnsGKg3pmM",
  authDomain: "palanquees-jsas.firebaseapp.com",
  databaseURL: "https://palanquees-jsas-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "palanquees-jsas",
  storageBucket: "palanquees-jsas.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Variables globales
let plongeurs = [];
let palanquees = [];
let plongeursOriginaux = [];
let currentSort = 'none';
let firebaseConnected = false;
let pageLoadTime = Date.now();
let dataLoaded = false;
let allowSync = false; // BLOQUE TOUT AU DÉBUT
let isInitializing = true; // NOUVELLE VARIABLE - Phase d'initialisation

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Variables d'authentification
let currentUser = null;

// Fonction de test de connexion Firebase
async function testFirebaseConnection() {
  try {
    await db.ref('test-connection').set({ timestamp: firebase.database.ServerValue.TIMESTAMP });
    console.log("✅ Firebase connecté");
    firebaseConnected = true;
    return true;
  } catch (error) {
    console.warn("⚠️ Écriture Firebase échouée mais lecture OK:", error.code);
    firebaseConnected = true; // On garde la lecture
    return false;
  }
}

// Sauvegarde ultra-sécurisée - BLOQUE TOUT PENDANT LA CONNEXION
async function syncToDatabase() {
  // ARRÊT IMMÉDIAT si en phase d'initialisation
  if (isInitializing) {
    console.log("🚫 Synchronisation bloquée - phase d'initialisation");
    return false;
  }
  
  // ARRÊT IMMÉDIAT si pas autorisé
  if (!allowSync) {
    console.log("🚫 Synchronisation bloquée - pas encore autorisée");
    return false;
  }
  
  // ARRÊT IMMÉDIAT si pas connecté
  if (!currentUser || !firebaseConnected || !db) {
    console.log("⚠️ Conditions non remplies pour sync - currentUser:", !!currentUser, "firebaseConnected:", firebaseConnected);
    return false;
  }
  
  // VÉRIFICATION SUPPLÉMENTAIRE - Éviter les sauvegardes vides
  if (!plongeurs || plongeurs.length === 0) {
    console.log("⚠️ Pas de plongeurs à sauvegarder - sync ignorée");
    return false;
  }
  
  console.log("💾 Synchronisation Firebase autorisée...", plongeurs.length, "plongeurs");
  
  try {
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
    return false;
  }
}

// Chargement des données depuis Firebase
async function loadFromFirebase() {
  try {
    console.log("🔥 Chargement des données depuis Firebase...");
    
    if (!db) {
      console.warn("⚠️ DB non disponible");
      return;
    }
    
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    
    plongeurs = plongeursSnapshot.val() || [];
    palanquees = palanqueesSnapshot.val() || [];
    plongeursOriginaux = [...plongeurs];
    
    console.log(`✅ Données chargées: ${plongeurs.length} plongeurs, ${palanquees.length} palanquées`);
    
    // Rendu sécurisé
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    // MARQUER LES DONNÉES COMME CHARGÉES
    dataLoaded = true;
    
    // AUTORISER LA SYNC SEULEMENT MAINTENANT
    allowSync = true;
    isInitializing = false; // Fin de l'initialisation
    
    console.log("✅ Synchronisation autorisée après chargement des données");
    
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
    // En cas d'erreur, quand même permettre le fonctionnement local
    isInitializing = false;
  }
}

// Sauvegarde des données de session
async function saveSessionData() {
  if (!currentUser || !db) return;
  
  try {
    const sessionData = {
      lastLogin: new Date().toISOString(),
      plongeursCount: plongeurs.length,
      palanqueesCount: palanquees.length,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    await db.ref(`sessions/${currentUser.uid}`).set(sessionData);
  } catch (error) {
    console.warn("⚠️ Sauvegarde session échouée:", error.message);
  }
}

// Système de verrous sécurisé
const systemLocks = new Map();

function createSecureLock(lockId, duration = 30000) {
  if (systemLocks.has(lockId)) {
    const existing = systemLocks.get(lockId);
    if (Date.now() - existing.created < duration) {
      return existing.token;
    }
  }
  
  const token = Math.random().toString(36).substr(2, 9);
  systemLocks.set(lockId, { token, created: Date.now() });
  
  setTimeout(() => systemLocks.delete(lockId), duration);
  return token;
}

function verifySecureLock(lockId, token) {
  const lock = systemLocks.get(lockId);
  return lock && lock.token === token;
}

// Gestion de l'authentification
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    console.log("✅ Utilisateur connecté:", user.email);
    
    // Test de connexion Firebase
    await testFirebaseConnection();
    
    // Chargement des données
    await loadFromFirebase();
    
  } else {
    currentUser = null;
    allowSync = false;
    isInitializing = true;
    console.log("❌ Utilisateur déconnecté");
  }
});

// Connexion utilisateur
async function loginUser(email, password) {
  try {
    console.log("🔐 Tentative de connexion...");
    isInitializing = true;
    allowSync = false;
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log("✅ Connexion réussie");
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
    isInitializing = false;
    return { success: false, error: error.message };
  }
}

// Déconnexion utilisateur
async function logoutUser() {
  try {
    // Dernière sauvegarde avant déconnexion
    if (allowSync && currentUser) {
      await syncToDatabase();
    }
    
    await auth.signOut();
    
    // Reset des variables
    allowSync = false;
    isInitializing = true;
    dataLoaded = false;
    plongeurs = [];
    palanquees = [];
    plongeursOriginaux = [];
    
    console.log("✅ Déconnexion réussie");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur de déconnexion:", error.message);
    return { success: false, error: error.message };
  }
}

// Fonctions utilitaires
function getCurrentUser() {
  return currentUser;
}

function isFirebaseConnected() {
  return firebaseConnected && !!currentUser;
}

function getConnectionStatus() {
  return {
    user: !!currentUser,
    firebase: firebaseConnected,
    dataLoaded: dataLoaded,
    syncAllowed: allowSync,
    initializing: isInitializing
  };
}

// Export des fonctions pour les autres modules
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.syncToDatabase = syncToDatabase;
window.getCurrentUser = getCurrentUser;
window.isFirebaseConnected = isFirebaseConnected;
window.getConnectionStatus = getConnectionStatus;
window.createSecureLock = createSecureLock;
window.verifySecureLock = verifySecureLock;