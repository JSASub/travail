// config-firebase.js - Configuration Firebase et services de base avec système de verrous

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

// NOUVEAU : Variables pour le système de verrous - INITIALISÉES
let palanqueeLocks = {};
let currentlyEditingPalanquee = null;
let lockTimers = {};
let dpOnline = {};
let dpInfo = {
  niveau: 'DP', // N5, E3, E4 tous considérés comme DP
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
        
        // NOUVEAU : Initialiser le système de verrous SEULEMENT si pas déjà fait
        if (!lockSystemInitialized) {
          setTimeout(() => {
            initializeLockSystem();
          }, 3000); // Délai plus long pour s'assurer que tout est chargé
        }
        
        // Charger les données uniquement si on vient de se connecter (pas au démarrage)
        if (document.readyState === 'complete') {
          console.log("🔄 Chargement des données après connexion...");
          await initializeAppData();
        }
      } else {
        console.log("❌ Utilisateur non connecté");
        currentUser = null;
        lockSystemInitialized = false; // Reset pour la prochaine connexion
        showAuthContainer();
      }
    });
    
    return true;
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase:", error);
    return false;
  }
}

// ===== NOUVEAU : SYSTÈME DE VERROUILLAGE (VERSION SÉCURISÉE) =====

// Déterminer le niveau de l'utilisateur
function determinerNiveauUtilisateur() {
  try {
    const dpNomField = $("dp-nom");
    if (dpNomField && dpNomField.value) {
      dpInfo.nom = dpNomField.value;
      dpInfo.niveau = 'DP'; // N5, E3 ou E4 - tous considérés comme DP
    }
    return dpInfo.niveau;
  } catch (error) {
    console.warn("⚠️ Erreur détermination niveau utilisateur:", error);
    return 'DP';
  }
}

// Initialiser le système de verrouillage (VERSION SÉCURISÉE)
function initializeLockSystem() {
  if (lockSystemInitialized) {
    console.log("🔒 Système de verrous déjà initialisé");
    return;
  }
  
  if (!currentUser || !db) {
    console.warn("⚠️ Impossible d'initialiser les verrous - utilisateur ou DB manquant");
    return;
  }
  
  console.log("🔒 Initialisation du système de verrouillage DP...");
  
  try {
    // Déterminer le niveau de l'utilisateur
    determinerNiveauUtilisateur();
    
    // Marquer le DP comme en ligne
    markDPOnline();
    
    // Écouter les verrous actifs
    listenToLocks();
    
    // Écouter les DPs en ligne
    listenToOnlineDPs();
    
    // Nettoyer à la fermeture
    window.addEventListener('beforeunload', cleanupOnExit);
    
    lockSystemInitialized = true;
    console.log("✅ Système de verrouillage initialisé pour:", dpInfo);
    
  } catch (error) {
    console.error("❌ Erreur initialisation système de verrouillage:", error);
    lockSystemInitialized = false;
  }
}

// Marquer le DP comme en ligne (VERSION SÉCURISÉE)
function markDPOnline() {
  if (!currentUser || !db) {
    console.warn("⚠️ Impossible de marquer DP en ligne - utilisateur ou DB manquant");
    return;
  }
  
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
    
    // Nettoyer à la déconnexion
    dpOnlineRef.onDisconnect().remove();
  } catch (error) {
    console.error("❌ Erreur marquage DP en ligne:", error);
  }
}

// Écouter les verrous actifs (VERSION SÉCURISÉE)
function listenToLocks() {
  if (!db) {
    console.warn("⚠️ Impossible d'écouter les verrous - DB manquant");
    return;
  }
  
  try {
    const locksRef = db.ref('palanquee_locks');
    locksRef.on('value', (snapshot) => {
      const locks = snapshot.val() || {};
      palanqueeLocks = locks;
      
      // Appeler updatePalanqueeLockUI seulement si elle existe
      if (typeof updatePalanqueeLockUI === 'function') {
        updatePalanqueeLockUI();
      }
    });
  } catch (error) {
    console.error("❌ Erreur écoute verrous:", error);
  }
}

// Écouter les DPs en ligne (VERSION SÉCURISÉE)
function listenToOnlineDPs() {
  if (!db) {
    console.warn("⚠️ Impossible d'écouter les DPs - DB manquant");
    return;
  }
  
  try {
    const dpOnlineRef = db.ref('dp_online');
    dpOnlineRef.on('value', (snapshot) => {
      const onlineDPs = snapshot.val() || {};
      dpOnline = onlineDPs;
      updateDPStatusIndicator(onlineDPs);
    });
  } catch (error) {
    console.error("❌ Erreur écoute DPs en ligne:", error);
  }
}

// Mettre à jour l'indicateur de statut des DPs (VERSION SÉCURISÉE)
function updateDPStatusIndicator(onlineDPs) {
  try {
    let statusIndicator = $("dp-status-indicator");
    
    if (!statusIndicator) {
      statusIndicator = document.createElement("div");
      statusIndicator.id = "dp-status-indicator";
      statusIndicator.className = "dp-status-indicator";
      
      const metaInfo = $("meta-info");
      if (metaInfo) {
        metaInfo.insertAdjacentElement('afterend', statusIndicator);
      } else {
        // Si meta-info n'existe pas encore, ne pas ajouter
        return;
      }
    }
    
    const dpCount = Object.keys(onlineDPs).length;
    const dpNames = Object.values(onlineDPs).map(dp => dp.nom).join(', ');
    const lockCount = Object.keys(palanqueeLocks).length;
    
    statusIndicator.innerHTML = `
      <div class="dp-status-content">
        <span class="dp-status-icon">👨‍💼</span>
        <span class="dp-status-text">${dpCount} DP connecté(s): ${dpNames}</span>
        <span class="dp-lock-count">${lockCount} palanquée(s) en modification</span>
      </div>
    `;
  } catch (error) {
    console.error("❌ Erreur mise à jour indicateur DP:", error);
  }
}

// Prendre le verrou d'une palanquée (VERSION SÉCURISÉE)
async function acquirePalanqueeLock(palanqueeIndex) {
  if (!db || !currentUser) {
    console.warn("❌ Firebase ou utilisateur non disponible pour verrou");
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
        // C'est déjà notre verrou, on le garde
        return currentLock;
      } else {
        // Quelqu'un d'autre a le verrou
        throw new Error(`LOCK_EXISTS:${currentLock.userName}`);
      }
    });
    
    if (result.committed) {
      console.log(`🔒 Verrou acquis pour palanquée ${palanqueeIndex}`);
      currentlyEditingPalanquee = palanqueeIndex;
      
      // Auto-libération après 3 minutes d'inactivité
      lockTimers[palanqueeId] = setTimeout(() => {
        releasePalanqueeLock(palanqueeIndex);
        if (typeof showLockNotification === 'function') {
          showLockNotification("⏰ Modification annulée automatiquement après 3 minutes d'inactivité", "warning");
        }
      }, 3 * 60 * 1000);
      
      return true;
    }
    
  } catch (error) {
    if (error.message.startsWith('LOCK_EXISTS:')) {
      const otherDPName = error.message.split(':')[1];
      const userConfirm = confirm(`${otherDPName} modifie cette palanquée.\n\nEn tant que DP, voulez-vous prendre le contrôle ?`);
      
      if (userConfirm) {
        try {
          // Forcer la prise de verrou
          await lockRef.set({
            userId: currentUser.uid,
            userName: dpInfo.nom || currentUser.email,
            niveau: dpInfo.niveau,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            palanqueeIndex: palanqueeIndex,
            forced: true
          });
          
          currentlyEditingPalanquee = palanqueeIndex;
          
          if (typeof showLockNotification === 'function') {
            showLockNotification("🔧 Contrôle pris. L'autre DP a été notifié.", "success");
          }
          
          // Auto-libération après 3 minutes
          lockTimers[palanqueeId] = setTimeout(() => {
            releasePalanqueeLock(palanqueeIndex);
            if (typeof showLockNotification === 'function') {
              showLockNotification("⏰ Modification annulée automatiquement après 3 minutes d'inactivité", "warning");
            }
          }, 3 * 60 * 1000);
          
          return true;
        } catch (forceError) {
          console.error("❌ Erreur forçage verrou:", forceError);
          return false;
        }
      }
      return false;
    } else {
      console.error("❌ Erreur lors de la prise de verrou:", error);
      if (typeof showLockNotification === 'function') {
        showLockNotification("Erreur lors de la prise de verrou: " + error.message, "error");
      }
      return false;
    }
  }
  
  return false;
}

// Libérer le verrou d'une palanquée (VERSION SÉCURISÉE)
async function releasePalanqueeLock(palanqueeIndex) {
  if (!db) {
    console.warn("⚠️ DB non disponible pour libérer verrou");
    return;
  }
  
  const palanqueeId = `palanquee-${palanqueeIndex}`;
  const lockRef = db.ref(`palanquee_locks/${palanqueeId}`);
  
  try {
    await lockRef.remove();
    console.log(`🔓 Verrou libéré pour palanquée ${palanqueeIndex}`);
    
    currentlyEditingPalanquee = null;
    
    // Annuler le timer
    if (lockTimers[palanqueeId]) {
      clearTimeout(lockTimers[palanqueeId]);
      delete lockTimers[palanqueeId];
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la libération du verrou:", error);
  }
}

// Nettoyer à la sortie (VERSION SÉCURISÉE)
function cleanupOnExit() {
  try {
    if (currentlyEditingPalanquee !== null) {
      releasePalanqueeLock(currentlyEditingPalanquee);
    }
    
    // Nettoyer tous les timers
    Object.values(lockTimers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    
    // Marquer comme hors ligne
    if (currentUser && db) {
      db.ref(`dp_online/${currentUser.uid}`).remove();
    }
  } catch (error) {
    console.error("❌ Erreur nettoyage sortie:", error);
  }
}

// ===== FIN SYSTÈME DE VERROUILLAGE =====

// Fonctions d'authentification
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

// Test de connexion Firebase
async function testFirebaseConnection() {
  try {
    const testRef = db.ref('.info/connected');
    testRef.on('value', (snapshot) => {
      firebaseConnected = snapshot.val() === true;
      console.log(firebaseConnected ? "✅ Firebase connecté" : "❌ Firebase déconnecté");
    });
    
    await db.ref('test').set({ timestamp: Date.now() });
    console.log("✅ Test d'écriture Firebase réussi");
    return true;
  } catch (error) {
    console.error("❌ Test Firebase échoué:", error.message);
    return false;
  }
}

// Chargement des données depuis Firebase
async function loadFromFirebase() {
  try {
    console.log("🔥 Chargement des données depuis Firebase...");
    
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    if (plongeursSnapshot.exists()) {
      plongeurs = plongeursSnapshot.val() || [];
      console.log("✅ Plongeurs chargés:", plongeurs.length);
    }
    
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      const rawPalanquees = palanqueesSnapshot.val() || [];
      
      // Nettoyer et corriger les palanquées pour assurer la compatibilité
      palanquees = rawPalanquees.map((pal, index) => {
        // Vérifier si la palanquée est un tableau ou un objet
        if (Array.isArray(pal)) {
          // C'est déjà un tableau, juste ajouter les propriétés manquantes
          if (!pal.hasOwnProperty('horaire')) pal.horaire = '';
          if (!pal.hasOwnProperty('profondeurPrevue')) pal.profondeurPrevue = '';
          if (!pal.hasOwnProperty('dureePrevue')) pal.dureePrevue = '';
          if (!pal.hasOwnProperty('profondeurRealisee')) pal.profondeurRealisee = '';
          if (!pal.hasOwnProperty('dureeRealisee')) pal.dureeRealisee = '';
          if (!pal.hasOwnProperty('paliers')) pal.paliers = '';
          return pal;
        } else if (pal && typeof pal === 'object') {
          // C'est un objet, extraire les plongeurs et les propriétés
          console.log(`🔧 Correction palanquée ${index + 1}: conversion objet vers tableau`);
          
          const nouveauTableau = [];
          
          // Extraire les plongeurs (propriétés numériques)
          Object.keys(pal).forEach(key => {
            if (!isNaN(key) && pal[key] && typeof pal[key] === 'object' && pal[key].nom) {
              nouveauTableau.push(pal[key]);
            }
          });
          
          // Ajouter les propriétés de palanquée
          nouveauTableau.horaire = pal.horaire || '';
          nouveauTableau.profondeurPrevue = pal.profondeurPrevue || '';
          nouveauTableau.dureePrevue = pal.dureePrevue || '';
          nouveauTableau.profondeurRealisee = pal.profondeurRealisee || '';
          nouveauTableau.dureeRealisee = pal.dureeRealisee || '';
          nouveauTableau.paliers = pal.paliers || '';
          
          console.log(`✅ Palanquée ${index + 1} corrigée: ${nouveauTableau.length} plongeurs`);
          return nouveauTableau;
        }
        
        // Cas par défaut : palanquée vide
        console.warn(`⚠️ Palanquée ${index + 1} corrompue, création d'une palanquée vide`);
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
    
    // Charger les métadonnées (VERSION SÉCURISÉE)
    if (sessionData.meta) {
      if ($("dp-nom")) $("dp-nom").value = sessionData.meta.dp || "";
      if ($("dp-date")) $("dp-date").value = sessionData.meta.date || "";
      if ($("dp-lieu")) $("dp-lieu").value = sessionData.meta.lieu || "";
      if ($("dp-plongee")) $("dp-plongee").value = sessionData.meta.plongee || "matin";
    } else {
      // Format ancien
      if ($("dp-nom")) $("dp-nom").value = sessionData.dp || "";
      if ($("dp-date")) $("dp-date").value = sessionData.date || "";
      if ($("dp-lieu")) $("dp-lieu").value = sessionData.lieu || "";
      if ($("dp-plongee")) $("dp-plongee").value = sessionData.plongee || "matin";
    }
    
    // Rendu avec gestion d'erreur (VERSION SÉCURISÉE)
    try {
      if (typeof renderPalanquees === 'function') {
        renderPalanquees();
      }
    } catch (renderError) {
      console.error("❌ Erreur renderPalanquees:", renderError);
      // Essayer de nettoyer et re-rendre
      palanquees = palanquees.map(pal => Array.isArray(pal) ? pal : []);
      if (typeof renderPalanquees === 'function') {
        renderPalanquees();
      }
    }
    
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    const dpMessage = $("dp-message");
    if (dpMessage) {
      const dpName = sessionData.meta ? sessionData.meta.dp : sessionData.dp || "Session";
      const dpDate = sessionData.meta ? sessionData.meta.date : sessionData.date || "";
      const dpPlongee = sessionData.meta ? sessionData.meta.plongee : sessionData.plongee || "matin";
      
      dpMessage.innerHTML = `✓ Session "${dpName}" du ${dpDate} (${dpPlongee}) chargée`;
      dpMessage.style.color = "green";
    }
    
    console.log("✅ Session chargée avec succès:", sessionKey);
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
} pal.paliers || '';
          
          console.log(`✅ Palanquée ${index + 1} corrigée: ${nouveauTableau.length} plongeurs`);
          return nouveauTableau;
        } else {
          // Cas inattendu, créer une palanquée vide
          console.warn(`⚠️ Palanquée ${index + 1} corrompue, création d'une palanquée vide`);
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
      
      console.log("✅ Palanquées chargées:", palanquees.length);
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Appeler les fonctions de rendu seulement si elles existent
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
  }
}

// Sauvegarde Firebase - MODIFIÉE pour intégrer les verrous (VERSION SÉCURISÉE)
async function syncToDatabase() {
  console.log("💾 Synchronisation Firebase avec gestion des verrous...");
  
  plongeursOriginaux = [...plongeurs];
  
  // Appeler les fonctions de rendu seulement si elles existent
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
      
      console.log("✅ Sauvegarde Firebase réussie");
      
      // NOUVEAU : Libérer le verrou après sync réussie (seulement si système initialisé)
      if (lockSystemInitialized && currentlyEditingPalanquee !== null) {
        setTimeout(() => {
          releasePalanqueeLock(currentlyEditingPalanquee);
        }, 1000);
      }
      
    } catch (error) {
      console.error("❌ Erreur sync Firebase:", error.message);
    }
  } else {
    console.warn("⚠️ Firebase non connecté, données non sauvegardées");
  }
}

// Sauvegarde par session
async function saveSessionData() {
  const dpNom = $("dp-nom")?.value?.trim();
  const dpDate = $("dp-date")?.value;
  const dpPlongee = $("dp-plongee")?.value;
  
  if (!dpNom || !dpDate || !dpPlongee) {
    console.log("❌ Pas de sauvegarde session : DP, date ou plongée manquant");
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
      plongeursNonAssignes: plongeurs.length,
      alertes: typeof checkAllAlerts === 'function' ? checkAllAlerts() : []
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
    const sessionsSnapshot = await db.ref('sessions').once('value');
    if (!sessionsSnapshot.exists()) {
      return [];
    }
    
    const sessions = sessionsSnapshot.val();
    const sessionsList = [];
    
    for (const [key, data] of Object.entries(sessions)) {
      if (!data || typeof data !== 'object') {
        console.warn(`⚠️ Session ${key} invalide, ignorée`);
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
          dp: data.dp || "DP non défini (ancien format)",
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
    const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!sessionSnapshot.exists()) {
      alert("Session non trouvée dans Firebase");
      return false;
    }
    
    const sessionData = sessionSnapshot.val();
    
    plongeurs = sessionData.plongeurs || [];
    
    // CORRECTION PRINCIPALE : Conversion des palanquées objet→tableau
    if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
      palanquees = sessionData.palanquees.map((pal, index) => {
        // Si c'est déjà un tableau, on le garde
        if (Array.isArray(pal)) {
          // Ajouter les propriétés manquantes
          if (!pal.hasOwnProperty('horaire')) pal.horaire = '';
          if (!pal.hasOwnProperty('profondeurPrevue')) pal.profondeurPrevue = '';
          if (!pal.hasOwnProperty('dureePrevue')) pal.dureePrevue = '';
          if (!pal.hasOwnProperty('profondeurRealisee')) pal.profondeurRealisee = '';
          if (!pal.hasOwnProperty('dureeRealisee')) pal.dureeRealisee = '';
          if (!pal.hasOwnProperty('paliers')) pal.paliers = '';
          return pal;
        }
        
        // Si c'est un objet (le cas de votre erreur), on le convertit
        if (pal && typeof pal === 'object') {
          console.log(`🔧 Correction palanquée ${index + 1}: conversion objet vers tableau`);
          
          const nouveauTableau = [];
          
          // Extraire les plongeurs (propriétés avec clés numériques)
          Object.keys(pal).forEach(key => {
            if (!isNaN(key) && pal[key] && typeof pal[key] === 'object' && pal[key].nom) {
              nouveauTableau.push(pal[key]);
            }
          });
          
          // Conserver les propriétés de palanquée
          nouveauTableau.horaire = pal.horaire || '';
          nouveauTableau.profondeurPrevue = pal.profondeurPrevue || '';
          nouveauTableau.dureePrevue = pal.dureePrevue || '';
          nouveauTableau.profondeurRealisee = pal.profondeurRealisee || '';
          nouveauTableau.dureeRealisee = pal.dureeRealisee || '';
          nouveauTableau.paliers =