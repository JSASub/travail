// pdf-manager.js - Gestion complète des PDF avec distinction claire

// ===== EXPORT PDF COMPLET (FICHE DE SÉCURITÉ) =====
function exportToPDF() {
  // Vérifier que pageLoadTime existe
  if (typeof pageLoadTime !== 'undefined' && Date.now() - pageLoadTime < 3000) {
    console.log("Export PDF bloqué - page en cours de chargement");
    return;
  }
    
  console.log("Génération du PDF COMPLET (fiche de sécurité)...");
  
  // Fonction helper sécurisée pour getElementById
  function $(id) {
    const element = document.getElementById(id);
    return element || { value: "" };
  }
  
  // Récupération spéciale pour le directeur de plongée
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
    
    const spacing = {
      lineHeight: 6,
      sectionGap: 8,
      subsectionGap: 6,
      headerHeight: 60,
      footerHeight: 25,
      palanqueeGap: 6
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
        doc.setFontSize(7);
        doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
        doc.text("Palanquées JSAS - " + dpDate + " (" + dpPlongee + ")", margin, 10);
        doc.text("Page " + doc.internal.getCurrentPageInfo().pageNumber, pageWidth - margin - 20, 10);
        yPosition = 15;
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
    addText('Fiche de SÉCURITÉ', margin, 32, 20, 'bold', 'white');
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
    
    // === PALANQUÉES DÉTAILLÉES AVEC PARAMÈTRES ===
    checkPageBreak(40, true);
    
    yPosition += 3;
    addText('Organisation des Palanquées', margin, yPosition, 14, 'bold', 'primary');
    yPosition += 3;
    
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
        
        let palanqueeHeight = 12;
        palanqueeHeight += (pal.length * spacing.lineHeight) + 3;
        palanqueeHeight += 26; // Paramètres
        palanqueeHeight += spacing.palanqueeGap;
        
        checkPageBreak(palanqueeHeight + 10);
        
        const isAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
        
        // En-tête de palanquée
        if (isAlert) {
          doc.setFillColor(colors.dangerR, colors.dangerG, colors.dangerB);
        } else {
          doc.setFillColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
        }
        doc.rect(margin, yPosition, contentWidth, 7, 'F');
        
        addText('Palanquée ' + (i + 1) + ' - ' + pal.length + ' plongeurs', margin + 5, yPosition + 5, 12, 'bold', 'white');
        
        const gps = pal.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p && p.niveau === "N1");
        const autonomes = pal.filter(p => p && ["N2", "N3"].includes(p.niveau));
        
        addText('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 5, 10, 'normal', 'white');
        
        yPosition += 12;
        
        // Liste des plongeurs (triés par niveau)
        if (pal.length === 0) {
          addText('Aucun plongeur assigné', margin + 10, yPosition, 11, 'normal', 'gray');
          yPosition += spacing.lineHeight + 3;
        } else {
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
          yPosition += 3;
        }
        
        // === PARAMÈTRES DE PLONGÉE (FICHE DE SÉCURITÉ) ===
        
        // Ligne 1: Horaire
        addText('Horaire mise à l\'eau:', margin + 5, yPosition, 9, 'bold', 'primary');
        
        if (pal.horaire && pal.horaire.trim()) {
          addText(pal.horaire, margin + 50, yPosition, 9, 'normal');
          addText('Correction: ', margin + 80, yPosition, 8, 'bold', 'gray');
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 105, yPosition, margin + 140, yPosition);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 50, yPosition, margin + 85, yPosition);
          addText('(HH:MM)', margin + 88, yPosition, 9, 'normal', 'gray');
        }
        yPosition += 3.5;
        
        // Ligne 2: Profondeurs et durées prévues
        addText('Prof. prévue: ', margin + 5, yPosition, 9, 'bold', 'primary');
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          addText(pal.profondeurPrevue + ' m', margin + 35, yPosition, 9, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 35, yPosition, margin + 55, yPosition);
          addText('m', margin + 57, yPosition, 9, 'normal', 'gray');
        }
        
        addText('Durée prévue:', margin + 80, yPosition, 9, 'bold', 'primary');
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          addText(pal.dureePrevue + ' min', margin + 115, yPosition, 9, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 115, yPosition, margin + 140, yPosition);
          addText('min', margin + 142, yPosition, 9, 'normal', 'gray');
        }
        yPosition += 3.5;
        
        // Ligne 3: Profondeurs et durées réalisées
        addText('Prof. réalisée:', margin + 5, yPosition, 9, 'bold', 'success');
        if (pal.profondeurRealisee && pal.profondeurRealisee.trim()) {
          addText(pal.profondeurRealisee + ' m', margin + 40, yPosition, 9, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 40, yPosition, margin + 60, yPosition);
          addText('m', margin + 62, yPosition, 9, 'normal', 'gray');
        }
        
        addText('Durée réalisée:', margin + 80, yPosition, 9, 'bold', 'success');
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          addText(pal.dureeRealisee + ' min', margin + 120, yPosition, 9, 'normal');
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 120, yPosition, margin + 145, yPosition);
          addText('min', margin + 147, yPosition, 9, 'normal', 'gray');
        }
        yPosition += 3.5;
        
        // Ligne 4: Paliers
        addText('Paliers:', margin + 5, yPosition, 9, 'bold', 'primary');
        
        if (pal.paliers && pal.paliers.trim()) {
          addText(pal.paliers, margin + 25, yPosition, 8, 'normal');
          addText('Correction:', margin + 70, yPosition, 8, 'bold', 'gray');
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 95, yPosition, margin + 140, yPosition);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 25, yPosition, margin + 65, yPosition);
          addText('(ex: 3 min à 3 m) | Correction:', margin + 70, yPosition, 8, 'normal', 'gray');
          doc.line(margin + 130, yPosition, margin + 150, yPosition);
        }
        
        yPosition += spacing.lineHeight + spacing.palanqueeGap;
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
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      
      addText(new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}), margin, pageHeight - 6, 6, 'normal', 'gray');
      addText('Page ' + pageNum + '/' + totalPages, pageWidth - margin - 25, pageHeight - 6, 6, 'normal', 'gray');
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'fiche-securite-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '.pdf';
    doc.save(fileName);
    
    console.log("PDF COMPLET (fiche de sécurité) généré:", fileName);
    
    const alertesText = alertesTotal.length > 0 ? '\nAlertes: ' + alertesTotal.length : '\nAucune alerte';
    alert('PDF COMPLET généré avec succès !\n\n' + totalPlongeurs + ' plongeurs dans ' + palanqueesLocal.length + ' palanquées' + alertesText + '\n\nFichier: ' + fileName);
    
  } catch (error) {
    console.error("Erreur PDF complet:", error);
    alert("Erreur lors de la génération du PDF complet : " + error.message + "\n\nVérifiez que jsPDF est bien chargé.");
  }
}

// ===== EXPORT PDF MINIMAL (PALANQUÉES SEULEMENT) =====
function generatePDFFromPreview() {
  console.log("Génération PDF MINIMAL (palanquées uniquement) pour WhatsApp...");
  
  try {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      throw new Error("jsPDF non disponible");
    }

    const dpSelect = document.getElementById("dp-select");
    const dpNom = dpSelect?.selectedOptions[0]?.textContent || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";

    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);

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

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4');

    let yPosition = 20;
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;

    function checkPageBreak(height) {
      if (yPosition + height > pageHeight - 25) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    }

    function addText(text, x, y, size = 10, style = 'normal', color = [0, 0, 0]) {
      doc.setFontSize(size);
      doc.setFont(undefined, style);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, x, y);
    }

    // === EN-TÊTE MINIMAL ===
    doc.setFillColor(0, 123, 255);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    addText('Palanquées JSAS', margin, 15, 16, 'bold', [255, 255, 255]);
    addText(formatDateFrench(dpDate) + ' - ' + capitalize(dpPlongee) + ' - ' + dpLieu, margin, 25, 10, 'normal', [255, 255, 255]);
    addText('DP: ' + dpNom, margin, 32, 9, 'normal', [255, 255, 255]);
    
    yPosition = 50;

    // === STATISTIQUES SIMPLES ===
    addText(totalPlongeurs + ' plongeurs - ' + palanqueesLocal.length + ' palanquées', margin, yPosition, 12, 'bold');
    yPosition += 15;

    // === PALANQUÉES UNIQUEMENT (SANS PARAMÈTRES) ===
    if (palanqueesLocal.length === 0) {
      addText('Aucune palanquée créée - Tous les plongeurs en attente', margin, yPosition, 11);
      yPosition += 15;
    } else {
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          checkPageBreak(10 + pal.length * 5 + 8);
          
          // Titre palanquée simple
          addText('Palanquée ' + (i + 1), margin, yPosition, 14, 'bold', [0, 64, 128]);
          yPosition += 8;
          
          if (pal.length === 0) {
            addText('  Aucun plongeur', margin + 5, yPosition, 10, 'italic', [128, 128, 128]);
            yPosition += 6;
          } else {
            // Plongeurs triés par grade
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                const textLine = '  • ' + p.nom + ' (' + (p.niveau || 'N?') + ')';
                addText(textLine, margin + 3, yPosition, 10, 'normal');
                yPosition += 5;
              }
            });
          }
          yPosition += 8;
        }
      });
    }

    // === PLONGEURS EN ATTENTE ===
    if (plongeursLocal.length > 0) {
      checkPageBreak(10 + plongeursLocal.length * 5);
      
      addText('En attente', margin, yPosition, 12, 'bold', [255, 140, 0]);
      yPosition += 8;
      
      const plongeursTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursTriés.forEach(p => {
        if (p && p.nom) {
          const textLine = '  • ' + p.nom + ' (' + (p.niveau || 'N?') + ')';
          addText(textLine, margin + 3, yPosition, 10, 'normal');
          yPosition += 5;
        }
      });
    }

    // === FOOTER MINIMAL ===
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(new Date().toLocaleDateString('fr-FR'), margin, pageHeight - 8);
      if (totalPages > 1) {
        doc.text('Page ' + i + '/' + totalPages, pageWidth - margin - 20, pageHeight - 8);
      }
    }

    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-' + formatDateFrench(dpDate).replace(/\//g, '-') + '-' + dpPlongee + '-whatsapp.pdf';
    doc.save(fileName);
    
    console.log("PDF MINIMAL généré pour WhatsApp:", fileName);
    alert('PDF minimal généré !\n\nFormat: Palanquées uniquement\n' + totalPlongeurs + ' plongeurs, ' + palanqueesLocal.length + ' palanquées\n\nFichier: ' + fileName);

  } catch (error) {
    console.error("Erreur PDF minimal:", error);
    alert("Erreur lors de la génération du PDF minimal: " + error.message);
  }
}

// ===== GÉNÉRATION PDF PREVIEW =====
function generatePDFPreview() {
  console.log("Génération de l'aperçu PDF...");
  
  try {
    const dpSelect = document.getElementById("dp-select");
    const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
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
        .close-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .close-button:hover {
          background: #c82333;
          transform: scale(1.1);
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
        
        @media screen and (max-width: 768px) {
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .header { padding: 15px !important; }
          .main-title { font-size: 20px !important; letter-spacing: 1px !important; }
          .content { padding: 15px !important; }
          .section { margin-bottom: 25px !important; }
          .section-title { font-size: 16px !important; margin-bottom: 15px !important; }
          .palanquee-box { margin: 15px 0 !important; padding: 15px !important; }
          .palanquee-title { font-size: 16px !important; margin-bottom: 12px !important; }
          .plongeur-item { padding: 10px 8px !important; flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .plongeur-nom { font-size: 14px !important; }
          .plongeur-niveau { font-size: 11px !important; padding: 3px 6px !important; }
          .plongeur-prerogatives { font-size: 10px !important; }
          .close-button { width: 45px !important; height: 45px !important; font-size: 18px !important; top: 15px !important; right: 15px !important; }
        }
        
        @media screen and (max-width: 480px) {
          .header { padding: 10px !important; }
          .main-title { font-size: 18px !important; }
          .content { padding: 10px !important; }
          .section-title { font-size: 14px !important; }
          .palanquee-title { font-size: 14px !important; }
          .close-button { width: 40px !important; height: 40px !important; font-size: 16px !important; top: 10px !important; right: 10px !important; }
        }
        
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
          .close-button { display: none !important; }
          .actions-bar { display: none !important; }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    htmlContent += '<button class="close-button" onclick="window.parent.closePDFPreview()" title="Fermer l\'aperçu">✕</button>';
    
    htmlContent += '<div class="container">';
    htmlContent += '<header class="header">';
    htmlContent += '<h1 class="main-title">Palanquées JSAS</h1>';
    htmlContent += '<p>Directeur de Plongée: ' + dpNom + '</p>';
    htmlContent += '<p>Date: ' + formatDateFrench(dpDate) + ' - ' + capitalize(dpPlongee) + '</p>';
    htmlContent += '<p>Lieu: ' + dpLieu + '</p>';
    htmlContent += '</header>';
    
    // Barre d'actions avec boutons distincts
    htmlContent += `
    <div class="actions-bar" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div>
        <strong>Actions disponibles</strong>
        <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
          Générez le PDF simplifié (palanquées uniquement) ou partagez sur WhatsApp.
        </div>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button onclick="generatePDFFromPreview()" style="
          background: #28a745; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          padding: 12px 16px; 
          font-size: 14px; 
          font-weight: bold; 
          cursor: pointer; 
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3); 
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        " title="Générer PDF SIMPLIFIÉ de cet aperçu" onmouseover="this.style.background='#218838'; this.style.transform='scale(1.05)';" onmouseout="this.style.background='#28a745'; this.style.transform='scale(1)';">
          PDF Simplifié
        </button>
        
        <button onclick="shareToWhatsAppFromPreview()" style="
          background: linear-gradient(135deg, #25D366 0%, #20ba5a 100%); 
          color: white; 
          border: none; 
          border-radius: 8px; 
          padding: 12px 16px; 
          font-size: 14px; 
          font-weight: bold; 
          cursor: pointer; 
          box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4); 
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 180px;
          justify-content: center;
        " title="Générer PDF SIMPLIFIÉ et partager sur WhatsApp" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 20px rgba(37, 211, 102, 0.5)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 6px 16px rgba(37, 211, 102, 0.4)';">
          WhatsApp Simplifié
        </button>
      </div>
    </div>`;
    
    htmlContent += '<main class="content">';
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">Résumé</h2>';
    htmlContent += '<p>Total plongeurs: ' + totalPlongeurs + '</p>';
    htmlContent += '<p>Palanquées: ' + palanqueesLocal.length + '</p>';
    htmlContent += '<p>Alertes: ' + alertesTotal.length + '</p>';
    htmlContent += '</section>';
    
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">Alertes</h2>';
      alertesTotal.forEach(alerte => {
        htmlContent += '<p style="color: red;">• ' + alerte + '</p>';
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">Palanquées</h2>';
    
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
      htmlContent += '<h2 class="section-title">Plongeurs en Attente</h2>';
      
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

    // Script WhatsApp corrigé dans l'aperçu
    htmlContent += '<script>';
    htmlContent += 'function shareToWhatsAppFromPreview() {';
    htmlContent += '  console.log("Partage WhatsApp avec PDF MINIMAL...");';
    htmlContent += '  try {';
    htmlContent += '    var dpSelect = window.parent.document.getElementById("dp-select");';
    htmlContent += '    var dpNom = (dpSelect && dpSelect.selectedOptions[0]) ? dpSelect.selectedOptions[0].textContent : "Non défini";';
    htmlContent += '    var dpDate = window.parent.document.getElementById("dp-date").value || new Date().toLocaleDateString("fr-FR");';
    htmlContent += '    var dpLieu = window.parent.document.getElementById("dp-lieu").value || "Non défini";';
    htmlContent += '    var dpPlongee = window.parent.document.getElementById("dp-plongee").value || "matin";';
    htmlContent += '    ';
    htmlContent += '    var plongeursLocal = window.parent.plongeurs || [];';
    htmlContent += '    var palanqueesLocal = window.parent.palanquees || [];';
    htmlContent += '    var totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce(function(total, pal) { return total + (pal ? pal.length : 0); }, 0);';
    htmlContent += '    var alertesTotal = window.parent.checkAllAlerts ? window.parent.checkAllAlerts() : [];';
    htmlContent += '    ';
    htmlContent += '    function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }';
    htmlContent += '    function formatDateFrench(dateString) {';
    htmlContent += '      if (!dateString) return new Date().toLocaleDateString("fr-FR");';
    htmlContent += '      try { var date = new Date(dateString); return date.toLocaleDateString("fr-FR"); }';
    htmlContent += '      catch (error) { return dateString; }';
    htmlContent += '    }';
    htmlContent += '    ';
    htmlContent += '    var message = "Palanquées JSAS du " + formatDateFrench(dpDate) + "\\n";';
    htmlContent += '    message += dpLieu + " - Session " + capitalize(dpPlongee) + "\\n";';
    htmlContent += '    message += "DP: " + dpNom + "\\n\\n";';
    htmlContent += '    message += "RÉSUMÉ:\\n";';
    htmlContent += '    message += "• " + totalPlongeurs + " plongeurs total\\n";';
    htmlContent += '    message += "• " + palanqueesLocal.length + " palanquées constituées";';
    htmlContent += '    ';
    htmlContent += '    if (alertesTotal.length > 0) {';
    htmlContent += '      message += "\\n\\nALERTES (" + alertesTotal.length + "):\\n";';
    htmlContent += '      for (var i = 0; i < Math.min(3, alertesTotal.length); i++) {';
    htmlContent += '        message += "• " + alertesTotal[i] + "\\n";';
    htmlContent += '      }';
    htmlContent += '      if (alertesTotal.length > 3) {';
    htmlContent += '        message += "• ... et " + (alertesTotal.length - 3) + " autres alertes\\n";';
    htmlContent += '      }';
    htmlContent += '    }';
    htmlContent += '    ';
    htmlContent += '    message += "\\n\\nComposition des palanquées (version simplifiée)\\n";';
    htmlContent += '    message += "PDF joint\\n\\n";';
    htmlContent += '    message += "Aperçu vérifié et prêt.";';
    htmlContent += '    ';
    htmlContent += '    var whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(message);';
    htmlContent += '    window.open(whatsappUrl, "_blank");';
    htmlContent += '    ';
    htmlContent += '    setTimeout(function() {';
    htmlContent += '      console.log("Génération du PDF MINIMAL...");';
    htmlContent += '      if (window.parent.generatePDFFromPreview) {';
    htmlContent += '        window.parent.generatePDFFromPreview();';
    htmlContent += '        console.log("PDF MINIMAL généré");';
    htmlContent += '      } else {';
    htmlContent += '        alert("Erreur: Fonction PDF minimal non disponible");';
    htmlContent += '      }';
    htmlContent += '    }, 800);';
    htmlContent += '    ';
    htmlContent += '    setTimeout(function() {';
    htmlContent += '      var confirmMessage = "WhatsApp ouvert !\\n\\n";';
    htmlContent += '      confirmMessage += "Étapes suivantes :\\n";';
    htmlContent += '      confirmMessage += "1. Le PDF MINIMAL se télécharge automatiquement\\n";';
    htmlContent += '      confirmMessage += "2. Dans WhatsApp, joignez le PDF téléchargé\\n";';
    htmlContent += '      confirmMessage += "3. Envoyez le message\\n\\n";';
    htmlContent += '      confirmMessage += "Format partagé : Palanquées simplifiées (" + totalPlongeurs + " plongeurs, " + palanqueesLocal.length + " palanquées)\\n";';
    htmlContent += '      confirmMessage += "Parfait pour partage WhatsApp !";';
    htmlContent += '      alert(confirmMessage);';
    htmlContent += '    }, 1200);';
    htmlContent += '    ';
    htmlContent += '  } catch (error) {';
    htmlContent += '    alert("Erreur partage WhatsApp : " + error.message);';
    htmlContent += '  }';
    htmlContent += '}';
    htmlContent += '</script>';
    
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
      
      console.log("Aperçu PDF généré avec bouton WhatsApp MINIMAL");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      
    } else {
      console.error("Éléments d'aperçu non trouvés");
      alert("Erreur: impossible d'afficher l'aperçu PDF");
    }
    
  } catch (error) {
    console.error("Erreur génération aperçu PDF:", error);
    alert("Erreur lors de la génération de l'aperçu: " + error.message);
  }
}

// ===== FONCTION WHATSAPP POUR BOUTON PRINCIPAL (PDF COMPLET) =====
function shareToWhatsAppWithPDF() {
  console.log("Partage WhatsApp avec génération PDF COMPLET automatique...");
  
  try {
    const dpSelect = document.getElementById("dp-select");
    const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || new Date().toLocaleDateString('fr-FR');
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    function formatDateFrench(dateString) {
      if (!dateString) return new Date().toLocaleDateString('fr-FR');
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
      } catch (error) {
        return dateString;
      }
    }
    
    // Message pour FICHE COMPLÈTE
    let message = `Fiche de Sécurité JSAS du ${formatDateFrench(dpDate)}
${dpLieu} - Session ${capitalize(dpPlongee)}
DP: ${dpNom}

RÉSUMÉ:
• ${totalPlongeurs} plongeurs total
• ${palanqueesLocal.length} palanquées constituées`;

    if (alertesTotal.length > 0) {
      message += `

ALERTES (${alertesTotal.length}):`;
      alertesTotal.slice(0, 3).forEach(alerte => {
        message += `\n• ${alerte}`;
      });
      if (alertesTotal.length > 3) {
        message += `\n• ... et ${alertesTotal.length - 3} autres alertes`;
      }
    }

    message += `

Fiche de sécurité COMPLÈTE avec paramètres
PDF joint à ce message

Instructions:
1. Le PDF se télécharge automatiquement
2. Attendez la fin du téléchargement  
3. Joignez le PDF à ce message WhatsApp
4. Envoyez à votre groupe/contact`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Génération PDF COMPLET avec délai
    setTimeout(() => {
      console.log("Déclenchement génération PDF COMPLET...");
      if (typeof exportToPDF === 'function') {
        exportToPDF(); // FICHE COMPLÈTE
      } else {
        alert('Fonction exportToPDF non disponible.');
      }
    }, 1000);
    
    const confirmMessage = `WhatsApp ouvert avec message pré-rempli !

Étapes suivantes :
1. Le PDF COMPLET (fiche de sécurité) se télécharge automatiquement
2. Dans WhatsApp, cliquez sur l'icône de pièce jointe
3. Sélectionnez "Document" et choisissez le PDF téléchargé
4. Envoyez le message

Données partagées : ${totalPlongeurs} plongeurs, ${palanqueesLocal.length} palanquées${alertesTotal.length > 0 ? `, ${alertesTotal.length} alertes` : ''}
Format : Fiche de sécurité complète avec paramètres`;
    
    setTimeout(() => {
      alert(confirmMessage);
    }, 1500);
    
    console.log("Partage WhatsApp FICHE COMPLÈTE initié");
    
  } catch (error) {
    console.error("Erreur partage WhatsApp:", error);
    alert("Erreur lors du partage WhatsApp : " + error.message);
  }
}

// ===== FONCTION FERMETURE APERÇU =====
function closePDFPreview() {
  const previewContainer = document.getElementById("previewContainer");
  const pdfPreview = document.getElementById("pdfPreview");
  
  if (previewContainer) {
    previewContainer.style.display = "none";
    if (pdfPreview) {
      pdfPreview.src = "";
    }
    console.log("Aperçu PDF fermé");
  }
}

// ===== EXPORTS GLOBAUX =====
window.exportToPDF = exportToPDF;
window.generatePDFPreview = generatePDFPreview;
window.generatePDFFromPreview = generatePDFFromPreview;
window.closePDFPreview = closePDFPreview;
window.shareToWhatsAppWithPDF = shareToWhatsAppWithPDF;

console.log("Module PDF Manager COMPLET - Distinction claire entre PDF complet et PDF minimal");