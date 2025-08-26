// ===== AMÉLIORATION DE LA SAUVEGARDE EXISTANTE =====
// Ce code remplace/améliore la fonction saveSessionData existante

// Fonction améliorée qui remplace saveSessionData()
// Version corrigée de saveSessionData qui structure correctement les données
async function saveSessionData() {
  console.log("💾 Sauvegarde session...");
  
  const dpNom = document.getElementById("dp-nom")?.value?.trim();
  const dpDate = document.getElementById("dp-date")?.value;
  const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
  const dpPlongee = document.getElementById("dp-plongee")?.value;
  
  // Vérifications de base
  if (!dpNom || !dpDate || !dpPlongee) {
    console.warn("⚠️ Informations DP incomplètes");
    return false;
  }
  
  if (!db) {
    console.error("❌ Firebase non disponible");
    return false;
  }
  
  // Créer la clé de session
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
  
  console.log("📍 Clé de session:", sessionKey);
  
  // Préparer les palanquées avec leurs paramètres
  // IMPORTANT: On crée une copie pour ne pas modifier l'original
  const palanqueesData = [];
  
  if (palanquees && Array.isArray(palanquees)) {
    palanquees.forEach((pal, index) => {
      // Créer un objet pour stocker la palanquée
      const palanqueeObj = {
        index: index,
        plongeurs: [],
        // Capturer les paramètres s'ils existent
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
      lieu: dpLieu || "Non défini",
      plongee: dpPlongee,
      timestamp: Date.now(),
      sessionKey: sessionKey
    },
    plongeurs: plongeurs || [],
    palanquees: palanqueesData,
    stats: {
      totalPlongeurs: (plongeurs?.length || 0) + 
                     palanqueesData.reduce((total, pal) => total + pal.plongeurs.length, 0),
      nombrePalanquees: palanqueesData.length,
      plongeursNonAssignes: plongeurs?.length || 0
    }
  };
  
  console.log("📊 Données à sauvegarder:", {
    sessionKey: sessionKey,
    nbPlongeurs: sessionData.stats.totalPlongeurs,
    nbPalanquees: sessionData.stats.nombrePalanquees
  });
  
  try {
    // Sauvegarde principale
    await db.ref(`sessions/${sessionKey}`).set(sessionData);
    console.log("✅ Session sauvegardée");
    
    // Sauvegarde des infos DP
    const dpInfo = {
      nom: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now(),
      validated: true
    };
    
    await db.ref(`dpInfo/${sessionKey}`).set(dpInfo);
    console.log("✅ Infos DP sauvegardées");
    
    // Afficher la confirmation
    const dpMessage = document.getElementById("dp-message");
    if (dpMessage) {
      dpMessage.innerHTML = `
        <div style="
          background: #28a745;
          color: white;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        ">
          ✅ Session sauvegardée : ${sessionKey}<br>
          <small>${sessionData.stats.totalPlongeurs} plongeurs, ${sessionData.stats.nombrePalanquees} palanquées</small>
        </div>
      `;
      dpMessage.style.display = 'block';
      
      setTimeout(() => {
        dpMessage.style.display = 'none';
      }, 5000);
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur de sauvegarde:", error);
    alert(`Erreur lors de la sauvegarde:\n${error.message}`);
    return false;
  }
}

// Fonction pour charger une session (compatible avec la nouvelle structure)
async function loadSession(sessionKey) {
  console.log("📥 Chargement session:", sessionKey);
  
  try {
    if (!db) {
      alert("Firebase non disponible");
      return false;
    }
    
    const snapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!snapshot.exists()) {
      alert("Session non trouvée");
      return false;
    }
    
    const sessionData = snapshot.val();
    console.log("📊 Données chargées:", sessionData);
    
    // Restaurer les plongeurs
    plongeurs = sessionData.plongeurs || [];
    
    // Restaurer les palanquées avec leurs paramètres
    palanquees = [];
    
    if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
      sessionData.palanquees.forEach((palData) => {
        const palanqueeArray = [];
        
        // Restaurer les plongeurs
        if (palData.plongeurs && Array.isArray(palData.plongeurs)) {
          palData.plongeurs.forEach(p => {
            palanqueeArray.push(p);
          });
        }
        
        // Restaurer les paramètres sur l'array
        if (palData.parametres) {
          palanqueeArray.horaire = palData.parametres.horaire || "";
          palanqueeArray.profondeurPrevue = palData.parametres.profondeurPrevue || "";
          palanqueeArray.dureePrevue = palData.parametres.dureePrevue || "";
          palanqueeArray.profondeurRealisee = palData.parametres.profondeurRealisee || "";
          palanqueeArray.dureeRealisee = palData.parametres.dureeRealisee || "";
          palanqueeArray.paliers = palData.parametres.paliers || "";
        }
        
        palanquees.push(palanqueeArray);
      });
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Restaurer les infos DP
    if (sessionData.meta) {
      const dpNom = document.getElementById("dp-nom");
      const dpDate = document.getElementById("dp-date");
      const dpLieu = document.getElementById("dp-lieu");
      const dpPlongee = document.getElementById("dp-plongee");
      
      if (dpNom) dpNom.value = sessionData.meta.dp || "";
      if (dpDate) dpDate.value = sessionData.meta.date || "";
      if (dpLieu) dpLieu.value = sessionData.meta.lieu || "";
      if (dpPlongee) dpPlongee.value = sessionData.meta.plongee || "matin";
    }
    
    // Rafraîchir l'affichage
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    console.log("✅ Session chargée avec succès");
    
    // Vérifier les paramètres
    palanquees.forEach((pal, i) => {
      if (pal.horaire || pal.profondeurPrevue) {
        console.log(`Palanquée ${i+1}: Horaire=${pal.horaire}, Prof=${pal.profondeurPrevue}m`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur de chargement:", error);
    alert(`Erreur lors du chargement:\n${error.message}`);
    return false;
  }
}

// Attacher au bouton existant
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
      
      // Désactiver le bouton
      newBtn.disabled = true;
      newBtn.textContent = "Sauvegarde...";
      
      try {
        const success = await saveSessionData();
        
        if (success) {
          newBtn.textContent = "✅ Sauvegardé !";
          
          // Synchroniser si la fonction existe
          if (typeof syncToDatabase === 'function') {
            setTimeout(syncToDatabase, 500);
          }
          
          setTimeout(() => {
            newBtn.disabled = false;
            newBtn.textContent = "Sauvegarder Session + DP";
          }, 2000);
        } else {
          throw new Error("Échec de la sauvegarde");
        }
        
      } catch (error) {
        console.error("Erreur:", error);
        newBtn.textContent = "❌ Erreur";
        
        setTimeout(() => {
          newBtn.disabled = false;
          newBtn.textContent = "Sauvegarder Session + DP";
        }, 2000);
      }
    });
  }
});

console.log("✅ Système de sauvegarde simplifié chargé");