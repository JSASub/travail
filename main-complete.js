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
  if (Date.now() - pageLoadTime < 3000) {
    console.log("🚫 Export PDF bloqué - page en cours de chargement");
    return;
  }
    
  console.log("📄 Génération du PDF professionnel...");
  
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  try {
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
    
    function checkPageBreak(heightNeeded, forceNewPage) {
      if (forceNewPage || yPosition + heightNeeded > pageHeight - 30) {
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
      if (!dateString) return "Non definie";
      const date = new Date(dateString);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('fr-FR', options).replace(/'/g, "'");
    }
    
    // === EN-TÊTE PRINCIPAL ===
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Palanquées JSAS', margin, 20);
	doc.setFontSize(20);
    doc.text('Fiche de Sécurité', margin, 30);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Associative Sportive de Plongée', margin, 35);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DP: ' + dpNom.substring(0, 30), margin, 45);
    doc.text('Date: ' + formatDateFrench(dpDate), margin, 52);
    doc.text('Lieu: ' + dpLieu.substring(0, 20) + ' | Session: ' + dpPlongee.toUpperCase(), margin + 100, 52);
    
    yPosition = 75;
    
    // === STATISTIQUES ===
    const totalPlongeurs = plongeurs.length + palanquees.reduce((total, pal) => total + pal.length, 0);
    const plongeursEnPalanquees = palanquees.reduce((total, pal) => total + pal.length, 0);
    const alertesTotal = checkAllAlerts();
    
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TABLEAU DE BORD', margin, yPosition);
    
    doc.setDrawColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 2, margin + 50, yPosition + 2);
    
    yPosition += 15;
    
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    doc.text('Total plongeurs: ' + totalPlongeurs, margin, yPosition);
    doc.text('                        Palanquées: ' + palanquees.length, margin + 50, yPosition);
    yPosition += 8;
    
    doc.text('Assignés: ' + plongeursEnPalanquees + ' (' + (totalPlongeurs > 0 ? ((plongeursEnPalanquees/totalPlongeurs)*100).toFixed(0) : 0) + '%)', margin, yPosition);
    doc.text('Alertes: ' + alertesTotal.length, margin + 80, yPosition);
    
    yPosition += 15;
    
    // === ALERTES DE SÉCURITÉ ===
    if (alertesTotal.length > 0) {
      checkPageBreak(20 + (alertesTotal.length * 8));
      
      doc.setDrawColor(colors.dangerR, colors.dangerG, colors.dangerB);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition, contentWidth, 15 + (alertesTotal.length * 6), 'S');
      
      doc.setTextColor(colors.dangerR, colors.dangerG, colors.dangerB);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('ALERTES DE SÉCURITÉ (' + alertesTotal.length + ')', margin + 5, yPosition + 10);
      
      yPosition += 18;
      
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      for (let i = 0; i < alertesTotal.length; i++) {
        const alerteClean = alertesTotal[i].replace(/'/g, "'");
        doc.text("• " + alerteClean, margin + 5, yPosition + (i * 6));
      }
      
      yPosition += (alertesTotal.length * 6) + 10;
    }
    
    // === PALANQUÉES DÉTAILLÉES ===
    checkPageBreak(30, true);
    
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('ORGANISATION DES PALANQUÉES', margin, yPosition);
    yPosition += 15;
    
    if (palanquees.length === 0) {
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(1);
      doc.rect(margin, yPosition, contentWidth, 15, 'S');
      
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      doc.setFontSize(12);
      doc.text('Aucune palanquée créée - Tous les plongeurs en attente', margin + 10, yPosition + 10);
      yPosition += 25;
    } else {
      for (let i = 0; i < palanquees.length; i++) {
        const pal = palanquees[i];
        
        // Calculer la hauteur nécessaire en tenant compte des détails
        // Hauteur de base : 5 (espace) + 8 (horaire) + 8 (prévues) + 8 (réalisées) + 10 (paliers) = 39
        let extraHeight = 39;
        
        // Ajouter 6 points si les paliers ont une valeur (ligne correction supplémentaire)
        if (pal.paliers && pal.paliers.trim()) {
          extraHeight += 6;
        }
        
        const palanqueeHeight = 20 + (pal.length * 6) + extraHeight;
        checkPageBreak(palanqueeHeight + 5);
        
        const isAlert = checkAlert(pal);
        
        if (isAlert) {
          doc.setFillColor(colors.dangerR, colors.dangerG, colors.dangerB);
        } else {
          doc.setFillColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
        }
        doc.rect(margin, yPosition, contentWidth, 12, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Palanquée ' + (i + 1) + ' - ' + pal.length + ' plongeurs', margin + 5, yPosition + 8);
        
        const gps = pal.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p.niveau === "N1");
        const autonomes = pal.filter(p => ["N2", "N3"].includes(p.niveau));
        
        doc.setFontSize(9);
        doc.text('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 8);
        
        yPosition += 18;
        
        doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        if (pal.length === 0) {
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.text('Aucun plongeur assigne', margin + 10, yPosition);
          yPosition += 8;
        } else {
          for (let j = 0; j < pal.length; j++) {
            const p = pal[j];
            const nomClean = p.nom.replace(/'/g, "'");
            const preClean = p.pre ? p.pre.replace(/'/g, "'") : '';
            
            doc.setFont(undefined, 'bold');
            doc.text('• ' + nomClean, margin + 5, yPosition);
            
            doc.setFont(undefined, 'normal');
            
            if (preClean) {
              doc.text('Prérogative: ' + preClean, 100, yPosition);
            }
            
            doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
            doc.text('Niveau: ' + p.niveau, 135, yPosition);
            doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
            
            yPosition += 6;
          }
        }
        
        // AJOUTER LES PARAMÈTRES APRÈS LA LISTE DES PLONGEURS avec zones à remplir
        yPosition += 5; // Petit espace avant les paramètres
        
        doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        
        // Ligne 1: Horaire de mise à l'eau
        doc.text('Horaire mise à l\'eau:', margin + 5, yPosition);
        
        if (pal.horaire && pal.horaire.trim()) {
          // Afficher la valeur saisie + zone de correction
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.horaire, margin + 45, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Correction: ', margin + 85, yPosition);
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 105, yPosition + 1, margin + 140, yPosition + 1);
        } else {
          // Zone vide à remplir
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 45, yPosition + 1, margin + 80, yPosition + 1);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.text('(HH:MM)', margin + 82, yPosition);
        }
        yPosition += 8;
        
        // Ligne 2: Profondeurs et durées prévues
        doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        
        // Profondeur prévue
        doc.text('Prof. prévue: ', margin + 5, yPosition);
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.profondeurPrevue + ' m', margin + 25, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 35, yPosition);
          doc.line(margin + 43, yPosition + 1, margin + 53, yPosition + 1);
        } else {
          doc.line(margin + 25, yPosition + 1, margin + 45, yPosition + 1);
          doc.text(' m', margin + 47, yPosition);
        }
        
        // Durée prévue
        doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Durée prévue:', margin + 60, yPosition);
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.dureePrevue + ' min', margin + 82, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 95, yPosition);
          doc.line(margin + 103, yPosition + 1, margin + 113, yPosition + 1);
        } else {
          doc.line(margin + 82, yPosition + 1, margin + 102, yPosition + 1);
          doc.text(' min', margin + 104, yPosition);
        }
        yPosition += 8;
        
        // Ligne 3: Profondeurs et durées réalisées
        doc.setTextColor(colors.successR, colors.successG, colors.successB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        
        // Profondeur réalisée
        doc.text('Prof. réalisée:', margin + 5, yPosition);
        if (pal.profondeurRealisee && pal.profondeurRealisee.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.profondeurRealisee + ' m', margin + 28, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 38, yPosition);
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 46, yPosition + 1, margin + 56, yPosition + 1);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 28, yPosition + 1, margin + 48, yPosition + 1);
          doc.text(' m', margin + 50, yPosition);
        }
        
        // Durée réalisée
        doc.setTextColor(colors.successR, colors.successG, colors.successB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Durée réalisée:', margin + 60, yPosition);
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.dureeRealisee + ' min', margin + 85, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 98, yPosition);
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 106, yPosition + 1, margin + 116, yPosition + 1);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 85, yPosition + 1, margin + 105, yPosition + 1);
          doc.text(' min', margin + 107, yPosition);
        }
        yPosition += 8;
        
        // Ligne 4: Paliers
        doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Paliers:', margin + 5, yPosition);
        
        if (pal.paliers && pal.paliers.trim()) {
          // Afficher la valeur saisie
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.text(pal.paliers, margin + 20, yPosition);
          yPosition += 6;
          
          // Zone de correction en dessous
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.text('Correction paliers:', margin + 5, yPosition);
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 35, yPosition + 1, margin + 120, yPosition + 1);
        } else {
          // Zone vide à remplir
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 20, yPosition + 1, margin + 120, yPosition + 1);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.text('(ex: 3 min à 3 m)', margin + 122, yPosition);
        }
        yPosition += 10; // Plus d'espace après les paliers
        
        yPosition += 10;
      }
    }
    
    // === PLONGEURS NON ASSIGNÉS ===
    if (plongeurs.length > 0) {
      checkPageBreak(25 + (plongeurs.length * 6));
      
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition, contentWidth, 15 + (plongeurs.length * 6), 'S');
      
      doc.setTextColor(133, 100, 4);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('PLONGEURS en attente/disponibles (' + plongeurs.length + ')', margin + 5, yPosition + 10);
      
      yPosition += 18;
      
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      for (let i = 0; i < plongeurs.length; i++) {
        const p = plongeurs[i];
        const nomClean = p.nom.replace(/'/g, "'");
        const preClean = p.pre ? p.pre.replace(/'/g, "'") : '';
        const textLine = '• ' + nomClean + '   (' + p.niveau + ')' + (preClean ? '   - ' + preClean : '');
        doc.text(textLine, margin + 5, yPosition + (i * 6));
      }
      
      yPosition += (plongeurs.length * 6) + 10;
    }
    
    // === FOOTER ===
    const totalPages = doc.internal.getCurrentPageInfo().pageNumber;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      
      doc.setDrawColor(colors.grayR, colors.grayG, colors.grayB);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      if (pageNum === totalPages) {
        doc.text('Document officiel JSAS - Conforme FFESSM - Version 2.1.3 Pro', margin, pageHeight - 15);
        doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR') + ' - Ne pas modifier', margin, pageHeight - 10);
      }
      
      doc.text('Page ' + pageNum + '/' + totalPages, pageWidth - margin - 20, pageHeight - 10);
      doc.text(new Date().toLocaleString('fr-FR'), margin, pageHeight - 5);
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '-pro.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF généré:", fileName);
    
    const alertesText = alertesTotal.length > 0 ? '\n⚠️ ' + alertesTotal.length + ' alerte(s) détectée(s)' : '\n✅ Aucune alerte';
    alert('PDF généré avec succès !\n\n📊 ' + totalPlongeurs + ' plongeurs dans ' + palanquees.length + ' palanquées' + alertesText + '\n\n📁 Fichier: ' + fileName);
    
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF : " + error.message);
  }
}


// ===== DRAG & DROP SÉCURISÉ =====

// Variables globales pour le drag & drop
let dragData = null;

function setupDragAndDrop() {
  // Event delegation pour dragstart
  document.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('plongeur-item')) return;
    
    console.log("🎯 Drag started");
    e.target.classList.add('dragging');
    e.target.style.opacity = '0.5';
    
    // Récupérer les données selon le type d'élément
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
    
    // Stocker dans dataTransfer si disponible
    if (e.dataTransfer && dragData) {
      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = "move";
    }
  });
  
  // Event delegation pour dragend
  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('plongeur-item')) {
      e.target.classList.remove('dragging');
      e.target.style.opacity = '1';
    }
    dragData = null;
  });
  
  // Event delegation pour dragover
  document.addEventListener('dragover', (e) => {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      dropZone.classList.add('drag-over');
    }
  });
  
  // Event delegation pour dragleave
  document.addEventListener('dragleave', (e) => {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });
  
  // Event delegation pour drop
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (!dropZone) return;
    
    dropZone.classList.remove('drag-over');
    
    // Récupérer les données de drag
    let data = dragData;
    
    // Fallback vers dataTransfer si dragData n'est pas disponible
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
      console.warn("⚠️ Aucune donnée de drag disponible");
      return;
    }
    
    // S'assurer que les variables globales existent
    if (typeof plongeurs === 'undefined') window.plongeurs = [];
    if (typeof palanquees === 'undefined') window.palanquees = [];
    if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    
    // Gestion du drop vers la liste principale
    if (dropZone.id === 'listePlongeurs') {
      if (data.type === "fromPalanquee") {
        // Vérifier le verrou
        if (typeof window.acquirePalanqueeLock === 'function') {
          const hasLock = await window.acquirePalanqueeLock(data.palanqueeIndex);
          if (!hasLock) {
            console.warn("⚠️ Verrou non acquis pour retour vers liste");
            return;
          }
        }
        
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
      }
      return;
    }
    
    // Gestion du drop vers une palanquée
    const palanqueeIndex = parseInt(dropZone.dataset.index);
    if (isNaN(palanqueeIndex)) return;
    
    // Vérifier le verrou
    if (typeof window.acquirePalanqueeLock === 'function') {
      const hasLock = await window.acquirePalanqueeLock(palanqueeIndex);
      if (!hasLock) {
        console.warn("⚠️ Verrou non acquis pour ajout à palanquée");
        return;
      }
    }
    
    const targetPalanquee = palanquees[palanqueeIndex];
    if (!targetPalanquee) return;
    
    if (data.type === "fromMainList") {
      const indexToRemove = plongeurs.findIndex(p => 
        p.nom === data.plongeur.nom && p.niveau === data.plongeur.niveau
      );
      
      if (indexToRemove !== -1) {
        plongeurs.splice(indexToRemove, 1);
        targetPalanquee.push(data.plongeur);
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
  });
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

console.log("📱 Module principal chargé");