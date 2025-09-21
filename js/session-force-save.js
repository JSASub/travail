// session-force-save.js - Module pour forcer la sauvegarde après chargement session
// A ajouter à la fin de votre index.html APRÈS tous les autres scripts

(function() {
    'use strict';
    
    console.log('🔄 Module de sauvegarde forcée après session chargé');
    
    // Fonction pour forcer la sauvegarde après chargement
    function forceSaveAfterLoad() {
        console.log('🔄 Force sauvegarde après chargement session...');
        
        // Attendre que tout soit rendu
        setTimeout(() => {
            // Vérifier qu'il y a des données significatives
            const plongeursCount = window.plongeurs ? window.plongeurs.length : 0;
            const palanqueesCount = window.palanquees ? window.palanquees.length : 0;
            
            let totalPlongeurs = plongeursCount;
            if (window.palanquees && Array.isArray(window.palanquees)) {
                window.palanquees.forEach(pal => {
                    if (Array.isArray(pal)) {
                        totalPlongeurs += pal.length;
                    }
                });
            }
            
            console.log(`📊 Données détectées: ${plongeursCount} en liste, ${palanqueesCount} palanquées, ${totalPlongeurs} total`);
            
            // Si on a des données significatives, forcer la sauvegarde
            if (totalPlongeurs > 0) {
                console.log('💾 Déclenchement sauvegarde automatique forcée...');
                
                // Méthode 1: Utiliser ImprovedAutoSave si disponible
                if (window.ImprovedAutoSave && typeof window.ImprovedAutoSave.save === 'function') {
                    window.ImprovedAutoSave.save();
                    console.log('✅ Sauvegarde via ImprovedAutoSave');
                }
                
                // Méthode 2: Sauvegarder manuellement dans localStorage
                try {
                    const data = {
                        timestamp: Date.now(),
                        plongeurs: window.plongeurs || [],
                        palanquees: window.palanquees || [],
                        metadata: {
                            dp: document.getElementById('dp-select')?.selectedOptions[0]?.text || '',
                            date: document.getElementById('dp-date')?.value || '',
                            lieu: document.getElementById('dp-lieu')?.value || '',
                            plongee: document.getElementById('dp-plongee')?.value || 'matin'
                        },
                        source: 'session-loaded'
                    };
                    
                    localStorage.setItem('jsas_simple_save', JSON.stringify(data));
                    console.log('✅ Sauvegarde manuelle effectuée');
                    
                    // Indicateur visuel
                    showSaveIndicator();
                    
                } catch (error) {
                    console.error('❌ Erreur sauvegarde manuelle:', error);
                }
            } else {
                console.log('⚠️ Pas de données à sauvegarder');
            }
        }, 1000); // Délai pour s'assurer que le rendu est terminé
    }
    
    // Indicateur de sauvegarde forcée
    function showSaveIndicator() {
        let indicator = document.getElementById('force-save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'force-save-indicator';
            indicator.innerHTML = '🔄 Session sauvegardée automatiquement';
            indicator.style.cssText = `
                position: fixed; top: 60px; right: 10px; 
                background: #17a2b8; color: white; 
                padding: 8px 12px; border-radius: 4px;
                font-size: 12px; z-index: 10001; 
                opacity: 0; transition: opacity 0.3s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
        setTimeout(() => indicator.style.opacity = '0', 3000);
    }
    
    // Écouter les événements de chargement de session
    window.addEventListener('sessionLoaded', function(e) {
        console.log('🎯 Événement sessionLoaded détecté, force sauvegarde...');
        forceSaveAfterLoad();
    });
    
    // NOUVELLE APPROCHE: Intercepter la fonction loadSession pour forcer la sauvegarde
    if (typeof window.loadSession === 'function') {
        const originalLoadSession = window.loadSession;
        
        window.loadSession = async function(sessionKey) {
            console.log('🔄 Interception loadSession:', sessionKey);
            
            try {
                // Appeler la fonction originale
                const result = await originalLoadSession.call(this, sessionKey);
                
                // Si le chargement a réussi, forcer la sauvegarde
                if (result === true) {
                    console.log('✅ Session chargée avec succès, programmation sauvegarde...');
                    
                    // Programmer la sauvegarde avec plusieurs délais pour être sûr
                    setTimeout(forceSaveAfterLoad, 1500);
                    setTimeout(forceSaveAfterLoad, 3000);
                    setTimeout(forceSaveAfterLoad, 5000);
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Erreur dans loadSession intercepté:', error);
                throw error;
            }
        };
        
        console.log('✅ Fonction loadSession interceptée');
    }
    
    // Méthode de surveillance pour détecter les changements brusques
    let lastCheck = { plongeurs: 0, palanquees: 0 };
    
    function surveillanceChangements() {
        const currentPlongeurs = window.plongeurs ? window.plongeurs.length : 0;
        const currentPalanquees = window.palanquees ? window.palanquees.length : 0;
        
        // Détecter un changement significatif (probable chargement de session)
        const changementSignificatif = (
            Math.abs(currentPlongeurs - lastCheck.plongeurs) > 2 ||
            Math.abs(currentPalanquees - lastCheck.palanquees) > 0
        );
        
        if (changementSignificatif && (currentPlongeurs > 0 || currentPalanquees > 0)) {
            console.log('📈 Changement significatif détecté, probable chargement de session');
            console.log(`Avant: ${lastCheck.plongeurs} plongeurs, ${lastCheck.palanquees} palanquées`);
            console.log(`Maintenant: ${currentPlongeurs} plongeurs, ${currentPalanquees} palanquées`);
            
            // Programmer une sauvegarde
            setTimeout(forceSaveAfterLoad, 2000);
        }
        
        lastCheck.plongeurs = currentPlongeurs;
        lastCheck.palanquees = currentPalanquees;
    }
    
    // Surveillance toutes les 3 secondes
    setInterval(surveillanceChangements, 3000);
    
    // CORRECTION ADDITIONNELLE: Intercepter aussi les fonctions de manipulation DOM
    function setupDOMWatcher() {
        // Observer les changements dans le container des palanquées
        const palanqueesContainer = document.getElementById('palanqueesContainer');
        if (palanqueesContainer) {
            const observer = new MutationObserver(function(mutations) {
                let hasSignificantChange = false;
                
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && 
                        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                        hasSignificantChange = true;
                    }
                });
                
                if (hasSignificantChange) {
                    console.log('🔍 Changement DOM détecté dans palanquées');
                    setTimeout(forceSaveAfterLoad, 1000);
                }
            });
            
            observer.observe(palanqueesContainer, {
                childList: true,
                subtree: true
            });
            
            console.log('👁️ Surveillance DOM des palanquées activée');
        }
    }
    
    // Activer la surveillance DOM quand l'app est prête
    setTimeout(setupDOMWatcher, 2000);
    
    // Test manuel pour débugger
    window.testForceSave = function() {
        console.log('🧪 Test de sauvegarde forcée...');
        forceSaveAfterLoad();
    };
    
    console.log('✅ Module de sauvegarde forcée initialisé');
    console.log('🔧 Utilisez testForceSave() pour tester manuellement');
    
})();