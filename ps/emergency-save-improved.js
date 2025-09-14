// ps/emergency-save-improved.js - Version corrigée
// Système de sauvegarde d'urgence amélioré pour JSAS

alert('Script emergency-save se charge !');




console.log('🚀 Début chargement emergency-save-improved.js');

class EmergencySaveManager {
    constructor() {
        console.log('📦 Création EmergencySaveManager...');
        
        this.STORAGE_KEYS = {
            EMERGENCY_DATA: 'jsas_emergency_save',
            LAST_SAVE_TIME: 'jsas_last_emergency_save',
            SESSION_ID: 'jsas_current_session_id'
        };
        
        this.MIN_SAVE_INTERVAL = 30000; // 30 secondes
        this.MAX_RECOVERY_AGE = 24 * 60 * 60 * 1000; // 24 heures
        this.lastSaveTime = 0;
        this.hasUnsavedChanges = false;
        this.isRecoveryInProgress = false;
        this.currentSessionId = this.generateSessionId();
        
        console.log('✅ EmergencySaveManager créé avec succès');
        this.init();
    }

    init() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.currentSessionId);
            
            // Délai pour laisser l'app se charger
            setTimeout(() => this.checkForRecovery(), 3000);
            
            // Écouter les changements
            this.setupChangeListeners();
            
            // Nettoyer les anciennes sauvegardes
            this.cleanupOldSaves();
            
            console.log('🔧 EmergencySaveManager initialisé');
        } catch (error) {
            console.error('❌ Erreur init EmergencySaveManager:', error);
        }
    }

    generateSessionId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    setupChangeListeners() {
        try {
            // Observer les changements DOM
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target.id === 'listePlongeurs' || 
                        mutation.target.closest('#palanqueesContainer')) {
                        this.markAsChanged();
                    }
                });
            });

            // Observer la liste des plongeurs et palanquées
            const listePlongeurs = document.getElementById('listePlongeurs');
            const palanqueesContainer = document.getElementById('palanqueesContainer');
            
            if (listePlongeurs) {
                observer.observe(listePlongeurs, { childList: true, subtree: true });
            }
            if (palanqueesContainer) {
                observer.observe(palanqueesContainer, { childList: true, subtree: true });
            }

            // Écouter les changements de formulaire
            document.addEventListener('input', (e) => {
                if (e.target && e.target.matches && e.target.matches('#nom, #niveau, #pre, #dp-lieu, #dp-plongee')) {
                    this.markAsChanged();
                }
            });

            // Écouter les changements de DP
            document.addEventListener('change', (e) => {
                if (e.target && e.target.id === 'dp-select') {
                    this.markAsChanged();
                }
            });
            
            console.log('👂 Listeners configurés');
        } catch (error) {
            console.error('❌ Erreur setup listeners:', error);
        }
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        console.log('📝 Changements détectés');
        
        // Auto-save avec délai
        if (this.shouldSaveEmergency()) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => {
                this.performEmergencySave();
            }, 5000);
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
        try {
            const plongeurs = document.querySelectorAll('#listePlongeurs li').length;
            const palanquees = document.querySelectorAll('.palanquee').length;
            const dpElement = document.getElementById('dp-select');
            const dpSelected = dpElement ? dpElement.value : '';
            
            return plongeurs > 0 || palanquees > 0 || dpSelected;
        } catch (error) {
            console.error('❌ Erreur hasSignificantContent:', error);
            return false;
        }
    }

    performEmergencySave() {
        try {
            console.log('💾 Sauvegarde d\'urgence en cours...');
            const emergencyData = this.captureCurrentState();
            
            if (emergencyData && this.hasSignificantContent()) {
                localStorage.setItem(this.STORAGE_KEYS.EMERGENCY_DATA, JSON.stringify(emergencyData));
                localStorage.setItem(this.STORAGE_KEYS.LAST_SAVE_TIME, Date.now().toString());
                
                this.lastSaveTime = Date.now();
                this.hasUnsavedChanges = false;
                
                this.showSaveNotification('💾 Sauvegarde automatique effectuée');
                console.log('✅ Sauvegarde d\'urgence terminée');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde d\'urgence:', error);
        }
    }

    captureCurrentState() {
        try {
            // Capturer plongeurs
            const plongeursElements = document.querySelectorAll('#listePlongeurs li');
            const plongeurs = Array.from(plongeursElements).map(li => {
                return {
                    nom: li.querySelector('.plongeur-nom')?.textContent || '',
                    niveau: li.querySelector('.plongeur-niveau')?.textContent || '',
                    prerogatives: li.querySelector('.plongeur-pre')?.textContent || '',
                    id: li.dataset.id || Math.random().toString(36).substr(2, 9)
                };
            });

            // Capturer palanquées
            const palanqueesElements = document.querySelectorAll('.palanquee');
            const palanquees = Array.from(palanqueesElements).map(div => {
                return {
                    id: div.dataset.id || Math.random().toString(36).substr(2, 9),
                    profondeur: div.querySelector('.profondeur-input')?.value || '',
                    duree: div.querySelector('.duree-input')?.value || ''
                };
            });

            // Capturer métadonnées
            const metaData = {
                dp: document.getElementById('dp-select')?.value || '',
                date: document.getElementById('dp-date')?.value || '',
                lieu: document.getElementById('dp-lieu')?.value || '',
                plongee: document.getElementById('dp-plongee')?.value || ''
            };

            return {
                sessionId: this.currentSessionId,
                timestamp: Date.now(),
                plongeurs: plongeurs,
                palanquees: palanquees,
                metaData: metaData,
                version: '7.7.1'
            };
        } catch (error) {
            console.error('❌ Erreur capture état:', error);
            return null;
        }
    }

    checkForRecovery() {
        if (this.isRecoveryInProgress) return;

        try {
            const emergencyData = localStorage.getItem(this.STORAGE_KEYS.EMERGENCY_DATA);
            const lastSaveTime = localStorage.getItem(this.STORAGE_KEYS.LAST_SAVE_TIME);
            
            if (!emergencyData || !lastSaveTime) return;

            const saveAge = Date.now() - parseInt(lastSaveTime);
            
            if (saveAge < this.MAX_RECOVERY_AGE && this.shouldOfferRecovery(emergencyData)) {
                this.offerRecovery(JSON.parse(emergencyData));
            } else {
                this.clearEmergencySave();
            }
        } catch (error) {
            console.error('❌ Erreur checkForRecovery:', error);
        }
    }

    shouldOfferRecovery(emergencyDataString) {
        try {
            const data = JSON.parse(emergencyDataString);
            
            // Vérifier si l'app est vide
            const currentPlongeurs = document.querySelectorAll('#listePlongeurs li').length;
            const currentPalanquees = document.querySelectorAll('.palanquee').length;
            const currentDP = document.getElementById('dp-select')?.value || '';
            
            const isCurrentlyEmpty = currentPlongeurs === 0 && currentPalanquees === 0 && !currentDP;
            
            // Vérifier si la sauvegarde a du contenu
            const hasSignificantSave = (data.plongeurs && data.plongeurs.length > 0) || 
                                      (data.palanquees && data.palanquees.length > 0) ||
                                      (data.metaData && data.metaData.dp);
            
            return isCurrentlyEmpty && hasSignificantSave;
        } catch (error) {
            console.error('❌ Erreur shouldOfferRecovery:', error);
            return false;
        }
    }

    offerRecovery(emergencyData) {
        this.isRecoveryInProgress = true;
        
        try {
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
        } catch (error) {
            console.error('❌ Erreur offerRecovery:', error);
        }
        
        this.isRecoveryInProgress = false;
    }

    restoreEmergencyData(data) {
        try {
            console.log('🔄 Restauration des données...');
            
            // Restaurer métadonnées
            if (data.metaData) {
                const dpSelect = document.getElementById('dp-select');
                if (data.metaData.dp && dpSelect) {
                    setTimeout(() => {
                        if (dpSelect.options.length > 1) {
                            dpSelect.value = data.metaData.dp;
                            dpSelect.dispatchEvent(new Event('change'));
                            console.log('✅ DP restauré:', data.metaData.dp);
                        }
                    }, 1000);
                }
                
                if (data.metaData.date) {
                    const dateEl = document.getElementById('dp-date');
                    if (dateEl) dateEl.value = data.metaData.date;
                }
                if (data.metaData.lieu) {
                    const lieuEl = document.getElementById('dp-lieu');
                    if (lieuEl) lieuEl.value = data.metaData.lieu;
                }
                if (data.metaData.plongee) {
                    const plongeeEl = document.getElementById('dp-plongee');
                    if (plongeeEl) plongeeEl.value = data.metaData.plongee;
                }
            }

            // Restaurer plongeurs (si le système existe)
            if (data.plongeurs && window.plongeursManager && window.plongeursManager.addPlongeur) {
                data.plongeurs.forEach(plongeur => {
                    window.plongeursManager.addPlongeur(plongeur.nom, plongeur.niveau, plongeur.prerogatives);
                });
                console.log('✅ Plongeurs restaurés:', data.plongeurs.length);
            }

            this.showSaveNotification('✅ Session restaurée avec succès !');
            this.clearEmergencySave();
            this.hasUnsavedChanges = false;
            
        } catch (error) {
            console.error('❌ Erreur restauration:', error);
            alert('Erreur lors de la restauration des données.');
        }
    }

    showSaveNotification(message) {
        try {
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
                // Notification temporaire
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
            
            console.log('📢', message);
        } catch (error) {
            console.error('❌ Erreur notification:', error);
        }
    }

    clearEmergencySave() {
        localStorage.removeItem(this.STORAGE_KEYS.EMERGENCY_DATA);
        localStorage.removeItem(this.STORAGE_KEYS.LAST_SAVE_TIME);
    }

    cleanupOldSaves() {
        try {
            const lastSaveTime = localStorage.getItem(this.STORAGE_KEYS.LAST_SAVE_TIME);
            if (lastSaveTime) {
                const saveAge = Date.now() - parseInt(lastSaveTime);
                if (saveAge > this.MAX_RECOVERY_AGE) {
                    this.clearEmergencySave();
                }
            }
        } catch (error) {
            console.error('❌ Erreur cleanupOldSaves:', error);
        }
    }

    // Méthodes publiques
    markNormalSaveComplete() {
        this.hasUnsavedChanges = false;
        this.clearEmergencySave();
        console.log('🔄 Sauvegarde normale marquée comme terminée');
    }

    forceSave() {
        console.log('⚡ Sauvegarde forcée');
        this.performEmergencySave();
    }
}

// Initialisation
let emergencySaveManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM ready - Initialisation EmergencySaveManager...');
    
    const initEmergencyManager = () => {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                console.log('🚀 Création EmergencySaveManager (Firebase OK)...');
                emergencySaveManager = new EmergencySaveManager();
                window.emergencySaveManager = emergencySaveManager;
                console.log('✅ EmergencySaveManager opérationnel !');
            } else {
                console.log('⏳ Attente Firebase/Auth...');
                setTimeout(initEmergencyManager, 1000);
            }
        } catch (error) {
            console.error('❌ Erreur init emergency manager:', error);
            setTimeout(initEmergencyManager, 2000);
        }
    };
    
    setTimeout(initEmergencyManager, 2000);
});

// Exposer la classe
window.EmergencySaveManager = EmergencySaveManager;

console.log('✅ emergency-save-improved.js chargé avec succès');