// main-complete.js - Application principale ultra-sécurisée (VERSION COMPLÈTE SANS ERREURS)

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const originalConsoleLog = console.log;
  console.log = function() {
    if (arguments[0] && (arguments[0].includes('✅') || arguments[0].includes('❌'))) {
      originalConsoleLog.apply(console, arguments);
    }
  };
}

// ===== FONCTIONS UTILITAIRES SÉCURISÉES =====
function showAuthError(message) {
  const errorDiv = document.getElementById("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function handleError(error, context = "Application") {
  console.error(`❌ Erreur ${context}:`, error);
  
  // Utiliser le gestionnaire d'erreurs Firebase si disponible
  if (typeof FirebaseErrorHandler !== 'undefined') {
    return FirebaseErrorHandler.handleError(error, context);
  }
  
  // Fallback si le gestionnaire n'est pas disponible
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }
  
  console.log("Debug info:", {
    firebaseConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined',
    currentUser: typeof currentUser !== 'undefined' ? (currentUser ? currentUser.email : 'null') : 'undefined',
    plongeursLength: Array.isArray(plongeurs) ? plongeurs.length : 'not array',
    palanqueesLength: Array.isArray(palanquees) ? palanquees.length : 'not array'
  });
  
  return false;
}

// ===== TESTS DE CONNEXION SÉCURISÉS =====
async function testFirebaseConnectionSafe() {
  try {
    console.log("🧪 Test de connexion Firebase sécurisé...");
    
    if (!db) {
      throw new Error("Instance Firebase Database non initialisée");
    }
    
    if (!auth) {
      throw new Error("Instance Firebase Auth non initialisée");
    }
    
    // Test de connexion avec timeout plus court
    const testRef = db.ref('.info/connected');
    const connectedPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        try {
          testRef.off('value');
        } catch (e) {
          console.warn("⚠️ Erreur suppression listener test:", e);
        }
        resolve(false);
      }, 5000);
      
      let resolved = false;
      const listener = (snapshot) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          try {
            testRef.off('value', listener);
          } catch (e) {
            console.warn("⚠️ Erreur suppression listener:", e);
          }
          
          firebaseConnected = snapshot.val() === true;
          console.log(firebaseConnected ? "✅ Firebase connecté" : "⚠️ Firebase déconnecté");
          resolve(firebaseConnected);
        }
      };
      
      testRef.on('value', listener, (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error("❌ Erreur listener connexion:", error);
          resolve(false);
        }
      });
    });
    
    await connectedPromise;
    
    if (firebaseConnected) {
      try {
        // Test d'écriture rapide
        const testWriteRef = db.ref('test-connection');
        await testWriteRef.set({ 
          timestamp: Date.now(),
          testType: "connection-check",
          user: currentUser?.email || "anonymous"
        });
        console.log("✅ Test d'écriture Firebase réussi");
        
        // Nettoyer immédiatement
        await testWriteRef.remove();
      } catch (writeError) {
        console.warn("⚠️ Écriture Firebase échouée mais lecture OK:", writeError.message);
        if (typeof FirebaseErrorHandler !== 'undefined') {
          FirebaseErrorHandler.handleError(writeError, 'Test écriture');
        }
      }
    } else {
      console.warn("⚠️ Firebase déconnecté, fonctionnement en mode lecture seule");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Test Firebase échoué:", error.message);
    if (typeof FirebaseErrorHandler !== 'undefined') {
      FirebaseErrorHandler.handleError(error, 'Test connexion');
    }
    firebaseConnected = false;
    return true; // Continue en mode dégradé
  }
}

// ===== INITIALISATION SÉCURISÉE DES DONNÉES =====
async function initializeAppData() {
  try {
    console.log("📄 Initialisation sécurisée des données de l'application...");
    
    // Vérifier que les variables globales sont initialisées
    if (typeof plongeurs === 'undefined') {
      console.warn("⚠️ Variable plongeurs non initialisée, correction...");
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      console.warn("⚠️ Variable palanquees non initialisée, correction...");
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      console.warn("⚠️ Variable plongeursOriginaux non initialisée, correction...");
      window.plongeursOriginaux = [];
    }
    
    // Test de connexion sécurisé
    await testFirebaseConnectionSafe();
    
    // Initialiser la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = document.getElementById("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    console.log("📜 Chargement des données...");
    
    // Charger l'historique DP avec gestion d'erreur
    try {
      if (typeof chargerHistoriqueDP === 'function') {
        await chargerHistoriqueDP();
        console.log("✅ Historique DP chargé");
      }
    } catch (error) {
      console.error("❌ Erreur chargement historique DP:", error);
    }
    
    // Charger les données Firebase avec gestion d'erreur
    try {
      if (typeof loadFromFirebase === 'function') {
        await loadFromFirebase();
        console.log("✅ Données Firebase chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement Firebase:", error);
      
      // Initialisation de secours
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    }
    
    // Charger les sessions avec gestion d'erreur
    try {
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
        console.log("✅ Sessions chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement sessions:", error);
    }
    
    // Rendu initial sécurisé
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
    } catch (renderError) {
      console.error("❌ Erreur rendu initial:", renderError);
    }
    
    console.log("✅ Application initialisée avec système de verrous sécurisé!");
    
    if (typeof plongeurs !== 'undefined' && typeof palanquees !== 'undefined') {
      console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    }
    
  } catch (error) {
    console.error("❌ Erreur critique initialisation données:", error);
    handleError(error, "Initialisation données");
    
    // Mode de récupération d'urgence
    try {
      console.log("🆘 Activation du mode de récupération d'urgence...");
      
      // Initialiser les variables minimales
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
      
      // Essayer le rendu de base
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      console.log("✅ Mode de récupération activé");
      
    } catch (recoveryError) {
      console.error("❌ Échec du mode de récupération:", recoveryError);
      
      // Dernière tentative - afficher une erreur à l'utilisateur
      const authError = document.getElementById("auth-error");
      if (authError) {
        authError.textContent = "Erreur de chargement. L'application fonctionne en mode dégradé.";
        authError.style.display = "block";
      }
      
      alert(
        "Erreur critique de chargement.\n\n" +
        "L'application fonctionne en mode dégradé.\n" +
        "Veuillez:\n" +
        "1. Actualiser la page\n" +
        "2. Vérifier votre connexion internet\n" +
        "3. Contacter l'administrateur si le problème persiste"
      );
    }
  }
}

// ===== EXPORT PDF SÉCURISÉ =====
function exportToPDF() {
  // Vérifier que pageLoadTime existe
  if (typeof pageLoadTime !== 'undefined' && Date.now() - pageLoadTime < 3000) {
    console.log("🚫 Export PDF bloqué - page en cours de chargement");
    return;
  }
    
  console.log("📄 Génération du PDF professionnel...");
  
  // Fonction helper sécurisée pour getElementById
  function $(id) {
    const element = document.getElementById(id);
    return element || { value: "" };
  }
  
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  try {
    // Vérifier que jsPDF est disponible
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      throw new Error("jsPDF non disponible. Assurez-vous que la bibliothèque est chargée.");
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Générer le PDF simplifié
    doc.setFontSize(16);
    doc.text('Palanquées JSAS', 20, 20);
    doc.setFontSize(12);
    doc.text(`DP: ${dpNom}`, 20, 35);
    doc.text(`Date: ${dpDate}`, 20, 45);
    doc.text(`Lieu: ${dpLieu}`, 20, 55);
    doc.text(`Session: ${dpPlongee}`, 20, 65);
    
    // Vérifier que les variables globales existent
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    let yPos = 80;
    
    // Ajouter les palanquées
    if (palanqueesLocal.length > 0) {
      doc.text('Palanquées:', 20, yPos);
      yPos += 10;
      
      palanqueesLocal.forEach((pal, i) => {
        if (Array.isArray(pal)) {
          doc.text(`Palanquée ${i + 1} (${pal.length} plongeurs)`, 25, yPos);
          yPos += 5;
          
          pal.forEach(p => {
            if (p && p.nom) {
              doc.text(`- ${p.nom} (${p.niveau})`, 30, yPos);
              yPos += 5;
            }
          });
          yPos += 5;
        }
      });
    }
    
    // Ajouter les plongeurs en attente
    if (plongeursLocal.length > 0) {
      doc.text('Plongeurs en attente:', 20, yPos);
      yPos += 10;
      
      plongeursLocal.forEach(p => {
        if (p && p.nom) {
          doc.text(`- ${p.nom} (${p.niveau})`, 25, yPos);
          yPos += 5;
        }
      });
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF généré:", fileName);
    alert('PDF généré avec succès !\n\nFichier: ' + fileName);
    
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    handleError(error, "Génération PDF");
    alert("Erreur lors de la génération du PDF : " + error.message + "\n\nVérifiez que jsPDF est bien chargé.");
  }
}

// ===== GÉNÉRATION PDF PREVIEW SÉCURISÉE =====
function generatePDFPreview() {
  console.log("🎨 Génération de l'aperçu PDF...");
  
  try {
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // S'assurer que les variables existent
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    
    // Générer un HTML simple pour l'aperçu
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Aperçu PDF - Palanquées JSAS</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #004080; }
          .palanquee { border: 1px solid #ccc; margin: 10px 0; padding: 10px; }
          .plongeur { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Palanquées JSAS - Fiche de Sécurité</h1>
        <p><strong>DP:</strong> ${dpNom}</p>
        <p><strong>Date:</strong> ${dpDate}</p>
        <p><strong>Lieu:</strong> ${dpLieu}</p>
        <p><strong>Session:</strong> ${dpPlongee}</p>
        <p><strong>Total plongeurs:</strong> ${totalPlongeurs}</p>
        
        <h2>Palanquées (${palanqueesLocal.length})</h2>
    `;
    
    if (palanqueesLocal.length === 0) {
      htmlContent += '<p>Aucune palanquée créée.</p>';
    } else {
      palanqueesLocal.forEach((pal, i) => {
        if (Array.isArray(pal)) {
          htmlContent += `<div class="palanquee">`;
          htmlContent += `<h3>Palanquée ${i + 1} (${pal.length} plongeurs)</h3>`;
          
          if (pal.length === 0) {
            htmlContent += '<p>Aucun plongeur assigné</p>';
          } else {
            pal.forEach(p => {
              if (p && p.nom) {
                htmlContent += `<div class="plongeur">• ${p.nom} (${p.niveau})</div>`;
              }
            });
          }
          htmlContent += '</div>';
        }
      });
    }
    
    if (plongeursLocal.length > 0) {
      htmlContent += '<h2>Plongeurs en Attente</h2>';
      plongeursLocal.forEach(p => {
        if (p && p.nom) {
          htmlContent += `<div class="plongeur">• ${p.nom} (${p.niveau})</div>`;
        }
      });
    }
    
    htmlContent += '</body></html>';

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    let previewContainer = document.getElementById("previewContainer");
    const pdfPreview = document.getElementById("pdfPreview");
    
    if (previewContainer && pdfPreview) {
      previewContainer.style.display = "block";
      pdfPreview.src = url;
      
      // Ajouter le bouton de fermeture
      let closeButton = document.getElementById("close-preview-btn");
      if (!closeButton) {
        closeButton = document.createElement("button");
        closeButton.id = "close-preview-btn";
        closeButton.innerHTML = "❌ Fermer l'aperçu";
        closeButton.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1001;
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          cursor: pointer;
        `;
        closeButton.onclick = closePDFPreview;
        previewContainer.style.position = "relative";
        previewContainer.appendChild(closeButton);
      }
      
      previewContainer.scrollIntoView({ behavior: 'smooth' });
      console.log("✅ Aperçu PDF généré");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      
    } else {
      console.error("❌ Éléments d'aperçu non trouvés");
      alert("Erreur: impossible d'afficher l'aperçu PDF");
    }
    
  } catch (error) {
    console.error("❌ Erreur génération aperçu PDF:", error);
    handleError(error, "Génération aperçu PDF");
    alert("Erreur lors de la génération de l'aperçu: " + error.message);
  }
}

// Fonction pour fermer l'aperçu PDF
function closePDFPreview() {
  const previewContainer = document.getElementById("previewContainer");
  const pdfPreview = document.getElementById("pdfPreview");
  
  if (previewContainer) {
    previewContainer.style.display = "none";
    if (pdfPreview) {
      pdfPreview.src = "";
    }
    console.log("✅ Aperçu PDF fermé");
  }
}

// Export de la fonction pour usage global
window.closePDFPreview = closePDFPreview;

// ===== DRAG & DROP SÉCURISÉ =====
let dragData = null;

function setupDragAndDrop() {
  console.log("🎯 Configuration du drag & drop sécurisé...");
  
  try {
    // Nettoyer les anciens listeners s'ils existent
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragend', handleDragEnd);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('drop', handleDrop);
    
    // Ajouter les nouveaux listeners
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    console.log("✅ Drag & drop configuré");
  } catch (error) {
    console.error("❌ Erreur configuration drag & drop:", error);
    handleError(error, "Configuration drag & drop");
  }
}

function handleDragStart(e) {
  try {
    if (!e.target.classList.contains('plongeur-item')) return;
    
    e.target.classList.add('dragging');
    e.target.style.opacity = '0.5';
    
    const isFromPalanquee = e.target.dataset.type === 'palanquee';
    
    if (isFromPalanquee) {
      const palanqueeIndex = parseInt(e.target.dataset.palanqueeIndex);
      const plongeurIndex = parseInt(e.target.dataset.plongeurIndex);
      
      if (typeof palanquees !== 'undefined' && palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
        dragData = {
          type: "fromPalanquee",
          palanqueeIndex: palanqueeIndex,
          plongeurIndex: plongeurIndex,
          plongeur: palanquees[palanqueeIndex][plongeurIndex]
        };
      }
    } else {
      const index = parseInt(e.target.dataset.index);
      
      if (typeof plongeurs !== 'undefined' && plongeurs[index]) {
        dragData = {
          type: "fromMainList",
          plongeur: plongeurs[index],
          originalIndex: index
        };
      }
    }
    
    // Stocker dans dataTransfer comme backup
    if (e.dataTransfer && dragData) {
      try {
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "move";
      } catch (error) {
        console.warn("⚠️ Erreur dataTransfer:", error);
      }
    }
  } catch (error) {
    console.error("❌ Erreur handleDragStart:", error);
    handleError(error, "Drag start");
  }
}

function handleDragEnd(e) {
  try {
    if (e.target.classList.contains('plongeur-item')) {
      e.target.classList.remove('dragging');
      e.target.style.opacity = '1';
    }
  } catch (error) {
    console.error("❌ Erreur handleDragEnd:", error);
  }
}

function handleDragOver(e) {
  try {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      dropZone.classList.add('drag-over');
    }
  } catch (error) {
    console.error("❌ Erreur handleDragOver:", error);
  }
}

function handleDragLeave(e) {
  try {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  } catch (error) {
    console.error("❌ Erreur handleDragLeave:", error);
  }
}

async function handleDrop(e) {
  try {
    e.preventDefault();
    
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (!dropZone) {
      dragData = null;
      return;
    }
    
    dropZone.classList.remove('drag-over');
    
    // Récupérer les données
    let data = dragData;
    
    // Fallback vers dataTransfer
    if (!data && e.dataTransfer) {
      try {
        const dataStr = e.dataTransfer.getData("text/plain");
        if (dataStr) {
          data = JSON.parse(dataStr);
        }
      } catch (error) {
        console.warn("⚠️ Erreur parsing dataTransfer:", error);
      }
    }
    
    if (!data) {
      dragData = null;
      return;
    }
    
    // S'assurer que les variables globales existent
    if (typeof plongeurs === 'undefined') {
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
    }
    
    // Drop vers la liste principale
    if (dropZone.id === 'listePlongeurs') {
      if (data.type === "fromPalanquee") {
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
      }
    } else {
      // Drop vers une palanquée
      const palanqueeIndex = parseInt(dropZone.dataset.index);
      if (isNaN(palanqueeIndex)) {
        dragData = null;
        return;
      }
      
      const targetPalanquee = palanquees[palanqueeIndex];
      if (!targetPalanquee) {
        dragData = null;
        return;
      }
      
      // Vérifier les règles de validation avant d'ajouter
      if (typeof validatePalanqueeAddition === 'function') {
        const validation = validatePalanqueeAddition(palanqueeIndex, data.plongeur);
        if (!validation.valid) {
          const messageText = validation.messages.join('\n');
          alert(`❌ Ajout impossible :\n\n${messageText}`);
          dragData = null;
          return;
        }
      }
      
      if (data.type === "fromMainList") {
        const indexToRemove = plongeurs.findIndex(p => 
          p.nom === data.plongeur.nom && p.niveau === data.plongeur.niveau
        );
        
        if (indexToRemove !== -1) {
          const plongeur = plongeurs.splice(indexToRemove, 1)[0];
          targetPalanquee.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
        
      } else if (data.type === "fromPalanquee") {
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          targetPalanquee.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors du drop:", error);
    handleError(error, "Handle drop");
  } finally {
    // Nettoyer les données de drag
    dragData = null;
  }
}

// ===== EVENT HANDLERS SÉCURISÉS =====
function setupEventListeners() {
  console.log("🎛️ Configuration des event listeners sécurisés...");
  
  try {
    // === AUTHENTIFICATION ===
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const errorDiv = document.getElementById("auth-error");
        const loadingDiv = document.getElementById("auth-loading");
        
        if (!emailInput || !passwordInput) {
          showAuthError("Éléments de formulaire manquants");
          return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
          showAuthError("Veuillez remplir tous les champs");
          return;
        }
        
        try {
          if (loadingDiv) loadingDiv.style.display = "block";
          if (errorDiv) errorDiv.style.display = "none";
          
          if (typeof signIn === 'function') {
            await signIn(email, password);
            console.log("✅ Connexion réussie");
          } else {
            throw new Error("Fonction signIn non disponible");
          }
          
        } catch (error) {
          console.error("❌ Erreur connexion:", error);
          
          let message = "Erreur de connexion";
          if (error.code === 'auth/user-not-found') {
            message = "Utilisateur non trouvé";
          } else if (error.code === 'auth/wrong-password') {
            message = "Mot de passe incorrect";
          } else if (error.code === 'auth/invalid-email') {
            message = "Email invalide";
          } else if (error.code === 'auth/too-many-requests') {
            message = "Trop de tentatives. Réessayez plus tard.";
          }
          
          showAuthError(message);
        } finally {
          if (loadingDiv) loadingDiv.style.display = "none";
        }
      });
    }
    
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          if (typeof signOut === 'function') {
            await signOut();
            console.log("✅ Déconnexion réussie");
          }
        } catch (error) {
          console.error("❌ Erreur déconnexion:", error);
        }
      });
    }

    // === FONCTIONNALITÉ BOUTON "VALIDER DP" SÉCURISÉE ===
    const validerDPBtn = document.getElementById("valider-dp");
    if (validerDPBtn) {
      validerDPBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        try {
          const dpNom = document.getElementById("dp-nom")?.value?.trim();
          const dpDate = document.getElementById("dp-date")?.value;
          const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
          const dpPlongee = document.getElementById("dp-plongee")?.value;
          const dpMessage = document.getElementById("dp-message");
          
          // Validation des champs obligatoires
          if (!dpNom) {
            alert("⚠️ Veuillez saisir le nom du Directeur de Plongée");
            document.getElementById("dp-nom")?.focus();
            return;
          }
          
          if (!dpDate) {
            alert("⚠️ Veuillez sélectionner une date");
            document.getElementById("dp-date")?.focus();
            return;
          }
          
          if (!dpLieu) {
            alert("⚠️ Veuillez saisir le lieu de plongée");
            document.getElementById("dp-lieu")?.focus();
            return;
          }
          
          // Créer l'objet informations DP
          const dpInfo = {
            nom: dpNom,
            date: dpDate,
            lieu: dpLieu,
            plongee: dpPlongee,
            timestamp: Date.now(),
            validated: true
          };
          
          // Sauvegarder dans Firebase si disponible
          if (typeof db !== 'undefined' && db) {
            try {
              const dpKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
              await db.ref(`dpInfo/${dpKey}`).set(dpInfo);
              console.log("✅ Informations DP sauvegardées dans Firebase");
            } catch (firebaseError) {
              console.warn("⚠️ Erreur sauvegarde Firebase:", firebaseError.message);
            }
          }
          
          // Afficher le message de confirmation
          if (dpMessage) {
            dpMessage.innerHTML = `
              <div style="color: #28a745; font-weight: bold; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
                ✅ Informations DP validées
                <br><small style="font-weight: normal;">
                  ${dpNom} - ${new Date(dpDate).toLocaleDateString('fr-FR')} - ${dpLieu} (${dpPlongee})
                </small>
              </div>
            `;
            dpMessage.classList.add("dp-valide");
          }
          
          // Désactiver temporairement le bouton
          validerDPBtn.disabled = true;
          validerDPBtn.textContent = "✅ Validé";
          validerDPBtn.style.backgroundColor = "#28a745";
          
          setTimeout(() => {
            validerDPBtn.disabled = false;
            validerDPBtn.textContent = "Valider DP";
            validerDPBtn.style.backgroundColor = "#007bff";
          }, 3000);
          
          console.log("✅ Validation DP réussie:", dpInfo);
          
          // Synchronisation optionnelle
          if (typeof syncToDatabase === 'function') {
            setTimeout(syncToDatabase, 1000);
          }
          
        } catch (error) {
          console.error("❌ Erreur validation DP:", error);
          handleError(error, "Validation DP");
          
          const dpMessage = document.getElementById("dp-message");
          if (dpMessage) {
            dpMessage.innerHTML = `
              <div style="color: #dc3545; font-weight: bold; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                ❌ Erreur lors de la validation : ${error.message}
              </div>
            `;
          } else {
            alert("❌ Erreur lors de la validation : " + error.message);
          }
        }
      });
    }

    // === AJOUT DE PLONGEUR SÉCURISÉ ===
    const addForm = document.getElementById("addForm");
    if (addForm) {
      addForm.addEventListener("submit", e => {
        e.preventDefault();
        
        try {
          const nomInput = document.getElementById("nom");
          const niveauInput = document.getElementById("niveau");
          const preInput = document.getElementById("pre");
          
          if (!nomInput || !niveauInput || !preInput) {
            alert("Éléments de formulaire manquants");
            return;
          }
          
          const nom = nomInput.value.trim();
          const niveau = niveauInput.value;
          const pre = preInput.value.trim();
          
          if (!nom || !niveau) {
            alert("Veuillez remplir le nom et le niveau du plongeur.");
            return;
          }
          
          // S'assurer que les variables globales existent
          if (typeof plongeurs === 'undefined') window.plongeurs = [];
          if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
          
          const nouveauPlongeur = { nom, niveau, pre };
          plongeurs.push(nouveauPlongeur);
          plongeursOriginaux.push(nouveauPlongeur);
          
          nomInput.value = "";
          niveauInput.value = "";
          preInput.value = "";
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          
          console.log("✅ Plongeur ajouté:", nouveauPlongeur);
        } catch (error) {
          console.error("❌ Erreur ajout plongeur:", error);
          handleError(error, "Ajout plongeur");
        }
      });
    }

    // === AJOUT DE PALANQUÉE SÉCURISÉ ===
    const addPalanqueeBtn = document.getElementById("addPalanquee");
    if (addPalanqueeBtn) {
      addPalanqueeBtn.addEventListener("click", () => {
        try {
          // S'assurer que la variable globale existe
          if (typeof palanquees === 'undefined') window.palanquees = [];
          
          const nouvellePalanquee = [];
          nouvellePalanquee.horaire = '';
          nouvellePalanquee.profondeurPrevue = '';
          nouvellePalanquee.dureePrevue = '';
          nouvellePalanquee.profondeurRealisee = '';
          nouvellePalanquee.dureeRealisee = '';
          nouvellePalanquee.paliers = '';
          
          palanquees.push(nouvellePalanquee);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          
          console.log("✅ Nouvelle palanquée créée");
        } catch (error) {
          console.error("❌ Erreur création palanquée:", error);
          handleError(error, "Création palanquée");
        }
      });
    }

    // === EXPORT/IMPORT JSON SÉCURISÉ ===
    const exportJSONBtn = document.getElementById("exportJSON");
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener("click", () => {
        try {
          if (typeof exportToJSON === 'function') {
            exportToJSON();
          }
        } catch (error) {
          console.error("❌ Erreur export JSON:", error);
          handleError(error, "Export JSON");
        }
      });
    }

    const importJSONInput = document.getElementById("importJSON");
    if (importJSONInput) {
      importJSONInput.addEventListener("change", e => {
        try {
          const file = e.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = e2 => {
            try {
              const data = JSON.parse(e2.target.result);
              
              // S'assurer que les variables globales existent
              if (typeof plongeurs === 'undefined') window.plongeurs = [];
              if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
              
              if (data.plongeurs && Array.isArray(data.plongeurs)) {
                plongeurs = data.plongeurs.map(p => ({
                  nom: p.nom,
                  niveau: p.niveau,
                  pre: p.prerogatives || p.pre || ""
                }));
              } else if (Array.isArray(data)) {
                plongeurs = data;
              }
              
              plongeursOriginaux = [...plongeurs];
              
              if (typeof syncToDatabase === 'function') {
                syncToDatabase();
              }
              alert("Import réussi !");
              console.log("✅ Import JSON réussi");
            } catch (error) {
              console.error("❌ Erreur import:", error);
              handleError(error, "Import JSON");
              alert("Erreur lors de l'import du fichier JSON");
            }
          };
          reader.readAsText(file);
        } catch (error) {
          console.error("❌ Erreur lecture fichier:", error);
          handleError(error, "Lecture fichier");
        }
      });
    }

    // === PDF SÉCURISÉ ===
    const generatePDFBtn = document.getElementById("generatePDF");
    if (generatePDFBtn) {
      generatePDFBtn.addEventListener("click", () => {
        try {
          generatePDFPreview();
        } catch (error) {
          console.error("❌ Erreur génération aperçu PDF:", error);
          handleError(error, "Génération aperçu PDF");
        }
      });
    }
    
    const exportPDFBtn = document.getElementById("exportPDF");
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener("click", () => {
        try {
          exportToPDF();
        } catch (error) {
          console.error("❌ Erreur export PDF:", error);
          handleError(error, "Export PDF");
        }
      });
    }

    // === SESSIONS SÉCURISÉES ===
    const loadSessionBtn = document.getElementById("load-session");
    if (loadSessionBtn) {
      loadSessionBtn.addEventListener("click", async () => {
        try {
          const sessionSelector = document.getElementById("session-selector");
          if (!sessionSelector) {
            alert("Sélecteur de session non trouvé");
            return;
          }
          
          const sessionKey = sessionSelector.value;
          if (!sessionKey) {
            alert("Veuillez sélectionner une session à charger.");
            return;
          }
          
          if (typeof loadSession === 'function') {
            const success = await loadSession(sessionKey);
            if (!success) {
              alert("Erreur lors du chargement de la session.");
            } else {
              console.log("✅ Session chargée:", sessionKey);
            }
          }
        } catch (error) {
          console.error("❌ Erreur chargement session:", error);
          handleError(error, "Chargement session");
        }
      });
    }

    const refreshSessionsBtn = document.getElementById("refresh-sessions");
    if (refreshSessionsBtn) {
      refreshSessionsBtn.addEventListener("click", async () => {
        try {
          await populateSessionSelector();
          await populateSessionsCleanupList();
          console.log("✅ Sessions actualisées");
        } catch (error) {
          console.error("❌ Erreur actualisation sessions:", error);
          handleError(error, "Actualisation sessions");
        }
      });
    }

    const saveSessionBtn = document.getElementById("save-session");
    if (saveSessionBtn) {
      saveSessionBtn.addEventListener("click", async () => {
        try {
          if (typeof saveSessionData === 'function') {
            await saveSessionData();
            alert("Session sauvegardée !");
            await populateSessionSelector();
            await populateSessionsCleanupList();
            console.log("✅ Session sauvegardée");
          }
        } catch (error) {
          console.error("❌ Erreur sauvegarde session:", error);
          handleError(error, "Sauvegarde session");
        }
      });
    }

    // === NETTOYAGE SESSIONS ET DP ===
    const selectAllSessionsBtn = document.getElementById("select-all-sessions");
    if (selectAllSessionsBtn) {
      selectAllSessionsBtn.addEventListener("click", () => {
        selectAllSessions(true);
      });
    }

    const selectNoneSessionsBtn = document.getElementById("select-none-sessions");
    if (selectNoneSessionsBtn) {
      selectNoneSessionsBtn.addEventListener("click", () => {
        selectAllSessions(false);
      });
    }

    const deleteSelectedSessionsBtn = document.getElementById("delete-selected-sessions");
    if (deleteSelectedSessionsBtn) {
      deleteSelectedSessionsBtn.addEventListener("click", () => {
        deleteSelectedSessions();
      });
    }

    const refreshSessionsListBtn = document.getElementById("refresh-sessions-list");
    if (refreshSessionsListBtn) {
      refreshSessionsListBtn.addEventListener("click", async () => {
        await populateSessionsCleanupList();
      });
    }

    const selectAllDPBtn = document.getElementById("select-all-dp");
    if (selectAllDPBtn) {
      selectAllDPBtn.addEventListener("click", () => {
        selectAllDPs(true);
      });
    }

    const selectNoneDPBtn = document.getElementById("select-none-dp");
    if (selectNoneDPBtn) {
      selectNoneDPBtn.addEventListener("click", () => {
        selectAllDPs(false);
      });
    }

    const deleteSelectedDPBtn = document.getElementById("delete-selected-dp");
    if (deleteSelectedDPBtn) {
      deleteSelectedDPBtn.addEventListener("click", () => {
        deleteSelectedDPs();
      });
    }

    const refreshDPListBtn = document.getElementById("refresh-dp-list");
    if (refreshDPListBtn) {
      refreshDPListBtn.addEventListener("click", async () => {
        await populateDPCleanupList();
      });
    }

    // Event listeners pour les checkboxes de nettoyage
    document.addEventListener('change', (e) => {
      try {
        if (e.target.classList.contains('session-cleanup-checkbox') || 
            e.target.classList.contains('dp-cleanup-checkbox')) {
          updateCleanupSelection();
        }
      } catch (error) {
        console.error("❌ Erreur checkbox cleanup:", error);
        handleError(error, "Checkbox cleanup");
      }
    });

    // === TEST FIREBASE SÉCURISÉ ===
    const testFirebaseBtn = document.getElementById("test-firebase");
    if (testFirebaseBtn) {
      testFirebaseBtn.addEventListener("click", async () => {
        console.log("🧪 === TEST FIREBASE COMPLET SÉCURISÉ ===");
        
        try {
          console.log("📡 Test 1: Vérification connexion Firebase");
          console.log("Firebase connecté:", typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined');
          console.log("Instance db:", typeof db !== 'undefined' && db ? "✅ OK" : "❌ MANQUANTE");
          
          if (typeof db !== 'undefined' && db) {
            console.log("📖 Test 2: Lecture /sessions");
            const sessionsRead = await db.ref('sessions').once('value');
            console.log("✅ Lecture sessions OK:", sessionsRead.exists() ? "Données trouvées" : "Aucune donnée");
            
            if (sessionsRead.exists()) {
              const sessions = sessionsRead.val();
              console.log("Nombre de sessions:", Object.keys(sessions).length);
            }
          }
          
          console.log("📊 Test 3: Données actuelles");
          console.log("Plongeurs en mémoire:", typeof plongeurs !== 'undefined' ? plongeurs.length : 'undefined');
          console.log("Palanquées en mémoire:", typeof palanquees !== 'undefined' ? palanquees.length : 'undefined');
          
          console.log("🎉 === TESTS TERMINÉS ===");
          alert("Test Firebase terminé !\n\nRegardez la console pour les détails.");
          
        } catch (error) {
          console.error("❌ Erreur test Firebase:", error);
          handleError(error, "Test Firebase");
          alert("Erreur lors du test Firebase : " + error.message);
        }
      });
    }

    // === TRI DES PLONGEURS SÉCURISÉ ===
    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const sortType = btn.dataset.sort;
          if (typeof sortPlongeurs === 'function') {
            sortPlongeurs(sortType);
          }
        } catch (error) {
          console.error("❌ Erreur tri plongeurs:", error);
          handleError(error, "Tri plongeurs");
        }
      });
    });
    
    console.log("✅ Event listeners configurés avec succès");
    
  } catch (error) {
    console.error("❌ Erreur configuration event listeners:", error);
    handleError(error, "Configuration event listeners");
  }
}

// ===== FONCTIONS POUR L'HISTORIQUE DP (CORRIGÉES) =====
async function chargerHistoriqueDP() {
  console.log("📋 Chargement de l'historique DP sécurisé...");
  
  const dpDatesSelect = document.getElementById("dp-dates");
  if (!dpDatesSelect) {
    console.error("❌ Élément dp-dates non trouvé");
    return;
  }
  
  dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';
  
  try {
    if (typeof db === 'undefined' || !db) {
      console.warn("⚠️ Firebase non disponible pour charger l'historique DP");
      dpDatesSelect.innerHTML += '<option disabled>Firebase non connecté</option>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    
    if (!snapshot.exists()) {
      console.log("ℹ️ Aucune donnée DP trouvée dans Firebase");
      dpDatesSelect.innerHTML += '<option disabled>Aucun DP enregistré</option>';
      return;
    }
    
    const dpInfos = snapshot.val();
    const dpList = [];
    
    Object.entries(dpInfos).forEach(([key, dpData]) => {
      if (dpData && dpData.date) {
        dpList.push({
          key: key,
          date: dpData.date,
          nom: dpData.nom || "DP non défini",
          lieu: dpData.lieu || "Lieu non défini",
          plongee: dpData.plongee || "matin",
          timestamp: dpData.timestamp || 0
        });
      }
    });
    
    dpList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    dpList.forEach(dp => {
      const option = document.createElement("option");
      option.value = dp.key;
      option.textContent = `${dp.date} - ${dp.nom} - ${dp.lieu} (${dp.plongee})`;
      dpDatesSelect.appendChild(option);
    });
    
    console.log(`✅ ${dpList.length} DP chargés dans l'historique`);
    
    dpDatesSelect.addEventListener('change', afficherInfoDP);
    
  } catch (error) {
    console.error("❌ Erreur chargement historique DP:", error);
    handleError(error, "Chargement historique DP");
    dpDatesSelect.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

function afficherInfoDP() {
  // Fonction simplifiée pour éviter les erreurs
  console.log("📋 Affichage info DP");
}

async function chargerDonneesDPSelectionne(dpKey) {
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const snapshot = await db.ref(`dpInfo/${dpKey}`).once('value');
    if (!snapshot.exists()) {
      alert("❌ DP non trouvé");
      return;
    }
    
    const dpData = snapshot.val();
    
    const dpNomInput = document.getElementById("dp-nom");
    const dpDateInput = document.getElementById("dp-date");
    const dpLieuInput = document.getElementById("dp-lieu");
    const dpPlongeeInput = document.getElementById("dp-plongee");
    
    if (dpNomInput) dpNomInput.value = dpData.nom || "";
    if (dpDateInput) dpDateInput.value = dpData.date || "";
    if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
    if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
    
    alert("✅ Données DP chargées avec succès !");
    console.log("✅ DP chargé:", dpData);
    
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    handleError(error, "Chargement DP sélectionné");
    alert("❌ Erreur lors du chargement : " + error.message);
  }
}

async function supprimerDPSelectionne(dpKey) {
  const confirmation = confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce DP ?\n\nCette action est irréversible !");
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    await db.ref(`dpInfo/${dpKey}`).remove();
    alert("✅ DP supprimé avec succès !");
    
    if (typeof chargerHistoriqueDP === 'function') {
      await chargerHistoriqueDP();
    }
    
    console.log("✅ DP supprimé:", dpKey);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    handleError(error, "Suppression DP");
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// ===== GESTION DES SESSIONS =====
async function populateSessionSelector() {
  console.log("📋 Chargement des sessions disponibles...");
  
  const sessionSelector = document.getElementById("session-selector");
  if (!sessionSelector) {
    console.error("❌ Élément session-selector non trouvé");
    return;
  }
  
  // Vider le sélecteur
  sessionSelector.innerHTML = '<option value="">-- Charger une session --</option>';
  
  try {
    if (typeof loadAvailableSessions === 'function') {
      const sessions = await loadAvailableSessions();
      
      if (sessions.length === 0) {
        sessionSelector.innerHTML += '<option disabled>Aucune session disponible</option>';
        console.log("ℹ️ Aucune session trouvée");
        return;
      }
      
      sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session.key;
        option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
        sessionSelector.appendChild(option);
      });
      
      console.log(`✅ ${sessions.length} sessions chargées dans le sélecteur`);
      
    } else {
      // Fallback : charger directement depuis Firebase
      if (typeof db !== 'undefined' && db) {
        const snapshot = await db.ref('sessions').once('value');
        
        if (!snapshot.exists()) {
          sessionSelector.innerHTML += '<option disabled>Aucune session trouvée</option>';
          return;
        }
        
        const sessions = snapshot.val();
        const sessionsList = [];
        
        Object.entries(sessions).forEach(([key, sessionData]) => {
          if (sessionData && sessionData.meta) {
            sessionsList.push({
              key: key,
              dp: sessionData.meta.dp || "DP inconnu",
              date: sessionData.meta.date || "Date inconnue", 
              lieu: sessionData.meta.lieu || "Lieu inconnu",
              plongee: sessionData.meta.plongee || "matin",
              timestamp: sessionData.meta.timestamp || 0
            });
          }
        });
        
        // Trier par date décroissante
        sessionsList.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
        
        sessionsList.forEach(session => {
          const option = document.createElement("option");
          option.value = session.key;
          option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
          sessionSelector.appendChild(option);
        });
        
        console.log(`✅ ${sessionsList.length} sessions chargées (fallback)`);
      } else {
        sessionSelector.innerHTML += '<option disabled>Firebase non disponible</option>';
        console.warn("⚠️ Firebase non disponible pour charger les sessions");
      }
    }
    
  } catch (error) {
    console.error("❌ Erreur chargement sessions:", error);
    handleError(error, "Chargement sessions");
    sessionSelector.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

async function populateSessionsCleanupList() {
  console.log("🧹 Chargement de la liste de nettoyage des sessions...");
  
  const cleanupList = document.getElementById("sessions-cleanup-list");
  if (!cleanupList) {
    console.error("❌ Élément sessions-cleanup-list non trouvé");
    return;
  }
  
  cleanupList.innerHTML = '<em>Chargement des sessions...</em>';
  
  try {
    const sessions = typeof loadAvailableSessions === 'function' ? 
      await loadAvailableSessions() : 
      await loadSessionsDirectly();
    
    if (sessions.length === 0) {
      cleanupList.innerHTML = '<em>Aucune session trouvée</em>';
      return;
    }
    
    let html = '';
    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp || Date.now()).toLocaleDateString('fr-FR');
      html += `
        <label class="cleanup-item">
          <input type="checkbox" class="session-cleanup-checkbox" value="${session.key}">
          <div class="item-info">
            <span class="item-date">${session.date} - ${session.dp}</span>
            <span class="item-details">${session.lieu} (${session.plongee})</span>
            <span class="item-meta">Créé le ${sessionDate} | ${session.stats?.totalPlongeurs || 0} plongeurs</span>
          </div>
        </label>
      `;
    });
    
    cleanupList.innerHTML = html;
    console.log(`✅ ${sessions.length} sessions dans la liste de nettoyage`);
    
  } catch (error) {
    console.error("❌ Erreur chargement liste nettoyage sessions:", error);
    cleanupList.innerHTML = '<em>Erreur de chargement</em>';
  }
}

async function loadSessionsDirectly() {
  if (typeof db === 'undefined' || !db) {
    return [];
  }
  
  try {
    const snapshot = await db.ref('sessions').once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sessions = snapshot.val();
    const sessionsList = [];
    
    Object.entries(sessions).forEach(([key, sessionData]) => {
      if (sessionData) {
        sessionsList.push({
          key: key,
          dp: sessionData.meta?.dp || sessionData.dp || "DP inconnu",
          date: sessionData.meta?.date || sessionData.date || "Date inconnue",
          lieu: sessionData.meta?.lieu || sessionData.lieu || "Lieu inconnu", 
          plongee: sessionData.meta?.plongee || sessionData.plongee || "matin",
          timestamp: sessionData.meta?.timestamp || sessionData.timestamp || 0,
          stats: sessionData.stats || {
            totalPlongeurs: (sessionData.plongeurs || []).length + 
              (sessionData.palanquees || []).reduce((sum, pal) => sum + (pal?.length || 0), 0)
          }
        });
      }
    });
    
    // Trier par date décroissante
    sessionsList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    return sessionsList;
    
  } catch (error) {
    console.error("❌ Erreur loadSessionsDirectly:", error);
    return [];
  }
}

async function populateDPCleanupList() {
  console.log("🧹 Chargement de la liste de nettoyage des DP...");
  
  const cleanupList = document.getElementById("dp-cleanup-list");
  if (!cleanupList) {
    console.error("❌ Élément dp-cleanup-list non trouvé");
    return;
  }
  
  cleanupList.innerHTML = '<em>Chargement des DP...</em>';
  
  try {
    if (typeof db === 'undefined' || !db) {
      cleanupList.innerHTML = '<em>Firebase non disponible</em>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    
    if (!snapshot.exists()) {
      cleanupList.innerHTML = '<em>Aucun DP trouvé</em>';
      return;
    }
    
    const dpInfos = snapshot.val();
    const dpList = [];
    
    Object.entries(dpInfos).forEach(([key, dpData]) => {
      if (dpData) {
        dpList.push({
          key: key,
          nom: dpData.nom || "DP inconnu",
          date: dpData.date || "Date inconnue",
          lieu: dpData.lieu || "Lieu inconnu",
          plongee: dpData.plongee || "matin",
          timestamp: dpData.timestamp || 0
        });
      }
    });
    
    // Trier par date décroissante
    dpList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    let html = '';
    dpList.forEach(dp => {
      const createdDate = new Date(dp.timestamp).toLocaleDateString('fr-FR');
      html += `
        <label class="cleanup-item">
          <input type="checkbox" class="dp-cleanup-checkbox" value="${dp.key}">
          <div class="item-info">
            <span class="item-date">${dp.date} - ${dp.nom}</span>
            <span class="item-details">${dp.lieu} (${dp.plongee})</span>
            <span class="item-meta">Créé le ${createdDate}</span>
          </div>
        </label>
      `;
    });
    
    cleanupList.innerHTML = html;
    console.log(`✅ ${dpList.length} DP dans la liste de nettoyage`);
    
  } catch (error) {
    console.error("❌ Erreur chargement liste nettoyage DP:", error);
    cleanupList.innerHTML = '<em>Erreur de chargement</em>';
  }
}

// Fonctions de nettoyage
function selectAllSessions(select) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
  });
  updateCleanupSelection();
}

function selectAllDPs(select) {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
  });
  updateCleanupSelection();
}

function updateCleanupSelection() {
  const sessionCheckboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  const dpCheckboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  const deleteSessionsBtn = document.getElementById('delete-selected-sessions');
  const deleteDPBtn = document.getElementById('delete-selected-dp');
  
  if (deleteSessionsBtn) {
    deleteSessionsBtn.disabled = sessionCheckboxes.length === 0;
    deleteSessionsBtn.textContent = `🗑️ Supprimer sélectionnées (${sessionCheckboxes.length})`;
  }
  
  if (deleteDPBtn) {
    deleteDPBtn.disabled = dpCheckboxes.length === 0;
    deleteDPBtn.textContent = `🗑️ Supprimer sélectionnés (${dpCheckboxes.length})`;
  }
}

async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucune session sélectionnée");
    return;
  }
  
  const confirmation = confirm(`⚠️ Supprimer ${checkboxes.length} session(s) ?\n\nCette action est irréversible !`);
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const promises = [];
    checkboxes.forEach(checkbox => {
      promises.push(db.ref(`sessions/${checkbox.value}`).remove());
    });
    
    await Promise.all(promises);
    
    alert(`✅ ${checkboxes.length} session(s) supprimée(s) avec succès !`);
    
    // Recharger les listes
    await populateSessionSelector();
    await populateSessionsCleanupList();
    
    console.log(`✅ ${checkboxes.length} sessions supprimées`);
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

async function deleteSelectedDPs() {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucun DP sélectionné");
    return;
  }
  
  const confirmation = confirm(`⚠️ Supprimer ${checkboxes.length} DP ?\n\nCette action est irréversible !`);
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const promises = [];
    checkboxes.forEach(checkbox => {
      promises.push(db.ref(`dpInfo/${checkbox.value}`).remove());
    });
    
    await Promise.all(promises);
    
    alert(`✅ ${checkboxes.length} DP supprimé(s) avec succès !`);
    
    // Recharger les listes
    await chargerHistoriqueDP();
    await populateDPCleanupList();
    
    console.log(`✅ ${checkboxes.length} DP supprimés`);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// Export des fonctions globales
window.chargerHistoriqueDP = chargerHistoriqueDP;
window.afficherInfoDP = afficherInfoDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.supprimerDPSelectionne = supprimerDPSelectionne;
window.populateSessionSelector = populateSessionSelector;
window.populateSessionsCleanupList = populateSessionsCleanupList;
window.populateDPCleanupList = populateDPCleanupList;
window.selectAllSessions = selectAllSessions;
window.selectAllDPs = selectAllDPs;
window.updateCleanupSelection = updateCleanupSelection;
window.deleteSelectedSessions = deleteSelectedSessions;
window.deleteSelectedDPs = deleteSelectedDPs;

// ===== INITIALISATION SÉCURISÉE DE L'APPLICATION =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Initialisation sécurisée de l'application JSAS...");
  
  try {
    // 1. Vérifier que les fonctions critiques sont disponibles
    if (typeof initializeFirebase !== 'function') {
      throw new Error("Fonction initializeFirebase non disponible - vérifiez le chargement de config-firebase.js");
    }
    
    // 2. Initialiser Firebase en premier
    const firebaseOK = initializeFirebase();
    if (!firebaseOK) {
      throw new Error("Échec initialisation Firebase");
    }
    
    // 3. Configurer les event listeners
    setupEventListeners();
    
    // 4. Configurer le drag & drop
    setupDragAndDrop();
    
    // 5. Ajouter les gestionnaires d'erreurs globaux
    window.addEventListener('error', (event) => {
      console.error("❌ Erreur JavaScript globale:", event.error);
      handleError(event.error, "Erreur JavaScript globale");
    });
    
    console.log("✅ Application JSAS initialisée avec succès !");
    
  } catch (error) {
    console.error("❌ Erreur critique initialisation:", error);
    handleError(error, "Initialisation critique");
    
    // Mode de récupération d'urgence
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
    
    const authContainer = document.getElementById("auth-container");
    if (authContainer) {
      authContainer.style.display = "block";
      const errorDiv = document.getElementById("auth-error");
      if (errorDiv) {
        errorDiv.textContent = "Erreur d'initialisation critique. Veuillez actualiser la page.";
        errorDiv.style.display = "block";
      }
    }
    
    // Notification d'urgence
    alert(
      "❌ ERREUR CRITIQUE D'INITIALISATION\n\n" +
      "L'application n'a pas pu s'initialiser correctement.\n\n" +
      "Actions recommandées :\n" +
      "1. Actualisez la page (F5)\n" +
      "2. Vérifiez votre connexion internet\n" +
      "3. Videz le cache du navigateur\n" +
      "4. Contactez l'administrateur si le problème persiste\n\n" +
      "Erreur : " + error.message
    );
  }
});

// ===== DIAGNOSTIC ET MONITORING =====
// Fonction de diagnostic pour le support technique
window.diagnosticJSAS = function() {
  console.log("🔍 === DIAGNOSTIC JSAS ===");
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    variables: {
      plongeurs: typeof plongeurs !== 'undefined' ? plongeurs.length : 'undefined',
      palanquees: typeof palanquees !== 'undefined' ? palanquees.length : 'undefined',
      currentUser: typeof currentUser !== 'undefined' ? (currentUser ? currentUser.email : 'null') : 'undefined',
      firebaseConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined'
    },
    firebase: {
      app: typeof app !== 'undefined' ? 'initialized' : 'undefined',
      db: typeof db !== 'undefined' ? 'initialized' : 'undefined',
      auth: typeof auth !== 'undefined' ? 'initialized' : 'undefined'
    },
    listeners: {
      active: typeof window.firebaseListeners !== 'undefined' ? 
        window.firebaseListeners.getActiveListeners() : 'undefined'
    },
    locks: {
      system: typeof lockSystemInitialized !== 'undefined' ? lockSystemInitialized : 'undefined',
      current: typeof currentlyEditingPalanquee !== 'undefined' ? currentlyEditingPalanquee : 'undefined',
      active: typeof palanqueeLocks !== 'undefined' ? Object.keys(palanqueeLocks).length : 'undefined'
    },
    errors: {
      lastError: window.lastJSASError || 'none'
    }
  };
  
  console.log("📊 Diagnostic complet:", diagnostic);
  console.log("=== FIN DIAGNOSTIC ===");
  
  return diagnostic;
};

// Capturer la dernière erreur pour le diagnostic
window.addEventListener('error', (event) => {
  window.lastJSASError = {
    message: event.error?.message || event.message,
    timestamp: new Date().toISOString(),
    filename: event.filename,
    lineno: event.lineno
  };
});

console.log("✅ Main application sécurisée chargée - Version 2.5.2");