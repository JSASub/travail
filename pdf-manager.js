// pdf-manager.js - Gestion complète des PDF avec corrections

// ===== EXPORT PDF SÉCURISÉ =====
function exportToPDF() {
  // Vérifier que pageLoadTime existe
  if (typeof pageLoadTime !== 'undefined' && Date.now() - pageLoadTime < 3000) {
    console.log('⏳ Page récemment chargée, attente...');
    setTimeout(exportToPDF, 2000);
    return;
  }

  try {
    console.log('📊 DÉBUT exportToPDF()');
    
    // Récupération sécurisée des données
    const donnees = recupererDonneesSafe();
    
    if (!donnees.plongeurs || !donnees.palanquees) {
      console.error('❌ Données manquantes pour l\'export PDF');
      return;
    }

    console.log(`✅ Données récupérées: ${donnees.plongeurs.length} plongeurs, ${donnees.palanquees.length} palanquées`);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuration des polices et couleurs
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.setTextColor(0, 100, 150);

    // En-tête du document
    const maintenant = new Date().toLocaleDateString('fr-FR');
    doc.text(`📋 Aperçu des Palanquées - ${maintenant}`, 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPosition = 40;

    // Section Statistiques
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 150);
    doc.text('📊 Statistiques:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`• Nombre total de plongeurs: ${donnees.plongeurs.length}`, 25, yPosition);
    yPosition += 8;
    doc.text(`• Nombre de palanquées formées: ${donnees.palanquees.length}`, 25, yPosition);
    yPosition += 15;

    // Section Palanquées
    if (donnees.palanquees && donnees.palanquees.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 100, 150);
      doc.text('🤿 Composition des Palanquées:', 20, yPosition);
      yPosition += 15;

      donnees.palanquees.forEach((palanquee, index) => {
        // Vérifier l'espace disponible
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Palanquée ${index + 1}:`, 25, yPosition);
        yPosition += 8;

        const membres = palanquee.plongeurs || palanquee.membres || [];
        if (membres.length > 0) {
          membres.forEach(plongeur => {
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 20;
            }
            const nom = plongeur.nom || plongeur.name || 'Nom non défini';
            const niveau = plongeur.niveau || plongeur.level || 'N/A';
            doc.text(`  • ${nom} (${niveau})`, 30, yPosition);
            yPosition += 6;
          });
        } else {
          doc.text('  • Aucun membre assigné', 30, yPosition);
          yPosition += 6;
        }
        yPosition += 5;
      });
    }

    // Section Plongeurs non assignés
    yPosition += 10;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(150, 100, 0);
    doc.text('👤 Plongeurs disponibles:', 20, yPosition);
    yPosition += 15;

    if (donnees.plongeurs && donnees.plongeurs.length > 0) {
      donnees.plongeurs.forEach(plongeur => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        const nom = plongeur.nom || plongeur.name || 'Nom non défini';
        const niveau = plongeur.niveau || plongeur.level || 'N/A';
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`• ${nom} - Niveau: ${niveau}`, 25, yPosition);
        yPosition += 8;
      });
    } else {
      doc.text('Aucun plongeur disponible', 25, yPosition);
    }

    // Pied de page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${maintenant} - Page ${i}/${totalPages}`, 20, 290);
    }

    // Génération du nom de fichier
    const timestamp = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const nomFichier = `palanquees-jsas-${timestamp}.pdf`;

    // Sauvegarde
    doc.save(nomFichier);
    
    console.log(`✅ PDF généré avec succès: ${nomFichier}`);
    
    // Notification à l'utilisateur
    if (typeof showNotification === 'function') {
      showNotification(`📊 PDF généré: ${nomFichier}`, 'success');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Erreur lors de la génération du PDF', 'error');
    }
  }
}

// ===== FONCTION DE RÉCUPÉRATION SÉCURISÉE =====
function recupererDonneesSafe() {
  console.log('🔍 === RÉCUPÉRATION SÉCURISÉE DES DONNÉES ===');
  
  let plongeursData = [];
  let palanqueesData = [];

  try {
    // === DEBUG PLONGEURS ===
    console.log('=== DEBUG PLONGEURS ===');
    
    if (typeof window.parent !== 'undefined' && window.parent.plongeurs) {
      console.log('window.parent.plongeurs existe:', typeof window.parent.plongeurs);
      console.log('window.parent.plongeurs valeur:', window.parent.plongeurs);
      
      const plongeursVar = window.parent.plongeurs;
      console.log('plongeursData type:', typeof plongeursVar);
      console.log('plongeursData isArray:', Array.isArray(plongeursVar));
      console.log('plongeursData length:', plongeursVar.length);
      
      if (Array.isArray(plongeursVar)) {
        plongeursData = plongeursVar;
        console.log('✅ Plongeurs récupérés comme tableau:', plongeursData.length);
      } else if (plongeursVar && typeof plongeursVar === 'object') {
        plongeursData = Object.values(plongeursVar);
        console.log('✅ Plongeurs convertis depuis objet:', plongeursData.length);
      }
    }

    // === DEBUG PALANQUÉES ===
    console.log('=== DEBUG PALANQUÉES ===');
    
    if (typeof window.parent !== 'undefined' && window.parent.palanquees) {
      console.log('window.parent.palanquees existe:', typeof window.parent.palanquees);
      console.log('window.parent.palanquees valeur:', window.parent.palanquees);
      
      const palanqueesVar = window.parent.palanquees;
      console.log('palanqueesData type:', typeof palanqueesVar);
      console.log('palanqueesData isArray:', Array.isArray(palanqueesVar));
      console.log('palanqueesData length:', palanqueesVar.length);
      
      if (Array.isArray(palanqueesVar)) {
        palanqueesData = palanqueesVar;
        console.log('✅ Palanquées récupérées comme tableau:', palanqueesData.length);
      } else if (palanqueesVar && typeof palanqueesVar === 'object' && !palanqueesVar.nodeType) {
        palanqueesData = Object.values(palanqueesVar);
        console.log('✅ Palanquées converties depuis objet:', palanqueesData.length);
      }
    }

    // === EXPLORATION APPROFONDIE ===
    if ((plongeursData.length === 0 || palanqueesData.length === 0) && typeof window.parent !== 'undefined') {
      console.log('=== EXPLORATION APPROFONDIE DES VARIABLES ===');
      explorerWindowParent();
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error);
  }

  console.log('📊 RÉSULTAT FINAL:');
  console.log('Plongeurs récupérés:', plongeursData.length);
  console.log('Palanquées récupérées:', palanqueesData.length);

  return {
    plongeurs: plongeursData,
    palanquees: palanqueesData
  };
}

// ===== EXPLORATION COMPLÈTE DE WINDOW.PARENT =====
function explorerWindowParent() {
  console.log('🔍 EXPLORATION COMPLÈTE de window.parent');
  
  try {
    const parent = window.parent;
    const variables = Object.keys(parent).filter(key => {
      try {
        const value = parent[key];
        return value && 
               typeof value === 'object' && 
               !value.nodeType && // Exclure les éléments DOM
               (Array.isArray(value) || Object.keys(value).length > 0);
      } catch (e) {
        return false;
      }
    });

    console.log('📋 Variables candidates trouvées:', variables.length);
    
    variables.forEach(varName => {
      try {
        const value = parent[varName];
        console.log(`🔍 Variable: ${varName}`, {
          type: typeof value,
          isArray: Array.isArray(value),
          length: value.length,
          keys: Array.isArray(value) ? 'N/A' : Object.keys(value).slice(0, 5),
          sample: Array.isArray(value) && value.length > 0 ? value[0] : 'Vide'
        });

        // Recherche de candidats plongeurs
        if ((Array.isArray(value) && value.length > 0) || 
            (!Array.isArray(value) && Object.keys(value).length > 0)) {
          const sampleItem = Array.isArray(value) ? value[0] : Object.values(value)[0];
          
          if (sampleItem && typeof sampleItem === 'object') {
            const keys = Object.keys(sampleItem);
            console.log(`📝 Clés du premier élément de ${varName}:`, keys);
            
            // Vérifier si ça ressemble à des données de plongeurs
            const hasPlongeurFields = keys.some(key => 
              /nom|name|niveau|level|plongeur/i.test(key)
            );
            
            if (hasPlongeurFields) {
              console.log(`🏊‍♂️ Candidat plongeurs trouvé: ${varName}`);
            }
            
            // Vérifier si ça ressemble à des données de palanquées
            const hasPalanqueeFields = keys.some(key => 
              /palanquee|groupe|team|membres|plongeurs/i.test(key)
            );
            
            if (hasPalanqueeFields) {
              console.log(`🏊‍♀️ Candidat palanquées trouvé: ${varName}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Erreur d'accès à ${varName}:`, error.message);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'exploration:', error);
  }
}

// ===== GÉNÉRATION PDF WHATSAPP =====
function shareToWhatsApp() {
  console.log('📱 Génération PDF pour WhatsApp');
  
  try {
    // Récupération des données
    const donnees = recupererDonneesSafe();
    
    if (!donnees.plongeurs && !donnees.palanquees) {
      console.warn('⚠️ Aucune donnée trouvée pour WhatsApp');
      if (typeof showNotification === 'function') {
        showNotification('⚠️ Aucune donnée à partager', 'warning');
      }
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuration optimisée pour mobile
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);

    const maintenant = new Date().toLocaleDateString('fr-FR');
    doc.text('🤿 PALANQUÉES JSAS', 20, 25);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`📅 ${maintenant}`, 20, 35);
    
    let yPos = 50;

    // Résumé en haut
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 150);
    doc.text('📊 RÉSUMÉ', 20, yPos);
    yPos += 12;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`👥 ${donnees.plongeurs.length} plongeurs`, 25, yPos);
    yPos += 8;
    doc.text(`🏊‍♂️ ${donnees.palanquees.length} palanquées`, 25, yPos);
    yPos += 20;

    // Palanquées détaillées
    if (donnees.palanquees && donnees.palanquees.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 100, 150);
      doc.text('🤿 PALANQUÉES', 20, yPos);
      yPos += 15;

      donnees.palanquees.forEach((palanquee, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Palanquée ${index + 1}:`, 25, yPos);
        yPos += 10;

        const membres = palanquee.plongeurs || palanquee.membres || [];
        if (membres.length > 0) {
          membres.forEach(membre => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const nom = membre.nom || membre.name || 'Nom non défini';
            const niveau = membre.niveau || membre.level || 'N/A';
            doc.text(`  → ${nom} (${niveau})`, 30, yPos);
            yPos += 7;
          });
        } else {
          doc.text('  → Aucun membre', 30, yPos);
          yPos += 7;
        }
        yPos += 8;
      });
    }

    // Génération et téléchargement
    const timestamp = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const nomFichier = `palanquees-jsas-whatsapp-${timestamp}.pdf`;
    
    doc.save(nomFichier);
    
    console.log('✅ PDF WhatsApp généré:', nomFichier);
    
    if (typeof showNotification === 'function') {
      showNotification(`📱 PDF WhatsApp généré: ${nomFichier}`, 'success');
    }

  } catch (error) {
    console.error('❌ Erreur génération PDF WhatsApp:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Erreur génération PDF WhatsApp', 'error');
    }
  }
}

// ===== GÉNÉRATION PDF DÉTAILLÉ =====
function exportDetailedPDF() {
  console.log('📋 Génération PDF détaillé');
  
  try {
    const donnees = recupererDonneesSafe();
    
    if (!donnees.plongeurs && !donnees.palanquees) {
      console.warn('⚠️ Aucune donnée pour PDF détaillé');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuration
    doc.setFont('helvetica', 'normal');
    const maintenant = new Date().toLocaleDateString('fr-FR');
    
    // Page de garde
    doc.setFontSize(20);
    doc.setTextColor(0, 100, 150);
    doc.text('📋 RAPPORT DÉTAILLÉ', 20, 30);
    doc.text('PALANQUÉES JSAS', 20, 45);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`📅 Généré le ${maintenant}`, 20, 65);
    
    doc.setFontSize(12);
    doc.text(`📊 ${donnees.plongeurs.length} plongeurs • ${donnees.palanquees.length} palanquées`, 20, 80);
    
    // Nouvelle page pour le contenu
    doc.addPage();
    let yPosition = 20;
    
    // Section détaillée des palanquées
    doc.setFontSize(16);
    doc.setTextColor(0, 100, 150);
    doc.text('🤿 COMPOSITION DÉTAILLÉE', 20, yPosition);
    yPosition += 20;
    
    if (donnees.palanquees && donnees.palanquees.length > 0) {
      donnees.palanquees.forEach((palanquee, index) => {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Titre de la palanquée
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 150);
        doc.text(`Palanquée ${index + 1}`, 20, yPosition);
        yPosition += 15;
        
        const membres = palanquee.plongeurs || palanquee.membres || [];
        
        if (membres.length > 0) {
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          
          membres.forEach((membre, membreIndex) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            
            const nom = membre.nom || membre.name || `Plongeur ${membreIndex + 1}`;
            const niveau = membre.niveau || membre.level || 'Niveau non spécifié';
            const experience = membre.experience || membre.exp || 'N/A';
            const certifications = membre.certifications || membre.certs || 'N/A';
            
            doc.text(`${membreIndex + 1}. ${nom}`, 25, yPosition);
            yPosition += 6;
            doc.text(`   Niveau: ${niveau}`, 25, yPosition);
            yPosition += 5;
            doc.text(`   Expérience: ${experience}`, 25, yPosition);
            yPosition += 5;
            doc.text(`   Certifications: ${certifications}`, 25, yPosition);
            yPosition += 10;
          });
        } else {
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);
          doc.text('Aucun membre assigné à cette palanquée', 25, yPosition);
          yPosition += 10;
        }
        
        yPosition += 10;
      });
    }
    
    // Section des plongeurs non assignés
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(150, 100, 0);
    doc.text('👤 PLONGEURS DISPONIBLES', 20, yPosition);
    yPosition += 20;
    
    if (donnees.plongeurs && donnees.plongeurs.length > 0) {
      donnees.plongeurs.forEach((plongeur, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }
        
        const nom = plongeur.nom || plongeur.name || `Plongeur ${index + 1}`;
        const niveau = plongeur.niveau || plongeur.level || 'N/A';
        const experience = plongeur.experience || plongeur.exp || 'N/A';
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${nom}`, 25, yPosition);
        yPosition += 8;
        doc.setFontSize(10);
        doc.text(`   Niveau: ${niveau} • Expérience: ${experience}`, 25, yPosition);
        yPosition += 12;
      });
    }
    
    // Pied de page sur toutes les pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`JSAS - Rapport généré le ${maintenant} - Page ${i}/${totalPages}`, 20, 290);
    }
    
    // Sauvegarde
    const timestamp = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const nomFichier = `palanquees-jsas-detaille-${timestamp}.pdf`;
    
    doc.save(nomFichier);
    
    console.log('✅ PDF détaillé généré:', nomFichier);
    
    if (typeof showNotification === 'function') {
      showNotification(`📋 PDF détaillé généré: ${nomFichier}`, 'success');
    }

  } catch (error) {
    console.error('❌ Erreur PDF détaillé:', error);
    if (typeof showNotification === 'function') {
      showNotification('❌ Erreur génération PDF détaillé', 'error');
    }
  }
}

// ===== RECHERCHE DE DONNÉES ALTERNATIVE =====
function rechercherDonneesAlternatives() {
  console.log('🔎 Recherche de données alternatives...');
  
  const patterns = [
    'listePlongeurs',
    'listeParticipants', 
    'participants',
    'divePlongeurs',
    'plongeursList',
    'palanqueesList',
    'groupes',
    'teams',
    'formations'
  ];
  
  patterns.forEach(pattern => {
    try {
      if (window.parent[pattern]) {
        console.log(`Variable alternative trouvée: ${pattern}`, window.parent[pattern]);
      }
    } catch (e) {
      // Ignore les erreurs d'accès
    }
  });
}

// ===== AUTO-INITIALISATION =====
(function() {
  console.log('📋 PDF Manager initialisé avec exploration complète');
  
  // Vérifier la disponibilité de jsPDF
  if (typeof window.jspdf === 'undefined') {
    console.warn('⚠️ jsPDF non disponible - Les fonctions PDF ne fonctionneront pas');
  }
  
  // Recherche immédiate de données alternatives au chargement
  if (typeof window.parent !== 'undefined') {
    setTimeout(rechercherDonneesAlternatives, 1000);
  }
})();

// ===== FONCTION GENERATEPDFPREVIEW MANQUANTE =====
function generatePDFPreview() {
  console.log('📋 generatePDFPreview() appelée par main-core.js');
  
  try {
    // Cette fonction est probablement appelée pour générer l'aperçu PDF
    // On va utiliser notre fonction exportToPDF existante
    exportToPDF();
    console.log('✅ Aperçu PDF généré avec exploration complète');
    
  } catch (error) {
    console.error('❌ Erreur dans generatePDFPreview:', error);
  }
}

// ===== EXPOSER LES FONCTIONS GLOBALEMENT =====
window.exportToPDF = exportToPDF;
window.shareToWhatsApp = shareToWhatsApp;
window.exportDetailedPDF = exportDetailedPDF;
window.explorerWindowParent = explorerWindowParent;
window.explorerWindowParentAvecRetour = explorerWindowParentAvecRetour;
window.recupererDonneesSafe = recupererDonneesSafe;
window.generatePDFPreview = generatePDFPreview;