// render-dom.js - Rendu DOM et interactions

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
      
      // Event listeners pour drag & drop
      li.addEventListener("dragstart", e => {
        li.classList.add('dragging');
        
        const plongeurData = {
          type: "fromMainList",
          plongeur: { ...p },
          originalIndex: i
        };
        
        e.dataTransfer.setData("text/plain", JSON.stringify(plongeurData));
        e.dataTransfer.effectAllowed = "move";
      });
      
      li.addEventListener("dragend", e => {
        li.classList.remove('dragging');
      });
      
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
  
  updateCompteurs();
}

function renderPalanquees() {
  const container = $("palanqueesContainer");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (palanquees.length === 0) return;
  
  palanquees.forEach((palanquee, idx) => {
    const div = document.createElement("div");
    div.className = "palanquee";
    div.dataset.index = idx;
    div.dataset.alert = checkAlert(palanquee) ? "true" : "false";
    
    div.innerHTML = `
      <div class="palanquee-title">
        <span>Palanquée ${idx + 1} (${palanquee.length} plongeur${palanquee.length > 1 ? 's' : ''})</span>
        <span class="remove-palanquee" style="color: red; cursor: pointer;">❌</span>
      </div>
      <div class="palanquee-details">
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
      </div>
    `;
    
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
        
        // Event listener pour drag & drop
        li.addEventListener("dragstart", e => {
          li.classList.add('dragging');
          e.dataTransfer.setData("text/plain", JSON.stringify({
            type: "fromPalanquee",
            palanqueeIndex: idx,
            plongeurIndex: plongeurIndex,
            plongeur: plg
          }));
          e.dataTransfer.effectAllowed = "move";
        });
        
        li.addEventListener("dragend", e => {
          li.classList.remove('dragging');
        });
        
        plongeursList.appendChild(li);
      });
      
      div.appendChild(plongeursList);
    }

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

    div.addEventListener("drop", e => {
      e.preventDefault();
      div.classList.remove('drag-over');
      
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
  updateCompteurs();
}

function setupPalanqueesEventListeners() {
  // Event delegation pour les boutons de retour
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("return-plongeur")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      
      if (palanquees[palanqueeIdx] && palanquees[palanqueeIdx][plongeurIdx]) {
        const plongeur = palanquees[palanqueeIdx].splice(plongeurIdx, 1)[0];
        plongeurs.push(plongeur);
        plongeursOriginaux.push(plongeur);
        syncToDatabase();
      }
    }
  });
  
  // Event delegation pour la modification des prérogatives
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      const palanqueeIdx = parseInt(e.target.dataset.palanqueeIdx);
      const plongeurIdx = parseInt(e.target.dataset.plongeurIdx);
      const newPrerogatives = e.target.value.trim();
      
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
  });
  
  // Empêcher le drag & drop sur les champs input
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable") ||
        e.target.classList.contains("palanquee-horaire") ||
        e.target.classList.contains("palanquee-prof-prevue") ||
        e.target.classList.contains("palanquee-duree-prevue") ||
        e.target.classList.contains("palanquee-prof-realisee") ||
        e.target.classList.contains("palanquee-duree-realisee")) {
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