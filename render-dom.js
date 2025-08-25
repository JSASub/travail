// render-dom.js - Rendu DOM ultra-sécurisé avec nouvelles règles (VERSION CORRIGÉE)

// ===== RENDER FUNCTIONS =====
function renderPlongeurs() {
  const liste = document.getElementById("listePlongeurs");
  if (!liste) return;
  
  liste.innerHTML = "";
  
  if (plongeurs.length === 0) {
    liste.innerHTML = '<li style="text-align: center; color: #666; font-style: italic; padding: 20px;">Aucun plongeur ajouté</li>';
  } else {
    plongeurs.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "plongeur-item";
      li.draggable = true;
      li.dataset.index = i;
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
          plongeurs.splice(i, 1);
          plongeursOriginaux = plongeursOriginaux.filter(po => po.nom !== p.nom);
          syncToDatabase();
        }
      });
      
      liste.appendChild(li);
    });
  }
  
  if (typeof updateCompteurs === 'function') {
    updateCompteurs();
  }
}

function renderPalanquees() {
  console.log("🎨 Rendu des palanquées avec correction automatique...");
  
  const container = document.getElementById("palanqueesContainer");
  if (!container) {
    console.error("❌ Container palanqueesContainer non trouvé");
    return;
  }
  
  // Vider le container
  container.innerHTML = "";
  
  // Vérifier que palanquees existe et est un tableau
  if (!Array.isArray(palanquees)) {
    console.error("❌ palanquees n'est pas un tableau:", typeof palanquees);
    container.innerHTML = '<div style="color: red; padding: 20px; text-align: center;">❌ Erreur: Données des palanquées corrompues</div>';
    return;
  }
  
  if (palanquees.length === 0) {
    console.log("ℹ️ Aucune palanquée à afficher");
    return;
  }
  
  console.log(`📋 Rendu de ${palanquees.length} palanquée(s)...`);
  
  // === CORRECTION AUTOMATIQUE DE LA STRUCTURE ===
  let correctionsAppliquees = 0;
  
  palanquees = palanquees.map((palanquee, idx) => {
    if (!Array.isArray(palanquee)) {
      console.warn(`🔧 Correction palanquée ${idx + 1} (type: ${typeof palanquee})`);
      correctionsAppliquees++;
      
      if (palanquee && typeof palanquee === 'object') {
        // Convertir objet en tableau
        const nouveauTableau = [];
        
        Object.keys(palanquee).forEach(key => {
          if (!isNaN(key) && palanquee[key] && typeof palanquee[key] === 'object' && palanquee[key].nom) {
            nouveauTableau.push(palanquee[key]);
          }
        });
        
        // Ajouter les propriétés spéciales
        nouveauTableau.horaire = palanquee.horaire || '';
        nouveauTableau.profondeurPrevue = palanquee.profondeurPrevue || '';
        nouveauTableau.dureePrevue = palanquee.dureePrevue || '';
        nouveauTableau.profondeurRealisee = palanquee.profondeurRealisee || '';
        nouveauTableau.dureeRealisee = palanquee.dureeRealisee || '';
        nouveauTableau.paliers = palanquee.paliers || '';
        
        console.log(`✅ Palanquée ${idx + 1} corrigée: ${nouveauTableau.length} plongeur(s)`);
        return nouveauTableau;
      } else {
        // Palanquée vide par défaut
        const tableauVide = [];
        tableauVide.horaire = '';
        tableauVide.profondeurPrevue = '';
        tableauVide.dureePrevue = '';
        tableauVide.profondeurRealisee = '';
        tableauVide.dureeRealisee = '';
        tableauVide.paliers = '';
        
        console.log(`✅ Palanquée ${idx + 1} initialisée vide`);
        return tableauVide;
      }
    }
    
    // S'assurer que les propriétés existent même pour les tableaux existants
    if (!palanquee.hasOwnProperty('horaire')) palanquee.horaire = '';
    if (!palanquee.hasOwnProperty('profondeurPrevue')) palanquee.profondeurPrevue = '';
    if (!palanquee.hasOwnProperty('dureePrevue')) palanquee.dureePrevue = '';
    if (!palanquee.hasOwnProperty('profondeurRealisee')) palanquee.profondeurRealisee = '';
    if (!palanquee.hasOwnProperty('dureeRealisee')) palanquee.dureeRealisee = '';
    if (!palanquee.hasOwnProperty('paliers')) palanquee.paliers = '';
    
    return palanquee;
  });
  
  if (correctionsAppliquees > 0) {
    console.log(`🔧 ${correctionsAppliquees} palanquée(s) corrigée(s)`);
  }
  
  // === FONCTION UTILITAIRES POUR LE RENDU ===
  
  // Ordre de tri des niveaux (du plus capé au moins capé)
  const ordreNiveaux = ['E4', 'E3', 'E2', 'GP', 'N3', 'N2', 'N1', 'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'dÉbutant', 'Déb', 'N4/GP', 'N4'];
  
  function trierPlongeurs(plongeursArray) {
    return [...plongeursArray].sort((a, b) => {
      const indexA = ordreNiveaux.indexOf(a.niveau) !== -1 ? ordreNiveaux.indexOf(a.niveau) : 999;
      const indexB = ordreNiveaux.indexOf(b.niveau) !== -1 ? ordreNiveaux.indexOf(b.niveau) : 999;
      return indexA - indexB;
    });
  }
  
  function getDetailedStats(palanquee) {
    if (!Array.isArray(palanquee)) return "Stats indisponibles";
    
    const stats = {
      gps: palanquee.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4", "GP"].includes(p.niveau)).length,
      n1s: palanquee.filter(p => p && p.niveau === "N1").length,
      autonomes: palanquee.filter(p => p && ["N2", "N3"].includes(p.niveau)).length,
      plgOr: palanquee.filter(p => p && p.niveau === "Plg.Or").length,
      plgAr: palanquee.filter(p => p && p.niveau === "Plg.Ar").length,
      plgBr: palanquee.filter(p => p && p.niveau === "Plg.Br").length,
      debutants: palanquee.filter(p => p && ["Déb.", "débutant", "Déb"].includes(p.niveau)).length
    };
    
    let display = `GP: ${stats.gps}`;
    
    if (stats.n1s > 0 || stats.plgOr > 0) {
      display += ` | N1/Or: ${stats.n1s + stats.plgOr}`;
    }
    
    if (stats.autonomes > 0) {
      display += ` | Auto: ${stats.autonomes}`;
    }
    
    if (stats.plgAr > 0) {
      display += ` | Argent: ${stats.plgAr}`;
    }
    
    if (stats.plgBr > 0) {
      display += ` | Bronze: ${stats.plgBr}`;
    }
    
    if (stats.debutants > 0) {
      display += ` | Déb: ${stats.debutants}`;
    }
    
    return display;
  }
  
  function checkAlertForPalanquee(palanquee) {
    if (!Array.isArray(palanquee)) return true; // Structure invalide = alerte
    
    const plongeurs = palanquee.filter(p => p && p.nom); // Vrais plongeurs seulement
    
    // Classification
    const n1s = plongeurs.filter(p => p.niveau === "N1");
    const plgOr = plongeurs.filter(p => p.niveau === "Plg.Or");
    const plgAr = plongeurs.filter(p => p.niveau === "Plg.Ar");
    const plgBr = plongeurs.filter(p => p.niveau === "Plg.Br");
    const debutants = plongeurs.filter(p => ["Déb.", "débutant", "Déb"].includes(p.niveau));
    const gps = plongeurs.filter(p => ["N4/GP", "N4", "E2", "E3", "E4", "GP"].includes(p.niveau));
    const autonomes = plongeurs.filter(p => ["N2", "N3"].includes(p.niveau));
    
    // Tests d'alertes
    const alertes = [
      plongeurs.length > 5, // Plus de 5 plongeurs
      plongeurs.length === 1, // Plongeur isolé
      (n1s.length > 0 && gps.length === 0), // N1 sans GP
      (plgOr.length > 0 && gps.length === 0), // Plongeur Or sans GP
      (plgAr.length > 0 && gps.length === 0), // Plongeur Argent sans GP
      (plgBr.length > 0 && gps.length === 0), // Plongeur Bronze sans GP
      (debutants.length > 0 && gps.length === 0), // Débutants sans GP
      (autonomes.length > 3), // Plus de 3 autonomes
      ((plongeurs.length === 4 || plongeurs.length === 5) && gps.length === 0), // 4-5 plongeurs sans GP
      // Mélange enfants/adultes
      (() => {
        const enfants = plgBr.length + plgAr.length + plgOr.length;
        const adultes = n1s.length + autonomes.length + debutants.length;
        return (enfants > 0 && adultes > 0 && (plongeurs.length > 3 || enfants > 2));
      })()
    ];
    
    return alertes.some(alerte => alerte);
  }
  
  // === RENDU DE CHAQUE PALANQUÉE ===
  
  palanquees.forEach((palanquee, index) => {
    try {
      console.log(`🏊 Rendu palanquée ${index + 1}:`, palanquee.length, "plongeur(s)");
      
      const palanqueeDiv = document.createElement("div");
      palanqueeDiv.className = "palanquee";
      palanqueeDiv.dataset.index = index;
      
      // Vérifier les alertes
      const hasAlert = checkAlertForPalanquee(palanquee);
      if (hasAlert) {
        palanqueeDiv.dataset.alert = "true";
        console.log(`⚠️ Alerte détectée pour palanquée ${index + 1}`);
      }
      
      // === GÉNÉRATION DU HTML ===
      
      // Génération de la liste des plongeurs
      let plongeursHTML = '';
      if (palanquee.length === 0) {
        plongeursHTML = '<li class="palanquee-empty">Aucun plongeur assigné - Glissez des plongeurs ici</li>';
      } else {
        // Trier les plongeurs par niveau dans l'affichage
        const plongeursTriés = trierPlongeurs(palanquee);
        
        plongeursHTML = plongeursTriés.map((plongeur, sortedIndex) => {
          // Retrouver l'index original pour les opérations
          const originalIndex = palanquee.findIndex(p => p === plongeur);
          
          return `
          <li class="plongeur-item palanquee-plongeur-item" draggable="true" 
              data-type="palanquee" 
              data-palanquee-index="${index}" 
              data-plongeur-index="${originalIndex}">
            <div class="plongeur-content">
              <span class="plongeur-nom">${plongeur.nom}</span>
              <input type="text" 
                     class="plongeur-prerogatives-editable" 
                     value="${plongeur.pre || ''}" 
                     placeholder="PE40..."
                     title="Prérogatives du plongeur"
                     onchange="updatePlongeurPrerogatives(${index}, ${originalIndex}, this.value)"
                     onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
              <span class="plongeur-niveau">${plongeur.niveau}</span>
              <span class="return-plongeur" onclick="returnPlongeurToMainList(${index}, ${originalIndex})" title="Remettre dans la liste principale">↩️</span>
            </div>
          </li>
        `;
        }).join('');
      }
      
      // Calculer les statistiques détaillées
      const detailedStats = getDetailedStats(palanquee);
      
      // HTML complet de la palanquée
      palanqueeDiv.innerHTML = `
        <div class="palanquee-title">
          <span>Palanquée ${index + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
          <button class="delete-palanquee" onclick="deletePalanquee(${index})" title="Supprimer cette palanquée">🗑️</button>
        </div>
        
        <div class="palanquee-stats" style="font-size: 11px; color: #666; margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px;">
          ${detailedStats}
        </div>
        
        <ul class="palanquee-plongeurs-list" style="list-style: none; padding: 0; margin: 10px 0;">
          ${plongeursHTML}
        </ul>
        
        <div class="palanquee-details">
          <div class="detail-row">
            <label>Horaire :</label>
            <input type="time" class="palanquee-horaire" value="${palanquee.horaire || ''}" 
                   onchange="updatePalanqueeDetail(${index}, 'horaire', this.value)"
                   onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
            
            <label>Prof. prévue :</label>
            <input type="number" class="palanquee-prof-prevue" value="${palanquee.profondeurPrevue || ''}" 
                   placeholder="m" min="0" max="100"
                   onchange="updatePalanqueeDetail(${index}, 'profondeurPrevue', this.value)"
                   onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
            
            <label>Durée prévue :</label>
            <input type="number" class="palanquee-duree-prevue" value="${palanquee.dureePrevue || ''}" 
                   placeholder="min" min="0" max="200"
                   onchange="updatePalanqueeDetail(${index}, 'dureePrevue', this.value)"
                   onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
          </div>
          
          <div class="detail-row">
            <label>Prof. réalisée :</label>
            <input type="number" class="palanquee-prof-realisee" value="${palanquee.profondeurRealisee || ''}" 
                   placeholder="m" min="0" max="100"
                   onchange="updatePalanqueeDetail(${index}, 'profondeurRealisee', this.value)"
                   onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
            
            <label>Durée réalisée :</label>
            <input type="number" class="palanquee-duree-realisee" value="${palanquee.dureeRealisee || ''}" 
                   placeholder="min" min="0" max="200"
                   onchange="updatePalanqueeDetail(${index}, 'dureeRealisee', this.value)"
                   onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
          </div>
          
          <div class="detail-row paliers-row">
            <label>Paliers :</label>
            <input type="text" class="palanquee-paliers" value="${palanquee.paliers || ''}" 
                   placeholder="3 min à 3 m, 5 min à 6 m ..."
                   onchange="updatePalanqueeDetail(${index}, 'paliers', this.value)"
                   onclick="handlePalanqueeEdit && handlePalanqueeEdit(${index})" />
          </div>
        </div>
      `;
      
      container.appendChild(palanqueeDiv);
      
    } catch (error) {
      console.error(`❌ Erreur rendu palanquée ${index + 1}:`, error);
      
      // Afficher une palanquée d'erreur
      const errorDiv = document.createElement("div");
      errorDiv.className = "palanquee";
      errorDiv.style.background = "#f8d7da";
      errorDiv.style.border = "2px solid #dc3545";
      errorDiv.innerHTML = `
        <div style="color: #721c24; padding: 15px; text-align: center;">
          ❌ Erreur lors du rendu de la palanquée ${index + 1}
          <br><small>${error.message}</small>
          <br><button onclick="this.parentElement.parentElement.remove()" style="margin-top: 10px;">Supprimer</button>
        </div>
      `;
      container.appendChild(errorDiv);
    }
  });
  
  console.log(`✅ Rendu terminé: ${palanquees.length} palanquée(s) affichée(s)`);
  
  // === MISE À JOUR DES COMPTEURS ET ALERTES ===
  
  try {
    // Mettre à jour les compteurs
    if (typeof updateCompteurs === 'function') {
      updateCompteurs();
    }
    
    // Mettre à jour les alertes (avec délai pour s'assurer que le DOM est à jour)
    setTimeout(() => {
      if (typeof updateAlertes === 'function') {
        updateAlertes();
        console.log("🚨 Alertes de sécurité vérifiées");
      }
    }, 100);
    
  } catch (error) {
    console.error("❌ Erreur mise à jour compteurs/alertes:", error);
  }
  
  // === SAUVEGARDE AUTOMATIQUE SI CORRECTIONS ===
  
  if (correctionsAppliquees > 0) {
    console.log("💾 Sauvegarde automatique après corrections...");
    setTimeout(() => {
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
    }, 500);
  }
}

// === FONCTIONS DE MANIPULATION DES PALANQUÉES (si pas déjà définies) ===

if (typeof deletePalanquee !== 'function') {
  window.deletePalanquee = function(index) {
    if (confirm(`Supprimer la palanquée ${index + 1} ?\n\nLes plongeurs seront remis dans la liste principale.`)) {
      // Remettre les plongeurs dans la liste principale
      if (palanquees[index] && Array.isArray(palanquees[index])) {
        palanquees[index].forEach(plongeur => {
          if (plongeur && plongeur.nom) {
            plongeurs.push(plongeur);
            if (typeof plongeursOriginaux !== 'undefined' && Array.isArray(plongeursOriginaux)) {
              plongeursOriginaux.push(plongeur);
            }
          }
        });
      }
      
      // Supprimer la palanquée
      palanquees.splice(index, 1);
      
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
    }
  };
}

if (typeof returnPlongeurToMainList !== 'function') {
  window.returnPlongeurToMainList = function(palanqueeIndex, plongeurIndex) {
    if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
      const plongeur = palanquees[palanqueeIndex].splice(plongeurIndex, 1)[0];
      
      if (typeof plongeurs !== 'undefined' && Array.isArray(plongeurs)) {
        plongeurs.push(plongeur);
      }
      if (typeof plongeursOriginaux !== 'undefined' && Array.isArray(plongeursOriginaux)) {
        plongeursOriginaux.push(plongeur);
      }
      
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
    }
  };
}

if (typeof updatePlongeurPrerogatives !== 'function') {
  window.updatePlongeurPrerogatives = function(palanqueeIndex, plongeurIndex, newValue) {
    if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
      palanquees[palanqueeIndex][plongeurIndex].pre = newValue.trim();
      
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
    }
  };
}

if (typeof updatePalanqueeDetail !== 'function') {
  window.updatePalanqueeDetail = function(palanqueeIndex, property, newValue) {
    if (palanquees[palanqueeIndex]) {
      palanquees[palanqueeIndex][property] = newValue;
      
      if (typeof syncToDatabase === 'function') {
        syncToDatabase();
      }
    }
  };
}
//
console.log("🎨 Fonction renderPalanquees complète chargée avec correction automatique et alertes de sécurité");

// Export pour usage global
window.renderPalanquees = renderPalanquees;

// ===== FONCTION DE STATISTIQUES DE BASE (FALLBACK) =====
function getBasicStats(palanquee) {
  if (!Array.isArray(palanquee)) return "Stats indisponibles";
  
  const gps = palanquee.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4", "GP"].includes(p.niveau));
  const n1s = palanquee.filter(p => p && p.niveau === "N1");
  const autonomes = palanquee.filter(p => p && ["N2", "N3"].includes(p.niveau));
  const jeunesPlongeurs = palanquee.filter(p => p && ["Plg.Or", "Plg.Ar", "Plg.Br"].includes(p.niveau));
  
  let display = `GP: ${gps.length} | N1: ${n1s.length} | Autonomes: ${autonomes.length}`;
  
  if (jeunesPlongeurs.length > 0) {
    display += ` | Jeunes: ${jeunesPlongeurs.length}`;
  }
  
  return display;
}

// ===== FONCTIONS DE MANIPULATION DES PALANQUÉES AVEC VALIDATION =====
function deletePalanquee(index) {
  if (confirm(`Supprimer la palanquée ${index + 1} ?\n\nLes plongeurs seront remis dans la liste principale.`)) {
    // Remettre les plongeurs dans la liste principale
    if (palanquees[index] && Array.isArray(palanquees[index])) {
      palanquees[index].forEach(plongeur => {
        if (plongeur && plongeur.nom) {
          plongeurs.push(plongeur);
          plongeursOriginaux.push(plongeur);
        }
      });
    }
    
    // Supprimer la palanquée
    palanquees.splice(index, 1);
    syncToDatabase();
  }
}

function returnPlongeurToMainList(palanqueeIndex, plongeurIndex) {
  if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
    const plongeur = palanquees[palanqueeIndex].splice(plongeurIndex, 1)[0];
    plongeurs.push(plongeur);
    plongeursOriginaux.push(plongeur);
    syncToDatabase();
  }
}

function updatePlongeurPrerogatives(palanqueeIndex, plongeurIndex, newValue) {
  if (palanquees[palanqueeIndex] && palanquees[palanqueeIndex][plongeurIndex]) {
    palanquees[palanqueeIndex][plongeurIndex].pre = newValue.trim();
    syncToDatabase();
  }
}

function updatePalanqueeDetail(palanqueeIndex, property, newValue) {
  if (palanquees[palanqueeIndex]) {
    palanquees[palanqueeIndex][property] = newValue;
    syncToDatabase();
  }
}

// Fonction pour gérer l'édition avec système de verrous et validation
function handlePalanqueeEdit(palanqueeIndex) {
  if (typeof interceptPalanqueeEdit === 'function') {
    interceptPalanqueeEdit(palanqueeIndex, () => {
      console.log(`Édition autorisée pour palanquée ${palanqueeIndex}`);
    });
  }
}

// ===== FONCTION DE VALIDATION LORS DU DROP =====
function validateDropToPalanquee(palanqueeIndex, plongeur) {
  if (typeof validatePalanqueeAddition === 'function') {
    const validation = validatePalanqueeAddition(palanqueeIndex, plongeur);
    
    if (!validation.valid) {
      // Afficher les messages d'erreur
      const messageText = validation.messages.join('\n');
      alert(`❌ Ajout impossible :\n\n${messageText}`);
      return false;
    } else {
      // Optionnel : afficher un message de succès
      if (validation.messages.length > 0) {
        console.log("✅", validation.messages.join(', '));
      }
      return true;
    }
  }
  
  // Si pas de fonction de validation, autoriser par défaut
  return true;
}

console.log("🎨 Module de rendu DOM avec nouvelles règles chargé");