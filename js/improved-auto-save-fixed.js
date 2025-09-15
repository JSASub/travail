// ps/improved-auto-save-fixed.js
// Système de sauvegarde automatique corrigé pour JSAS
// Version sans erreurs de type

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        STORAGE_KEY: 'jsas_auto_save',
        MAX_AGE_HOURS: 24,
        MIN_DATA_THRESHOLD: 2,
        SAVE_DELAY: 2000,
        SHOW_RESTORE_DELAY: 3000
    };

    // Variables globales du module
    let autoSaveTimeout = null;
    let hasShownRestorePrompt = false;
    let isRestoringData = false;

    /**
     * Vérifications sécurisées pour les variables globales
     */
    function safeGetPlongeurs() {
        return (window.plongeurs && Array.isArray(window.plongeurs)) ? window.plongeurs : [];
    }

    function safeGetPalanquees() {
    // D'abord essayer la variable globale
    if (window.palanquees && Array.isArray(window.palanquees)) {
        return window.palanquees;
    }
    
    // Si pas de variable globale, extraire du DOM
    const palanqueesDOM = document.querySelectorAll('.palanquee');
    if (palanqueesDOM.length > 0) {
        const palanqueesArray = [];
        
        palanqueesDOM.forEach((palanqueeEl, index) => {
            const plongeurs = [];
            
            // Extraire les plongeurs de cette palanquée
            const plongeursEls = palanqueeEl.querySelectorAll('.palanquee-plongeur-item');
            plongeursEls.forEach(plongeurEl => {
                const nom = plongeurEl.querySelector('.plongeur-nom')?.textContent || '';
                const niveau = plongeurEl.querySelector('.plongeur-niveau')?.textContent || '';
                const pre = plongeurEl.querySelector('.plongeur-prerogatives-editable')?.value || '';
                
                if (nom) {
                    plongeurs.push({ nom, niveau, pre });
                }
            });
            
            // Ajouter les paramètres de la palanquée
            plongeurs.horaire = palanqueeEl.querySelector('.palanquee-horaire')?.value || '';
            plongeurs.profondeurPrevue = palanqueeEl.querySelector('.palanquee-prof-prevue')?.value || '';
            plongeurs.dureePrevue = palanqueeEl.querySelector('.palanquee-duree-prevue')?.value || '';
            plongeurs.profondeurRealisee = palanqueeEl.querySelector('.palanquee-prof-realisee')?.value || '';
            plongeurs.dureeRealisee = palanqueeEl.querySelector('.palanquee-duree-realisee')?.value || '';
            plongeurs.paliers = palanqueeEl.querySelector('.palanquee-paliers')?.value || '';
            
            palanqueesArray.push(plongeurs);
        });
        
        console.log(`📊 ${palanqueesArray.length} palanquées extraites du DOM`);
        return palanqueesArray;
    }
    
    return [];
}

    function safeGetPlongeursOriginaux() {
        return (window.plongeursOriginaux && Array.isArray(window.plongeursOriginaux)) ? window.plongeursOriginaux : [];
    }

    /**
     * Compter les plongeurs dans les palanquées de manière sécurisée
     */
    function countPlongeursInPalanquees(palanquees) {
        if (!Array.isArray(palanquees)) return 0;
        
        let total = 0;
        for (let i = 0; i < palanquees.length; i++) {
            const pal = palanquees[i];
            if (Array.isArray(pal)) {
                total += pal.length;
            } else if (pal && typeof pal.length === 'number' && pal.length >= 0) {
                total += pal.length;
            }
        }
        return total;
    }

    /**
     * Sauvegarder l'état complet de l'application
     */
    function saveApplicationState() {
        try {
            // Récupérer les données de manière sécurisée
            const plongeurs = safeGetPlongeurs();
            const palanquees = safeGetPalanquees();
            const dpSelect = document.getElementById('dp-select');
            const dpDate = document.getElementById('dp-date');
            const dpLieu = document.getElementById('dp-lieu');
            
            // Compter les données significatives de manière sécurisée
            let dataCount = 0;
            
            if (plongeurs.length > 0) {
                dataCount += plongeurs.length;
            }
            
            const plongeursInPalanquees = countPlongeursInPalanquees(palanquees);
            if (plongeursInPalanquees > 0) {
                dataCount += plongeursInPalanquees;
            }
            
            if (dpSelect && dpSelect.value) dataCount++;
            if (dpDate && dpDate.value) dataCount++;
            if (dpLieu && dpLieu.value && dpLieu.value.trim()) dataCount++;

            // Ne sauvegarder que s'il y a suffisamment de données
            if (dataCount < CONFIG.MIN_DATA_THRESHOLD) {
                console.log('Pas assez de données pour la sauvegarde automatique');
                return;
            }

            // Capturer l'état complet de manière sécurisée
            const appState = {
                timestamp: Date.now(),
                version: '1.0',
                metadata: {
                    dp: {
                        selectedId: dpSelect ? dpSelect.value || '' : '',
                        selectedText: dpSelect && dpSelect.selectedOptions[0] ? dpSelect.selectedOptions[0].text || '' : '',
                        selectedIndex: dpSelect ? dpSelect.selectedIndex || 0 : 0
                    },
                    date: dpDate ? dpDate.value || '' : '',
                    lieu: dpLieu ? dpLieu.value ? dpLieu.value.trim() : '' : '',
                    plongee: document.getElementById('dp-plongee') ? document.getElementById('dp-plongee').value || 'matin' : 'matin'
                },
                data: {
                    plongeurs: plongeurs,
                    palanquees: palanquees,
                    plongeursOriginaux: safeGetPlongeursOriginaux()
                },
                stats: {
                    totalPlongeurs: plongeurs.length,
                    totalEnPalanquees: plongeursInPalanquees,
                    nombrePalanquees: Array.isArray(palanquees) ? palanquees.length : 0
                }
            };

            // Sauvegarder dans localStorage
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
            
            console.log('Sauvegarde automatique effectuée:', {
                plongeurs: appState.stats.totalPlongeurs,
                enPalanquées: appState.stats.totalEnPalanquees,
                palanquées: appState.stats.nombrePalanquees,
                dp: appState.metadata.dp.selectedText || 'Non sélectionné'
            });

            // Afficher brièvement un indicateur de sauvegarde
            showSaveIndicator();

        } catch (error) {
            console.error('Erreur lors de la sauvegarde automatique:', error);
        }
    }

    /**
     * Afficher un indicateur discret de sauvegarde
     */
    function showSaveIndicator() {
        let indicator = document.getElementById('auto-save-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'auto-save-indicator';
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = 'Sauvegardé automatiquement';
            document.body.appendChild(indicator);
        }

        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    /**
     * Vérifier s'il y a des données à restaurer
     */
    function checkForSavedData() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!saved) return null;

            const appState = JSON.parse(saved);
            
            // Vérifier l'âge des données
            const age = Date.now() - appState.timestamp;
            const maxAge = CONFIG.MAX_AGE_HOURS * 60 * 60 * 1000;
            
            if (age > maxAge) {
                console.log('Données de sauvegarde expirées, suppression');
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                return null;
            }

            // Vérifier qu'il y a des données significatives
            const totalData = (appState.stats && appState.stats.totalPlongeurs ? appState.stats.totalPlongeurs : 0) + 
                             (appState.stats && appState.stats.totalEnPalanquees ? appState.stats.totalEnPalanquees : 0);
            
            if (totalData < CONFIG.MIN_DATA_THRESHOLD) {
                console.log('Pas assez de données significatives dans la sauvegarde');
                return null;
            }

            return appState;
            
        } catch (error) {
            console.error('Erreur lors de la lecture de la sauvegarde:', error);
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return null;
        }
    }

    /**
     * Restaurer l'état de l'application
     */
    async function restoreApplicationState(appState) {
        if (isRestoringData) return;
        isRestoringData = true;

        try {
            console.log('Restauration de l\'état de l\'application...');

            // 1. Restaurer les données globales de manière sécurisée
            if (appState.data && Array.isArray(appState.data.plongeurs)) {
                window.plongeurs = appState.data.plongeurs;
            }
            if (appState.data && Array.isArray(appState.data.palanquees)) {
                window.palanquees = appState.data.palanquees;
            }
            if (appState.data && Array.isArray(appState.data.plongeursOriginaux)) {
                window.plongeursOriginaux = appState.data.plongeursOriginaux;
            }

            // 2. Restaurer les champs d'interface
            if (appState.metadata) {
                if (appState.metadata.date) {
                    const dpDate = document.getElementById('dp-date');
                    if (dpDate) dpDate.value = appState.metadata.date;
                }

                if (appState.metadata.lieu) {
                    const dpLieu = document.getElementById('dp-lieu');
                    if (dpLieu) dpLieu.value = appState.metadata.lieu;
                }

                if (appState.metadata.plongee) {
                    const dpPlongee = document.getElementById('dp-plongee');
                    if (dpPlongee) dpPlongee.value = appState.metadata.plongee;
                }
            }

            // 3. Restaurer le DP sélectionné
            if (appState.metadata && appState.metadata.dp && appState.metadata.dp.selectedId) {
                await waitForDPListLoaded();
                
                const dpSelect = document.getElementById('dp-select');
                if (dpSelect) {
                    // Chercher par ID d'abord
                    const optionById = dpSelect.querySelector(`option[value="${appState.metadata.dp.selectedId}"]`);
                    if (optionById) {
                        dpSelect.value = appState.metadata.dp.selectedId;
                        console.log('DP restauré par ID:', appState.metadata.dp.selectedText);
                    } else {
                        // Chercher par texte si l'ID n'existe plus
                        const options = Array.from(dpSelect.options);
                        const optionByText = options.find(opt => 
                            opt.text.includes(appState.metadata.dp.selectedText) ||
                            appState.metadata.dp.selectedText.includes(opt.text)
                        );
                        if (optionByText) {
                            dpSelect.value = optionByText.value;
                            console.log('DP restauré par texte:', optionByText.text);
                        } else {
                            console.warn('DP non trouvé:', appState.metadata.dp.selectedText);
                        }
                    }
                }
            }

            // 4. Rafraîchir l'interface
            await refreshInterface();

            // 5. Supprimer la sauvegarde après restauration réussie
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            
            console.log('Restauration terminée avec succès');
            showRestoreSuccessMessage(appState);

        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
            showRestoreErrorMessage(error);
        } finally {
            isRestoringData = false;
        }
    }

    /**
     * Attendre que la liste des DP soit chargée
     */
    function waitForDPListLoaded() {
        return new Promise((resolve) => {
            const checkDP = () => {
                const dpSelect = document.getElementById('dp-select');
                if (dpSelect && dpSelect.options.length > 1) {
                    resolve();
                } else {
                    setTimeout(checkDP, 100);
                }
            };
            checkDP();
        });
    }

    /**
     * Rafraîchir l'interface après restauration
     */
    async function refreshInterface() {
        try {
            if (typeof window.renderPalanquees === 'function') {
                window.renderPalanquees();
            }
            if (typeof window.renderPlongeurs === 'function') {
                window.renderPlongeurs();
            }
            if (typeof window.updateAlertes === 'function') {
                window.updateAlertes();
            }
            if (typeof window.updateCompteurs === 'function') {
                window.updateCompteurs();
            }
            if (typeof window.updateFloatingPlongeursList === 'function') {
                window.updateFloatingPlongeursList();
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
        }
    }

    /**
     * Afficher une notification élégante de proposition de restauration
     */
    function showRestorePrompt(appState) {
        if (hasShownRestorePrompt) return;
        hasShownRestorePrompt = true;

        // Créer la notification
        const notification = document.createElement('div');
        notification.className = 'restore-notification';
        notification.innerHTML = `
            <div class="restore-notification-content">
                <div class="restore-header">
                    <span class="restore-icon">🔄</span>
                    <span class="restore-title">Session précédente trouvée</span>
                    <button class="restore-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="restore-body">
                    <div class="restore-info">
                        <div class="restore-stats">
                            ${appState.stats.totalPlongeurs || 0} plongeurs,
							${appState.stats?.nombrePalanquees || 0} palanquées
                        </div>
                        <div class="restore-dp">
                            DP: ${appState.metadata && appState.metadata.dp ? appState.metadata.dp.selectedText || 'Non sélectionné' : 'Non défini'}
                        </div>
                        <div class="restore-date">
                            ${appState.metadata && appState.metadata.date ? new Date(appState.metadata.date).toLocaleDateString('fr-FR') : 'Date non définie'}
                        </div>
                        <div class="restore-age">
                            Il y a ${formatTimeDifference(Date.now() - appState.timestamp)}
                        </div>
                    </div>
                </div>
                <div class="restore-footer">
                    <button class="restore-btn restore-btn-ignore" onclick="ignoreRestore(this)">
                        Ignorer
                    </button>
                    <button class="restore-btn restore-btn-restore" onclick="acceptRestore(this)">
                        Restaurer la session
                    </button>
                </div>
            </div>
        `;

        // Ajouter les styles si nécessaires
        if (!document.getElementById('restore-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'restore-notification-styles';
            styles.textContent = `
                .restore-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    z-index: 10000;
                    border: 2px solid #007bff;
                    animation: slideInRight 0.5s ease;
                }
                .restore-notification-content {
                    padding: 0;
                }
                .restore-header {
                    background: linear-gradient(45deg, #007bff, #0056b3);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px 10px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .restore-icon {
                    font-size: 18px;
                }
                .restore-title {
                    flex: 1;
                    font-weight: 600;
                    font-size: 16px;
                }
                .restore-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .restore-close:hover {
                    background: rgba(255,255,255,0.2);
                }
                .restore-body {
                    padding: 20px;
                }
                .restore-info {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .restore-stats {
                    color: #28a745;
                    font-weight: 500;
                    margin-bottom: 8px;
                }
                .restore-dp {
                    color: #007bff;
                    margin-bottom: 8px;
                }
                .restore-date {
                    color: #6f42c1;
                    margin-bottom: 8px;
                }
                .restore-age {
                    color: #6c757d;
                    font-size: 13px;
                }
                .restore-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    background: #f8f9fa;
                    border-radius: 0 0 10px 10px;
                }
                .restore-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                .restore-btn-ignore {
                    background: #6c757d;
                    color: white;
                }
                .restore-btn-ignore:hover {
                    background: #5a6268;
                }
                .restore-btn-restore {
                    background: #28a745;
                    color: white;
                }
                .restore-btn-restore:hover {
                    background: #218838;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .restore-notification {
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Fonctions pour les boutons
        window.acceptRestore = function(btn) {
            btn.disabled = true;
            btn.textContent = 'Restauration...';
            restoreApplicationState(appState);
            setTimeout(() => {
                const notification = btn.closest('.restore-notification');
                if (notification) notification.remove();
            }, 1000);
        };

        window.ignoreRestore = function(btn) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            const notification = btn.closest('.restore-notification');
            if (notification) notification.remove();
        };

        document.body.appendChild(notification);

        // Auto-fermeture après 30 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 30000);
    }

    /**
     * Messages de feedback
     */
    function showRestoreSuccessMessage(appState) {
        const message = document.createElement('div');
        message.className = 'restore-success-message';
        message.innerHTML = `
            <span>Session restaurée avec succès!</span>
            <span style="font-size: 12px; opacity: 0.8; margin-left: 10px;">
                ${appState.stats && appState.stats.totalPlongeurs ? appState.stats.totalPlongeurs : 0} plongeurs, ${appState.stats && appState.stats.nombrePalanquees ? appState.stats.nombrePalanquees : 0} palanquées
            </span>
        `;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    function showRestoreErrorMessage(error) {
        const message = document.createElement('div');
        message.textContent = `Erreur de restauration: ${error.message}`;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    /**
     * Formater la différence de temps
     */
    function formatTimeDifference(ms) {
        const minutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}min`;
        } else {
            return `${minutes}min`;
        }
    }

    /**
     * Déclencher une sauvegarde automatique avec délai
     */
    function triggerAutoSave() {
        if (isRestoringData) return;
        
        // Annuler la sauvegarde précédente si elle est en attente
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        // Programmer une nouvelle sauvegarde
        autoSaveTimeout = setTimeout(() => {
            saveApplicationState();
            autoSaveTimeout = null;
        }, CONFIG.SAVE_DELAY);
    }

    /**
     * Surveiller les changements dans l'application
     */
    function setupChangeListeners() {
        // Observer les changements dans les listes DOM
        const plongeursList = document.getElementById('listePlongeurs');
        const palanqueesContainer = document.getElementById('palanqueesContainer');
        
        if (plongeursList) {
            const observer = new MutationObserver(triggerAutoSave);
            observer.observe(plongeursList, { childList: true, subtree: true });
        }
        
        if (palanqueesContainer) {
            const observer = new MutationObserver(triggerAutoSave);
            observer.observe(palanqueesContainer, { childList: true, subtree: true });
        }

        // Observer les changements dans les champs de métadonnées
        const fieldsToWatch = ['dp-select', 'dp-date', 'dp-lieu', 'dp-plongee'];
        fieldsToWatch.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', triggerAutoSave);
                field.addEventListener('input', triggerAutoSave);
            }
        });

        // Observer les changements dans les variables globales de manière sécurisée
        let lastPlongeursCount = safeGetPlongeurs().length;
        let lastPalanqueesCount = safeGetPalanquees().length;
        
        setInterval(() => {
            const currentPlongeursCount = safeGetPlongeurs().length;
            const currentPalanqueesCount = safeGetPalanquees().length;
            
            if (currentPlongeursCount !== lastPlongeursCount || 
                currentPalanqueesCount !== lastPalanqueesCount) {
                
                lastPlongeursCount = currentPlongeursCount;
                lastPalanqueesCount = currentPalanqueesCount;
                triggerAutoSave();
            }
        }, 1000);

        console.log('Surveillance des changements activée');
    }

    /**
     * Sauvegarder avant fermeture de page
     */
    function setupBeforeUnloadSave() {
        window.addEventListener('beforeunload', (e) => {
            saveApplicationState();
        });

        // Sauvegarder également lors de la perte de focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveApplicationState();
            }
        });
    }

    /**
     * Désactiver les anciens systèmes de sauvegarde
     */
    function disableOldSaveSystems() {
        // Supprimer les anciennes sauvegardes d'urgence
        const oldKeys = [
            'jsas_emergency_save',
            'jsas_last_session', 
            'emergency_save_jsas',
            'jsas_backup_data',
            'jsas_emergency_backup',
            'jsas_last_backup'
        ];
        
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log('Suppression ancienne sauvegarde:', key);
                localStorage.removeItem(key);
            }
        });

        // Désactiver les fonctions globales d'urgence si elles existent
        if (window.emergencySave) {
            window.emergencySave = () => console.log('Ancien système désactivé');
        }
        if (window.checkEmergencyRestore) {
            window.checkEmergencyRestore = () => console.log('Ancien système désactivé');
        }
        if (window.loadEmergencyBackup) {
            window.loadEmergencyBackup = () => console.log('Ancien système désactivé');
        }
    }

    /**
     * Initialisation principale
     */
    function initAutoSaveSystem() {
        console.log('Initialisation du système de sauvegarde automatique...');
        
        // Désactiver l'ancien système en premier
        disableOldSaveSystems();
        
        // Configurer les listeners
        setupChangeListeners();
        setupBeforeUnloadSave();
        
        // Vérifier s'il y a des données à restaurer (après un délai)
        setTimeout(() => {
            const savedData = checkForSavedData();
            if (savedData && !isRestoringData) {
                console.log('Données de sauvegarde trouvées');
                showRestorePrompt(savedData);
            }
        }, CONFIG.SHOW_RESTORE_DELAY);
        
        console.log('Système de sauvegarde automatique initialisé');
    }

    /**
     * Fonction de nettoyage pour les tests
     */
    window.clearAutoSave = function() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        console.log('Sauvegarde automatique effacée');
    };

    /**
     * Fonction de debug
     */
    window.debugAutoSave = function() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        console.log('Debug sauvegarde automatique:', saved ? JSON.parse(saved) : 'Aucune sauvegarde');
    };

    // Auto-initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            disableOldSaveSystems();
            setTimeout(initAutoSaveSystem, 500);
        });
    } else {
        setTimeout(() => {
            disableOldSaveSystems();
            initAutoSaveSystem();
        }, 500);
    }

    // Exposer les fonctions publiques
    window.ImprovedAutoSave = {
        save: saveApplicationState,
        check: checkForSavedData,
        clear: () => localStorage.removeItem(CONFIG.STORAGE_KEY)
    };

})();