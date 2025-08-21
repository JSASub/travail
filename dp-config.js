// dp-config.js - Configuration centralisée des DP JSAS
// À charger EN PREMIER avant dp-manager.js et admin-dp.html

// ===== LISTE OFFICIELLE DES DP JSAS (SOURCE UNIQUE) =====
window.DP_JSAS_OFFICIELS = [
  { nom: "AGUIRRE", prenom: "Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com" },
  { nom: "AUBARD", prenom: "Corinne", niveau: "P5", email: "aubard.c@gmail.com" },
  { nom: "BEST", prenom: "Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr" },
  { nom: "CABIROL", prenom: "Joël", niveau: "E3", email: "joelcabirol@gmail.com" },
  { nom: "CATTEROU", prenom: "Sacha", niveau: "P5", email: "sacha.catterou@orange.fr" },
  { nom: "DARDER", prenom: "Olivier", niveau: "P5", email: "olivierdarder@gmail.com" },
  { nom: "GAUTHIER", prenom: "Christophe", niveau: "P5", email: "cattof24@yahoo.fr" },
  { nom: "LE MAOUT", prenom: "Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr" },
  { nom: "MARTY", prenom: "David", niveau: "E3", email: "david.marty@sfr.fr" },
  { nom: "TROUBADIS", prenom: "Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com" }
];

// ===== NIVEAUX AUTORISÉS POUR ÊTRE DP =====
window.NIVEAUX_DP_AUTORISES = ['E4', 'E3', 'P5', 'N5'];

// ===== EMAILS D'ADMINISTRATEURS DP =====
window.DP_ADMINS = [
  'raoul.aguirre64@gmail.com',
  'aubard.c@gmail.com', 
  'joelcabirol@gmail.com',
  'david.marty@sfr.fr'
];

// ===== FONCTION DE VALIDATION DES DP =====
window.isValidDPLevel = function(niveau) {
  return window.NIVEAUX_DP_AUTORISES.includes(niveau);
};

// ===== FONCTION DE VÉRIFICATION ADMIN =====
window.isDPAdmin = function(userEmail) {
  return userEmail && window.DP_ADMINS.includes(userEmail);
};

// ===== FONCTION DE MISE À JOUR AUTOMATIQUE =====
window.updateDPConfig = function(newDPList) {
  // Mettre à jour la liste officielle (pour les futures versions)
  console.log("🔄 Mise à jour de la configuration DP", newDPList);
  
  // Déclencher les mises à jour dans tous les composants
  if (window.updateDPField) {
    window.updateDPField();
  }
  
  // Événement personnalisé pour notifier les autres composants
  window.dispatchEvent(new CustomEvent('dpListUpdated', {
    detail: { dpList: newDPList }
  }));
};

console.log("⚙️ Configuration DP centralisée chargée - " + window.DP_JSAS_OFFICIELS.length + " DP officiels");