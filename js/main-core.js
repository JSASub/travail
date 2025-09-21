// main-core.js - Réécriture complète et simplifiée
// Version 8.0.0 - Architecture modulaire et robuste

// ===== VARIABLES GLOBALES =====
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.plongeursOriginaux = window.plongeursOriginaux || [];

// Variables de session
let currentSessionKey = null;
let sessionModified = false;
let isInitialized = false;

// ===== GESTIONNAIRE D'ERREURS CENTRALISÉ =====
class ErrorHandler {
  static handle(error, context = "Application") {
    console.error(`Erreur ${context}:`, error);
    
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    // Log debug info seulement en cas d'erreur
    console.log("Debug info:", {
      firebaseConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined',
      currentUser: typeof currentUser !== 'undefined' ? (currentUser ? currentUser.email : 'null') : 'undefined',
      plongeursLength: Array.isArray(plongeurs) ? plongeurs.length : 'not array',
      palanqueesLength: Array.isArray(palanquees) ? palanquees.length : 'not array'
    });
    
    return false;
  }
  
  static setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.handle(event.error, "JavaScript global");
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(event.reason, "Promise rejection");
    });
  }
}

// ===== GESTIONNAIRE DE SYNCHRONISATION =====
class SyncManager {
  static async syncToDatabase() {
    console.log("Synchronisation Firebase...");
    
    try {
      // Validation des données
      if (!Array.isArray(plongeurs)) window.plongeurs = [];
      if (!Array.isArray(palanquees)) window.palanquees = [];
      if (!Array.isArray(plongeursOriginaux)) window.plongeursOriginaux = [];
      
      // Mettre à jour plongeursOriginaux
      plongeursOriginaux = [...plongeurs];
      
      // Marquer session modifiée si nécessaire
      if (currentSessionKey) {
        sessionModified = true;
        console.log("Session marquée comme modifiée");
      }
      
      // Synchroniser les prérogatives depuis l'interface
      this.syncPrerogativesFromInterface();
      
      // Re-rendre l'interface
      await InterfaceManager.renderAll();
      
      // Sauvegarder dans Firebase si connecté
      if (typeof firebaseConnected !== 'undefined' && firebaseConnected && typeof db !== 'undefined' && db) {
        try {
          await Promise.all([
            db.ref('plongeurs').set(plongeurs),
            db.ref('palanquees').set(palanquees)
          ]);
          
          console.log("Sauvegarde Firebase réussie");
          
        } catch (error) {
          console.error("Erreur sync Firebase:", error.message);
          
          if (typeof handleFirebaseError === 'function') {
            handleFirebaseError(error, 'Synchronisation');
          }
        }
      } else {
        console.warn("Firebase non connecté, données non sauvegardées");
      }
      
    } catch (error) {
      ErrorHandler.handle(error, "Synchronisation base de données");
    }
  }
  
  static syncPrerogativesFromInterface() {
    // Synchroniser toutes les prérogatives depuis les inputs
    document.querySelectorAll('.palanquee').forEach((palanqueeDiv, palIndex) => {
      const inputs = palanqueeDiv.querySelectorAll('input[placeholder*="rogative"]');
      inputs.forEach((input, plongeurIndex) => {
        if (palanquees[palIndex] && palanquees[palIndex][plongeurIndex]) {
          palanquees[palIndex][plongeurIndex].pre = input.value.trim();
        }
      });
    });
  }
  
  static async loadFromFirebase() {
    try {
      console.log("Chargement des données depuis Firebase...");
      
      if (!db) {
        console.warn("DB non disponible");
        return;
      }
      
      // Vérifier s'il y a une session active à charger
      const sessionKey = SessionManager.getCurrentSessionKey();
      
      if (sessionKey) {
        console.log("Tentative de chargement session:", sessionKey);
        
        const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
        if (sessionSnapshot.exists()) {
          const sessionData = sessionSnapshot.val();
          console.log("SESSION TROUVÉE - Chargement...");
          
          await SessionManager.loadSessionData(sessionData);
          return;
        }
      }
      
      // Fallback : charger les données DP générales
      console.log("Chargement données DP générales");
      const plongeursSnapshot = await db.ref('plongeurs').once('value');
      if (plongeursSnapshot.exists()) {
        plongeurs = plongeursSnapshot.val() || [];
      }
      
      const palanqueesSnapshot = await db.ref('palanquees').once('value');
      if (palanqueesSnapshot.exists()) {
        palanquees = palanqueesSnapshot.val() || [];
      }
      
      plongeursOriginaux = [...plongeurs];
      
      await InterfaceManager.renderAll();
      
    } catch (error) {
      ErrorHandler.handle(error, "Chargement Firebase");
    }
  }
}

// ===== GESTIONNAIRE D'INTERFACE =====
class InterfaceManager {
  static async renderAll() {
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      // Mettre à jour le menu flottant
      if (typeof updateFloatingPlongeursList === 'function') {
        setTimeout(updateFloatingPlongeursList, 200);
      }
    } catch (error) {
      ErrorHandler.handle(error, "Rendu interface");
    }
  }
  
  static forceUpdateCompteurs() {
    try {
      setTimeout(() => {
        if (typeof updateCompteurs === 'function') {
          updateCompteurs();
          console.log('Compteurs mis à jour');
        }
      }, 100);
    } catch (error) {
      ErrorHandler.handle(error, "Mise à jour compteurs");
    }
  }
  
  static showAuthError(message) {
    const errorDiv = document.getElementById("auth-error");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }
  
  static initializeFloatingMenus() {
    console.log('Initialisation forcée des menus flottants...');
    
    setTimeout(() => {
      // Forcer l'affichage de l'application principale
      const mainApp = document.getElementById('main-app');
      if (mainApp) {
        mainApp.style.display = 'block';
      }
      
      // Forcer l'affichage du menu latéral
      const floatingMenu = document.getElementById('floating-plongeurs-menu');
      if (floatingMenu) {
        floatingMenu.style.display = 'flex';
        floatingMenu.style.visibility = 'visible';
        floatingMenu.style.opacity = '1';
        console.log('Menu latéral forcé à s\'afficher');
      }
      
      // Appeler les fonctions d'initialisation si disponibles
      if (typeof window.initFloatingMenusManager === 'function') {
        window.initFloatingMenusManager();
      }
      
      if (typeof window.forceUpdatePlongeursMenu === 'function') {
        window.forceUpdatePlongeursMenu();
      }
      
      if (typeof window.enableDPButtons === 'function') {
        window.enableDPButtons();
      }
      
      // Mise à jour des compteurs après initialisation menu
      this.forceUpdateCompteurs();
      
    }, 1500);
  }
}

// ===== GESTIONNAIRE DE SESSIONS =====
class SessionManager {
  static getCurrentSessionKey() {
    const dpSelect = document.getElementById('dp-select');
    const dpDate = document.getElementById('dp-date');
    
    if (!dpSelect || !dpSelect.value || !dpDate || !dpDate.value) {
      return null;
    }
    
    const dpNom = this.getSelectedDPName();
    const dpPlongee = document.getElementById('dp-plongee')?.value || 'matin';
    
    if (dpNom && dpNom.includes('AGUIRRE')) {
      return `${dpDate.value}_AGUIRRE_${dpPlongee}`;
    }
    
    return null;
  }
  
  static getSelectedDPName() {
    const dpSelect = document.getElementById('dp-select');
    
    if (!dpSelect || !dpSelect.value) {
      console.warn("Aucun DP sélectionné");
      return "";
    }
    
    if (typeof DP_LIST !== 'undefined') {
      const selectedDP = DP_LIST.find(dp => dp.id === dpSelect.value);
      if (selectedDP) {
        console.log("DP sélectionné:", selectedDP.nom);
        return selectedDP.nom;
      }
    }
    
    const selectedOption = dpSelect.options[dpSelect.selectedIndex];
    if (selectedOption && selectedOption.text !== "-- Choisir un DP --") {
      const nom = selectedOption.text.split(' (')[0];
      console.log("DP extrait:", nom);
      return nom;
    }
    
    return "";
  }
  
  static async loadSessionData(sessionData) {
    try {
      // Restaurer les plongeurs
      plongeurs = sessionData.plongeurs || [];
      
      // Restaurer les palanquées
      palanquees = [];
      
      if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
        sessionData.palanquees.forEach((palData) => {
          const palanqueeArray = [];
          
          if (palData.plongeurs && Array.isArray(palData.plongeurs)) {
            palData.plongeurs.forEach(p => {
              palanqueeArray.push(p);
            });
          }
          
          if (palData.parametres) {
            palanqueeArray.horaire = palData.parametres.horaire || "";
            palanqueeArray.profondeurPrevue = palData.parametres.profondeurPrevue || "";
            palanqueeArray.dureePrevue = palData.parametres.dureePrevue || "";
            palanqueeArray.profondeurRealisee = palData.parametres.profondeurRealisee || "";
            palanqueeArray.dureeRealisee = palData.parametres.dureeRealisee || "";
            palanqueeArray.paliers = palData.parametres.paliers || "";
          }
          
          palanquees.push(palanqueeArray);
        });
      }
      
      plongeursOriginaux = [...plongeurs];
      
      // Restaurer les infos DP
      if (sessionData.meta) {
        this.restoreMetadata(sessionData.meta);
      }
      
      // Premier rendu
      await InterfaceManager.renderAll();
      
      // Restaurer les paramètres avec délai
      setTimeout(() => {
        this.restoreInterfaceParameters();
        
        // Rendu final
        setTimeout(async () => {
          await InterfaceManager.renderAll();
          
          // Notifier le système de sauvegarde automatique
          window.dispatchEvent(new CustomEvent('sessionLoaded', { 
            detail: sessionData 
          }));
          
        }, 500);
        
      }, 300);
      
      // Initialiser le tracking de session
      currentSessionKey = sessionData.meta?.sessionKey || null;
      sessionModified = false;
      
      console.log("Session chargée avec succès");
      
    } catch (error) {
      ErrorHandler.handle(error, "Chargement session");
    }
  }
  
  static restoreMetadata(meta) {
    // Restaurer la sélection DP
    const dpSelect = document.getElementById("dp-select");
    if (dpSelect && DP_LIST) {
      const dp = DP_LIST.find(d => d.nom === meta.dp);
      if (dp) {
        dpSelect.value = dp.id;
        console.log("DP sélectionné:", dp.nom);
        
        if (typeof window.enableDPButtons === 'function') {
          window.enableDPButtons();
        }
      }
    }
    
    // Restaurer les autres champs
    const dpDate = document.getElementById("dp-date");
    const dpLieu = document.getElementById("dp-lieu");
    const dpPlongee = document.getElementById("dp-plongee");
    
    if (dpDate) dpDate.value = meta.date || "";
    if (dpLieu) dpLieu.value = meta.lieu || "";
    if (dpPlongee) dpPlongee.value = meta.plongee || "matin";
  }
  
  static restoreInterfaceParameters() {
    console.log("Restauration des paramètres d'interface...");
    
    palanquees.forEach((pal, index) => {
      if (!Array.isArray(pal)) return;
      
      // Chercher les champs de saisie pour cette palanquée
      const inputs = {
        horaire: document.getElementById(`horaire-${index}`) || 
                document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Horaire"]`),
        profPrevue: document.getElementById(`profondeur-prevue-${index}`) || 
                   document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. prévue"]`),
        dureePrevue: document.getElementById(`duree-prevue-${index}`) || 
                    document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée prévue"]`),
        profRealisee: document.getElementById(`profondeur-realisee-${index}`) || 
                     document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. réalisée"]`),
        dureeRealisee: document.getElementById(`duree-realisee-${index}`) || 
                      document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée réalisée"]`),
        paliers: document.getElementById(`paliers-${index}`) || 
                document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Paliers"]`)
      };
      
      // Restaurer les valeurs
      if (inputs.horaire && pal.horaire) inputs.horaire.value = pal.horaire;
      if (inputs.profPrevue && pal.profondeurPrevue) inputs.profPrevue.value = pal.profondeurPrevue;
      if (inputs.dureePrevue && pal.dureePrevue) inputs.dureePrevue.value = pal.dureePrevue;
      if (inputs.profRealisee && pal.profondeurRealisee) inputs.profRealisee.value = pal.profondeurRealisee;
      if (inputs.dureeRealisee && pal.dureeRealisee) inputs.dureeRealisee.value = pal.dureeRealisee;
      if (inputs.paliers && pal.paliers) inputs.paliers.value = pal.paliers;
    });
    
    console.log("Restauration des paramètres terminée");
  }
  
  static async saveSessionData() {
    console.log("Sauvegarde session...");
    
    // Synchroniser les prérogatives
    SyncManager.syncPrerogativesFromInterface();
    
    const dpNom = this.getSelectedDPName();
    const dpDate = document.getElementById("dp-date")?.value;
    const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
    const dpPlongee = document.getElementById("dp-plongee")?.value;
    
    // Vérifications strictes
    if (!dpNom) {
      alert("Veuillez sélectionner un Directeur de Plongée dans la liste");
      return false;
    }
    
    if (!dpDate || !dpLieu) {
      alert("Veuillez remplir la date et le lieu");
      return false;
    }
    
    if (!db || !firebaseConnected) {
      console.error("Firebase non disponible");
      return false;
    }
    
    // Créer la clé de session
    const baseKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
    let sessionKey;
    
    if (sessionModified && currentSessionKey) {
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
      sessionKey = `${baseKey}_modif_${timestamp}`;
      console.log(`Session modifiée, nouvelle clé: ${sessionKey}`);
    } else {
      sessionKey = baseKey;
    }
    
    console.log("Clé de session:", sessionKey);
    
    // Capturer les données complètes
    const sessionData = this.captureSessionData(dpNom, dpDate, dpLieu, dpPlongee, sessionKey);
    
    console.log("Données complètes à sauvegarder:", sessionData);
    
    try {
      // Sauvegarder dans Firebase
      await db.ref(`sessions/${sessionKey}`).set(sessionData);
      console.log("Session sauvegardée:", sessionKey);
      
      // Sauvegarder les infos DP
      await db.ref(`dpInfo/${sessionKey}`).set({
        nom: dpNom,
        date: dpDate,
        lieu: dpLieu,
        plongee: dpPlongee,
        timestamp: Date.now(),
        validated: true
      });
      
      // Mettre à jour le tracking
      currentSessionKey = sessionKey;
      sessionModified = false;
      
      // Message de confirmation
      this.showSaveConfirmation(sessionKey, sessionData);
      
      return true;
      
    } catch (error) {
      console.error("Erreur:", error);
      alert(`ERREUR DE SAUVEGARDE\n\n${error.message}`);
      return false;
    }
  }
  
  static captureSessionData(dpNom, dpDate, dpLieu, dpPlongee, sessionKey) {
    const palanqueesData = [];
    
    if (palanquees && Array.isArray(palanquees)) {
      palanquees.forEach((pal, index) => {
        const palanqueeObj = {
          index: index,
          plongeurs: [],
          parametres: this.captureParametres(index, pal)
        };
        
        // Ajouter les plongeurs avec prérogatives à jour
        for (let i = 0; i < pal.length; i++) {
          if (pal[i] && pal[i].nom) {
            const prerogativesValue = this.getPlongeurPrerogatives(index, i, pal[i]);
            
            palanqueeObj.plongeurs.push({
              nom: pal[i].nom,
              niveau: pal[i].niveau || "",
              pre: prerogativesValue
            });
          }
        }
        
        palanqueesData.push(palanqueeObj);
      });
    }
    
    return {
      meta: {
        dp: dpNom,
        date: dpDate,
        lieu: dpLieu || "Non défini",
        plongee: dpPlongee,
        timestamp: Date.now(),
        sessionKey: sessionKey
      },
      plongeurs: plongeurs || [],
      palanquees: palanqueesData,
      stats: {
        totalPlongeurs: (plongeurs?.length || 0) + 
                       palanqueesData.reduce((total, pal) => total + pal.plongeurs.length, 0),
        nombrePalanquees: palanqueesData.length,
        plongeursNonAssignes: plongeurs?.length || 0
      }
    };
  }
  
  static captureParametres(index, pal) {
    return {
      horaire: this.getInputValue(index, "Horaire") || pal.horaire || "",
      profondeurPrevue: this.getInputValue(index, "Prof. prévue") || pal.profondeurPrevue || "",
      dureePrevue: this.getInputValue(index, "Durée prévue") || pal.dureePrevue || "",
      profondeurRealisee: this.getInputValue(index, "Prof. réalisée") || pal.profondeurRealisee || "",
      dureeRealisee: this.getInputValue(index, "Durée réalisée") || pal.dureeRealisee || "",
      paliers: this.getInputValue(index, "Paliers") || pal.paliers || ""
    };
  }
  
  static getInputValue(palanqueeIndex, placeholder) {
    const input = document.querySelector(`[data-palanquee="${palanqueeIndex}"] input[placeholder*="${placeholder}"]`) || 
                  document.getElementById(`${placeholder.toLowerCase().replace(/[^a-z]/g, '')}-${palanqueeIndex}`);
    return input ? input.value.trim() : "";
  }
  
  static getPlongeurPrerogatives(palanqueeIndex, plongeurIndex, plongeur) {
    const allPrerogativesInputs = Array.from(document.querySelectorAll('input.plongeur-prerogatives-editable'));
    
    let globalInputIndex = 0;
    for (let prevPalIndex = 0; prevPalIndex < palanqueeIndex; prevPalIndex++) {
      if (palanquees[prevPalIndex]) {
        globalInputIndex += palanquees[prevPalIndex].length;
      }
    }
    globalInputIndex += plongeurIndex;
    
    if (allPrerogativesInputs[globalInputIndex]) {
      return allPrerogativesInputs[globalInputIndex].value.trim();
    }
    
    return plongeur.pre || "";
  }
  
  static showSaveConfirmation(sessionKey, sessionData) {
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      const isNewSession = sessionKey.includes('_modif_');
      const plongeursEnAttente = plongeurs?.length || 0;
      const plongeursDansPalanquees = sessionData.palanquees.reduce((total, pal) => total + pal.plongeurs.length, 0);
      const nombrePalanquees = sessionData.palanquees.length;
      const totalGeneral = plongeursEnAttente + plongeursDansPalanquees;
      
      dpMessage.innerHTML = `
        <div style="background: #28a745; color: white; padding: 12px; border-radius: 5px; margin: 10px 0;">
          ${isNewSession ? 'NOUVELLE SESSION CRÉÉE!' : 'SESSION SAUVEGARDÉE!'}<br>
          ${totalGeneral} plongeurs total (${plongeursEnAttente} en attente, ${plongeursDansPalanquees} assignés)<br>
          ${nombrePalanquees} palanquée${nombrePalanquees > 1 ? 's' : ''}<br>
          Clé: ${sessionKey}
        </div>
      `;
      dpMessage.style.display = 'block';
      
      setTimeout(() => {
        dpMessage.style.display = 'none';
      }, 8000);
    }
  }
}

// ===== GESTIONNAIRE D'ÉVÉNEMENTS =====
class EventManager {
  static setupEventListeners() {
    console.log("Configuration des event listeners...");
    
    try {
      this.setupAuthListeners();
      this.setupMainAppListeners();
      this.setupDPListeners();
      
      console.log("Event listeners configurés avec succès");
      
    } catch (error) {
      ErrorHandler.handle(error, "Configuration event listeners");
    }
  }
  
  static setupAuthListeners() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const errorDiv = document.getElementById("auth-error");
        const loadingDiv = document.getElementById("auth-loading");
        
        if (!emailInput || !passwordInput) {
          InterfaceManager.showAuthError("Éléments de formulaire manquants");
          return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
          InterfaceManager.showAuthError("Veuillez remplir tous les champs");
          return;
        }
        
        try {
          if (loadingDiv) loadingDiv.style.display = "block";
          if (errorDiv) errorDiv.style.display = "none";
          
          if (typeof signIn === 'function') {
            await signIn(email, password);
            console.log("Connexion réussie");
            
            // Initialiser l'interface après connexion
            InterfaceManager.initializeFloatingMenus();
            
          } else {
            throw new Error("Fonction signIn non disponible");
          }
          
        } catch (error) {
          console.error("Erreur connexion:", error);
          
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
          
          InterfaceManager.showAuthError(message);
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
            console.log("Déconnexion réussie");
          }
        } catch (error) {
          ErrorHandler.handle(error, "Déconnexion");
        }
      });
    }
  }
  
  static setupMainAppListeners() {
    const addPalanqueeBtn = document.getElementById("addPalanquee");
    if (addPalanqueeBtn) {
      addPalanqueeBtn.addEventListener("click", () => {
        try {
          if (!Array.isArray(palanquees)) window.palanquees = [];
          
          const nouvellePalanquee = [];
          nouvellePalanquee.horaire = '';
          nouvellePalanquee.profondeurPrevue = '';
          nouvellePalanquee.dureePrevue = '';
          nouvellePalanquee.profondeurRealisee = '';
          nouvellePalanquee.dureeRealisee = '';
          nouvellePalanquee.paliers = '';
          
          palanquees.push(nouvellePalanquee);
          
          SyncManager.syncToDatabase();
          
          console.log("Nouvelle palanquée créée");
        } catch (error) {
          ErrorHandler.handle(error, "Création palanquée");
        }
      });
    }
    
    const generatePDFBtn = document.getElementById("generatePDF");
    if (generatePDFBtn) {
      generatePDFBtn.addEventListener("click", () => {
        try {
          if (typeof generatePDFPreview === 'function') {
            generatePDFPreview();
          } else {
            console.error("Fonction generatePDFPreview non disponible");
            alert("Erreur: Module PDF non chargé");
          }
        } catch (error) {
          ErrorHandler.handle(error, "Génération aperçu PDF");
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
            console.error("Fonction exportToPDF non disponible");
            alert("Erreur: Module PDF non chargé");
          }
        } catch (error) {
          ErrorHandler.handle(error, "Export PDF");
        }
      });
    }
  }
  
  static setupDPListeners() {
    const dpSelect = document.getElementById('dp-select');
    if (dpSelect) {
      dpSelect.addEventListener('change', function() {
        const dpNom = SessionManager.getSelectedDPName();
        console.log("DP changé:", dpNom);
        
        // Activer les boutons DP après sélection
        if (typeof window.enableDPButtons === 'function') {
          window.enableDPButtons();
        }
      });
    }
    
    const validerBtn = document.getElementById('valider-dp');
    if (validerBtn) {
      // Remplacer le listener existant
      const newBtn = validerBtn.cloneNode(true);
      validerBtn.parentNode.replaceChild(newBtn, validerBtn);
      
      newBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const dpNom = SessionManager.getSelectedDPName();
        if (!dpNom) {
          alert("Veuillez sélectionner un Directeur de Plongée");
          return;
        }
        
        newBtn.disabled = true;
        newBtn.textContent = "Sauvegarde...";
        
        try {
          const success = await SessionManager.saveSessionData();
          
          if (success) {
            newBtn.textContent = "Sauvegardé !";
            
            setTimeout(() => {
              newBtn.disabled = false;
              newBtn.textContent = "Save Session + DP";
            }, 3000);
          } else {
            throw new Error("Échec de la sauvegarde");
          }
          
        } catch (error) {
          console.error("Erreur:", error);
          newBtn.textContent = "Erreur";
          
          setTimeout(() => {
            newBtn.disabled = false;
            newBtn.textContent = "Save Session + DP";
          }, 2000);
        }
      });
    }
  }
}

// ===== GESTIONNAIRE DE DRAG & DROP =====
class DragDropManager {
  static dragData = null;
  
  static setup() {
    console.log("Configuration du drag & drop...");
    
    try {
      // Nettoyer les anciens listeners
      document.removeEventListener('dragstart', this.handleDragStart);
      document.removeEventListener('dragend', this.handleDragEnd);
      document.removeEventListener('dragover', this.handleDragOver);
      document.removeEventListener('dragleave', this.handleDragLeave);
      document.removeEventListener('drop', this.handleDrop);
      
      // Ajouter les nouveaux listeners
      document.addEventListener('dragstart', this.handleDragStart.bind(this));
      document.addEventListener('dragend', this.handleDragEnd.bind(this));
      document.addEventListener('dragover', this.handleDragOver.bind(this));
      document.addEventListener('dragleave', this.handleDragLeave.bind(this));
      document.addEventListener('drop', this.handleDrop.bind(this));
      
      console.log("Drag & drop configuré");
      
    } catch (error) {
      ErrorHandler.handle(error, "Configuration drag & drop");
    }
  }
  
  static handleDragStart(e) {
    try {
      if (!e.target.classList.contains('plongeur-item')) return;
      
      e.target.classList.add('dragging');
      e.target.style.opacity = '0.5';
      
      const isFromPalanquee = e.target.dataset.type === 'palanquee';
      
      if (isFromPalanquee) {
        const palanqueeIndex = parseInt(e.target.dataset.palanqueeIndex);
        const plongeurIndex = parseInt(e.target.dataset.plongeurIndex);
        
        if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
          this.dragData = {
            type: "fromPalanquee",
            palanqueeIndex: palanqueeIndex,
            plongeurIndex: plongeurIndex,
            plongeur: palanquees[palanqueeIndex][plongeurIndex]
          };
        }
      } else {
        const index = parseInt(e.target.dataset.index);
        
        if (plongeurs[index]) {
          this.dragData = {
            type: "fromMainList",
            plongeur: plongeurs[index],
            originalIndex: index
          };
        }
      }
      
      if (e.dataTransfer && this.dragData) {
        try {
          e.dataTransfer.setData("text/plain", JSON.stringify(this.dragData));
          e.dataTransfer.effectAllowed = "move";
        } catch (error) {
          console.warn("Erreur dataTransfer:", error);
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, "Drag start");
    }
  }
  
  static handleDragEnd(e) {
    try {
      if (e.target.classList.contains('plongeur-item')) {
        e.target.classList.remove('dragging');
        e.target.style.opacity = '1';
      }
    } catch (error) {
      console.error("Erreur handleDragEnd:", error);
    }
  }
  
  static handleDragOver(e) {
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
      console.error("Erreur handleDragOver:", error);
    }
  }
  
  static handleDragLeave(e) {
    try {
      const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
      if (dropZone && !dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('drag-over');
      }
    } catch (error) {
      console.error("Erreur handleDragLeave:", error);
    }
  }
  
  static async handleDrop(e) {
    try {
      e.preventDefault();
      
      const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
      if (!dropZone) {
        this.dragData = null;
        return;
      }
      
      dropZone.classList.remove('drag-over');
      
      let data = this.dragData;
      
      if (!data && e.dataTransfer) {
        try {
          const dataStr = e.dataTransfer.getData("text/plain");
          if (dataStr) {
            data = JSON.parse(dataStr);
          }
        } catch (error) {
          console.warn("Erreur parsing dataTransfer:", error);
        }
      }
      
      if (!data) {
        this.dragData = null;
        return;
      }
      
      // S'assurer que les variables globales existent
      if (!Array.isArray(plongeurs)) window.plongeurs = [];
      if (!Array.isArray(palanquees)) window.palanquees = [];
      if (!Array.isArray(plongeursOriginaux)) window.plongeursOriginaux = [];
      
      // Drop vers la liste principale
      if (dropZone.id === 'listePlongeurs') {
        if (data.type === "fromPalanquee") {
          if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
            const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
            plongeurs.push(plongeur);
            plongeursOriginaux.push(plongeur);
            
            await SyncManager.syncToDatabase();
          }
        }
      } else {
        // Drop vers une palanquée
        const palanqueeIndex = parseInt(dropZone.dataset.index);
        if (isNaN(palanqueeIndex)) {
          this.dragData = null;
          return;
        }
        
        const targetPalanquee = palanquees[palanqueeIndex];
        if (!targetPalanquee) {
          this.dragData = null;
          return;
        }
        
        // Vérifier les règles de validation avant d'ajouter
        if (typeof validatePalanqueeAddition === 'function') {
          const validation = validatePalanqueeAddition(palanqueeIndex, data.plongeur);
          if (!validation.valid) {
            const messageText = validation.messages.join('\n');
            alert(`Ajout impossible :\n\n${messageText}`);
            this.dragData = null;
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
            
            await SyncManager.syncToDatabase();
          }
          
        } else if (data.type === "fromPalanquee") {
          if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
            const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
            targetPalanquee.push(plongeur);
            
            await SyncManager.syncToDatabase();
          }
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, "Handle drop");
    } finally {
      this.dragData = null;
    }
  }
}

// ===== GESTIONNAIRE D'INITIALISATION =====
class AppInitializer {
  static async initializeFirebaseConnection() {
    try {
      console.log("Test de connexion Firebase sécurisé...");
      
      if (!db) {
        throw new Error("Instance Firebase Database non initialisée");
      }
      
      if (!auth) {
        throw new Error("Instance Firebase Auth non initialisée");
      }
      
      const testRef = db.ref('.info/connected');
      const connectedPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          try {
            testRef.off('value');
          } catch (e) {
            console.warn("Erreur suppression listener test:", e);
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
              console.warn("Erreur suppression listener:", e);
            }
            
            firebaseConnected = snapshot.val() === true;
            console.log(firebaseConnected ? "Firebase connecté" : "Firebase déconnecté");
            resolve(firebaseConnected);
          }
        };
        
        testRef.on('value', listener, (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.error("Erreur listener connexion:", error);
            resolve(false);
          }
        });
      });
      
      await connectedPromise;
      
      if (firebaseConnected) {
        try {
          const testWriteRef = db.ref('test-connection');
          await testWriteRef.set({ 
            timestamp: Date.now(),
            testType: "connection-check",
            user: currentUser?.email || "anonymous"
          });
          console.log("Test d'écriture Firebase réussi");
          
          await testWriteRef.remove();
        } catch (writeError) {
          console.warn("Écriture Firebase échouée mais lecture OK:", writeError.message);
          if (typeof FirebaseErrorHandler !== 'undefined') {
            FirebaseErrorHandler.handleError(writeError, 'Test écriture');
          }
        }
      } else {
        console.warn("Firebase déconnecté, fonctionnement en mode lecture seule");
      }
      
      return true;
      
    } catch (error) {
      console.error("Test Firebase échoué:", error.message);
      if (typeof FirebaseErrorHandler !== 'undefined') {
        FirebaseErrorHandler.handleError(error, 'Test connexion');
      }
      firebaseConnected = false;
      return true; // Continue en mode dégradé
    }
  }
  
  static async initializeAppData() {
    try {
      console.log("Initialisation sécurisée des données de l'application...");
      
      // Vérifier que les variables globales sont initialisées
      if (!Array.isArray(plongeurs)) {
        console.warn("Variable plongeurs non initialisée, correction...");
        window.plongeurs = [];
      }
      if (!Array.isArray(palanquees)) {
        console.warn("Variable palanquees non initialisée, correction...");
        window.palanquees = [];
      }
      if (!Array.isArray(plongeursOriginaux)) {
        console.warn("Variable plongeursOriginaux non initialisée, correction...");
        window.plongeursOriginaux = [];
      }
      
      // Test de connexion sécurisé
      await this.initializeFirebaseConnection();
      
      // Initialiser la date du jour
      const today = new Date().toISOString().split("T")[0];
      const dpDateInput = document.getElementById("dp-date");
      if (dpDateInput) {
        dpDateInput.value = today;
      }
      
      console.log("Chargement des données...");
      
      // Charger les données Firebase avec gestion d'erreur
      try {
        await SyncManager.loadFromFirebase();
        console.log("Données Firebase chargées");
      } catch (error) {
        console.error("Erreur chargement Firebase:", error);
        
        // Initialisation de secours
        if (!Array.isArray(plongeurs)) window.plongeurs = [];
        if (!Array.isArray(palanquees)) window.palanquees = [];
        if (!Array.isArray(plongeursOriginaux)) window.plongeursOriginaux = [];
      }
      
      // Rendu initial sécurisé
      try {
        await InterfaceManager.renderAll();
        
        // Mise à jour forcée des compteurs au démarrage
        InterfaceManager.forceUpdateCompteurs();
        
      } catch (renderError) {
        console.error("Erreur rendu initial:", renderError);
      }
      
      console.log("Application initialisée avec succès!");
      
      if (plongeurs.length > 0 || palanquees.length > 0) {
        console.log(`${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
      }
      
    } catch (error) {
      console.error("Erreur critique initialisation données:", error);
      ErrorHandler.handle(error, "Initialisation données");
      
      // Mode de récupération d'urgence
      try {
        console.log("Activation du mode de récupération d'urgence...");
        
        // Initialiser les variables minimales
        if (!Array.isArray(plongeurs)) window.plongeurs = [];
        if (!Array.isArray(palanquees)) window.palanquees = [];
        if (!Array.isArray(plongeursOriginaux)) window.plongeursOriginaux = [];
        
        // Essayer le rendu de base
        await InterfaceManager.renderAll();
        
        console.log("Mode de récupération activé");
        
      } catch (recoveryError) {
        console.error("Échec du mode de récupération:", recoveryError);
        
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
  
  static async initialize() {
    console.log("Initialisation sécurisée de l'application JSAS...");
    
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
      
      // 3. Configurer les gestionnaires d'erreurs globaux
      ErrorHandler.setupGlobalHandlers();
      
      // 4. Configurer les event listeners
      EventManager.setupEventListeners();
      
      // 5. Configurer le drag & drop
      DragDropManager.setup();
      
      // 6. Initialiser les gestionnaires de modules
      if (typeof initializeDPSessionsManager === 'function') {
        initializeDPSessionsManager();
      }
      
      // Marquer comme initialisé
      isInitialized = true;
      
      console.log("Application JSAS initialisée avec succès !");
      
    } catch (error) {
      console.error("Erreur critique initialisation:", error);
      ErrorHandler.handle(error, "Initialisation critique");
      
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
        "ERREUR CRITIQUE D'INITIALISATION\n\n" +
        "L'application n'a pas pu s'initialiser correctement.\n\n" +
        "Actions recommandées :\n" +
        "1. Actualisez la page (F5)\n" +
        "2. Vérifiez votre connexion internet\n" +
        "3. Videz le cache du navigateur\n" +
        "4. Contactez l'administrateur si le problème persiste\n\n" +
        "Erreur : " + error.message
      );
    }
  }
}

// ===== FONCTIONS UTILITAIRES GLOBALES =====

// Fonction pour charger une session complète
async function loadSession(sessionKey) {
  console.log("Chargement session:", sessionKey);
  
  try {
    if (!db) {
      alert("Firebase non disponible");
      return false;
    }
    
    const snapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!snapshot.exists()) {
      alert("Session non trouvée");
      return false;
    }
    
    const sessionData = snapshot.val();
    
    await SessionManager.loadSessionData(sessionData);
    
    return true;
    
  } catch (error) {
    console.error("Erreur:", error);
    alert(`Erreur lors du chargement:\n${error.message}`);
    return false;
  }
}

// Fonction de diagnostic
function diagnosticJSAS() {
  console.log(" === DIAGNOSTIC JSAS ===");
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    initialized: isInitialized,
    session: {
      currentKey: currentSessionKey,
      modified: sessionModified
    },
    variables: {
      plongeurs: Array.isArray(plongeurs) ? plongeurs.length : 'not array',
      palanquees: Array.isArray(palanquees) ? palanquees.length : 'not array',
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
    }
  };
  
  console.log("Diagnostic complet:", diagnostic);
  console.log("=== FIN DIAGNOSTIC ===");
  
  return diagnostic;
}

// ===== EXPORTS GLOBAUX =====
window.ErrorHandler = ErrorHandler;
window.SyncManager = SyncManager;
window.InterfaceManager = InterfaceManager;
window.SessionManager = SessionManager;
window.EventManager = EventManager;
window.DragDropManager = DragDropManager;
window.AppInitializer = AppInitializer;

// Fonctions de compatibilité avec l'ancien code
window.handleError = ErrorHandler.handle;
window.syncToDatabase = SyncManager.syncToDatabase;
window.loadFromFirebase = SyncManager.loadFromFirebase;
window.saveSessionData = SessionManager.saveSessionData;
window.loadSession = loadSession;
window.diagnosticJSAS = diagnosticJSAS;
window.forceInitializeFloatingMenus = InterfaceManager.initializeFloatingMenus;
window.getSelectedDPName = SessionManager.getSelectedDPName;

// ===== INITIALISATION AUTOMATIQUE =====
document.addEventListener('DOMContentLoaded', async () => {
  await AppInitializer.initialize();
});

console.log("Main Core réécrit chargé - Version 8.0.0 - Architecture modulaire");