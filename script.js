// ===== INITIALISATION AVEC AUTHENTIFICATION =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Application Palanquées JSAS v2.1.0 - Chargement...");
  
  try {
    // ===== ÉTAPE 1: INITIALISATION DE L'AUTHENTIFICATION =====
    console.log("🔐 Initialisation de l'authentification...");
    await initializeAuth();
    
    // ===== ÉTAPE 2: TEST DE CONNEXION FIREBASE =====
    console.log("🔥 Tentative de connexion Firebase...");
    await testFirebaseConnection();
    
    // ===== ÉTAPE 3: CONFIGURATION DE L'INTERFACE =====
    // Définir la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = $("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    // ===== ÉTAPE 4: CHARGEMENT DES INFOS DP =====
    const dpNomInput = $("dp-nom");
    const dpLieuInput = $("dp-lieu");

    // Tentative de chargement DP depuis Firebase (seulement si authentifié)
    if (userAuthenticated) {
      console.log("📥 Chargement des données DP...");
      try {
        const snapshot = await db.ref(`dpInfo/${today}_matin`).once('value');
        if (snapshot.exists()) {
          const dpData = snapshot.val();
          console.log("✅ Données DP chargées:", dpData);
          if (dpNomInput) dpNomInput.value = dpData.nom || "";
          if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
          const dpPlongeeInput = $("dp-plongee");
          if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
          const dpMessage = $("dp-message");
          if (dpMessage) {
            dpMessage.textContent = "Informations du jour chargées.";
            dpMessage.style.color = "blue";
          }
        } else {
          console.log("ℹ️ Aucune donnée DP pour aujourd'hui");
        }
      } catch (error) {
        console.error("❌ Erreur de lecture des données DP :", error);
        if (error.code === 'PERMISSION_DENIED') {
          console.error("🚫 Permission refusée pour charger les données DP");
        }
      }
    }

    // ===== ÉTAPE 5: GESTIONNAIRE DE VALIDATION DP =====
    addSafeEventListener("valider-dp", "click", async () => {
      if (!ensureAuthenticated()) {
        alert("Erreur: Vous devez être authentifié pour sauvegarder les données.");
        return;
      }
      
      const nomDP = $("dp-nom")?.value?.trim() || "";
      const date = $("dp-date")?.value || "";
      const lieu = $("dp-lieu")?.value?.trim() || "";
      const plongee = $("dp-plongee")?.value || "";
      
      console.log("📝 Validation DP:", nomDP, date, lieu, plongee);

      if (!nomDP || !date || !lieu || !plongee) {
        alert("Veuillez remplir tous les champs du DP.");
        return;
      }

      const dpData = {
        nom: nomDP,
        date: date,
        lieu: lieu,
        plongee: plongee,
        timestamp: Date.now()
      };

      const dpKey = `dpInfo/${date}_${plongee}`;
      
      // Affichage en attente
      const dpMessage = $("dp-message");
      if (dpMessage) {
        dpMessage.textContent = "Enregistrement en cours...";
        dpMessage.style.color = "orange";
      }
      
      try {
        await db.ref(dpKey).set(dpData);
        console.log("✅ Données DP sauvegardées avec succès");
        if (dpMessage) {
          dpMessage.classList.add("success-icon");
          dpMessage.textContent = ` Informations du DP enregistrées avec succès.`;
          dpMessage.style.color = "green";
        }
      } catch (error) {
        console.error("❌ Erreur Firebase DP:", error);
        if (dpMessage) {
          dpMessage.classList.remove("success-icon");
          if (error.code === 'PERMISSION_DENIED') {
            dpMessage.textContent = "Erreur de permission: impossible de sauvegarder.";
          } else {
            dpMessage.textContent = "Erreur lors de l'enregistrement : " + error.message;
          }
          dpMessage.style.color = "red";
        }
      }
    });

    // ===== ÉTAPE 6: CHARGEMENT DES DONNÉES HISTORIQUES =====
    if (userAuthenticated) {
      console.log("📜 Chargement historique DP...");
      chargerHistoriqueDP();
      
      console.log("📊 Chargement des données principales...");
      // loadFromFirebase() sera appelé automatiquement par testFirebaseConnection()
      
      console.log("📜 Chargement des sessions...");
      await populateSessionSelector();
      await populateSessionsCleanupList();
      await populateDPCleanupList();
    } else {
      console.warn("⚠️ Chargement des données historiques ignoré - pas authentifié");
    }
    
    // ===== ÉTAPE 7: SETUP DES EVENT LISTENERS =====
    console.log("🎛️ Configuration des event listeners...");
    setupEventListeners();
    
    // ===== ÉTAPE 8: AFFICHAGE DU STATUS =====
    console.log("✅ Application initialisée avec succès!");
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées chargés`);
    console.log(`🔥 Firebase connecté: ${firebaseConnected}`);
    console.log(`🔐 Utilisateur authentifié: ${userAuthenticated}`);
    
    // Afficher un message de statut dans l'interface
    const statusMessage = document.createElement("div");
    statusMessage.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: ${userAuthenticated ? '#28a745' : '#ffc107'};
      color: ${userAuthenticated ? 'white' : 'black'};
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 0.8em;
      z-index: 1000;
    `;
    statusMessage.textContent = userAuthenticated ? 
      "🔐 Authentifié - Sauvegarde active" : 
      "⚠️ Mode local - Pas de sauvegarde";
    document.body.appendChild(statusMessage);
    
    // Masquer le message après 5 secondes
    setTimeout(() => {
      statusMessage.style.transition = "opacity 1s";
      statusMessage.style.opacity = "0";
      setTimeout(() => statusMessage.remove(), 1000);
    }, 5000);
    
  } catch (error) {
    console.error("❌ ERREUR CRITIQUE lors de l'initialisation:", error);
    console.error("Stack trace:", error.stack);
    
    // Mode dégradé sans Firebase
    console.log("🔄 Tentative de fonctionnement en mode dégradé...");
    plongeurs = [];
    palanquees = [];
    plongeursOriginaux = [];
    userAuthenticated = false;
    
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    setupEventListeners();
    
    alert("Erreur critique d'initialisation. L'application fonctionne en mode local uniquement.");
    showDegradedModeWarning();
  }
});
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

// ===== FONCTIONS DE NETTOYAGE =====

// Charger la liste des sessions pour nettoyage - VERSION SÉCURISÉE
async function populateSessionsCleanupList() {
  const container = $("sessions-cleanup-list");
  if (!container) {
    console.warn("⚠️ Conteneur sessions-cleanup-list non trouvé - nettoyage sessions désactivé");
    return;
  }

  try {
    console.log("🧹 Chargement liste sessions pour nettoyage...");
    const sessions = await loadAvailableSessions();
    
    if (sessions.length === 0) {
      container.innerHTML = '<em style="color: #666;">Aucune session à nettoyer</em>';
      return;
    }
    
    container.innerHTML = '';
    
    sessions.forEach(session => {
      const item = document.createElement('label');
      item.className = 'cleanup-item';
      
      const plongeeType = session.plongee ? ` (${session.plongee})` : '';
      const dateFormatted = new Date(session.timestamp).toLocaleString('fr-FR');
      
      item.innerHTML = `
        <input type="checkbox" value="${session.key}" class="session-cleanup-checkbox">
        <div class="item-info">
          <span class="item-date">${session.date}${plongeeType}</span>
          <span class="item-details">${session.dp} - ${session.stats.nombrePalanquees} palanquées</span>
          <span class="item-meta">Créé le ${dateFormatted}</span>
        </div>
      `;
      
      container.appendChild(item);
    });
    
    console.log("✅ Liste sessions nettoyage mise à jour:", sessions.length, "sessions");
    
  } catch (error) {
    console.error("❌ Erreur chargement liste sessions nettoyage:", error);
    if (container) {
      container.innerHTML = '<em style="color: #dc3545;">Erreur de chargement</em>';
    }
  }
}

// Charger la liste des DPs pour nettoyage - VERSION SÉCURISÉE
async function populateDPCleanupList() {
  const container = $("dp-cleanup-list");
  if (!container) {
    console.warn("⚠️ Conteneur dp-cleanup-list non trouvé - nettoyage DP désactivé");
    return;
  }

  try {
    console.log("🧹 Chargement liste DP pour nettoyage...");
    const snapshot = await db.ref("dpInfo").once('value');
    
    if (!snapshot.exists()) {
      container.innerHTML = '<em style="color: #666;">Aucun DP à nettoyer</em>';
      return;
    }
    
    const dpInfos = snapshot.val();
    container.innerHTML = '';
    
    // Trier par date décroissante
    const dpList = Object.entries(dpInfos).sort((a, b) => 
      new Date(b[1].date) - new Date(a[1].date)
    );
    
    dpList.forEach(([key, dpData]) => {
      const item = document.createElement('label');
      item.className = 'cleanup-item';
      
      const dateFormatted = new Date(dpData.timestamp).toLocaleString('fr-FR');
      const plongeeType = dpData.plongee ? ` (${dpData.plongee})` : '';
      
      item.innerHTML = `
        <input type="checkbox" value="${key}" class="dp-cleanup-checkbox">
        <div class="item-info">
          <span class="item-date">${dpData.date}${plongeeType}</span>
          <span class="item-details">${dpData.nom} - ${dpData.lieu}</span>
          <span class="item-meta">Créé le ${dateFormatted}</span>
        </div>
      `;
      
      container.appendChild(item);
    });
    
    console.log("✅ Liste DP nettoyage mise à jour:", dpList.length, "DP");
    
  } catch (error) {
    console.error("❌ Erreur chargement liste DP nettoyage:", error);
    if (container) {
      container.innerHTML = '<em style="color: #dc3545;">Erreur de chargement</em>';
    }
  }
}

// Supprimer les sessions sélectionnées
async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucune session sélectionnée pour suppression.");
    return;
  }
  
  const sessionKeys = Array.from(checkboxes).map(cb => cb.value);
  const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${sessionKeys.length} session(s) ?\n\nCette action est irréversible !`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    console.log("🗑️ Suppression de", sessionKeys.length, "sessions...");
    
    for (const sessionKey of sessionKeys) {
      await db.ref(`sessions/${sessionKey}`).remove();
      console.log("✅ Session supprimée:", sessionKey);
    }
    
    console.log("✅ Suppression sessions terminée");
    alert(`${sessionKeys.length} session(s) supprimée(s) avec succès !`);
    
    // Actualiser les listes
    await populateSessionsCleanupList();
    await populateSessionSelector();
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("Erreur lors de la suppression : " + error.message);
  }
}

// Supprimer les DPs sélectionnés
async function deleteSelectedDPs() {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucun DP sélectionné pour suppression.");
    return;
  }
  
  const dpKeys = Array.from(checkboxes).map(cb => cb.value);
  const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${dpKeys.length} DP ?\n\nCette action est irréversible !`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    console.log("🗑️ Suppression de", dpKeys.length, "DP...");
    
    for (const dpKey of dpKeys) {
      await db.ref(`dpInfo/${dpKey}`).remove();
      console.log("✅ DP supprimé:", dpKey);
    }
    
    console.log("✅ Suppression DP terminée");
    alert(`${dpKeys.length} DP supprimé(s) avec succès !`);
    
    // Actualiser les listes
    await populateDPCleanupList();
    chargerHistoriqueDP();
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("Erreur lors de la suppression : " + error.message);
  }
}

// Fonctions de sélection - VERSION SÉCURISÉE
function selectAllSessions(select = true) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  if (checkboxes.length === 0) {
    console.warn("⚠️ Aucune checkbox session trouvée");
    return;
  }
  checkboxes.forEach(cb => cb.checked = select);
  updateCleanupSelection();
}

function selectAllDPs(select = true) {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox');
  if (checkboxes.length === 0) {
    console.warn("⚠️ Aucune checkbox DP trouvée");
    return;
  }
  checkboxes.forEach(cb => cb.checked = select);
  updateCleanupSelection();
}

// Mettre à jour l'apparence des items sélectionnés
function updateCleanupSelection() {
  // Sessions
  document.querySelectorAll('.session-cleanup-checkbox').forEach(cb => {
    const item = cb.closest('.cleanup-item');
    if (cb.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  // DPs
  document.querySelectorAll('.dp-cleanup-checkbox').forEach(cb => {
    const item = cb.closest('.cleanup-item');
    if (cb.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// ===== DIAGNOSTIC SYSTÈME =====
function diagnosticSystem() {
  console.log("🔍 === DIAGNOSTIC SYSTÈME ===");
  
  // Test 1: Vérifier les éléments HTML
  const compteurPlongeurs = $("compteur-plongeurs");
  const compteurPalanquees = $("compteur-palanquees");
  
  console.log("🔍 Élément compteur-plongeurs:", compteurPlongeurs ? "✅ TROUVÉ" : "❌ MANQUANT");
  console.log("🔍 Élément compteur-palanquees:", compteurPalanquees ? "✅ TROUVÉ" : "❌ MANQUANT");
  
  // Test 2: Vérifier les données
  console.log("🔍 Nombre de plongeurs:", plongeurs.length);
  console.log("🔍 Nombre de palanquées:", palanquees.length);
  console.log("🔍 Détail palanquées:", palanquees.map(p => p.length));
  
  // Test 3: Vérifier le DOM
  const titreListePlongeurs = document.querySelector("main strong");
  const titrePalanquees = document.querySelector("#palanquees strong");
  
  console.log("🔍 Titre liste plongeurs:", titreListePlongeurs ? titreListePlongeurs.innerHTML : "NON TROUVÉ");
  console.log("🔍 Titre palanquées:", titrePalanquees ? titrePalanquees.innerHTML : "NON TROUVÉ");
  
  // Conclusion
  if (!compteurPlongeurs || !compteurPalanquees) {
    console.error("❌ PROBLÈME: Les éléments HTML pour les compteurs n'existent pas !");
    console.error("🔧 SOLUTION: Tu dois mettre à jour ton fichier index.html sur le serveur");
    alert("❌ PROBLÈME DÉTECTÉ: Les éléments HTML pour les compteurs sont manquants !\n\n🔧 SOLUTION: Mets à jour ton fichier index.html sur le serveur avec la version qui contient les spans pour les compteurs.");
  } else {
    console.log("✅ Éléments HTML OK, problème ailleurs");
  }
}

// ===== COMPTEURS D'AFFICHAGE =====
function updateCompteurs() {
  // Compteur plongeurs non assignés
  const compteurPlongeurs = $("compteur-plongeurs");
  if (compteurPlongeurs) {
    compteurPlongeurs.textContent = `(${plongeurs.length})`;
    compteurPlongeurs.style.color = plongeurs.length === 0 ? "#28a745" : "#007bff";
  }
  
  // Compteur plongeurs dans palanquées
  const totalPlongeursEnPalanquees = palanquees.flat().length;
  const nombrePalanquees = palanquees.length;
  const compteurPalanquees = $("compteur-palanquees");
  
  if (compteurPalanquees) {
    if (nombrePalanquees === 0) {
      compteurPalanquees.textContent = "(Aucune palanquée)";
      compteurPalanquees.style.color = "#666";
    } else {
      const plurielPlongeurs = totalPlongeursEnPalanquees > 1 ? "plongeurs" : "plongeur";
      const plurielPalanquees = nombrePalanquees > 1 ? "palanquées" : "palanquée";
      compteurPalanquees.textContent = `(${totalPlongeursEnPalanquees} ${plurielPlongeurs} dans ${nombrePalanquees} ${plurielPalanquees})`;
      compteurPalanquees.style.color = "#28a745";
    }
  }
  
  console.log(`📊 Compteurs mis à jour: ${plongeurs.length} non assignés, ${totalPlongeursEnPalanquees} en palanquées`);
}

// ===== SYSTÈME D'ALERTES AMÉLIORÉ =====
function checkAllAlerts() {
  const alertes = [];
  
  palanquees.forEach((palanquee, idx) => {
    const n1s = palanquee.filter(p => p.niveau === "N1");
    const gps = palanquee.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
    const autonomes = palanquee.filter(p => ["N2", "N3"].includes(p.niveau));
    
    // Palanquée > 5 plongeurs
    if (palanquee.length > 5) {
      alertes.push(`Palanquée ${idx + 1}: Plus de 5 plongeurs (${palanquee.length})`);
    }
    
    // Palanquée ≤ 1 plongeur
    if (palanquee.length <= 1) {
      alertes.push(`Palanquée ${idx + 1}: Palanquée de ${palanquee.length} plongeur(s)`);
    }
    
    // N1 sans GP
    if (n1s.length > 0 && gps.length === 0) {
      alertes.push(`Palanquée ${idx + 1}: N1 sans Guide de Palanquée`);
    }
    
    // Autonomes > 3
    if (autonomes.length > 3) {
      alertes.push(`Palanquée ${idx + 1}: Plus de 3 plongeurs autonomes (${autonomes.length})`);
    }
    
    // 4 ou 5 plongeurs sans GP
    if ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0) {
      alertes.push(`Palanquée ${idx + 1}: ${palanquee.length} plongeurs sans Guide de Palanquée`);
    }
  });
  
  return alertes;
}

function updateAlertes() {
  const alertes = checkAllAlerts();
  const alerteSection = $("alertes-section");
  const alerteContent = $("alertes-content");
  
  if (alertes.length === 0) {
    alerteSection.classList.add("alert-hidden");
  } else {
    alerteSection.classList.remove("alert-hidden");
    alerteContent.innerHTML = alertes.map(alerte => 
      `<div class="alert-item">${alerte}</div>`
    ).join('');
  }
}

function checkAlert(palanquee) {
  const n1s = palanquee.filter(p => p.niveau === "N1");
  const gps = palanquee.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
  const autonomes = palanquee.filter(p => ["N2", "N3"].includes(p.niveau));
  
  return (
    palanquee.length > 5 ||
    palanquee.length <= 1 ||
    (n1s.length > 0 && gps.length === 0) ||
    autonomes.length > 3 ||
    ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0)
  );
}

// ===== TRI DES PLONGEURS =====
function sortPlongeurs(type) {
  currentSort = type;
  
  // Mettre à jour les boutons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.sort === type) {
      btn.classList.add('active');
    }
  });
  
  switch(type) {
    case 'nom':
      plongeurs.sort((a, b) => a.nom.localeCompare(b.nom));
      break;
    case 'niveau':
      const niveauOrder = { 'N1': 1, 'N2': 2, 'N3': 3, 'N4/GP': 4, 'E1': 5, 'E2': 6, 'E3': 7, 'E4': 8 };
      plongeurs.sort((a, b) => (niveauOrder[a.niveau] || 9) - (niveauOrder[b.niveau] || 9));
      break;
    case 'none':
    default:
      plongeurs = [...plongeursOriginaux];
      break;
  }
  
  renderPlongeurs();
}

// Sauvegarde Firebase avec historique par date/DP et vérification d'authentification
async function syncToDatabase() {
  if (!ensureAuthenticated()) {
    console.warn("⚠️ Synchronisation Firebase annulée - pas authentifié");
    return;
  }
  
  console.log("💾 Synchronisation Firebase...");
  
  // Mettre à jour la liste originale pour le tri
  plongeursOriginaux = [...plongeurs];
  
  // Rendu immédiat AVANT la sauvegarde Firebase
  renderPalanquees();
  renderPlongeurs();
  updateAlertes();
  
  // Sauvegarde Firebase en arrière-plan
  if (firebaseConnected && userAuthenticated) {
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
      
      // Gestion des erreurs d'authentification
      if (error.code === 'PERMISSION_DENIED') {
        console.error("🚫 Permission refusée lors de la sauvegarde");
        alert("Erreur de permission Firebase. Les données ne peuvent pas être sauvegardées.");
      }
    }
  } else {
    console.warn("⚠️ Firebase non connecté ou pas authentifié, données non sauvegardées");
  }
}

// NOUVELLE FONCTION : Sauvegarde par session (date + DP + plongée) avec authentification
async function saveSessionData() {
  if (!ensureAuthenticated()) {
    console.warn("⚠️ Sauvegarde session annulée - pas authentifié");
    return;
  }
  
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
    
    // Gestion spécifique des erreurs d'authentification
    if (error.code === 'PERMISSION_DENIED') {
      console.error("🚫 Permission refusée pour la sauvegarde de session");
      alert("Erreur de permission: impossible de sauvegarder la session");
    }
  }
}

// NOUVELLE FONCTION : Charger les sessions disponibles avec authentification
async function loadAvailableSessions() {
  if (!ensureAuthenticated()) {
    console.warn("⚠️ Chargement sessions annulé - pas authentifié");
    return [];
  }
  
  try {
    const sessionsSnapshot = await db.ref('sessions').once('value');
    if (!sessionsSnapshot.exists()) {
      console.log("ℹ️ Aucune session trouvée");
      return [];
    }
    
    const sessions = sessionsSnapshot.val();
    const sessionsList = [];
    
    for (const [key, data] of Object.entries(sessions)) {
      // CORRECTION: Vérifier si data.meta existe avant de l'utiliser
      if (!data || typeof data !== 'object') {
        console.warn(`⚠️ Session ${key} invalide (données corrompues), ignorée`);
        continue;
      }
      
      // Gestion des anciens formats de sessions
      let sessionInfo;
      
      if (data.meta) {
        // Nouveau format avec meta
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
        // Ancien format ou format non standard
        console.warn(`⚠️ Session ${key} utilise un ancien format, adaptation...`);
        
        // Essayer d'extraire les infos du nom de la clé
        const keyParts = key.split('_');
        const dateFromKey = keyParts[0] || "Date inconnue";
        const plongeeFromKey = keyParts[keyParts.length - 1] || "Non défini";
        
        sessionInfo = {
          key: key,
          dp: data.dp || data.directeurPlongee || "DP non défini (ancien format)",
          date: data.date || dateFromKey,
          lieu: data.lieu || "Lieu non défini",
          plongee: data.plongee || plongeeFromKey,
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
    
    // Trier par date décroissante
    sessionsList.sort((a, b) => {
      // Essayer de comparer par date, sinon par timestamp
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB - dateA;
      } else {
        // Fallback sur timestamp
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });
    
    console.log("✅ Sessions chargées:", sessionsList.length);
    return sessionsList;
    
  } catch (error) {
    console.error("❌ Erreur chargement sessions:", error);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.error("🚫 Permission refusée pour charger les sessions");
    }
    
    return [];
  }
}

// NOUVELLE FONCTION : Charger une session spécifique
async function loadSession(sessionKey) {
  try {
    console.log("🔄 Chargement de la session:", sessionKey);
    
    const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!sessionSnapshot.exists()) {
      console.error("❌ Session non trouvée:", sessionKey);
      alert("Session non trouvée dans Firebase");
      return false;
    }
    
    const sessionData = sessionSnapshot.val();
    console.log("📊 Données session récupérées:", sessionData);
    
    // Charger les données
    plongeurs = sessionData.plongeurs || [];
    palanquees = sessionData.palanquees || [];
    plongeursOriginaux = [...plongeurs];
    
    console.log("✅ Données chargées:", plongeurs.length, "plongeurs,", palanquees.length, "palanquées");
    
    // Mettre à jour les champs DP
    $("dp-nom").value = sessionData.meta.dp || "";
    $("dp-date").value = sessionData.meta.date || "";
    $("dp-lieu").value = sessionData.meta.lieu || "";
    $("dp-plongee").value = sessionData.meta.plongee || "matin";
    
    // FORCER le rendu
    console.log("🎨 Forçage du rendu...");
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    
    console.log("✅ Session chargée:", sessionKey);
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées affichés`);
    
    // Message utilisateur
    const dpMessage = $("dp-message");
    dpMessage.innerHTML = `✓ Session "${sessionData.meta.dp}" du ${sessionData.meta.date} (${sessionData.meta.plongee || 'matin'}) chargée`;
    dpMessage.style.color = "green";
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
}

// NOUVELLE FONCTION : Populer le sélecteur de sessions  
async function populateSessionSelector() {
  try {
    console.log("🔄 Chargement des sessions disponibles...");
    const sessions = await loadAvailableSessions();
    const selector = $("session-selector");
    
    if (!selector) {
      console.error("❌ Sélecteur de sessions non trouvé");
      return;
    }
    
    // Vider le sélecteur
    selector.innerHTML = '<option value="">-- Charger une session --</option>';
    
    if (sessions.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Aucune session disponible";
      option.disabled = true;
      selector.appendChild(option);
      console.log("ℹ️ Aucune session disponible");
      return;
    }
    
    sessions.forEach(session => {
      const option = document.createElement("option");
      option.value = session.key;
      
      // Format d'affichage amélioré avec type de plongée
      const plongeeType = session.plongee ? ` (${session.plongee})` : '';
      option.textContent = `${session.date}${plongeeType} - ${session.dp} - ${session.stats.nombrePalanquees} palanquées`;
      
      selector.appendChild(option);
    });
    
    console.log("✅ Sélecteur de sessions mis à jour:", sessions.length, "sessions");
  } catch (error) {
    console.error("❌ Erreur lors du peuplement du sélecteur:", error);
  }
}

// ===== EXPORT JSON AMÉLIORÉ =====
function exportToJSON() {
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  const exportData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      version: "2.0.0",
      exportDate: new Date().toISOString()
    },
    plongeurs: plongeurs.map(p => ({
      nom: p.nom,
      niveau: p.niveau,
      prerogatives: p.pre || ""
    })),
    palanquees: palanquees.map((pal, idx) => ({
      numero: idx + 1,
      plongeurs: pal.map(p => ({
        nom: p.nom,
        niveau: p.niveau,
        prerogatives: p.pre || ""
      })),
      alertes: checkAlert(pal) ? checkAllAlerts().filter(a => a.includes(`Palanquée ${idx + 1}`)) : []
    })),
    resume: {
      totalPlongeurs: plongeurs.length + palanquees.flat().length,
      nombrePalanquees: palanquees.length,
      plongeursNonAssignes: plongeurs.length,
      alertesTotal: checkAllAlerts().length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `palanquees-${dpDate || 'export'}-${dpPlongee}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log("📤 Export JSON amélioré effectué");
}

// Render functions
function renderPlongeurs() {
  const liste = $("listePlongeurs");
  if (!liste) return;
  
  liste.innerHTML = "";
  
  if (plongeurs.length === 0) {
    liste.innerHTML = '<li style="text-align: center; color: #666; font-style: italic; padding: 20px;">Aucun plongeur ajouté</li>';
  } else {
    plongeurs.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "plongeur-item";
      li.draggable = true;
      li.dataset.index = i;
      
      li.innerHTML = `
        <div class="plongeur-content">
          <span class="plongeur-nom">${p.nom}</span>
          <span class="plongeur-niveau">${p.niveau}</span>
          <span class="plongeur-prerogatives">[${p.pre || 'Aucune'}]</span>
          <span class="delete-plongeur" title="Supprimer ce plongeur">❌</span>
        </div>
      `;
      
      // Event listeners pour drag & drop - VERSION CORRIGÉE FIREBASE
      li.addEventListener("dragstart", e => {
        console.log("🖱️ Début drag plongeur:", p.nom, "index:", i);
        li.classList.add('dragging');
        
        // IMPORTANT: Stocker les données du plongeur directement, pas l'index
        const plongeurData = {
          type: "fromMainList",
          plongeur: { ...p }, // Clone de l'objet
          originalIndex: i
        };
        
        e.dataTransfer.setData("text/plain", JSON.stringify(plongeurData));
        e.dataTransfer.effectAllowed = "move";
      });
      
      li.addEventListener("dragend", e => {
        li.classList.remove('dragging');
        console.log("🖱️ Fin drag plongeur");
      });
      
      li.querySelector(".delete-plongeur").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Supprimer ${p.nom} de la liste ?`)) {
          plongeurs.splice(i, 1);
          // Mettre à jour la liste originale
          plongeursOriginaux = plongeursOriginaux.filter(po => po.nom !== p.nom);
          syncToDatabase();
        }
      });
      
      liste.appendChild(li);
    });
  }
  
  // Mise à jour des compteurs après rendu
  updateCompteurs();
}

function renderPalanquees() {
  const container = $("palanqueesContainer");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (palanquees.length === 0) return;
  
  palanquees.forEach((palanquee, idx) => {
    const div = document.createElement("div");
    div.className = "palanquee";
    div.dataset.index = idx;
    div.dataset.alert = checkAlert(palanquee) ? "true" : "false";
    
    div.innerHTML = `
      <div class="palanquee-title">
        <span>Palanquée ${idx + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
        <span class="remove-palanquee" style="color: red; cursor: pointer;">❌</span>
      </div>
    `;
    
    if (palanquee.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "palanquee-empty";
      emptyMsg.textContent = "Glissez des plongeurs ici ⬇️";
      div.appendChild(emptyMsg);
    } else {
      const plongeursList = document.createElement("ul");
      plongeursList.className = "palanquee-plongeurs-list";
      
      palanquee.forEach((plg, plongeurIndex) => {
        const li = document.createElement("li");
        li.className = "plongeur-item palanquee-plongeur-item";
        li.draggable = true;
        
        li.innerHTML = `
          <div class="plongeur-content">
            <span class="plongeur-nom">${plg.nom}</span>
            <span class="plongeur-niveau">${plg.niveau}</span>
            <input type="text" class="plongeur-prerogatives-editable" 
                   value="${plg.pre || ''}" 
                   placeholder="PE20, PA40..."
                   data-palanquee-idx="${idx}"
                   data-plongeur-idx="${plongeurIndex}"
                   title="Cliquez pour modifier les prérogatives">
            <span class="return-plongeur" 
                  data-palanquee-idx="${idx}"
                  data-plongeur-idx="${plongeurIndex}"
                  title="Remettre dans la liste">⬅️</span>
          </div>
        `;
        
        // Event listener pour drag & drop - VERSION AMÉLIORÉE
        li.addEventListener("dragstart", e => {
          console.log("🖱️ Début drag depuis palanquée", idx + 1, "plongeur", plongeurIndex, ":", plg.nom);
          li.classList.add('dragging');
          e.dataTransfer.setData("text/plain", JSON.stringify({
            type: "fromPalanquee",
            palanqueeIndex: idx,
            plongeurIndex: plongeurIndex,
            plongeur: plg
          }));
          e.dataTransfer.effectAllowed = "move";
        });
        
        li.addEventListener("dragend", e => {
          li.classList.remove('dragging');
          console.log("🖱️ Fin drag depuis palanquée");
        });
        
        plongeursList.appendChild(li);
      });
      
      div.appendChild(plongeursList);
    }

    // Event listeners
    div.querySelector(".remove-palanquee").addEventListener("click", () => {
      if (confirm(`Supprimer la palanquée ${idx + 1} ?`)) {
        palanquee.forEach(plg => {
          plongeurs.push(plg);
          plongeursOriginaux.push(plg);
        });
        palanquees.splice(idx, 1);
        syncToDatabase();
      }
    });

    div.addEventListener("drop", e => {
      e.preventDefault();
      div.classList.remove('drag-over');
      
      const data = e.dataTransfer.getData("text/plain");
      console.log("🎯 Drop dans palanquée", idx + 1, "data reçue:", data);
      
      try {
        const dragData = JSON.parse(data);
        console.log("📝 Données parsées:", dragData);
        
        if (dragData.type === "fromPalanquee") {
          console.log("🔄 Déplacement entre palanquées détecté");
          if (dragData.palanqueeIndex !== undefined && 
              dragData.plongeurIndex !== undefined && 
              palanquees[dragData.palanqueeIndex] &&
              palanquees[dragData.palanqueeIndex][dragData.plongeurIndex]) {
            
            const sourcePalanquee = palanquees[dragData.palanqueeIndex];
            const plongeur = sourcePalanquee.splice(dragData.plongeurIndex, 1)[0];
            palanquee.push(plongeur);
            console.log("✅ Plongeur déplacé entre palanquées:", plongeur.nom);
            syncToDatabase();
          }
          return;
        }
        
        if (dragData.type === "fromMainList") {
          console.log("📝 Déplacement depuis liste principale détecté");
          // Utiliser les données du plongeur directement
          const plongeurToMove = dragData.plongeur;
          
          // Trouver et supprimer le plongeur de la liste principale
          const indexToRemove = plongeurs.findIndex(p => 
            p.nom === plongeurToMove.nom && p.niveau === plongeurToMove.niveau
          );
          
          if (indexToRemove !== -1) {
            plongeurs.splice(indexToRemove, 1);
            palanquee.push(plongeurToMove);
            console.log("✅ Plongeur ajouté depuis liste principale:", plongeurToMove.nom);
            syncToDatabase();
          } else {
            console.error("❌ Plongeur non trouvé dans la liste principale");
          }
          return;
        }
        
      } catch (error) {
        console.error("❌ Erreur parsing données drag:", error);
      }
    });

    // Drag & drop amélioré
    div.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      div.classList.add('drag-over');
      console.log("🎯 Survol palanquée", idx + 1);
    });
    
    div.addEventListener("dragleave", e => {
      if (!div.contains(e.relatedTarget)) {
        div.classList.remove('drag-over');
        console.log("🎯 Sortie palanquée", idx + 1);
      }
    });

    container.appendChild(div);
  });
  
  setupPalanqueesEventListeners();
  
  // Mise à jour des compteurs après rendu des palanquées
  updateCompteurs();
}

function setupPalanqueesEventListeners() {
  // Event delegation pour les boutons de retour
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("return-plongeur")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        const plongeur = palanquees[palanqueeIdx].splice(plongeurIdx, 1)[0];
        plongeurs.push(plongeur);
        plongeursOriginaux.push(plongeur);
        syncToDatabase();
      }
    }
  });
  
  // Event delegation pour la modification des prérogatives
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      const newPrerogatives = e.target.value.trim();
      
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        palanquees[palanqueeIdx][plongeurIdx].pre = newPrerogatives;
        syncToDatabase();
      }
    }
  });
  
  // Empêcher le drag & drop sur les champs input
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      e.stopPropagation();
    }
  });
}

// ===== FONCTIONS PDF =====
function generatePDFPreview() {
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Palanquées JSAS - ${dpDate} (${dpPlongee})</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #004080; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .meta-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .palanquee { border: 1px solid #dee2e6; margin: 15px 0; padding: 15px; border-radius: 5px; }
        .palanquee-title { font-weight: bold; color: #007bff; font-size: 1.2em; margin-bottom: 10px; }
        .plongeur { margin: 5px 0; padding: 8px; background: #e0f0ff; border-radius: 3px; }
        .alert { background: #fff5f5; border-left: 4px solid #dc3545; padding: 10px; margin: 10px 0; }
        .niveau { background: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.9em; }
        .resume { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>Palanquées JSAS</h1>
      <div class="meta-info">
        <p><strong>Directeur de Plongée :</strong> ${dpNom}</p>
        <p><strong>Date :</strong> ${dpDate}</p>
        <p><strong>Lieu :</strong> ${dpLieu}</p>
        <p><strong>Plongée :</strong> ${dpPlongee}</p>
      </div>
  `;
  
  // Résumé avec compteurs détaillés
  const totalPlongeurs = plongeurs.length + palanquees.reduce((total, pal) => total + pal.length, 0);
  const plongeursEnPalanquees = palanquees.reduce((total, pal) => total + pal.length, 0);
  const alertesTotal = checkAllAlerts();
  
  html += `
    <div class="resume">
      <h3>Résumé détaillé</h3>
      <p><strong>📊 Total des plongeurs :</strong> ${totalPlongeurs}</p>
      <p><strong>🤿 Plongeurs non assignés :</strong> ${plongeurs.length}</p>
      <p><strong>🏊 Plongeurs en palanquées :</strong> ${plongeursEnPalanquees} (dans ${palanquees.length} palanquées)</p>
      <p><strong>⚠️ Nombre d'alertes :</strong> ${alertesTotal.length}</p>
    </div>
  `;
  
  // Alertes
  if (alertesTotal.length > 0) {
    html += '<div class="alert"><h3>⚠️ Alertes</h3><ul>';
    alertesTotal.forEach(alerte => {
      html += `<li>${alerte}</li>`;
    });
    html += '</ul></div>';
  }
  
  // Palanquées
  palanquees.forEach((pal, i) => {
    const isAlert = checkAlert(pal);
    html += `<div class="palanquee${isAlert ? ' alert' : ''}">`;
    html += `<div class="palanquee-title">Palanquée ${i + 1} (${pal.length} plongeur${pal.length > 1 ? 's' : ''})</div>`;
    
    if (pal.length === 0) {
      html += '<p><em>Aucun plongeur assigné</em></p>';
    } else {
      pal.forEach(p => {
        html += `<div class="plongeur">
          <strong>${p.nom}</strong> 
          <span class="niveau">${p.niveau}</span>
          ${p.pre ? `<em> - ${p.pre}</em>` : ''}
        </div>`;
      });
    }
    html += '</div>';
  });
  
  // Plongeurs non assignés
  if (plongeurs.length > 0) {
    html += '<div class="palanquee"><div class="palanquee-title">Plongeurs non assignés</div>';
    plongeurs.forEach(p => {
      html += `<div class="plongeur">
        <strong>${p.nom}</strong> 
        <span class="niveau">${p.niveau}</span>
        ${p.pre ? `<em> - ${p.pre}</em>` : ''}
      </div>`;
    });
    html += '</div>';
  }
  
  html += `
      <div style="margin-top: 40px; text-align: center; font-size: 0.9em; color: #666;">
        <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
        <p>Application Palanquées JSAS v2.1.0</p>
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  $("previewContainer").style.display = "block";
  $("pdfPreview").src = url;
  
  // Scroll vers l'aperçu
  $("previewContainer").scrollIntoView({ behavior: 'smooth' });
}

function exportToPDF() {
  console.log("📄 Génération du PDF professionnel...");
  
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  // Créer le document PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const marginBottom = 30;
  const marginLeft = 20;
  const marginRight = 20;
  
  // Couleurs
  const bleuJSAS = [0, 64, 128];
  const bleuClair = [0, 123, 255];
  const vertSecurite = [40, 167, 69];
  const rougeAlerte = [220, 53, 69];
  const gris = [108, 117, 125];
  
  // Fonction pour ajouter une nouvelle page si nécessaire
  function checkPageBreak(height = 10) {
    if (yPosition + height > pageHeight - marginBottom) {
      doc.addPage();
      yPosition = 20;
      addHeader(); // Ajouter l'en-tête sur chaque page
      return true;
    }
    return false;
  }
  
  // En-tête professionnel
  function addHeader() {
    // Fond bleu pour l'en-tête
    doc.setFillColor(...bleuJSAS);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Titre
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("JSAS", marginLeft, 25);
    
    // Sous-titre
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Gestion des Palanquées", marginLeft + 50, 25);
    
    // Date du document
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 60, 25);
    
    yPosition = 45;
  }
  
  // Ajouter l'en-tête initial
  addHeader();
  
  // Informations de la plongée dans un cadre
  doc.setFillColor(248, 249, 250);
  doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, 35, 'F');
  doc.setDrawColor(...gris);
  doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, 35);
  
  yPosition += 10;
  doc.setTextColor(...bleuJSAS);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DE LA PLONGÉE", marginLeft + 5, yPosition);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Directeur de Plongée : ${dpNom}`, marginLeft + 5, yPosition);
  yPosition += 6;
  doc.text(`Date : ${dpDate}`, marginLeft + 5, yPosition);
  doc.text(`Lieu : ${dpLieu}`, marginLeft + 90, yPosition);
  yPosition += 6;
  doc.text(`Type de plongée : ${dpPlongee}`, marginLeft + 5, yPosition);
  
  yPosition += 15;
  
  // Résumé statistiques dans un tableau
  const totalPlongeurs = plongeurs.length + palanquees.reduce((total, pal) => total + pal.length, 0);
  const plongeursEnPalanquees = palanquees.reduce((total, pal) => total + pal.length, 0);
  const alertesTotal = checkAllAlerts();
  
  checkPageBreak(45);
  
  // Titre résumé
  doc.setTextColor(...bleuClair);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RÉSUMÉ STATISTIQUES", marginLeft, yPosition);
  yPosition += 10;
  
  // Tableau des statistiques
  const tableData = [
    ["Total des plongeurs", totalPlongeurs.toString()],
    ["Plongeurs en palanquées", `${plongeursEnPalanquees} (${palanquees.length} palanquées)`],
    ["Plongeurs non assignés", plongeurs.length.toString()],
    ["Alertes de sécurité", alertesTotal.length.toString()]
  ];
  
  tableData.forEach(([label, value], i) => {
    const isAlert = label.includes("Alertes") && alertesTotal.length > 0;
    
    // Fond alternant
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(marginLeft, yPosition - 2, pageWidth - marginLeft - marginRight, 8, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(label, marginLeft + 2, yPosition + 3);
    
    // Valeur avec couleur selon le type
    if (isAlert) {
      doc.setTextColor(...rougeAlerte);
      doc.setFont("helvetica", "bold");
    } else if (label.includes("palanquées")) {
      doc.setTextColor(...vertSecurite);
      doc.setFont("helvetica", "bold");
    }
    
    doc.text(value, pageWidth - 60, yPosition + 3);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Alertes de sécurité
  if (alertesTotal.length > 0) {
    checkPageBreak(25 + alertesTotal.length * 6);
    
    // Titre alertes avec fond rouge
    doc.setFillColor(...rougeAlerte);
    doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("⚠️ ALERTES DE SÉCURITÉ", marginLeft + 5, yPosition + 8);
    yPosition += 15;
    
    doc.setTextColor(...rougeAlerte);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    alertesTotal.forEach(alerte => {
      doc.text(`• ${alerte}`, marginLeft + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 10;
  }
  
  // Palanquées détaillées
  doc.setTextColor(...bleuClair);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("COMPOSITION DES PALANQUÉES", marginLeft, yPosition);
  yPosition += 15;
  
  palanquees.forEach((pal, i) => {
    const palanqueeHeight = 20 + (pal.length * 6) + (pal.length === 0 ? 8 : 0);
    checkPageBreak(palanqueeHeight);
    
    const isAlert = checkAlert(pal);
    
    // En-tête palanquée
    doc.setFillColor(isAlert ? 255 : 227, isAlert ? 245 : 242, isAlert ? 245 : 253);
    doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, 12, 'F');
    
    if (isAlert) {
      doc.setDrawColor(...rougeAlerte);
      doc.setLineWidth(1);
      doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, 12);
    }
    
    doc.setTextColor(isAlert ? ...rougeAlerte : ...bleuClair);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Palanquée ${i + 1} (${pal.length} plongeur${pal.length > 1 ? 's' : ''})`, marginLeft + 5, yPosition + 8);
    yPosition += 15;
    
    if (pal.length === 0) {
      doc.setTextColor(...gris);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("Aucun plongeur assigné", marginLeft + 10, yPosition);
      yPosition += 8;
    } else {
      pal.forEach((p, idx) => {
        // Icône selon le niveau
        let couleurNiveau = gris;
        if (["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau)) {
          couleurNiveau = vertSecurite; // Guide/Encadrant
        } else if (["N2", "N3"].includes(p.niveau)) {
          couleurNiveau = bleuClair; // Autonome
        }
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${idx + 1}.`, marginLeft + 10, yPosition);
        doc.text(p.nom, marginLeft + 18, yPosition);
        
        // Badge niveau
        doc.setTextColor(...couleurNiveau);
        doc.setFont("helvetica", "bold");
        doc.text(`[${p.niveau}]`, marginLeft + 100, yPosition);
        
        // Prérogatives
        if (p.pre) {
          doc.setTextColor(...gris);
          doc.setFont("helvetica", "normal");
          doc.text(`- ${p.pre}`, marginLeft + 130, yPosition);
        }
        
        yPosition += 6;
      });
    }
    yPosition += 8;
  });
  
  // Plongeurs non assignés
  if (plongeurs.length > 0) {
    const nonAssignesHeight = 20 + (plongeurs.length * 6);
    checkPageBreak(nonAssignesHeight);
    
    doc.setFillColor(255, 243, 205);
    doc.rect(marginLeft, yPosition, pageWidth - marginLeft - marginRight, 12, 'F');
    doc.setTextColor(255, 193, 7);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("⚠️ PLONGEURS NON ASSIGNÉS", marginLeft + 5, yPosition + 8);
    yPosition += 15;
    
    plongeurs.forEach((p, idx) => {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${idx + 1}.`, marginLeft + 10, yPosition);
      doc.text(p.nom, marginLeft + 18, yPosition);
      
      doc.setTextColor(...gris);
      doc.setFont("helvetica", "bold");
      doc.text(`[${p.niveau}]`, marginLeft + 100, yPosition);
      
      if (p.pre) {
        doc.setFont("helvetica", "normal");
        doc.text(`- ${p.pre}`, marginLeft + 130, yPosition);
      }
      
      yPosition += 6;
    });
  }
  
  // Pied de page professionnel sur toutes les pages
  const finalPage = doc.internal.getCurrentPageInfo().pageNumber;
  for (let i = 1; i <= finalPage; i++) {
    doc.setPage(i);
    
    // Ligne de séparation
    doc.setDrawColor(...gris);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, pageHeight - 25, pageWidth - marginRight, pageHeight - 25);
    
    // Informations du pied de page
    doc.setTextColor(...gris);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, marginLeft, pageHeight - 15);
    doc.text(`Application Palanquées JSAS v2.1.0`, marginLeft, pageHeight - 10);
    
    // Numéro de page
    doc.text(`Page ${i} / ${finalPage}`, pageWidth - 40, pageHeight - 15);
    
    // Signature DP
    doc.text("Signature du Directeur de Plongée :", pageWidth - 80, pageHeight - 10);
  }
  
  // Télécharger le PDF
  const fileName = `palanquees-${dpDate || 'export'}-${dpPlongee}.pdf`;
  doc.save(fileName);
  
  console.log("✅ PDF professionnel téléchargé:", fileName);
}

// Setup Event Listeners
function setupEventListeners() {
  // Ajout de plongeur
  addSafeEventListener("addForm", "submit", e => {
    e.preventDefault();
    const nom = $("nom").value.trim();
    const niveau = $("niveau").value;
    const pre = $("pre").value.trim();
    if (!nom || !niveau) {
      alert("Veuillez remplir le nom et le niveau du plongeur.");
      return;
    }
    
    const nouveauPlongeur = { nom, niveau, pre };
    plongeurs.push(nouveauPlongeur);
    plongeursOriginaux.push(nouveauPlongeur);
    
    $("nom").value = "";
    $("niveau").value = "";
    $("pre").value = "";
    
    syncToDatabase();
  });

  // Ajout de palanquée
  addSafeEventListener("addPalanquee", "click", () => {
    palanquees.push([]);
    syncToDatabase();
  });

  // Export JSON amélioré
  addSafeEventListener("exportJSON", "click", exportToJSON);

  // Import JSON
  addSafeEventListener("importJSON", "change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      try {
        const data = JSON.parse(e2.target.result);
        
        // Support de l'ancien format ET du nouveau format
        if (data.plongeurs && Array.isArray(data.plongeurs)) {
          // Nouveau format
          plongeurs = data.plongeurs.map(p => ({
            nom: p.nom,
            niveau: p.niveau,
            pre: p.prerogatives || p.pre || ""
          }));
          
          if (data.palanquees && Array.isArray(data.palanquees)) {
            palanquees = data.palanquees.map(pal => 
              pal.plongeurs ? pal.plongeurs.map(p => ({
                nom: p.nom,
                niveau: p.niveau,
                pre: p.prerogatives || p.pre || ""
              })) : pal
            );
          }
        } else if (Array.isArray(data)) {
          // Ancien format (simple array)
          plongeurs = data;
        }
        
        plongeursOriginaux = [...plongeurs];
        syncToDatabase();
        alert("Import réussi !");
      } catch (error) {
        console.error("Erreur import:", error);
        alert("Erreur lors de l'import du fichier JSON");
      }
    };
    reader.readAsText(file);
  });

  // Génération PDF améliorée
  addSafeEventListener("generatePDF", "click", () => {
    generatePDFPreview();
  });

  // Export PDF - NOUVEAU
  addSafeEventListener("exportPDF", "click", () => {
    exportToPDF();
  });

  // Gestionnaire de sessions - NOUVEAU
  addSafeEventListener("load-session", "click", async () => {
    const sessionKey = $("session-selector").value;
    if (!sessionKey) {
      alert("Veuillez sélectionner une session à charger.");
      return;
    }
    
    const success = await loadSession(sessionKey);
    if (!success) {
      alert("Erreur lors du chargement de la session.");
    }
  });
  
  addSafeEventListener("refresh-sessions", "click", async () => {
    console.log("🔄 Actualisation des sessions...");
    await populateSessionSelector();
    await populateSessionsCleanupList();
  });

  // Test Firebase - NOUVEAU
  addSafeEventListener("test-firebase", "click", async () => {
    console.log("🧪 === TEST FIREBASE COMPLET ===");
    
    try {
      // Test 1: Lecture de sessions
      console.log("📖 Test 1: Lecture /sessions");
      const sessionsRead = await db.ref('sessions').once('value');
      console.log("✅ Lecture sessions OK:", sessionsRead.exists() ? "Données trouvées" : "Aucune donnée");
      
      // Test 2: Écriture dans sessions
      console.log("✏️ Test 2: Écriture /sessions/test");
      await db.ref('sessions/test').set({
        timestamp: Date.now(),
        test: true
      });
      console.log("✅ Écriture sessions/test OK");
      
      // Test 3: Lecture de ce qu'on vient d'écrire
      console.log("📖 Test 3: Relecture sessions/test");
      const testRead = await db.ref('sessions/test').once('value');
      console.log("✅ Relecture OK:", testRead.val());
      
      // Test 4: Sauvegarde session réelle
      console.log("💾 Test 4: Sauvegarde session réelle");
      await saveSessionData();
      
      // Test 5: Lecture des sessions après sauvegarde
      console.log("📖 Test 5: Lecture sessions après sauvegarde");
      const finalRead = await db.ref('sessions').once('value');
      if (finalRead.exists()) {
        const sessions = finalRead.val();
        console.log("✅ Sessions trouvées:", Object.keys(sessions));
      } else {
        console.log("❌ Aucune session après sauvegarde");
      }
      
      alert("Test Firebase terminé - regarde la console !");
      
    } catch (error) {
      console.error("❌ ERREUR TEST FIREBASE:", error);
      alert("Erreur Firebase: " + error.message);
    }
  });

  // Sauvegarde manuelle de session - NOUVEAU  
  addSafeEventListener("save-session", "click", async () => {
    console.log("💾 Sauvegarde manuelle de session...");
    await saveSessionData();
    alert("Session sauvegardée !");
    await populateSessionSelector();
    await populateSessionsCleanupList();
  });

  // === EVENT LISTENERS POUR LE NETTOYAGE - VERSION SÉCURISÉE ===
  
  // Nettoyage des sessions
  addSafeEventListener("select-all-sessions", "click", () => {
    selectAllSessions(true);
  });
  
  addSafeEventListener("select-none-sessions", "click", () => {
    selectAllSessions(false);
  });
  
  addSafeEventListener("delete-selected-sessions", "click", async () => {
    await deleteSelectedSessions();
  });
  
  addSafeEventListener("refresh-sessions-list", "click", async () => {
    await populateSessionsCleanupList();
  });
  
  // Nettoyage des DPs
  addSafeEventListener("select-all-dp", "click", () => {
    selectAllDPs(true);
  });
  
  addSafeEventListener("select-none-dp", "click", () => {
    selectAllDPs(false);
  });
  
  addSafeEventListener("delete-selected-dp", "click", async () => {
    await deleteSelectedDPs();
  });
  
  addSafeEventListener("refresh-dp-list", "click", async () => {
    await populateDPCleanupList();
  });
  
  // Event delegation pour les changements de sélection
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("session-cleanup-checkbox") || 
        e.target.classList.contains("dp-cleanup-checkbox")) {
      updateCleanupSelection();
    }
    
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      const newPrerogatives = e.target.value.trim();
      
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        palanquees[palanqueeIdx][plongeurIdx].pre = newPrerogatives;
        syncToDatabase();
      }
    }
  });

  // Contrôles de tri
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sortPlongeurs(btn.dataset.sort);
    });
  });

  // Drag & drop amélioré pour la zone principale - VERSION CORRIGÉE
  const listePlongeurs = $("listePlongeurs");
  
  if (listePlongeurs) {
    listePlongeurs.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      listePlongeurs.classList.add('drag-over');
      console.log("🎯 Survol liste principale");
    });
    
    listePlongeurs.addEventListener("dragleave", e => {
      if (!listePlongeurs.contains(e.relatedTarget)) {
        listePlongeurs.classList.remove('drag-over');
        console.log("🎯 Sortie liste principale");
      }
    });
    
    listePlongeurs.addEventListener("drop", e => {
      e.preventDefault();
      listePlongeurs.classList.remove('drag-over');
      
      const data = e.dataTransfer.getData("text/plain");
      console.log("🎯 Drop dans liste principale, data:", data);
      
      try {
        const dragData = JSON.parse(data);
        console.log("📝 Données drag parsées:", dragData);
        
        if (dragData.type === "fromPalanquee") {
          console.log("🔄 Retour d'un plongeur depuis palanquée");
          if (palanquees[dragData.palanqueeIndex] && 
              palanquees[dragData.palanqueeIndex][dragData.plongeurIndex]) {
            
            const plongeur = palanquees[dragData.palanqueeIndex].splice(dragData.plongeurIndex, 1)[0];
            plongeurs.push(plongeur);
            plongeursOriginaux.push(plongeur);
            console.log("✅ Plongeur remis dans la liste:", plongeur.nom);
            syncToDatabase();
          } else {
            console.error("❌ Plongeur non trouvé dans la palanquée source");
          }
        } else {
          console.log("📝 Type de drag non reconnu pour retour en liste");
        }
      } catch (error) {
        console.log("📝 Erreur parsing ou pas un drag depuis palanquée:", error);
      }
    });
  }
}

// Chargement de l'historique des DP (Firebase)
function chargerHistoriqueDP() {
  const dpDatesSelect = $("dp-dates");
  const historiqueInfo = $("historique-info");

  if (!dpDatesSelect || !historiqueInfo) {
    console.error("❌ Éléments DOM pour historique DP non trouvés");
    return;
  }

  db.ref("dpInfo").once('value').then((snapshot) => {
    if (snapshot.exists()) {
      const dpInfos = snapshot.val();
      console.log("✅ Historique DP chargé:", Object.keys(dpInfos).length, "entrées");

      // Vider les options existantes (sauf la première)
      dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';

      for (const date in dpInfos) {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dpDatesSelect.appendChild(option);
      }

      dpDatesSelect.addEventListener("change", () => {
        const selectedDate = dpDatesSelect.value;
        if (selectedDate && dpInfos[selectedDate]) {
          const dp = dpInfos[selectedDate];
          historiqueInfo.innerHTML = `
            <p><strong>Nom :</strong> ${dp.nom}</p>
            <p><strong>Lieu :</strong> ${dp.lieu}</p>
          `;
        } else {
          historiqueInfo.innerHTML = "";
        }
      });
    } else {
      console.log("ℹ️ Aucun historique DP trouvé");
    }
  }).catch((error) => {
    console.error("❌ Erreur de lecture de l'historique DP :", error);
  });
}

// ===== INITIALISATION =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Application Palanquées JSAS v2.1.0 - Chargement...");
  
  try {
    // Test de connexion Firebase
    console.log("🔥 Tentative de connexion Firebase...");
    await testFirebaseConnection();
    
    // Définir la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = $("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    // Chargement des infos DP du jour au démarrage
    const dpNomInput = $("dp-nom");
    const dpLieuInput = $("dp-lieu");

    // Tentative de chargement DP depuis Firebase
    console.log("📥 Chargement des données DP...");
    try {
      const snapshot = await db.ref(`dpInfo/${today}_matin`).once('value');
      if (snapshot.exists()) {
        const dpData = snapshot.val();
        console.log("✅ Données DP chargées:", dpData);
        if (dpNomInput) dpNomInput.value = dpData.nom || "";
        if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
        const dpPlongeeInput = $("dp-plongee");
        if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
        const dpMessage = $("dp-message");
        if (dpMessage) {
          dpMessage.textContent = "Informations du jour chargées.";
          dpMessage.style.color = "blue";
        }
      } else {
        console.log("ℹ️ Aucune donnée DP pour aujourd'hui");
      }
    } catch (error) {
      console.error("❌ Erreur de lecture des données DP :", error);
    }

    // Gestionnaire de validation DP
    addSafeEventListener("valider-dp", "click", () => {
      const nomDP = $("dp-nom")?.value?.trim() || "";
      const date = $("dp-date")?.value || "";
      const lieu = $("dp-lieu")?.value?.trim() || "";
      const plongee = $("dp-plongee")?.value || "";
      
      console.log("📝 Validation DP:", nomDP, date, lieu, plongee);

      if (!nomDP || !date || !lieu || !plongee) {
        alert("Veuillez remplir tous les champs du DP.");
        return;
      }

      const dpData = {
        nom: nomDP,
        date: date,
        lieu: lieu,
        plongee: plongee,
        timestamp: Date.now()
      };

      const dpKey = `dpInfo/${date}_${plongee}`;
      
      // Affichage en attente
      const dpMessage = $("dp-message");
      if (dpMessage) {
        dpMessage.textContent = "Enregistrement en cours...";
        dpMessage.style.color = "orange";
      }
      
      db.ref(dpKey).set(dpData)
        .then(() => {
          console.log("✅ Données DP sauvegardées avec succès");
          if (dpMessage) {
            dpMessage.classList.add("success-icon");
            dpMessage.textContent = ` Informations du DP enregistrées avec succès.`;
            dpMessage.style.color = "green";
          }
        })
        .catch((error) => {
          console.error("❌ Erreur Firebase DP:", error);
          if (dpMessage) {
            dpMessage.classList.remove("success-icon");
            dpMessage.textContent = "Erreur lors de l'enregistrement : " + error.message;
            dpMessage.style.color = "red";
          }
        });
    });

    // Chargement de l'historique des DP
    console.log("📜 Chargement historique DP...");
    chargerHistoriqueDP();
    
    // Chargement des données depuis Firebase
    console.log("📊 Chargement des données principales...");
    await loadFromFirebase();
    
    // Charger les sessions disponibles
    console.log("📜 Chargement des sessions...");
    await populateSessionSelector();
    await populateSessionsCleanupList();
    await populateDPCleanupList();
    
    // Setup des event listeners
    console.log("🎛️ Configuration des event listeners...");
    setupEventListeners();
    
    console.log("✅ Application initialisée avec succès!");
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées chargés`);
    console.log(`🔥 Firebase connecté: ${firebaseConnected}`);
    
  } catch (error) {
    console.error("❌ ERREUR CRITIQUE lors de l'initialisation:", error);
    console.error("Stack trace:", error.stack);
    
    // Mode dégradé sans Firebase
    console.log("🔄 Tentative de fonctionnement en mode dégradé...");
    plongeurs = [];
    palanquees = [];
    plongeursOriginaux = [];
    
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    setupEventListeners();
    
    alert("Erreur de connexion Firebase. L'application fonctionne en mode local uniquement.");
  }
});