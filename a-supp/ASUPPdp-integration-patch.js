// dp-integration-patch.js - Patch d'intégration pour le système DP automatisé

// ===== PATCH POUR LA COMPATIBILITÉ AVEC LES MODULES EXISTANTS =====

// Attendre que tous les modules soient chargés
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initializeDPIntegrationPatch, 2000);
});

function initializeDPIntegrationPatch() {
  console.log("🔧 Application du patch d'intégration DP...");
  
  try {
    // Patch pour dp-sessions-manager.js
    patchDPSessionsManager();
    
    // Patch pour les fonctions qui cherchent le champ dp-nom
    patchDPNomGetter();
    
    // Patch pour les validations
    patchValidationFunctions();
    
    console.log("✅ Patch d'intégration DP appliqué avec succès");
    
  } catch (error) {
    console.error("❌ Erreur application patch DP:", error);
  }
}

// ===== PATCH POUR DP-SESSIONS-MANAGER =====
function patchDPSessionsManager() {
  // Intercepter validateAndSaveDP si elle existe
  if (typeof window.validateAndSaveDP === 'function') {
    const originalValidateAndSaveDP = window.validateAndSaveDP;
    
    window.validateAndSaveDP = async function() {
      const selectedDP = getSelectedDP();
      if (!selectedDP) {
        alert("⚠️ Veuillez sélectionner un Directeur de Plongée");
        return false;
      }
      
      // Créer temporairement un champ dp-nom virtuel
      const originalDPNom = document.getElementById("dp-nom");
      let virtualInput = null;
      
      if (!originalDPNom) {
        virtualInput = document.createElement("input");
        virtualInput.id = "dp-nom";
        virtualInput.style.display = "none";
        document.body.appendChild(virtualInput);
      }
      
      const dpField = originalDPNom || virtualInput;
      const oldValue = dpField.value;
      dpField.value = selectedDP.nom;
      
      try {
        const result = await originalValidateAndSaveDP.apply(this, arguments);
        return result;
      } finally {
        dpField.value = oldValue;
        if (virtualInput) {
          document.body.removeChild(virtualInput);
        }
      }
    };
  }
}

// ===== PATCH POUR LES FONCTIONS QUI UTILISENT DP-NOM =====
function patchDPNomGetter() {
  // Fonction utilitaire pour obtenir le nom du DP sélectionné
  window.getDPNomValue = function() {
    const selectedDP = getSelectedDP();
    return selectedDP ? selectedDP.nom : "";
  };
  
  // Intercepter saveSessionData si elle existe
  if (typeof window.saveSessionData === 'function') {
    const originalSaveSessionData = window.saveSessionData;
    
    window.saveSessionData = async function() {
      // Créer temporairement un champ dp-nom si nécessaire
      let dpField = document.getElementById("dp-nom");
      let virtualInput = null;
      
      if (!dpField) {
        virtualInput = document.createElement("input");
        virtualInput.id = "dp-nom";
        virtualInput.style.display = "none";
        document.body.appendChild(virtualInput);
        dpField = virtualInput;
      }
      
      const oldValue = dpField.value;
      dpField.value = getDPNomValue();
      
      try {
        const result = await originalSaveSessionData.apply(this, arguments);
        return result;
      } finally {
        dpField.value = oldValue;
        if (virtualInput) {
          document.body.removeChild(virtualInput);
        }
      }
    };
  }
  
  // Intercepter toutes les fonctions qui utilisent $("#dp-nom").value
  const originalQuerSelector = document.getElementById;
  
  // Patch spécifique pour les accès à dp-nom
  function getElementByIdPatched(id) {
    const element = originalQuerSelector.call(document, id);
    
    if (id === "dp-nom" && !element) {
      // Créer un élément virtuel qui retourne toujours la valeur du DP sélectionné
      return {
        value: getDPNomValue(),
        style: { display: "none" },
        focus: function() {},
        addEventListener: function() {},
        removeEventListener: function() {}
      };
    }
    
    return element;
  }
  
  // Ne pas remplacer complètement getElementById pour éviter les conflits
  // Utiliser une approche plus ciblée via une fonction utilitaire
}

// ===== PATCH POUR LES VALIDATIONS =====
function patchValidationFunctions() {
  // Intercepter validateDPFields si elle existe
  if (typeof window.validateDPFields === 'function') {
    const originalValidateDPFields = window.validateDPFields;
    
    window.validateDPFields = function(nom, date, lieu, plongee) {
      // Si nom n'est pas fourni, essayer de le récupérer du DP sélectionné
      if (!nom) {
        nom = getDPNomValue();
      }
      
      return originalValidateDPFields(nom, date, lieu, plongee);
    };
  }
}

// ===== FONCTION UTILITAIRE POUR RÉCUPÉRER LE DP SÉLECTIONNÉ =====
function getSelectedDP() {
  if (typeof window.getSelectedDP === 'function') {
    return window.getSelectedDP();
  }
  
  // Fallback si la fonction n'est pas encore disponible
  const selectDP = document.getElementById("dp-select");
  if (!selectDP || selectDP.value === "") return null;
  
  const index = parseInt(selectDP.value);
  if (typeof window.dpDatabase !== 'undefined' && window.dpDatabase[index]) {
    return window.dpDatabase[index];
  }
  
  return null;
}

// ===== PATCH POUR LES FONCTIONS D'EXPORT/IMPORT =====
function patchExportImportFunctions() {
  // Intercepter exportToJSON si elle existe
  if (typeof window.exportToJSON === 'function') {
    const originalExportToJSON = window.exportToJSON;
    
    window.exportToJSON = function() {
      // S'assurer que le nom du DP est correctement récupéré
      const dpField = document.getElementById("dp-nom");
      let oldValue = "";
      
      if (dpField) {
        oldValue = dpField.value;
        dpField.value = getDPNomValue();
      }
      
      try {
        return originalExportToJSON.apply(this, arguments);
      } finally {
        if (dpField) {
          dpField.value = oldValue;
        }
      }
    };
  }
}

// ===== SURVEILLANCE DES CHANGEMENTS DE DP =====
function setupDPChangeWatcher() {
  const selectDP = document.getElementById("dp-select");
  if (selectDP) {
    selectDP.addEventListener("change", function() {
      // Ajouter une animation visuelle
      selectDP.classList.add("dp-changed");
      setTimeout(() => {
        selectDP.classList.remove("dp-changed");
      }, 1000);
      
      // Déclencher des events personnalisés pour les autres modules
      const dpChangeEvent = new CustomEvent("dpChanged", {
        detail: {
          selectedDP: getSelectedDP(),
          dpNom: getDPNomValue()
        }
      });
      
      document.dispatchEvent(dpChangeEvent);
    });
  }
}

// ===== INITIALISATION AVEC RETRY =====
function initializeWithRetry(maxRetries = 5) {
  let retries = 0;
  
  function tryInitialize() {
    try {
      // Vérifier si les éléments nécessaires existent
      const dpSelect = document.getElementById("dp-select");
      
      if (dpSelect) {
        patchExportImportFunctions();
        setupDPChangeWatcher();
        console.log("✅ Patch DP avec surveillance initialisé");
        return true;
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(tryInitialize, 1000);
        return false;
      } else {
        console.warn("⚠️ Impossible d'initialiser complètement le patch DP");
        return false;
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation du patch:", error);
      return false;
    }
  }
  
  tryInitialize();
}

// Démarrer l'initialisation avec retry
setTimeout(() => {
  initializeWithRetry();
}, 3000);

console.log("🔧 Module de patch d'intégration DP chargé");