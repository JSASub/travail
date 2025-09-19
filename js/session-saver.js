// session-saver.js - Module complémentaire pour forcer la sauvegarde après chargement
(function() {
    'use strict';
    
    let lastSaveTime = 0;
    
    function forceSaveIfNeeded() {
        // Vérifier qu'il y a des données ET que ImprovedAutoSave existe
        if (window.ImprovedAutoSave && typeof window.ImprovedAutoSave.save === 'function') {
            const now = Date.now();
            
            // Éviter les sauvegardes trop fréquentes (max 1 toutes les 10 secondes)
            if (now - lastSaveTime > 10000) {
                const hasData = (window.plongeurs && window.plongeurs.length > 0) || 
                               (window.palanquees && window.palanquees.length > 0);
                
                if (hasData) {
                    console.log('Session-saver: Force sauvegarde après chargement');
                    window.ImprovedAutoSave.save();
                    lastSaveTime = now;
                }
            }
        }
    }
    
    // Détecter les chargements de session en surveillant les variables
    let lastPlongeursCount = 0;
    setInterval(() => {
        const currentCount = window.plongeurs ? window.plongeurs.length : 0;
        if (Math.abs(currentCount - lastPlongeursCount) > 3) {
            console.log('Session-saver: Changement détecté, sauvegarde dans 2s');
            setTimeout(forceSaveIfNeeded, 2000);
        }
        lastPlongeursCount = currentCount;
    }, 3000);
    
    console.log('Session-saver: Module de sauvegarde forcée chargé');
})();