// ===== GESTION DES DP =====
let dpList = [
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
    updateDPDropdown(); // Fallback avec données par défaut
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
    dpSelect.addEventListener("change", (e) => {
      const selectedDP = dpList.find(dp => dp.nom === e.target.value);
      if (selectedDP) {
        dpNom.value = `${selectedDP.nom} (${selectedDP.niveau})`;
        dpNom.setAttribute("data-email", selectedDP.email);
      } else {
        dpNom.value = "";
        dpNom.removeAttribute("data-email");
      }
    });
  }

  // Boutons de gestion
  if (nouveauDPBtn) {
    nouveauDPBtn.addEventListener("click", () => openDPModal());
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
async function saveDPToFirebase() {
  try {
    if (typeof db !== 'undefined' && db) {
      const dpRef = db.collection('configuration').doc('dp-list');
      await dpRef.set({ dpList: dpList, lastUpdate: new Date().toISOString() });
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
async function loadDPFromFirebase() {
  try {
    if (typeof db !== 'undefined' && db) {
      const dpRef = db.collection('configuration').doc('dp-list');
      const doc = await dpRef.get();
      
      if (doc.exists && doc.data().dpList) {
        dpList = doc.data().dpList;
        console.log("✅ DP chargés depuis Firebase");
        return;
      }
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

  const sortedDP = [...dpList].sort((a, b) => a.nom.localeCompare(b.nom));
  
  dpSelect.innerHTML = '<option value="">-- Sélectionner un DP --</option>';
  
  sortedDP.forEach(dp => {
    const option = document.createElement('option');
    option.value = dp.nom;
    option.textContent = `${dp.nom} (${dp.niveau})`;
    dpSelect.appendChild(option);
  });
}

// Ouverture du modal DP
function openDPModal(editIndex = -1) {
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
  const newDP = { nom, niveau, email };

  if (editIndex !== null && editIndex >= 0) {
    // Modification
    dpList[parseInt(editIndex)] = newDP;
    showNotification("✅ DP modifié avec succès", "success");
  } else {
    // Vérifier les doublons
    if (dpList.some(dp => dp.nom === nom || dp.email === email)) {
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

  const dpIndex = dpList.findIndex(dp => dp.nom === dpSelect.value);
  if (dpIndex === -1) return;

  const confirmation = confirm(`⚠️ Supprimer le DP "${dpList[dpIndex].nom}" ?\n\nCette action est irréversible !`);
  
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

  const dpIndex = dpList.findIndex(dp => dp.nom === dpSelect.value);
  if (dpIndex >= 0) {
    openDPModal(dpIndex);
  }
}

// Remise à zéro DP
function handleDPReset() {
  const confirmation = confirm(`⚠️ Remettre à zéro la liste des DP ?\n\nCela supprimera tous les DP personnalisés et restaurera les 10 DP par défaut.\n\nCette action est irréversible !`);
  
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
async function exportToPDF() {
  try {
    console.log("🔄 Début export PDF...");
    
    if (typeof jsPDF === 'undefined') {
      throw new Error("jsPDF non chargé");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Couleurs
    const colors = {
      blueR: 0, blueG: 64, blueB: 128,
      darkR: 51, darkG: 51, darkB: 51,
      lightR: 240, lightG: 248, lightB: 255
    };

    // Marges
    const margin = 15;
    let yPosition = margin;

    // Fonction helper pour ajouter du texte
    function addText(text, x, y, size = 8, style = 'normal', color = 'dark') {
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
    const dpNom = document.getElementById("dp-nom")?.value || "Non renseigné";
    const dateDP = document.getElementById("date-dp")?.value || new Date().toLocaleDateString('fr-FR');
    const lieuDP = document.getElementById("lieu-dp")?.value || "Non renseigné";
    const typePlongee = document.getElementById("type-plongee")?.value || "Exploration";
    
    addText(`DP: ${dpNom}`, margin + 100, 15, 8, 'normal', 'white');
    addText(`Date: ${dateDP}`, margin + 100, 22, 8, 'normal', 'white');
    addText(`Lieu: ${lieuDP}`, margin + 100, 29, 8, 'normal', 'white');
    addText(`Type: ${typePlongee}`, margin + 100, 36, 8, 'normal', 'white');

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
    
    plongeursLocal.forEach(p => {
      stats.niveaux[p.niveau] = (stats.niveaux[p.niveau] || 0) + 1;
    });
    
    let statsText = `Plongeurs: ${stats.totalPlongeurs} | Palanquées: ${stats.totalPalanquees}`;
    Object.keys(stats.niveaux).forEach(niveau => {
      statsText += ` | ${niveau}: ${stats.niveaux[niveau]}`;
    });
    
    addText(statsText, margin + 40, yPosition + 10, 8);
    yPosition += 20;

    // === PALANQUÉES ===
    if (palanqueesLocal.length > 0) {
      addText('PALANQUÉES', margin, yPosition, 10, 'bold', 'blue');
      yPosition += 8;
      
      palanqueesLocal.forEach((palanquee, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = margin;
        }
        
        // En-tête palanquée
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, yPosition - 3, 180, 8, 'F');
        
        addText(`Palanquée ${index + 1}`, margin + 2, yPosition + 2, 9, 'bold');
        addText(`Prof: ${palanquee.profondeur}m | Durée: ${palanquee.duree}min`, margin + 120, yPosition + 2, 8);
        yPosition += 10;
        
        // Plongeurs de la palanquée
        if (palanquee.plongeurs && palanquee.plongeurs.length > 0) {
          palanquee.plongeurs.forEach(plongeurId => {
            const plongeur = plongeursLocal.find(p => p.id === plongeurId);
            if (plongeur) {
              addText(`• ${plongeur.nom} (${plongeur.niveau})`, margin + 5, yPosition, 8);
              if (plongeur.prerogatives) {
                addText(plongeur.prerogatives, margin + 100, yPosition, 7);
              }
              yPosition += 5;
            }
          });
        }
        yPosition += 3;
      });
    }

    // === PIED DE PAGE ===
    const pageHeight = doc.internal.pageSize.height;
    addText(`Généré le ${new Date().toLocaleString('fr-FR')} par JSAS Palanquées`, margin, pageHeight - 10, 7);

    // Sauvegarde
    const fileName = `palanquees-${dateDP.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
    showNotification("✅ PDF généré avec succès", "success");
    console.log("✅ Export PDF terminé");
    
  } catch (error) {
    console.error("🔥 Erreur export PDF:", error);
    showNotification("❌ Erreur lors de la génération du PDF", "error");
  }
}

// ===== APERÇU HTML =====
function previewHTML() {
  try {
    console.log("🔄 Génération aperçu HTML...");
    
    const dpNom = document.getElementById("dp-nom")?.value || "Non renseigné";
    const dateDP = document.getElementById("date-dp")?.value || new Date().toLocaleDateString('fr-FR');
    const lieuDP = document.getElementById("lieu-dp")?.value || "Non renseigné";
    const typePlongee = document.getElementById("type-plongee")?.value || "Exploration";
    
    const plongeursLocal = window.plongeurs || [];
    const palanqueesLocal = window.palanquees || [];
    
    // Tri des plongeurs par grade
    const gradeOrder = { 'GP': 1, 'E4': 2, 'E3': 3, 'E2': 4, 'E1': 5, 'P5': 6, 'P4': 7, 'P3': 8, 'P2': 9, 'P1': 10, 'N4': 11, 'N3': 12, 'N2': 13, 'N1': 14 };
    const plongeursTries = [...plongeursLocal].sort((a, b) => {
      return (gradeOrder[a.niveau] || 99) - (gradeOrder[b.niveau] || 99);
    });
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Palanquées JSAS - ${dateDP}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; background: #f5f5f5; }
          .container { max-width: 210mm; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #004080, #0066cc); color: white; padding: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
          .section { padding: 20px; border-bottom: 1px solid #eee; }
          .section-title { color: #004080; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #004080; padding-bottom: 5px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #004080; }
          .palanquee { background: #f8f9fa; margin: 15px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
          .palanquee-header { font-weight: bold; color: #004080; margin-bottom: 10px; }
          .plongeur-item { margin: 5px 0; padding: 8px; background: white; border-radius: 4px; display: flex; justify-content: space-between; }
          .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
          .alert-success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
          .alert-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
          .alert-danger { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
          .footer { text-align: center; padding: 20px; background: #f8f9fa; font-size: 12px; color: #666; }
          @media print { body { background: white; } .container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1>🤿 Palanquées JSAS</h1>
            <div class="header-info">
              <div><strong>DP:</strong> ${dpNom}</div>
              <div><strong>Date:</strong> ${dateDP}</div>
              <div><strong>Lieu:</strong> ${lieuDP}</div>
              <div><strong>Type:</strong> ${typePlongee}</div>
            </div>
          </header>`;
    
    // Statistiques
    const stats = {
      totalPlongeurs: plongeursLocal.length,
      totalPalanquees: palanqueesLocal.length,
      niveaux: {}
    };
    
    plongeursLocal.forEach(p => {
      stats.niveaux[p.niveau] = (stats.niveaux[p.niveau] || 0) + 1;
    });
    
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Statistiques</h2>';
    htmlContent += '<div class="stats-grid">';
    htmlContent += `<div class="stat-card"><strong>${stats.totalPlongeurs}</strong><br>Plongeurs</div>`;
    htmlContent += `<div class="stat-card"><strong>${stats.totalPalanquees}</strong><br>Palanquées</div>`;
    
    Object.keys(stats.niveaux).forEach(niveau => {
      htmlContent += `<div class="stat-card"><strong>${stats.niveaux[niveau]}</strong><br>${niveau}</div>`;
    });
    htmlContent += '</div></section>';
    
    // Liste des plongeurs triés
    if (plongeursTries.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">👥 Plongeurs (triés par niveau)</h2>';
      plongeursTries.forEach(plongeur => {
        htmlContent += `<div class="plongeur-item">`;
        htmlContent += `<span><strong>${plongeur.nom}</strong> (${plongeur.niveau})</span>`;
        if (plongeur.prerogatives) {
          htmlContent += `<span class="prerogatives">${plongeur.prerogatives}</span>`;
        }
        htmlContent += `</div>`;
      });
      htmlContent += '</section>';
    }
    
    // Palanquées
    if (palanqueesLocal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">🤿 Palanquées</h2>';
      
      palanqueesLocal.forEach((palanquee, index) => {
        htmlContent += `<div class="palanquee">`;
        htmlContent += `<div class="palanquee-header">Palanquée ${index + 1} - ${palanquee.profondeur}m / ${palanquee.duree}min</div>`;
        
        if (palanquee.plongeurs && palanquee.plongeurs.length > 0) {
          palanquee.plongeurs.forEach(plongeurId => {
            const plongeur = plongeursLocal.find(p => p.id === plongeurId);
            if (plongeur) {
              htmlContent += `<div class="plongeur-item">`;
              htmlContent += `<span>${plongeur.nom} (${plongeur.niveau})</span>`;
              if (plongeur.prerogatives) {
                htmlContent += `<span>${plongeur.prerogatives}</span>`;
              }
              htmlContent += `</div>`;
            }
          });
        } else {
          htmlContent += '<div class="alert alert-warning">⚠️ Aucun plongeur assigné</div>';
        }
        htmlContent += '</div>';
      });
      htmlContent += '</section>';
    }
    
    htmlContent += `
          <footer class="footer">
            Généré le ${new Date().toLocaleString('fr-FR')} par JSAS Palanquées
          </footer>
        </div>
      </body>
      </html>`;
    
    // Ouvrir dans nouvelle fenêtre
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    
    showNotification("✅ Aperçu HTML généré", "success");
    console.log("✅ Aperçu HTML terminé");
    
  } catch (error) {
    console.error("🔥 Erreur aperçu HTML:", error);
    showNotification("❌ Erreur lors de la génération de l'aperçu", "error");
  }
}

// ===== VALIDATION DE SESSION =====
async function validerSession() {
  try {
    console.log("🔄 Validation de session...");
    
    // Récupération des données
    const dpNom = document.getElementById("dp-nom")?.value?.trim();
    const dateDP = document.getElementById("date-dp")?.value;
    const lieuDP = document.getElementById("lieu-dp")?.value?.trim();
    const typePlongee = document.getElementById("type-plongee")?.value;
    
    // Validation des champs obligatoires
    const erreurs = [];
    if (!dpNom || dpNom === "" || dpNom === "Non renseigné") erreurs.push("Directeur de Plongée");
    if (!dateDP) erreurs.push("Date");
    if (!lieuDP || lieuDP === "" || lieuDP === "Non renseigné") erreurs.push("Lieu");
    if (!typePlongee) erreurs.push("Type de plongée");
    
    if (erreurs.length > 0) {
      showNotification(`❌ Champs obligatoires manquants: ${erreurs.join(', ')}`, "error");
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
        email: document.getElementById("dp-nom")?.getAttribute("data-email") || "",
        date: dateDP,
        // main-complete.js - Application principale compatible avec le HTML corrigé

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
function showAuthError(message, details = '') {
  const errorContainer = document.getElementById("auth-error");
  if (errorContainer) {
    errorContainer.innerHTML = `<strong>Erreur:</strong> ${message}${details ? '<br><small>' + details + '</small>' : ''}`;
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 8000);
  }
  console.error("🔥 Erreur Auth:", message, details);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    border-radius: 5px;
    z-index: 10000;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// ===== GESTION DES DP =====
let dpList = [
  { nom: "AGUIRRE Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com" },
  { nom: "AUBARD Corinne", niveau: "P5", email: "aubard.c@gmail.com" },
  { nom: "BEST Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelle