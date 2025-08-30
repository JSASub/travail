// pdf-manager.js - Gestion complète des PDF (extrait de main-complete.js)

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
    
    // MODIFICATION : Constantes pour l'espacement RÉDUIT
    const spacing = {
      lineHeight: 6,
      sectionGap: 8, // RÉDUIT de 12 à 8
      subsectionGap: 6, // RÉDUIT de 8 à 6
      headerHeight: 60,
      footerHeight: 25,
      palanqueeGap: 6 // NOUVEAU : espacement spécifique entre palanquées
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
        doc.setFontSize(7); // RÉDUIT de 8 à 7 pour header pages 2+
        doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
        doc.text("Palanquées JSAS - " + dpDate + " (" + dpPlongee + ")", margin, 10); // RÉDUIT de 12 à 10
        doc.text("Page " + doc.internal.getCurrentPageInfo().pageNumber, pageWidth - margin - 20, 10); // RÉDUIT de 12 à 10
        yPosition = 15; // RÉDUIT de 18 à 15
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
    
    yPosition += 3; // AJOUT de 3mm d'espacement avant le titre
    addText('Organisation des Palanquées', margin, yPosition, 14, 'bold', 'primary');
    yPosition += 3; // RÉDUIT de 6 à 3 (descendre de 3mm)
    
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
        
        // MODIFICATION : Calculer la hauteur nécessaire pour cette palanquée (ENCORE PLUS RÉDUITE)
        let palanqueeHeight = 12; // Header RÉDUIT de 14 à 12
        palanqueeHeight += (pal.length * spacing.lineHeight) + 3; // Plongeurs + espacement réduit
        palanqueeHeight += 26; // Paramètres RÉDUIT de 30 à 26
        palanqueeHeight += spacing.palanqueeGap; // NOUVEAU : espacement spécifique entre palanquées
        
        checkPageBreak(palanqueeHeight + 10);
        
        const isAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
        
        // En-tête de palanquée ULTRA RÉDUIT
        if (isAlert) {
          doc.setFillColor(colors.dangerR, colors.dangerG, colors.dangerB);
        } else {
          doc.setFillColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
        }
        doc.rect(margin, yPosition, contentWidth, 7, 'F'); // Hauteur RÉDUITE de 8 à 7
        
        addText('Palanquée ' + (i + 1) + ' - ' + pal.length + ' plongeurs', margin + 5, yPosition + 5, 12, 'bold', 'white'); // Position Y ajustée
        
        const gps = pal.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p && p.niveau === "N1");
        const autonomes = pal.filter(p => p && ["N2", "N3"].includes(p.niveau));
        
        addText('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 5, 10, 'normal', 'white'); // Position Y ajustée
        
        yPosition += 12; // RÉDUIT : Espacement entre cadre bleu et premier plongeur
        
        // Liste des plongeurs (triés par niveau)
        if (pal.length === 0) {
          addText('Aucun plongeur assigné', margin + 10, yPosition, 11, 'normal', 'gray');
          yPosition += spacing.lineHeight + 3; // Espacement réduit pour cohérence
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
          yPosition += 3; // RÉDUIT : Espacement entre dernier plongeur et paramètres
        }
        
        // MODIFICATION : Paramètres de plongée (TAILLE ET ESPACEMENT RÉDUITS)
        
        // Ligne 1: Horaire de mise à l'eau
        addText('Horaire mise à l\'eau:', margin + 5, yPosition, 9, 'bold', 'primary'); // RÉDUIT de 10 à 9
        
        if (pal.horaire && pal.horaire.trim()) {
          addText(pal.horaire, margin + 50, yPosition, 9, 'normal'); // RÉDUIT à 9
          addText('Correction: ', margin + 80, yPosition, 8, 'bold', 'gray'); // RÉDUIT à 8
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 105, yPosition, margin + 140, yPosition);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 50, yPosition, margin + 85, yPosition);
          addText('(HH:MM)', margin + 88, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        yPosition += 3.5; // RÉDUIT de 4 à 3.5
        
        // Ligne 2: Profondeurs et durées prévues
        addText('Prof. prévue: ', margin + 5, yPosition, 9, 'bold', 'primary'); // RÉDUIT à 9
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          addText(pal.profondeurPrevue + ' m', margin + 35, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 35, yPosition, margin + 55, yPosition);
          addText('m', margin + 57, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        
        addText('Durée prévue:', margin + 80, yPosition, 9, 'bold', 'primary'); // RÉDUIT à 9
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          addText(pal.dureePrevue + ' min', margin + 115, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 115, yPosition, margin + 140, yPosition);
          addText('min', margin + 142, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        yPosition += 3.5; // RÉDUIT de 4 à 3.5
        
        // Ligne 3: Profondeurs et durées réalisées
        addText('Prof. réalisée:', margin + 5, yPosition, 9, 'bold', 'success'); // RÉDUIT à 9
        if (pal.profondeurRealisee && pal.profondeurRealisee.trim()) {
          addText(pal.profondeurRealisee + ' m', margin + 40, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 40, yPosition, margin + 60, yPosition);
          addText('m', margin + 62, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        
        addText('Durée réalisée:', margin + 80, yPosition, 9, 'bold', 'success'); // RÉDUIT à 9
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          addText(pal.dureeRealisee + ' min', margin + 120, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 120, yPosition, margin + 145, yPosition);
          addText('min', margin + 147, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        yPosition += 3.5; // RÉDUIT de 4 à 3.5
        
        // Ligne 4: Paliers
        addText('Paliers:', margin + 5, yPosition, 9, 'bold', 'primary'); // RÉDUIT à 9
        
        if (pal.paliers && pal.paliers.trim()) {
          addText(pal.paliers, margin + 25, yPosition, 8, 'normal'); // RÉDUIT à 8
          // Correction rapprochée
          addText('Correction:', margin + 70, yPosition, 8, 'bold', 'gray'); // RÉDUIT à 8
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 95, yPosition, margin + 140, yPosition);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 25, yPosition, margin + 65, yPosition);
          addText('(ex: 3 min à 3 m) | Correction:', margin + 70, yPosition, 8, 'normal', 'gray'); // RÉDUIT à 8
          doc.line(margin + 130, yPosition, margin + 150, yPosition);
        }
        
        // MODIFICATION MAJEURE : Espacement réduit entre palanquées
        yPosition += spacing.lineHeight + spacing.palanqueeGap; // Utilise le nouvel espacement spécifique
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
    
    // === FOOTER REORGANISÉ ===
    const totalPages = doc.internal.getCurrentPageInfo().pageNumber;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      
      doc.setDrawColor(colors.grayR, colors.grayG, colors.grayB);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      
      // Date et heure à gauche
      addText(new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}), margin, pageHeight - 6, 6, 'normal', 'gray');
      
      // Numérotation à droite
      addText('Page ' + pageNum + '/' + totalPages, pageWidth - margin - 25, pageHeight - 6, 6, 'normal', 'gray');
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '-compact.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF généré avec espacement réduit:", fileName);
    
    const alertesText = alertesTotal.length > 0 ? '\n⚠️ ' + alertesTotal.length + ' alerte(s) détectée(s)' : '\n✅ Aucune alerte';
    alert('PDF généré avec succès !\n\n📊 ' + totalPlongeurs + ' plongeurs dans ' + palanqueesLocal.length + ' palanquées' + alertesText + '\n\n📁 Fichier: ' + fileName);
    
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF : " + error.message + "\n\nVérifiez que jsPDF est bien chargé.");
  }
}

// ===== GÉNÉRATION PDF PREVIEW SÉCURISÉE =====
// REMPLACEZ votre fonction savePreviewDirectToPDF() par cette version avec tri
function savePreviewDirectToPDF() {
  console.log("💾 Sauvegarde du preview en PDF...");
  
  // Vérifications étendues pour jsPDF
  console.log("🔍 Vérification jsPDF...");
  console.log("- window.jspdf:", typeof window.jspdf);
  console.log("- window.jsPDF:", typeof window.jsPDF);
  console.log("- window.jspdf?.jsPDF:", typeof window.jspdf?.jsPDF);
  
  let jsPDF_class = null;
  
  // Essayer différentes façons d'accéder à jsPDF
  if (window.jspdf && window.jspdf.jsPDF) {
    jsPDF_class = window.jspdf.jsPDF;
    console.log("✅ jsPDF trouvé via window.jspdf.jsPDF");
  } else if (window.jsPDF) {
    jsPDF_class = window.jsPDF;
    console.log("✅ jsPDF trouvé via window.jsPDF");
  } else if (typeof jsPDF !== 'undefined') {
    jsPDF_class = jsPDF;
    console.log("✅ jsPDF trouvé via variable globale jsPDF");
  } else {
    console.error("❌ jsPDF non trouvé - Tentative de chargement...");
    
    // Essayer de charger jsPDF dynamiquement
    loadJsPDFDynamically().then(() => {
      console.log("🔄 Retry après chargement...");
      savePreviewDirectToPDF(); // Réessayer après chargement
    }).catch(error => {
      console.error("❌ Impossible de charger jsPDF:", error);
      alert("Erreur: Impossible de charger jsPDF.\n\nVérifiez que la bibliothèque jsPDF est incluse dans votre page HTML:\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>");
    });
    return;
  }
  
  try {
    // Récupérer les données actuelles
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // Utiliser les variables globales si disponibles
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    console.log(`📊 Données récupérées: ${plongeursLocal.length} plongeurs, ${palanqueesLocal.length} palanquées`);
    
    // Fonction de tri par grade (identique au preview)
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
    
    // Créer le PDF
    const doc = new jsPDF_class({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    console.log("✅ Document PDF créé");
    
    const colors = {
      primaryR: 0, primaryG: 64, primaryB: 128,
      secondaryR: 0, secondaryG: 123, secondaryB: 255,
      darkR: 52, darkG: 58, darkB: 64
    };
    
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Palanquées JSAS - Preview", margin, 20);
    
    doc.setFontSize(10);
    doc.text(`DP: ${dpNom}`, margin, 30);
    doc.text(`Date: ${dpDate} - ${dpPlongee}`, margin, 37);
    doc.text(`Lieu: ${dpLieu}`, margin, 44);
    
    yPos = 65;
    
    // Statistiques
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    
    doc.setFontSize(14);
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.text("RÉSUMÉ", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.text(`Total plongeurs: ${totalPlongeurs}`, margin, yPos);
    yPos += 6;
    doc.text(`Palanquées: ${palanqueesLocal.length}`, margin, yPos);
    yPos += 15;
    
    // Palanquées avec tri
    if (palanqueesLocal.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PALANQUÉES", margin, yPos);
      yPos += 10;
      
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
          doc.text(`Palanquée ${i + 1} (${pal.length} plongeurs)`, margin, yPos);
          yPos += 8;
          
          if (pal.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
            
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
                doc.text(line, margin + 5, yPos);
                yPos += 4;
              }
            });
          } else {
            doc.setFontSize(9);
            doc.setTextColor(128, 128, 128);
            doc.text("Aucun plongeur assigné", margin + 5, yPos);
            yPos += 4;
          }
          yPos += 6;
        }
      });
    }
    
    // Plongeurs en attente avec tri
    if (plongeursLocal.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PLONGEURS EN ATTENTE", margin, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      
      const plongeursEnAttenteTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursEnAttenteTriés.forEach(p => {
        if (p && p.nom) {
          const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
          doc.text(line, margin + 5, yPos);
          yPos += 4;
        }
      });
    }
    
    // Sauvegarder
    const fileName = `palanquees-preview-${dpDate || 'export'}-${dpPlongee}.pdf`;
    doc.save(fileName);
    
    console.log("✅ PDF du preview sauvegardé avec tri:", fileName);
    alert(`PDF du preview sauvegardé avec succès !\n📄 ${fileName}\n\n✅ Plongeurs triés par niveau`);
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde PDF:", error);
    alert("Erreur lors de la sauvegarde PDF: " + error.message + "\n\nDétails dans la console (F12)");
  }
}

// 2. Fonction pour charger jsPDF dynamiquement
function loadJsPDFDynamically() {
  return new Promise((resolve, reject) => {
    console.log("📥 Chargement dynamique de jsPDF...");
    
    // Vérifier si déjà chargé
    if (window.jspdf || window.jsPDF || typeof jsPDF !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      console.log("✅ jsPDF chargé dynamiquement");
      // Attendre un peu pour que la bibliothèque s'initialise
      setTimeout(resolve, 100);
    };
    script.onerror = () => {
      reject(new Error("Échec du chargement de jsPDF"));
    };
    document.head.appendChild(script);
  });
}

// 3. Fonction de diagnostic jsPDF
function diagnoseJsPDF() {
  console.log("🔍 === DIAGNOSTIC jsPDF ===");
  console.log("window.jspdf:", typeof window.jspdf);
  console.log("window.jsPDF:", typeof window.jsPDF);
  console.log("jsPDF (global):", typeof jsPDF);
  console.log("window.jspdf?.jsPDF:", typeof window.jspdf?.jsPDF);
  
  // Vérifier les scripts chargés
  const scripts = Array.from(document.scripts).map(s => s.src).filter(src => src.includes('jspdf'));
  console.log("Scripts jsPDF trouvés:", scripts);
  
  let result = "🔍 DIAGNOSTIC jsPDF:\n\n";
  result += `• window.jspdf: ${typeof window.jspdf}\n`;
  result += `• window.jsPDF: ${typeof window.jsPDF}\n`;
  result += `• jsPDF global: ${typeof jsPDF}\n`;
  result += `• Scripts trouvés: ${scripts.length}\n`;
  
  if (scripts.length > 0) {
    result += `• URL: ${scripts[0]}\n`;
  } else {
    result += "❌ Aucun script jsPDF détecté!\n\nAjoutez dans votre HTML:\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>";
  }
  
  alert(result);
  
  return {
    hasJsPDF: !!(window.jspdf || window.jsPDF || (typeof jsPDF !== 'undefined')),
    scripts: scripts
  };
}

// Export des fonctions
window.savePreviewDirectToPDF = savePreviewDirectToPDF;
window.loadJsPDFDynamically = loadJsPDFDynamically;
window.diagnoseJsPDF = diagnoseJsPDF;

console.log("🔧 Module jsPDF amélioré chargé avec diagnostic");

//
  console.log("💾 Sauvegarde du preview en PDF...");
  
  // Vérifier que jsPDF est disponible
  if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
    alert("Erreur: jsPDF non disponible");
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    
    // Récupérer les données actuelles
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // Utiliser les variables globales si disponibles
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    // AJOUT : Fonction de tri par grade (identique au preview)
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
          // Si même niveau, trier par nom
          return a.nom.localeCompare(b.nom);
        }
        
        return ordreA - ordreB;
      });
    }
    
    // Créer un nouveau PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const colors = {
      primaryR: 0, primaryG: 64, primaryB: 128,
      secondaryR: 0, secondaryG: 123, secondaryB: 255,
      darkR: 52, darkG: 58, darkB: 64
    };
    
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête simplifié
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Palanquées JSAS - Preview", margin, 20);
    
    doc.setFontSize(10);
    doc.text(`DP: ${dpNom}`, margin, 30);
    doc.text(`Date: ${dpDate} - ${dpPlongee}`, margin, 37);
    doc.text(`Lieu: ${dpLieu}`, margin, 44);
    
    yPos = 65;
    
    // Statistiques
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    
    doc.setFontSize(14);
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.text("RÉSUMÉ", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.text(`Total plongeurs: ${totalPlongeurs}`, margin, yPos);
    yPos += 6;
    doc.text(`Palanquées: ${palanqueesLocal.length}`, margin, yPos);
    yPos += 15;
    
    // Palanquées AVEC TRI
    if (palanqueesLocal.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PALANQUÉES", margin, yPos);
      yPos += 10;
      
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
          doc.text(`Palanquée ${i + 1} (${pal.length} plongeurs)`, margin, yPos);
          yPos += 8;
          
          if (pal.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
            
            // ✅ AJOUT DU TRI ICI
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
                doc.text(line, margin + 5, yPos);
                yPos += 4;
              }
            });
          } else {
            doc.setFontSize(9);
            doc.setTextColor(128, 128, 128);
            doc.text("Aucun plongeur assigné", margin + 5, yPos);
            yPos += 4;
          }
          yPos += 6;
        }
      });
    }
    
    // Plongeurs en attente AVEC TRI
    if (plongeursLocal.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PLONGEURS EN ATTENTE", margin, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      
      // ✅ AJOUT DU TRI ICI AUSSI
      const plongeursEnAttenteTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursEnAttenteTriés.forEach(p => {
        if (p && p.nom) {
          const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
          doc.text(line, margin + 5, yPos);
          yPos += 4;
        }
      });
    }
    
    // Sauvegarder
    const fileName = `palanquees-preview-${dpDate || 'export'}-${dpPlongee}.pdf`;
    doc.save(fileName);
    
    console.log("✅ PDF du preview sauvegardé avec tri:", fileName);
    alert(`PDF du preview sauvegardé avec succès !\n📄 ${fileName}\n\n✅ Plongeurs triés par niveau`);
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde PDF:", error);
    alert("Erreur lors de la sauvegarde PDF: " + error.message);
  }
}

function savePreviewDirectToPDF() {
  console.log("💾 Sauvegarde du preview en PDF...");
  
  // Vérifications étendues pour jsPDF
  console.log("🔍 Vérification jsPDF...");
  console.log("- window.jspdf:", typeof window.jspdf);
  console.log("- window.jsPDF:", typeof window.jsPDF);
  console.log("- window.jspdf?.jsPDF:", typeof window.jspdf?.jsPDF);
  
  let jsPDF_class = null;
  
  // Essayer différentes façons d'accéder à jsPDF
  if (window.jspdf && window.jspdf.jsPDF) {
    jsPDF_class = window.jspdf.jsPDF;
    console.log("✅ jsPDF trouvé via window.jspdf.jsPDF");
  } else if (window.jsPDF) {
    jsPDF_class = window.jsPDF;
    console.log("✅ jsPDF trouvé via window.jsPDF");
  } else if (typeof jsPDF !== 'undefined') {
    jsPDF_class = jsPDF;
    console.log("✅ jsPDF trouvé via variable globale jsPDF");
  } else {
    console.error("❌ jsPDF non trouvé - Tentative de chargement...");
    
    // Essayer de charger jsPDF dynamiquement
    loadJsPDFDynamically().then(() => {
      console.log("🔄 Retry après chargement...");
      savePreviewDirectToPDF(); // Réessayer après chargement
    }).catch(error => {
      console.error("❌ Impossible de charger jsPDF:", error);
      alert("Erreur: Impossible de charger jsPDF.\n\nVérifiez que la bibliothèque jsPDF est incluse dans votre page HTML:\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>");
    });
    return;
  }
  
  try {
    // Récupérer les données actuelles
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // Utiliser les variables globales si disponibles
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    console.log(`📊 Données récupérées: ${plongeursLocal.length} plongeurs, ${palanqueesLocal.length} palanquées`);
    
    // Fonction de tri par grade (identique au preview)
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
    
    // Créer le PDF
    const doc = new jsPDF_class({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    console.log("✅ Document PDF créé");
    
    const colors = {
      primaryR: 0, primaryG: 64, primaryB: 128,
      secondaryR: 0, secondaryG: 123, secondaryB: 255,
      darkR: 52, darkG: 58, darkB: 64
    };
    
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Palanquées JSAS - Preview", margin, 20);
    
    doc.setFontSize(10);
    doc.text(`DP: ${dpNom}`, margin, 30);
    doc.text(`Date: ${dpDate} - ${dpPlongee}`, margin, 37);
    doc.text(`Lieu: ${dpLieu}`, margin, 44);
    
    yPos = 65;
    
    // Statistiques
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    
    doc.setFontSize(14);
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.text("RÉSUMÉ", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.text(`Total plongeurs: ${totalPlongeurs}`, margin, yPos);
    yPos += 6;
    doc.text(`Palanquées: ${palanqueesLocal.length}`, margin, yPos);
    yPos += 15;
    
    // Palanquées avec tri
    if (palanqueesLocal.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PALANQUÉES", margin, yPos);
      yPos += 10;
      
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
          doc.text(`Palanquée ${i + 1} (${pal.length} plongeurs)`, margin, yPos);
          yPos += 8;
          
          if (pal.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
            
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
                doc.text(line, margin + 5, yPos);
                yPos += 4;
              }
            });
          } else {
            doc.setFontSize(9);
            doc.setTextColor(128, 128, 128);
            doc.text("Aucun plongeur assigné", margin + 5, yPos);
            yPos += 4;
          }
          yPos += 6;
        }
      });
    }
    
    // Plongeurs en attente avec tri
    if (plongeursLocal.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PLONGEURS EN ATTENTE", margin, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      
      const plongeursEnAttenteTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursEnAttenteTriés.forEach(p => {
        if (p && p.nom) {
          const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
          doc.text(line, margin + 5, yPos);
          yPos += 4;
        }
      });
    }
    
    // Sauvegarder
    const fileName = `palanquees-preview-${dpDate || 'export'}-${dpPlongee}.pdf`;
    doc.save(fileName);
    
    console.log("✅ PDF du preview sauvegardé avec tri:", fileName);
    alert(`PDF du preview sauvegardé avec succès !\n📄 ${fileName}\n\n✅ Plongeurs triés par niveau`);
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde PDF:", error);
    alert("Erreur lors de la sauvegarde PDF: " + error.message + "\n\nDétails dans la console (F12)");
  }
}

// 2. Fonction pour charger jsPDF dynamiquement
function loadJsPDFDynamically() {
  return new Promise((resolve, reject) => {
    console.log("📥 Chargement dynamique de jsPDF...");
    
    // Vérifier si déjà chargé
    if (window.jspdf || window.jsPDF || typeof jsPDF !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      console.log("✅ jsPDF chargé dynamiquement");
      // Attendre un peu pour que la bibliothèque s'initialise
      setTimeout(resolve, 100);
    };
    script.onerror = () => {
      reject(new Error("Échec du chargement de jsPDF"));
    };
    document.head.appendChild(script);
  });
}

// 3. Fonction de diagnostic jsPDF
function diagnoseJsPDF() {
  console.log("🔍 === DIAGNOSTIC jsPDF ===");
  console.log("window.jspdf:", typeof window.jspdf);
  console.log("window.jsPDF:", typeof window.jsPDF);
  console.log("jsPDF (global):", typeof jsPDF);
  console.log("window.jspdf?.jsPDF:", typeof window.jspdf?.jsPDF);
  
  // Vérifier les scripts chargés
  const scripts = Array.from(document.scripts).map(s => s.src).filter(src => src.includes('jspdf'));
  console.log("Scripts jsPDF trouvés:", scripts);
  
  let result = "🔍 DIAGNOSTIC jsPDF:\n\n";
  result += `• window.jspdf: ${typeof window.jspdf}\n`;
  result += `• window.jsPDF: ${typeof window.jsPDF}\n`;
  result += `• jsPDF global: ${typeof jsPDF}\n`;
  result += `• Scripts trouvés: ${scripts.length}\n`;
  
  if (scripts.length > 0) {
    result += `• URL: ${scripts[0]}\n`;
  } else {
    result += "❌ Aucun script jsPDF détecté!\n\nAjoutez dans votre HTML:\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>";
  }
  
  alert(result);
  
  return {
    hasJsPDF: !!(window.jspdf || window.jsPDF || (typeof jsPDF !== 'undefined')),
    scripts: scripts
  };
}

// Export des fonctions
window.savePreviewDirectToPDF = savePreviewDirectToPDF;
window.loadJsPDFDynamically = loadJsPDFDynamically;
window.diagnoseJsPDF = diagnoseJsPDF;

console.log("🔧 Module jsPDF amélioré chargé avec diagnostic");

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

// Export des fonctions pour usage global
window.exportToPDF = exportToPDF;
window.generatePDFPreview = generatePDFPreview;
window.closePDFPreview = closePDFPreview;

console.log("📄 Module PDF Manager chargé - Toutes fonctionnalités PDF disponibles");