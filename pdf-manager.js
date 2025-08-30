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
        
        /* Barre de commandes */
        .command-bar {
          position: fixed;
          top: 20px;
          right: 80px;
          display: flex;
          gap: 8px;
          z-index: 1000;
          flex-wrap: wrap;
          max-width: 300px;
        }
        
        .command-button {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 3px 8px rgba(0, 123, 255, 0.3);
          transition: all 0.3s ease;
          min-width: 60px;
          white-space: nowrap;
        }
        
        .command-button:hover {
          background: #0056b3;
          transform: translateY(-2px);
        }
        
        .command-button.success {
          background: #28a745;
        }
        
        .command-button.success:hover {
          background: #1e7e34;
        }
        
        .command-button.warning {
          background: #ffc107;
          color: #212529;
        }
        
        .command-button.warning:hover {
          background: #e0a800;
        }
        
        .command-button.info {
          background: #17a2b8;
        }
        
        .command-button.info:hover {
          background: #117a8b;
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
        
        /* Responsive Design pour Mobile */
        @media screen and (max-width: 768px) {
          .command-bar {
            top: 70px !important;
            right: 10px !important;
            left: 10px !important;
            justify-content: center !important;
            max-width: none !important;
          }
          
          .command-button {
            font-size: 10px !important;
            padding: 6px 10px !important;
            min-width: 50px !important;
          }
          
          .container {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
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
          .close-button {
            width: 45px !important;
            height: 45px !important;
            font-size: 18px !important;
            top: 15px !important;
            right: 15px !important;
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
          .close-button {
            width: 40px !important;
            height: 40px !important;
            font-size: 16px !important;
            top: 10px !important;
            right: 10px !important;
          }
        }
        
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
          .close-button, .command-bar { display: none !important; }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    // Ajout de la barre de commandes
    htmlContent += '<div class="command-bar">';
    htmlContent += '<button class="command-button" onclick="parent.printPDFPreview()">🖨️ Print</button>';
    htmlContent += '<button class="command-button success" onclick="parent.savePreviewDirectToPDF()">📄 PDF</button>';
    htmlContent += '<button class="command-button warning" onclick="parent.downloadPreviewHTML()">📄 HTML</button>';

    htmlContent += '</div>';
    
    // Bouton de fermeture existant
    htmlContent += '<button class="close-button" onclick="parent.closePDFPreview()" title="Fermer l\'aperçu">✕</button>';
    
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
    htmlContent += '<p>Assignés: ' + plongeursEnPalanquees + ' (' + (totalPlongeurs > 0 ? ((plongeursEnPalanquees/totalPlongeurs)*100).toFixed(0) : 0) + '%)</p>';
    htmlContent += '<p>Alertes: ' + alertesTotal.length + '</p>';
    htmlContent += '</section>';
    
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">⚠️ Alertes de Sécurité</h2>';
      alertesTotal.forEach(alerte => {
        htmlContent += '<p style="color: #dc3545; font-weight: bold;">• ' + alerte + '</p>';
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">🏊‍♂️ Palanquées</h2>';
    
    if (palanqueesLocal.length === 0) {
      htmlContent += '<p>Aucune palanquée créée - Tous les plongeurs en attente</p>';
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
            // Trier les plongeurs par grade avant affichage
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
      
      // Trier aussi les plongeurs en attente par grade
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
      pdfPreview.srcdoc = htmlContent; // Utiliser srcdoc pour que les fonctions parent.* marchent
      
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF généré avec tri par grade et barre de commandes");
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