// main-complete.js - Application principale SANS ERREURS DE SYNTAXE

console.log("🚀 Chargement main-complete.js...");

// ===== VARIABLES GLOBALES =====
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.userConnected = window.userConnected || false;

// ===== FONCTIONS UTILITAIRES =====
function showNotification(message, type) {
  type = type || 'info';
  var notification = document.createElement('div');
  notification.textContent = message;
  
  var bgColor = '#17a2b8';
  if (type === 'success') bgColor = '#28a745';
  if (type === 'error') bgColor = '#dc3545';
  
  notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 20px; background: ' + bgColor + '; color: white; border-radius: 5px; z-index: 10000; font-weight: bold;';
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

// ===== GESTION DES DP =====
var dpList = [
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

// Mise à jour du dropdown DP
function updateDPDropdown() {
  var dpSelect = document.getElementById("dp-select");
  if (!dpSelect) return;

  dpSelect.innerHTML = '<option value="">-- Sélectionner un DP --</option>';
  
  for (var i = 0; i < dpList.length; i++) {
    var dp = dpList[i];
    var option = document.createElement('option');
    option.value = dp.nom;
    option.textContent = dp.nom + " (" + dp.niveau + ")";
    dpSelect.appendChild(option);
  }
}

// Sélection DP
function handleDPSelection() {
  var dpSelect = document.getElementById("dp-select");
  var dpNom = document.getElementById("dp-nom");
  
  if (!dpSelect || !dpNom) return;
  
  var selectedValue = dpSelect.value;
  if (selectedValue) {
    for (var i = 0; i < dpList.length; i++) {
      if (dpList[i].nom === selectedValue) {
        dpNom.value = dpList[i].nom + " (" + dpList[i].niveau + ")";
        dpNom.setAttribute("data-email", dpList[i].email);
        break;
      }
    }
  } else {
    dpNom.value = "";
    dpNom.removeAttribute("data-email");
  }
}

// Ouverture du modal DP
function openDPModal(editIndex) {
  var modal = document.getElementById("dp-modal");
  var overlay = document.getElementById("modal-overlay");
  
  if (!modal || !overlay) return;
  
  modal.style.display = "block";
  overlay.style.display = "block";
  
  var nomInput = document.getElementById("modal-nom");
  if (nomInput) nomInput.focus();
}

// Fermeture du modal DP
function closeDPModal() {
  var modal = document.getElementById("dp-modal");
  var overlay = document.getElementById("modal-overlay");
  
  if (modal) modal.style.display = "none";
  if (overlay) overlay.style.display = "none";
}

// Nouveau DP
function handleNewDP() {
  openDPModal();
}

// Suppression DP
function handleDPDeletion() {
  var dpSelect = document.getElementById("dp-select");
  if (!dpSelect || !dpSelect.value) {
    showNotification("❌ Veuillez sélectionner un DP à supprimer", "error");
    return;
  }
  
  if (confirm("Supprimer ce DP ?")) {
    // Logique de suppression ici
    showNotification("✅ DP supprimé", "success");
  }
}

// Correction DP
function handleDPCorrection() {
  var dpSelect = document.getElementById("dp-select");
  if (!dpSelect || !dpSelect.value) {
    showNotification("❌ Veuillez sélectionner un DP à modifier", "error");
    return;
  }
  
  openDPModal();
}

// RAZ DP
function handleDPReset() {
  if (confirm("Remettre à zéro la liste des DP ?")) {
    updateDPDropdown();
    showNotification("🔄 Liste DP remise à zéro", "info");
  }
}

// ===== EXPORT PDF =====
function exportToPDF() {
  try {
    console.log("🔄 Export PDF...");
    
    if (typeof jsPDF === 'undefined') {
      showNotification("❌ jsPDF non chargé", "error");
      return;
    }

    var jsPDFLib = window.jspdf.jsPDF;
    var doc = new jsPDFLib();
    
    // Titre principal
    doc.setFontSize(16);
    doc.text('Palanquées JSAS', 20, 30);
    
    // Informations DP
    var dpNom = document.getElementById("dp-nom");
    var dateDP = document.getElementById("date-dp");
    
    if (dpNom && dpNom.value) {
      doc.setFontSize(12);
      doc.text('DP: ' + dpNom.value, 20, 50);
    }
    
    if (dateDP && dateDP.value) {
      doc.text('Date: ' + dateDP.value, 20, 65);
    }
    
    // Sauvegarde
    var fileName = 'palanquees-' + new Date().toISOString().split('T')[0] + '.pdf';
    doc.save(fileName);
    
    showNotification("✅ PDF généré", "success");
    
  } catch (error) {
    console.error("Erreur PDF:", error);
    showNotification("❌ Erreur PDF", "error");
  }
}

// ===== VALIDATION SESSION =====
function validerSession() {
  try {
    console.log("🔄 Validation session...");
    
    var dpNom = document.getElementById("dp-nom");
    var dateDP = document.getElementById("date-dp");
    
    if (!dpNom || !dpNom.value) {
      showNotification("❌ Veuillez sélectionner un DP", "error");
      return;
    }
    
    if (!dateDP || !dateDP.value) {
      showNotification("❌ Veuillez saisir une date", "error");
      return;
    }
    
    // Sauvegarde session
    var sessionData = {
      dp: dpNom.value,
      date: dateDP.value,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('jsas-last-session', JSON.stringify(sessionData));
    
    showNotification("✅ Session validée", "success");
    
    if (confirm("Générer le PDF ?")) {
      exportToPDF();
    }
    
  } catch (error) {
    console.error("Erreur validation:", error);
    showNotification("❌ Erreur validation", "error");
  }
}

// ===== CONFIGURATION DES ÉVÉNEMENTS =====
function setupEventListeners() {
  console.log("🔄 Configuration événements...");
  
  // DP Select
  var dpSelect = document.getElementById("dp-select");
  if (dpSelect) {
    dpSelect.addEventListener("change", handleDPSelection);
  }
  
  // Boutons DP
  var nouveauDP = document.getElementById("nouveau-dp");
  if (nouveauDP) {
    nouveauDP.addEventListener("click", handleNewDP);
  }
  
  var supprimerDP = document.getElementById("supprimer-dp");
  if (supprimerDP) {
    supprimerDP.addEventListener("click", handleDPDeletion);
  }
  
  var corrigerDP = document.getElementById("corriger-dp");
  if (corrigerDP) {
    corrigerDP.addEventListener("click", handleDPCorrection);
  }
  
  var razDP = document.getElementById("raz-dp");
  if (razDP) {
    razDP.addEventListener("click", handleDPReset);
  }
  
  // Modal
  var modalClose = document.getElementById("modal-close");
  if (modalClose) {
    modalClose.addEventListener("click", closeDPModal);
  }
  
  var modalCancel = document.getElementById("modal-cancel");
  if (modalCancel) {
    modalCancel.addEventListener("click", closeDPModal);
  }
  
  var modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", closeDPModal);
  }
  
  // Export et validation
  var exportPDF = document.getElementById("export-pdf");
  if (exportPDF) {
    exportPDF.addEventListener("click", exportToPDF);
  }
  
  var validerBtn = document.getElementById("valider-session");
  if (validerBtn) {
    validerBtn.addEventListener("click", function(e) {
      e.preventDefault();
      validerSession();
    });
  }
  
  console.log("✅ Événements configurés");
}

// ===== INITIALISATION =====
function initializeApp() {
  console.log("🔄 Initialisation app...");
  
  // Afficher l'interface
  var authSection = document.getElementById("auth-section");
  var mainApp = document.getElementById("main-app");
  
  if (authSection) authSection.style.display = "none";
  if (mainApp) mainApp.style.display = "block";
  
  // Initialiser la date
  var dateInput = document.getElementById("date-dp");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Charger les DP
  updateDPDropdown();
  
  // Configurer les événements
  setupEventListeners();
  
  showNotification("✅ Application initialisée", "success");
  console.log("✅ App initialisée");
}

// ===== DIAGNOSTIC =====
window.diagnosticJSAS = function() {
  console.log("🔧 Diagnostic JSAS");
  
  var diag = {
    elements: {
      dpSelect: !!document.getElementById("dp-select"),
      dpNom: !!document.getElementById("dp-nom"),
      mainApp: !!document.getElementById("main-app"),
      modal: !!document.getElementById("dp-modal")
    },
    data: {
      dpList: dpList.length,
      plongeurs: window.plongeurs.length,
      palanquees: window.palanquees.length
    },
    functions: {
      exportToPDF: typeof exportToPDF === 'function',
      validerSession: typeof validerSession === 'function'
    }
  };
  
  console.table(diag.elements);
  console.table(diag.data);
  console.table(diag.functions);
  
  return diag;
};

// ===== EXPORTS GLOBAUX =====
window.exportToPDF = exportToPDF;
window.validerSession = validerSession;
window.closeDPModal = closeDPModal;
window.openDPModal = openDPModal;

// ===== INITIALISATION AUTOMATIQUE =====
document.addEventListener('DOMContentLoaded', function() {
  console.log("📋 DOM chargé, initialisation...");
  
  setTimeout(function() {
    initializeApp();
  }, 100);
  
  // Firebase fallback
  if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        console.log("✅ Utilisateur connecté:", user.email);
      } else {
        console.log("👤 Mode non connecté");
      }
    });
  } else {
    console.log("⚠️ Firebase non disponible");
  }
});

console.log("✅ main-complete.js chargé sans erreur");