return sessionsList;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
}

// ===== DIAGNOSTIC ET RÉPARATION AUTOMATIQUE =====

// Fonction de diagnostic pour identifier le problème
async function diagnosticChargementDonnees() {
  console.log("🔍 === DIAGNOSTIC CHARGEMENT DONNÉES ===");
  
  // 1. Vérifier l'état de Firebase
  console.log("Firebase connecté:", typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined');
  console.log("DB disponible:", typeof db !== 'undefined' && db ? "✅ OK" : "❌ MANQUANTE");
  console.log("Auth disponible:", typeof auth !== 'undefined' && auth ? "✅ OK" : "❌ MANQUANTE");
  console.log("Utilisateur connecté:", currentUser ? currentUser.email : "❌ NON CONNECTÉ");
  
  // 2. Vérifier les variables globales
  console.log("Variables globales:");
  console.log("- plongeurs:", typeof window.plongeurs !== 'undefined' ? "✅ " + window.plongeurs.length + " éléments" : "❌ undefined");
  console.log("- palanquees:", typeof window.palanquees !== 'undefined' ? "✅ " + window.palanquees.length + " éléments" : "❌ undefined");
  console.log("- plongeursOriginaux:", typeof window.plongeursOriginaux !== 'undefined' ? "✅ " + window.plongeursOriginaux.length + " éléments" : "❌ undefined");
  
  // 3. Test de lecture Firebase
  if (db && currentUser) {
    try {
      console.log("📖 Test lecture Firebase...");
      
      const plongeursSnapshot = await db.ref('plongeurs').once('value');
      const plongeursCount = plongeursSnapshot.exists() ? Object.keys(plongeursSnapshot.val() || {}).length : 0;
      console.log("Plongeurs Firebase:", plongeursSnapshot.exists() ? "✅ " + plongeursCount + " trouvés" : "❌ Aucune donnée");
      
      const palanqueesSnapshot = await db.ref('palanquees').once('value');
      const palanqueesCount = palanqueesSnapshot.exists() ? Object.keys(palanqueesSnapshot.val() || {}).length : 0;
      console.log("Palanquées Firebase:", palanqueesSnapshot.exists() ? "✅ " + palanqueesCount + " trouvées" : "❌ Aucune donnée");
      
    } catch (error) {
      console.error("❌ Erreur lecture Firebase:", error);
    }
  }
  
  // 4. Vérifier les fonctions de rendu
  console.log("Fonctions de rendu:");
  console.log("- renderPlongeurs:", typeof renderPlongeurs === 'function' ? "✅ OK" : "❌ MANQUANTE");
  console.log("- renderPalanquees:", typeof renderPalanquees === 'function' ? "✅ OK" : "❌ MANQUANTE");
  console.log("- updateCompteurs:", typeof updateCompteurs === 'function' ? "✅ OK" : "❌ MANQUANTE");
  
  console.log("=== FIN DIAGNOSTIC ===");
}

// Fonction de réparation forcée
async function forceLoadData() {
  console.log("🔧 RÉPARATION FORCÉE DU CHARGEMENT...");
  
  try {
    // 1. Initialiser les variables globales si nécessaire
    if (typeof window.plongeurs === 'undefined') {
      window.plongeurs = [];
      console.log("✅ Variable plongeurs initialisée");
    }
    
    if (typeof window.palanquees === 'undefined') {
      window.palanquees = [];
      console.log("✅ Variable palanquees initialisée");
    }
    
    if (typeof window.plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
      console.log("✅ Variable plongeursOriginaux initialisée");
    }
    
    // 2. Charger depuis Firebase si possible
    if (db && currentUser) {
      console.log("📥 Chargement forcé depuis Firebase...");
      await loadFromFirebaseForced();
    } else {
      console.log("🔄 Tentative de récupération depuis le cache local...");
      
      // Essayer de charger depuis le stockage local
      try {
        const backupData = sessionStorage.getItem('jsas_emergency_backup') || localStorage.getItem('jsas_last_backup');
        if (backupData) {
          const data = JSON.parse(backupData);
          if (data.plongeurs) window.plongeurs = data.plongeurs;
          if (data.palanquees) window.palanquees = data.palanquees;
          window.plongeursOriginaux = [...window.plongeurs];
          console.log("✅ Données récupérées depuis le cache local");
        }
      } catch (localError) {
        console.error("❌ Erreur cache local:", localError);
      }
    }
    
    // 3. Forcer le rendu
    console.log("🎨 Rendu forcé des composants...");
    forceRenderAll();
    
    console.log("✅ RÉPARATION TERMINÉE");
    
    // Afficher un résumé
    const totalPlongeurs = window.plongeurs.length + window.palanquees.reduce((total, pal) => total + (pal ? pal.length : 0), 0);
    alert("✅ Données rechargées avec succès !\n\n📊 Résumé :\n• " + window.plongeurs.length + " plongeurs en attente\n• " + window.palanquees.length + " palanquées\n• " + totalPlongeurs + " plongeurs au total");
    
  } catch (error) {
    console.error("❌ Erreur lors de la réparation:", error);
    alert("❌ Erreur lors de la réparation : " + error.message);
  }
}

// Ajouter un bouton de diagnostic dans l'interface
function addDiagnosticButton() {
  // Éviter les doublons
  if (document.getElementById('diagnostic-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'diagnostic-btn';
  button.textContent = '🔍 Diagnostic';
  button.style.cssText = "position: fixed; bottom: 20px; left: 20px; background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; z-index: 1000; font-size: 12px;";
  
  button.onclick = function() {
    diagnosticChargementDonnees().then(function() {
      const repair = confirm("🔧 Voulez-vous tenter une réparation automatique ?");
      if (repair) {
        forceLoadData();
      }
    });
  };
  
  document.body.appendChild(button);
}

// Initialisation du diagnostic au chargement
setTimeout(function() {
  addDiagnosticButton();
  console.log("🔍 Bouton de diagnostic ajouté - Utilisez-le si les données ne se chargent pas");
}, 2000);

// Export des fonctions principales
window.forceLoadData = forceLoadData;
window.diagnosticChargementDonnees = diagnosticChargementDonnees;
window.forceRenderAll = forceRenderAll;
window.initializeFirebase = initializeFirebase;

console.log("🔧 Config Firebase avec patch de chargement forcé chargé"); Erreur chargement sessions:", error);
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
    
    const sessionSnapshot = await db.ref("sessions/" + sessionKey).once('value');
    if (!sessionSnapshot.exists()) {
      alert("Session non trouvée");
      return false;
    }
    
    const sessionData = sessionSnapshot.val();
    
    window.plongeurs = sessionData.plongeurs || [];
    
    if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
      window.palanquees = sessionData.palanquees.map((pal, index) => {
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
      window.palanquees = [];
    }
    
    window.plongeursOriginaux = [...window.plongeurs];
    
    // Charger les métadonnées
    if (sessionData.meta) {
      const dpNomElement = document.getElementById("dp-nom");
      const dpDateElement = document.getElementById("dp-date");
      const dpLieuElement = document.getElementById("dp-lieu");
      const dpPlongeeElement = document.getElementById("dp-plongee");
      
      if (dpNomElement) dpNomElement.value = sessionData.meta.dp || "";
      if (dpDateElement) dpDateElement.value = sessionData.meta.date || "";
      if (dpLieuElement) dpLieuElement.value = sessionData.meta.lieu || "";
      if (dpPlongeeElement) dpPlongeeElement.value = sessionData.meta.plongee || "matin";
    } else {
      const dpNomElement = document.getElementById("dp-nom");
      const dpDateElement = document.getElementById("dp-date");
      const dpLieuElement = document.getElementById("dp-lieu");
      const dpPlongeeElement = document.getElementById("dp-plongee");
      
      if (dpNomElement) dpNomElement.value = sessionData.dp || "";
      if (dpDateElement) dpDateElement.value = sessionData.date || "";
      if (dpLieuElement) dpLieuElement.value = sessionData.lieu || "";
      if (dpPlongeeElement) dpPlongeeElement.value = sessionData.plongee || "matin";
    }
    
    // Rendu sécurisé
    forceRenderAll();
    
    console.log("✅ Session chargée avec succès:", sessionKey);
    return true;
    
  } catch (error) {
    console.error("❌// config-firebase.js - Configuration Firebase et services de base (VERSION ULTRA-SÉCURISÉE CORRIGÉE)

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

// Variables globales - INITIALISATION FORCÉE
window.plongeurs = [];
window.palanquees = [];
window.plongeursOriginaux = [];
window.currentSort = 'none';
window.firebaseConnected = false;
window.pageLoadTime = Date.now();

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
    console.warn("Element non trouvé:", elementId);
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
        
        // CHARGEMENT FORCÉ DES DONNÉES
        console.log("📄 CHARGEMENT FORCÉ des données après connexion...");
        try {
          await forceInitializeAppData();
        } catch (error) {
          console.error("❌ Erreur chargement forcé:", error);
          await fallbackDataInitialization();
        }
        
        // Initialiser le système de verrous avec délai
        if (!lockSystemInitialized) {
          setTimeout(() => {
            initializeLockSystemSafe();
          }, 3000);
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

// ===== CHARGEMENT FORCÉ DES DONNÉES =====
async function forceInitializeAppData() {
  console.log("🚀 === CHARGEMENT FORCÉ DES DONNÉES ===");
  
  try {
    // 1. Initialiser les variables globales
    if (!window.plongeurs) window.plongeurs = [];
    if (!window.palanquees) window.palanquees = [];
    if (!window.plongeursOriginaux) window.plongeursOriginaux = [];
    
    // 2. Test de connexion Firebase
    await testFirebaseConnection();
    
    // 3. Définir la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = document.getElementById("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    // 4. Charger les informations DP du jour
    try {
      if (db) {
        const dpKey = today + "_matin";
        const snapshot = await db.ref("dpInfo/" + dpKey).once('value');
        if (snapshot.exists()) {
          const dpData = snapshot.val();
          const dpNomInput = document.getElementById("dp-nom");
          const dpLieuInput = document.getElementById("dp-lieu");
          const dpPlongeeInput = document.getElementById("dp-plongee");
          const dpMessage = document.getElementById("dp-message");
          
          if (dpNomInput) dpNomInput.value = dpData.nom || "";
          if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
          if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
          if (dpMessage) {
            dpMessage.textContent = "Informations du jour chargées.";
            dpMessage.style.color = "blue";
          }
          
          dpInfo.nom = dpData.nom || "";
          console.log("✅ Informations DP du jour chargées");
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement DP:", error);
    }

    // 5. CHARGEMENT FORCÉ DEPUIS FIREBASE
    console.log("📥 Chargement des données Firebase...");
    await loadFromFirebaseForced();
    
    // 6. Charger les fonctionnalités étendues
    try {
      if (typeof chargerHistoriqueDP === 'function') {
        chargerHistoriqueDP();
        console.log("✅ Historique DP chargé");
      }
    } catch (error) {
      console.error("❌ Erreur chargement historique DP:", error);
    }
    
    try {
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
        console.log("✅ Sessions chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement sessions:", error);
    }
    
    try {
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
        console.log("✅ Liste nettoyage sessions chargée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement liste nettoyage sessions:", error);
    }
    
    try {
      if (typeof populateDPCleanupList === 'function') {
        await populateDPCleanupList();
        console.log("✅ Liste nettoyage DP chargée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement liste nettoyage DP:", error);
    }
    
    // 7. RENDU FORCÉ DE L'INTERFACE
    console.log("🎨 Rendu forcé de l'interface...");
    forceRenderAll();
    
    console.log("✅ === CHARGEMENT FORCÉ TERMINÉ ===");
    
    // Afficher un résumé
    const totalPlongeurs = window.plongeurs.length + window.palanquees.reduce((total, pal) => total + (pal ? pal.length : 0), 0);
    console.log("📊 Résumé:", window.plongeurs.length, "plongeurs en attente,", window.palanquees.length, "palanquées,", totalPlongeurs, "total");
    
  } catch (error) {
    console.error("❌ Erreur dans forceInitializeAppData:", error);
    throw error;
  }
}

// ===== CHARGEMENT FIREBASE FORCÉ =====
async function loadFromFirebaseForced() {
  try {
    console.log("🔥 Chargement forcé depuis Firebase...");
    
    if (!db) {
      console.warn("⚠️ DB non disponible");
      return;
    }
    
    // Charger les plongeurs
    try {
      const plongeursSnapshot = await db.ref('plongeurs').once('value');
      if (plongeursSnapshot.exists()) {
        window.plongeurs = plongeursSnapshot.val() || [];
        console.log("✅", window.plongeurs.length, "plongeurs chargés depuis Firebase");
      } else {
        console.log("ℹ️ Aucun plongeur dans Firebase");
        window.plongeurs = [];
      }
    } catch (error) {
      console.error("❌ Erreur chargement plongeurs:", error);
      window.plongeurs = [];
    }
    
    // Charger les palanquées
    try {
      const palanqueesSnapshot = await db.ref('palanquees').once('value');
      if (palanqueesSnapshot.exists()) {
        const rawPalanquees = palanqueesSnapshot.val() || [];
        
        window.palanquees = rawPalanquees.map((pal, index) => {
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
            console.log("🔧 Correction palanquée", index + 1, ": conversion objet vers tableau");
            
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
            
            console.log("✅ Palanquée", index + 1, "corrigée:", nouveauTableau.length, "plongeurs");
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
        
        console.log("✅", window.palanquees.length, "palanquées chargées depuis Firebase");
      } else {
        console.log("ℹ️ Aucune palanquée dans Firebase");
        window.palanquees = [];
      }
    } catch (error) {
      console.error("❌ Erreur chargement palanquées:", error);
      window.palanquees = [];
    }
    
    // Initialiser plongeursOriginaux
    window.plongeursOriginaux = [...window.plongeurs];
    
  } catch (error) {
    console.error("❌ Erreur dans loadFromFirebaseForced:", error);
    throw error;
  }
}

// ===== RENDU FORCÉ DE L'INTERFACE =====
function forceRenderAll() {
  try {
    console.log("🎨 Rendu forcé de tous les composants...");
    
    if (typeof renderPalanquees === 'function') {
      renderPalanquees();
      console.log("✅ Palanquées rendues");
    } else {
      console.warn("⚠️ Fonction renderPalanquees non disponible");
    }
    
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
      console.log("✅ Plongeurs rendus");
    } else {
      console.warn("⚠️ Fonction renderPlongeurs non disponible");
    }
    
    if (typeof updateAlertes === 'function') {
      updateAlertes();
      console.log("✅ Alertes mises à jour");
    } else {
      console.warn("⚠️ Fonction updateAlertes non disponible");
    }
    
    if (typeof updateCompteurs === 'function') {
      updateCompteurs();
      console.log("✅ Compteurs mis à jour");
    } else {
      console.warn("⚠️ Fonction updateCompteurs non disponible");
    }
    
  } catch (error) {
    console.error("❌ Erreur dans forceRenderAll:", error);
  }
}

// ===== INITIALISATION DE SECOURS =====
async function fallbackDataInitialization() {
  console.log("🔄 Initialisation de secours...");
  
  // S'assurer que les variables sont au moins des tableaux vides
  if (!Array.isArray(window.plongeurs)) window.plongeurs = [];
  if (!Array.isArray(window.palanquees)) window.palanquees = [];
  if (!Array.isArray(window.plongeursOriginaux)) window.plongeursOriginaux = [];
  
  // Essayer de charger depuis le cache local
  try {
    const backupData = sessionStorage.getItem('jsas_emergency_backup') || localStorage.getItem('jsas_last_backup');
    if (backupData) {
      const data = JSON.parse(backupData);
      if (data.plongeurs && Array.isArray(data.plongeurs)) {
        window.plongeurs = data.plongeurs;
        window.plongeursOriginaux = [...data.plongeurs];
        console.log("✅ Plongeurs récupérés depuis le cache local");
      }
      if (data.palanquees && Array.isArray(data.palanquees)) {
        window.palanquees = data.palanquees;
        console.log("✅ Palanquées récupérées depuis le cache local");
      }
    }
  } catch (error) {
    console.error("❌ Erreur récupération cache local:", error);
  }
  
  // Forcer le rendu même avec des données vides
  forceRenderAll();
  
  console.log("✅ Initialisation de secours terminée");
}

// ===== SYSTÈME DE VERROUILLAGE SÉCURISÉ =====

function initializeLockSystemSafe() {
  if (lockSystemInitialized || !currentUser || !db) {
    return;
  }
  
  console.log("🔒 Initialisation du système de verrouillage DP...");
  
  try {
    // Déterminer le niveau de l'utilisateur
    const dpNomField = document.getElementById("dp-nom");
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
    const dpNomElement = document.getElementById("dp-nom");
    const dpNom = dpNomElement ? dpNomElement.value : currentUser.email;
    const dpOnlineRef = db.ref("dp_online/" + currentUser.uid);
    
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
  
  const palanqueeId = "palanquee-" + palanqueeIndex;
  const lockRef = db.ref("palanquee_locks/" + palanqueeId);
  
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
        throw new Error("LOCK_EXISTS:" + currentLock.userName);
      }
    });
    
    if (result.committed) {
      console.log("🔒 Verrou acquis pour palanquée", palanqueeIndex);
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
    if (error.message.indexOf('LOCK_EXISTS:') === 0) {
      const otherDPName = error.message.split(':')[1];
      const userConfirm = confirm(otherDPName + " modifie cette palanquée.\n\nVoulez-vous prendre le contrôle ?");
      
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
  
  const palanqueeId = "palanquee-" + palanqueeIndex;
  
  try {
    await db.ref("palanquee_locks/" + palanqueeId).remove();
    console.log("🔓 Verrou libéré pour palanquée", palanqueeIndex);
    
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
      db.ref("dp_online/" + currentUser.uid).remove();
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
  const authContainer = document.getElementById("auth-container");
  const mainApp = document.getElementById("main-app");
  const loadingScreen = document.getElementById("loading-screen");
  
  if (loadingScreen) loadingScreen.style.display = "none";
  if (authContainer) authContainer.style.display = "block";
  if (mainApp) mainApp.style.display = "none";
}

function showMainApp() {
  const authContainer = document.getElementById("auth-container");
  const mainApp = document.getElementById("main-app");
  const loadingScreen = document.getElementById("loading-screen");
  
  if (loadingScreen) loadingScreen.style.display = "none";
  if (authContainer) authContainer.style.display = "none";
  if (mainApp) mainApp.style.display = "block";
}

function updateUserInfo(user) {
  const userInfo = document.getElementById("user-info");
  if (userInfo) {
    userInfo.textContent = "Connecté : " + user.email;
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
    return true;
  }
}

async function loadFromFirebase() {
  return await loadFromFirebaseForced();
}

// Sauvegarde sécurisée
async function syncToDatabase() {
  console.log("💾 Synchronisation Firebase...");
  
  window.plongeursOriginaux = [...window.plongeurs];
  
  // Rendu sécurisé
  forceRenderAll();
  
  if (firebaseConnected && db) {
    try {
      await Promise.all([
        db.ref('plongeurs').set(window.plongeurs),
        db.ref('palanquees').set(window.palanquees)
      ]);
      
      await saveSessionData();
      console.log("✅ Sauvegarde Firebase réussie");
      
    } catch (error) {
      console.error("❌ Erreur sync Firebase:", error.message);
    }
  } else {
    console.warn("⚠️ Firebase non connecté, données non sauvegardées");
  }
}

async function saveSessionData() {
  const dpNomElement = document.getElementById("dp-nom");
  const dpDateElement = document.getElementById("dp-date");
  const dpLieuElement = document.getElementById("dp-lieu");
  const dpPlongeeElement = document.getElementById("dp-plongee");
  
  const dpNom = dpNomElement ? dpNomElement.value.trim() : "";
  const dpDate = dpDateElement ? dpDateElement.value : "";
  const dpLieu = dpLieuElement ? dpLieuElement.value.trim() : "Non défini";
  const dpPlongee = dpPlongeeElement ? dpPlongeeElement.value : "matin";
  
  if (!dpNom || !dpDate || !dpPlongee || !db) {
    return;
  }
  
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = dpDate + "_" + dpKey + "_" + dpPlongee;
  
  const sessionData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now(),
      sessionKey: sessionKey
    },
    plongeurs: window.plongeurs,
    palanquees: window.palanquees,
    stats: {
      totalPlongeurs: window.plongeurs.length + window.palanquees.flat().length,
      nombrePalanquees: window.palanquees.length,
      plongeursNonAssignes: window.plongeurs.length
    }
  };
  
  try {
    await db.ref("sessions/" + sessionKey).set(sessionData);
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
    
    for (const key in sessions) {
      const data = sessions[key];
      
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
    
    return