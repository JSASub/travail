// main-core.js - Fichier principal corrigé avec initialisation menu latéral
// PROTECTION ANTI-UNDEFINED
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.plongeursOriginaux = window.plongeursOriginaux || [];

// Variables globales de session
let currentSessionKey = null;
let sessionModified = false;

// SOLUTION AGRESSIVE POUR LES BOÎTES DE DIALOGUE
// Intercepter la fonction alert native
const originalAlert = window.alert;
window.alert = function(message) {
    if (typeof message === 'string' && message.includes('0 palanquée')) {
        const palanqueesCount = document.querySelectorAll('.palanquee').length;
        let plongeursCount = 0;
        document.querySelectorAll('.palanquee').forEach(pal => {
            plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
        });
        
        // Corriger le message avant de l'afficher
        const messageCorrige = message.replace(
            /\d+\s*plongeurs?\s+dans\s+0\s+palanquées?/gi, 
            `${plongeursCount} plongeurs dans ${palanqueesCount} palanquées`
        );
        
        console.log(`Alert corrigée: "${message}" → "${messageCorrige}"`);
        return originalAlert.call(this, messageCorrige);
    }
    return originalAlert.call(this, message);
};

// Intercepter la fonction confirm native
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

// Fonction pour corriger en temps réel
function getCurrentPalanqueesStats() {
    const palanqueesCount = document.querySelectorAll('.palanquee').length;
    let plongeursCount = 0;
    document.querySelectorAll('.palanquee').forEach(pal => {
        plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
    });
    return { palanqueesCount, plongeursCount };
}

// Exposer globalement pour les autres scripts
window.getCurrentPalanqueesStats = getCurrentPalanqueesStats;

console.log("Interception des boîtes de dialogue activée");

// Forcer l'initialisation des variables globales
document.addEventListener('DOMContentLoaded', function() {
  // S'assurer que les variables existent
  if (typeof window.plongeurs === 'undefined') {
    window.plongeurs = [];
  }
  
  // Si la liste DOM a des éléments mais pas la variable globale, reconstruire
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
    
    // Forcer la mise à jour du menu
    if (typeof updateFloatingPlongeursList === 'function') {
      updateFloatingPlongeursList();
    }
  }
});

function getSelectedDPName() {
  const dpSelect = document.getElementById('dp-select');
  
  if (!dpSelect || !dpSelect.value) {
    console.warn("⚠️ Aucun DP sélectionné");
    return "";
  }
  
  if (typeof DP_LIST !== 'undefined') {
    const selectedDP = DP_LIST.find(dp => dp.id === dpSelect.value);
    if (selectedDP) {
      console.log("✅ DP sélectionné:", selectedDP.nom);
      return selectedDP.nom;
    }
  }
  
  const selectedOption = dpSelect.options[dpSelect.selectedIndex];
  if (selectedOption && selectedOption.text !== "-- Choisir un DP --") {
    const nom = selectedOption.text.split(' (')[0];
    console.log("✅ DP extrait:", nom);
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
  console.log("💾 Synchronisation Firebase...");
  
  try {
    // S'assurer que les variables globales existent et sont des tableaux
    if (typeof plongeurs === 'undefined') window.plongeurs = [];
    if (typeof palanquees === 'undefined') window.palanquees = [];
    if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    
    // Mettre à jour plongeursOriginaux
    plongeursOriginaux = [...plongeurs];
    
    // CORRECTION : Marquer que la session a été modifiée
    if (currentSessionKey) {
      sessionModified = true;
      console.log("📄 Session marquée comme modifiée");
    }
    
    // Re-rendre l'interface SANS manipulation DOM excessive
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
    // Sauvegarder dans Firebase si connecté (SANS session automatique)
    if (typeof firebaseConnected !== 'undefined' && firebaseConnected && typeof db !== 'undefined' && db) {
      try {
        await Promise.all([
          db.ref('plongeurs').set(plongeurs),
          db.ref('palanquees').set(palanquees)
        ]);
        
        console.log("✅ Sauvegarde Firebase réussie (données seulement)");
        
      } catch (error) {
        console.error("⚠ Erreur sync Firebase:", error.message);
        
        // Utiliser le gestionnaire d'erreurs si disponible
        if (typeof handleFirebaseError === 'function') {
          handleFirebaseError(error, 'Synchronisation');
        }
      }
    } else {
      console.warn("⚠️ Firebase non connecté, données non sauvegardées");
    }
    
  } catch (error) {
    console.error("⚠ Erreur syncToDatabase:", error);
    handleError(error, "Synchronisation base de données");
  }
}

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function loadFromFirebase() {
  try {
    console.log("🔥 Chargement des données depuis Firebase...");
    
    if (!db) {
      console.warn("⚠️ DB non disponible");
      return;
    }
    
    // Charger les plongeurs
    const plongeursSnapshot = await db.ref('plongeurs').once('value');
    if (plongeursSnapshot.exists()) {
      plongeurs = plongeursSnapshot.val() || [];
      console.log("✅ Plongeurs chargés:", plongeurs.length);
    }
    
    // Charger les palanquées avec correction automatique
    const palanqueesSnapshot = await db.ref('palanquees').once('value');
    if (palanqueesSnapshot.exists()) {
      const rawPalanquees = palanqueesSnapshot.val() || [];
      
      palanquees = rawPalanquees.map((pal, index) => {
        if (Array.isArray(pal)) {
          // S'assurer que toutes les propriétés existent
          if (!pal.hasOwnProperty('horaire')) pal.horaire = '';
          if (!pal.hasOwnProperty('profondeurPrevue')) pal.profondeurPrevue = '';
          if (!pal.hasOwnProperty('dureePrevue')) pal.dureePrevue = '';
          if (!pal.hasOwnProperty('profondeurRealisee')) pal.profondeurRealisee = '';
          if (!pal.hasOwnProperty('dureeRealisee')) pal.dureeRealisee = '';
          if (!pal.hasOwnProperty('paliers')) pal.paliers = '';
          return pal;
        } else if (pal && typeof pal === 'object') {
          console.log(`🔧 Correction palanquée ${index + 1}: conversion objet vers tableau`);
          
          const nouveauTableau = [];
          Object.keys(pal).forEach(key => {
            if (!isNaN(key) && pal[key] && typeof pal[key] === 'object' && pal[key].nom) {
              nouveauTableau.push(pal[key]);
            }
          });
          
          // Ajouter les propriétés spéciales
          nouveauTableau.horaire = pal.horaire || '';
          nouveauTableau.profondeurPrevue = pal.profondeurPrevue || '';
          nouveauTableau.dureePrevue = pal.dureePrevue || '';
          nouveauTableau.profondeurRealisee = pal.profondeurRealisee || '';
          nouveauTableau.dureeRealisee = pal.dureeRealisee || '';
          nouveauTableau.paliers = pal.paliers || '';
          
          console.log(`✅ Palanquée ${index + 1} corrigée: ${nouveauTableau.length} plongeurs`);
          return nouveauTableau;
        }
        
        // Palanquée vide par défaut
        const nouveauTableau = [];
        nouveauTableau.horaire = '';
        nouveauTableau.profondeurPrevue = '';
        nouveauTableau.dureePrevue = '';
        nouveauTableau.profondeurRealisee = '';
        nouveauTableau.dureeRealisee = '';
        nouveauTableau.paliers = '';
        return nouveauTableau;
      });
      
      console.log("✅ Palanquées chargées:", palanquees.length);
    } else {
      palanquees = [];
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Rendu sécurisé
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
  } catch (error) {
    console.error("⚠ Erreur chargement Firebase:", error);
    handleError(error, "Chargement Firebase");
  }
}

// Synchro avant sauvegarde
function syncPrerogativesFromInterface() {
  // Trouve tous les inputs de prérogatives et les synchronise
  document.querySelectorAll('.palanquee').forEach((palanqueeDiv, palIndex) => {
    const inputs = palanqueeDiv.querySelectorAll('input[placeholder*="rérogative"]');
    inputs.forEach((input, plongeurIndex) => {
      if (palanquees[palIndex] && palanquees[palIndex][plongeurIndex]) {
        palanquees[palIndex][plongeurIndex].pre = input.value.trim();
      }
    });
  });
}

// ===== FONCTIONS UTILITAIRES SÉCURISÉES =====
function showAuthError(message) {
  const errorDiv = document.getElementById("auth-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

// ===== FONCTION POUR INITIALISER LE MENU LATÉRAL =====
function forceInitializeFloatingMenus() {
    console.log('🔄 Initialisation forcée des menus flottants...');
    
    // Fonction pour synchroniser les largeurs
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
        
        // Appeler les fonctions d'initialisation
        if (typeof window.initFloatingMenusManager === 'function') {
            window.initFloatingMenusManager();
        }
        
        if (typeof window.forceUpdatePlongeursMenu === 'function') {
            window.forceUpdatePlongeursMenu();
        }
        
        if (typeof window.enableDPButtons === 'function') {
            window.enableDPButtons();
        }
        
        // Synchroniser les largeurs après l'initialisation
        setTimeout(syncMenuWidth, 500);
        setTimeout(syncMenuWidth, 1500); // Double vérification
        
        // Surveillance pour maintenir la synchronisation
        setInterval(() => {
            const menu = document.getElementById('floating-plongeurs-menu');
            if (menu && (menu.style.width === '0px' || menu.style.width === '')) {
                syncMenuWidth();
                console.log('Largeur du menu resynchronisée');
            }
        }, 3000);
        
    }, 1500);
}

// Surveillance continue du menu latéral
function setupMenuSurveillance() {
    let surveillanceCount = 0;
    const maxSurveillance = 60; // 60 secondes max
    
    const surveillanceInterval = setInterval(() => {
        surveillanceCount++;
        
        const mainApp = document.getElementById('main-app');
        const floatingMenu = document.getElementById('floating-plongeurs-menu');
        
        // Si l'app est visible mais pas le menu, le forcer
        if (mainApp && mainApp.style.display !== 'none' && 
            floatingMenu && floatingMenu.style.display === 'none') {
            
            console.log('🔧 Correction automatique du menu latéral');
            floatingMenu.style.display = 'flex';
            floatingMenu.style.visibility = 'visible';
            floatingMenu.style.opacity = '1';
            
            // Réinitialiser le menu si nécessaire
            if (typeof window.forceUpdatePlongeursMenu === 'function') {
                window.forceUpdatePlongeursMenu();
            }
        }
        
        // Arrêter la surveillance après 60 secondes ou si tout est OK
        if (surveillanceCount >= maxSurveillance || 
            (floatingMenu && floatingMenu.style.display === 'flex')) {
            clearInterval(surveillanceInterval);
        }
        
    }, 1000);
}

// ===== FONCTION SAVESESSIONDATA MODIFIÉE AVEC PROTECTION =====
async function saveSessionData() {
  console.log("💾 Sauvegarde session avec protection...");
  // SOLUTION BRUTALE : mettre à jour toutes les prérogatives avant sauvegarde
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
  
  // Vérification stricte
  if (!dpNom) {
    alert("⚠️ Veuillez sélectionner un Directeur de Plongée dans la liste");
    return false;
  }
  
  if (!dpDate || !dpLieu) {
    alert("⚠️ Veuillez remplir la date et le lieu");
    return false;
  }
  
  if (!db || !firebaseConnected) {
    console.error("⚠ Firebase non disponible");
    return false;
  }
  
  // CORRECTION : Créer une nouvelle clé si la session a été modifiée
  const baseKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
  let sessionKey;
  
  if (sessionModified && currentSessionKey) {
    // Session modifiée : créer une nouvelle clé avec timestamp
    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
    sessionKey = `${baseKey}_modif_${timestamp}`;
    console.log(`📄 Session modifiée, nouvelle clé: ${sessionKey}`);
  } else {
    sessionKey = baseKey;
  }
  
  console.log("🔑 Clé de session:", sessionKey);
  
  // ===== CAPTURE DES PARAMÈTRES DEPUIS L'INTERFACE =====
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
      
      // Ajouter les plongeurs
for (let i = 0; i < pal.length; i++) {
  if (pal[i] && pal[i].nom) {
    // Capture brutale : chercher TOUS les inputs de prérogatives de la page
    const allPrerogativesInputs = Array.from(document.querySelectorAll('input.plongeur-prerogatives-editable'));
    
    // Calculer l'index global de cet input
    let globalInputIndex = 0;
    for (let prevPalIndex = 0; prevPalIndex < index; prevPalIndex++) {
      if (palanquees[prevPalIndex]) {
        globalInputIndex += palanquees[prevPalIndex].length;
      }
    }
    globalInputIndex += i;
    
    // Récupérer la valeur depuis l'interface
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
  
  console.log("📋 Données complètes à sauvegarder:", sessionData);
  
  try {
    // Sauvegarder dans Firebase
    await db.ref(`sessions/${sessionKey}`).set(sessionData);
    console.log("✅ Session sauvegardée:", sessionKey);
    
    // Sauvegarder les infos DP
    await db.ref(`dpInfo/${sessionKey}`).set({
      nom: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now(),
      validated: true
    });
    
    // CORRECTION : Mettre à jour le tracking
    currentSessionKey = sessionKey;
    sessionModified = false;
    
    // Affichage de confirmation modifiée
    // Calculer les statistiques détaillées
  const plongeursEnAttente = plongeurs?.length || 0;
  const plongeursDansPalanquees = palanqueesData.reduce((total, pal) => total + pal.plongeurs.length, 0);
  const nombrePalanquees = palanqueesData.length;
  const totalGeneral = plongeursEnAttente + plongeursDansPalanquees;
  
  dpMessage.innerHTML = `
    <div style="
      background: #28a745;
      color: white;
      padding: 12px;
      border-radius: 5px;
      margin: 10px 0;
    ">
      ✅ <strong>${isNewSession ? 'NOUVELLE SESSION CRÉÉE!' : 'SESSION SAUVEGARDÉE!'}</strong><br>
      ${isNewSession ? '🆕 Session originale préservée<br>' : ''}
      <br>
      📋 DP: ${dpNom}<br>
      📅 Date: ${dpDate} (${dpPlongee})<br>
      📍 Lieu: ${dpLieu}<br>
      <br>
      <strong>📊 STATISTIQUES DE SAUVEGARDE :</strong><br>
      👥 <strong>${totalGeneral} plongeurs TOTAL</strong><br>
      └─ ${plongeursEnAttente} en liste d'attente<br>
      └─ ${plongeursDansPalanquees} assignés en palanquées<br>
      <br>
      🏠 <strong>${nombrePalanquees} palanquée${nombrePalanquees > 1 ? 's' : ''} sauvegardée${nombrePalanquees > 1 ? 's' : ''}</strong><br>
      ${nombrePalanquees > 0 ? `└─ avec ${plongeursDansPalanquees} plongeur${plongeursDansPalanquees > 1 ? 's' : ''} assigné${plongeursDansPalanquees > 1 ? 's' : ''}<br>` : ''}
      <br>
      🔑 Session: ${sessionKey}
    </div>
  `;
      dpMessage.style.display = 'block';
      
      setTimeout(() => {
        dpMessage.style.display = 'none';
      }, 10000);
    }
    
    return true;
    
  } catch (error) {
    console.error("⚠ Erreur:", error);
    alert(`⚠ ERREUR DE SAUVEGARDE\n\n${error.message}`);
    return false;
  }
}

// Fonction pour charger une session CORRIGÉE ET PROPRE
async function loadSession(sessionKey) {
  console.log("🔥 Chargement session:", sessionKey);
  
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
      // Trouver et sélectionner le DP dans la liste
      const dpSelect = document.getElementById("dp-select");
      if (dpSelect && DP_LIST) {
        const dp = DP_LIST.find(d => d.nom === sessionData.meta.dp);
        if (dp) {
          dpSelect.value = dp.id;
          console.log("✅ DP sélectionné:", dp.nom);
          
          // Activer les boutons DP après sélection
          if (typeof window.enableDPButtons === 'function') {
            window.enableDPButtons();
          }
        }
      }
      
      // Restaurer les autres champs
      const dpDate = document.getElementById("dp-date");
      const dpLieu = document.getElementById("dp-lieu");
      const dpPlongee = document.getElementById("dp-plongee");
      
      if (dpDate) dpDate.value = sessionData.meta.date || "";
      if (dpLieu) dpLieu.value = sessionData.meta.lieu || "";
      if (dpPlongee) dpPlongee.value = sessionData.meta.plongee || "matin";
    }
    
    // Premier rendu de base
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    // Restauration des paramètres des palanquées avec délai
    setTimeout(() => {
      console.log("📄 Restauration des paramètres d'interface...");
      
      palanquees.forEach((pal, index) => {
        if (!pal || !Array.isArray(pal)) return;
        
        // Chercher les champs de saisie pour cette palanquée
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
        
        // Restaurer les valeurs dans les champs
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
      
      console.log("✅ Restauration des paramètres terminée");
    }, 300);
    
    // Rendu final et mise à jour des compteurs
    setTimeout(() => {
      console.log("🔄 Rendu final et mise à jour des compteurs...");
      
      // Re-rendu pour s'assurer que tout est à jour
      if (typeof renderPalanquees === 'function') renderPalanquees();
      if (typeof renderPlongeurs === 'function') renderPlongeurs();
      if (typeof updateAlertes === 'function') updateAlertes();
      
      // Mise à jour forcée des compteurs
      setTimeout(() => {
        if (typeof updateCompteurs === 'function') {
          updateCompteurs();
          console.log('🔢 Compteurs mis à jour après chargement session');
        }
      }, 100);
      
    }, 500);
    
    // Initialiser le tracking de session
    currentSessionKey = sessionKey;
    sessionModified = false;
    
    console.log("✅ Session chargée - tracking initialisé -", sessionData.meta?.dp);
    
    // Forcer la mise à jour du compteur
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
    console.error("⚠ Erreur:", error);
    alert(`Erreur lors du chargement:\n${error.message}`);
    return false;
  }
}

// Écouter les changements de sélection du DP
document.addEventListener('DOMContentLoaded', function() {
  const dpSelect = document.getElementById('dp-select');
  
  if (dpSelect) {
    dpSelect.addEventListener('change', function() {
      const dpNom = getSelectedDPName();
      console.log("🔄 DP changé:", dpNom);
      
      // Afficher visuellement le DP sélectionné
      const dpStatus = document.querySelector('.dp-status-indicator');
      if (dpStatus && dpNom) {
        const statusContent = dpStatus.querySelector('.dp-status-content');
        if (statusContent) {
          statusContent.innerHTML = `<strong>DP actuel:</strong> ${dpNom}`;
        }
      }
    });
  }
  
  // Remplacer le listener du bouton de validation
  const validerBtn = document.getElementById('valider-dp');
  if (validerBtn) {
    const newBtn = validerBtn.cloneNode(true);
    validerBtn.parentNode.replaceChild(newBtn, validerBtn);
    
    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      // Vérifier qu'un DP est sélectionné
      const dpNom = getSelectedDPName();
      if (!dpNom) {
        alert("⚠️ Veuillez sélectionner un Directeur de Plongée");
        return;
      }
      
      newBtn.disabled = true;
      newBtn.textContent = "⏳ Sauvegarde...";
      
      try {
        const success = await saveSessionData();
        
        if (success) {
          newBtn.textContent = "✅ Sauvegardé !";
          
          setTimeout(() => {
            newBtn.disabled = false;
            newBtn.textContent = "Sauvegarder Session + DP";
          }, 3000);
        } else {
          throw new Error("Échec de la sauvegarde");
        }
        
      } catch (error) {
        console.error("Erreur:", error);
        newBtn.textContent = "⚠ Erreur";
        
        setTimeout(() => {
          newBtn.disabled = false;
          newBtn.textContent = "Sauvegarder Session + DP";
        }, 2000);
      }
    });
  }
});

// Fonction de test
function testDPSelection() {
  const dpNom = getSelectedDPName();
  console.log("DP sélectionné:", dpNom);
  
  if (!dpNom) {
    console.warn("⚠️ Aucun DP sélectionné - Sélectionnez-en un dans la liste");
  } else {
    console.log("✅ DP prêt pour sauvegarde:", dpNom);
  }
  
  return dpNom;
}

console.log("✅ Système de récupération du DP corrigé");
console.log("💡 Testez avec: testDPSelection()");

function handleError(error, context = "Application") {
  console.error(`⚠ Erreur ${context}:`, error);
  
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
          console.error("⚠ Erreur listener connexion:", error);
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
    console.error("⚠ Test Firebase échoué:", error.message);
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
    console.log("🔄 Initialisation sécurisée des données de l'application...");
    
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
      console.error("⚠ Erreur chargement Firebase:", error);
      
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
      
      // CORRECTION : Forcer la mise à jour des compteurs au démarrage
      setTimeout(() => {
        if (typeof updateCompteurs === 'function') {
          updateCompteurs();
          console.log('🔢 Compteurs initialisés au démarrage');
        }
      }, 500);
      
    } catch (renderError) {
      console.error("⚠ Erreur rendu initial:", renderError);
    }
    
    console.log("✅ Application initialisée avec système de verrous sécurisé!");
    
    if (typeof plongeurs !== 'undefined' && typeof palanquees !== 'undefined') {
      console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées`);
    }
    
  } catch (error) {
    console.error("⚠ Erreur critique initialisation données:", error);
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
      console.error("⚠ Échec du mode de récupération:", recoveryError);
      
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
    console.error("⚠ Erreur configuration drag & drop:", error);
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
    console.error("⚠ Erreur handleDragStart:", error);
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
    console.error("⚠ Erreur handleDragEnd:", error);
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
    console.error("⚠ Erreur handleDragOver:", error);
  }
}

function handleDragLeave(e) {
  try {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && !dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drag-over');
    }
  } catch (error) {
    console.error("⚠ Erreur handleDragLeave:", error);
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
          alert(`⚠ Ajout impossible :\n\n${messageText}`);
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
    console.error("⚠ Erreur lors du drop:", error);
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
            
            // Forcer l'initialisation du menu latéral après connexion
            forceInitializeFloatingMenus();
			// Ajouter la surveillance continue
			setupMenuSurveillance();
            
          } else {
            throw new Error("Fonction signIn non disponible");
          }
          
        } catch (error) {
          console.error("⚠ Erreur connexion:", error);
          
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
          console.error("⚠ Erreur déconnexion:", error);
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
          console.error("⚠ Erreur création palanquée:", error);
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
            console.error("⚠ Fonction generatePDFPreview non disponible");
            alert("Erreur: Module PDF non chargé");
          }
        } catch (error) {
          console.error("⚠ Erreur génération aperçu PDF:", error);
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
            console.error("⚠ Fonction exportToPDF non disponible");
            alert("Erreur: Module PDF non chargé");
          }
        } catch (error) {
          console.error("⚠ Erreur export PDF:", error);
          handleError(error, "Export PDF");
        }
      });
    }

    console.log("✅ Event listeners configurés avec succès");
    
  } catch (error) {
    console.error("⚠ Erreur configuration event listeners:", error);
    handleError(error, "Configuration event listeners");
  }
}

// ===== CORRECTION COMPTEUR PALANQUÉES DOUCE (SANS INTERFÉRENCE DOM) =====
function initCompteurCorrectionDouce() {
  let lastCompteurValue = '';
  let correctionCount = 0;
  
  function compteurCorrectionDouce() {
    try {
      const compteur = document.getElementById('compteur-palanquees');
      if (!compteur) return;
      
      const palanqueesCount = document.querySelectorAll('.palanquee').length;
      
      if (palanqueesCount > 0) {
        let plongeursCount = 0;
        document.querySelectorAll('.palanquee').forEach(pal => {
          plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
        });
        
        const texteCorrect = `(${plongeursCount} plongeurs dans ${palanqueesCount} palanquées)`;
        
        // CORRECTION DOUCE : Ne corriger que si nécessaire ET ne toucher QUE au compteur
        if (compteur.textContent !== texteCorrect && compteur.textContent !== lastCompteurValue) {
          compteur.textContent = texteCorrect;
          lastCompteurValue = texteCorrect;
          correctionCount++;
          // SUPPRIMÉ : Les logs qui polluaient la console
        }
      }
    } catch (error) {
      console.error('⚠ Erreur compteurCorrectionDouce:', error);
    }
  }
  
  // Correction initiale UNIQUE
  compteurCorrectionDouce();
  
  // CORRECTION : Surveillance réduite et plus espacée pour éviter les interférences
  const correctionInterval = setInterval(compteurCorrectionDouce, 10000); // 10 secondes au lieu de 3
  
  // Arrêter la surveillance plus tôt (1 minute au lieu de 2)
  setTimeout(() => {
    clearInterval(correctionInterval);
    console.log(`🔧 Surveillance compteur arrêtée après ${correctionCount} corrections`);
  }, 60000);
  
  // Exposer la fonction pour utilisation manuelle UNIQUEMENT
  window.forceCompteurCorrection = compteurCorrectionDouce;
}

// Fonction pour corriger les textes des boîtes de dialogue
function fixDialogContent() {
  try {
    const palanqueesCount = document.querySelectorAll('.palanquee').length;
    let plongeursCount = 0;
    document.querySelectorAll('.palanquee').forEach(pal => {
      plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
    });
    
    // Texte correct à utiliser
    const texteCorrect = `${plongeursCount} plongeurs dans ${palanqueesCount} palanquées`;
    
    // Chercher et corriger tous les éléments avec "0 palanquée"
    const selecteurs = [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '.notification', '.modal', '.dialog', '.popup', '.message',
      '[class*="save"]', '[class*="session"]', '[class*="restore"]'
    ];
    
    selecteurs.forEach(selecteur => {
      const elements = document.querySelectorAll(selecteur);
      elements.forEach(element => {
        if (element.children.length === 0) { // Seulement les feuilles
          const texte = element.textContent;
          if (texte && texte.includes('0 palanquée') && texte.length < 500) {
            // Remplacer "X plongeurs dans 0 palanquées" par le bon texte
            const nouveauTexte = texte.replace(/\d+\s*plongeurs?\s+dans\s+0\s+palanquées?/gi, texteCorrect);
            if (nouveauTexte !== texte) {
              element.textContent = nouveauTexte;
              console.log(`Boîte de dialogue corrigée: "${texte}" → "${nouveauTexte}"`);
            }
          }
        }
      });
    });
    
  } catch (error) {
    console.error('Erreur fixDialogContent:', error);
  }
}

// Observer les nouvelles boîtes de dialogue qui apparaissent
const dialogObserver = new MutationObserver((mutations) => {
  let needsFix = false;
  
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) { // Element node
        const texte = node.textContent;
        if (texte && (texte.includes('0 palanquée') || texte.includes('sauvegarde') || texte.includes('session'))) {
          needsFix = true;
        }
      }
    });
  });
  
  if (needsFix) {
    setTimeout(fixDialogContent, 100);
  }
});

// Observer le document entier
dialogObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Corriger immédiatement et périodiquement
fixDialogContent();
setInterval(fixDialogContent, 3000);

console.log("Correction des boîtes de dialogue activée");

// ===== DIAGNOSTIC ET MONITORING =====
window.diagnosticJSAS = function() {
  console.log("🔍 === DIAGNOSTIC JSAS ===");
  
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
    
    // 5. Initialiser les gestionnaires de modules (SANS plongeurs manager pour éviter duplication)
    if (typeof initializeDPSessionsManager === 'function') {
      initializeDPSessionsManager();
    }
    
    // 6. Initialiser la correction DOUCE du compteur (sans interférence DOM)
    setTimeout(() => {
      initCompteurCorrectionDouce();
    }, 2000); // Démarrage retardé pour éviter les conflits
    
    // 7. Ajouter les gestionnaires d'erreurs globaux
    window.addEventListener('error', (event) => {
      console.error("⚠ Erreur JavaScript globale:", event.error);
      handleError(event.error, "Erreur JavaScript globale");
    });
    
    console.log("✅ Application JSAS initialisée avec succès !");
    
  } catch (error) {
    console.error("⚠ Erreur critique initialisation:", error);
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
      "⚠ ERREUR CRITIQUE D'INITIALISATION\n\n" +
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
window.syncToDatabase = syncToDatabase;
window.loadFromFirebase = loadFromFirebase;
window.saveSessionData = saveSessionData;
window.loadSession = loadSession;
window.testDPSelection = testDPSelection;
window.forceInitializeFloatingMenus = forceInitializeFloatingMenus;

console.log("✅ Main Core sécurisé chargé - Version 3.4.0 AVEC initialisation menu latéral et compteurs corrigés");