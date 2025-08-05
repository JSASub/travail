// Fonction de rendu améliorée des plongeurs avec format tableau
function renderPlongeurs() {
  const liste = $("listePlongeurs");
  if (!liste) {
    console.error("❌ Élément listePlongeurs non trouvé!");
    return;
  }
  
  liste.innerHTML = "";
  
  if (plongeurs.length === 0) {
    liste.innerHTML = '<li style="text-align: center; color: #666; font-style: italic; padding: 20px;">Aucun plongeur ajouté</li>';
    return;
  }
  
  plongeurs.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "plongeur-item";
    li.draggable = true;
    li.dataset.index = i;
    
    // Structure en tableau avec colonnes alignées
    li.innerHTML = `
      <div class="plongeur-content">
        <div class="plongeur-nom">${p.nom}</div>
        <div class="plongeur-niveau">${p.niveau}</div>
        <div class="plongeur-prerogatives">${p.pre || 'Aucune'}</div>
        <div class="plongeur-actions">
          <span class="delete-plongeur" title="Supprimer ce plongeur">🗑️</span>
        </div>
      </div>
    `;
    
    // Event listener pour le drag & drop
    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", i);
    });
    
    // Event listener pour la suppression
    li.querySelector(".delete-plongeur").addEventListener("click", (e) => {
      e.stopPropagation(); // Empêcher le drag & drop
      if (confirm(`Supprimer ${p.nom} de la liste ?`)) {
        console.log("🗑️ Suppression plongeur:", p.nom);
        plongeurs.splice(i, 1);
        syncToDatabase();
      }
    });
    
    liste.appendChild(li);
  });
  
  console.log("✅ Plongeurs rendus:", plongeurs.length);
}