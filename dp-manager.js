// dp-manager.js - Version corrigée et simplifiée

// ===== LISTE DES DP DE BASE =====
const DP_DE_BASE = [
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

// ===== VARIABLES GLOBALES =====
let DP_LIST = [...DP_DE_BASE];

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function chargerDPDepuisFirebase() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible");
      return;
    }
    
    const snapshot = await db.ref('sessions/dp_list').once('value');
    if (snapshot.exists() && snapshot.val()) {
      const data = snapshot.val();
      if (Array.isArray(data) && data.length > 0) {
        DP_LIST = [...data];
        console.log("✅", DP_LIST.length, "DP chargés depuis Firebase");
      } else {
        DP_LIST = [...DP_DE_BASE];
        console.log("🔧 Données Firebase invalides, utilisation des DP de base");
      }
    } else {
      DP_LIST = [...DP_DE_BASE];
      console.log("🔧 Aucune donnée Firebase, utilisation des DP de base");
    }
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
    DP_LIST = [...DP_DE_BASE];
  }
}

// ===== SAUVEGARDE VERS FIREBASE =====
async function sauvegarderDPVersFirebase() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour sauvegarder");
      return false;
    }
    
    await db.ref('sessions/dp_list').set(DP_LIST);
    console.log("✅ Sauvegarde Firebase réussie -", DP_LIST.length, "DP");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde Firebase:", error);
    return false;
  }
}

// ===== MISE A JOUR DU DROPDOWN =====
function mettreAJourDropdown() {
  const select = document.getElementById("dp-nom");
  if (!select) {
    console.error("❌ Champ dp-nom non trouvé");
    return;
  }
  
  // Sauvegarder la valeur actuelle
  const currentValue = select.value;
  
  // Vider et recréer
  select.innerHTML = '';
  
  // Option par défaut
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
  select.appendChild(defaultOption);
  
  // Ajouter tous les DP
  DP_LIST.forEach(dp => {
    const option = document.createElement('option');
    const nomComplet = dp.split(' (')[0]; // "AGUIRRE Raoul" depuis "AGUIRRE Raoul (E3)"
    option.value = nomComplet;
    option.textContent = dp;
    select.appendChild(option);
  });
  
  // Restaurer la valeur si elle existe encore
  if (currentValue && DP_LIST.some(dp => dp.includes(currentValue))) {
    select.value = currentValue;
  }
  
  console.log("🔄 Dropdown mis à jour avec", DP_LIST.length, "DP");
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

// ===== POPUP DE GESTION =====
function ouvrirGestionDP() {
  const popup = window.open('', 'DPManager', 'width=800,height=600,scrollbars=yes,resizable=yes');
  
  popup.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Gestion des DP - JSAS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h2 { color: #2c5282; margin-top: 0; }
        .dp-list { margin: 20px 0; }
        .dp-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #007bff; display: flex; justify-content: space-between; align-items: center; }
        .dp-info { flex-grow: 1; }
        .dp-niveau { color: #666; font-size: 0.9em; }
        .btn { padding: 5px 10px; margin: 0 2px; border: none; border-radius: 3px; cursor: pointer; }
        .btn-use { background: #28a745; color: white; }
        .btn-delete { background: #dc3545; color: white; }
        .form-section { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .form-group { margin: 10px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn-add { background: #007bff; color: white; padding: 10px 20px; font-size: 16px; }
        .stats { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h2>👥 Gestion des Directeurs de Plongée</h2>
        
        <div class="stats">
            <strong>📊 Statistiques:</strong> <span id="stats-text">Chargement...</span>
        </div>
        
        <div class="dp-list">
            <h3>📋 Liste des DP enregistrés:</h3>
            <div id="dp-container">Chargement...</div>
        </div>
        
        <div class="form-section">
            <h3>➕ Ajouter un nouveau DP:</h3>
            <form id="add-form">
                <div class="form-group">
                    <label>Nom:</label>
                    <input type="text" id="nom" required placeholder="Ex: MARTIN">
                </div>
                <div class="form-group">
                    <label>Prénom:</label>
                    <input type="text" id="prenom" required placeholder="Ex: Jean">
                </div>
                <div class="form-group">
                    <label>Niveau:</label>
                    <select id="niveau" required>
                        <option value="">-- Sélectionner --</option>
                        <option value="E4">E4 (Encadrant 4ème degré)</option>
                        <option value="E3">E3 (Encadrant 3ème degré)</option>
                        <option value="P5">P5 (Plongeur 5ème degré)</option>
                        <option value="N5">N5 (Niveau 5)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-add">➕ Ajouter ce DP</button>
            </form>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.close()" class="btn" style="background: #6c757d; color: white; padding: 10px 20px;">❌ Fermer</button>
        </div>
    </div>

    <script>
        // Variables
        let dpList = [];
        
        // Charger les données depuis le parent
        function chargerDonnees() {
            if (window.opener && window.opener.DP_LIST) {
                dpList = [...window.opener.DP_LIST];
                afficherDP();
                mettreAJourStats();
            } else {
                document.getElementById('dp-container').innerHTML = '❌ Impossible de charger les données';
            }
        }
        
        // Afficher la liste des DP
        function afficherDP() {
            const container = document.getElementById('dp-container');
            if (dpList.length === 0) {
                container.innerHTML = '<p>Aucun DP enregistré.</p>';
                return;
            }
            
            container.innerHTML = dpList.map((dp, index) => {
                const [nomPrenom, niveau] = dp.split(' (');
                const niveauClean = niveau ? niveau.replace(')', '') : '';
                return \`
                    <div class="dp-item">
                        <div class="dp-info">
                            <strong>\${nomPrenom}</strong>
                            <div class="dp-niveau">Niveau: \${niveauClean}</div>
                        </div>
                        <div>
                            <button onclick="utiliserDP('\${dp}')" class="btn btn-use">✅ Utiliser</button>
                            <button onclick="supprimerDP(\${index})" class="btn btn-delete">🗑️ Supprimer</button>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        // Mettre à jour les statistiques
        function mettreAJourStats() {
            const total = dpList.length;
            const parNiveau = {};
            dpList.forEach(dp => {
                const niveau = dp.match(/\\((.+)\\)/)?.[1] || 'Inconnu';
                parNiveau[niveau] = (parNiveau[niveau] || 0) + 1;
            });
            
            const statsText = \`Total: \${total} DP | \${Object.entries(parNiveau).map(([n, c]) => \`\${n}: \${c}\`).join(' | ')}\`;
            document.getElementById('stats-text').textContent = statsText;
        }
        
        // Utiliser un DP (le sélectionner dans le dropdown principal)
        function utiliserDP(dp) {
            if (window.opener) {
                const select = window.opener.document.getElementById('dp-nom');
                if (select) {
                    const nomComplet = dp.split(' (')[0];
                    select.value = nomComplet;
                    alert('✅ DP "' + dp + '" sélectionné !');
                } else {
                    alert('❌ Impossible de mettre à jour le dropdown principal');
                }
            }
        }
        
        // Supprimer un DP
        function supprimerDP(index) {
            const dp = dpList[index];
            if (confirm('🗑️ Supprimer "' + dp + '" de la liste ?')) {
                dpList.splice(index, 1);
                
                // Mettre à jour le parent
                if (window.opener && window.opener.DP_LIST) {
                    window.opener.DP_LIST = [...dpList];
                    window.opener.mettreAJourDropdown();
                    window.opener.sauvegarderDPVersFirebase();
                }
                
                // Mettre à jour l'affichage
                afficherDP();
                mettreAJourStats();
                
                console.log('🗑️ DP supprimé:', dp);
                alert('✅ DP supprimé et sauvegardé !');
            }
        }
        
        // Ajouter un DP
        function ajouterDP(e) {
            e.preventDefault();
            
            const nom = document.getElementById('nom').value.trim().toUpperCase();
            const prenom = document.getElementById('prenom').value.trim();
            const niveau = document.getElementById('niveau').value;
            
            if (!nom || !prenom || !niveau) {
                alert('❌ Veuillez remplir tous les champs');
                return;
            }
            
            const nouveauDP = \`\${nom} \${prenom} (\${niveau})\`;
            
            // Vérifier les doublons
            if (dpList.some(dp => dp.toLowerCase().includes(nom.toLowerCase()) && dp.toLowerCase().includes(prenom.toLowerCase()))) {
                alert('❌ Ce DP existe déjà !');
                return;
            }
            
            // Ajouter à la liste
            dpList.push(nouveauDP);
            
            // Mettre à jour le parent
            if (window.opener && window.opener.DP_LIST) {
                window.opener.DP_LIST = [...dpList];
                window.opener.mettreAJourDropdown();
                window.opener.sauvegarderDPVersFirebase();
            }
            
            // Mettre à jour l'affichage
            afficherDP();
            mettreAJourStats();
            
            // Reset du formulaire
            document.getElementById('add-form').reset();
            
            console.log('➕ DP ajouté:', nouveauDP);
            alert('✅ DP ajouté et sauvegardé !');
        }
        
        // Initialisation
        document.getElementById('add-form').addEventListener('submit', ajouterDP);
        chargerDonnees();
    </script>
</body>
</html>
  `);
}

// ===== FONCTIONS DE NETTOYAGE =====
function nettoyerDP() {
  console.log("🧹 === NETTOYAGE DES DP ===");
  const avant = DP_LIST.length;
  
  // Supprimer les doublons
  DP_LIST = [...new Set(DP_LIST)];
  
  // Supprimer les DP de test
  DP_LIST = DP_LIST.filter(dp => {
    const dpLower = dp.toLowerCase();
    return !dpLower.includes('test') && 
           !dpLower.includes('nouveau') && 
           !dpLower.includes('demo');
  });
  
  const apres = DP_LIST.length;
  const supprimes = avant - apres;
  
  mettreAJourDropdown();
  sauvegarderDPVersFirebase();
  
  console.log(`✅ Nettoyage terminé: ${supprimes} DP supprimés (${avant} → ${apres})`);
  alert(`🧹 Nettoyage terminé !\n${supprimes} DP supprimés\n${apres} DP restants`);
}

function reinitialiserDP() {
  if (confirm('🔄 Remettre la liste aux 10 DP de base ?\n\nTous les DP ajoutés seront supprimés !')) {
    DP_LIST = [...DP_DE_BASE];
    mettreAJourDropdown();
    sauvegarderDPVersFirebase();
    console.log("🔄 Liste remise aux 10 DP de base");
    alert('🔄 Liste remise aux 10 DP de base !');
  }
}

// ===== BOUTONS D'ADMINISTRATION =====
function ajouterBoutonsAdmin() {
  const selectElement = document.getElementById("dp-nom");
  if (!selectElement) return;
  
  // Éviter les doublons
  if (document.getElementById("manage-dp-btn")) return;
  
  // Vérifier les permissions admin
  if (!isUserAdmin()) {
    console.log("🔐 Utilisateur non admin, pas de boutons de gestion");
    return;
  }
  
  // Bouton Gérer DP
  const manageBtn = document.createElement("button");
  manageBtn.id = "manage-dp-btn";
  manageBtn.innerHTML = "👥 Gérer DP";
  manageBtn.style.cssText = "margin-left: 10px; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  manageBtn.onclick = ouvrirGestionDP;
  
  // Bouton Nettoyer
  const cleanBtn = document.createElement("button");
  cleanBtn.id = "clean-dp-btn";
  cleanBtn.innerHTML = "🧹 Nettoyer";
  cleanBtn.style.cssText = "margin-left: 5px; padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  cleanBtn.onclick = nettoyerDP;
  
  // Bouton Reset
  const resetBtn = document.createElement("button");
  resetBtn.id = "reset-dp-btn";
  resetBtn.innerHTML = "🔄 Reset";
  resetBtn.style.cssText = "margin-left: 5px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
  resetBtn.onclick = reinitialiserDP;
  
  // Ajouter les boutons
  selectElement.parentNode.appendChild(manageBtn);
  selectElement.parentNode.appendChild(cleanBtn);
  selectElement.parentNode.appendChild(resetBtn);
  
  console.log("✅ Boutons d'administration ajoutés");
}

// ===== INITIALISATION =====
async function initialiserGestionnaireDP() {
  console.log("🚀 Initialisation gestionnaire DP...");
  
  // Charger les DP depuis Firebase
  await chargerDPDepuisFirebase();
  
  // Créer le dropdown
  mettreAJourDropdown();
  
  // Ajouter les boutons admin si nécessaire
  ajouterBoutonsAdmin();
  
  console.log("✅ Gestionnaire DP initialisé avec", DP_LIST.length, "DP");
}

// ===== ATTENDRE L'AUTHENTIFICATION =====
function attendreAuth() {
  if (typeof currentUser !== 'undefined' && currentUser) {
    initialiserGestionnaireDP();
  } else {
    console.log("⏳ Attente authentification...");
    setTimeout(attendreAuth, 1000);
  }
}

// ===== LANCEMENT AUTOMATIQUE =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(attendreAuth, 2000));
} else {
  setTimeout(attendreAuth, 2000);
}

// ===== EXPORTS GLOBAUX =====
window.DP_LIST = DP_LIST;
window.mettreAJourDropdown = mettreAJourDropdown;
window.ouvrirGestionDP = ouvrirGestionDP;
window.nettoyerDP = nettoyerDP;
window.reinitialiserDP = reinitialiserDP;
window.sauvegarderDPVersFirebase = sauvegarderDPVersFirebase;
window.chargerDPDepuisFirebase = chargerDPDepuisFirebase;