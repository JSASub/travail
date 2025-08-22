// main-core.js - Fichier principal allégé (remplace main-complete.js)

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

    // === PDF SÉCURISÉ ===
    const generatePDFBtn = document.getElementById("generatePDF");
    if (generatePDFBtn) {
      generatePDFBtn.addEventListener("click", () => {
        try {
          if (typeof generatePDFPreview === 'function') {
            generatePDFPreview();
          } else {
            console.error("❌ Fonction generatePDFPreview non disponible");
            alert("Erreur: Module PDF non chargé");
          }
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
          if (typeof exportToPDF === 'function') {
            exportToPDF();
          } else {
            console.error("❌ Fonction exportToPDF non disponible");
            alert("Erreur: Module PDF non chargé");
          }
        } catch (error) {
          console.error("❌ Erreur export PDF:", error);
          handleError(error, "Export PDF");
        }
      });
    }
    
    console.log("✅ Event listeners configurés avec succès");
    
  } catch (error) {
    console.error("❌ Erreur configuration event listeners:", error);
    handleError(error, "Configuration event listeners");
  }
}

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
    modules: {
      pdfManager: typeof exportToPDF !== 'undefined' ? 'loaded' : 'missing',
      plongeursManager: typeof addPlongeur !== 'undefined' ? 'loaded' : 'missing',
      dpSessionsManager: typeof validateAndSaveDP !== 'undefined' ? 'loaded' : 'missing',
      renderDom: typeof renderPlongeurs !== 'undefined' ? 'loaded' : 'missing',
      configFirebase: typeof initializeFirebase !== 'undefined' ? 'loaded' : 'missing'
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
    
    // 5. Initialiser les gestionnaires de modules
    if (typeof initializePlongeursManager === 'function') {
      initializePlongeursManager();
    }
    
    if (typeof initializeDPSessionsManager === 'function') {
      initializeDPSessionsManager();
    }
    
    // 6. Ajouter les gestionnaires d'erreurs globaux
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

// ===== EXPORTS GLOBAUX =====
window.handleError = handleError;
window.testFirebaseConnectionSafe = testFirebaseConnectionSafe;
window.initializeAppData = initializeAppData;
window.setupDragAndDrop = setupDragAndDrop;
window.setupEventListeners = setupEventListeners;

console.log("✅ Main Core sécurisé chargé - Version 3.0.1");