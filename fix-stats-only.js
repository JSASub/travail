// fix-stats-only.js
// Correction ciblée uniquement sur les statistiques de sauvegarde
// À ajouter SANS supprimer les autres fichiers

(function() {
    'use strict';

    // Fonction pour compter les vrais plongeurs depuis le DOM
    function getRealStats() {
        const stats = {
            plongeursEnListe: 0,
            plongeursEnPalanquees: 0,
            nombrePalanquees: 0,
            totalGeneral: 0
        };

        try {
            // Compter plongeurs en liste principale
            const listePlongeurs = document.getElementById('listePlongeurs');
            if (listePlongeurs) {
                stats.plongeursEnListe = listePlongeurs.querySelectorAll('.plongeur-item').length;
            }

            // Compter plongeurs et palanquées depuis le DOM
            const palanquees = document.querySelectorAll('.palanquee');
            stats.nombrePalanquees = palanquees.length;

            palanquees.forEach(palanquee => {
                const plongeursDansPalanquee = palanquee.querySelectorAll('.palanquee-plongeur-item').length;
                stats.plongeursEnPalanquees += plongeursDansPalanquee;
            });

            stats.totalGeneral = stats.plongeursEnListe + stats.plongeursEnPalanquees;

            console.log('Stats réelles:', stats);
            return stats;

        } catch (error) {
            console.error('Erreur calcul stats:', error);
            return stats;
        }
    }

    // Fonction pour synchroniser les données avant sauvegarde
    function syncDataBeforeSave() {
        const realStats = getRealStats();
        
        // Mettre à jour window.plongeurs si désynchronisé
        const listePlongeurs = document.getElementById('listePlongeurs');
        if (listePlongeurs && realStats.plongeursEnListe > 0) {
            const plongeurItems = listePlongeurs.querySelectorAll('.plongeur-item');
            
            if (!window.plongeurs || window.plongeurs.length !== realStats.plongeursEnListe) {
                console.log('Resynchronisation plongeurs en cours...');
                window.plongeurs = [];
                
                plongeurItems.forEach(item => {
                    const nomEl = item.querySelector('.plongeur-nom');
                    const niveauEl = item.querySelector('.plongeur-niveau');
                    const preEl = item.querySelector('.plongeur-prerogatives');
                    
                    if (nomEl && niveauEl) {
                        window.plongeurs.push({
                            nom: nomEl.textContent.trim(),
                            niveau: niveauEl.textContent.trim(),
                            pre: preEl ? preEl.textContent.replace(/[\[\]]/g, '').trim() : ''
                        });
                    }
                });
                
                window.plongeursOriginaux = [...window.plongeurs];
                console.log(`Plongeurs synchronisés: ${window.plongeurs.length}`);
            }
        }

        // Mettre à jour window.palanquees si désynchronisé
        const palanqueeElements = document.querySelectorAll('.palanquee');
        if (palanqueeElements.length > 0) {
            if (!window.palanquees) window.palanquees = [];
            
            // Vérifier chaque palanquée
            palanqueeElements.forEach((palEl, index) => {
                const plongeurItems = palEl.querySelectorAll('.palanquee-plongeur-item');
                
                if (!window.palanquees[index]) {
                    window.palanquees[index] = [];
                }
                
                // Si le nombre de plongeurs diffère, resynchroniser
                if (window.palanquees[index].length !== plongeurItems.length) {
                    console.log(`Resynchronisation palanquée ${index + 1}...`);
                    window.palanquees[index] = [];
                    
                    plongeurItems.forEach(item => {
                        const nomEl = item.querySelector('.plongeur-nom');
                        const niveauEl = item.querySelector('.plongeur-niveau');
                        const preInput = item.querySelector('.plongeur-prerogatives-editable');
                        
                        if (nomEl && niveauEl) {
                            window.palanquees[index].push({
                                nom: nomEl.textContent.trim(),
                                niveau: niveauEl.textContent.trim(),
                                pre: preInput ? preInput.value.trim() : ''
                            });
                        }
                    });
                    
                    // Capturer les paramètres de la palanquée
                    const inputs = palEl.querySelectorAll('input');
                    inputs.forEach(input => {
                        const type = input.type;
                        const placeholder = input.placeholder || '';
                        const value = input.value;
                        
                        if (type === 'time') {
                            window.palanquees[index].horaire = value;
                        } else if (placeholder.includes('Prof. prévue')) {
                            window.palanquees[index].profondeurPrevue = value;
                        } else if (placeholder.includes('Durée prévue')) {
                            window.palanquees[index].dureePrevue = value;
                        } else if (placeholder.includes('Prof. réalisée')) {
                            window.palanquees[index].profondeurRealisee = value;
                        } else if (placeholder.includes('Durée réalisée')) {
                            window.palanquees[index].dureeRealisee = value;
                        } else if (placeholder.includes('Paliers')) {
                            window.palanquees[index].paliers = value;
                        }
                    });
                }
            });
        }

        return realStats;
    }

    // Intercepter les fonctions de sauvegarde existantes
    function patchSaveFunctions() {
        // Patch pour saveSessionData
        if (typeof window.saveSessionData === 'function') {
            const originalSave = window.saveSessionData;
            window.saveSessionData = async function() {
                console.log('🔧 Correction des statistiques avant sauvegarde...');
                const realStats = syncDataBeforeSave();
                
                console.log('Stats corrigées:', {
                    plongeursEnListe: realStats.plongeursEnListe,
                    plongeursEnPalanquees: realStats.plongeursEnPalanquees,
                    nombrePalanquees: realStats.nombrePalanquees,
                    totalGeneral: realStats.totalGeneral
                });
                
                return await originalSave.call(this);
            };
        }

        // Patch pour la fonction de sauvegarde auto
        if (typeof window.ImprovedAutoSave === 'object' && window.ImprovedAutoSave.save) {
            const originalAutoSave = window.ImprovedAutoSave.save;
            window.ImprovedAutoSave.save = function() {
                syncDataBeforeSave();
                return originalAutoSave.call(this);
            };
        }

        // Patch pour updateCompteurs
        if (typeof window.updateCompteurs === 'function') {
            const originalUpdate = window.updateCompteurs;
            window.updateCompteurs = function() {
                const realStats = getRealStats();
                
                const compteurPlongeurs = document.getElementById('compteur-plongeurs');
                if (compteurPlongeurs) {
                    compteurPlongeurs.textContent = `(${realStats.plongeursEnListe})`;
                }
                
                const compteurPalanquees = document.getElementById('compteur-palanquees');
                if (compteurPalanquees) {
                    compteurPalanquees.textContent = `(${realStats.plongeursEnPalanquees} plongeurs dans ${realStats.nombrePalanquees} palanquées)`;
                }
                
                return originalUpdate.call(this);
            };
        }

        console.log('✅ Fonctions de sauvegarde corrigées');
    }

    // Surveiller et corriger les messages d'alerte incorrects
    function fixAlertMessages() {
        const originalAlert = window.alert;
        window.alert = function(message) {
            if (typeof message === 'string' && (message.includes('0 palanquée') || message.includes('7 plongeurs'))) {
                const realStats = getRealStats();
                const correctedMessage = message.replace(
                    /\d+\s*plongeurs?\s+dans\s+\d+\s+palanquées?/gi,
                    `${realStats.plongeursEnPalanquees} plongeurs dans ${realStats.nombrePalanquees} palanquées`
                );
                
                console.log('Message corrigé:', correctedMessage);
                return originalAlert.call(this, correctedMessage);
            }
            return originalAlert.call(this, message);
        };

        const originalConfirm = window.confirm;
        window.confirm = function(message) {
            if (typeof message === 'string' && (message.includes('0 palanquée') || message.includes('7 plongeurs'))) {
                const realStats = getRealStats();
                const correctedMessage = message.replace(
                    /\d+\s*plongeurs?\s+dans\s+\d+\s+palanquées?/gi,
                    `${realStats.plongeursEnPalanquees} plongeurs dans ${realStats.nombrePalanquees} palanquées`
                );
                
                console.log('Confirmation corrigée:', correctedMessage);
                return originalConfirm.call(this, correctedMessage);
            }
            return originalConfirm.call(this, message);
        };
    }

    // Fonction pour forcer la synchronisation manuelle
    window.forceSyncJSAS = function() {
        const realStats = syncDataBeforeSave();
        console.log('🔄 Synchronisation forcée:', realStats);
        
        if (typeof window.updateCompteurs === 'function') {
            window.updateCompteurs();
        }
        
        return realStats;
    };

    // Fonction de diagnostic
    window.diagJSAS = function() {
        const realStats = getRealStats();
        const memoryStats = {
            plongeurs: window.plongeurs ? window.plongeurs.length : 0,
            palanquees: window.palanquees ? window.palanquees.length : 0
        };
        
        console.log('📊 DIAGNOSTIC JSAS');
        console.log('DOM (réel):', realStats);
        console.log('Mémoire:', memoryStats);
        
        if (realStats.totalGeneral !== (memoryStats.plongeurs + realStats.plongeursEnPalanquees)) {
            console.log('⚠️ DÉSYNCHRONISATION DÉTECTÉE');
            console.log('💡 Exécutez: forceSyncJSAS()');
        } else {
            console.log('✅ Données synchronisées');
        }
        
        return { realStats, memoryStats };
    };

    // Initialisation
    function init() {
        console.log('🔧 Initialisation correctif statistiques...');
        
        // Attendre que les autres scripts soient chargés
        setTimeout(() => {
            patchSaveFunctions();
            fixAlertMessages();
            
            // Forcer une première synchronisation
            setTimeout(() => {
                syncDataBeforeSave();
                if (typeof window.updateCompteurs === 'function') {
                    window.updateCompteurs();
                }
            }, 1000);
            
        }, 500);
        
        console.log('✅ Correctif statistiques installé');
        console.log('💡 Utilisez diagJSAS() pour diagnostiquer');
        console.log('💡 Utilisez forceSyncJSAS() pour forcer la sync');
    }

    // Auto-initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();