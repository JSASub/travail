// simple-lock-system.js - Système de verrous minimal sans plantage (VERSION CORRIGÉE)
// À charger APRÈS tous les autres fichiers

// Variables globales pour les verrous (initialisées seulement si pas définies)
if (typeof palanqueeLocks === 'undefined') {
  window.palanqueeLocks = {};
}
if (typeof currentlyEditingPalanquee === 'undefined') {
  window.currentlyEditingPalanquee = null;
}
if (typeof lockTimers === 'undefined') {
  window.lockTimers = {};
}

// Version simple et robuste du système de verrous
const SimpleLockSystem = {
  initialized: false,
  
  // Initialisation sécurisée
  init: function() {
    if (this.initialized || !currentUser || !db) {
      return;
    }
    
    console.log("🔒 Initialisation système de verrous simplifié...");
    
    try {
      // Écouter les verrous
      db.ref('palanquee_locks').on('value', (snapshot) => {
        window.palanqueeLocks = snapshot.val() || {};
        this.updateUI();
      });
      
      // Marquer comme en ligne
      this.markOnline();
      
      // Nettoyer à la fermeture
      window.addEventListener('beforeunload', () => this.cleanup());
      
      this.initialized = true;
      console.log("✅ Système de verrous simplifié initialisé");
      
    } catch (error) {
      console.error("❌ Erreur init verrous:", error);
    }
  },
  
  // Marquer l'utilisateur comme en ligne
  markOnline: function() {
    if (!currentUser || !db) return;
    
    try {
      const userRef = db.ref(`dp_online/${currentUser.uid}`);
      userRef.set({
        nom: $("dp-nom")?.value || currentUser.email,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      userRef.onDisconnect().remove();
    } catch (error) {
      console.error("❌ Erreur markOnline:", error);
    }
  },
  
  // Essayer de prendre un verrou
  acquireLock: async function(palanqueeIndex) {
    if (!currentUser || !db) return false;
    
    const lockId = `palanquee-${palanqueeIndex}`;
    const lockRef = db.ref(`palanquee_locks/${lockId}`);
    
    try {
      const result = await lockRef.transaction((current) => {
        if (current === null) {
          // Pas de verrou, on peut prendre
          return {
            userId: currentUser.uid,
            userName: $("dp-nom")?.value || currentUser.email,
            timestamp: Date.now()
          };
        } else if (current.userId === currentUser.uid) {
          // C'est notre verrou
          return current;
        } else {
          // Conflit
          throw new Error(`CONFLICT:${current.userName}`);
        }
      });
      
      if (result.committed) {
        window.currentlyEditingPalanquee = palanqueeIndex;
        
        // Auto-libération après 2 minutes
        if (!window.lockTimers) window.lockTimers = {};
        window.lockTimers[lockId] = setTimeout(() => {
          this.releaseLock(palanqueeIndex);
          this.showNotification("⏰ Verrou libéré automatiquement", "warning");
        }, 2 * 60 * 1000);
        
        return true;
      }
      
    } catch (error) {
      if (error.message.startsWith('CONFLICT:')) {
        const otherUser = error.message.split(':')[1];
        const confirm = window.confirm(`${otherUser} modifie cette palanquée.\nVoulez-vous prendre le contrôle ?`);
        
        if (confirm) {
          try {
            await lockRef.set({
              userId: currentUser.uid,
              userName: $("dp-nom")?.value || currentUser.email,
              timestamp: Date.now(),
              forced: true
            });
            return true;
          } catch (e) {
            console.error("❌ Erreur forçage:", e);
            return false;
          }
        }
      }
      return false;
    }
    
    return false;
  },
  
  // Libérer un verrou
  releaseLock: function(palanqueeIndex) {
    if (!db) return;
    
    const lockId = `palanquee-${palanqueeIndex}`;
    
    try {
      db.ref(`palanquee_locks/${lockId}`).remove();
      window.currentlyEditingPalanquee = null;
      
      if (window.lockTimers && window.lockTimers[lockId]) {
        clearTimeout(window.lockTimers[lockId]);
        delete window.lockTimers[lockId];
      }
    } catch (error) {
      console.error("❌ Erreur libération verrou:", error);
    }
  },
  
  // Mettre à jour l'interface
  updateUI: function() {
    // NOUVELLE VÉRIFICATION : Ne pas mettre à jour si pas connecté
    if (!currentUser) {
      this.hideUI();
      return;
    }

    try {
      // Ajouter un indicateur simple
      let indicator = document.getElementById('lock-status');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'lock-status';
        indicator.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #007bff;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          z-index: 1000;
        `;
        document.body.appendChild(indicator);
      }
      
      const lockCount = Object.keys(window.palanqueeLocks).length;
      indicator.textContent = `🔒 ${lockCount} verrou(s) actif(s)`;
      
      // Marquer les palanquées verrouillées
      document.querySelectorAll('.palanquee').forEach((element, index) => {
        const lockId = `palanquee-${index}`;
        const lock = window.palanqueeLocks[lockId];
        
        element.classList.remove('locked-by-other', 'locked-by-me');
        
        if (lock) {
          if (lock.userId === currentUser?.uid) {
            element.classList.add('locked-by-me');
            element.style.borderColor = '#ffc107';
          } else {
            element.classList.add('locked-by-other');
            element.style.borderColor = '#dc3545';
            element.style.opacity = '0.7';
          }
        } else {
          element.style.borderColor = '';
          element.style.opacity = '';
        }
      });
      
    } catch (error) {
      console.error("❌ Erreur updateUI:", error);
    }
  },
  
  // NOUVELLE FONCTION : Masquer l'interface des verrous
  hideUI: function() {
    try {
      // Supprimer l'indicateur de statut
      const indicator = document.getElementById('lock-status');
      if (indicator) {
        indicator.remove();
      }
      
      // Nettoyer les classes sur les palanquées
      document.querySelectorAll('.palanquee').forEach((element) => {
        element.classList.remove('locked-by-other', 'locked-by-me');
        element.style.borderColor = '';
        element.style.opacity = '';
      });
      
      console.log("✅ Interface des verrous masquée");
      
    } catch (error) {
      console.error("❌ Erreur hideUI:", error);
    }
  },
  
  // Notification simple
  showNotification: function(message, type = 'info') {
    try {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: ${type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 1001;
        max-width: 300px;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Erreur notification:", error);
    }
  },
  
  // Nettoyer à la sortie
  cleanup: function() {
    try {
      if (window.currentlyEditingPalanquee !== null) {
        this.releaseLock(window.currentlyEditingPalanquee);
      }
      
      if (window.lockTimers) {
        Object.values(window.lockTimers).forEach(timer => {
          if (timer) clearTimeout(timer);
        });
      }
      
      if (currentUser && db) {
        db.ref(`dp_online/${currentUser.uid}`).remove();
      }
      
      // NOUVEAU : Masquer l'interface
      this.hideUI();
      
    } catch (error) {
      console.error("❌ Erreur cleanup:", error);
    }
  },
  
  // NOUVELLE FONCTION : Nettoyage complet à la déconnexion
  fullCleanup: function() {
    try {
      console.log("🧹 Nettoyage complet du système de verrous...");
      
      // Arrêter l'écoute Firebase
      if (db) {
        db.ref('palanquee_locks').off();
      }
      
      // Masquer l'interface
      this.hideUI();
      
      // Réinitialiser les variables
      window.palanqueeLocks = {};
      window.currentlyEditingPalanquee = null;
      
      if (window.lockTimers) {
        Object.values(window.lockTimers).forEach(timer => {
          if (timer) clearTimeout(timer);
        });
        window.lockTimers = {};
      }
      
      // Marquer comme non initialisé
      this.initialized = false;
      
      console.log("✅ Système de verrous complètement nettoyé");
      
    } catch (error) {
      console.error("❌ Erreur fullCleanup:", error);
    }
  }
};

// Intercepter les modifications de palanquées
function interceptPalanqueeEdit(palanqueeIndex, callback) {
  if (!SimpleLockSystem.initialized) {
    callback(); // Laisser passer si pas initialisé
    return;
  }
  
  const lockId = `palanquee-${palanqueeIndex}`;
  const lock = window.palanqueeLocks[lockId];
  
  if (lock && lock.userId !== currentUser?.uid) {
    SimpleLockSystem.showNotification(`${lock.userName} modifie cette palanquée`, 'warning');
    return;
  }
  
  SimpleLockSystem.acquireLock(palanqueeIndex).then(acquired => {
    if (acquired) {
      callback();
    }
  });
}

// Modifier la fonction syncToDatabase existante pour libérer les verrous
const originalSyncToDatabase = window.syncToDatabase;
if (originalSyncToDatabase) {
  window.syncToDatabase = async function() {
    await originalSyncToDatabase();
    
    // Libérer le verrou après sync SEULEMENT si lockTimers existe
    if (SimpleLockSystem.initialized && 
        window.currentlyEditingPalanquee !== null && 
        window.lockTimers) {
      setTimeout(() => {
        SimpleLockSystem.releaseLock(window.currentlyEditingPalanquee);
      }, 1000);
    }
  };
}

// Auto-initialisation sécurisée
function tryInitLockSystem() {
  if (typeof currentUser !== 'undefined' && currentUser && 
      typeof db !== 'undefined' && db && 
      !SimpleLockSystem.initialized) {
    SimpleLockSystem.init();
  }
}

// Essayer d'initialiser à intervalles réguliers jusqu'à ce que ce soit prêt
const initInterval = setInterval(() => {
  tryInitLockSystem();
  if (SimpleLockSystem.initialized) {
    clearInterval(initInterval);
  }
}, 2000);

// Arrêter d'essayer après 30 secondes
setTimeout(() => {
  clearInterval(initInterval);
}, 30000);

// NOUVELLE FONCTION GLOBALE : Nettoyage à la déconnexion
window.cleanupLockSystem = function() {
  SimpleLockSystem.fullCleanup();
};

console.log("🔒 Système de verrous simplifié chargé (version avec nettoyage)");