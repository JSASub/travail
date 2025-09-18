// jsas-unified-fix.js - Solution unifiée pour corriger tous les problèmes de synchronisation
// Remplace les 5 fichiers précédents par une approche simplifiée et fiable

(function() {
    'use strict';

    // ========================
    // 1. SYNCHRONISATION DOM ↔ VARIABLES GLOBALES
    // ========================
    
    function syncDataFromDOM() {
        console.log('🔄 Synchronisation DOM vers variables globales...');
        
        try {
            // Synchroniser les plongeurs depuis le DOM
            const listePlongeursDOM = document.getElementById('listePlongeurs');
            if (listePlongeursDOM) {
                const plongeurItems = listePlongeursDOM.querySelectorAll('.plongeur-item');
                
                if (plongeurItems.length > 0 && (!window.plongeurs || window.plongeurs.length === 0)) {
                    window.plongeurs = [];
                    
                    plongeurItems.forEach(item => {
                        const nomSpan = item.querySelector('.plongeur-nom');
                        const niveauSpan = item.querySelector('.plongeur-niveau');
                        const preSpan = item.querySelector('.plongeur-prerogatives');
                        
                        if (nomSpan && niveauSpan) {
                            const plongeur = {
                                nom: nomSpan.textContent.trim(),
                                niveau: niveauSpan.textContent.trim(),
                                pre: preSpan ? preSpan.textContent.replace(/[\[\]]/g, '').trim() : ''
                            };
                            
                            // Éviter les doublons
                            const exists = window.plongeurs.some(p => 
                                p.nom === plongeur.nom && p.niveau === plongeur.niveau
                            );
                            
                            if (!exists) {
                                window.plongeurs.push(plongeur);
                            }
                        }
                    });
                    
                    window.plongeursOriginaux = [...window.plongeurs];
                    console.log(`✅ Synchronisé ${window.plongeurs.length} plongeurs depuis DOM`);
                }
            }
            
            // Synchroniser les palanquées depuis le DOM
            const palanqueesContainer = document.getElementById('palanqueesContainer');
            if (palanqueesContainer) {
                const palanqueeElements = palanqueesContainer.querySelectorAll('.palanquee');
                
                if (palanqueeElements.length > 0) {
                    if (!window.palanquees) window.palanquees = [];
                    
                    // Nettoyer les palanquées vides
                    window.palanquees = window.palanquees.filter(pal => 
                        Array.isArray(pal) && pal.length > 0
                    );
                    
                    palanqueeElements.forEach((palElement, index) => {
                        const plongeurElements = palElement.querySelectorAll('.palanquee-plongeur-item');
                        
                        if (plongeurElements.length > 0) {
                            // Créer/mettre à jour la palanquée
                            if (!window.palanquees[index]) {
                                window.palanquees[index] = [];
                            }
                            
                            // Vider et reconstruire la palanquée
                            window.palanquees[index].length = 0;
                            
                            plongeurElements.forEach(plongeurEl => {
                                const nomSpan = plongeurEl.querySelector('.plongeur-nom');
                                const niveauSpan = plongeurEl.querySelector('.plongeur-niveau');
                                const preInput = plongeurEl.querySelector('.plongeur-prerogatives-editable');
                                
                                if (nomSpan && niveauSpan) {
                                    window.palanquees[index].push({
                                        nom: nomSpan.textContent.trim(),
                                        niveau: niveauSpan.textContent.trim(),
                                        pre: preInput ? preInput.value.trim() : ''
                                    });
                                }
                            });
                            
                            // Capturer les paramètres de plongée
                            const horaireInput = palElement.querySelector('input[type="time"]');
                            const profPrevueInputs = palElement.querySelectorAll('input[type="number"]');
                            const paliersInput = palElement.querySelector('input[placeholder*="Paliers"]');
                            
                            if (horaireInput) window.palanquees[index].horaire = horaireInput.value;
                            if (profPrevueInputs[0]) window.palanquees[index].profondeurPrevue = profPrevueInputs[0].value;
                            if (profPrevueInputs[1]) window.palanquees[index].dureePrevue = profPrevueInputs[1].value;
                            if (profPrevueInputs[2]) window.palanquees[index].profondeurRealisee = profPrevueInputs[2].value;
                            if (profPrevueInputs[3]) window.palanquees[index].dureeRealisee = profPrevueInputs[3].value;
                            if (paliersInput) window.palanquees[index].paliers = paliersInput.value;
                        }
                    });
                    
                    console.log(`✅ Synchronisé ${window.palanquees.length} palanquées depuis DOM`);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur synchronisation DOM:', error);
            return false;
        }
    }

    // ========================
    // 2. CAPTURE DONNÉES COMPLÈTE
    // ========================
    
    function captureCurrentState() {
        // Force la synchronisation avant capture
        syncDataFromDOM();
        
        const state = {
            timestamp: Date.now(),
            version: '4.0',
            metadata: {
                dp: getSelectedDPInfo(),
                date: document.getElementById('dp-date')?.value || '',
                lieu: document.getElementById('dp-lieu')?.value?.trim() || '',
                plongee: document.getElementById('dp-plongee')?.value || 'matin'
            },
            data: {
                plongeurs: window.plongeurs || [],
                palanquees: window.palanquees || [],
                plongeursOriginaux: window.plongeursOriginaux || []
            }
        };
        
        // Calculer les statistiques
        const plongeursEnListe = state.data.plongeurs.length;
        let plongeursEnPalanquees = 0;
        let palanqueesValides = 0;
        
        if (Array.isArray(state.data.palanquees)) {
            state.data.palanquees.forEach(pal => {
                if (Array.isArray(pal) && pal.length > 0) {
                    palanqueesValides++;
                    plongeursEnPalanquees += pal.length;
                }
            });
        }
        
        state.stats = {
            plongeursEnListe,
            plongeursEnPalanquees,
            palanqueesValides,
            totalGeneral: plongeursEnListe + plongeursEnPalanquees
        };
        
        console.log('📊 État capturé:', {
            plongeursEnListe: state.stats.plongeursEnListe,
            plongeursEnPalanquees: state.stats.plongeursEnPalanquees,
            palanqueesValides: state.stats.palanqueesValides,
            totalGeneral: state.stats.totalGeneral
        });
        
        return state;
    }

    function getSelectedDPInfo() {
        const dpSelect = document.getElementById('dp-select');
        if (!dpSelect || !dpSelect.value) return { nom: '', id: '', text: '' };
        
        const selectedOption = dpSelect.options[dpSelect.selectedIndex];
        return {
            nom: selectedOption.text.split(' (')[0] || '',
            id: dpSelect.value,
            text: selectedOption.text
        };
    }

    // ========================
    // 3. SAUVEGARDE AUTO SIMPLE ET FIABLE
    // ========================
    
    let autoSaveTimer = null;
    const AUTO_SAVE_DELAY = 2000; // 2 secondes
    const STORAGE_KEY = 'jsas_unified_save';
    
    function triggerAutoSave() {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        
        autoSaveTimer = setTimeout(() => {
            const state = captureCurrentState();
            
            // Ne sauvegarder que s'il y a des données significatives
            if (state.stats.totalGeneral >= 2) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    console.log(`💾 Auto-sauvegarde: ${state.stats.totalGeneral} plongeurs total`);
                    showSaveIndicator();
                } catch (error) {
                    console.error('Erreur auto-sauvegarde:', error);
                }
            }
        }, AUTO_SAVE_DELAY);
    }
    
    function showSaveIndicator() {
        let indicator = document.getElementById('unified-save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'unified-save-indicator';
            indicator.innerHTML = '✓ Sauvegardé';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 1500);
    }

    // ========================
    // 4. RESTAURATION FIABLE
    // ========================
    
    function checkForSavedData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return null;
            
            const state = JSON.parse(saved);
            
            // Vérifier l'âge (24h max)
            const age = Date.now() - state.timestamp;
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            
            // Vérifier qu'il y a des données significatives
            if (!state.stats || state.stats.totalGeneral < 2) {
                return null;
            }
            
            return state;
            
        } catch (error) {
            console.error('Erreur lecture sauvegarde:', error);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }
    
    function showRestoreDialog(savedState) {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 20000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin: 0 0 16px 0; color: #333;">
                        🔄 Session précédente trouvée
                    </h3>
                    <div style="margin: 16px 0; padding: 12px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-weight: 600; color: #28a745; margin-bottom: 8px;">
                            📊 ${savedState.stats.totalGeneral} plongeurs TOTAL
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            📋 ${savedState.stats.plongeursEnListe} en liste d'attente<br>
                            🏊 ${savedState.stats.plongeursEnPalanquees} assignés dans ${savedState.stats.palanqueesValides} palanquée(s)
                        </div>
                        ${savedState.metadata.dp.nom ? `
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dee2e6;">
                            <strong>👨‍💼 DP:</strong> ${savedState.metadata.dp.nom}<br>
                            ${savedState.metadata.date ? `<strong>📅 Date:</strong> ${new Date(savedState.metadata.date).toLocaleDateString('fr-FR')}<br>` : ''}
                            ${savedState.metadata.lieu ? `<strong>📍 Lieu:</strong> ${savedState.metadata.lieu}` : ''}
                        </div>
                        ` : ''}
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                        <button onclick="ignoreRestore()" style="
                            padding: 10px 20px;
                            border: 1px solid #ddd;
                            background: white;
                            color: #333;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Ignorer</button>
                        <button onclick="acceptRestore()" style="
                            padding: 10px 20px;
                            border: none;
                            background: #28a745;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Restaurer la session</button>
                    </div>
                </div>
            </div>
        `;
        
        // Fonctions pour les boutons
        window.acceptRestore = function() {
            restoreState(savedState);
            document.body.removeChild(dialog);
        };
        
        window.ignoreRestore = function() {
            localStorage.removeItem(STORAGE_KEY);
            document.body.removeChild(dialog);
        };
        
        document.body.appendChild(dialog);
    }
    
    function restoreState(savedState) {
        try {
            console.log('🔄 Début restauration...');
            
            // Restaurer les variables globales
            window.plongeurs = savedState.data.plongeurs || [];
            window.palanquees = savedState.data.palanquees || [];
            window.plongeursOriginaux = savedState.data.plongeursOriginaux || [];
            
            // Restaurer les champs d'interface
            if (savedState.metadata) {
                const dpSelect = document.getElementById('dp-select');
                const dpDate = document.getElementById('dp-date');
                const dpLieu = document.getElementById('dp-lieu');
                const dpPlongee = document.getElementById('dp-plongee');
                
                if (dpSelect && savedState.metadata.dp.id) {
                    dpSelect.value = savedState.metadata.dp.id;
                }
                if (dpDate && savedState.metadata.date) {
                    dpDate.value = savedState.metadata.date;
                }
                if (dpLieu && savedState.metadata.lieu) {
                    dpLieu.value = savedState.metadata.lieu;
                }
                if (dpPlongee && savedState.metadata.plongee) {
                    dpPlongee.value = savedState.metadata.plongee;
                }
            }
            
            // Forcer le re-rendu complet
            setTimeout(() => {
                if (typeof window.renderPlongeurs === 'function') window.renderPlongeurs();
                if (typeof window.renderPalanquees === 'function') window.renderPalanquees();
                if (typeof window.updateCompteurs === 'function') window.updateCompteurs();
                if (typeof window.updateAlertes === 'function') window.updateAlertes();
                if (typeof window.updateFloatingPlongeursList === 'function') window.updateFloatingPlongeursList();
            }, 100);
            
            // Supprimer la sauvegarde après restauration réussie
            localStorage.removeItem(STORAGE_KEY);
            
            // Message de succès
            showRestoreSuccess(savedState.stats);
            
            console.log('✅ Restauration terminée');
            
        } catch (error) {
            console.error('❌ Erreur restauration:', error);
            alert('Erreur lors de la restauration: ' + error.message);
        }
    }
    
    function showRestoreSuccess(stats) {
        const success = document.createElement('div');
        success.innerHTML = `✅ Session restaurée: ${stats.totalGeneral} plongeurs (${stats.palanqueesValides} palanquées)`;
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10001;
            font-weight: 500;
        `;
        
        document.body.appendChild(success);
        setTimeout(() => success.remove(), 4000);
    }

    // ========================
    // 5. SAUVEGARDE FIREBASE AMÉLIORÉE
    // ========================
    
    async function saveToFirebase() {
        const state = captureCurrentState();
        
        if (!state.metadata.dp.nom) {
            alert('⚠️ Veuillez sélectionner un Directeur de Plongée');
            return false;
        }
        
        if (!state.metadata.date) {
            alert('⚠️ Veuillez renseigner la date');
            return false;
        }
        
        if (!state.metadata.lieu) {
            alert('⚠️ Veuillez renseigner le lieu');
            return false;
        }
        
        if (!window.db || !window.firebaseConnected) {
            alert('⚠️ Firebase non connecté');
            return false;
        }
        
        if (state.stats.totalGeneral === 0) {
            alert('⚠️ Aucune donnée à sauvegarder');
            return false;
        }
        
        const sessionKey = `${state.metadata.date}_${state.metadata.dp.nom.split(' ')[0].substring(0,8)}_${state.metadata.plongee}`;
        
        try {
            // Préparer les données pour Firebase
            const firebaseData = {
                meta: {
                    dp: state.metadata.dp.nom,
                    date: state.metadata.date,
                    lieu: state.metadata.lieu,
                    plongee: state.metadata.plongee,
                    timestamp: Date.now(),
                    sessionKey: sessionKey,
                    version: state.version
                },
                plongeurs: state.data.plongeurs,
                palanquees: state.data.palanquees.map((pal, index) => {
                    if (!Array.isArray(pal)) return { index, plongeurs: [], parametres: {} };
                    
                    return {
                        index: index,
                        plongeurs: pal.map(p => ({
                            nom: p.nom || '',
                            niveau: p.niveau || '',
                            pre: p.pre || ''
                        })),
                        parametres: {
                            horaire: pal.horaire || '',
                            profondeurPrevue: pal.profondeurPrevue || '',
                            dureePrevue: pal.dureePrevue || '',
                            profondeurRealisee: pal.profondeurRealisee || '',
                            dureeRealisee: pal.dureeRealisee || '',
                            paliers: pal.paliers || ''
                        }
                    };
                }),
                stats: state.stats
            };
            
            // Sauvegarder dans Firebase
            await window.db.ref(`sessions/${sessionKey}`).set(firebaseData);
            
            // Sauvegarder aussi les infos DP
            await window.db.ref(`dpInfo/${sessionKey}`).set({
                nom: state.metadata.dp.nom,
                date: state.metadata.date,
                lieu: state.metadata.lieu,
                plongee: state.metadata.plongee,
                timestamp: Date.now(),
                validated: true,
                stats: state.stats
            });
            
            console.log('✅ Sauvegarde Firebase réussie:', sessionKey);
            
            // Message de confirmation
            showFirebaseSuccess(sessionKey, state.stats);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur Firebase:', error);
            alert(`❌ Erreur sauvegarde Firebase: ${error.message}`);
            return false;
        }
    }
    
    function showFirebaseSuccess(sessionKey, stats) {
        const success = document.createElement('div');
        success.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">✅</span>
                <div>
                    <div style="font-weight: 600;">Session sauvegardée avec succès!</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                        📊 ${stats.totalGeneral} plongeurs • 🏊 ${stats.palanqueesValides} palanquées • 🔑 ${sessionKey}
                    </div>
                </div>
            </div>
        `;
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(success);
        setTimeout(() => success.remove(), 6000);
    }

    // ========================
    // 6. SURVEILLANCE ET INITIALISATION
    // ========================
    
    function setupObservers() {
        // Observer les changements dans les listes
        const observers = [];
        
        ['listePlongeurs', 'palanqueesContainer'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const observer = new MutationObserver(() => {
                    triggerAutoSave();
                });
                observer.observe(container, { 
                    childList: true, 
                    subtree: true, 
                    attributes: true,
                    attributeFilter: ['value']
                });
                observers.push(observer);
            }
        });
        
        // Observer les champs de métadonnées
        ['dp-select', 'dp-date', 'dp-lieu', 'dp-plongee'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', triggerAutoSave);
                field.addEventListener('input', triggerAutoSave);
            }
        });
        
        console.log('👀 Surveillance activée');
        return observers;
    }
    
    function init() {
        console.log('🚀 Initialisation système unifié JSAS...');
        
        // Nettoyer les anciens systèmes
        ['jsas_auto_save', 'jsas_emergency_save', 'jsas_last_session'].forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 Supprimé ancienne sauvegarde: ${key}`);
            }
        });
        
        // Configurer la surveillance
        setupObservers();
        
        // Sauvegarder avant fermeture
        window.addEventListener('beforeunload', () => {
            const state = captureCurrentState();
            if (state.stats.totalGeneral >= 2) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                } catch (e) {
                    console.warn('Sauvegarde fermeture échouée');
                }
            }
        });
        
        // Vérifier s'il y a des données à restaurer
        setTimeout(() => {
            const savedData = checkForSavedData();
            if (savedData) {
                console.log('💾 Données de restauration trouvées');
                showRestoreDialog(savedData);
            }
        }, 500);
        
        // Exposer les fonctions globalement
        window.unifiedJSAS = {
            captureState: captureCurrentState,
            syncFromDOM: syncDataFromDOM,
            saveToFirebase: saveToFirebase,
            clearSave: () => localStorage.removeItem(STORAGE_KEY),
            debug: () => {
                const state = captureCurrentState();
                console.log('🔍 État actuel:', state);
                return state;
            }
        };
        
        console.log('✅ Système unifié initialisé');
    }

    // ========================
    // 7. REMPLACEMENT DU BOUTON VALIDER
    // ========================
    
    function setupSaveButton() {
        const validerBtn = document.getElementById('valider-dp');
        if (validerBtn) {
            // Remplacer le bouton pour éviter les conflits
            const newBtn = validerBtn.cloneNode(true);
            validerBtn.parentNode.replaceChild(newBtn, validerBtn);
            
            newBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                
                newBtn.disabled = true;
                newBtn.innerHTML = '⏳ Sauvegarde...';
                
                try {
                    const success = await saveToFirebase();
                    
                    if (success) {
                        newBtn.innerHTML = '✅ Sauvegardé!';
                        setTimeout(() => {
                            newBtn.disabled = false;
                            newBtn.textContent = 'Sauvegarder Session + DP';
                        }, 3000);
                    } else {
                        throw new Error('Échec sauvegarde');
                    }
                } catch (error) {
                    newBtn.innerHTML = '❌ Erreur';
                    setTimeout(() => {
                        newBtn.disabled = false;
                        newBtn.textContent = 'Sauvegarder Session + DP';
                    }, 2000);
                }
            });
        }
    }

    // Auto-initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                init();
                setupSaveButton();
            }, 200);
        });
    } else {
        setTimeout(() => {
            init();
            setupSaveButton();
        }, 200);
    }

})();