// pdf-manager.js - Gestion complète des PDF (version améliorée avec WhatsApp)

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
  
  // Récupération spéciale pour le directeur de plongée (texte affiché, pas value)
  const dpSelect = document.getElementById("dp-select");
  const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
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

// ===== GÉNÉRATION PDF PREVIEW SÉCURISÉE AVEC WHATSAPP =====
function generatePDFPreview() {
  console.log("🎨 Génération de l'aperçu PDF professionnel avec WhatsApp...");
  
  try {
    // Récupération spéciale pour le directeur de plongée
    const dpSelect = document.getElementById("dp-select");
    const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
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
        
        /* EN-TÊTE AVEC BOUTONS INTÉGRÉS */
        .preview-header {
          background: linear-gradient(135deg, #004080 0%, #007bff 100%);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .preview-title {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }
        
        .preview-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .preview-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .btn-close {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }
        
        .btn-pdf {
          background: rgba(255, 255, 255, 0.9);
          color: #004080;
          border: 2px solid white;
        }
        
        .btn-pdf:hover {
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .btn-whatsapp {
          background: #25D366;
          color: white;
          border: 2px solid #25D366;
        }
        
        .btn-whatsapp:hover {
          background: #128C7E;
          border-color: #128C7E;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(37, 211, 102, 0.3);
        }
        
        .btn-whatsapp:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
          transform: none;
          opacity: 0.7;
        }
        
        .loading-icon {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* MODAL WHATSAPP */
        .whatsapp-modal {
          display: none;
          position: fixed;
          z-index: 2000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
          background-color: white;
          margin: 5% auto;
          padding: 20px;
          border-radius: 8px;
          width: 90%;
          max-width: 450px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .modal-header {
          color: #25D366;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        
        .modal-instructions {
          margin: 15px 0;
          text-align: left;
          line-height: 1.5;
          font-size: 14px;
        }
        
        .modal-instructions ol {
          padding-left: 20px;
        }
        
        .modal-instructions li {
          margin: 4px 0;
        }
        
        .modal-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }
        
        .modal-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .modal-btn-primary {
          background: #25D366;
          color: white;
        }
        
        .modal-btn-primary:hover {
          background: #128C7E;
        }
        
        .modal-btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .modal-btn-secondary:hover {
          background: #545b62;
        }
        
        /* CONTENU PRINCIPAL */
        .content { 
          padding: 40px; 
        }
        
        .section { 
          margin-bottom: 40px; 
        }
        
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
        
        /* RESPONSIVE DESIGN */
        @media screen and (max-width: 768px) {
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          .preview-header {
            flex-direction: column;
            gap: 10px;
            padding: 10px 15px;
          }
          
          .preview-title {
            font-size: 16px;
            text-align: center;
          }
          
          .preview-buttons {
            width: 100%;
            justify-content: center;
            gap: 8px;
          }
          
          .preview-btn {
            flex: 1;
            min-width: 80px;
            font-size: 12px;
            padding: 6px 12px;
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
          
          .modal-content {
            margin: 10% auto !important;
          }
        }
        
        @media screen and (max-width: 480px) {
          .preview-header {
            padding: 8px 10px !important;
          }
          
          .preview-title {
            font-size: 14px !important;
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
          
          .modal-content {
            width: 95% !important;
            padding: 15px !important;
          }
        }
        
        @media print {
          body { 
            background: white !important; 
          }
          .container { 
            box-shadow: none !important; 
            max-width: none !important; 
          }
          .preview-header {
            position: static !important;
          }
          .whatsapp-modal { 
            display: none !important; 
          }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    htmlContent += '<div class="container">';
    
    // EN-TÊTE AVEC BOUTONS INTÉGRÉS
    htmlContent += '<header class="preview-header">';
    htmlContent += '<h1 class="preview-title">Aperçu des Palanquées</h1>';
    htmlContent += '<div class="preview-buttons">';
    htmlContent += '<button class="preview-btn btn-close" onclick="window.parent.closePDFPreview()" title="Fermer l\'aperçu">✕ Fermer</button>';
    htmlContent += '<button id="btn-generer-pdf" class="preview-btn btn-pdf" onclick="generatePDFFromPreview()" title="Générer le PDF d\'aperçu">📄Générer PDF</button>';
    htmlContent += '<button id="btn-whatsapp" class="preview-btn btn-whatsapp" onclick="shareToWhatsApp()" title="Partager sur WhatsApp">💬WhatsApp</button>';
    htmlContent += '</div>';
    htmlContent += '</header>';
    
    // INFO DIRECTEUR DE PLONGÉE
    htmlContent += '<div style="background: linear-gradient(135deg, #004080 0%, #007bff 100%); color: white; padding: 20px; margin-top: 0;">';
    htmlContent += '<p style="margin: 0; font-size: 14px;"><strong>Directeur de Plongée:</strong> ' + dpNom + '</p>';
    htmlContent += '<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Date:</strong> ' + formatDateFrench(dpDate) + ' - ' + capitalize(dpPlongee) + '</p>';
    htmlContent += '<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Lieu:</strong> ' + dpLieu + '</p>';
    htmlContent += '</div>';
    
    htmlContent += '<main class="content">';
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Résumé</h2>';
    htmlContent += '<p><strong>Total plongeurs:</strong> ' + totalPlongeurs + '</p>';
    htmlContent += '<p><strong>Palanquées:</strong> ' + palanqueesLocal.length + '</p>';
    htmlContent += '<p><strong>Alertes:</strong> ' + alertesTotal.length + '</p>';
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
    htmlContent += '</div>';
    
    // MODAL WHATSAPP
    htmlContent += '<div id="whatsapp-modal" class="whatsapp-modal">';
    htmlContent += '<div class="modal-content">';
    htmlContent += '<div class="modal-header">💬 PDF envoyé vers WhatsApp</div>';
    htmlContent += '<div class="modal-instructions">';
    htmlContent += '<p><strong>Le PDF d\'aperçu a été téléchargé !</strong></p>';
    htmlContent += '<p><strong>Pour le partager sur WhatsApp :</strong></p>';
    htmlContent += '<ol>';
    htmlContent += '<li>Ouvrez WhatsApp</li>';
    htmlContent += '<li>Sélectionnez le contact ou groupe</li>';
    htmlContent += '<li>Cliquez sur 📎 (pièce jointe)</li>';
    htmlContent += '<li>Sélectionnez "Document"</li>';
    htmlContent += '<li>Choisissez le PDF téléchargé</li>';
    htmlContent += '<li>Envoyez !</li>';
    htmlContent += '</ol>';
    htmlContent += '<p><em>Le fichier se trouve dans vos Téléchargements.</em></p>';
    htmlContent += '</div>';
    htmlContent += '<div class="modal-buttons">';
    htmlContent += '<button class="modal-btn modal-btn-primary" onclick="openWhatsAppWeb()">Ouvrir WhatsApp Web</button>';
    htmlContent += '<button class="modal-btn modal-btn-secondary" onclick="closeWhatsAppModal()">OK, compris</button>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    htmlContent += '</div>';

    // JAVASCRIPT INTÉGRÉ
    htmlContent += `<script>
      // Variables pour la gestion du PDF
      let isGeneratingPDF = false;

      // Fonction pour partager l'aperçu sur WhatsApp
      async function shareToWhatsApp() {
        if (isGeneratingPDF) return;

        const btn = document.getElementById('btn-whatsapp');
        const pdfBtn = document.getElementById('btn-generer-pdf');
        
        if (!btn) return;
        
        // Désactiver les boutons et changer l'interface
        isGeneratingPDF = true;
        btn.disabled = true;
        if (pdfBtn) pdfBtn.disabled = true;
        
        btn.innerHTML = '⏳ Génération...';

        try {
          // Générer le PDF d'aperçu pour WhatsApp
          await generatePDFForWhatsApp();
          
          // Afficher les instructions
          const modal = document.getElementById('whatsapp-modal');
          if (modal) {
            modal.style.display = 'block';
          }
          
        } catch (error) {
          console.error('Erreur partage WhatsApp:', error);
          alert('Erreur lors de la génération du PDF pour WhatsApp : ' + error.message);
        } finally {
          // Réactiver les boutons après un délai
          setTimeout(() => {
            isGeneratingPDF = false;
            btn.disabled = false;
            if (pdfBtn) pdfBtn.disabled = false;
            
            btn.innerHTML = '💬 WHATSAPP';
          }, 1500);
        }
      }

      // Fonction pour générer le PDF spécialement pour WhatsApp
      async function generatePDFForWhatsApp() {
        return new Promise((resolve, reject) => {
          try {
            // Vérifier que jsPDF est disponible dans le parent
            let jsPDFLib = null;
            if (typeof window.parent.jspdf !== 'undefined' && window.parent.jspdf.jsPDF) {
              jsPDFLib = window.parent.jspdf;
            } else if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
              jsPDFLib = window.jspdf;
            } else {
              throw new Error("jsPDF non disponible");
            }

            // Récupérer les données depuis le parent
            const plongeursLocal = window.parent.plongeurs || [];
            const palanqueesLocal = window.parent.palanquees || [];
            
            // Récupérer les infos DP
            const dpSelect = window.parent.document.getElementById("dp-select");
            const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
            const dpDate = window.parent.document.getElementById("dp-date")?.value || "Non définie";
            const dpLieu = window.parent.document.getElementById("dp-lieu")?.value || "Non défini";
            const dpPlongee = window.parent.document.getElementById("dp-plongee")?.value || "matin";

            function formatDateFrench(dateString) {
              if (!dateString) return "Non définie";
              const date = new Date(dateString);
              return date.toLocaleDateString('fr-FR');
            }

            // Créer le PDF optimisé pour WhatsApp
            const { jsPDF } = jsPDFLib;
            const doc = new jsPDF('portrait', 'mm', 'a4');

            let yPosition = 20;
            const margin = 20;

            // En-tête avec couleur WhatsApp
            doc.setFillColor(37, 211, 102);
            doc.rect(0, 0, 210, 45, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('Palanquées JSAS', margin, 18);
            
            doc.setFontSize(12);
            doc.text('DP: ' + dpNom, margin, 28);
            doc.text(formatDateFrench(dpDate) + ' - ' + dpPlongee.toUpperCase(), margin, 36);
            doc.text('Lieu: ' + dpLieu, margin, 42);

            yPosition = 55;
            doc.setTextColor(0, 0, 0);

            // Statistiques
            const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
            
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('RÉSUMÉ', margin, yPosition);
            yPosition += 10;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text('• Total plongeurs: ' + totalPlongeurs, margin + 5, yPosition);
            yPosition += 6;
            doc.text('• Palanquées: ' + palanqueesLocal.length, margin + 5, yPosition);
            yPosition += 15;

            // Palanquées avec tri par niveau
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('PALANQUÉES', margin, yPosition);
            yPosition += 10;

            if (palanqueesLocal.length === 0) {
              doc.setFontSize(11);
              doc.text('Aucune palanquée créée', margin + 5, yPosition);
            } else {
              palanqueesLocal.forEach((pal, i) => {
                if (pal && Array.isArray(pal)) {
                  // Vérifier si on a assez de place
                  if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                  }

                  doc.setFontSize(12);
                  doc.setFont(undefined, 'bold');
                  doc.text(\`Palanquée \${i + 1} (\${pal.length} plongeurs)\`, margin, yPosition);
                  yPosition += 8;
                  
                  if (pal.length > 0) {
                    // Trier par niveau (plus haut niveau en premier)
                    const ordreNiveaux = {
                      'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
                      'N3': 7, 'N2': 8, 'N1': 9,
                      'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
                      'Déb.': 13, 'débutant': 14, 'Déb': 15
                    };
                    
                    const plongeursTriés = [...pal].sort((a, b) => {
                      const ordreA = ordreNiveaux[a.niveau] || 99;
                      const ordreB = ordreNiveaux[b.niveau] || 99;
                      if (ordreA === ordreB) {
                        return a.nom.localeCompare(b.nom);
                      }
                      return ordreA - ordreB;
                    });
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    plongeursTriés.forEach(p => {
                      if (p && p.nom) {
                        const ligne = \`  • \${p.nom} (\${p.niveau})\${p.pre ? ' - ' + p.pre : ''}\`;
                        doc.text(ligne, margin + 5, yPosition);
                        yPosition += 5;
                      }
                    });
                  }
                  yPosition += 8;
                }
              });
            }

            // Plongeurs en attente si il y en a
            if (plongeursLocal.length > 0) {
              if (yPosition > 240) {
                doc.addPage();
                yPosition = 20;
              }

              doc.setFontSize(14);
              doc.setFont(undefined, 'bold');
              doc.text('PLONGEURS EN ATTENTE', margin, yPosition);
              yPosition += 10;

              // Trier aussi les plongeurs en attente
              const ordreNiveaux = {
                'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
                'N3': 7, 'N2': 8, 'N1': 9,
                'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
                'Déb.': 13, 'débutant': 14, 'Déb': 15
              };
              
              const plongeursEnAttenteTriés = [...plongeursLocal].sort((a, b) => {
                const ordreA = ordreNiveaux[a.niveau] || 99;
                const ordreB = ordreNiveaux[b.niveau] || 99;
                if (ordreA === ordreB) {
                  return a.nom.localeCompare(b.nom);
                }
                return ordreA - ordreB;
              });

              doc.setFontSize(10);
              doc.setFont(undefined, 'normal');
              plongeursEnAttenteTriés.forEach(p => {
                if (p && p.nom) {
                  const ligne = \`• \${p.nom} (\${p.niveau})\${p.pre ? ' - ' + p.pre : ''}\`;
                  doc.text(ligne, margin + 5, yPosition);
                  yPosition += 5;
                }
              });
            }

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR') + ' pour WhatsApp', margin, 285);

            // Télécharger le PDF
            const fileName = 'palanquees-jsas-whatsapp-' + formatDateFrench(dpDate).replace(/\\//g, '-') + '.pdf';
            doc.save(fileName);

            console.log('PDF WhatsApp généré:', fileName);
            resolve(fileName);

          } catch (error) {
            reject(error);
          }
        });
      }

      // Améliorer la fonction generatePDFFromPreview existante
      function generatePDFFromPreview() {
        const btn = document.getElementById('btn-generer-pdf');
        const whatsappBtn = document.getElementById('btn-whatsapp');
        
        if (!btn) return;
        
        // Feedback visuel
        btn.disabled = true;
        if (whatsappBtn) whatsappBtn.disabled = true;
        
        btn.innerHTML = '⏳ Génération...';

        try {
          // Appeler la fonction du parent
          if (typeof window.parent.generatePDFFromPreview === 'function') {
            window.parent.generatePDFFromPreview();
          } else {
            throw new Error('Fonction generatePDFFromPreview non trouvée');
          }
        } catch (error) {
          alert('Erreur lors de la génération du PDF');
          console.error('Erreur PDF:', error);
        } finally {
          // Restaurer l'interface
          setTimeout(() => {
            btn.disabled = false;
            if (whatsappBtn) whatsappBtn.disabled = false;
            
            btn.innerHTML = '📄 GENERER PDF';
          }, 1500);
        }
      }

      // Ouvrir WhatsApp Web
      function openWhatsAppWeb() {
        window.open('https://web.whatsapp.com/', '_blank');
        closeWhatsAppModal();
      }

      // Fermer le modal WhatsApp
      function closeWhatsAppModal() {
        const modal = document.getElementById('whatsapp-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }

      // Fermer modal en cliquant à l'extérieur
      window.onclick = function(event) {
        const modal = document.getElementById('whatsapp-modal');
        if (event.target === modal) {
          closeWhatsAppModal();
        }
      }
    </script>`;

    htmlContent += '</body></html>';

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
      
      console.log("✅ Aperçu PDF généré avec tri par grade, en-tête intégré et bouton WhatsApp");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      
    } else {
      console.error("❌ Éléments d'aperçu non trouvés");
      alert("Erreur: impossible d'afficher l'aperçu PDF");
    }
    
  } catch (error) {
    console.error("❌ Erreur génération aperçu PDF:", error);
    alert("Erreur lors de la génération de l'aperçu: " + error.message);
  }
}

// ===== NOUVELLE FONCTION : GÉNÉRATION PDF SIMPLIFIÉ AVEC TRI =====
function generatePDFFromPreview() {
  console.log("📄 Génération PDF simplifié avec tri par niveau...");
  
  try {
    // Vérifier que jsPDF est disponible
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      throw new Error("jsPDF non disponible");
    }

    const dpSelect = document.getElementById("dp-select");
    const dpNom = dpSelect?.selectedOptions[0]?.textContent || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";

    // S'assurer que les variables existent
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];

    // Fonction de tri par grade
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
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    }

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Créer le PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4');

    let yPosition = 20;
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;

    function checkPageBreak(height) {
      if (yPosition + height > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    }

    function addText(text, x, y, size = 10, style = 'normal') {
      doc.setFontSize(size);
      doc.setFont(undefined, style);
      doc.text(text, x, y);
    }

    // En-tête
    doc.setFillColor(0, 64, 128);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    addText('Palanquées JSAS', margin, 20, 18, 'bold');
    addText('DP: ' + dpNom, margin, 30, 12);
    addText('Date: ' + formatDateFrench(dpDate) + ' - ' + capitalize(dpPlongee), margin, 38, 10);
    addText('Lieu: ' + dpLieu, margin, 46, 10);
    
    yPosition = 65;
    doc.setTextColor(0, 0, 0);

    // Résumé
    addText('RÉSUMÉ', margin, yPosition, 14, 'bold');
    yPosition += 8;
    addText('Total plongeurs: ' + totalPlongeurs, margin, yPosition);
    yPosition += 6;
    addText('Palanquées: ' + palanqueesLocal.length, margin, yPosition);
    yPosition += 6;
    addText('Alertes: ' + alertesTotal.length, margin, yPosition);
    yPosition += 15;

    // Alertes
    if (alertesTotal.length > 0) {
      checkPageBreak(20 + alertesTotal.length * 6);
      addText('ALERTES', margin, yPosition, 14, 'bold');
      yPosition += 8;
      alertesTotal.forEach(alerte => {
        addText('• ' + alerte, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Palanquées
    addText('PALANQUÉES', margin, yPosition, 14, 'bold');
    yPosition += 10;

    if (palanqueesLocal.length === 0) {
      addText('Aucune palanquée créée.', margin, yPosition);
      yPosition += 15;
    } else {
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          checkPageBreak(15 + pal.length * 6 + 10);
          
          addText(`Palanquée ${i + 1} (${pal.length} plongeur${pal.length > 1 ? 's' : ''})`, margin, yPosition, 12, 'bold');
          yPosition += 8;
          
          if (pal.length === 0) {
            addText('Aucun plongeur assigné', margin + 10, yPosition, 10, 'italic');
            yPosition += 8;
          } else {
            // Trier et afficher les plongeurs
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                const textLine = '• ' + p.nom + ' (' + (p.niveau || 'N?') + ')' + (p.pre ? ' - ' + p.pre : '');
                addText(textLine, margin + 5, yPosition);
                yPosition += 6;
              }
            });
          }
          yPosition += 8;
        }
      });
    }

    // Plongeurs en attente
    if (plongeursLocal.length > 0) {
      checkPageBreak(15 + plongeursLocal.length * 6);
      
      addText('PLONGEURS EN ATTENTE', margin, yPosition, 14, 'bold');
      yPosition += 8;
      
      const plongeursTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursTriés.forEach(p => {
        if (p && p.nom) {
          const textLine = '• ' + p.nom + ' (' + (p.niveau || 'N?') + ')' + (p.pre ? ' - ' + p.pre : '');
          addText(textLine, margin + 5, yPosition);
          yPosition += 6;
        }
      });
    }

    // Footer sur toutes les pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(new Date().toLocaleDateString('fr-FR'), margin, pageHeight - 10);
      doc.text('Page ' + i + '/' + totalPages, pageWidth - margin - 20, pageHeight - 10);
    }

    // Télécharger
    const fileName = 'palanquees-jsas-apercu-' + formatDateFrench(dpDate).replace(/\//g, '-') + '-' + dpPlongee + '.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF aperçu généré:", fileName);
    alert('PDF de l\'aperçu généré avec succès !\n\nAvec tri automatique des plongeurs par niveau\n\nFichier: ' + fileName);

  } catch (error) {
    console.error("❌ Erreur PDF aperçu:", error);
    alert("Erreur lors de la génération du PDF: " + error.message);
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
window.generatePDFFromPreview = generatePDFFromPreview;
window.closePDFPreview = closePDFPreview;

console.log("📄 Module PDF Manager chargé - Toutes fonctionnalités PDF disponibles avec WhatsApp intégré");