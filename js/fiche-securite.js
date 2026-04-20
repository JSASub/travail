// ===== FICHE DE SÉCURITÉ RÉGLEMENTAIRE - VERSION FINALE =====

function exportFicheSecurite() {
  if (typeof pageLoadTime !== 'undefined' && Date.now() - pageLoadTime < 3000) {
    console.log("🚫 Export fiche sécurité bloqué - page en cours de chargement");
    return;
  }
  
  console.log("📋 Génération de la Fiche de Sécurité Réglementaire...");
  
  function $(id) {
    const element = document.getElementById(id);
    return element || { value: "" };
  }
  
  const dpSelect = document.getElementById("dp-select");
  const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
  const dpDate = $("dp-date").value || "";
  const dpLieu = $("dp-lieu").value || "";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  try {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      throw new Error("jsPDF non disponible");
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 4;  // Réduit de 6 à 4mm
    
    function formatDateFrench(dateString) {
      if (!dateString) return "";
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('fr-FR');
    }
    
    // Fonction de tri : encadrants d'abord, puis niveau, puis alphabétique
    function trierPlongeurs(palanquee) {
      if (!palanquee || palanquee.length === 0) return palanquee;
      
      return palanquee.slice().sort((a, b) => {
        const aptA = (a.pre || "").toUpperCase();
        const aptB = (b.pre || "").toUpperCase();
        
        // Encadrants (GP, E1-E4) en premier - PAS les PA (Plongeur Autonome)
        const isEncadrantA = /^(GP|E[1-4])$/i.test(aptA);
        const isEncadrantB = /^(GP|E[1-4])$/i.test(aptB);
        
        if (isEncadrantA && !isEncadrantB) return -1;
        if (!isEncadrantA && isEncadrantB) return 1;
        
        // Même catégorie : trier par niveau puis nom
        if (isEncadrantA === isEncadrantB) {
          const nivA = (a.niveau || "").toUpperCase();
          const nivB = (b.niveau || "").toUpperCase();
          if (nivA !== nivB) return nivB.localeCompare(nivA);
          
          const nomA = (a.nom || "").toUpperCase();
          const nomB = (b.nom || "").toUpperCase();
          return nomA.localeCompare(nomB);
        }
        return 0;
      });
    }
    
    const palanqueesLocal = typeof palanquees !== 'undefined' ? 
      palanquees.map(pal => trierPlongeurs(pal)) : [];
    const totalPlongeurs = palanqueesLocal.reduce((total, pal) => total + (pal ? pal.length : 0), 0);
    
    // === FONCTION POUR CRÉER UNE PAGE ===
    function creerPage(pageNum, startIdx, endIdx) {
      let yPos = 12;
      
      if (pageNum === 1) {
        // EN-TÊTE PAGE 1
        const logoImg = document.querySelector('.logo');
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth;
            canvas.height = logoImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(logoImg, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            doc.addImage(dataUrl, 'PNG', margin, yPos, 12, 12);
          } catch (e) {
            console.log("Logo non ajouté:", e);
          }
        }
        
        const xStart = margin + 15;
        doc.setFontSize(9);  // Agrandi de 8 à 9
        doc.setFont(undefined, 'bold');
        doc.text("Nom de l'établissement :", xStart, yPos + 2);
        doc.setFont(undefined, 'normal');
        doc.text("JSA Subaquatique", xStart + 45, yPos + 2);
        
        doc.setFont(undefined, 'bold');
        doc.text("Référence (n° de club, RCS,…) :", xStart, yPos + 7);
        doc.setFont(undefined, 'normal');
        doc.text("02240167", xStart + 52, yPos + 7);
        
        doc.setFontSize(16);  // Agrandi de 14 à 16
        doc.setFont(undefined, 'bold');
        doc.text("FICHE DE SÉCURITÉ", pageWidth / 2, yPos + 2, { align: 'center' });
        doc.setFontSize(9);  // Agrandi de 8 à 9
        doc.text("(art. A322-72 du code du sport et R4461-13 du code du travail)", pageWidth / 2, yPos + 8, { align: 'center' });
        
        doc.setFontSize(9);  // Agrandi de 8 à 9
        doc.setFont(undefined, 'bold');
        doc.text("Date:", pageWidth - margin - 32, yPos + 2);
        doc.setFont(undefined, 'normal');
        doc.text(formatDateFrench(dpDate), pageWidth - margin - 18, yPos + 2);
        
        yPos += 15;
        
        doc.setFontSize(9);  // Agrandi de 8 à 9
        doc.setFont(undefined, 'bold');
        doc.text("Bateau :", margin, yPos);
        doc.text("Matin/A.Midi/Nuit :", 80, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(dpPlongee, 115, yPos);
        
        doc.setFont(undefined, 'bold');
        doc.text("Lieu de plongée :", 150, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(dpLieu.substring(0, 70), 180, yPos);
        
        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text("Pilote :", margin, yPos);
        doc.text("Directeur de plongée :", 80, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(dpNom.substring(0, 50), 115, yPos);
        
        yPos += 5;
        doc.setFont(undefined, 'bold');
        doc.text("Sécurité de surface :", margin, yPos);
        doc.text("Nbre plongeurs :", 150, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(totalPlongeurs.toString(), 180, yPos);
        
        yPos += 8;
      } else {
        // EN-TÊTE PAGE 2
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("FICHE DE SÉCURITÉ (suite)", pageWidth / 2, yPos, { align: 'center' });
        doc.setFontSize(8);
        doc.text(`Date: ${formatDateFrench(dpDate)}`, pageWidth - margin - 30, yPos);
        yPos += 10;
      }
      
      // GRILLE 3x3
      const colWidth = (pageWidth - 2 * margin - 6) / 3;
      const rowHeight = 52;
      const separator = 2;
      const rowSeparator = 3;
      
      doc.setLineWidth(0.1);
      doc.setDrawColor(0, 0, 0);
      
      for (let row = 0; row < 3; row++) {
        const startY = yPos + (row * (rowHeight + rowSeparator));
        
        for (let col = 0; col < 3; col++) {
          const palanqueeIdx = startIdx + row * 3 + col;
          if (palanqueeIdx >= endIdx) continue;
          
          const xBase = margin + col * (colWidth + separator);
          let cellY = startY;
          
          doc.rect(xBase, startY, colWidth, rowHeight);
          
          // Titre
          doc.setFontSize(9);  // Agrandi de 8 à 9
          doc.setFont(undefined, 'bold');
          doc.text(`Palanquée ${palanqueeIdx + 1}`, xBase + 1, cellY + 3);
          doc.line(xBase, cellY + 3.5, xBase + colWidth, cellY + 3.5);
          cellY += 3.5;
          
          // En-têtes - APT 13mm, Niv 12mm
          doc.setFontSize(8);
          const colDesignation = xBase + 1;
          const colNom = xBase + 18;      // NOM (~26mm)
          const colPrenom = xBase + 46;   // PRÉNOM (~26mm)
          const colApt = xBase + 72;      // APT (13mm)
          const colNiv = xBase + 85;      // Niv (12mm jusqu'à la fin)
          
          doc.text("Désignation", colDesignation, cellY + 3.5);
          doc.text("NOM", colNom, cellY + 3.5);
          doc.text("PRÉNOM", colPrenom, cellY + 3.5);
          doc.text("APT", colApt, cellY + 3.5);
          doc.text("Niv", colNiv, cellY + 3.5);
          doc.line(xBase, cellY + 4.5, xBase + colWidth, cellY + 4.5);
          cellY += 4.5;
          
          // Lignes plongeurs
          const lignes = ["Encadrant", "Plongeur 1", "Plongeur 2", "Plongeur 3", "Plongeur 4", "GP suppl."];
          const lineHeight = 4.8;
          
          for (let i = 0; i < lignes.length; i++) {
            doc.setFontSize(7);
            doc.setFont(undefined, 'italic');
            doc.text(lignes[i], colDesignation + 0.5, cellY + 3);
            
            if (palanqueeIdx < palanqueesLocal.length) {
              const pal = palanqueesLocal[palanqueeIdx];
              
              // Déterminer l'index du plongeur à afficher
              let plongeurIndex = i;
              
              // Si ligne Encadrant (i=0) : vérifier s'il y a un vrai encadrant
              if (i === 0 && pal && pal[0]) {
                const premierPlongeur = pal[0];
                const aptPremier = (premierPlongeur.pre || "").toUpperCase();
                const isVraiEncadrant = /^(GP|E[1-4])$/i.test(aptPremier);
                
                // Si le premier n'est pas encadrant, laisser la ligne vide
                if (!isVraiEncadrant) {
                  plongeurIndex = -1; // Ne rien afficher
                }
              } else if (i > 0 && pal && pal[0]) {
                // Pour les lignes Plongeur 1, 2, 3... : vérifier si on doit décaler
                const premierPlongeur = pal[0];
                const aptPremier = (premierPlongeur.pre || "").toUpperCase();
                const isVraiEncadrant = /^(GP|E[1-4])$/i.test(aptPremier);
                
                // Si pas d'encadrant, décaler : Plongeur 1 = index[0], Plongeur 2 = index[1], etc.
                if (!isVraiEncadrant) {
                  plongeurIndex = i - 1;
                }
              }
              
              // Afficher le plongeur si l'index est valide
              if (plongeurIndex >= 0 && pal && pal[plongeurIndex]) {
                const plongeur = pal[plongeurIndex];
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8.5);  // Agrandi de 7.5 à 8.5
                
                const nomComplet = plongeur.nom || "";
                const aptitude = plongeur.pre || "";
                const niveau = plongeur.niveau || "";
                
                const parts = nomComplet.trim().split(/\s+/);
                let nom = "", prenom = "";
                if (parts.length >= 2) {
                  nom = parts[0].substring(0, 16);
                  prenom = parts.slice(1).join(" ").substring(0, 16);
                } else {
                  nom = nomComplet.substring(0, 16);
                }
                
                doc.text(nom, colNom + 0.5, cellY + 3);
                doc.text(prenom, colPrenom + 0.5, cellY + 3);
                doc.text(aptitude.substring(0, 8), colApt + 0.5, cellY + 3);
                doc.text(niveau.substring(0, 7), colNiv + 0.5, cellY + 3);
              }
            }
            
            doc.line(xBase, cellY + lineHeight, xBase + colWidth, cellY + lineHeight);
            doc.line(xBase + 16, cellY, xBase + 16, cellY + lineHeight);
            doc.line(xBase + 44, cellY, xBase + 44, cellY + lineHeight);
            doc.line(xBase + 70, cellY, xBase + 70, cellY + lineHeight);
            doc.line(xBase + 83, cellY, xBase + 83, cellY + lineHeight);
            
            cellY += lineHeight;
          }
          
          // Paramètres
          doc.setFontSize(7.5);  // Agrandi de 6.5 à 7.5
          doc.setFont(undefined, 'bold');
          const colParam = xBase + 1;
          const colDuree = xBase + 22;
          const colProf = xBase + 38;
          const colHeau = xBase + 50;
          
          doc.text("Paramètres", colParam, cellY + 3);
          doc.text("Durée", colDuree, cellY + 3);
          doc.text("Prof.", colProf, cellY + 3);
          doc.text("H. eau", colHeau, cellY + 3);
          doc.line(xBase, cellY + 3.5, xBase + colWidth, cellY + 3.5);
          cellY += 3.5;
          
          // Prévus
          doc.text("Prévus", colParam, cellY + 3);
          doc.line(xBase, cellY + 3.5, xBase + colWidth, cellY + 3.5);
          doc.line(xBase + 20, cellY, xBase + 20, cellY + 3.5);
          doc.line(xBase + 36, cellY, xBase + 36, cellY + 3.5);
          doc.line(xBase + 48, cellY, xBase + 48, cellY + 3.5);
          cellY += 3.5;
          
          // Réalisés - TRAITS RALLONGÉS
          const realiseHeight = 5.5;
          doc.text("Réalisés", colParam, cellY + 3.5);
          const bottomY = cellY + realiseHeight;
          doc.line(xBase + 20, cellY, xBase + 20, bottomY);
          doc.line(xBase + 36, cellY, xBase + 36, bottomY);
          doc.line(xBase + 48, cellY, xBase + 48, bottomY);
        }
      }
    }
    
    // PAGE 1 : Palanquées 1-9
    creerPage(1, 0, 9);
    
    // PAGE 2 : Palanquées 10-18
    doc.addPage();
    creerPage(2, 9, 18);
    
    const dateStr = formatDateFrench(dpDate).replace(/\//g, '-');
    doc.save(`Fiche_Securite_JSAS_${dateStr}.pdf`);
    
    console.log("✅ Fiche de sécurité réglementaire générée");
    
  } catch (error) {
    console.error("❌ Erreur génération fiche sécurité:", error);
    alert("Erreur lors de la génération de la fiche de sécurité: " + error.message);
  }
}

window.exportFicheSecurite = exportFicheSecurite;
console.log("📋 Module Fiche de Sécurité Réglementaire chargé");