// restore-conflict-fix.js - Correctif pour éviter l'écrasement après restauration
// A ajouter AVANT le système de sauvegarde automatique dans votre index.html

(function() {
    'use strict';
    
    console.log('Correctif conflit restauration vs Firebase chargé');
    
    // Flag pour indiquer qu'une restauration est en cours
    let isRestoring = false;
    let restorationCompleted = false;
    
    // Intercepter la fonction de restauration
    const originalAcceptRestore = window.acceptRestore;
    window.acceptRestore = function(btn) {
        console.log('DÉBUT RESTAURATION - Blocage des autres chargements');
        isRestoring = true;
        restorationCompleted = false;
        
        // Appeler la fonction originale
        if (originalAcceptRestore) {
            originalAcceptRestore.call(this, btn);
        }
        
        // Marquer la restauration comme terminée après un délai
        setTimeout(() => {
            isRestoring = false;
            restorationCompleted = true;
            console.log('RESTAURATION TERMINÉE - Autorisation des autres chargements');
            
            // Programmer une nouvelle sauvegarde pour consolider
            setTimeout(() => {
                if (window.ImprovedAutoSave && typeof window.ImprovedAutoSave.save === 'function') {
                    console.log('Consolidation post-restauration');
                    window.ImprovedAutoSave.save();
                }
            }, 2000);
            
        }, 5000); // 5 secondes pour laisser le temps à la restauration de se terminer
    };
    
    // Intercepter loadFromFirebase pour éviter l'écrasement
    if (typeof window.loadFromFirebase === 'function') {
        const originalLoadFromFirebase = window.loadFromFirebase;
        
        window.loadFromFirebase = async function() {
            if (isRestoring) {
                console.log('BLOCAGE loadFromFirebase - Restauration en cours');
                return;
            }
            
            if (restorationCompleted) {
                console.log('BLOCAGE loadFromFirebase - Restauration récemment terminée');
                return;
            }
            
            console.log('Autorisation loadFromFirebase - Pas de conflit');
            return await originalLoadFromFirebase.call(this);
        };
        
        console.log('Fonction loadFromFirebase interceptée');
    }
    
    // Intercepter syncToDatabase pour éviter l'écrasement
    if (typeof window.syncToDatabase === 'function') {
        const originalSyncToDatabase = window.syncToDatabase;
        
        window.syncToDatabase = async function() {
            if (isRestoring) {
                console.log('BLOCAGE syncToDatabase - Restauration en cours');
                return;
            }
            
            console.log('Autorisation syncToDatabase');
            return await originalSyncToDatabase.call(this);
        };
        
        console.log('Fonction syncToDatabase interceptée');
    }
    
    // Intercepter initializeAppData si elle existe
    if (typeof window.initializeAppData === 'function') {
        const originalInitializeAppData = window.initializeAppData;
        
        window.initializeAppData = async function() {
            if (isRestoring) {
                console.log('BLOCAGE initializeAppData - Restauration en cours');
                return;
            }
            
            if (restorationCompleted) {
                console.log('BLOCAGE initializeAppData - Restauration récemment terminée');
                return;
            }
            
            console.log('Autorisation initializeAppData');
            return await originalInitializeAppData.call(this);
        };
        
        console.log('Fonction initializeAppData interceptée');
    }
    
    // Surveiller et bloquer les modifications non autorisées des variables globales
    function protectGlobalVariables() {
        let plongeursBackup = null;
        let palanqueesBackup = null;
        
        // Backup des données au début de la restauration
        window.addEventListener('beforeRestore', function() {
            if (window.plongeurs) plongeursBackup = [...window.plongeurs];
            if (window.palanquees) palanqueesBackup = [...window.palanquees];
        });
        
        // Surveillance continue pendant la restauration
        const protectionInterval = setInterval(() => {
            if (!isRestoring) return;
            
            // Vérifier si les données ont été écrasées
            const currentPlongeurs = window.plongeurs ? window.plongeurs.length : 0;
            const currentPalanquees = window.palanquees ? window.palanquees.length : 0;
            
            // Si les données ressemblent à un écrasement (retour aux 12 plongeurs)
            if (currentPlongeurs === 12 && currentPalanquees === 0) {
                console.warn('DÉTECTION ÉCRASEMENT - Restauration des données de backup');
                
                if (plongeursBackup) {
                    window.plongeurs = [...plongeursBackup];
                    console.log('Plongeurs restaurés depuis backup:', window.plongeurs.length);
                }
                
                if (palanqueesBackup) {
                    window.palanquees = [...palanqueesBackup];
                    console.log('Palanquées restaurées depuis backup:', window.palanquees.length);
                }
                
                // Re-rendre l'interface
                setTimeout(() => {
                    if (typeof window.renderPlongeurs === 'function') window.renderPlongeurs();
                    if (typeof window.renderPalanquees === 'function') window.renderPalanquees();
                    if (typeof window.updateCompteurs === 'function') window.updateCompteurs();
                }, 100);
            }
            
        }, 200); // Vérification toutes les 200ms
        
        // Arrêter la surveillance après la restauration
        setTimeout(() => {
            clearInterval(protectionInterval);
            console.log('Arrêt de la surveillance de protection');
        }, 10000);
    }
    
    // Démarrer la protection quand une restauration commence
    window.addEventListener('sessionRestored', protectGlobalVariables);
    
    // Override spécifique pour la fonction restoreData dans improved-auto-save
    function enhanceRestoreFunction() {
        // Chercher et modifier la fonction restoreData
        setTimeout(() => {
            // Émettre un événement avant la restauration
            const originalRestoreCall = window.restoreData;
            if (typeof originalRestoreCall === 'undefined') {
                // Si restoreData n'est pas globale, essayer de l'intercepter autrement
                console.log('Recherche de la fonction restoreData...');
                
                // Intercepter les appels à renderPlongeurs pendant la restauration
                let renderIntercepted = false;
                
                if (typeof window.renderPlongeurs === 'function' && !renderIntercepted) {
                    const originalRenderPlongeurs = window.renderPlongeurs;
                    
                    window.renderPlongeurs = function() {
                        if (isRestoring) {
                            console.log('PROTECTION renderPlongeurs pendant restauration');
                            
                            // Sauvegarder les données actuelles avant le rendu
                            const currentData = {
                                plongeurs: window.plongeurs ? [...window.plongeurs] : [],
                                palanquees: window.palanquees ? [...window.palanquees] : []
                            };
                            
                            // Appeler le rendu original
                            const result = originalRenderPlongeurs.call(this);
                            
                            // Vérifier si les données ont été modifiées de manière inattendue
                            setTimeout(() => {
                                const newPlongeursCount = window.plongeurs ? window.plongeurs.length : 0;
                                if (newPlongeursCount === 12 && currentData.plongeurs.length !== 12) {
                                    console.warn('PROTECTION: Données écrasées dans renderPlongeurs, restauration...');
                                    window.plongeurs = currentData.plongeurs;
                                    window.palanquees = currentData.palanquees;
                                }
                            }, 50);
                            
                            return result;
                        }
                        
                        return originalRenderPlongeurs.call(this);
                    };
                    
                    renderIntercepted = true;
                    console.log('renderPlongeurs intercepté pour protection');
                }
            }
        }, 1000);
    }
    
    enhanceRestoreFunction();
    
    // Reset du flag après un certain temps pour éviter les blocages permanents
    setInterval(() => {
        if (restorationCompleted) {
            const timeSinceCompletion = Date.now() - (window.lastRestorationTime || 0);
            if (timeSinceCompletion > 30000) { // 30 secondes
                restorationCompleted = false;
                console.log('Reset du flag restorationCompleted après timeout');
            }
        }
    }, 5000);
    
    // Marquer le temps de la dernière restauration
    window.addEventListener('sessionRestored', function() {
        window.lastRestorationTime = Date.now();
    });
    
    console.log('Système de protection contre l\'écrasement post-restauration activé');
    
})();