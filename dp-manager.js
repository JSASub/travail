// ===== VERIFICATION ADMIN =====
function isUserAdmin() {
  const ADMIN_EMAILS = [
    'raoul.aguirre64@gmail.com',
    'aubard.c@gmail.com',
    'joelcabirol@gmail.com',
    'david.marty@sfr.fr'
  ];
  
  return currentUser && ADMIN_EMAILS.includes(currentUser.email);
}// ===== FONCTION DE MISE A JOUR =====
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
}// dp-manager.js - Version avec sauvegarde Firebase

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
let DP_LIST = [...DP_DE_BASE]; // Commencer avec les DP de base

// ===== CHARGEMENT DEPUIS FIREBASE =====
async function chargerDPDepuisFirebase() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible, utilisation des DP de base");
      return;
    }
    
    // Utiliser le chemin sessions/dp_list pour éviter les problèmes de permissions
    const snapshot = await db.ref('sessions/dp_list').once('value');
    
    if (snapshot.exists()) {
      const dpFirebase = snapshot.val();
      if (Array.isArray(dpFirebase) && dpFirebase.length > 0) {
        DP_LIST = dpFirebase;
        console.log(`✅ ${DP_LIST.length} DP chargés depuis Firebase`);
      } else {
        console.log("🔧 Données Firebase invalides, utilisation des DP de base");
      }
    } else {
      console.log("🔧 Aucune donnée Firebase, sauvegarde des DP de base");
      await sauvegarderDPVersFirebase();
    }
  } catch (error) {
    console.error("❌ Erreur chargement Firebase:", error);
    console.log("🔄 Utilisation des DP de base comme fallback");
  }
}

// ===== SAUVEGARDE VERS FIREBASE =====
async function sauvegarderDPVersFirebase() {
  try {
    if (!db) {
      console.warn("⚠️ Firebase non disponible pour la sauvegarde");
      return false;
    }
    
    await db.ref('sessions/dp_list').set(DP_LIST);
    console.log("💾 DP sauvegardés dans Firebase");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde Firebase:", error);
    return false;
  }
}

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

// ===== BOUTON DE GESTION =====
function ajouterBoutonGestion() {
  const selectElement = document.getElementById("dp-nom");
  if (!selectElement) return;
  
  let manageBtn = document.getElementById("manage-dp-btn");
  if (manageBtn) return;
  
  // DEBUG : Vérifier l'utilisateur actuel
  console.log("👤 Utilisateur actuel:", currentUser?.email);
  console.log("🔐 Est admin?", isUserAdmin());
  
  // Vérifier si admin (votre email est dans la liste)
  if (!isUserAdmin()) {
    console.log("❌ Pas admin, pas de bouton de gestion");
    return;
  }
  
  manageBtn = document.createElement("button");
  manageBtn.id = "manage-dp-btn";
  manageBtn.type = "button";
  manageBtn.innerHTML = "👥 Gérer DP";
  manageBtn.style.cssText = `
    margin-left: 10px;
    padding: 8px 15px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  manageBtn.onclick = ouvrirGestionDP;
  
  selectElement.parentNode.appendChild(manageBtn);
  
  // NOUVEAU : Ajouter bouton de nettoyage
  const cleanBtn = document.createElement("button");
  cleanBtn.id = "clean-dp-btn";
  cleanBtn.type = "button";
  cleanBtn.innerHTML = "🧹 Nettoyer";
  cleanBtn.style.cssText = `
    margin-left: 5px;
    padding: 8px 15px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  cleanBtn.onclick = nettoyerDP;
  cleanBtn.title = "Supprimer les doublons et DP de test";
  
  selectElement.parentNode.appendChild(cleanBtn);
  
  // NOUVEAU : Ajouter bouton de réinitialisation
  const resetBtn = document.createElement("button");
  resetBtn.id = "reset-dp-btn";
  resetBtn.type = "button";
  resetBtn.innerHTML = "🔄 Reset";
  resetBtn.style.cssText = `
    margin-left: 5px;
    padding: 8px 15px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  resetBtn.onclick = reinitialiserDP;
  resetBtn.title = "Réinitialiser aux 10 DP de base";
  
  selectElement.parentNode.appendChild(resetBtn);
  
  console.log("✅ Boutons de gestion ajoutés pour admin:", currentUser?.email);
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
          console.log('🗑️ === DEBUT SUPPRESSION DP ===');
          const dp = dpList[index];
          console.log('DP à supprimer:', dp);
          
          if (confirm('Supprimer "' + dp + '" ?')) {
            dpList.splice(index, 1);
            console.log('✅ DP supprimé de la liste popup');
            console.log('Liste après suppression:', dpList);
            
            afficherDP();
            mettreAJourParent();
            
            console.log('🗑️ === FIN SUPPRESSION DP ===');
            alert('DP supprimé ! Le dropdown a été mis à jour.');
          }
        }
        
        function ajouterDP() {
          console.log('🚀 === DEBUT AJOUT DP ===');
          
          const nom = document.getElementById('nom').value.trim().toUpperCase();
          const prenom = document.getElementById('prenom').value.trim();
          const niveau = document.getElementById('niveau').value;
          
          console.log('Données saisies:', { nom, prenom, niveau });
          
          if (!nom || !prenom || !niveau) {
            alert('Veuillez remplir tous les champs');
            return;
          }
          
          // Vérifier les doublons
          const nouveauDP = nom + ' ' + prenom + ' (' + niveau + ')';
          const existe = dpList.some(dp => dp.toLowerCase() === nouveauDP.toLowerCase());
          
          if (existe) {
            alert('Ce DP existe déjà dans la liste !');
            return;
          }
          
          console.log('Nouveau DP:', nouveauDP);
          
          dpList.push(nouveauDP);
          console.log('Liste après ajout:', dpList);
          
          // Vider le formulaire
          document.getElementById('nom').value = '';
          document.getElementById('prenom').value = '';
          document.getElementById('niveau').value = '';
          
          // Mettre à jour l'affichage popup
          afficherDP();
          
          // Mettre à jour le parent
          mettreAJourParent();
          
          // NOUVEAU : Sauvegarder vers Firebase
          sauvegarderVersFirebase();
          
          console.log('🚀 === FIN AJOUT DP ===');
          alert('DP ajouté et sauvegardé ! Le dropdown a été mis à jour automatiquement.');
        }
        
        function supprimerDP(index) {
          console.log('🗑️ === DEBUT SUPPRESSION DP ===');
          const dp = dpList[index];
          console.log('DP à supprimer:', dp);
          
          if (confirm('Supprimer "' + dp + '" ?')) {
            dpList.splice(index, 1);
            console.log('✅ DP supprimé de la liste popup');
            console.log('Liste après suppression:', dpList);
            
            afficherDP();
            mettreAJourParent();
            
            // NOUVEAU : Sauvegarder vers Firebase
            sauvegarderVersFirebase();
            
            console.log('🗑️ === FIN SUPPRESSION DP ===');
            alert('DP supprimé et sauvegardé ! Le dropdown a été mis à jour.');
          }
        }
        
        // NOUVELLE FONCTION : Sauvegarde depuis la popup
        async function sauvegarderVersFirebase() {
          console.log('💾 === DEBUT SAUVEGARDE FIREBASE ===');
          console.log('Liste popup actuelle:', dpList.length, 'DP');
          
          try {
            if (window.opener) {
              // CORRECTION : Mettre à jour la liste globale du parent AVANT la sauvegarde
              console.log('📝 Mise à jour DP_LIST parent...');
              window.opener.DP_LIST = [...dpList];
              console.log('✅ DP_LIST parent mis à jour, nouvelle taille:', window.opener.DP_LIST.length);
              
              // Sauvegarder via la fonction du parent
              if (window.opener.sauvegarderDPVersFirebase) {
                console.log('💾 Appel sauvegarde Firebase...');
                const success = await window.opener.sauvegarderDPVersFirebase();
                if (success) {
                  console.log('✅ Sauvegarde Firebase réussie');
                } else {
                  console.warn('⚠️ Sauvegarde Firebase échouée');
                }
              } else {
                console.error('❌ Fonction sauvegarderDPVersFirebase non trouvée');
              }
            } else {
              console.error('❌ window.opener non disponible');
            }
          } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
          }
          
          console.log('💾 === FIN SAUVEGARDE FIREBASE ===');
        }
        
        function mettreAJourParent() {
          console.log('🔄 === DEBUT MISE A JOUR PARENT ===');
          console.log('dpList popup actuel:', dpList.length, 'DP');
          console.log('window.opener existe?', !!window.opener);
          
          if (!window.opener) {
            console.error('❌ window.opener non disponible');
            return;
          }
          
          try {
            // ÉTAPE 1 : Mettre à jour la variable globale DP_LIST EN PREMIER
            console.log('📝 ÉTAPE 1: Mise à jour de la variable DP_LIST globale...');
            const ancienneTaille = window.opener.DP_LIST ? window.opener.DP_LIST.length : 0;
            window.opener.DP_LIST = [...dpList];
            console.log('✅ DP_LIST global mis à jour:', ancienneTaille, '→', window.opener.DP_LIST.length);
            
            // ÉTAPE 2 : Mise à jour du dropdown
            console.log('🔧 ÉTAPE 2: Mise à jour directe du dropdown...');
            const select = window.opener.document.getElementById('dp-nom');
            
            if (!select) {
              console.error('❌ Select dp-nom non trouvé dans parent');
              return;
            }
            
            console.log('✅ Select trouvé, mise à jour...');
            
            // Sauvegarder la valeur actuelle
            const currentValue = select.value;
            console.log('💾 Valeur actuelle:', currentValue);
            
            // Vider le select
            select.innerHTML = '';
            
            // Option par défaut
            const defaultOption = window.opener.document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Sélectionner un Directeur de Plongée --';
            select.appendChild(defaultOption);
            
            // Ajouter tous les DP
            let optionsAdded = 0;
            dpList.forEach(dp => {
              const option = window.opener.document.createElement('option');
              option.value = dp.split(' (')[0]; // "AGUIRRE Raoul"
              option.textContent = dp; // "AGUIRRE Raoul (E3)"
              select.appendChild(option);
              optionsAdded++;
            });
            
            console.log('✅', optionsAdded, 'options ajoutées au dropdown');
            
            // Restaurer la valeur si possible
            if (currentValue) {
              select.value = currentValue;
              console.log('🔙 Valeur restaurée:', currentValue);
            }
            
            console.log('✅ Mise à jour directe terminée avec succès');
            
          } catch (error) {
            console.error('❌ Erreur lors de la mise à jour:', error);
          }
          
          console.log('🔄 === FIN MISE A JOUR PARENT ===');
        }
        
        afficherDP();
      </script>
    </body>
    </html>
  `);
  
  popup.document.close();
}

// ===== FONCTION DE NETTOYAGE MANUEL =====
function nettoyerDP() {
  console.log("🧹 === NETTOYAGE DES DP ===");
  console.log("Liste avant nettoyage:", DP_LIST.length, "DP");
  console.log("DP actuels:", DP_LIST);
  
  // Supprimer les doublons
  const avantDoublons = DP_LIST.length;
  DP_LIST = [...new Set(DP_LIST)];
  const doublonsSupprimes = avantDoublons - DP_LIST.length;
  
  if (doublonsSupprimes > 0) {
    console.log("✅", doublonsSupprimes, "doublon(s) supprimé(s)");
  }
  
  // Supprimer les DP contenant certains mots (modifiable)
  const motsASupprimer = ["NOUVCEAU", "TEST", "NOUVEAU"];
  const avantFiltrage = DP_LIST.length;
  
  DP_LIST = DP_LIST.filter(dp => {
    return !motsASupprimer.some(mot => dp.toUpperCase().includes(mot));
  });
  
  const filtresSupprimes = avantFiltrage - DP_LIST.length;
  if (filtresSupprimes > 0) {
    console.log("✅", filtresSupprimes, "DP de test supprimé(s)");
  }
  
  console.log("Liste après nettoyage:", DP_LIST.length, "DP");
  console.log("DP finaux:", DP_LIST);
  
  // Mettre à jour l'interface
  mettreAJourDropdown();
  
  // Sauvegarder
  sauvegarderDPVersFirebase().then(() => {
    console.log("✅ Nettoyage terminé et sauvegardé");
    alert("🧹 Nettoyage terminé !\n\nDoublons supprimés : " + doublonsSupprimes + "\nDP de test supprimés : " + filtresSupprimes + "\n\nTotal final : " + DP_LIST.length + " DP");
  });
  
  console.log("🧹 === FIN NETTOYAGE ===");
}

// ===== FONCTION DE REINITIALISATION =====
function reinitialiserDP() {
  if (confirm("⚠️ Réinitialiser la liste des DP ?\n\nCela supprimera tous les DP ajoutés et ne gardera que les 10 DP de base.\n\nCette action est irréversible !")) {
    console.log("🔄 Réinitialisation des DP...");
    DP_LIST = [...DP_DE_BASE];
    mettreAJourDropdown();
    sauvegarderDPVersFirebase().then(() => {
      console.log("✅ Réinitialisation terminée");
      alert("✅ Liste réinitialisée aux 10 DP de base !");
    });
  }
}

// ===== INITIALISATION =====
async function initialiserGestionnaireDP() {
  console.log("🚀 Initialisation gestionnaire DP avec Firebase...");
  
  // Charger les DP depuis Firebase d'abord
  await chargerDPDepuisFirebase();
  
  // Puis créer l'interface
  remplirDropdownDP();
  ajouterBoutonGestion();
  
  console.log("✅ Gestionnaire DP initialisé avec", DP_LIST.length, "DP");
}

setTimeout(async () => {
  await initialiserGestionnaireDP();
}, 2000);

// Exporter les fonctions
window.mettreAJourDropdown = mettreAJourDropdown;
window.DP_LIST = DP_LIST;
window.sauvegarderDPVersFirebase = sauvegarderDPVersFirebase;
window.chargerDPDepuisFirebase = chargerDPDepuisFirebase;
window.nettoyerDP = nettoyerDP;
window.reinitialiserDP = reinitialiserDP;

console.log("📦 dp-manager simple chargé");