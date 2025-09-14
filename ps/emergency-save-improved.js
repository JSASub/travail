// ps/emergency-save-improved.js
// Système de sauvegarde d'urgence amélioré pour JSAS
// Version 1.0 - Janvier 2025

class EmergencySaveManager {
    constructor() {
        this.STORAGE_KEYS = {
            EMERGENCY_DATA: 'jsas_emergency_save',
            LAST_SAVE_TIME: 'jsas_last_emergency_save',
            SESSION_ID: 'jsas_current_session_id',
            DP_SYNC: 'jsas_dp_sync_data'
        };
        
        this.MIN_SAVE_INTERVAL = 30000; // 30 secondes minimum entre sauvegardes
        this.MAX_RECOVERY_AGE = 24 * 60 * 60 * 1000; // 24 heures
        this.lastSaveTime = 0;
        this.currentSessionId = this.generateSessionId();
        this.hasUnsavedChanges = false;
        this.isRecoveryInProgress = false;
        
        this.init();
    }

    init() {
        // Générer un ID de session unique
        localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.currentSessionId);
        
        // Vérifier s'il y a une récupération nécessaire au démarrage
        setTimeout(() => this.checkForRecovery(), 2000); // Délai pour laisser l'app se charger
        
        // Écouter les changements de données
        this.setupChangeListeners();
        
        // Écouter la fermeture de page
        this.setupBeforeUnloadListener();
        
        // Nettoyer les anciennes sauvegardes
        this.cleanupOldSaves();
    }

    generateSessionId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    setupChangeListeners() {
        // Observer les changements sur les plongeurs
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'listePlongeurs' || 
                    mutation.target.closest('#palanqueesContainer')) {
                    this.markAsChanged();
                }
            });
        });

        // Observer la liste des plongeurs et les palanquées
        const listePlongeurs = document.getElementById('listePlongeurs');
        const palanqueesContainer = document.getElementById('palanqueesContainer');
        
        if (listePlongeurs) {
            observer.observe(listePlongeurs, { childList: true, subtree: true });
        }
        if (palanqueesContainer) {
            observer.observe(palanqueesContainer, { childList: true, subtree: true });
        }

        // Observer les changements de formulaire
        document.addEventListener('input', (e) => {
            if (e.target.matches('#nom, #niveau, #pre, #dp-lieu, #dp-plongee')) {
                this.markAsChanged();
            }
        });

        // Observer les changements de DP
        document.addEventListener('change', (e) => {
            if (e.target.id === 'dp-select') {
                this.markAsChanged();
                this.saveDPSyncData();
            }
        });
    }

    setupBeforeUnloadListener() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges && this.shouldSaveEmergency()) {
                this.performEmergencySave();
                // Optionnel : afficher un message de confirmation
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        
        // Sauvegarder automatiquement après un délai si nécessaire
        if (this.shouldSaveEmergency()) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => {
                this.performEmergencySave();
            }, 5000); // 5 secondes après le dernier changement
        }
    }

    shouldSaveEmergency() {
        const now = Date.now();
        const timeSinceLastSave = now - this.lastSaveTime;
        
        return timeSinceLastSave > this.MIN_SAVE_INTERVAL && 
               this.hasUnsavedChanges && 
               this.hasSignificantContent();
    }

    hasSignificantContent() {
        // Vérifier s'il y a du contenu significatif à sauvegarder
        const plongeurs = document.querySelectorAll('#listePlongeurs li').length;
        const palanquees = document.querySelectorAll('.palanquee').length;
        const dpSelected = document.getElementById('dp-select').value;
        
        return plongeurs > 0 || palanquees > 0 || dpSelected;
    }

    performEmergencySave() {
        try {
            const emergencyData = this.captureCurrentState();
            
            if (emergencyData && this.hasSignificantContent()) {
                localStorage.setItem(this.STORAGE_KEYS.EMERGENCY_DATA, JSON.stringify(emergencyData));
                localStorage.setItem(this.STORAGE_KEYS.LAST_SAVE_TIME, Date.now().toString());
                
                this.lastSaveTime = Date.now();
                this.hasUnsavedChanges = false;
                
                this.showSaveNotification('💾 Sauvegarde automatique effectuée');
                console.log('Sauvegarde d\'urgence effectuée:', emergencyData);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde d\'urgence:', error);
        }
    }

    captureCurrentState() {
        try {
            // Capturer l'état des plongeurs
            const plongeursElements = document.querySelectorAll('#listePlongeurs li');
            const plongeurs = Array.from(plongeursElements).map(li => ({
                nom: li.querySelector('.plongeur-nom')?.textContent || '',
                niveau: li.querySelector('.plongeur-niveau')?.textContent || '',
                prerogatives: li.querySelector('.plongeur-pre')?.textContent || '',
                id: li.dataset.id || Math.random().toString(36).substr(2, 9)
            }));

            // Capturer l'état des palanquées
            const palanqueesElements = document.querySelectorAll('.palanquee');
            const palanquees = Array.from(palanqueesElements).map(div => {
                const guides = Array.from(div.querySelectorAll('.guide li')).map(li => ({
                    nom: li.querySelector('.plongeur-nom')?.textContent || '',
                    niveau: li.querySelector('.plongeur-niveau')?.textContent || '',
                    prerogatives: li.querySelector('.plongeur-pre')?.textContent || '',
                    id: li.dataset.id
                }));
                
                const plongeursP = Array.from(div.querySelectorAll('.plongeurs li')).map(li => ({
                    nom: li.querySelector('.plongeur-nom')?.textContent || '',
                    niveau: li.querySelector('.plongeur-niveau')?.textContent || '',
                    prerogatives: li.querySelector('.plongeur-pre')?.textContent || '',
                    id: li.dataset.id
                }));

                return {
                    id: div.dataset.id || Math.random().toString(36).substr(2, 9),
                    profondeur: div.querySelector('.profondeur-input')?.value || '',
                    duree: div.querySelector('.duree-input')?.value || '',
                    guides: guides,
                    plongeurs: plongeursP
                };
            });

            // Capturer les métadonnées
            const metaData = {
                dp: document.getElementById('dp-select').value,
                date: document.getElementById('dp-date').value,
                lieu: document.getElementById('dp-lieu').value,
                plongee: document.getElementById('dp-plongee').value
            };

            return {
                sessionId: this.currentSessionId,
                timestamp: Date.now(),
                plongeurs,
                palanquees,
                metaData,
                version: '7.7.1'
            };
        } catch (error) {
            console.error('Erreur lors de la capture de l\'état:', error);
            return null;
        }
    }

    saveDPSyncData() {
        const dpData = {
            selectedDP: document.getElementById('dp-select').value,
            date: document.getElementById('dp-date').value,
            lieu: document.getElementById('dp-lieu').value,
            plongee: document.getElementById('dp-plongee').value,
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.STORAGE_KEYS.DP_SYNC, JSON.stringify(dpData));
    }

    checkForRecovery() {
        if (this.isRecoveryInProgress) return;

        const emergencyData = localStorage.getItem(this.STORAGE_KEYS.EMERGENCY_DATA);
        const lastSaveTime = localStorage.getItem(this.STORAGE_KEYS.LAST_SAVE_TIME);
        
        if (!emergencyData || !lastSaveTime) return;

        const saveAge = Date.now() - parseInt(lastSaveTime);
        
        // Ne proposer la récupération que si :
        // 1. Les données ne sont pas trop anciennes
        // 2. L'application semble "vide" actuellement
        // 3. Il y a du contenu significatif dans la sauvegarde
        if (saveAge < this.MAX_RECOVERY_AGE && this.shouldOfferRecovery(emergencyData)) {
            this.offerRecovery(JSON.parse(emergencyData));
        } else {
            // Nettoyer les anciennes données
            this.clearEmergencySave();
        }
    }

    shouldOfferRecovery(emergencyDataString) {
        try {
            const data = JSON.parse(emergencyDataString);
            
            // Vérifier si l'application est actuellement "vide"
            const currentPlongeurs = document.querySelectorAll('#listePlongeurs li').length;
            const currentPalanquees = document.querySelectorAll('.palanquee').length;
            const currentDP = document.getElementById('dp-select').value;
            
            const isCurrentlyEmpty = currentPlongeurs === 0 && currentPalanquees === 0 && !currentDP;
            
            // Vérifier si la sauvegarde contient des données significatives
            const hasSignificantSave = (data.plongeurs && data.plongeurs.length > 0) || 
                                      (data.palanquees && data.palanquees.length > 0) ||
                                      (data.metaData && data.metaData.dp);
            
            return isCurrentlyEmpty && hasSignificantSave;
        } catch (error) {
            console.error('Erreur lors de la vérification de récupération:', error);
            return false;
        }
    }

    offerRecovery(emergencyData) {
        this.isRecoveryInProgress = true;
        
        const saveDate = new Date(emergencyData.timestamp).toLocaleString('fr-FR');
        const plongeursCount = emergencyData.plongeurs ? emergencyData.plongeurs.length : 0;
        const palanqueesCount = emergencyData.palanquees ? emergencyData.palanquees.length : 0;
        
        const message = `🚨 RÉCUPÉRATION DE SESSION DÉTECTÉE\n\n` +
                       `Une sauvegarde automatique a été trouvée :\n` +
                       `📅 Date : ${saveDate}\n` +
                       `🤿 Plongeurs : ${plongeursCount}\n` +
                       `🏊 Palanquées : ${palanqueesCount}\n` +
                       `👨‍🏫 DP : ${emergencyData.metaData?.dp || 'Non défini'}\n\n` +
                       `Souhaitez-vous restaurer cette session ?`;

        if (confirm(message)) {
            this.restoreEmergencyData(emergencyData);
        } else {
            this.clearEmergencySave();
        }
        
        this.isRecoveryInProgress = false;
    }

    restoreEmergencyData(data) {
        try {
            // Restaurer les métadonnées
            if (data.metaData) {
                const dpSelect = document.getElementById('dp-select');
                if (data.metaData.dp && dpSelect) {
                    // Attendre que les options soient chargées
                    const setDpValue = () => {
                        if (dpSelect.options.length > 1) {
                            dpSelect.value = data.metaData.dp;
                            dpSelect.dispatchEvent(new Event('change'));
                            console.log('✅ DP restauré:', data.metaData.dp);
                        } else {
                            setTimeout(setDpValue, 500);
                        }
                    };
                    setDpValue();
                }
                
                if (data.metaData.date) {
                    document.getElementById('dp-date').value = data.metaData.date;
                }
                if (data.metaData.lieu) {
                    document.getElementById('dp-lieu').value = data.metaData.lieu;
                }
                if (data.metaData.plongee) {
                    document.getElementById('dp-plongee').value = data.metaData.plongee;
                }
            }

            // Restaurer les plongeurs
            if (data.plongeurs && window.plongeursManager) {
                data.plongeurs.forEach(plongeur => {
                    window.plongeursManager.addPlongeur(plongeur.nom, plongeur.niveau, plongeur.prerogatives);
                });
            }

            // Restaurer les palanquées (logique simplifiée - à adapter selon votre système)
            if (data.palanquees && window.renderDOM) {
                data.palanquees.forEach(palanquee => {
                    // Cette partie nécessiterait une adaptation selon votre système de palanquées
                    console.log('Restauration palanquée:', palanquee);
                });
            }

            this.showSaveNotification('✅ Session restaurée avec succès !');
            this.clearEmergencySave();
            this.hasUnsavedChanges = false;
            
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            alert('Erreur lors de la restauration des données. Les données peuvent être corrompues.');
        }
    }

    clearEmergencySave() {
        localStorage.removeItem(this.STORAGE_KEYS.EMERGENCY_DATA);
        localStorage.removeItem(this.STORAGE_KEYS.LAST_SAVE_TIME);
    }

    cleanupOldSaves() {
        // Nettoyer les anciennes sauvegardes au démarrage
        const lastSaveTime = localStorage.getItem(this.STORAGE_KEYS.LAST_SAVE_TIME);
        if (lastSaveTime) {
            const saveAge = Date.now() - parseInt(lastSaveTime);
            if (saveAge > this.MAX_RECOVERY_AGE) {
                this.clearEmergencySave();
            }
        }
    }

    showSaveNotification(message) {
        // Réutiliser le système de notification existant
        const notification = document.getElementById('save-notification');
        if (notification) {
            notification.textContent = message;
            notification.style.display = 'block';
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 300);
            }, 3000);
        } else {
            // Fallback si pas de notification existante
            console.log(message);
            
            // Créer une notification temporaire
            const tempNotif = document.createElement('div');
            tempNotif.style.cssText = `
                position: fixed; top: 20px; right: 20px; background: #28a745; 
                color: white; padding: 12px 20px; border-radius: 8px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; 
                font-weight: 500; max-width: 300px;
            `;
            tempNotif.textContent = message;
            document.body.appendChild(tempNotif);
            
            setTimeout(() => {
                tempNotif.remove();
            }, 3000);
        }
    }

    // Méthode publique pour marquer une sauvegarde normale comme effectuée
    markNormalSaveComplete() {
        this.hasUnsavedChanges = false;
        this.clearEmergencySave(); // Nettoyer la sauvegarde d'urgence après une sauvegarde normale
        console.log('🔄 Sauvegarde normale marquée comme terminée');
    }

    // Méthode publique pour forcer une sauvegarde d'urgence
    forceSave() {
        console.log('⚡ Sauvegarde d\'urgence forcée');
        this.performEmergencySave();
    }
}

// Initialiser le gestionnaire de sauvegarde d'urgence
let emergencySaveManager;

// Attendre que le DOM soit chargé et que l'utilisateur soit connecté
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'authentification soit résolue
    const checkAuth = () => {
        if (window.firebase && window.firebase.auth().currentUser) {
            console.log('🚀 Initialisation EmergencySaveManager...');
            emergencySaveManager = new EmergencySaveManager();
            
            // Intégrer avec le système existant
            if (window.dpSessionsManager) {
                // Hook dans les sauvegardes normales
                const originalSaveSession = window.dpSessionsManager.saveCurrentSession;
                if (originalSaveSession) {
                    window.dpSessionsManager.saveCurrentSession = function(...args) {
                        const result = originalSaveSession.apply(this, args);
                        if (emergencySaveManager) {
                            emergencySaveManager.markNormalSaveComplete();
                        }
                        return result;
                    };
                }
            }
            
            console.log('✅ EmergencySaveManager initialisé avec succès');
        } else {
            setTimeout(checkAuth, 1000);
        }
    };
    
    setTimeout(checkAuth, 2000);
});

// Exposer pour utilisation externe
window.emergencySaveManager = emergencySaveManager;
window.EmergencySaveManager = EmergencySaveManager;

console.log('📦 Module emergency-save-improved.js chargé');