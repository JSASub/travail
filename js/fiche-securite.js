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
      orientation: 'landscape',  // FORMAT PAYSAGE
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 297;  // A4 paysage : 297mm x 210mm
    const pageHeight = 210;
    const margin = 10;
    
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
    
    // Charger le logo
    const logoImg = document.querySelector('.logo, img[src*="logo"]');
    let yPos = 12;
    
    // Ajouter le logo si disponible
    if (logoImg && logoImg.complete) {
      try {
        doc.addImage(logoImg, 'PNG', margin, yPos, 12, 12);
      } catch (e) {
        console.log("Logo non ajouté:", e);
      }
    }
    
    // === EN-TÊTE ===
    const xStart = margin + 15;
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text("Nom de l'établissement d'APS :", xStart, yPos + 2);
    doc.setFont(undefined, 'normal');
    doc.text("JSA Subaquatique", xStart + 52, yPos + 2);
    
    doc.setFont(undefined, 'bold');
    doc.text("Référence (n° de club, RCS,…) :", xStart, yPos + 7);
    doc.setFont(undefined, 'normal');
    doc.text("02240167", xStart + 52, yPos + 7);
    
    // Titre centré
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("FICHE DE SÉCURITÉ", pageWidth / 2, yPos + 2, { align: 'center' });
    doc.setFontSize(7);
    doc.text("(art. A322-72 du code du sport et R4461-13 du code du travail)", pageWidth / 2, yPos + 8, { align: 'center' });
    
    // Date à droite
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text("Date:", pageWidth - margin - 32, yPos + 2);
    doc.setFont(undefined, 'normal');
    doc.text(formatDateFrench(dpDate), pageWidth - margin - 18, yPos + 2);
    
    yPos += 15;
    
    // === INFORMATIONS GÉNÉRALES ===
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.text("Bateau :", margin, yPos);
    doc.text("Matin/A.Midi/Nuit :", 80, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(dpPlongee, 115, yPos);
    
    doc.setFont(undefined, 'bold');
    doc.text("Lieu de plongée :", 150, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(dpLieu.substring(0, 50), 180, yPos);
    
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
    
    // === GRILLE DES PALANQUÉES (3 colonnes x 3 rangées = 9 palanquées) ===
    const colWidth = (pageWidth - 2 * margin) / 3;
    const rowHeight = 48;
    
    // Traits fins
    doc.setLineWidth(0.1);
    doc.setDrawColor(0, 0, 0);
    
    for (let row = 0; row < 3; row++) {
      const startY = yPos + (row * rowHeight);
      
      for (let col = 0; col < 3; col++) {
        const palanqueeIdx = row * 3 + col;
        const xBase = margin + col * colWidth;
        let cellY = startY;
        
        // Bordure extérieure du bloc palanquée
        doc.rect(xBase, startY, colWidth, rowHeight);
        
        // En-tête : NOM | PRÉNOM | APT | Niv
        doc.setFontSize(6);
        doc.setFont(undefined, 'bold');
        doc.text("NOM", xBase + 2, cellY + 3.5);
        doc.text("PRÉNOM", xBase + 22, cellY + 3.5);
        doc.text("APT", xBase + 42, cellY + 3.5);
        doc.text("Niv", xBase + 50, cellY + 3.5);
        
        doc.line(xBase, cellY + 4.5, xBase + colWidth, cellY + 4.5);
        cellY += 4.5;
        
        // Lignes de plongeurs
        const lignes = ["Encadrant", "Plongeur 1", "Plongeur 2", "Plongeur 3", "Plongeur 4", "GP suppl."];
        const lineHeight = 4.8;
        
        for (let i = 0; i < lignes.length; i++) {
          doc.setFontSize(5.5);
          doc.setFont(undefined, 'bold');
          doc.text(lignes[i], xBase + 1, cellY + 3);
          
          if (palanqueeIdx < palanqueesLocal.length) {
            const pal = palanqueesLocal[palanqueeIdx];
            if (pal && pal[i]) {
              const plongeur = pal[i];
              doc.setFont(undefined, 'normal');
              doc.setFontSize(5.5);
              doc.text((plongeur.nom || "").substring(0, 12), xBase + 2, cellY + 3);
              doc.text((plongeur.pre || "").substring(0, 10), xBase + 22, cellY + 3);
              doc.text((plongeur.niveau || ""), xBase + 50, cellY + 3);
            }
          }
          
          doc.line(xBase, cellY + lineHeight, xBase + colWidth, cellY + lineHeight);
          doc.line(xBase + 20, cellY, xBase + 20, cellY + lineHeight);
          doc.line(xBase + 40, cellY, xBase + 40, cellY + lineHeight);
          doc.line(xBase + 48, cellY, xBase + 48, cellY + lineHeight);
          
          cellY += lineHeight;
        }
        
        // Section Paramètres
        doc.setFontSize(5.5);
        doc.setFont(undefined, 'bold');
        doc.text("Paramètres", xBase + 1, cellY + 3);
        doc.text("Durée", xBase + 22, cellY + 3);
        doc.text("Prof.", xBase + 35, cellY + 3);
        doc.text("H. eau", xBase + 48, cellY + 3);
        doc.line(xBase, cellY + 3.5, xBase + colWidth, cellY + 3.5);
        cellY += 3.5;
        
        // Prévus
        doc.setFont(undefined, 'bold');
        doc.text("Prévus", xBase + 1, cellY + 3);
        if (palanqueeIdx < palanqueesLocal.length) {
          const params = palanqueesLocal[palanqueeIdx]?.parametres || {};
          doc.setFont(undefined, 'normal');
          doc.text((params.dureePrevue || ""), xBase + 22, cellY + 3);
          doc.text((params.profondeurPrevue || ""), xBase + 35, cellY + 3);
          doc.text((params.horaire || ""), xBase + 48, cellY + 3);
        }
        doc.line(xBase, cellY + 3.5, xBase + colWidth, cellY + 3.5);
        doc.line(xBase + 20, cellY, xBase + 20, cellY + 3.5);
        doc.line(xBase + 33, cellY, xBase + 33, cellY + 3.5);
        doc.line(xBase + 46, cellY, xBase + 46, cellY + 3.5);
        cellY += 3.5;
        
        // Réalisés
        doc.setFont(undefined, 'bold');
        doc.text("Réalisés", xBase + 1, cellY + 3);
        if (palanqueeIdx < palanqueesLocal.length) {
          const params = palanqueesLocal[palanqueeIdx]?.parametres || {};
          doc.setFont(undefined, 'normal');
          doc.text((params.dureeRealisee || ""), xBase + 22, cellY + 3);
          doc.text((params.profondeurRealisee || ""), xBase + 35, cellY + 3);
        }
        doc.line(xBase + 20, cellY, xBase + 20, cellY + 3.5);
        doc.line(xBase + 33, cellY, xBase + 33, cellY + 3.5);
        doc.line(xBase + 46, cellY, xBase + 46, cellY + 3.5);
      }
    }
    
    // === BAS DE PAGE - LÉGENDES ===
    yPos = pageHeight - 20;
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
      doc.text(legende, margin, yPos + (idx * 2.8));
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