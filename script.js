

index.html
178 lignes

html


script.js
2 477 lignes

js


styles.css
440 lignes

css

voici 3 fichiers.
il faudrait rajouter dans la zone palanquée pour chacune des palanquées, une zone de texte pour l'heure de départ, une zone de texte pour la profondeur prévue, une zone de texte pour le temps prévu, une zone de texte pour la profondeur réalisée, une zone de texte pour le temps réalisé et une zone de texte pour les paliers effectués.
et ça doit être repris dans la sortie pdf par fichier pour chacune des palanquées.

peux-tu me remettre ces 3 fichiers modifiés complets en conséquence en ne touchant pas aux commentaires déjà posés ?

Modifier
Je vais modifier vos 3 fichiers pour ajouter les zones de texte demandées pour chaque palanquée. Ces informations seront sauvegardées dans Firebase et apparaîtront dans le PDF.


index.html - Version mise à jour avec champs palanquées
Artéfact interactif 

script.js - Version mise à jour avec champs palanquées
Code 



Continuer

Modifier

script.js - Version mise à jour avec champs palanquées
Code ∙ Version 2 



Continuer

Modifier

script.js - Version mise à jour avec champs palanquées
Code ∙ Version 3 

script.js - Version mise à jour avec champs palanquées
Code ∙ Version 4 




Limite d’utilisation atteinte — votre limite sera réinitialisée à 16:00.



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

// Structure améliorée pour les palanquées avec les nouvelles données
let palanqueesData = [];

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
    
    // Charger les palanquées avec les nouvelles données
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      palanquees = palanqueesSnapshot.val() || [];
      console.log("✅ Palanquées chargées:", palanquees.length);
    }
    
    // Charger les données des palanquées (nouveaux champs)
    const palanqueesDataSnapshot = await db.ref('palanqueesData').once('value');
    if (palanqueesDataSnapshot.exists()) {
      palanqueesData = palanqueesDataSnapshot.val() || [];
      console.log("✅ Données palanquées chargées:", palanqueesData.length);
    } else {
      // Initialiser les données si elles n'existent pas
      palanqueesData = palanquees.map(() => ({
        heureDepart: '',
        profondeurPrevue: '',
        tempsPrevue: '',
        profondeurRealisee: '',
        tempsRealise: '',
        paliers: ''
      }));
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
        db.ref('palanquees').set(palanquees),
        db.ref('palanqueesData').set(palanqueesData)
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
    palanqueesData: palanqueesData, // Ajout des nouvelles données
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

// NOUVELLE FONCTION : Charger les sessions disponibles - VERSION CORRIGÉE
async function loadAvailableSessions() {
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
    palanqueesData = sessionData.palanqueesData || palanquees.map(() => ({
      heureDepart: '',
      profondeurPrevue: '',
      tempsPrevue: '',
      profondeurRealisee: '',
      tempsRealise: '',
      paliers: ''
    }));
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
      donnees: palanqueesData[idx] || {},
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
  
  // S'assurer que palanqueesData a la bonne taille
  while (palanqueesData.length < palanquees.length) {
    palanqueesData.push({
      heureDepart: '',
      profondeurPrevue: '',
      tempsPrevue: '',
      profondeurRealisee: '',
      tempsRealise: '',
      paliers: ''
    });
  }
  
  palanquees.forEach((palanquee, idx) => {
    const div = document.createElement("div");
    div.className = "palanquee";
    div.dataset.index = idx;
    div.dataset.alert = checkAlert(palanquee) ? "true" : "false";
    
    // Récupérer les données de la palanquée
    const palData = palanqueesData[idx] || {
      heureDepart: '',
      profondeurPrevue: '',
      tempsPrevue: '',
      profondeurRealisee: '',
      tempsRealise: '',
      paliers: ''
    };
    
    div.innerHTML = `
      <div class="palanquee-title">
        <span>Palanquée ${idx + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
        <span class="remove-palanquee" style="color: red; cursor: pointer;">❌</span>
      </div>
      
      <div class="palanquee-info-section">
        <div class="palanquee-info-grid">
          <div class="info-item">
            <label>Heure départ:</label>
            <input type="time" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="heureDepart" 
                   value="${palData.heureDepart || ''}" 
                   placeholder="HH:MM">
          </div>
          <div class="info-item">
            <label>Prof. prévue:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="profondeurPrevue" 
                   value="${palData.profondeurPrevue || ''}" 
                   placeholder="20m">
          </div>
          <div class="info-item">
            <label>Temps prévu:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="tempsPrevue" 
                   value="${palData.tempsPrevue || ''}" 
                   placeholder="45min">
          </div>
          <div class="info-item">
            <label>Prof. réalisée:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="profondeurRealisee" 
                   value="${palData.profondeurRealisee || ''}" 
                   placeholder="18m">
          </div>
          <div class="info-item">
            <label>Temps réalisé:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="tempsRealise" 
                   value="${palData.tempsRealise || ''}" 
                   placeholder="40min">
          </div>
          <div class="info-item">
            <label>Paliers:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="paliers" 
                   value="${palData.paliers || ''}" 
                   placeholder="3min à 3m">
          </div>
        </div>
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
        
        // Event listener pour drag & drop - VERSION CORRIGÉE
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
        palanqueesData.splice(idx, 1);
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
    
    // Gérer les changements dans les champs d'info palanquée
    if (e.target.classList.contains("palanquee-info-input")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanquee);
      const field = e.target.dataset.field;
      const value = e.target.value.trim();
      
      if (!palanqueesData[palanqueeIdx]) {
        palanqueesData[palanqueeIdx] = {
          heureDepart: '',
          profondeurPrevue: '',
          tempsPrevue: '',
          profondeurRealisee: '',
          tempsRealise: '',
          paliers: ''
        };
      }
      
      palanqueesData[palanqueeIdx][field] = value;
      syncToDatabase();
      console.log(`✅ Mise à jour palanquée ${palanqueeIdx + 1} - ${field}: ${value}`);
    }
  });
  
  // Empêcher le drag & drop sur les champs input
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable") || 
        e.target.classList.contains("palanquee-info-input")) {
      e.stopPropagation();
    }
  });
}


index.html
178 lignes

html


script.js
2 477 lignes

js


styles.css
440 lignes

css

voici 3 fichiers.
il faudrait rajouter dans la zone palanquée pour chacune des palanquées, une zone de texte pour l'heure de départ, une zone de texte pour la profondeur prévue, une zone de texte pour le temps prévu, une zone de texte pour la profondeur réalisée, une zone de texte pour le temps réalisé et une zone de texte pour les paliers effectués.
et ça doit être repris dans la sortie pdf par fichier pour chacune des palanquées.

peux-tu me remettre ces 3 fichiers modifiés complets en conséquence en ne touchant pas aux commentaires déjà posés ?

Modifier
Je vais modifier vos 3 fichiers pour ajouter les zones de texte demandées pour chaque palanquée. Ces informations seront sauvegardées dans Firebase et apparaîtront dans le PDF.


index.html - Version mise à jour avec champs palanquées
Artéfact interactif 

script.js - Version mise à jour avec champs palanquées
Code 



Continuer

Modifier

script.js - Version mise à jour avec champs palanquées
Code ∙ Version 2 



Continuer

Modifier

script.js - Version mise à jour avec champs palanquées
Code ∙ Version 3 

script.js - Version mise à jour avec champs palanquées
Code ∙ Version 4 




Limite d’utilisation atteinte — votre limite sera réinitialisée à 16:00.



// ===== FONCTIONS PDF =====
function generatePDFPreview() {
  console.log("🎨 Génération de l'aperçu PDF professionnel...");
  
  try {
    const dpNom = $("dp-nom").value || "Non défini";
    const dpDate = $("dp-date").value || "Non définie";
    const dpLieu = $("dp-lieu").value || "Non défini";
    const dpPlongee = $("dp-plongee").value || "matin";
    
    // Calculs statistiques
    const totalPlongeurs = plongeurs.length + palanquees.reduce(function(total, pal) { return total + pal.length; }, 0);
    const plongeursEnPalanquees = palanquees.reduce(function(total, pal) { return total + pal.length; }, 0);
    const alertesTotal = checkAllAlerts();
    
    // Fonction pour formater la date
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    }
    
    // Fonction pour capitaliser
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // CSS pour le document
    const cssStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          min-height: 297mm;
        }
        .header {
          background: linear-gradient(135deg, #004080 0%, #007bff 100%);
          color: white;
          padding: 30px;
          position: relative;
        }
        .header-content { position: relative; z-index: 2; }
        .logo-title {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }
        .main-title {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 2px;
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 25px;
        }
        .meta-item {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 8px;
        }
        .meta-label {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .meta-value {
          font-size: 16px;
          font-weight: 500;
        }
        .content { padding: 40px; }
        .section { margin-bottom: 40px; }
        .section-title {
          font-size: 20px;
          color: #004080;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #007bff;
          position: relative;
        }
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 60px;
          height: 3px;
          background: #28a745;
        }
        .stats-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          border-left: 5px solid #007bff;
          transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-number {
          font-size: 36px;
          font-weight: bold;
          color: #004080;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 14px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .stat-detail {
          font-size: 12px;
          color: #28a745;
          margin-top: 5px;
          font-weight: 500;
        }
        .alerts-section {
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          border-left: 5px solid #dc3545;
        }
        .alerts-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          color: #dc3545;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .alert-item {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #dc3545;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .palanquees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
        }
        .palanquee-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }
        .palanquee-card.has-alert {
          border-color: #dc3545;
          box-shadow: 0 8px 25px rgba(220, 53, 69, 0.2);
        }
        .palanquee-header {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 20px;
        }
        .palanquee-card.has-alert .palanquee-header {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        }
        .palanquee-number {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .palanquee-stats {
          font-size: 14px;
          opacity: 0.9;
        }
        .palanquee-info-box {
          background: #f8f9fa;
          padding: 15px;
          margin: 15px;
          border-radius: 8px;
          border-left: 4px solid #17a2b8;
        }
        .palanquee-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          font-size: 13px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
        }
        .info-label {
          font-weight: bold;
          color: #495057;
        }
        .info-value {
          color: #212529;
        }
        .palanquee-body { padding: 25px; }
        .plongeur-card {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #28a745;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: all 0.3s ease;
        }
        .plongeur-card:hover {
          background: #e9ecef;
          transform: translateX(5px);
        }
        .plongeur-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        .plongeur-info { flex: 1; }
        .plongeur-nom {
          font-weight: 600;
          color: #004080;
          margin-bottom: 2px;
        }
        .plongeur-details {
          font-size: 12px;
          color: #6c757d;
        }
        .niveau-badge {
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .unassigned-section {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border-radius: 12px;
          padding: 25px;
          border-left: 5px solid #ffc107;
        }
        .unassigned-title {
          color: #856404;
          font-size: 18px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .footer {
          background: #343a40;
          color: white;
          padding: 30px;
          text-align: center;
          margin-top: 50px;
        }
        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .footer-section h4 {
          color: #007bff;
          margin-bottom: 10px;
        }
        .footer-bottom {
          border-top: 1px solid #495057;
          padding-top: 20px;
          font-size: 12px;
          opacity: 0.8;
        }
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
          .palanquees-grid { grid-template-columns: 1fr 1fr; }
          .stats-dashboard { grid-template-columns: repeat(4, 1fr); }
          .palanquee-card { break-inside: avoid; margin-bottom: 20px; }
        }
        @media (max-width: 768px) {
          .container { margin: 0; box-shadow: none; }
          .header { padding: 20px; }
          .content { padding: 20px; }
          .palanquees-grid { grid-template-columns: 1fr; }
          .stats-dashboard { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    `;

    // Construction du HTML par parties
    let htmlContent = '';
    
    // En-tête du document
    htmlContent += '<!DOCTYPE html>';
    htmlContent += '<html lang="fr">';
    htmlContent += '<head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + ' (' + capitalize(dpPlongee) + ')</title>';
    htmlContent += cssStyles;
    htmlContent += '</head>';
    htmlContent += '<body>';
    
    // Container principal
    htmlContent += '<div class="container">';
    
    // En-tête
    htmlContent += '<header class="header">';
    htmlContent += '<div class="header-content">';
    htmlContent += '<div class="logo-title">';
    htmlContent += '<div class="logo">🤿</div>';
    htmlContent += '<div>';
    htmlContent += '<h1 class="main-title">PALANQUÉES JSAS</h1>';
    htmlContent += '<p class="subtitle">Organisation Associative de Plongée</p>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="meta-grid">';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Directeur de Plongée</div>';
    htmlContent += '<div class="meta-value">' + dpNom + '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Date de Plongée</div>';
    htmlContent += '<div class="meta-value">' + formatDateFrench(dpDate) + '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Lieu</div>';
    htmlContent += '<div class="meta-value">' + dpLieu + '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Session</div>';
    htmlContent += '<div class="meta-value">' + capitalize(dpPlongee) + '</div>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    
    htmlContent += '</div>';
    htmlContent += '</header>';
    
    // Contenu principal
    htmlContent += '<main class="content">';
    
    // Section statistiques
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Tableau de Bord</h2>';
    htmlContent += '<div class="stats-dashboard">';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + totalPlongeurs + '</div>';
    htmlContent += '<div class="stat-label">Total Plongeurs</div>';
    htmlContent += '<div class="stat-detail">Tous niveaux confondus</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + palanquees.length + '</div>';
    htmlContent += '<div class="stat-label">Palanquées</div>';
    htmlContent += '<div class="stat-detail">Taille moyenne: ' + (palanquees.length > 0 ? (plongeursEnPalanquees / palanquees.length).toFixed(1) : 0) + '</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + plongeursEnPalanquees + '</div>';
    htmlContent += '<div class="stat-label">Assignés</div>';
    htmlContent += '<div class="stat-detail">' + (totalPlongeurs > 0 ? ((plongeursEnPalanquees/totalPlongeurs)*100).toFixed(1) : 0) + '% du total</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + alertesTotal.length + '</div>';
    htmlContent += '<div class="stat-label">Alertes</div>';
    htmlContent += '<div class="stat-detail">' + (alertesTotal.length === 0 ? 'Tout est OK ✅' : 'Attention requise ⚠️') + '</div>';
    htmlContent += '</div>';
    
    htmlContent += '</div>';
    htmlContent += '</section>';
    
    // Section alertes
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<div class="alerts-section">';
      htmlContent += '<h3 class="alerts-title">';
      htmlContent += '<span>⚠️</span>';
      htmlContent += '<span>Alertes de Sécurité (' + alertesTotal.length + ')</span>';
      htmlContent += '</h3>';
      
      for (let i = 0; i < alertesTotal.length; i++) {
        htmlContent += '<div class="alert-item">' + alertesTotal[i] + '</div>';
      }
      
      htmlContent += '</div>';
      htmlContent += '</section>';
    }
    
    // Section palanquées
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">🏊‍♂️ Organisation des Palanquées</h2>';
    
    if (palanquees.length === 0) {
      htmlContent += '<div class="unassigned-section">';
      htmlContent += '<div class="unassigned-title">Aucune palanquée créée</div>';
      htmlContent += '<p>Tous les plongeurs sont encore en attente d\'assignation.</p>';
      htmlContent += '</div>';
    } else {
      htmlContent += '<div class="palanquees-grid">';
      
      for (let i = 0; i < palanquees.length; i++) {
        const pal = palanquees[i];
        const palData = palanqueesData[i] || {};
        const isAlert = checkAlert(pal);
        const gps = pal.filter(function(p) { return ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau); });
        const n1s = pal.filter(function(p) { return p.niveau === "N1"; });
        const autonomes = pal.filter(function(p) { return ["N2", "N3"].includes(p.niveau); });
        
        htmlContent += '<div class="palanquee-card' + (isAlert ? ' has-alert' : '') + '">';
        htmlContent += '<div class="palanquee-header">';
        htmlContent += '<div class="palanquee-number">Palanquée ' + (i + 1) + '</div>';
        htmlContent += '<div class="palanquee-stats">';
        htmlContent += pal.length + ' plongeur' + (pal.length > 1 ? 's' : '') + ' • ';
        htmlContent += gps.length + ' GP • ' + n1s.length + ' N1 • ' + autonomes.length + ' Autonomes';
        htmlContent += '</div>';
        htmlContent += '</div>';
        
        // Nouvelle section informations de plongée
        if (palData.heureDepart || palData.profondeurPrevue || palData.tempsPrevue || 
            palData.profondeurRealisee || palData.tempsRealise || palData.paliers) {
          htmlContent += '<div class="palanquee-info-box">';
          htmlContent += '<div class="palanquee-info-grid">';
          
          if (palData.heureDepart || palData.profondeurPrevue || palData.tempsPrevue) {
            htmlContent += '<div>';
            htmlContent += '<strong style="color: #007bff;">Planifié:</strong><br>';
            if (palData.heureDepart) htmlContent += '<div class="info-row"><span class="info-label">Départ:</span> <span class="info-value">' + palData.heureDepart + '</span></div>';
            if (palData.profondeurPrevue) htmlContent += '<div class="info-row"><span class="info-label">Profondeur:</span> <span class="info-value">' + palData.profondeurPrevue + '</span></div>';
            if (palData.tempsPrevue) htmlContent += '<div class="info-row"><span class="info-label">Temps:</span> <span class="info-value">' + palData.tempsPrevue + '</span></div>';
            htmlContent += '</div>';
          }
          
          if (palData.profondeurRealisee || palData.tempsRealise || palData.paliers) {
            htmlContent += '<div>';
            htmlContent += '<strong style="color: #28a745;">Réalisé:</strong><br>';
            if (palData.profondeurRealisee) htmlContent += '<div class="info-row"><span class="info-label">Profondeur:</span> <span class="info-value">' + palData.profondeurRealisee + '</span></div>';
            if (palData.tempsRealise) htmlContent += '<div class="info-row"><span class="info-label">Temps:</span> <span class="info-value">' + palData.tempsRealise + '</span></div>';
            if (palData.paliers) htmlContent += '<div class="info-row"><span class="info-label">Paliers:</span> <span class="info-value">' + palData.paliers + '</span></div>';
            htmlContent += '</div>';
          }
          
          htmlContent += '</div>';
          htmlContent += '</div>';
        }
        
        htmlContent += '<div class="palanquee-body">';
        
        if (pal.length === 0) {
          htmlContent += '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun plongeur assigné</p>';
        } else {
          for (let j = 0; j < pal.length; j++) {
            const p = pal[j];
            const initiales = p.nom.split(' ').map(function(n) { return n.charAt(0); }).join('').substring(0, 2).toUpperCase();
            
            let niveauColor = '#6c757d';
            if (p.niveau === 'N1') niveauColor = '#17a2b8';
            else if (p.niveau === 'N2') niveauColor = '#28a745';
            else if (p.niveau === 'N3') niveauColor = '#ffc107';
            else if (p.niveau === 'N4/GP') niveauColor = '#fd7e14';
            else if (p.niveau === 'E1') niveauColor = '#6f42c1';
            else if (p.niveau === 'E2') niveauColor = '#e83e8c';
            else if (p.niveau === 'E3') niveauColor = '#dc3545';
            else if (p.niveau === 'E4') niveauColor = '#343a40';
            
            htmlContent += '<div class="plongeur-card">';
            htmlContent += '<div class="plongeur-avatar">' + initiales + '</div>';
            htmlContent += '<div class="plongeur-info">';
            htmlContent += '<div class="plongeur-nom">' + p.nom + '</div>';
            htmlContent += '<div class="plongeur-details">' + (p.pre || 'Aucune prérogative spécifiée') + '</div>';
            htmlContent += '</div>';
            htmlContent += '<div class="niveau-badge" style="background: ' + niveauColor + '">' + p.niveau + '</div>';
            htmlContent += '</div>';
          }
        }
        
        htmlContent += '</div>';
        htmlContent += '</div>';
      }
      
      htmlContent += '</div>';
    }
    
    htmlContent += '</section>';
    
    // Section plongeurs non assignés
    if (plongeurs.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<div class="unassigned-section">';
      htmlContent += '<h3 class="unassigned-title">⏳ Plongeurs en Attente d\'Assignation (' + plongeurs.length + ')</h3>';
      htmlContent += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">';
      
      for (let i = 0; i < plongeurs.length; i++) {
        const p = plongeurs[i];
        const initiales = p.nom.split(' ').map(function(n) { return n.charAt(0); }).join('').substring(0, 2).toUpperCase();
        
        let niveauColor = '#6c757d';
        if (p.niveau === 'N1') niveauColor = '#17a2b8';
        else if (p.niveau === 'N2') niveauColor = '#28a745';
        else if (p.niveau === 'N3') niveauColor = '#ffc107';
        else if (p.niveau === 'N4/GP') niveauColor = '#fd7e14';
        else if (p.niveau === 'E1') niveauColor = '#6f42c1';
        else if (p.niveau === 'E2') niveauColor = '#e83e8c';
        else if (p.niveau === 'E3') niveauColor = '#dc3545';
        else if (p.niveau === 'E4') niveauColor = '#343a40';
        
        htmlContent += '<div class="plongeur-card">';
        htmlContent += '<div class="plongeur-avatar">' + initiales + '</div>';
        htmlContent += '<div class="plongeur-info">';
        htmlContent += '<div class="plongeur-nom">' + p.nom + '</div>';
        htmlContent += '<div class="plongeur-details">' + (p.pre || 'Aucune prérogative spécifiée') + '</div>';
        htmlContent += '</div>';
        htmlContent += '<div class="niveau-badge" style="background: ' + niveauColor + '">' + p.niveau + '</div>';
        htmlContent += '</div>';
      }
      
      htmlContent += '</div>';
      htmlContent += '</div>';
      htmlContent += '</section>';
    }
    
    htmlContent += '</main>';
    
    // Footer
    htmlContent += '<footer class="footer">';
    htmlContent += '<div class="footer-content">';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>📋 Informations Légales</h4>';
    htmlContent += '<p>Document officiel généré par l\'application Palanquées JSAS</p>';
    htmlContent += '<p>Conforme aux standards FFESSM</p>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>🔒 Sécurité</h4>';
    htmlContent += '<p>Vérification des prérogatives obligatoire</p>';
    htmlContent += '<p>Respect des ratios d\'encadrement</p>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>📞 Contact</h4>';
    htmlContent += '<p>JSAS - Club associatif de Plongée</p>';
    htmlContent += '<p>En cas d\'urgence: contacter le DP</p>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>⚙️ Technique</h4>';
    htmlContent += '<p>Version: 2.1.3 Professional</p>';
    htmlContent += '<p>Dernière mise à jour: ' + new Date().toLocaleDateString('fr// Firebase configuration (méthode classique)
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

// Structure améliorée pour les palanquées avec les nouvelles données
let palanqueesData = [];

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
    
    // Charger les palanquées avec les nouvelles données
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      palanquees = palanqueesSnapshot.val() || [];
      console.log("✅ Palanquées chargées:", palanquees.length);
    }
    
    // Charger les données des palanquées (nouveaux champs)
    const palanqueesDataSnapshot = await db.ref('palanqueesData').once('value');
    if (palanqueesDataSnapshot.exists()) {
      palanqueesData = palanqueesDataSnapshot.val() || [];
      console.log("✅ Données palanquées chargées:", palanqueesData.length);
    } else {
      // Initialiser les données si elles n'existent pas
      palanqueesData = palanquees.map(() => ({
        heureDepart: '',
        profondeurPrevue: '',
        tempsPrevue: '',
        profondeurRealisee: '',
        tempsRealise: '',
        paliers: ''
      }));
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
        db.ref('palanquees').set(palanquees),
        db.ref('palanqueesData').set(palanqueesData)
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
    palanqueesData: palanqueesData, // Ajout des nouvelles données
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

// NOUVELLE FONCTION : Charger les sessions disponibles - VERSION CORRIGÉE
async function loadAvailableSessions() {
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
    palanqueesData = sessionData.palanqueesData || palanquees.map(() => ({
      heureDepart: '',
      profondeurPrevue: '',
      tempsPrevue: '',
      profondeurRealisee: '',
      tempsRealise: '',
      paliers: ''
    }));
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
      donnees: palanqueesData[idx] || {},
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
  
  // S'assurer que palanqueesData a la bonne taille
  while (palanqueesData.length < palanquees.length) {
    palanqueesData.push({
      heureDepart: '',
      profondeurPrevue: '',
      tempsPrevue: '',
      profondeurRealisee: '',
      tempsRealise: '',
      paliers: ''
    });
  }
  
  palanquees.forEach((palanquee, idx) => {
    const div = document.createElement("div");
    div.className = "palanquee";
    div.dataset.index = idx;
    div.dataset.alert = checkAlert(palanquee) ? "true" : "false";
    
    // Récupérer les données de la palanquée
    const palData = palanqueesData[idx] || {
      heureDepart: '',
      profondeurPrevue: '',
      tempsPrevue: '',
      profondeurRealisee: '',
      tempsRealise: '',
      paliers: ''
    };
    
    div.innerHTML = `
      <div class="palanquee-title">
        <span>Palanquée ${idx + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
        <span class="remove-palanquee" style="color: red; cursor: pointer;">❌</span>
      </div>
      
      <div class="palanquee-info-section">
        <div class="palanquee-info-grid">
          <div class="info-item">
            <label>Heure départ:</label>
            <input type="time" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="heureDepart" 
                   value="${palData.heureDepart || ''}" 
                   placeholder="HH:MM">
          </div>
          <div class="info-item">
            <label>Prof. prévue:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="profondeurPrevue" 
                   value="${palData.profondeurPrevue || ''}" 
                   placeholder="20m">
          </div>
          <div class="info-item">
            <label>Temps prévu:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="tempsPrevue" 
                   value="${palData.tempsPrevue || ''}" 
                   placeholder="45min">
          </div>
          <div class="info-item">
            <label>Prof. réalisée:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="profondeurRealisee" 
                   value="${palData.profondeurRealisee || ''}" 
                   placeholder="18m">
          </div>
          <div class="info-item">
            <label>Temps réalisé:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="tempsRealise" 
                   value="${palData.tempsRealise || ''}" 
                   placeholder="40min">
          </div>
          <div class="info-item">
            <label>Paliers:</label>
            <input type="text" class="palanquee-info-input" 
                   data-palanquee="${idx}" 
                   data-field="paliers" 
                   value="${palData.paliers || ''}" 
                   placeholder="3min à 3m">
          </div>
        </div>
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
        
        // Event listener pour drag & drop - VERSION CORRIGÉE
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
        palanqueesData.splice(idx, 1);
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
    
    // Gérer les changements dans les champs d'info palanquée
    if (e.target.classList.contains("palanquee-info-input")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanquee);
      const field = e.target.dataset.field;
      const value = e.target.value.trim();
      
      if (!palanqueesData[palanqueeIdx]) {
        palanqueesData[palanqueeIdx] = {
          heureDepart: '',
          profondeurPrevue: '',
          tempsPrevue: '',
          profondeurRealisee: '',
          tempsRealise: '',
          paliers: ''
        };
      }
      
      palanqueesData[palanqueeIdx][field] = value;
      syncToDatabase();
      console.log(`✅ Mise à jour palanquée ${palanqueeIdx + 1} - ${field}: ${value}`);
    }
  });
  
  // Empêcher le drag & drop sur les champs input
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable") || 
        e.target.classList.contains("palanquee-info-input")) {
      e.stopPropagation();
    }
  });
}
