// ui-interface.js - Interface utilisateur et utilitaires avec système de verrous

// ===== COMPTEURS D'AFFICHAGE =====
function updateCompteurs() {
  const compteurPlongeurs = $("compteur-plongeurs");
  if (compteurPlongeurs) {
    compteurPlongeurs.textContent = `(${plongeurs.length})`;
    compteurPlongeurs.style.color = plongeurs.length === 0 ? "#28a745" : "#007bff";
  }
  
  const totalPlongeursEnPalanquees = palanquees.flat().length;
  const nombrePalanquees = palanquees.length;
  const compteurPalanquees = $("compteur-palanquees");
  
  if (compteurPalanquees) {
    if (nombrePalanquees === 0) {
      compteurPalanquees.textContent = "(Aucune palanquée)";
      compteurPalanquees.style.color = "#666";
    } else {
      const plurielPlongeurs = totalPlongeursEnPalanquees > 1 ? "plongeurs" : "plongeur";
      const plurielPalanquees = nombrePalanquees > 1 ? "palanquées" : "palanquée";
      compteurPalanquees.textContent = `(${totalPlongeursEnPalanquees} ${plurielPlongeurs} dans ${nombrePalanquees} ${plurielPalanquees})`;
      compteurPalanquees.style.color = "#28a745";
    }
  }
}

// ===== NOUVEAU : GESTION DES VERROUS UI =====
function updatePalanqueeLockUI() {
  // Créer ou mettre à jour l'indicateur de statut DP
  let statusIndicator = $("dp-status-indicator");
  
  if (!statusIndicator) {
    statusIndicator = document.createElement("div");
    statusIndicator.id = "dp-status-indicator";
    statusIndicator.className = "dp-status-indicator";
    
    const metaInfo = $("meta-info");
    if (metaInfo) {
      metaInfo.insertAdjacentElement('afterend', statusIndicator);
    }
  }
  
  const lockCount = Object.keys(palanqueeLocks).length;
  const activeLocks = Object.values(palanqueeLocks).map(lock => lock.userName).join(', ');
  
  statusIndicator.innerHTML = `
    <span class="dp-status-icon">👨‍💼</span>
    <span>Système DP actif - ${lockCount} palanquée(s) en modification</span>
    ${lockCount > 0 ? `<span style="font-size: 12px; color: #666;"> (${activeLocks})</span>` : ''}
  `;
  
  // Mettre à jour les palanquées existantes
  document.querySelectorAll('.palanquee').forEach((element, index) => {
    const palanqueeId = `palanquee-${index}`;
    const lock = palanqueeLocks[palanqueeId];
    
    // Supprimer les anciens indicateurs
    const oldIndicator = element.querySelector('.lock-indicator');
    if (oldIndicator) {
      oldIndicator.remove();
    }
    
    // Réinitialiser les classes
    element.classList.remove('editing-self', 'editing-other');
    element.style.pointerEvents = 'auto';
    element.style.opacity = '1';
    
    // Réactiver tous les champs
    const fields = element.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      field.disabled = false;
      field.classList.remove('locked-field');
    });
    
    if (lock) {
      const indicator = document.createElement('div');
      indicator.className = 'lock-indicator';
      
      if (lock.userId === currentUser.uid) {
        indicator.className += ' editing-self';
        indicator.textContent = '🔧 En modification par vous';
        element.classList.add('editing-self');
      } else {
        indicator.className += ' editing-other';
        indicator.textContent = `🔒 ${lock.userName} modifie`;
        element.classList.add('editing-other');
        element.style.pointerEvents = 'none';
        element.style.opacity = '0.7';
        
        // Désactiver tous les champs
        fields.forEach(field => {
          field.disabled = true;
          field.classList.add('locked-field');
        });
      }
      
      const title = element.querySelector('.palanquee-title');
      if (title) {
        title.appendChild(indicator);
      }
    }
  });
}

// Notifications de verrous
function showLockNotification(message, type = "info") {
  let container = $("lock-notifications");
  
  if (!container) {
    container = document.createElement("div");
    container.id = "lock-notifications";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1500;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }
  
  const notification = document.createElement("div");
  notification.style.cssText = `
    background: white;
    border-left: 4px solid ${type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
    border-radius: 4px;
    padding: 15px;
    margin: 10px 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
  `;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 4000);
}

// ===== SYSTÈME D'ALERTES =====
function checkAllAlerts() {
  const alertes = [];
  
  palanquees.forEach((palanquee, idx) => {
    const n1s = palanquee.filter(p => p.niveau === "N1");
    const gps = palanquee.filter(p => ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
    const autonomes = palanquee.filter(p => ["N2", "N3"].includes(p.niveau));
    
    if (palanquee.length > 5) {
      alertes.push(`Palanquée ${idx + 1}: Plus de 5 plongeurs (${palanquee.length})`);
    }
    
    if (palanquee.length <= 1) {
      alertes.push(`Palanquée ${idx + 1}: Palanquée de ${palanquee.length} plongeur(s)`);
    }
    
    if (n1s.length > 0 && gps.length === 0) {
      alertes.push(`Palanquée ${idx + 1}: N1 sans Guide de Palanquée`);
    }
    
    if (autonomes.length > 3) {
      alertes.push(`Palanquée ${idx + 1}: Plus de 3 plongeurs autonomes (${autonomes.length})`);
    }
    
    if ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0) {
      alertes.push(`Palanquée ${idx + 1}: ${palanquee.length} plongeurs sans Guide de Palanquée`);
    }
  });
  
  return alertes;
}

function updateAlertes() {
  const alertes = checkAllAlerts();
  const alerteSection = $("alertes-section");
  const alerteContent = $("alertes-content");
  
  if (alertes.length === 0) {
    alerteSection.classList.add("alert-hidden");
  } else {
    alerteSection.classList.remove("alert-hidden");
    alerteContent.innerHTML = alertes.map(alerte => 
      `<div class="alert-item">${alerte}</div>`
    ).join('');
  }
}

function checkAlert(palanquee) {
  // Vérifier que palanquee est bien un tableau
  if (!Array.isArray(palanquee)) {
    console.warn("⚠️ checkAlert: palanquee n'est pas un tableau:", palanquee);
    
    // Si c'est un objet, essayer de le convertir à la volée
    if (palanquee && typeof palanquee === 'object') {
      const plongeursArray = [];
      Object.keys(palanquee).forEach(key => {
        if (!isNaN(key) && palanquee[key] && typeof palanquee[key] === 'object' && palanquee[key].nom) {
          plongeursArray.push(palanquee[key]);
        }
      });
      
      // Utiliser le tableau converti pour la vérification
      const n1s = plongeursArray.filter(p => p && p.niveau === "N1");
      const gps = plongeursArray.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
      const autonomes = plongeursArray.filter(p => p && ["N2", "N3"].includes(p.niveau));
      
      return (
        plongeursArray.length > 5 ||
        plongeursArray.length <= 1 ||
        (n1s.length > 0 && gps.length === 0) ||
        autonomes.length > 3 ||
        ((plongeursArray.length === 4 || plongeursArray.length === 5) && gps.length === 0)
      );
    }
    
    return false;
  }
  
  const n1s = palanquee.filter(p => p && p.niveau === "N1");
  const gps = palanquee.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4"].includes(p.niveau));
  const autonomes = palanquee.filter(p => p && ["N2", "N3"].includes(p.niveau));
  
  return (
    palanquee.length > 5 ||
    palanquee.length <= 1 ||
    (n1s.length > 0 && gps.length === 0) ||
    autonomes.length > 3 ||
    ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0)
  );
}

// ===== TRI DES PLONGEURS =====
function sortPlongeurs(type) {
  currentSort = type;
  
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.sort === type) {
      btn.classList.add('active');
    }
  });
  
  switch(type) {
    case 'nom':
      plongeurs.sort((a, b) => a.nom.localeCompare(b.nom));
      break;
    case 'niveau':
      const niveauOrder = { 'N1': 1, 'N2': 2, 'N3': 3, 'N4/GP': 4, 'E1': 5, 'E2': 6, 'E3': 7, 'E4': 8 };
      plongeurs.sort((a, b) => (niveauOrder[a.niveau] || 9) - (niveauOrder[b.niveau] || 9));
      break;
    case 'none':
    default:
      plongeurs = [...plongeursOriginaux];
      break;
  }
  
  renderPlongeurs();
}

// ===== EXPORT JSON =====
function exportToJSON() {
  const dpNom = $("dp-nom").value || "Non défini";
  const dpDate = $("dp-date").value || "Non définie";
  const dpLieu = $("dp-lieu").value || "Non défini";
  const dpPlongee = $("dp-plongee").value || "matin";
  
  const exportData = {
    meta: {
      dp: dpNom,
      date: dpDate,
      lieu: dpLieu,
      plongee: dpPlongee,
      version: "2.0.0",
      exportDate: new Date().toISOString()
    },
    plongeurs: plongeurs.map(p => ({
      nom: p.nom,
      niveau: p.niveau,
      prerogatives: p.pre || ""
    })),
    palanquees: palanquees.map((pal, idx) => ({
      numero: idx + 1,
      plongeurs: pal.map(p => ({
        nom: p.nom,
        niveau: p.niveau,
        prerogatives: p.pre || ""
      })),
      alertes: checkAlert(pal) ? checkAllAlerts().filter(a => a.includes(`Palanquée ${idx + 1}`)) : []
    })),
    resume: {
      totalPlongeurs: plongeurs.length + palanquees.flat().length,
      nombrePalanquees: palanquees.length,
      plongeursNonAssignes: plongeurs.length,
      alertesTotal: checkAllAlerts().length
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `palanquees-${dpDate || 'export'}-${dpPlongee}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log("📤 Export JSON effectué");
}

// ===== SESSION MANAGEMENT =====
async function populateSessionSelector() {
  try {
    const sessions = await loadAvailableSessions();
    const selector = $("session-selector");
    
    if (!selector) return;
    
    selector.innerHTML = '<option value="">-- Charger une session --</option>';
    
    if (sessions.length === 0) {
      const option = document.createElement("option");
      option.textContent = "Aucune session disponible";
      option.disabled = true;
      selector.appendChild(option);
      return;
    }
    
    sessions.forEach(session => {
      const option = document.createElement("option");
      option.value = session.key;
      
      const plongeeType = session.plongee ? ` (${session.plongee})` : '';
      option.textContent = `${session.date}${plongeeType} - ${session.dp} - ${session.stats.nombrePalanquees} palanquées`;
      
      selector.appendChild(option);
    });
    
    console.log("✅ Sélecteur de sessions mis à jour:", sessions.length, "sessions");
  } catch (error) {
    console.error("❌ Erreur lors du peuplement du sélecteur:", error);
  }
}

// ===== NETTOYAGE =====
async function populateSessionsCleanupList() {
  const container = $("sessions-cleanup-list");
  if (!container) return;

  try {
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
    
  } catch (error) {
    console.error("❌ Erreur chargement liste sessions nettoyage:", error);
    if (container) {
      container.innerHTML = '<em style="color: #dc3545;">Erreur de chargement</em>';
    }
  }
}

async function populateDPCleanupList() {
  const container = $("dp-cleanup-list");
  if (!container) return;

  try {
    const snapshot = await db.ref("dpInfo").once('value');
    
    if (!snapshot.exists()) {
      container.innerHTML = '<em style="color: #666;">Aucun DP à nettoyer</em>';
      return;
    }
    
    const dpInfos = snapshot.val();
    container.innerHTML = '';
    
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
    
  } catch (error) {
    console.error("❌ Erreur chargement liste DP nettoyage:", error);
    if (container) {
      container.innerHTML = '<em style="color: #dc3545;">Erreur de chargement</em>';
    }
  }
}

async function deleteSelectedSessions() {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucune session sélectionnée pour suppression.");
    return;
  }
  
  const sessionKeys = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${sessionKeys.length} session(s) ?\n\nCette action est irréversible !`)) {
    return;
  }
  
  try {
    for (const sessionKey of sessionKeys) {
      await db.ref(`sessions/${sessionKey}`).remove();
    }
    
    alert(`${sessionKeys.length} session(s) supprimée(s) avec succès !`);
    await populateSessionsCleanupList();
    await populateSessionSelector();
    
  } catch (error) {
    console.error("❌ Erreur suppression sessions:", error);
    alert("Erreur lors de la suppression : " + error.message);
  }
}

async function deleteSelectedDPs() {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox:checked');
  
  if (checkboxes.length === 0) {
    alert("Aucun DP sélectionné pour suppression.");
    return;
  }
  
  const dpKeys = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${dpKeys.length} DP ?\n\nCette action est irréversible !`)) {
    return;
  }
  
  try {
    for (const dpKey of dpKeys) {
      await db.ref(`dpInfo/${dpKey}`).remove();
    }
    
    alert(`${dpKeys.length} DP supprimé(s) avec succès !`);
    await populateDPCleanupList();
    chargerHistoriqueDP();
    
  } catch (error) {
    console.error("❌ Erreur suppression DP:", error);
    alert("Erreur lors de la suppression : " + error.message);
  }
}

function selectAllSessions(select = true) {
  const checkboxes = document.querySelectorAll('.session-cleanup-checkbox');
  checkboxes.forEach(cb => cb.checked = select);
  updateCleanupSelection();
}

function selectAllDPs(select = true) {
  const checkboxes = document.querySelectorAll('.dp-cleanup-checkbox');
  checkboxes.forEach(cb => cb.checked = select);
  updateCleanupSelection();
}

function updateCleanupSelection() {
  document.querySelectorAll('.session-cleanup-checkbox').forEach(cb => {
    const item = cb.closest('.cleanup-item');
    if (cb.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  document.querySelectorAll('.dp-cleanup-checkbox').forEach(cb => {
    const item = cb.closest('.cleanup-item');
    if (cb.checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}