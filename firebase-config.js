// ===== FIREBASE CONFIGURATION ET CONNEXION =====

// Firebase configuration (méthode classique)
const firebaseConfig = {
  apiKey: "AIzaSyA9FO6BiHkm7dOQ3Z4-wpPQRgnsGKg3pmM",
  authDomain: "palanquees-jsas.firebaseapp.com",
  databaseURL: "https://palanquees-jsas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "palanquees-jsas",
  storageBucket: "palanquees-jsas.firebasestorage.app",
  messagingSenderId: "284449736616",
  appId: "1:284449736616:web:a0949a9b669def06323f9d"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== DÉCLARATIONS GLOBALES =====
let plongeurs = [];
let palanquees = [];
let plongeursOriginaux = []; // Pour le tri
let currentSort = 'none';
let firebaseConnected = false;
let pageLoadTime = Date.now();

// DOM helpers
function $(id) {
  return document.getElementById(id);
}

// Fonction helper pour ajouter des event listeners de manière sécurisée
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

// Test de connexion Firebase
async function testFirebaseConnection() {
  try {
    const testRef = db.ref('.info/connected');
    testRef.on('value', (snapshot) => {
      firebaseConnected = snapshot.val() === true;
      console.log(firebaseConnected ? "✅ Firebase connecté" : "❌ Firebase déconnecté");
    });
    
    // Tentative d'écriture test
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
    console.log("📥 Chargement des données depuis Firebase...");
    
    // Charger les plongeurs
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    if (plongeursSnapshot.exists()) {
      plongeurs = plongeursSnapshot.val() || [];
      console.log("✅ Plongeurs chargés:", plongeurs.length);
    }
    
    // Charger les palanquées
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      palanquees = palanqueesSnapshot.val() || [];
      console.log("✅ Palanquées chargées:", palanquees.length);
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Rendu initial
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
  }
}

// Sauvegarde Firebase avec historique par date/DP
async function syncToDatabase() {
  console.log("💾 Synchronisation Firebase...");
  
  // Mettre à jour la liste originale pour le tri
  plongeursOriginaux = [...plongeurs];
  
  // Rendu immédiat AVANT la sauvegarde Firebase
  renderPalanquees();
  renderPlongeurs();
  updateAlertes();
  
  // Sauvegarde Firebase en arrière-plan
  if (firebaseConnected) {
    try {
      // Sauvegarde globale (pour compatibilité)
      await Promise.all([
        db.ref('plongeurs').set(plongeurs),
        db.ref('palanquees').set(palanquees)
      ]);
      
      // Sauvegarde par date/DP (NOUVEAU)
      await saveSessionData();
      
      console.log("✅ Sauvegarde Firebase réussie");
    } catch (error) {
      console.error("❌ Erreur sync Firebase:", error.message);
    }
  } else {
    console.warn("⚠️ Firebase non connecté, données non sauvegardées");
  }
}

// NOUVELLE FONCTION : Sauvegarde par session (date + DP + plongée)
async function saveSessionData() {
  console.log("💾 DÉBUT saveSessionData()");
  
  const dpNom = $("dp-nom").value.trim();
  const dpDate = $("dp-date").value;
  const dpPlongee = $("dp-plongee").value;
  
  console.log("📝 Données récupérées:", { dpNom, dpDate, dpPlongee });
  
  if (!dpNom || !dpDate || !dpPlongee) {
    console.log("❌ Pas de sauvegarde session : DP, date ou plongée manquant");
    console.log("🔍 Détail:", { 
      dpNom: dpNom || "MANQUANT", 
      dpDate: dpDate || "MANQUANT", 
      dpPlongee: dpPlongee || "MANQUANT" 
    });
    return;
  }
  
  // Créer une clé unique : date + première partie du nom DP + type de plongée
  const dpKey = dpNom.split(' ')[0].substring(0, 8); // Premier mot, max 8 char
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
  
  console.log("🔑 Clé de session générée:", sessionKey);
  
  const sessionData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: $("dp-lieu").value.trim() || "Non défini",
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
      alertes: checkAllAlerts()
    }
  };
  
  console.log("📊 Données de session à sauvegarder:", sessionData);
  console.log("🎯 Chemin Firebase:", `sessions/${sessionKey}`);
  
  try {
    console.log("🔥 Tentative de sauvegarde Firebase...");
    await db.ref(`sessions/${sessionKey}`).set(sessionData);
    console.log("✅ Session sauvegardée avec succès:", sessionKey);
    
    // Vérification immédiate
    console.log("🔍 Vérification de la sauvegarde...");
    const verification = await db.ref(`sessions/${sessionKey}`).once('value');
    if (verification.exists()) {
      console.log("✅ Vérification OK - Session bien sauvegardée");
    } else {
      console.error("❌ Vérification échouée - Session non trouvée après sauvegarde");
    }
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde session:", error);
    console.error("🔍 Détails erreur:", error.message);
  }
}