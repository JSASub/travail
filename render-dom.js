// render-dom.js - Rendu DOM ultra-sécurisé

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
      li.dataset.type = "mainList";
      
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
        nouve