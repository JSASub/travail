// ===== FONCTIONS PDF =====
function generatePDFPreview() {
  console.log("🎨 Génération de l'aperçu PDF professionnel...");
  
  try {
    const dpNom = $("dp-nom").value || "Non défini";
    const dpDate = $("dp-date").value || "Non définie";
    const dpLieu = $("dp-lieu").value || "Non défini";
    const dpPlongee = $("dp-plongee").value || "matin";
    
    // Calculs statistiques
    const totalPlongeurs = plongeurs.length + palanquees.reduce(function(total, pal) { return total + pal.length; }, 0);
    const plongeursEnPalanquees = palanquees.reduce(function(total, pal) { return total + pal.length; }, 0);
    const alertesTotal = checkAllAlerts();
    
    // Fonction pour formater la date
    function formatDateFrench(dateString) {
      if (!dateString) return "Non définie";
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    }
    
    // Fonction pour capitaliser
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // CSS pour le document
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
          position: relative;
        }
        .header-content { position: relative; z-index: 2; }
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
          position: relative;
        }
        .section-title::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 60px;
          height: 3px;
          background: #28a745;
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
          transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
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
        .stat-detail {
          font-size: 12px;
          color: #28a745;
          margin-top: 5px;
          font-weight: 500;
        }
        .alerts-section {
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          border-left: 5px solid #dc3545;
        }
        .alerts-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          color: #dc3545;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .alert-item {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #dc3545;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          transition: all 0.3s ease;
        }
        .palanquee-card.has-alert {
          border-color: #dc3545;
          box-shadow: 0 8px 25px rgba(220, 53, 69, 0.2);
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
          transition: all 0.3s ease;
        }
        .plongeur-card:hover {
          background: #e9ecef;
          transform: translateX(5px);
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
          text-transform: uppercase;
          letter-spacing: 1px;
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
        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .footer-section h4 {
          color: #007bff;
          margin-bottom: 10px;
        }
        .footer-bottom {
          border-top: 1px solid #495057;
          padding-top: 20px;
          font-size: 12px;
          opacity: 0.8;
        }
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
          .palanquees-grid { grid-template-columns: 1fr 1fr; }
          .stats-dashboard { grid-template-columns: repeat(4, 1fr); }
          .palanquee-card { break-inside: avoid; margin-bottom: 20px; }
        }
        @media (max-width: 768px) {
          .container { margin: 0; box-shadow: none; }
          .header { padding: 20px; }
          .content { padding: 20px; }
          .palanquees-grid { grid-template-columns: 1fr; }
          .stats-dashboard { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    `;

    // Construction du HTML par parties
    let htmlContent = '';
    
    // En-tête du document
    htmlContent += '<!DOCTYPE html>';
    htmlContent += '<html lang="fr">';
    htmlContent += '<head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + ' (' + capitalize(dpPlongee) + ')</title>';
    htmlContent += cssStyles;
    htmlContent += '</head>';
    htmlContent += '<body>';
    
    // Container principal
    htmlContent += '<div class="container">';
    
    // En-tête
    htmlContent += '<header class="header">';
    htmlContent += '<div class="header-content">';
    htmlContent += '<div class="logo-title">';
    htmlContent += '<div class="logo">🤿</div>';
    htmlContent += '<div>';
    htmlContent += '<h1 class="main-title">PALANQUÉES JSAS</h1>';
    htmlContent += '<p class="subtitle">Organisation Associative de Plongée</p>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="meta-grid">';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Directeur de Plongée</div>';
    htmlContent += '<div class="meta-value">' + dpNom + '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Date de Plongée</div>';
    htmlContent += '<div class="meta-value">' + formatDateFrench(dpDate) + '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Lieu</div>';
    htmlContent += '<div class="meta-value">' + dpLieu + '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="meta-item">';
    htmlContent += '<div class="meta-label">Session</div>';
    htmlContent += '<div class="meta-value">' + capitalize(dpPlongee) + '</div>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    
    htmlContent += '</div>';
    htmlContent += '</header>';
    
    // Contenu principal
    htmlContent += '<main class="content">';
    
    // Section statistiques
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Tableau de Bord</h2>';
    htmlContent += '<div class="stats-dashboard">';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + totalPlongeurs + '</div>';
    htmlContent += '<div class="stat-label">Total Plongeurs</div>';
    htmlContent += '<div class="stat-detail">Tous niveaux confondus</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + palanquees.length + '</div>';
    htmlContent += '<div class="stat-label">Palanquées</div>';
    htmlContent += '<div class="stat-detail">Taille moyenne: ' + (palanquees.length > 0 ? (plongeursEnPalanquees / palanquees.length).toFixed(1) : 0) + '</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + plongeursEnPalanquees + '</div>';
    htmlContent += '<div class="stat-label">Assignés</div>';
    htmlContent += '<div class="stat-detail">' + (totalPlongeurs > 0 ? ((plongeursEnPalanquees/totalPlongeurs)*100).toFixed(1) : 0) + '% du total</div>';
    htmlContent += '</div>';
    
    htmlContent += '<div class="stat-card">';
    htmlContent += '<div class="stat-number">' + alertesTotal.length + '</div>';
    htmlContent += '<div class="stat-label">Alertes</div>';
    htmlContent += '<div class="stat-detail">' + (alertesTotal.length === 0 ? 'Tout est OK ✅' : 'Attention requise ⚠️') + '</div>';
    htmlContent += '</div>';
    
    htmlContent += '</div>';
    htmlContent += '</section>';
    
    // Section alertes
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<div class="alerts-section">';
      htmlContent += '<h3 class="alerts-title">';
      htmlContent += '<span>⚠️</span>';
      htmlContent += '<span>Alertes de Sécurité (' + alertesTotal.length + ')</span>';
      htmlContent += '</h3>';
      
      for (let i = 0; i < alertesTotal.length; i++) {
        htmlContent += '<div class="alert-item">' + alertesTotal[i] + '</div>';
      }
      
      htmlContent += '</div>';
      htmlContent += '</section>';
    }
    
    // Section palanquées
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">🏊‍♂️ Organisation des Palanquées</h2>';
    
    if (palanquees.length === 0) {
      htmlContent += '<div class="unassigned-section">';
      htmlContent += '<div class="unassigned-title">Aucune palanquée créée</div>';
      htmlContent += '<p>Tous les plongeurs sont encore en attente d\'assignation.</p>';
      htmlContent += '</div>';
    } else {
      htmlContent += '<div class="palanquees-grid">';
      
      for (let i = 0; i < palanquees.length; i++) {
        const pal = palanquees[i];
        const isAlert = checkAlert(pal);
        const gps = pal.filter(function(p) { return ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau); });
        const n1s = pal.filter(function(p) { return p.niveau === "N1"; });
        const autonomes = pal.filter(function(p) { return ["N2", "N3"].includes(p.niveau); });
        
        htmlContent += '<div class="palanquee-card' + (isAlert ? ' has-alert' : '') + '">';
        htmlContent += '<div class="palanquee-header">';
        htmlContent += '<div class="palanquee-number">Palanquée ' + (i + 1) + '</div>';
        htmlContent += '<div class="palanquee-stats">';
        htmlContent += pal.length + ' plongeur' + (pal.length > 1 ? 's' : '') + ' • ';
        htmlContent += gps.length + ' GP • ' + n1s.length + ' N1 • ' + autonomes.length + ' Autonomes';
        htmlContent += '</div>';
        htmlContent += '</div>';
        htmlContent += '<div class="palanquee-body">';
        
        if (pal.length === 0) {
          htmlContent += '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun plongeur assigné</p>';
        } else {
          for (let j = 0; j < pal.length; j++) {
            const p = pal[j];
            const initiales = p.nom.split(' ').map(function(n) { return n.charAt(0); }).join('').substring(0, 2).toUpperCase();
            
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
            htmlContent += '<div class="plongeur-details">' + (p.pre || 'Aucune prérogative spécifiée') + '</div>';
            htmlContent += '</div>';
            htmlContent += '<div class="niveau-badge" style="background: ' + niveauColor + '">' + p.niveau + '</div>';
            htmlContent += '</div>';
          }
        }
        
        htmlContent += '</div>';
        htmlContent += '</div>';
      }
      
      htmlContent += '</div>';
    }
    
    htmlContent += '</section>';
    
    // Section plongeurs non assignés
    if (plongeurs.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<div class="unassigned-section">';
      htmlContent += '<h3 class="unassigned-title">⏳ Plongeurs en Attente d\'Assignation (' + plongeurs.length + ')</h3>';
      htmlContent += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">';
      
      for (let i = 0; i < plongeurs.length; i++) {
        const p = plongeurs[i];
        const initiales = p.nom.split(' ').map(function(n) { return n.charAt(0); }).join('').substring(0, 2).toUpperCase();
        
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
        htmlContent += '<div class="plongeur-details">' + (p.pre || 'Aucune prérogative spécifiée') + '</div>';
        htmlContent += '</div>';
        htmlContent += '<div class="niveau-badge" style="background: ' + niveauColor + '">' + p.niveau + '</div>';
        htmlContent += '</div>';
      }
      
      htmlContent += '</div>';
      htmlContent += '</div>';
      htmlContent += '</section>';
    }
    
    htmlContent += '</main>';
    
    // Footer
    htmlContent += '<footer class="footer">';
    htmlContent += '<div class="footer-content">';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>📋 Informations Légales</h4>';
    htmlContent += '<p>Document officiel généré par l\'application Palanquées JSAS</p>';
    htmlContent += '<p>Conforme aux standards FFESSM</p>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>🔒 Sécurité</h4>';
    htmlContent += '<p>Vérification des prérogatives obligatoire</p>';
    htmlContent += '<p>Respect des ratios d\'encadrement</p>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>📞 Contact</h4>';
    htmlContent += '<p>JSAS - Club associatif de Plongée</p>';
    htmlContent += '<p>En cas d\'urgence: contacter le DP</p>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-section">';
    htmlContent += '<h4>⚙️ Technique</h4>';
    htmlContent += '<p>Version: 2.1.3 Professional</p>';
    htmlContent += '<p>Dernière mise à jour: ' + new Date().toLocaleDateString('fr-FR') + '</p>';
    htmlContent += '</div>';
    htmlContent += '</div>';
    htmlContent += '<div class="footer-bottom">';
    htmlContent += '<p>Document généré automatiquement le ' + new Date().toLocaleString('fr-FR') + ' • ';
    htmlContent += 'Ne pas modifier manuellement • Valable uniquement avec signature du DP</p>';
    htmlContent += '</div>';
    htmlContent += '</footer>';
    
    htmlContent += '</div>';
    htmlContent += '</body>';
    htmlContent += '</html>';

    // Créer et afficher l'aperçu
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const previewContainer = $("previewContainer");
    const pdfPreview = $("pdfPreview");
    
    if (previewContainer && pdfPreview) {
      previewContainer.style.display = "block";
      pdfPreview.src = url;
      
      // Scroll vers l'aperçu
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF professionnel généré avec succès");
      
      // Nettoyer l'URL après 30 secondes
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 30000);
      
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
  // Bloquer l'export dans les 3 premières secondes
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
    // Créer le document PDF - VERSION COMPATIBLE
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configuration des couleurs (RGB uniquement pour compatibilité)
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
    
    // Fonction pour vérifier les sauts de page
    function checkPageBreak(heightNeeded, forceNewPage) {
      if (forceNewPage || yPosition + heightNeeded > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
        addPageHeader();
        return true;
      }
      return false;
    }
    
    // Fonction pour ajouter un en-tête de page
    function addPageHeader() {
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
        doc.setFontSize(10);
        doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
        doc.text("Palanquées JSAS - " + dpDate + " (" + dpPlongee + ")", margin, 15);
        doc.text("Page " + doc.internal.getCurrentPageInfo().pageNumber, pageWidth - margin - 20, 15);
        yPosition = 25;
      }
    }
    
    // Fonction pour formater la date française - VERSION SIMPLE
    function formatDateFrench(dateString) {
      if (!dateString) return "Non definie";
      const date = new Date(dateString);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('fr-FR', options).replace(/'/g, "'");
    }
    
    // === EN-TÊTE PRINCIPAL - VERSION SIMPLIFIÉE ===
    // Fond d'en-tête
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Titre principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('PALANQUÉES JSAS', margin, 25);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Organisation Associative de Plongée', margin, 35);
    
    // Informations métier
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DP: ' + dpNom.substring(0, 30), margin, 45);
    doc.text('Date: ' + formatDateFrench(dpDate), margin, 52);
    doc.text('Lieu: ' + dpLieu.substring(0, 20) + ' | Session: ' + dpPlongee.toUpperCase(), margin + 100, 52);
    
    yPosition = 75;
    
    // === STATISTIQUES ===
    const totalPlongeurs = plongeurs.length + palanquees.reduce(function(total, pal) { return total + pal.length; }, 0);
    const plongeursEnPalanquees = palanquees.reduce(function(total, pal) { return total + pal.length; }, 0);
    const alertesTotal = checkAllAlerts();
    
    // Titre section
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TABLEAU DE BORD', margin, yPosition);
    
    // Ligne décorative simple
    doc.setDrawColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
    doc.setLineWidth(2);
    doc.line(margin, yPosition + 2, margin + 50, yPosition + 2);
    
    yPosition += 15;
    
    // Statistiques en texte simple (compatible)
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    doc.text('Total plongeurs: ' + totalPlongeurs, margin, yPosition);
    doc.text('                          Palanquées: ' + palanquees.length, margin + 50, yPosition);
    yPosition += 8;
    
    doc.text('Assignés: ' + plongeursEnPalanquees + ' (' + (totalPlongeurs > 0 ? ((plongeursEnPalanquees/totalPlongeurs)*100).toFixed(0) : 0) + '%)', margin, yPosition);
    doc.text('Alertes: ' + alertesTotal.length, margin + 80, yPosition);
    
    yPosition += 15;
    
    // === ALERTES DE SÉCURITÉ ===
    if (alertesTotal.length > 0) {
      checkPageBreak(20 + (alertesTotal.length * 8));
      
      // Encadré d'alerte simple
      doc.setDrawColor(colors.dangerR, colors.dangerG, colors.dangerB);
      doc.setLineWidth(2);
      doc.rect(margin, yPosition, contentWidth, 15 + (plongeurs.length * 6), 'S');
      
      doc.setTextColor(133, 100, 4); // Couleur warning foncée
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
    
    // === FOOTER SIMPLE ===
    const totalPages = doc.internal.getCurrentPageInfo().pageNumber;
    
    // Ajouter footer sur toutes les pages
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      
      // Ligne de séparation
      doc.setDrawColor(colors.grayR, colors.grayG, colors.grayB);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Informations footer
      doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      // Footer principal sur dernière page
      if (pageNum === totalPages) {
        doc.text('Document officiel JSAS - Conforme FFESSM - Version 2.1.3 Pro - RA -', margin, pageHeight - 15);
        doc.text('Genéré le ' + new Date().toLocaleDateString('fr-FR') + ' - Ne pas modifier', margin, pageHeight - 10);
      }
      
      // Numérotation des pages
      doc.text('Page ' + pageNum + '/' + totalPages, pageWidth - margin - 20, pageHeight - 10);
      doc.text(new Date().toLocaleString('fr-FR'), margin, pageHeight - 5);
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '-pro.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF professionnel généré avec succès:", fileName);
    
    // Message de confirmation
    const alertesText = alertesTotal.length > 0 ? '\n⚠️ ' + alertesTotal.length + ' alerte(s) detectee(s)' : '\n✅ Aucune alerte';
    alert('PDF professionnel genere avec succes !\n\n📊 ' + totalPlongeurs + ' plongeurs dans ' + palanquees.length + ' palanquees' + alertesText + '\n\n📁 Fichier: ' + fileName);
    
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF : " + error.message);
  }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
  // Ajout de plongeur
  addSafeEventListener("addForm", "submit", e => {
    e.preventDefault();
    const nom = $("nom").value.trim();
    const niveau = $("niveau").value;
    const pre = $("pre").value.trim();
    if (!nom || !niveau) {
      alert("Veuillez remplir le nom et le niveau du plongeur.");
      return;
    }
    
    const nouveauPlongeur = { nom, niveau, pre };
    plongeurs.push(nouveauPlongeur);
    plongeursOriginaux.push(nouveauPlongeur);
    
    $("nom").value = "";
    $("niveau").value = "";
    $("pre").value = "";
    
    syncToDatabase();
  });

  // Ajout de palanquée
  addSafeEventListener("addPalanquee", "click", () => {
    palanquees.push([]);
    syncToDatabase();
  });

  // Export JSON amélioré
  addSafeEventListener("exportJSON", "click", exportToJSON);

  // Import JSON
  addSafeEventListener("importJSON", "change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      try {
        const data = JSON.parse(e2.target.result);
        
        // Support de l'ancien format ET du nouveau format
        if (data.plongeurs && Array.isArray(data.plongeurs)) {
          // Nouveau format
          plongeurs = data.plongeurs.map(p => ({
            nom: p.nom,
            niveau: p.niveau,
            pre: p.prerogatives || p.pre || ""
          }));
          
          if (data.palanquees && Array.isArray(data.palanquees)) {
            palanquees = data.palanquees.map(pal => 
              pal.plongeurs ? pal.plongeurs.map(p => ({
                nom: p.nom,
                niveau: p.niveau,
                pre: p.prerogatives || p.pre || ""
              })) : pal
            );
          }
        } else if (Array.isArray(data)) {
          // Ancien format (simple array)
          plongeurs = data;
        }
        
        plongeursOriginaux = [...plongeurs];
        syncToDatabase();
        alert("Import réussi !");
      } catch (error) {
        console.error("Erreur import:", error);
        alert("Erreur lors de l'import du fichier JSON");
      }
    };
    reader.readAsText(file);
  });

  // Génération PDF améliorée
  addSafeEventListener("generatePDF", "click", () => {
    generatePDFPreview();
  });

  // Export PDF - NOUVEAU
  addSafeEventListener("exportPDF", "click", () => {
    // Vérifier que la fonction existe
    if (typeof exportToPDF === 'function') {
      exportToPDF();
    } else {
      console.error("❌ Fonction exportToPDF non définie");
      alert("Erreur: Fonction d'export PDF non disponible. Vérifiez le code JavaScript.");
    }
  });

  // Gestionnaire de sessions - NOUVEAU
  addSafeEventListener("load-session", "click", async () => {
    const sessionKey = $("session-selector").value;
    if (!sessionKey) {
      alert("Veuillez sélectionner une session à charger.");
      return;
    }
    
    const success = await loadSession(sessionKey);
    if (!success) {
      alert("Erreur lors du chargement de la session.");
    }
  });
  
  addSafeEventListener("refresh-sessions", "click", async () => {
    console.log("🔄 Actualisation des sessions...");
    await populateSessionSelector();
    await populateSessionsCleanupList();
  });

  // Test Firebase - NOUVEAU
  addSafeEventListener("test-firebase", "click", async () => {
    console.log("🧪 === TEST FIREBASE COMPLET ===");
    
    try {
      // Test 1: Lecture de sessions
      console.log("📖 Test 1: Lecture /sessions");
      const sessionsRead = await db.ref('sessions').once('value');
      console.log("✅ Lecture sessions OK:", sessionsRead.exists() ? "Données trouvées" : "Aucune donnée");
      
      // Test 2: Écriture dans sessions
      console.log("✏️ Test 2: Écriture /sessions/test");
      await db.ref('test').set({
        timestamp: Date.now(),
        test: true
      });
      console.log("✅ Écriture sessions/test OK");
      
      // Test 3: Lecture de ce qu'on vient d'écrire
      console.log("📖 Test 3: Relecture sessions/test");
      const testRead = await db.ref('sessions/test').once('value');
      console.log("✅ Relecture OK:", testRead.val());
      
      // Test 4: Sauvegarde session réelle
      console.log("💾 Test 4: Sauvegarde session réelle");
      await saveSessionData();
      
      // Test 5: Lecture des sessions après sauvegarde
      console.log("📖 Test 5: Lecture sessions après sauvegarde");
      const finalRead = await db.ref('sessions').once('value');
      if (finalRead.exists()) {
        const sessions = finalRead.val();
        console.log("✅ Sessions trouvées:", Object.keys(sessions));
      } else {
        console.log("❌ Aucune session après sauvegarde");
      }
      
      alert("Test Firebase terminé - regarde la console !");
      
    } catch (error) {
      console.error("❌ ERREUR TEST FIREBASE:", error);
      alert("Erreur Firebase: " + error.message);
    }
  });

  // Sauvegarde manuelle de session - NOUVEAU  
  addSafeEventListener("save-session", "click", async () => {
    console.log("💾 Sauvegarde manuelle de session...");
    await saveSessionData();
    alert("Session sauvegardée !");
    await populateSessionSelector();
    await populateSessionsCleanupList();
  });

  // === EVENT LISTENERS POUR LE NETTOYAGE - VERSION SÉCURISÉE ===
  
  // Nettoyage des sessions
  addSafeEventListener("select-all-sessions", "click", () => {
    selectAllSessions(true);
  });
  
  addSafeEventListener("select-none-sessions", "click", () => {
    selectAllSessions(false);
  });
  
  addSafeEventListener("delete-selected-sessions", "click", async () => {
    await deleteSelectedSessions();
  });
  
  addSafeEventListener("refresh-sessions-list", "click", async () => {
    await populateSessionsCleanupList();
  });
  
  // Nettoyage des DPs
  addSafeEventListener("select-all-dp", "click", () => {
    selectAllDPs(true);
  });
  
  addSafeEventListener("select-none-dp", "click", () => {
    selectAllDPs(false);
  });
  
  addSafeEventListener("delete-selected-dp", "click", async () => {
    await deleteSelectedDPs();
  });
  
  addSafeEventListener("refresh-dp-list", "click", async () => {
    await populateDPCleanupList();
  });
  
  // Event delegation pour les changements de sélection
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("session-cleanup-checkbox") || 
        e.target.classList.contains("dp-cleanup-checkbox")) {
      updateCleanupSelection();
    }
    
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      const newPrerogatives = e.target.value.trim();
      
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        palanquees[palanqueeIdx][plongeurIdx].pre = newPrerogatives;
        syncToDatabase();
      }
    }
  });

  // Contrôles de tri
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sortPlongeurs(btn.dataset.sort);
    });
  });

  // Drag & drop amélioré pour la zone principale - VERSION CORRIGÉE
  const listePlongeurs = $("listePlongeurs");
  
  if (listePlongeurs) {
    listePlongeurs.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      listePlongeurs.classList.add('drag-over');
      console.log("🎯 Survol liste principale");
    });
    
    listePlongeurs.addEventListener("dragleave", e => {
      if (!listePlongeurs.contains(e.relatedTarget)) {
        listePlongeurs.classList.remove('drag-over');
        console.log("🎯 Sortie liste principale");
      }
    });
    
    listePlongeurs.addEventListener("drop", e => {
      e.preventDefault();
      listePlongeurs.classList.remove('drag-over');
      
      const data = e.dataTransfer.getData("text/plain");
      console.log("🎯 Drop dans liste principale, data:", data);
      
      try {
        const dragData = JSON.parse(data);
        console.log("📝 Données drag parsées:", dragData);
        
        if (dragData.type === "fromPalanquee") {
          console.log("🔄 Retour d'un plongeur depuis palanquée");
          if (palanquees[dragData.palanqueeIndex] && 
              palanquees[dragData.palanqueeIndex][dragData.plongeurIndex]) {
            
            const plongeur = palanquees[dragData.palanqueeIndex].splice(dragData.plongeurIndex, 1)[0];
            plongeurs.push(plongeur);
            plongeursOriginaux.push(plongeur);
            console.log("✅ Plongeur remis dans la liste:", plongeur.nom);
            syncToDatabase();
          } else {
            console.error("❌ Plongeur non trouvé dans la palanquée source");
          }
        } else {
          console.log("📝 Type de drag non reconnu pour retour en liste");
        }
      } catch (error) {
        console.log("📝 Erreur parsing ou pas un drag depuis palanquée:", error);
      }
    });
  }
}

// ===== INITIALISATION =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Application Palanquées JSAS v2.1.0 - Chargement...");
  
  try {
    // Test de connexion Firebase
    console.log("🔥 Tentative de connexion Firebase...");
    await testFirebaseConnection();
    
    // Définir la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = $("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    // Chargement des infos DP du jour au démarrage
    const dpNomInput = $("dp-nom");
    const dpLieuInput = $("dp-lieu");

    // Tentative de chargement DP depuis Firebase
    console.log("📥 Chargement des données DP...");
    try {
      const snapshot = await db.ref(`dpInfo/${today}_matin`).once('value');
      if (snapshot.exists()) {
        const dpData = snapshot.val();
        console.log("✅ Données DP chargées:", dpData);
        if (dpNomInput) dpNomInput.value = dpData.nom || "";
        if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
        const dpPlongeeInput = $("dp-plongee");
        if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
        const dpMessage = $("dp-message");
        if (dpMessage) {
          dpMessage.textContent = "Informations du jour chargées.";
          dpMessage.style.color = "blue";
        }
      } else {
        console.log("ℹ️ Aucune donnée DP pour aujourd'hui");
      }
    } catch (error) {
      console.error("❌ Erreur de lecture des données DP :", error);
    }

    // Gestionnaire de validation DP
    addSafeEventListener("valider-dp", "click", () => {
      const nomDP = $("dp-nom")?.value?.trim() || "";
      const date = $("dp-date")?.value || "";
      const lieu = $("dp-lieu")?.value?.trim() || "";
      const plongee = $("dp-plongee")?.value || "";
      
      console.log("📝 Validation DP:", nomDP, date, lieu, plongee);

      if (!nomDP || !date || !lieu || !plongee) {
        alert("Veuillez remplir tous les champs du DP.");
        return;
      }

      const dpData = {
        nom: nomDP,
        date: date,
        lieu: lieu,
        plongee: plongee,
        timestamp: Date.now()
      };

      const dpKey = `dpInfo/${date}_${plongee}`;
      
      // Affichage en attente
      const dpMessage = $("dp-message");
      if (dpMessage) {
        dpMessage.textContent = "Enregistrement en cours...";
        dpMessage.style.color = "orange";
      }
      
      db.ref(dpKey).set(dpData)
        .then(() => {
          console.log("✅ Données DP sauvegardées avec succès");
          if (dpMessage) {
            dpMessage.classList.add("success-icon");
            dpMessage.textContent = ` Informations du DP enregistrées avec succès.`;
            dpMessage.style.color = "green";
          }
        })
        .catch((error) => {
          console.error("❌ Erreur Firebase DP:", error);
          if (dpMessage) {
            dpMessage.classList.remove("success-icon");
            dpMessage.textContent = "Erreur lors de l'enregistrement : " + error.message;
            dpMessage.style.color = "red";
          }
        });
    });

    // Chargement de l'historique des DP
    console.log("📜 Chargement historique DP...");
    chargerHistoriqueDP();
    
    // Chargement des données depuis Firebase
    console.log("📊 Chargement des données principales...");
    await loadFromFirebase();
    
    // Charger les sessions disponibles
    console.log("📜 Chargement des sessions...");
    await populateSessionSelector();
    await populateSessionsCleanupList();
    await populateDPCleanupList();
    
    // Setup des event listeners
    console.log("🎛️ Configuration des event listeners...");
    setupEventListeners();
    
    console.log("✅ Application initialisée avec succès!");
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées chargés`);
    console.log(`🔥 Firebase connecté: ${firebaseConnected}`);
    
  } catch (error) {
    console.error("❌ ERREUR CRITIQUE lors de l'initialisation:", error);
    console.error("Stack trace:", error.stack);
    
    // Mode dégradé sans Firebase
    console.log("🔄 Tentative de fonctionnement en mode dégradé...");
    plongeurs = [];
    palanquees = [];
    plongeursOriginaux = [];
    
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    setupEventListeners();
    
    alert("Erreur de connexion Firebase. L'application fonctionne en mode local uniquement.");
  }
});, yPosition, contentWidth, 15 + (alertesTotal.length * 6), 'S');
      
      // Titre alertes
      doc.setTextColor(colors.dangerR, colors.dangerG, colors.dangerB);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('ALERTES DE SÉCURITÉ (' + alertesTotal.length + ')', margin + 5, yPosition + 10);
      
      yPosition += 18;
      
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      for (let i = 0; i < alertesTotal.length; i++) {
        // Nettoyer le texte des alertes
        const alerteClean = alertesTotal[i].replace(/'/g, "'");
        doc.text("• " + alerteClean, margin + 5, yPosition + (i * 6));
      }
      
      yPosition += (alertesTotal.length * 6) + 10;
    }
    
    // === ANALYSE PAR NIVEAU ===
    const statsNiveaux = {};
    const allPlongeurs = plongeurs.concat(palanquees.flat());
    for (let i = 0; i < allPlongeurs.length; i++) {
      const niveau = allPlongeurs[i].niveau;
      statsNiveaux[niveau] = (statsNiveaux[niveau] || 0) + 1;
    }
    
    if (Object.keys(statsNiveaux).length > 0) {
      checkPageBreak(30);
      
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('RÉPARTITION PAR NIVEAU', margin, yPosition);
      yPosition += 12;
      
      const niveauEntries = Object.entries(statsNiveaux).sort(function(a, b) {
        const order = {'N1': 1, 'N2': 2, 'N3': 3, 'N4/GP': 4, 'E1': 5, 'E2': 6, 'E3': 7, 'E4': 8};
        return (order[a[0]] || 9) - (order[b[0]] || 9);
      });
      
      // Tableau simple des niveaux
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      for (let i = 0; i < niveauEntries.length; i++) {
        const entry = niveauEntries[i];
        const niveau = entry[0];
        const count = entry[1];
        const pourcentage = ((count / allPlongeurs.length) * 100).toFixed(1);
        
        doc.setFont(undefined, 'bold');
        doc.text(niveau + ':', margin, yPosition + (i * 8));
        doc.setFont(undefined, 'normal');
        doc.text(count + ' plongeurs (' + pourcentage + '%)', margin + 25, yPosition + (i * 8));
      }
      
      yPosition += (niveauEntries.length * 8) + 15;
    }
    
    // === PALANQUÉES DÉTAILLÉES ===
    checkPageBreak(30, true);
    
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('ORGANISATION DES PALANQUÉES', margin, yPosition);
    yPosition += 15;
    
    if (palanquees.length === 0) {
      // Encadré d'avertissement
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
        const palanqueeHeight = 20 + (pal.length * 6);
        checkPageBreak(palanqueeHeight + 5);
        
        const isAlert = checkAlert(pal);
        
        // En-tête de palanquée - Version simple
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
        
        // Statistiques de la palanquée
        const gps = pal.filter(function(p) { return ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau); });
        const n1s = pal.filter(function(p) { return p.niveau === "N1"; });
        const autonomes = pal.filter(function(p) { return ["N2", "N3"].includes(p.niveau); });
        
        doc.setFontSize(9);
        doc.text('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 8);
        
        yPosition += 18;
        
        // Corps de la palanquée
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
            
            // Ligne du plongeur
            doc.setFont(undefined, 'bold');
            doc.text('• ' + nomClean, margin + 5, yPosition);
            
            doc.setFont(undefined, 'normal');
            
            if (preClean) {
              doc.text('Prérogative: ' + preClean, 100, yPosition);
            }
            
            doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
            doc.text('Niveau: ' + p.niveau + '', 135, yPosition);
            doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
            
            yPosition += 6;
          }
        }
        
        yPosition += 10;
      }
    }
    
    // === PLONGEURS NON ASSIGNÉS ===
    if (plongeurs.length > 0) {
      checkPageBreak(25 + (plongeurs.length * 6));
      
      // Encadré d'avertissement
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(2);
      doc.rect(margin