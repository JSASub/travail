// dp-sessions-manager.js - Gestion DP et Sessions (VERSION CORRIGÉE)

// ===== CONFIGURATION SÉLECTEURS UNIFIÉE =====
// Réutilise la même configuration que offline-manager pour cohérence
const DP_SELECTORS = {
  dp: {
    nom: "#dp-nom",
    niveau: "#dp-niveau",
    date: "#dp-date", 
    lieu: "#dp-lieu",
    plongee: "#dp-plongee", // CORRIGÉ : unifié avec offline-manager
    select: "#dp-select",
    message: "#dp-message"
  },
  palanquee: {
    container: ".palanquee",
    horaire: ".palanquee-horaire",
    profPrevue: ".palanquee-prof-prevue",
    dureePrevue: ".palanquee-duree-prevue",
    profRealisee: ".palanquee-prof-realisee",
    dureeRealisee: ".palanquee-duree-realisee",
    paliers: ".palanquee-paliers"
  },
  plongeur: {
    container: ".plongeur",
    inputs: "input, select, textarea"
  }
};

// ===== UTILITAIRES DOM PARTAGÉS =====
function waitForDPElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function check() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: élément ${selector} non trouvé après ${timeout}ms`));
        return;
      }
      
      setTimeout(check, 100);
    }
    
    check();
  });
}

function verifyDPElements() {
  const required = [
    DP_SELECTORS.dp.nom,
    DP_SELECTORS.dp.date,
    DP_SELECTORS.dp.lieu,
    DP_SELECTORS.dp.plongee
  ];
  
  const missing = required.filter(selector => !document.querySelector(selector));
  return missing.length === 0 ? null : missing;
}

// ===== GESTION DU DIRECTEUR DE PLONGÉE =====

// Validation et enregistrement des informations DP
async function validateAndSaveDP() {
  try {
    console.log("💾 Validation et sauvegarde DP...");

    // Vérifier les éléments DOM
    const missing = verifyDPElements();
    if (missing) {
      console.error("❌ Éléments DOM manquants:", missing);
      alert("⚠️ Interface non prête. Veuillez réessayer dans quelques secondes.");
      return false;
    }

    // NOUVEAU : Synchroniser automatiquement le champ dp-nom avec le sélecteur
    const dpSelect = document.querySelector(DP_SELECTORS.dp.select);
    const dpNomInput = document.querySelector(DP_SELECTORS.dp.nom);
    
    if (dpSelect && dpSelect.value && dpNomInput) {
      const selectedOption = dpSelect.options[dpSelect.selectedIndex];
      const dpName = selectedOption.text.replace(/\s*\([^)]*\)/, '');
      dpNomInput.value = dpName;
      console.log('🔄 Synchronisation auto dp-nom:', dpName);
    }
    
    // Récupérer les valeurs avec sélecteurs unifiés
    const dpNom = dpNomInput?.value?.trim();
    const dpDate = document.querySelector(DP_SELECTORS.dp.date)?.value;
    const dpLieu = document.querySelector(DP_SELECTORS.dp.lieu)?.value?.trim();
    const dpPlongee = document.querySelector(DP_SELECTORS.dp.plongee)?.value; // CORRIGÉ
    const dpMessage = document.querySelector(DP_SELECTORS.dp.message);
    
    // Validation des champs obligatoires
    const validation = validateDPFields(dpNom, dpDate, dpLieu, dpPlongee);
    if (!validation.valid) {
      alert(validation.message);
      if (validation.focusElement) {
        document.querySelector(`#${validation.focusElement}`)?.focus();
      }
      return false;
    }
    
    // Créer l'objet informations DP avec structure cohérente
    const dpInfo = {
      nom: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee, // CORRIGÉ : nom cohérent
      timestamp: Date.now(),
      validated: true
    };
    
    // NOUVEAU : Inclure le DP sélectionné
    if (dpSelect && dpSelect.value) {
      dpInfo.dp_selected_id = dpSelect.value;
      dpInfo.dp_selected_text = dpSelect.options[dpSelect.selectedIndex].text;
    }

    // Sauvegarder les détails de toutes les palanquées avec sélecteurs unifiés
    const palanqueeDetails = [];
    const palanqueeElements = document.querySelectorAll(DP_SELECTORS.palanquee.container); 
    
    console.log(`💾 Sauvegarde détails de ${palanqueeElements.length} palanquées...`);

    palanqueeElements.forEach((element, index) => {
      const details = {
        id: element.dataset?.index || index.toString(),
        horaire: element.querySelector(DP_SELECTORS.palanquee.horaire)?.value || '',
        profondeurPrevue: element.querySelector(DP_SELECTORS.palanquee.profPrevue)?.value || '',
        dureePrevue: element.querySelector(DP_SELECTORS.palanquee.dureePrevue)?.value || '',
        profondeurRealisee: element.querySelector(DP_SELECTORS.palanquee.profRealisee)?.value || '',
        dureeRealisee: element.querySelector(DP_SELECTORS.palanquee.dureeRealisee)?.value || '',
        paliers: element.querySelector(DP_SELECTORS.palanquee.paliers)?.value || ''
      };
      
      // Log des valeurs trouvées (seulement si non vides)
      const nonEmptyFields = Object.entries(details).filter(([key, value]) => key !== 'id' && value !== '');
      if (nonEmptyFields.length > 0) {
        console.log(`  Palanquée ${index}:`, nonEmptyFields.reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {}));
      }
      
      palanqueeDetails.push(details);
    });

    dpInfo.palanquee_details = palanqueeDetails;
    console.log('💾 DP + détails palanquées inclus dans la sauvegarde');
    
    // Sauvegarder dans Firebase si disponible
    if (typeof db !== 'undefined' && db) {
      try {
        const dpKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
        await db.ref(`dpInfo/${dpKey}`).set(dpInfo);
        console.log("✅ Informations DP sauvegardées dans Firebase");
        
        // NOUVEAU : Mettre à jour l'indicateur de session courante
        updateCurrentSessionAfterSave();
        
        // NOUVEAU : Rafraîchir automatiquement après validation
        if (typeof refreshAllLists === 'function') {
          setTimeout(refreshAllLists, 500);
        }
        
      } catch (firebaseError) {
        console.warn("⚠️ Erreur sauvegarde Firebase:", firebaseError.message);
        throw firebaseError;
      }
    }
    
    // Afficher le message de confirmation
    showDPValidationMessage(dpMessage, dpNom, dpDate, dpLieu, dpPlongee, true);
    
    // Mettre à jour l'interface du bouton temporairement
    updateValidationButton(true);
    
    console.log("✅ Validation DP réussie:", dpInfo);
    
    // Synchronisation optionnelle
    if (typeof syncToDatabase === 'function') {
      setTimeout(syncToDatabase, 1000);
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur validation DP:", error);
    
    const dpMessage = document.querySelector(DP_SELECTORS.dp.message);
    showDPValidationMessage(dpMessage, "", "", "", "", false, error.message);
    
    if (typeof handleError === 'function') {
      handleError(error, "Validation DP");
    }
    
    return false;
  }
}

function validateDPFields(nom, date, lieu, plongee) {
  if (!nom) {
    return {
      valid: false,
      message: "⚠️ Veuillez saisir le nom du Directeur de Plongée",
      focusElement: "dp-nom"
    };
  }
  
  if (nom.length < 2) {
    return {
      valid: false,
      message: "⚠️ Le nom du DP doit contenir au moins 2 caractères",
      focusElement: "dp-nom"
    };
  }
  
  if (!date) {
    return {
      valid: false,
      message: "⚠️ Veuillez sélectionner une date",
      focusElement: "dp-date"
    };
  }
  
  // Vérifier que la date n'est pas trop ancienne (plus de 1 an)
  const selectedDate = new Date(date);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (selectedDate < oneYearAgo) {
    const confirm = window.confirm(
      "⚠️ La date sélectionnée remonte à plus d'un an.\n\n" +
      "Êtes-vous sûr de vouloir continuer ?"
    );
    
    if (!confirm) {
      return {
        valid: false,
        message: "Validation annulée",
        focusElement: "dp-date"
      };
    }
  }
  
  if (!lieu) {
    return {
      valid: false,
      message: "⚠️ Veuillez saisir le lieu de plongée",
      focusElement: "dp-lieu"
    };
  }
  
  if (lieu.length < 2) {
    return {
      valid: false,
      message: "⚠️ Le lieu doit contenir au moins 2 caractères",
      focusElement: "dp-lieu"
    };
  }
  
  return { valid: true };
}

function showDPValidationMessage(messageElement, nom, date, lieu, plongee, success, errorMsg = "") {
  if (!messageElement) return;
  
  if (success) {
    messageElement.innerHTML = `
      <div style="color: #28a745; font-weight: bold; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
        ✅ Session complète enregistrée avec succès
        <br><small style="font-weight: normal;">
          📋 ${typeof plongeurs !== 'undefined' ? plongeurs.length : 0} plongeurs, ${typeof palanquees !== 'undefined' ? palanquees.length : 0} palanquées
          <br>📍 ${nom} - ${new Date(date).toLocaleDateString('fr-FR')} - ${lieu} (${plongee})
        </small>
      </div>
    `;
    messageElement.classList.add("dp-valide");
    messageElement.style.display = 'block';
  } else {
    messageElement.innerHTML = `
      <div style="color: #dc3545; font-weight: bold; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        ❌ Erreur lors de l'enregistrement : ${errorMsg}
      </div>
    `;
    messageElement.classList.remove("dp-valide");
    messageElement.style.display = 'block';
  }
}

function updateValidationButton(success) {
  const validerDPBtn = document.getElementById("valider-dp");
  if (!validerDPBtn) return;
  
  if (success) {
    validerDPBtn.disabled = true;
    validerDPBtn.textContent = "✅ Enregistré";
    validerDPBtn.style.backgroundColor = "#28a745";
    
    setTimeout(() => {
      validerDPBtn.disabled = false;
      validerDPBtn.textContent = "Enregistrer Session + DP";
      validerDPBtn.style.backgroundColor = "#007bff";
    }, 3000);
  }
}

// ===== HISTORIQUE DP =====
async function chargerHistoriqueDP() {
  console.log("📋 Chargement de l'historique DP sécurisé...");
  
  const dpDatesSelect = document.getElementById("dp-dates");
  if (!dpDatesSelect) {
    console.error("❌ Élément dp-dates non trouvé");
    return;
  }
  
  dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';
  
  try {
    if (typeof db === 'undefined' || !db) {
      console.warn("⚠️ Firebase non disponible pour charger l'historique DP");
      dpDatesSelect.innerHTML += '<option disabled>Firebase non connecté</option>';
      return;
    }
    
    const snapshot = await db.ref('dpInfo').once('value');
    
    if (!snapshot.exists()) {
      console.log("ℹ️ Aucune donnée DP trouvée dans Firebase");
      dpDatesSelect.innerHTML += '<option disabled>Aucun DP enregistré</option>';
      return;
    }
    
    const dpInfos = snapshot.val();
    const dpList = [];
    
    Object.entries(dpInfos).forEach(([key, dpData]) => {
      if (dpData && dpData.date) {
        dpList.push({
          key: key,
          date: dpData.date,
          nom: dpData.nom || "DP non défini",
          lieu: dpData.lieu || "Lieu non défini",
          plongee: dpData.plongee || "matin",
          timestamp: dpData.timestamp || 0
        });
      }
    });
    
    // Trier par date décroissante
    dpList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    dpList.forEach(dp => {
      const option = document.createElement("option");
      option.value = dp.key;
      option.textContent = `${dp.date} - ${dp.nom} - ${dp.lieu} (${dp.plongee})`;
      dpDatesSelect.appendChild(option);
    });
    
    console.log(`✅ ${dpList.length} DP chargés dans l'historique`);
    
    // Attacher l'event listener pour l'affichage des détails
    if (!dpDatesSelect.hasAttribute('data-listener-attached')) {
      dpDatesSelect.addEventListener('change', afficherInfoDP);
      dpDatesSelect.setAttribute('data-listener-attached', 'true');
    }
    
  } catch (error) {
    console.error("❌ Erreur chargement historique DP:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement historique DP");
    }
    dpDatesSelect.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

function afficherInfoDP() {
  const dpDatesSelect = document.getElementById("dp-dates");
  const historiqueInfo = document.getElementById("historique-info");
  
  if (!dpDatesSelect || !historiqueInfo) {
    console.error("❌ Éléments DOM manquants pour afficher les infos DP");
    return;
  }
  
  const selectedKey = dpDatesSelect.value;
  
  if (!selectedKey) {
    historiqueInfo.innerHTML = '';
    return;
  }
  
  historiqueInfo.innerHTML = '<p>⏳ Chargement des informations...</p>';
  
  if (typeof db === 'undefined' || !db) {
    historiqueInfo.innerHTML = '<p style="color: red;">❌ Firebase non disponible</p>';
    return;
  }
  
  db.ref(`dpInfo/${selectedKey}`).once('value')
    .then(snapshot => {
      if (!snapshot.exists()) {
        historiqueInfo.innerHTML = '<p style="color: red;">❌ DP non trouvé</p>';
        return;
      }
      
      const dpData = snapshot.val();
      const formatDate = (dateStr) => {
        try {
          return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch {
          return dateStr;
        }
      };
      
      historiqueInfo.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
          <h4 style="margin: 0 0 10px 0; color: #004080;">📋 Informations DP</h4>
          <p><strong>👨‍💼 Directeur de Plongée :</strong> ${dpData.nom || 'Non défini'}</p>
          <p><strong>📅 Date :</strong> ${formatDate(dpData.date)}</p>
          <p><strong>📍 Lieu :</strong> ${dpData.lieu || 'Non défini'}</p>
          <p><strong>🕐 Session :</strong> ${dpData.plongee || 'matin'}</p>
          <p><strong>⏰ Créé le :</strong> ${dpData.timestamp ? new Date(dpData.timestamp).toLocaleString('fr-FR') : 'Date inconnue'}</p>
          
          <div style="margin-top: 15px;">
            <button onclick="chargerDonneesDPSelectionne('${selectedKey}')" 
                    style="background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
              📥 Charger dans l'interface
            </button>
            <button onclick="supprimerDPSelectionne('${selectedKey}')" 
                    style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      `;
    })
    .catch(error => {
      console.error("❌ Erreur chargement DP:", error);
      if (typeof handleError === 'function') {
        handleError(error, "Chargement DP");
      }
      historiqueInfo.innerHTML = `<p style="color: red;">❌ Erreur : ${error.message}</p>`;
    });
}

// NOUVEAU : Restaurer le DP sélectionné avec vérification en boucle robuste ET SÉLECTEURS UNIFIÉS
async function waitAndRestoreSession(dpData, maxRetries = 20) {
  if (!dpData) {
    console.error("❌ Données DP manquantes pour restauration");
    return false;
  }

  console.log('🔄 Restauration de session DP avec retry intelligent...');

  let retryCount = 0;

  async function attemptSessionRestore() {
    try {
      retryCount++;
      console.log(`🔄 Tentative ${retryCount}/${maxRetries}`);

      // Attendre que les éléments essentiels soient prêts
      await waitForDPElement(DP_SELECTORS.dp.select, 5000);
      await waitForDPElement(DP_SELECTORS.palanquee.container, 8000);

      const dpSelect = document.querySelector(DP_SELECTORS.dp.select);
      const palanqueeElements = document.querySelectorAll(DP_SELECTORS.palanquee.container);
      
      console.log('📊 Vérification éléments session:', {
        dpSelect: !!dpSelect,
        dpOptions: dpSelect?.options.length || 0,
        palanquees: palanqueeElements.length,
        dpData: !!dpData
      });
      
      // Vérifier si tous les éléments sont prêts
      if (!dpSelect || dpSelect.options.length <= 1) {
        throw new Error("Sélecteur DP pas encore chargé");
      }

      if (palanqueeElements.length === 0) {
        throw new Error("Palanquées pas encore disponibles");
      }
      
      console.log('✅ Éléments prêts, début de la restauration de session');
      
      // 1. RESTAURER LE DP SÉLECTIONNÉ
      if (dpData.dp_selected_id) {
        // Vérifier que l'option existe
        const optionExists = Array.from(dpSelect.options).some(opt => opt.value === dpData.dp_selected_id);
        if (optionExists) {
          dpSelect.value = dpData.dp_selected_id;
          dpSelect.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('⚡ DP sélectionné restauré:', dpData.dp_selected_text);
        } else {
          console.warn('⚠️ Option DP non trouvée:', dpData.dp_selected_id);
        }
      }
      
      // 2. RESTAURER LES DÉTAILS PALANQUÉES avec sélecteurs unifiés
      if (dpData.palanquee_details && dpData.palanquee_details.length > 0) {
        console.log(`📋 Restauration de ${dpData.palanquee_details.length} palanquées de session`);
        
        dpData.palanquee_details.forEach((details, index) => {
          const element = document.querySelector(`[data-index="${details.id}"]`) || palanqueeElements[index];
          
          if (element) {
            // Mapping unifié des champs avec DP_SELECTORS
            const fieldMappings = [
              { selector: DP_SELECTORS.palanquee.horaire, value: details.horaire, name: 'horaire' },
              { selector: DP_SELECTORS.palanquee.profPrevue, value: details.profondeurPrevue, name: 'prof. prévue' },
              { selector: DP_SELECTORS.palanquee.dureePrevue, value: details.dureePrevue, name: 'durée prévue' },
              { selector: DP_SELECTORS.palanquee.profRealisee, value: details.profondeurRealisee, name: 'prof. réalisée' },
              { selector: DP_SELECTORS.palanquee.dureeRealisee, value: details.dureeRealisee, name: 'durée réalisée' },
              { selector: DP_SELECTORS.palanquee.paliers, value: details.paliers, name: 'paliers' }
            ];
            
            fieldMappings.forEach(({ selector, value, name }) => {
              const fieldElement = element.querySelector(selector);
              if (fieldElement && value) {
                fieldElement.value = value;
                fieldElement.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`  ✅ ${name}: "${value}"`);
              } else if (value) {
                console.warn(`  ⚠️ ${name} non trouvé (${selector})`);
              }
            });
          } else {
            console.warn(`⚠️ Palanquée ${index} non trouvée`);
          }
        });
        
        console.log(`⚡ Détails palanquées restaurés: ${dpData.palanquee_details.length} palanquées`);
      }

      // 3. DÉCLENCHER LES ÉVÉNEMENTS DE CHANGEMENT SI FONCTION DISPONIBLE
      if (typeof onDpSelectionChange === 'function') {
        setTimeout(onDpSelectionChange, 500);
      }

      console.log("✅ Restauration de session terminée avec succès !");
      return true;

    } catch (error) {
      console.warn(`⚠️ Tentative ${retryCount} échouée:`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error(`❌ Restauration de session échouée après ${maxRetries} tentatives`);
        return false;
      }
      
      // Délai progressif avant nouvelle tentative
      const delay = Math.min(150 * retryCount, 2500);
      console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
      
      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await attemptSessionRestore();
          resolve(result);
        }, delay);
      });
    }
  }

  return await attemptSessionRestore();
}

async function chargerDonneesDPSelectionne(dpKey) {
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const snapshot = await db.ref(`dpInfo/${dpKey}`).once('value');
    if (!snapshot.exists()) {
      alert("❌ DP non trouvé");
      return;
    }
    
    const dpData = snapshot.val();
    
    // Charger les données dans l'interface avec sélecteurs unifiés
    const dpElements = {
      nom: document.querySelector(DP_SELECTORS.dp.nom),
      niveau: document.querySelector(DP_SELECTORS.dp.niveau),
      date: document.querySelector(DP_SELECTORS.dp.date),
      lieu: document.querySelector(DP_SELECTORS.dp.lieu),
      plongee: document.querySelector(DP_SELECTORS.dp.plongee) // CORRIGÉ
    };
    
    // Vérifier les éléments
    const missingElements = Object.entries(dpElements)
      .filter(([key, element]) => !element)
      .map(([key]) => key);
      
    if (missingElements.length > 0) {
      console.warn("⚠️ Éléments DP manquants:", missingElements);
    }
    
    // Restaurer les valeurs
    if (dpElements.nom) dpElements.nom.value = dpData.nom || "";
    if (dpElements.niveau) dpElements.niveau.value = dpData.niveau || "";
    if (dpElements.date) dpElements.date.value = dpData.date || "";
    if (dpElements.lieu) dpElements.lieu.value = dpData.lieu || "";
    if (dpElements.plongee) dpElements.plongee.value = dpData.plongee || "matin"; // CORRIGÉ
    
    // NOUVEAU : Synchroniser avec le nouveau sélecteur DP avec vérification active
    if (dpData.nom || dpData.dp_selected_id) {
      console.log('🔄 Synchronisation du DP chargé:', dpData.nom);
      
      // Démarrer la vérification active pour restaurer avec dpData
      await waitAndRestoreSession(dpData);
      
      // Alternative : synchronisation par nom si pas d'ID sauvegardé
      if (!dpData.dp_selected_id && dpData.nom) {
        setTimeout(() => {
          const dpSelect = document.querySelector(DP_SELECTORS.dp.select);
          if (dpSelect && dpSelect.options.length > 1) {
            // Chercher l'option correspondante par nom de famille ou prénom
            for (let i = 0; i < dpSelect.options.length; i++) {
              const option = dpSelect.options[i];
              const nomParts = dpData.nom.split(' ');
              const nomFamille = nomParts[0]; // AGUIRRE
              const prenom = nomParts[1] || ''; // Raoul
              
              if (option.text.includes(nomFamille) || (prenom && option.text.includes(prenom))) {
                dpSelect.value = option.value;
                dpSelect.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ DP synchronisé avec session:', option.text);
                
                // Déclencher l'événement de changement si la fonction existe
                if (typeof onDpSelectionChange === 'function') {
                  onDpSelectionChange();
                }
                
                // Désactiver le choix automatique pour respecter le chargement de session
                window.userOverrideDP = true;
                break;
              }
            }
          }
        }, 100);
      }
    }
    
    // NOUVEAU : Effacer le message de validation DP précédent
    clearDPValidationMessage();
    
    alert("✅ Données DP chargées avec succès !");
    console.log("✅ DP chargé:", dpData);
    
  } catch (error) {
    console.error("❌ Erreur chargement DP:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement DP sélectionné");
    }
    alert("❌ Erreur lors du chargement : " + error.message);
  }
}

async function supprimerDPSelectionne(dpKey) {
  const confirmation = confirm("⚠️ Êtes-vous sûr de vouloir supprimer ce DP ?\n\nCette action est irréversible !");

  if (!confirmation) return;

  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }

    await db.ref(`dpInfo/${dpKey}`).remove();
    alert("✅ DP supprimé avec succès !");

    // Recharger l'historique
    await chargerHistoriqueDP();

    // Rafraîchir les listes si la fonction existe
    if (typeof refreshAllLists === 'function') {
      await refreshAllLists();
    }

    console.log("✅ DP supprimé:", dpKey, "+ listes rafraîchies");

  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Suppression DP");
    }
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// ===== GESTION DES SESSIONS =====
async function populateSessionSelector() {
  const sessionSelector = document.getElementById("session-selector");
  if (!sessionSelector) {
    console.error("❌ Élément session-selector non trouvé");
    return;
  }
  
  // Vider le sélecteur
  sessionSelector.innerHTML = '<option value="">-- Charger une session --</option>';
  
  try {
    if (typeof loadAvailableSessions === 'function') {
      const sessions = await loadAvailableSessions();
      
      if (sessions.length === 0) {
        sessionSelector.innerHTML += '<option disabled>Aucune session disponible</option>';
        console.log("ℹ️ Aucune session trouvée");
        return;
      }
      
      sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session.key;
        option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
        sessionSelector.appendChild(option);
      });
      
      console.log(`✅ ${sessions.length} sessions chargées dans le sélecteur`);
      
    } else {
      // Fallback : charger directement depuis Firebase
      if (typeof db !== 'undefined' && db) {
        const snapshot = await db.ref('sessions').once('value');
        
        if (!snapshot.exists()) {
          sessionSelector.innerHTML += '<option disabled>Aucune session trouvée</option>';
          return;
        }
        
        const sessions = snapshot.val();
        const sessionsList = [];
        
        Object.entries(sessions).forEach(([key, sessionData]) => {
          if (sessionData && sessionData.meta) {
            sessionsList.push({
              key: key,
              dp: sessionData.meta.dp || "DP inconnu",
              date: sessionData.meta.date || "Date inconnue", 
              lieu: sessionData.meta.lieu || "Lieu inconnu",
              plongee: sessionData.meta.plongee || "matin",
              timestamp: sessionData.meta.timestamp || 0
            });
          }
        });
        
        // Trier par date décroissante
        sessionsList.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
        
        sessionsList.forEach(session => {
          const option = document.createElement("option");
          option.value = session.key;
          option.textContent = `${session.date} - ${session.dp} - ${session.lieu} (${session.plongee})`;
          sessionSelector.appendChild(option);
        });
        
        console.log(`✅ ${sessionsList.length} sessions chargées (fallback)`);
      } else {
        sessionSelector.innerHTML += '<option disabled>Firebase non disponible</option>';
        console.warn("⚠️ Firebase non disponible pour charger les sessions");
      }
    }
    
  } catch (error) {
    console.error("❌ Erreur chargement sessions:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement sessions");
    }
    sessionSelector.innerHTML += '<option disabled>Erreur de chargement</option>';
  }
}

async function loadSessionFromSelector() {
  const loadBtn = document.getElementById("load-session");
  
  try {
    // Indicateur de chargement
    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "🔄 Chargement...";
      loadBtn.style.backgroundColor = "#6c757d";
    }
    
    const sessionSelector = document.getElementById("session-selector");
    if (!sessionSelector) {
      alert("Sélecteur de session non trouvé");
      return false;
    }
    
    const sessionKey = sessionSelector.value;
    if (!sessionKey) {
      alert("Veuillez sélectionner une session à charger.");
      return false;
    }
    
    if (typeof loadSession === 'function') {
      const success = await loadSession(sessionKey);
      if (!success) {
        alert("Erreur lors du chargement de la session.");
        return false;
      } else {
        console.log("✅ Session chargée:", sessionKey);
        
        // NOUVEAU : Effacer le message de validation DP précédent
        clearDPValidationMessage();
        
        // NOUVEAU : Afficher quelle session est chargée
        updateCurrentSessionDisplay(sessionKey, sessionSelector.options[sessionSelector.selectedIndex].text);
        
        // Indicateur de succès temporaire
        if (loadBtn) {
          loadBtn.textContent = "✅ Chargé !";
          loadBtn.style.backgroundColor = "#28a745";
          setTimeout(() => {
            loadBtn.textContent = "Charger";
            loadBtn.style.backgroundColor = "#6c757d";
          }, 2000);
        }
        
        return true;
      }
    } else {
      alert("Fonction de chargement non disponible");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Chargement session");
    }
    alert("Erreur lors du chargement : " + error.message);
    return false;
  } finally {
    // Restaurer le bouton dans tous les cas
    if (loadBtn) {
      loadBtn.disabled = false;
      if (loadBtn.textContent.includes("🔄")) {
        loadBtn.textContent = "Charger";
        loadBtn.style.backgroundColor = "#6c757d";
      }
    }
  }
}

// NOUVELLE FONCTION : Afficher la session actuellement chargée
function updateCurrentSessionDisplay(sessionKey, sessionText) {
  try {
    // Chercher ou créer l'indicateur de session courante
    let currentSessionDiv = document.getElementById("current-session-indicator");
    
    if (!currentSessionDiv) {
      // Créer l'indicateur s'il n'existe pas
      currentSessionDiv = document.createElement("div");
      currentSessionDiv.id = "current-session-indicator";
      currentSessionDiv.style.cssText = `
        margin: 10px 0;
        padding: 8px 12px;
        background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
        border: 1px solid #4caf50;
        border-radius: 6px;
        font-size: 13px;
        color: #2e7d32;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      // L'insérer après le bouton "Enregistrer Session + DP"
      const validerDPBtn = document.getElementById("valider-dp");
      if (validerDPBtn && validerDPBtn.parentNode) {
        validerDPBtn.parentNode.insertBefore(currentSessionDiv, validerDPBtn.nextSibling);
      } else {
        // Fallback : l'insérer dans meta-info
        const metaInfo = document.getElementById("meta-info");
        if (metaInfo) {
          metaInfo.appendChild(currentSessionDiv);
        }
      }
    }
    
    // Mettre à jour le contenu
    if (sessionKey && sessionText) {
      currentSessionDiv.innerHTML = `
        <span style="font-size: 16px;">📋</span>
        <span>Session chargée : ${sessionText}</span>
        <button onclick="clearCurrentSessionDisplay()" style="
          background: rgba(255,255,255,0.7);
          border: none;
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 11px;
          cursor: pointer;
          margin-left: auto;
        " title="Effacer l'indicateur">✖</button>
      `;
      currentSessionDiv.style.display = "flex";
    } else {
      currentSessionDiv.style.display = "none";
    }
    
  } catch (error) {
    console.error("❌ Erreur updateCurrentSessionDisplay:", error);
  }
}

// NOUVELLE FONCTION : Effacer l'indicateur de session
function clearCurrentSessionDisplay() {
  try {
    const currentSessionDiv = document.getElementById("current-session-indicator");
    if (currentSessionDiv) {
      currentSessionDiv.style.display = "none";
    }
  } catch (error) {
    console.error("❌ Erreur clearCurrentSessionDisplay:", error);
  }
}

// NOUVELLE FONCTION : Mettre à jour l'indicateur après sauvegarde
function updateCurrentSessionAfterSave() {
  try {
    const dpSelect = document.querySelector(DP_SELECTORS.dp.select);
    const dpNom = dpSelect?.value ? 
      dpSelect.options[dpSelect.selectedIndex].text.replace(/\s*\([^)]*\)/, '') : 
      document.querySelector(DP_SELECTORS.dp.nom)?.value?.trim();
    const dpDate = document.querySelector(DP_SELECTORS.dp.date)?.value;
    const dpLieu = document.querySelector(DP_SELECTORS.dp.lieu)?.value?.trim();
    const dpPlongee = document.querySelector(DP_SELECTORS.dp.plongee)?.value; // CORRIGÉ
    
    if (dpNom && dpDate && dpLieu) {
      const sessionText = `${dpDate} - ${dpNom} - ${dpLieu} (${dpPlongee})`;
      const sessionKey = `${dpDate}_${dpNom.split(' ')[0].substring(0, 8)}_${dpPlongee}`;
      updateCurrentSessionDisplay(sessionKey, sessionText);
    }
  } catch (error) {
    console.error("❌ Erreur updateCurrentSessionAfterSave:", error);
  }
}

// NOUVELLE FONCTION : Effacer le message de validation DP
function clearDPValidationMessage() {
  try {
    const dpMessage = document.querySelector(DP_SELECTORS.dp.message);
    if (dpMessage) {
      dpMessage.innerHTML = '';
      dpMessage.classList.remove("dp-valide");
      dpMessage.style.display = 'none';
    }
  } catch (error) {
    console.error("❌ Erreur clearDPValidationMessage:", error);
  }
}

async function saveCurrentSession() {
  try {
    if (typeof saveSessionData === 'function') {
      await saveSessionData();
      alert("Session sauvegardée !");
      
      // Actualiser les listes
      await populateSessionSelector();
      if (typeof populateSessionsCleanupList === 'function') {
        await populateSessionsCleanupList();
      }
      
      console.log("✅ Session sauvegardée");
      return true;
    } else {
      alert("Fonction de sauvegarde non disponible");
      return false;
    }
  } catch (error) {
    console.error("❌ Erreur sauvegarde session:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Sauvegarde session");
    }
    alert("Erreur lors de la sauvegarde : " + error.message);
    return false;
  }
}

// ===== NETTOYAGE DES SESSIONS =====
async function populateSessionsCleanupList() {
  console.log("🧹 Chargement de la liste de nettoyage des sessions...");
  
  const cleanupList = document.getElementById("sessions-cleanup-list");
  if (!cleanupList) {
    console.error("❌ Élément sessions-cleanup-list non trouvé");
    return;
  }
  
  // Vider la liste d'abord
  cleanupList.innerHTML = '<em>Chargement des sessions...</em>';
  
  try {
    const sessions = typeof loadAvailableSessions === 'function' ? 
      await loadAvailableSessions() : 
      await loadSessionsDirectly();
    
    if (sessions.length === 0) {
      cleanupList.innerHTML = '<em>Aucune session trouvée</em>';
      return;
    }
    
    let html = '';
    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp || Date.now()).toLocaleDateString('fr-FR');
      html += `
        <label class="cleanup-item">
          <input type="checkbox" class="session-cleanup-checkbox" value="${session.key}">
          <div class="item-info">
            <span class="item-date">${session.date} - ${session.dp}</span>
            <span class="item-details">${session.lieu} (${session.plongee})</span>
            <span class="item-meta">Créé le ${sessionDate} | ${session.stats?.totalPlongeurs || 0} plongeurs</span>
          </div>
        </label>
      `;
    });
    
    cleanupList.innerHTML = html;
    console.log(`✅ ${sessions.length} sessions dans la liste de nettoyage`);
    
  } catch (error) {
    console.error("❌ Erreur chargement liste nettoyage sessions:", error);
    cleanupList.innerHTML = '<em>Erreur de chargement</em>';
  }
}

async function loadSessionsDirectly() {
  if (typeof db === 'undefined' || !db) {
    return [];
  }
  
  try {
    const snapshot = await db.ref('sessions').once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sessions = snapshot.val();
    const sessionsList = [];
    
    Object.entries(sessions).forEach(([key, sessionData]) => {
      if (sessionData) {
        sessionsList.push({
          key: key,
          dp: sessionData.meta?.dp || sessionData.dp || "DP inconnu",
          date: sessionData.meta?.date || sessionData.date || "Date inconnue",
          lieu: sessionData.meta?.lieu || sessionData.lieu || "Lieu inconnu", 
          plongee: sessionData.meta?.plongee || sessionData.plongee || "matin",
          timestamp: sessionData.meta?.timestamp || sessionData.timestamp || 0,
          stats: sessionData.stats || {
            totalPlongeurs: (sessionData.plongeurs || []).length + 
              (sessionData.palanquees || []).reduce((sum, pal) => sum + (pal?.length || 0), 0)
          }
        });
      }
    });
    
    // Trier par date décroissante
    sessionsList.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    return sessionsList;
    
  } catch (error) {
    console.error("❌ Erreur loadSessionsDirectly:", error);
    return [];
  }
}

// ===== FONCTIONS DE NETTOYAGE =====
function selectAllSessions(select) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = select;
  });
  updateCleanupSelection();
}

function updateCleanupSelection() {
  const sessionCheckboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  const deleteSessionsBtn = document.getElementById('delete-selected-sessions');
  
  if (deleteSessionsBtn) {
    deleteSessionsBtn.disabled = sessionCheckboxes.length === 0;
    deleteSessionsBtn.textContent = `🗑️ Supprimer sélectionnées (${sessionCheckboxes.length})`;
  }
}

async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucune session sélectionnée");
    return;
  }
  
  const confirmation = confirm(`⚠️ Supprimer ${checkboxes.length} session(s) ?\n\nCette action est irréversible !`);
  
  if (!confirmation) return;
  
  try {
    if (typeof db === 'undefined' || !db) {
      alert("❌ Firebase non disponible");
      return;
    }
    
    const promises = [];
    checkboxes.forEach(checkbox => {
      promises.push(db.ref(`sessions/${checkbox.value}`).remove());
    });
    
    await Promise.all(promises);
    
    alert(`✅ ${checkboxes.length} session(s) supprimée(s) avec succès !`);
    
    // Recharger les listes
    await populateSessionSelector();
    await populateSessionsCleanupList();
    
    console.log(`✅ ${checkboxes.length} sessions supprimées + listes rafraîchies`);
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("❌ Erreur lors de la suppression : " + error.message);
  }
}

// ===== RAFRAÎCHISSEMENT AUTOMATIQUE =====
async function refreshAllLists() {
  console.log("🔄 Rafraîchissement automatique des listes...");
  
  try {
    // Rafraîchir l'historique DP
    if (typeof chargerHistoriqueDP === 'function') {
      await chargerHistoriqueDP();
    }
    
    // Rafraîchir le sélecteur de sessions
    await populateSessionSelector();
    
    // Rafraîchir les listes de nettoyage
    await populateSessionsCleanupList();
    
    console.log("✅ Toutes les listes rafraîchies");
    
  } catch (error) {
    console.error("❌ Erreur rafraîchissement listes:", error);
  }
}

// NOUVELLE FONCTION : Rafraîchissement avec indicateur visuel
async function refreshAllListsWithIndicator(buttonId = "refresh-sessions") {
  const refreshBtn = document.getElementById(buttonId);
  
  try {
    // Indicateur de rafraîchissement
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = "🔄 Actualisation...";
      refreshBtn.style.backgroundColor = "#6c757d";
    }
    
    // Effectuer le rafraîchissement
    await refreshAllLists();
    
    // Indicateur de succès temporaire
    if (refreshBtn) {
      refreshBtn.textContent = "✅ Actualisé !";
      refreshBtn.style.backgroundColor = "#28a745";
      
      setTimeout(() => {
        refreshBtn.textContent = "Actualiser";
        refreshBtn.style.backgroundColor = "#6c757d";
      }, 2000);
    }
    
    console.log("✅ Actualisation manuelle réussie avec indicateur");
    
  } catch (error) {
    console.error("❌ Erreur actualisation manuelle:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Actualisation manuelle");
    }
    
    // Indicateur d'erreur
    if (refreshBtn) {
      refreshBtn.textContent = "❌ Erreur";
      refreshBtn.style.backgroundColor = "#dc3545";
      
      setTimeout(() => {
        refreshBtn.textContent = "Actualiser";
        refreshBtn.style.backgroundColor = "#6c757d";
      }, 3000);
    }
  } finally {
    // Restaurer le bouton dans tous les cas
    if (refreshBtn) {
      refreshBtn.disabled = false;
      if (refreshBtn.textContent.includes("🔄")) {
        refreshBtn.textContent = "Actualiser";
        refreshBtn.style.backgroundColor = "#6c757d";
      }
    }
  }
}

// ===== TEST FIREBASE =====
async function testFirebaseConnection() {
  console.log("🧪 === TEST FIREBASE COMPLET SÉCURISÉ ===");
  
  try {
    console.log("📡 Test 1: Vérification connexion Firebase");
    console.log("Firebase connecté:", typeof firebaseConnected !== 'undefined' ? firebaseConnected : 'undefined');
    console.log("Instance db:", typeof db !== 'undefined' && db ? "✅ OK" : "❌ MANQUANTE");
    
    if (typeof db !== 'undefined' && db) {
      console.log("📖 Test 2: Lecture /sessions");
      const sessionsRead = await db.ref('sessions').once('value');
      console.log("✅ Lecture sessions OK:", sessionsRead.exists() ? "Données trouvées" : "Aucune donnée");
      
      if (sessionsRead.exists()) {
        const sessions = sessionsRead.val();
        console.log("Nombre de sessions:", Object.keys(sessions).length);
      }
    }
    
    console.log("📊 Test 3: Données actuelles");
    console.log("Plongeurs en mémoire:", typeof plongeurs !== 'undefined' ? plongeurs.length : 'undefined');
    console.log("Palanquées en mémoire:", typeof palanquees !== 'undefined' ? palanquees.length : 'undefined');
    
    console.log("🎉 === TESTS TERMINÉS ===");
    alert("Test Firebase terminé !\n\nRegardez la console pour les détails.");
    
  } catch (error) {
    console.error("❌ Erreur test Firebase:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Test Firebase");
    }
    alert("Erreur lors du test Firebase : " + error.message);
  }
}

// ===== INITIALISATION APRÈS CONNEXION =====
async function initializeAfterAuth() {
  console.log("🔑 Initialisation après authentification...");
  
  try {
    // Charger toutes les données utilisateur
    if (typeof initializeAppData === 'function') {
      await initializeAppData();
    }
    
    // Charger spécifiquement l'historique et les listes de nettoyage
    console.log("📋 Chargement des interfaces de gestion...");
    
    try {
      await chargerHistoriqueDP();
      console.log("✅ Historique DP chargé après auth");
    } catch (error) {
      console.error("❌ Erreur historique DP après auth:", error);
    }
    
    try {
      await populateSessionSelector();
      console.log("✅ Sélecteur sessions chargé après auth");
    } catch (error) {
      console.error("❌ Erreur sélecteur sessions après auth:", error);
    }
    
    try {
      await populateSessionsCleanupList();
      console.log("✅ Liste nettoyage sessions chargée après auth");
    } catch (error) {
      console.error("❌ Erreur liste sessions après auth:", error);
    }
    
    console.log("✅ Initialisation complète après authentification terminée");
    
  } catch (error) {
    console.error("❌ Erreur initialisation après auth:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Initialisation après authentification");
    }
  }
}

// ===== SETUP EVENT LISTENERS =====
function setupDPSessionsEventListeners() {
  console.log("🎛️ Configuration des event listeners DP et Sessions...");
  
  try {
    // === VALIDATION DP ===
    const validerDPBtn = document.getElementById("valider-dp");
    if (validerDPBtn && !validerDPBtn.hasAttribute('data-dp-listener-attached')) {
      validerDPBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await validateAndSaveDP();
      });
      validerDPBtn.setAttribute('data-dp-listener-attached', 'true');
    }

    // === SESSIONS ===
    const loadSessionBtn = document.getElementById("load-session");
    if (loadSessionBtn && !loadSessionBtn.hasAttribute('data-load-listener-attached')) {
      loadSessionBtn.addEventListener("click", loadSessionFromSelector);
      loadSessionBtn.setAttribute('data-load-listener-attached', 'true');
    }

    const refreshSessionsBtn = document.getElementById("refresh-sessions");
    if (refreshSessionsBtn && !refreshSessionsBtn.hasAttribute('data-refresh-listener-attached')) {
      refreshSessionsBtn.addEventListener("click", async () => {
        await refreshAllListsWithIndicator("refresh-sessions");
      });
      refreshSessionsBtn.setAttribute('data-refresh-listener-attached', 'true');
    }

    const saveSessionBtn = document.getElementById("save-session");
    if (saveSessionBtn && !saveSessionBtn.hasAttribute('data-save-listener-attached')) {
      saveSessionBtn.addEventListener("click", async () => {
        const saveBtn = document.getElementById("save-session");
        
        try {
          // Indicateur de sauvegarde
          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "💾 Sauvegarde...";
            saveBtn.style.backgroundColor = "#6c757d";
          }
          
          const success = await saveCurrentSession();
          
          if (success) {
            // Indicateur de succès
            if (saveBtn) {
              saveBtn.textContent = "✅ Sauvegardé !";
              saveBtn.style.backgroundColor = "#28a745";
              setTimeout(() => {
                saveBtn.textContent = "Sauvegarder Session";
                saveBtn.style.backgroundColor = "#28a745";
              }, 2000);
            }
          } else {
            // Indicateur d'erreur
            if (saveBtn) {
              saveBtn.textContent = "❌ Erreur";
              saveBtn.style.backgroundColor = "#dc3545";
              setTimeout(() => {
                saveBtn.textContent = "Sauvegarder Session";
                saveBtn.style.backgroundColor = "#28a745";
              }, 3000);
            }
          }
          
        } catch (error) {
          console.error("❌ Erreur sauvegarde:", error);
          if (saveBtn) {
            saveBtn.textContent = "❌ Erreur";
            saveBtn.style.backgroundColor = "#dc3545";
            setTimeout(() => {
              saveBtn.textContent = "Sauvegarder Session";
              saveBtn.style.backgroundColor = "#28a745";
            }, 3000);
          }
        } finally {
          // Restaurer le bouton
          if (saveBtn) {
            saveBtn.disabled = false;
            if (saveBtn.textContent.includes("💾")) {
              saveBtn.textContent = "Sauvegarder Session";
              saveBtn.style.backgroundColor = "#28a745";
            }
          }
        }
      });
      saveSessionBtn.setAttribute('data-save-listener-attached', 'true');
    }

    // === NETTOYAGE SESSIONS ===
    const selectAllSessionsBtn = document.getElementById("select-all-sessions");
    if (selectAllSessionsBtn && !selectAllSessionsBtn.hasAttribute('data-select-all-listener-attached')) {
      selectAllSessionsBtn.addEventListener("click", () => {
        selectAllSessions(true);
      });
      selectAllSessionsBtn.setAttribute('data-select-all-listener-attached', 'true');
    }

    const selectNoneSessionsBtn = document.getElementById("select-none-sessions");
    if (selectNoneSessionsBtn && !selectNoneSessionsBtn.hasAttribute('data-select-none-listener-attached')) {
      selectNoneSessionsBtn.addEventListener("click", () => {
        selectAllSessions(false);
      });
      selectNoneSessionsBtn.setAttribute('data-select-none-listener-attached', 'true');
    }

    const deleteSelectedSessionsBtn = document.getElementById("delete-selected-sessions");
    if (deleteSelectedSessionsBtn && !deleteSelectedSessionsBtn.hasAttribute('data-delete-listener-attached')) {
      deleteSelectedSessionsBtn.addEventListener("click", deleteSelectedSessions);
      deleteSelectedSessionsBtn.setAttribute('data-delete-listener-attached', 'true');
    }

    const refreshSessionsListBtn = document.getElementById("refresh-sessions-list");
    if (refreshSessionsListBtn && !refreshSessionsListBtn.hasAttribute('data-refresh-list-listener-attached')) {
      refreshSessionsListBtn.addEventListener("click", async () => {
        const refreshBtn = document.getElementById("refresh-sessions-list");
        
        try {
          // Indicateur de rafraîchissement
          if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = "🔄 Actualisation...";
            refreshBtn.style.backgroundColor = "#6c757d";
          }
          
          await populateSessionsCleanupList();
          
          // Indicateur de succès
          if (refreshBtn) {
            refreshBtn.textContent = "✅ Actualisé !";
            refreshBtn.style.backgroundColor = "#28a745";
            setTimeout(() => {
              refreshBtn.textContent = "Actualiser liste";
              refreshBtn.style.backgroundColor = "#6c757d";
            }, 2000);
          }
          
        } catch (error) {
          console.error("❌ Erreur actualisation liste:", error);
          if (refreshBtn) {
            refreshBtn.textContent = "❌ Erreur";
            refreshBtn.style.backgroundColor = "#dc3545";
            setTimeout(() => {
              refreshBtn.textContent = "Actualiser liste";
              refreshBtn.style.backgroundColor = "#6c757d";
            }, 3000);
          }
        } finally {
          if (refreshBtn) {
            refreshBtn.disabled = false;
            if (refreshBtn.textContent.includes("🔄")) {
              refreshBtn.textContent = "Actualiser liste";
              refreshBtn.style.backgroundColor = "#6c757d";
            }
          }
        }
      });
      refreshSessionsListBtn.setAttribute('data-refresh-list-listener-attached', 'true');
    }

    // Event listeners pour les checkboxes de nettoyage (délégation d'événement)
    if (!document.hasAttribute('data-cleanup-listener-attached')) {
      document.addEventListener('change', (e) => {
        try {
          if (e.target.classList.contains('session-cleanup-checkbox')) {
            updateCleanupSelection();
          }
        } catch (error) {
          console.error("❌ Erreur checkbox cleanup:", error);
          if (typeof handleError === 'function') {
            handleError(error, "Checkbox cleanup");
          }
        }
      });
      document.setAttribute('data-cleanup-listener-attached', 'true');
    }

    // === TEST FIREBASE ===
    const testFirebaseBtn = document.getElementById("test-firebase");
    if (testFirebaseBtn && !testFirebaseBtn.hasAttribute('data-test-listener-attached')) {
      testFirebaseBtn.addEventListener("click", testFirebaseConnection);
      testFirebaseBtn.setAttribute('data-test-listener-attached', 'true');
    }
    
    console.log("✅ Event listeners DP et Sessions configurés avec succès");
    
  } catch (error) {
    console.error("❌ Erreur configuration event listeners DP/Sessions:", error);
    if (typeof handleError === 'function') {
      handleError(error, "Configuration event listeners DP/Sessions");
    }
  }
}

// ===== FONCTION DE DIAGNOSTIC DES PALANQUÉES =====
function diagnosticPalanquees() {
  console.log('🔍 === DIAGNOSTIC PALANQUÉES SESSIONS (SÉLECTEURS UNIFIÉS) ===');
  
  const palanqueeElements = document.querySelectorAll(DP_SELECTORS.palanquee.container);
  console.log(`📋 ${palanqueeElements.length} palanquées trouvées avec sélecteurs unifiés`);
  
  palanqueeElements.forEach((element, index) => {
    console.log(`\n--- Session Palanquée ${index} ---`);
    console.log('Élément:', element);
    console.log('data-index:', element.dataset?.index);
    
    const fields = [
      {selector: DP_SELECTORS.palanquee.horaire, name: 'Horaire'},
      {selector: DP_SELECTORS.palanquee.profPrevue, name: 'Prof. prévue'},
      {selector: DP_SELECTORS.palanquee.dureePrevue, name: 'Durée prévue'},
      {selector: DP_SELECTORS.palanquee.profRealisee, name: 'Prof. réalisée'},
      {selector: DP_SELECTORS.palanquee.dureeRealisee, name: 'Durée réalisée'},
      {selector: DP_SELECTORS.palanquee.paliers, name: 'Paliers'}
    ];
    
    fields.forEach(field => {
      const fieldElement = element.querySelector(field.selector);
      if (fieldElement) {
        console.log(`  ✅ ${field.name}: "${fieldElement.value}" (${field.selector})`);
      } else {
        console.log(`  ❌ ${field.name}: NON TROUVÉ (${field.selector})`);
      }
    });
  });
  
  console.log('=== FIN DIAGNOSTIC SESSIONS UNIFIÉES ===');
}

// ===== INITIALISATION =====
function initializeDPSessionsManager() {
  console.log("🎯 Initialisation du gestionnaire DP et Sessions...");
  
  try {
    // Configurer les event listeners
    setupDPSessionsEventListeners();
    
    console.log("✅ Gestionnaire DP et Sessions initialisé");
    
  } catch (error) {
    console.error("❌ Erreur initialisation gestionnaire DP/Sessions:", error);
  }
}

// ===== EXPORTS GLOBAUX =====
window.validateAndSaveDP = validateAndSaveDP;
window.validateDPFields = validateDPFields;
window.chargerHistoriqueDP = chargerHistoriqueDP;
window.afficherInfoDP = afficherInfoDP;
window.chargerDonneesDPSelectionne = chargerDonneesDPSelectionne;
window.supprimerDPSelectionne = supprimerDPSelectionne;
window.populateSessionSelector = populateSessionSelector;
window.loadSessionFromSelector = loadSessionFromSelector;
window.saveCurrentSession = saveCurrentSession;
window.populateSessionsCleanupList = populateSessionsCleanupList;
window.selectAllSessions = selectAllSessions;
window.updateCleanupSelection = updateCleanupSelection;
window.deleteSelectedSessions = deleteSelectedSessions;
window.refreshAllLists = refreshAllLists;
window.refreshAllListsWithIndicator = refreshAllListsWithIndicator;
window.testFirebaseConnection = testFirebaseConnection;
window.initializeAfterAuth = initializeAfterAuth;
window.initializeDPSessionsManager = initializeDPSessionsManager;
window.updateCurrentSessionDisplay = updateCurrentSessionDisplay;
window.clearCurrentSessionDisplay = clearCurrentSessionDisplay;
window.updateCurrentSessionAfterSave = updateCurrentSessionAfterSave;
window.clearDPValidationMessage = clearDPValidationMessage;
window.waitAndRestoreSession = waitAndRestoreSession; // NOUVELLE EXPORT CORRIGÉE
window.diagnosticPalanquees = diagnosticPalanquees;

// Export des utilitaires pour cohérence
window.waitForDPElement = waitForDPElement;
window.verifyDPElements = verifyDPElements;

// Auto-initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDPSessionsManager);
} else {
  initializeDPSessionsManager();
}

console.log("🎯 Module DP et Sessions Manager chargé - Version 2.5.1 corrigée - Sélecteurs unifiés avec offline-manager");