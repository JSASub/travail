// quick-fix.js - Script de correction rapide pour résoudre les erreurs de syntaxe

console.log("🔧 Script de correction rapide JSAS en cours...");

// ===== VÉRIFICATION ET CORRECTION DES ERREURS DE SYNTAXE =====

// 1. Vérifier que toutes les variables globales sont définies
function initializeGlobalVariablesSafe() {
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
  
  if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
    console.log("✅ Variable currentUser initialisée");
  }
  
  if (typeof window.firebaseConnected === 'undefined') {
    window.firebaseConnected = false;
    console.log("✅ Variable firebaseConnected initialisée");
  }
  
  if (typeof window.palanqueeLocks === 'undefined') {
    window.palanqueeLocks = {};
    console.log("✅ Variable palanqueeLocks initialisée");
  }
  
  if (typeof window.currentlyEditingPalanquee === 'undefined') {
    window.currentlyEditingPalanquee = null;
    console.log("✅ Variable currentlyEditingPalanquee initialisée");
  }
  
  if (typeof window.lockTimers === 'undefined') {
    window.lockTimers = {};
    console.log("✅ Variable lockTimers initialisée");
  }
  
  if (typeof window.dpInfo === 'undefined') {
    window.dpInfo = { niveau: 'DP', nom: '' };
    console.log("✅ Variable dpInfo initialisée");
  }
  
  if (typeof window.lockSystemInitialized === 'undefined') {
    window.lockSystemInitialized = false;
    console.log("✅ Variable lockSystemInitialized initialisée");
  }
  
  if (typeof window.currentSort === 'undefined') {
    window.currentSort = 'none';
    console.log("✅ Variable currentSort initialisée");
  }
  
  if (typeof window.pageLoadTime === 'undefined') {
    window.pageLoadTime = Date.now();
    console.log("✅ Variable pageLoadTime initialisée");
  }
}

// 2. Gestionnaire d'erreurs simple et robuste
function simpleErrorHandler(error, context = "Application") {
  console.error(`❌ Erreur ${context}:`, error);
  
  // Messages d'erreur simplifiés
  const errorMessages = {
    'auth/user-not-found': 'Utilisateur non trouvé',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/too-many-requests': 'Trop de tentatives',
    'PERMISSION_DENIED': 'Accès refusé',
    'NETWORK_ERROR': 'Problème de connexion'
  };
  
  const message = errorMessages[error.code] || error.message || 'Erreur inconnue';
  
  // Notification simple
  if (typeof showNotification === 'function') {
    showNotification(`🔥 ${message}`, 'error');
  }
  
  return message;
}

// 3. Test de connexion Firebase simplifié
async function testFirebaseConnectionSimple() {
  try {
    if (typeof db === 'undefined' || !db) {
      console.warn("⚠️ Firebase DB non disponible");
      return false;
    }
    
    // Test simple avec timeout court
    const connected = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 3000);
      
      db.ref('.info/connected').once('value', (snapshot) => {
        clearTimeout(timeout);
        resolve(snapshot.val() === true);
      }, () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    
    window.firebaseConnected = connected;
    console.log(connected ? "✅ Firebase connecté" : "⚠️ Firebase déconnecté");
    return connected;
    
  } catch (error) {
    console.error("❌ Test Firebase échoué:", error);
    window.firebaseConnected = false;
    return false;
  }
}

// 4. Fonction de synchronisation simplifiée
async function simpleSyncToDatabase() {
  if (!window.firebaseConnected || typeof db === 'undefined' || !db) {
    console.warn("⚠️ Synchronisation ignorée - Firebase non disponible");
    return;
  }
  
  try {
    // Synchronisation simple
    await Promise.all([
      db.ref('plongeurs').set(window.plongeurs || []),
      db.ref('palanquees').set(window.palanquees || [])
    ]);
    
    console.log("✅ Synchronisation réussie");
    
    // Mettre à jour le rendu si les fonctions existent
    if (typeof renderPalanquees === 'function') {
      renderPalanquees();
    }
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    if (typeof updateAlertes === 'function') {
      updateAlertes();
    }
    if (typeof updateCompteurs === 'function') {
      updateCompteurs();
    }
    
  } catch (error) {
    simpleErrorHandler(error, 'Synchronisation');
  }
}

// 5. Chargement des données simplifié
async function simpleLoadFromFirebase() {
  if (!window.firebaseConnected || typeof db === 'undefined' || !db) {
    console.warn("⚠️ Chargement ignoré - Firebase non disponible");
    return;
  }
  
  try {
    console.log("📥 Chargement des données...");
    
    // Charger les plongeurs
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    if (plongeursSnapshot.exists()) {
      window.plongeurs = plongeursSnapshot.val() || [];
      window.plongeursOriginaux = [...window.plongeurs];
      console.log(`✅ ${window.plongeurs.length} plongeurs chargés`);
    }
    
    // Charger les palanquées
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      const rawPalanquees = palanqueesSnapshot.val() || [];
      
      // Correction simple des palanquées
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
        } else {
          // Créer un tableau vide avec propriétés
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
      
      console.log(`✅ ${window.palanquees.length} palanquées chargées`);
    }
    
    // Rendu
    if (typeof renderPalanquees === 'function') {
      renderPalanquees();
    }
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
  } catch (error) {
    simpleErrorHandler(error, 'Chargement données');
  }
}

// 6. Gestionnaire d'erreurs globales
function setupGlobalErrorHandlers() {
  // Intercepter les erreurs JavaScript
  window.addEventListener('error', (event) => {
    console.error("❌ Erreur JavaScript globale:", event.error);
    simpleErrorHandler(event.error, 'JavaScript Global');
  });
  
  // Intercepter les promesses rejetées
  window.addEventListener('unhandledrejection', (event) => {
    console.error("❌ Promise rejetée:", event.reason);
    simpleErrorHandler(event.reason, 'Promise rejetée');
    event.preventDefault();
  });
  
  console.log("✅ Gestionnaires d'erreurs globaux installés");
}

// 7. Fonction de nettoyage sécurisée
function safeCleanup() {
  try {
    // Nettoyer les timers
    if (window.lockTimers && typeof window.lockTimers === 'object') {
      Object.values(window.lockTimers).forEach(timer => {
        if (timer) {
          clearTimeout(timer);
        }
      });
      window.lockTimers = {};
    }
    
    // Réinitialiser les verrous
    window.currentlyEditingPalanquee = null;
    window.palanqueeLocks = {};
    
    console.log("✅ Nettoyage sécurisé effectué");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  }
}

// 8. Fonction de diagnostic rapide
function quickDiagnostic() {
  console.log("🔍 === DIAGNOSTIC RAPIDE ===");
  
  const diagnostic = {
    variables: {
      plongeurs: typeof window.plongeurs !== 'undefined' ? window.plongeurs.length : 'undefined',
      palanquees: typeof window.palanquees !== 'undefined' ? window.palanquees.length : 'undefined',
      currentUser: typeof window.currentUser !== 'undefined' ? (window.currentUser ? 'connecté' : 'null') : 'undefined',
      firebaseConnected: typeof window.firebaseConnected !== 'undefined' ? window.firebaseConnected : 'undefined'
    },
    firebase: {
      app: typeof firebase !== 'undefined' ? 'disponible' : 'undefined',
      db: typeof db !== 'undefined' ? 'disponible' : 'undefined',
      auth: typeof auth !== 'undefined' ? 'disponible' : 'undefined'
    },
    functions: {
      renderPalanquees: typeof renderPalanquees === 'function',
      renderPlongeurs: typeof renderPlongeurs === 'function',
      syncToDatabase: typeof syncToDatabase === 'function',
      initializeFirebase: typeof initializeFirebase === 'function'
    }
  };
  
  console.log("📊 Diagnostic:", diagnostic);
  console.log("======================");
  
  return diagnostic;
}

// ===== INITIALISATION DU SCRIPT DE CORRECTION =====

// Exécuter immédiatement les corrections
initializeGlobalVariablesSafe();
setupGlobalErrorHandlers();

// Remplacer les fonctions problématiques par des versions sécurisées
if (typeof window.syncToDatabase === 'undefined') {
  window.syncToDatabase = simpleSyncToDatabase;
  console.log("✅ syncToDatabase remplacée par version sécurisée");
}

// Ajouter les fonctions utilitaires globales
window.simpleErrorHandler = simpleErrorHandler;
window.testFirebaseConnectionSimple = testFirebaseConnectionSimple;
window.simpleLoadFromFirebase = simpleLoadFromFirebase;
window.safeCleanup = safeCleanup;
window.quickDiagnostic = quickDiagnostic;

// Fonction d'urgence pour récupérer l'application
window.emergencyRecovery = function() {
  console.log("🆘 === RÉCUPÉRATION D'URGENCE ===");
  
  try {
    // 1. Réinitialiser les variables
    initializeGlobalVariablesSafe();
    
    // 2. Nettoyer l'état
    safeCleanup();
    
    // 3. Tester Firebase
    testFirebaseConnectionSimple();
    
    // 4. Recharger les données si possible
    if (window.firebaseConnected) {
      simpleLoadFromFirebase();
    }
    
    // 5. Diagnostic
    const diagnostic = quickDiagnostic();
    
    console.log("✅ Récupération d'urgence terminée");
    alert("🆘 Récupération d'urgence effectuée.\nConsultez la console pour les détails.");
    
    return diagnostic;
    
  } catch (error) {
    console.error("❌ Erreur lors de la récupération d'urgence:", error);
    alert("❌ Récupération d'urgence échouée: " + error.message);
    return null;
  }
};

// Message de confirmation
console.log(`
✅ === SCRIPT DE CORRECTION RAPIDE CHARGÉ ===

Fonctions disponibles:
• quickDiagnostic() - Diagnostic rapide
• emergencyRecovery() - Récupération d'urgence
• safeCleanup() - Nettoyage sécurisé
• testFirebaseConnectionSimple() - Test Firebase

Le script a automatiquement:
✅ Initialisé toutes les variables globales
✅ Installé les gestionnaires d'erreurs
✅ Remplacé les fonctions problématiques
✅ Ajouté des fonctions de récupération

En cas de problème, utilisez: emergencyRecovery()
============================================
`);

console.log("✅ Script de correction rapide JSAS chargé - Version 1.0.0");

// Auto-diagnostic au chargement
setTimeout(() => {
  quickDiagnostic();
}, 1000);