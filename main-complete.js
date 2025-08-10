// main-complete.js - Application principale, PDF et event handlers

// ===== GÉNÉRATION PDF =====
function generatePDFPreview() {
  console.log("🎨 Génération de l'aperçu PDF professionnel...");
  
  try {
    const dpNom = $("dp-nom").value || "Non défini";
    const dpDate = $("dp-date").value || "Non définie";
    const dpLieu = $("dp-lieu").value || "Non défini";
    const dpPlongee = $("dp-plongee").value || "matin";
    
    const totalPlongeurs = plongeurs.length + palanquees.reduce((total, pal) => total + pal.length, 0);
    const plongeursEnPalanquees = palanquees.reduce((total, pal) => total + pal.length, 0);
    const alertesTotal = checkAllAlerts();
    
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    }
    
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // CSS styles pour le PDF
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
        .logo-title {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }
        .main-title {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 2px;
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 25px;
        }
        .meta-item {
          background: rgba(255,255,255,0.1);
          padding: 15px;
          border-radius: 8px;
        }
        .meta-label {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .meta-value {
          font-size: 16px;
          font-weight: 500;
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
        .stats-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          border-left: 5px solid #007bff;
        }
        .stat-number {
          font-size: 36px;
          font-weight: bold;
          color: #004080;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 14px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .alerts-section {
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          border-left: 5px solid #dc3545;
        }
        .alerts-title {
          color: #dc3545;
          font-size: 18px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .alert-item {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #dc3545;
        }
        .palanquees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
        }
        .palanquee-card {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 2px solid #e9ecef;
        }
        .palanquee-card.has-alert {
          border-color: #dc3545;
        }
        .palanquee-header {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 20px;
        }
        .palanquee-card.has-alert .palanquee-header {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        }
        .palanquee-number {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .palanquee-stats {
          font-size: 14px;
          opacity: 0.9;
        }
        .palanquee-body { padding: 25px; }
        .plongeur-card {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #28a745;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .plongeur-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        .plongeur-info { flex: 1; }
        .plongeur-nom {
          font-weight: 600;
          color: #004080;
          margin-bottom: 2px;
        }
        .plongeur-details {
          font-size: 12px;
          color: #6c757d;
        }
        .niveau-badge {
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .unassigned-section {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border-radius: 12px;
          padding: 25px;
          border-left: 5px solid #ffc107;
        }
        .unassigned-title {
          color: #856404;
          font-size: 18px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .footer {
          background: #343a40;
          color: white;
          padding: 30px;
          text-align: center;
          margin-top: 50px;
        }
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
        }
      </style>
    `;

    // Construction du HTML
    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    htmlContent += '<div class="container">';
    
    // En-tête
    htmlContent += '<header class="header">';
    htmlContent += '<div class="logo-title">';
    htmlContent += '<div class="logo">🤿</div>';
    htmlContent += '<div>';
    htmlContent += '<h1 class="main-title">PALANQUÉES JSAS</h1>';
    htmlContent += '<p class="subtitle">Organisation Associative de Plongée</p>';
    htmlContent += '</div></div>';
    
    htmlContent += '<div class="meta-grid">';
    htmlContent += '<div class="meta-item"><div class="meta-label">Directeur de Plongée</div><div class="meta-value">' + dpNom + '</div></div>';
    htmlContent += '<div class="meta-item"><div class="meta-label">Date de Plongée</div><div class="meta-value">' + formatDateFrench(dpDate) + '</div></div>';
    htmlContent += '<div class="meta-item"><div class="meta-label">Lieu</div><div class="meta-value">' + dpLieu + '</div></div>';
    htmlContent += '<div class="meta-item"><div class="meta-label">Session</div><div class="meta-value">' + capitalize(dpPlongee) + '</div></div>';
    htmlContent += '</div>';
    htmlContent += '</header>';
    
    // Contenu principal
    htmlContent += '<main class="content">';
    
    // Section statistiques
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Tableau de Bord</h2>';
    htmlContent += '<div class="stats-dashboard">';
    htmlContent += '<div class="stat-card"><div class="stat-number">' + totalPlongeurs + '</div><div class="stat-label">Total Plongeurs</div></div>';
    htmlContent += '<div class="stat-card"><div class="stat-number">' + palanquees.length + '</div><div class="stat-label">Palanquées</div></div>';
    htmlContent += '<div class="stat-card"><div class="stat-number">' + plongeursEnPalanquees + '</div><div class="stat-label">Assignés</div></div>';
    htmlContent += '<div class="stat-card"><div class="stat-number">' + alertesTotal.length + '</div><div class="stat-label">Alertes</div></div>';
    htmlContent += '</div></section>';
    
    // Section alertes
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<div class="alerts-section">';
      htmlContent += '<h3 class="alerts-title">⚠️ Alertes de Sécurité (' + alertesTotal.length + ')</h3>';
      
      alertesTotal.forEach(alerte => {
        htmlContent += '<div class="alert-item">' + alerte + '</div>';
      });
      
      htmlContent += '</div></section>';
    }
    
    // Section palanquées
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">🏊‍♂️ Organisation des Palanquées</h2>';
    
    if (palanquees.length === 0) {
      htmlContent += '<div class="unassigned-section">';
      htmlContent += '<div class="unassigned-title">Aucune palanquée créée</div>';
      htmlContent += '<p>Tous les plongeurs sont en attente d\'assignation.</p>';
      htmlContent += '</div>';
    } else {
      htmlContent += '<div class="palanquees-grid">';
      
      palanquees.forEach((pal, i) => {
        const isAlert = checkAlert(pal);
        const gps = pal.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p.niveau === "N1");
        const autonomes = pal.filter(p => ["N2", "N3"].includes(p.niveau));
        
        htmlContent += '<div class="palanquee-card' + (isAlert ? ' has-alert' : '') + '">';
        htmlContent += '<div class="palanquee-header">';
        htmlContent += '<div class="palanquee-number">Palanquée ' + (i + 1) + '</div>';
        htmlContent += '<div class="palanquee-stats">' + pal.length + ' plongeur' + (pal.length > 1 ? 's' : '') + ' • ' + gps.length + ' GP • ' + n1s.length + ' N1 • ' + autonomes.length + ' Autonomes</div>';
        htmlContent += '</div><div class="palanquee-body">';
        
        if (pal.length === 0) {
          htmlContent += '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun plongeur assigné</p>';
        } else {
          pal.forEach(p => {
            const initiales = p.nom.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
            
            let niveauColor = '#6c757d';
            if (p.niveau === 'N1') niveauColor = '#17a2b8';
            else if (p.niveau === 'N2') niveauColor = '#28a745';
            else if (p.niveau === 'N3') niveauColor = '#ffc107';
            else if (p.niveau === 'N4/GP') niveauColor = '#fd7e14';
            else if (p.niveau === 'E1') niveauColor = '#6f42c1';
            else if (p.niveau === 'E2') niveauColor = '#e83e8c';
            else if (p.niveau === 'E3') niveauColor = '#dc3545';
            else if (p.niveau === 'E4') niveauColor = '#343a40';
            
            htmlContent += '<div class="plongeur-card">';
            htmlContent += '<div class="plongeur-avatar">' + initiales + '</div>';
            htmlContent += '<div class="plongeur-info">';
            htmlContent += '<div class="plongeur-nom">' + p.nom + '</div>';
            htmlContent += '<div class="plongeur-details">' + (p.pre || 'Aucune prérogative') + '</div>';
            htmlContent += '</div>';
            htmlContent += '<div class="niveau-badge" style="background: ' + niveauColor + '">' + p.niveau + '</div>';
            htmlContent += '</div>';
          });
        }
        
        htmlContent += '</div></div>';
      });
      
      htmlContent += '</div>';
    }
    
    htmlContent += '</section>';
    
    // Section plongeurs non assignés
    if (plongeurs.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<div class="unassigned-section">';
      htmlContent += '<h3 class="unassigned-title">⏳ Plongeurs en Attente (' + plongeurs.length + ')</h3>';
      htmlContent += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">';
      
      plongeurs.forEach(p => {
        const initiales = p.nom.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        
        let niveauColor = '#6c757d';
        if (p.niveau === 'N1') niveauColor = '#17a2b8';
        else if (p.niveau === 'N2') niveauColor = '#28a745';
        else if (p.niveau === 'N3') niveauColor = '#ffc107';
        else if (p.niveau === 'N4/GP') niveauColor = '#fd7e14';
        else if (p.niveau === 'E1') niveauColor = '#6f42c1';
        else if (p.niveau === 'E2') niveauColor = '#e83e8c';
        else if (p.niveau === 'E3') niveauColor = '#dc3545';
        else if (p.niveau === 'E4') niveauColor = '#343a40';
        
        htmlContent += '<div class="plongeur-card">';
        htmlContent += '<div class="plongeur-avatar">' + initiales + '</div>';
        htmlContent += '<div class="plongeur-info">';
        htmlContent += '<div class="plongeur-nom">' + p.nom + '</div>';
        htmlContent += '<div class="plongeur-details">' + (p.pre || 'Aucune prérogative') + '</div>';
        htmlContent += '</div>';
        htmlContent += '<div class="niveau-badge" style="background: ' + niveauColor + '">' + p.niveau + '</div>';
        htmlContent += '</div>';
      });
      
      htmlContent += '</div></div></section>';
    }
    
    htmlContent += '</main>';
    
    // Footer
    htmlContent += '<footer class="footer">';
    htmlContent += '<p>Document officiel JSAS - Version 2.1.3 - Généré le ' + new Date().toLocaleDateString('fr-FR') + '</p>';
    htmlContent += '</footer>';
    
    htmlContent += '</div></body></html>';

    // Créer et afficher l'aperçu
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const previewContainer = $("previewContainer");
    const pdfPreview = $("pdfPreview");
    
    if (previewContainer && pdfPreview) {
      previewContainer.style.display = "block";
      pdfPreview.src = url;
      
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF généré");
      
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
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('PALANQUÉES JSAS', margin, 25);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Organisation Associative de Plongée', margin, 35);
    
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
          doc.text('Correction:', margin + 85, yPosition);
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
        doc.text('Prof. prévue:', margin + 5, yPosition);
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.profondeurPrevue + 'm', margin + 25, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 35, yPosition);
          doc.line(margin + 43, yPosition + 1, margin + 53, yPosition + 1);
        } else {
          doc.line(margin + 25, yPosition + 1, margin + 45, yPosition + 1);
          doc.text('m', margin + 47, yPosition);
        }
        
        // Durée prévue
        doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Durée prévue:', margin + 60, yPosition);
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.dureePrevue + 'min', margin + 82, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 95, yPosition);
          doc.line(margin + 103, yPosition + 1, margin + 113, yPosition + 1);
        } else {
          doc.line(margin + 82, yPosition + 1, margin + 102, yPosition + 1);
          doc.text('min', margin + 104, yPosition);
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
          doc.text(pal.profondeurRealisee + 'm', margin + 28, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 38, yPosition);
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 46, yPosition + 1, margin + 56, yPosition + 1);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 28, yPosition + 1, margin + 48, yPosition + 1);
          doc.text('m', margin + 50, yPosition);
        }
        
        // Durée réalisée
        doc.setTextColor(colors.successR, colors.successG, colors.successB);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Durée réalisée:', margin + 60, yPosition);
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          doc.setFont(undefined, 'normal');
          doc.text(pal.dureeRealisee + 'min', margin + 85, yPosition);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
          doc.setFontSize(8);
          doc.text('Corr:', margin + 98, yPosition);
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 106, yPosition + 1, margin + 116, yPosition + 1);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.line(margin + 85, yPosition + 1, margin + 105, yPosition + 1);
          doc.text('min', margin + 107, yPosition);
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
          doc.text('(ex: 3min à 3m)', margin + 122, yPosition);
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
      doc.text('PLONGEURS en ATTENTE (' + plongeurs.length + ')', margin + 5, yPosition + 10);
      
      yPosition += 18;
      
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      for (let i = 0; i < plongeurs.length; i++) {
        const p = plongeurs[i];
        const nomClean = p.nom.replace(/'/g, "'");
        const preClean = p.pre ? p.pre.replace(/'/g, "'") : '';
        const textLine = '• ' + nomClean + ' (' + p.niveau + ')' + (preClean ? ' - ' + preClean : '');
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

// ===== EVENT HANDLERS =====
// Dans main-complete.js, modifiez la fonction setupEventListeners

function setupEventListeners() {
    console.log('🔧 Configuration des écouteurs d\'événements...');

    // Gestionnaire pour le sélecteur de sessions
    const sessionSelect = document.getElementById('session-select');
    if (sessionSelect) {
        sessionSelect.addEventListener('change', function() {
            const selectedSession = this.value;
            console.log('📋 Session sélectionnée:', selectedSession);
            
            if (selectedSession) {
                // Afficher le container de contenu de session
                const sessionContent = document.getElementById('session-content');
                if (sessionContent) {
                    sessionContent.style.display = 'block';
                }
                
                // Vérifier que le container palanquées existe
                let container = document.getElementById('palanquees-container');
                if (!container) {
                    console.log('🔧 Container manquant, création...');
                    createPalanqueesContainer();
                    container = document.getElementById('palanquees-container');
                }
                
                // Afficher un état de chargement
                if (container) {
                    container.innerHTML = '<div class="loading">🔄 Chargement de la session...</div>';
                }
                
                // Charger la session
                if (typeof loadSession === 'function') {
                    loadSession(selectedSession);
                } else {
                    console.error('❌ Fonction loadSession non disponible');
                    if (container) {
                        container.innerHTML = '<div class="error">Erreur: fonction loadSession non trouvée</div>';
                    }
                }
            } else {
                // Masquer le contenu si aucune session sélectionnée
                const sessionContent = document.getElementById('session-content');
                if (sessionContent) {
                    sessionContent.style.display = 'none';
                }
            }
        });
        console.log('✅ Gestionnaire session-select configuré');
    } else {
        console.error('❌ Élément session-select non trouvé');
    }

    // Gestionnaire pour le bouton test Firebase
    const btnTestFirebase = document.getElementById('btn-test-firebase');
    if (btnTestFirebase) {
        btnTestFirebase.addEventListener('click', async function() {
            this.disabled = true;
            this.textContent = 'Test en cours...';
            
            try {
                const isConnected = await testFirebaseConnection();
                this.textContent = isConnected ? '✅ Connexion OK' : '❌ Erreur connexion';
                
                setTimeout(() => {
                    this.textContent = 'Tester Firebase';
                    this.disabled = false;
                }, 3000);
                
            } catch (error) {
                console.error('Erreur test Firebase:', error);
                this.textContent = '❌ Erreur';
                setTimeout(() => {
                    this.textContent = 'Tester Firebase';
                    this.disabled = false;
                }, 3000);
            }
        });
        console.log('✅ Gestionnaire btn-test-firebase configuré');
    }

    // Gestionnaire pour ajouter une palanquée
    const btnAddPalanquee = document.getElementById('btn-add-palanquee');
    if (btnAddPalanquee) {
        btnAddPalanquee.addEventListener('click', function() {
            console.log('➕ Ajout d\'une nouvelle palanquée');
            // TODO: Implémenter l'ajout de palanquée
            alert('Fonctionnalité en cours de développement');
        });
    }

    // Gestionnaire pour exporter la session
    const btnExportSession = document.getElementById('btn-export-session');
    if (btnExportSession) {
        btnExportSession.addEventListener('click', function() {
            console.log('📋 Export de la session');
            // TODO: Implémenter l'export
            alert('Fonctionnalité en cours de développement');
        });
    }
}

// Fonction pour vérifier l'état du DOM
function checkDOMElements() {
    console.log('🔍 Vérification des éléments du DOM:');
    
    const requiredElements = [
        'session-select',
        'palanquees-container',
        'session-content'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            console.log(`✅ ${elementId}: trouvé`);
        } else {
            console.log(`❌ ${elementId}: manquant`);
            missingElements.push(elementId);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn('⚠️ Éléments manquants:', missingElements);
        
        // Créer les éléments manquants si possible
        if (missingElements.includes('palanquees-container')) {
            createPalanqueesContainer();
        }
    }
    
    return missingElements.length === 0;
}

// Initialisation avec vérification
function initializeApp() {
    console.log('🚀 Initialisation de l\'application...');
    
    // Vérifier les éléments DOM
    const domOk = checkDOMElements();
    
    if (domOk) {
        console.log('✅ DOM vérifié, configuration des événements...');
        setupEventListeners();
        console.log('✅ Application initialisée avec succès!');
    } else {
        console.warn('⚠️ DOM incomplet, retry dans 1 seconde...');
        setTimeout(initializeApp, 1000);
    }
}

// Lancement quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Fonction helper pour afficher les erreurs d'authentification
function showAuthError(message) {
  const errorDiv = $("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

// ===== INITIALISATION =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Application Palanquées JSAS v2.1.0 - Chargement...");
  
  try {
    // Initialisation Firebase
    const firebaseInitialized = initializeFirebase();
    
    if (!firebaseInitialized) {
      throw new Error("Échec de l'initialisation Firebase");
    }
    
    // Setup des event listeners (toujours faire ça en premier)
    setupEventListeners();
    
    // Attendre que Firebase Auth soit prêt
    console.log("⏳ Attente de Firebase Auth...");
    
    // Firebase Auth peut prendre du temps, on attend un utilisateur ou un timeout
    const authPromise = new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe(); // Se désabonner après la première réponse
        resolve(user);
      });
    });
    
    // Timeout de 5 secondes maximum
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });
    
    const user = await Promise.race([authPromise, timeoutPromise]);
    
    if (user) {
      console.log("✅ Utilisateur déjà connecté, chargement de l'application...");
      await initializeAppData();
    } else {
      console.log("ℹ️ Pas d'utilisateur connecté, affichage de la connexion");
      showAuthContainer();
    }
    
  } catch (error) {
    console.error("❌ ERREUR CRITIQUE:", error);
    showAuthContainer();
    showAuthError("Erreur d'initialisation de l'application");
  }
});

// Fonction séparée pour initialiser les données de l'application
async function initializeAppData() {
  try {
    // Test de connexion Firebase
    await testFirebaseConnection();
    
    // Définir la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = $("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    // Chargement des infos DP du jour
    try {
      const snapshot = await db.ref(`dpInfo/${today}_matin`).once('value');
      if (snapshot.exists()) {
        const dpData = snapshot.val();
        const dpNomInput = $("dp-nom");
        const dpLieuInput = $("dp-lieu");
        const dpPlongeeInput = $("dp-plongee");
        const dpMessage = $("dp-message");
        
        if (dpNomInput) dpNomInput.value = dpData.nom || "";
        if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
        if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
        if (dpMessage) {
          dpMessage.textContent = "Informations du jour chargées.";
          dpMessage.style.color = "blue";
        }
      }
    } catch (error) {
      console.error("❌ Erreur chargement DP:", error);
    }

    // Chargement historique et données
    console.log("📜 Chargement des données...");
    chargerHistoriqueDP();
    await loadFromFirebase();
    await populateSessionSelector();
    await populateSessionsCleanupList();
    await populateDPCleanupList();
    
    // Vérification du bouton test Firebase
    const testButton = $("test-firebase");
    if (testButton) {
      console.log("✅ Bouton test Firebase trouvé");
    } else {
      console.error("❌ Bouton test Firebase non trouvé dans le DOM");
    }
    
    console.log("✅ Application initialisée!");
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    
  } catch (error) {
    console.error("❌ Erreur initialisation données:", error);
    
    // Mode dégradé
    plongeurs = [];
    palanquees = [];
    plongeursOriginaux = [];
    
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    
    showAuthError("Erreur de chargement des données. Mode local activé.");
  }
}