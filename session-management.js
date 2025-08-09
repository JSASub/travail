// ===== GESTION DES SESSIONS ET NETTOYAGE =====

// NOUVELLE FONCTION : Charger les sessions disponibles - VERSION CORRIGÉE
async function loadAvailableSessions() {
  try {
    const sessionsSnapshot = await db.ref('sessions').once('value');
    if (!sessionsSnapshot.exists()) {
      console.log("ℹ️ Aucune session trouvée");
      return [];
    }
    
    const sessions = sessionsSnapshot.val();
    const sessionsList = [];
    
    for (const [key, data] of Object.entries(sessions)) {
      // CORRECTION: Vérifier si data.meta existe avant de l'utiliser
      if (!data || typeof data !== 'object') {
        console.warn(`⚠️ Session ${key} invalide (données corrompues), ignorée`);
        continue;
      }
      
      // Gestion des anciens formats de sessions
      let sessionInfo;
      
      if (data.meta) {
        // Nouveau format avec meta
        sessionInfo = {
          key: key,
          dp: data.meta.dp || "DP non défini",
          date: data.meta.date || "Date inconnue",
          lieu: data.meta.lieu || "Lieu non défini",
          plongee: data.meta.plongee || "Non défini",
          timestamp: data.meta.timestamp || Date.now(),
          stats: data.stats || {
            nombrePalanquees: data.palanquees ? data.palanquees.length : 0,
            totalPlongeurs: (data.plongeurs || []).length + (data.palanquees || []).flat().length,
            plongeursNonAssignes: (data.plongeurs || []).length
          }
        };
      } else {
        // Ancien format ou format non standard
        console.warn(`⚠️ Session ${key} utilise un ancien format, adaptation...`);
        
        // Essayer d'extraire les infos du nom de la clé
        const keyParts = key.split('_');
        const dateFromKey = keyParts[0] || "Date inconnue";
        const plongeeFromKey = keyParts[keyParts.length - 1] || "Non défini";
        
        sessionInfo = {
          key: key,
          dp: data.dp || data.directeurPlongee || "DP non défini (ancien format)",
          date: data.date || dateFromKey,
          lieu: data.lieu || "Lieu non défini",
          plongee: data.plongee || plongeeFromKey,
          timestamp: data.timestamp || Date.now(),
          stats: {
            nombrePalanquees: data.palanquees ? data.palanquees.length : 0,
            totalPlongeurs: (data.plongeurs || []).length + (data.palanquees || []).flat().length,
            plongeursNonAssignes: (data.plongeurs || []).length
          }
        };
      }
      
      sessionsList.push(sessionInfo);
    }
    
    // Trier par date décroissante
    sessionsList.sort((a, b) => {
      // Essayer de comparer par date, sinon par timestamp
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB - dateA;
      } else {
        // Fallback sur timestamp
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });
    
    console.log("✅ Sessions chargées:", sessionsList.length);
    return sessionsList;
    
  } catch (error) {
    console.error("❌ Erreur chargement sessions:", error);
    return [];
  }
}

// NOUVELLE FONCTION : Charger une session spécifique
async function loadSession(sessionKey) {
  try {
    console.log("🔄 Chargement de la session:", sessionKey);
    
    const sessionSnapshot = await db.ref(`sessions/${sessionKey}`).once('value');
    if (!sessionSnapshot.exists()) {
      console.error("❌ Session non trouvée:", sessionKey);
      alert("Session non trouvée dans Firebase");
      return false;
    }
    
    const sessionData = sessionSnapshot.val();
    console.log("📊 Données session récupérées:", sessionData);
    
    // Charger les données
    plongeurs = sessionData.plongeurs || [];
    palanquees = sessionData.palanquees || [];
    plongeursOriginaux = [...plongeurs];
    
    console.log("✅ Données chargées:", plongeurs.length, "plongeurs,", palanquees.length, "palanquées");
    
    // Mettre à jour les champs DP
    $("dp-nom").value = sessionData.meta.dp || "";
    $("dp-date").value = sessionData.meta.date || "";
    $("dp-lieu").value = sessionData.meta.lieu || "";
    $("dp-plongee").value = sessionData.meta.plongee || "matin";
    
    // FORCER le rendu
    console.log("🎨 Forçage du rendu...");
    renderPalanquees();
    renderPlongeurs();
    updateAlertes();
    
    console.log("✅ Session chargée:", sessionKey);
    console.log(`📊 ${plongeurs.length} plongeurs et ${palanquees.length} palanquées affichés`);
    
    // Message utilisateur
    const dpMessage = $("dp-message");
    dpMessage.innerHTML = `✓ Session "${sessionData.meta.dp}" du ${sessionData.meta.date} (${sessionData.meta.plongee || 'matin'}) chargée`;
    dpMessage.style.color = "green";
    
    return true;
    
  } catch (error) {
    console.error("❌ Erreur chargement session:", error);
    alert("Erreur lors du chargement de la session : " + error.message);
    return false;
  }
}

// NOUVELLE FONCTION : Populer le sélecteur de sessions  
async function populateSessionSelector() {
  try {
    console.log("🔄 Chargement des sessions disponibles...");
    const sessions = await loadAvailableSessions();
    const selector = $("session-selector");
    
    if (!selector) {
      console.error("❌ Sélecteur de sessions non trouvé");
      return;
    }
    
    // Vider le sélecteur
    selector.innerHTML = '<option value="">-- Charger une session --</option>';
    
    if (sessions.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Aucune session disponible";
      option.disabled = true;
      selector.appendChild(option);
      console.log("ℹ️ Aucune session disponible");
      return;
    }
    
    sessions.forEach(session => {
      const option = document.createElement("option");
      option.value = session.key;
      
      // Format d'affichage amélioré avec type de plongée
      const plongeeType = session.plongee ? ` (${session.plongee})` : '';
      option.textContent = `${session.date}${plongeeType} - ${session.dp} - ${session.stats.nombrePalanquees} palanquées`;
      
      selector.appendChild(option);
    });
    
    console.log("✅ Sélecteur de sessions mis à jour:", sessions.length, "sessions");
  } catch (error) {
    console.error("❌ Erreur lors du peuplement du sélecteur:", error);
  }
}

// ===== FONCTIONS DE NETTOYAGE =====

// Charger la liste des sessions pour nettoyage - VERSION SÉCURISÉE
async function populateSessionsCleanupList() {
  const container = $("sessions-cleanup-list");
  if (!container) {
    console.warn("⚠️ Conteneur sessions-cleanup-list non trouvé - nettoyage sessions désactivé");
    return;
  }

  try {
    console.log("🧹 Chargement liste sessions pour nettoyage...");
    const sessions = await loadAvailableSessions();
    
    if (sessions.length === 0) {
      container.innerHTML = '<em style="color: #666;">Aucune session à nettoyer</em>';
      return;
    }
    
    container.innerHTML = '';
    
    sessions.forEach(session => {
      const item = document.createElement('label');
      item.className = 'cleanup-item';
      
      const plongeeType = session.plongee ? ` (${session.plongee})` : '';
      const dateFormatted = new Date(session.timestamp).toLocaleString('fr-FR');
      
      item.innerHTML = `
        <input type="checkbox" value="${session.key}" class="session-cleanup-checkbox">
        <div class="item-info">
          <span class="item-date">${session.date}${plongeeType}</span>
          <span class="item-details">${session.dp} - ${session.stats.nombrePalanquees} palanquées</span>
          <span class="item-meta">Créé le ${dateFormatted}</span>
        </div>
      `;
      
      container.appendChild(item);
    });
    
    console.log("✅ Liste sessions nettoyage mise à jour:", sessions.length, "sessions");
    
  } catch (error) {
    console.error("❌ Erreur chargement liste sessions nettoyage:", error);
    if (container) {
      container.innerHTML = '<em style="color: #dc3545;">Erreur de chargement</em>';
    }
  }
}

// Charger la liste des DPs pour nettoyage - VERSION SÉCURISÉE
async function populateDPCleanupList() {
  const container = $("dp-cleanup-list");
  if (!container) {
    console.warn("⚠️ Conteneur dp-cleanup-list non trouvé - nettoyage DP désactivé");
    return;
  }

  try {
    console.log("🧹 Chargement liste DP pour nettoyage...");
    const snapshot = await db.ref("dpInfo").once('value');
    
    if (!snapshot.exists()) {
      container.innerHTML = '<em style="color: #666;">Aucun DP à nettoyer</em>';
      return;
    }
    
    const dpInfos = snapshot.val();
    container.innerHTML = '';
    
    // Trier par date décroissante
    const dpList = Object.entries(dpInfos).sort((a, b) => 
      new Date(b[1].date) - new Date(a[1].date)
    );
    
    dpList.forEach(([key, dpData]) => {
      const item = document.createElement('label');
      item.className = 'cleanup-item';
      
      const dateFormatted = new Date(dpData.timestamp).toLocaleString('fr-FR');
      const plongeeType = dpData.plongee ? ` (${dpData.plongee})` : '';
      
      item.innerHTML = `
        <input type="checkbox" value="${key}" class="dp-cleanup-checkbox">
        <div class="item-info">
          <span class="item-date">${dpData.date}${plongeeType}</span>
          <span class="item-details">${dpData.nom} - ${dpData.lieu}</span>
          <span class="item-meta">Créé le ${dateFormatted}</span>
        </div>
      `;
      
      container.appendChild(item);
    });
    
    console.log("✅ Liste DP nettoyage mise à jour:", dpList.length, "DP");
    
  } catch (error) {
    console.error("❌ Erreur chargement liste DP nettoyage:", error);
    if (container) {
      container.innerHTML = '<em style="color: #dc3545;">Erreur de chargement</em>';
    }
  }
}

// Supprimer les sessions sélectionnées
async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucune session sélectionnée pour suppression.");
    return;
  }
  
  const sessionKeys = Array.from(checkboxes).map(cb => cb.value);
  const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${sessionKeys.length} session(s) ?\n\nCette action est irréversible !`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    console.log("🗑️ Suppression de", sessionKeys.length, "sessions...");
    
    for (const sessionKey of sessionKeys) {
      await db.ref(`sessions/${sessionKey}`).remove();
      console.log("✅ Session supprimée:", sessionKey);
    }
    
    console.log("✅ Suppression sessions terminée");
    alert(`${sessionKeys.length} session(s) supprimée(s) avec succès !`);
    
    // Actualiser les listes
    await populateSessionsCleanupList();
    await populateSessionSelector();
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("Erreur lors de la suppression : " + error.message);
  }
}

// Supprimer les DPs sélectionnés
async function deleteSelectedDPs() {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucun DP sélectionné pour suppression.");
    return;
  }
  
  const dpKeys = Array.from(checkboxes).map(cb => cb.value);
  const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${dpKeys.length} DP ?\n\nCette action est irréversible !`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    console.log("🗑️ Suppression de", dpKeys.length, "DP...");
    
    for (const dpKey of dpKeys) {
      await db.ref(`dpInfo/${dpKey}`).remove();
      console.log("✅ DP supprimé:", dpKey);
    }
    
    console.log("✅ Suppression DP terminée");
    alert(`${dpKeys.length} DP supprimé(s) avec succès !`);
    
    // Actualiser les listes
    await populateDPCleanupList();
    chargerHistoriqueDP();
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("Erreur lors de la suppression : " + error.message);
  }
}

// Fonctions de sélection - VERSION SÉCURISÉE
function selectAllSessions(select = true) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  if (checkboxes.length === 0) {
    console.warn("⚠️ Aucune checkbox session trouvée");
    return;
  }
  checkboxes.forEach(cb => cb.checked = select);
  updateCleanupSelection();
}

function selectAllDPs(select = true) {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox');
  if (checkboxes.length === 0) {
    console.warn("⚠️ Aucune checkbox DP trouvée");
    return;
  }
  checkboxes.forEach(cb => cb.checked = select);
  updateCleanupSelection();
}

// Mettre à jour l'apparence des items sélectionnés
function updateCleanupSelection() {
  // Sessions
  document.querySelectorAll('.session-cleanup-checkbox').forEach(cb => {
    const item = cb.closest('.cleanup-item');
    if (cb.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  // DPs
  document.querySelectorAll('.dp-cleanup-checkbox').forEach(cb => {
    const item = cb.closest('.cleanup-item');
    if (cb.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Chargement de l'historique des DP (Firebase)
function chargerHistoriqueDP() {
  const dpDatesSelect = $("dp-dates");
  const historiqueInfo = $("historique-info");

  if (!dpDatesSelect || !historiqueInfo) {
    console.error("❌ Éléments DOM pour historique DP non trouvés");
    return;
  }

  db.ref("dpInfo").once('value').then((snapshot) => {
    if (snapshot.exists()) {
      const dpInfos = snapshot.val();
      console.log("✅ Historique DP chargé:", Object.keys(dpInfos).length, "entrées");

      // Vider les options existantes (sauf la première)
      dpDatesSelect.innerHTML = '<option value="">-- Choisir une date --</option>';

      for (const date in dpInfos) {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dpDatesSelect.appendChild(option);
      }

      dpDatesSelect.addEventListener("change", () => {
        const selectedDate = dpDatesSelect.value;
        if (selectedDate && dpInfos[selectedDate]) {
          const dp = dpInfos[selectedDate];
          historiqueInfo.innerHTML = `
            <p><strong>Nom :</strong> ${dp.nom}</p>
            <p><strong>Lieu :</strong> ${dp.lieu}</p>
          `;
        } else {
          historiqueInfo.innerHTML = "";
        }
      });
    } else {
      console.log("ℹ️ Aucun historique DP trouvé");
    }
  }).catch((error) => {
    console.error("❌ Erreur de lecture de l'historique DP :", error);
  });
}