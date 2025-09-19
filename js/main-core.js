// main-core.js - Fichier principal corrigé avec protection anti-conflit
console.log("🚀 Initialisation Main Core avec protection anti-conflit");

// PROTECTION ANTI-UNDEFINED avec surveillance
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.plongeursOriginaux = window.plongeursOriginaux || [];

// Variables globales de session
let currentSessionKey = null;
let sessionModified = false;

// ===== PROTECTION ANTI-CONFLIT DE CHARGEMENT =====
let loadingState = {
    inProgress: false,
    source: null,
    startTime: null
};

function setLoadingState(source, active = true) {
    loadingState.inProgress = active;
    loadingState.source = source;
    loadingState.startTime = active ? Date.now() : null;
    
    // Exposer globalement pour la sauvegarde automatique
    window.loadingInProgress = active;
    
    console.log(`📡 Loading state: ${active ? 'START' : 'END'} - Source: ${source}`);
}

function isLoadingActive() {
    // Timeout automatique après 10 secondes
    if (loadingState.inProgress && loadingState.startTime && 
        (Date.now() - loadingState.startTime > 10000)) {
        console.warn("⚠️ Loading timeout - Déblocage automatique");
        setLoadingState(loadingState.source, false);
    }
    return loadingState.inProgress;
}

// ===== SOLUTION AGRESSIVE POUR LES BOÎTES DE DIALOGUE =====
const originalAlert = window.alert;
window.alert = function(message) {
    if (typeof message === 'string' && message.includes('0 palanquée')) {
        const palanqueesCount = document.querySelectorAll('.palanquee').length;
        let plongeursCount = 0;
        document.querySelectorAll('.palanquee').forEach(pal => {
            plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
        });
        
        const messageCorrige = message.replace(
            /\d+\s*plongeurs?\s+dans\s+0\s+palanquées?/gi, 
            `${plongeursCount} plongeurs dans ${palanqueesCount} palanquées`
        );
        
        console.log(`Alert corrigée: "${message}" → "${messageCorrige}"`);
        return originalAlert.call(this, messageCorrige);
    }
    return originalAlert.call(this, message);
};

const originalConfirm = window.confirm;
window.confirm = function(message) {
    if (typeof message === 'string' && message.includes('0 palanquée')) {
        const palanqueesCount = document.querySelectorAll('.palanquee').length;
        let plongeursCount = 0;
        document.querySelectorAll('.palanquee').forEach(pal => {
            plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
        });
        
        const messageCorrige = message.replace(
            /\d+\s*plongeurs?\s+dans\s+0\s+palanquées?/gi, 
            `${plongeursCount} plongeurs dans ${palanqueesCount} palanquées`
        );
        
        console.log(`Confirm corrigée: "${message}" → "${messageCorrige}"`);
        return originalConfirm.call(this, messageCorrige);
    }
    return originalConfirm.call(this, message);
};

// Fonction pour corriger en temps réel
function getCurrentPalanqueesStats() {
    const palanqueesCount = document.querySelectorAll('.palanquee').length;
    let plongeursCount = 0;
    document.querySelectorAll('.palanquee').forEach(pal => {
        plongeursCount += pal.querySelectorAll('.palanquee-plongeur-item').length;
    });
    return { palanqueesCount, plongeursCount };
}

window.getCurrentPalanqueesStats = getCurrentPalanqueesStats;

// ===== FONCTION DE RECONSTRUCTION DOM SÉCURISÉE =====
function reconstructDataFromDOM() {
    if (isLoadingActive()) {
        console.log("🚫 Reconstruction bloquée - Chargement en cours");
        return false;
    }
    
    const listDOM = document.getElementById('listePlongeurs');
    if (!listDOM) return false;
    
    const domCount = listDOM.children.length;
    const memoryCount = window.plongeurs ? window.plongeurs.length : 0;
    
    console.log(`Reconstruction DOM: ${domCount} dans DOM, ${memoryCount} en mémoire`);
    
    if (domCount > 0 && memoryCount === 0) {
        console.log('🔄 Reconstruction des données plongeurs depuis le DOM...');
        
        setLoadingState('DOM_RECONSTRUCTION', true);
        
        window.plongeurs = [];
        
        Array.from(listDOM.children).forEach(li => {
            const text = li.textContent || li.innerText;
            const parts = text.split(' - ');
            
            if (parts.length >= 2) {
                window.plongeurs.push({
                    nom: parts[0].trim(),
                    niveau: parts[1].trim(),
                    pre: parts[2] ? parts[2].replace(/[\[\]]/g, '').trim() : ''
                });
            }
        });
        
        window.plongeursOriginaux = [...window.plongeurs];
        
        console.log('✅ Reconstruction terminée:', window.plongeurs.length, 'plongeurs');
        
        setTimeout(() => {
            if (typeof updateCompteurs === 'function') {
                updateCompteurs();
                console.log('📊 Compteurs mis à jour après reconstruction DOM');
            }
            setLoadingState('DOM_RECONSTRUCTION', false);
        }, 300);
        
        return true;
    }
    
    return false;
}

window.reconstructDataFromDOM = reconstructDataFromDOM;

// ===== INITIALISATION DOM PROTÉGÉE =====
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.plongeurs === 'undefined') {
        window.plongeurs = [];
    }
    
    // Protection : ne pas reconstruire si chargement en cours
    if (isLoadingActive()) {
        console.log("🚫 Initialisation DOM reportée - Chargement en cours");
        return;
    }
    
    const listDOM = document.getElementById('listePlongeurs');
    if (listDOM && listDOM.children.length > 0 && window.plongeurs.length === 0) {
        console.log('🔄 Reconstruction des données plongeurs depuis le DOM...');
        
        Array.from(listDOM.children).forEach(li => {
            const text = li.textContent || li.innerText;
            const parts = text.split(' - ');
            
            if (parts.length >= 2) {
                window.plongeurs.push({
                    nom: parts[0].trim(),
                    niveau: parts[1].trim(),
                    pre: parts[2] ? parts[2].replace('[', '').replace(']', '').trim() : ''
                });
            }
        });
        
        console.log('✅ Reconstruction terminée:', window.plongeurs.length, 'plongeurs');
        
        if (typeof updateFloatingPlongeursList === 'function') {
            updateFloatingPlongeursList();
        }
    }
});

// ===== FONCTION DP SÉCURISÉE =====
function getSelectedDPName() {
    const dpSelect = document.getElementById('dp-select');
    
    if (!dpSelect || !dpSelect.value) {
        console.warn("⚠️ Aucun DP sélectionné");
        return "";
    }
    
    if (typeof DP_LIST !== 'undefined') {
        const selectedDP = DP_LIST.find(dp => dp.id === dpSelect.value);
        if (selectedDP) {
            console.log("✅ DP sélectionné:", selectedDP.nom);
            return selectedDP.nom;
        }
    }
    
    const selectedOption = dpSelect.options[dpSelect.selectedIndex];
    if (selectedOption && selectedOption.text !== "-- Choisir un DP --") {
        const nom = selectedOption.text.split(' (')[0];
        console.log("✅ DP extrait:", nom);
        return nom;
    }
    
    return "";
}

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const originalConsoleLog = console.log;
    console.log = function() {
        if (arguments[0] && typeof arguments[0] === 'string' && 
            (arguments[0].includes('✅') || arguments[0].includes('⚠'))) {
            originalConsoleLog.apply(console, arguments);
        }
    }
}

// ===== SYNCHRONISATION BASE DE DONNÉES PROTÉGÉE =====
async function syncToDatabase() {
    if (isLoadingActive()) {
        console.log("🚫 Sync bloquée - Chargement en cours");
        return;
    }
    
    console.log("💾 Synchronisation Firebase...");
    
    try {
        if (typeof plongeurs === 'undefined') window.plongeurs = [];
        if (typeof palanquees === 'undefined') window.palanquees = [];
        if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
        
        plongeursOriginaux = [...plongeurs];
        
        if (currentSessionKey) {
            sessionModified = true;
            console.log("📝 Session marquée comme modifiée");
        }
        
        if (typeof renderPalanquees === 'function') renderPalanquees();
        if (typeof renderPlongeurs === 'function') renderPlongeurs();
        if (typeof updateAlertes === 'function') updateAlertes();
        if (typeof updateCompteurs === 'function') updateCompteurs();
        
        if (typeof firebaseConnected !== 'undefined' && firebaseConnected && typeof db !== 'undefined' && db) {
            try {
                await Promise.all([
                    db.ref('plongeurs').set(plongeurs),
                    db.ref('palanquees').set(palanquees)
                ]);
                
                console.log("✅ Sauvegarde Firebase réussie");
                
            } catch (error) {
                console.error("⚠ Erreur sync Firebase:", error.message);
                
                if (typeof handleFirebaseError === 'function') {
                    handleFirebaseError(error, 'Synchronisation');
                }
            }
        } else {
            console.warn("⚠️ Firebase non connecté, données non sauvegardées");
        }
        
    } catch (error) {
        console.error("⚠ Erreur syncToDatabase:", error);
        handleError(error, "Synchronisation base de données");
    }
}

// ===== CHARGEMENT DEPUIS FIREBASE PROTÉGÉ =====
async function loadFromFirebase() {
    console.log("📡 Chargement des données depuis Firebase...");
    
    // PROTECTION : Bloquer la sauvegarde automatique
    setLoadingState('FIREBASE_LOAD', true);
    
    try {
        if (!db) {
            console.warn("DB non disponible");
            return;
        }
        
        // Vérifier s'il y a une session active à charger
        const dpSelect = document.getElementById('dp-select');
        const dpDate = document.getElementById('dp-date');
        
        let sessionKey = null;
        if (dpSelect && dpSelect.value && dpDate && dpDate.value) {
            const dpNom = getSelectedDPName();
            if (dpNom && dpNom.includes('AGUIRRE')) {
                sessionKey = `${dpDate.value}_AGUIRRE_matin`;
                console.log("🔍 Tentative de chargement session:", sessionKey);
                
                const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
                if (sessionSnapshot.exists()) {
                    const sessionData = sessionSnapshot.val();
                    console.log("📋 SESSION TROUVÉE - Chargement...");
                    
                    // Vider avant rechargement
                    window.plongeurs = [];
                    window.palanquees = [];
                    
                    // Charger depuis la session
                    window.plongeurs = sessionData.plongeurs || [];
                    
                    window.palanquees = [];
                    if (sessionData.palanquees) {
                        sessionData.palanquees.forEach(palData => {
                            if (palData.plongeurs) {
                                window.palanquees.push(palData.plongeurs);
                            }
                        });
                    }
                    
                    console.log(`✅ SESSION CHARGÉE: ${window.plongeurs.length} plongeurs, ${window.palanquees.length} palanquées`);
                    
                    window.plongeursOriginaux = [...window.plongeurs];
                    
                    // Rendu immédiat
                    if (typeof renderPalanquees === 'function') renderPalanquees();
                    if (typeof renderPlongeurs === 'function') renderPlongeurs();
                    if (typeof updateCompteurs === 'function') updateCompteurs();
                    
                    // Débloquer après rendu
                    setTimeout(() => {
                        setLoadingState('FIREBASE_LOAD', false);
                    }, 1000);
                    
                    return;
                }
            }
        }
        
        // Fallback : charger les données DP générales
        console.log("📂 Chargement données DP générales");
        
        const plongeursSnapshot = await db.ref('plongeurs').once('value');
        if (plongeursSnapshot.exists()) {
            window.plongeurs = plongeursSnapshot.val() || [];
        }
        
        const palanqueesSnapshot = await db.ref('palanquees').once('value');
        if (palanqueesSnapshot.exists()) {
            window.palanquees = palanqueesSnapshot.val() || [];
        }
        
        window.plongeursOriginaux = [...window.plongeurs];
        
        if (typeof renderPalanquees === 'function') renderPalanquees();
        if (typeof renderPlongeurs === 'function') renderPlongeurs();
        if (typeof updateCompteurs === 'function') updateCompteurs();
        
    } catch (error) {
        console.error("❌ Erreur chargement Firebase:", error);
    } finally {
        // Toujours débloquer, même en cas d'erreur
        setTimeout(() => {
            setLoadingState('FIREBASE_LOAD', false);
        }, 1000);
    }
}

// ===== FONCTION LOADSESSION CORRIGÉE =====
async function loadSession(sessionKey) {
    console.log("🔥 Chargement session:", sessionKey);
    
    // PROTECTION : Bloquer la sauvegarde automatique
    setLoadingState('SESSION_LOAD', true);
    
    try {
        if (!db) {
            alert("Firebase non disponible");
            return false;
        }
        
        const snapshot = await db.ref(`sessions/${sessionKey}`).once('value');
        if (!snapshot.exists()) {
            alert("Session non trouvée");
            return false;
        }
        
        const sessionData = snapshot.val();
        
        console.log("🧹 Nettoyage des variables globales...");
        // Vider complètement avant restauration
        window.plongeurs = [];
        window.palanquees = [];
        window.plongeursOriginaux = [];
        
        // Attendre un cycle
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Restaurer les plongeurs
        if (sessionData.plongeurs && Array.isArray(sessionData.plongeurs)) {
            window.plongeurs = sessionData.plongeurs.map(p => ({...p}));
            console.log("📋 Plongeurs restaurés:", window.plongeurs.length);
        }
        
        // Restaurer les palanquées
        if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
            window.palanquees = [];
            
            sessionData.palanquees.forEach((palData) => {
                const palanqueeArray = [];
                
                if (palData.plongeurs && Array.isArray(palData.plongeurs)) {
                    palData.plongeurs.forEach(p => {
                        palanqueeArray.push({...p});
                    });
                }
                
                if (palData.parametres) {
                    palanqueeArray.horaire = palData.parametres.horaire || "";
                    palanqueeArray.profondeurPrevue = palData.parametres.profondeurPrevue || "";
                    palanqueeArray.dureePrevue = palData.parametres.dureePrevue || "";
                    palanqueeArray.profondeurRealisee = palData.parametres.profondeurRealisee || "";
                    palanqueeArray.dureeRealisee = palData.parametres.dureeRealisee || "";
                    palanqueeArray.paliers = palData.parametres.paliers || "";
                }
                
                window.palanquees.push(palanqueeArray);
            });
            
            console.log("🏊 Palanquées restaurées:", window.palanquees.length);
        }
        
        window.plongeursOriginaux = [...window.plongeurs];
        
        // Restaurer les infos DP
        if (sessionData.meta) {
            const dpSelect = document.getElementById("dp-select");
            if (dpSelect && DP_LIST) {
                const dp = DP_LIST.find(d => d.nom === sessionData.meta.dp);
                if (dp) {
                    dpSelect.value = dp.id;
                    console.log("✅ DP sélectionné:", dp.nom);
                    
                    if (typeof window.enableDPButtons === 'function') {
                        window.enableDPButtons();
                    }
                }
            }
            
            const dpDate = document.getElementById("dp-date");
            const dpLieu = document.getElementById("dp-lieu");
            const dpPlongee = document.getElementById("dp-plongee");
            
            if (dpDate) dpDate.value = sessionData.meta.date || "";
            if (dpLieu) dpLieu.value = sessionData.meta.lieu || "";
            if (dpPlongee) dpPlongee.value = sessionData.meta.plongee || "matin";
        }
        
        // Rendu immédiat et synchrone
        console.log("🎨 Rendu immédiat...");
        if (typeof renderPalanquees === 'function') renderPalanquees();
        if (typeof renderPlongeurs === 'function') renderPlongeurs();
        if (typeof updateAlertes === 'function') updateAlertes();
        if (typeof updateCompteurs === 'function') updateCompteurs();
        
        // Restauration des paramètres d'interface
        setTimeout(() => {
            console.log("🔧 Restauration des paramètres d'interface...");
            
            window.palanquees.forEach((pal, index) => {
                if (!pal || !Array.isArray(pal)) return;
                
                const horaireInput = document.getElementById(`horaire-${index}`) || 
                                    document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Horaire"]`);
                const profPrevueInput = document.getElementById(`profondeur-prevue-${index}`) || 
                                       document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. prévue"]`);
                const dureePrevueInput = document.getElementById(`duree-prevue-${index}`) || 
                                        document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée prévue"]`);
                const profRealiseeInput = document.getElementById(`profondeur-realisee-${index}`) || 
                                         document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Prof. réalisée"]`);
                const dureeRealiseeInput = document.getElementById(`duree-realisee-${index}`) || 
                                          document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Durée réalisée"]`);
                const paliersInput = document.getElementById(`paliers-${index}`) || 
                                    document.querySelector(`[data-palanquee="${index}"] input[placeholder*="Paliers"]`);
                
                if (horaireInput && pal.horaire) horaireInput.value = pal.horaire;
                if (profPrevueInput && pal.profondeurPrevue) profPrevueInput.value = pal.profondeurPrevue;
                if (dureePrevueInput && pal.dureePrevue) dureePrevueInput.value = pal.dureePrevue;
                if (profRealiseeInput && pal.profondeurRealisee) profRealiseeInput.value = pal.profondeurRealisee;
                if (dureeRealiseeInput && pal.dureeRealisee) dureeRealiseeInput.value = pal.dureeRealisee;
                if (paliersInput && pal.paliers) paliersInput.value = pal.paliers;
            });
            
            console.log("✅ Paramètres d'interface restaurés");
        }, 300);
        
        // Rendu final et vérification
        setTimeout(() => {
            console.log("🎯 Rendu final...");
            
            if (typeof renderPalanquees === 'function') renderPalanquees();
            if (typeof renderPlongeurs === 'function') renderPlongeurs();
            if (typeof updateAlertes === 'function') updateAlertes();
            
            setTimeout(() => {
                if (typeof updateCompteurs === 'function') {
                    updateCompteurs();
                    console.log('📊 Compteurs mis à jour après chargement session');
                }
                
                // VÉRIFICATION POST-CHARGEMENT
                const totalPlongeurs = window.plongeurs.length;
                let totalEnPalanquees = 0;
                window.palanquees.forEach(pal => {
                    if (Array.isArray(pal)) totalEnPalanquees += pal.length;
                });
                
                console.log("🔍 VÉRIFICATION POST-CHARGEMENT:");
                console.log(`- Plongeurs en liste: ${totalPlongeurs}`);
                console.log(`- Plongeurs en palanquées: ${totalEnPalanquees}`);
                console.log(`- Total: ${totalPlongeurs + totalEnPalanquees}`);
                
            }, 100);
            
        }, 500);
        
        // Initialiser le tracking de session
        currentSessionKey = sessionKey;
        sessionModified = false;
        
        console.log("✅ Session chargée - tracking initialisé -", sessionData.meta?.dp);
        
        // Événement pour notifier la fin du chargement
        window.dispatchEvent(new CustomEvent('sessionLoaded', {
            detail: { sessionKey, source: 'loadSession' }
        }));
        
        return true;
        
    } catch (error) {
        console.error("❌ Erreur:", error);
        alert(`Erreur lors du chargement:\n${error.message}`);
        return false;
    } finally {
        // TOUJOURS débloquer la sauvegarde automatique
        setTimeout(() => {
            setLoadingState('SESSION_LOAD', false);
            console.log("🔓 Sauvegarde automatique débloquée après loadSession");
        }, 2000);
    }
}

// ===== RESTE DU CODE (fonctions utilitaires, etc.) =====
function syncPrerogativesFromInterface() {
    document.querySelectorAll('.palanquee').forEach((palanqueeDiv, palIndex) => {
        const inputs = palanqueeDiv.querySelectorAll('input[placeholder*="rérogative"]');
        inputs.forEach((input, plongeurIndex) => {
            if (palanquees[palIndex] && palanquees[palIndex][plongeurIndex]) {
                palanquees[palIndex][plongeurIndex].pre = input.value.trim();
            }
        });
    });
}

function showAuthError(message) {
    const errorDiv = document.getElementById("auth-error");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

function handleError(error, context = "Application") {
    console.error(`⚠ Erreur ${context}:`, error);
    
    if (typeof FirebaseErrorHandler !== 'undefined') {
        return FirebaseErrorHandler.handleError(error, context);
    }
    
    if (error.stack) {
        console.error("Stack trace:", error.stack);
    }
    
    console.log("Debug info:", {
        firebaseConnected: typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined',
        currentUser: typeof currentUser !== 'undefined' ? (currentUser ? currentUser.email : 'null') : 'undefined',
        plongeursLength: Array.isArray(plongeurs) ? plongeurs.length : 'not array',
        palanqueesLength: Array.isArray(palanquees) ? palanquees.length : 'not array',
        loadingState: loadingState
    });
    
    return false;
}

// ===== EXPORTS GLOBAUX =====
window.handleError = handleError;
window.syncToDatabase = syncToDatabase;
window.loadFromFirebase = loadFromFirebase;
window.loadSession = loadSession;
window.getSelectedDPName = getSelectedDPName;
window.isLoadingActive = isLoadingActive;
window.setLoadingState = setLoadingState;

console.log("✅ Main Core sécurisé chargé - Version 4.0 - Protection anti-conflit active");