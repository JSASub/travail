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
  console.log('🔍 Vérification Firebase...');
  
  // Vérifier si Firebase est chargé
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase n\'est pas chargé !');
    console.log('💡 Vérifiez que les scripts Firebase sont bien inclus dans index.html');
    return null;
  }
  
  // Vérifier si Firebase Database est disponible
  if (!firebase.database) {
    console.error('❌ Firebase Database n\'est pas disponible !');
    console.log('💡 Vérifiez que firebase-database.js est inclus');
    return null;
  }
  
  // Vérifier si l'app Firebase est initialisée
  try {
    const app = firebase.app();
    console.log('✅ Firebase app disponible:', app.name);
  } catch (error) {
    console.error('❌ Firebase non initialisé:', error.message);
    console.log('💡 Vérifiez config-firebase.js et l\'initialisation');
    return null;
  }
  
  // Créer ou récupérer la référence
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
      
      // Sauvegarder la liste complète des DP
      await dbRef.set(DP_LIST);
      
      console.log('✅ Liste DP sauvegardée dans Firebase avec succès !');
      console.log('📋 Données sauvegardées:', DP_LIST);
      
      // Afficher un message de confirmation temporaire
      showNotification('DP sauvegardés avec succès dans Firebase', 'success');
      
      // Vérification immédiate
      const verification = await dbRef.once('value');
      const savedData = verification.val();
      console.log('🔍 Vérification - Données dans Firebase:', savedData);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde Firebase:', error);
      console.error('📄 Détails de l\'erreur:', error.message);
      showNotification(`Erreur Firebase: ${error.message}`, 'error');
      
      // Fallback vers localStorage
      return saveToLocalStorage();
    }
  } else {
    console.warn('⚠️ Firebase non disponible, utilisation localStorage');
    return saveToLocalStorage();
  }
}

// ===== SAUVEGARDE LOCALSTORAGE DE SECOURS =====
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
        console.log('📋 DP chargés:', DP_LIST.map(dp => dp.nom));
      } else {
        console.log('ℹ️ Aucune donnée DP valide dans Firebase, utilisation des données par défaut');
        // Les données par défaut sont déjà dans DP_LIST
        console.log('📋 Utilisation de', DP_LIST.length, 'DP par défaut');
        
        // Sauvegarder les données par défaut dans Firebase
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
  
  // Vérification finale
  console.log('🔍 Vérification finale - DP_LIST contient:', DP_LIST.length, 'éléments');
  if (DP_LIST.length === 0) {
    console.error('❌ PROBLÈME : DP_LIST est vide !');
    console.log('🔧 Restauration des données par défaut...');
    
    // Restaurer les données par défaut
    DP_LIST = [
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
    
    console.log('✅ Données par défaut restaurées:', DP_LIST.length, 'DP');
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
    // Extraire le nom de famille (dernier mot) pour les noms composés
    const extractLastName = (nomComplet) => {
      const mots = nomComplet.trim().split(' ');
      // Pour "AGUIRRE Raoul" -> "AGUIRRE"
      // Pour "LE MAOUT Jean-François" -> "MAOUT" 
      
      // Si le premier mot est en majuscules, c'est probablement le nom de famille
      if (mots[0] === mots[0].toUpperCase()) {
        // Gérer les noms composés comme "LE MAOUT"
        if (mots.length > 2 && (mots[0] === 'LE' || mots[0] === 'DE' || mots[0] === 'DU')) {
          return mots[1].toUpperCase();
        }
        return mots[0].toUpperCase();
      } else {
        // Si c'est "Prénom NOM", prendre le dernier mot
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
  
  // Vider et reconstruire les options
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
  
  // Restaurer la sélection si possible
  if (currentValue && DP_LIST.find(dp => dp.id === currentValue)) {
    select.value = currentValue;
    console.log('🔄 Valeur restaurée:', currentValue);
  }
  
  // Synchroniser avec la zone de session si elle existe
  updateSessionDpDisplay();
  
  updateButtonStates();
  
  // Tenter la synchronisation automatique après un délai
  setTimeout(() => {
    tryAutoSync();
  }, 1000);
}

// ===== CORRESPONDANCE AUTOMATIQUE AVEC SESSION EXISTANTE =====
function matchSessionDpWithList() {
  console.log('🔍 Recherche de correspondance avec session existante...');
  
  // Diagnostic détaillé
  console.log('📋 Liste DP disponible :');
  DP_LIST.forEach(dp => {
    const parts = dp.nom.split(' ');
    console.log(`- ${dp.nom} → Nom: "${parts[0]}", Prénom: "${parts[1] || 'N/A'}"`);
  });
  
  // Chercher le vrai DP de la session (pas forcer "Raoul")
  let sessionDpName = extractDpFromSession();
  console.log('🎯 DP extrait de la session:', sessionDpName);
  
  if (!sessionDpName) {
    console.log('⚠️ Aucun DP détecté dans la session');
    return null;
  }
  
  // Nouvelle recherche améliorée - chercher par prénom OU nom
  const matchingDp = DP_LIST.find(dp => {
    const parts = dp.nom.split(' ');
    const nom = parts[0];           // "AGUIRRE"
    const prenom = parts[1];        // "Raoul"
    
    console.log(`🔍 Test: "${dp.nom}" → Nom:"${nom}", Prénom:"${prenom}"`);
    
    // Correspondance avec le prénom OU le nom de famille
    const matchPrenom = prenom && prenom.toLowerCase() === sessionDpName.toLowerCase();
    const matchNom = nom && nom.toLowerCase() === sessionDpName.toLowerCase();
    
    if (matchPrenom) {
      console.log(`✅ CORRESPONDANCE PRÉNOM ! "${sessionDpName}" = "${prenom}" dans "${dp.nom}"`);
    }
    if (matchNom) {
      console.log(`✅ CORRESPONDANCE NOM ! "${sessionDpName}" = "${nom}" dans "${dp.nom}"`);
    }
    
    return matchPrenom || matchNom;
  });
  
  if (matchingDp) {
    console.log('🎯 DP correspondant trouvé:', matchingDp.nom);
    
    // Mettre à jour le sélecteur
    const dpSelect = document.getElementById('dp-select');
    if (dpSelect) {
      console.log('🔄 Mise à jour du sélecteur avec ID:', matchingDp.id);
      dpSelect.value = matchingDp.id;
      
      // Vérifier que la sélection a fonctionné
      console.log('📋 Valeur du sélecteur après mise à jour:', dpSelect.value);
      console.log('📋 Texte sélectionné:', dpSelect.options[dpSelect.selectedIndex]?.textContent);
      
      // Déclencher l'événement de changement
      onDpSelectionChange();
      
      return matchingDp;
    }
  } else {
    console.log('❌ Aucune correspondance trouvée pour:', sessionDpName);
    console.log('💡 DP disponibles:', DP_LIST.map(dp => dp.nom).join(', '));
  }
  
  return null;
}

// ===== EXTRACTION DU DP DEPUIS LA SESSION =====
function extractDpFromSession() {
  // Chercher dans le titre de la page ou éléments visibles
  const title = document.title || '';
  const bodyText = document.body.textContent || '';
  
  console.log('🔍 Recherche DP dans:');
  console.log('- Title:', title);
  console.log('- Body (premiers 200 char):', bodyText.substring(0, 200));
  
  // Patterns de recherche pour différents formats
  const patterns = [
    /Session.*?(\w+)_/i,              // "2025-08-23_Gauthier_apres-midi"
    /DP[:\s]+(\w+)/i,                 // "DP: Gauthier" ou "DP Gauthier"
    /Directeur.*?(\w+)/i,             // "Directeur Gauthier"
    /_(\w+)_/i,                       // "_Gauthier_"
    /\b(AGUIRRE|AUBARD|BEST|CABIROL|CATTEROU|DARDER|GAUTHIER|MAOUT|MARTY|TROUBADIS)\b/i // Noms directs
  ];
  
  for (const pattern of patterns) {
    let match = title.match(pattern);
    if (match) {
      console.log(`✅ DP trouvé dans title avec pattern ${pattern}: "${match[1]}"`);
      return match[1];
    }
    
    match = bodyText.match(pattern);
    if (match) {
      console.log(`✅ DP trouvé dans body avec pattern ${pattern}: "${match[1]}"`);
      return match[1];
    }
  }
  
  // Recherche spécifique dans les messages de log (pour "Gauthier")
  const logMessages = document.querySelectorAll('*');
  for (const element of logMessages) {
    const text = element.textContent || '';
    if (text.includes('Session chargée') && text.includes('_')) {
      const parts = text.split('_');
      if (parts.length >= 2) {
        const dpName = parts[1];
        console.log(`✅ DP trouvé dans log de session: "${dpName}"`);
        return dpName;
      }
    }
  }
  
  console.log('⚠️ Aucun DP détecté automatiquement');
  return null;
}

// ===== SYNCHRONISATION AVEC NOM PARTIEL =====
function findDpByPartialName(partialName) {
  if (!partialName) return null;
  
  console.log('🔍 Recherche DP pour:', partialName);
  
  const searchTerm = partialName.toLowerCase().trim();
  
  // NE PAS chercher "Raoul" automatiquement !
  // Chercher d'abord par nom de famille (plus important)
  let found = DP_LIST.find(dp => {
    const nom = dp.nom.split(' ')[0]?.toLowerCase(); // "GAUTHIER" -> "gauthier"
    const match = nom === searchTerm;
    if (match) {
      console.log('🎯 DP trouvé par nom de famille:', dp.nom);
    }
    return match;
  });
  
  if (found) return found;
  
  // Puis chercher par prénom seulement si pas trouvé par nom
  found = DP_LIST.find(dp => {
    const prenom = dp.nom.split(' ')[1]?.toLowerCase();
    const match = prenom === searchTerm;
    if (match) {
      console.log('🎯 DP trouvé par prénom:', dp.nom);
    }
    return match;
  });
  
  if (found) return found;
  
  // Recherche partielle en dernier recours
  found = DP_LIST.find(dp => 
    dp.nom.toLowerCase().includes(searchTerm)
  );
  
  if (found) {
    console.log('🎯 DP trouvé par recherche partielle:', found.nom);
    return found;
  }
  
  console.log('❌ Aucun DP trouvé pour:', partialName);
  return null;
}

// ===== SYNCHRONISATION GLOBALE =====
function syncWithExistingSession() {
  console.log('🔄 Synchronisation avec session existante...');
  
  // NE PAS forcer "Raoul" ! Chercher le vrai DP de session
  const matched = matchSessionDpWithList();
  
  if (!matched) {
    console.log('⚠️ Aucune correspondance automatique trouvée');
    console.log('💡 Le sélecteur restera vide pour permettre sélection manuelle');
  }
}

// ===== SYNCHRONISATION AMÉLIORÉE =====
function updateSessionDpDisplay() {
  console.log('🔄 Synchronisation avec la zone de session...');
  
  // Chercher le select principal (pas celui de gestion)
  const allSelects = document.querySelectorAll('select');
  const managementSelect = document.getElementById('dp-select');
  
  let sessionSelect = null;
  
  // Trouver le select qui n'est pas celui de gestion
  allSelects.forEach(select => {
    if (select !== managementSelect && 
        (select.id.includes('dp') || select.className.includes('dp') || 
         select.name && select.name.includes('dp'))) {
      sessionSelect = select;
      console.log('🎯 Select de session trouvé:', select.id || select.className);
    }
  });
  
  if (sessionSelect) {
    console.log('🔄 Synchronisation avec le select de session...');
    
    // Sauvegarder la valeur actuelle
    const currentValue = sessionSelect.value;
    
    // Vider et remplir
    sessionSelect.innerHTML = '<option value="">-- Choisir un DP --</option>';
    
    DP_LIST.forEach(dp => {
      const option = document.createElement('option');
      option.value = dp.id;
      option.textContent = `${dp.nom} (${dp.niveau})`;
      sessionSelect.appendChild(option);
    });
    
    // Restaurer la valeur si possible
    if (currentValue && DP_LIST.find(dp => dp.id === currentValue)) {
      sessionSelect.value = currentValue;
    }
    
    console.log('✅ Select de session synchronisé avec', DP_LIST.length, 'DP');
  } else {
    console.log('⚠️ Aucun select de session trouvé pour synchronisation');
  }
  
  // Tenter la synchronisation avec session existante
  setTimeout(() => {
    syncWithExistingSession();
  }, 500);
}

// ===== ÉVÉNEMENT DE SÉLECTION DP =====
function onDpSelectionChange() {
  const dpSelect = document.getElementById('dp-select');
  const selectedId = dpSelect.value;
  
  if (selectedId) {
    const selectedDp = DP_LIST.find(dp => dp.id === selectedId);
    if (selectedDp) {
      console.log('👤 DP sélectionné:', selectedDp.nom, selectedDp.niveau);
      
      // Synchroniser avec la zone de session
      const sessionSelect = document.querySelector('#meta-info select, [id*="session"] select, [class*="session"] select');
      if (sessionSelect && sessionSelect !== dpSelect) {
        sessionSelect.value = selectedId;
        console.log('🔗 DP synchronisé avec la zone de session');
      }
      
      // Mettre à jour le message
      const message = document.getElementById('dp-message');
      if (message) {
        message.textContent = `DP sélectionné: ${selectedDp.nom} (${selectedDp.niveau})`;
        message.className = 'dp-valide';
      }
    }
  } else {
    // Aucun DP sélectionné
    const message = document.getElementById('dp-message');
    if (message) {
      message.textContent = '';
      message.className = 'dp-valide';
    }
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
  
  // Attendre un peu que Firebase soit complètement chargé
  setTimeout(async () => {
    console.log('⏰ Démarrage différé du gestionnaire DP...');
    
    // Charger les données depuis Firebase
    await loadDpFromFirebase();
    
    // Forcer le tri et la mise à jour
    sortDpList();
    updateDpSelect();
    
    console.log('✅ Gestionnaire DP initialisé avec', DP_LIST.length, 'DP');
    console.log('📋 Liste finale:', DP_LIST.map(dp => dp.nom));
    
    // Écouter les changements de session pour synchroniser automatiquement
    watchForSessionChanges();
    
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

// ===== SURVEILLANCE DES CHANGEMENTS DE SESSION =====
function watchForSessionChanges() {
  console.log('👁️ Surveillance des changements de session activée...');
  
  // Observer les changements dans le DOM pour détecter les nouvelles sessions
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Session chargée')) {
            console.log('🔔 Nouvelle session détectée:', node.textContent);
            
            // Attendre un peu puis synchroniser
            setTimeout(() => {
              tryAutoSync();
            }, 500);
          }
        });
      }
    });
  });
  
  // Observer tout le body pour les changements
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Tentative de synchronisation immédiate au cas où la session serait déjà chargée
  setTimeout(() => {
    tryAutoSync();
  }, 2000);
}

// ===== TENTATIVE DE SYNCHRONISATION =====
function tryAutoSync() {
  console.log('🔄 Tentative de synchronisation automatique...');
  
  const sessionDp = extractDpFromSession();
  
  if (sessionDp) {
    console.log('🎯 DP de session détecté:', sessionDp);
    
    const matchingDp = DP_LIST.find(dp => {
      const parts = dp.nom.split(' ');
      const nom = parts[0];
      return nom && nom.toLowerCase() === sessionDp.toLowerCase();
    });
    
    if (matchingDp) {
      console.log('✅ Correspondance trouvée:', matchingDp.nom);
      
      const dpSelect = document.getElementById('dp-select');
      if (dpSelect && dpSelect.value !== matchingDp.id) {
        dpSelect.value = matchingDp.id;
        onDpSelectionChange();
        console.log('🔄 Sélecteur DP mis à jour automatiquement avec:', matchingDp.nom);
      }
    } else {
      console.log('❌ Aucune correspondance pour:', sessionDp);
    }
  } else {
    console.log('⚠️ Aucun DP de session détecté pour synchronisation');
  }
}

// ===== FONCTIONS EXPOSÉES GLOBALEMENT =====
window.getDpList = () => DP_LIST;
window.getDpById = (id) => DP_LIST.find(dp => dp.id === id);
window.getDpByName = (nom) => DP_LIST.find(dp => dp.nom === nom);
window.refreshDpList = updateDpSelect;
window.syncSessionDp = updateSessionDpDisplay;
window.getSelectedDp = () => {
  const select = document.getElementById('dp-select');
  const selectedId = select ? select.value : null;
  return selectedId ? DP_LIST.find(dp => dp.id === selectedId) : null;
};

// ===== OVERRIDE POUR EMPÊCHER LA SÉLECTION AUTOMATIQUE DE RAOUL =====
window.forceCorrectDpSync = function() {
  console.log('🔧 Force la synchronisation correcte du DP...');
  
  // Attendre que la session soit complètement chargée
  setTimeout(() => {
    const sessionDp = extractDpFromSession();
    if (sessionDp && sessionDp === 'GAUTHIER') {
      const gauthierDp = DP_LIST.find(dp => dp.nom.includes('GAUTHIER'));
      if (gauthierDp) {
        const dpSelect = document.getElementById('dp-select');
        if (dpSelect) {
          dpSelect.value = gauthierDp.id;
          onDpSelectionChange();
          console.log('✅ DP GAUTHIER forcé manuellement');
        }
      }
    }
  }, 3000); // Attendre 3 secondes
};