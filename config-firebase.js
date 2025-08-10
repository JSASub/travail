// Dans config-firebase.js - Vérifier que tous les imports sont présents

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc,           // ← AJOUT MANQUANT
    getDoc,        // ← AJOUT MANQUANT
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBvOH_4Qmwn_Xu5qBG7mEbmfXDTFLW5g-A",
    authDomain: "plongee-carnet.firebaseapp.com",
    projectId: "plongee-carnet",
    storageBucket: "plongee-carnet.firebasestorage.app",
    messagingSenderId: "912594107524",
    appId: "1:912594107524:web:78f49aee15f7d8e0c5b5b0"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction pour tester la connexion Firebase
async function testFirebaseConnection() {
    try {
        console.log('🔄 Test connexion Firebase...');
        const testCollection = collection(db, 'test');
        console.log('✅ Firebase connecté avec succès!');
        return true;
    } catch (error) {
        console.error('❌ Erreur connexion Firebase:', error);
        return false;
    }
}

// Fonction loadSession corrigée avec gestion d'erreurs
async function loadSession(sessionId) {
    try {
        console.log('🔄 Chargement session:', sessionId);
        
        // Vérifier que le container existe avant de charger
        const container = document.getElementById('palanquees-container');
        if (!container) {
            console.error('❌ Container palanquees-container non trouvé dans le DOM');
            // Créer le container s'il n'existe pas
            createPalanqueesContainer();
            return;
        }
        
        const sessionRef = doc(db, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data();
            console.log('📄 Session chargée:', sessionData);
            
            // Normaliser les données de palanquées
            if (sessionData.palanquees) {
                sessionData.palanquees = normalizePalanqueesData(sessionData.palanquees);
                console.log('✅ Palanquées normalisées:', sessionData.palanquees.length);
            }
            
            // Rendre les palanquées
            renderPalanquees(sessionData);
            
            // Mettre à jour les infos de session
            if (typeof updateSessionInfo === 'function') {
                updateSessionInfo(sessionData);
            }
            
        } else {
            console.log('❌ Session non trouvée');
            container.innerHTML = '<div class="error">Session non trouvée</div>';
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement session:', error);
        const container = document.getElementById('palanquees-container');
        if (container) {
            container.innerHTML = `<div class="error">Erreur de chargement: ${error.message}</div>`;
        }
    }
}

// Fonction pour créer le container s'il n'existe pas
function createPalanqueesContainer() {
    console.log('🔧 Création du container palanquees-container');
    
    // Chercher un endroit logique pour l'insérer
    let targetElement = document.getElementById('session-content') || 
                       document.getElementById('main-content') ||
                       document.querySelector('.session-details') ||
                       document.body;
    
    const container = document.createElement('div');
    container.id = 'palanquees-container';
    container.className = 'palanquees-container';
    container.innerHTML = '<div class="loading">Chargement des palanquées...</div>';
    
    targetElement.appendChild(container);
    console.log('✅ Container palanquees-container créé');
}

// Export des fonctions et variables
window.db = db;
window.testFirebaseConnection = testFirebaseConnection;
window.loadSession = loadSession;
window.createPalanqueesContainer = createPalanqueesContainer;