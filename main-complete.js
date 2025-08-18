// main-complete.js - Application principale ultra-sécurisée (VERSION CORRIGÉE)

// ===== FONCTIONS UTILITAIRES (DÉCLARÉES EN PREMIER) =====

function showAuthError(message) {
  const errorDiv = document.getElementById("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function handleError(error, context = "Application") {
  console.error(`⌫ Erreur ${context}:`, error);
  
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

async function testFirebaseConnection() {
  try {
    console.log("🧪 Test de connexion Firebase...");
    
    if (!db) {
      throw new Error("Instance Firebase Database non initialisée");
    }
    
    if (!auth) {
      throw new Error("Instance Firebase Auth non initialisée");
    }
    
    const testRef = db.ref('.info/connected');
    const connectedPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testRef.off('value');
        resolve(false);
      }, 10000);
      
      let resolved = false;
      testRef.on('value', (snapshot) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          testRef.off('value');
          
          firebaseConnected = snapshot.val() === true;
          console.log(firebaseConnected ? "✅ Firebase connecté" : "⚠️ Firebase déconnecté");
          resolve(firebaseConnected);
        }
      });
    });
    
    await connectedPromise;
    
    if (firebaseConnected) {
      try {
        await db.ref('test').set({ 
          timestamp: Date.now(),
          testType: "connection-check"
        });
        console.log("✅ Test d'écriture Firebase réussi");
        await db.ref('test').remove();
      } catch (writeError) {
        console.warn("⚠️ Écriture Firebase échouée mais lecture OK:", writeError.message);
      }
    } else {
      console.warn("⚠️ Firebase déconnecté, fonctionnement en mode lecture seule");
    }
    
    return true;
    
  } catch (error) {
    console.error("⌫ Test Firebase échoué:", error.message);
    firebaseConnected = false;
    return true;
  }
}

async function initializeAppData() {
  try {
    console.log("📄 Initialisation des données de l'application...");
    
    await testFirebaseConnection();
    
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = document.getElementById("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
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
      console.error("⌫ Erreur chargement DP:", error);
    }

    console.log("📜 Chargement des données...");
    
    try {
      if (typeof chargerHistoriqueDP === 'function') {
        chargerHistoriqueDP();
        console.log("✅ Historique DP chargé");
      }
    } catch (error) {
      console.error("⌫ Erreur chargement historique DP:", error);
    }
    
    try {
      if (typeof loadFromFirebase === 'function') {
        await loadFromFirebase();
        console.log("✅ Données Firebase chargées");
      }
    } catch (error) {
      console.error("⌫ Erreur chargement Firebase:", error);
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    }
    
    try {
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
        console.log("✅ Sessions chargées");
      }
    } catch (error) {
      console.error("⌫ Erreur chargement sessions:", error);
    }
    
    try {
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
        console.log("✅ Liste nettoyage sessions chargée");
      }
    } catch (error) {
      console.error("⌫ Erreur chargement liste nettoyage sessions:", error);
    }
    
    try {
      if (typeof populateDPCleanupList === 'function') {
        await populateDPCleanupList();
        console.log("✅ Liste nettoyage DP chargée");
      }
    } catch (error) {
      console.error("⌫ Erreur chargement liste nettoyage DP:", error);
    }
    
    const testButton = document.getElementById("test-firebase");
    if (testButton) {
      console.log("✅ Bouton test Firebase trouvé");
    } else {
      console.warn("⚠️ Bouton test Firebase non trouvé dans le DOM");
    }
    
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
    console.log("✅ Application initialisée avec système de verrous!");
    
    if (typeof plongeurs !== 'undefined' && typeof palanquees !== 'undefined') {
      console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    }
    
  } catch (error) {
    console.error("⌫ Erreur initialisation données:", error);
    console.error("Stack trace:", error.stack);
    
    // Initialiser les variables globales si elles n'existent pas
    if (typeof plongeurs === 'undefined') window.plongeurs = [];
    if (typeof palanquees === 'undefined') window.palanquees = [];
    if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
    } catch (renderError) {
      console.error("⌫ Erreur rendu en mode dégradé:", renderError);
    }
    
    const authError = document.getElementById("auth-error");
    if (authError) {
      authError.textContent = "Erreur de chargement des données. Mode local activé.";
      authError.style.display = "block";
    }
    
    alert("Erreur de chargement. L'application fonctionne en mode dégradé.\n\nVeuillez actualiser la page ou contacter l'administrateur.");
  }
}

// ===== GÉNÉRATION PDF =====
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
    
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
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
    htmlContent += '<h1 class="main-title">PALANQUÉES JSAS</h1>';
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
          htmlContent += '<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">';
          htmlContent += '<h3>Palanquée ' + (i + 1) + ' (' + pal.length + ' plongeur' + (pal.length > 1 ? 's' : '') + ')</h3>';
          
          if (pal.length === 0) {
            htmlContent += '<p>Aucun plongeur assigné</p>';
          } else {
            pal.forEach(p => {
              if (p && p.nom) {
                htmlContent += '<p>• ' + p.nom + ' (' + (p.niveau || 'N?') + ')' + (p.pre ? ' - ' + p.pre : '') + '</p>';
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
      plongeursLocal.forEach(p => {
        if (p && p.nom) {
          htmlContent += '<p>• ' + p.nom + ' (' + (p.niveau || 'N?') + ')' + (p.pre ? ' - ' + p.pre : '') + '</p>';
        }
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '</main>';
    htmlContent += '</div></body></html>';

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const previewContainer = document.getElementById("previewContainer");
    const pdfPreview = document.getElementById("pdfPreview");
    
    if (previewContainer && pdfPreview) {
      previewContainer.style.display = "block";
      pdfPreview.src = url;
      
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF généré");
      console.log("✅ Aperçu PDF généré");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      
    } else {
      console.error("⌫ Éléments d'aperçu non trouvés");
      alert("Erreur: impossible d'afficher l'aperçu PDF");
    }
    
  } catch (error) {
    console.error("⌫ Erreur génération aperçu PDF:", error);
    alert("Erreur lors de la génération de l'aperçu: " + error.message);
  }
}

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
    return element || { value: "" }; // Retourne un objet avec value vide si élément non trouvé
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
    yPosition += 8; // Espacement réduit de 15 à 8
    
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
        
        // Calculer la hauteur nécessaire pour cette palanquée (TRÈS RÉDUITE)
        let palanqueeHeight = 14; // Header encore plus réduit de 18 à 14
        palanqueeHeight += (pal.length * spacing.lineHeight) + 4; // Plongeurs + espacement réduit
        palanqueeHeight += 30; // Paramètres (4 lignes au lieu de 5) - encore réduit
        palanqueeHeight += spacing.sectionGap; // Espacement final
        
        checkPageBreak(palanqueeHeight + 10);
        
        const isAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
        
        // En-tête de palanquée TRÈS RÉDUIT
        if (isAlert) {
          doc.setFillColor(colors.dangerR, colors.dangerG, colors.dangerB);
        } else {
          doc.setFillColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
        }
        doc.rect(margin, yPosition, contentWidth, 8, 'F'); // Hauteur drastiquement réduite de 12 à 8
        
        addText('Palanquée ' + (i + 1) + ' - ' + pal.length + ' plongeurs', margin + 5, yPosition + 6, 12, 'bold', 'white'); // Position Y ajustée
        
        const gps = pal.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p && p.niveau === "N1");
        const autonomes = pal.filter(p => p && ["N2", "N3"].includes(p.niveau));
        
        addText('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 6, 10, 'normal', 'white'); // Position Y ajustée
        
        yPosition += 12; // Espacement encore plus réduit de 15 à 12
        
        // Liste des plongeurs (triés par niveau)
        if (pal.length === 0) {
          addText('Aucun plongeur assigné', margin + 10, yPosition, 11, 'normal', 'gray');
          yPosition += spacing.lineHeight + 4; // Espacement réduit pour cohérence
        } else {
          // Définir l'ordre de tri des niveaux (du plus capé au moins capé)
          const ordreNiveaux = ['E4', 'E3', 'E2', 'GP', 'N3', 'N2', 'N1', 'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'débutant', 'Déb', 'N4/GP', 'N4'];
          
          // Fonction de tri par niveau
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
          yPosition += 4; // Espacement réduit entre dernier plongeur et paramètres
        }
        
        // Paramètres de plongée
        
        // Ligne 1: Horaire de mise à l'eau
        addText('Horaire mise à l\'eau:', margin + 5, yPosition, 11, 'bold', 'primary');
        
        if (pal.horaire && pal.horaire.trim()) {
          addText(pal.horaire, margin + 50, yPosition, 10, 'normal');
          addText('Correction: ', margin + 80, yPosition, 9, 'bold', 'gray');
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 105, yPosition - 2, margin + 140, yPosition - 2); // Ligne mieux alignée
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 50, yPosition - 2, margin + 85, yPosition - 2); // Ligne mieux alignée
          addText('(HH:MM)', margin + 88, yPosition, 9, 'normal', 'gray');
        }
        yPosition += 4; // Espacement réduit pour lignes vides
        
        // Ligne 2: Profondeurs et durées prévues
        addText('Prof. prévue: ', margin + 5, yPosition, 11, 'bold', 'primary');
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          addText(pal.profondeurPrevue + ' m', margin + 35, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 35, yPosition - 2, margin + 55, yPosition - 2); // Ligne mieux alignée
          addText('m', margin + 57, yPosition, 10, 'normal', 'gray');
        }
        
        addText('Durée prévue:', margin + 80, yPosition, 11, 'bold', 'primary');
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          addText(pal.dureePrevue + ' min', margin + 115, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 115, yPosition - 2, margin + 140, yPosition - 2); // Ligne mieux alignée
          addText('min', margin + 142, yPosition, 10, 'normal', 'gray');
        }
        yPosition += 4; // Espacement réduit pour lignes vides
        
        // Ligne 3: Profondeurs et durées réalisées
        addText('Prof. réalisée:', margin + 5, yPosition, 11, 'bold', 'success');
        if (pal.profondeurRealisee && pal.profondeurRealisee.trim()) {
          addText(pal.profondeurRealisee + ' m', margin + 40, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 40, yPosition - 2, margin + 60, yPosition - 2); // Ligne mieux alignée
          addText('m', margin + 62, yPosition, 10, 'normal', 'gray');
        }
        
        addText('Durée réalisée:', margin + 80, yPosition, 11, 'bold', 'success');
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          addText(pal.dureeRealisee + ' min', margin + 120, yPosition, 10, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 120, yPosition - 2, margin + 145, yPosition - 2); // Ligne mieux alignée
          addText('min', margin + 147, yPosition, 10, 'normal', 'gray');
        }
        yPosition += 4; // Espacement réduit pour lignes vides
        
        // Ligne 4: Paliers
        addText('Paliers:', margin + 5, yPosition, 11, 'bold', 'primary');
        
        if (pal.paliers && pal.paliers.trim()) {
          addText(pal.paliers, margin + 25, yPosition, 10, 'normal');
          // Correction rapprochée
          addText('Correction:', margin + 70, yPosition, 10, 'bold', 'gray');
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 95, yPosition - 2, margin + 160, yPosition - 2); // Ligne mieux alignée
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 25, yPosition - 2, margin + 65, yPosition - 2); // Ligne mieux alignée
          addText('(ex: 3 min à 3 m) | Correction:', margin + 70, yPosition, 9, 'normal', 'gray');
          doc.line(margin + 130, yPosition - 2, margin + 170, yPosition - 2); // Ligne mieux alignée
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
        addText('Document officiel JSAS - Conforme FFESSM - Version 2.1.3 Pro', margin, pageHeight - 15, 8, 'normal', 'gray');
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
    alert("Erreur lors de la génération du PDF : " + error.message + "\n\nVérifiez que jsPDF est bien chargé.");
  }
}

// ===== DRAG & DROP SÉCURISÉ =====
// Variables globales pour le drag & drop (DÉCLARÉES EN HAUT DU FICHIER)
let dragData = null;

function setupDragAndDrop() {
  console.log("🎯 Configuration du drag & drop...");
  
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
}

function handleDragStart(e) {
  if (!e.target.classList.contains('plongeur-item')) return;
  
  console.log("🎯 Drag started sur:", e.target);
  e.target.classList.add('dragging');
  e.target.style.opacity = '0.5';
  
  // Récupérer les données selon le type d'élément
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
}

function handleDragEnd(e) {
  if (e.target.classList.contains('plongeur-item')) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '1';
    console.log("🎯 Drag ended");
  }
  // NE PAS réinitialiser dragData ici, le drop en a besoin
}

function handleDragOver(e) {
  const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
  if (dropZone) {
    e.preventDefault(); // CRUCIAL
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    dropZone.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
  if (dropZone && !dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
}

async function handleDrop(e) {
  e.preventDefault();
  console.log("🎯 DROP ÉVÉNEMENT DÉTECTÉ");
  
  const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
  if (!dropZone) {
    console.warn("⚠️ Aucune zone de drop valide trouvée");
    dragData = null; // Nettoyer
    return;
  }
  
  dropZone.classList.remove('drag-over');
  console.log("🎯 Drop zone trouvée:", dropZone.id || dropZone.className);
  
  // Récupérer les données (essayer dragData en premier)
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
    console.log("Debug - dragData:", dragData);
    console.log("Debug - dataTransfer data:", e.dataTransfer ? e.dataTransfer.getData("text/plain") : "dataTransfer null");
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
  
  try {
    // Drop vers la liste principale
    if (dropZone.id === 'listePlongeurs') {
      console.log("🎯 Drop vers liste principale");
      
      if (data.type === "fromPalanquee") {
        console.log("🔄 Retour vers liste depuis palanquée", data.palanqueeIndex);
        
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
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
  }
  
  // Nettoyer les données de drag
  dragData = null;
  console.log("🧹 Données de drag nettoyées");
}

// ===== EVENT HANDLERS =====
function setupEventListeners() {
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
        console.error("⌫ Erreur connexion:", error);
        
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
        console.error("⌫ Erreur déconnexion:", error);
      }
    });
  }

// === FONCTIONNALITÉ BOUTON "VALIDER DP" ===
// Event listener pour le bouton Valider DP
const validerDPBtn = document.getElementById("valider-dp");
if (validerDPBtn) {
  validerDPBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // Empêcher le comportement par défaut du formulaire
    
    try {
      // Récupérer les valeurs des champs
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
      
      // Vérifier le format du nom DP (au moins nom et prénom)
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
        window.dpInfo.niveau = 'DP'; // Par défaut
      }
      
      // Sauvegarder dans Firebase si disponible
      if (typeof db !== 'undefined' && db) {
        try {
          const dpKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
          await db.ref(`dpInfo/${dpKey}`).set(dpInfo);
          console.log("✅ Informations DP sauvegardées dans Firebase");
        } catch (firebaseError) {
          console.warn("⚠️ Erreur sauvegarde Firebase:", firebaseError.message);
          // Continue sans bloquer l'application
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
      
      // Désactiver temporairement le bouton pour éviter les doublons
      validerDPBtn.disabled = true;
      validerDPBtn.textContent = "✅ Validé";
      validerDPBtn.style.backgroundColor = "#28a745";
      
      // Réactiver le bouton après 3 secondes
      setTimeout(() => {
        validerDPBtn.disabled = false;
        validerDPBtn.textContent = "Valider DP";
        validerDPBtn.style.backgroundColor = "#007bff";
      }, 3000);
      
      // Notification système si disponible
      if (typeof showNotification === 'function') {
        showNotification("✅ Informations DP validées et sauvegardées", "success");
      }
      
      // Log pour debug
      console.log("✅ Validation DP réussie:", dpInfo);
      
      // Optionnel : déclencher une synchronisation
      if (typeof syncToDatabase === 'function') {
        setTimeout(syncToDatabase, 1000);
      }
      
    } catch (error) {
      console.error("❌ Erreur validation DP:", error);
      
      // Afficher l'erreur à l'utilisateur
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

// === FONCTION UTILITAIRE POUR CHARGER LES INFOS DP EXISTANTES ===
async function chargerInfoDPExistantes() {
  try {
    if (typeof db === 'undefined' || !db) return;
    
    const dpDate = document.getElementById("dp-date")?.value;
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    if (!dpDate) return;
    
    // Chercher les informations DP pour cette date
    const snapshot = await db.ref('dpInfo').orderByChild('date').equalTo(dpDate).once('value');
    
    if (snapshot.exists()) {
      const dpInfos = snapshot.val();
      const dpKeys = Object.keys(dpInfos);
      
      // Prendre la première correspondance
      const dpData = dpInfos[dpKeys[0]];
      
      // Pré-remplir les champs si ils sont vides
      const dpNomInput = document.getElementById("dp-nom");
      const dpLieuInput = document.getElementById("dp-lieu");
      const dpPlongeeInput = document.getElementById("dp-plongee");
      
      if (dpNomInput && !dpNomInput.value && dpData.nom) {
        dpNomInput.value = dpData.nom;
      }
      
      if (dpLieuInput && !dpLieuInput.value && dpData.lieu) {
        dpLieuInput.value = dpData.lieu;
      }
      
      if (dpPlongeeInput && dpData.plongee) {
        dpPlongeeInput.value = dpData.plongee;
      }
      
      console.log("📋 Informations DP pré-chargées pour", dpDate);
    }
    
  } catch (error) {
    console.error("❌ Erreur chargement infos DP:", error);
  }
}

// === EVENT LISTENERS ADDITIONNELS ===
// Auto-charger les infos quand la date change
const dpDateInput = document.getElementById("dp-date");
if (dpDateInput) {
  dpDateInput.addEventListener("change", chargerInfoDPExistantes);
}

// Auto-charger au démarrage si une date est déjà définie
if (dpDateInput && dpDateInput.value) {
  setTimeout(chargerInfoDPExistantes, 1000);
}

console.log("✅ Fonctionnalité bouton 'Valider DP' configurée");

  // === AJOUT DE PLONGEUR ===
  const addForm = document.getElementById("addForm");
  if (addForm) {
    addForm.addEventListener("submit", e => {
      e.preventDefault();
      
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
    });
  }

  // === AJOUT DE PALANQUÉE ===
  const addPalanqueeBtn = document.getElementById("addPalanquee");
  if (addPalanqueeBtn) {
    addPalanqueeBtn.addEventListener("click", () => {
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
    });
  }

  // === EXPORT/IMPORT JSON ===
  const exportJSONBtn = document.getElementById("exportJSON");
  if (exportJSONBtn) {
    exportJSONBtn.addEventListener("click", () => {
      if (typeof exportToJSON === 'function') {
        exportToJSON();
      }
    });
  }

  const importJSONInput = document.getElementById("importJSON");
  if (importJSONInput) {
    importJSONInput.addEventListener("change", e => {
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
        } catch (error) {
          console.error("Erreur import:", error);
          alert("Erreur lors de l'import du fichier JSON");
        }
      };
      reader.readAsText(file);
    });
  }

  // === PDF ===
  const generatePDFBtn = document.getElementById("generatePDF");
  if (generatePDFBtn) {
    generatePDFBtn.addEventListener("click", generatePDFPreview);
  }
  
  const exportPDFBtn = document.getElementById("exportPDF");
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener("click", exportToPDF);
  }

  // === SESSIONS ===
  const loadSessionBtn = document.getElementById("load-session");
  if (loadSessionBtn) {
    loadSessionBtn.addEventListener("click", async () => {
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
        }
      }
    });
  }
  
  const refreshSessionsBtn = document.getElementById("refresh-sessions");
  if (refreshSessionsBtn) {
    refreshSessionsBtn.addEventListener("click", async () => {
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
      }
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
      }
    });
  }

  const saveSessionBtn = document.getElementById("save-session");
  if (saveSessionBtn) {
    saveSessionBtn.addEventListener("click", async () => {
      if (typeof saveSessionData === 'function') {
        await saveSessionData();
        alert("Session sauvegardée !");
        if (typeof populateSessionSelector === 'function') {
          await populateSessionSelector();
        }
        if (typeof populateSessionsCleanupList === 'function') {
          await populateSessionsCleanupList();
        }
      }
    });
  }

  // === TEST FIREBASE ===
  const testFirebaseBtn = document.getElementById("test-firebase");
  if (testFirebaseBtn) {
    testFirebaseBtn.addEventListener("click", async () => {
      console.log("🧪 === TEST FIREBASE COMPLET ===");
      
      try {
        console.log("📡 Test 1: Vérification connexion Firebase");
        console.log("Firebase connecté:", typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined');
        console.log("Instance db:", typeof db !== 'undefined' && db ? "✅ OK" : "⌫ MANQUANTE");
        
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
        console.error("⌫ Erreur test Firebase:", error);
        alert("Erreur lors du test Firebase : " + error.message);
      }
    });
  }

  // === TRI DES PLONGEURS ===
  const sortBtns = document.querySelectorAll('.sort-btn');
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sortType = btn.dataset.sort;
      if (typeof sortPlongeurs === 'function') {
        sortPlongeurs(sortType);
      }
    });
  });

  // === NETTOYAGE SESSIONS ===
  const setupCleanupListeners = () => {
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

    // === NETTOYAGE DP ===
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
  };

  // Configuration des listeners de nettoyage
  setupCleanupListeners();

  // Event listeners pour les checkboxes de nettoyage
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('session-cleanup-checkbox') || 
        e.target.classList.contains('dp-cleanup-checkbox')) {
      if (typeof updateCleanupSelection === 'function') {
        updateCleanupSelection();
      }
    }
  });
}

// ===== INITIALISATION DE L'APPLICATION =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Initialisation de l'application JSAS...");
  
  try {
    // Initialiser Firebase
    if (typeof initializeFirebase === 'function') {
      const firebaseOK = initializeFirebase();
      if (!firebaseOK) {
        throw new Error("Échec initialisation Firebase");
      }
    } else {
      console.warn("⚠️ Fonction initializeFirebase non disponible");
    }
    
    // Configurer les event listeners
    setupEventListeners();
    
    // Configurer le drag & drop
    setupDragAndDrop();
    
    console.log("✅ Application JSAS prête !");
    
  } catch (error) {
    console.error("⌫ Erreur critique initialisation:", error);
    
    // Mode dégradé
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
    
    const authContainer = document.getElementById("auth-container");
    if (authContainer) {
      authContainer.style.display = "block";
      const errorDiv = document.getElementById("auth-error");
      if (errorDiv) {
        errorDiv.textContent = "Erreur d'initialisation. Veuillez actualiser la page.";
        errorDiv.style.display = "block";
      }
    }
  }
});

// === CORRECTION ET DIAGNOSTIC LISTE DP ===

// 1. FONCTION POUR CHARGER L'HISTORIQUE DP (manquante ou corrompue)
async function chargerHistoriqueDP() {
  console.log("📋 Chargement de l'historique DP...");
  
  const dpDatesSelect = document.getElementById("dp-dates");
  if (!dpDatesSelect) {
    console.error("❌ Élément dp-dates non trouvé");
    return;
  }
  
  // Vider la liste actuelle
  dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';
  
  try {
    // Vérifier si Firebase est disponible
    if (typeof db === 'undefined' || !db) {
      console.warn("⚠️ Firebase non disponible pour charger l'historique DP");
      dpDatesSelect.innerHTML += '<option disabled>Firebase non connecté</option>';
      return;
    }
    
    // Charger les données depuis Firebase
    const snapshot = await db.ref('dpInfo').once('value');
    
    if (!snapshot.exists()) {
      console.log("ℹ️ Aucune donnée DP trouvée dans Firebase");
      dpDatesSelect.innerHTML += '<option disabled>Aucun DP enregistré</option>';
      return;
    }
    
    const dpInfos = snapshot.val();
    const dpList = [];
    
    // Convertir en tableau et trier
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
    
    // Trier par date décroissante (plus récent en premier)
    dpList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    // Ajouter les options
    dpList.forEach(dp => {
      const option = document.createElement("option");
      option.value = dp.key;
      option.textContent = `${dp.date} - ${dp.nom} - ${dp.lieu} (${dp.plongee})`;
      dpDatesSelect.appendChild(option);
    });
    
    console.log(`✅ ${dpList.length} DP chargés dans l'historique`);
    
    // Ajouter l'event listener pour la sélection
    dpDatesSelect.addEventListener('change', afficherInfoDP);
    
  } catch (error) {
    console.error("❌ Erreur chargement historique DP:", error);
    dpDatesSelect.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

// 2. FONCTION POUR AFFICHER LES INFOS D'UN DP SÉLECTIONNÉ
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
  
  // Afficher un loader
  historiqueInfo.innerHTML = '<p>⏳ Chargement des informations...</p>';
  
  if (typeof db === 'undefined' || !db) {
    historiqueInfo.innerHTML = '<p style="color: red;">❌ Firebase non disponible</p>';
    return;
  }
  
  // Charger les détails du DP sélectionné
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
          <p><strong>🕐 Session :</strong> ${dpData.plongee || 'matin'}</p>
          <p><strong>⏰ Créé le :</strong> ${dpData.timestamp ? new Date(dpData.timestamp).toLocaleString('fr-FR') : 'Date inconnue'}</p>
          
          <div style="margin-top: 15px;">
            <button onclick="chargerDonneesDPSelectionne('${selectedKey}')" 
                    style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              📥 Charger dans l'interface
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
      historiqueInfo.innerHTML = `<p style="color: red;">❌ Erreur : ${error.message}</p>`;
    });
}

// 3. FONCTION POUR CHARGER UN DP DANS L'INTERFACE ACTUELLE
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
    
    // Charger les données dans l'interface
    const dpNomInput = document.getElementById("dp-nom");
    const dpDateInput = document.getElementById("dp-date");
    const dpLieuInput = document.getElementById("dp-lieu");
    const dpPlongeeInput = document.getElementById("dp-plongee");
    
    if (dpNomInput) dpNomInput.value = dpData.nom || "";
    if (dpDateInput) dpDateInput.value = dpData.date || "";
    if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
    if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
    
    // Mettre à jour le message DP
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      dpMessage.innerHTML = `
        <div style="color: #007bff; font-weight: bold; padding: 10px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 4px;">
          📥 DP chargé depuis l'historique
        </div>
      `;
    }
    
    alert("✅ Données DP chargées avec succès !");
    console.log("✅ DP chargé:", dpData);
    
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    alert("❌ Erreur lors du chargement : " + error.message);
  }
}

// 4. FONCTION POUR SUPPRIMER UN DP
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
    
    // Recharger l'historique
    await chargerHistoriqueDP();
    
    // Vider l'affichage des infos
    const historiqueInfo = document.getElementById("historique-info");
    if (historiqueInfo) {
      historiqueInfo.innerHTML = '';
    }
    
    console.log("✅ DP supprimé:", dpKey);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// 5. FONCTION DE DIAGNOSTIC
async function diagnosticListeDP() {
  console.log("🔍 === DIAGNOSTIC LISTE DP ===");
  
  // Vérifier les éléments DOM
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");
  
  console.log("DOM Elements:", {
    dpDatesSelect: !!dpDatesSelect,
    historiqueInfo: !!historiqueInfo
  });
  
  // Vérifier Firebase
  console.log("Firebase:", {
    dbDefined: typeof db !== 'undefined',
    dbConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'unknown'
  });
  
  // Tester la connexion à Firebase
  if (typeof db !== 'undefined' && db) {
    try {
      const snapshot = await db.ref('dpInfo').limitToFirst(1).once('value');
      console.log("Test Firebase:", snapshot.exists() ? "✅ Données trouvées" : "⚠️ Aucune donnée");
      
      if (snapshot.exists()) {
        const allSnapshot = await db.ref('dpInfo').once('value');
        const allData = allSnapshot.val();
        console.log("Nombre total de DP:", Object.keys(allData).length);
        console.log("Exemple de données:", Object.values(allData)[0]);
      }
    } catch (error) {
      console.error("❌ Erreur test Firebase:", error);
    }
  }
  
  console.log("=== FIN DIAGNOSTIC ===");
}

// 6. INITIALISATION ET EXPORT DES FONCTIONS GLOBALES
window.chargerHistoriqueDP = chargerHistoriqueDP;
window.afficherInfoDP = afficherInfoDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.supprimerDPSelectionne = supprimerDPSelectionne;
window.diagnosticListeDP = diagnosticListeDP;

// 7. AUTO-CHARGEMENT SI LES ÉLÉMENTS SONT PRÉSENTS
document.addEventListener('DOMContentLoaded', () => {
  // Attendre un peu que tout soit initialisé
  setTimeout(() => {
    if (document.getElementById("dp-dates")) {
      console.log("🔄 Auto-chargement historique DP...");
      chargerHistoriqueDP();
    }
  }, 2000);
});

console.log("✅ Fonctions DP corrigées et chargées");