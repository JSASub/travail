// ===== dp-save-improved.js - VERSION CORRIGÉE =====
// Correction complète pour utiliser le dropdown DP au lieu d'un champ inexistant

// FONCTION POUR RÉCUPÉRER LE NOM DU DP SÉLECTIONNÉ
function getSelectedDPName() {
  const dpSelect = document.getElementById('dp-select');
  
  if (!dpSelect || !dpSelect.value) {
    console.warn("⚠️ Aucun DP sélectionné");
    return "";
  }
  
  // Récupérer le DP depuis la liste
  if (typeof DP_LIST !== 'undefined') {
    const selectedDP = DP_LIST.find(dp => dp.id === dpSelect.value);
    if (selectedDP) {
      console.log("✅ DP sélectionné:", selectedDP.nom);
      return selectedDP.nom;
    }
  }
  
  // Fallback : extraire le nom depuis le texte de l'option
  const selectedOption = dpSelect.options[dpSelect.selectedIndex];
  if (selectedOption && selectedOption.text !== "-- Choisir un DP --") {
    const nom = selectedOption.text.split(' (')[0];
    console.log("✅ DP extrait:", nom);
    return nom;
  }
  
  return "";
}

// FONCTION DE SAUVEGARDE CORRIGÉE
async function saveSessionData() {
  console.log("💾 Début sauvegarde session...");
  
  // IMPORTANT : Utiliser getSelectedDPName() au lieu de chercher dp-nom
  const dpNom = getSelectedDPName();
  const dpDate = document.getElementById("dp-date")?.value;
  const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
  const dpPlongee = document.getElementById("dp-plongee")?.value;
  
  console.log("📋 Données récupérées:", {
    dpNom: dpNom,
    dpDate: dpDate,
    dpLieu: dpLieu,
    dpPlongee: dpPlongee
  });
  
  // Vérifications strictes
  if (!dpNom) {
    alert("⚠️ Veuillez sélectionner un Directeur de Plongée dans la liste déroulante");
    console.error("Pas de DP sélectionné");
    return false;
  }
  
  if (!dpDate) {
    alert("⚠️ Veuillez renseigner la date");
    console.error("Date manquante");
    return false;
  }
  
  if (!dpLieu) {
    alert("⚠️ Veuillez renseigner le lieu");
    console.error("Lieu manquant");
    return false;
  }
  
  if (!dpPlongee) {
    alert("⚠️ Veuillez sélectionner le type de plongée");
    console.error("Type de plongée manquant");
    return false;
  }
  
  if (!db || !firebaseConnected) {
    console.error("❌ Firebase non disponible");
    alert("⚠️ Firebase non connecté - Impossible de sauvegarder");
    return false;
  }
  
  // Créer la clé de session
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
  
  console.log("🔑 Clé de session générée:", sessionKey);
  
  // Préparer les palanquées avec leurs paramètres
  const palanqueesData = [];
  
  if (palanquees && Array.isArray(palanquees)) {
    palanquees.forEach((pal, index) => {
      const palanqueeObj = {
        index: index,
        plongeurs: [],
        parametres: {
          horaire: pal.horaire || "",
          profondeurPrevue: pal.profondeurPrevue || "",
          dureePrevue: pal.dureePrevue || "",
          profondeurRealisee: pal.profondeurRealisee || "",
          dureeRealisee: pal.dureeRealisee || "",
          paliers: pal.paliers || ""
        }
      };
      
      // Copier les plongeurs
      for (let i = 0; i < pal.length; i++) {
        if (pal[i] && pal[i].nom) {
          palanqueeObj.plongeurs.push({
            nom: pal[i].nom,
            niveau: pal[i].niveau || "",
            pre: pal[i].pre || ""
          });
        }
      }
      
      palanqueesData.push(palanqueeObj);
    });
  }
  
  // Créer l'objet de session complet
  const sessionData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now(),
      sessionKey: sessionKey,
      version: "3.0"
    },
    plongeurs: plongeurs || [],
    palanquees: palanqueesData,
    stats: {
      totalPlongeurs: (plongeurs?.length || 0) + 
                     palanqueesData.reduce((total, pal) => total + pal.plongeurs.length, 0),
      nombrePalanquees: palanqueesData.length,
      plongeursNonAssignes: plongeurs?.length || 0,
      heureValidation: new Date().toLocaleTimeString('fr-FR')
    }
  };
  
  console.log("📊 Session à sauvegarder:", {
    sessionKey: sessionKey,
    dp: dpNom,
    totalPlongeurs: sessionData.stats.totalPlongeurs,
    nombrePalanquees: sessionData.stats.nombrePalanquees
  });
  
  let erreurs = [];
  let succes = [];
  
  try {
    // 1. Sauvegarde principale
    try {
      await db.ref(`sessions/${sessionKey}`).set(sessionData);
      console.log("✅ Session principale sauvegardée");
      succes.push("Session");
    } catch (e) {
      console.error("❌ Erreur session:", e.message);
      erreurs.push("Session: " + e.message);
    }
    
    // 2. Infos DP
    try {
      const dpInfo = {
        nom: dpNom,
        date: dpDate,
        lieu: dpLieu,
        plongee: dpPlongee,
        timestamp: Date.now(),
        validated: true,
        stats: sessionData.stats
      };
      
      await db.ref(`dpInfo/${sessionKey}`).set(dpInfo);
      console.log("✅ Infos DP sauvegardées");
      succes.push("Infos DP");
    } catch (e) {
      console.error("❌ Erreur infos DP:", e.message);
      erreurs.push("Infos DP: " + e.message);
    }
    
    // 3. Historique (optionnel)
    try {
      const dateFormatee = dpDate.replace(/-/g, '_');
      await db.ref(`historique/${dateFormatee}/${sessionKey}`).set({
        ...sessionData,
        archiveDate: new Date().toISOString()
      });
      console.log("✅ Historique sauvegardé");
      succes.push("Historique");
    } catch (e) {
      console.warn("⚠️ Historique non sauvegardé (permissions)");
    }
    
    // Si au moins une sauvegarde a réussi
    if (succes.length > 0) {
      // Sauvegarde locale de secours
      try {
        localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sessionData));
        localStorage.setItem('derniere_session', sessionKey);
        console.log("💾 Sauvegarde locale de secours effectuée");
      } catch (e) {
        console.warn("⚠️ Sauvegarde locale impossible");
      }
      
      afficherConfirmationSauvegarde(sessionKey, sessionData.stats, succes);
      return true;
    } else {
      throw new Error("Aucune sauvegarde n'a réussi");
    }
    
  } catch (error) {
    console.error("❌ Erreur critique:", error);
    alert(`❌ Erreur lors de la sauvegarde:\n${error.message}`);
    return false;
  }
}

// FONCTION D'AFFICHAGE DE LA CONFIRMATION
function afficherConfirmationSauvegarde(sessionKey, stats, succes) {
  const dpMessage = document.getElementById("dp-message");
  if (!dpMessage) return;
  
  dpMessage.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      margin: 10px 0;
      animation: slideIn 0.3s ease-out;
    ">
      <h4 style="margin: 0 0 10px 0;">✅ SESSION SAUVEGARDÉE AVEC SUCCÈS</h4>
      <div style="background: rgba(255,255,255,0.15); padding: 8px; border-radius: 4px;">
        <small>
          📍 Session: ${sessionKey}<br>
          👥 ${stats.totalPlongeurs} plongeurs total<br>
          🏊 ${stats.nombrePalanquees} palanquées<br>
          ⏰ ${stats.heureValidation}<br>
          ✅ Sauvegardé: ${succes.join(', ')}
        </small>
      </div>
    </div>
  `;
  
  dpMessage.style.display = 'block';
  
  setTimeout(() => {
    dpMessage.style.opacity = '0';
    setTimeout(() => {
      dpMessage.style.display = 'none';
      dpMessage.style.opacity = '1';
    }, 500);
  }, 6000);
}

// FONCTION DE SAUVEGARDE LOCALE DE SECOURS
function sauvegardeLocaleSecours(data, key) {
  try {
    const sauvegardeData = data || {
      timestamp: Date.now(),
      dp: getSelectedDPName() || "Inconnu",
      date: document.getElementById("dp-date")?.value || new Date().toISOString(),
      lieu: document.getElementById("dp-lieu")?.value || "Non défini",
      plongee: document.getElementById("dp-plongee")?.value || "matin",
      plongeurs: plongeurs || [],
      palanquees: palanquees || []
    };
    
    const sessionKey = key || `urgence_${Date.now()}`;
    localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sauvegardeData));
    
    console.log("💾 Sauvegarde locale effectuée");
    return true;
    
  } catch (error) {
    console.error("❌ Erreur sauvegarde locale:", error);
    return false;
  }
}

// ATTACHER AU BOUTON DE VALIDATION
document.addEventListener('DOMContentLoaded', function() {
  const validerBtn = document.getElementById('valider-dp');
  
  if (validerBtn) {
    // Supprimer les anciens listeners
    const newBtn = validerBtn.cloneNode(true);
    validerBtn.parentNode.replaceChild(newBtn, validerBtn);
    
    // Ajouter le nouveau listener
    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      console.log("🎯 Clic sur Valider DP");
      
      // Vérifier d'abord qu'un DP est sélectionné
      const dpNom = getSelectedDPName();
      if (!dpNom) {
        alert("⚠️ Veuillez d'abord sélectionner un Directeur de Plongée dans la liste");
        return;
      }
      
      // Désactiver le bouton pendant la sauvegarde
      newBtn.disabled = true;
      newBtn.textContent = "⏳ Sauvegarde en cours...";
      newBtn.style.backgroundColor = '#6c757d';
      
      try {
        const success = await saveSessionData();
        
        if (success) {
          newBtn.textContent = "✅ Sauvegardé !";
          newBtn.style.backgroundColor = '#28a745';
          
          // Synchronisation additionnelle si disponible
          if (typeof syncToDatabase === 'function') {
            setTimeout(syncToDatabase, 500);
          }
          
          setTimeout(() => {
            newBtn.disabled = false;
            newBtn.textContent = "Sauvegarder Session + DP";
            newBtn.style.backgroundColor = '';
          }, 3000);
        } else {
          throw new Error("Échec de la sauvegarde");
        }
        
      } catch (error) {
        console.error("❌ Erreur:", error);
        newBtn.textContent = "❌ Erreur";
        newBtn.style.backgroundColor = '#dc3545';
        
        setTimeout(() => {
          newBtn.disabled = false;
          newBtn.textContent = "Sauvegarder Session + DP";
          newBtn.style.backgroundColor = '';
        }, 2000);
      }
    });
  }
});

// FONCTION DE TEST
function testDPSelection() {
  const dpNom = getSelectedDPName();
  console.log("Test - DP sélectionné:", dpNom);
  
  if (!dpNom) {
    console.warn("⚠️ Aucun DP sélectionné - Sélectionnez-en un dans la liste");
  } else {
    console.log("✅ DP prêt pour sauvegarde:", dpNom);
  }
  
  // Vérifier tous les champs
  console.log("📋 État des champs:");
  console.log("- DP:", dpNom || "❌ MANQUANT");
  console.log("- Date:", document.getElementById("dp-date")?.value || "❌ MANQUANT");
  console.log("- Lieu:", document.getElementById("dp-lieu")?.value || "❌ MANQUANT");
  console.log("- Plongée:", document.getElementById("dp-plongee")?.value || "❌ MANQUANT");
  
  return dpNom;
}

// STYLES CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

console.log("✅ Système de sauvegarde DP corrigé et chargé");
console.log("💡 Testez avec: testDPSelection()");
console.log("📝 Pour sauvegarder: await saveSessionData()");