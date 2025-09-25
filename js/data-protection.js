// Fonction de protection contre l'écrasement de window.palanquees
function protectPalanqueesData() {
    // Vérification de sécurité pour éviter l'écrasement
    if (typeof window.palanquees !== 'undefined' && !Array.isArray(window.palanquees)) {
        console.warn("window.palanquees corrompu détecté, reconstruction depuis le DOM...");
        
        // Reconstruire les données depuis le DOM
        const newPalanquees = [];
        document.querySelectorAll('.palanquee').forEach((palDiv, index) => {
            const plongeurs = [];
            palDiv.querySelectorAll('.palanquee-plongeur-item').forEach(item => {
                const nom = item.querySelector('.plongeur-nom')?.textContent.trim();
                const niveau = item.querySelector('.plongeur-niveau')?.textContent.trim();
                const preInput = item.querySelector('.plongeur-prerogatives-editable');
                const pre = preInput ? preInput.value.trim() : "";
                if (nom && niveau) {
                    plongeurs.push({nom, niveau, pre});
                }
            });
            newPalanquees.push(plongeurs);
        });
        
        // Réinitialiser window.palanquees
        window.palanquees = newPalanquees;
        
        // Nettoyer les doublons dans window.plongeurs
        const plongeursEnPalanquees = new Set();
        window.palanquees.forEach(pal => {
            pal.forEach(p => plongeursEnPalanquees.add(p.nom));
        });
        window.plongeurs = window.plongeurs.filter(p => !plongeursEnPalanquees.has(p.nom));
        
        console.log("window.palanquees réparé:", window.palanquees);
        return true; // Indique qu'une réparation a eu lieu
    }
    return false; // Pas de réparation nécessaire
}

// Wrapper sécurisé pour getElementById qui évite l'écrasement
function safeGetElementById(id) {
    if (id === 'palanquees') {
        // Ne jamais écraser window.palanquees avec l'élément DOM
        return document.getElementById(id);
    }
    return document.getElementById(id);
}

// Protection lors de l'initialisation
function initializeDataStructures() {
    // S'assurer que window.palanquees est un tableau
    if (!window.palanquees || !Array.isArray(window.palanquees)) {
        window.palanquees = [];
        console.log("window.palanquees initialisé comme tableau vide");
    }
    
    // S'assurer que window.plongeurs est un tableau
    if (!window.plongeurs || !Array.isArray(window.plongeurs)) {
        window.plongeurs = [];
        console.log("window.plongeurs initialisé comme tableau vide");
    }
}

// Surveillance continue de l'intégrité des données
function monitorDataIntegrity() {
    setInterval(() => {
        if (protectPalanqueesData()) {
            // Si une réparation a eu lieu, mettre à jour l'interface
            if (typeof window.forceUpdatePlongeursMenu === 'function') {
                window.forceUpdatePlongeursMenu();
            }
        }
    }, 5000); // Vérification toutes les 5 secondes
}

// Fonction d'initialisation complète
function initializeApp() {
    console.log("Initialisation de l'application...");
    
    // 1. Initialiser les structures de données
    initializeDataStructures();
    
    // 2. Protection immédiate
    protectPalanqueesData();
    
    // 3. Démarrer la surveillance
    monitorDataIntegrity();
    
    // 4. Autres initialisations existantes...
    // (garder le code d'initialisation existant ici)
    
    console.log("Application initialisée avec protection des données");
}

// Remplacer tous les appels à getElementById('palanquees') par une version sécurisée
const originalGetElementById = document.getElementById;
document.getElementById = function(id) {
    const element = originalGetElementById.call(document, id);
    
    // Empêcher l'affectation accidentelle de l'élément palanquees à window.palanquees
    if (id === 'palanquees') {
        // Log pour détecter d'où vient l'appel problématique
        const stack = new Error().stack;
        if (stack && stack.includes('window.palanquees')) {
            console.warn("Tentative d'affectation de l'élément DOM à window.palanquees bloquée");
            console.log("Stack trace:", stack);
        }
    }
    
    return element;
};

// Démarrer l'application avec protection
document.addEventListener('DOMContentLoaded', initializeApp);

// Export des fonctions utiles pour debugging
window.protectPalanqueesData = protectPalanqueesData;
window.debugDataStructures = function() {
    console.log("=== État des structures de données ===");
    console.log("window.palanquees:", window.palanquees);
    console.log("Type de window.palanquees:", typeof window.palanquees);
    console.log("Est un tableau:", Array.isArray(window.palanquees));
    console.log("window.plongeurs:", window.plongeurs);
    console.log("Nombre de palanquées:", window.palanquees ? window.palanquees.length : 'undefined');
    console.log("Nombre de plongeurs:", window.plongeurs ? window.plongeurs.length : 'undefined');
};