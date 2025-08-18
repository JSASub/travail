// main-complete.js - Application principale ultra-sécurisée (VERSION CORRIGÉE AVEC GESTION D'ERREURS)

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const originalConsoleLog = console.log;
  console.log = function() {
    if (arguments[0] && arguments[0].includes('✅') || arguments[0].includes('❌')) {
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
      }, 5000); // Réduit à 5 secondes
      
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
    
    // Charger les informations DP du jour
    try {
      if (db) {
        const snapshot = await db.ref(`dpInfo/${today}_matin`).once('value');
        if (snapshot.exists()) {
          const dpData = snapshot.val();
          const dpNomInput = document.getElementById("dp-nom");
          const dpLieuInput = document.getElementById("dp-lieu");
          const dpPlongeeInput = document.getElementById("dp-plongee");
          const dpMessage = document.getElementById("dp-message");
          
          if (dpNomInput) dpNomInput.value = dpData.nom || "";
          if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
          if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
          if (dpMessage) {
            dpMessage.textContent = "Informations du jour chargées.";
            dpMessage.style.color = "blue";
          }
          
          if (typeof dpInfo !== 'undefined') {
            dpInfo.nom = dpData.nom || "";
          }
          
          console.log("✅ Informations DP du jour chargées");
        } else {
          console.log("ℹ️ Aucune information DP pour aujourd'hui");
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement DP:", error);
      if (typeof FirebaseErrorHandler !== 'undefined') {
        FirebaseErrorHandler.handleError(error, 'Chargement DP du jour');
      }
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
      if (typeof FirebaseErrorHandler !== 'undefined') {
        FirebaseErrorHandler.handleError(error, 'Chargement historique DP');
      }
    }
    
    // Charger les données Firebase avec gestion d'erreur
    try {
      if (typeof loadFromFirebase === 'function') {
        await loadFromFirebase();
        console.log("✅ Données Firebase chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement Firebase:", error);
      if (typeof FirebaseErrorHandler !== 'undefined') {
        FirebaseErrorHandler.handleError(error, 'Chargement données Firebase');
      }
      
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
      if (typeof FirebaseErrorHandler !== 'undefined') {
        FirebaseErrorHandler.handleError(error, 'Chargement sessions');
      }
    }
    
    // Charger les listes de nettoyage avec gestion d'erreur
    try {
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
        console.log("✅ Liste nettoyage sessions chargée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement liste nettoyage sessions:", error);
    }
    
    try {
      if (typeof populateDPCleanupList === 'function') {
        await populateDPCleanupList();
        console.log("✅ Liste nettoyage DP chargée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement liste nettoyage DP:", error);
    }
    
    // Vérifier les éléments UI critiques
    const testButton = document.getElementById("test-firebase");
    if (testButton) {
      console.log("✅ Bouton test Firebase trouvé");
    } else {
      console.warn("⚠️ Bouton test Firebase non trouvé dans le DOM");
    }
    
    // Rendu initial sécurisé
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
    } catch (renderError) {
      console.error("❌ Erreur rendu initial:", renderError);
      if (typeof FirebaseErrorHandler !== 'undefined') {
        FirebaseErrorHandler.handleError(renderError, 'Rendu initial');
      }
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

// ===== GÉNÉRATION PDF SÉCURISÉE =====
function generatePDFPreview() {
  console.log("🎨 Génération de l'aperçu PDF professionnel...");
  
  try {
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // S'assurer que les variables existent
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const plongeursEnPalanquees = palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
    // Fonction de tri par grade pour l'aperçu
    function trierPlongeursParGrade(plongeurs) {
      const ordreNiveaux = {
        'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
        'N3': 7, 'N2': 8, 'N1': 9,
        'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
        'Déb.': 13, 'débutant': 14, 'Déb': 15
      };
      
      return [...plongeurs].sort((a, b) => {
        const ordreA = ordreNiveaux[a.niveau] || 99;
        const ordreB = ordreNiveaux[b.niveau] || 99;
        
        if (ordreA === ordreB) {
          return a.nom.localeCompare(b.nom);
        }
        
        return ordreA - ordreB;
      });
    }
    
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
      } catch (error) {
        console.warn("⚠️ Erreur formatage date:", error);
        return dateString;
      }
    }
    
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

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
        }
        .main-title {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 2px;
        }
        .content { padding: 40px; }
        .section { margin-bottom: 40px; }
        .section-title {
          font-size: 20px;
          color: #004080;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #007bff;
        }
        .plongeur-item {
          padding: 8px 12px;
          margin: 4px 0;
          background: #f8f9fa;
          border-left: 4px solid #007bff;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }
        .plongeur-item:hover {
          background: #e9ecef;
          transform: translateX(2px);
        }
        .plongeur-nom {
          font-weight: bold;
          flex: 1;
        }
        .plongeur-niveau {
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          min-width: 50px;
          text-align: center;
          margin-right: 8px;
        }
        .plongeur-prerogatives {
          font-size: 11px;
          color: #666;
          font-style: italic;
        }
        .palanquee-box {
          margin: 20px 0;
          padding: 20px;
          border: 2px solid #007bff;
          border-radius: 8px;
          background: #f8f9fa;
        }
        .palanquee-title {
          font-size: 18px;
          font-weight: bold;
          color: #004080;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #dee2e6;
        }
        .alert-box {
          border-color: #dc3545 !important;
          background: #fff5f5 !important;
        }
        .alert-title {
          color: #dc3545 !important;
        }
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    htmlContent += '<div class="container">';
    htmlContent += '<header class="header">';
    htmlContent += '<h1 class="main-title">Palanquées JSAS - Fiche de Sécurité</h1>';
    htmlContent += '<p>Directeur de Plongée: ' + dpNom + '</p>';
    htmlContent += '<p>Date: ' + formatDateFrench(dpDate) + ' - ' + capitalize(dpPlongee) + '</p>';
    htmlContent += '<p>Lieu: ' + dpLieu + '</p>';
    htmlContent += '</header>';
    
    htmlContent += '<main class="content">';
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Résumé</h2>';
    htmlContent += '<p>Total plongeurs: ' + totalPlongeurs + '</p>';
    htmlContent += '<p>Palanquées: ' + palanqueesLocal.length + '</p>';
    htmlContent += '<p>Alertes: ' + alertesTotal.length + '</p>';
    htmlContent += '</section>';
    
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">⚠️ Alertes</h2>';
      alertesTotal.forEach(alerte => {
        htmlContent += '<p style="color: red;">• ' + alerte + '</p>';
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">🏊‍♂️ Palanquées</h2>';
    
    if (palanqueesLocal.length === 0) {
      htmlContent += '<p>Aucune palanquée créée.</p>';
    } else {
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          const hasAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
          const boxClass = hasAlert ? 'palanquee-box alert-box' : 'palanquee-box';
          const titleClass = hasAlert ? 'palanquee-title alert-title' : 'palanquee-title';
          
          htmlContent += `<div class="${boxClass}">`;
          htmlContent += `<h3 class="${titleClass}">Palanquée ${i + 1} (${pal.length} plongeur${pal.length > 1 ? 's' : ''})</h3>`;
          
          if (pal.length === 0) {
            htmlContent += '<p style="text-align: center; color: #666; font-style: italic; padding: 20px;">Aucun plongeur assigné</p>';
          } else {
            // Trier les plongeurs par grade avant affichage
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                htmlContent += '<div class="plongeur-item">';
                htmlContent += '<span class="plongeur-nom">' + p.nom + '</span>';
                htmlContent += '<div style="display: flex; align-items: center; gap: 8px;">';
                htmlContent += '<span class="plongeur-niveau">' + (p.niveau || 'N?') + '</span>';
                if (p.pre) {
                  htmlContent += '<span class="plongeur-prerogatives">(' + p.pre + ')</span>';
                }
                htmlContent += '</div>';
                htmlContent += '</div>';
              }
            });
          }
          htmlContent += '</div>';
        }
      });
    }
    
    htmlContent += '</section>';
    
    if (plongeursLocal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">⏳ Plongeurs en Attente</h2>';
      
      // Trier aussi les plongeurs en attente par grade
      const plongeursEnAttenteTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursEnAttenteTriés.forEach(p => {
        if (p && p.nom) {
          htmlContent += '<div class="plongeur-item">';
          htmlContent += '<span class="plongeur-nom">' + p.nom + '</span>';
          htmlContent += '<div style="display: flex; align-items: center; gap: 8px;">';
          htmlContent += '<span class="plongeur-niveau">' + (p.niveau || 'N?') + '</span>';
          if (p.pre) {
            htmlContent += '<span class="plongeur-prerogatives">(' + p.pre + ')</span>';
          }
          htmlContent += '</div>';
          htmlContent += '</div>';
        }
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '</main>';
    htmlContent += '</div></body></html>';

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    let previewContainer = document.getElementById("previewContainer");
    const pdfPreview = document.getElementById("pdfPreview");
    
    if (previewContainer && pdfPreview) {
      // Ajouter le bouton de fermeture s'il n'existe pas déjà  
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
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        `;
        
        closeButton.onmouseenter = function() {
          this.style.background = "#c82333";
          this.style.transform = "scale(1.05)";
        };
        closeButton.onmouseleave = function() {
          this.style.background = "#dc3545";
          this.style.transform = "scale(1)";
        };
        
        closeButton.onclick = function() {
          closePDFPreview();
        };
        
        previewContainer.style.position = "relative";
        previewContainer.appendChild(closeButton);
      }
      
      previewContainer.style.display = "block";
      pdfPreview.src = url;
      
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF généré avec bouton de fermeture");
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
    previewContainer.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    previewContainer.style.opacity = "0";
    previewContainer.style.transform = "translateY(-20px)";
    
    setTimeout(() => {
      previewContainer.style.display = "none";
      previewContainer.style.opacity = "1";
      previewContainer.style.transform = "translateY(0)";
      
      if (pdfPreview) {
        pdfPreview.src = "";
      }
      
      console.log("✅ Aperçu PDF fermé");
    }, 300);
  }
}

// Export de la fonction pour usage global
window.closePDFPreview = closePDFPreview;

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
    
    const colors = {
      primaryR: 0, primaryG: 64, primaryB: 128,
      secondaryR: 0, secondaryG: 123, secondaryB: 255,
      successR: 40, successG: 167, successB: 69,
      dangerR: 220, dangerG: 53, dangerB: 69,
      darkR: 52, darkG: 58, darkB: 64,
      grayR: 108, grayG: 117, grayB: 125
    };
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Constantes pour l'espacement
    const spacing = {
      lineHeight: 6,
      sectionGap: 12,
      subsectionGap: 8,
      headerHeight: 60,
      footerHeight: 25
    };
    
    function checkPageBreak(heightNeeded, forceNewPage = false) {
      if (forceNewPage || yPosition + heightNeeded > pageHeight - spacing.footerHeight) {
        doc.addPage();
        yPosition = 20;
        addPageHeader();
        return true;
      }
      return false;
    }
    
    function addPageHeader() {
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
        doc.setFontSize(10);
        doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
        doc.text("Palanquées JSAS - " + dpDate + " (" + dpPlongee + ")", margin, 15);
        doc.text("Page " + doc.internal.getCurrentPageInfo().pageNumber, pageWidth - margin - 20, 15);
        yPosition = 25;
      }
    }
    
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      try {
        const date = new Date(dateString);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options).replace(/'/g, "'");
      } catch (error) {
        console.warn("⚠️ Erreur formatage date PDF:", error);
        return dateString;
      }
    }
    
    function addText(text, x, y, fontSize = 10, fontStyle = 'normal', color = 'dark') {
      doc.setFontSize(fontSize);
      doc.setFont(undefined, fontStyle);
      
      switch(color) {
        case 'primary':
          doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
          break;
        case 'secondary':
          doc.setTextColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
          break;
        case 'success':
          doc.setTextColor(colors.successR, colors.successG, colors.successB);
          break;
        case 'danger':
          doc.setTextColor(colors.dangerR, colors.dangerG, colors.dangerB);
          break;
        case 'gray':
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
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
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    // === EN-TÊTE PRINCIPAL ===
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, spacing.headerHeight, 'F');
    
    addText('Palanquées JSAS', margin, 20, 10, 'bold', 'white');
    addText('Fiche de Sécurité', margin, 32, 20, 'bold', 'white');
    addText('Association Sportive de Plongée', margin, 40, 8, 'normal', 'white');
    
    addText('DP: ' + dpNom.substring(0, 30), margin, 48, 10, 'bold', 'white');
    addText('Date: ' + formatDateFrench(dpDate), margin, 55, 10, 'bold', 'white');
    addText('Lieu: ' + dpLieu.substring(0, 20) + ' | Session: ' + dpPlongee.toUpperCase(), margin + 100, 55, 10, 'bold', 'white');
    
    yPosition = spacing.headerHeight + spacing.sectionGap;
    
    // === STATISTIQUES ===
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal ? pal.length : 0), 0);
    const plongeursEnPalanquees = palanqueesLocal.reduce((total, pal) => total + (pal ? pal.length : 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
    addText('TABLEAU DE BORD', margin, yPosition, 12, 'bold', 'primary');
    
    doc.setDrawColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 2, margin + 50, yPosition + 2);
    
    yPosition += spacing.sectionGap + 3;
    
    addText('Total plongeurs: ' + totalPlongeurs, margin, yPosition, 10, 'bold');
    addText('Palanquées: ' + palanqueesLocal.length, margin + 80, yPosition, 10, 'bold');
    yPosition += spacing.lineHeight + 2;
    
    addText('Assignés: ' + plongeursEnPalanquees + ' (' + (totalPlongeurs > 0 ? ((plongeursEnPalanquees/totalPlongeurs)*100).toFixed(0) : 0) + '%)', margin, yPosition, 10, 'bold');
    addText('Alertes: ' + alertesTotal.length, margin + 80, yPosition, 10, 'bold');
    
    yPosition += spacing.sectionGap + 3;
    
    // === ALERTES DE SÉCURITÉ ===
    if (alertesTotal.length > 0) {
      const alerteBoxHeight = 20 + (alertesTotal.length * spacing.lineHeight);
      checkPageBreak(alerteBoxHeight);
      
      doc.setDrawColor(colors.dangerR, colors.dangerG, colors.dangerB);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition, contentWidth, alerteBoxHeight, 'S');
      
      addText('ALERTES DE SÉCURITÉ (' + alertesTotal.length + ')', margin + 5, yPosition + 12, 12, 'bold', 'danger');
      
      yPosition += 20;
      
      for (let i = 0; i < alertesTotal.length; i++) {
        const alerteClean = alertesTotal[i].replace(/'/g, "'");
        addText("• " + alerteClean, margin + 5, yPosition, 10, 'normal');
        yPosition += spacing.lineHeight;
      }
      
      yPosition += spacing.subsectionGap;
    }
    
    // === PALANQUÉES DÉTAILLÉES ===
    checkPageBreak(40, true);
    
    addText('Organisation des Palanquées', margin, yPosition, 14, 'bold', 'primary');
    yPosition += 8;
    
    if (palanqueesLocal.length === 0) {
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(1);
      doc.rect(margin, yPosition, contentWidth, 20, 'S');
      
      addText('Aucune palanquée créée - Tous les plongeurs en attente', margin + 10, yPosition + 12, 12);
      yPosition += 30;
    } else {
      for (let i = 0; i < palanqueesLocal.length; i++) {
        const pal = palanqueesLocal[i];
        if (!pal || !Array.isArray(pal)) continue;
        
        // Calculer la hauteur nécessaire pour cette palanquée
        let palanqueeHeight = 14;
        palanqueeHeight += (pal.length * spacing.lineHeight) + 4;
        palanqueeHeight += 30;
        palanqueeHeight += spacing.sectionGap;
        
        checkPageBreak(palanqueeHeight + 10);
        
        const isAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
        
        // En-tête de palanquée
        if (isAlert) {
          doc.setFillColor(colors.dangerR, colors.dangerG, colors.dangerB);
        } else {
          doc.setFillColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
        }
        doc.rect(margin, yPosition, contentWidth, 8, 'F');
        
        addText('Palanquée ' + (i + 1) + ' - ' + pal.length + ' plongeurs', margin + 5, yPosition + 6, 12, 'bold', 'white');
        
        const gps = pal.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p && p.niveau === "N1");
        const autonomes = pal.filter(p => p && ["N2", "N3"].includes(p.niveau));
        
        addText('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 6, 10, 'normal', 'white');
        
        yPosition += 14;
        
        // Liste des plongeurs (triés par niveau)
        if (pal.length === 0) {
          addText('Aucun plongeur assigné', margin + 10, yPosition, 11, 'normal', 'gray');
          yPosition += spacing.lineHeight + 4;
        } else {
          // Définir l'ordre de tri des niveaux
          const ordreNiveaux = ['E4', 'E3', 'E2', 'GP', 'N3', 'N2', 'N1', 'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'débutant', 'Déb', 'N4/GP', 'N4'];
          
          const plongeursTriés = [...pal].sort((a, b) => {
            const indexA = ordreNiveaux.indexOf(a.niveau) !== -1 ? ordreNiveaux.indexOf(a.niveau) : 999;
            const indexB = ordreNiveaux.indexOf(b.niveau) !== -1 ? ordreNiveaux.indexOf(b.niveau) : 999;
            return indexA - indexB;
          });
          
          for (let j = 0; j < plongeursTriés.length; j++) {
            const p = plongeursTriés[j];
            if (!p || !p.nom) continue;
            
            const nomClean = p.nom.replace(/'/g, "'");
            const preClean = p.pre ? p.pre.replace(/'/g, "'") : '';
            
            addText('• ' + nomClean, margin + 5, yPosition, 11, 'bold');
            
            if (preClean) {
              addText('Prérogative: ' + preClean, margin + 80, yPosition, 10, 'normal');
            }
            
            addText('Niveau: ' + p.niveau, margin + 140, yPosition, 10, 'normal', 'gray');
            
            yPosition += spacing.lineHeight;
          }
          yPosition += 4;
        }
        
        // Paramètres de plongée (version simplifiée)
        addText('Horaire mise à l\'eau:', margin + 5, yPosition, 11, 'bold', 'primary');
        if (pal.horaire && pal.horaire.trim()) {
          addText(pal.horaire, margin + 50, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 50, yPosition - 2, margin + 85, yPosition - 2);
        }
        yPosition += 4;
        
        addText('Prof. prévue: ', margin + 5, yPosition, 11, 'bold', 'primary');
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          addText(pal.profondeurPrevue + ' m', margin + 35, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 35, yPosition - 2, margin + 55, yPosition - 2);
        }
        
        addText('Durée prévue:', margin + 80, yPosition, 11, 'bold', 'primary');
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          addText(pal.dureePrevue + ' min', margin + 115, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 115, yPosition - 2, margin + 140, yPosition - 2);
        }
        yPosition += 4;
        
        addText('Prof. réalisée:', margin + 5, yPosition, 11, 'bold', 'success');
        if (pal.profondeurRealisee && pal.profondeurRealisee.trim()) {
          addText(pal.profondeurRealisee + ' m', margin + 40, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 40, yPosition - 2, margin + 60, yPosition - 2);
        }
        
        addText('Durée réalisée:', margin + 80, yPosition, 11, 'bold', 'success');
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          addText(pal.dureeRealisee + ' min', margin + 120, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 120, yPosition - 2, margin + 145, yPosition - 2);
        }
        yPosition += 4;
        
        addText('Paliers:', margin + 5, yPosition, 11, 'bold', 'primary');
        if (pal.paliers && pal.paliers.trim()) {
          addText(pal.paliers, margin + 25, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 25, yPosition - 2, margin + 65, yPosition - 2);
        }
        yPosition += spacing.lineHeight + spacing.sectionGap;
      }
    }
    
    // === PLONGEURS NON ASSIGNÉS ===
    if (plongeursLocal.length > 0) {
      const plongeursBoxHeight = 25 + (plongeursLocal.length * spacing.lineHeight);
      checkPageBreak(plongeursBoxHeight);
      
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition, contentWidth, plongeursBoxHeight, 'S');
      
      addText('PLONGEURS en attente/disponibles (' + plongeursLocal.length + ')', margin + 5, yPosition + 12, 14, 'bold', 'primary');
      
      yPosition += 20;
      
      for (let i = 0; i < plongeursLocal.length; i++) {
        const p = plongeursLocal[i];
        if (!p || !p.nom) continue;
        
        const nomClean = p.nom.replace(/'/g, "'");
        const preClean = p.pre ? p.pre.replace(/'/g, "'") : '';
        const textLine = '• ' + nomClean + '   (' + p.niveau + ')' + (preClean ? '   - ' + preClean : '');
        addText(textLine, margin + 5, yPosition, 10, 'normal');
        yPosition += spacing.lineHeight;
      }
      
      yPosition += spacing.subsectionGap;
    }
    
    // === FOOTER ===
    const totalPages = doc.internal.getCurrentPageInfo().pageNumber;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      
      doc.setDrawColor(colors.grayR, colors.grayG, colors.grayB);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      if (pageNum === totalPages) {
        addText('Document officiel JSAS - Conforme FFESSM - Version 2.1.4 Pro', margin, pageHeight - 15, 8, 'normal', 'gray');
        addText('Généré le ' + new Date().toLocaleDateString('fr-FR') + ' - Ne pas modifier', margin, pageHeight - 10, 8, 'normal', 'gray');
      }
      
      addText('Page ' + pageNum + '/' + totalPages, pageWidth - margin - 20, pageHeight - 10, 8, 'normal', 'gray');
      addText(new Date().toLocaleString('fr-FR'), margin, pageHeight - 5, 8, 'normal', 'gray');
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '-pro.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF généré:", fileName);
    
    const alertesText = alertesTotal.length > 0 ? '\n⚠️ ' + alertesTotal.length + ' alerte(s) détectée(s)' : '\n✅ Aucune alerte';
    alert('PDF généré avec succès !\n\n📊 ' + totalPlongeurs + ' plongeurs dans ' + palanqueesLocal.length + ' palanquées' + alertesText + '\n\n📁 Fichier: ' + fileName);
    
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    handleError(error, "Génération PDF");
    alert("Erreur lors de la génération du PDF : " + error.message + "\n\nVérifiez que jsPDF est bien chargé.");
  }
}

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
    
    console.log("🎯 Drag started sur:", e.target);
    e.target.classList.add('dragging');
    e.target.style.opacity = '0.5';
    
    const isFromPalanquee = e.target.dataset.type === 'palanquee';
    
    if (isFromPalanquee) {
      const palanqueeIndex = parseInt(e.target.dataset.palanqueeIndex);
      const plongeurIndex = parseInt(e.target.dataset.plongeurIndex);
      
      console.log("📦 Drag depuis palanquée", palanqueeIndex, "plongeur", plongeurIndex);
      
      if (typeof palanquees !== 'undefined' && palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
        dragData = {
          type: "fromPalanquee",
          palanqueeIndex: palanqueeIndex,
          plongeurIndex: plongeurIndex,
          plongeur: palanquees[palanqueeIndex][plongeurIndex]
        };
        console.log("✅ Données drag palanquée:", dragData);
      } else {
        console.error("❌ Plongeur non trouvé dans palanquée", palanqueeIndex, plongeurIndex);
      }
    } else {
      const index = parseInt(e.target.dataset.index);
      console.log("📦 Drag depuis liste principale, index:", index);
      
      if (typeof plongeurs !== 'undefined' && plongeurs[index]) {
        dragData = {
          type: "fromMainList",
          plongeur: plongeurs[index],
          originalIndex: index
        };
        console.log("✅ Données drag liste:", dragData);
      } else {
        console.error("❌ Plongeur non trouvé dans liste principale", index);
      }
    }
    
    // Stocker dans dataTransfer comme backup
    if (e.dataTransfer && dragData) {
      try {
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "move";
        console.log("✅ Données stockées dans dataTransfer");
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
      console.log("🎯 Drag ended");
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
    console.log("🎯 DROP ÉVÉNEMENT DÉTECTÉ");
    
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (!dropZone) {
      console.warn("⚠️ Aucune zone de drop valide trouvée");
      dragData = null;
      return;
    }
    
    dropZone.classList.remove('drag-over');
    console.log("🎯 Drop zone trouvée:", dropZone.id || dropZone.className);
    
    // Récupérer les données
    let data = dragData;
    console.log("📦 dragData disponible:", !!data);
    
    // Fallback vers dataTransfer
    if (!data && e.dataTransfer) {
      try {
        const dataStr = e.dataTransfer.getData("text/plain");
        if (dataStr) {
          data = JSON.parse(dataStr);
          console.log("📦 Données récupérées depuis dataTransfer");
        }
      } catch (error) {
        console.warn("⚠️ Erreur parsing dataTransfer:", error);
      }
    }
    
    if (!data) {
      console.error("❌ AUCUNE DONNÉE DE DRAG DISPONIBLE");
      dragData = null;
      return;
    }
    
    console.log("✅ Données de drop récupérées:", data);
    
    // S'assurer que les variables globales existent
    if (typeof plongeurs === 'undefined') {
      console.warn("⚠️ Variable plongeurs non définie");
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      console.warn("⚠️ Variable palanquees non définie");
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
    }
    
    // Drop vers la liste principale
    if (dropZone.id === 'listePlongeurs') {
      console.log("🎯 Drop vers liste principale");
      
      if (data.type === "fromPalanquee") {
        console.log("🔄 Retour vers liste depuis palanquée", data.palanqueeIndex);
        
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          targetPalanquee.push(plongeur);
          console.log("✅ Plongeur déplacé entre palanquées:", plongeur.nom);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        } else {
          console.error("❌ Plongeur source non trouvé pour déplacement");
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors du drop:", error);
    handleError(error, "Handle drop");
  } finally {
    // Nettoyer les données de drag
    dragData = null;
    console.log("🧹 Données de drag nettoyées");
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
          
          if (typeof FirebaseErrorHandler !== 'undefined') {
            FirebaseErrorHandler.handleError(error, 'Connexion');
          }
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
          if (typeof FirebaseErrorHandler !== 'undefined') {
            FirebaseErrorHandler.handleError(error, 'Déconnexion');
          }
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
          
          // Vérifier le format du nom DP
          if (dpNom.split(' ').length < 2) {
            const confirm = window.confirm("⚠️ Le nom semble incomplet (nom ET prénom recommandés).\n\nContinuer quand même ?");
            if (!confirm) {
              document.getElementById("dp-nom")?.focus();
              return;
            }
          }
          
          // Vérifier que la date n'est pas trop ancienne
          const selectedDate = new Date(dpDate);
          const today = new Date();
          const diffDays = Math.ceil((today - selectedDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 7) {
            const confirm = window.confirm(`⚠️ La date sélectionnée remonte à ${diffDays} jours.\n\nÊtes-vous sûr de cette date ?`);
            if (!confirm) {
              document.getElementById("dp-date")?.focus();
              return;
            }
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
          
          // Mettre à jour la variable globale si elle existe
          if (typeof window.dpInfo !== 'undefined') {
            window.dpInfo.nom = dpNom;
            window.dpInfo.niveau = 'DP';
          }
          
          // Sauvegarder dans Firebase si disponible
          if (typeof db !== 'undefined' && db) {
            try {
              const dpKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
              await db.ref(`dpInfo/${dpKey}`).set(dpInfo);
              console.log("✅ Informations DP sauvegardées dans Firebase");
            } catch (firebaseError) {
              console.warn("⚠️ Erreur sauvegarde Firebase:", firebaseError.message);
              if (typeof FirebaseErrorHandler !== 'undefined') {
                FirebaseErrorHandler.handleError(firebaseError, 'Sauvegarde DP');
              }
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
          
          // Notification système si disponible
          if (typeof showNotification === 'function') {
            showNotification("✅ Informations DP validées et sauvegardées", "success");
          }
          
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
          if (typeof populateSessionSelector === 'function') {
            await populateSessionSelector();
          }
          if (typeof populateSessionsCleanupList === 'function') {
            await populateSessionsCleanupList();
          }
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
            if (typeof populateSessionSelector === 'function') {
              await populateSessionSelector();
            }
            if (typeof populateSessionsCleanupList === 'function') {
              await populateSessionsCleanupList();
            }
            console.log("✅ Session sauvegardée");
          }
        } catch (error) {
          console.error("❌ Erreur sauvegarde session:", error);
          handleError(error, "Sauvegarde session");
        }
      });
    }

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
          
          // Test de l'état des listeners
          if (typeof window.firebaseListeners !== 'undefined') {
            console.log("📡 Listeners actifs:", window.firebaseListeners.getActiveListeners());
          }
          
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

    // === NETTOYAGE SESSIONS ET DP SÉCURISÉ ===
    const setupCleanupListeners = () => {
      try {
        // Sessions
        const selectAllSessionsBtn = document.getElementById("select-all-sessions");
        if (selectAllSessionsBtn) {
          selectAllSessionsBtn.addEventListener("click", () => {
            if (typeof selectAllSessions === 'function') {
              selectAllSessions(true);
            }
          });
        }

        const selectNoneSessionsBtn = document.getElementById("select-none-sessions");
        if (selectNoneSessionsBtn) {
          selectNoneSessionsBtn.addEventListener("click", () => {
            if (typeof selectAllSessions === 'function') {
              selectAllSessions(false);
            }
          });
        }

        const deleteSelectedSessionsBtn = document.getElementById("delete-selected-sessions");
        if (deleteSelectedSessionsBtn) {
          deleteSelectedSessionsBtn.addEventListener("click", () => {
            if (typeof deleteSelectedSessions === 'function') {
              deleteSelectedSessions();
            }
          });
        }

        const refreshSessionsListBtn = document.getElementById("refresh-sessions-list");
        if (refreshSessionsListBtn) {
          refreshSessionsListBtn.addEventListener("click", () => {
            if (typeof populateSessionsCleanupList === 'function') {
              populateSessionsCleanupList();
            }
          });
        }

        // DP
        const selectAllDPBtn = document.getElementById("select-all-dp");
        if (selectAllDPBtn) {
          selectAllDPBtn.addEventListener("click", () => {
            if (typeof selectAllDPs === 'function') {
              selectAllDPs(true);
            }
          });
        }

        const selectNoneDPBtn = document.getElementById("select-none-dp");
        if (selectNoneDPBtn) {
          selectNoneDPBtn.addEventListener("click", () => {
            if (typeof selectAllDPs === 'function') {
              selectAllDPs(false);
            }
          });
        }

        const deleteSelectedDPBtn = document.getElementById("delete-selected-dp");
        if (deleteSelectedDPBtn) {
          deleteSelectedDPBtn.addEventListener("click", () => {
            if (typeof deleteSelectedDPs === 'function') {
              deleteSelectedDPs();
            }
          });
        }

        const refreshDPListBtn = document.getElementById("refresh-dp-list");
        if (refreshDPListBtn) {
          refreshDPListBtn.addEventListener("click", () => {
            if (typeof populateDPCleanupList === 'function') {
              populateDPCleanupList();
            }
          });
        }
      } catch (error) {
        console.error("❌ Erreur setup cleanup listeners:", error);
        handleError(error, "Setup cleanup listeners");
      }
    };

    setupCleanupListeners();

    // Event listeners pour les checkboxes de nettoyage
    document.addEventListener('change', (e) => {
      try {
        if (e.target.classList.contains('session-cleanup-checkbox') || 
            e.target.classList.contains('dp-cleanup-checkbox')) {
          if (typeof updateCleanupSelection === 'function') {
            updateCleanupSelection();
          }
        }
      } catch (error) {
        console.error("❌ Erreur checkbox cleanup:", error);
        handleError(error, "Checkbox cleanup");
      }
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
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");
  
  if (!dpDatesSelect || !historiqueInfo) {
    console.error("❌ Éléments DOM manquants pour afficher les infos DP");
    return;
  }
  
  const selectedKey = dpDatesSelect.value;
  
  if (!selectedKey) {
    historiqueInfo.innerHTML = '';
    return;
  }
  
  historiqueInfo.innerHTML = '<p>⏳ Chargement des informations...</p>';
  
  if (typeof db === 'undefined' || !db) {
    historiqueInfo.innerHTML = '<p style="color: red;">❌ Firebase non disponible</p>';
    return;
  }
  
  db.ref(`dpInfo/${selectedKey}`).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        historiqueInfo.innerHTML = '<p style="color: red;">❌ DP non trouvé</p>';
        return;
      }
      
      const dpData = snapshot.val();
      const formatDate = (dateStr) => {
        try {
          return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };
      
      historiqueInfo.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
          <h4 style="margin: 0 0 10px 0; color: #004080;">📋 Informations DP</h4>
          <p><strong>👨‍💼 Directeur de Plongée :</strong> ${dpData.nom || 'Non défini'}</p>
          <p><strong>📅 Date :</strong> ${formatDate(dpData.date)}</p>
          <p><strong>📍 Lieu :</strong> ${dpData.lieu || 'Non défini'}</p>
          <p><strong>🕕 Session :</strong> ${dpData.plongee || 'matin'}</p>
          <p><strong>⏰ Créé le :</strong> ${dpData.timestamp ? new Date(dpData.timestamp).toLocaleString('fr-FR') : 'Date inconnue'}</p>
          
          <div style="margin-top: 15px;">
            <button onclick="chargerDonneesDPSelectionne('${selectedKey}')" 
                    style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              🔥 Charger dans l'interface
            </button>
            <button onclick="supprimerDPSelectionne('${selectedKey}')" 
                    style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error("❌ Erreur chargement DP:", error);
      handleError(error, "Chargement DP");
      historiqueInfo.innerHTML = `<p style="color: red;">❌ Erreur : ${error.message}</p>`;
    });
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
    
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      dpMessage.innerHTML = `
        <div style="color: #007bff; font-weight: bold; padding: 10px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 4px;">
          🔥 DP chargé depuis l'historique
        </div>
      `;
    }
    
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
    
    await chargerHistoriqueDP();
    
    const historiqueInfo = document.getElementById("historique-info");
    if (historiqueInfo) {
      historiqueInfo.innerHTML = '';
    }
    
    console.log("✅ DP supprimé:", dpKey);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    handleError(error, "Suppression DP");
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// Export des fonctions globales
window.chargerHistoriqueDP = chargerHistoriqueDP;
window.afficherInfoDP = afficherInfoDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.supprimerDPSelectionne = supprimerDPSelectionne;

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

console.log("✅ Main application sécurisée chargée - Version 2.5.2");][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
          console.log("✅ Plongeur remis dans liste:", plongeur.nom);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        } else {
          console.error("❌ Plongeur non trouvé pour retour en liste");
        }
      }
    } else {
      // Drop vers une palanquée
      const palanqueeIndex = parseInt(dropZone.dataset.index);
      if (isNaN(palanqueeIndex)) {
        console.error("❌ Index palanquée invalide:", dropZone.dataset.index);
        dragData = null;
        return;
      }
      
      console.log("🎯 Drop vers palanquée", palanqueeIndex);
      
      const targetPalanquee = palanquees[palanqueeIndex];
      if (!targetPalanquee) {
        console.error("❌ Palanquée cible non trouvée:", palanqueeIndex);
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
        console.log("🔄 Ajout depuis liste principale");
        
        const indexToRemove = plongeurs.findIndex(p => 
          p.nom === data.plongeur.nom && p.niveau === data.plongeur.niveau
        );
        
        if (indexToRemove !== -1) {
          const plongeur = plongeurs.splice(indexToRemove, 1)[0];
          targetPalanquee.push(plongeur);
          console.log("✅ Plongeur ajouté à palanquée:", plongeur.nom);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        } else {
          console.error("❌ Plongeur non trouvé dans liste principale");
        }
        
      } else if (data.type === "fromPalanquee") {
        console.log("🔄 Déplacement entre palanquées");
        
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex