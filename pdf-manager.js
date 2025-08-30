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
    
    // NOUVEAU: Fonction de tri par grade pour l'aperçu
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
          position: relative;
        }
        
        /* === BARRE D'ACTION EN HAUT === */
        .action-bar {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1000;
        }
        
        .action-button {
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .close-button {
          background: #dc3545;
          color: white;
        }
        
        .download-button {
          background: #28a745;
          color: white;
        }
        
        .print-button {
          background: #007bff;
          color: white;
        }
        
        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        
        .close-button:hover { background: #c82333; }
        .download-button:hover { background: #218838; }
        .print-button:hover { background: #0056b3; }
        
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
        
        /* Responsive Design pour Mobile */
        @media screen and (max-width: 768px) {
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .action-bar {
            position: relative !important;
            top: auto !important;
            right: auto !important;
            justify-content: center !important;
            padding: 15px !important;
            background: rgba(255,255,255,0.9) !important;
            backdrop-filter: blur(10px) !important;
          }
          .action-button {
            padding: 10px 12px !important;
            font-size: 12px !important;
          }
          .header {
            padding: 15px !important;
          }
          .main-title {
            font-size: 20px !important;
            letter-spacing: 1px !important;
          }
          .content {
            padding: 15px !important;
          }
          .section {
            margin-bottom: 25px !important;
          }
          .section-title {
            font-size: 16px !important;
            margin-bottom: 15px !important;
          }
          .palanquee-box {
            margin: 15px 0 !important;
            padding: 15px !important;
          }
          .palanquee-title {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }
          .plongeur-item {
            padding: 10px 8px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .plongeur-nom {
            font-size: 14px !important;
          }
          .plongeur-niveau {
            font-size: 11px !important;
            padding: 3px 6px !important;
          }
          .plongeur-prerogatives {
            font-size: 10px !important;
          }
        }
        
        @media screen and (max-width: 480px) {
          .header {
            padding: 10px !important;
          }
          .main-title {
            font-size: 18px !important;
          }
          .content {
            padding: 10px !important;
          }
          .section-title {
            font-size: 14px !important;
          }
          .palanquee-title {
            font-size: 14px !important;
          }
          .action-button {
            padding: 8px 10px !important;
            font-size: 11px !important;
          }
        }
        
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
          .action-bar { display: none !important; }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    // === BARRE D'ACTIONS EN HAUT ===
    htmlContent += '<div class="action-bar">';
    htmlContent += '<button class="action-button download-button" onclick="parent.downloadPDFFromPreview()" title="Télécharger le PDF">';
    htmlContent += '<span>📄</span> Télécharger PDF';
    htmlContent += '</button>';
    htmlContent += '<button class="action-button print-button" onclick="window.print()" title="Imprimer">';
    htmlContent += '<span>🖨️</span> Imprimer';
    htmlContent += '</button>';
    htmlContent += '<button class="action-button close-button" onclick="parent.closePDFPreview()" title="Fermer l\'aperçu">';
    htmlContent += '<span>✕</span> Fermer';
    htmlContent += '</button>';
    htmlContent += '</div>';
    
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
            // MODIFICATION: Trier les plongeurs par grade avant affichage
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
      
      // MODIFICATION: Trier aussi les plongeurs en attente par grade
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
    
    const previewContainer = document.getElementById("previewContainer");
    const pdfPreview = document.getElementById("pdfPreview");
    
    if (previewContainer && pdfPreview) {
      previewContainer.style.display = "block";
      pdfPreview.src = url;
      
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF généré avec boutons Download/Print et tri par grade");
      setTimeout(() => URL.createObjectURL(url), 30000);
      
    } else {
      console.error("❌ Éléments d'aperçu non trouvés");
      alert("Erreur: impossible d'afficher l'aperçu PDF");
    }
    
  } catch (error) {
    console.error("❌ Erreur génération aperçu PDF:", error);
    alert("Erreur lors de la génération de l'aperçu: " + error.message);
  }
}

// ===== NOUVELLE FONCTION : TÉLÉCHARGER PDF DEPUIS LA PREVIEW =====
function downloadPDFFromPreview() {
  console.log("📄 Téléchargement du PDF depuis l'aperçu HTML...");
  
  try {
    // ÉTAPE 1: Vérifier les bibliothèques disponibles
    console.log("🔍 Vérification des bibliothèques...");
    console.log("html2pdf disponible:", typeof html2pdf !== 'undefined');
    console.log("html2canvas disponible:", typeof html2canvas !== 'undefined');
    console.log("jsPDF disponible:", typeof window.jspdf !== 'undefined');
    
    // ÉTAPE 2: Récupérer les données
    console.log("📊 Récupération des données...");
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    console.log("Plongeurs:", plongeursLocal.length);
    console.log("Palanquées:", palanqueesLocal.length);
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
    // ÉTAPE 3: Créer le contenu HTML simple
    console.log("🏗️ Création du contenu HTML...");
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.color = '#333';
    tempDiv.style.padding = '20px';
    
    // Contenu HTML simplifié pour le PDF
    let htmlContent = '<div style="background: white; padding: 20px; font-family: Arial, sans-serif;">';
    
    // En-tête
    htmlContent += '<div style="background: #004080; color: white; padding: 20px; margin-bottom: 20px;">';
    htmlContent += '<h1 style="margin: 0; font-size: 24px;">Palanquées JSAS - Fiche de Sécurité</h1>';
    htmlContent += '<p style="margin: 5px 0;">DP: ' + dpNom + '</p>';
    htmlContent += '<p style="margin: 5px 0;">Date: ' + dpDate + ' - ' + dpPlongee + '</p>';
    htmlContent += '<p style="margin: 5px 0;">Lieu: ' + dpLieu + '</p>';
    htmlContent += '</div>';
    
    // Résumé
    htmlContent += '<div style="margin-bottom: 30px;">';
    htmlContent += '<h2 style="color: #004080; border-bottom: 2px solid #007bff; padding-bottom: 5px;">📊 Résumé</h2>';
    htmlContent += '<p>Total plongeurs: ' + totalPlongeurs + '</p>';
    htmlContent += '<p>Palanquées: ' + palanqueesLocal.length + '</p>';
    htmlContent += '<p>Alertes: ' + alertesTotal.length + '</p>';
    htmlContent += '</div>';
    
    // Alertes
    if (alertesTotal.length > 0) {
      htmlContent += '<div style="margin-bottom: 30px;">';
      htmlContent += '<h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 5px;">⚠️ Alertes</h2>';
      alertesTotal.forEach(alerte => {
        htmlContent += '<p style="color: #dc3545;">• ' + alerte + '</p>';
      });
      htmlContent += '</div>';
    }
    
    // Palanquées
    htmlContent += '<div style="margin-bottom: 30px;">';
    htmlContent += '<h2 style="color: #004080; border-bottom: 2px solid #007bff; padding-bottom: 5px;">🏊‍♂️ Palanquées</h2>';
    
    if (palanqueesLocal.length === 0) {
      htmlContent += '<p>Aucune palanquée créée.</p>';
    } else {
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          const hasAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
          const borderColor = hasAlert ? '#dc3545' : '#007bff';
          
          htmlContent += '<div style="border: 2px solid ' + borderColor + '; padding: 15px; margin: 15px 0; background: #f8f9fa;">';
          htmlContent += '<h3 style="margin: 0 0 10px 0; color: #004080;">Palanquée ' + (i + 1) + ' (' + pal.length + ' plongeur' + (pal.length > 1 ? 's' : '') + ')</h3>';
          
          if (pal.length === 0) {
            htmlContent += '<p style="font-style: italic; color: #666;">Aucun plongeur assigné</p>';
          } else {
            // Tri des plongeurs par niveau
            const ordreNiveaux = {
              'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
              'N3': 7, 'N2': 8, 'N1': 9,
              'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
              'Déb.': 13, 'débutant': 14, 'Déb': 15
            };
            
            const plongeursTriés = [...pal].sort((a, b) => {
              const ordreA = ordreNiveaux[a.niveau] || 99;
              const ordreB = ordreNiveaux[b.niveau] || 99;
              return ordreA === ordreB ? a.nom.localeCompare(b.nom) : ordreA - ordreB;
            });
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                htmlContent += '<div style="margin: 5px 0; padding: 8px; background: white; border-left: 4px solid #007bff;">';
                htmlContent += '<strong>' + p.nom + '</strong> ';
                htmlContent += '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">' + (p.niveau || 'N?') + '</span>';
                if (p.pre) {
                  htmlContent += ' <em style="color: #666;">(' + p.pre + ')</em>';
                }
                htmlContent += '</div>';
              }
            });
          }
          htmlContent += '</div>';
        }
      });
    }
    htmlContent += '</div>';
    
    // Plongeurs en attente
    if (plongeursLocal.length > 0) {
      htmlContent += '<div style="margin-bottom: 30px;">';
      htmlContent += '<h2 style="color: #004080; border-bottom: 2px solid #007bff; padding-bottom: 5px;">⏳ Plongeurs en Attente</h2>';
      
      const ordreNiveaux = {
        'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
        'N3': 7, 'N2': 8, 'N1': 9,
        'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
        'Déb.': 13, 'débutant': 14, 'Déb': 15
      };
      
      const plongeursEnAttenteTriés = [...plongeursLocal].sort((a, b) => {
        const ordreA = ordreNiveaux[a.niveau] || 99;
        const ordreB = ordreNiveaux[b.niveau] || 99;
        return ordreA === ordreB ? a.nom.localeCompare(b.nom) : ordreA - ordreB;
      });
      
      plongeursEnAttenteTriés.forEach(p => {
        if (p && p.nom) {
          htmlContent += '<div style="margin: 5px 0; padding: 8px; background: #f8f9fa; border-left: 4px solid #ffc107;">';
          htmlContent += '<strong>' + p.nom + '</strong> ';
          htmlContent += '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">' + (p.niveau || 'N?') + '</span>';
          if (p.pre) {
            htmlContent += ' <em style="color: #666;">(' + p.pre + ')</em>';
          }
          htmlContent += '</div>';
        }
      });
      htmlContent += '</div>';
    }
    
    htmlContent += '</div>';
    
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);
    
    console.log("✅ Élément temporaire créé et ajouté au DOM");
    console.log("Contenu HTML généré, longueur:", htmlContent.length);
    
    // ÉTAPE 4: Conversion en PDF
    const fileName = 'palanquees-jsas-preview-' + (dpDate || 'export') + '-' + dpPlongee + '.pdf';
    console.log("📄 Nom du fichier:", fileName);
    
    // Attendre un peu que l'élément soit rendu
    setTimeout(() => {
      if (typeof html2pdf !== 'undefined') {
        console.log("🔄 Utilisation de html2pdf...");
        
        const opt = {
          margin: [10, 10, 10, 10],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          }
        };
        
        html2pdf().from(tempDiv).set(opt).save().then(() => {
          console.log("✅ PDF généré avec html2pdf:", fileName);
          document.body.removeChild(tempDiv);
          alert("PDF généré avec succès : " + fileName);
        }).catch(error => {
          console.error("❌ Erreur html2pdf:", error);
          document.body.removeChild(tempDiv);
          alert("Erreur html2pdf: " + error.message);
        });
        
      } else if (typeof html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
        console.log("🔄 Utilisation de html2canvas + jsPDF...");
        
        html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true
        }).then(canvas => {
          console.log("✅ Canvas créé, dimensions:", canvas.width, "x", canvas.height);
          
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          const imgData = canvas.toDataURL('image/png');
          
          let heightLeft = imgHeight;
          let position = 0;
          
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(fileName);
          console.log("✅ PDF généré avec html2canvas + jsPDF:", fileName);
          document.body.removeChild(tempDiv);
          alert("PDF généré avec succès : " + fileName);
          
        }).catch(error => {
          console.error("❌ Erreur html2canvas:", error);
          document.body.removeChild(tempDiv);
          alert("Erreur html2canvas: " + error.message);
        });
        
      } else {
        document.body.removeChild(tempDiv);
        const message = "❌ Aucune bibliothèque de conversion PDF disponible.\n\n" +
                       "Veuillez ajouter dans votre HTML :\n" +
                       "• html2pdf.js (recommandé) :\n" +
                       '  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>\n\n' +
                       "• OU html2canvas :\n" +
                       '  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>';
        
        console.error(message);
        alert(message);
      }
    }, 100); // Petit délai pour le rendu
    
  } catch (error) {
    console.error("❌ Erreur globale téléchargement PDF:", error);
    alert("Erreur lors du téléchargement du PDF: " + error.message);
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

// Export des fonctions pour usage global
window.exportToPDF = exportToPDF;
window.generatePDFPreview = generatePDFPreview;
window.downloadPDFFromPreview = downloadPDFFromPreview;
window.closePDFPreview = closePDFPreview;

console.log("📄 Module PDF Manager chargé - Toutes fonctionnalités PDF disponibles avec boutons Download/Print");