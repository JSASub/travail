// pdf-manager.js - Version simple et fonctionnelle

// ===== FONCTION EXPORT PDF BASIQUE =====
function exportToPDF() {
  console.log('📊 Génération PDF basique...');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // En-tête
    const maintenant = new Date().toLocaleDateString('fr-FR');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('📋 Palanquées JSAS', 20, 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Date: ${maintenant}`, 20, 40);
    
    // Récupération simple des données
    let plongeursCount = 0;
    let palanqueesCount = 0;
    
    try {
      if (window.parent && window.parent.plongeurs && Array.isArray(window.parent.plongeurs)) {
        plongeursCount = window.parent.plongeurs.length;
      }
      if (window.parent && window.parent.palanquees && Array.isArray(window.parent.palanquees)) {
        palanqueesCount = window.parent.palanquees.length;
      }
    } catch (e) {
      console.log('⚠️ Erreur accès aux données parent:', e.message);
    }
    
    // Contenu basique
    let yPos = 60;
    doc.text(`Nombre de plongeurs: ${plongeursCount}`, 20, yPos);
    yPos += 10;
    doc.text(`Nombre de palanquées: ${palanqueesCount}`, 20, yPos);
    yPos += 20;
    
    if (plongeursCount === 0 && palanqueesCount === 0) {
      doc.text('⚠️ Aucune donnée disponible pour l\'aperçu', 20, yPos);
      doc.text('Assurez-vous d\'avoir sélectionné un DP et ajouté des plongeurs.', 20, yPos + 15);
    }
    
    // Sauvegarde
    const timestamp = maintenant.replace(/\//g, '-');
    const nomFichier = `palanquees-jsas-${timestamp}.pdf`;
    doc.save(nomFichier);
    
    console.log(`✅ PDF généré: ${nomFichier}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    return false;
  }
}

// ===== FONCTION WHATSAPP SIMPLE =====
function shareToWhatsApp() {
  console.log('📱 Génération PDF WhatsApp simple...');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // En-tête WhatsApp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('🤿 PALANQUÉES JSAS', 20, 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`📅 ${new Date().toLocaleDateString('fr-FR')}`, 20, 40);
    
    // Message simple
    let yPos = 60;
    doc.text('Aperçu des palanquées généré.', 20, yPos);
    yPos += 15;
    doc.text('Pour plus de détails, consultez l\'application JSAS.', 20, yPos);
    
    // Sauvegarde
    const timestamp = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const nomFichier = `palanquees-jsas-whatsapp-${timestamp}.pdf`;
    doc.save(nomFichier);
    
    console.log(`✅ PDF WhatsApp généré: ${nomFichier}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur PDF WhatsApp:', error);
    return false;
  }
}

// ===== FONCTION POUR MAIN-CORE.JS =====
function generatePDFPreview() {
  console.log('📋 generatePDFPreview appelée');
  return exportToPDF();
}

// ===== EXPOSER LES FONCTIONS =====
window.exportToPDF = exportToPDF;
window.shareToWhatsApp = shareToWhatsApp;
window.generatePDFPreview = generatePDFPreview;

console.log('📋 PDF Manager simple chargé et prêt');