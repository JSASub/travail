console.log('🚀 DÉBUT Script emergency-save');

try {
    console.log('📦 Étape 1 : Définition classe...');
    
    class EmergencySaveManager {
        constructor() {
            console.log('✅ Constructor start');
            this.isInitialized = true;
            this.hasUnsavedChanges = false;
            console.log('✅ Constructor end');
        }
        
        test() {
            return 'OK TEST';
        }
        
        markNormalSaveComplete() {
            console.log('🔄 markNormalSaveComplete');
        }
        
        forceSave() {
            console.log('⚡ forceSave');
        }
    }
    
    console.log('📦 Étape 2 : Classe définie');
    
    // Test création
    console.log('📦 Étape 3 : Test création instance...');
    const testInstance = new EmergencySaveManager();
    console.log('📦 Étape 4 : Instance test créée');
    
    // Exposition
    console.log('📦 Étape 5 : Exposition window...');
    window.EmergencySaveManager = EmergencySaveManager;
    window.emergencySaveManager = testInstance;
    
    console.log('📦 Étape 6 : Variables exposées');
    console.log('- Classe:', typeof window.EmergencySaveManager);
    console.log('- Instance:', typeof window.emergencySaveManager);
    
    console.log('✅ Script emergency-save terminé avec succès');
    
} catch (error) {
    console.error('❌ ERREUR dans script emergency-save:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    alert('ERREUR: ' + error.message);
}