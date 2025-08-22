// dp-management.js - Gestionnaire automatisé des DP avec sauvegarde Firebase

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
  if (typeof firebase !== 'undefined' && firebase.database) {
    if (!dpDatabase) {
      dpDatabase = firebase.database().ref('dp_database');
    }
    return dpDatabase;
  }
  console.warn('Firebase non disponible, utilisation du stockage local');
  return null;
}

// ===== SAUVEGARDE DANS FIREBASE =====
async function saveDpToFirebase() {
  const dbRef = getFirebaseReference();
  
  if (dbRef) {
    try {
      // Sauvegarder la liste complète des DP
      await dbRef.set(DP_LIST);
      console.log('✅ Liste DP sauvegardée dans Firebase');
      
      // Afficher un message de confirmation temporaire
      showNotification('DP sauvegardés avec succès', 'success');
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde Firebase:', error);
      showNotification('Erreur lors de la sauvegarde', 'error');
      return false;
    }
  } else {
    // Fallback vers localStorage si Firebase n'est pas disponible
    try {
      localStorage.setItem('dp_list', JSON.stringify(DP_LIST));
      console.log('📱 Liste DP sauvegardée localement');
      return true;
    } catch (error) {
      console.error('❌ Erreur localStorage:', error);
      return false;
    }
  }
}

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function loadDpFromFirebase() {
  const dbRef = getFirebaseReference();
  
  if (dbRef) {
    try {
      const snapshot = await dbRef.once('value');
      const firebaseData = snapshot.val();
      
      if (firebaseData && Array.isArray(firebaseData) && firebaseData.length > 0) {
        DP_LIST = firebaseData;
        console.log('✅ Liste DP chargée depuis Firebase:', DP_LIST.length, 'DP');
      } else {
        console.log('ℹ️ Aucune donnée DP dans Firebase, utilisation des données par défaut');
        // Sauvegarder les données par défaut dans Firebase
        await saveDpToFirebase();
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement Firebase:', error);
      loadDpFromLocalStorage();
    }
  } else {
    loadDpFromLocalStorage();
  }
}

// ===== CHARGEMENT DEPUIS LOCALSTORAGE =====
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
  
  // Animation d'entrée
  setTimeout(() => notification.classList.add('dp-notification-show'), 100);
  
  // Suppression automatique après 3 secondes
  setTimeout(() => {
    notification.classList.remove('dp-notification-show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// ===== TRI ALPHABÉTIQUE =====
function sortDpList() {
  DP_LIST.sort((a, b) => {
    const nomA = a.nom.split(' ').pop(); // Nom de famille
    const nomB = b.nom.split(' ').pop();
    return nomA.localeCompare(nomB, 'fr');
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
  if (!select) return;
  
  const currentValue = select.value;
  
  // Vider et reconstruire les options
  select.innerHTML = '<option value="">-- Choisir un DP --</option>';
  
  sortDpList();
  
  DP_LIST.forEach(dp => {
    const option = document.createElement('option');
    option.value = dp.id;
    option.textContent = `${dp.nom} (${dp.niveau})`;
    select.appendChild(option);
  });
  
  // Restaurer la sélection si possible
  if (currentValue && DP_LIST.find(dp => dp.id === currentValue)) {
    select.value = currentValue;
  }
  
  updateButtonStates();
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
  
  // Validations
  if (!nom) {
    showNotification('Le nom est obligatoire', 'error');
    return;
  }
  
  if (!email || !isValidEmail(email)) {
    showNotification('Email invalide', 'error');
    return;
  }
  
  // Vérifier les doublons
  const existingDp = DP_LIST.find(dp => 
    dp.id !== currentEditingId && 
    (dp.nom.toLowerCase() === nom.toLowerCase() || dp.email.toLowerCase() === email.toLowerCase())
  );
  
  if (existingDp) {
    showNotification('Un DP avec ce nom ou cet email existe déjà', 'error');
    return;
  }
  
  // Sauvegarder ou modifier
  if (currentEditingId) {
    // Modification
    const dpIndex = DP_LIST.findIndex(dp => dp.id === currentEditingId);
    if (dpIndex !== -1) {
      DP_LIST[dpIndex] = { id: currentEditingId, nom, niveau, email };
      showNotification('DP modifié avec succès', 'success');
    }
  } else {
    // Ajout
    const newDp = {
      id: generateDpId(),
      nom,
      niveau,
      email
    };
    DP_LIST.push(newDp);
    showNotification('DP ajouté avec succès', 'success');
  }
  
  // Sauvegarder dans Firebase
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
  
  // Supprimer de la liste
  DP_LIST = DP_LIST.filter(d => d.id !== selectedId);
  
  // Sauvegarder dans Firebase
  const saved = await saveDpToFirebase();
  
  if (saved) {
    updateDpSelect();
    showNotification('DP supprimé avec succès', 'success');
  } else {
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// ===== ÉVÉNEMENTS =====
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔄 Initialisation du gestionnaire DP...');
  
  // Charger les données depuis Firebase
  await loadDpFromFirebase();
  
  // Mettre à jour l'interface
  updateDpSelect();
  
  // Gestionnaires d'événements
  const dpSelect = document.getElementById('dp-select');
  if (dpSelect) {
    dpSelect.addEventListener('change', updateButtonStates);
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
  
  console.log('✅ Gestionnaire DP initialisé avec', DP_LIST.length, 'DP');
});

// ===== FONCTIONS EXPOSÉES GLOBALEMENT =====
window.getDpList = () => DP_LIST;
window.getDpById = (id) => DP_LIST.find(dp => dp.id === id);
window.getDpByName = (nom) => DP_LIST.find(dp => dp.nom === nom);
window.refreshDpList = updateDpSelect;