// main-complete.js - Application principale ultra-sécurisée

// ===== FONCTIONS UTILITAIRES (DÉCLARÉES EN PREMIER) =====

function showAuthError(message) {
  const errorDiv = $("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function handleError(error, context = "Application") {
  console.error(`❌ Erreur ${context}:`, error);
  
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

async function testFirebaseConnection() {
  try {
    console.log("🧪 Test de connexion Firebase...");
    
    if (!db) {
      throw new Error("Instance Firebase Database non initialisée");
    }
    
    if (!auth) {
      throw new Error("Instance Firebase Auth non initialisée");
    }
    
    const testRef = db.ref('.info/connected');
    const connectedPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        testRef.off('value');
        resolve(false);
      }, 10000);
      
      let resolved = false;
      testRef.on('value', (snapshot) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          testRef.off('value');
          
          firebaseConnected = snapshot.val() === true;
          console.log(firebaseConnected ? "✅ Firebase connecté" : "⚠️ Firebase déconnecté");
          resolve(firebaseConnected);
        }
      });
    });
    
    await connectedPromise;
    
    if (firebaseConnected) {
      try {
        await db.ref('test').set({ 
          timestamp: Date.now(),
          testType: "connection-check"
        });
        console.log("✅ Test d'écriture Firebase réussi");
        await db.ref('test').remove();
      } catch (writeError) {
        console.warn("⚠️ Écriture Firebase échouée mais lecture OK:", writeError.message);
      }
    } else {
      console.warn("⚠️ Firebase déconnecté, fonctionnement en mode lecture seule");
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Test Firebase échoué:", error.message);
    firebaseConnected = false;
    return true;
  }
}

async function initializeAppData() {
  try {
    console.log("🔄 Initialisation des données de l'application...");
    
    await testFirebaseConnection();
    
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = $("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
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
        
        dpInfo.nom = dpData.nom || "";
        
        console.log("✅ Informations DP du jour chargées");
      } else {
        console.log("ℹ️ Aucune information DP pour aujourd'hui");
      }
    } catch (error) {
      console.error("❌ Erreur chargement DP:", error);
    }

    console.log("📜 Chargement des données...");
    
    try {
      if (typeof chargerHistoriqueDP === 'function') {
        chargerHistoriqueDP();
        console.log("✅ Historique DP chargé");
      }
    } catch (error) {
      console.error("❌ Erreur chargement historique DP:", error);
    }
    
    try {
      await loadFromFirebase();
      console.log("✅ Données Firebase chargées");
    } catch (error) {
      console.error("❌ Erreur chargement Firebase:", error);
      plongeurs = [];
      palanquees = [];
      plongeursOriginaux = [];
    }
    
    try {
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
        console.log("✅ Sessions chargées");
      }
    } catch (error) {
      console.error("❌ Erreur chargement sessions:", error);
    }
    
    try {
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
        console.log("✅ Liste nettoyage sessions chargée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement liste nettoyage sessions:", error);
    }
    
    try {
      if (typeof populateDPCleanupList === 'function') {
        await populateDPCleanupList();
        console.log("✅ Liste nettoyage DP chargée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement liste nettoyage DP:", error);
    }
    
    const testButton = $("test-firebase");
    if (testButton) {
      console.log("✅ Bouton test Firebase trouvé");
    } else {
      console.warn("⚠️ Bouton test Firebase non trouvé dans le DOM");
    }
    
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
    console.log("✅ Application initialisée avec système de verrous!");
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    
  } catch (error) {
    console.error("❌ Erreur initialisation données:", error);
    console.error("Stack trace:", error.stack);
    
    if (!Array.isArray(plongeurs)) plongeurs = [];
    if (!Array.isArray(palanquees)) palanquees = [];
    if (!Array.isArray(plongeursOriginaux)) plongeursOriginaux = [];
    
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
    } catch (renderError) {
      console.error("❌ Erreur rendu en mode dégradé:", renderError);
    }
    
    const authError = $("auth-error");
    if (authError) {
      authError.textContent = "Erreur de chargement des données. Mode local activé.";
      authError.style.display = "block";
    }
    
    alert("Erreur de chargement. L'application fonctionne en mode dégradé.\\n\\nVeuillez actualiser la page ou contacter l'administrateur.");
  }
}

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
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
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
        @media print {
          body { background: white !important; }
          .container { box-shadow: none !important; max-width: none !important; }
        }
      </style>
    `;

    let htmlContent = '<!DOCTYPE html><html lang="fr"><head>';
    htmlContent += '<meta charset="UTF-8">';
    htmlContent += '<title>Palanquées JSAS - ' + formatDateFrench(dpDate) + '</title>';
    htmlContent += cssStyles;
    htmlContent += '</head><body>';
    
    htmlContent += '<div class="container">';
    htmlContent += '<header class="header">';
    htmlContent += '<h1 class="main-title">PALANQUÉES JSAS</h1>';
    htmlContent += '<p>Directeur de Plongée: ' + dpNom + '</p>';
    htmlContent += '<p>Date: ' + formatDateFrench(dpDate) + ' - ' + capitalize(dpPlongee) + '</p>';
    htmlContent += '<p>Lieu: ' + dpLieu + '</p>';
    htmlContent += '</header>';
    
    htmlContent += '<main class="content">';
    htmlContent += '<section class="section">';
    htmlContent += '<h2 class="section-title">📊 Résumé</h2>';
    htmlContent += '<p>Total plongeurs: ' + totalPlongeurs + '</p>';
    htmlContent += '<p>Palanquées: ' + palanquees.length + '</p>';
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
    
    if (palanquees.length === 0) {
      htmlContent += '<p>Aucune palanquée créée.</p>';
    } else {
      palanquees.forEach((pal, i) => {
        htmlContent += '<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">';
        htmlContent += '<h3>Palanquée ' + (i + 1) + ' (' + pal.length + ' plongeur' + (pal.length > 1 ? 's' : '') + ')</h3>';
        
        if (pal.length === 0) {
          htmlContent += '<p>Aucun plongeur assigné</p>';
        } else {
          pal.forEach(p => {
            htmlContent += '<p>• ' + p.nom + ' (' + p.niveau + ')' + (p.pre ? ' - ' + p.pre : '') + '</p>';
          });
        }
        htmlContent += '</div>';
      });
    }
    
    htmlContent += '</section>';
    
    if (plongeurs.length > 0) {
      htmlContent += '<section class="section">';
      htmlContent += '<h2 class="section-title">⏳ Plongeurs en Attente</h2>';
      plongeurs.forEach(p => {
        htmlContent += '<p>• ' + p.nom + ' (' + p.niveau + ')' + (p.pre ? ' - ' + p.pre : '') + '</p>';
      });
      htmlContent += '</section>';
    }
    
    htmlContent += '</main>';
    htmlContent += '</div></body></html>';

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
  
  try {
    // Version simplifiée pour éviter les erreurs
    alert("Fonction PDF en cours de développement. Utilisez l'aperçu PDF pour le moment.");
  } catch (error) {
    console.error("❌ Erreur PDF:", error);
    alert("Erreur lors de la génération du PDF : " + error.message);
  }
}

// ===== DRAG & DROP SÉCURISÉ =====

// Variables globales pour le drag & drop
let dragData = null;

function setupDragAndDrop() {
  // Event delegation pour dragstart
  document.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('plongeur-item')) return;
    
    console.log("🎯 Drag started");
    e.target.classList.add('dragging');
    e.target.style.opacity = '0.5';
    
    // Récupérer les données selon le type d'élément
    const isFromPalanquee = e.target.dataset.type === 'palanquee';
    
    if (isFromPalanquee) {
      const palanqueeIndex = parseInt(e.target.dataset.palanqueeIndex);
      const plongeurIndex = parseInt(e.target.dataset.plongeurIndex);
      
      if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
        dragData = {
          type: "fromPalanquee",
          palanqueeIndex: palanqueeIndex,
          plongeurIndex: plongeurIndex,
          plongeur: palanquees[palanqueeIndex][plongeurIndex]
        };
      }
    } else {
      const index = parseInt(e.target.dataset.index);
      if (plongeurs[index]) {
        dragData = {
          type: "fromMainList",
          plongeur: plongeurs[index],
          originalIndex: index
        };
      }
    }
    
    // Stocker dans dataTransfer si disponible
    if (e.dataTransfer && dragData) {
      e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      e.dataTransfer.effectAllowed = "move";
    }
  });
  
  // Event delegation pour dragend
  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('plongeur-item')) {
      e.target.classList.remove('dragging');
      e.target.style.opacity = '1';
    }
    dragData = null;
  });
  
  // Event delegation pour dragover
  document.addEventListener('dragover', (e) => {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      dropZone.classList.add('drag-over');
    }
  });
  
  // Event delegation pour dragleave
  document.addEventListener('dragleave', (e) => {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  });
  
  // Event delegation pour drop
  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (!dropZone) return;
    
    dropZone.classList.remove('drag-over');
    
    // Récupérer les données de drag
    let data = dragData;
    
    // Fallback vers dataTransfer si dragData n'est pas disponible
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
      console.warn("⚠️ Aucune donnée de drag disponible");
      return;
    }
    
    // Gestion du drop vers la liste principale
    if (dropZone.id === 'listePlongeurs') {
      if (data.type === "fromPalanquee") {
        // Vérifier le verrou
        if (typeof window.acquirePalanqueeLock === 'function') {
          const hasLock = await window.acquirePalanqueeLock(data.palanqueeIndex);
          if (!hasLock) {
            console.warn("⚠️ Verrou non acquis pour retour vers liste");
            return;
          }
        }
        
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
          syncToDatabase();
        }
      }
      return;
    }
    
    // Gestion du drop vers une palanquée
    const palanqueeIndex = parseInt(dropZone.dataset.index);
    if (isNaN(palanqueeIndex)) return;
    
    // Vérifier le verrou
    if (typeof window.acquirePalanqueeLock === 'function') {
      const hasLock = await window.acquirePalanqueeLock(palanqueeIndex);
      if (!hasLock) {
        console.warn("⚠️ Verrou non acquis pour ajout à palanquée");
        return;
      }
    }
    
    const targetPalanquee = palanquees[palanqueeIndex];
    
    if (data.type === "fromMainList") {
      const indexToRemove = plongeurs.findIndex(p => 
        p.nom === data.plongeur.nom && p.niveau === data.plongeur.niveau
      );
      
      if (indexToRemove !== -1) {
        plongeurs.splice(indexToRemove, 1);
        targetPalanquee.push(data.plongeur);
        syncToDatabase();
      }
    } else if (data.type === "fromPalanquee") {
      if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
        const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
        targetPalanquee.push(plongeur);
        syncToDatabase();
      }
    }
  });
}

// ===== EVENT HANDLERS =====
function setupEventListeners() {
  // === AUTHENTIFICATION ===
  addSafeEventListener("login-form", "submit", async (e) => {
    e.preventDefault();
    
    const email = $("login-email").value.trim();
    const password = $("login-password").value;
    const errorDiv = $("auth-error");
    const loadingDiv = $("auth-loading");
    
    if (!email || !password) {
      showAuthError("Veuillez remplir tous les champs");
      return;
    }
    
    try {
      if (loadingDiv) loadingDiv.style.display = "block";
      if (errorDiv) errorDiv.style.display = "none";
      
      await signIn(email, password);
      console.log("✅ Connexion réussie");
      
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
  
  addSafeEventListener("logout-btn", "click", async () => {
    try {
      await signOut();
      console.log("✅ Déconnexion réussie");
    } catch (error) {
      console.error("❌ Erreur déconnexion:", error);
    }
  });

  // === AJOUT DE PLONGEUR ===
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

  // === AJOUT DE PALANQUÉE ===
  addSafeEventListener("addPalanquee", "click", () => {
    const nouvellePalanquee = [];
    nouvellePalanquee.horaire = '';
    nouvellePalanquee.profondeurPrevue = '';
    nouvellePalanquee.dureePrevue = '';
    nouvellePalanquee.profondeurRealisee = '';
    nouvellePalanquee.dureeRealisee = '';
    nouvellePalanquee.paliers = '';
    
    palanquees.push(nouvellePalanquee);
    syncToDatabase();
  });

  // === EXPORT/IMPORT JSON ===
  addSafeEventListener("exportJSON", "click", () => {
    if (typeof exportToJSON === 'function') {
      exportToJSON();
    }
  });

  addSafeEventListener("importJSON", "change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e2 => {
      try {
        const data = JSON.parse(e2.target.result);
        
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
        syncToDatabase();
        alert("Import réussi !");
      } catch (error) {
        console.error("Erreur import:", error);
        alert("Erreur lors de l'import du fichier JSON");
      }
    };
    reader.readAsText(file);
  });

  // === PDF ===
  addSafeEventListener("generatePDF", "click", generatePDFPreview);
  addSafeEventListener("exportPDF", "click", exportToPDF);

  // === SESSIONS ===
  addSafeEventListener("load-session", "click", async () => {
    const sessionKey = $("session-selector").value;
    if (!sessionKey) {
      alert("Veuillez sélectionner une session à charger.");
      return;
    }
    
    if (typeof loadSession === 'function') {
      const success = await loadSession(sessionKey);
      if (!success) {
        alert("Erreur lors du chargement de la session.");
      }
    }
  });
  
  addSafeEventListener("refresh-sessions", "click", async () => {
    if (typeof populateSessionSelector === 'function') {
      await populateSessionSelector();
    }
    if (typeof populateSessionsCleanupList === 'function') {
      await populateSessionsCleanupList();
    }
  });

  addSafeEventListener("save-session", "click", async () => {
    if (typeof saveSessionData === 'function') {
      await saveSessionData();
      alert("Session sauvegardée !");
      if (typeof populateSessionSelector === 'function') {
        await populateSessionSelector();
      }
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
      }
    }
  });

  // === TEST FIREBASE ===
  addSafeEventListener("test-firebase", "click", async () => {
    console.log("🧪 === TEST FIREBASE COMPLET ===");
    
    try {
      console.log("📡 Test 1: Vérification connexion Firebase");
      console.log("Firebase connecté:", firebaseConnected);
      console.log("Instance db:", db ? "✅ OK" : "❌ MANQUANTE");
      
      if (db) {
        console.log("📖 Test 2: Lecture /sessions");
        const sessionsRead = await db.ref('sessions').once('value');
        console.log("✅ Lecture sessions OK:", sessionsRead.exists() ? "Données trouvées" : "Aucune donnée");
        
        if (sessionsRead.exists()) {
          const sessions = sessionsRead.val();
          console.log("Nombre de sessions:", Object.keys(sessions).length);
        }
      }
      
      console.log("📊 Test 3: Données actuelles");
      console.log("Plongeurs en mémoire:", plongeurs.length);
      console.log("Palanquées en mémoire:", palanquees.length);
      
      console.log("🎉 === TESTS TERMINÉS ===");
      alert("Test Firebase terminé !\n\nRegardez la console pour les détails.");
      
    } catch