// render-dom.js - Rendu DOM et interactions avec système de verrous

// ===== RENDER FUNCTIONS =====
function renderPlongeurs() {
  const liste = $("listePlongeurs");
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
      
      li.innerHTML = `
        <div class="plongeur-content">
          <span class="plongeur-nom">${p.nom}</span>
          <span class="plongeur-niveau">${p.niveau}</span>
          <span class="plongeur-prerogatives">[${p.pre || 'Aucune'}]</span>
          <span class="delete-plongeur" title="Supprimer ce plongeur">❌</span>
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
  const container = $("palanqueesContainer");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (palanquees.length === 0) return;
  
  // NOUVELLE VÉRIFICATION : S'assurer que toutes les palanquées sont des tableaux
  palanquees = palanquees.map((palanquee, idx) => {
    if (!Array.isArray(palanquee)) {
      console.warn(`⚠️ Correction palanquée ${idx + 1} dans renderPalanquees`);
      
      if (palanquee && typeof palanquee === 'object') {
        const nouveauTableau = [];
        
        // Extraire les plongeurs
        Object.keys(palanquee).forEach(key => {
          if (!isNaN(key) && palanquee[key] && typeof palanquee[key] === 'object' && palanquee[key].nom) {
            nouveauTableau.push(palanquee[key]);
          }
        });
        
        // Préserver les propriétés
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
    return palanquee;
  });
  
  palanquees.forEach((palanquee, idx) => {
    const div = document.createElement("div");
    div.className = "palanquee";
    div.dataset.index = idx;
    div.dataset.alert = (typeof checkAlert === 'function' ? checkAlert(palanquee) : false) ? "true" : "false";
    
    div.innerHTML = `
      <div class="palanquee-title">
        <span>Palanquée ${idx + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
        <span class="remove-palanquee" style="color: red; cursor: pointer;">❌</span>
      </div>
    `;
    
    // NOUVEAU : Gestion des verrous
    const palanqueeId = `palanquee-${idx}`;
    const lock = palanqueeLocks[palanqueeId];
    
    if (lock) {
      const indicator = document.createElement('div');
      indicator.className = 'lock-indicator';
      
      if (lock.userId === currentUser?.uid) {
        indicator.className += ' editing-self';
        indicator.textContent = '🔧 En modification par vous';
        div.classList.add('editing-self');
      } else {
        indicator.className += ' editing-other';
        indicator.textContent = `🔒 ${lock.userName} modifie`;
        div.classList.add('editing-other');
      }
      
      const title = div.querySelector('.palanquee-title');
      if (title) {
        title.appendChild(indicator);
      }
    }
    
    if (palanquee.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "palanquee-empty";
      emptyMsg.textContent = "Glissez des plongeurs ici ⬇️";
      div.appendChild(emptyMsg);
    } else {
      const plongeursList = document.createElement("ul");
      plongeursList.className = "palanquee-plongeurs-list";
      
      palanquee.forEach((plg, plongeurIndex) => {
        const li = document.createElement("li");
        li.className = "plongeur-item palanquee-plongeur-item";
        li.draggable = true;
        
        li.innerHTML = `
          <div class="plongeur-content">
            <span class="plongeur-nom">${plg.nom}</span>
            <span class="plongeur-niveau">${plg.niveau}</span>
            <input type="text" class="plongeur-prerogatives-editable" 
                   value="${plg.pre || ''}" 
                   placeholder="PE20, PA40..."
                   data-palanquee-idx="${idx}"
                   data-plongeur-idx="${plongeurIndex}"
                   title="Cliquez pour modifier les prérogatives">
            <span class="return-plongeur" 
                  data-palanquee-idx="${idx}"
                  data-plongeur-idx="${plongeurIndex}"
                  title="Remettre dans la liste">⬅️</span>
          </div>
        `;
        
        plongeursList.appendChild(li);
      });
      
      div.appendChild(plongeursList);
    }

    // Ajouter les détails de la palanquée APRÈS la liste des plongeurs (toujours présents)
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "palanquee-details";
    detailsDiv.innerHTML = `
      <div class="detail-row">
        <label>Horaire mise à l'eau:</label>
        <input type="time" class="palanquee-horaire" data-palanquee-idx="${idx}" value="${palanquee.horaire || ''}" placeholder="HH:MM">
      </div>
      <div class="detail-row">
        <label>Profondeur prévue (m):</label>
        <input type="number" class="palanquee-prof-prevue" data-palanquee-idx="${idx}" value="${palanquee.profondeurPrevue || ''}" placeholder="ex: 20" min="0" max="100">
        <label>Durée prévue (min):</label>
        <input type="number" class="palanquee-duree-prevue" data-palanquee-idx="${idx}" value="${palanquee.dureePrevue || ''}" placeholder="ex: 45" min="0" max="120">
      </div>
      <div class="detail-row">
        <label>Profondeur réalisée (m):</label>
        <input type="number" class="palanquee-prof-realisee" data-palanquee-idx="${idx}" value="${palanquee.profondeurRealisee || ''}" placeholder="ex: 18" min="0" max="100">
        <label>Durée réalisée (min):</label>
        <input type="number" class="palanquee-duree-realisee" data-palanquee-idx="${idx}" value="${palanquee.dureeRealisee || ''}" placeholder="ex: 42" min="0" max="120">
      </div>
      <div class="detail-row paliers-row">
        <label>Paliers effectués:</label>
        <input type="text" class="palanquee-paliers" data-palanquee-idx="${idx}" value="${palanquee.paliers || ''}" placeholder="ex: 3min à 3m, 5min à 6m" style="flex: 1; min-width: 200px;">
      </div>
    `;
    
    div.appendChild(detailsDiv);

    // Event listeners
    div.querySelector(".remove-palanquee").addEventListener("click", () => {
      if (confirm(`Supprimer la palanquée ${idx + 1} ?`)) {
        // Remettre tous les plongeurs dans la liste principale
        palanquee.forEach(plg => {
          plongeurs.push(plg);
          plongeursOriginaux.push(plg);
        });
        palanquees.splice(idx, 1);
        syncToDatabase();
      }
    });

    // NOUVEAU : Gestion des verrous pour le drop
    div.addEventListener("drop", async (e) => {
      e.preventDefault();
      div.classList.remove('drag-over');
      
      // Vérifier le verrou avant d'autoriser la modification
      if (typeof acquirePalanqueeLock === 'function') {
        const hasLock = await acquirePalanqueeLock(idx);
        if (!hasLock) {
          if (typeof showLockNotification === 'function') {
            showLockNotification("Impossible de modifier - palanquée en cours d'édition par un autre DP", "warning");
          }
          return;
        }
      }
      
      const data = e.dataTransfer.getData("text/plain");
      
      try {
        const dragData = JSON.parse(data);
        
        if (dragData.type === "fromPalanquee") {
          if (dragData.palanqueeIndex !== undefined && 
              dragData.plongeurIndex !== undefined && 
              palanquees[dragData.palanqueeIndex] &&
              palanquees[dragData.palanqueeIndex][dragData.plongeurIndex]) {
            
            const sourcePalanquee = palanquees[dragData.palanqueeIndex];
            const plongeur = sourcePalanquee.splice(dragData.plongeurIndex, 1)[0];
            palanquee.push(plongeur);
            syncToDatabase();
          }
          return;
        }
        
        if (dragData.type === "fromMainList") {
          const plongeurToMove = dragData.plongeur;
          
          const indexToRemove = plongeurs.findIndex(p => 
            p.nom === plongeurToMove.nom && p.niveau === plongeurToMove.niveau
          );
          
          if (indexToRemove !== -1) {
            plongeurs.splice(indexToRemove, 1);
            palanquee.push(plongeurToMove);
            syncToDatabase();
          }
          return;
        }
        
      } catch (error) {
        console.error("❌ Erreur parsing données drag:", error);
      }
    });

    // NOUVEAU : Intercepter les clics sur les champs éditables pour vérifier les verrous
    div.addEventListener("click", async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        // Vérifier si c'est un champ de palanquée
        if (e.target.classList.contains('palanquee-horaire') ||
            e.target.classList.contains('palanquee-prof-prevue') ||
            e.target.classList.contains('palanquee-duree-prevue') ||
            e.target.classList.contains('palanquee-prof-realisee') ||
            e.target.classList.contains('palanquee-duree-realisee') ||
            e.target.classList.contains('palanquee-paliers') ||
            e.target.classList.contains('plongeur-prerogatives-editable')) {
          
          if (typeof acquirePalanqueeLock === 'function') {
            const hasLock = await acquirePalanqueeLock(idx);
            if (!hasLock) {
              e.preventDefault();
              e.target.blur();
              if (typeof showLockNotification === 'function') {
                showLockNotification(`Modification bloquée - palanquée en cours d'édition`, "warning");
              }
              return;
            }
          }
        }
      }
    });

    // Drag & drop amélioré
    div.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      div.classList.add('drag-over');
    });
    
    div.addEventListener("dragleave", e => {
      if (!div.contains(e.relatedTarget)) {
        div.classList.remove('drag-over');
      }
    });

    container.appendChild(div);
  });
  
  setupPalanqueesEventListeners();
  if (typeof updateCompteurs === 'function') {
    updateCompteurs();
  }
  
  // NOUVEAU : Mettre à jour l'UI des verrous après le rendu
  if (typeof updatePalanqueeLockUI === 'function') {
    updatePalanqueeLockUI();
  }
}

function setupPalanqueesEventListeners() {
  // Event delegation pour les boutons de retour
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("return-plongeur")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      
      // NOUVEAU : Vérifier le verrou avant de permettre le retour
      if (typeof acquirePalanqueeLock === 'function') {
        const hasLock = await acquirePalanqueeLock(palanqueeIdx);
        if (!hasLock) {
          if (typeof showLockNotification === 'function') {
            showLockNotification("Impossible de modifier - palanquée en cours d'édition par un autre DP", "warning");
          }
          return;
        }
      }
      
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        const plongeur = palanquees[palanqueeIdx].splice(plongeurIdx, 1)[0];
        plongeurs.push(plongeur);
        plongeursOriginaux.push(plongeur);
        syncToDatabase();
      }
    }
  });
  
  // Event delegation pour la modification des prérogatives
  document.addEventListener("change", async (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      const newPrerogatives = e.target.value.trim();
      
      // Le verrou a déjà été vérifié lors du clic, procéder à la modification
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        palanquees[palanqueeIdx][plongeurIdx].pre = newPrerogatives;
        syncToDatabase();
      }
    }
    
    // Event delegation pour les détails de palanquée
    if (e.target.classList.contains("palanquee-horaire")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      if (palanquees[palanqueeIdx]) {
        palanquees[palanqueeIdx].horaire = e.target.value;
        syncToDatabase();
      }
    }
    
    if (e.target.classList.contains("palanquee-prof-prevue")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      if (palanquees[palanqueeIdx]) {
        palanquees[palanqueeIdx].profondeurPrevue = e.target.value;
        syncToDatabase();
      }
    }
    
    if (e.target.classList.contains("palanquee-duree-prevue")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      if (palanquees[palanqueeIdx]) {
        palanquees[palanqueeIdx].dureePrevue = e.target.value;
        syncToDatabase();
      }
    }
    
    if (e.target.classList.contains("palanquee-prof-realisee")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      if (palanquees[palanqueeIdx]) {
        palanquees[palanqueeIdx].profondeurRealisee = e.target.value;
        syncToDatabase();
      }
    }
    
    if (e.target.classList.contains("palanquee-duree-realisee")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      if (palanquees[palanqueeIdx]) {
        palanquees[palanqueeIdx].dureeRealisee = e.target.value;
        syncToDatabase();
      }
    }
    
    if (e.target.classList.contains("palanquee-paliers")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      if (palanquees[palanqueeIdx]) {
        palanquees[palanqueeIdx].paliers = e.target.value;
        syncToDatabase();
      }
    }
  });
  
  // Empêcher le drag & drop sur les champs input
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable") ||
        e.target.classList.contains("palanquee-horaire") ||
        e.target.classList.contains("palanquee-prof-prevue") ||
        e.target.classList.contains("palanquee-duree-prevue") ||
        e.target.classList.contains("palanquee-prof-realisee") ||
        e.target.classList.contains("palanquee-duree-realisee") ||
        e.target.classList.contains("palanquee-paliers")) {
      e.stopPropagation();
    }
  });
}

// ===== HISTORIQUE DP =====
function chargerHistoriqueDP() {
  const dpDatesSelect = $("dp-dates");
  const historiqueInfo = $("historique-info");

  if (!dpDatesSelect || !historiqueInfo) {
    console.error("❌ Éléments DOM pour historique DP non trouvés");
    return;
  }

  if (!db) {
    console.error("❌ Base de données non disponible pour historique DP");
    return;
  }

  db.ref("dpInfo").once('value').then((snapshot) => {
    if (snapshot.exists()) {
      const dpInfos = snapshot.val();
      console.log("✅ Historique DP chargé:", Object.keys(dpInfos).length, "entrées");

      dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';

      for (const date in dpInfos) {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dpDatesSelect.appendChild(option);
      }

      dpDatesSelect.addEventListener("change", () => {
        const selectedDate = dpDatesSelect.value;
        if (selectedDate && dpInfos[selectedDate]) {
          const dp = dpInfos[selectedDate];
          historiqueInfo.innerHTML = `
            <p><strong>Nom :</strong> ${dp.nom}</p>
            <p><strong>Lieu :</strong> ${dp.lieu}</p>
          `;
        } else {
          historiqueInfo.innerHTML = "";
        }
      });
    } else {
      console.log("ℹ️ Aucun historique DP trouvé");
    }
  }).catch((error) => {
    console.error("❌ Erreur de lecture de l'historique DP :", error);
  });
}