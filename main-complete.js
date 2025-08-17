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
  console.log("📄 Export PDF lancé...");
  
  try {
    // Vérifier si jsPDF est disponible
    if (typeof window.jsPDF === 'undefined') {
      console.warn("⚠️ jsPDF non trouvé, utilisation de l'aperçu HTML");
      
      // Alternative : générer l'aperçu et suggérer l'impression
      generatePDFPreview();
      
      setTimeout(() => {
        if (confirm("jsPDF n'est pas disponible.\n\nVoulez-vous imprimer la page d'aperçu ?\n(Utilisez Ctrl+P ou Cmd+P)")) {
          window.print();
        }
      }, 1000);
      
      return;
    }

    // S'assurer que les variables existent
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
    // Créer le document PDF
    const doc = new window.jsPDF();
    
    // Configuration
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;
    
    // Fonction utilitaire pour ajouter du texte avec retour à la ligne
    function addText(text, fontSize = 12, isBold = false) {
      if (isBold) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(fontSize);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      
      // Vérifier si on dépasse la page
      if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * fontSize * 0.5 + 5;
      
      return yPosition;
    }
    
    // Fonction pour formater la date
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    }
    
    // EN-TÊTE
    doc.setFillColor(0, 64, 128);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PALANQUÉES JSAS", margin, 25);
    
    doc.setFontSize(12);
    doc.text(`Directeur de Plongée: ${dpNom}`, margin, 35);
    doc.text(`Date: ${formatDateFrench(dpDate)} - ${dpPlongee.charAt(0).toUpperCase() + dpPlongee.slice(1)}`, margin, 42);
    doc.text(`Lieu: ${dpLieu}`, margin, 49);
    
    // Remettre la couleur de texte normale
    doc.setTextColor(0, 0, 0);
    yPosition = 60;
    
    // RÉSUMÉ
    addText("RÉSUMÉ", 16, true);
    addText(`Total plongeurs: ${totalPlongeurs}`, 12);
    addText(`Nombre de palanquées: ${palanqueesLocal.length}`, 12);
    addText(`Plongeurs non assignés: ${plongeursLocal.length}`, 12);
    addText(`Alertes: ${alertesTotal.length}`, 12);
    
    yPosition += 10;
    
    // ALERTES (si présentes)
    if (alertesTotal.length > 0) {
      addText("⚠️ ALERTES", 16, true);
      alertesTotal.forEach(alerte => {
        addText(`• ${alerte}`, 11);
      });
      yPosition += 10;
    }
    
    // PALANQUÉES
    addText("🏊‍♂️ PALANQUÉES", 16, true);
    
    if (palanqueesLocal.length === 0) {
      addText("Aucune palanquée créée.", 12);
    } else {
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          addText(`Palanquée ${i + 1} (${pal.length} plongeur${pal.length > 1 ? 's' : ''})`, 14, true);
          
          if (pal.length === 0) {
            addText("  Aucun plongeur assigné", 11);
          } else {
            pal.forEach(p => {
              if (p && p.nom) {
                const preText = p.pre ? ` - ${p.pre}` : '';
                addText(`  • ${p.nom} (${p.niveau || 'N?'})${preText}`, 11);
              }
            });
          }
          
          // Ajouter les détails de plongée si disponibles
          const details = [];
          if (pal.horaire) details.push(`Horaire: ${pal.horaire}`);
          if (pal.profondeurPrevue) details.push(`Prof. prévue: ${pal.profondeurPrevue}m`);
          if (pal.dureePrevue) details.push(`Durée prévue: ${pal.dureePrevue}min`);
          if (pal.profondeurRealisee) details.push(`Prof. réalisée: ${pal.profondeurRealisee}m`);
          if (pal.dureeRealisee) details.push(`Durée réalisée: ${pal.dureeRealisee}min`);
          if (pal.paliers) details.push(`Paliers: ${pal.paliers}`);
          
          if (details.length > 0) {
            addText(`  Détails: ${details.join(' | ')}`, 10);
          }
          
          yPosition += 5;
        }
      });
    }
    
    // PLONGEURS EN ATTENTE
    if (plongeursLocal.length > 0) {
      yPosition += 10;
      addText("⏳ PLONGEURS EN ATTENTE", 16, true);
      plongeursLocal.forEach(p => {
        if (p && p.nom) {
          const preText = p.pre ? ` - ${p.pre}` : '';
          addText(`• ${p.nom} (${p.niveau || 'N?'})${preText}`, 11);
        }
      });
    }
    
    // PIED DE PAGE
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i}/${pageCount} - Généré le ${new Date().toLocaleString('fr-FR')} - JSAS v2.5.0`, 
                margin, pageHeight - 10);
    }
    
    // Sauvegarder le PDF
    const fileName = `palanquees-${dpDate || 'export'}-${dpPlongee}.pdf`;
    doc.save(fileName);
    
    console.log("✅ PDF exporté avec succès:", fileName);
    
    // Notification
    if (typeof showNotification === 'function') {
      showNotification("📄 PDF téléchargé avec succès !", "success");
    }
    
  } catch (error) {
    console.error("⌫ Erreur export PDF:", error);
    
    // Mode fallback : utiliser l'aperçu et l'impression
    alert("Erreur lors de la génération du PDF.\n\nUtilisation du mode d'impression alternatif...");
    
    try {
      generatePDFPreview();
      setTimeout(() => {
        if (confirm("Voulez-vous imprimer la page d'aperçu ?\n\n(Vous pouvez ensuite 'Enregistrer au format PDF' dans les options d'impression)")) {
          window.print();
        }
      }, 1000);
    } catch (fallbackError) {
      console.error("⌫ Erreur mode fallback:", fallbackError);
      alert("Impossible de générer le PDF. Vérifiez que la bibliothèque jsPDF est chargée.");
    }
  }
}

// Version alternative simple pour l'impression
function exportToPDFSimple() {
  console.log("📄 Export PDF simple (impression)...");
  
  try {
    // Générer l'aperçu
    generatePDFPreview();
    
    // Attendre que l'aperçu se charge, puis proposer l'impression
    setTimeout(() => {
      if (confirm("📄 Export PDF\n\nLe document va s'ouvrir pour impression.\n\nChoisissez 'Enregistrer au format PDF' dans les options d'impression.\n\nContinuer ?")) {
        
        // Ouvrir l'aperçu dans une nouvelle fenêtre pour l'impression
        const previewContainer = document.getElementById("previewContainer");
        const pdfPreview = document.getElementById("pdfPreview");
        
        if (pdfPreview && pdfPreview.src) {
          const printWindow = window.open(pdfPreview.src, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
              }, 500);
            };
          } else {
            // Si popup bloqué, utiliser la fenêtre actuelle
            window.print();
          }
        } else {
          window.print();
        }
      }
    }, 1000);
    
  } catch (error) {
    console.error("⌫ Erreur export PDF simple:", error);
    alert("Erreur lors de l'export PDF : " + error.message);
  }
}

console.log("📄 Fonctions PDF exportées chargées");

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