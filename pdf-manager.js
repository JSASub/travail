// Solution pour corriger le chargement jsPDF

// 1. Version améliorée de savePreviewDirectToPDF avec vérifications
function savePreviewDirectToPDF() {
  console.log("💾 Sauvegarde du preview en PDF...");
  
  // Vérifications étendues pour jsPDF
  console.log("🔍 Vérification jsPDF...");
  console.log("- window.jspdf:", typeof window.jspdf);
  console.log("- window.jsPDF:", typeof window.jsPDF);
  console.log("- window.jspdf?.jsPDF:", typeof window.jspdf?.jsPDF);
  
  let jsPDF_class = null;
  
  // Essayer différentes façons d'accéder à jsPDF
  if (window.jspdf && window.jspdf.jsPDF) {
    jsPDF_class = window.jspdf.jsPDF;
    console.log("✅ jsPDF trouvé via window.jspdf.jsPDF");
  } else if (window.jsPDF) {
    jsPDF_class = window.jsPDF;
    console.log("✅ jsPDF trouvé via window.jsPDF");
  } else if (typeof jsPDF !== 'undefined') {
    jsPDF_class = jsPDF;
    console.log("✅ jsPDF trouvé via variable globale jsPDF");
  } else {
    console.error("❌ jsPDF non trouvé - Tentative de chargement...");
    
    // Essayer de charger jsPDF dynamiquement
    loadJsPDFDynamically().then(() => {
      console.log("🔄 Retry après chargement...");
      savePreviewDirectToPDF(); // Réessayer après chargement
    }).catch(error => {
      console.error("❌ Impossible de charger jsPDF:", error);
      alert("Erreur: Impossible de charger jsPDF.\n\nVérifiez que la bibliothèque jsPDF est incluse dans votre page HTML:\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>");
    });
    return;
  }
  
  try {
    // Récupérer les données actuelles
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // Utiliser les variables globales si disponibles
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    
    console.log(`📊 Données récupérées: ${plongeursLocal.length} plongeurs, ${palanqueesLocal.length} palanquées`);
    
    // Fonction de tri par grade (identique au preview)
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
    
    // Créer le PDF
    const doc = new jsPDF_class({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    console.log("✅ Document PDF créé");
    
    const colors = {
      primaryR: 0, primaryG: 64, primaryB: 128,
      secondaryR: 0, secondaryG: 123, secondaryB: 255,
      darkR: 52, darkG: 58, darkB: 64
    };
    
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête
    doc.setFillColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Palanquées JSAS - Preview", margin, 20);
    
    doc.setFontSize(10);
    doc.text(`DP: ${dpNom}`, margin, 30);
    doc.text(`Date: ${dpDate} - ${dpPlongee}`, margin, 37);
    doc.text(`Lieu: ${dpLieu}`, margin, 44);
    
    yPos = 65;
    
    // Statistiques
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    
    doc.setFontSize(14);
    doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
    doc.text("RÉSUMÉ", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.text(`Total plongeurs: ${totalPlongeurs}`, margin, yPos);
    yPos += 6;
    doc.text(`Palanquées: ${palanqueesLocal.length}`, margin, yPos);
    yPos += 15;
    
    // Palanquées avec tri
    if (palanqueesLocal.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PALANQUÉES", margin, yPos);
      yPos += 10;
      
      palanqueesLocal.forEach((pal, i) => {
        if (pal && Array.isArray(pal)) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
          doc.text(`Palanquée ${i + 1} (${pal.length} plongeurs)`, margin, yPos);
          yPos += 8;
          
          if (pal.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
            
            const plongeursTriés = trierPlongeursParGrade(pal);
            
            plongeursTriés.forEach(p => {
              if (p && p.nom) {
                const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
                doc.text(line, margin + 5, yPos);
                yPos += 4;
              }
            });
          } else {
            doc.setFontSize(9);
            doc.setTextColor(128, 128, 128);
            doc.text("Aucun plongeur assigné", margin + 5, yPos);
            yPos += 4;
          }
          yPos += 6;
        }
      });
    }
    
    // Plongeurs en attente avec tri
    if (plongeursLocal.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(colors.primaryR, colors.primaryG, colors.primaryB);
      doc.text("PLONGEURS EN ATTENTE", margin, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
      
      const plongeursEnAttenteTriés = trierPlongeursParGrade(plongeursLocal);
      
      plongeursEnAttenteTriés.forEach(p => {
        if (p && p.nom) {
          const line = `• ${p.nom} (${p.niveau || 'N?'})${p.pre ? ' - ' + p.pre : ''}`;
          doc.text(line, margin + 5, yPos);
          yPos += 4;
        }
      });
    }
    
    // Sauvegarder
    const fileName = `palanquees-preview-${dpDate || 'export'}-${dpPlongee}.pdf`;
    doc.save(fileName);
    
    console.log("✅ PDF du preview sauvegardé avec tri:", fileName);
    alert(`PDF du preview sauvegardé avec succès !\n📄 ${fileName}\n\n✅ Plongeurs triés par niveau`);
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde PDF:", error);
    alert("Erreur lors de la sauvegarde PDF: " + error.message + "\n\nDétails dans la console (F12)");
  }
}

// 2. Fonction pour charger jsPDF dynamiquement
function loadJsPDFDynamically() {
  return new Promise((resolve, reject) => {
    console.log("📥 Chargement dynamique de jsPDF...");
    
    // Vérifier si déjà chargé
    if (window.jspdf || window.jsPDF || typeof jsPDF !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      console.log("✅ jsPDF chargé dynamiquement");
      // Attendre un peu pour que la bibliothèque s'initialise
      setTimeout(resolve, 100);
    };
    script.onerror = () => {
      reject(new Error("Échec du chargement de jsPDF"));
    };
    document.head.appendChild(script);
  });
}

// 3. Fonction de diagnostic jsPDF
function diagnoseJsPDF() {
  console.log("🔍 === DIAGNOSTIC jsPDF ===");
  console.log("window.jspdf:", typeof window.jspdf);
  console.log("window.jsPDF:", typeof window.jsPDF);
  console.log("jsPDF (global):", typeof jsPDF);
  console.log("window.jspdf?.jsPDF:", typeof window.jspdf?.jsPDF);
  
  // Vérifier les scripts chargés
  const scripts = Array.from(document.scripts).map(s => s.src).filter(src => src.includes('jspdf'));
  console.log("Scripts jsPDF trouvés:", scripts);
  
  let result = "🔍 DIAGNOSTIC jsPDF:\n\n";
  result += `• window.jspdf: ${typeof window.jspdf}\n`;
  result += `• window.jsPDF: ${typeof window.jsPDF}\n`;
  result += `• jsPDF global: ${typeof jsPDF}\n`;
  result += `• Scripts trouvés: ${scripts.length}\n`;
  
  if (scripts.length > 0) {
    result += `• URL: ${scripts[0]}\n`;
  } else {
    result += "❌ Aucun script jsPDF détecté!\n\nAjoutez dans votre HTML:\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>";
  }
  
  alert(result);
  
  return {
    hasJsPDF: !!(window.jspdf || window.jsPDF || (typeof jsPDF !== 'undefined')),
    scripts: scripts
  };
}

// Export des fonctions
window.savePreviewDirectToPDF = savePreviewDirectToPDF;
window.loadJsPDFDynamically = loadJsPDFDynamically;
window.diagnoseJsPDF = diagnoseJsPDF;

console.log("🔧 Module jsPDF amélioré chargé avec diagnostic");