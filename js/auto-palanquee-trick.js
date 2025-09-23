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
            
            // Astuce palanquée automatique supprimée : ce fichier ne fait plus rien
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
    })();