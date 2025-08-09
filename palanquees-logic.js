// ===== LOGIQUE MÉTIER ET RENDU DES PALANQUÉES =====

// ===== DIAGNOSTIC SYSTÈME =====
function diagnosticSystem() {
  console.log("🔍 === DIAGNOSTIC SYSTÈME ===");
  
  // Test 1: Vérifier les éléments HTML
  const compteurPlongeurs = $("compteur-plongeurs");
  const compteurPalanquees = $("compteur-palanquees");
  
  console.log("🔍 Élément compteur-plongeurs:", compteurPlongeurs ? "✅ TROUVÉ" : "❌ MANQUANT");
  console.log("🔍 Élément compteur-palanquees:", compteurPalanquees ? "✅ TROUVÉ" : "❌ MANQUANT");
  
  // Test 2: Vérifier les données
  console.log("🔍 Nombre de plongeurs:", plongeurs.length);
  console.log("🔍 Nombre de palanquées:", palanquees.length);
  console.log("🔍 Détail palanquées:", palanquees.map(p => p.length));
  
  // Test 3: Vérifier le DOM
  const titreListePlongeurs = document.querySelector("main strong");
  const titrePalanquees = document.querySelector("#palanquees strong");
  
  console.log("🔍 Titre liste plongeurs:", titreListePlongeurs ? titreListePlongeurs.innerHTML : "NON TROUVÉ");
  console.log("🔍 Titre palanquées:", titrePalanquees ? titrePalanquees.innerHTML : "NON TROUVÉ");
  
  // Conclusion
  if (!compteurPlongeurs || !compteurPalanquees) {
    console.error("❌ PROBLÈME: Les éléments HTML pour les compteurs n'existent pas !");
    console.error("🔧 SOLUTION: Tu dois mettre à jour ton fichier index.html sur le serveur");
    alert("❌ PROBLÈME DÉTECTÉ: Les éléments HTML pour les compteurs sont manquants !\n\n🔧 SOLUTION: Mets à jour ton fichier index.html sur le serveur avec la version qui contient les spans pour les compteurs.");
  } else {
    console.log("✅ Éléments HTML OK, problème ailleurs");
  }
}

// ===== COMPTEURS D'AFFICHAGE =====
function updateCompteurs() {
  // Compteur plongeurs non assignés
  const compteurPlongeurs = $("compteur-plongeurs");
  if (compteurPlongeurs) {
    compteurPlongeurs.textContent = `(${plongeurs.length})`;
    compteurPlongeurs.style.color = plongeurs.length === 0 ? "#28a745" : "#007bff";
  }
  
  // Compteur plongeurs dans palanquées
  const totalPlongeursEnPalanquees = palanquees.flat().length;
  const nombrePalanquees = palanquees.length;
  const compteurPalanquees = $("compteur-palanquees");
  
  if (compteurPalanquees) {
    if (nombrePalanquees === 0) {
      compteurPalanquees.textContent = "(Aucune palanquée)";
      compteurPalanquees.style.color = "#666";
    } else {
      const plurielPlongeurs = totalPlongeursEnPalanquees > 1 ? "plongeurs" : "plongeur";
      const plurielPalanquees = nombrePalanquees > 1 ? "palanquées" : "palanquée";
      compteurPalanquees.textContent = `(${totalPlongeursEnPalanquees} ${plurielPlongeurs} dans ${nombrePalanquees} ${plurielPalanquees})`;
      compteurPalanquees.style.color = "#28a745";
    }
  }
  
  console.log(`📊 Compteurs mis à jour: ${plongeurs.length} non assignés, ${totalPlongeursEnPalanquees} en palanquées`);
}

// ===== SYSTÈME D'ALERTES AMÉLIORÉ =====
function checkAllAlerts() {
  const alertes = [];
  
  palanquees.forEach((palanquee, idx) => {
    const n1s = palanquee.filter(p => p.niveau === "N1");
    const gps = palanquee.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
    const autonomes = palanquee.filter(p => ["N2", "N3"].includes(p.niveau));
    
    // Palanquée > 5 plongeurs
    if (palanquee.length > 5) {
      alertes.push(`Palanquée ${idx + 1}: Plus de 5 plongeurs (${palanquee.length})`);
    }
    
    // Palanquée ≤ 1 plongeur
    if (palanquee.length <= 1) {
      alertes.push(`Palanquée ${idx + 1}: Palanquée de ${palanquee.length} plongeur(s)`);
    }
    
    // N1 sans GP
    if (n1s.length > 0 && gps.length === 0) {
      alertes.push(`Palanquée ${idx + 1}: N1 sans Guide de Palanquée`);
    }
    
    // Autonomes > 3
    if (autonomes.length > 3) {
      alertes.push(`Palanquée ${idx + 1}: Plus de 3 plongeurs autonomes (${autonomes.length})`);
    }
    
    // 4 ou 5 plongeurs sans GP
    if ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0) {
      alertes.push(`Palanquée ${idx + 1}: ${palanquee.length} plongeurs sans Guide de Palanquée`);
    }
  });
  
  return alertes;
}

function updateAlertes() {
  const alertes = checkAllAlerts();
  const alerteSection = $("alertes-section");
  const alerteContent = $("alertes-content");
  
  if (alertes.length === 0) {
    alerteSection.classList.add("alert-hidden");
  } else {
    alerteSection.classList.remove("alert-hidden");
    alerteContent.innerHTML = alertes.map(alerte => 
      `<div class="alert-item">${alerte}</div>`
    ).join('');
  }
}

function checkAlert(palanquee) {
  const n1s = palanquee.filter(p => p.niveau === "N1");
  const gps = palanquee.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
  const autonomes = palanquee.filter(p => ["N2", "N3"].includes(p.niveau));
  
  return (
    palanquee.length > 5 ||
    palanquee.length <= 1 ||
    (n1s.length > 0 && gps.length === 0) ||
    autonomes.length > 3 ||
    ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0)
  );
}

// ===== TRI DES PLONGEURS =====
function sortPlongeurs(type) {
  currentSort = type;
  
  // Mettre à jour les boutons
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
      const niveauOrder = { 'N1': 1, 'N2': 2, 'N3': 3, 'N4/GP': 4, 'E1': 5, 'E2': 6, 'E3': 7, 'E4': 8 };
      plongeurs.sort((a, b) => (niveauOrder[a.niveau] || 9) - (niveauOrder[b.niveau] || 9));
      break;
    case 'none':
    default:
      plongeurs = [...plongeursOriginaux];
      break;
  }
  
  renderPlongeurs();
}

// ===== EXPORT JSON AMÉLIORÉ =====
function exportToJSON() {
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  const exportData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      version: "2.0.0",
      exportDate: new Date().toISOString()
    },
    plongeurs: plongeurs.map(p => ({
      nom: p.nom,
      niveau: p.niveau,
      prerogatives: p.pre || ""
    })),
    palanquees: palanquees.map((pal, idx) => ({
      numero: idx + 1,
      plongeurs: pal.map(p => ({
        nom: p.nom,
        niveau: p.niveau,
        prerogatives: p.pre || ""
      })),
      alertes: checkAlert(pal) ? checkAllAlerts().filter(a => a.includes(`Palanquée ${idx + 1}`)) : []
    })),
    resume: {
      totalPlongeurs: plongeurs.length + palanquees.flat().length,
      nombrePalanquees: palanquees.length,
      plongeursNonAssignes: plongeurs.length,
      alertesTotal: checkAllAlerts().length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `palanquees-${dpDate || 'export'}-${dpPlongee}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log("📤 Export JSON amélioré effectué");
}

// Render functions
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
      
      // Event listeners pour drag & drop - VERSION CORRIGÉE FIREBASE
      li.addEventListener("dragstart", e => {
        console.log("🖱️ Début drag plongeur:", p.nom, "index:", i);
        li.classList.add('dragging');
        
        // IMPORTANT: Stocker les données du plongeur directement, pas l'index
        const plongeurData = {
          type: "fromMainList",
          plongeur: { ...p }, // Clone de l'objet
          originalIndex: i
        };
        
        e.dataTransfer.setData("text/plain", JSON.stringify(plongeurData));
        e.dataTransfer.effectAllowed = "move";
      });
      
      li.addEventListener("dragend", e => {
        li.classList.remove('dragging');
        console.log("🖱️ Fin drag plongeur");
      });
      
      li.querySelector(".delete-plongeur").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Supprimer ${p.nom} de la liste ?`)) {
          plongeurs.splice(i, 1);
          // Mettre à jour la liste originale
          plongeursOriginaux = plongeursOriginaux.filter(po => po.nom !== p.nom);
          syncToDatabase();
        }
      });
      
      liste.appendChild(li);
    });
  }
  
  // Mise à jour des compteurs après rendu
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
        
        // Event listener pour drag & drop - VERSION CORRIGÉE
        li.addEventListener("dragstart", e => {
          console.log("🖱️ Début drag depuis palanquée", idx + 1, "plongeur", plongeurIndex, ":", plg.nom);
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
          console.log("🖱️ Fin drag depuis palanquée");
        });
        
        plongeursList.appendChild(li);
      });
      
      div.appendChild(plongeursList);
    }

    // Event listeners
    div.querySelector(".remove-palanquee").addEventListener("click", () => {
      if (confirm(`Supprimer la palanquée ${idx + 1} ?`)) {
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
      console.log("🎯 Drop dans palanquée", idx + 1, "data reçue:", data);
      
      try {
        const dragData = JSON.parse(data);
        console.log("📝 Données parsées:", dragData);
        
        if (dragData.type === "fromPalanquee") {
          console.log("🔄 Déplacement entre palanquées détecté");
          if (dragData.palanqueeIndex !== undefined && 
              dragData.plongeurIndex !== undefined && 
              palanquees[dragData.palanqueeIndex] &&
              palanquees[dragData.palanqueeIndex][dragData.plongeurIndex]) {
            
            const sourcePalanquee = palanquees[dragData.palanqueeIndex];
            const plongeur = sourcePalanquee.splice(dragData.plongeurIndex, 1)[0];
            palanquee.push(plongeur);
            console.log("✅ Plongeur déplacé entre palanquées:", plongeur.nom);
            syncToDatabase();
          }
          return;
        }
        
        if (dragData.type === "fromMainList") {
          console.log("📝 Déplacement depuis liste principale détecté");
          // Utiliser les données du plongeur directement
          const plongeurToMove = dragData.plongeur;
          
          // Trouver et supprimer le plongeur de la liste principale
          const indexToRemove = plongeurs.findIndex(p => 
            p.nom === plongeurToMove.nom && p.niveau === plongeurToMove.niveau
          );
          
          if (indexToRemove !== -1) {
            plongeurs.splice(indexToRemove, 1);
            palanquee.push(plongeurToMove);
            console.log("✅ Plongeur ajouté depuis liste principale:", plongeurToMove.nom);
            syncToDatabase();
          } else {
            console.error("❌ Plongeur non trouvé dans la liste principale");
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
      console.log("🎯 Survol palanquée", idx + 1);
    });
    
    div.addEventListener("dragleave", e => {
      if (!div.contains(e.relatedTarget)) {
        div.classList.remove('drag-over');
        console.log("🎯 Sortie palanquée", idx + 1);
      }
    });

    container.appendChild(div);
  });
  
  setupPalanqueesEventListeners();
  
  // Mise à jour des compteurs après rendu des palanquées
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
  });
  
  // Empêcher le drag & drop sur les champs input
  document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("plongeur-prerogatives-editable")) {
      e.stopPropagation();
    }
  });
}