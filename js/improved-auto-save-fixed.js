// ps/improved-auto-save-fixed.js
// Système de sauvegarde automatique corrigé pour JSAS
// Version avec gestion du timing Firebase et stabilisation DOM

(function() {
    'use strict';

    // Configuration avec délais adaptés pour Firebase
    const CONFIG = {
        STORAGE_KEY: 'jsas_auto_save',
        MAX_AGE_HOURS: 24,
        MIN_DATA_THRESHOLD: 2,
        SAVE_DELAY: 2000,                    // Augmenté pour laisser le temps à Firebase
        SHOW_RESTORE_DELAY: 300,
        FIREBASE_LOADING_GRACE_PERIOD: 5000, // 5 secondes de grâce après chargement Firebase
        STABILITY_CHECK_INTERVAL: 500,       // Vérifier la stabilité toutes les 500ms
        MIN_STABILITY_DURATION: 2000         // Attendre 2s de stabilité avant sauvegarde
    };

    // Variables globales du module
    let autoSaveTimeout = null;
    let hasShownRestorePrompt = false;
    let isRestoringData = false;
    let firebaseLoadingDetected = false;
    let lastStableState = null;
    let stabilityTimer = null;
    let lastDataSnapshot = null;

    /**
     * NOUVEAU : Détecter si Firebase est en train de charger
     */
    function detectFirebaseLoading() {
        // Observer les logs Firebase dans la console
        const originalConsoleLog = console.log;
        console.log = function(...args) {
            const message = args[0];
            if (typeof message === 'string' && 
                (message.includes('Chargement des données depuis Firebase') ||
                 message.includes('loadFromFirebase') ||
                 message.includes('Plongeurs chargés:') ||
                 message.includes('Palanquées chargées:'))) {
                
                console.log('🔍 Chargement Firebase détecté, pause auto-save');
                firebaseLoadingDetected = true;
                
                // Arrêter la sauvegarde automatique pendant le chargement
                if (autoSaveTimeout) {
                    clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = null;
                }
                
                // Réactiver après la période de grâce
                setTimeout(() => {
                    firebaseLoadingDetected = false;
                    console.log('✅ Période de grâce Firebase terminée');
                }, CONFIG.FIREBASE_LOADING_GRACE_PERIOD);
            }
            
            return originalConsoleLog.apply(console, args);
        };
    }

    /**
     * NOUVEAU : Vérifier si l'état de l'application est stable
     */
    function checkApplicationStability() {
        const currentSnapshot = {
            plongeursVisible: document.querySelectorAll('#listePlongeurs li:not([style*="display: none"])').length,
            palanqueesVisible: document.querySelectorAll('.palanquee:not([style*="display: none"])').length,
            plongeursEnPalanquees: (() => {
                let total = 0;
                document.querySelectorAll('.palanquee:not([style*="display: none"])').forEach(pal => {
                    total += pal.querySelectorAll('.palanquee-plongeur-item:not([style*="display: none"])').length;
                });
                return total;
            })(),
            windowPlongeursLength: window.plongeurs ? window.plongeurs.length : 0,
            timestamp: Date.now()
        };

        // Comparer avec l'état précédent
        if (lastDataSnapshot) {
            const isStable = (
                currentSnapshot.plongeursVisible === lastDataSnapshot.plongeursVisible &&
                currentSnapshot.palanqueesVisible === lastDataSnapshot.palanqueesVisible &&
                currentSnapshot.plongeursEnPalanquees === lastDataSnapshot.plongeursEnPalanquees &&
                currentSnapshot.windowPlongeursLength === lastDataSnapshot.windowPlongeursLength
            );

            if (isStable) {
                if (!lastStableState) {
                    lastStableState = Date.now();
                    console.log('🔒 État stable détecté, démarrage du compteur...');
                } else if (Date.now() - lastStableState >= CONFIG.MIN_STABILITY_DURATION) {
                    // État stable depuis assez longtemps
                    return true;
                }
            } else {
                // État instable
                if (lastStableState) {
                    console.log('🔄 Instabilité détectée, reset du compteur');
                }
                lastStableState = null;
            }
        }

        lastDataSnapshot = currentSnapshot;
        return false;
    }

    /**
     * Vérifications sécurisées pour les variables globales
     */
    function safeGetPlongeurs() {
        console.log('🔍 Comptage PRÉCIS des plongeurs en liste depuis le DOM...');
        
        // Compter seulement les plongeurs VISIBLES dans la liste principale
        const listePlongeurs = document.getElementById('listePlongeurs');
        if (!listePlongeurs) {
            console.log('❌ Liste plongeurs introuvable');
            return [];
        }
        
        const plongeursElements = listePlongeurs.querySelectorAll('li:not([style*="display: none"])');
        console.log(`🔍 ${plongeursElements.length} éléments li VISIBLES dans la liste`);
        
        const plongeursValides = [];
        
        plongeursElements.forEach((li, index) => {
            // Vérifier que l'élément est vraiment visible
            const style = window.getComputedStyle(li);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return;
            }
            
            const text = li.textContent?.trim() || '';
            if (text.length > 0) {
                const parts = text.split(' - ');
                if (parts.length >= 2) {
                    plongeursValides.push({
                        nom: parts[0].trim(),
                        niveau: parts[1].trim(),
                        pre: parts[2] ? parts[2].replace(/[\[\]]/g, '').trim() : ''
                    });
                }
            }
        });
        
        console.log(`✅ ${plongeursValides.length} plongeurs VALIDES en liste`);
        
        // Fallback vers les variables globales si disponibles et cohérentes
        if (plongeursValides.length === 0 && window.plongeurs && Array.isArray(window.plongeurs)) {
            console.log(`🔄 Fallback vers window.plongeurs: ${window.plongeurs.length} plongeurs`);
            return window.plongeurs.filter(p => p && p.nom && p.nom.trim());
        }
        
        return plongeursValides;
    }

    function safeGetPalanquees() {
        console.log('🔍 Comptage PRÉCIS des palanquées depuis le DOM...');
        
        // Compter uniquement les palanquées DOM VISIBLES avec des plongeurs réels
        const palanqueesDOM = document.querySelectorAll('.palanquee:not([style*="display: none"])');
        console.log(`🔍 ${palanqueesDOM.length} éléments .palanquee VISIBLES trouvés`);
        
        if (palanqueesDOM.length === 0) {
            return [];
        }
        
        const palanqueesValides = [];
        let totalPlongeursComptes = 0;
        
        palanqueesDOM.forEach((palanqueeEl, index) => {
            // Vérifier que l'élément est vraiment visible
            const style = window.getComputedStyle(palanqueeEl);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return;
            }
            
            // Chercher les plongeurs VISIBLES seulement
            const plongeursEls = palanqueeEl.querySelectorAll('.palanquee-plongeur-item:not([style*="display: none"])');
            console.log(`  Palanquée ${index + 1}: ${plongeursEls.length} plongeurs visibles`);
            
            if (plongeursEls.length > 0) {
                const plongeurs = [];
                
                plongeursEls.forEach(plongeurEl => {
                    // Vérifier aussi que le plongeur est visible
                    const plongeurStyle = window.getComputedStyle(plongeurEl);
                    if (plongeurStyle.display === 'none' || plongeurStyle.visibility === 'hidden') {
                        return;
                    }
                    
                    const nom = plongeurEl.querySelector('.plongeur-nom')?.textContent?.trim() || '';
                    const niveau = plongeurEl.querySelector('.plongeur-niveau')?.textContent?.trim() || '';
                    const pre = plongeurEl.querySelector('.plongeur-prerogatives-editable')?.value?.trim() || '';
                    
                    if (nom && nom.length > 0) {
                        plongeurs.push({ nom, niveau, pre });
                        totalPlongeursComptes++;
                    }
                });
                
                if (plongeurs.length > 0) {
                    palanqueesValides.push(plongeurs);
                }
            }
        });
        
        console.log(`✅ ${palanqueesValides.length} palanquées VALIDES avec ${totalPlongeursComptes} plongeurs TOTAL`);
        return palanqueesValides;
    }

    function safeGetPlongeursOriginaux() {
        return (window.plongeursOriginaux && Array.isArray(window.plongeursOriginaux)) ? window.plongeursOriginaux : [];
    }

    /**
     * NOUVEAU : Sauvegarder l'état complet de l'application AVEC STABILITÉ
     */
    function saveApplicationState() {
        try {
            // 🚫 Ne pas sauvegarder si Firebase est en cours de chargement
            if (firebaseLoadingDetected) {
                console.log('⏸️ Sauvegarde bloquée: Firebase en cours de chargement');
                return;
            }

            // 🚫 Ne pas sauvegarder si l'état n'est pas stable
            if (!checkApplicationStability()) {
                console.log('⏸️ Sauvegarde bloquée: État instable');
                // Reprogrammer une vérification
                setTimeout(() => {
                    if (!firebaseLoadingDetected) {
                        triggerAutoSave();
                    }
                }, CONFIG.STABILITY_CHECK_INTERVAL);
                return;
            }

            console.log('💾 Sauvegarde avec état stable confirmé');

            // Récupérer les données de manière sécurisée
            const plongeurs = safeGetPlongeurs();
            const palanquees = safeGetPalanquees();
            const dpSelect = document.getElementById('dp-select');
            const dpDate = document.getElementById('dp-date');
            const dpLieu = document.getElementById('dp-lieu');
            
            // Calculer les totaux
            const plongeursInPalanquees = palanquees.reduce((total, pal) => total + (Array.isArray(pal) ? pal.length : 0), 0);
            const totalReel = plongeurs.length + plongeursInPalanquees;
            
            console.log(`💾 Sauvegarde STABILISÉE: ${plongeurs.length} + ${plongeursInPalanquees} = ${totalReel} total`);
            
            // Ne sauvegarder que s'il y a suffisamment de données RÉELLES
            if (totalReel < CONFIG.MIN_DATA_THRESHOLD) {
                console.log(`⏸️ Pas assez de données réelles pour la sauvegarde (${totalReel} < ${CONFIG.MIN_DATA_THRESHOLD})`);
                return;
            }

            // Compter les données significatives
            let dataCount = totalReel;
            if (dpSelect && dpSelect.value) dataCount++;
            if (dpDate && dpDate.value) dataCount++;
            if (dpLieu && dpLieu.value && dpLieu.value.trim()) dataCount++;

            // Capturer l'état complet
            const appState = {
                timestamp: Date.now(),
                version: '1.2', // Version avec gestion stabilité
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
                    nombrePalanquees: palanquees.length,
                    totalGeneral: totalReel,
                    stabilityCheck: {
                        timestamp: Date.now(),
                        stableSince: lastStableState,
                        stabilityDuration: lastStableState ? Date.now() - lastStableState : 0
                    }
                }
            };

            // Sauvegarder dans localStorage
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(appState));
            
            console.log('✅ Sauvegarde automatique STABLE effectuée:', {
                plongeursEnListe: appState.stats.totalPlongeurs,
                plongeursEnPalanquees: appState.stats.totalEnPalanquees,
                totalGeneral: appState.stats.totalGeneral,
                palanquees: appState.stats.nombrePalanquees,
                stabilityDuration: Math.round(appState.stats.stabilityCheck.stabilityDuration / 1000) + 's',
                dp: appState.metadata.dp.selectedText || 'Non selectionné'
            });

            // Afficher brièvement un indicateur de sauvegarde
            showSaveIndicator();

        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde automatique:', error);
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
        }, 1500);
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
                console.log('⏰ Données de sauvegarde expirées, suppression');
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                return null;
            }

            // Vérifier qu'il y a des données significatives
            const totalData = (appState.stats && appState.stats.totalGeneral ? appState.stats.totalGeneral : 
                              (appState.stats.totalPlongeurs || 0) + (appState.stats.totalEnPalanquees || 0));
            
            if (totalData < CONFIG.MIN_DATA_THRESHOLD) {
                console.log('⏸️ Pas assez de données significatives dans la sauvegarde');
                return null;
            }

            // 🔍 NOUVEAU : Vérifier la stabilité de la sauvegarde
            if (appState.stats && appState.stats.stabilityCheck) {
                const stabilityDuration = appState.stats.stabilityCheck.stabilityDuration || 0;
                if (stabilityDuration < CONFIG.MIN_STABILITY_DURATION) {
                    console.log(`⚠️ Sauvegarde instable détectée (stable pendant ${Math.round(stabilityDuration/1000)}s seulement), suppression`);
                    localStorage.removeItem(CONFIG.STORAGE_KEY);
                    return null;
                }
                console.log(`✅ Sauvegarde stable confirmée (stable pendant ${Math.round(stabilityDuration/1000)}s)`);
            }

            return appState;
            
        } catch (error) {
            console.error('❌ Erreur lors de la lecture de la sauvegarde:', error);
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
            console.log('🔄 Restauration de l\'état de l\'application...');

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
                    const optionById = dpSelect.querySelector(`option[value="${appState.metadata.dp.selectedId}"]`);
                    if (optionById) {
                        dpSelect.value = appState.metadata.dp.selectedId;
                        console.log('✅ DP restauré par ID:', appState.metadata.dp.selectedText);
                    } else {
                        const options = Array.from(dpSelect.options);
                        const optionByText = options.find(opt => 
                            opt.text.includes(appState.metadata.dp.selectedText) ||
                            appState.metadata.dp.selectedText.includes(opt.text)
                        );
                        if (optionByText) {
                            dpSelect.value = optionByText.value;
                            console.log('✅ DP restauré par texte:', optionByText.text);
                        } else {
                            console.warn('⚠️ DP non trouvé:', appState.metadata.dp.selectedText);
                        }
                    }
                }
            }

            // 4. Rafraîchir l'interface
            await refreshInterface();

            // 5. Supprimer la sauvegarde après restauration réussie
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            
            console.log('✅ Restauration terminée avec succès');
            showRestoreSuccessMessage(appState);

        } catch (error) {
            console.error('❌ Erreur lors de la restauration:', error);
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
                    setTimeout(checkDP, 50);
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
            console.error('❌ Erreur lors du rafraîchissement:', error);
        }
    }

    /**
     * Afficher une notification élégante de proposition de restauration
     */
    function showRestorePrompt(appState) {
        if (hasShownRestorePrompt) return;
        hasShownRestorePrompt = true;

        // Calculer les statistiques détaillées
        const plongeursEnListe = appState.stats?.totalPlongeurs || 0;
        const plongeursEnPalanquees = appState.stats?.totalEnPalanquees || 0;
        const nombrePalanquees = appState.stats?.nombrePalanquees || 0;
        const totalGeneral = appState.stats?.totalGeneral || (plongeursEnListe + plongeursEnPalanquees);
        
        // Informations de stabilité
        const stabilityInfo = appState.stats?.stabilityCheck ? 
            `Stabilité: ${Math.round(appState.stats.stabilityCheck.stabilityDuration / 1000)}s` : 
            'Stabilité: non vérifiée';

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
                        <div class="restore-stats-header">
                            <strong>📊 ${totalGeneral} plongeur${totalGeneral > 1 ? 's' : ''} TOTAL</strong>
                        </div>
                        <div class="restore-stats-detail">
                            🔍 ${plongeursEnListe} en liste d'attente<br>
                            🏠 ${plongeursEnPalanquees} assigné${plongeursEnPalanquees > 1 ? 's' : ''} en ${nombrePalanquees} palanquée${nombrePalanquees > 1 ? 's' : ''}
                        </div>
                        <div class="restore-separator"></div>
                        <div class="restore-dp">
                            <strong>🎯 DP:</strong> ${appState.metadata && appState.metadata.dp ? appState.metadata.dp.selectedText || 'Non sélectionné' : 'Non défini'}
                        </div>
                        <div class="restore-date">
                            <strong>📅 Date:</strong> ${appState.metadata && appState.metadata.date ? new Date(appState.metadata.date).toLocaleDateString('fr-FR') : 'Non définie'}
                        </div>
                        ${appState.metadata && appState.metadata.lieu ? `<div class="restore-lieu"><strong>📍 Lieu:</strong> ${appState.metadata.lieu}</div>` : ''}
                        <div class="restore-age">
                            ⏰ Sauvegardée il y a ${formatTimeDifference(Date.now() - appState.timestamp)}<br>
                            <small style="color: #28a745;">🔒 ${stabilityInfo}</small>
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
                    max-width: 420px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    z-index: 10000;
                    border: 2px solid #007bff;
                    animation: slideInRight 0.3s ease;
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
                    padding: 16px;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .restore-stats-header {
                    color: #28a745;
                    font-size: 15px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    text-align: center;
                    background: #e8f5e8;
                    padding: 8px;
                    border-radius: 6px;
                }
                .restore-stats-detail {
                    color: #495057;
                    font-size: 13px;
                    margin-bottom: 12px;
                    padding-left: 8px;
                    border-left: 3px solid #28a745;
                    background: #f1f8f1;
                    padding: 8px 8px 8px 12px;
                    border-radius: 0 4px 4px 0;
                }
                .restore-separator {
                    height: 1px;
                    background: #dee2e6;
                    margin: 12px 0;
                }
                .restore-dp, .restore-date, .restore-lieu {
                    color: #495057;
                    margin-bottom: 6px;
                    font-size: 13px;
                }
                .restore-dp {
                    color: #007bff;
                }
                .restore-date {
                    color: #6f42c1;
                }
                .restore-lieu {
                    color: #fd7e14;
                }
                .restore-age {
                    color: #6c757d;
                    font-size: 12px;
                    font-style: italic;
                    margin-top: 8px;
                    text-align: center;
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
                    padding: 10px 18px;
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
            }, 500);
        };

        // Fonction ignoreRestore avec synchronisation DOM
        window.ignoreRestore = function(btn) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            const notification = btn.closest('.restore-notification');
            if (notification) notification.remove();
            
            // Synchroniser les données DOM vers les variables globales après refus
            setTimeout(() => {
                console.log('🔄 Synchronisation DOM après refus de restauration...');
                
                const listDOM = document.getElementById('listePlongeurs');
                if (listDOM && listDOM.children.length > 0) {
                    window.plongeurs = window.plongeurs || [];
                    
                    if (window.plongeurs.length === 0) {
                        console.log('🔄 Reconstruction des plongeurs depuis le DOM...');
                        
                        Array.from(listDOM.children).forEach(li => {
                            const text = li.textContent || li.innerText;
                            const parts = text.split(' - ');
                            
                            if (parts.length >= 2) {
                                window.plongeurs.push({
                                    nom: parts[0].trim(),
                                    niveau: parts[1].trim(),
                                    pre: parts[2] ? parts[2].replace(/[\[\]]/g, '').trim() : ''
                                });
                            }
                        });
                        
                        window.plongeursOriginaux = [...window.plongeurs];
                        console.log('✅ Reconstruction terminée:', window.plongeurs.length, 'plongeurs');
                    }
                }
                
                if (typeof updateCompteurs === 'function') {
                    updateCompteurs();
                    console.log('📊 Compteurs mis à jour après refus restauration');
                }
                
                if (typeof updateFloatingPlongeursList === 'function') {
                    updateFloatingPlongeursList();
                }
            }, 500);
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
     * Messages de feedback améliorés
     */
    function showRestoreSuccessMessage(appState) {
        const plongeursEnListe = appState.stats?.totalPlongeurs || 0;
        const plongeursEnPalanquees = appState.stats?.totalEnPalanquees || 0;
        const nombrePalanquees = appState.stats?.nombrePalanquees || 0;
        const totalGeneral = appState.stats?.totalGeneral || (plongeursEnListe + plongeursEnPalanquees);
        
        const message = document.createElement('div');
        message.className = 'restore-success-message';
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px;">✅</span>
                <div>
                    <div style="font-weight: 600;">Session restaurée avec succès!</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                        📊 ${totalGeneral} plongeur${totalGeneral > 1 ? 's' : ''} total • 🏠 ${nombrePalanquees} palanquée${nombrePalanquees > 1 ? 's' : ''}
                    </div>
                </div>
            </div>
        `;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideInRight 0.2s ease;
            max-width: 380px;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 4000);
    }

    function showRestoreErrorMessage(error) {
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px;">⚠️</span>
                <div>
                    <div style="font-weight: 600;">Erreur de restauration</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">${error.message}</div>
                </div>
            </div>
        `;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 380px;
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
     * NOUVEAU : Déclencher une sauvegarde automatique avec gestion de stabilité
     */
    function triggerAutoSave() {
        if (isRestoringData || firebaseLoadingDetected) {
            console.log('⏸️ Sauvegarde bloquée: restauration en cours ou Firebase loading');
            return;
        }
        
        // Annuler la sauvegarde précédente si elle est en attente
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        // Programmer une nouvelle sauvegarde avec délai
        autoSaveTimeout = setTimeout(() => {
            saveApplicationState();
            autoSaveTimeout = null;
        }, CONFIG.SAVE_DELAY);
    }

    /**
     * Surveiller les changements dans l'application
     */
    function setupChangeListeners() {
        // Détecter le chargement Firebase
        detectFirebaseLoading();
        
        // Observer les changements dans les listes DOM
        const plongeursList = document.getElementById('listePlongeurs');
        const palanqueesContainer = document.getElementById('palanqueesContainer');
        
        if (plongeursList) {
            const observer = new MutationObserver(() => {
                if (!firebaseLoadingDetected) {
                    triggerAutoSave();
                }
            });
            observer.observe(plongeursList, { childList: true, subtree: true });
        }
        
        if (palanqueesContainer) {
            const observer = new MutationObserver(() => {
                if (!firebaseLoadingDetected) {
                    triggerAutoSave();
                }
            });
            observer.observe(palanqueesContainer, { childList: true, subtree: true });
        }

        // Observer les changements dans les champs de métadonnées
        const fieldsToWatch = ['dp-select', 'dp-date', 'dp-lieu', 'dp-plongee'];
        fieldsToWatch.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', () => {
                    if (!firebaseLoadingDetected) {
                        triggerAutoSave();
                    }
                });
                field.addEventListener('input', () => {
                    if (!firebaseLoadingDetected) {
                        triggerAutoSave();
                    }
                });
            }
        });

        // Observer les changements dans les variables globales avec vérification de stabilité
        let lastPlongeursCount = safeGetPlongeurs().length;
        let lastPalanqueesCount = safeGetPalanquees().length;
        
        setInterval(() => {
            if (firebaseLoadingDetected) return;
            
            const currentPlongeursCount = safeGetPlongeurs().length;
            const currentPalanqueesCount = safeGetPalanquees().length;
            
            if (currentPlongeursCount !== lastPlongeursCount || 
                currentPalanqueesCount !== lastPalanqueesCount) {
                
                lastPlongeursCount = currentPlongeursCount;
                lastPalanqueesCount = currentPalanqueesCount;
                
                // Reset la stabilité lors d'un changement
                lastStableState = null;
                
                triggerAutoSave();
            }
        }, 1000);

        console.log('👁️ Surveillance des changements activée avec gestion Firebase/stabilité');
    }

    /**
     * Sauvegarder avant fermeture de page
     */
    function setupBeforeUnloadSave() {
        window.addEventListener('beforeunload', (e) => {
            if (!firebaseLoadingDetected) {
                saveApplicationState();
            }
        });

        // Sauvegarder également lors de la perte de focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !firebaseLoadingDetected) {
                saveApplicationState();
            }
        });
    }

    /**
     * Désactiver les anciens systèmes de sauvegarde
     */
    function disableOldSaveSystems() {
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
                console.log('🗑️ Suppression ancienne sauvegarde:', key);
                localStorage.removeItem(key);
            }
        });

        if (window.emergencySave) {
            window.emergencySave = () => console.log('🚫 Ancien système désactivé');
        }
        if (window.checkEmergencyRestore) {
            window.checkEmergencyRestore = () => console.log('🚫 Ancien système désactivé');
        }
        if (window.loadEmergencyBackup) {
            window.loadEmergencyBackup = () => console.log('🚫 Ancien système désactivé');
        }
    }

    /**
     * Initialisation principale
     */
    function initAutoSaveSystem() {
        console.log('🚀 Initialisation du système de sauvegarde automatique avec gestion stabilité...');
        
        disableOldSaveSystems();
        setupChangeListeners();
        setupBeforeUnloadSave();
        
        // Vérifier s'il y a des données à restaurer (avec délai pour laisser Firebase se charger)
        setTimeout(() => {
            if (!firebaseLoadingDetected) {
                const savedData = checkForSavedData();
                if (savedData && !isRestoringData) {
                    console.log('💾 Données de sauvegarde STABLES trouvées');
                    showRestorePrompt(savedData);
                }
            }
        }, CONFIG.SHOW_RESTORE_DELAY);
        
        console.log('✅ Système de sauvegarde automatique avec stabilité initialisé');
    }

    /**
     * Fonction de nettoyage pour les tests
     */
    window.clearAutoSave = function() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        console.log('🗑️ Sauvegarde automatique effacée');
    };

    /**
     * Fonction de debug améliorée avec infos stabilité
     */
    window.debugAutoSave = function() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        console.log('=== DEBUG SAUVEGARDE AUTOMATIQUE ===');
        
        if (saved) {
            const data = JSON.parse(saved);
            console.log('💾 Données sauvegardées:', data);
            
            if (data.stats && data.stats.stabilityCheck) {
                console.log('🔒 Info stabilité:', {
                    stableSince: new Date(data.stats.stabilityCheck.stableSince),
                    stabilityDuration: Math.round(data.stats.stabilityCheck.stabilityDuration / 1000) + 's'
                });
            }
        } else {
            console.log('❌ Aucune sauvegarde trouvée');
        }
        
        console.log('🔄 État actuel:', {
            firebaseLoadingDetected,
            lastStableState: lastStableState ? new Date(lastStableState) : null,
            stabilityDuration: lastStableState ? Math.round((Date.now() - lastStableState) / 1000) + 's' : 'N/A'
        });
        
        return checkApplicationStability();
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
        clear: () => localStorage.removeItem(CONFIG.STORAGE_KEY),
        disable: () => {
            firebaseLoadingDetected = true;
            console.log('⏸️ Auto-save manuellement désactivé');
        },
        enable: () => {
            firebaseLoadingDetected = false;
            console.log('▶️ Auto-save manuellement réactivé');
        }
    };

})();