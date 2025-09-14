function createEmergencyManager() {
    function EmergencySaveManager() {
        this.hasUnsavedChanges = false;
        this.markNormalSaveComplete = function() {
            this.hasUnsavedChanges = false;
        };
        this.forceSave = function() {
            console.log('Sauvegarde forcée');
        };
    }
    
    window.EmergencySaveManager = EmergencySaveManager;
    
    // Forcer la création plusieurs fois
    for (let i = 0; i < 3; i++) {
        try {
            window.emergencySaveManager = new EmergencySaveManager();
            if (window.emergencySaveManager) break;
        } catch (e) {
            console.error('Tentative', i+1, 'échouée:', e);
        }
    }
}

createEmergencyManager();

// Re-essayer après 1 seconde si échec
setTimeout(() => {
    if (!window.emergencySaveManager) {
        createEmergencyManager();
    }
}, 1000);