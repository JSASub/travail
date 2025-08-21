// dp-manager.js - Système de gestion des DP avec liste prédéfinie

// ===== LISTE DES DP PRÉDÉFINIS =====
const DP_PREDEFINIS = [
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
let dpCustomList = [];
let dpManagerWindow = null;

// ===== CHARGEMENT DES DP PERSONNALISÉS =====
async function loadCustomDPs() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour charger les DP personnalisés");
      return;
    }
    
    const snapshot = await db.ref('custom_dps').once('value');
    if (snapshot.exists()) {
      dpCustomList = snapshot.val() || [];
      console.log(`✅ ${dpCustomList.length} DP personnalisés chargés`);
    }
  } catch (error) {
    console.error("❌ Erreur chargement DP personnalisés:", error);
  }
}

// ===== SAUVEGARDE DES DP PERSONNALISÉS =====
async function saveCustomDPs() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour sauvegarder les DP");
      return false;
    }
    
    await db.ref('custom_dps').set(dpCustomList);
    console.log("✅ DP personnalisés sauvegardés");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde DP personnalisés:", error);
    return false;
  }
}

// ===== LISTE COMPLÈTE DES DP =====
function getAllDPs() {
  return [...DP_PREDEFINIS, ...dpCustomList];
}

// ===== AMÉLIORATION DU CHAMP DP AVEC AUTOCOMPLÉTION =====
function enhanceDPField() {
  const dpNomField = document.getElementById("dp-nom");
  if (!dpNomField) return;
  
  // Créer la liste de suggestions
  let datalist = document.getElementById("dp-suggestions");
  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = "dp-suggestions";
    dpNomField.parentNode.insertBefore(datalist, dpNomField.nextSibling);
    dpNomField.setAttribute("list", "dp-suggestions");
  }
  
  // Remplir avec tous les DP
  const allDPs = getAllDPs();
  datalist.innerHTML = "";
  
  allDPs.forEach(dp => {
    const option = document.createElement("option");
    option.value = `${dp.nom} ${dp.prenom}`;
    option.textContent = `${dp.nom} ${dp.prenom} (${dp.niveau})`;
    datalist.appendChild(option);
  });
  
  // Ajouter un bouton de gestion à côté du champ
  let manageBtn = document.getElementById("manage-dp-btn");
  if (!manageBtn) {
    manageBtn = document.createElement("button");
    manageBtn.id = "manage-dp-btn";
    manageBtn.type = "button";
    manageBtn.textContent = "👥 Gérer DP";
    manageBtn.style.cssText = `
      margin-left: 10px;
      padding: 6px 12px;
      background: #6f42c1;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    manageBtn.title = "Gérer la liste des Directeurs de Plongée";
    manageBtn.addEventListener("click", openDPManagerWindow);
    
    dpNomField.parentNode.appendChild(manageBtn);
  }
  
  console.log(`✅ Champ DP amélioré avec ${allDPs.length} suggestions`);
}

// ===== FENÊTRE DE GESTION DES DP =====
function openDPManagerWindow() {
  if (dpManagerWindow && !dpManagerWindow.closed) {
    dpManagerWindow.focus();
    return;
  }

  const windowFeatures = `
    width=800,
    height=700,
    left=${(screen.width - 800) / 2},
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
        
        .content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          gap: 20px;
        }
        
        .section {
          flex: 1;
          background: #f8f9fa;
          border-radius: 10px;
          padding: 20px;
        }
        
        .section h2 {
          color: #004080;
          margin-bottom: 15px;
          font-size: 18px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }
        
        .dp-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }
        
        .dp-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .dp-card.predefined {
          border-left: 4px solid #28a745;
        }
        
        .dp-card.custom {
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
        }
        
        .dp-level {
          background: #28a745;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
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
        
        .btn-delete {
          background: #dc3545;
          color: white;
        }
        
        .btn:hover {
          transform: scale(1.05);
        }
        
        .add-form {
          background: white;
          border: 2px dashed #007bff;
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
        }
        
        .form-row {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          align-items: center;
        }
        
        .form-row label {
          min-width: 80px;
          font-weight: bold;
          color: #004080;
        }
        
        .form-row input, .form-row select {
          flex: 1;
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
        
        .stats {
          background: #e3f2fd;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 15px;
          text-align: center;
          font-size: 14px;
          color: #1565c0;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        /* Scrollbar personnalisée */
        .content::-webkit-scrollbar {
          width: 6px;
        }
        
        .content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👥 Gestion des Directeurs de Plongée</h1>
          <p>Liste complète et administration des DP JSAS</p>
        </div>
        
        <div class="content">
          <!-- Section DP Prédéfinis -->
          <div class="section">
            <h2>🏛️ DP Officiels JSAS</h2>
            <div class="stats">
              <strong>${DP_PREDEFINIS.length} DP officiels</strong> • Liste de référence
            </div>
            <div id="predefined-dps">
              <!-- Contenu généré dynamiquement -->
            </div>
          </div>
          
          <!-- Section DP Personnalisés -->
          <div class="section">
            <h2>➕ DP Personnalisés</h2>
            <div class="stats">
              <strong id="custom-count">0 DP personnalisés</strong> • Géré par vous
            </div>
            <div id="custom-dps">
              <!-- Contenu généré dynamiquement -->
            </div>
            
            <!-- Formulaire d'ajout -->
            <div class="add-form">
              <h3 style="color: #004080; margin-bottom: 15px;">➕ Ajouter un nouveau DP</h3>
              <form id="add-dp-form">
                <div class="form-row">
                  <label>Nom :</label>
                  <input type="text" id="new-nom" required placeholder="NOM" style="text-transform: uppercase;">
                </div>
                <div class="form-row">
                  <label>Prénom :</label>
                  <input type="text" id="new-prenom" required placeholder="Prénom">
                </div>
                <div class="form-row">
                  <label>Niveau :</label>
                  <select id="new-niveau" required>
                    <option value="">-- Choisir --</option>
                    <option value="E4">E4 (MF2/DESJEPS)</option>
                    <option value="E3">E3 (MF1/DEJEPS)</option>
                    <option value="P5">P5 (DP Exploration)</option>
                    <option value="N4/GP">N4/GP (Guide de Palanquée)</option>
                    <option value="N4">N4</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Email :</label>
                  <input type="email" id="new-email" placeholder="email@jsas.fr (optionnel)">
                </div>
                <div class="form-row">
                  <label></label>
                  <button type="submit" class="btn" style="background: #28a745; color: white; padding: 10px 20px;">
                    ➕ Ajouter ce DP
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <button onclick="window.opener.updateDPField(); window.close();" 
                  style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
            ✅ Fermer et actualiser
          </button>
          <span>Système de gestion JSAS - Les modifications sont sauvegardées automatiquement</span>
        </div>
      </div>
      
      <script>
        // Variables globales pour la fenêtre
        let dpList = [];
        
        // Initialiser la fenêtre
        function initDPWindow() {
          // Récupérer les données depuis la fenêtre parent
          if (window.opener && window.opener.getAllDPs) {
            const allDPs = window.opener.getAllDPs();
            displayPredefinedDPs();
            displayCustomDPs();
          }
          
          // Event listener pour le formulaire
          document.getElementById('add-dp-form').addEventListener('submit', addNewDP);
        }
        
        function displayPredefinedDPs() {
          const container = document.getElementById('predefined-dps');
          const predefinedDPs = window.opener.DP_PREDEFINIS || [];
          
          let html = '';
          predefinedDPs.forEach(dp => {
            html += createDPCard(dp, 'predefined');
          });
          
          container.innerHTML = html;
        }
        
        function displayCustomDPs() {
          const container = document.getElementById('custom-dps');
          const customDPs = window.opener.dpCustomList || [];
          
          document.getElementById('custom-count').textContent = customDPs.length + ' DP personnalisés';
          
          if (customDPs.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>Aucun DP personnalisé</h3><p>Utilisez le formulaire ci-dessous pour ajouter vos propres DP</p></div>';
            return;
          }
          
          let html = '';
          customDPs.forEach((dp, index) => {
            html += createDPCard(dp, 'custom', index);
          });
          
          container.innerHTML = html;
        }
        
        function createDPCard(dp, type, index = null) {
          const canDelete = type === 'custom';
          
          return \`
            <div class="dp-card \${type}">
              <div class="dp-info">
                <div class="dp-name">\${dp.nom} \${dp.prenom}</div>
                <div class="dp-details">
                  <span class="dp-level">\${dp.niveau}</span>
                  \${dp.email ? dp.email : 'Pas d\\'email'}
                </div>
              </div>
              <div class="dp-actions">
                <button class="btn btn-use" onclick="useDP('\${dp.nom} \${dp.prenom}')" title="Utiliser ce DP">
                  📋 Utiliser
                </button>
                \${canDelete ? \`<button class="btn btn-delete" onclick="deleteDP(\${index})" title="Supprimer ce DP">🗑️</button>\` : ''}
              </div>
            </div>
          \`;
        }
        
        function useDP(dpName) {
          if (window.opener && window.opener.document.getElementById('dp-nom')) {
            window.opener.document.getElementById('dp-nom').value = dpName;
            alert('✅ DP sélectionné : ' + dpName);
          }
        }
        
        function deleteDP(index) {
          if (!window.opener || !window.opener.dpCustomList) return;
          
          const dp = window.opener.dpCustomList[index];
          if (confirm(\`⚠️ Supprimer \${dp.nom} \${dp.prenom} de la liste ?\\n\\nCette action est irréversible !\`)) {
            window.opener.dpCustomList.splice(index, 1);
            window.opener.saveCustomDPs();
            displayCustomDPs();
            alert('✅ DP supprimé avec succès !');
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
          
          // Vérifier les doublons
          const allDPs = window.opener.getAllDPs();
          const exists = allDPs.some(dp => 
            dp.nom.toLowerCase() === nom.toLowerCase() && 
            dp.prenom.toLowerCase() === prenom.toLowerCase()
          );
          
          if (exists) {
            alert('⚠️ Ce DP existe déjà dans la liste !');
            return;
          }
          
          const newDP = {
            nom: nom,
            prenom: prenom,
            niveau: niveau,
            email: email || '',
            dateAjout: new Date().toISOString()
          };
          
          // Ajouter à la liste
          window.opener.dpCustomList.push(newDP);
          window.opener.saveCustomDPs();
          
          // Réinitialiser le formulaire
          document.getElementById('add-dp-form').reset();
          
          // Rafraîchir l'affichage
          displayCustomDPs();
          
          alert('✅ DP ajouté avec succès !');
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

// ===== FONCTION POUR METTRE À JOUR LE CHAMP DP =====
function updateDPField() {
  enhanceDPField();
  console.log("✅ Champ DP mis à jour");
}

// ===== INITIALISATION =====
async function initializeDPManager() {
  try {
    // Charger les DP personnalisés
    await loadCustomDPs();
    
    // Améliorer le champ DP
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enhanceDPField);
    } else {
      enhanceDPField();
    }
    
    console.log("✅ Gestionnaire DP initialisé");
    
  } catch (error) {
    console.error("❌ Erreur initialisation gestionnaire DP:", error);
  }
}

// ===== EXPORTS GLOBAUX =====
window.openDPManagerWindow = openDPManagerWindow;
window.updateDPField = updateDPField;
window.getAllDPs = getAllDPs;
window.DP_PREDEFINIS = DP_PREDEFINIS;
window.dpCustomList = dpCustomList;
window.saveCustomDPs = saveCustomDPs;

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

console.log("👥 Gestionnaire de DP chargé");