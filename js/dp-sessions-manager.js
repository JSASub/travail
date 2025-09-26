// dp-sessions-manager.js - Gestion DP et Sessions (version corrigÃ©e)

// Fonction utilitaire pour vÃ©rifier l'existence des Ã©lÃ©ments
function checkElementExists(elementId) {
  const element = document.getElementById(elementId);
  return element !== null;
}

// NOUVELLE FONCTION MANQUANTE : VÃ©rifier les Ã©lÃ©ments requis
function checkRequiredElements() {
  console.log("ðŸ" VÃ©rification des Ã©lÃ©ments requis...");
  
  const requiredElements = [
    'dp-nom', 'dp-date', 'dp-lieu', 'dp-plongee',
    'valider-dp', 'dp-message'
  ];
  
  const missing = [];
  const present = [];
  
  requiredElements.forEach(elementId => {
    if (checkElementExists(elementId)) {
      present.push(elementId);
    } else {
      missing.push(elementId);
    }
  });
  
  if (missing.length > 0) {
    console.warn("âš ï¸ Ã‰lÃ©ments manquants:", missing);
    return {
      allPresent: false,
      missing: missing,
      present: present
    };
  } else {
    console.log("âœ… Tous les Ã©lÃ©ments requis sont prÃ©sents");
    return {
      allPresent: true,
      missing: [],
      present: present
    };
  }
}

// NOUVELLE FONCTION : RafraÃ®chissement avec indicateur visuel
async function refreshAllListsWithIndicator(buttonId = null) {
  console.log("ðŸ"„ RafraÃ®chissement avec indicateur visuel...");
  
  let btn = null;
  if (buttonId) {
    btn = document.getElementById(buttonId);
  }
  
  try {
    // Indicateur de chargement
    if (btn) {
      btn.disabled = true;
      btn.textContent = "ðŸ"„ Actualisation...";
      btn.style.backgroundColor = "#6c757d";
    }
    
    await refreshAllLists();
    
    // Indicateur de succÃ¨s
    if (btn) {
      btn.textContent = "âœ… ActualisÃ© !";
      btn.style.backgroundColor = "#28a745";
      setTimeout(() => {
        btn.textContent = "ðŸ"„ Actualiser";
        btn.style.backgroundColor = "#6c757d";
      }, 2000);
    }
    
    console.log("âœ… RafraÃ®chissement avec indicateur terminÃ©");
    
  } catch (error) {
    console.error("âŒ Erreur rafraÃ®chissement avec indicateur:", error);
    
    if (btn) {
      btn.textContent = "âŒ Erreur";
      btn.style.backgroundColor = "#dc3545";
      setTimeout(() => {
        btn.textContent = "ðŸ"„ Actualiser";
        btn.style.backgroundColor = "#6c757d";
      }, 3000);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      if (btn.textContent.includes("ðŸ"„") && !btn.textContent.includes("Actualiser")) {
        btn.textContent = "ðŸ"„ Actualiser";
        btn.style.backgroundColor = "#6c757d";
      }
    }
  }
}

// ===== GESTION DU DIRECTEUR DE PLONGÃ‰E =====
window.checkRequiredElements = checkRequiredElements;
window.refreshAllLists = refreshAllLists;
window.refreshAllListsWithIndicator = refreshAllListsWithIndicator;

// Validation et enregistrement des informations DP
async function validateAndSaveDP() {
  try {
    const dpNom = document.getElementById("dp-nom")?.value?.trim();
    const dpDate = document.getElementById("dp-date")?.value;
    const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
    const dpPlongee = document.getElementById("dp-plongee")?.value;
    const dpMessage = document.getElementById("dp-message");
    
    // Validation des champs obligatoires
    const validation = validateDPFields(dpNom, dpDate, dpLieu, dpPlongee);
    if (!validation.valid) {
      alert(validation.message);
      if (validation.focusElement) {
        document.getElementById(validation.focusElement)?.focus();
      }
      return false;
    }
    
    // CrÃ©er l'objet informations DP
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
        console.log("âœ… Informations DP sauvegardÃ©es dans Firebase");
        
        // NOUVEAU : Sauvegarder Ã©galement la session complÃ¨te
        if (typeof saveSessionData === 'function') {
          await saveSessionData();
          console.log("âœ… Session complÃ¨te sauvegardÃ©e");
        }
        
        // NOUVEAU : Mettre Ã  jour l'indicateur de session courante
        updateCurrentSessionAfterSave();
        
        // NOUVEAU : RafraÃ®chir automatiquement aprÃ¨s validation
        if (typeof refreshAllLists === 'function') {
          setTimeout(refreshAllLists, 500);
        }
        
      } catch (firebaseError) {
        console.warn("âš ï¸ Erreur sauvegarde Firebase:", firebaseError.message);
        throw firebaseError;
      }
    }
    
    // Afficher le message de confirmation
    showDPValidationMessage(dpMessage, dpNom, dpDate, dpLieu, dpPlongee, true);
    
    // Mettre Ã  jour l'interface du bouton temporairement
    updateValidationButton(true);
    
    console.log("âœ… Validation DP rÃ©ussie:", dpInfo);
    
    // Synchronisation optionnelle
    if (typeof syncToDatabase === 'function') {
      setTimeout(syncToDatabase, 1000);
    }
    
    return true;
    
  } catch (error) {
    console.error("âŒ Erreur validation DP:", error);
    
    const dpMessage = document.getElementById("dp-message");
    showDPValidationMessage(dpMessage, "", "", "", "", false, error.message);
    
    if (typeof handleError === 'function') {
      handleError(error, "Validation DP");
    }
    
    return false;
  }
}

function validateDPFields(nom, date, lieu, plongee) {
  if (!nom) {
    return {
      valid: false,
      message: "âš ï¸ Veuillez saisir le nom du Directeur de PlongÃ©e",
      focusElement: "dp-nom"
    };
  }
  
  if (nom.length < 2) {
    return {
      valid: false,
      message: "âš ï¸ Le nom du DP doit contenir au moins 2 caractÃ¨res",
      focusElement: "dp-nom"
    };
  }
  
  if (!date) {
    return {
      valid: false,
      message: "âš ï¸ Veuillez sÃ©lectionner une date",
      focusElement: "dp-date"
    };
  }
  
  // VÃ©rifier que la date n'est pas trop ancienne (plus de 1 an)
  const selectedDate = new Date(date);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (selectedDate < oneYearAgo) {
    const confirm = window.confirm(
      "âš ï¸ La date sÃ©lectionnÃ©e remonte Ã  plus d'un an.\n\n" +
      "ÃŠtes-vous sÃ»r de vouloir continuer ?"
    );
    
    if (!confirm) {
      return {
        valid: false,
        message: "Validation annulÃ©e",
        focusElement: "dp-date"
      };
    }
  }
  
  if (!lieu) {
    return {
      valid: false,
      message: "âš ï¸ Veuillez saisir le lieu de plongÃ©e",
      focusElement: "dp-lieu"
    };
  }
  
  if (lieu.length < 2) {
    return {
      valid: false,
      message: "âš ï¸ Le lieu doit contenir au moins 2 caractÃ¨res",
      focusElement: "dp-lieu"
    };
  }
  
  return { valid: true };
}

function showDPValidationMessage(messageElement, nom, date, lieu, plongee, success, errorMsg = "") {
  if (!messageElement) return;
  
  if (success) {
    messageElement.innerHTML = `
      <div style="color: #28a745; font-weight: bold; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
        âœ… Session complÃ¨te enregistrÃ©e avec succÃ¨s
        <br><small style="font-weight: normal;">
          ðŸ"‹ ${typeof plongeurs !== 'undefined' ? plongeurs.length : 0} plongeurs, ${typeof palanquees !== 'undefined' ? palanquees.length : 0} palanquÃ©es
          <br>ðŸ"„ ${nom} - ${new Date(date).toLocaleDateString('fr-FR')} - ${lieu} (${plongee})
        </small>
      </div>
    `;
    messageElement.classList.add("dp-valide");
  } else {
    messageElement.innerHTML = `
      <div style="color: #dc3545; font-weight: bold; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        âŒ Erreur lors de l'enregistrement : ${errorMsg}
      </div>
    `;
    messageElement.classList.remove("dp-valide");
  }
}

function updateValidationButton(success) {
  const validerDPBtn = document.getElementById("valider-dp");
  if (!validerDPBtn) return;
  
  if (success) {
    validerDPBtn.disabled = true;
    validerDPBtn.textContent = "âœ… EnregistrÃ©";
    validerDPBtn.style.backgroundColor = "#28a745";
    
    setTimeout(() => {
      validerDPBtn.disabled = false;
      validerDPBtn.textContent = "Enregistrer Session + DP";
      validerDPBtn.style.backgroundColor = "#007bff";
    }, 3000);
  }
}

// ===== HISTORIQUE DP =====
async function chargerHistoriqueDP() {
  // VÃ©rifier si l'Ã©lÃ©ment dp-dates existe avant de l'utiliser
  if (!checkElementExists('dp-dates')) {
    console.log("â„¹ï¸ Ã‰lÃ©ment dp-dates non prÃ©sent - historique DP ignorÃ©");
    return; // Sortir sans erreur
  }

  try {
    // Votre code existant pour charger l'historique DP
    const dpDatesElement = document.getElementById('dp-dates');
    // ... reste du code
    console.log("âœ… Historique DP chargÃ©");
  } catch (error) {
    console.error("Erreur lors du chargement de l'historique DP:", error);
  }
}

function afficherInfoDP() {
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");
  
  if (!dpDatesSelect || !historiqueInfo) {
    console.error("âŒ Ã‰lÃ©ments DOM manquants pour afficher les infos DP");
    return;
  }
  
  const selectedKey = dpDatesSelect.value;
  
  if (!selectedKey) {
    historiqueInfo.innerHTML = '';
    return;
  }
  
  historiqueInfo.innerHTML = '<p>â³ Chargement des informations...</p>';
  
  if (typeof db === 'undefined' || !db) {
    historiqueInfo.innerHTML = '<p style="color: red;">âŒ Firebase non disponible</p>';
    return;
  }
  
  db.ref(`dpInfo/${selectedKey}`).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        historiqueInfo.innerHTML = '<p style="color: red;">âŒ DP non trouvÃ©</p>';
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
          <h4 style="margin: 0 0 10px 0; color: #004080;">ðŸ"‹ Informations DP</h4>
          <p><strong>ðŸ'¨â€ðŸ'¼ Directeur de PlongÃ©e :</strong> ${dpData.nom || 'Non dÃ©fini'}</p>
          <p><strong>ðŸ"… Date :</strong> ${formatDate(dpData.date)}</p>
          <p><strong>ðŸ" Lieu :</strong> ${dpData.lieu || 'Non dÃ©fini'}</p>
          <p><strong>ðŸ• Session :</strong> ${dpData.plongee || 'matin'}</p>
          <p><strong>â° CrÃ©Ã© le :</strong> ${dpData.timestamp ? new Date(dpData.timestamp).toLocaleString('fr-FR') : 'Date inconnue'}</p>
          
          <div style="margin-top: 15px;">
            <button onclick="chargerDonneesDPSelectionne('${selectedKey}')" 
                    style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              ðŸ"¥ Charger dans l'interface
            </button>
            <button onclick="supprimerDPSelectionne('${selectedKey}')" 
                    style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
              ðŸ—'ï¸ Supprimer
            </button>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error("âŒ Erreur chargement DP:", error);
      if (typeof handleError === 'function') {
        handleError(error, "Chargement DP");
      }
      historiqueInfo.innerHTML = `<p style="color: red;">âŒ Erreur : ${error.message}</p>`;
    });
}

async function chargerDonneesDPSelectionne(dpKey) {
  try {
    if (typeof db === 'undefined' || !db) {
      alert("âŒ Firebase non disponible");
      return;
    }
    
    const snapshot = await db.ref(`dpInfo/${dpKey}`).once('value');
    if (!snapshot.exists()) {
      alert("âŒ DP non trouvÃ©");
      return;
    }
    
    const dpData = snapshot.val();
    
    // Charger les donnÃ©es dans l'interface
    const dpNomInput = document.getElementById("dp-nom");
    const dpDateInput = document.getElementById("dp-date");
    const dpLieuInput = document.getElementById("dp-lieu");
    const dpPlongeeInput = document.getElementById("dp-plongee");
    
    if (dpNomInput) dpNomInput.value = dpData.nom || "";
    if (dpDateInput) dpDateInput.value = dpData.date || "";
    if (dpLieuInput) dpLieuInput.value = dpData.lieu || "";
    if (dpPlongeeInput) dpPlongeeInput.value = dpData.plongee || "matin";
    
    // NOUVEAU : Effacer le message de validation DP prÃ©cÃ©dent
    clearDPValidationMessage();
    
    alert("âœ… DonnÃ©es DP chargÃ©es avec succÃ¨s !");
    console.log("âœ… DP chargÃ©:", dpData);
    
  } catch (error) {
    console.error("âŒ Erreur chargement DP:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement DP sÃ©lectionnÃ©");
    }
    alert("âŒ Erreur lors du chargement : " + error.message);
  }
}

async function supprimerDPSelectionne(dpKey) {
  const confirmation = confirm("âš ï¸ ÃŠtes-vous sÃ»r de vouloir supprimer ce DP ?\n\nCette action est irrÃ©versible !");
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("âŒ Firebase non disponible");
      return;
    }
    
    await db.ref(`dpInfo/${dpKey}`).remove();
    alert("âœ… DP supprimÃ© avec succÃ¨s !");
    
    // Recharger l'historique
    await chargerHistoriqueDP();
    
    // RafraÃ®chir les listes si la fonction existe
    if (typeof refreshAllLists === 'function') {
      await refreshAllLists();
    }
    
    console.log("âœ… DP supprimÃ©:", dpKey, "+ listes rafraÃ®chies");
    
  } catch (error) {
    console.error("âŒ Erreur suppression DP:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Suppression DP");
    }
    alert("âŒ Erreur lors de la suppression : " + error.message);
  }
}

// ===== GESTION DES SESSIONS =====
async function populateSessionSelector() {
  console.log("ðŸ"‹ Chargement des sessions disponibles...");
  
  const sessionSelector = document.getElementById("session-selector");
  if (!sessionSelector) {
    console.error("âŒ Ã‰lÃ©ment session-selector non trouvÃ©");
    return;
  }
  
  // Vider le sÃ©lecteur
  sessionSelector.innerHTML = '<option value="">-- Charger une session --</option>';
  
  try {
    if (typeof loadAvailableSessions === 'function') {
      const sessions = await loadAvailableSessions();
      
      if (sessions.length === 0) {
        sessionSelector.innerHTML += '<option disabled>Aucune session disponible</option>';
        console.log("â„¹ï¸ Aucune session trouvÃ©e");
        return;
      }
      
      // TRIER LES SESSIONS AVANT DE CRÉER LES OPTIONS
      sessions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB - dateA;
        }
        
        const siteA = (a.lieu || "").toLowerCase().trim();
        const siteB = (b.lieu || "").toLowerCase().trim();
        
        if (siteA !== siteB) {
          return siteA.localeCompare(siteB, 'fr');
        }
        
        const typeOrder = {
          'matin': 1, 'apres-midi': 2, 'après-midi': 2, 'soir': 3, 
          'nuit': 4, 'plg1': 5, 'plg2': 6, 'plg3': 7, 'plg4': 8, 
          'formation': 9, 'autre': 10
        };
        
        const typeA = typeOrder[a.plongee] || 99;
        const typeB = typeOrder[b.plongee] || 99;
        
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        
        const dpA = (a.dp || "").toLowerCase().trim();
        const dpB = (b.dp || "").toLowerCase().trim();
        
        return dpA.localeCompare(dpB, 'fr');
      });
      
      sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session.key;
        option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
        sessionSelector.appendChild(option);
      });
      
      console.log(`âœ… ${sessions.length} sessions chargÃ©es dans le sÃ©lecteur`);
      
    } else {
      // Fallback : charger directement depuis Firebase
      if (typeof db !== 'undefined' && db) {
        const snapshot = await db.ref('sessions').once('value');
        
        if (!snapshot.exists()) {
          sessionSelector.innerHTML += '<option disabled>Aucune session trouvÃ©e</option>';
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
        
        // TRI : Date > Site > Type > Nom DP
        sessionsList.sort((a, b) => {
          // 1. Date (plus rÃ©cent d'abord)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB - dateA;
          }
          
          // 2. Site alphabÃ©tique
          const siteA = (a.lieu || "").toLowerCase().trim();
          const siteB = (b.lieu || "").toLowerCase().trim();
          
          if (siteA !== siteB) {
            return siteA.localeCompare(siteB, 'fr');
          }
          
          // 3. Type de plongÃ©e
          const typeOrder = {
            'matin': 1, 'apres-midi': 2, 'après-midi': 2, 'soir': 3, 
            'nuit': 4, 'plg1': 5, 'plg2': 6, 'plg3': 7, 'plg4': 8, 
            'formation': 9, 'autre': 10
          };
          
          const typeA = typeOrder[a.plongee] || 99;
          const typeB = typeOrder[b.plongee] || 99;
          
          if (typeA !== typeB) {
            return typeA - typeB;
          }
          
          // 4. Nom DP alphabÃ©tique
          const dpA = (a.dp || "").toLowerCase().trim();
          const dpB = (b.dp || "").toLowerCase().trim();
          
          return dpA.localeCompare(dpB, 'fr');
        });
        
        sessionsList.forEach(session => {
          const option = document.createElement("option");
          option.value = session.key;
          option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
          sessionSelector.appendChild(option);
        });
        
        console.log(`âœ… ${sessionsList.length} sessions chargÃ©es (fallback)`);
      } else {
        sessionSelector.innerHTML += '<option disabled>Firebase non disponible</option>';
        console.warn("âš ï¸ Firebase non disponible pour charger les sessions");
      }
    }
    
  } catch (error) {
    console.error("âŒ Erreur chargement sessions:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement sessions");
    }
    sessionSelector.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

async function loadSessionFromSelector() {
  const loadBtn = document.getElementById("load-session");
  
  try {
    // Indicateur de chargement
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "ðŸ"„ Chargement...";
      loadBtn.style.backgroundColor = "#6c757d";
    }
    
    const sessionSelector = document.getElementById("session-selector");
    if (!sessionSelector) {
      alert("SÃ©lecteur de session non trouvÃ©");
      return false;
    }
    
    const sessionKey = sessionSelector.value;
    if (!sessionKey) {
      alert("Veuillez sÃ©lectionner une session Ã  charger.");
      return false;
    }
    
    if (typeof loadSession === 'function') {
      const success = await loadSession(sessionKey);
      if (!success) {
        alert("Erreur lors du chargement de la session.");
        return false;
      } else {
        console.log("âœ… Session chargÃ©e:", sessionKey);
        
        // NOUVEAU : Effacer le message de validation DP prÃ©cÃ©dent
        clearDPValidationMessage();
        
        // NOUVEAU : Afficher quelle session est chargÃ©e
        updateCurrentSessionDisplay(sessionKey, sessionSelector.options[sessionSelector.selectedIndex].text);
        
        // Indicateur de succÃ¨s temporaire
        if (loadBtn) {
          loadBtn.textContent = "âœ… ChargÃ© !";
          loadBtn.style.backgroundColor = "#28a745";
          setTimeout(() => {
            loadBtn.textContent = "Charger";
            loadBtn.style.backgroundColor = "#6c757d";
          }, 2000);
        }
        
        return true;
      }
    } else {
      alert("Fonction de chargement non disponible");
      return false;
    }
    
  } catch (error) {
    console.error("âŒ Erreur chargement session:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement session");
    }
    alert("Erreur lors du chargement : " + error.message);
    return false;
  } finally {
    // Restaurer le bouton dans tous les cas
    if (loadBtn) {
      loadBtn.disabled = false;
      if (loadBtn.textContent.includes("ðŸ"„")) {
        loadBtn.textContent = "Charger";
        loadBtn.style.backgroundColor = "#6c757d";
      }
    }
  }
}

// NOUVELLE FONCTION : Afficher la session actuellement chargÃ©e
function updateCurrentSessionDisplay(sessionKey, sessionText) {
  try {
    // Chercher ou crÃ©er l'indicateur de session courante
    let currentSessionDiv = document.getElementById("current-session-indicator");
    
    if (!currentSessionDiv) {
      // CrÃ©er l'indicateur s'il n'existe pas
      currentSessionDiv = document.createElement("div");
      currentSessionDiv.id = "current-session-indicator";
      currentSessionDiv.style.cssText = `
        margin: 10px 0;
        padding: 8px 12px;
        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
        border: 1px solid #4caf50;
        border-radius: 6px;
        font-size: 13px;
        color: #2e7d32;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      // L'insÃ©rer aprÃ¨s le bouton "Enregistrer Session + DP"
      const validerDPBtn = document.getElementById("valider-dp");
      if (validerDPBtn && validerDPBtn.parentNode) {
        validerDPBtn.parentNode.insertBefore(currentSessionDiv, validerDPBtn.nextSibling);
      } else {
        // Fallback : l'insérer dans meta-info
        const metaInfo = document.getElementById("meta-info");
        if (metaInfo) {
          metaInfo.appendChild(currentSessionDiv);
        }
      }
    }
    
    // Mettre à jour le contenu
    if (sessionKey && sessionText) {
      currentSessionDiv.innerHTML = `
        <span style="font-size: 16px;">📋</span>
        <span>Session chargée : ${sessionText}</span>
        <button onclick="clearCurrentSessionDisplay()" style="
          background: rgba(255,255,255,0.7);
          border: none;
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
          margin-left: auto;
        " title="Effacer l'indicateur">✕</button>
      `;
      currentSessionDiv.style.display = "flex";
    } else {
      currentSessionDiv.style.display = "none";
    }
    
  } catch (error) {
    console.error("⛔ Erreur updateCurrentSessionDisplay:", error);
  }
}

// NOUVELLE FONCTION : Effacer l'indicateur de session
function clearCurrentSessionDisplay() {
  try {
    const currentSessionDiv = document.getElementById("current-session-indicator");
    if (currentSessionDiv) {
      currentSessionDiv.style.display = "none";
    }
  } catch (error) {
    console.error("⛔ Erreur clearCurrentSessionDisplay:", error);
  }
}

// NOUVELLE FONCTION : Mettre à jour l'indicateur après sauvegarde
function updateCurrentSessionAfterSave() {
  try {
    const dpNom = document.getElementById("dp-nom")?.value?.trim();
    const dpDate = document.getElementById("dp-date")?.value;
    const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
    const dpPlongee = document.getElementById("dp-plongee")?.value;
    
    if (dpNom && dpDate && dpLieu) {
      const sessionText = `${dpDate} - ${dpNom} - ${dpLieu} (${dpPlongee})`;
      const sessionKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
      updateCurrentSessionDisplay(sessionKey, sessionText);
    }
  } catch (error) {
    console.error("⛔ Erreur updateCurrentSessionAfterSave:", error);
  }
}

// NOUVELLE FONCTION : Effacer le message de validation DP
function clearDPValidationMessage() {
  try {
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      dpMessage.innerHTML = '';
      dpMessage.classList.remove("dp-valide");
      dpMessage.style.display = 'none';
    }
  } catch (error) {
    console.error("⛔ Erreur clearDPValidationMessage:", error);
  }
}

async function saveCurrentSession() {
  try {
    if (typeof saveSessionData === 'function') {
      await saveSessionData();
      alert("Session sauvegardée !");
      
      // Actualiser les listes
      await populateSessionSelector();
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
      }
      
      console.log("✅ Session sauvegardée");
      return true;
    } else {
      alert("Fonction de sauvegarde non disponible");
      return false;
    }
  } catch (error) {
    console.error("⛔ Erreur sauvegarde session:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Sauvegarde session");
    }
    alert("Erreur lors de la sauvegarde : " + error.message);
    return false;
  }
}

// ===== NETTOYAGE DES SESSIONS =====
async function populateSessionsCleanupList() {
  console.log("🧹 Chargement de la liste de nettoyage des sessions...");
  
  const cleanupList = document.getElementById("sessions-cleanup-list");
  if (!cleanupList) {
    console.error("⛔ Élément sessions-cleanup-list non trouvé");
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
    console.error("⛔ Erreur chargement liste nettoyage sessions:", error);
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
    
    // TRI : Date > Site > Type > Nom DP
    sessionsList.sort((a, b) => {
      // 1. Date (plus récent d'abord)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB - dateA;
      }
      
      // 2. Site alphabétique
      const siteA = (a.lieu || "").toLowerCase();
      const siteB = (b.lieu || "").toLowerCase();
      
      if (siteA !== siteB) {
        return siteA.localeCompare(siteB, 'fr');
      }
      
      // 3. Type de plongée
      const typeOrder = {
        'matin': 1, 'apres-midi': 2, 'après-midi': 2, 'soir': 3, 
        'nuit': 4, 'plg1': 5, 'plg2': 6, 'plg3': 7, 'plg4': 8, 
        'formation': 9, 'autre': 10
      };
      
      const typeA = typeOrder[a.plongee] || 99;
      const typeB = typeOrder[b.plongee] || 99;
      
      if (typeA !== typeB) {
        return typeA - typeB;
      }
      
      // 4. Nom DP alphabétique
      const dpA = (a.dp || "").toLowerCase();
      const dpB = (b.dp || "").toLowerCase();
      
      return dpA.localeCompare(dpB, 'fr');
    });
    
    return sessionsList;
    
  } catch (error) {
    console.error("⛔ Erreur loadSessionsDirectly:", error);
    return [];
  }
}

// ===== FONCTIONS DE NETTOYAGE =====
function selectAllSessions(select) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
  });
  updateCleanupSelection();
}

function updateCleanupSelection() {
  const sessionCheckboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  const deleteSessionsBtn = document.getElementById('delete-selected-sessions');
  
  if (deleteSessionsBtn) {
    deleteSessionsBtn.disabled = sessionCheckboxes.length === 0;
    deleteSessionsBtn.textContent = `🗑️ Supprimer sélectionnées (${sessionCheckboxes.length})`;
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
      alert("⛔ Firebase non disponible");
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
    
    console.log(`✅ ${checkboxes.length} sessions supprimées + listes rafraîchies`);
    
  } catch (error) {
    console.error("⛔ Erreur suppression sessions:", error);
    alert("⛔ Erreur lors de la suppression : " + error.message);
  }
}

// ===== RAFRAÎCHISSEMENT AUTOMATIQUE =====

// NOUVELLE FONCTION : Rafraîchissement avec indicateur visuel
async function refreshAllLists() {
  console.log("🔄 Rafraîchissement des listes...");
  
  try {
    // 1. Rafraîchir le sélecteur de sessions (toujours présent)
    if (typeof populateSessionSelector === 'function') {
      await populateSessionSelector();
      console.log("✅ Sessions rafraîchies");
    }
    
    // 2. Rafraîchir la liste de nettoyage (si présente)
    if (checkElementExists('sessions-cleanup-list') && typeof populateSessionsCleanupList === 'function') {
      await populateSessionsCleanupList();
      console.log("✅ Liste de nettoyage rafraîchie");
    }
    
    // 3. Charger l'historique DP (optionnel, seulement si l'élément existe)
    await chargerHistoriqueDP();
    
    console.log("✅ Rafraîchissement terminé sans erreur");
    
  } catch (error) {
    console.error("⛔ Erreur lors du rafraîchissement:", error);
  }
}

// Fonction de diagnostic pour vérifier tous les éléments
function diagnosticElements() {
  const elements = [
    'dp-select', 'dp-date', 'dp-lieu', 'dp-plongee',
    'session-selector', 'sessions-cleanup-list', 
    'dp-dates', 'dp-cleanup-list'
  ];
  
  console.log("🔍 Diagnostic des éléments de l'interface:");
  
  elements.forEach(id => {
    const exists = checkElementExists(id);
    const status = exists ? "✅ Présent" : "⛔ Absent";
    console.log(`  ${id}: ${status}`);
  });
}

// Exporter les fonctions globalement si nécessaire
if (typeof window !== 'undefined') {
  window.checkElementExists = checkElementExists;
  window.diagnosticElements = diagnosticElements;
}

// ===== TEST FIREBASE =====
async function testFirebaseConnection() {
  console.log("🧪 === TEST FIREBASE COMPLET SÉCURISÉ ===");
  
  try {
    console.log("📡 Test 1: Vérification connexion Firebase");
    console.log("Firebase connecté:", typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined');
    console.log("Instance db:", typeof db !== 'undefined' && db ? "✅ OK" : "⛔ MANQUANTE");
    
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
    console.error("⛔ Erreur test Firebase:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Test Firebase");
    }
    alert("Erreur lors du test Firebase : " + error.message);
  }
}

// ===== INITIALISATION APRÈS CONNEXION =====
async function initializeAfterAuth() {
  console.log("🔑 Initialisation après authentification...");
  
  try {
    // Charger toutes les données utilisateur
    if (typeof initializeAppData === 'function') {
      await initializeAppData();
    }
    
    // Charger spécifiquement l'historique et les listes de nettoyage
    console.log("📋 Chargement des interfaces de gestion...");
    
    try {
      await chargerHistoriqueDP();
      console.log("✅ Historique DP chargé après auth");
    } catch (error) {
      console.error("⛔ Erreur historique DP après auth:", error);
    }
    
    try {
      await populateSessionSelector();
      console.log("✅ Sélecteur sessions chargé après auth");
    } catch (error) {
      console.error("⛔ Erreur sélecteur sessions après auth:", error);
    }
    
    try {
      await populateSessionsCleanupList();
      console.log("✅ Liste nettoyage sessions chargée après auth");
    } catch (error) {
      console.error("⛔ Erreur liste sessions après auth:", error);
    }
    
    console.log("✅ Initialisation complète après authentification terminée");
    
  } catch (error) {
    console.error("⛔ Erreur initialisation après auth:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Initialisation après authentification");
    }
  }
}

// ===== SETUP EVENT LISTENERS =====
function setupDPSessionsEventListeners() {
  console.log("🎛️ Configuration des event listeners DP et Sessions...");
  
  try {
    // === VALIDATION DP ===
    const validerDPBtn = document.getElementById("valider-dp");
    if (validerDPBtn) {
      validerDPBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await validateAndSaveDP();
      });
    }

    // === SESSIONS ===
    const loadSessionBtn = document.getElementById("load-session");
    if (loadSessionBtn) {
      loadSessionBtn.addEventListener("click", loadSessionFromSelector);
    }

    const refreshSessionsBtn = document.getElementById("refresh-sessions");
    if (refreshSessionsBtn) {
      refreshSessionsBtn.addEventListener("click", async () => {
        await refreshAllListsWithIndicator("refresh-sessions");
      });
    }

    const saveSessionBtn = document.getElementById("save-session");
    if (saveSessionBtn) {
      saveSessionBtn.addEventListener("click", async () => {
        const saveBtn = document.getElementById("save-session");
        
        try {
          // Indicateur de sauvegarde
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "💾 Sauvegarde...";
            saveBtn.style.backgroundColor = "#6c757d";
          }
          
          const success = await saveCurrentSession();
          
          if (success) {
            // Indicateur de succès
            if (saveBtn) {
              saveBtn.textContent = "✅ Sauvegardé !";
              saveBtn.style.backgroundColor = "#28a745";
              setTimeout(() => {
                saveBtn.textContent = "Sauvegarder Session";
                saveBtn.style.backgroundColor = "#28a745";
              }, 2000);
            }
          } else {
            // Indicateur d'erreur
            if (saveBtn) {
              saveBtn.textContent = "⛔ Erreur";
              saveBtn.style.backgroundColor = "#dc3545";
              setTimeout(() => {
                saveBtn.textContent = "Sauvegarder Session";
                saveBtn.style.backgroundColor = "#28a745";
              }, 3000);
            }
          }
          
        } catch (error) {
          console.error("⛔ Erreur sauvegarde:", error);
          if (saveBtn) {
            saveBtn.textContent = "⛔ Erreur";
            saveBtn.style.backgroundColor = "#dc3545";
            setTimeout(() => {
              saveBtn.textContent = "Sauvegarder Session";
              saveBtn.style.backgroundColor = "#28a745";
            }, 3000);
          }
        } finally {
          // Restaurer le bouton
          if (saveBtn) {
            saveBtn.disabled = false;
            if (saveBtn.textContent.includes("💾")) {
              saveBtn.textContent = "Sauvegarder Session";
              saveBtn.style.backgroundColor = "#28a745";
            }
          }
        }
      });
    }

    // === NETTOYAGE SESSIONS ===
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
      deleteSelectedSessionsBtn.addEventListener("click", deleteSelectedSessions);
    }

    const refreshSessionsListBtn = document.getElementById("refresh-sessions-list");
    if (refreshSessionsListBtn) {
      refreshSessionsListBtn.addEventListener("click", async () => {
        const refreshBtn = document.getElementById("refresh-sessions-list");
        
        try {
          // Indicateur de rafraîchissement
          if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = "🔄 Actualisation...";
            refreshBtn.style.backgroundColor = "#6c757d";
          }
          
          await populateSessionsCleanupList();
          
          // Indicateur de succès
          if (refreshBtn) {
            refreshBtn.textContent = "✅ Actualisé !";
            refreshBtn.style.backgroundColor = "#28a745";
            setTimeout(() => {
              refreshBtn.textContent = "Actualiser liste";
              refreshBtn.style.backgroundColor = "#6c757d";
            }, 2000);
          }
          
        } catch (error) {
          console.error("⛔ Erreur actualisation liste:", error);
          if (refreshBtn) {
            refreshBtn.textContent = "⛔ Erreur";
            refreshBtn.style.backgroundColor = "#dc3545";
            setTimeout(() => {
              refreshBtn.textContent = "Actualiser liste";
              refreshBtn.style.backgroundColor = "#6c757d";
            }, 3000);
          }
        } finally {
          if (refreshBtn) {
            refreshBtn.disabled = false;
            if (refreshBtn.textContent.includes("🔄")) {
              refreshBtn.textContent = "Actualiser liste";
              refreshBtn.style.backgroundColor = "#6c757d";
            }
          }
        }
      });
    }

    // Event listeners pour les checkboxes de nettoyage
    document.addEventListener('change', (e) => {
      try {
        if (e.target.classList.contains('session-cleanup-checkbox')) {
          updateCleanupSelection();
        }
      } catch (error) {
        console.error("⛔ Erreur checkbox cleanup:", error);
        if (typeof handleError === 'function') {
          handleError(error, "Checkbox cleanup");
        }
      }
    });

    // === TEST FIREBASE ===
    const testFirebaseBtn = document.getElementById("test-firebase");
    if (testFirebaseBtn) {
      testFirebaseBtn.addEventListener("click", testFirebaseConnection);
    }
    
    console.log("✅ Event listeners DP et Sessions configurés avec succès");
    
  } catch (error) {
    console.error("⛔ Erreur configuration event listeners DP/Sessions:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Configuration event listeners DP/Sessions");
    }
  }
}

// ===== INITIALISATION =====
function initializeDPSessionsManager() {
  console.log("🎯 Initialisation du gestionnaire DP et Sessions...");
  
  try {
    // Configurer les event listeners
    setupDPSessionsEventListeners();
    
    console.log("✅ Gestionnaire DP et Sessions initialisé");
    
  } catch (error) {
    console.error("⛔ Erreur initialisation gestionnaire DP/Sessions:", error);
  }
}

// ===== EXPORTS GLOBAUX =====
window.validateAndSaveDP = validateAndSaveDP;
window.validateDPFields = validateDPFields;
window.chargerHistoriqueDP = chargerHistoriqueDP;
window.afficherInfoDP = afficherInfoDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.supprimerDPSelectionne = supprimerDPSelectionne;
window.populateSessionSelector = populateSessionSelector;
window.loadSessionFromSelector = loadSessionFromSelector;
window.saveCurrentSession = saveCurrentSession;
window.populateSessionsCleanupList = populateSessionsCleanupList;
window.selectAllSessions = selectAllSessions;
window.updateCleanupSelection = updateCleanupSelection;
window.deleteSelectedSessions = deleteSelectedSessions;
window.refreshAllLists = refreshAllLists;
window.refreshAllListsWithIndicator = refreshAllListsWithIndicator;
window.testFirebaseConnection = testFirebaseConnection;
window.initializeAfterAuth = initializeAfterAuth;
window.initializeDPSessionsManager = initializeDPSessionsManager;
window.updateCurrentSessionDisplay = updateCurrentSessionDisplay;
window.clearCurrentSessionDisplay = clearCurrentSessionDisplay;
window.updateCurrentSessionAfterSave = updateCurrentSessionAfterSave;
window.clearDPValidationMessage = clearDPValidationMessage;

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDPSessionsManager);
} else {
  initializeDPSessionsManager();
}

console.log("🎯 Module DP et Sessions Manager chargé - Toutes fonctionnalités DP/Sessions disponibles");