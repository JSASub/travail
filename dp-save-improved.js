// ===== AMÉLIORATION DE LA SAUVEGARDE EXISTANTE =====
// Ce code remplace/améliore la fonction saveSessionData existante

// Fonction améliorée qui remplace saveSessionData()
// Version corrigée de saveSessionData qui structure correctement les données
async function saveSessionData() {
  console.log("🚀 === SAUVEGARDE AVEC PARAMÈTRES CORRECTS ===");
  
  const $ = (id) => document.getElementById(id);
  
  const dpNom = $("dp-nom")?.value?.trim();
  const dpDate = $("dp-date")?.value;
  const dpLieu = $("dp-lieu")?.value?.trim();
  const dpPlongee = $("dp-plongee")?.value;
  
  if (!dpNom || !dpDate || !dpPlongee) {
    console.warn("⚠️ Données incomplètes");
    return false;
  }
  
  if (!db || !firebaseConnected) {
    console.error("❌ Firebase non disponible");
    sauvegardeLocaleSecours();
    return false;
  }
  
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
  
  // === STRUCTURE CORRIGÉE DES PALANQUÉES ===
  // Chaque palanquée devient un objet avec ses plongeurs et ses paramètres
  const palanqueesStructurees = (palanquees || []).map((palanquee, index) => {
    // Extraire les paramètres stockés sur l'array
    const parametres = {
      horaire: palanquee.horaire || '',
      profondeurPrevue: palanquee.profondeurPrevue || '',
      dureePrevue: palanquee.dureePrevue || '',
      profondeurRealisee: palanquee.profondeurRealisee || '',
      dureeRealisee: palanquee.dureeRealisee || '',
      paliers: palanquee.paliers || ''
    };
    
    // Extraire les plongeurs (éléments du tableau)
    const plongeursList = [];
    for (let i = 0; i < palanquee.length; i++) {
      if (palanquee[i] && palanquee[i].nom) {
        plongeursList.push({
          nom: palanquee[i].nom,
          niveau: palanquee[i].niveau || '',
          pre: palanquee[i].pre || ''
        });
      }
    }
    
    // Retourner une structure objet propre
    return {
      numero: index + 1,
      plongeurs: plongeursList,
      parametres: parametres,
      stats: {
        nombrePlongeurs: plongeursList.length,
        hasGP: plongeursList.some(p => ["N4", "E2", "E3", "E4", "GP"].includes(p.niveau)),
        hasN1: plongeursList.some(p => p.niveau === "N1"),
        hasAutonomes: plongeursList.some(p => ["N2", "N3"].includes(p.niveau))
      }
    };
  });
  
  console.log("📊 Palanquées structurées:", palanqueesStructurees);
  
  // Compiler toutes les données
  const sessionData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu || "Non défini",
      plongee: dpPlongee,
      timestamp: Date.now(),
      sessionKey: sessionKey,
      version: "3.0" // Nouvelle version avec structure corrigée
    },
    
    // Plongeurs non assignés
    plongeurs: plongeurs || [],
    
    // Palanquées avec structure corrigée
    palanquees: palanqueesStructurees,
    
    // Statistiques globales
    stats: {
      totalPlongeurs: (plongeurs?.length || 0) + 
                     palanqueesStructurees.reduce((total, pal) => 
                       total + (pal.plongeurs?.length || 0), 0),
      nombrePalanquees: palanqueesStructurees.length,
      plongeursNonAssignes: plongeurs?.length || 0,
      heureValidation: new Date().toLocaleTimeString('fr-FR')
    }
  };
  
  try {
    // Sauvegardes multiples
    const sauvegardes = [];
    
    // 1. Sauvegarde principale
    sauvegardes.push(
      db.ref(`sessions/${sessionKey}`).set(sessionData)
        .then(() => console.log("✅ Session sauvegardée avec paramètres"))
    );
    
    // 2. Infos DP
    const dpInfo = {
      nom: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      timestamp: Date.now(),
      validated: true,
      stats: sessionData.stats
    };
    
    sauvegardes.push(
      db.ref(`dpInfo/${sessionKey}`).set(dpInfo)
        .then(() => console.log("✅ Infos DP sauvegardées"))
    );
    
    // 3. Historique
    const dateFormatee = dpDate.replace(/-/g, '_');
    sauvegardes.push(
      db.ref(`historique/${dateFormatee}/${sessionKey}`).set(sessionData)
        .then(() => console.log("✅ Historique sauvegardé"))
    );
    
    await Promise.allSettled(sauvegardes);
    
    // Vérification
    const verification = await db.ref(`sessions/${sessionKey}`).once('value');
    const donneesSauvees = verification.val();
    
    // Vérifier que les paramètres sont bien sauvés
    if (donneesSauvees?.palanquees?.[0]?.parametres) {
      console.log("✅ Paramètres vérifiés:", donneesSauvees.palanquees[0].parametres);
    }
    
    afficherConfirmation(sessionKey, sessionData.stats);
    return true;
    
  } catch (error) {
    console.error("❌ Erreur:", error);
    sauvegardeLocaleSecours(sessionData, sessionKey);
    return false;
  }
}

// === FONCTION POUR CHARGER UNE SESSION AVEC LA NOUVELLE STRUCTURE ===
async function loadSession(sessionKey) {
  try {
    if (!db) {
      alert("Base de données non disponible");
      return false;
    }
    
    const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!sessionSnapshot.exists()) {
      alert("Session non trouvée");
      return false;
    }
    
    const sessionData = sessionSnapshot.val();
    
    // Charger les plongeurs non assignés
    plongeurs = sessionData.plongeurs || [];
    
    // Reconstituer les palanquées avec leurs paramètres
    if (sessionData.palanquees && Array.isArray(sessionData.palanquees)) {
      palanquees = sessionData.palanquees.map((palData) => {
        let palanqueeArray;
        
        // Gérer l'ancienne structure (compatibilité)
        if (Array.isArray(palData)) {
          palanqueeArray = [...palData];
        }
        // Nouvelle structure avec objet
        else if (palData.plongeurs && Array.isArray(palData.plongeurs)) {
          palanqueeArray = [...palData.plongeurs];
          
          // Restaurer les paramètres sur l'array
          if (palData.parametres) {
            palanqueeArray.horaire = palData.parametres.horaire || '';
            palanqueeArray.profondeurPrevue = palData.parametres.profondeurPrevue || '';
            palanqueeArray.dureePrevue = palData.parametres.dureePrevue || '';
            palanqueeArray.profondeurRealisee = palData.parametres.profondeurRealisee || '';
            palanqueeArray.dureeRealisee = palData.parametres.dureeRealisee || '';
            palanqueeArray.paliers = palData.parametres.paliers || '';
          }
        }
        // Structure non reconnue
        else {
          palanqueeArray = [];
        }
        
        // S'assurer que les propriétés existent
        if (!palanqueeArray.hasOwnProperty('horaire')) palanqueeArray.horaire = '';
        if (!palanqueeArray.hasOwnProperty('profondeurPrevue')) palanqueeArray.profondeurPrevue = '';
        if (!palanqueeArray.hasOwnProperty('dureePrevue')) palanqueeArray.dureePrevue = '';
        if (!palanqueeArray.hasOwnProperty('profondeurRealisee')) palanqueeArray.profondeurRealisee = '';
        if (!palanqueeArray.hasOwnProperty('dureeRealisee')) palanqueeArray.dureeRealisee = '';
        if (!palanqueeArray.hasOwnProperty('paliers')) palanqueeArray.paliers = '';
        
        return palanqueeArray;
      });
    } else {
      palanquees = [];
    }
    
    plongeursOriginaux = [...plongeurs];
    
    // Restaurer les métadonnées
    const $ = (id) => document.getElementById(id);
    if (sessionData.meta) {
      if ($("dp-nom")) $("dp-nom").value = sessionData.meta.dp || "";
      if ($("dp-date")) $("dp-date").value = sessionData.meta.date || "";
      if ($("dp-lieu")) $("dp-lieu").value = sessionData.meta.lieu || "";
      if ($("dp-plongee")) $("dp-plongee").value = sessionData.meta.plongee || "matin";
    }
    
    // Rafraîchir l'affichage
    if (typeof renderPalanquees === 'function') renderPalanquees();
    if (typeof renderPlongeurs === 'function') renderPlongeurs();
    if (typeof updateAlertes === 'function') updateAlertes();
    
    console.log("✅ Session chargée avec paramètres:", sessionKey);
    
    // Afficher les paramètres récupérés pour vérification
    palanquees.forEach((pal, i) => {
      if (pal.horaire || pal.profondeurPrevue || pal.dureePrevue) {
        console.log(`📊 Palanquée ${i+1} - Horaire: ${pal.horaire}, Prof: ${pal.profondeurPrevue}m, Durée: ${pal.dureePrevue}min`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    alert("Erreur lors du chargement : " + error.message);
    return false;
  }
}

// === FONCTION DE SAUVEGARDE LOCALE ===
function sauvegardeLocaleSecours(data, key) {
  try {
    const sauvegardeData = data || {
      timestamp: Date.now(),
      dp: document.getElementById("dp-nom")?.value || "Inconnu",
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

// === AFFICHAGE DE LA CONFIRMATION ===
function afficherConfirmation(sessionKey, stats) {
  const dpMessage = document.getElementById("dp-message");
  if (!dpMessage) return;
  
  dpMessage.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
      margin: 10px 0;
    ">
      <h4 style="margin: 0 0 10px 0;">✅ SESSION COMPLÈTE SAUVEGARDÉE</h4>
      <div style="background: rgba(255,255,255,0.15); padding: 8px; border-radius: 4px;">
        <small>
          📍 ${sessionKey}<br>
          👥 ${stats.totalPlongeurs} plongeurs<br>
          🏊 ${stats.nombrePalanquees} palanquées avec paramètres<br>
          ⏰ ${stats.heureValidation}
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
  }, 8000);
}

console.log("✅ Système de sauvegarde des paramètres corrigé");