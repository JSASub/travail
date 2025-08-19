// main-complete.js - Application principale ultra-sécurisée (VERSION COMPLÈTE SANS ERREURS)

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const originalConsoleLog = console.log;
  console.log = function() {
    if (arguments[0] && (arguments[0].includes('✅') || arguments[0].includes('❌'))) {
      originalConsoleLog.apply(console, arguments);
    }
  };
}

// ===== FONCTIONS UTILITAIRES SÉCURISÉES =====
function showAuthError(message) {
  const errorDiv = document.getElementById("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function handleError(error, context = "Application") {
  console.error(`❌ Erreur ${context}:`, error);
  
  // Utiliser le gestionnaire d'erreurs Firebase si disponible
  if (typeof FirebaseErrorHandler !== 'undefined') {
    return FirebaseErrorHandler.handleError(error, context);
  }
  
  // Fallback si le gestionnaire n'est pas disponible
  if (error.stack) {
    console.error("Stack trace:", error.stack);
  }
  
  console.log("Debug info:", {
    firebaseConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined',
    currentUser: typeof currentUser !== 'undefined' ? (currentUser ? currentUser.email : 'null') : 'undefined',
    plongeursLength: Array.isArray(plongeurs) ? plongeurs.length : 'not array',
    palanqueesLength: Array.isArray(palanquees) ? palanquees.length : 'not array'
  });
  
  return false;
}

// ===== TESTS DE CONNEXION SÉCURISÉS =====
async function testFirebaseConnectionSafe() {
  try {
    console.log("🧪 Test de connexion Firebase sécurisé...");
    
    if (!db) {
      throw new Error("Instance Firebase Database non initialisée");
    }
    
    if (!auth) {
      throw new Error("Instance Firebase Auth non initialisée");
    }
    
    // Test de connexion avec timeout plus court
    const testRef = db.ref('.info/connected');
    const connectedPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        try {
          testRef.off('value');
        } catch (e) {
          console.warn("⚠️ Erreur suppression listener test:", e);
        }
        resolve(false);
      }, 5000);
      
      let resolved = false;
      const listener = (snapshot) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          try {
            testRef.off('value', listener);
          } catch (e) {
            console.warn("⚠️ Erreur suppression listener:", e);
          }
          
          firebaseConnected = snapshot.val() === true;
          console.log(firebaseConnected ? "✅ Firebase connecté" : "⚠️ Firebase déconnecté");
          resolve(firebaseConnected);
        }
      };
      
      testRef.on('value', listener, (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error("❌ Erreur listener connexion:", error);
          resolve(false);
        }
      });
    });
    
    await connectedPromise;
    
    if (firebaseConnected) {
      try {
        // Test d'écriture rapide
        const testWriteRef = db.ref('test-connection');
        await testWriteRef.set({ 
          timestamp: Date.now(),
          testType: "connection-check",
          user: currentUser?.email || "anonymous"
        });
        console.log("✅ Test d'écriture Firebase réussi");
        
        // Nettoyer immédiatement
        await testWriteRef.remove();
      } catch (writeError) {
        console.warn("⚠️ Écriture Firebase échouée mais lecture OK:", writeError.message);
        if (typeof FirebaseErrorHandler !== 'undefined') {
          FirebaseErrorHandler.handleError(writeError, 'Test écriture');
        }
      }
    } else {
      console.warn("⚠️ Firebase déconnecté, fonctionnement en mode lecture seule");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Test Firebase échoué:", error.message);
    if (typeof FirebaseErrorHandler !== 'undefined') {
      FirebaseErrorHandler.handleError(error, 'Test connexion');
    }
    firebaseConnected = false;
    return true; // Continue en mode dégradé
  }
}

// ===== INITIALISATION SÉCURISÉE DES DONNÉES =====
async function initializeAppData() {
  try {
    console.log("📄 Initialisation sécurisée des données de l'application...");
    
    // Vérifier que les variables globales sont initialisées
    if (typeof plongeurs === 'undefined') {
      console.warn("⚠️ Variable plongeurs non initialisée, correction...");
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      console.warn("⚠️ Variable palanquees non initialisée, correction...");
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      console.warn("⚠️ Variable plongeursOriginaux non initialisée, correction...");
      window.plongeursOriginaux = [];
    }
    
    // Test de connexion sécurisé
    await testFirebaseConnectionSafe();
    
    // Initialiser la date du jour
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = document.getElementById("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    console.log("📜 Chargement des données...");
    
    // Charger l'historique DP avec gestion d'erreur
    try {
      await chargerHistoriqueDP();
      console.log("✅ Historique DP chargé");
    } catch (error) {
      console.error("❌ Erreur chargement historique DP:", error);
    }
    
    // Charger les données Firebase avec gestion d'erreur
    try {
      if (typeof loadFromFirebase === 'function') {
        await loadFromFirebase();
        console.log("✅ Données Firebase chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement Firebase:", error);
      
      // Initialisation de secours
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    }
    
    // Charger les sessions avec gestion d'erreur
    try {
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
        console.log("✅ Sessions chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement sessions:", error);
    }
    
    // Rendu initial sécurisé
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
    } catch (renderError) {
      console.error("❌ Erreur rendu initial:", renderError);
    }
    
    console.log("✅ Application initialisée avec système de verrous sécurisé!");
    
    if (typeof plongeurs !== 'undefined' && typeof palanquees !== 'undefined') {
      console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    }
    
  } catch (error) {
    console.error("❌ Erreur critique initialisation données:", error);
    handleError(error, "Initialisation données");
    
    // Mode de récupération d'urgence
    try {
      console.log("🆘 Activation du mode de récupération d'urgence...");
      
      // Initialiser les variables minimales
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
      
      // Essayer le rendu de base
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      console.log("✅ Mode de récupération activé");
      
    } catch (recoveryError) {
      console.error("❌ Échec du mode de récupération:", recoveryError);
      
      // Dernière tentative - afficher une erreur à l'utilisateur
      const authError = document.getElementById("auth-error");
      if (authError) {
        authError.textContent = "Erreur de chargement. L'application fonctionne en mode dégradé.";
        authError.style.display = "block";
      }
      
      alert(
        "Erreur critique de chargement.\n\n" +
        "L'application fonctionne en mode dégradé.\n" +
        "Veuillez:\n" +
        "1. Actualiser la page\n" +
        "2. Vérifier votre connexion internet\n" +
        "3. Contacter l'administrateur si le problème persiste"
      );
    }
  }
}

// ===== EXPORT PDF SÉCURISÉ =====
function exportToPDF() {
  // Vérifier que pageLoadTime existe
  if (typeof pageLoadTime !== 'undefined' && Date.now() - pageLoadTime < 3000) {
    console.log("🚫 Export PDF bloqué - page en cours de chargement");
    return;
  }
    
  console.log("📄 Génération du PDF professionnel...");
  
  // Fonction helper sécurisée pour getElementById
  function $(id) {
    const element = document.getElementById(id);
    return element || { value: "" }; // Retourne un objet avec value vide si élément non trouvé
  }
  
  const dpNom = $("dp-nom").value || "Non défini";
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
    
    // MODIFICATION : Constantes pour l'espacement RÉDUIT
    const spacing = {
      lineHeight: 6,
      sectionGap: 8, // RÉDUIT de 12 à 8
      subsectionGap: 6, // RÉDUIT de 8 à 6
      headerHeight: 60,
      footerHeight: 25,
      palanqueeGap: 6 // NOUVEAU : espacement spécifique entre palanquées
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
        doc.setFontSize(10);
        doc.setTextColor(colors.grayR, colors.grayG, colors.grayB);
        doc.text("Palanquées JSAS - " + dpDate + " (" + dpPlongee + ")", margin, 15);
        doc.text("Page " + doc.internal.getCurrentPageInfo().pageNumber, pageWidth - margin - 20, 15);
        yPosition = 25;
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
    addText('Fiche de Sécurité', margin, 32, 20, 'bold', 'white');
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
    
    // === PALANQUÉES DÉTAILLÉES ===
    checkPageBreak(40, true);
    
    addText('Organisation des Palanquées', margin, yPosition, 14, 'bold', 'primary');
    yPosition += 6; // RÉDUIT de 8 à 6
    
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
        
        // MODIFICATION : Calculer la hauteur nécessaire pour cette palanquée (ENCORE PLUS RÉDUITE)
        let palanqueeHeight = 12; // Header RÉDUIT de 14 à 12
        palanqueeHeight += (pal.length * spacing.lineHeight) + 3; // Plongeurs + espacement réduit
        palanqueeHeight += 26; // Paramètres RÉDUIT de 30 à 26
        palanqueeHeight += spacing.palanqueeGap; // NOUVEAU : espacement spécifique entre palanquées
        
        checkPageBreak(palanqueeHeight + 10);
        
        const isAlert = typeof checkAlert === 'function' ? checkAlert(pal) : false;
        
        // En-tête de palanquée ULTRA RÉDUIT
        if (isAlert) {
          doc.setFillColor(colors.dangerR, colors.dangerG, colors.dangerB);
        } else {
          doc.setFillColor(colors.secondaryR, colors.secondaryG, colors.secondaryB);
        }
        doc.rect(margin, yPosition, contentWidth, 7, 'F'); // Hauteur RÉDUITE de 8 à 7
        
        addText('Palanquée ' + (i + 1) + ' - ' + pal.length + ' plongeurs', margin + 5, yPosition + 5, 12, 'bold', 'white'); // Position Y ajustée
        
        const gps = pal.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
        const n1s = pal.filter(p => p && p.niveau === "N1");
        const autonomes = pal.filter(p => p && ["N2", "N3"].includes(p.niveau));
        
        addText('GP: ' + gps.length + ' | N1: ' + n1s.length + ' | Autonomes: ' + autonomes.length, margin + 100, yPosition + 5, 10, 'normal', 'white'); // Position Y ajustée
        
        yPosition += 12; // RÉDUIT : Espacement entre cadre bleu et premier plongeur
        
        // Liste des plongeurs (triés par niveau)
        if (pal.length === 0) {
          addText('Aucun plongeur assigné', margin + 10, yPosition, 11, 'normal', 'gray');
          yPosition += spacing.lineHeight + 3; // Espacement réduit pour cohérence
        } else {
          // Définir l'ordre de tri des niveaux (du plus capé au moins capé)
          const ordreNiveaux = ['E4', 'E3', 'E2', 'GP', 'N3', 'N2', 'N1', 'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'débutant', 'Déb', 'N4/GP', 'N4'];
          
          // Fonction de tri par niveau
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
          yPosition += 3; // RÉDUIT : Espacement entre dernier plongeur et paramètres
        }
        
        // MODIFICATION : Paramètres de plongée (TAILLE ET ESPACEMENT RÉDUITS)
        
        // Ligne 1: Horaire de mise à l'eau
        addText('Horaire mise à l\'eau:', margin + 5, yPosition, 9, 'bold', 'primary'); // RÉDUIT de 10 à 9
        
        if (pal.horaire && pal.horaire.trim()) {
          addText(pal.horaire, margin + 50, yPosition, 9, 'normal'); // RÉDUIT à 9
          addText('Correction: ', margin + 80, yPosition, 8, 'bold', 'gray'); // RÉDUIT à 8
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 105, yPosition, margin + 140, yPosition);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 50, yPosition, margin + 85, yPosition);
          addText('(HH:MM)', margin + 88, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        yPosition += 3.5; // RÉDUIT de 4 à 3.5
        
        // Ligne 2: Profondeurs et durées prévues
        addText('Prof. prévue: ', margin + 5, yPosition, 9, 'bold', 'primary'); // RÉDUIT à 9
        if (pal.profondeurPrevue && pal.profondeurPrevue.trim()) {
          addText(pal.profondeurPrevue + ' m', margin + 35, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 35, yPosition, margin + 55, yPosition);
          addText('m', margin + 57, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        
        addText('Durée prévue:', margin + 80, yPosition, 9, 'bold', 'primary'); // RÉDUIT à 9
        if (pal.dureePrevue && pal.dureePrevue.trim()) {
          addText(pal.dureePrevue + ' min', margin + 115, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 115, yPosition, margin + 140, yPosition);
          addText('min', margin + 142, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        yPosition += 3.5; // RÉDUIT de 4 à 3.5
        
        // Ligne 3: Profondeurs et durées réalisées
        addText('Prof. réalisée:', margin + 5, yPosition, 9, 'bold', 'success'); // RÉDUIT à 9
        if (pal.profondeurRealisee && pal.profondeurRealisee.trim()) {
          addText(pal.profondeurRealisee + ' m', margin + 40, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 40, yPosition, margin + 60, yPosition);
          addText('m', margin + 62, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        
        addText('Durée réalisée:', margin + 80, yPosition, 9, 'bold', 'success'); // RÉDUIT à 9
        if (pal.dureeRealisee && pal.dureeRealisee.trim()) {
          addText(pal.dureeRealisee + ' min', margin + 120, yPosition, 9, 'normal'); // RÉDUIT à 9
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 120, yPosition, margin + 145, yPosition);
          addText('min', margin + 147, yPosition, 9, 'normal', 'gray'); // RÉDUIT à 9
        }
        yPosition += 3.5; // RÉDUIT de 4 à 3.5
        
        // Ligne 4: Paliers
        addText('Paliers:', margin + 5, yPosition, 9, 'bold', 'primary'); // RÉDUIT à 9
        
        if (pal.paliers && pal.paliers.trim()) {
          addText(pal.paliers, margin + 25, yPosition, 8, 'normal'); // RÉDUIT à 8
          // Correction rapprochée
          addText('Correction:', margin + 70, yPosition, 8, 'bold', 'gray'); // RÉDUIT à 8
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 95, yPosition, margin + 140, yPosition);
        } else {
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(margin + 25, yPosition, margin + 65, yPosition);
          addText('(ex: 3 min à 3 m) | Correction:', margin + 70, yPosition, 8, 'normal', 'gray'); // RÉDUIT à 8
          doc.line(margin + 130, yPosition, margin + 150, yPosition);
        }
        
        // MODIFICATION MAJEURE : Espacement réduit entre palanquées
        yPosition += spacing.lineHeight + spacing.palanqueeGap; // Utilise le nouvel espacement spécifique
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
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      if (pageNum === totalPages) {
        addText('Document officiel JSAS - Conforme FFESSM - Version 2.1.3 Pro', margin, pageHeight - 15, 8, 'normal', 'gray');
        addText('Généré le ' + new Date().toLocaleDateString('fr-FR') + ' - Ne pas modifier', margin, pageHeight - 10, 8, 'normal', 'gray');
      }
      
      addText('Page ' + pageNum + '/' + totalPages, pageWidth - margin - 20, pageHeight - 10, 8, 'normal', 'gray');
      addText(new Date().toLocaleString('fr-FR'), margin, pageHeight - 5, 8, 'normal', 'gray');
    }
    
    // === TÉLÉCHARGEMENT ===
    const fileName = 'palanquees-jsas-' + (dpDate || 'export') + '-' + dpPlongee + '-compact.pdf';
    doc.save(fileName);
    
    console.log("✅ PDF généré avec espacement réduit:", fileName);
    
    const alertesText = alertesTotal.length > 0 ? '\n⚠️ ' + alertesTotal.length + ' alerte(s) détectée(s)' : '\n✅ Aucune alerte';
    alert('PDF généré avec succès !\n\n📊 ' + totalPlongeurs + ' plongeurs dans ' + palanqueesLocal.length + ' palanquées' + alertesText + '\n\n📁 Fichier: ' + fileName);
    
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF : " + error.message + "\n\nVérifiez que jsPDF est bien chargé.");
  }
}
// ===== GÉNÉRATION PDF PREVIEW SÉCURISÉE =====
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
          .close-button { display: none !important; }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    // Ajout du bouton de fermeture intégré dans le HTML
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
    htmlContent += '<p>Alertes: ' + alertesTotal.length + '</p>';
    htmlContent += '</section>';
    
    if (alertesTotal.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">⚠️ Alertes</h2>';
      alertesTotal.forEach(alerte => {
        htmlContent += '<p style="color: red;">• ' + alerte + '</p>';
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">🏊‍♂️ Palanquées</h2>';
    
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
            // MODIFICATION: Trier les plongeurs par grade avant affichage
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
      
      // MODIFICATION: Trier aussi les plongeurs en attente par grade
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
      pdfPreview.src = url;
      
      previewContainer.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      console.log("✅ Aperçu PDF généré avec tri par grade et bouton de fermeture intégré");
      setTimeout(() => URL.createObjectURL(url), 30000);
      
    } else {
      console.error("❌ Éléments d'aperçu non trouvés");
      alert("Erreur: impossible d'afficher l'aperçu PDF");
    }
    
  } catch (error) {
    console.error("❌ Erreur génération aperçu PDF:", error);
    alert("Erreur lors de la génération de l'aperçu: " + error.message);
  }
}

// Fonction pour fermer l'aperçu PDF
function closePDFPreview() {
  const previewContainer = document.getElementById("previewContainer");
  const pdfPreview = document.getElementById("pdfPreview");
  
  if (previewContainer) {
    previewContainer.style.display = "none";
    if (pdfPreview) {
      pdfPreview.src = "";
    }
    console.log("✅ Aperçu PDF fermé");
  }
}
// Export de la fonction pour usage global
window.closePDFPreview = closePDFPreview;

// ===== DRAG & DROP SÉCURISÉ =====
let dragData = null;

function setupDragAndDrop() {
  console.log("🎯 Configuration du drag & drop sécurisé...");
  
  try {
    // Nettoyer les anciens listeners s'ils existent
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragend', handleDragEnd);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('drop', handleDrop);
    
    // Ajouter les nouveaux listeners
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    console.log("✅ Drag & drop configuré");
  } catch (error) {
    console.error("❌ Erreur configuration drag & drop:", error);
    handleError(error, "Configuration drag & drop");
  }
}

function handleDragStart(e) {
  try {
    if (!e.target.classList.contains('plongeur-item')) return;
    
    e.target.classList.add('dragging');
    e.target.style.opacity = '0.5';
    
    const isFromPalanquee = e.target.dataset.type === 'palanquee';
    
    if (isFromPalanquee) {
      const palanqueeIndex = parseInt(e.target.dataset.palanqueeIndex);
      const plongeurIndex = parseInt(e.target.dataset.plongeurIndex);
      
      if (typeof palanquees !== 'undefined' && palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
        dragData = {
          type: "fromPalanquee",
          palanqueeIndex: palanqueeIndex,
          plongeurIndex: plongeurIndex,
          plongeur: palanquees[palanqueeIndex][plongeurIndex]
        };
      }
    } else {
      const index = parseInt(e.target.dataset.index);
      
      if (typeof plongeurs !== 'undefined' && plongeurs[index]) {
        dragData = {
          type: "fromMainList",
          plongeur: plongeurs[index],
          originalIndex: index
        };
      }
    }
    
    // Stocker dans dataTransfer comme backup
    if (e.dataTransfer && dragData) {
      try {
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "move";
      } catch (error) {
        console.warn("⚠️ Erreur dataTransfer:", error);
      }
    }
  } catch (error) {
    console.error("❌ Erreur handleDragStart:", error);
    handleError(error, "Drag start");
  }
}

function handleDragEnd(e) {
  try {
    if (e.target.classList.contains('plongeur-item')) {
      e.target.classList.remove('dragging');
      e.target.style.opacity = '1';
    }
  } catch (error) {
    console.error("❌ Erreur handleDragEnd:", error);
  }
}

function handleDragOver(e) {
  try {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      dropZone.classList.add('drag-over');
    }
  } catch (error) {
    console.error("❌ Erreur handleDragOver:", error);
  }
}

function handleDragLeave(e) {
  try {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  } catch (error) {
    console.error("❌ Erreur handleDragLeave:", error);
  }
}

async function handleDrop(e) {
  try {
    e.preventDefault();
    
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (!dropZone) {
      dragData = null;
      return;
    }
    
    dropZone.classList.remove('drag-over');
    
    // Récupérer les données
    let data = dragData;
    
    // Fallback vers dataTransfer
    if (!data && e.dataTransfer) {
      try {
        const dataStr = e.dataTransfer.getData("text/plain");
        if (dataStr) {
          data = JSON.parse(dataStr);
        }
      } catch (error) {
        console.warn("⚠️ Erreur parsing dataTransfer:", error);
      }
    }
    
    if (!data) {
      dragData = null;
      return;
    }
    
    // S'assurer que les variables globales existent
    if (typeof plongeurs === 'undefined') {
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
    }
    
    // Drop vers la liste principale
    if (dropZone.id === 'listePlongeurs') {
      if (data.type === "fromPalanquee") {
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
      }
    } else {
      // Drop vers une palanquée
      const palanqueeIndex = parseInt(dropZone.dataset.index);
      if (isNaN(palanqueeIndex)) {
        dragData = null;
        return;
      }
      
      const targetPalanquee = palanquees[palanqueeIndex];
      if (!targetPalanquee) {
        dragData = null;
        return;
      }
      
      // Vérifier les règles de validation avant d'ajouter
      if (typeof validatePalanqueeAddition === 'function') {
        const validation = validatePalanqueeAddition(palanqueeIndex, data.plongeur);
        if (!validation.valid) {
          const messageText = validation.messages.join('\n');
          alert(`❌ Ajout impossible :\n\n${messageText}`);
          dragData = null;
          return;
        }
      }
      
      if (data.type === "fromMainList") {
        const indexToRemove = plongeurs.findIndex(p => 
          p.nom === data.plongeur.nom && p.niveau === data.plongeur.niveau
        );
        
        if (indexToRemove !== -1) {
          const plongeur = plongeurs.splice(indexToRemove, 1)[0];
          targetPalanquee.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
        
      } else if (data.type === "fromPalanquee") {
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          targetPalanquee.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors du drop:", error);
    handleError(error, "Handle drop");
  } finally {
    // Nettoyer les données de drag
    dragData = null;
  }
}

// ===== EVENT HANDLERS SÉCURISÉS =====
function setupEventListeners() {
  console.log("🎛️ Configuration des event listeners sécurisés...");
  
  try {
    // === AUTHENTIFICATION ===
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const errorDiv = document.getElementById("auth-error");
        const loadingDiv = document.getElementById("auth-loading");
        
        if (!emailInput || !passwordInput) {
          showAuthError("Éléments de formulaire manquants");
          return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
          showAuthError("Veuillez remplir tous les champs");
          return;
        }
        
        try {
          if (loadingDiv) loadingDiv.style.display = "block";
          if (errorDiv) errorDiv.style.display = "none";
          
          if (typeof signIn === 'function') {
            await signIn(email, password);
            console.log("✅ Connexion réussie");
          } else {
            throw new Error("Fonction signIn non disponible");
          }
          
        } catch (error) {
          console.error("❌ Erreur connexion:", error);
          
          let message = "Erreur de connexion";
          if (error.code === 'auth/user-not-found') {
            message = "Utilisateur non trouvé";
          } else if (error.code === 'auth/wrong-password') {
            message = "Mot de passe incorrect";
          } else if (error.code === 'auth/invalid-email') {
            message = "Email invalide";
          } else if (error.code === 'auth/too-many-requests') {
            message = "Trop de tentatives. Réessayez plus tard.";
          }
          
          showAuthError(message);
        } finally {
          if (loadingDiv) loadingDiv.style.display = "none";
        }
      });
    }
    
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          if (typeof signOut === 'function') {
            await signOut();
            console.log("✅ Déconnexion réussie");
          }
        } catch (error) {
          console.error("❌ Erreur déconnexion:", error);
        }
      });
    }

    // === FONCTIONNALITÉ BOUTON "VALIDER DP" SÉCURISÉE ===
    const validerDPBtn = document.getElementById("valider-dp");
    if (validerDPBtn) {
      validerDPBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        try {
          const dpNom = document.getElementById("dp-nom")?.value?.trim();
          const dpDate = document.getElementById("dp-date")?.value;
          const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
          const dpPlongee = document.getElementById("dp-plongee")?.value;
          const dpMessage = document.getElementById("dp-message");
          
          // Validation des champs obligatoires
          if (!dpNom) {
            alert("⚠️ Veuillez saisir le nom du Directeur de Plongée");
            document.getElementById("dp-nom")?.focus();
            return;
          }
          
          if (!dpDate) {
            alert("⚠️ Veuillez sélectionner une date");
            document.getElementById("dp-date")?.focus();
            return;
          }
          
          if (!dpLieu) {
            alert("⚠️ Veuillez saisir le lieu de plongée");
            document.getElementById("dp-lieu")?.focus();
            return;
          }
          
          // Créer l'objet informations DP
          const dpInfo = {
            nom: dpNom,
            date: dpDate,
            lieu: dpLieu,
            plongee: dpPlongee,
            timestamp: Date.now(),
            validated: true
          };
          
          // Sauvegarder dans Firebase si disponible
          if (typeof db !== 'undefined' && db) {
            try {
              const dpKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
              await db.ref(`dpInfo/${dpKey}`).set(dpInfo);
              console.log("✅ Informations DP sauvegardées dans Firebase");
            } catch (firebaseError) {
              console.warn("⚠️ Erreur sauvegarde Firebase:", firebaseError.message);
            }
          }
          
          // Afficher le message de confirmation
          if (dpMessage) {
            dpMessage.innerHTML = `
              <div style="color: #28a745; font-weight: bold; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
                ✅ Informations DP validées
                <br><small style="font-weight: normal;">
                  ${dpNom} - ${new Date(dpDate).toLocaleDateString('fr-FR')} - ${dpLieu} (${dpPlongee})
                </small>
              </div>
            `;
            dpMessage.classList.add("dp-valide");
          }
          
          // Désactiver temporairement le bouton
          validerDPBtn.disabled = true;
          validerDPBtn.textContent = "✅ Validé";
          validerDPBtn.style.backgroundColor = "#28a745";
          
          setTimeout(() => {
            validerDPBtn.disabled = false;
            validerDPBtn.textContent = "Valider DP";
            validerDPBtn.style.backgroundColor = "#007bff";
          }, 3000);
          
          console.log("✅ Validation DP réussie:", dpInfo);
          
          // Synchronisation optionnelle
          if (typeof syncToDatabase === 'function') {
            setTimeout(syncToDatabase, 1000);
          }
          
        } catch (error) {
          console.error("❌ Erreur validation DP:", error);
          handleError(error, "Validation DP");
          
          const dpMessage = document.getElementById("dp-message");
          if (dpMessage) {
            dpMessage.innerHTML = `
              <div style="color: #dc3545; font-weight: bold; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                ❌ Erreur lors de la validation : ${error.message}
              </div>
            `;
          } else {
            alert("❌ Erreur lors de la validation : " + error.message);
          }
        }
      });
    }

    // === AJOUT DE PLONGEUR SÉCURISÉ ===
    const addForm = document.getElementById("addForm");
    if (addForm) {
      addForm.addEventListener("submit", e => {
        e.preventDefault();
        
        try {
          const nomInput = document.getElementById("nom");
          const niveauInput = document.getElementById("niveau");
          const preInput = document.getElementById("pre");
          
          if (!nomInput || !niveauInput || !preInput) {
            alert("Éléments de formulaire manquants");
            return;
          }
          
          const nom = nomInput.value.trim();
          const niveau = niveauInput.value;
          const pre = preInput.value.trim();
          
          if (!nom || !niveau) {
            alert("Veuillez remplir le nom et le niveau du plongeur.");
            return;
          }
          
          // S'assurer que les variables globales existent
          if (typeof plongeurs === 'undefined') window.plongeurs = [];
          if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
          
          const nouveauPlongeur = { nom, niveau, pre };
          plongeurs.push(nouveauPlongeur);
          plongeursOriginaux.push(nouveauPlongeur);
          
          nomInput.value = "";
          niveauInput.value = "";
          preInput.value = "";
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          
          console.log("✅ Plongeur ajouté:", nouveauPlongeur);
        } catch (error) {
          console.error("❌ Erreur ajout plongeur:", error);
          handleError(error, "Ajout plongeur");
        }
      });
    }

    // === AJOUT DE PALANQUÉE SÉCURISÉ ===
    const addPalanqueeBtn = document.getElementById("addPalanquee");
    if (addPalanqueeBtn) {
      addPalanqueeBtn.addEventListener("click", () => {
        try {
          // S'assurer que la variable globale existe
          if (typeof palanquees === 'undefined') window.palanquees = [];
          
          const nouvellePalanquee = [];
          nouvellePalanquee.horaire = '';
          nouvellePalanquee.profondeurPrevue = '';
          nouvellePalanquee.dureePrevue = '';
          nouvellePalanquee.profondeurRealisee = '';
          nouvellePalanquee.dureeRealisee = '';
          nouvellePalanquee.paliers = '';
          
          palanquees.push(nouvellePalanquee);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          
          console.log("✅ Nouvelle palanquée créée");
        } catch (error) {
          console.error("❌ Erreur création palanquée:", error);
          handleError(error, "Création palanquée");
        }
      });
    }

    // === EXPORT/IMPORT JSON SÉCURISÉ ===
    const exportJSONBtn = document.getElementById("exportJSON");
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener("click", () => {
        try {
          if (typeof exportToJSON === 'function') {
            exportToJSON();
          }
        } catch (error) {
          console.error("❌ Erreur export JSON:", error);
          handleError(error, "Export JSON");
        }
      });
    }

    const importJSONInput = document.getElementById("importJSON");
    if (importJSONInput) {
      importJSONInput.addEventListener("change", e => {
        try {
          const file = e.target.files[0];
          if (!file) return;
          
          const reader = new FileReader();
          reader.onload = e2 => {
            try {
              const data = JSON.parse(e2.target.result);
              
              // S'assurer que les variables globales existent
              if (typeof plongeurs === 'undefined') window.plongeurs = [];
              if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
              
              if (data.plongeurs && Array.isArray(data.plongeurs)) {
                plongeurs = data.plongeurs.map(p => ({
                  nom: p.nom,
                  niveau: p.niveau,
                  pre: p.prerogatives || p.pre || ""
                }));
              } else if (Array.isArray(data)) {
                plongeurs = data;
              }
              
              plongeursOriginaux = [...plongeurs];
              
              if (typeof syncToDatabase === 'function') {
                syncToDatabase();
              }
              alert("Import réussi !");
              console.log("✅ Import JSON réussi");
            } catch (error) {
              console.error("❌ Erreur import:", error);
              handleError(error, "Import JSON");
              alert("Erreur lors de l'import du fichier JSON");
            }
          };
          reader.readAsText(file);
        } catch (error) {
          console.error("❌ Erreur lecture fichier:", error);
          handleError(error, "Lecture fichier");
        }
      });
    }

    // === PDF SÉCURISÉ ===
    const generatePDFBtn = document.getElementById("generatePDF");
    if (generatePDFBtn) {
      generatePDFBtn.addEventListener("click", () => {
        try {
          generatePDFPreview();
        } catch (error) {
          console.error("❌ Erreur génération aperçu PDF:", error);
          handleError(error, "Génération aperçu PDF");
        }
      });
    }
    
    const exportPDFBtn = document.getElementById("exportPDF");
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener("click", () => {
        try {
          exportToPDF();
        } catch (error) {
          console.error("❌ Erreur export PDF:", error);
          handleError(error, "Export PDF");
        }
      });
    }

    // === SESSIONS SÉCURISÉES ===
    const loadSessionBtn = document.getElementById("load-session");
    if (loadSessionBtn) {
      loadSessionBtn.addEventListener("click", async () => {
        try {
          const sessionSelector = document.getElementById("session-selector");
          if (!sessionSelector) {
            alert("Sélecteur de session non trouvé");
            return;
          }
          
          const sessionKey = sessionSelector.value;
          if (!sessionKey) {
            alert("Veuillez sélectionner une session à charger.");
            return;
          }
          
          if (typeof loadSession === 'function') {
            const success = await loadSession(sessionKey);
            if (!success) {
              alert("Erreur lors du chargement de la session.");
            } else {
              console.log("✅ Session chargée:", sessionKey);
            }
          }
        } catch (error) {
          console.error("❌ Erreur chargement session:", error);
          handleError(error, "Chargement session");
        }
      });
    }

    const refreshSessionsBtn = document.getElementById("refresh-sessions");
    if (refreshSessionsBtn) {
      refreshSessionsBtn.addEventListener("click", async () => {
        try {
          await populateSessionSelector();
          await populateSessionsCleanupList();
          console.log("✅ Sessions actualisées");
        } catch (error) {
          console.error("❌ Erreur actualisation sessions:", error);
          handleError(error, "Actualisation sessions");
        }
      });
    }

    const saveSessionBtn = document.getElementById("save-session");
    if (saveSessionBtn) {
      saveSessionBtn.addEventListener("click", async () => {
        try {
          if (typeof saveSessionData === 'function') {
            await saveSessionData();
            alert("Session sauvegardée !");
            await populateSessionSelector();
            await populateSessionsCleanupList();
            console.log("✅ Session sauvegardée");
          }
        } catch (error) {
          console.error("❌ Erreur sauvegarde session:", error);
          handleError(error, "Sauvegarde session");
        }
      });
    }

    // === NETTOYAGE SESSIONS ET DP ===
    const selectAllSessionsBtn = document.getElementById("select-all-sessions");
    if (selectAllSessionsBtn) {
      selectAllSessionsBtn.addEventListener("click", () => {
        selectAllSessions(true);
      });
    }

    const selectNoneSessionsBtn = document.getElementById("select-none-sessions");
    if (selectNoneSessionsBtn) {
      selectNoneSessionsBtn.addEventListener("click", () => {
        selectAllSessions(false);
      });
    }

    const deleteSelectedSessionsBtn = document.getElementById("delete-selected-sessions");
    if (deleteSelectedSessionsBtn) {
      deleteSelectedSessionsBtn.addEventListener("click", () => {
        deleteSelectedSessions();
      });
    }

    const refreshSessionsListBtn = document.getElementById("refresh-sessions-list");
    if (refreshSessionsListBtn) {
      refreshSessionsListBtn.addEventListener("click", async () => {
        await populateSessionsCleanupList();
      });
    }

    const selectAllDPBtn = document.getElementById("select-all-dp");
    if (selectAllDPBtn) {
      selectAllDPBtn.addEventListener("click", () => {
        selectAllDPs(true);
      });
    }

    const selectNoneDPBtn = document.getElementById("select-none-dp");
    if (selectNoneDPBtn) {
      selectNoneDPBtn.addEventListener("click", () => {
        selectAllDPs(false);
      });
    }

    const deleteSelectedDPBtn = document.getElementById("delete-selected-dp");
    if (deleteSelectedDPBtn) {
      deleteSelectedDPBtn.addEventListener("click", () => {
        deleteSelectedDPs();
      });
    }

    const refreshDPListBtn = document.getElementById("refresh-dp-list");
    if (refreshDPListBtn) {
      refreshDPListBtn.addEventListener("click", async () => {
        await populateDPCleanupList();
      });
    }

    // Event listeners pour les checkboxes de nettoyage
    document.addEventListener('change', (e) => {
      try {
        if (e.target.classList.contains('session-cleanup-checkbox') || 
            e.target.classList.contains('dp-cleanup-checkbox')) {
          updateCleanupSelection();
        }
      } catch (error) {
        console.error("❌ Erreur checkbox cleanup:", error);
        handleError(error, "Checkbox cleanup");
      }
    });

    // === TEST FIREBASE SÉCURISÉ ===
    const testFirebaseBtn = document.getElementById("test-firebase");
    if (testFirebaseBtn) {
      testFirebaseBtn.addEventListener("click", async () => {
        console.log("🧪 === TEST FIREBASE COMPLET SÉCURISÉ ===");
        
        try {
          console.log("📡 Test 1: Vérification connexion Firebase");
          console.log("Firebase connecté:", typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined');
          console.log("Instance db:", typeof db !== 'undefined' && db ? "✅ OK" : "❌ MANQUANTE");
          
          if (typeof db !== 'undefined' && db) {
            console.log("📖 Test 2: Lecture /sessions");
            const sessionsRead = await db.ref('sessions').once('value');
            console.log("✅ Lecture sessions OK:", sessionsRead.exists() ? "Données trouvées" : "Aucune donnée");
            
            if (sessionsRead.exists()) {
              const sessions = sessionsRead.val();
              console.log("Nombre de sessions:", Object.keys(sessions).length);
            }
          }
          
          console.log("📊 Test 3: Données actuelles");
          console.log("Plongeurs en mémoire:", typeof plongeurs !== 'undefined' ? plongeurs.length : 'undefined');
          console.log("Palanquées en mémoire:", typeof palanquees !== 'undefined' ? palanquees.length : 'undefined');
          
          console.log("🎉 === TESTS TERMINÉS ===");
          alert("Test Firebase terminé !\n\nRegardez la console pour les détails.");
          
        } catch (error) {
          console.error("❌ Erreur test Firebase:", error);
          handleError(error, "Test Firebase");
          alert("Erreur lors du test Firebase : " + error.message);
        }
      });
    }

    // === TRI DES PLONGEURS SÉCURISÉ ===
    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const sortType = btn.dataset.sort;
          if (typeof sortPlongeurs === 'function') {
            sortPlongeurs(sortType);
          }
        } catch (error) {
          console.error("❌ Erreur tri plongeurs:", error);
          handleError(error, "Tri plongeurs");
        }
      });
    });
    
    console.log("✅ Event listeners configurés avec succès");
    
  } catch (error) {
    console.error("❌ Erreur configuration event listeners:", error);
    handleError(error, "Configuration event listeners");
  }
}

// ===== FONCTIONS POUR L'HISTORIQUE DP (CORRIGÉES) =====
async function chargerHistoriqueDP() {
  console.log("📋 Chargement de l'historique DP sécurisé...");
  
  const dpDatesSelect = document.getElementById("dp-dates");
  if (!dpDatesSelect) {
    console.error("❌ Élément dp-dates non trouvé");
    return;
  }
  
  dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';
  
  try {
    if (typeof db === 'undefined' || !db) {
      console.warn("⚠️ Firebase non disponible pour charger l'historique DP");
      dpDatesSelect.innerHTML += '<option disabled>Firebase non connecté</option>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    
    if (!snapshot.exists()) {
      console.log("ℹ️ Aucune donnée DP trouvée dans Firebase");
      dpDatesSelect.innerHTML += '<option disabled>Aucun DP enregistré</option>';
      return;
    }
    
    const dpInfos = snapshot.val();
    const dpList = [];
    
    Object.entries(dpInfos).forEach(([key, dpData]) => {
      if (dpData && dpData.date) {
        dpList.push({
          key: key,
          date: dpData.date,
          nom: dpData.nom || "DP non défini",
          lieu: dpData.lieu || "Lieu non défini",
          plongee: dpData.plongee || "matin",
          timestamp: dpData.timestamp || 0
        });
      }
    });
    
    dpList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    dpList.forEach(dp => {
      const option = document.createElement("option");
      option.value = dp.key;
      option.textContent = `${dp.date} - ${dp.nom} - ${dp.lieu} (${dp.plongee})`;
      dpDatesSelect.appendChild(option);
    });
    
    console.log(`✅ ${dpList.length} DP chargés dans l'historique`);
    
    dpDatesSelect.addEventListener('change', afficherInfoDP);
    
  } catch (error) {
    console.error("❌ Erreur chargement historique DP:", error);
    handleError(error, "Chargement historique DP");
    dpDatesSelect.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

function afficherInfoDP() {
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");
  
  if (!dpDatesSelect || !historiqueInfo) {
    console.error("❌ Éléments DOM manquants pour afficher les infos DP");
    return;
  }
  
  const selectedKey = dpDatesSelect.value;
  
  if (!selectedKey) {
    historiqueInfo.innerHTML = '';
    return;
  }
  
  historiqueInfo.innerHTML = '<p>⏳ Chargement des informations...</p>';
  
  if (typeof db === 'undefined' || !db) {
    historiqueInfo.innerHTML = '<p style="color: red;">❌ Firebase non disponible</p>';
    return;
  }
  
  db.ref(`dpInfo/${selectedKey}`).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        historiqueInfo.innerHTML = '<p style="color: red;">❌ DP non trouvé</p>';
        return;
      }
      
      const dpData = snapshot.val();
      const formatDate = (dateStr) => {
        try {
          return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };
      
      historiqueInfo.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
          <h4 style="margin: 0 0 10px 0; color: #004080;">📋 Informations DP</h4>
          <p><strong>👨‍💼 Directeur de Plongée :</strong> ${dpData.nom || 'Non défini'}</p>
          <p><strong>📅 Date :</strong> ${formatDate(dpData.date)}</p>
          <p><strong>📍 Lieu :</strong> ${dpData.lieu || 'Non défini'}</p>
          <p><strong>🕕 Session :</strong> ${dpData.plongee || 'matin'}</p>
          <p><strong>⏰ Créé le :</strong> ${dpData.timestamp ? new Date(dpData.timestamp).toLocaleString('fr-FR') : 'Date inconnue'}</p>
          
          <div style="margin-top: 15px;">
            <button onclick="chargerDonneesDPSelectionne('${selectedKey}')" 
                    style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              🔥 Charger dans l'interface
            </button>
            <button onclick="supprimerDPSelectionne('${selectedKey}')" 
                    style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error("❌ Erreur chargement DP:", error);
      handleError(error, "Chargement DP");
      historiqueInfo.innerHTML = `<p style="color: red;">❌ Erreur : ${error.message}</p>`;
    });
}

async function chargerDonneesDPSelectionne(dpKey) {
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const snapshot = await db.ref(`dpInfo/${dpKey}`).once('value');
    if (!snapshot.exists()) {
      alert("❌ DP non trouvé");
      return;
    }
    
    const dpData = snapshot.val();
    
    const dpNomInput = document.getElementById("dp-nom");
    const dpDateInput = document.getElementById("dp-date");
    const dpLieuInput = document.getElementById("dp-lieu");
    const dpPlongeeInput = document.getElementById("dp-plongee");
    
    if (dpNomInput) dpNomInput.value = dpData.nom || "";
    if (dpDateInput) dpDateInput.value = dpData.date || "";
    if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
    if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
    
    alert("✅ Données DP chargées avec succès !");
    console.log("✅ DP chargé:", dpData);
    
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    handleError(error, "Chargement DP sélectionné");
    alert("❌ Erreur lors du chargement : " + error.message);
  }
}

async function supprimerDPSelectionne(dpKey) {
  const confirmation = confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce DP ?\n\nCette action est irréversible !");
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    await db.ref(`dpInfo/${dpKey}`).remove();
    alert("✅ DP supprimé avec succès !");
    
    if (typeof chargerHistoriqueDP === 'function') {
      await chargerHistoriqueDP();
    }
    
    console.log("✅ DP supprimé:", dpKey);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    handleError(error, "Suppression DP");
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// ===== GESTION DES SESSIONS =====
async function populateSessionSelector() {
  console.log("📋 Chargement des sessions disponibles...");
  
  const sessionSelector = document.getElementById("session-selector");
  if (!sessionSelector) {
    console.error("❌ Élément session-selector non trouvé");
    return;
  }
  
  // Vider le sélecteur
  sessionSelector.innerHTML = '<option value="">-- Charger une session --</option>';
  
  try {
    if (typeof loadAvailableSessions === 'function') {
      const sessions = await loadAvailableSessions();
      
      if (sessions.length === 0) {
        sessionSelector.innerHTML += '<option disabled>Aucune session disponible</option>';
        console.log("ℹ️ Aucune session trouvée");
        return;
      }
      
      sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session.key;
        option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
        sessionSelector.appendChild(option);
      });
      
      console.log(`✅ ${sessions.length} sessions chargées dans le sélecteur`);
      
    } else {
      // Fallback : charger directement depuis Firebase
      if (typeof db !== 'undefined' && db) {
        const snapshot = await db.ref('sessions').once('value');
        
        if (!snapshot.exists()) {
          sessionSelector.innerHTML += '<option disabled>Aucune session trouvée</option>';
          return;
        }
        
        const sessions = snapshot.val();
        const sessionsList = [];
        
        Object.entries(sessions).forEach(([key, sessionData]) => {
          if (sessionData && sessionData.meta) {
            sessionsList.push({
              key: key,
              dp: sessionData.meta.dp || "DP inconnu",
              date: sessionData.meta.date || "Date inconnue", 
              lieu: sessionData.meta.lieu || "Lieu inconnu",
              plongee: sessionData.meta.plongee || "matin",
              timestamp: sessionData.meta.timestamp || 0
            });
          }
        });
        
        // Trier par date décroissante
        sessionsList.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
        
        sessionsList.forEach(session => {
          const option = document.createElement("option");
          option.value = session.key;
          option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
          sessionSelector.appendChild(option);
        });
        
        console.log(`✅ ${sessionsList.length} sessions chargées (fallback)`);
      } else {
        sessionSelector.innerHTML += '<option disabled>Firebase non disponible</option>';
        console.warn("⚠️ Firebase non disponible pour charger les sessions");
      }
    }
    
  } catch (error) {
    console.error("❌ Erreur chargement sessions:", error);
    handleError(error, "Chargement sessions");
    sessionSelector.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

async function populateSessionsCleanupList() {
  console.log("🧹 Chargement de la liste de nettoyage des sessions...");
  
  const cleanupList = document.getElementById("sessions-cleanup-list");
  if (!cleanupList) {
    console.error("❌ Élément sessions-cleanup-list non trouvé");
    return;
  }
  
  cleanupList.innerHTML = '<em>Chargement des sessions...</em>';
  
  try {
    const sessions = typeof loadAvailableSessions === 'function' ? 
      await loadAvailableSessions() : 
      await loadSessionsDirectly();
    
    if (sessions.length === 0) {
      cleanupList.innerHTML = '<em>Aucune session trouvée</em>';
      return;
    }
    
    let html = '';
    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp || Date.now()).toLocaleDateString('fr-FR');
      html += `
        <label class="cleanup-item">
          <input type="checkbox" class="session-cleanup-checkbox" value="${session.key}">
          <div class="item-info">
            <span class="item-date">${session.date} - ${session.dp}</span>
            <span class="item-details">${session.lieu} (${session.plongee})</span>
            <span class="item-meta">Créé le ${sessionDate} | ${session.stats?.totalPlongeurs || 0} plongeurs</span>
          </div>
        </label>
      `;
    });
    
    cleanupList.innerHTML = html;
    console.log(`✅ ${sessions.length} sessions dans la liste de nettoyage`);
    
  } catch (error) {
    console.error("❌ Erreur chargement liste nettoyage sessions:", error);
    cleanupList.innerHTML = '<em>Erreur de chargement</em>';
  }
}

async function loadSessionsDirectly() {
  if (typeof db === 'undefined' || !db) {
    return [];
  }
  
  try {
    const snapshot = await db.ref('sessions').once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sessions = snapshot.val();
    const sessionsList = [];
    
    Object.entries(sessions).forEach(([key, sessionData]) => {
      if (sessionData) {
        sessionsList.push({
          key: key,
          dp: sessionData.meta?.dp || sessionData.dp || "DP inconnu",
          date: sessionData.meta?.date || sessionData.date || "Date inconnue",
          lieu: sessionData.meta?.lieu || sessionData.lieu || "Lieu inconnu", 
          plongee: sessionData.meta?.plongee || sessionData.plongee || "matin",
          timestamp: sessionData.meta?.timestamp || sessionData.timestamp || 0,
          stats: sessionData.stats || {
            totalPlongeurs: (sessionData.plongeurs || []).length + 
              (sessionData.palanquees || []).reduce((sum, pal) => sum + (pal?.length || 0), 0)
          }
        });
      }
    });
    
    // Trier par date décroissante
    sessionsList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    return sessionsList;
    
  } catch (error) {
    console.error("❌ Erreur loadSessionsDirectly:", error);
    return [];
  }
}

async function populateDPCleanupList() {
  console.log("🧹 Chargement de la liste de nettoyage des DP...");
  
  const cleanupList = document.getElementById("dp-cleanup-list");
  if (!cleanupList) {
    console.error("❌ Élément dp-cleanup-list non trouvé");
    return;
  }
  
  cleanupList.innerHTML = '<em>Chargement des DP...</em>';
  
  try {
    if (typeof db === 'undefined' || !db) {
      cleanupList.innerHTML = '<em>Firebase non disponible</em>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    
    if (!snapshot.exists()) {
      cleanupList.innerHTML = '<em>Aucun DP trouvé</em>';
      return;
    }
    
    const dpInfos = snapshot.val();
    const dpList = [];
    
    Object.entries(dpInfos).forEach(([key, dpData]) => {
      if (dpData) {
        dpList.push({
          key: key,
          nom: dpData.nom || "DP inconnu",
          date: dpData.date || "Date inconnue",
          lieu: dpData.lieu || "Lieu inconnu",
          plongee: dpData.plongee || "matin",
          timestamp: dpData.timestamp || 0
        });
      }
    });
    
    // Trier par date décroissante
    dpList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    let html = '';
    dpList.forEach(dp => {
      const createdDate = new Date(dp.timestamp).toLocaleDateString('fr-FR');
      html += `
        <label class="cleanup-item">
          <input type="checkbox" class="dp-cleanup-checkbox" value="${dp.key}">
          <div class="item-info">
            <span class="item-date">${dp.date} - ${dp.nom}</span>
            <span class="item-details">${dp.lieu} (${dp.plongee})</span>
            <span class="item-meta">Créé le ${createdDate}</span>
          </div>
        </label>
      `;
    });
    
    cleanupList.innerHTML = html;
    console.log(`✅ ${dpList.length} DP dans la liste de nettoyage`);
    
  } catch (error) {
    console.error("❌ Erreur chargement liste nettoyage DP:", error);
    cleanupList.innerHTML = '<em>Erreur de chargement</em>';
  }
}

// Fonctions de nettoyage
function selectAllSessions(select) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
  });
  updateCleanupSelection();
}

function selectAllDPs(select) {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
  });
  updateCleanupSelection();
}

function updateCleanupSelection() {
  const sessionCheckboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  const dpCheckboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  const deleteSessionsBtn = document.getElementById('delete-selected-sessions');
  const deleteDPBtn = document.getElementById('delete-selected-dp');
  
  if (deleteSessionsBtn) {
    deleteSessionsBtn.disabled = sessionCheckboxes.length === 0;
    deleteSessionsBtn.textContent = `🗑️ Supprimer sélectionnées (${sessionCheckboxes.length})`;
  }
  
  if (deleteDPBtn) {
    deleteDPBtn.disabled = dpCheckboxes.length === 0;
    deleteDPBtn.textContent = `🗑️ Supprimer sélectionnés (${dpCheckboxes.length})`;
  }
}

async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucune session sélectionnée");
    return;
  }
  
  const confirmation = confirm(`⚠️ Supprimer ${checkboxes.length} session(s) ?\n\nCette action est irréversible !`);
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const promises = [];
    checkboxes.forEach(checkbox => {
      promises.push(db.ref(`sessions/${checkbox.value}`).remove());
    });
    
    await Promise.all(promises);
    
    alert(`✅ ${checkboxes.length} session(s) supprimée(s) avec succès !`);
    
    // Recharger les listes
    await populateSessionSelector();
    await populateSessionsCleanupList();
    
    console.log(`✅ ${checkboxes.length} sessions supprimées`);
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

async function deleteSelectedDPs() {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucun DP sélectionné");
    return;
  }
  
  const confirmation = confirm(`⚠️ Supprimer ${checkboxes.length} DP ?\n\nCette action est irréversible !`);
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const promises = [];
    checkboxes.forEach(checkbox => {
      promises.push(db.ref(`dpInfo/${checkbox.value}`).remove());
    });
    
    await Promise.all(promises);
    
    alert(`✅ ${checkboxes.length} DP supprimé(s) avec succès !`);
    
    // Recharger les listes
    await chargerHistoriqueDP();
    await populateDPCleanupList();
    
    console.log(`✅ ${checkboxes.length} DP supprimés`);
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// ===== INITIALISATION APRÈS CONNEXION =====
async function initializeAfterAuth() {
  console.log("🔐 Initialisation après authentification...");
  
  try {
    // Charger toutes les données utilisateur
    await initializeAppData();
    
    // Charger spécifiquement l'historique et les listes de nettoyage
    console.log("📋 Chargement des interfaces de gestion...");
    
    try {
      await chargerHistoriqueDP();
      console.log("✅ Historique DP chargé après auth");
    } catch (error) {
      console.error("❌ Erreur historique DP après auth:", error);
    }
    
    try {
      await populateSessionSelector();
      console.log("✅ Sélecteur sessions chargé après auth");
    } catch (error) {
      console.error("❌ Erreur sélecteur sessions après auth:", error);
    }
    
    try {
      await populateSessionsCleanupList();
      console.log("✅ Liste nettoyage sessions chargée après auth");
    } catch (error) {
      console.error("❌ Erreur liste sessions après auth:", error);
    }
    
    try {
      await populateDPCleanupList();
      console.log("✅ Liste nettoyage DP chargée après auth");
    } catch (error) {
      console.error("❌ Erreur liste DP après auth:", error);
    }
    
    console.log("✅ Initialisation complète après authentification terminée");
    
  } catch (error) {
    console.error("❌ Erreur initialisation après auth:", error);
    handleError(error, "Initialisation après authentification");
  }
}

// Export de la fonction pour usage externe
window.initializeAfterAuth = initializeAfterAuth;
window.afficherInfoDP = afficherInfoDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.supprimerDPSelectionne = supprimerDPSelectionne;
window.populateSessionSelector = populateSessionSelector;
window.populateSessionsCleanupList = populateSessionsCleanupList;
window.populateDPCleanupList = populateDPCleanupList;
window.selectAllSessions = selectAllSessions;
window.selectAllDPs = selectAllDPs;
window.updateCleanupSelection = updateCleanupSelection;
window.deleteSelectedSessions = deleteSelectedSessions;
window.deleteSelectedDPs = deleteSelectedDPs;

// ===== INITIALISATION SÉCURISÉE DE L'APPLICATION =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 Initialisation sécurisée de l'application JSAS...");
  
  try {
    // 1. Vérifier que les fonctions critiques sont disponibles
    if (typeof initializeFirebase !== 'function') {
      throw new Error("Fonction initializeFirebase non disponible - vérifiez le chargement de config-firebase.js");
    }
    
    // 2. Initialiser Firebase en premier
    const firebaseOK = initializeFirebase();
    if (!firebaseOK) {
      throw new Error("Échec initialisation Firebase");
    }
    
    // 3. Configurer les event listeners
    setupEventListeners();
    
    // 4. Configurer le drag & drop
    setupDragAndDrop();
    
    // 5. Ajouter les gestionnaires d'erreurs globaux
    window.addEventListener('error', (event) => {
      console.error("❌ Erreur JavaScript globale:", event.error);
      handleError(event.error, "Erreur JavaScript globale");
    });
    
    console.log("✅ Application JSAS initialisée avec succès !");
    
  } catch (error) {
    console.error("❌ Erreur critique initialisation:", error);
    handleError(error, "Initialisation critique");
    
    // Mode de récupération d'urgence
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
    
    const authContainer = document.getElementById("auth-container");
    if (authContainer) {
      authContainer.style.display = "block";
      const errorDiv = document.getElementById("auth-error");
      if (errorDiv) {
        errorDiv.textContent = "Erreur d'initialisation critique. Veuillez actualiser la page.";
        errorDiv.style.display = "block";
      }
    }
    
    // Notification d'urgence
    alert(
      "❌ ERREUR CRITIQUE D'INITIALISATION\n\n" +
      "L'application n'a pas pu s'initialiser correctement.\n\n" +
      "Actions recommandées :\n" +
      "1. Actualisez la page (F5)\n" +
      "2. Vérifiez votre connexion internet\n" +
      "3. Videz le cache du navigateur\n" +
      "4. Contactez l'administrateur si le problème persiste\n\n" +
      "Erreur : " + error.message
    );
  }
});

// ===== DIAGNOSTIC ET MONITORING =====
// Fonction de diagnostic pour le support technique
window.diagnosticJSAS = function() {
  console.log("🔍 === DIAGNOSTIC JSAS ===");
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    variables: {
      plongeurs: typeof plongeurs !== 'undefined' ? plongeurs.length : 'undefined',
      palanquees: typeof palanquees !== 'undefined' ? palanquees.length : 'undefined',
      currentUser: typeof currentUser !== 'undefined' ? (currentUser ? currentUser.email : 'null') : 'undefined',
      firebaseConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined'
    },
    firebase: {
      app: typeof app !== 'undefined' ? 'initialized' : 'undefined',
      db: typeof db !== 'undefined' ? 'initialized' : 'undefined',
      auth: typeof auth !== 'undefined' ? 'initialized' : 'undefined'
    },
    listeners: {
      active: typeof window.firebaseListeners !== 'undefined' ? 
        window.firebaseListeners.getActiveListeners() : 'undefined'
    },
    locks: {
      system: typeof lockSystemInitialized !== 'undefined' ? lockSystemInitialized : 'undefined',
      current: typeof currentlyEditingPalanquee !== 'undefined' ? currentlyEditingPalanquee : 'undefined',
      active: typeof palanqueeLocks !== 'undefined' ? Object.keys(palanqueeLocks).length : 'undefined'
    },
    errors: {
      lastError: window.lastJSASError || 'none'
    }
  };
  
  console.log("📊 Diagnostic complet:", diagnostic);
  console.log("=== FIN DIAGNOSTIC ===");
  
  return diagnostic;
};

// Capturer la dernière erreur pour le diagnostic
window.addEventListener('error', (event) => {
  window.lastJSASError = {
    message: event.error?.message || event.message,
    timestamp: new Date().toISOString(),
    filename: event.filename,
    lineno: event.lineno
  };
});

console.log("✅ Main application sécurisée chargée - Version 2.5.2");