// dp-sessions-manager.js - Gestion complète DP et Sessions

// ===== VARIABLES GLOBALES =====
let currentDPData = null;
let isEditingDP = false;
let editingDPKey = null;

// ===== GESTION SIMPLIFIÉE DES DP SANS POPUP =====

// Initialisation de l'interface DP simplifiée
function initializeDPSimpleInterface() {
  console.log("🎯 Initialisation interface DP simplifiée...");
  setupDPEventListeners();
  loadDPList();
  resetDPForm();
}

// Configuration des event listeners pour les boutons DP
function setupDPEventListeners() {
  console.log("🔧 Configuration des event listeners DP...");
  
  // Bouton "Nouveau DP"
  const newDPBtn = document.getElementById("new-dp-btn");
  if (newDPBtn) {
    newDPBtn.addEventListener("click", startNewDP);
  }

  // Bouton "Modifier DP" 
  const editDPBtn = document.getElementById("edit-dp-btn");
  if (editDPBtn) {
    editDPBtn.addEventListener("click", startEditDP);
  }

  // Bouton "Supprimer DP"
  const deleteDPBtn = document.getElementById("delete-dp-btn");
  if (deleteDPBtn) {
    deleteDPBtn.addEventListener("click", deleteSelectedDP);
  }

  // Bouton "RAZ DP"
  const resetDPBtn = document.getElementById("reset-dp-btn");
  if (resetDPBtn) {
    resetDPBtn.addEventListener("click", resetDPForm);
  }

  // Bouton "Annuler" (pour annuler une modification)
  const cancelDPBtn = document.getElementById("cancel-dp-btn");
  if (cancelDPBtn) {
    cancelDPBtn.addEventListener("click", cancelDPEdit);
  }

  // Liste des DP - sélection
  const dpList = document.getElementById("dp-list");
  if (dpList) {
    dpList.addEventListener("click", handleDPSelection);
  }

  // Le bouton "Enregistrer Session + DP" conserve sa fonction existante
  const saveDPBtn = document.getElementById("valider-dp");
  if (saveDPBtn) {
    saveDPBtn.addEventListener("click", validateAndSaveDP);
  }

  // Event listeners pour les sessions
  setupSessionsEventListeners();
}

// Configuration des event listeners pour les sessions
function setupSessionsEventListeners() {
  // Bouton "Charger"
  const loadBtn = document.getElementById("load-session");
  if (loadBtn) {
    loadBtn.addEventListener("click", loadSessionFromSelector);
  }

  // Bouton "Actualiser"
  const refreshBtn = document.getElementById("refresh-sessions");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await refreshAllListsWithIndicator("refresh-sessions");
    });
  }

  // Bouton "Sauvegarder Session"
  const saveSessionBtn = document.getElementById("save-session");
  if (saveSessionBtn) {
    saveSessionBtn.addEventListener("click", async () => {
      const saveBtn = document.getElementById("save-session");
      
      try {
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "💾 Sauvegarde...";
          saveBtn.style.background = "#6c757d";
        }

        if (typeof saveSessionData === 'function') {
          await saveSessionData();
          
          if (saveBtn) {
            saveBtn.textContent = "✅ Sauvegardé !";
            saveBtn.style.background = "#28a745";
            
            setTimeout(() => {
              saveBtn.textContent = "💾 Sauvegarder Session";
              saveBtn.style.background = "#28a745";
            }, 2000);
          }
        }
        
      } catch (error) {
        console.error("❌ Erreur sauvegarde session:", error);
        if (saveBtn) {
          saveBtn.textContent = "❌ Erreur";
          saveBtn.style.background = "#dc3545";
          
          setTimeout(() => {
            saveBtn.textContent = "💾 Sauvegarder Session";
            saveBtn.style.background = "#28a745";
          }, 3000);
        }
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
        }
      }
    });
  }

  // Bouton "Test Firebase"
  const testFirebaseBtn = document.getElementById("test-firebase");
  if (testFirebaseBtn) {
    testFirebaseBtn.addEventListener("click", () => {
      if (typeof testFirebaseConnectionSafe === 'function') {
        testFirebaseConnectionSafe();
      }
    });
  }

  // Sélecteur de sessions
  const sessionSelector = document.getElementById("session-selector");
  if (sessionSelector) {
    sessionSelector.addEventListener("change", () => {
      console.log("Session sélectionnée:", sessionSelector.value);
    });
  }

  // Boutons de nettoyage
  const selectCleanupBtn = document.getElementById("select-sessions-cleanup");
  if (selectCleanupBtn) {
    selectCleanupBtn.addEventListener("click", showSessionsForCleanup);
  }

  const refreshSessionsListBtn = document.getElementById("refresh-sessions-list");
  if (refreshSessionsListBtn) {
    refreshSessionsListBtn.addEventListener("click", async () => {
      const refreshBtn = document.getElementById("refresh-sessions-list");
      
      try {
        if (refreshBtn) {
          refreshBtn.disabled = true;
          refreshBtn.textContent = "🔄 Actualisation...";
          refreshBtn.style.background = "#6c757d";
        }

        await populateSessionSelector();
        
        if (refreshBtn) {
          refreshBtn.textContent = "✅ Actualisé !";
          refreshBtn.style.background = "#28a745";
          
          setTimeout(() => {
            refreshBtn.textContent = "🔄 Actualiser liste";
            refreshBtn.style.background = "#17a2b8";
          }, 2000);
        }
        
      } catch (error) {
        console.error("❌ Erreur actualisation:", error);
        if (refreshBtn) {
          refreshBtn.textContent = "❌ Erreur";
          refreshBtn.style.background = "#dc3545";
          
          setTimeout(() => {
            refreshBtn.textContent = "🔄 Actualiser liste";
            refreshBtn.style.background = "#17a2b8";
          }, 3000);
        }
      } finally {
        if (refreshBtn) {
          refreshBtn.disabled = false;
        }
      }
    });
  }

  const deleteSelectedBtn = document.getElementById("delete-selected-sessions");
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", deleteSelectedSessions);
  }

  console.log("✅ Event listeners sessions configurés");
}

// Démarrer un nouveau DP
function startNewDP() {
  console.log("🆕 Nouveau DP");
  
  isEditingDP = false;
  editingDPKey = null;
  resetDPForm();
  updateDPButtonsState();
  updateDPFormTitle();
  
  // Effacer les messages précédents
  clearDPValidationMessage();
  clearCurrentSessionDisplay();
  
  showDPMessage("📝 Nouveau DP - Remplissez les champs ci-dessous", "info");
}

// Démarrer la modification d'un DP sélectionné
function startEditDP() {
  const selectedDPKey = getSelectedDPKey();
  
  if (!selectedDPKey) {
    showDPMessage("⚠️ Veuillez d'abord sélectionner un DP dans la liste", "warning");
    return;
  }
  
  console.log("✏️ Modification DP:", selectedDPKey);
  
  isEditingDP = true;
  editingDPKey = selectedDPKey;
  
  // Charger les données du DP sélectionné dans le formulaire
  loadDPDataToForm(selectedDPKey);
  updateDPButtonsState();
  updateDPFormTitle();
  
  showDPMessage("✏️ Modification en cours - Modifiez les champs puis cliquez sur 'Enregistrer Session + DP'", "info");
}

// Supprimer le DP sélectionné
async function deleteSelectedDP() {
  const selectedDPKey = getSelectedDPKey();
  
  if (!selectedDPKey) {
    showDPMessage("⚠️ Veuillez d'abord sélectionner un DP dans la liste", "warning");
    return;
  }
  
  // Confirmation simple
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ce DP ?\n\nCette action est irréversible.`)) {
    return;
  }
  
  try {
    console.log("🗑️ Suppression DP:", selectedDPKey);
    
    // Supprimer de Firebase
    if (typeof db !== 'undefined' && db) {
      await db.ref(`dpInfo/${selectedDPKey}`).remove();
      console.log("✅ DP supprimé de Firebase");
    }
    
    // Recharger la liste
    await loadDPList();
    resetDPForm();
    
    showDPMessage("✅ DP supprimé avec succès", "success");
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    showDPMessage("❌ Erreur lors de la suppression", "error");
  }
}

// Annuler la modification en cours
function cancelDPEdit() {
  console.log("🚫 Annulation modification DP");
  
  isEditingDP = false;
  editingDPKey = null;
  resetDPForm();
  updateDPButtonsState();
  updateDPFormTitle();
  
  // Désélectionner dans la liste
  const selectedItem = document.querySelector(".dp-item.selected");
  if (selectedItem) {
    selectedItem.classList.remove("selected");
  }
  
  showDPMessage("🚫 Modification annulée", "info");
}

// Réinitialiser le formulaire DP
function resetDPForm() {
  console.log("🔄 RAZ formulaire DP");
  
  // Vider tous les champs
  const fields = ['dp-nom', 'dp-date', 'dp-lieu', 'dp-plongee'];
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.value = '';
  });
  
  // Remettre la date du jour par défaut
  const dateField = document.getElementById("dp-date");
  if (dateField && !dateField.value) {
    dateField.value = new Date().toISOString().split('T')[0];
  }
  
  isEditingDP = false;
  editingDPKey = null;
  updateDPButtonsState();
  updateDPFormTitle();
  clearDPValidationMessage();
  clearCurrentSessionDisplay();
  
  showDPMessage("🔄 Formulaire remis à zéro", "info");
}

// Charger la liste des DP depuis Firebase
async function loadDPList() {
  console.log("📋 Chargement liste DP...");
  
  const dpListContainer = document.getElementById("dp-list");
  if (!dpListContainer) {
    console.error("❌ Container dp-list non trouvé");
    return;
  }
  
  try {
    if (typeof db === 'undefined' || !db) {
      dpListContainer.innerHTML = '<div class="dp-item-empty">❌ Firebase non disponible</div>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    const dpData = snapshot.val();
    
    if (!dpData || Object.keys(dpData).length === 0) {
      dpListContainer.innerHTML = '<div class="dp-item-empty">📝 Aucun DP enregistré</div>';
      return;
    }
    
    // Convertir en tableau et trier par date décroissante
    const dpArray = Object.entries(dpData).map(([key, value]) => ({
      key,
      ...value,
      dateObj: new Date(value.date || '1970-01-01')
    })).sort((a, b) => b.dateObj - a.dateObj);
    
    // Générer le HTML de la liste
    let listHTML = '';
    dpArray.forEach(dp => {
      const dateFormatted = dp.dateObj.toLocaleDateString('fr-FR');
      const isSelected = dp.key === editingDPKey ? 'selected' : '';
      
      listHTML += `
        <div class="dp-item ${isSelected}" data-dp-key="${dp.key}">
          <div class="dp-item-header">
            <span class="dp-date">📅 ${dateFormatted}</span>
            <span class="dp-nom">👤 ${dp.nom || 'Sans nom'}</span>
          </div>
          <div class="dp-item-details">
            <span class="dp-lieu">📍 ${dp.lieu || 'Sans lieu'}</span>
            <span class="dp-plongee">🏊‍♂️ ${dp.plongee || 'Sans type'}</span>
          </div>
        </div>
      `;
    });
    
    dpListContainer.innerHTML = listHTML;
    console.log(`✅ ${dpArray.length} DP chargés dans la liste`);
    
  } catch (error) {
    console.error("❌ Erreur chargement liste DP:", error);
    dpListContainer.innerHTML = '<div class="dp-item-empty">❌ Erreur de chargement</div>';
  }
}

// Gérer la sélection d'un DP dans la liste
function handleDPSelection(event) {
  const dpItem = event.target.closest('.dp-item');
  if (!dpItem || dpItem.classList.contains('dp-item-empty')) return;
  
  // Désélectionner tous les autres items
  document.querySelectorAll('.dp-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Sélectionner l'item cliqué
  dpItem.classList.add('selected');
  
  const dpKey = dpItem.dataset.dpKey;
  console.log("📋 DP sélectionné:", dpKey);
  
  updateDPButtonsState();
}

// Obtenir la clé du DP actuellement sélectionné
function getSelectedDPKey() {
  const selectedItem = document.querySelector('.dp-item.selected');
  return selectedItem ? selectedItem.dataset.dpKey : null;
}

// Charger les données d'un DP dans le formulaire
async function loadDPDataToForm(dpKey) {
  try {
    if (typeof db === 'undefined' || !db) {
      showDPMessage("❌ Firebase non disponible", "error");
      return;
    }
    
    const snapshot = await db.ref(`dpInfo/${dpKey}`).once('value');
    const dpData = snapshot.val();
    
    if (!dpData) {
      showDPMessage("❌ DP non trouvé", "error");
      return;
    }
    
    // Remplir les champs du formulaire
    const fields = {
      'dp-nom': dpData.nom || '',
      'dp-date': dpData.date || '',
      'dp-lieu': dpData.lieu || '',
      'dp-plongee': dpData.plongee || ''
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field) field.value = value;
    });
    
    console.log("✅ Données DP chargées dans le formulaire");
    
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    showDPMessage("❌ Erreur lors du chargement", "error");
  }
}

// Mettre à jour l'état des boutons selon le contexte
function updateDPButtonsState() {
  const hasSelection = !!getSelectedDPKey();
  
  // Boutons d'action sur sélection
  const editBtn = document.getElementById("edit-dp-btn");
  const deleteBtn = document.getElementById("delete-dp-btn");
  
  if (editBtn) {
    editBtn.disabled = !hasSelection;
    editBtn.style.opacity = hasSelection ? '1' : '0.5';
  }
  
  if (deleteBtn) {
    deleteBtn.disabled = !hasSelection;
    deleteBtn.style.opacity = hasSelection ? '1' : '0.5';
  }
  
  // Bouton d'annulation (visible uniquement en mode édition)
  const cancelBtn = document.getElementById("cancel-dp-btn");
  if (cancelBtn) {
    cancelBtn.style.display = isEditingDP ? 'inline-block' : 'none';
  }
  
  // Adapter le bouton principal selon le mode
  const saveBtn = document.getElementById("valider-dp");
  if (saveBtn) {
    if (isEditingDP) {
      saveBtn.textContent = "💾 Mettre à jour Session + DP";
      saveBtn.style.background = "#ffc107"; // Orange pour modification
    } else {
      saveBtn.textContent = "💾 Enregistrer Session + DP";
      saveBtn.style.background = "#28a745"; // Vert pour nouveau
    }
  }
}

// Mettre à jour le titre du formulaire
function updateDPFormTitle() {
  const titleElement = document.getElementById("dp-form-title");
  if (titleElement) {
    if (isEditingDP) {
      titleElement.textContent = "✏️ Modification du Directeur de Plongée";
      titleElement.style.color = "#ffc107";
    } else {
      titleElement.textContent = "📝 Informations du Directeur de Plongée";
      titleElement.style.color = "#28a745";
    }
  }
}

// Afficher un message DP avec différents types
function showDPMessage(message, type = "info") {
  const messageContainer = document.getElementById("dp-message");
  if (!messageContainer) return;
  
  const colors = {
    info: "#17a2b8",
    success: "#28a745", 
    warning: "#ffc107",
    error: "#dc3545"
  };
  
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️", 
    error: "❌"
  };
  
  messageContainer.innerHTML = `
    <div style="
      color: ${colors[type]}; 
      font-weight: bold; 
      padding: 8px 12px; 
      background: ${colors[type]}15; 
      border: 1px solid ${colors[type]}40; 
      border-radius: 4px;
      margin: 5px 0;
    ">
      ${icons[type]} ${message}
    </div>
  `;
  
  // Auto-effacement après 5 secondes pour les messages info/success
  if (type === "info" || type === "success") {
    setTimeout(() => {
      if (messageContainer.innerHTML.includes(message)) {
        messageContainer.innerHTML = '';
      }
    }, 5000);
  }
}

// ===== VALIDATION ET SAUVEGARDE DP =====

// Validation des champs DP
function validateDPFields() {
  const dpNom = document.getElementById("dp-nom")?.value?.trim();
  const dpDate = document.getElementById("dp-date")?.value;
  const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
  const dpPlongee = document.getElementById("dp-plongee")?.value?.trim();

  if (!dpNom) {
    showDPMessage("❌ Le nom du DP est obligatoire", "error");
    return false;
  }

  if (!dpDate) {
    showDPMessage("❌ La date est obligatoire", "error");
    return false;
  }

  if (!dpLieu) {
    showDPMessage("❌ Le lieu est obligatoire", "error");
    return false;
  }

  if (!dpPlongee) {
    showDPMessage("❌ Le type de plongée est obligatoire", "error");
    return false;
  }

  return true;
}

// Fonction principale de validation et sauvegarde DP
async function validateAndSaveDP() {
  try {
    // Validation des champs
    if (!validateDPFields()) {
      return false;
    }
    
    const dpNom = document.getElementById("dp-nom")?.value?.trim();
    const dpDate = document.getElementById("dp-date")?.value;
    const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
    const dpPlongee = document.getElementById("dp-plongee")?.value?.trim();
    
    // Désactiver temporairement le bouton
    const saveBtn = document.getElementById("valider-dp");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = isEditingDP ? "🔄 Mise à jour..." : "🔄 Enregistrement...";
    }
    
    // Construire les données DP
    const dpInfo = {
      nom: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now()
    };
    
    // Générer la clé (utiliser l'existante si on modifie)
    let dpKey;
    if (isEditingDP && editingDPKey) {
      dpKey = editingDPKey;
      dpInfo.updatedAt = Date.now();
      console.log("🔄 Mise à jour DP:", dpKey);
    } else {
      dpKey = `${dpDate}_${dpNom.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      dpInfo.createdAt = Date.now();
      console.log("🆕 Création DP:", dpKey);
    }
    
    // Sauvegarder dans Firebase
    if (typeof db !== 'undefined' && db) {
      await db.ref(`dpInfo/${dpKey}`).set(dpInfo);
      console.log("✅ DP sauvegardé dans Firebase");
    }
    
    // Sauvegarder la session complète (fonction existante)
    if (typeof saveSessionData === 'function') {
      await saveSessionData();
      console.log("✅ Session complète sauvegardée");
    }
    
    // Rafraîchir les listes
    await loadDPList();
    setTimeout(() => {
      if (typeof refreshAllLists === 'function') {
        refreshAllLists();
      }
    }, 500);
    
    // Message de succès
    const actionText = isEditingDP ? "mise à jour" : "enregistrement";
    showDPMessage(`✅ ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} réussi avec succès`, "success");
    
    // Mettre à jour l'affichage de session courante
    updateCurrentSessionAfterSave();
    
    // Sortir du mode édition
    if (isEditingDP) {
      isEditingDP = false;
      editingDPKey = null;
      updateDPButtonsState();
      updateDPFormTitle();
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde DP:", error);
    showDPMessage("❌ Erreur lors de la sauvegarde", "error");
    return false;
    
  } finally {
    // Restaurer le bouton
    const saveBtn = document.getElementById("valider-dp");
    if (saveBtn) {
      saveBtn.disabled = false;
      updateDPButtonsState(); // Remettre le bon texte selon le mode
    }
  }
}

// ===== GESTION DES SESSIONS =====

// Chargement de session depuis le sélecteur
async function loadSessionFromSelector() {
  const loadBtn = document.getElementById("load-session");
  
  try {
    // Indicateur de chargement
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "🔄 Chargement...";
      loadBtn.style.background = "#6c757d";
    }
    
    const sessionSelector = document.getElementById("session-selector");
    if (!sessionSelector) {
      showDPMessage("❌ Sélecteur de session non trouvé", "error");
      return false;
    }
    
    const sessionKey = sessionSelector.value;
    if (!sessionKey) {
      showDPMessage("⚠️ Veuillez sélectionner une session", "warning");
      return false;
    }
    
    console.log("📂 Chargement session:", sessionKey);
    
    // NOUVEAU : Effacer le message de validation DP précédent
    clearDPValidationMessage();
    
    // Charger les données depuis Firebase
    if (typeof loadFromFirebase === 'function') {
      await loadFromFirebase();
    }
    
    // Charger les informations DP spécifiques
    await chargerDonneesDPSelectionne(sessionKey);
    
    // Mettre à jour l'affichage de session courante
    updateCurrentSessionDisplay(sessionKey);
    
    showDPMessage("✅ Session chargée avec succès", "success");
    
    // Indicateur de succès
    if (loadBtn) {
      loadBtn.textContent = "✅ Chargé !";
      loadBtn.style.background = "#28a745";
      
      setTimeout(() => {
        loadBtn.textContent = "📂 Charger";
        loadBtn.style.background = "#17a2b8";
      }, 2000);
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    showDPMessage("❌ Erreur lors du chargement", "error");
    return false;
    
  } finally {
    if (loadBtn) {
      loadBtn.disabled = false;
    }
  }
}

// Charger les données DP spécifiques
async function chargerDonneesDPSelectionne(dpKey) {
  try {
    if (typeof db === 'undefined' || !db) {
      showDPMessage("❌ Firebase non disponible", "error");
      return;
    }
    
    // NOUVEAU : Effacer le message de validation DP précédent
    clearDPValidationMessage();
    
    const snapshot = await db.ref(`dpInfo/${dpKey}`).once('value');
    const dpData = snapshot.val();
    
    if (!dpData) {
      showDPMessage("❌ Informations DP non trouvées", "error");
      return;
    }
    
    // Remplir les champs du formulaire
    const fields = {
      'dp-nom': dpData.nom || '',
      'dp-date': dpData.date || '',
      'dp-lieu': dpData.lieu || '',
      'dp-plongee': dpData.plongee || ''
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field) field.value = value;
    });
    
    console.log("✅ Données DP chargées:", dpData);
    
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    showDPMessage("❌ Erreur lors du chargement des données DP", "error");
  }
}

// Rafraîchissement avec indicateur
async function refreshAllListsWithIndicator(buttonId) {
  const refreshBtn = document.getElementById(buttonId);
  
  try {
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "🔄 Actualisation...";
      refreshBtn.style.background = "#6c757d";
    }

    // Rafraîchir l'historique DP
    if (typeof chargerHistoriqueDP === 'function') {
      await chargerHistoriqueDP();
    }
    
    // Rafraîchir le sélecteur de sessions
    await populateSessionSelector();
    
    // Rafraîchir la liste des DP
    await loadDPList();
    
    if (refreshBtn) {
      refreshBtn.textContent = "✅ Actualisé !";
      refreshBtn.style.background = "#28a745";
      
      setTimeout(() => {
        refreshBtn.textContent = "🔄 Actualiser";
        refreshBtn.style.background = "#17a2b8";
      }, 2000);
    }
    
  } catch (error) {
    console.error("❌ Erreur actualisation:", error);
    if (refreshBtn) {
      refreshBtn.textContent = "❌ Erreur";
      refreshBtn.style.background = "#dc3545";
      
      setTimeout(() => {
        refreshBtn.textContent = "🔄 Actualiser";
        refreshBtn.style.background = "#17a2b8";
      }, 3000);
    }
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
    }
  }
}

// Populer le sélecteur de sessions
async function populateSessionSelector() {
  console.log("📋 Chargement des sessions disponibles...");
  
  const sessionSelector = document.getElementById("session-selector");
  if (!sessionSelector) {
    console.error("❌ Élément session-selector non trouvé");
    return;
  }
  
  try {
    if (typeof db === 'undefined' || !db) {
      sessionSelector.innerHTML = '<option value="">❌ Firebase non disponible</option>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    const dpData = snapshot.val();
    
    if (!dpData) {
      sessionSelector.innerHTML = '<option value="">📝 Aucune session disponible</option>';
      return;
    }
    
    // Convertir en tableau et trier par date décroissante
    const sessions = Object.entries(dpData).map(([key, value]) => ({
      key,
      ...value,
      dateObj: new Date(value.date || '1970-01-01')
    })).sort((a, b) => b.dateObj - a.dateObj);
    
    // Générer les options
    let optionsHTML = '<option value="">Sélectionner une session</option>';
    sessions.forEach(session => {
      const dateFormatted = session.dateObj.toLocaleDateString('fr-FR');
      const sessionName = `${dateFormatted} - ${session.nom} - ${session.lieu} (${session.plongee})`;
      optionsHTML += `<option value="${session.key}">${sessionName}</option>`;
    });
    
    sessionSelector.innerHTML = optionsHTML;
    console.log(`✅ ${sessions.length} sessions chargées dans le sélecteur`);
    
  } catch (error) {
    console.error("❌ Erreur chargement sessions:", error);
    sessionSelector.innerHTML = '<option value="">❌ Erreur de chargement</option>';
  }
}

// ===== AFFICHAGE SESSION COURANTE =====

// Afficher la session courante
function updateCurrentSessionDisplay(sessionKey) {
  try {
    const dpNom = document.getElementById("dp-nom")?.value?.trim();
    const dpDate = document.getElementById("dp-date")?.value;
    const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
    const dpPlongee = document.getElementById("dp-plongee")?.value?.trim();
    
    if (!dpNom || !dpDate || !dpLieu || !dpPlongee) {
      return;
    }
    
    const dateFormatted = new Date(dpDate).toLocaleDateString('fr-FR');
    const sessionName = `${dateFormatted} - ${dpNom} - ${dpLieu} (${dpPlongee})`;
    
    const currentSessionDiv = document.getElementById("current-session-display");
    if (currentSessionDiv) {
      currentSessionDiv.innerHTML = `
        <div style="
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span><strong>📋 Session chargée :</strong> ${sessionName}</span>
          <button onclick="clearCurrentSessionDisplay()" style="
            background: none;
            border: none;
            color: #155724;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 2px;
          ">✕</button>
        </div>
      `;
    }
    
  } catch (error) {
    console.error("❌ Erreur affichage session courante:", error);
  }
}

// Effacer l'affichage de session courante
function clearCurrentSessionDisplay() {
  const currentSessionDiv = document.getElementById("current-session-display");
  if (currentSessionDiv) {
    currentSessionDiv.innerHTML = '';
  }
}

// Mettre à jour l'affichage après sauvegarde
function updateCurrentSessionAfterSave() {
  try {
    const dpNom = document.getElementById("dp-nom")?.value?.trim();
    const dpDate = document.getElementById("dp-date")?.value;
    const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
    const dpPlongee = document.getElementById("dp-plongee")?.value?.trim();
    
    if (!dpNom || !dpDate || !dpLieu || !dpPlongee) {
      return;
    }
    
    const dateFormatted = new Date(dpDate).toLocaleDateString('fr-FR');
    const sessionName = `${dateFormatted} - ${dpNom} - ${dpLieu} (${dpPlongee})`;
    
    const currentSessionDiv = document.getElementById("current-session-display");
    if (currentSessionDiv) {
      currentSessionDiv.innerHTML = `
        <div style="
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span><strong>📋 Session active :</strong> ${sessionName}</span>
          <button onclick="clearCurrentSessionDisplay()" style="
            background: none;
            border: none;
            color: #155724;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 2px;
          ">✕</button>
        </div>
      `;
    }
    
  } catch (error) {
    console.error("❌ Erreur mise à jour session courante:", error);
  }
}

// Effacer le message de validation DP
function clearDPValidationMessage() {
  const dpMessage = document.getElementById("dp-message");
  if (dpMessage) {
    dpMessage.innerHTML = '';
    dpMessage.classList.remove('dp-valide');
  }
}

// ===== HISTORIQUE ET NETTOYAGE =====

// Charger l'historique des DP
async function chargerHistoriqueDP() {
  console.log("📋 Chargement historique DP...");
  
  const historiqueContainer = document.getElementById("historique-dp");
  if (!historiqueContainer) {
    console.error("❌ Container historique-dp non trouvé");
    return;
  }
  
  try {
    if (typeof db === 'undefined' || !db) {
      historiqueContainer.innerHTML = '<div class="historique-empty">❌ Firebase non disponible</div>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    const dpData = snapshot.val();
    
    if (!dpData || Object.keys(dpData).length === 0) {
      historiqueContainer.innerHTML = '<div class="historique-empty">📝 Aucun historique disponible</div>';
      return;
    }
    
    // Convertir en tableau et trier par date décroissante
    const historiqueArray = Object.entries(dpData).map(([key, value]) => ({
      key,
      ...value,
      dateObj: new Date(value.date || '1970-01-01')
    })).sort((a, b) => b.dateObj - a.dateObj);
    
    // Générer le HTML
    let historiqueHTML = '';
    historiqueArray.forEach(dp => {
      const dateFormatted = dp.dateObj.toLocaleDateString('fr-FR');
      historiqueHTML += `
        <div class="historique-item" data-dp-key="${dp.key}">
          <div class="historique-header">
            <span class="historique-date">📅 ${dateFormatted}</span>
            <span class="historique-nom">👤 ${dp.nom || 'Sans nom'}</span>
          </div>
          <div class="historique-details">
            <span class="historique-lieu">📍 ${dp.lieu || 'Sans lieu'}</span>
            <span class="historique-plongee">🏊‍♂️ ${dp.plongee || 'Sans type'}</span>
          </div>
          <div class="historique-actions">
            <button onclick="chargerDonneesDPSelectionne('${dp.key}')" class="btn-historique">📂 Charger</button>
          </div>
        </div>
      `;
    });
    
    historiqueContainer.innerHTML = historiqueHTML;
    console.log(`✅ ${historiqueArray.length} entrées dans l'historique`);
    
  } catch (error) {
    console.error("❌ Erreur chargement historique:", error);
    historiqueContainer.innerHTML = '<div class="historique-empty">❌ Erreur de chargement</div>';
  }
}

// Afficher les sessions pour nettoyage
async function showSessionsForCleanup() {
  console.log("🧹 Affichage sessions pour nettoyage...");
  
  const cleanupList = document.getElementById("sessions-cleanup-list");
  const deleteBtn = document.getElementById("delete-selected-sessions");
  
  if (!cleanupList) {
    console.error("❌ Container sessions-cleanup-list non trouvé");
    return;
  }
  
  try {
    if (typeof db === 'undefined' || !db) {
      cleanupList.innerHTML = '<div class="cleanup-empty">❌ Firebase non disponible</div>';
      cleanupList.style.display = 'block';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    const dpData = snapshot.val();
    
    if (!dpData || Object.keys(dpData).length === 0) {
      cleanupList.innerHTML = '<div class="cleanup-empty">📝 Aucune session disponible</div>';
      cleanupList.style.display = 'block';
      return;
    }
    
    // Convertir en tableau et trier par date décroissante
    const sessions = Object.entries(dpData).map(([key, value]) => ({
      key,
      ...value,
      dateObj: new Date(value.date || '1970-01-01')
    })).sort((a, b) => b.dateObj - a.dateObj);
    
    // Générer le HTML avec checkboxes
    let cleanupHTML = '<h4>🎯 Sélectionnez les sessions à supprimer :</h4>';
    sessions.forEach(session => {
      const dateFormatted = session.dateObj.toLocaleDateString('fr-FR');
      cleanupHTML += `
        <div class="cleanup-item">
          <label>
            <input type="checkbox" value="${session.key}" onchange="updateDeleteButton()">
            <span class="cleanup-session-info">
              📅 ${dateFormatted} - 👤 ${session.nom} - 📍 ${session.lieu} (🏊‍♂️ ${session.plongee})
            </span>
          </label>
        </div>
      `;
    });
    
    cleanupList.innerHTML = cleanupHTML;
    cleanupList.style.display = 'block';
    
    // Activer le bouton de suppression si nécessaire
    if (deleteBtn) {
      deleteBtn.disabled = true;
    }
    
    console.log(`✅ ${sessions.length} sessions affichées pour nettoyage`);
    
  } catch (error) {
    console.error("❌ Erreur affichage sessions nettoyage:", error);
    cleanupList.innerHTML = '<div class="cleanup-empty">❌ Erreur de chargement</div>';
    cleanupList.style.display = 'block';
  }
}

// Mettre à jour le bouton de suppression selon les sélections
function updateDeleteButton() {
  const deleteBtn = document.getElementById("delete-selected-sessions");
  const checkboxes = document.querySelectorAll('#sessions-cleanup-list input[type="checkbox"]:checked');
  
  if (deleteBtn) {
    deleteBtn.disabled = checkboxes.length === 0;
    deleteBtn.textContent = checkboxes.length > 0 ? `🗑️ Supprimer (${checkboxes.length})` : '🗑️ Supprimer Sélectionnées';
  }
}

// Supprimer les sessions sélectionnées
async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('#sessions-cleanup-list input[type="checkbox"]:checked');
  
  if (checkboxes.length === 0) {
    alert("❌ Aucune session sélectionnée");
    return;
  }
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${checkboxes.length} session(s) ?\n\nCette action est irréversible.`)) {
    return;
  }
  
  try {
    console.log(`🗑️ Suppression de ${checkboxes.length} sessions...`);
    
    const deleteBtn = document.getElementById("delete-selected-sessions");
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "🔄 Suppression...";
    }
    
    // Supprimer chaque session sélectionnée
    const deletePromises = Array.from(checkboxes).map(checkbox => {
      const sessionKey = checkbox.value;
      return db.ref(`dpInfo/${sessionKey}`).remove();
    });
    
    await Promise.all(deletePromises);
    
    console.log("✅ Sessions supprimées avec succès");
    
    // Rafraîchir l'affichage
    await showSessionsForCleanup();
    await populateSessionSelector();
    await chargerHistoriqueDP();
    await loadDPList();
    
    if (deleteBtn) {
      deleteBtn.textContent = "✅ Supprimé !";
      setTimeout(() => {
        deleteBtn.textContent = "🗑️ Supprimer Sélectionnées";
        deleteBtn.disabled = true;
      }, 2000);
    }
    
    alert("✅ Sessions supprimées avec succès");
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("❌ Erreur lors de la suppression");
    
    const deleteBtn = document.getElementById("delete-selected-sessions");
    if (deleteBtn) {
      deleteBtn.textContent = "❌ Erreur";
      setTimeout(() => {
        deleteBtn.textContent = "🗑️ Supprimer Sélectionnées";
        updateDeleteButton();
      }, 3000);
    }
  }
}

// ===== SAUVEGARDE DE SESSION =====

// Fonction de sauvegarde de session (compatible avec l'existant)
async function saveSessionData() {
  console.log("💾 Sauvegarde session complète...");
  
  try {
    // Vérifier Firebase
    if (typeof db === 'undefined' || !db) {
      throw new Error("Firebase non disponible");
    }
    
    // Récupérer les données actuelles
    const plongeurs = window.plongeurs || [];
    const palanquees = window.palanquees || [];
    
    // Construire les données de session
    const sessionData = {
      plongeurs: plongeurs,
      palanquees: palanquees,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    
    // Générer une clé de session
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const sessionKey = `session_${dateStr}_${timeStr}`;
    
    // Sauvegarder dans Firebase
    await db.ref(`sessions/${sessionKey}`).set(sessionData);
    
    console.log("✅ Session sauvegardée:", sessionKey);
    return sessionKey;
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde session:", error);
    throw error;
  }
}

// ===== AUTO-INITIALISATION =====

function initializeDPSessionsManager() {
  console.log("🚀 Initialisation gestionnaire DP et Sessions...");
  
  try {
    // Initialiser l'interface DP
    initializeDPSimpleInterface();
    
    // Charger les données initiales
    setTimeout(() => {
      populateSessionSelector();
      chargerHistoriqueDP();
    }, 1000);
    
    console.log("✅ Gestionnaire DP et Sessions initialisé");
    
  } catch (error) {
    console.error("❌ Erreur initialisation DP Sessions:", error);
  }
}

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDPSessionsManager);
} else {
  initializeDPSessionsManager();
}

// ===== EXPORTS GLOBAUX =====
window.validateAndSaveDP = validateAndSaveDP;
window.validateDPFields = validateDPFields;
window.chargerHistoriqueDP = chargerHistoriqueDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.populateSessionSelector = populateSessionSelector;
window.loadSessionFromSelector = loadSessionFromSelector;
window.refreshAllListsWithIndicator = refreshAllListsWithIndicator;
window.saveSessionData = saveSessionData;
window.showSessionsForCleanup = showSessionsForCleanup;
window.updateDeleteButton = updateDeleteButton;
window.deleteSelectedSessions = deleteSelectedSessions;
window.updateCurrentSessionDisplay = updateCurrentSessionDisplay;
window.clearCurrentSessionDisplay = clearCurrentSessionDisplay;
window.updateCurrentSessionAfterSave = updateCurrentSessionAfterSave;
window.clearDPValidationMessage = clearDPValidationMessage;
window.initializeDPSessionsManager = initializeDPSessionsManager;
window.startNewDP = startNewDP;
window.startEditDP = startEditDP;
window.deleteSelectedDP = deleteSelectedDP;
window.resetDPForm = resetDPForm;
window.loadDPList = loadDPList;