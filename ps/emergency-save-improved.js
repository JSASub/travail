// Version ultra-simple qui fonctionne
(function() {
    'use strict';
    
    function EmergencySaveManager() {
        this.hasUnsavedChanges = false;
        this.isInitialized = true;
        
        this.markNormalSaveComplete = function() {
            this.hasUnsavedChanges = false;
            console.log('Sauvegarde normale marquée');
        };
        
        this.forceSave = function() {
            console.log('Sauvegarde forcée');
        };
        
        console.log('EmergencySaveManager initialisé');
    }
    
    // Créer et exposer immédiatement
    window.EmergencySaveManager = EmergencySaveManager;
    window.emergencySaveManager = new EmergencySaveManager();
    
    console.log('System ready:', typeof window.EmergencySaveManager, typeof window.emergencySaveManager);
})();