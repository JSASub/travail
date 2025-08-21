// dp-manager.js - Système de gestion des DP avec liste unique modifiable

// ===== VARIABLES GLOBALES =====
let allDPList = []; // Liste unique de tous les DP
let dpManagerWindow = null;

// ===== INITIALISATION DE LA LISTE DP DE BASE =====
const DP_INITIAUX = [
  { nom: "AGUIRRE", prenom: "Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com", type: "initial" },
  { nom: "AUBARD", prenom: "Corinne", niveau: "P5", email: "aubard.c@gmail.com", type: "initial" },
  { nom: "BEST", prenom: "Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr", type: "initial" },
  { nom: "CABIROL", prenom: "Joël", niveau: "E3", email: "joelcabirol@gmail.com", type: "initial" },
  { nom: "CATTEROU", prenom: "Sacha", niveau: "P5", email: "sacha.catterou@orange.fr", type: "initial" },
  { nom: "DARDER", prenom: "Olivier", niveau: "P5", email: "olivierdarder@gmail.com", type: "initial" },
  { nom: "GAUTHIER", prenom: "Christophe", niveau: "P5", email: "cattof24@yahoo.fr", type: "initial" },
  { nom: "LE MAOUT", prenom: "Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr", type: "initial" },
  { nom: "MARTY", prenom: "David", niveau: "E3", email: "david.marty@sfr.fr", type: "initial" },
  { nom: "TROUBADIS", prenom: "Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com", type: "initial" }
];

// ===== CHARGEMENT DE LA LISTE COMPLÈTE DES DP =====
async function loadAllDPs() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour charger les DP");
      return;
    }
    
    // Utiliser le chemin dp_validated qui existe déjà dans vos règles
    const snapshot = await db.ref('dp_validated').once('value');
    if (snapshot.exists()) {
      const dpData = snapshot.val();
      
      // Convertir les DP validés en format de liste
      if (Array.isArray(dpData)) {
        allDPList = dpData;
      } else if (typeof dpData === 'object') {
        // Si c'est un objet, convertir en tableau
        allDPList = Object.values(dpData);
      } else {
        throw new Error("Format de données DP invalide");
      }
      
      console.log(`✅ ${allDPList.length} DP chargés depuis dp_validated`);
    } else {
      // Première fois : initialiser avec la liste de base
      console.log("🔧 Initialisation de la liste DP avec les DP de base");
      allDPList = [...DP_INITIAUX];
      await saveAllDPs();
    }
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    // Fallback sur la liste de base
    console.log("🔄 Utilisation des DP de base comme fallback");
    allDPList = [...DP_INITIAUX];
  }
}

// ===== SAUVEGARDE DE LA LISTE COMPLÈTE =====
async function saveAllDPs() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour sauvegarder les DP");
      return false;
    }
    
    // Utiliser le chemin dp_validated au lieu de all_dps
    await db.ref('dp_validated').set(allDPList);
    console.log("✅ Liste DP sauvegardée dans dp_validated");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde DP:", error);
    return false;
  }
}

// ===== CRÉATION DU DROPDOWN DE SÉLECTION DP =====
function createDPDropdown() {
  const dpNomField = document.getElementById("dp-nom");
  if (!dpNomField) return;
  
  // Transformer le champ texte en select si ce n'est pas déjà fait
  if (dpNomField.tagName.toLowerCase() !== 'select') {
    const select = document.createElement('select');
    select.id = 'dp-nom';
    select.name = dpNomField.name;
    select.className = dpNomField.className;
    select.style.cssText = dpNomField.style.cssText;
    select.required = dpNomField.required;
    
    // Remplacer l'input par le select
    dpNomField.parentNode.replaceChild(select, dpNomField);
  }
  
  const selectElement = document.getElementById("dp-nom");
  
  // Remplir le dropdown
  updateDPDropdown();
  
  // Ajouter le bouton de gestion pour les admins
  addManageButton(selectElement);
  
  console.log(`✅ Dropdown DP créé avec ${allDPList.length} options`);
}

// ===== MISE À JOUR DU DROPDOWN =====
function updateDPDropdown() {
  const selectElement = document.getElementById("dp-nom");
  if (!selectElement || selectElement.tagName.toLowerCase() !== 'select') return;
  
  // Sauvegarder la valeur actuelle
  const currentValue = selectElement.value;
  
  // Vider et reconstruire les options
  selectElement.innerHTML = '';
  
  // Option par défaut
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
  selectElement.appendChild(defaultOption);
  
  // Trier par nom
  const sortedDPs = [...allDPList].sort((a, b) => {
    const nameA = `${a.nom} ${a.prenom}`;
    const nameB = `${b.nom} ${b.prenom}`;
    return nameA.localeCompare(nameB);
  });
  
  // Ajouter chaque DP
  sortedDPs.forEach(dp => {
    const option = document.createElement('option');
    option.value = `${dp.nom} ${dp.prenom}`;
    option.textContent = `${dp.nom} ${dp.prenom} (${dp.niveau})`;
    option.setAttribute('data-dp-info', JSON.stringify(dp));
    selectElement.appendChild(option);
  });
  
  // Restaurer la valeur si elle existe encore
  if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
    selectElement.value = currentValue;
  }
  
  console.log(`🔄 Dropdown DP mis à jour avec ${allDPList.length} DP`);
}

// ===== AJOUT DU BOUTON DE GESTION =====
function addManageButton(selectElement) {
  // Ne pas ajouter le bouton si pas admin
  if (!isUserAdmin()) return;
  
  let manageBtn = document.getElementById("manage-dp-btn");
  if (manageBtn) return; // Déjà présent
  
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
  manageBtn.title = "Gérer la liste des Directeurs de Plongée";
  manageBtn.addEventListener("click", openDPManagerWindow);
  
  selectElement.parentNode.appendChild(manageBtn);
  console.log("✅ Bouton de gestion DP ajouté");
}

// ===== VÉRIFICATION ADMIN =====
function isUserAdmin() {
  const ADMIN_EMAILS = [
    'raoul.aguirre64@gmail.com',
    'aubard.c@gmail.com',
    'joelcabirol@gmail.com',
    'david.marty@sfr.fr'
  ];
  
  return currentUser && ADMIN_EMAILS.includes(currentUser.email);
}

// ===== FENÊTRE DE GESTION DES DP =====
function openDPManagerWindow() {
  if (dpManagerWindow && !dpManagerWindow.closed) {
    dpManagerWindow.focus();
    return;
  }

  const windowFeatures = `
    width=900,
    height=700,
    left=${(screen.width - 900) / 2},
    top=${(screen.height - 700) / 2},
    scrollbars=yes,
    resizable=yes,
    status=no,
    menubar=no,
    toolbar=no,
    location=no
  `;

  dpManagerWindow = window.open('', 'DPManager', windowFeatures);
  
  if (!dpManagerWindow) {
    alert('❌ Impossible d\'ouvrir la fenêtre. Veuillez autoriser les pop-ups.');
    return;
  }

  // Contenu de la fenêtre
  dpManagerWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>👥 Gestion des Directeurs de Plongée - JSAS</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          overflow: hidden;
          max-width: 100%;
          height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
        }
        
        .header {
          background: linear-gradient(135deg, #004080 0%, #007bff 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .stats {
          background: #e3f2fd;
          padding: 15px;
          text-align: center;
          font-size: 14px;
          color: #1565c0;
        }
        
        .content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        
        .dp-grid {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .dp-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .dp-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .dp-card.initial {
          border-left: 4px solid #28a745;
        }
        
        .dp-card.added {
          border-left: 4px solid #007bff;
        }
        
        .dp-info {
          flex: 1;
        }
        
        .dp-name {
          font-size: 16px;
          font-weight: bold;
          color: #004080;
          margin-bottom: 3px;
        }
        
        .dp-details {
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .dp-level {
          background: #28a745;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .dp-type {
          background: #6c757d;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
        }
        
        .dp-actions {
          display: flex;
          gap: 5px;
        }
        
        .btn {
          padding: 6px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .btn-use {
          background: #007bff;
          color: white;
        }
        
        .btn-edit {
          background: #ffc107;
          color: #212529;
        }
        
        .btn-delete {
          background: #dc3545;
          color: white;
        }
        
        .btn:hover {
          transform: scale(1.05);
        }
        
        .add-form {
          background: #f8f9fa;
          border: 2px dashed #007bff;
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          font-weight: bold;
          color: #004080;
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .form-group input, .form-group select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 15px 20px;
          text-align: center;
          border-top: 1px solid #dee2e6;
          font-size: 12px;
          color: #666;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
          padding: 10px 20px;
          margin: 0 10px;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
          padding: 8px 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👥 Gestion des Directeurs de Plongée</h1>
          <p>Liste complète et modifiable des DP JSAS</p>
        </div>
        
        <div class="stats">
          <strong id="total-count">0 DP</strong> • 
          <span id="initial-count">0 DP de base</span> • 
          <span id="added-count">0 DP ajoutés</span>
        </div>
        
        <div class="content">
          <div id="dp-list" class="dp-grid">
            <!-- Contenu généré dynamiquement -->
          </div>
          
          <!-- Formulaire d'ajout -->
          <div class="add-form">
            <h3 style="color: #004080; margin-bottom: 15px;">➕ Ajouter un nouveau DP</h3>
            <form id="add-dp-form">
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
                    <option value="E4">E4 (Encadrant 4ème degré)</option>
                    <option value="E3">E3 (Encadrant 3ème degré)</option>
                    <option value="P5">P5 (Plongeur 5ème degré)</option>
                    <option value="N5">N5 (Niveau 5)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="new-email" placeholder="email@jsas.fr">
                </div>
              </div>
              <button type="submit" class="btn btn-success">
                ➕ Ajouter ce DP
              </button>
            </form>
          </div>
        </div>
        
        <div class="footer">
          <button onclick="window.opener.updateDPField(); window.close();" class="btn btn-primary">
            ✅ Fermer et actualiser
          </button>
          <span>Tous les DP peuvent être modifiés ou supprimés</span>
        </div>
      </div>
      
      <script>
        // Variables globales pour la fenêtre popup
        let dpWindowInstance = null;
        
        // Fonctions exposées globalement pour la fenêtre parent
        window.displayAllDPs = displayAllDPs;
        window.updateStats = updateStats;
        window.createDPCard = createDPCard;
        
        // Initialiser la fenêtre
        function initDPWindow() {
          console.log("🔧 Initialisation de la fenêtre DP...");
          dpWindowInstance = window;
          
          // Essayer de charger les données immédiatement
          loadDPData();
          
          // Event listener pour le formulaire
          document.getElementById('add-dp-form').addEventListener('submit', addNewDP);
          
          // Actualiser toutes les 2 secondes au cas où
          setInterval(loadDPData, 2000);
        }
        
        function loadDPData() {
          let dpData = [];
          
          // Essayer plusieurs sources
          if (window.opener?.allDPList && window.opener.allDPList.length > 0) {
            dpData = window.opener.allDPList;
            console.log("✅ Données DP trouvées via window.opener:", dpData.length, "DP");
          } else if (window.parent?.allDPList && window.parent.allDPList.length > 0) {
            dpData = window.parent.allDPList;
            console.log("✅ Données DP trouvées via window.parent:", dpData.length, "DP");
          } else {
            console.warn("⚠️ Aucune donnée DP trouvée, utilisation des DP de base");
            dpData = [
              { nom: "AGUIRRE", prenom: "Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com", type: "initial" },
              { nom: "AUBARD", prenom: "Corinne", niveau: "P5", email: "aubard.c@gmail.com", type: "initial" },
              { nom: "BEST", prenom: "Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr", type: "initial" },
              { nom: "CABIROL", prenom: "Joël", niveau: "E3", email: "joelcabirol@gmail.com", type: "initial" },
              { nom: "CATTEROU", prenom: "Sacha", niveau: "P5", email: "sacha.catterou@orange.fr", type: "initial" },
              { nom: "DARDER", prenom: "Olivier", niveau: "P5", email: "olivierdarder@gmail.com", type: "initial" },
              { nom: "GAUTHIER", prenom: "Christophe", niveau: "P5", email: "cattof24@yahoo.fr", type: "initial" },
              { nom: "LE MAOUT", prenom: "Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr", type: "initial" },
              { nom: "MARTY", prenom: "David", niveau: "E3", email: "david.marty@sfr.fr", type: "initial" },
              { nom: "TROUBADIS", prenom: "Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com", type: "initial" }
            ];
          }
          
          // Mettre à jour l'affichage seulement si on a des données
          if (dpData.length > 0) {
            displayAllDPs(dpData);
            updateStats(dpData);
          }
        }
        
        function displayAllDPs() {
          const container = document.getElementById('dp-list');
          const allDPs = window.opener?.allDPList || [];
          
          console.log("📋 Affichage des DP:", allDPs.length, "DP trouvés");
          
          if (allDPs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><h3>Aucun DP trouvé</h3><p>Ajoutez des DP avec le formulaire ci-dessous</p></div>';
            return;
          }
          
          let html = '';
          allDPs.forEach((dp, index) => {
            html += createDPCard(dp, index);
          });
          
          container.innerHTML = html;
        }
        
        function createDPCard(dp, index) {
          const isInitial = dp.type === 'initial';
          
          return \`
            <div class="dp-card \${isInitial ? 'initial' : 'added'}">
              <div class="dp-info">
                <div class="dp-name">\${dp.nom} \${dp.prenom}</div>
                <div class="dp-details">
                  <span class="dp-level">\${dp.niveau}</span>
                  <span class="dp-type">\${isInitial ? 'DP de base' : 'DP ajouté'}</span>
                  <span>\${dp.email || 'Pas d\\'email'}</span>
                  \${dp.dateAjout ? '<span style="font-size: 11px;">Ajouté le ' + new Date(dp.dateAjout).toLocaleDateString('fr-FR') + '</span>' : ''}
                </div>
              </div>
              <div class="dp-actions">
                <button class="btn btn-use" onclick="useDP('\${dp.nom} \${dp.prenom}')" title="Utiliser ce DP">
                  📋 Utiliser
                </button>
                <button class="btn btn-edit" onclick="editDP(\${index})" title="Modifier ce DP">
                  ✏️ Modifier
                </button>
                <button class="btn btn-delete" onclick="deleteDP(\${index})" title="Supprimer ce DP">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          \`;
        }
        
        function updateStats() {
          const allDPs = window.opener?.allDPList || [];
          const initialCount = allDPs.filter(dp => dp.type === 'initial').length;
          const addedCount = allDPs.filter(dp => dp.type !== 'initial').length;
          
          console.log("📊 Stats:", { total: allDPs.length, initial: initialCount, added: addedCount });
          
          document.getElementById('total-count').textContent = allDPs.length + ' DP';
          document.getElementById('initial-count').textContent = initialCount + ' DP de base';
          document.getElementById('added-count').textContent = addedCount + ' DP ajoutés';
        }
        
        function useDP(dpName) {
          if (window.opener && window.opener.document.getElementById('dp-nom')) {
            window.opener.document.getElementById('dp-nom').value = dpName;
            alert('✅ DP sélectionné : ' + dpName);
          }
        }
        
        function editDP(index) {
          if (!window.opener?.allDPList) {
            alert("❌ Impossible d'accéder aux données DP");
            return;
          }
          
          const dp = window.opener.allDPList[index];
          const newNom = prompt("Nom:", dp.nom);
          if (newNom === null) return;
          
          const newPrenom = prompt("Prénom:", dp.prenom);
          if (newPrenom === null) return;
          
          const newNiveau = prompt("Niveau (E4/E3/P5/N5):", dp.niveau);
          if (newNiveau === null) return;
          
          const newEmail = prompt("Email:", dp.email || "");
          if (newEmail === null) return;
          
          // Validation
          if (!newNom.trim() || !newPrenom.trim() || !newNiveau.trim()) {
            alert("⚠️ Nom, prénom et niveau sont obligatoires !");
            return;
          }
          
          if (!['E4', 'E3', 'P5', 'N5'].includes(newNiveau.trim())) {
            alert("⚠️ Niveau invalide ! Utilisez : E4, E3, P5 ou N5");
            return;
          }
          
          // Mettre à jour
          window.opener.allDPList[index] = {
            ...dp,
            nom: newNom.trim().toUpperCase(),
            prenom: newPrenom.trim(),
            niveau: newNiveau.trim(),
            email: newEmail.trim(),
            dateModification: new Date().toISOString()
          };
          
          // Sauvegarder et rafraîchir
          if (window.opener.saveAllDPs) {
            window.opener.saveAllDPs().then(() => {
              displayAllDPs();
              updateStats();
              alert("✅ DP modifié avec succès !");
            }).catch(error => {
              console.error("❌ Erreur modification:", error);
              alert("❌ Erreur lors de la modification");
            });
          } else {
            alert("❌ Fonction de sauvegarde non disponible");
          }
        }
        
        function deleteDP(index) {
          if (!window.opener?.allDPList) {
            alert("❌ Impossible d'accéder aux données DP");
            return;
          }
          
          const dp = window.opener.allDPList[index];
          if (!confirm(\`⚠️ Supprimer "\${dp.nom} \${dp.prenom}" de la liste ?\\n\\nCette action est irréversible !\\n\\n⚠️ ATTENTION : Même les DP de base peuvent être supprimés.\`)) {
            return;
          }
          
          window.opener.allDPList.splice(index, 1);
          
          if (window.opener.saveAllDPs) {
            window.opener.saveAllDPs().then(() => {
              displayAllDPs();
              updateStats();
              alert('✅ DP supprimé avec succès !');
            }).catch(error => {
              console.error("❌ Erreur suppression:", error);
              alert("❌ Erreur lors de la suppression");
            });
          } else {
            alert("❌ Fonction de sauvegarde non disponible");
          }
        }
        
        function addNewDP(e) {
          e.preventDefault();
          
          const nom = document.getElementById('new-nom').value.trim().toUpperCase();
          const prenom = document.getElementById('new-prenom').value.trim();
          const niveau = document.getElementById('new-niveau').value;
          const email = document.getElementById('new-email').value.trim();
          
          if (!nom || !prenom || !niveau) {
            alert('⚠️ Veuillez remplir tous les champs obligatoires');
            return;
          }
          
          const newDP = {
            nom: nom,
            prenom: prenom,
            niveau: niveau,
            email: email || '',
            type: 'added',
            dateAjout: new Date().toISOString()
          };
          
          // Essayer d'ajouter via différentes méthodes
          if (window.opener?.allDPList) {
            // Vérifier les doublons
            const exists = window.opener.allDPList.some(dp => 
              dp.nom.toLowerCase() === nom.toLowerCase() && 
              dp.prenom.toLowerCase() === prenom.toLowerCase()
            );
            
            if (exists) {
              alert('⚠️ Ce DP existe déjà dans la liste !');
              return;
            }
            
            // Ajouter à la liste parent
            window.opener.allDPList.push(newDP);
            
            // Sauvegarder si possible
            if (window.opener.saveAllDPs) {
              window.opener.saveAllDPs().then(() => {
                // Réinitialiser le formulaire
                document.getElementById('add-dp-form').reset();
                
                // Forcer le rafraîchissement
                setTimeout(() => {
                  loadDPData();
                  if (window.opener.refreshAfterDPChange) {
                    window.opener.refreshAfterDPChange();
                  }
                }, 500);
                
                alert('✅ DP ajouté avec succès !');
              }).catch(error => {
                console.error("❌ Erreur ajout:", error);
                alert("❌ Erreur lors de l'ajout: " + error.message);
              });
            } else {
              alert("❌ Fonction de sauvegarde non disponible");
            }
          } else {
            alert("❌ Impossible d'accéder aux données DP de l'application principale");
          }
        }
        
        // Initialiser au chargement
        window.onload = initDPWindow;
      </script>
    </body>
    </html>
  `);

  dpManagerWindow.document.close();
  
  console.log("✅ Fenêtre de gestion des DP ouverte");
}

// ===== SURVEILLANCE DES CHANGEMENTS DE LISTE =====
function setupDPListSynchronization() {
  if (!db) return;
  
  // Écouter les changements sur dp_validated au lieu de all_dps
  db.ref('dp_validated').on('value', (snapshot) => {
    const newDPData = snapshot.val() || [];
    let newDPList = [];
    
    // Convertir en tableau si nécessaire
    if (Array.isArray(newDPData)) {
      newDPList = newDPData;
    } else if (typeof newDPData === 'object' && newDPData !== null) {
      newDPList = Object.values(newDPData);
    }
    
    // Vérifier si la liste a changé
    if (JSON.stringify(newDPList) !== JSON.stringify(allDPList)) {
      console.log("🔄 Mise à jour automatique de la liste des DP détectée");
      console.log("Ancienne liste:", allDPList.length, "DP");
      console.log("Nouvelle liste:", newDPList.length, "DP");
      
      allDPList = newDPList;
      window.allDPList = allDPList; // Mettre à jour la référence globale
      
      // Mettre à jour l'interface
      refreshAfterDPChange();
    }
  }, (error) => {
    console.error("❌ Erreur surveillance DP:", error);
    // En cas d'erreur, utiliser les DP de base
    if (allDPList.length === 0) {
      allDPList = [...DP_INITIAUX];
      refreshAfterDPChange();
    }
  });
  
  console.log("👁️ Surveillance des changements DP activée sur dp_validated");
}

// ===== FONCTION POUR METTRE À JOUR LE DROPDOWN =====
function updateDPField() {
  updateDPDropdown();
  console.log("✅ Dropdown DP mis à jour");
}

// ===== INITIALISATION =====
async function initializeDPManager() {
  try {
    // Charger la liste complète des DP
    await loadAllDPs();
    
    // Configurer la surveillance des changements
    setupDPListSynchronization();
    
    // Créer le dropdown
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createDPDropdown);
    } else {
      createDPDropdown();
    }
    
    console.log("✅ Gestionnaire DP initialisé avec dropdown et synchronisation automatique");
    
  } catch (error) {
    console.error("❌ Erreur initialisation gestionnaire DP:", error);
  }
}

// ===== EXPORTS GLOBAUX =====
window.openDPManagerWindow = openDPManagerWindow;
window.updateDPField = updateDPField;
window.getAllDPs = () => allDPList;
window.allDPList = allDPList;
window.saveAllDPs = saveAllDPs;

// ===== FONCTION POUR RAFRAÎCHIR APRÈS CHANGEMENTS =====
function refreshAfterDPChange() {
  // Mettre à jour le dropdown
  updateDPDropdown();
  
  // Mettre à jour la fenêtre popup si elle est ouverte
  if (dpManagerWindow && !dpManagerWindow.closed && dpManagerWindow.displayAllDPs) {
    dpManagerWindow.displayAllDPs();
    dpManagerWindow.updateStats();
  }
  
  console.log("🔄 Interface DP rafraîchie après changement");
}

// Exposer cette fonction
window.refreshAfterDPChange = refreshAfterDPChange;

// ===== INITIALISATION AUTOMATIQUE =====
// Attendre que Firebase soit prêt
function waitForFirebaseDP() {
  if (typeof db !== 'undefined' && db) {
    initializeDPManager();
  } else {
    setTimeout(waitForFirebaseDP, 1000);
  }
}

waitForFirebaseDP();

console.log("👥 Gestionnaire de DP chargé - Système unifié avec dropdown");