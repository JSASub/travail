// render-dom.js - Rendu DOM ultra-sécurisé

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
        
        nouveauTableau.horaire = palanquee.horaire || '';
        nouveauTableau.profondeurPrevue = palanquee.profondeurPrevue || '';
        nouveauTableau.dureePrevue = palanquee.dureePrevue || '';
        nouveauTableau.profondeurRealisee = palanquee.profondeurRealisee || '';
        nouveauTableau.dureeRealisee = palanquee.dureeRealisee || '';
        nouveauTableau.paliers = palanquee.paliers || '';
        
        return nouveauTableau;
      } else {
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
    
    // S'assurer que les propriétés existent
    if (!palanquee.hasOwnProperty('horaire')) palanquee.horaire = '';
    if (!palanquee.hasOwnProperty('profondeurPrevue')) palanquee.profondeurPrevue = '';
    if (!palanquee.hasOwnProperty('dureePrevue')) palanquee.dureePrevue = '';
    if (!palanquee.hasOwnProperty('profondeurRealisee')) palanquee.profondeurRealisee = '';
    if (!palanquee.hasOwnProperty('dureeRealisee')) palanquee.dureeRealisee = '';
    if (!palanquee.hasOwnProperty('paliers')) palanquee.paliers = '';
    
    return palanquee;
  });

  palanquees.forEach((palanquee, index) => {
    const palanqueeDiv = document.createElement("div");
    palanqueeDiv.className = "palanquee";
    palanqueeDiv.dataset.index = index;
    
    // Vérifier les alertes
    const hasAlert = typeof checkAlert === 'function' ? checkAlert(palanquee) : false;
    if (hasAlert) {
      palanqueeDiv.dataset.alert = "true";
    }
    
    palanqueeDiv.innerHTML = `
      <div class="palanquee-title">
        <span>Palanquée ${index + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
        <button class="delete-palanquee" onclick="deletePalanquee(${index})" title="Supprimer cette palanquée">🗑️</button>
      </div>
      
      <ul class="palanquee-plongeurs-list" style="list-style: none; padding: 0; margin: 10px 0;">
        ${palanquee.length === 0 ? 
          '<li class="palanquee-empty">Aucun plongeur assigné - Glissez des plongeurs ici</li>' :
          palanquee.map((plongeur, plongeurIndex) => `
            <li class="plongeur-item palanquee-plongeur-item" draggable="true" 
                data-type="palanquee" 
                data-palanquee-index="${index}" 
                data-plongeur-index="${plongeurIndex}">
              <div class="plongeur-content">
                <span class="plongeur-nom">${plongeur.nom}</span>
                <input type="text" 
                       class="plongeur-prerogatives-editable" 
                       value="${plongeur.pre || ''}" 
                       placeholder="PE40..."
                       title="Prérogatives du plongeur"
                       onchange="updatePlongeurPrerogatives(${index}, ${plongeurIndex}, this.value)"
                       onclick="handlePalanqueeEdit(${index})" />
                <span class="plongeur-niveau">${plongeur.niveau}</span>
                <span class="return-plongeur" onclick="returnPlongeurToMainList(${index}, ${plongeurIndex})" title="Remettre dans la liste principale">↩️</span>
              </div>
            </li>
          `).join('')
        }
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
                 placeholder="3min à 3m, 5min à 6m..."
                 onchange="updatePalanqueeDetail(${index}, 'paliers', this.value)"
                 onclick="handlePalanqueeEdit(${index})" />
        </div>
      </div>
    `;
    
    container.appendChild(palanqueeDiv);
  });
  
  if (typeof updateCompteurs === 'function') {
    updateCompteurs();
  }
  if (typeof updateAlertes === 'function') {
    updateAlertes();
  }
}

// ===== FONCTIONS DE MANIPULATION DES PALANQUÉES =====
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

// Fonction pour gérer l'édition avec système de verrous
function handlePalanqueeEdit(palanqueeIndex) {
  if (typeof interceptPalanqueeEdit === 'function') {
    interceptPalanqueeEdit(palanqueeIndex, () => {
      // L'action d'édition est autorisée
      console.log(`Édition autorisée pour palanquée ${palanqueeIndex}`);
    });
  }
}

console.log("🎨 Module de rendu DOM chargé");