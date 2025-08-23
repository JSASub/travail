// dp-management.js - Gestionnaire automatisé des DP - Version complète et corrigée
console.log('🔥 TEST - DEBUT DU FICHIER DP-MANAGEMENT.JS !')
// ===== DONNÉES DES DP COMPLÈTES =====
let DP_LIST = [
  { id: "dp1", nom: "AGUIRRE Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com" },
  { id: "dp2", nom: "AUBARD Corinne", niveau: "P5", email: "aubard.c@gmail.com" },
  { id: "dp3", nom: "BEST Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr" },
  { id: "dp4", nom: "CABIROL Joël", niveau: "E3", email: "joelcabirol@gmail.com" },
  { id: "dp5", nom: "CATTEROU Sacha", niveau: "P5", email: "sacha.catterou@orange.fr" },
  { id: "dp6", nom: "DARDER Olivier", niveau: "P5", email: "olivierdarder@gmail.com" },
  { id: "dp7", nom: "GAUTHIER Christophe", niveau: "P5", email: "jsasubaquatique24@gmail.com" },
  { id: "dp8", nom: "LE MAOUT Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr" },
  { id: "dp9", nom: "MARTY David", niveau: "E3", email: "david.marty@sfr.fr" },
  { id: "dp10", nom: "TROUBADIS Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com" },
  { id: "dp11", nom: "ZEBULON Eugène", niveau: "E4", email: "zebulon.eugene@example.com" }
];

// ===== VARIABLES GLOBALES =====
let currentEditingId = null;
let dpDatabase = null;

console.log('🔥 NOUVEAU DP-MANAGEMENT.JS CHARGÉ ! Version complète avec', DP_LIST.length, 'DP');

// ===== RÉFÉRENCE FIREBASE =====
function getFirebaseReference() {
  console.log('🔍 Vérification Firebase...');
  
  if (typeof firebase === 'undefined') {
    console.warn('⚠️ Firebase n\'est pas chargé');
    return null;
  }
  
  if (!firebase.database) {
    console.warn('⚠️ Firebase Database n\'est pas disponible');
    return null;
  }
  
  try {
    const app = firebase.app();
    console.log('✅ Firebase app disponible:', app.name);
  } catch (error) {
    console.warn('⚠️ Firebase non initialisé:', error.message);
    return null;
  }
  
  if (!dpDatabase) {
    try {
      dpDatabase = firebase.database().ref('dp_database');
      console.log('✅ Référence Firebase créée: dp_database');
    } catch (error) {
      console.warn('⚠️ Erreur création référence:', error);
      return null;
    }
  }
  
  return dpDatabase;
}

// ===== SAUVEGARDE DANS FIREBASE =====
async function saveDpToFirebase() {
  console.log('🔄 Tentative de sauvegarde Firebase...');
  
  const dbRef = getFirebaseReference();
  
  if (dbRef) {
    try {
      console.log('📤 Sauvegarde de', DP_LIST.length, 'DP dans Firebase...');
      await dbRef.set(DP_LIST);
      console.log('✅ Liste DP sauvegardée dans Firebase avec succès !');
      showNotification('DP sauvegardés avec succès dans Firebase', 'success');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde Firebase:', error);
      showNotification(`Erreur Firebase: ${error.message}`, 'error');
      return saveToLocalStorage();
    }
  } else {
    console.warn('⚠️ Firebase non disponible, utilisation localStorage');
    return saveToLocalStorage();
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('dp_list', JSON.stringify(DP_LIST));
    console.log('📱 Liste DP sauvegardée localement');
    showNotification('DP sauvegardés localement', 'info');
    return true;
  } catch (error) {
    console.error('❌ Erreur localStorage:', error);
    showNotification('Erreur de sauvegarde', 'error');
    return false;
  }
}

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function loadDpFromFirebase() {
  console.log('🔍 Tentative de chargement des DP depuis Firebase...');
  
  const dbRef = getFirebaseReference();
  
  if (dbRef) {
    try {
      console.log('📡 Connexion à Firebase...');
      const snapshot = await dbRef.once('value');
      const firebaseData = snapshot.val();
      
      console.log('📥 Données reçues de Firebase:', firebaseData);
      
      if (firebaseData && Array.isArray(firebaseData) && firebaseData.length > 0) {
        DP_LIST = firebaseData;
        console.log('✅ Liste DP chargée depuis Firebase:', DP_LIST.length, 'DP');
      } else {
        console.log('ℹ️ Aucune donnée DP valide dans Firebase, utilisation des données par défaut');
        await saveDpToFirebase();
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement Firebase:', error);
      console.log('📱 Tentative de chargement depuis localStorage...');
      loadDpFromLocalStorage();
    }
  } else {
    console.log('📱 Firebase non disponible, chargement depuis localStorage...');
    loadDpFromLocalStorage();
  }
  
  console.log('🔍 Vérification finale - DP_LIST contient:', DP_LIST.length, 'éléments');
}

function loadDpFromLocalStorage() {
  try {
    const stored = localStorage.getItem('dp_list');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        DP_LIST = parsed;
        console.log('📱 Liste DP chargée depuis localStorage');
      }
    }
  } catch (error) {
    console.error('❌ Erreur localStorage:', error);
  }
}

// ===== NOTIFICATION SYSTÈME =====
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `dp-notification dp-notification-${type}`;
  notification.textContent = message;
  
  // Styles intégrés si les CSS ne sont pas chargés
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 350px;
    word-wrap: break-word;
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ===== TRI ALPHABÉTIQUE =====
function sortDpList() {
  DP_LIST.sort((a, b) => {
    const extractLastName = (nomComplet) => {
      const mots = nomComplet.trim().split(' ');
      if (mots[0] === mots[0].toUpperCase()) {
        if (mots.length > 2 && (mots[0] === 'LE' || mots[0] === 'DE' || mots[0] === 'DU')) {
          return mots[1].toUpperCase();
        }
        return mots[0].toUpperCase();
      } else {
        return mots[mots.length - 1].toUpperCase();
      }
    };
    
    const nomA = extractLastName(a.nom);
    const nomB = extractLastName(b.nom);
    
    return nomA.localeCompare(nomB, 'fr');
  });
  
  console.log('🔤 Liste triée par nom de famille:', DP_LIST.map(dp => dp.nom));
}

// ===== GÉNÉRATION D'ID UNIQUE =====
function generateDpId() {
  const maxId = DP_LIST.reduce((max, dp) => {
    const idNum = parseInt(dp.id.replace('dp', ''));
    return Math.max(max, idNum);
  }, 0);
  return `dp${maxId + 1}`;
}

// ===== MISE À JOUR DE LA LISTE DÉROULANTE =====
function updateDpSelect() {
  const select = document.getElementById('dp-select');
  if (!select) {
    console.error('❌ Élément dp-select non trouvé !');
    return;
  }
  
  console.log('🔄 Mise à jour du sélecteur DP...');
  console.log('📋 Nombre de DP à afficher:', DP_LIST.length);
  
  const currentValue = select.value;
  
  select.innerHTML = '<option value="">-- Choisir un DP --</option>';
  
  if (DP_LIST.length === 0) {
    console.warn('⚠️ Aucun DP dans la liste !');
    select.innerHTML = '<option value="">Aucun DP disponible</option>';
    return;
  }
  
  sortDpList();
  
  DP_LIST.forEach((dp, index) => {
    console.log(`📝 Ajout DP ${index + 1}: ${dp.nom} (${dp.niveau}) [ID: ${dp.id}]`);
    
    const option = document.createElement('option');
    option.value = dp.id;
    option.textContent = `${dp.nom} (${dp.niveau})`;
    select.appendChild(option);
  });
  
  console.log(`✅ ${DP_LIST.length} DP ajoutés au sélecteur`);
  
  if (currentValue && DP_LIST.find(dp => dp.id === currentValue)) {
    select.value = currentValue;
    console.log('🔄 Valeur restaurée:', currentValue);
  }
  
  updateButtonStates();
  
  // Synchroniser l'ancien champ dp-nom si il existe
  syncWithOldDpField();
  
  // Déclencher la détection de session après un délai
  setTimeout(() => {
    tryAutoSync();
  }, 1000);
}

// ===== SYNCHRONISATION AVEC L'ANCIEN CHAMP DP-NOM =====
function syncWithOldDpField() {
  const dpSelect = document.getElementById('dp-select');
  const dpNomInput = document.getElementById('dp-nom');
  
  if (dpSelect && dpSelect.value && dpNomInput) {
    const selectedOption = dpSelect.options[dpSelect.selectedIndex];
    if (selectedOption && selectedOption.text !== '-- Choisir un DP --') {
      const dpName = selectedOption.text.replace(/\s*\([^)]*\)/, ''); // Enlever (E3), (E4), (P5)
      dpNomInput.value = dpName;
      console.log('🔄 Synchronisation avec ancien champ dp-nom:', dpName);
    }
  }
}

// ===== MISE À JOUR DES BOUTONS =====
function updateButtonStates() {
  const select = document.getElementById('dp-select');
  const editBtn = document.getElementById('edit-dp-btn');
  const deleteBtn = document.getElementById('delete-dp-btn');
  
  const hasSelection = select && select.value;
  
  if (editBtn) editBtn.disabled = !hasSelection;
  if (deleteBtn) deleteBtn.disabled = !hasSelection;
}

// ===== VALIDATION EMAIL =====
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ===== AFFICHAGE MODAL =====
function showModal(dp = null) {
  currentEditingId = dp ? dp.id : null;
  
  const modal = document.getElementById('dp-modal');
  const modalTitle = document.getElementById('modal-title');
  const dpNomInput = document.getElementById('dp-nom');
  const dpNiveauSelect = document.getElementById('dp-niveau');
  const dpEmailInput = document.getElementById('dp-email');
  
  if (!modal) {
    console.error('❌ Modal dp-modal non trouvée !');
    return;
  }
  
  if (modalTitle) modalTitle.textContent = dp ? 'Modifier le DP' : 'Ajouter un DP';
  if (dpNomInput) dpNomInput.value = dp ? dp.nom : '';
  if (dpNiveauSelect) dpNiveauSelect.value = dp ? dp.niveau : 'P5';
  if (dpEmailInput) dpEmailInput.value = dp ? dp.email : '';
  
  modal.style.display = 'block';
  if (dpNomInput) dpNomInput.focus();
}

// ===== FERMETURE MODAL =====
function hideModal() {
  const modal = document.getElementById('dp-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentEditingId = null;
}

// ===== SAUVEGARDE DP =====
async function saveDp() {
  const nomInput = document.getElementById('dp-nom');
  const niveauSelect = document.getElementById('dp-niveau');
  const emailInput = document.getElementById('dp-email');
  
  if (!nomInput || !niveauSelect || !emailInput) {
    showNotification('Éléments de formulaire manquants', 'error');
    return;
  }
  
  const nom = nomInput.value.trim();
  const niveau = niveauSelect.value;
  const email = emailInput.value.trim();
  
  if (!nom) {
    showNotification('Le nom est obligatoire', 'error');
    return;
  }
  
  if (!email || !isValidEmail(email)) {
    showNotification('Email invalide', 'error');
    return;
  }
  
  const existingDp = DP_LIST.find(dp => 
    dp.id !== currentEditingId && 
    (dp.nom.toLowerCase() === nom.toLowerCase() || dp.email.toLowerCase() === email.toLowerCase())
  );
  
  if (existingDp) {
    showNotification('Un DP avec ce nom ou cet email existe déjà', 'error');
    return;
  }
  
  if (currentEditingId) {
    const dpIndex = DP_LIST.findIndex(dp => dp.id === currentEditingId);
    if (dpIndex !== -1) {
      DP_LIST[dpIndex] = { id: currentEditingId, nom, niveau, email };
      showNotification('DP modifié avec succès', 'success');
    }
  } else {
    const newDp = {
      id: generateDpId(),
      nom,
      niveau,
      email
    };
    DP_LIST.push(newDp);
    showNotification('DP ajouté avec succès', 'success');
  }
  
  const saved = await saveDpToFirebase();
  
  if (saved) {
    updateDpSelect();
    hideModal();
    
    // Déclencher l'actualisation des sessions
    setTimeout(() => {
      forceSessionRefresh();
    }, 500);
  } else {
    showNotification('Erreur lors de la sauvegarde', 'error');
  }
}

// ===== SUPPRESSION DP =====
async function deleteDp() {
  const select = document.getElementById('dp-select');
  if (!select) return;
  
  const selectedId = select.value;
  
  if (!selectedId) return;
  
  const dp = DP_LIST.find(d => d.id === selectedId);
  if (!dp) return;
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${dp.nom}" ?`)) {
    return;
  }
  
  DP_LIST = DP_LIST.filter(d => d.id !== selectedId);
  
  const saved = await saveDpToFirebase();
  
  if (saved) {
    updateDpSelect();
    showNotification('DP supprimé avec succès', 'success');
    
    // Déclencher l'actualisation des sessions
    setTimeout(() => {
      forceSessionRefresh();
    }, 500);
  } else {
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// ===== ÉVÉNEMENT DE SÉLECTION DP =====
function onDpSelectionChange() {
  const dpSelect = document.getElementById('dp-select');
  if (!dpSelect) return;
  
  const selectedId = dpSelect.value;
  
  // Désactiver la synchronisation automatique si l'utilisateur fait un choix manuel
  if (selectedId) {
    window.userOverrideDP = true;
    console.log('👤 Utilisateur a fait un choix manuel - synchronisation automatique désactivée');
  }
  
  if (selectedId) {
    const selectedDp = DP_LIST.find(dp => dp.id === selectedId);
    if (selectedDp) {
      console.log('👤 DP sélectionné:', selectedDp.nom, selectedDp.niveau);
      
      const message = document.getElementById('dp-message');
      if (message) {
        message.textContent = `DP sélectionné: ${selectedDp.nom} (${selectedDp.niveau})`;
        message.className = 'dp-valide';
      }
    }
  } else {
    const message = document.getElementById('dp-message');
    if (message) {
      message.textContent = '';
      message.className = 'dp-valide';
    }
  }
  
  // Synchroniser avec l'ancien champ
  syncWithOldDpField();
  
  updateButtonStates();
}

// ===== SYNCHRONISATION AUTOMATIQUE CORRIGÉE =====
function tryAutoSync() {
  // Ne pas synchroniser si l'utilisateur a fait un choix manuel
  if (window.userOverrideDP) {
    console.log('🚫 Synchronisation automatique désactivée - choix utilisateur respecté');
    return false;
  }
  
  console.log('🔄 Tentative de synchronisation automatique...');
  
  const dpSelect = document.getElementById('dp-select');
  if (!dpSelect) {
    console.warn('❌ Sélecteur DP non trouvé');
    return false;
  }
  
  if (dpSelect.options.length <= 1) {
    console.warn('⚠️ Liste DP non encore chargée, nouvelle tentative dans 500ms');
    setTimeout(() => tryAutoSync(), 500);
    return false;
  }
  
  // Pattern corrigé pour le format : "Session chargée : 2025-08-23 - GAUTHIER Christophe - Saint-Astier (plg1)"
  const bodyText = document.body.textContent || '';
  const sessionMatch = bodyText.match(/Session chargée.*?(\d{4}-\d{2}-\d{2})\s*-\s*([A-Z]+)\s+/);
  
  if (sessionMatch) {
    const sessionDp = sessionMatch[2]; // "GAUTHIER"
    console.log('🎯 DP détecté dans session:', sessionDp);
    
    // Rechercher le DP correspondant dans les options
    const targetDp = Array.from(dpSelect.options).find(option => {
      const optionText = option.text.toUpperCase();
      return optionText.includes(sessionDp);
    });
    
    if (targetDp) {
      console.log('✅ DP correspondant trouvé:', targetDp.text);
      dpSelect.value = targetDp.value;
      
      // Déclencher l'événement de changement
      const changeEvent = new Event('change', { bubbles: true });
      dpSelect.dispatchEvent(changeEvent);
      
      // Ne pas marquer comme override utilisateur pour la synchro automatique
      const wasOverride = window.userOverrideDP;
      window.userOverrideDP = false;
      onDpSelectionChange();
      window.userOverrideDP = wasOverride;
      
      console.log('🔄 Synchronisation automatique réussie pour:', targetDp.text);
      return true;
    } else {
      console.warn('❌ Aucun DP correspondant pour:', sessionDp);
      console.log('💡 Options DP disponibles:', Array.from(dpSelect.options).map(o => o.text));
      return false;
    }
  } else {
    console.log('ℹ️ Aucune session détectée pour synchronisation');
    return false;
  }
}

// ===== ACTUALISATION DES SESSIONS =====
function forceSessionRefresh() {
  console.log('🔄 Actualisation des sessions...');
  
  try {
    // Actualiser le sélecteur de sessions
    if (typeof populateSessionSelector === 'function') {
      populateSessionSelector();
      console.log('✅ Sélecteur de sessions actualisé');
    }
    
    // Actualiser la liste de nettoyage
    if (typeof populateSessionsCleanupList === 'function') {
      populateSessionsCleanupList();
      console.log('✅ Liste de nettoyage actualisée');
    }
    
    // Actualiser l'historique DP
    if (typeof chargerHistoriqueDP === 'function') {
      chargerHistoriqueDP();
      console.log('✅ Historique DP actualisé');
    }
    
    console.log('✅ Actualisation des sessions terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'actualisation:', error);
  }
}

// ===== SURVEILLANCE DES CHANGEMENTS DE SESSION =====
function setupSessionObserver() {
  console.log('👁️ Configuration de la surveillance des sessions...');
  
  // Déconnecter l'observateur existant s'il y en a un
  if (window.sessionObserver) {
    window.sessionObserver.disconnect();
  }
  
  // Configuration pour détecter les changements de texte
  const observerConfig = {
    childList: true,
    subtree: true,
    characterData: true
  };
  
  // Callback optimisé
  const observerCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
            const text = node.textContent || node.innerText || '';
            if (text.includes('Session chargée')) {
              console.log('🔔 Session détectée par MutationObserver');
              setTimeout(() => tryAutoSync(), 150);
            }
          }
        });
      } else if (mutation.type === 'characterData') {
        const text = mutation.target.textContent;
        if (text && text.includes('Session chargée')) {
          console.log('🔔 Session détectée par changement de caractères');
          setTimeout(() => tryAutoSync(), 150);
        }
      }
    }
  };
  
  // Créer et démarrer l'observateur
  window.sessionObserver = new MutationObserver(observerCallback);
  window.sessionObserver.observe(document.body, observerConfig);
  
  console.log('✅ MutationObserver configuré pour détecter les sessions');
}

// ===== ÉVÉNEMENTS ET INITIALISATION =====
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔄 Initialisation du gestionnaire DP...');
  
  setTimeout(async () => {
    console.log('⏰ Démarrage différé du gestionnaire DP...');
    
    await loadDpFromFirebase();
    updateDpSelect();
    
    console.log('✅ Gestionnaire DP initialisé avec', DP_LIST.length, 'DP');
    
    // Configurer la surveillance des sessions
    setupSessionObserver();
    
    // Tentative de synchronisation immédiate
    setTimeout(() => tryAutoSync(), 2000);
    
  }, 1000);
  
  // Gestionnaires d'événements
  const dpSelect = document.getElementById('dp-select');
  if (dpSelect) {
    dpSelect.addEventListener('change', onDpSelectionChange);
  }
  
  const addBtn = document.getElementById('add-dp-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showModal());
  }
  
  const editBtn = document.getElementById('edit-dp-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const selectedId = dpSelect ? dpSelect.value : null;
      const dp = DP_LIST.find(d => d.id === selectedId);
      if (dp) showModal(dp);
    });
  }
  
  const deleteBtn = document.getElementById('delete-dp-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteDp);
  }
  
  const autoSyncBtn = document.getElementById('auto-sync-btn');
  if (autoSyncBtn) {
    autoSyncBtn.addEventListener('click', () => {
      window.userOverrideDP = false;
      console.log('🔄 Synchronisation automatique réactivée');
      showNotification('Synchronisation automatique réactivée', 'info');
      setTimeout(() => tryAutoSync(), 500);
    });
  }
  
  const saveBtn = document.getElementById('save-dp-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveDp);
  }
  
  const cancelBtn = document.getElementById('cancel-dp-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideModal);
  }
  
  // Fermer modal avec Echap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
  
  // Fermer modal en cliquant à l'extérieur
  const modal = document.getElementById('dp-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideModal();
    });
  }
});

// ===== FONCTIONS EXPOSÉES GLOBALEMENT =====
window.getDpList = () => DP_LIST;
window.getDpById = (id) => DP_LIST.find(dp => dp.id === id);
window.getDpByName = (nom) => DP_LIST.find(dp => dp.nom === nom);
window.refreshDpList = updateDpSelect;
window.forceAutoSync = tryAutoSync;
window.forceSessionRefresh = forceSessionRefresh;
window.getSelectedDp = () => {
  const select = document.getElementById('dp-select');
  const selectedId = select ? select.value : null;
  return selectedId ? DP_LIST.find(dp => dp.id === selectedId) : null;
};

console.log('✅ DP Management System chargé - Version complète avec', DP_LIST.length, 'DP et synchronisation corrigée');