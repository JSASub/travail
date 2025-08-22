// dp-management.js - Gestionnaire automatisé des DP

// ===== DONNÉES DES DP =====
const DP_LIST = [
  { nom: "AGUIRRE Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com" },
  { nom: "AUBARD Corinne", niveau: "P5", email: "aubard.c@gmail.com" },
  { nom: "BEST Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr" },
  { nom: "CABIROL Joël", niveau: "E3", email: "joelcabirol@gmail.com" },
  { nom: "CATTEROU Sacha", niveau: "P5", email: "sacha.catterou@orange.fr" },
  { nom: "DARDER Olivier", niveau: "P5", email: "olivierdarder@gmail.com" },
  { nom: "GAUTHIER Christophe", niveau: "P5", email: "jsasubaquatique24@gmail.com" },
  { nom: "LE MAOUT Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr" },
  { nom: "MARTY David", niveau: "E3", email: "david.marty@sfr.fr" },
  { nom: "TROUBADIS Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com" }
];

// Variables globales
let dpDatabase = [];
let selectedDPIndex = -1;

// ===== INITIALISATION =====
async function initializeDPManager() {
  console.log("🎯 Initialisation du gestionnaire DP automatisé...");
  
  try {
    // Charger les DP depuis Firebase ou initialiser avec la liste par défaut
    await loadDPFromFirebase();
    
    // Créer l'interface
    createDPInterface();
    
    // Configurer les event listeners
    setupDPEventListeners();
    
    console.log("✅ Gestionnaire DP automatisé initialisé");
    
  } catch (error) {
    console.error("❌ Erreur initialisation gestionnaire DP:", error);
  }
}

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function loadDPFromFirebase() {
  try {
    if (typeof db !== 'undefined' && db) {
      const snapshot = await db.ref('dp_database').once('value');
      
      if (snapshot.exists()) {
        dpDatabase = snapshot.val();
        console.log(`✅ ${dpDatabase.length} DP chargés depuis Firebase`);
      } else {
        // Première initialisation - utiliser la liste par défaut
        dpDatabase = [...DP_LIST].sort((a, b) => a.nom.localeCompare(b.nom));
        await saveDPToFirebase();
        console.log("✅ Base DP initialisée avec la liste par défaut");
      }
    } else {
      // Mode hors ligne - utiliser la liste par défaut
      dpDatabase = [...DP_LIST].sort((a, b) => a.nom.localeCompare(b.nom));
      console.warn("⚠️ Firebase non disponible, utilisation de la liste par défaut");
    }
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    dpDatabase = [...DP_LIST].sort((a, b) => a.nom.localeCompare(b.nom));
  }
}

// ===== SAUVEGARDE DANS FIREBASE =====
async function saveDPToFirebase() {
  try {
    if (typeof db !== 'undefined' && db) {
      await db.ref('dp_database').set(dpDatabase);
      console.log("✅ Base DP sauvegardée dans Firebase");
    }
  } catch (error) {
    console.error("❌ Erreur sauvegarde DP:", error);
  }
}

// ===== CRÉATION DE L'INTERFACE =====
function createDPInterface() {
  const dpNomField = document.getElementById("dp-nom");
  if (!dpNomField) return;
  
  // Créer le conteneur principal
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  `;
  
  // Créer la liste déroulante
  const selectDP = document.createElement("select");
  selectDP.id = "dp-select";
  selectDP.style.cssText = `
    flex: 1;
    min-width: 200px;
    padding: 8px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
  `;
  
  // Créer les boutons de gestion
  const btnAdd = document.createElement("button");
  btnAdd.id = "dp-add-btn";
  btnAdd.type = "button";
  btnAdd.innerHTML = "➕ Ajouter";
  btnAdd.style.cssText = `
    padding: 8px 12px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  `;
  
  const btnEdit = document.createElement("button");
  btnEdit.id = "dp-edit-btn";
  btnEdit.type = "button";
  btnEdit.innerHTML = "✏️ Modifier";
  btnEdit.style.cssText = `
    padding: 8px 12px;
    background: #ffc107;
    color: #212529;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  `;
  
  const btnDelete = document.createElement("button");
  btnDelete.id = "dp-delete-btn";
  btnDelete.type = "button";
  btnDelete.innerHTML = "🗑️ Supprimer";
  btnDelete.style.cssText = `
    padding: 8px 12px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  `;
  
  // Assembler l'interface
  container.appendChild(selectDP);
  container.appendChild(btnAdd);
  container.appendChild(btnEdit);
  container.appendChild(btnDelete);
  
  // Remplacer le champ de texte par le nouveau conteneur
  dpNomField.parentNode.replaceChild(container, dpNomField);
  
  // Populer la liste
  populateDPSelect();
}

// ===== POPULATION DE LA LISTE DÉROULANTE =====
function populateDPSelect() {
  const selectDP = document.getElementById("dp-select");
  if (!selectDP) return;
  
  // Vider la liste
  selectDP.innerHTML = "";
  
  // Option par défaut
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Sélectionner un Directeur de Plongée --";
  selectDP.appendChild(defaultOption);
  
  // Ajouter tous les DP triés par nom
  dpDatabase.forEach((dp, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${dp.nom} (${dp.niveau})`;
    selectDP.appendChild(option);
  });
  
  // Mettre à jour l'état des boutons
  updateButtonStates();
}

// ===== MISE À JOUR DE L'ÉTAT DES BOUTONS =====
function updateButtonStates() {
  const selectDP = document.getElementById("dp-select");
  const btnEdit = document.getElementById("dp-edit-btn");
  const btnDelete = document.getElementById("dp-delete-btn");
  
  if (!selectDP || !btnEdit || !btnDelete) return;
  
  const hasSelection = selectDP.value !== "";
  
  btnEdit.disabled = !hasSelection;
  btnDelete.disabled = !hasSelection;
  
  if (hasSelection) {
    btnEdit.style.opacity = "1";
    btnEdit.style.cursor = "pointer";
    btnDelete.style.opacity = "1";
    btnDelete.style.cursor = "pointer";
  } else {
    btnEdit.style.opacity = "0.5";
    btnEdit.style.cursor = "not-allowed";
    btnDelete.style.opacity = "0.5";
    btnDelete.style.cursor = "not-allowed";
  }
}

// ===== CONFIGURATION DES EVENT LISTENERS =====
function setupDPEventListeners() {
  const selectDP = document.getElementById("dp-select");
  const btnAdd = document.getElementById("dp-add-btn");
  const btnEdit = document.getElementById("dp-edit-btn");
  const btnDelete = document.getElementById("dp-delete-btn");
  
  if (selectDP) {
    selectDP.addEventListener("change", () => {
      selectedDPIndex = selectDP.value !== "" ? parseInt(selectDP.value) : -1;
      updateButtonStates();
    });
  }
  
  if (btnAdd) {
    btnAdd.addEventListener("click", openAddDPModal);
  }
  
  if (btnEdit) {
    btnEdit.addEventListener("click", openEditDPModal);
  }
  
  if (btnDelete) {
    btnDelete.addEventListener("click", confirmDeleteDP);
  }
}

// ===== MODAL D'AJOUT/MODIFICATION =====
function openAddDPModal() {
  showDPModal("Ajouter un nouveau DP", null, addDP);
}

function openEditDPModal() {
  if (selectedDPIndex >= 0 && selectedDPIndex < dpDatabase.length) {
    const dp = dpDatabase[selectedDPIndex];
    showDPModal("Modifier le DP", dp, editDP);
  }
}

function showDPModal(title, dpData, callback) {
  // Créer le modal
  const modal = document.createElement("div");
  modal.id = "dp-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  `;
  
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 25px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  
  modalContent.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: #004080;">${title}</h3>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nom et Prénom :</label>
      <input type="text" id="modal-dp-nom" value="${dpData?.nom || ''}" 
             style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
             placeholder="NOM Prénom" />
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Niveau :</label>
      <select id="modal-dp-niveau" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="E4" ${dpData?.niveau === 'E4' ? 'selected' : ''}>E4</option>
		<option value="E3" ${dpData?.niveau === 'E3' ? 'selected' : ''}>E3</option>
        <option value="P5" ${dpData?.niveau === 'P5' ? 'selected' : ''}>P5</option>
      </select>
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email :</label>
      <input type="email" id="modal-dp-email" value="${dpData?.email || ''}" 
             style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
             placeholder="email@exemple.fr" />
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="modal-cancel" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Annuler
      </button>
      <button id="modal-save" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Enregistrer
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Event listeners du modal
  document.getElementById("modal-cancel").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById("modal-save").addEventListener("click", () => {
    const nom = document.getElementById("modal-dp-nom").value.trim();
    const niveau = document.getElementById("modal-dp-niveau").value;
    const email = document.getElementById("modal-dp-email").value.trim();
    
    if (!nom || !email) {
      alert("⚠️ Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    if (!isValidEmail(email)) {
      alert("⚠️ Format d'email invalide");
      return;
    }
    
    callback({ nom, niveau, email });
    document.body.removeChild(modal);
  });
  
  // Fermer avec Échap
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.body.removeChild(modal);
    }
  });
  
  // Focus sur le nom
  document.getElementById("modal-dp-nom").focus();
}

// ===== FONCTIONS DE GESTION DES DP =====
async function addDP(dpData) {
  try {
    // Vérifier les doublons
    const exists = dpDatabase.some(dp => 
      dp.nom.toLowerCase() === dpData.nom.toLowerCase() ||
      dp.email.toLowerCase() === dpData.email.toLowerCase()
    );
    
    if (exists) {
      alert("⚠️ Un DP avec ce nom ou cet email existe déjà");
      return;
    }
    
    // Ajouter le nouveau DP
    dpDatabase.push(dpData);
    
    // Trier par nom
    dpDatabase.sort((a, b) => a.nom.localeCompare(b.nom));
    
    // Sauvegarder
    await saveDPToFirebase();
    
    // Mettre à jour l'interface
    populateDPSelect();
    
    // Sélectionner le nouveau DP
    const newIndex = dpDatabase.findIndex(dp => dp.nom === dpData.nom);
    if (newIndex >= 0) {
      document.getElementById("dp-select").value = newIndex;
      selectedDPIndex = newIndex;
      updateButtonStates();
    }
    
    console.log("✅ DP ajouté:", dpData.nom);
    
  } catch (error) {
    console.error("❌ Erreur ajout DP:", error);
    alert("❌ Erreur lors de l'ajout du DP");
  }
}

async function editDP(dpData) {
  try {
    if (selectedDPIndex < 0 || selectedDPIndex >= dpDatabase.length) {
      alert("❌ Erreur de sélection");
      return;
    }
    
    // Vérifier les doublons (sauf pour le DP actuel)
    const exists = dpDatabase.some((dp, index) => 
      index !== selectedDPIndex && (
        dp.nom.toLowerCase() === dpData.nom.toLowerCase() ||
        dp.email.toLowerCase() === dpData.email.toLowerCase()
      )
    );
    
    if (exists) {
      alert("⚠️ Un autre DP avec ce nom ou cet email existe déjà");
      return;
    }
    
    // Modifier le DP
    dpDatabase[selectedDPIndex] = dpData;
    
    // Trier par nom
    dpDatabase.sort((a, b) => a.nom.localeCompare(b.nom));
    
    // Sauvegarder
    await saveDPToFirebase();
    
    // Mettre à jour l'interface
    populateDPSelect();
    
    // Resélectionner le DP modifié
    const newIndex = dpDatabase.findIndex(dp => dp.nom === dpData.nom);
    if (newIndex >= 0) {
      document.getElementById("dp-select").value = newIndex;
      selectedDPIndex = newIndex;
      updateButtonStates();
    }
    
    console.log("✅ DP modifié:", dpData.nom);
    
  } catch (error) {
    console.error("❌ Erreur modification DP:", error);
    alert("❌ Erreur lors de la modification du DP");
  }
}

async function confirmDeleteDP() {
  if (selectedDPIndex < 0 || selectedDPIndex >= dpDatabase.length) {
    alert("❌ Aucun DP sélectionné");
    return;
  }
  
  const dp = dpDatabase[selectedDPIndex];
  const confirmed = confirm(`⚠️ Supprimer le DP "${dp.nom}" ?\n\nCette action est irréversible.`);
  
  if (confirmed) {
    await deleteDP();
  }
}

async function deleteDP() {
  try {
    const deletedDP = dpDatabase[selectedDPIndex];
    
    // Supprimer de la base
    dpDatabase.splice(selectedDPIndex, 1);
    
    // Sauvegarder
    await saveDPToFirebase();
    
    // Mettre à jour l'interface
    populateDPSelect();
    
    // Réinitialiser la sélection
    selectedDPIndex = -1;
    document.getElementById("dp-select").value = "";
    updateButtonStates();
    
    console.log("✅ DP supprimé:", deletedDP.nom);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("❌ Erreur lors de la suppression du DP");
  }
}

// ===== FONCTIONS UTILITAIRES =====
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getSelectedDP() {
  const selectDP = document.getElementById("dp-select");
  if (!selectDP || selectDP.value === "") return null;
  
  const index = parseInt(selectDP.value);
  return dpDatabase[index] || null;
}

// ===== INTÉGRATION AVEC LE SYSTÈME EXISTANT =====
function getDPNomForSaving() {
  const selectedDP = getSelectedDP();
  return selectedDP ? selectedDP.nom : "";
}

// Remplacer les fonctions existantes qui récupèrent le nom du DP
function patchExistingDPFunctions() {
  // Intercepter les fonctions qui utilisent dp-nom
  const originalSaveSessionData = window.saveSessionData;
  if (originalSaveSessionData) {
    window.saveSessionData = async function() {
      // Temporairement créer un champ dp-nom virtuel
      const virtualInput = document.createElement("input");
      virtualInput.id = "dp-nom";
      virtualInput.value = getDPNomForSaving();
      virtualInput.style.display = "none";
      document.body.appendChild(virtualInput);
      
      try {
        await originalSaveSessionData.apply(this, arguments);
      } finally {
        document.body.removeChild(virtualInput);
      }
    };
  }
  
  // Intercepter validateAndSaveDP
  const originalValidateAndSaveDP = window.validateAndSaveDP;
  if (originalValidateAndSaveDP) {
    window.validateAndSaveDP = async function() {
      const selectedDP = getSelectedDP();
      if (!selectedDP) {
        alert("⚠️ Veuillez sélectionner un Directeur de Plongée");
        return false;
      }
      
      // Créer temporairement les champs virtuels
      const virtualNom = document.createElement("input");
      virtualNom.id = "dp-nom";
      virtualNom.value = selectedDP.nom;
      virtualNom.style.display = "none";
      document.body.appendChild(virtualNom);
      
      try {
        return await originalValidateAndSaveDP.apply(this, arguments);
      } finally {
        document.body.removeChild(virtualNom);
      }
    };
  }
}

// ===== INITIALISATION AUTOMATIQUE =====
function initializeDPManagerWhenReady() {
  // Attendre que le DOM soit prêt et que le champ dp-nom existe
  const checkReady = () => {
    if (document.getElementById("dp-nom")) {
      initializeDPManager().then(() => {
        patchExistingDPFunctions();
      });
    } else {
      setTimeout(checkReady, 100);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkReady);
  } else {
    checkReady();
  }
}

// Démarrer l'initialisation
initializeDPManagerWhenReady();

// ===== EXPORTS GLOBAUX =====
window.getDPNomForSaving = getDPNomForSaving;
window.getSelectedDP = getSelectedDP;
window.dpDatabase = dpDatabase;

console.log("🎯 Module DP Management chargé - Gestion automatisée des DP activée");