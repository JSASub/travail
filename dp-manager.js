// dp-manager.js - Version simplifiée qui fonctionne

// ===== LISTE DES DP DE BASE (TOUJOURS DISPONIBLE) =====
const DP_DE_BASE = [
  { nom: "AGUIRRE", prenom: "Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com" },
  { nom: "AUBARD", prenom: "Corinne", niveau: "P5", email: "aubard.c@gmail.com" },
  { nom: "BEST", prenom: "Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr" },
  { nom: "CABIROL", prenom: "Joël", niveau: "E3", email: "joelcabirol@gmail.com" },
  { nom: "CATTEROU", prenom: "Sacha", niveau: "P5", email: "sacha.catterou@orange.fr" },
  { nom: "DARDER", prenom: "Olivier", niveau: "P5", email: "olivierdarder@gmail.com" },
  { nom: "GAUTHIER", prenom: "Christophe", niveau: "P5", email: "cattof24@yahoo.fr" },
  { nom: "LE MAOUT", prenom: "Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr" },
  { nom: "MARTY", prenom: "David", niveau: "E3", email: "david.marty@sfr.fr" },
  { nom: "TROUBADIS", prenom: "Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com" }
];

// ===== VARIABLES GLOBALES =====
let allDPList = [...DP_DE_BASE]; // Commencer avec les DP de base
let dpManagerWindow = null;

// ===== CREATION DU DROPDOWN =====
function createDPDropdown() {
  const dpNomField = document.getElementById("dp-nom");
  if (!dpNomField) return;
  
  // Transformer en select si nécessaire
  if (dpNomField.tagName.toLowerCase() !== 'select') {
    const select = document.createElement('select');
    select.id = 'dp-nom';
    select.required = true;
    select.style.cssText = dpNomField.style.cssText;
    dpNomField.parentNode.replaceChild(select, dpNomField);
  }
  
  updateDPDropdown();
  addManageButton();
  
  console.log(`✅ Dropdown créé avec ${allDPList.length} DP`);
}

// ===== MISE A JOUR DU DROPDOWN =====
function updateDPDropdown() {
  const selectElement = document.getElementById("dp-nom");
  if (!selectElement) return;
  
  const currentValue = selectElement.value;
  selectElement.innerHTML = '';
  
  // Option par défaut
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
  selectElement.appendChild(defaultOption);
  
  // Trier par nom
  const sortedDPs = [...allDPList].sort((a, b) => {
    return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
  });
  
  // Ajouter chaque DP
  sortedDPs.forEach(dp => {
    const option = document.createElement('option');
    option.value = `${dp.nom} ${dp.prenom}`;
    option.textContent = `${dp.nom} ${dp.prenom} (${dp.niveau})`;
    selectElement.appendChild(option);
  });
  
  // Restaurer la valeur
  if (currentValue) {
    selectElement.value = currentValue;
  }
  
  console.log(`🔄 Dropdown mis à jour avec ${allDPList.length} DP`);
}

// ===== BOUTON DE GESTION =====
function addManageButton() {
  const selectElement = document.getElementById("dp-nom");
  if (!selectElement || !isUserAdmin()) return;
  
  let manageBtn = document.getElementById("manage-dp-btn");
  if (manageBtn) return;
  
  manageBtn = document.createElement("button");
  manageBtn.id = "manage-dp-btn";
  manageBtn.type = "button";
  manageBtn.innerHTML = "👥 Gérer DP";
  manageBtn.style.cssText = `
    margin-left: 10px;
    padding: 8px 15px;
    background: #6f42c1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;
  `;
  manageBtn.onclick = openDPManagerWindow;
  
  selectElement.parentNode.appendChild(manageBtn);
  console.log("✅ Bouton de gestion ajouté");
}

// ===== VERIFICATION ADMIN =====
function isUserAdmin() {
  const ADMIN_EMAILS = [
    'raoul.aguirre64@gmail.com',
    'aubard.c@gmail.com',
    'joelcabirol@gmail.com',
    'david.marty@sfr.fr'
  ];
  
  return currentUser && ADMIN_EMAILS.includes(currentUser.email);
}

// ===== FENETRE DE GESTION SIMPLIFIEE =====
function openDPManagerWindow() {
  if (dpManagerWindow && !dpManagerWindow.closed) {
    dpManagerWindow.focus();
    return;
  }

  const windowFeatures = `
    width=800,
    height=600,
    left=${(screen.width - 800) / 2},
    top=${(screen.height - 600) / 2},
    scrollbars=yes,
    resizable=yes
  `;

  dpManagerWindow = window.open('', 'DPManager', windowFeatures);
  
  if (!dpManagerWindow) {
    alert('❌ Impossible d\'ouvrir la fenêtre. Veuillez autoriser les pop-ups.');
    return;
  }

  // Passer les données directement dans l'URL
  const dpDataString = encodeURIComponent(JSON.stringify(allDPList));
  
  dpManagerWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>👥 Gestion des DP - JSAS</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #004080; text-align: center; }
        .dp-list { margin: 20px 0; }
        .dp-item { 
          background: #f8f9fa; 
          padding: 15px; 
          margin: 10px 0; 
          border-radius: 5px; 
          border-left: 4px solid #28a745;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dp-info { flex: 1; }
        .dp-name { font-size: 16px; font-weight: bold; color: #004080; }
        .dp-details { font-size: 12px; color: #666; margin-top: 5px; }
        .dp-level { 
          background: #28a745; 
          color: white; 
          padding: 3px 8px; 
          border-radius: 10px; 
          font-size: 11px; 
          margin-right: 10px;
        }
        .btn { 
          padding: 8px 12px; 
          margin: 0 5px; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer; 
          font-size: 12px;
        }
        .btn-use { background: #007bff; color: white; }
        .btn-delete { background: #dc3545; color: white; }
        .add-form { 
          background: #e3f2fd; 
          padding: 20px; 
          border-radius: 10px; 
          margin-top: 20px;
        }
        .form-row { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 10px; 
          margin-bottom: 15px;
        }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { font-weight: bold; margin-bottom: 5px; }
        .form-group input, .form-group select { 
          padding: 8px; 
          border: 1px solid #ddd; 
          border-radius: 4px;
        }
        .btn-success { background: #28a745; color: white; padding: 10px 20px; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        .stats { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>👥 Gestion des Directeurs de Plongée</h1>
        
        <div class="stats">
          <strong id="dp-count">0 DP</strong> disponibles
        </div>
        
        <div class="dp-list" id="dp-list">
          <!-- Liste générée dynamiquement -->
        </div>
        
        <div class="add-form">
          <h3>➕ Ajouter un nouveau DP</h3>
          <form id="add-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" id="new-nom" required placeholder="NOM" style="text-transform: uppercase;">
              </div>
              <div class="form-group">
                <label>Prénom *</label>
                <input type="text" id="new-prenom" required placeholder="Prénom">
              </div>
              <div class="form-group">
                <label>Niveau *</label>
                <select id="new-niveau" required>
                  <option value="">-- Choisir --</option>
                  <option value="E4">E4</option>
                  <option value="E3">E3</option>
                  <option value="P5">P5</option>
                  <option value="N5">N5</option>
                </select>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="new-email" placeholder="email@jsas.fr">
              </div>
            </div>
            <button type="submit" class="btn btn-success">➕ Ajouter</button>
          </form>
        </div>
        
        <div class="footer">
          <button onclick="window.close()" class="btn btn-use">✅ Fermer</button>
        </div>
      </div>

      <script>
        // Récupérer les données des DP depuis l'URL
        let dpList = ${JSON.stringify(allDPList)};
        
        function displayDPs() {
          const container = document.getElementById('dp-list');
          const countElement = document.getElementById('dp-count');
          
          countElement.textContent = dpList.length + ' DP';
          
          if (dpList.length === 0) {
            container.innerHTML = '<p>Aucun DP trouvé</p>';
            return;
          }
          
          let html = '';
          dpList.forEach((dp, index) => {
            html += \`
              <div class="dp-item">
                <div class="dp-info">
                  <div class="dp-name">\${dp.nom} \${dp.prenom}</div>
                  <div class="dp-details">
                    <span class="dp-level">\${dp.niveau}</span>
                    <span>\${dp.email || 'Pas d\\'email'}</span>
                  </div>
                </div>
                <div>
                  <button class="btn btn-use" onclick="useDP('\${dp.nom} \${dp.prenom}')">📋 Utiliser</button>
                  <button class="btn btn-delete" onclick="deleteDP(\${index})">🗑️ Suppr</button>
                </div>
              </div>
            \`;
          });
          
          container.innerHTML = html;
        }
        
        function useDP(dpName) {
          if (window.opener && window.opener.document.getElementById('dp-nom')) {
            window.opener.document.getElementById('dp-nom').value = dpName;
            alert('✅ DP sélectionné : ' + dpName);
          }
        }
        
        function deleteDP(index) {
          const dp = dpList[index];
          if (confirm(\`Supprimer "\${dp.nom} \${dp.prenom}" ?\`)) {
            dpList.splice(index, 1);
            
            // Mettre à jour la liste parent
            if (window.opener && window.opener.allDPList) {
              window.opener.allDPList = dpList;
              window.opener.updateDPDropdown();
            }
            
            displayDPs();
            alert('✅ DP supprimé');
          }
        }
        
        function addDP(e) {
          e.preventDefault();
          
          const nom = document.getElementById('new-nom').value.trim().toUpperCase();
          const prenom = document.getElementById('new-prenom').value.trim();
          const niveau = document.getElementById('new-niveau').value;
          const email = document.getElementById('new-email').value.trim();
          
          if (!nom || !prenom || !niveau) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
          }
          
          // Vérifier doublons
          const exists = dpList.some(dp => 
            dp.nom.toLowerCase() === nom.toLowerCase() && 
            dp.prenom.toLowerCase() === prenom.toLowerCase()
          );
          
          if (exists) {
            alert('Ce DP existe déjà !');
            return;
          }
          
          const newDP = { nom, prenom, niveau, email };
          dpList.push(newDP);
          
          // Mettre à jour la liste parent
          if (window.opener && window.opener.allDPList) {
            window.opener.allDPList = dpList;
            window.opener.updateDPDropdown();
          }
          
          document.getElementById('add-form').reset();
          displayDPs();
          alert('✅ DP ajouté !');
        }
        
        // Initialisation
        displayDPs();
        document.getElementById('add-form').addEventListener('submit', addDP);
      </script>
    </body>
    </html>
  `);

  dpManagerWindow.document.close();
  console.log("✅ Fenêtre de gestion ouverte");
}

// ===== EXPORTS GLOBAUX =====
window.openDPManagerWindow = openDPManagerWindow;
window.updateDPDropdown = updateDPDropdown;
window.allDPList = allDPList;

// ===== INITIALISATION =====
function initializeDPManager() {
  // Assurer qu'on a toujours les DP de base
  if (allDPList.length === 0) {
    allDPList = [...DP_DE_BASE];
  }
  
  // Créer le dropdown
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDPDropdown);
  } else {
    createDPDropdown();
  }
  
  console.log("✅ Gestionnaire DP initialisé avec", allDPList.length, "DP (version simplifiée)");
}

// ===== INITIALISATION AUTOMATIQUE =====
function waitForInit() {
  if (typeof currentUser !== 'undefined') {
    initializeDPManager();
  } else {
    setTimeout(waitForInit, 1000);
  }
}

waitForInit();

console.log("👥 Gestionnaire DP simplifié chargé");