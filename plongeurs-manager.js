// plongeurs-manager.js - Gestion complète des plongeurs

// ===== PLONGEURS PRÉDÉFINIS JSA =====
const plongeursPredefinis = [
  {
    nom: "AGUIRRE Raoul",
    niveau: "E3",
    prerogatives: "Encadrement jusqu'à 40m, formation N1-N2-N3",
    email: "raoul.aguirre64@gmail.com"
  },
  {
    nom: "AUBARD Corinne", 
    niveau: "P5",
    prerogatives: "DP exploration, guide de palanquée",
    email: "aubard.c@gmail.com"
  },
  {
    nom: "BEST Sébastien",
    niveau: "P5", 
    prerogatives: "PDP exploration, guide de palanquée, guide de palanquée",
    email: "sebastien.best@cma-nouvelleaquitaine.fr"
  },
  {
    nom: "CABIROL Joël",
    niveau: "E3",
    prerogatives: "Encadrement jusqu'à 40m, formation N1-N2-N3", 
    email: "joelcabirol@gmail.com"
  },
  {
    nom: "CATTEROU Sacha",
    niveau: "P5",
    prerogatives: "DP exploration, guide de palanquée, guide de palanquée",
    email: "sacha.catterou@orange.fr"
  },
  {
    nom: "DARDER Olivier", 
    niveau: "P5",
    prerogatives: "DP exploration, guide de palanquée, guide de palanquée",
    email: "olivierdarder@gmail.com"
  },
  {
    nom: "GAUTHIER Christophe",
    niveau: "P5",
    prerogatives: "DP exploration, guide de palanquée, guide de palanquée", 
    email: "jsasubaquatique24@gmail.com"
  },
  {
    nom: "LE MAOUT Jean-François",
    niveau: "P5",
    prerogatives: "DP exploration, guide de palanquée, guide de palanquée",
    email: "jf.lemaout@wanadoo.fr"
  },
  {
    nom: "MARTY David",
    niveau: "E3", 
    prerogatives: "Encadrement jusqu'à 40m, formation N1-N2-N3",
    email: "david.marty@sfr.fr"
  },
  {
    nom: "TROUBADIS Guillaume",
    niveau: "P5",
    prerogatives: "DP exploration, guide de palanquée, guide de palanquée",
    email: "guillaume.troubadis@gmail.com"
  }
];

// ===== GESTION DES PLONGEURS =====

// Fonction d'ajout de plongeur sécurisée
function addPlongeur(nom, niveau, prerogatives = "") {
  try {
    if (!nom || !niveau) {
      showPlongeursMessage("❌ Nom et niveau sont obligatoires", "error");
      return false;
    }
    
    // Vérifier si le plongeur existe déjà
    if (window.plongeurs && window.plongeurs.find(p => p.nom.toLowerCase() === nom.toLowerCase())) {
      showPlongeursMessage("⚠️ Ce plongeur existe déjà", "warning");
      return false;
    }
    
    // Créer le plongeur
    const nouveauPlongeur = {
      nom: nom.trim(),
      niveau: niveau.trim(),
      prerogatives: prerogatives.trim() || getPrerogativesParDefaut(niveau),
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    // Ajouter à la liste
    if (!window.plongeurs) window.plongeurs = [];
    window.plongeurs.push(nouveauPlongeur);
    
    // Mettre à jour plongeursOriginaux
    if (!window.plongeursOriginaux) window.plongeursOriginaux = [];
    window.plongeursOriginaux.push({...nouveauPlongeur});
    
    console.log("✅ Plongeur ajouté:", nouveauPlongeur);
    
    // Re-render l'interface
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    // Synchroniser avec Firebase
    if (typeof syncToDatabase === 'function') {
      syncToDatabase();
    }
    
    showPlongeursMessage("✅ Plongeur ajouté avec succès", "success");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur ajout plongeur:", error);
    showPlongeursMessage("❌ Erreur lors de l'ajout", "error");
    return false;
  }
}

// Obtenir les prérogatives par défaut selon le niveau
function getPrerogativesParDefaut(niveau) {
  const niveauUpper = niveau.toUpperCase();
  
  if (niveauUpper.startsWith('E')) {
    return "Encadrement jusqu'à 60m, formation N1-N2-N3";
  } else if (niveauUpper === 'P5' || niveauUpper === 'N4') {
    return "Plongée autonome tous niveaux, guide de palanquée";
  } else if (niveauUpper === 'P4' || niveauUpper === 'N3') {
    return "Plongée autonome jusqu'à 60m";
  } else if (niveauUpper === 'N2') {
    return "Plongée encadrée jusqu'à 40m, autonome jusqu'à 20m";
  } else if (niveauUpper === 'N1') {
    return "Plongée encadrée jusqu'à 20m";
  }
  
  return "Prérogatives selon niveau";
}

// Supprimer un plongeur
function removePlongeur(plongeurId) {
  try {
    if (!window.plongeurs) {
      showPlongeursMessage("❌ Aucun plongeur à supprimer", "error");
      return false;
    }
    
    const index = window.plongeurs.findIndex(p => p.id === plongeurId);
    if (index === -1) {
      showPlongeursMessage("❌ Plongeur non trouvé", "error");
      return false;
    }
    
    const plongeurSupprime = window.plongeurs[index];
    
    // Supprimer de la liste
    window.plongeurs.splice(index, 1);
    
    // Supprimer de plongeursOriginaux
    if (window.plongeursOriginaux) {
      const origIndex = window.plongeursOriginaux.findIndex(p => p.id === plongeurId);
      if (origIndex !== -1) {
        window.plongeursOriginaux.splice(origIndex, 1);
      }
    }
    
    console.log("🗑️ Plongeur supprimé:", plongeurSupprime);
    
    // Re-render l'interface
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    // Synchroniser avec Firebase
    if (typeof syncToDatabase === 'function') {
      syncToDatabase();
    }
    
    showPlongeursMessage("✅ Plongeur supprimé avec succès", "success");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur suppression plongeur:", error);
    showPlongeursMessage("❌ Erreur lors de la suppression", "error");
    return false;
  }
}

// Trier les plongeurs par niveau
function sortPlongeurs() {
  try {
    if (!window.plongeurs || window.plongeurs.length === 0) {
      showPlongeursMessage("⚠️ Aucun plongeur à trier", "warning");
      return false;
    }
    
    // Ordre de tri des niveaux (du plus élevé au plus bas)
    const ordreNiveaux = ['E4', 'E3', 'E2', 'E1', 'P5', 'N4', 'P4', 'N3', 'N2', 'N1'];
    
    window.plongeurs.sort((a, b) => {
      const indexA = ordreNiveaux.indexOf(a.niveau.toUpperCase());
      const indexB = ordreNiveaux.indexOf(b.niveau.toUpperCase());
      
      // Si un niveau n'est pas dans la liste, le mettre à la fin
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      // Trier par ordre croissant des index (niveaux les plus élevés en premier)
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      
      // Si même niveau, trier par nom
      return a.nom.localeCompare(b.nom);
    });
    
    console.log("📊 Plongeurs triés par niveau");
    
    // Re-render l'interface
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    showPlongeursMessage("✅ Plongeurs triés par niveau", "success");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur tri plongeurs:", error);
    showPlongeursMessage("❌ Erreur lors du tri", "error");
    return false;
  }
}

// Export des plongeurs en JSON
function exportPlongeursToJSON() {
  try {
    if (!window.plongeurs || window.plongeurs.length === 0) {
      showPlongeursMessage("⚠️ Aucun plongeur à exporter", "warning");
      return false;
    }
    
    const dataToExport = {
      plongeurs: window.plongeurs,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Créer le lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = `plongeurs_JSA_${new Date().toISOString().split('T')[0]}.json`;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL
    URL.revokeObjectURL(url);
    
    console.log("📥 Export JSON réussi");
    showPlongeursMessage("✅ Export JSON téléchargé", "success");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur export JSON:", error);
    showPlongeursMessage("❌ Erreur lors de l'export", "error");
    return false;
  }
}

// Import des plongeurs depuis JSON
function importPlongeursFromJSON(file) {
  try {
    if (!file) {
      showPlongeursMessage("❌ Aucun fichier sélectionné", "error");
      return false;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        // Validation du format
        if (!jsonData.plongeurs || !Array.isArray(jsonData.plongeurs)) {
          throw new Error("Format JSON invalide - 'plongeurs' requis");
        }
        
        // Validation des plongeurs
        const plongeursValides = jsonData.plongeurs.filter(plongeur => {
          return plongeur.nom && plongeur.niveau && 
                 typeof plongeur.nom === 'string' && 
                 typeof plongeur.niveau === 'string';
        });
        
        if (plongeursValides.length === 0) {
          throw new Error("Aucun plongeur valide trouvé dans le fichier");
        }
        
        // Confirmation si des plongeurs existent déjà
        if (window.plongeurs && window.plongeurs.length > 0) {
          if (!confirm(`Des plongeurs sont déjà présents (${window.plongeurs.length}).\nVoulez-vous les remplacer par les ${plongeursValides.length} plongeurs du fichier ?`)) {
            return false;
          }
        }
        
        // Ajouter des IDs et timestamps si manquants
        const plongeursWithIds = plongeursValides.map(plongeur => ({
          ...plongeur,
          id: plongeur.id || Date.now() + Math.random(),
          timestamp: plongeur.timestamp || new Date().toISOString(),
          prerogatives: plongeur.prerogatives || getPrerogativesParDefaut(plongeur.niveau)
        }));
        
        // Remplacer la liste
        window.plongeurs = plongeursWithIds;
        window.plongeursOriginaux = [...plongeursWithIds];
        
        console.log("📤 Import JSON réussi:", plongeursWithIds.length, "plongeurs");
        
        // Re-render l'interface
        if (typeof renderPlongeurs === 'function') {
          renderPlongeurs();
        }
        
        // Synchroniser avec Firebase
        if (typeof syncToDatabase === 'function') {
          syncToDatabase();
        }
        
        showPlongeursMessage(`✅ ${plongeursWithIds.length} plongeurs importés avec succès`, "success");
        return true;
        
      } catch (parseError) {
        console.error("❌ Erreur parsing JSON:", parseError);
        showPlongeursMessage("❌ Fichier JSON invalide: " + parseError.message, "error");
        return false;
      }
    };
    
    reader.onerror = function() {
      console.error("❌ Erreur lecture fichier");
      showPlongeursMessage("❌ Erreur lors de la lecture du fichier", "error");
    };
    
    reader.readAsText(file);
    return true;
    
  } catch (error) {
    console.error("❌ Erreur import JSON:", error);
    showPlongeursMessage("❌ Erreur lors de l'import", "error");
    return false;
  }
}

// ===== CHARGEMENT PLONGEURS PRÉDÉFINIS =====

// Fonction de chargement des plongeurs prédéfinis
function chargerPlongeursPredefinis() {
  console.log("📋 Chargement des plongeurs prédéfinis JSA...");
  
  try {
    // Vérifier si la liste des plongeurs est vide ou contient peu de plongeurs
    if (!window.plongeurs || !Array.isArray(window.plongeurs) || window.plongeurs.length < 5) {
      
      // Ajouter des IDs et timestamps aux plongeurs prédéfinis
      const plongeursAvecIds = plongeursPredefinis.map((plongeur, index) => ({
        ...plongeur,
        id: Date.now() + index,
        timestamp: new Date().toISOString()
      }));
      
      // Charger les plongeurs prédéfinis
      window.plongeurs = [...plongeursAvecIds];
      window.plongeursOriginaux = [...plongeursAvecIds];
      
      console.log(`✅ ${plongeursPredefinis.length} plongeurs prédéfinis chargés`);
      
      // Re-render l'interface
      if (typeof renderPlongeurs === 'function') {
        renderPlongeurs();
      }
      
      // Sauvegarder automatiquement dans Firebase
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
      
      // Message à l'utilisateur
      showPlongeursMessage(`✅ ${plongeursPredefinis.length} plongeurs JSA chargés avec succès`, "success");
      
      return true;
    } else {
      console.log("ℹ️ Des plongeurs sont déjà présents, aucun chargement nécessaire");
      showPlongeursMessage("ℹ️ Des plongeurs sont déjà présents", "info");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Erreur lors du chargement des plongeurs prédéfinis:", error);
    showPlongeursMessage("❌ Erreur lors du chargement", "error");
    return false;
  }
}

// Ajouter un bouton de chargement des plongeurs prédéfinis
function ajouterBoutonChargementPredefinis() {
  // Chercher le container des boutons plongeurs
  const boutonContainer = document.querySelector('.plongeurs-actions');
  
  if (boutonContainer) {
    // Vérifier si le bouton n'existe pas déjà
    if (!document.getElementById('charger-predefinis-btn')) {
      const boutonCharger = document.createElement('button');
      boutonCharger.id = 'charger-predefinis-btn';
      boutonCharger.textContent = '👥 Charger plongeurs JSA';
      boutonCharger.className = 'btn-action';
      boutonCharger.style.cssText = `
        background: #17a2b8;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin: 5px;
        font-weight: bold;
        transition: all 0.3s ease;
      `;
      
      // Event listener
      boutonCharger.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Confirmation si des plongeurs existent déjà
        if (window.plongeurs && window.plongeurs.length > 0) {
          if (!confirm(`Des plongeurs sont déjà présents (${window.plongeurs.length}).\nVoulez-vous les remplacer par les plongeurs JSA prédéfinis ?`)) {
            return;
          }
        }
        
        // Effet visuel pendant le chargement
        boutonCharger.disabled = true;
        boutonCharger.textContent = '🔄 Chargement...';
        boutonCharger.style.background = '#6c757d';
        
        setTimeout(() => {
          const success = chargerPlongeursPredefinis();
          
          // Restaurer le bouton
          boutonCharger.disabled = false;
          
          if (success) {
            boutonCharger.textContent = '✅ Chargé !';
            boutonCharger.style.background = '#28a745';
          } else {
            boutonCharger.textContent = '⚠️ Déjà présents';
            boutonCharger.style.background = '#ffc107';
          }
          
          // Remettre le texte normal après 3 secondes
          setTimeout(() => {
            boutonCharger.textContent = '👥 Charger plongeurs JSA';
            boutonCharger.style.background = '#17a2b8';
          }, 3000);
        }, 500);
      });
      
      // Hover effect
      boutonCharger.addEventListener('mouseenter', () => {
        if (!boutonCharger.disabled) {
          boutonCharger.style.background = '#138496';
          boutonCharger.style.transform = 'translateY(-1px)';
        }
      });
      
      boutonCharger.addEventListener('mouseleave', () => {
        if (!boutonCharger.disabled) {
          boutonCharger.style.background = '#17a2b8';
          boutonCharger.style.transform = 'translateY(0)';
        }
      });
      
      // Ajouter le bouton au container
      boutonContainer.appendChild(boutonCharger);
      console.log("✅ Bouton de chargement plongeurs JSA ajouté");
    }
  }
}

// ===== GESTION DES EVENT LISTENERS =====

// Configuration des event listeners pour les plongeurs
function setupPlongeursEventListeners() {
  console.log("🔧 Configuration des event listeners plongeurs...");
  
  // Bouton d'ajout de plongeur
  const addBtn = document.getElementById("addPlongeurBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const nom = document.getElementById("plongeurNom")?.value?.trim();
      const niveau = document.getElementById("plongeurNiveau")?.value?.trim();
      const prerogatives = document.getElementById("plongeurPrerogatives")?.value?.trim();
      
      if (!nom || !niveau) {
        showPlongeursMessage("❌ Nom et niveau sont obligatoires", "error");
        return;
      }
      
      if (addPlongeur(nom, niveau, prerogatives)) {
        // Vider les champs après ajout réussi
        document.getElementById("plongeurNom").value = '';
        document.getElementById("plongeurNiveau").value = '';
        document.getElementById("plongeurPrerogatives").value = '';
      }
    });
  }
  
  // Bouton de tri
  const sortBtn = document.getElementById("sortPlongeursBtn");
  if (sortBtn) {
    sortBtn.addEventListener("click", sortPlongeurs);
  }
  
  // Bouton d'export JSON
  const exportBtn = document.getElementById("exportPlongeursBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportPlongeursToJSON);
  }
  
  // Bouton d'import JSON (déclenche le sélecteur de fichier)
  const importBtn = document.getElementById("importPlongeursBtn");
  const importInput = document.getElementById("importJSON");
  
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => {
      importInput.click();
    });
    
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        importPlongeursFromJSON(file);
        // Vider l'input pour permettre de réimporter le même fichier
        e.target.value = '';
      }
    });
  }
  
  // Auto-complétion des prérogatives selon le niveau sélectionné
  const niveauSelect = document.getElementById("plongeurNiveau");
  const prerogativesInput = document.getElementById("plongeurPrerogatives");
  
  if (niveauSelect && prerogativesInput) {
    niveauSelect.addEventListener("change", (e) => {
      const niveau = e.target.value;
      if (niveau && !prerogativesInput.value) {
        prerogativesInput.value = getPrerogativesParDefaut(niveau);
      }
    });
  }
  
  console.log("✅ Event listeners plongeurs configurés");
}

// ===== VALIDATION ET DIAGNOSTIC =====

// Valider un plongeur
function validatePlongeur(plongeur) {
  const errors = [];
  
  if (!plongeur.nom || typeof plongeur.nom !== 'string' || plongeur.nom.trim().length === 0) {
    errors.push("Nom manquant ou invalide");
  }
  
  if (!plongeur.niveau || typeof plongeur.niveau !== 'string' || plongeur.niveau.trim().length === 0) {
    errors.push("Niveau manquant ou invalide");
  }
  
  // Vérifier que le niveau est dans la liste des niveaux acceptés
  const niveauxValides = ['N1', 'N2', 'N3', 'N4', 'P4', 'P5', 'E1', 'E2', 'E3', 'E4'];
  if (plongeur.niveau && !niveauxValides.includes(plongeur.niveau.toUpperCase())) {
    errors.push(`Niveau "${plongeur.niveau}" non reconnu`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Diagnostic de la liste des plongeurs
function diagnosticPlongeurs() {
  console.log("🔍 Diagnostic de la liste des plongeurs...");
  
  if (!window.plongeurs || !Array.isArray(window.plongeurs)) {
    console.log("❌ Liste des plongeurs non initialisée");
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      errors: ["Liste des plongeurs non initialisée"]
    };
  }
  
  let valid = 0;
  let invalid = 0;
  const allErrors = [];
  
  window.plongeurs.forEach((plongeur, index) => {
    const validation = validatePlongeur(plongeur);
    if (validation.isValid) {
      valid++;
    } else {
      invalid++;
      allErrors.push(`Plongeur ${index + 1} (${plongeur.nom || 'sans nom'}): ${validation.errors.join(', ')}`);
    }
  });
  
  const diagnostic = {
    total: window.plongeurs.length,
    valid: valid,
    invalid: invalid,
    errors: allErrors
  };
  
  console.log("📊 Diagnostic plongeurs:", diagnostic);
  return diagnostic;
}

// ===== AFFICHAGE DES MESSAGES =====

// Afficher un message dans la section plongeurs
function showPlongeursMessage(message, type = "info") {
  const messageContainer = document.getElementById("plongeurs-message");
  if (!messageContainer) return;
  
  const colors = {
    info: "#17a2b8",
    success: "#28a745", 
    warning: "#ffc107",
    error: "#dc3545"
  };
  
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️", 
    error: "❌"
  };
  
  messageContainer.innerHTML = `
    <div style="
      color: ${colors[type]}; 
      font-weight: bold; 
      padding: 8px 12px; 
      background: ${colors[type]}15; 
      border: 1px solid ${colors[type]}40; 
      border-radius: 4px;
      margin: 5px 0;
    ">
      ${icons[type]} ${message}
    </div>
  `;
  
  // Auto-effacement après 4 secondes pour les messages info/success
  if (type === "info" || type === "success") {
    setTimeout(() => {
      if (messageContainer.innerHTML.includes(message)) {
        messageContainer.innerHTML = '';
      }
    }, 4000);
  }
}

// ===== FONCTIONS UTILITAIRES =====

// Nettoyer la liste des plongeurs (supprime les doublons)
function cleanupPlongeurs() {
  if (!window.plongeurs || !Array.isArray(window.plongeurs)) {
    return false;
  }
  
  console.log("🧹 Nettoyage des plongeurs...");
  
  const avant = window.plongeurs.length;
  const plongeursUniques = [];
  const nomsVus = new Set();
  
  window.plongeurs.forEach(plongeur => {
    const nomNormalise = plongeur.nom.toLowerCase().trim();
    if (!nomsVus.has(nomNormalise)) {
      nomsVus.add(nomNormalise);
      plongeursUniques.push(plongeur);
    }
  });
  
  window.plongeurs = plongeursUniques;
  window.plongeursOriginaux = [...plongeursUniques];
  
  const apres = window.plongeurs.length;
  const doublonsSupprimes = avant - apres;
  
  if (doublonsSupprimes > 0) {
    console.log(`🧹 ${doublonsSupprimes} doublon(s) supprimé(s)`);
    showPlongeursMessage(`✅ ${doublonsSupprimes} doublon(s) supprimé(s)`, "success");
    
    // Re-render l'interface
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    return true;
  } else {
    console.log("✅ Aucun doublon trouvé");
    showPlongeursMessage("✅ Aucun doublon trouvé", "info");
    return false;
  }
}

// Rechercher des plongeurs par nom ou niveau
function searchPlongeurs(query) {
  if (!window.plongeurs || !Array.isArray(window.plongeurs) || !query) {
    return [];
  }
  
  const queryLower = query.toLowerCase().trim();
  
  return window.plongeurs.filter(plongeur => {
    return plongeur.nom.toLowerCase().includes(queryLower) ||
           plongeur.niveau.toLowerCase().includes(queryLower) ||
           (plongeur.prerogatives && plongeur.prerogatives.toLowerCase().includes(queryLower));
  });
}

// Obtenir les statistiques des plongeurs
function getPlongeursStats() {
  if (!window.plongeurs || !Array.isArray(window.plongeurs)) {
    return {
      total: 0,
      parNiveau: {}
    };
  }
  
  const stats = {
    total: window.plongeurs.length,
    parNiveau: {}
  };
  
  window.plongeurs.forEach(plongeur => {
    const niveau = plongeur.niveau.toUpperCase();
    stats.parNiveau[niveau] = (stats.parNiveau[niveau] || 0) + 1;
  });
  
  return stats;
}

// ===== INITIALISATION =====

// Initialisation du gestionnaire de plongeurs
function initializePlongeursManager() {
  console.log("🏊‍♂️ Initialisation du gestionnaire de plongeurs...");
  
  try {
    // Initialiser les variables globales si elles n'existent pas
    if (typeof window.plongeurs === 'undefined') {
      window.plongeurs = [];
    }
    if (typeof window.plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
    }
    
    // Configurer les event listeners
    setupPlongeursEventListeners();
    
    // Ajouter le bouton de chargement des prédéfinis
    setTimeout(() => {
      ajouterBoutonChargementPredefinis();
    }, 100);
    
    // Charger automatiquement les plongeurs prédéfinis si la liste est vide
    if (window.plongeurs.length === 0) {
      console.log("📋 Liste vide détectée, chargement automatique des plongeurs JSA...");
      setTimeout(() => {
        chargerPlongeursPredefinis();
      }, 1000); // Délai pour laisser l'interface se charger
    }
    
    // Diagnostic initial
    setTimeout(() => {
      diagnosticPlongeurs();
    }, 2000);
    
    console.log("✅ Gestionnaire de plongeurs initialisé avec succès");
    
  } catch (error) {
    console.error("❌ Erreur initialisation plongeurs:", error);
    showPlongeursMessage("❌ Erreur lors de l'initialisation", "error");
  }
}

// ===== AUTO-INITIALISATION =====

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePlongeursManager);
} else {
  initializePlongeursManager();
}

// ===== EXPORTS GLOBAUX =====
window.addPlongeur = addPlongeur;
window.removePlongeur = removePlongeur;
window.sortPlongeurs = sortPlongeurs;
window.exportPlongeursToJSON = exportPlongeursToJSON;
window.importPlongeursFromJSON = importPlongeursFromJSON;
window.chargerPlongeursPredefinis = chargerPlongeursPredefinis;
window.ajouterBoutonChargementPredefinis = ajouterBoutonChargementPredefinis;
window.validatePlongeur = validatePlongeur;
window.diagnosticPlongeurs = diagnosticPlongeurs;
window.showPlongeursMessage = showPlongeursMessage;
window.cleanupPlongeurs = cleanupPlongeurs;
window.searchPlongeurs = searchPlongeurs;
window.getPlongeursStats = getPlongeursStats;
window.getPrerogativesParDefaut = getPrerogativesParDefaut;
window.setupPlongeursEventListeners = setupPlongeursEventListeners;
window.initializePlongeursManager = initializePlongeursManager;