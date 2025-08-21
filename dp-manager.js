// dp-manager.js - Version ultra-simple qui marche

// ===== LISTE DES DP =====
const DP_LIST = [
  "AGUIRRE Raoul (E3)",
  "AUBARD Corinne (P5)", 
  "BEST Sébastien (P5)",
  "CABIROL Joël (E3)",
  "CATTEROU Sacha (P5)",
  "DARDER Olivier (P5)",
  "GAUTHIER Christophe (P5)",
  "LE MAOUT Jean-François (P5)",
  "MARTY David (E3)",
  "TROUBADIS Guillaume (P5)"
];

// ===== REMPLIR LE DROPDOWN =====
function remplirDropdownDP() {
  console.log("🏁 Remplissage initial du dropdown");
  const dpField = document.getElementById("dp-nom");
  if (!dpField) {
    console.error("❌ Champ dp-nom non trouvé");
    return;
  }
  
  // Transformer en select si c'est un input
  if (dpField.tagName !== 'SELECT') {
    console.log("🔄 Transformation input → select");
    const select = document.createElement('select');
    select.id = 'dp-nom';
    select.required = true;
    select.style.cssText = dpField.style.cssText;
    dpField.parentNode.replaceChild(select, dpField);
  }
  
  const select = document.getElementById("dp-nom");
  select.innerHTML = '';
  
  // Option par défaut
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
  select.appendChild(defaultOption);
  
  // Ajouter tous les DP
  DP_LIST.forEach(dp => {
    const option = document.createElement('option');
    option.value = dp.split(' (')[0]; // "AGUIRRE Raoul"
    option.textContent = dp; // "AGUIRRE Raoul (E3)"
    select.appendChild(option);
  });
  
  console.log("✅ Dropdown initial rempli avec", DP_LIST.length, "DP");
}

// ===== BOUTON DE GESTION SIMPLE =====
function ajouterBoutonGestion() {
  const select = document.getElementById("dp-nom");
  if (!select) return;
  
  // Vérifier si le bouton existe déjà
  if (document.getElementById("btn-gerer-dp")) return;
  
  const button = document.createElement('button');
  button.id = 'btn-gerer-dp';
  button.type = 'button';
  button.textContent = '👥 Gérer DP';
  button.style.cssText = `
    margin-left: 10px;
    padding: 8px 15px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  
  button.onclick = function() {
    ouvrirGestionDP();
  };
  
  select.parentNode.appendChild(button);
  console.log("✅ Bouton de gestion ajouté");
}

// ===== POPUP DE GESTION =====
function ouvrirGestionDP() {
  const popup = window.open('', 'GestionDP', 'width=600,height=500,scrollbars=yes');
  
  if (!popup) {
    alert('Veuillez autoriser les pop-ups');
    return;
  }
  
  popup.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Gestion des DP</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #007bff; text-align: center; }
        .dp-item { 
          background: #f8f9fa; 
          padding: 10px; 
          margin: 5px 0; 
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn { 
          padding: 5px 10px; 
          margin: 0 5px; 
          border: none; 
          border-radius: 3px; 
          cursor: pointer; 
        }
        .btn-use { background: #28a745; color: white; }
        .btn-del { background: #dc3545; color: white; }
        .add-form { 
          background: #e3f2fd; 
          padding: 15px; 
          border-radius: 5px; 
          margin-top: 20px;
        }
        input, select { 
          padding: 5px; 
          margin: 5px; 
          border: 1px solid #ddd; 
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <h1>👥 Gestion des DP JSAS</h1>
      
      <div id="dp-list"></div>
      
      <div class="add-form">
        <h3>Ajouter un DP</h3>
        <input type="text" id="nom" placeholder="NOM" style="text-transform: uppercase;">
        <input type="text" id="prenom" placeholder="Prénom">
        <select id="niveau">
          <option value="">Niveau</option>
          <option value="E4">E4</option>
          <option value="E3">E3</option>
          <option value="P5">P5</option>
          <option value="N5">N5</option>
        </select>
        <br><br>
        <button onclick="ajouterDP()" class="btn btn-use">Ajouter</button>
      </div>
      
      <br>
      <button onclick="window.close()" class="btn" style="background: #6c757d; color: white;">Fermer</button>

      <script>
        let dpList = ${JSON.stringify(DP_LIST)};
        
        function afficherDP() {
          const container = document.getElementById('dp-list');
          let html = '';
          
          dpList.forEach((dp, index) => {
            html += \`
              <div class="dp-item">
                <span>\${dp}</span>
                <div>
                  <button class="btn btn-use" onclick="utiliserDP('\${dp.split(' (')[0]}')">Utiliser</button>
                  <button class="btn btn-del" onclick="supprimerDP(\${index})">Supprimer</button>
                </div>
              </div>
            \`;
          });
          
          container.innerHTML = html;
        }
        
        function utiliserDP(nom) {
          if (window.opener && window.opener.document.getElementById('dp-nom')) {
            window.opener.document.getElementById('dp-nom').value = nom;
            alert('DP sélectionné : ' + nom);
          }
        }
        
        function supprimerDP(index) {
          if (confirm('Supprimer ce DP ?')) {
            dpList.splice(index, 1);
            afficherDP();
            mettreAJourParent();
          }
        }
        
        function ajouterDP() {
          const nom = document.getElementById('nom').value.trim().toUpperCase();
          const prenom = document.getElementById('prenom').value.trim();
          const niveau = document.getElementById('niveau').value;
          
          if (!nom || !prenom || !niveau) {
            alert('Veuillez remplir tous les champs');
            return;
          }
          
          const nouveauDP = nom + ' ' + prenom + ' (' + niveau + ')';
          dpList.push(nouveauDP);
          
          document.getElementById('nom').value = '';
          document.getElementById('prenom').value = '';
          document.getElementById('niveau').value = '';
          
          afficherDP();
          mettreAJourParent();
          alert('DP ajouté !');
        }
        
        function mettreAJourParent() {
          console.log('🔄 Mise à jour du parent...');
          console.log('dpList actuel:', dpList);
          
          if (window.opener) {
            // Mettre à jour la liste globale
            window.opener.DP_LIST = [...dpList];
            console.log('✅ Liste mise à jour dans parent');
            
            // Appeler la fonction de mise à jour du dropdown
            if (window.opener.mettreAJourDropdown) {
              window.opener.mettreAJourDropdown();
              console.log('✅ Dropdown parent mis à jour');
            } else {
              console.error('❌ Fonction mettreAJourDropdown non trouvée');
            }
          } else {
            console.error('❌ window.opener non disponible');
          }
        }
        
        afficherDP();
      </script>
    </body>
    </html>
  `);
  
  popup.document.close();
}

// ===== FONCTION DE MISE A JOUR =====
function mettreAJourDropdown() {
  console.log("🔄 Mise à jour dropdown avec", DP_LIST.length, "DP");
  console.log("Liste actuelle:", DP_LIST);
  
  const select = document.getElementById("dp-nom");
  if (!select) {
    console.error("❌ Select dp-nom non trouvé");
    return;
  }
  
  // Sauvegarder la valeur actuelle
  const currentValue = select.value;
  console.log("💾 Valeur actuelle:", currentValue);
  
  // Vider et reconstruire
  select.innerHTML = '';
  
  // Option par défaut
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
  select.appendChild(defaultOption);
  
  // Ajouter tous les DP
  DP_LIST.forEach((dp, index) => {
    const option = document.createElement('option');
    option.value = dp.split(' (')[0]; // "AGUIRRE Raoul"
    option.textContent = dp; // "AGUIRRE Raoul (E3)"
    select.appendChild(option);
    console.log(`➕ Ajouté: ${dp}`);
  });
  
  // Restaurer la valeur si possible
  if (currentValue) {
    select.value = currentValue;
    console.log("🔙 Valeur restaurée:", currentValue);
  }
  
  console.log("✅ Dropdown mis à jour avec", DP_LIST.length, "DP");
}

// ===== INITIALISATION =====
setTimeout(() => {
  console.log("🚀 Initialisation dp-manager simple");
  remplirDropdownDP();
  ajouterBoutonGestion();
}, 2000);

// Exporter les fonctions
window.mettreAJourDropdown = mettreAJourDropdown;
window.DP_LIST = DP_LIST;

console.log("📦 dp-manager simple chargé");