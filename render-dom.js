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

// Dans render-dom.js, modifiez la fonction renderPalanquees

function renderPalanquees(sessionData) {
    const container = document.getElementById('palanquees-container');
    if (!container) {
        console.error('Container palanquees-container non trouvé');
        return;
    }

    container.innerHTML = '';

    if (!sessionData || !sessionData.palanquees) {
        container.innerHTML = '<div class="no-data">Aucune palanquée trouvée</div>';
        return;
    }

    // 🔧 FIX: Convertir l'objet en tableau si nécessaire
    let palanqueesArray = sessionData.palanquees;
    
    // Vérifier si c'est un objet avec des clés numériques au lieu d'un tableau
    if (palanqueesArray && typeof palanqueesArray === 'object' && !Array.isArray(palanqueesArray)) {
        console.log('🔄 Conversion objet vers tableau pour palanquées');
        
        // Extraire les valeurs qui sont des objets (ignorer les autres propriétés)
        const values = Object.values(palanqueesArray).filter(item => 
            typeof item === 'object' && item !== null && !Array.isArray(item)
        );
        
        palanqueesArray = values;
    }

    // Vérifier que c'est maintenant un tableau
    if (!Array.isArray(palanqueesArray)) {
        console.error('❌ palanqueesArray n\'est toujours pas un tableau:', palanqueesArray);
        container.innerHTML = '<div class="error">Erreur: format de données invalide</div>';
        return;
    }

    console.log(`✅ Rendu ${palanqueesArray.length} palanquées`);

    palanqueesArray.forEach((palanquee, index) => {
        // Vérifier que chaque palanquée est un objet valide
        if (!palanquee || typeof palanquee !== 'object') {
            console.warn(`⚠️ Palanquée ${index} invalide:`, palanquee);
            return;
        }

        // Continuer avec le rendu normal de chaque palanquée
        const palanqueeElement = createPalanqueeElement(palanquee, index);
        container.appendChild(palanqueeElement);
        
        // Vérifier les alertes pour cette palanquée
        checkAlert(palanquee, index);
    });
}

// Fonction utilitaire pour normaliser les données de palanquées
function normalizePalanqueesData(palanqueesData) {
    if (!palanqueesData) return [];
    
    if (Array.isArray(palanqueesData)) {
        return palanqueesData;
    }
    
    if (typeof palanqueesData === 'object') {
        // Convertir objet en tableau, en filtrant les vraies palanquées
        return Object.values(palanqueesData).filter(item => 
            typeof item === 'object' && 
            item !== null && 
            !Array.isArray(item) &&
            // Vérifier que l'objet a des propriétés de palanquée
            (item.hasOwnProperty('dureePrevue') || item.hasOwnProperty('profondeurPrevue'))
        );
    }
    
    return [];
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