// main-complete.js - Application principale compatible (SANS ERREUR SYNTAXE)

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (args[0] && (args[0].includes('🔥') || args[0].includes('✅') || args[0].includes('⚠️'))) {
      originalConsoleLog.apply(console, args);
    }
  };
}

// ===== VARIABLES GLOBALES =====
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.userConnected = window.userConnected || false;

// ===== FONCTIONS UTILITAIRES =====
function showAuthError(message, details) {
  details = details || '';
  const errorContainer = document.getElementById("auth-error");
  if (errorContainer) {
    errorContainer.innerHTML = '<strong>Erreur:</strong> ' + message + (details ? '<br><small>' + details + '</small>' : '');
    errorContainer.style.display = 'block';
    setTimeout(function() {
      errorContainer.style.display = 'none';
    }, 8000);
  }
  console.error("🔥 Erreur Auth:", message, details);
}

function showNotification(message, type) {
  type = type || 'info';
  const notification = document.createElement('div');
  notification.className = 'notification notification-' + type;
  notification.textContent = message;
  
  const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
  
  notification.style.cssText = 
    'position: fixed; top: 20px; right: 20px; padding: 15px 20px; background: ' + bgColor + 
    '; color: white; border-radius: 5px; z-index: 10000; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    notification.remove();
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

// Initialisation de la gestion DP
function initializeDPManagement() {
  try {
    loadDPFromFirebase();
    updateDPDropdown();
    setupDPEventListeners();
    console.log("✅ Gestion DP initialisée");
  } catch (error) {
    console.error("🔥 Erreur initialisation DP:", error);
    updateDPDropdown();
  }
}

// Configuration des event listeners DP
function setupDPEventListeners() {
  const dpSelect = document.getElementById("dp-select");
  const dpNom = document.getElementById("dp-nom");
  const nouveauDPBtn = document.getElementById("nouveau-dp");
  const supprimerDPBtn = document.getElementById("supprimer-dp");
  const corrigerDPBtn = document.getElementById("corriger-dp");
  const razDPBtn = document.getElementById("raz-dp");

  // Sélection DP
  if (dpSelect && dpNom) {
    dpSelect.addEventListener("change", function(e) {
      const selectedDP = dpList.find(function(dp) { return dp.nom === e.target.value; });
      if (selectedDP) {
        dpNom.value = selectedDP.nom + " (" + selectedDP.niveau + ")";
        dpNom.setAttribute("data-email", selectedDP.email);
      } else {
        dpNom.value = "";
        dpNom.removeAttribute("data-email");
      }
    });
  }

  // Boutons de gestion
  if (nouveauDPBtn) {
    nouveauDPBtn.addEventListener("click", function() { openDPModal(); });
  }

  if (supprimerDPBtn) {
    supprimerDPBtn.addEventListener("click", handleDPDeletion);
  }

  if (corrigerDPBtn) {
    corrigerDPBtn.addEventListener("click", handleDPCorrection);
  }

  if (razDPBtn) {
    razDPBtn.addEventListener("click", handleDPReset);
  }
}

// Sauvegarde DP dans Firebase
function saveDPToFirebase() {
  try {
    if (typeof db !== 'undefined' && db) {
      const dpRef = db.collection('configuration').doc('dp-list');
      dpRef.set({ dpList: dpList, lastUpdate: new Date().toISOString() });
      console.log("✅ DP sauvegardés dans Firebase");
    } else {
      console.log("⚠️ Firebase non disponible, sauvegarde locale");
      localStorage.setItem('jsas-dp-list', JSON.stringify(dpList));
    }
  } catch (error) {
    console.error("🔥 Erreur sauvegarde DP:", error);
    localStorage.setItem('jsas-dp-list', JSON.stringify(dpList));
  }
}

// Chargement DP depuis Firebase
function loadDPFromFirebase() {
  try {
    if (typeof db !== 'undefined' && db) {
      const dpRef = db.collection('configuration').doc('dp-list');
      dpRef.get().then(function(doc) {
        if (doc.exists && doc.data().dpList) {
          dpList = doc.data().dpList;
          console.log("✅ DP chargés depuis Firebase");
        }
      });
    }
    
    // Fallback local storage
    const localDP = localStorage.getItem('jsas-dp-list');
    if (localDP) {
      dpList = JSON.parse(localDP);
      console.log("✅ DP chargés depuis localStorage");
    }
  } catch (error) {
    console.error("🔥 Erreur chargement DP:", error);
  }
}

// Mise à jour du dropdown DP
function updateDPDropdown() {
  const dpSelect = document.getElementById("dp-select");
  if (!dpSelect) return;

  const sortedDP = dpList.slice().sort(function(a, b) { return a.nom.localeCompare(b.nom); });
  
  dpSelect.innerHTML = '<option value="">-- Sélectionner un DP --</option>';
  
  sortedDP.forEach(function(dp) {
    const option = document.createElement('option');
    option.value = dp.nom;
    option.textContent = dp.nom + " (" + dp.niveau + ")";
    dpSelect.appendChild(option);
  });
}

// Ouverture du modal DP
function openDPModal(editIndex) {
  editIndex = editIndex || -1;
  const modal = document.getElementById("dp-modal");
  const overlay = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const nomInput = document.getElementById("modal-nom");
  const niveauSelect = document.getElementById("modal-niveau");
  const emailInput = document.getElementById("modal-email");
  const submitBtn = document.getElementById("modal-submit");

  if (!modal || !overlay) return;

  // Configuration du modal
  if (editIndex >= 0) {
    const dp = dpList[editIndex];
    title.textContent = "Modifier le DP";
    nomInput.value = dp.nom;
    niveauSelect.value = dp.niveau;
    emailInput.value = dp.email;
    submitBtn.textContent = "Modifier";
    submitBtn.setAttribute("data-edit-index", editIndex);
  } else {
    title.textContent = "Nouveau DP";
    nomInput.value = "";
    niveauSelect.value = "";
    emailInput.value = "";
    submitBtn.textContent = "Ajouter";
    submitBtn.removeAttribute("data-edit-index");
  }

  modal.style.display = "block";
  overlay.style.display = "block";
  nomInput.focus();
}

// Fermeture du modal DP
function closeDPModal() {
  const modal = document.getElementById("dp-modal");
  const overlay = document.getElementById("modal-overlay");
  
  if (modal) modal.style.display = "none";
  if (overlay) overlay.style.display = "none";
}

// Soumission du formulaire DP
function handleDPSubmit() {
  const nomInput = document.getElementById("modal-nom");
  const niveauSelect = document.getElementById("modal-niveau");
  const emailInput = document.getElementById("modal-email");
  const submitBtn = document.getElementById("modal-submit");

  if (!nomInput || !niveauSelect || !emailInput) return;

  const nom = nomInput.value.trim();
  const niveau = niveauSelect.value;
  const email = emailInput.value.trim();

  // Validation
  if (!nom || !niveau || !email) {
    showNotification("❌ Tous les champs sont obligatoires", "error");
    return;
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("❌ Format d'email invalide", "error");
    return;
  }

  const editIndex = submitBtn.getAttribute("data-edit-index");
  const newDP = { nom: nom, niveau: niveau, email: email };

  if (editIndex !== null && editIndex >= 0) {
    // Modification
    dpList[parseInt(editIndex)] = newDP;
    showNotification("✅ DP modifié avec succès", "success");
  } else {
    // Vérifier les doublons
    const exists = dpList.some(function(dp) { return dp.nom === nom || dp.email === email; });
    if (exists) {
      showNotification("❌ Ce DP existe déjà (nom ou email)", "error");
      return;
    }
    
    // Ajout
    dpList.push(newDP);
    showNotification("✅ DP ajouté avec succès", "success");
  }

  saveDPToFirebase();
  updateDPDropdown();
  closeDPModal();
}

// Suppression DP
function handleDPDeletion() {
  const dpSelect = document.getElementById("dp-select");
  if (!dpSelect || !dpSelect.value) {
    showNotification("❌ Veuillez sélectionner un DP à supprimer", "error");
    return;
  }

  const dpIndex = dpList.findIndex(function(dp) { return dp.nom === dpSelect.value; });
  if (dpIndex === -1) return;

  const confirmation = confirm("⚠️ Supprimer le DP \"" + dpList[dpIndex].nom + "\" ?\n\nCette action est irréversible !");
  
  if (confirmation) {
    dpList.splice(dpIndex, 1);
    saveDPToFirebase();
    updateDPDropdown();
    
    // Reset sélection
    dpSelect.value = "";
    const dpNomInput = document.getElementById("dp-nom");
    if (dpNomInput) dpNomInput.value = "";
    
    showNotification("✅ DP supprimé avec succès", "success");
  }
}

// Correction DP
function handleDPCorrection() {
  const dpSelect = document.getElementById("dp-select");
  if (!dpSelect || !dpSelect.value) {
    showNotification("❌ Veuillez sélectionner un DP à modifier", "error");
    return;
  }

  const dpIndex = dpList.findIndex(function(dp) { return dp.nom === dpSelect.value; });
  if (dpIndex >= 0) {
    openDPModal(dpIndex);
  }
}

// Remise à zéro DP
function handleDPReset() {
  const confirmation = confirm("⚠️ Remettre à zéro la liste des DP ?\n\nCela supprimera tous les DP personnalisés et restaurera les 10 DP par défaut.\n\nCette action est irréversible !");
  
  if (!confirmation) return;

  try {
    // Restaurer la liste par défaut
    dpList = [
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

    saveDPToFirebase();
    updateDPDropdown();
    
    // Reset sélection
    const dpSelect = document.getElementById("dp-select");
    const dpNom = document.getElementById("dp-nom");
    if (dpSelect) dpSelect.value = "";
    if (dpNom) dpNom.value = "";
    
    showNotification("🔄 Liste DP remise à zéro (10 DP par défaut)", "info");
  } catch (error) {
    console.error("🔥 Erreur RAZ DP:", error);
    showNotification("❌ Erreur lors de la remise à zéro", "error");
  }
}

// ===== FONCTIONS D'EXPORT PDF =====
function exportToPDF() {
  try {
    console.log("🔄 Début export PDF...");
    
    if (typeof jsPDF === 'undefined') {
      throw new Error("jsPDF non chargé");
    }

    const jsPDFLib = window.jspdf.jsPDF;
    const doc = new jsPDFLib('p', 'mm', 'a4');

    // Couleurs
    const colors = {
      blueR: 0, blueG: 64, blueB: 128,
      darkR: 51, darkG: 51, darkB: 51,
      lightR: 240, lightG: 248, lightB: 255
    };

    // Marges
    const margin = 15;
    var yPosition = margin;

    // Fonction helper pour ajouter du texte
    function addText(text, x, y, size, style, color) {
      size = size || 8;
      style = style || 'normal';
      color = color || 'dark';
      
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      
      switch(color) {
        case 'blue':
          doc.setTextColor(colors.blueR, colors.blueG, colors.blueB);
          break;
        case 'white':
          doc.setTextColor(255, 255, 255);
          break;
        default:
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      }
      
      doc.text(text, x, y);
    }
    
    // Vérifier que les variables globales existent
    const plongeursLocal = window.plongeurs || [];
    const palanqueesLocal = window.palanquees || [];
    
    // === EN-TÊTE PRINCIPAL ===
    doc.setFillColor(colors.blueR, colors.blueG, colors.blueB);
    doc.rect(0, 0, 210, 40, 'F');
    
    addText('Palanquées JSAS', margin, 35, 10, 'bold', 'white'); // Descendu de 15mm
    
    // Informations DP
    const dpNomElement = document.getElementById("dp-nom");
    const dateDPElement = document.getElementById("date-dp");
    const lieuDPElement = document.getElementById("lieu-dp");
    const typePlongeeElement = document.getElementById("type-plongee");
    
    const dpNom = dpNomElement ? dpNomElement.value : "Non renseigné";
    const dateDP = dateDPElement ? dateDPElement.value : new Date().toLocaleDateString('fr-FR');
    const lieuDP = lieuDPElement ? lieuDPElement.value : "Non renseigné";
    const typePlongee = typePlongeeElement ? typePlongeeElement.value : "Exploration";
    
    addText('DP: ' + dpNom, margin + 100, 15, 8, 'normal', 'white');
    addText('Date: ' + dateDP, margin + 100, 22, 8, 'normal', 'white');
    addText('Lieu: ' + lieuDP, margin + 100, 29, 8, 'normal', 'white');
    addText('Type: ' + typePlongee, margin + 100, 36, 8, 'normal', 'white');

    yPosition = 50;

    // === STATISTIQUES ===
    doc.setFillColor(colors.lightR, colors.lightG, colors.lightB);
    doc.rect(margin, yPosition, 180, 15, 'F');
    
    addText('STATISTIQUES', margin + 2, yPosition + 10, 9, 'bold', 'blue');
    
    const stats = {
      totalPlongeurs: plongeursLocal.length,
      totalPalanquees: palanqueesLocal.length,
      niveaux: {}
    };
    
    plongeursLocal.forEach(function(p) {
      stats.niveaux[p.niveau] = (stats.niveaux[p.niveau] || 0) + 1;
    });
    
    var statsText = 'Plongeurs: ' + stats.totalPlongeurs + ' | Palanquées: ' + stats.totalPalanquees;
    Object.keys(stats.niveaux).forEach(function(niveau) {
      statsText += ' | ' + niveau + ': ' + stats.niveaux[niveau];
    });
    
    addText(statsText, margin + 40, yPosition + 10, 8);
    yPosition += 20;

    // === PIED DE PAGE ===
    const pageHeight = doc.internal.pageSize.height;
    addText('Généré le ' + new Date().toLocaleString('fr-FR') + ' par JSAS Palanquées', margin, pageHeight - 10, 7);

    // Sauvegarde
    const fileName = 'palanquees-' + dateDP.replace(/\//g, '-') + '.pdf';
    doc.save(fileName);
    
    showNotification("✅ PDF généré avec succès", "success");
    console.log("✅ Export PDF terminé");
    
  } catch (error) {
    console.error("🔥 Erreur export PDF:", error);
    showNotification("❌ Erreur lors de la génération du PDF", "error");
  }
}

// ===== VALIDATION DE SESSION =====
function validerSession() {
  try {
    console.log("🔄 Validation de session...");
    
    // Récupération des données
    const dpNomElement = document.getElementById("dp-nom");
    const dateDPElement = document.getElementById("date-dp");
    const lieuDPElement = document.getElementById("lieu-dp");
    const typePlongeeElement = document.getElementById("type-plongee");
    
    const dpNom = dpNomElement ? dpNomElement.value.trim() : "";
    const dateDP = dateDPElement ? dateDPElement.value : "";
    const lieuDP = lieuDPElement ? lieuDPElement.value.trim() : "";
    const typePlongee = typePlongeeElement ? typePlongeeElement.value : "";
    
    // Validation des champs obligatoires
    const erreurs = [];
    if (!dpNom || dpNom === "" || dpNom === "Non renseigné") erreurs.push("Directeur de Plongée");
    if (!dateDP) erreurs.push("Date");
    if (!lieuDP || lieuDP === "" || lieuDP === "Non renseigné") erreurs.push("Lieu");
    if (!typePlongee) erreurs.push("Type de plongée");
    
    if (erreurs.length > 0) {
      showNotification("❌ Champs obligatoires manquants: " + erreurs.join(', '), "error");
      return;
    }
    
    if (window.plongeurs.length === 0) {
      showNotification("❌ Aucun plongeur enregistré", "error");
      return;
    }
    
    if (window.palanquees.length === 0) {
      showNotification("❌ Aucune palanquée créée", "error");
      return;
    }
    
    // Préparation des données de session
    const sessionData = {
      dp: {
        nom: dpNom,
        email: dpNomElement ? dpNomElement.getAttribute("data-email") : "",
        date: dateDP,
        lieu: lieuDP,
        typePlongee: typePlongee
      },
      plongeurs: window.plongeurs.map(function(p) {
        return {
          id: p.id,
          nom: p.nom,
          niveau: p.niveau,
          prerogatives: p.prerogatives || "",
          certificatMedical: p.certificatMedical || false,
          assurance: p.assurance || false
        };
      }),
      palanquees: window.palanquees.map(function(pal, index) {
        return {
          id: index + 1,
          profondeur: pal.profondeur,
          duree: pal.duree,
          plongeurs: pal.plongeurs || [],
          guide: pal.guide || "",
          securiteSurface: pal.securiteSurface || ""
        };
      }),
      statistiques: {
        totalPlongeurs: window.plongeurs.length,
        totalPalanquees: window.palanquees.length,
        niveauxRepartition: window.plongeurs.reduce(function(acc, p) {
          acc[p.niveau] = (acc[p.niveau] || 0) + 1;
          return acc;
        }, {})
      },
      timestamp: new Date().toISOString(),
      version: "3.1.0"
    };
    
    // Sauvegarde dans Firebase
    if (typeof db !== 'undefined' && db) {
      try {
        const sessionId = 'session-' + dateDP + '-' + Date.now();
        db.collection('sessions').doc(sessionId).set(sessionData);
        console.log("✅ Session sauvegardée dans Firebase");
      } catch (error) {
        console.error("🔥 Erreur Firebase:", error);
        // Fallback localStorage
        const sessions = JSON.parse(localStorage.getItem('jsas-sessions') || '[]');
        sessions.push(Object.assign({}, sessionData, {id: Date.now()}));
        localStorage.setItem('jsas-sessions', JSON.stringify(sessions));
      }
    } else {
      // Sauvegarde locale
      const sessions = JSON.parse(localStorage.getItem('jsas-sessions') || '[]');
      sessions.push(Object.assign({}, sessionData, {id: Date.now()}));
      localStorage.setItem('jsas-sessions', JSON.stringify(sessions));
      console.log("✅ Session sauvegardée localement");
    }
    
    showNotification("✅ Session validée et sauvegardée", "success");
    console.log("✅ Validation de session terminée");
    
    // Optionnel: proposer d'exporter directement
    if (confirm("Session validée ! Voulez-vous générer le PDF maintenant ?")) {
      exportToPDF();
    }
    
  } catch (error) {
    console.error("🔥 Erreur validation session:", error);
    showNotification("❌ Erreur lors de la validation", "error");
  }
}

// ===== GESTION DES ÉVÉNEMENTS =====
function setupEventListeners() {
  console.log("🔄 Configuration des event listeners...");
  
  try {
    // === AUTHENTIFICATION ===
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        if (!email || !password) {
          showAuthError("Veuillez remplir tous les champs");
          return;
        }
        
        try {
          if (typeof signInWithEmailAndPassword !== 'undefined' && typeof auth !== 'undefined') {
            signInWithEmailAndPassword(auth, email, password);
          } else {
            showAuthError("Firebase Auth non disponible");
          }
        } catch (error) {
          console.error("🔥 Erreur connexion:", error);
          showAuthError("Erreur de connexion", error.message);
        }
      });
    }
    
    // === EXPORT ET VALIDATION ===
    const exportPDFBtn = document.getElementById("export-pdf");
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener("click", exportToPDF);
    }
    
    const validerSessionBtn = document.getElementById("valider-session");
    if (validerSessionBtn) {
      validerSessionBtn.addEventListener("click", function(e) {
        e.preventDefault();
        validerSession();
      });
    }
    
    // === MODAL DP ===
    const modalOverlay = document.getElementById("modal-overlay");
    const modalClose = document.getElementById("modal-close");
    const modalCancel = document.getElementById("modal-cancel");
    const modalSubmit = document.getElementById("modal-submit");
    
    if (modalOverlay) {
      modalOverlay.addEventListener("click", closeDPModal);
    }
    
    if (modalClose) {
      modalClose.addEventListener("click", closeDPModal);
    }
    
    if (modalCancel) {
      modalCancel.addEventListener("click", closeDPModal);
    }
    
    if (modalSubmit) {
      modalSubmit.addEventListener("click", handleDPSubmit);
    }
    
    // === TEST FIREBASE SÉCURISÉ ===
    const testFirebaseBtn = document.getElementById("test-firebase");
    if (testFirebaseBtn) {
      testFirebaseBtn.addEventListener("click", function() {
        console.log("🧪 === TEST FIREBASE COMPLET SÉCURISÉ ===");
        
        try {
          if (typeof db === 'undefined') {
            throw new Error("Firebase Firestore non initialisé");
          }
          
          // Test de lecture
          db.collection('test').doc('connectivity').get().then(function() {
            console.log("✅ Lecture Firebase OK");
            
            // Test d'écriture
            return db.collection('test').doc('connectivity').set({
              timestamp: new Date().toISOString(),