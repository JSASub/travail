// plongeurs-manager.js - Gestion complète des plongeurs (extrait de main-complete.js)

// ===== GESTION DES PLONGEURS =====

// Fonction d'ajout de plongeur sécurisée
function addPlongeur(nom, niveau, prerogatives = "") {
  try {
    // Validation préalable
    if (!nom || !niveau) {
      console.error("❌ Nom et niveau requis");
      alert("Erreur : Nom et niveau sont requis");
      return false;
    }
    
    // S'assurer que les variables globales existent
    if (typeof plongeurs === 'undefined') window.plongeurs = [];
    if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    
    // Validation complète
    const validation = validatePlongeur(nom, niveau, prerogatives);
    
    if (!validation.valid) {
      console.error("❌ Erreurs de validation:", validation.errors);
      alert("Erreurs de validation :\n" + validation.errors.join('\n'));
      return false;
    }
    
    const nouveauPlongeur = { 
      nom: nom.trim(), 
      niveau: niveau.trim(), 
      pre: prerogatives.trim() 
    };
    
    plongeurs.push(nouveauPlongeur);
    plongeursOriginaux.push(nouveauPlongeur);
    
    console.log("✅ Plongeur ajouté:", nouveauPlongeur);
    
    // Re-rendre la liste
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    // Synchroniser avec la base de données
    if (typeof syncToDatabase === 'function') {
      syncToDatabase();
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erreur ajout plongeur:", error);
    alert("Erreur lors de l'ajout du plongeur : " + error.message);
    return false;
  }
}

// Fonction de suppression de plongeur
function removePlongeur(index) {
  try {
    if (index < 0 || index >= plongeurs.length) {
      throw new Error("Index invalide");
    }
    
    const plongeurSupprime = plongeurs[index];
    plongeurs.splice(index, 1);
    
    // Supprimer aussi des originaux
    plongeursOriginaux = plongeursOriginaux.filter(po => 
      po.nom !== plongeurSupprime.nom || po.niveau !== plongeurSupprime.niveau
    );
    
    console.log("✅ Plongeur supprimé:", plongeurSupprime);
    
    // Synchroniser avec la base de données
    if (typeof syncToDatabase === 'function') {
      syncToDatabase();
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erreur suppression plongeur:", error);
    return false;
  }
}

// ===== TRI DES PLONGEURS AVEC NOUVEAUX NIVEAUX =====
function sortPlongeurs(type) {
  try {
    if (typeof currentSort !== 'undefined') {
      currentSort = type;
    }
    
    // Mettre à jour l'interface des boutons de tri
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.sort === type) {
        btn.classList.add('active');
      }
    });
    
    switch(type) {
      case 'nom':
        plongeurs.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
      case 'niveau':
        // Nouvel ordre de tri avec les niveaux jeunes plongeurs
        const niveauOrder = {
          'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
          'N3': 7, 'N2': 8, 'N1': 9,
          'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
          'Déb.': 13, 'débutant': 14, 'Déb': 15
        };
        plongeurs.sort((a, b) => (niveauOrder[a.niveau] || 99) - (niveauOrder[b.niveau] || 99));
        break;
      case 'none':
      default:
        if (typeof plongeursOriginaux !== 'undefined') {
          plongeurs = [...plongeursOriginaux];
        }
        break;
    }
    
    // Re-rendre la liste
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    console.log(`📋 Plongeurs triés par: ${type}`);
    
  } catch (error) {
    console.error("❌ Erreur sortPlongeurs:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Tri plongeurs");
    }
  }
}

// ===== IMPORT/EXPORT JSON SÉCURISÉ =====
function importPlongeursFromJSON(fileData) {
  try {
    if (!fileData) {
      throw new Error("Aucune donnée fournie");
    }
    
    let data;
    
    // Parser les données JSON
    if (typeof fileData === 'string') {
      try {
        data = JSON.parse(fileData);
      } catch (parseError) {
        throw new Error("Fichier JSON invalide : " + parseError.message);
      }
    } else {
      data = fileData;
    }
    
    // S'assurer que les variables globales existent
    if (typeof plongeurs === 'undefined') window.plongeurs = [];
    if (typeof plongeursOriginaux === 'undefined') window.plongeursOriginaux = [];
    
    let importedPlongeurs = [];
    
    // Traiter différents formats de fichier
    if (data.plongeurs && Array.isArray(data.plongeurs)) {
      importedPlongeurs = data.plongeurs;
    } else if (Array.isArray(data)) {
      importedPlongeurs = data;
    } else {
      throw new Error("Format de fichier non reconnu. Le fichier doit contenir un tableau de plongeurs.");
    }
    
    if (importedPlongeurs.length === 0) {
      throw new Error("Aucun plongeur trouvé dans le fichier");
    }
    
    // Valider et nettoyer les données
    const validPlongeurs = [];
    const errors = [];
    
    importedPlongeurs.forEach((p, index) => {
      try {
        if (!p || typeof p !== 'object') {
          errors.push(`Ligne ${index + 1}: Données invalides`);
          return;
        }
        
        const nom = p.nom ? p.nom.toString().trim() : "";
        const niveau = p.niveau ? p.niveau.toString().trim() : "";
        const pre = (p.prerogatives || p.pre || "").toString().trim();
        
        if (!nom || !niveau) {
          errors.push(`Ligne ${index + 1}: Nom ou niveau manquant`);
          return;
        }
        
        validPlongeurs.push({ nom, niveau, pre });
        
      } catch (error) {
        errors.push(`Ligne ${index + 1}: ${error.message}`);
      }
    });
    
    if (validPlongeurs.length === 0) {
      throw new Error("Aucun plongeur valide dans le fichier:\n" + errors.join('\n'));
    }
    
    // Remplacer les données
    plongeurs = validPlongeurs;
    plongeursOriginaux = [...validPlongeurs];
    
    console.log(`✅ Import réussi: ${plongeurs.length} plongeurs importés`);
    if (errors.length > 0) {
      console.warn("⚠️ Erreurs lors de l'import:", errors);
    }
    
    // Re-rendre la liste
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
    
    // Synchroniser avec la base de données
    if (typeof syncToDatabase === 'function') {
      syncToDatabase();
    }
    
    return {
      success: true,
      count: plongeurs.length,
      message: `${plongeurs.length} plongeur(s) importé(s) avec succès` + 
               (errors.length > 0 ? `\n${errors.length} erreur(s) ignorée(s)` : "")
    };
    
  } catch (error) {
    console.error("❌ Erreur import JSON:", error);
    return {
      success: false,
      message: `Erreur d'import: ${error.message}`
    };
  }
}
//
function exportPlongeursToJSON() {
  try {
    const dpNom = document.getElementById("dp-nom")?.value || "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || "Non définie";
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    const exportData = {
      meta: {
        dp: dpNom,
        date: dpDate,
        lieu: dpLieu,
        plongee: dpPlongee,
        version: "3.0.1",
        exportDate: new Date().toISOString(),
        type: "plongeurs_only"
      },
      plongeurs: plongeurs.map(p => ({
        nom: p.nom,
        niveau: p.niveau,
        prerogatives: p.pre || ""
      })),
      stats: {
        totalPlongeurs: plongeurs.length,
        niveaux: getPlongeursStats()
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plongeurs-jsas-${dpDate || 'export'}-${dpPlongee}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log("📤 Export JSON plongeurs effectué");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur exportToJSON:", error);
    alert("Erreur lors de l'export : " + error.message);
    return false;
  }
}

// ===== STATISTIQUES DES PLONGEURS =====
function getPlongeursStats() {
  try {
    if (!Array.isArray(plongeurs)) {
      return {};
    }
    
    const stats = {};
    
    plongeurs.forEach(p => {
      if (p && p.niveau) {
        stats[p.niveau] = (stats[p.niveau] || 0) + 1;
      }
    });
    
    // Ajouter des catégories
    const categories = {
      encadrants: ['E4', 'E3', 'E2', 'GP', 'N4/GP', 'N4'].reduce((sum, niveau) => sum + (stats[niveau] || 0), 0),
      autonomes: ['N3', 'N2'].reduce((sum, niveau) => sum + (stats[niveau] || 0), 0),
      encadres: ['N1'].reduce((sum, niveau) => sum + (stats[niveau] || 0), 0),
      jeunes: ['Plg.Or', 'Plg.Ar', 'Plg.Br'].reduce((sum, niveau) => sum + (stats[niveau] || 0), 0),
      debutants: ['Déb.', 'débutant', 'Déb'].reduce((sum, niveau) => sum + (stats[niveau] || 0), 0)
    };
    
    return {
      parNiveau: stats,
      parCategorie: categories,
      total: plongeurs.length
    };
    
  } catch (error) {
    console.error("❌ Erreur getPlongeursStats:", error);
    return {};
  }
}

// ===== RECHERCHE ET FILTRAGE =====
function searchPlongeurs(query) {
  try {
    if (!query || query.trim() === '') {
      // Réinitialiser la liste complète
      if (typeof renderPlongeurs === 'function') {
        renderPlongeurs();
      }
      return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const filteredPlongeurs = plongeurs.filter(p => {
      return p.nom.toLowerCase().includes(searchTerm) ||
             p.niveau.toLowerCase().includes(searchTerm) ||
             (p.pre && p.pre.toLowerCase().includes(searchTerm));
    });
    
    // Afficher les résultats filtrés
    displayFilteredPlongeurs(filteredPlongeurs);
    
    console.log(`🔍 Recherche "${query}": ${filteredPlongeurs.length} résultat(s)`);
    
  } catch (error) {
    console.error("❌ Erreur searchPlongeurs:", error);
  }
}

function displayFilteredPlongeurs(filteredList) {
  const liste = document.getElementById("listePlongeurs");
  if (!liste) return;
  
  liste.innerHTML = "";
  
  if (filteredList.length === 0) {
    liste.innerHTML = '<li style="text-align: center; color: #666; font-style: italic; padding: 20px;">Aucun résultat trouvé</li>';
  } else {
    filteredList.forEach((p, i) => {
      // Retrouver l'index original
      const originalIndex = plongeurs.findIndex(orig => 
        orig.nom === p.nom && orig.niveau === p.niveau
      );
      
      const li = document.createElement("li");
      li.className = "plongeur-item";
      li.draggable = true;
      li.dataset.index = originalIndex;
      li.dataset.type = "mainList";
      
      li.innerHTML = `
        <div class="plongeur-content">
          <span class="plongeur-nom">${p.nom}</span>
          <span class="plongeur-niveau">${p.niveau}</span>
          <span class="plongeur-prerogatives">[${p.pre || 'Aucune'}]</span>
          <span class="delete-plongeur" title="Supprimer ce plongeur">⌫</span>
        </div>
      `;
      
      // Event listener pour suppression
      li.querySelector(".delete-plongeur").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Supprimer ${p.nom} de la liste ?`)) {
          removePlongeur(originalIndex);
        }
      });
      
      liste.appendChild(li);
    });
  }
}

// ===== VALIDATION DES PLONGEURS =====
function validatePlongeur(nom, niveau, prerogatives = "") {
  const errors = [];
  
  // Validation du nom - Plus robuste
  if (!nom || typeof nom !== 'string') {
    errors.push("Le nom est requis");
  } else if (nom.trim().length < 2) {
    errors.push("Le nom doit contenir au moins 2 caractères");
  } else if (nom.trim().length > 50) {
    errors.push("Le nom ne peut pas dépasser 50 caractères");
  }
  
  // Validation du niveau - Vérification plus stricte
  const niveauxValides = [
    'E4', 'E3', 'E2', 'GP', 'N4/GP', 'N4', 'N3', 'N2', 'N1',
    'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'débutant', 'Déb'
  ];
  
  if (!niveau || typeof niveau !== 'string') {
    errors.push("Le niveau est requis");
  } else if (!niveauxValides.includes(niveau.trim())) {
    errors.push(`Niveau de plongée invalide. Niveaux acceptés: ${niveauxValides.join(', ')}`);
  }
  
  // Validation des prérogatives
  if (prerogatives && typeof prerogatives === 'string' && prerogatives.length > 100) {
    errors.push("Les prérogatives ne peuvent pas dépasser 100 caractères");
  }
  
  // Vérifier les doublons - Seulement si les données de base sont valides
  if (nom && niveau && errors.length === 0) {
    const existe = plongeurs.some(p => 
      p.nom && p.nom.toLowerCase().trim() === nom.toLowerCase().trim() &&
      p.niveau === niveau
    );
    
    if (existe) {
      errors.push("Ce plongeur existe déjà dans la liste");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
// ===== UTILITAIRES =====
function getPlongeurByIndex(index) {
  try {
    if (index >= 0 && index < plongeurs.length) {
      return plongeurs[index];
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur getPlongeurByIndex:", error);
    return null;
  }
}

function findPlongeurIndex(nom, niveau) {
  try {
    return plongeurs.findIndex(p => 
      p.nom.toLowerCase() === nom.toLowerCase() && p.niveau === niveau
    );
  } catch (error) {
    console.error("❌ Erreur findPlongeurIndex:", error);
    return -1;
  }
}

function updatePlongeurPrerogatives(index, newPrerogatives) {
  try {
    if (index >= 0 && index < plongeurs.length) {
      plongeurs[index].pre = newPrerogatives.trim();
      
      // Mettre à jour aussi dans les originaux
      const plongeur = plongeurs[index];
      const origIndex = plongeursOriginaux.findIndex(p => 
        p.nom === plongeur.nom && p.niveau === plongeur.niveau
      );
      
      if (origIndex !== -1) {
        plongeursOriginaux[origIndex].pre = newPrerogatives.trim();
      }
      
      // Synchroniser
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Erreur updatePlongeurPrerogatives:", error);
    return false;
  }
}

// ===== SETUP EVENT LISTENERS POUR LES PLONGEURS =====
function setupPlongeursEventListeners() {
  console.log("🎛️ Configuration des event listeners plongeurs...");
  
  try {
    // === AJOUT DE PLONGEUR SÉCURISÉ ===
    const addForm = document.getElementById("addForm");
    if (addForm) {
      addForm.addEventListener("submit", e => {
        e.preventDefault();
        
        try {
          const nomInput = document.getElementById("nom");
          const niveauInput = document.getElementById("niveau");
          const preInput = document.getElementById("pre");
          
          if (!nomInput || !niveauInput || !preInput) {
            alert("Erreur : Éléments de formulaire manquants");
            return;
          }
          
          const nom = nomInput.value ? nomInput.value.trim() : "";
          const niveau = niveauInput.value ? niveauInput.value.trim() : "";
          const pre = preInput.value ? preInput.value.trim() : "";
          
          // Validation simple avant l'appel principal
          if (!nom) {
            alert("Veuillez saisir un nom");
            nomInput.focus();
            return;
          }
          
          if (!niveau) {
            alert("Veuillez sélectionner un niveau");
            niveauInput.focus();
            return;
          }
          
          // Ajouter le plongeur (la validation complète est faite dans addPlongeur)
          const success = addPlongeur(nom, niveau, pre);
          
          if (success) {
            // Vider les champs
            nomInput.value = "";
            niveauInput.value = "";
            preInput.value = "";
            
            // Focus sur le nom pour ajout rapide
            nomInput.focus();
            
            // Message de succès optionnel
            console.log("✅ Plongeur ajouté avec succès");
          }
          
        } catch (error) {
          console.error("❌ Erreur ajout plongeur:", error);
          alert("Erreur inattendue : " + error.message);
          if (typeof handleError === 'function') {
            handleError(error, "Ajout plongeur");
          }
        }
      });
    } else {
      console.warn("⚠️ Formulaire d'ajout non trouvé (#addForm)");
    }

    // === AUTRES EVENT LISTENERS... ===
    // Le reste du code reste identique
    
    console.log("✅ Event listeners plongeurs configurés avec succès");
    
  } catch (error) {
    console.error("❌ Erreur configuration event listeners plongeurs:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Configuration event listeners plongeurs");
    }
  }
}
// ===== GESTION DES PRÉROGATIVES =====
function getPrerogativesSuggestions(niveau) {
  const suggestions = {
    'E4': ['DP', 'Toutes prérogatives'],
    'E3': ['DP', 'Nitrox', 'Trim', 'Plongée profonde'],
    'E2': ['GP', 'Nitrox', 'Plongée profonde'],
    'GP': ['GP', 'Nitrox'],
    'N4/GP': ['GP', 'Nitrox', 'PA60'],
    'N4': ['PA60', 'Nitrox'],
    'N3': ['PA60', 'Nitrox', 'Autonomie 60m'],
    'N2': ['PA40', 'PE40', 'Nitrox'],
    'N1': ['PE20'],
    'Plg.Or': ['PE12', 'Plongée encadrée'],
    'Plg.Ar': ['PE6', 'Plongée encadrée'],
    'Plg.Br': ['PE6', 'Plongée encadrée'],
    'Déb.': ['Baptême', 'PE6'],
    'débutant': ['Baptême', 'PE6'],
    'Déb': ['Baptême', 'PE6']
  };
  
  return suggestions[niveau] || [];
}

function showPrerogativesSuggestions(niveau, inputElement) {
  try {
    const suggestions = getPrerogativesSuggestions(niveau);
    
    if (suggestions.length === 0) return;
    
    const suggestionsText = suggestions.join(', ');
    const useThis = confirm(
      `Suggestions de prérogatives pour ${niveau} :\n\n${suggestionsText}\n\n` +
      `Utiliser ces suggestions ?`
    );
    
    if (useThis && inputElement) {
      inputElement.value = suggestions[0]; // Utiliser la première suggestion
      inputElement.focus();
    }
    
  } catch (error) {
    console.error("❌ Erreur suggestions prérogatives:", error);
  }
}

// ===== BATCH OPERATIONS =====
function addMultiplePlongeurs(plongeursList) {
  try {
    let added = 0;
    const errors = [];
    
    plongeursList.forEach((plongeurData, index) => {
      try {
        const validation = validatePlongeur(
          plongeurData.nom, 
          plongeurData.niveau, 
          plongeurData.pre
        );
        
        if (validation.valid) {
          if (addPlongeur(plongeurData.nom, plongeurData.niveau, plongeurData.pre)) {
            added++;
          }
        } else {
          errors.push(`Ligne ${index + 1}: ${validation.errors.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Ligne ${index + 1}: ${error.message}`);
      }
    });
    
    const result = {
      success: added > 0,
      added: added,
      total: plongeursList.length,
      errors: errors
    };
    
    console.log(`📊 Ajout multiple: ${added}/${plongeursList.length} plongeurs ajoutés`);
    
    return result;
    
  } catch (error) {
    console.error("❌ Erreur addMultiplePlongeurs:", error);
    return {
      success: false,
      added: 0,
      total: 0,
      errors: [error.message]
    };
  }
}

function clearAllPlongeurs() {
  try {
    const confirmDelete = window.confirm(  // ✅ Nom de variable différent
      `⚠️ Supprimer tous les plongeurs ?\n\n` +
      `${plongeurs.length} plongeur(s) seront supprimés.\n` +
      `Cette action est irréversible !`
    );
    
    if (confirmDelete) {  // ✅ Utilise la variable correcte
      plongeurs.length = 0;
      plongeursOriginaux.length = 0;
      
      // Synchroniser
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
      
      // Re-rendre la liste si la fonction existe
      if (typeof renderPlongeurs === 'function') {
        renderPlongeurs();
      }
      
      console.log("🗑️ Tous les plongeurs supprimés");
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error("❌ Erreur clearAllPlongeurs:", error);
    return false;
  }
}
// ===== EXPORT AVANCÉ =====
function exportPlongeursToCSV() {
  try {
    if (plongeurs.length === 0) {
      alert("Aucun plongeur à exporter");
      return false;
    }
    
    // En-têtes CSV
    let csvContent = "Nom,Niveau,Prérogatives\n";
    
    // Données
    plongeurs.forEach(p => {
      const nom = `"${p.nom.replace(/"/g, '""')}"`;
      const niveau = `"${p.niveau}"`;
      const pre = `"${(p.pre || '').replace(/"/g, '""')}"`;
      csvContent += `${nom},${niveau},${pre}\n`;
    });
    
    // Téléchargement
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plongeurs-jsas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log("📊 Export CSV réussi");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur export CSV:", error);
    alert("Erreur lors de l'export CSV : " + error.message);
    return false;
  }
}

// ===== DIAGNOSTIC PLONGEURS =====
function diagnosticPlongeurs() {
  try {
    const stats = getPlongeursStats();
    const diagnostic = {
      timestamp: new Date().toISOString(),
      totalPlongeurs: plongeurs.length,
      stats: stats,
      validation: {
        nomsVides: plongeurs.filter(p => !p.nom || p.nom.trim() === '').length,
        niveauxInvalides: plongeurs.filter(p => !p.niveau).length,
        doublons: findDoublons()
      },
      memoire: {
        plongeurs: plongeurs.length,
        plongeursOriginaux: plongeursOriginaux?.length || 0,
        coherence: plongeurs.length === (plongeursOriginaux?.length || 0)
      }
    };
    
    console.log("🔍 === DIAGNOSTIC PLONGEURS ===");
    console.log(diagnostic);
    console.log("==============================");
    
    return diagnostic;
    
  } catch (error) {
    console.error("❌ Erreur diagnostic plongeurs:", error);
    return null;
  }
}

function findDoublons() {
  try {
    const seen = new Set();
    const doublons = [];
    
    plongeurs.forEach((p, index) => {
      const key = `${p.nom.toLowerCase()}_${p.niveau}`;
      if (seen.has(key)) {
        doublons.push({ index, plongeur: p });
      } else {
        seen.add(key);
      }
    });
    
    return doublons;
    
  } catch (error) {
    console.error("❌ Erreur findDoublons:", error);
    return [];
  }
}

// ===== INITIALISATION =====
function initializePlongeursManager() {
  console.log("🏊‍♂️ Initialisation du gestionnaire de plongeurs...");
  
  try {
    // S'assurer que les variables globales existent
    if (typeof window.plongeurs === 'undefined') {
      window.plongeurs = [];
    }
    if (typeof window.plongeursOriginaux === 'undefined') {
      window.plongeursOriginaux = [];
    }
    
    // Configurer les event listeners
    setupPlongeursEventListeners();
    
    console.log("✅ Gestionnaire de plongeurs initialisé");
    
  } catch (error) {
    console.error("❌ Erreur initialisation gestionnaire plongeurs:", error);
  }
}
//
function debugValidation(nom, niveau, prerogatives = "") {
  console.log("🔍 === DEBUG VALIDATION ===");
  console.log("Nom:", nom, "(type:", typeof nom, ")");
  console.log("Niveau:", niveau, "(type:", typeof niveau, ")");
  console.log("Prérogatives:", prerogatives, "(type:", typeof prerogatives, ")");
  
  const validation = validatePlongeur(nom, niveau, prerogatives);
  console.log("Résultat validation:", validation);
  console.log("==========================");
  
  return validation;
}

// Export de la fonction de debug
window.debugValidation = debugValidation;
// ===== EXPORTS GLOBAUX =====
window.addPlongeur = addPlongeur;
window.removePlongeur = removePlongeur;
window.sortPlongeurs = sortPlongeurs;
window.importPlongeursFromJSON = importPlongeursFromJSON;
window.exportPlongeursToJSON = exportPlongeursToJSON;
window.exportPlongeursToCSV = exportPlongeursToCSV;
window.searchPlongeurs = searchPlongeurs;
window.validatePlongeur = validatePlongeur;
window.getPlongeursStats = getPlongeursStats;
window.getPlongeurByIndex = getPlongeurByIndex;
window.findPlongeurIndex = findPlongeurIndex;
window.updatePlongeurPrerogatives = updatePlongeurPrerogatives;
window.getPrerogativesSuggestions = getPrerogativesSuggestions;
window.showPrerogativesSuggestions = showPrerogativesSuggestions;
window.addMultiplePlongeurs = addMultiplePlongeurs;
window.clearAllPlongeurs = clearAllPlongeurs;
window.diagnosticPlongeurs = diagnosticPlongeurs;
window.initializePlongeursManager = initializePlongeursManager;

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePlongeursManager);
} else {
  initializePlongeursManager();
}

console.log("🏊‍♂️ Module Plongeurs Manager chargé - Toutes fonctionnalités plongeurs disponibles");