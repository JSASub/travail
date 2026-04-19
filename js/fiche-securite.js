// ===== FICHE DE SÉCURITÉ RÉGLEMENTAIRE - MODULE SÉPARÉ =====
// À charger après pdf-manager.js

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
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    
    // Fonction pour formater la date
    function formatDateFrench(dateString) {
      if (!dateString) return "";
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('fr-FR');
    }
    
    // Récupérer les palanquées
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    const totalPlongeurs = palanqueesLocal.reduce((total, pal) => total + (pal ? pal.length : 0), 0);
    
    let yPos = 12;
    
    // === EN-TÊTE ===
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text("Nom de l'établissement d'APS :", margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text("JSA Subaquatique", margin + 52, yPos);
    
    // Titre centré
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("FICHE DE SÉCURITÉ", pageWidth / 2, yPos, { align: 'center' });
    doc.setFontSize(7);
    doc.text("(art. A322-72 du code du sport et R4461-13 du code du travail)", pageWidth / 2, yPos + 4, { align: 'center' });
    
    // Date à droite
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text("Date:", pageWidth - margin - 35, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(formatDateFrench(dpDate), pageWidth - margin - 20, yPos);
    
    yPos += 7;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text("Référence (n° de club, RCS,…) :", margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text("02240167", margin + 52, yPos);
    
    yPos += 8;
    
    // === INFORMATIONS GÉNÉRALES ===
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text("Bateau :", margin, yPos);
    doc.text("Matin/A.Midi/Nuit :", pageWidth - margin - 65, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(dpPlongee, pageWidth - margin - 28, yPos);
    
    yPos += 5;
    doc.setFont(undefined, 'bold');
    doc.text("Pilote :", margin, yPos);
    doc.text("Lieu de plongée :", pageWidth - margin - 65, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(dpLieu.substring(0, 25), pageWidth - margin - 28, yPos);
    
    yPos += 5;
    doc.setFont(undefined, 'bold');
    doc.text("Directeur de plongée :", margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(dpNom.substring(0, 35), margin + 37, yPos);
    
    yPos += 5;
    doc.setFont(undefined, 'bold');
    doc.text("Sécurité de surface :", margin, yPos);
    doc.text("Nbre plongeurs :", pageWidth - margin - 65, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(totalPlongeurs.toString(), pageWidth - margin - 28, yPos);
    
    yPos += 8;
    
    // === GRILLE DES PALANQUÉES (3 colonnes x 3 rangées = 9 palanquées) ===
    const colWidth = (pageWidth - 2 * margin) / 3;
    const rowHeight = 62;
    
    for (let row = 0; row < 3; row++) {
      const startY = yPos + (row * rowHeight);
      
      for (let col = 0; col < 3; col++) {
        const palanqueeIdx = row * 3 + col;
        const xBase = margin + col * colWidth;
        let cellY = startY;
        
        // Bordure extérieure du bloc palanquée
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(xBase, startY, colWidth, rowHeight);
        
        // En-tête : NOM | PRÉNOM | APT | Niv
        doc.setFontSize(6);
        doc.setFont(undefined, 'bold');
        doc.text("NOM", xBase + 2, cellY + 3);
        doc.text("PRÉNOM", xBase + 15, cellY + 3);
        doc.text("APT", xBase + 30, cellY + 3);
        doc.text("Niv", xBase + 38, cellY + 3);
        
        doc.line(xBase, cellY + 4, xBase + colWidth, cellY + 4);
        cellY += 4;
        
        // Lignes de plongeurs
        const lignes = ["Encadrant", "Plongeur 1", "Plongeur 2", "Plongeur 3", "Plongeur 4", "GP suppl."];
        const lineHeight = 5;
        
        for (let i = 0; i < lignes.length; i++) {
          doc.setFontSize(5);
          doc.setFont(undefined, 'bold');
          doc.text(lignes[i], xBase + 1, cellY + 3);
          
          if (palanqueeIdx < palanqueesLocal.length) {
            const pal = palanqueesLocal[palanqueeIdx];
            if (pal && pal[i]) {
              const plongeur = pal[i];
              doc.setFont(undefined, 'normal');
              doc.setFontSize(5);
              doc.text((plongeur.nom || "").substring(0, 10), xBase + 2, cellY + 3);
              doc.text((plongeur.pre || "").substring(0, 8), xBase + 15, cellY + 3);
              doc.text((plongeur.niveau || ""), xBase + 38, cellY + 3);
            }
          }
          
          doc.line(xBase, cellY + lineHeight, xBase + colWidth, cellY + lineHeight);
          doc.line(xBase + 14, cellY, xBase + 14, cellY + lineHeight);
          doc.line(xBase + 29, cellY, xBase + 29, cellY + lineHeight);
          doc.line(xBase + 37, cellY, xBase + 37, cellY + lineHeight);
          
          cellY += lineHeight;
        }
        
        // Section Paramètres
        doc.setFontSize(5);
        doc.setFont(undefined, 'bold');
        doc.text("Paramètres", xBase + 1, cellY + 3);
        doc.text("Durée", xBase + 15, cellY + 3);
        doc.text("Prof.", xBase + 26, cellY + 3);
        doc.text("H. eau", xBase + 35, cellY + 3);
        doc.line(xBase, cellY + 4, xBase + colWidth, cellY + 4);
        cellY += 4;
        
        // Prévus
        doc.setFont(undefined, 'bold');
        doc.text("Prévus", xBase + 1, cellY + 3);
        if (palanqueeIdx < palanqueesLocal.length) {
          const params = palanqueesLocal[palanqueeIdx]?.parametres || {};
          doc.setFont(undefined, 'normal');
          doc.text((params.dureePrevue || ""), xBase + 15, cellY + 3);
          doc.text((params.profondeurPrevue || ""), xBase + 26, cellY + 3);
          doc.text((params.horaire || ""), xBase + 35, cellY + 3);
        }
        doc.line(xBase, cellY + 4, xBase + colWidth, cellY + 4);
        doc.line(xBase + 14, cellY, xBase + 14, cellY + 4);
        doc.line(xBase + 25, cellY, xBase + 25, cellY + 4);
        doc.line(xBase + 34, cellY, xBase + 34, cellY + 4);
        cellY += 4;
        
        // Réalisés
        doc.setFont(undefined, 'bold');
        doc.text("Réalisés", xBase + 1, cellY + 3);
        if (palanqueeIdx < palanqueesLocal.length) {
          const params = palanqueesLocal[palanqueeIdx]?.parametres || {};
          doc.setFont(undefined, 'normal');
          doc.text((params.dureeRealisee || ""), xBase + 15, cellY + 3);
          doc.text((params.profondeurRealisee || ""), xBase + 26, cellY + 3);
        }
        doc.line(xBase + 14, cellY, xBase + 14, cellY + 4);
        doc.line(xBase + 25, cellY, xBase + 25, cellY + 4);
        doc.line(xBase + 34, cellY, xBase + 34, cellY + 4);
      }
    }
    
    // === BAS DE PAGE - LÉGENDES ===
    yPos = pageHeight - 28;
    doc.setFontSize(5);
    doc.setFont(undefined, 'normal');
    const legendes = [
      "1 : Fiche établie à l'issue de chaque activité de plongée et conservée pendant 1 an par le directeur de plongée.",
      "2 : Nom et niveau de la personne assurant la sécurité de surface.",
      "3 : Nom du site de plongée.",
      "4 : Nom, prénom et aptitude de l'encadrant. Un Guide de Palanquée supplémentaire peut compléter l'encadrement.",
      "5 : Aptitude : PE-60, PE-40, PE-20, PE-12, PA-60, PA-40, PA-20, PA-12 (ou ancien Niveau 1, 2, 3, 4).",
      "6 : Par exemple : 15 mn - palier 3 mn à 3 m.",
      "7 : À remplir à l'issue de la plongée."
    ];
    
    legendes.forEach((legende, idx) => {
      doc.text(legende, margin, yPos + (idx * 3.5));
    });
    
    // Sauvegarder
    const dateStr = formatDateFrench(dpDate).replace(/\//g, '-');
    doc.save(`Fiche_Securite_JSAS_${dateStr}.pdf`);
    
    console.log("✅ Fiche de sécurité réglementaire générée");
    
  } catch (error) {
    console.error("❌ Erreur génération fiche sécurité:", error);
    alert("Erreur lors de la génération de la fiche de sécurité: " + error.message);
  }
}

// Export de la fonction
window.exportFicheSecurite = exportFicheSecurite;
console.log("📋 Module Fiche de Sécurité Réglementaire chargé");