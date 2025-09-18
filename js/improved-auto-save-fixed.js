// Version ULTRA-SIMPLE qui fonctionne
(function() {
    'use strict';
    
    const STORAGE_KEY = 'jsas_auto_save';
    let saveTimeout = null;
    let hasShownPrompt = false;
    
    // Fonction simple de sauvegarde
    function saveNow() {
        try {
            const plongeurs = window.plongeurs || [];
            const palanquees = window.palanquees || [];
            
            // Compter total
            let totalPalanquees = 0;
            palanquees.forEach(pal => {
                if (Array.isArray(pal)) {
                    totalPalanquees += pal.length;
                }
            });
            
            const total = plongeurs.length + totalPalanquees;
            
            if (total >= 3) {
                const data = {
                    timestamp: Date.now(),
                    plongeurs: plongeurs,
                    palanquees: palanquees,
                    total: total
                };
                
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                console.log('Auto-save OK:', total, 'plongeurs');
            }
        } catch (e) {
            console.error('Erreur save:', e);
        }
    }
    
    // Déclencher sauvegarde avec délai
    function triggerSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveNow, 2000);
    }
    
    // Vérifier s'il faut restaurer
    function checkRestore() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            
            const data = JSON.parse(saved);
            const age = Date.now() - data.timestamp;
            
            // Expire après 2 heures
            if (age > 2 * 60 * 60 * 1000) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }
            
            if (data.total >= 3) {
                showRestoreDialog(data);
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    // Boite de dialogue simple
    function showRestoreDialog(data) {
        if (hasShownPrompt) return;
        hasShownPrompt = true;
        
        const msg = `Session trouvée: ${data.total} plongeurs\n\nRestaurer ?`;
        
        setTimeout(() => {
            if (confirm(msg)) {
                // Restaurer
                window.plongeurs = data.plongeurs || [];
                window.palanquees = data.palanquees || [];
                
                // Mettre à jour l'affichage
                if (typeof renderPlongeurs === 'function') renderPlongeurs();
                if (typeof renderPalanquees === 'function') renderPalanquees();
                if (typeof updateCompteurs === 'function') updateCompteurs();
                
                console.log('Restauré:', data.total, 'plongeurs');
            }
            localStorage.removeItem(STORAGE_KEY);
        }, 500);
    }
    
    // Surveiller les changements
    setInterval(() => {
        const currentTotal = (window.plongeurs?.length || 0) + 
                            (window.palanquees?.reduce((t,p) => t + (p?.length || 0), 0) || 0);
        if (currentTotal >= 3) {
            triggerSave();
        }
    }, 3000);
    
    // Sauver avant fermeture
    window.addEventListener('beforeunload', saveNow);
    
    // Vérifier au démarrage
    setTimeout(checkRestore, 1000);
    
    console.log('Auto-save simple activé');
    
})();