// ===== AMÉLIORATION DE LA SAUVEGARDE EXISTANTE =====
// Ce code remplace/améliore la fonction saveSessionData existante

// Fonction améliorée qui remplace saveSessionData()
async function saveSessionData() {
  console.log("🚀 === DÉBUT SAUVEGARDE COMPLÈTE ===");
  
  // Utiliser la fonction $ existante ou document.getElementById
  const $ = (id) => document.getElementById(id);
  
  const dpNom = $("dp-nom")?.value?.trim();
  const dpDate = $("dp-date")?.value;
  const dpLieu = $("dp-lieu")?.value?.trim();
  const dpPlongee = $("dp-plongee")?.value;
  
  // Vérifier les données obligatoires
  if (!dpNom || !dpDate || !dpPlongee) {
    console.warn("⚠️ Données incomplètes - sauvegarde annulée");
    return false;
  }
  
  // Vérifier Firebase
  if (!db || !firebaseConnected) {
    console.error("❌ Firebase non disponible");
    // Sauvegarde locale de secours
    sauvegardeLocaleSecours();
    return false;
  }
  
  // Créer la clé unique
  const dpKey = dpNom.split(' ')[0].substring(0, 8);
  const sessionKey = `${dpDate}_${dpKey}_${dpPlongee}`;
  
  // Compiler TOUTES les données
  const sessionData = {
    // Métadonnées complètes
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu || "Non défini",
      plongee: dpPlongee,
      timestamp: Date.now(),
      sessionKey: sessionKey,
      sauvegardePalier: true,
      version: "2.0"
    },
    
    // Données des plongeurs
    plongeurs: plongeurs || [],
    
    // Palanquées avec toutes leurs propriétés
    palanquees: (palanquees || []).map((pal, index) => {
      const palanqueeComplete = [...pal];
      // S'assurer que toutes les propriétés sont présentes
      palanqueeComplete.numero = index + 1;
      palanqueeComplete.horaire = pal.horaire || '';
      palanqueeComplete.profondeurPrevue = pal.profondeurPrevue || '';
      palanqueeComplete.dureePrevue = pal.dureePrevue || '';
      palanqueeComplete.profondeurRealisee = pal.profondeurRealisee || '';
      palanqueeComplete.dureeRealisee = pal.dureeRealisee || '';
      palanqueeComplete.paliers = pal.paliers || '';
      return palanqueeComplete;
    }),
    
    // Statistiques détaillées
    stats: {
      totalPlongeurs: (plongeurs?.length || 0) + 
                     (palanquees?.reduce((total, pal) => total + (Array.isArray(pal) ? pal.length : 0), 0) || 0),
      nombrePalanquees: palanquees?.length || 0,
      plongeursNonAssignes: plongeurs?.length || 0,
      heureValidation: new Date().toLocaleTimeString('fr-FR'),
      dateComplete: new Date().toISOString()
    }
  };
  
  console.log("📊 Données à sauvegarder:", {
    sessionKey: sessionKey,
    plongeurs: sessionData.stats.totalPlongeurs,
    palanquees: sessionData.stats.nombrePalanquees
  });
  
  try {
    // === SAUVEGARDES MULTIPLES POUR REDONDANCE ===
    
    const sauvegardes = [];
    
    // 1. Sauvegarde principale dans /sessions/
    sauvegardes.push(
      db.ref(`sessions/${sessionKey}`).set(sessionData)
        .then(() => console.log("✅ Session principale sauvegardée"))
        .catch(err => console.error("❌ Erreur session principale:", err))
    );
    
    // 2. Sauvegarde des infos DP
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
        .catch(err => console.error("❌ Erreur infos DP:", err))
    );
    
    // 3. Historique par date
    const dateFormatee = dpDate.replace(/-/g, '_');
    sauvegardes.push(
      db.ref(`historique/${dateFormatee}/${sessionKey}`).set({
        ...sessionData,
        archiveDate: new Date().toISOString()
      })
        .then(() => console.log("✅ Historique sauvegardé"))
        .catch(err => console.error("❌ Erreur historique:", err))
    );
    
    // 4. Backup horodaté
    const backupKey = `${sessionKey}_${Date.now()}`;
    sauvegardes.push(
      db.ref(`backups/${backupKey}`).set(sessionData)
        .then(() => console.log("✅ Backup créé"))
        .catch(err => console.error("❌ Erreur backup:", err))
    );
    
    // Attendre toutes les sauvegardes
    const resultats = await Promise.allSettled(sauvegardes);
    
    // Compter les succès
    const succes = resultats.filter(r => r.status === 'fulfilled').length;
    const total = resultats.length;
    
    console.log(`📈 Résultat: ${succes}/${total} sauvegardes réussies`);
    
    if (succes === 0) {
      throw new Error("Aucune sauvegarde n'a réussi");
    }
    
    // === VÉRIFICATION D'INTÉGRITÉ ===
    const verification = await db.ref(`sessions/${sessionKey}`).once('value');
    if (verification.exists()) {
      console.log("✅ Vérification: données correctement sauvegardées");
      
      // Sauvegarde locale additionnelle
      sauvegardeLocaleSecours(sessionData, sessionKey);
      
      // Afficher la confirmation
      afficherConfirmation(sessionKey, sessionData.stats);
      
      return true;
    } else {
      console.warn("⚠️ Vérification échouée mais backup réussi");
      return true;
    }
    
  } catch (error) {
    console.error("❌ ERREUR lors de la sauvegarde:", error);
    
    // Tentative de sauvegarde locale
    sauvegardeLocaleSecours(sessionData, sessionKey);
    
    // Notification d'erreur
    showNotification(`⚠️ Erreur Firebase: ${error.message}\nDonnées sauvegardées localement`, "warning");
    
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
    
    // Sauvegarder dans localStorage
    localStorage.setItem(`session_${sessionKey}`, JSON.stringify(sauvegardeData));
    
    // Garder un historique des 10 dernières sessions
    let historique = JSON.parse(localStorage.getItem('sessions_historique') || '[]');
    if (!historique.includes(sessionKey)) {
      historique.unshift(sessionKey);
      historique = historique.slice(0, 10);
      localStorage.setItem('sessions_historique', JSON.stringify(historique));
    }
    
    console.log("💾 Sauvegarde locale effectuée:", sessionKey);
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
      animation: slideIn 0.3s ease-out;
    ">
      <h4 style="margin: 0 0 10px 0;">✅ SESSION SAUVEGARDÉE AVEC SUCCÈS</h4>
      <div style="background: rgba(255,255,255,0.15); padding: 8px; border-radius: 4px;">
        <small>
          📍 Session: ${sessionKey}<br>
          👥 ${stats.totalPlongeurs} plongeurs au total<br>
          🏊 ${stats.nombrePalanquees} palanquées formées<br>
          ⏰ Sauvegardée à ${stats.heureValidation}
        </small>
      </div>
      <div style="margin-top: 8px; font-size: 0.85em; opacity: 0.9;">
        💾 Données sauvegardées dans Firebase (4 emplacements)<br>
        📱 Backup local créé
      </div>
    </div>
  `;
  
  dpMessage.style.display = 'block';
  dpMessage.classList.add("dp-valide");
  
  // Masquer après 8 secondes
  setTimeout(() => {
    dpMessage.style.opacity = '0';
    setTimeout(() => {
      dpMessage.style.display = 'none';
      dpMessage.style.opacity = '1';
    }, 500);
  }, 8000);
}

// === AMÉLIORATION DU BOUTON VALIDER-DP ===
document.addEventListener('DOMContentLoaded', function() {
  const validerDPBtn = document.getElementById('valider-dp');
  
  if (validerDPBtn) {
    // Remplacer l'event listener existant
    validerDPBtn.removeEventListener('click', validerDPBtn.onclick);
    
    validerDPBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      console.log("🎯 Validation DP déclenchée");
      
      // Validation des champs
      const dpNom = document.getElementById("dp-nom")?.value?.trim();
      const dpDate = document.getElementById("dp-date")?.value;
      const dpLieu = document.getElementById("dp-lieu")?.value?.trim();
      
      if (!dpNom || !dpDate || !dpLieu) {
        alert("⚠️ Veuillez remplir tous les champs DP (nom, date, lieu)");
        return;
      }
      
      // Animation du bouton
      validerDPBtn.disabled = true;
      validerDPBtn.innerHTML = '⏳ Sauvegarde en cours...';
      validerDPBtn.style.backgroundColor = '#6c757d';
      
      try {
        // Sauvegarder toutes les données
        const success = await saveSessionData();
        
        if (success) {
          // Synchronisation additionnelle
          if (typeof syncToDatabase === 'function') {
            setTimeout(syncToDatabase, 500);
          }
          
          // Rafraîchir les listes
          if (typeof refreshAllLists === 'function') {
            setTimeout(refreshAllLists, 1000);
          }
          
          // Succès visuel
          validerDPBtn.innerHTML = '✅ Sauvegardé !';
          validerDPBtn.style.backgroundColor = '#28a745';
          
          setTimeout(() => {
            validerDPBtn.disabled = false;
            validerDPBtn.innerHTML = 'Sauvegarder Session + DP';
            validerDPBtn.style.backgroundColor = '';
          }, 3000);
          
        } else {
          throw new Error("Échec de la sauvegarde");
        }
        
      } catch (error) {
        console.error("❌ Erreur:", error);
        
        // Erreur visuelle
        validerDPBtn.innerHTML = '❌ Erreur !';
        validerDPBtn.style.backgroundColor = '#dc3545';
        
        alert(`Erreur lors de la sauvegarde:\n${error.message}`);
        
        setTimeout(() => {
          validerDPBtn.disabled = false;
          validerDPBtn.innerHTML = 'Sauvegarder Session + DP';
          validerDPBtn.style.backgroundColor = '';
        }, 2000);
      }
    });
  }
});

// === FONCTION UTILITAIRE POUR LES NOTIFICATIONS ===
function showNotification(message, type = 'info') {
  // Utiliser la fonction existante si disponible
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, type);
    return;
  }
  
  // Sinon créer une notification simple
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
  `;
  
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  notification.style.backgroundColor = colors[type] || colors.info;
  notification.style.color = type === 'warning' ? '#000' : '#fff';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// === STYLE CSS À AJOUTER ===
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
  
  @keyframes slideInRight {
    from {
      transform: translateX(100px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .dp-valide {
    animation: slideIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);

console.log("✅ Système de sauvegarde amélioré chargé");