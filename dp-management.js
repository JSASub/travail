// dp-management.js - Gestionnaire automatisé des DP avec synchronisation corrigée
console.log('🔥 NOUVEAU DP-MANAGEMENT.JS CHARGÉ !');
// ===== DONNÉES DES DP =====
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
  { id: "dp10", nom: "TROUBADIS Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com" }
];

// ===== VARIABLES GLOBALES =====
let currentEditingId = null;
let dpDatabase = null;

// ===== RÉFÉRENCE FIREBASE =====
function getFirebaseReference() {
  console.log('🔍 Vérification Firebase...');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase n\'est pas chargé !');
    console.log('💡 Vérifiez que les scripts Firebase sont bien inclus dans index.html');
    return null;
  }
  
  if (!firebase.database) {
    console.error('❌ Firebase Database n\'est pas disponible !');
    console.log('💡 Vérifiez que firebase-database.js est inclus');
    return null;
  }
  
  try {
    const app = firebase.app();
    console.log('✅ Firebase app disponible:', app.name);
  } catch (error) {
    console.error('❌ Firebase non initialisé:', error.message);
    console.log('💡 Vérifiez config-firebase.js et l\'initialisation');
    return null;
  }
  
  if (!dpDatabase) {
    try {
      dpDatabase = firebase.database().ref('dp_database');
      console.log('✅ Référence Firebase créée: dp_database');
    } catch (error) {
      console.error('❌ Erreur création référence:', error);
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
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('dp-notification-show'), 100);
  
  setTimeout(() => {
    notification.classList.remove('dp-notification-show');
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
    
    console.log(`Tri: "${a.nom}" -> "${nomA}" vs "${b.nom}" -> "${nomB}"`);
    return nomA.localeCompare(nomB, 'fr');
  });
  
  console.log('🔤 Liste triée par nom de famille:');
  DP_LIST.forEach((dp, index) => {
    console.log(`${index + 1}. ${dp.nom}`);
  });
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
  
  // Déclencher la détection de session après un délai
  setTimeout(() => {
    tryAutoSync();
  }, 1000);
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
  
  document.getElementById('modal-title').textContent = dp ? 'Modifier le DP' : 'Ajouter un DP';
  document.getElementById('dp-nom').value = dp ? dp.nom : '';
  document.getElementById('dp-niveau').value = dp ? dp.niveau : 'P5';
  document.getElementById('dp-email').value = dp ? dp.email : '';
  
  document.getElementById('dp-modal').style.display = 'block';
  document.getElementById('dp-nom').focus();
}

// ===== FERMETURE MODAL =====
function hideModal() {
  document.getElementById('dp-modal').style.display = 'none';
  currentEditingId = null;
}

// ===== SAUVEGARDE DP =====
async function saveDp() {
  const nom = document.getElementById('dp-nom').value.trim();
  const niveau = document.getElementById('dp-niveau').value;
  const email = document.getElementById('dp-email').value.trim();
  
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
  } else {
    showNotification('Erreur lors de la sauvegarde', 'error');
  }
}

// ===== SUPPRESSION DP =====
async function deleteDp() {
  const select = document.getElementById('dp-select');
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
  } else {
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// ===== ÉVÉNEMENT DE SÉLECTION DP =====
function onDpSelectionChange() {
  const dpSelect = document.getElementById('dp-select');
  const selectedId = dpSelect.value;
  
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
  
  updateButtonStates();
}

// ===== SYNCHRONISATION AUTOMATIQUE CORRIGÉE =====
function tryAutoSync() {
  console.log('🔄 Tentative de synchronisation automatique...');
  
  // Vérifier que le sélecteur DP existe et est peuplé
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
  
  // Chercher le nom du DP directement dans le contenu de la page
  const bodyText = document.body.textContent || '';
  const sessionMatch = bodyText.match(/Session chargée.*?(\d{4}-\d{2}-\d{2})\s*-\s*([A-Z]+)\s+/);
  
  if (sessionMatch) {
    const sessionDp = sessionMatch[2]; // "GAUTHIER"
    console.log('🎯 DP détecté dans session:', sessionDp);
    
    // Rechercher le DP correspondant dans les options
    const targetDp = Array.from(dpSelect.options).find(option => {
      const optionText = option.text.toUpperCase();
      return optionText.includes(sessionDp) || optionText.includes(sessionDp.toLowerCase());
    });
    
    if (targetDp) {
      console.log('✅ DP correspondant trouvé:', targetDp.text);
      dpSelect.value = targetDp.value;
      
      // Déclencher l'événement de changement
      const changeEvent = new Event('change', { bubbles: true });
      dpSelect.dispatchEvent(changeEvent);
      onDpSelectionChange();
      
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

// ===== SURVEILLANCE DES CHANGEMENTS DE SESSION CORRIGÉE =====
function setupSessionObserver() {
  console.log('👁️ Configuration de la surveillance des sessions...');
  
  // Déconnecter l'observateur existant s'il y en a un
  if (window.sessionObserver) {
    window.sessionObserver.disconnect();
  }
  
  // Configuration améliorée pour détecter les changements de texte
  const observerConfig = {
    childList: true,      // CRITIQUE: surveille les changements de nœuds de texte
    subtree: true,        // Surveille tous les descendants
    characterData: true   // Sauvegarde pour les modifications directes
  };
  
  // Callback optimisé
  const observerCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
            const text = node.textContent || node.innerText || '';
            if (text.includes('Session chargée')) {
              console.log('🔔 Session détectée par MutationObserver:', text.substring(0, 100));
              setTimeout(() => tryAutoSync(), 150);
            }
          }
        });
      } else if (mutation.type === 'characterData') {
        const text = mutation.target.textContent;
        if (text && text.includes('Session chargée')) {
          console.log('🔔 Session détectée par changement de caractères:', text.substring(0, 100));
          setTimeout(() => tryAutoSync(), 150);
        }
      }
    }
  };
  
  // Créer et démarrer l'observateur
  window.sessionObserver = new MutationObserver(observerCallback);
  
  // Observer le body entier avec la configuration corrigée
  window.sessionObserver.observe(document.body, observerConfig);
  
  console.log('✅ MutationObserver configuré pour détecter les sessions');
}

// ===== ÉVÉNEMENTS =====
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔄 Initialisation du gestionnaire DP...');
  
  setTimeout(async () => {
    console.log('⏰ Démarrage différé du gestionnaire DP...');
    
    await loadDpFromFirebase();
    sortDpList();
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
      const selectedId = dpSelect.value;
      const dp = DP_LIST.find(d => d.id === selectedId);
      if (dp) showModal(dp);
    });
  }
  
  const deleteBtn = document.getElementById('delete-dp-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteDp);
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
window.getSelectedDp = () => {
  const select = document.getElementById('dp-select');
  const selectedId = select ? select.value : null;
  return selectedId ? DP_LIST.find(dp => dp.id === selectedId) : null;
};
window.forceAutoSync = tryAutoSync;