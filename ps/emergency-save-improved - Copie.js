// ps/emergency-save-improved.js - Version diagnostic
alert('SCRIPT EMERGENCY-SAVE SE CHARGE !');
console.log('🚀 Début chargement emergency-save-improved.js');

try {
    console.log('📦 Étape 1 : Test des dépendances...');
    
    // Vérifier les dépendances
    console.log('- Document:', typeof document);
    console.log('- Window:', typeof window);
    console.log('- localStorage:', typeof localStorage);
    
    console.log('📦 Étape 2 : Définition de la classe...');
    
    class EmergencySaveManager {
        constructor() {
            console.log('✅ Constructor EmergencySaveManager appelé');
            this.isInitialized = true;
            this.hasUnsavedChanges = false;
            console.log('✅ Propriétés initialisées');
        }
        
        markNormalSaveComplete() {
            console.log('🔄 markNormalSaveComplete appelé');
            this.hasUnsavedChanges = false;
        }
        
        forceSave() {
            console.log('⚡ forceSave appelé');
        }
        
        test() {
            console.log('🧪 Test method appelée');
            return 'OK';
        }
    }
    
    console.log('📦 Étape 3 : Classe définie avec succès');
    
    // Test création instance
    console.log('📦 Étape 4 : Test création instance...');
    const testInstance = new EmergencySaveManager();
    console.log('✅ Instance créée:', !!testInstance);
    console.log('✅ Test method:', testInstance.test());
    
    console.log('📦 Étape 5 : Exposition vers window...');
    window.EmergencySaveManager = EmergencySaveManager;
    
    console.log('📦 Étape 6 : Vérification exposition...');
    console.log('- window.EmergencySaveManager:', typeof window.EmergencySaveManager);
    console.log('- Peut créer instance:', !!(new window.EmergencySaveManager()));
    
    console.log('📦 Étape 7 : Initialisation DOM...');
    
    // Initialisation simple
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📱 DOM ready - Initialisation...');
        
        setTimeout(() => {
            console.log('🚀 Création instance globale...');
            try {
                window.emergencySaveManager = new EmergencySaveManager();
                console.log('✅ window.emergencySaveManager créé:', typeof window.emergencySaveManager);
            } catch (error) {
                console.error('❌ Erreur création instance:', error);
            }
        }, 1000);
    });
    
    console.log('✅ emergency-save-improved.js chargé avec succès');
    
} catch (error) {
    console.error('❌ ERREUR CRITIQUE dans emergency-save-improved.js:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    alert('ERREUR CRITIQUE: ' + error.message);
}