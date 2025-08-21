// dp-manager.js - Version ultra-simple qui fonctionne

// ===== LISTE DES DP DE BASE =====
const DP_DE_BASE = [
  "AGUIRRE Raoul (E3)",
  "AUBARD Corinne (P5)", 
  "BEST Sébastien (P5)",
  "CABIROL Joël (E3)",
  "CATTEROU Sacha (P5)",
  "DARDER Olivier (P5)",
  "GAUTHIER Christophe (P5)",
  "LE MAOUT Jean-François (P5)",
  "MARTY David (E3)",
  "TROUBADIS Guillaume (P5)"
];

// ===== VARIABLES GLOBALES =====
let DP_LIST = [...DP_DE_BASE];

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function chargerDPDepuisFirebase() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible");
      DP_LIST = [...DP_DE_BASE];
      return;
    }
    
    const snapshot = await db.ref('sessions/dp_list').once('value');
    if (snapshot.exists() && snapshot.val()) {
      const data = snapshot.val();
      if (Array.isArray(data) && data.length > 0) {
        DP_LIST = [...data];
        console.log("✅", DP_LIST.length, "DP chargés depuis Firebase");
      } else {
        DP_LIST = [...DP_DE_BASE];
        console.log("🔧 Données Firebase invalides, utilisation des DP de base");
      }
    } else {
      DP_LIST = [...DP_DE_BASE];
      console.log("🔧 Aucune donnée Firebase, utilisation des DP de base");
    }
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
    DP_LIST = [...DP_DE_BASE];
  }
}

// ===== SAUVEGARDE VERS FIREBASE =====
async function sauvegarderDPVersFirebase() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour sauvegarder");
      return false;
    }
    
    await db.ref('sessions/dp_list').set(DP_LIST);
    console.log("✅ Sauvegarde Firebase réussie -", DP_LIST.length, "DP");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde Firebase:", error);
    return false;
  }
}

// ===== MISE A JOUR DU DROPDOWN =====
function mettreAJourDropdown() {
  const select = document.getElementById("dp-nom");
  if (!select) {
    console.error("❌ Champ dp-nom non trouvé");
    return;
  }
  
  // Sauvegarder la valeur actuelle
  const currentValue = select.value;
  
  // Vider et recréer
  select.innerHTML = '';
  
  // Option par défaut
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
  select.appendChild(defaultOption);
  
  // Ajouter tous les DP
  DP_LIST.forEach(dp => {
    const option = document.createElement('option');
    const nomComplet = dp.split(' (')[0]; // "AGUIRRE Raoul" depuis "AGUIRRE Raoul (E3)"
    option.value = nomComplet;
    option.textContent = dp;
    select.appendChild(option);
  });
  
  // Restaurer la valeur si elle existe encore
  if (currentValue && DP_LIST.some(dp => dp.includes(currentValue))) {
    select.value = currentValue;
  }
  
  console.log("🔄 Dropdown mis à jour avec", DP_LIST.length, "DP");
}

// ===== VERIFICATION ADMIN =====
function isUserAdmin() {
  const ADMIN_EMAILS = [
    'raoul.aguirre64@gmail.com',
    'aubard.c@gmail.com',
    'joelcabirol@gmail.com',
    'david.marty@sfr.fr'
  ];
  
  return currentUser && ADMIN_EMAILS.includes(currentUser.email);
}

// ===== FONCTIONS D'AJOUT/SUPPRESSION DIRECTES =====
function ajouterNouveauDP() {
  if (!isUserAdmin()) {
    alert("❌ Accès non autorisé");
    return;
  }
  
  const nom = prompt("Nom du DP (ex: MARTIN):");
  if (!nom) return;
  
  const prenom = prompt("Prénom du DP (ex: Jean):");
  if (!prenom) return;
  
  const niveau = prompt("Niveau du DP (E3, E4, P5, N5):");
  if (!niveau || !['E3', 'E4', 'P5', 'N5'].includes(niveau.toUpperCase())) {
    alert("❌ Niveau invalide (E3, E4, P5, N5)");
    return;
  }
  
  const nouveauDP = `${nom.trim().toUpperCase()} ${prenom.trim()} (${niveau.toUpperCase()})`;
  
  // Vérifier les doublons
  if (DP_LIST.some(dp => dp.toLowerCase().includes(nom.toLowerCase()) && dp.toLowerCase().includes(prenom.toLowerCase()))) {
    alert('❌ Ce DP existe déjà !');
    return;
  }
  
  // Ajouter à la liste
  DP_LIST.push(nouveauDP);
  mettreAJourDropdown();
  sauvegarderDPVersFirebase();
  
  console.log("✅ DP ajouté:", nouveauDP);
  alert(`✅ DP "${nouveauDP}" ajouté avec succès !`);
}

function supprimerDP() {
  if (!isUserAdmin()) {
    alert("❌ Accès non autorisé");
    return;
  }
  
  if (DP_LIST.length <= 10) {
    alert("❌ Impossible de supprimer les DP de base");
    return;
  }
  
  // Afficher la liste des DP ajoutés (pas les 10 de base)
  const dpAjoutes = DP_LIST.slice(10);
  if (dpAjoutes.length === 0) {
    alert("ℹ️ Aucun DP ajouté à supprimer");
    return;
  }
  
  let message = "Choisissez le DP à supprimer (tapez le numéro):\n\n";
  dpAjoutes.forEach((dp, index) => {
    message += `${index + 1}. ${dp}\n`;
  });
  
  const choix = prompt(message);
  const index = parseInt(choix) - 1;
  
  if (isNaN(index) || index < 0 || index >= dpAjoutes.length) {
    alert("❌ Choix invalide");
    return;
  }
  
  const dpASupprimer = dpAjoutes[index];
  const indexGlobal = DP_LIST.indexOf(dpASupprimer);
  
  if (confirm(`🗑️ Supprimer "${dpASupprimer}" ?`)) {
    DP_LIST.splice(indexGlobal, 1);
    mettreAJourDropdown();
    sauvegarderDPVersFirebase();
    
    console.log("✅ DP supprimé:", dpASupprimer);
    alert(`✅ DP "${dpASupprimer}" supprimé avec succès !`);
  }
}

function resetDP() {
  if (!isUserAdmin()) {
    alert("❌ Accès non autorisé");
    return;
  }
  
  if (confirm('🔄 Remettre la liste aux 10 DP de base ?\n\nTous les DP ajoutés seront supprimés !')) {
    DP_LIST = [...DP_DE_BASE];
    mettreAJourDropdown();
    sauvegarderDPVersFirebase();
    console.log("🔄 Liste remise aux 10 DP de base");
    alert('🔄 Liste remise aux 10 DP de base !');
  }
}

function nettoyerDP() {
  if (!isUserAdmin()) {
    alert("❌ Accès non autorisé");
    return;
  }
  
  console.log("🧹 === NETTOYAGE DES DP ===");
  const avant = DP_LIST.length;
  
  // Supprimer les doublons
  DP_LIST = [...new Set(DP_LIST)];
  
  // Supprimer les DP de test
  DP_LIST = DP_LIST.filter(dp => {
    const dpLower = dp.toLowerCase();
    return !dpLower.includes('test') && 
           !dpLower.includes('nouveau') && 
           !dpLower.includes('demo');
  });
  
  const apres = DP_LIST.length;
  const supprimes = avant - apres;
  
  mettreAJourDropdown();
  sauvegarderDPVersFirebase();
  
  console.log(`✅ Nettoyage terminé: ${supprimes} DP supprimés (${avant} → ${apres})`);
  alert(`🧹 Nettoyage terminé !\n${supprimes} DP supprimés\n${apres} DP restants`);
}

// ===== BOUTONS D'ADMINISTRATION =====
function ajouterBoutonsAdmin() {
  const selectElement = document.getElementById("dp-nom");
  if (!selectElement) return;
  
  // Éviter les doublons
  if (document.getElementById("manage-dp-btn")) return;
  
  // Vérifier les permissions admin
  if (!isUserAdmin()) {
    console.log("🔐 Utilisateur non admin, pas de boutons de gestion");
    return;
  }
  
  // Bouton Ajouter DP
  const addBtn = document.createElement("button");
  addBtn.id = "manage-dp-btn";
  addBtn.innerHTML = "➕ Ajouter DP";
  addBtn.style.cssText = "margin-left: 10px; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  addBtn.onclick = ajouterNouveauDP;
  
  // Bouton Supprimer DP
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = "🗑️ Supprimer DP";
  deleteBtn.style.cssText = "margin-left: 5px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  deleteBtn.onclick = supprimerDP;
  
  // Bouton Nettoyer
  const cleanBtn = document.createElement("button");
  cleanBtn.innerHTML = "🧹 Nettoyer";
  cleanBtn.style.cssText = "margin-left: 5px; padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  cleanBtn.onclick = nettoyerDP;
  
  // Bouton Reset
  const resetBtn = document.createElement("button");
  resetBtn.innerHTML = "🔄 Reset";
  resetBtn.style.cssText = "margin-left: 5px; padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  resetBtn.onclick = resetDP;
  
  // Ajouter les boutons
  selectElement.parentNode.appendChild(addBtn);
  selectElement.parentNode.appendChild(deleteBtn);
  selectElement.parentNode.appendChild(cleanBtn);
  selectElement.parentNode.appendChild(resetBtn);
  
  console.log("✅ Boutons d'administration ajoutés");
}

// ===== INITIALISATION =====
async function initialiserGestionnaireDP() {
  console.log("🚀 Initialisation gestionnaire DP...");
  
  // Charger les DP depuis Firebase
  await chargerDPDepuisFirebase();
  
  // Créer le dropdown
  mettreAJourDropdown();
  
  // Ajouter les boutons admin si nécessaire
  ajouterBoutonsAdmin();
  
  console.log("✅ Gestionnaire DP initialisé avec", DP_LIST.length, "DP");
}

// ===== ATTENDRE L'AUTHENTIFICATION =====
function attendreAuth() {
  if (typeof currentUser !== 'undefined' && currentUser) {
    initialiserGestionnaireDP();
  } else {
    console.log("⏳ Attente authentification...");
    setTimeout(attendreAuth, 1000);
  }
}

// ===== LANCEMENT AUTOMATIQUE =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(attendreAuth, 2000));
} else {
  setTimeout(attendreAuth, 2000);
}

// ===== EXPORTS GLOBAUX =====
window.DP_LIST = DP_LIST;
window.mettreAJourDropdown = mettreAJourDropdown;
window.ajouterNouveauDP = ajouterNouveauDP;
window.supprimerDP = supprimerDP;
window.nettoyerDP = nettoyerDP;
window.resetDP = resetDP;
window.sauvegarderDPVersFirebase = sauvegarderDPVersFirebase;
window.chargerDPDepuisFirebase = chargerDPDepuisFirebase;