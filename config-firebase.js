// config-firebase.js - Configuration Firebase minimal

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
let currentUser = null;

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Fonction d'initialisation simple
function initializeFirebase() {
  console.log("✅ Firebase initialisé");
  return Promise.resolve();
}

// Fonction syncToDatabase simple et sécurisée
async function syncToDatabase() {
  if (!currentUser) {
    console.log("🚫 Sync bloquée - utilisateur non connecté");
    return false;
  }
  
  if (!plongeurs || plongeurs.length === 0) {
    console.log("🚫 Sync bloquée - aucun plongeur");
    return false;
  }
  
  try {
    console.log("💾 Synchronisation...", plongeurs.length, "plongeurs");
    
    await Promise.all([
      db.ref('plongeurs').set(plongeurs || []),
      db.ref('palanquees').set(palanquees || [])
    ]);
    
    console.log("✅ Sync réussie");
    return true;
  } catch (error) {
    console.error("❌ Erreur sync:", error.message);
    return false;
  }
}

// Chargement des données
async function loadFromFirebase() {
  if (!currentUser) return;
  
  try {
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    
    plongeurs = plongeursSnapshot.val() || [];
    palanquees = palanqueesSnapshot.val() || [];
    plongeursOriginaux = [...plongeurs];
    
    console.log("✅ Données chargées:", plongeurs.length, "plongeurs");
    
    // Rendu sécurisé
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
  } catch (error) {
    console.error("❌ Erreur chargement:", error);
  }
}

// Authentification
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    firebaseConnected = true;
    console.log("✅ Utilisateur connecté:", user.email);
    await loadFromFirebase();
  } else {
    currentUser = null;
    firebaseConnected = false;
    console.log("❌ Utilisateur déconnecté");
  }
});

// Connexion/Déconnexion
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function logoutUser() {
  try {
    await auth.signOut();
    plongeurs = [];
    palanquees = [];
    plongeursOriginaux = [];
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Export des fonctions
window.initializeFirebase = initializeFirebase;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.syncToDatabase = syncToDatabase;
window.plongeurs = plongeurs;
window.palanquees = palanquees;
window.currentUser = currentUser;
window.firebaseConnected = firebaseConnected;