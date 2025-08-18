// jsas-fixes.js - Corrections pour simplifier et stabiliser l'application JSAS

// ===== 1. SIMPLIFIER LE SYSTÈME DE VERROUS =====
// Remplacer le système complexe par une version minimale

window.simpleLockSystem = {
  locks: {},
  currentEdit: null,
  
  canEdit: function(palanqueeIndex) {
    const lockKey = `p${palanqueeIndex}`;
    const lock = this.locks[lockKey];
    
    if (!lock) return true;
    if (lock.user === currentUser?.email) return true;
    
    // Vérifier si le verrou est expiré (plus de 5 minutes)
    if (Date.now() - lock.timestamp > 5 * 60 * 1000) {
      delete this.locks[lockKey];
      return true;
    }
    
    return false;
  },
  
  acquireLock: function(palanqueeIndex) {
    const lockKey = `p${palanqueeIndex}`;
    
    if (!this.canEdit(palanqueeIndex)) {
      const lock = this.locks[lockKey];
      alert(`Cette palanquée est en cours de modification par ${lock.user}`);
      return false;
    }
    
    this.locks[lockKey] = {
      user: currentUser?.email || 'Utilisateur',
      timestamp: Date.now()
    };
    
    this.currentEdit = palanqueeIndex;
    
    // Auto-libération après 5 minutes
    setTimeout(() => {
      if (this.locks[lockKey] && this.locks[lockKey].user === currentUser?.email) {
        this.releaseLock(palanqueeIndex);
      }
    }, 5 * 60 * 1000);
    
    return true;
  },
  
  releaseLock: function(palanqueeIndex) {
    const lockKey = `p${palanqueeIndex}`;
    if (this.locks[lockKey] && this.locks[lockKey].user === currentUser?.email) {
      delete this.locks[lockKey];
    }
    if (this.currentEdit === palanqueeIndex) {
      this.currentEdit = null;
    }
  }
};

// ===== 2. SIMPLIFIER LES VALIDATIONS =====
// Validation basique sans trop de contrôles

function validateBasicPalanquee(palanquee) {
  if (!Array.isArray(palanquee)) return { valid: false, message: "Erreur de données" };
  if (palanquee.length > 5) return { valid: false, message: "Maximum 5 plongeurs par palanquée" };
  
  const gps = palanquee.filter(p => p && ["N4", "E2", "E3", "E4", "GP"].includes(p.niveau));
  const needGP = palanquee.filter(p => p && ["N1", "Déb.", "débutant"].includes(p.niveau));
  
  if (needGP.length > 0 && gps.length === 0) {
    return { valid: false, message: "Cette palanquée nécessite un encadrant (GP/E2/E3/E4)" };
  }
  
  return { valid: true, message: "OK" };
}

// ===== 3. SIMPLIFIER LA SYNCHRONISATION =====
// Version allégée sans vérifications excessives

async function simpleSyncToFirebase() {
  if (!firebaseConnected || !db) {
    console.log("Firebase non disponible - données conservées localement");
    return;
  }
  
  try {
    // Sauvegarder seulement si les données sont valides
    if (Array.isArray(plongeurs) && Array.isArray(palanquees)) {
      await Promise.all([
        db.ref('plongeurs').set(plongeurs),
        db.ref('palanquees').set(palanquees)
      ]);
      
      console.log("✅ Synchronisation réussie");
    }
    
    // Mettre à jour l'affichage
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateCompteurs === 'function') updateCompteurs();
    
  } catch (error) {
    console.error("Erreur sync:", error.message);
    // Ne pas bloquer l'application pour des erreurs de sync
  }
}

// ===== 4. GESTIONNAIRE D'ERREURS SIMPLIFIÉ =====
function simpleErrorHandler(error, context = "") {
  console.error(`❌ ${context}:`, error.message || error);
  
  // Notifications discrètes
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 14px;
    max-width: 300px;
  `;
  notification.textContent = `Erreur ${context}: ${error.message || 'Erreur inconnue'}`;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// ===== 5. DRAG & DROP SIMPLIFIÉ =====
let draggedData = null;

function setupSimpleDragDrop() {
  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('plongeur-item')) {
      const index = parseInt(e.target.dataset.index);
      const type = e.target.dataset.type;
      
      if (type === 'mainList' && plongeurs[index]) {
        draggedData = {
          type: 'fromMain',
          plongeur: plongeurs[index],
          index: index
        };
      } else if (type === 'palanquee') {
        const palIndex = parseInt(e.target.dataset.palanqueeIndex);
        const plgIndex = parseInt(e.target.dataset.plongeurIndex);
        
        if (palanquees[palIndex] && palanquees[palIndex][plgIndex]) {
          draggedData = {
            type: 'fromPalanquee',
            plongeur: palanquees[palIndex][plgIndex],
            palanqueeIndex: palIndex,
            plongeurIndex: plgIndex
          };
        }
      }
      
      e.target.style.opacity = '0.5';
    }
  });
  
  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('plongeur-item')) {
      e.target.style.opacity = '1';
      draggedData = null;
    }
  });
  
  document.addEventListener('dragover', (e) => {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone && draggedData) {
      e.preventDefault();
      dropZone.style.backgroundColor = '#e3f2fd';
    }
  });
  
  document.addEventListener('dragleave', (e) => {
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone) {
      dropZone.style.backgroundColor = '';
    }
  });
  
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    
    const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
    if (dropZone) {
      dropZone.style.backgroundColor = '';
    }
    
    if (!draggedData) return;
    
    try {
      if (dropZone.id === 'listePlongeurs') {
        // Retour vers la liste principale
        if (draggedData.type === 'fromPalanquee') {
          const plongeur = palanquees[draggedData.palanqueeIndex].splice(draggedData.plongeurIndex, 1)[0];
          plongeurs.push(plongeur);
          simpleSyncToFirebase();
        }
      } else {
        // Drop vers palanquée
        const palanqueeIndex = parseInt(dropZone.dataset.index);
        
        if (!simpleLockSystem.acquireLock(palanqueeIndex)) {
          return;
        }
        
        const targetPalanquee = palanquees[palanqueeIndex];
        
        // Validation simple
        const validation = validateBasicPalanquee([...targetPalanquee, draggedData.plongeur]);
        if (!validation.valid) {
          alert(validation.message);
          simpleLockSystem.releaseLock(palanqueeIndex);
          return;
        }
        
        if (draggedData.type === 'fromMain') {
          // Depuis liste principale
          const plongeur = plongeurs.splice(draggedData.index, 1)[0];
          targetPalanquee.push(plongeur);
        } else if (draggedData.type === 'fromPalanquee') {
          // Déplacement entre palanquées
          const plongeur = palanquees[draggedData.palanqueeIndex].splice(draggedData.plongeurIndex, 1)[0];
          targetPalanquee.push(plongeur);
        }
        
        simpleSyncToFirebase();
        
        // Libérer le verrou après 2 secondes
        setTimeout(() => {
          simpleLockSystem.releaseLock(palanqueeIndex);
        }, 2000);
      }
    } catch (error) {
      simpleErrorHandler(error, "Drag & Drop");
    }
    
    draggedData = null;
  });
}

// ===== 6. INITIALISATION SIMPLIFIÉE =====
function initializeSimpleJSAS() {
  console.log("🚀 Initialisation JSAS simplifiée...");
  
  // Variables de base
  if (typeof plongeurs === 'undefined') window.plongeurs = [];
  if (typeof palanquees === 'undefined') window.palanquees = [];
  if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
  
  // Remplacer les fonctions complexes
  window.syncToDatabase = simpleSyncToFirebase;
  window.handleError = simpleErrorHandler;
  
  // Setup drag & drop simplifié
  setupSimpleDragDrop();
  
  // Date du jour
  const today = new Date().toISOString().split('T')[0];
  const dpDateInput = document.getElementById('dp-date');
  if (dpDateInput) dpDateInput.value = today;
  
  console.log("✅ JSAS simplifié initialisé");
}

// ===== 7. FONCTIONS UTILITAIRES SIMPLIFIÉES =====

// Version simple du changement de prérogatives
function updatePlongeurPrerogativesSimple(palanqueeIndex, plongeurIndex, newValue) {
  if (!simpleLockSystem.acquireLock(palanqueeIndex)) return;
  
  if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
    palanquees[palanqueeIndex][plongeurIndex].pre = newValue.trim();
    simpleSyncToFirebase();
  }
  
  setTimeout(() => {
    simpleLockSystem.releaseLock(palanqueeIndex);
  }, 1000);
}

// Version simple des détails de palanquée
function updatePalanqueeDetailSimple(palanqueeIndex, property, newValue) {
  if (!simpleLockSystem.acquireLock(palanqueeIndex)) return;
  
  if (palanquees[palanqueeIndex]) {
    palanquees[palanqueeIndex][property] = newValue;
    simpleSyncToFirebase();
  }
  
  setTimeout(() => {
    simpleLockSystem.releaseLock(palanqueeIndex);
  }, 1000);
}

// ===== 8. REMPLACER LES FONCTIONS COMPLEXES =====
// À exécuter après le chargement de tous les autres scripts

function replaceComplexFunctions() {
  // Remplacer les fonctions de gestion d'erreurs complexes
  if (typeof window.jsasErrorHandler !== 'undefined') {
    window.jsasErrorHandler.handleError = simpleErrorHandler;
  }
  
  // Remplacer les fonctions de verrous
  window.interceptPalanqueeEdit = function(palanqueeIndex, callback) {
    if (simpleLockSystem.acquireLock(palanqueeIndex)) {
      callback();
    }
  };
  
  window.updatePlongeurPrerogatives = updatePlongeurPrerogativesSimple;
  window.updatePalanqueeDetail = updatePalanqueeDetailSimple;
  
  console.log("✅ Fonctions complexes remplacées par versions simplifiées");
}

// ===== 9. AUTO-INITIALISATION =====
// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeSimpleJSAS, 1000);
    setTimeout(replaceComplexFunctions, 2000);
  });
} else {
  setTimeout(initializeSimpleJSAS, 1000);
  setTimeout(replaceComplexFunctions, 2000);
}

console.log("🔧 Module de corrections JSAS chargé");