// auto-palanquee-trick.js - Astuce pour déclencher la sauvegarde après chargement session
// Remplace tous les autres correctifs complexes

(function() {
    'use strict';
    
    console.log('🎯 Astuce palanquée automatique chargée');
    
    // Fonction pour créer/supprimer une palanquée temporaire
    function triggerSaveViaTemporaryPalanquee() {
        console.log('🔄 Déclenchement sauvegarde via palanquée temporaire...');
        
        try {
            // S'assurer que les variables existent
            if (!Array.isArray(window.palanquees)) {
                window.palanquees = [];
            }
            
            // Créer une palanquée temporaire vide
            const tempPalanquee = [];
            tempPalanquee.horaire = '';
            tempPalanquee.profondeurPrevue = '';
            tempPalanquee.dureePrevue = '';
            tempPalanquee.profondeurRealisee = '';
            tempPalanquee.dureeRealisee = '';
            tempPalanquee.paliers = '';
            
            // Ajouter la palanquée temporaire
            window.palanquees.push(tempPalanquee);
            console.log('➕ Palanquée temporaire créée');
            
            // Déclencher la synchronisation (qui va sauvegarder)
            if (typeof window.syncToDatabase === 'function') {
                window.syncToDatabase();
                console.log('🔄 syncToDatabase() appelée');
            }
            
            // Supprimer la palanquée temporaire après un court délai
            setTimeout(() => {
                try {
                    // Vérifier que c'est bien la dernière (temporaire)
                    if (window.palanquees.length > 0) {
                        const lastIndex = window.palanquees.length - 1;
                        const lastPalanquee = window.palanquees[lastIndex];
                        
                        // Vérifier que c'est bien vide (temporaire)
                        if (Array.isArray(lastPalanquee) && lastPalanquee.length === 0) {
                            window.palanquees.splice(lastIndex, 1);
                            console.log('➖ Palanquée temporaire supprimée');
                            
                            // Re-synchroniser après suppression
                            if (typeof window.syncToDatabase === 'function') {
                                window.syncToDatabase();
                                console.log('🔄 syncToDatabase() finale');
                            }
                            
                            // Indicateur de succès
                            showTrickIndicator();
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur suppression palanquée temporaire:', error);
                }
            }, 2000); // 2 secondes pour laisser le temps à la sauvegarde
            
        } catch (error) {
            console.error('❌ Erreur astuce palanquée:', error);
        }
    }
    
    // Indicateur visuel
    function showTrickIndicator() {
        let indicator = document.getElementById('trick-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'trick-indicator';
            indicator.innerHTML = '🎯 Sauvegarde déclenchée (astuce palanquée)';
            indicator.style.cssText = `
                position: fixed; top: 60px; right: 10px; 
                background: #6f42c1; color: white; 
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
    
    // Intercepter la fonction loadSession pour déclencher l'astuce
    if (typeof window.loadSession === 'function') {
        const originalLoadSession = window.loadSession;
        
        window.loadSession = async function(sessionKey) {
            console.log('🎯 Interception loadSession pour astuce palanquée:', sessionKey);
            
            try {
                // Appeler la fonction originale
                const result = await originalLoadSession.call(this, sessionKey);
                
                // Si le chargement a réussi, déclencher l'astuce
                if (result === true) {
                    console.log('✅ Session chargée, déclenchement astuce palanquée...');
                    
                    // Attendre que le rendu soit terminé, puis déclencher l'astuce
                    setTimeout(triggerSaveViaTemporaryPalanquee, 1500);
                }
                
                return result;
                
            } catch (error) {
                console.error('❌ Erreur dans loadSession intercepté:', error);
                throw error;
            }
        };
        
        console.log('✅ Fonction loadSession interceptée pour astuce palanquée');
    }
    
    // Écouter l'événement sessionLoaded si émis
    window.addEventListener('sessionLoaded', function(e) {
        console.log('🎯 Événement sessionLoaded détecté, déclenchement astuce palanquée...');
        setTimeout(triggerSaveViaTemporaryPalanquee, 1000);
    });
    
    // Méthode de surveillance pour détecter les chargements de session
    let lastCheck = { plongeurs: 0, palanquees: 0 };
    let astuceDejaDeclenchee = false;
    
    function surveillanceChangements() {
        const currentPlongeurs = window.plongeurs ? window.plongeurs.length : 0;
        const currentPalanquees = window.palanquees ? window.palanquees.length : 0;
        
        // Détecter un changement significatif (probable chargement de session)
        const changementSignificatif = (
            Math.abs(currentPlongeurs - lastCheck.plongeurs) > 2 ||
            Math.abs(currentPalanquees - lastCheck.palanquees) > 0
        );
        
        if (changementSignificatif && (currentPlongeurs > 0 || currentPalanquees > 0) && !astuceDejaDeclenchee) {
            console.log('📈 Changement significatif détecté, déclenchement astuce palanquée');
            console.log(`Avant: ${lastCheck.plongeurs} plongeurs, ${lastCheck.palanquees} palanquées`);
            console.log(`Maintenant: ${currentPlongeurs} plongeurs, ${currentPalanquees} palanquées`);
            
            astuceDejaDeclenchee = true;
            setTimeout(triggerSaveViaTemporaryPalanquee, 2000);
            
            // Reset du flag après 10 secondes
            setTimeout(() => {
                astuceDejaDeclenchee = false;
            }, 10000);
        }
        
        lastCheck.plongeurs = currentPlongeurs;
        lastCheck.palanquees = currentPalanquees;
    }
    
    // Surveillance toutes les 3 secondes
    setInterval(surveillanceChangements, 3000);
    
    // Test manuel
    window.testPalanqueeAstuce = function() {
        console.log('🧪 Test manuel de l\'astuce palanquée...');
        triggerSaveViaTemporaryPalanquee();
    };
    
    console.log('✅ Astuce palanquée automatique initialisée');
    console.log('🔧 Utilisez testPalanqueeAstuce() pour tester manuellement');
    
})();