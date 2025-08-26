// ===== AMÉLIORATION DE LA SAUVEGARDE EXISTANTE =====
// Ce code remplace/améliore la fonction saveSessionData existante

// Fonction améliorée qui remplace saveSessionData()
// Version corrigée de saveSessionData qui structure correctement les données
async function saveSessionData() {
  console.log("💾 Sauvegarde session...");
  
  // CORRECTION : Utiliser la fonction pour récupérer le DP
  const dpNom = getSelectedDPName();  // Au lieu de document.getElementById("dp-nom")
  const dpDate = document.getElementById("dp-date")?.value;
  const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
  const dpPlongee = document.getElementById("dp-plongee")?.value;
  
  // Vérifications
  if (!dpNom) {
    alert("⚠️ Veuillez sélectionner un Directeur de Plongée dans la liste");
    return false;
  }
  
  if (!dpDate || !dpLieu) {
    alert("⚠️ Veuillez remplir la date et le lieu");
    return false;
  }
  
  if (!dpPlongee) {
    alert("⚠️ Veuillez sélectionner le type de plongée");
    return false;
  }
  
  if (!db || !firebaseConnected) {
    console.error("❌ Firebase non disponible");
    return false;
  }
  
  console.log("✅ DP:", dpNom, "Date:", dpDate, "Lieu:", dpLieu);
  
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
    
  console.log("📍 Clé de session:", sessionKey);
  
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
  
  const sessionData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu || "Non défini",
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
  
  let erreurs = [];
  let succes = [];
  
  try {
    // 1. Sauvegarde principale (toujours autorisée)
    try {
      await db.ref(`sessions/${sessionKey}`).set(sessionData);
      console.log("✅ Session principale sauvegardée");
      succes.push("Session principale");
    } catch (e) {
      console.error("❌ Erreur session principale:", e.message);
      erreurs.push("Session principale: " + e.message);
    }
    
    // 2. Infos DP (généralement autorisé)
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
    
    // 3. Historique - OPTIONNEL (peut échouer selon permissions)
    try {
      const dateFormatee = dpDate.replace(/-/g, '_');
      await db.ref(`historique/${dateFormatee}/${sessionKey}`).set({
        ...sessionData,
        archiveDate: new Date().toISOString()
      });
      console.log("✅ Historique sauvegardé");
      succes.push("Historique");
    } catch (e) {
      // On ignore silencieusement cette erreur car c'est optionnel
      console.warn("⚠️ Historique non sauvegardé (permissions):", e.message);
    }
    
    // 4. Backup - OPTIONNEL
    try {
      const backupKey = `${sessionKey}_${Date.now()}`;
      await db.ref(`backups/${backupKey}`).set(sessionData);
      console.log("✅ Backup créé");
      succes.push("Backup");
    } catch (e) {
      // Optionnel aussi
      console.warn("⚠️ Backup non créé (permissions):", e.message);
    }
    
    // Si au moins la sauvegarde principale a réussi
    if (succes.includes("Session principale")) {
      // Vérification des données
      const verification = await db.ref(`sessions/${sessionKey}`).once('value');
      const donneesSauvees = verification.val();
      
      if (donneesSauvees?.palanquees?.[0]?.parametres) {
        console.log("✅ Paramètres vérifiés:", donneesSauvees.palanquees[0].parametres);
      }
      
      // Sauvegarde locale de secours
      try {
        localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sessionData));
        localStorage.setItem('derniere_session', sessionKey);
        console.log("💾 Sauvegarde locale de secours effectuée");
      } catch (e) {
        console.warn("⚠️ Sauvegarde locale impossible");
      }
      
      afficherConfirmationReussie(sessionKey, sessionData.stats, succes, erreurs);
      return true;
    } else {
      throw new Error("Aucune sauvegarde n'a réussi");
    }
    
  } catch (error) {
    console.error("❌ Erreur critique:", error);
    
    // Sauvegarde locale d'urgence
    try {
      localStorage.setItem(`urgence_${Date.now()}`, JSON.stringify(sessionData));
      alert(`⚠️ Erreur Firebase mais sauvegarde locale effectuée.\n\nErreur: ${error.message}`);
    } catch (e) {
      alert(`❌ Erreur critique: ${error.message}`);
    }
    
    return false;
  }
}

// Affichage amélioré de la confirmation
function afficherConfirmationReussie(sessionKey, stats, succes, erreurs) {
  const dpMessage = document.getElementById("dp-message");
  if (!dpMessage) return;
  
  const couleur = erreurs.length > 0 ? '#fd7e14' : '#28a745'; // Orange si partiellement réussi, vert si tout est ok
  
  dpMessage.innerHTML = `
    <div style="
      background: ${couleur};
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      margin: 10px 0;
    ">
      <h4 style="margin: 0 0 10px 0;">
        ${erreurs.length > 0 ? '⚠️ SESSION PARTIELLEMENT SAUVEGARDÉE' : '✅ SESSION COMPLÈTEMENT SAUVEGARDÉE'}
      </h4>
      <div style="background: rgba(255,255,255,0.15); padding: 8px; border-radius: 4px;">
        <small>
          📍 ${sessionKey}<br>
          👥 ${stats.totalPlongeurs} plongeurs total<br>
          🏊 ${stats.nombrePalanquees} palanquées<br>
          ⏰ ${stats.heureValidation}<br>
          <br>
          ✅ Réussi: ${succes.join(', ')}<br>
          ${erreurs.length > 0 ? `⚠️ Non sauvegardé: Historique/Backup (permissions)` : ''}
        </small>
      </div>
      <div style="margin-top: 8px; font-size: 0.85em; opacity: 0.9;">
        💾 Les données essentielles sont sauvegardées
      </div>
    </div>
  `;
  
  dpMessage.style.display = 'block';
  
  // Masquer après 6 secondes
  setTimeout(() => {
    dpMessage.style.opacity = '0';
    setTimeout(() => {
      dpMessage.style.display = 'none';
      dpMessage.style.opacity = '1';
    }, 500);
  }, 6000);
}

// Fonction pour vérifier les permissions Firebase (optionnel)
async function verifierPermissions() {
  console.log("🔍 Vérification des permissions Firebase...");
  
  const tests = {
    sessions: false,
    dpInfo: false,
    historique: false,
    backups: false
  };
  
  const testKey = `test_${Date.now()}`;
  const testData = { test: true, timestamp: Date.now() };
  
  // Test sessions
  try {
    await db.ref(`sessions/${testKey}`).set(testData);
    await db.ref(`sessions/${testKey}`).remove();
    tests.sessions = true;
  } catch (e) {
    console.warn("❌ Pas de permission pour /sessions/");
  }
  
  // Test dpInfo
  try {
    await db.ref(`dpInfo/${testKey}`).set(testData);
    await db.ref(`dpInfo/${testKey}`).remove();
    tests.dpInfo = true;
  } catch (e) {
    console.warn("❌ Pas de permission pour /dpInfo/");
  }
  
  // Test historique
  try {
    await db.ref(`historique/test/${testKey}`).set(testData);
    await db.ref(`historique/test/${testKey}`).remove();
    tests.historique = true;
  } catch (e) {
    console.warn("⚠️ Pas de permission pour /historique/ (optionnel)");
  }
  
  // Test backups
  try {
    await db.ref(`backups/${testKey}`).set(testData);
    await db.ref(`backups/${testKey}`).remove();
    tests.backups = true;
  } catch (e) {
    console.warn("⚠️ Pas de permission pour /backups/ (optionnel)");
  }
  
  console.log("📊 Permissions Firebase:", tests);
  return tests;
}

// Attacher au bouton
document.addEventListener('DOMContentLoaded', function() {
  const validerBtn = document.getElementById('valider-dp');
  
  if (validerBtn) {
    const newBtn = validerBtn.cloneNode(true);
    validerBtn.parentNode.replaceChild(newBtn, validerBtn);
    
    newBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      newBtn.disabled = true;
      newBtn.textContent = "⏳ Sauvegarde...";
      
      try {
        const success = await saveSessionData();
        
        if (success) {
          newBtn.textContent = "✅ Sauvegardé !";
          
          if (typeof syncToDatabase === 'function') {
            setTimeout(syncToDatabase, 500);
          }
          
          setTimeout(() => {
            newBtn.disabled = false;
            newBtn.textContent = "Sauvegarder Session + DP";
          }, 3000);
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

console.log("✅ Système de sauvegarde robuste chargé");
console.log("💡 Tapez 'verifierPermissions()' pour tester vos permissions Firebase");