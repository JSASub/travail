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
  // Synchroniser le menu flottant après le rendu
  if (typeof updateFloatingPlongeursList === 'function') {
	setTimeout(updateFloatingPlongeursList, 200);
  }
}

function renderPalanquees() {
  const container = document.getElementById("palanqueesContainer");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (palanquees.length === 0) return;
  
  // S'assurer que toutes les palanquées sont des tableaux
  palanquees = palanquees.map((palanquee, idx) => {
    if (!Array.isArray(palanquee)) {
      console.warn(`⚠️ Correction palanquée ${idx + 1} dans renderPalanquees`);
      
      if (palanquee && typeof palanquee === 'object') {
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
        
        return nouveauTableau;
      } else {
        // Palanquée vide
        const nouveauTableau = [];
        nouveauTableau.horaire = '';
        nouveauTableau.profondeurPrevue = '';
        nouveauTableau.dureePrevue = '';
        nouveauTableau.profondeurRealisee = '';
        nouveauTableau.dureeRealisee = '';
        nouveauTableau.paliers = '';
        return nouveauTableau;
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

  // Rendu des palanquées
  palanquees.forEach((palanquee, index) => {
    const palanqueeDiv = document.createElement("div");
    palanqueeDiv.className = "palanquee";
    palanqueeDiv.dataset.index = index;
    
    // Vérifier les alertes avec les nouvelles règles
    const hasAlert = typeof checkAlert === 'function' ? checkAlert(palanquee) : false;
    if (hasAlert) {
      palanqueeDiv.dataset.alert = "true";
    }
    
    // Générer le contenu HTML avec tri par niveau
    let plongeursHTML = '';
    if (palanquee.length === 0) {
      plongeursHTML = '<li class="palanquee-empty">Aucun plongeur assigné - Glissez des plongeurs ici</li>';
    } else {
      // Trier les plongeurs par niveau dans l'affichage
      const ordreNiveaux = ['E4', 'E3', 'E2', 'GP', 'N3', 'N2', 'N1', 'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'débutant', 'Déb', 'N4/GP', 'N4'];
      
      const plongeursTriés = [...palanquee].sort((a, b) => {
        const indexA = ordreNiveaux.indexOf(a.niveau) !== -1 ? ordreNiveaux.indexOf(a.niveau) : 999;
        const indexB = ordreNiveaux.indexOf(b.niveau) !== -1 ? ordreNiveaux.indexOf(b.niveau) : 999;
        return indexA - indexB;
      });
      
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
            <div contenteditable="true"
				class="plongeur-prerogatives-editable" 
				data-placeholder="PE40..."
				title="Prérogatives du plongeur"
				style="display: inline-block; min-width: 80px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; background: white; cursor: text; user-select: text;"
				oninput="updatePlongeurPrerogativesRealTime(${index}, ${originalIndex}, this.textContent || '')"
				onmousedown="event.stopPropagation();"
				onclick="event.stopPropagation();">${plongeur.pre || ''}</div>
            <span class="plongeur-niveau">${plongeur.niveau}</span>
            <span class="return-plongeur" onclick="returnPlongeurToMainList(${index}, ${originalIndex})" title="Remettre dans la liste principale">↩️</span>
          </div>
        </li>
      `;
      }).join('');
    }
    
    // Calculer les nouvelles statistiques avec les jeunes plongeurs
    const detailedStats = typeof getDetailedStats === 'function' ? getDetailedStats(palanquee) : getBasicStats(palanquee);
    
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
                 onclick="handlePalanqueeEdit(${index})" />
          
          <label>Prof. prévue :</label>
          <input type="number" class="palanquee-prof-prevue" value="${palanquee.profondeurPrevue || ''}" 
                 placeholder="m" min="0" max="100"
                 onchange="updatePalanqueeDetail(${index}, 'profondeurPrevue', this.value)"
                 onclick="handlePalanqueeEdit(${index})" />
          
          <label>Durée prévue :</label>
          <input type="number" class="palanquee-duree-prevue" value="${palanquee.dureePrevue || ''}" 
                 placeholder="min" min="0" max="200"
                 onchange="updatePalanqueeDetail(${index}, 'dureePrevue', this.value)"
                 onclick="handlePalanqueeEdit(${index})" />
        </div>
        
        <div class="detail-row">
          <label>Prof. réalisée :</label>
          <input type="number" class="palanquee-prof-realisee" value="${palanquee.profondeurRealisee || ''}" 
                 placeholder="m" min="0" max="100"
                 onchange="updatePalanqueeDetail(${index}, 'profondeurRealisee', this.value)"
                 onclick="handlePalanqueeEdit(${index})" />
          
          <label>Durée réalisée :</label>
          <input type="number" class="palanquee-duree-realisee" value="${palanquee.dureeRealisee || ''}" 
                 placeholder="min" min="0" max="200"
                 onchange="updatePalanqueeDetail(${index}, 'dureeRealisee', this.value)"
                 onclick="handlePalanqueeEdit(${index})" />
        </div>
        
        <div class="detail-row paliers-row">
          <label>Paliers :</label>
          <input type="text" class="palanquee-paliers" value="${palanquee.paliers || ''}" 
                 placeholder="3 min à 3 m, 5 min à 6 m ..."
                 onchange="updatePalanqueeDetail(${index}, 'paliers', this.value)"
                 onclick="handlePalanqueeEdit(${index})" />
        </div>
      </div>
    `;
    
    container.appendChild(palanqueeDiv);
  });
  
  // Mettre à jour les compteurs et alertes
  if (typeof updateCompteurs === 'function') {
    updateCompteurs();
  }
  if (typeof updateAlertes === 'function') {
    updateAlertes();
  }
// À la fin de renderPalanquees(), avant la dernière }
fixPrerogativesAfterRender();
}
//
function fixPrerogativesAfterRender() {
  setTimeout(() => {
    document.querySelectorAll('.plongeur-prerogatives-editable').forEach(input => {
      // Supprimer tous les gestionnaires d'événements existants
      input.replaceWith(input.cloneNode(true));
      
      // Récupérer la nouvelle référence
      const newInput = document.querySelector(`input[value="${input.value}"].plongeur-prerogatives-editable`);
      if (newInput) {
        // Réattacher seulement l'événement oninput
        newInput.addEventListener('input', function() {
          const palanqueeIndex = this.closest('.palanquee').dataset.index;
          const plongeurIndex = this.closest('.palanquee-plongeur-item').dataset.plongeurIndex;
          updatePlongeurPrerogativesRealTime(palanqueeIndex, plongeurIndex, this.value);
        });
        
        // Forcer les styles de sélection
        newInput.style.userSelect = 'text';
        newInput.style.cursor = 'text';
        newInput.style.pointerEvents = 'auto';
        
        // Gérer les événements de souris
        newInput.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          this.focus();
        });
        
        newInput.addEventListener('click', function(e) {
          e.stopPropagation();
        });
        
        newInput.addEventListener('selectstart', function(e) {
          e.stopPropagation();
          return true;
        });
      }
    });
  }, 100);
}
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
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
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

// Rendre tout le header cliquable quand le menu est collapsed
document.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('floating-plongeurs-header');
  
  if (header) {
    header.addEventListener('click', function(e) {
      // Éviter le double clic si on clique directement sur le bouton toggle
      if (e.target.id !== 'toggle-plongeurs-menu' && plongeursMenuCollapsed) {
        togglePlongeursMenu();
      }
    });
  }
});