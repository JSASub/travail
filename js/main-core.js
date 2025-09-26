// main-core.js - Version corrigée pour préserver le système de sessions existant
// PROTECTION ANTI-UNDEFINED
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.plongeursOriginaux = window.plongeursOriginaux || [];

// Variables globales de session
let currentSessionKey = null;
let sessionModified = false;

// SOLUTION AGRESSIVE POUR LES BOÎTES DE DIALOGUE
const originalAlert = window.alert;
window.alert = function(message) {
    if (typeof message === 'string' && message.includes('0 palanquée')) {
        const palanqueesCount = document.querySelectorAll('.palanquee').length;
        let plongeursCount = 0;
        document.querySelectorAll('.palanquee').forEach(pal => {
            plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
        });
        
        const messageCorrige = message.replace(
            /\d+\s*plongeurs?\s+dans\s+0\s+palanquées?/gi, 
            `${plongeursCount} plongeurs dans ${palanqueesCount} palanquées`
        );
        
        console.log(`Alert corrigée: "${message}" → "${messageCorrige}"`);
        return originalAlert.call(this, messageCorrige);
    }
    return originalAlert.call(this, message);
};

const originalConfirm = window.confirm;
window.confirm = function(message) {
    if (typeof message === 'string' && message.includes('0 palanquée')) {
        const palanqueesCount = document.querySelectorAll('.palanquee').length;
        let plongeursCount = 0;
        document.querySelectorAll('.palanquee').forEach(pal => {
            plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
        });
        
        const messageCorrige = message.replace(
            /\d+\s*plongeurs?\s+dans\s+0\s+palanquées?/gi, 
            `${plongeursCount} plongeurs dans ${palanqueesCount} palanquées`
        );
        
        console.log(`Confirm corrigée: "${message}" → "${messageCorrige}"`);
        return originalConfirm.call(this, messageCorrige);
    }
    return originalConfirm.call(this, message);
};
//
function fixPalanqueesData() {
    // Si window.palanquees n'est pas un tableau, le corriger
    if (!Array.isArray(window.palanquees)) {
        console.log("Correction de window.palanquees...");
        window.palanquees = [];
        
        // Reconstruire depuis le DOM
        document.querySelectorAll('.palanquee').forEach((palDiv, index) => {
            const plongeurs = [];
            palDiv.querySelectorAll('.palanquee-plongeur-item').forEach(item => {
                const nom = item.querySelector('.plongeur-nom')?.textContent.trim();
                const niveau = item.querySelector('.plongeur-niveau')?.textContent.trim();
                const preInput = item.querySelector('.plongeur-prerogatives-editable');
                const pre = preInput ? preInput.value.trim() : "";
                if (nom && niveau) {
                    plongeurs.push({nom, niveau, pre});
                }
            });
            window.palanquees.push(plongeurs);
        });
        
        // Nettoyer les doublons
        const plongeursEnPalanquees = new Set();
        window.palanquees.forEach(pal => {
            pal.forEach(p => plongeursEnPalanquees.add(p.nom));
        });
        window.plongeurs = window.plongeurs.filter(p => !plongeursEnPalanquees.has(p.nom));
        
        console.log("window.palanquees corrigé:", window.palanquees);
    }
}
// Ajoutez également cette fonction pour forcer la mise à jour du menu
function forceMenuUpdate() {
    fixPalanqueesData();
    
    setTimeout(() => {
        if (typeof updateFloatingPlongeursList === 'function') {
            updateFloatingPlongeursList();
        }
        if (typeof window.forceUpdatePlongeursMenu === 'function') {
            window.forceUpdatePlongeursMenu();
        }
        if (typeof updateCompteurs === 'function') {
            updateCompteurs();
        }
    }, 50);
}

//
function getCurrentPalanqueesStats() {
    const palanqueesCount = document.querySelectorAll('.palanquee').length;
    let plongeursCount = 0;
    document.querySelectorAll('.palanquee').forEach(pal => {
        plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
    });
    return { palanqueesCount, plongeursCount };
}

window.getCurrentPalanqueesStats = getCurrentPalanqueesStats;

function reconstructDataFromDOM() {
    const listDOM = document.getElementById('listePlongeurs');
    
    if (!listDOM) return false;
    
    const domCount = listDOM.children.length;
    const memoryCount = window.plongeurs ? window.plongeurs.length : 0;
    
    console.log(`Reconstruction DOM: ${domCount} dans DOM, ${memoryCount} en mémoire`);
    
    if (domCount > 0 && memoryCount === 0) {
        console.log('Reconstruction des données plongeurs depuis le DOM...');
        
        window.plongeurs = [];
        
        Array.from(listDOM.children).forEach(li => {
            const text = li.textContent || li.innerText;
            const parts = text.split(' - ');
            
            if (parts.length >= 2) {
                window.plongeurs.push({
                    nom: parts[0].trim(),
                    niveau: parts[1].trim(),
                    pre: parts[2] ? parts[2].replace(/[\[\]]/g, '').trim() : ''
                });
            }
        });
        
        window.plongeursOriginaux = [...window.plongeurs];
        
        console.log('Reconstruction terminée:', window.plongeurs.length, 'plongeurs');
        
        setTimeout(() => {
            if (typeof updateCompteurs === 'function') {
                updateCompteurs();
                console.log('Compteurs mis à jour après reconstruction DOM');
            }
        }, 300);
        
        return true;
    }
    
    return false;
}

window.reconstructDataFromDOM = reconstructDataFromDOM;

// Forcer l'initialisation des variables globales
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.plongeurs === 'undefined') {
    window.plongeurs = [];
  }
  
  const listDOM = document.getElementById('listePlongeurs');
  if (listDOM && listDOM.children.length > 0 && window.plongeurs.length === 0) {
    console.log('Reconstruction des données plongeurs depuis le DOM...');
    
    Array.from(listDOM.children).forEach(li => {
      const text = li.textContent || li.innerText;
      const parts = text.split(' - ');
      
      if (parts.length >= 2) {
        window.plongeurs.push({
          nom: parts[0].trim(),
          niveau: parts[1].trim(),
          pre: parts[2] ? parts[2].replace('[', '').replace(']', '').trim() : ''
        });
      }
    });
    
    console.log('Reconstruction terminée:', window.plongeurs.length, 'plongeurs');
    
    if (typeof updateFloatingPlongeursList === 'function') {
      updateFloatingPlongeursList();
    }
  }
});

function getSelectedDPName() {
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

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const originalConsoleLog = console.log;
  console.log = function() {
    if (arguments[0] && (arguments[0].includes('✅') || arguments[0].includes('⚠'))) {
      originalConsoleLog.apply(console, arguments);
    }
  }
}

// ===== SYNCHRONISATION BASE DE DONNÉES MODIFIÉE =====
async function syncToDatabase() {
  console.log("Synchronisation Firebase...");
  
  try {
    if (typeof plongeurs === 'undefined') window.plongeurs = [];
    if (typeof palanquees === 'undefined') window.palanquees = [];
    if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    
    plongeursOriginaux = [...plongeurs];
    
    if (currentSessionKey) {
      sessionModified = true;
      console.log("Session marquée comme modifiée");
    }
    
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
    if (typeof firebaseConnected !== 'undefined' && firebaseConnected && typeof db !== 'undefined' && db) {
      try {
        await Promise.all([
          db.ref('plongeurs').set(plongeurs),
          db.ref('palanquees').set(palanquees)
        ]);
        
        console.log("Sauvegarde Firebase réussie (données seulement)");
        
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
    console.error("Erreur syncToDatabase:", error);
    handleError(error, "Synchronisation base de données");
  }
}

// ===== CHARGEMENT DEPUIS FIREBASE PRÉSERVÉ =====
async function loadFromFirebase() {
  try {
    console.log("Chargement des données depuis Firebase...");
    
    if (!db) {
      console.warn("DB non disponible");
      return;
    }
    
    // PRÉSERVER : Ne pas interférer avec le système de sessions existant
    // Juste charger les données de base
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
    
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
  } catch (error) {
    console.error("Erreur chargement Firebase:", error);
  }
}

function syncPrerogativesFromInterface() {
  document.querySelectorAll('.palanquee').forEach((palanqueeDiv, palIndex) => {
    const inputs = palanqueeDiv.querySelectorAll('input[placeholder*="rogative"]');
    inputs.forEach((input, plongeurIndex) => {
      if (palanquees[palIndex] && palanquees[palIndex][plongeurIndex]) {
        palanquees[palIndex][plongeurIndex].pre = input.value.trim();
      }
    });
  });
}

function showAuthError(message) {
  const errorDiv = document.getElementById("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function forceInitializeFloatingMenus() {
    console.log('Initialisation forcée des menus flottants...');
    
    function syncMenuWidth() {
        const saveBtn = document.getElementById('floating-save-btn');
        const menu = document.getElementById('floating-plongeurs-menu');
        
        if (saveBtn && menu) {
            const btnWidth = saveBtn.getBoundingClientRect().width;
            if (btnWidth > 0) {
                menu.style.width = btnWidth + 'px';
                menu.style.minWidth = btnWidth + 'px';
                menu.style.maxWidth = btnWidth + 'px';
                console.log('Menu synchronisé avec bouton Save:', btnWidth + 'px');
            }
        }
    }
    
    setTimeout(() => {
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
        }
        
        const floatingMenu = document.getElementById('floating-plongeurs-menu');
        if (floatingMenu) {
            floatingMenu.style.display = 'flex';
            floatingMenu.style.visibility = 'visible';
            floatingMenu.style.opacity = '1';
            console.log('Menu latéral forcé à s\'afficher');
        }
        
        if (typeof window.initFloatingMenusManager === 'function') {
            window.initFloatingMenusManager();
        }
        
        if (typeof window.forceUpdatePlongeursMenu === 'function') {
            window.forceUpdatePlongeursMenu();
        }
        
        if (typeof window.enableDPButtons === 'function') {
            window.enableDPButtons();
        }
        
        setTimeout(() => {
          if (typeof updateCompteurs === 'function') {
            updateCompteurs();
            console.log('Compteurs mis à jour après initialisation menu');
          }
        }, 1000);
        
        setTimeout(syncMenuWidth, 500);
        setTimeout(syncMenuWidth, 1500);
        
        setInterval(() => {
            const menu = document.getElementById('floating-plongeurs-menu');
            if (menu && (menu.style.width === '0px' || menu.style.width === '')) {
                syncMenuWidth();
                console.log('Largeur du menu resynchronisée');
            }
        }, 3000);
        
    }, 1500);
}

function setupMenuSurveillance() {
    let surveillanceCount = 0;
    const maxSurveillance = 60;
    
    const surveillanceInterval = setInterval(() => {
        surveillanceCount++;
        
        const mainApp = document.getElementById('main-app');
        const floatingMenu = document.getElementById('floating-plongeurs-menu');
        
        if (mainApp && mainApp.style.display !== 'none' && 
            floatingMenu && floatingMenu.style.display === 'none') {
            
            console.log('Correction automatique du menu latéral');
            floatingMenu.style.display = 'flex';
            floatingMenu.style.visibility = 'visible';
            floatingMenu.style.opacity = '1';
            
            if (typeof window.forceUpdatePlongeursMenu === 'function') {
                window.forceUpdatePlongeursMenu();
            }
        }
        
        if (surveillanceCount >= maxSurveillance || 
            (floatingMenu && floatingMenu.style.display === 'flex')) {
            clearInterval(surveillanceInterval);
        }
        
    }, 1000);
}

function setupCompteurSurveillance() {
  let tentatives = 0;
  const maxTentatives = 10;
  
  const surveillanceInterval = setInterval(() => {
    tentatives++;
    
    const compteur = document.getElementById('compteur-plongeurs');
    const listePlongeurs = document.querySelectorAll('#listePlongeurs li').length;
    
    if (compteur && compteur.textContent === '(0)' && listePlongeurs > 0) {
      console.log(`Correction compteur détectée: ${listePlongeurs} plongeurs`);
      if (typeof updateCompteurs === 'function') {
        updateCompteurs();
      }
    }
    
    if (tentatives >= maxTentatives) {
      clearInterval(surveillanceInterval);
      console.log('Surveillance compteurs arrêtée');
    }
  }, 3000);
}

function setupPostRefusalSurveillance() {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkInterval = setInterval(() => {
        attempts++;
        
        const listCount = document.querySelectorAll('#listePlongeurs li').length;
        const memoryCount = window.plongeurs ? window.plongeurs.length : 0;
        const compteurText = document.getElementById('compteur-plongeurs')?.textContent;
        
        if (listCount > 0 && memoryCount === 0) {
            console.log('Désynchronisation détectée, reconstruction depuis DOM...');
            
            window.plongeurs = [];
            const listDOM = document.getElementById('listePlongeurs');
            
            Array.from(listDOM.children).forEach(li => {
                const text = li.textContent || li.innerText;
                const parts = text.split(' - ');
                
                if (parts.length >= 2) {
                    window.plongeurs.push({
                        nom: parts[0].trim(),
                        niveau: parts[1].trim(),
                        pre: parts[2] ? parts[2].replace(/[\[\]]/g, '').trim() : ''
                    });
                }
            });
            
            window.plongeursOriginaux = [...window.plongeurs];
            
            if (typeof updateCompteurs === 'function') {
                updateCompteurs();
            }
            
            if (typeof updateFloatingPlongeursList === 'function') {
                updateFloatingPlongeursList();
            }
            
            clearInterval(checkInterval);
            console.log('Synchronisation terminée:', window.plongeurs.length, 'plongeurs');
            return;
        }
        
        if (compteurText === '(0)' && listCount > 0) {
            console.log('Correction compteur post-refus détectée');
            if (typeof updateCompteurs === 'function') {
                updateCompteurs();
            }
        }
        
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.log('Surveillance post-refus terminée');
        }
    }, 1000);
}

// ===== FONCTION SAVESESSIONDATA AVEC INTÉGRATION AMÉLIORÉE =====
async function saveSessionData() {
  console.log("Sauvegarde session avec protection...");
  
  // Synchroniser les prérogatives avant sauvegarde
  const allInputs = Array.from(document.querySelectorAll('input[type="text"]'));
  let prerogativesInputs = allInputs.filter(input => 
    input.placeholder && 
    (input.placeholder.toLowerCase().includes('prérogatives') || 
    input.placeholder.toLowerCase().includes('prerogative'))
  );

  let inputIndex = 0;
  palanquees.forEach((pal, palIndex) => {
    if (pal && Array.isArray(pal)) {
      pal.forEach((plongeur, plongeurIndex) => {
        if (plongeur && plongeur.nom && prerogativesInputs[inputIndex]) {
          const oldValue = plongeur.pre;
          plongeur.pre = prerogativesInputs[inputIndex].value.trim();
          if (oldValue !== plongeur.pre) {
            console.log(`Prérogatives mises à jour: ${plongeur.nom} "${oldValue}" -> "${plongeur.pre}"`);
          }
          inputIndex++;
        }
      });
    }
  });
  
  syncPrerogativesFromInterface();
  
  const dpNom = getSelectedDPName();
  const dpDate = document.getElementById("dp-date")?.value;
  const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
  const dpPlongee = document.getElementById("dp-plongee")?.value;
  
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
  
  const palanqueesData = [];
  
  if (palanquees && Array.isArray(palanquees)) {
    palanquees.forEach((pal, index) => {
      const palanqueeObj = {
        index: index,
        plongeurs: [],
        parametres: {
          horaire: (() => {
            const input = document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Horaire"]`) || 
                          document.getElementById(`horaire-${index}`);
            return input ? input.value.trim() : (pal.horaire || "");
          })(),
          profondeurPrevue: (() => {
            const input = document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. prévue"]`) || 
                          document.getElementById(`profondeur-prevue-${index}`);
            return input ? input.value.trim() : (pal.profondeurPrevue || "");
          })(),
          dureePrevue: (() => {
            const input = document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée prévue"]`) || 
                          document.getElementById(`duree-prevue-${index}`);
            return input ? input.value.trim() : (pal.dureePrevue || "");
          })(),
          profondeurRealisee: (() => {
            const input = document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. réalisée"]`) || 
                          document.getElementById(`profondeur-realisee-${index}`);
            return input ? input.value.trim() : (pal.profondeurRealisee || "");
          })(),
          dureeRealisee: (() => {
            const input = document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée réalisée"]`) || 
                          document.getElementById(`duree-realisee-${index}`);
            return input ? input.value.trim() : (pal.dureeRealisee || "");
          })(),
          paliers: (() => {
            const input = document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Paliers"]`) || 
                          document.getElementById(`paliers-${index}`);
            return input ? input.value.trim() : (pal.paliers || "");
          })()
        }
      };
      
      for (let i = 0; i < pal.length; i++) {
        if (pal[i] && pal[i].nom) {
          const allPrerogativesInputs = Array.from(document.querySelectorAll('input.plongeur-prerogatives-editable'));
          
          let globalInputIndex = 0;
          for (let prevPalIndex = 0; prevPalIndex < index; prevPalIndex++) {
            if (palanquees[prevPalIndex]) {
              globalInputIndex += palanquees[prevPalIndex].length;
            }
          }
          globalInputIndex += i;
          
          let prerogativesValue = pal[i].pre || "";
          if (allPrerogativesInputs[globalInputIndex]) {
            prerogativesValue = allPrerogativesInputs[globalInputIndex].value.trim();
          }
          
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
  
  const sessionData = {
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
  
  console.log("Données complètes à sauvegarder:", sessionData);
  
  try {
    await db.ref(`sessions/${sessionKey}`).set(sessionData);
    console.log("Session sauvegardée:", sessionKey);
    
    await db.ref(`dpInfo/${sessionKey}`).set({
      nom: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now(),
      validated: true
    });
    
    currentSessionKey = sessionKey;
    sessionModified = false;
    
    // NOUVELLE INTÉGRATION : Notifier le système de sauvegarde automatique
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sessionSaved', { 
        detail: sessionData 
      }));
      console.log("Événement sessionSaved émis pour le système de sauvegarde automatique");
    }, 500);
    
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      const isNewSession = sessionKey.includes('_modif_');
      const plongeursEnAttente = plongeurs?.length || 0;
      const plongeursDansPalanquees = palanqueesData.reduce((total, pal) => total + pal.plongeurs.length, 0);
      const nombrePalanquees = palanqueesData.length;
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
    
    return true;
    
  } catch (error) {
    console.error("Erreur:", error);
    alert(`ERREUR DE SAUVEGARDE\n\n${error.message}`);
    return false;
  }
}

// Fonction pour charger une session PRÉSERVÉE (ne pas casser le système existant)
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
    
    plongeurs = sessionData.plongeurs || [];
    
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
    
    if (sessionData.meta) {
      const dpSelect = document.getElementById("dp-select");
      if (dpSelect && DP_LIST) {
        const dp = DP_LIST.find(d => d.nom === sessionData.meta.dp);
        if (dp) {
          dpSelect.value = dp.id;
          console.log("DP sélectionné:", dp.nom);
          
          if (typeof window.enableDPButtons === 'function') {
            window.enableDPButtons();
          }
        }
      }
      
      const dpDate = document.getElementById("dp-date");
      const dpLieu = document.getElementById("dp-lieu");
      const dpPlongee = document.getElementById("dp-plongee");
      
      if (dpDate) dpDate.value = sessionData.meta.date || "";
      if (dpLieu) dpLieu.value = sessionData.meta.lieu || "";
      if (dpPlongee) dpPlongee.value = sessionData.meta.plongee || "matin";
    }
    
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    setTimeout(() => {
      console.log("Restauration des paramètres d'interface...");
      
      palanquees.forEach((pal, index) => {
        if (!pal || !Array.isArray(pal)) return;
        
        const horaireInput = document.getElementById(`horaire-${index}`) || 
                        document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Horaire"]`);
        const profPrevueInput = document.getElementById(`profondeur-prevue-${index}`) || 
                               document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. prévue"]`);
        const dureePrevueInput = document.getElementById(`duree-prevue-${index}`) || 
                                document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée prévue"]`);
        const profRealiseeInput = document.getElementById(`profondeur-realisee-${index}`) || 
                                 document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. réalisée"]`);
        const dureeRealiseeInput = document.getElementById(`duree-realisee-${index}`) || 
                                  document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée réalisée"]`);
        const paliersInput = document.getElementById(`paliers-${index}`) || 
                            document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Paliers"]`);
        
        if (horaireInput && pal.horaire) {
          horaireInput.value = pal.horaire;
        }
        if (profPrevueInput && pal.profondeurPrevue) {
          profPrevueInput.value = pal.profondeurPrevue;
        }
        if (dureePrevueInput && pal.dureePrevue) {
          dureePrevueInput.value = pal.dureePrevue;
        }
        if (profRealiseeInput && pal.profondeurRealisee) {
          profRealiseeInput.value = pal.profondeurRealisee;
        }
        if (dureeRealiseeInput && pal.dureeRealisee) {
          dureeRealiseeInput.value = pal.dureeRealisee;
        }
        if (paliersInput && pal.paliers) {
          paliersInput.value = pal.paliers;
        }
      });
      
      console.log("Restauration des paramètres terminée");
    }, 300);
    
    setTimeout(() => {
      console.log("Rendu final et mise à jour des compteurs...");
      
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      
      setTimeout(() => {
        if (typeof updateCompteurs === 'function') {
          updateCompteurs();
          console.log('Compteurs mis à jour après chargement session');
        }
      }, 100);
      
      // NOUVELLE INTÉGRATION : Notifier le système de sauvegarde automatique
      window.dispatchEvent(new CustomEvent('sessionLoaded', { 
        detail: sessionData 
      }));
      console.log("Événement sessionLoaded émis pour le système de sauvegarde automatique");
      
    }, 500);
    
    currentSessionKey = sessionKey;
    sessionModified = false;
    
    console.log("Session chargée - tracking initialisé -", sessionData.meta?.dp);
    
    // Effacer l'ancien message de sauvegarde pour éviter la confusion
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      dpMessage.innerHTML = '';
      dpMessage.style.display = 'none';
    }
    
    // Afficher l'indicateur de session chargée avec les bonnes données
    setTimeout(() => {
      if (typeof updateCurrentSessionDisplay === 'function') {
        const sessionText = `${sessionData.meta.date} - ${sessionData.meta.dp} - ${sessionData.meta.lieu} (${sessionData.meta.plongee})`;
        updateCurrentSessionDisplay(sessionKey, sessionText);
        console.log("Indicateur de session mis à jour:", sessionText);
      } else {
        // Fallback: créer notre propre affichage si la fonction n'existe pas
        const currentSessionDiv = document.getElementById('current-session-indicator') || 
                                 document.querySelector('.current-session-display');
        
        if (currentSessionDiv) {
          const totalPlongeurs = sessionData.stats?.totalPlongeurs || 0;
          const nombrePalanquees = sessionData.stats?.nombrePalanquees || 0;
          
          currentSessionDiv.innerHTML = `
            <div style="background: #17a2b8; color: white; padding: 8px; border-radius: 4px; margin: 5px 0; font-size: 12px;">
              📂 SESSION CHARGÉE<br>
              ${sessionData.meta.date} - ${sessionData.meta.dp}<br>
              ${sessionData.meta.lieu} (${sessionData.meta.plongee})<br>
              ${totalPlongeurs} plongeurs, ${nombrePalanquees} palanquée${nombrePalanquees > 1 ? 's' : ''}
            </div>
          `;
          currentSessionDiv.style.display = 'block';
          console.log("Affichage de session chargée créé en fallback");
        }
      }
    }, 200);
    
    const forceCompteurUpdate = () => {
      const compteur = document.getElementById('compteur-plongeurs');
      if (compteur && plongeurs) {
        compteur.textContent = '(' + plongeurs.length + ')';
      }
    };

    setTimeout(forceCompteurUpdate, 300);
    setTimeout(forceCompteurUpdate, 800);

    return true;
    
  } catch (error) {
    console.error("Erreur:", error);
    alert(`Erreur lors du chargement:\n${error.message}`);
    return false;
  }
}

// Écouter les changements de sélection du DP (PRÉSERVÉ)
document.addEventListener('DOMContentLoaded', function() {
  const dpSelect = document.getElementById('dp-select');
  
  if (dpSelect) {
    dpSelect.addEventListener('change', function() {
      const dpNom = getSelectedDPName();
      console.log("DP changé:", dpNom);
      
      const dpStatus = document.querySelector('.dp-status-indicator');
      if (dpStatus && dpNom) {
        const statusContent = dpStatus.querySelector('.dp-status-content');
        if (statusContent) {
          statusContent.innerHTML = `<strong>DP actuel:</strong> ${dpNom}`;
        }
      }
    });
  }
  
  const validerBtn = document.getElementById('valider-dp');
  if (validerBtn) {
    const newBtn = validerBtn.cloneNode(true);
    validerBtn.parentNode.replaceChild(newBtn, validerBtn);
    
    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      const dpNom = getSelectedDPName();
      if (!dpNom) {
        alert("Veuillez sélectionner un Directeur de Plongée");
        return;
      }
      
      newBtn.disabled = true;
      newBtn.textContent = "Sauvegarde...";
      
      try {
        const success = await saveSessionData();
        
        if (success) {
          newBtn.textContent = "Sauvegardé !";
          
          setTimeout(() => {
            newBtn.disabled = false;
            newBtn.textContent = "Sauvegarder Session + DP";
          }, 3000);
        } else {
          throw new Error("Échec de la sauvegarde");
        }
        
      } catch (error) {
        console.error("Erreur:", error);
        newBtn.textContent = "Erreur";
        
        setTimeout(() => {
          newBtn.disabled = false;
          newBtn.textContent = "Sauvegarder Session + DP";
        }, 2000);
      }
    });
  }
});

function testDPSelection() {
  const dpNom = getSelectedDPName();
  console.log("DP sélectionné:", dpNom);
  
  if (!dpNom) {
    console.warn("Aucun DP sélectionné - Sélectionnez-en un dans la liste");
  } else {
    console.log("DP prêt pour sauvegarde:", dpNom);
  }
  
  return dpNom;
}

console.log("Système de récupération du DP corrigé");
console.log("Testez avec: testDPSelection()");

function handleError(error, context = "Application") {
  console.error(`Erreur ${context}:`, error);
  
  if (typeof FirebaseErrorHandler !== 'undefined') {
    return FirebaseErrorHandler.handleError(error, context);
  }
  
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

async function testFirebaseConnectionSafe() {
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
    return true;
  }
}

async function initializeAppData() {
  try {
    console.log("Initialisation sécurisée des données de l'application...");
    
    if (typeof plongeurs === 'undefined') {
      console.warn("Variable plongeurs non initialisée, correction...");
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      console.warn("Variable palanquees non initialisée, correction...");
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      console.warn("Variable plongeursOriginaux non initialisée, correction...");
      window.plongeursOriginaux = [];
    }
    
    await testFirebaseConnectionSafe();
    
    const today = new Date().toISOString().split("T")[0];
    const dpDateInput = document.getElementById("dp-date");
    if (dpDateInput) {
      dpDateInput.value = today;
    }
    
    console.log("Chargement des données...");
    
    try {
      if (typeof loadFromFirebase === 'function') {
        await loadFromFirebase();
        console.log("Données Firebase chargées");
      }
    } catch (error) {
      console.error("Erreur chargement Firebase:", error);
      
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    }
    
    try {
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      setTimeout(() => {
        if (typeof updateCompteurs === 'function') {
          updateCompteurs();
          console.log('Compteurs initialisés au démarrage');
        }
      }, 500);
      
    } catch (renderError) {
      console.error("Erreur rendu initial:", renderError);
    }
    
    console.log("Application initialisée avec système de verrous sécurisé!");
    
    if (typeof plongeurs !== 'undefined' && typeof palanquees !== 'undefined') {
      console.log(`${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    }
    
  } catch (error) {
    console.error("Erreur critique initialisation données:", error);
    handleError(error, "Initialisation données");
    
    try {
      console.log("Activation du mode de récupération d'urgence...");
      
      if (typeof plongeurs === 'undefined') window.plongeurs = [];
      if (typeof palanquees === 'undefined') window.palanquees = [];
      if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
      
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      if (typeof updateCompteurs === 'function') updateCompteurs();
      
      console.log("Mode de récupération activé");
      
    } catch (recoveryError) {
      console.error("Échec du mode de récupération:", recoveryError);
      
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

// ===== DRAG & DROP SÉCURISÉ (PRÉSERVÉ) =====
let dragData = null;

function setupDragAndDrop() {
  console.log("Configuration du drag & drop sécurisé...");
  
  try {
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragend', handleDragEnd);
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('drop', handleDrop);
    
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    
    console.log("Drag & drop configuré");
  } catch (error) {
    console.error("Erreur configuration drag & drop:", error);
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
    
    if (e.dataTransfer && dragData) {
      try {
        e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = "move";
      } catch (error) {
        console.warn("Erreur dataTransfer:", error);
      }
    }
  } catch (error) {
    console.error("Erreur handleDragStart:", error);
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
    console.error("Erreur handleDragEnd:", error);
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
    console.error("Erreur handleDragOver:", error);
  }
}

function handleDragLeave(e) {
  try {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  } catch (error) {
    console.error("Erreur handleDragLeave:", error);
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
    
    let data = dragData;
    
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
      dragData = null;
      return;
    }
    
    if (typeof plongeurs === 'undefined') {
      window.plongeurs = [];
    }
    if (typeof palanquees === 'undefined') {
      window.palanquees = [];
    }
    if (typeof plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
    }
    
    if (dropZone.id === 'listePlongeurs') {
      if (data.type === "fromPalanquee") {
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          if (typeof renderPlongeurs === 'function') {
            renderPlongeurs();
          }
          if (typeof renderPalanquees === 'function') {
            renderPalanquees();
          }
          if (typeof updateCompteurs === 'function') {
            updateCompteurs();
          }
        }
      }
    } else {
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
      
      if (typeof validatePalanqueeAddition === 'function') {
        const validation = validatePalanqueeAddition(palanqueeIndex, data.plongeur);
        if (!validation.valid) {
          const messageText = validation.messages.join('\n');
          alert(`Ajout impossible :\n\n${messageText}`);
          dragData = null;
          return;
        }
      }
      
      if (data.type === "fromMainList") {
        const indexToRemove = plongeurs.findIndex(p => 
  p.nom.trim() === data.plongeur.nom.trim() && p.niveau === data.plongeur.niveau
);

if (indexToRemove !== -1) {
  const plongeur = plongeurs.splice(indexToRemove, 1)[0];
  targetPalanquee.push(plongeur);
  
  // Forcer la mise à jour du menu flottant immédiatement
  setTimeout(() => {
    if (typeof window.forceUpdatePlongeursMenu === 'function') {
      window.forceUpdatePlongeursMenu();
    }
  }, 50);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          if (typeof renderPlongeurs === 'function') {
            renderPlongeurs();
          }
          if (typeof renderPalanquees === 'function') {
            renderPalanquees();
          }
          if (typeof updateCompteurs === 'function') {
            updateCompteurs();
          }
        }
        
      } else if (data.type === "fromPalanquee") {
        if (palanquees[data.palanqueeIndex] && palanquees[data.palanqueeIndex][data.plongeurIndex]) {
          const plongeur = palanquees[data.palanqueeIndex].splice(data.plongeurIndex, 1)[0];
          targetPalanquee.push(plongeur);
          
          if (typeof syncToDatabase === 'function') {
            syncToDatabase();
          }
          if (typeof renderPlongeurs === 'function') {
            renderPlongeurs();
          }
          if (typeof renderPalanquees === 'function') {
            renderPalanquees();
          }
          if (typeof updateCompteurs === 'function') {
            updateCompteurs();
          }
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du drop:", error);
    handleError(error, "Handle drop");
  } finally {
    dragData = null;
}

// CORRECTION AMÉLIORÉE
setTimeout(() => {
    forceMenuUpdate(); // Synchronisation complète + mise à jour menu
}, 100);

}

// ===== EVENT HANDLERS SÉCURISÉS (PRÉSERVÉS) =====
function setupEventListeners() {
  console.log("Configuration des event listeners sécurisés...");
  
  try {
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
            console.log("Connexion réussie");
            
            forceInitializeFloatingMenus();
            setupMenuSurveillance();
            
            setTimeout(() => {
              if (typeof updateCompteurs === 'function') {
                updateCompteurs();
                console.log('Compteurs forcés après connexion réussie');
              }
            }, 2000);
            
            setupCompteurSurveillance();
            setupPostRefusalSurveillance();
            
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
            console.log("Déconnexion réussie");
          }
        } catch (error) {
          console.error("Erreur déconnexion:", error);
        }
      });
    }

    const addPalanqueeBtn = document.getElementById("addPalanquee");
    if (addPalanqueeBtn) {
      addPalanqueeBtn.addEventListener("click", () => {
        try {
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
          
          console.log("Nouvelle palanquée créée");
        } catch (error) {
          console.error("Erreur création palanquée:", error);
          handleError(error, "Création palanquée");
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
          console.error("Erreur génération aperçu PDF:", error);
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
            console.error("Fonction exportToPDF non disponible");
            alert("Erreur: Module PDF non chargé");
          }
        } catch (error) {
          console.error("Erreur export PDF:", error);
          handleError(error, "Export PDF");
        }
      });
    }

    console.log("Event listeners configurés avec succès");
    
  } catch (error) {
    console.error("Erreur configuration event listeners:", error);
    handleError(error, "Configuration event listeners");
  }
}

// ===== DIAGNOSTIC ET MONITORING (PRÉSERVÉ) =====
window.diagnosticJSAS = function() {
  console.log(" === DIAGNOSTIC JSAS ===");
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    session: {
      currentKey: currentSessionKey,
      modified: sessionModified
    },
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
    locks: {
      system: typeof lockSystemInitialized !== 'undefined' ? lockSystemInitialized : 'undefined',
      current: typeof currentlyEditingPalanquee !== 'undefined' ? currentlyEditingPalanquee : 'undefined',
      active: typeof palanqueeLocks !== 'undefined' ? Object.keys(palanqueeLocks).length : 'undefined'
    },
    errors: {
      lastError: window.lastJSASError || 'none'
    }
  };
  
  console.log("Diagnostic complet:", diagnostic);
  console.log("=== FIN DIAGNOSTIC ===");
  
  return diagnostic;
};

window.addEventListener('error', (event) => {
  window.lastJSASError = {
    message: event.error?.message || event.message,
    timestamp: new Date().toISOString(),
    filename: event.filename,
    lineno: event.lineno
  };
});

// ===== INITIALISATION SÉCURISÉE DE L'APPLICATION (PRÉSERVÉ MAIS NE PAS CASSER LES SESSIONS) =====
document.addEventListener('DOMContentLoaded', async () => {
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
    
    // 3. Configurer les event listeners
    setupEventListeners();
    
    // 4. Configurer le drag & drop
    setupDragAndDrop();
    
    // 5. Initialiser les gestionnaires de modules (SANS casser dp-sessions-manager)
    if (typeof initializeDPSessionsManager === 'function') {
      initializeDPSessionsManager();
    }
    
    // 6. Ajouter les gestionnaires d'erreurs globaux
    window.addEventListener('error', (event) => {
      console.error("Erreur JavaScript globale:", event.error);
      handleError(event.error, "Erreur JavaScript globale");
    });
    
    console.log("Application JSAS initialisée avec succès !");
    
  } catch (error) {
    console.error("Erreur critique initialisation:", error);
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
});

// ===== EXPORTS GLOBAUX (COMPATIBILITÉ PRÉSERVÉE) =====
window.handleError = handleError;
window.testFirebaseConnectionSafe = testFirebaseConnectionSafe;
window.initializeAppData = initializeAppData;
window.setupDragAndDrop = setupDragAndDrop;
window.setupEventListeners = setupEventListeners;
window.syncToDatabase = syncToDatabase;
window.loadFromFirebase = loadFromFirebase;
window.saveSessionData = saveSessionData;
window.loadSession = loadSession;
window.testDPSelection = testDPSelection;
window.forceInitializeFloatingMenus = forceInitializeFloatingMenus;
window.setupCompteurSurveillance = setupCompteurSurveillance;
window.setupPostRefusalSurveillance = setupPostRefusalSurveillance;
window.getSelectedDPName = getSelectedDPName;

console.log("Main Core corrigé chargé - Version 7.8.1 - Correction bandeau session chargée");