// offline-manager.js - Gestionnaire de connectivité et sauvegarde d'urgence (VERSION SÉCURISÉE)

// ===== VARIABLES GLOBALES =====
let isOnline = false;
let lastSyncTimestamp = null;
let emergencySaveInterval = null;
let connectionCheckInterval = null;
let offlineDataPending = false;
let userAuthenticationCompleted = false;

// ===== INDICATEUR DE STATUT =====
function createConnectionIndicator() {
  if (!userAuthenticationCompleted || !currentUser) return null;

  const existingIndicator = document.getElementById('connection-indicator');
  if (existingIndicator) existingIndicator.remove();

  const indicator = document.createElement('div');
  indicator.id = 'connection-indicator';
  indicator.style.cssText = `
    position: fixed; top: 10px; left: 10px;
    padding: 8px 15px; border-radius: 20px;
    font-size: 12px; font-weight: bold;
    z-index: 1001; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease; cursor: pointer; user-select: none;
  `;
  indicator.innerHTML = `
    <span id="status-icon">🔄</span>
    <span id="status-text">Vérification...</span>
    <button id="manual-sync-btn" style="
      background: rgba(255,255,255,0.3); border: none; border-radius: 10px;
      padding: 2px 6px; font-size: 11px; cursor: pointer; display: none;
    ">🔄</button>
  `;
  document.body.appendChild(indicator);

  document.getElementById('manual-sync-btn').addEventListener('click', e => {
    e.stopPropagation();
    forceSyncToFirebase();
  });
  indicator.addEventListener('click', showConnectionDetails);
  return indicator;
}

function updateConnectionIndicator(online) {
  if (!userAuthenticationCompleted || !currentUser) return;
  const indicator = document.getElementById('connection-indicator');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const syncBtn = document.getElementById('manual-sync-btn');
  if (!indicator || !statusIcon || !statusText) return;

  if (online) {
    indicator.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
    indicator.style.border = '1px solid #28a745';
    indicator.style.color = '#155724';
    statusIcon.textContent = '🟢';
    statusText.textContent = 'En ligne - Sauvegarde auto';
    if (syncBtn) syncBtn.style.display = 'none';
  } else {
    indicator.style.background = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
    indicator.style.border = '1px solid #dc3545';
    indicator.style.color = '#721c24';
    statusIcon.textContent = '🔴';
    statusText.textContent = offlineDataPending ? '⚠️ Données à synchroniser' : 'Hors ligne - Mode local';
    if (syncBtn) syncBtn.style.display = 'block';
  }
}

function showConnectionDetails() {
  if (!userAuthenticationCompleted || !currentUser) return;
  const details = `
📊 État de la connexion :
• Statut : ${isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
• Dernière sync : ${lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString('fr-FR') : 'Jamais'}
• Données pendantes : ${offlineDataPending ? '⚠️ Oui' : '✅ Non'}
  `;
  alert(details);
}

// ===== VÉRIFICATION DE CONNEXION =====
async function checkFirebaseConnection() {
  if (!userAuthenticationCompleted || !currentUser) return false;
  try {
    if (!db) return false;

    const connected = await new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 3000);
      db.ref('.info/connected').once('value', snapshot => {
        clearTimeout(timeout);
        resolve(snapshot.val() === true);
      }, () => { clearTimeout(timeout); resolve(false); });
    });

    if (connected !== isOnline) {
      const wasOnline = isOnline;
      isOnline = connected;
      firebaseConnected = connected;
      updateConnectionIndicator(isOnline);
      if (!wasOnline && isOnline) {
        showNotification("🟢 Connexion rétablie ! Synchronisation...", "success");
        await forceSyncToFirebase();
      } else if (wasOnline && !isOnline) {
        showNotification("🔴 Connexion perdue. Mode hors ligne activé.", "warning");
      }
    }
    return connected;
  } catch (error) {
    console.error("⌚ Erreur vérification connexion:", error);
    isOnline = false;
    firebaseConnected = false;
    updateConnectionIndicator(false);
    return false;
  }
}

// ===== SAUVEGARDE D'URGENCE =====
function emergencyLocalSave() {
  if (!userAuthenticationCompleted || !currentUser) return false;
  try {
    const emergencyData = {
      timestamp: Date.now(),
      plongeurs: plongeurs || [],
      palanquees: palanquees || [],
      metadata: {
        dp: document.getElementById("dp-nom")?.value || "",
        date: document.getElementById("dp-date")?.value || "",
        lieu: document.getElementById("dp-lieu")?.value || "",
        plongee: document.getElementById("dp-plongee")?.value || "matin"
      },
      version: "2.5.0-offline",
      userEmail: currentUser.email
    };
    sessionStorage.setItem('jsas_emergency_backup', JSON.stringify(emergencyData));
    localStorage.setItem('jsas_last_backup', JSON.stringify(emergencyData));

    const dpSelect = document.getElementById('dp-select');
    if (dpSelect && dpSelect.value) {
      localStorage.setItem('emergency_dp_selected', dpSelect.value);
      localStorage.setItem('emergency_dp_text', dpSelect.options[dpSelect.selectedIndex].text);
    }

    const palanqueeDetails = [];
    document.querySelectorAll('.palanquee').forEach((element, index) => {
      const details = {
        id: element.dataset?.index || index,
        horaire: element.querySelector('.palanquee-horaire')?.value || '',
        profondeurPrevue: element.querySelector('.palanquee-prof-prevue')?.value || '',
        dureePrevue: element.querySelector('.palanquee-duree-prevue')?.value || '',
        profondeurRealisee: element.querySelector('.palanquee-prof-realisee')?.value || '',
        dureeRealisee: element.querySelector('.palanquee-duree-realisee')?.value || '',
        paliers: element.querySelector('.palanquee-paliers')?.value || '',
        gaz: element.querySelector('.palanquee-gaz')?.value || '',
        profondeurSecurite: element.querySelector('.palanquee-prof-securite')?.value || ''
      };
      palanqueeDetails.push(details);
    });
    localStorage.setItem('emergency_palanquee_details', JSON.stringify(palanqueeDetails));

    if (!isOnline) { offlineDataPending = true; updateConnectionIndicator(false); }
    return true;
  } catch (error) {
    console.error("⌚ Erreur sauvegarde d'urgence:", error);
    return false;
  }
}

// ===== RESTAURATION D'URGENCE =====
function waitAndRestoreEmergency() {
  const dpSelect = document.getElementById('dp-select');
  const palanqueeElements = document.querySelectorAll('.palanquee');

  if (dpSelect && dpSelect.options.length > 1 && palanqueeElements.length > 0) {
    const savedDpId = localStorage.getItem('emergency_dp_selected');
    if (savedDpId) {
      dpSelect.value = savedDpId;
      if (typeof onDpSelectionChange === 'function') onDpSelectionChange();
      localStorage.removeItem('emergency_dp_selected');
      localStorage.removeItem('emergency_dp_text');
    }

    const savedDetails = localStorage.getItem('emergency_palanquee_details');
    if (savedDetails) {
      try {
        const palanqueeDetails = JSON.parse(savedDetails);
        palanqueeDetails.forEach((details, index) => {
          const element = document.querySelector(`[data-index="${details.id}"]`) || palanqueeElements[index];
          if (element) {
            const fields = [
              {selector: '.palanquee-horaire', value: details.horaire},
              {selector: '.palanquee-prof-prevue', value: details.profondeurPrevue},
              {selector: '.palanquee-duree-prevue', value: details.dureePrevue},
              {selector: '.palanquee-prof-realisee', value: details.profondeurRealisee},
              {selector: '.palanquee-duree-realisee', value: details.dureeRealisee},
              {selector: '.palanquee-paliers', value: details.paliers},
              {selector: '.palanquee-gaz', value: details.gaz},
              {selector: '.palanquee-prof-securite', value: details.profondeurSecurite}
            ];
            fields.forEach(f => {
              if (f.value) {
                const el = element.querySelector(f.selector);
                if (el) {
                  el.value = f.value;
                  el.dispatchEvent(new Event('change', {bubbles: true}));
                }
              }
            });
          }
        });
        localStorage.removeItem('emergency_palanquee_details');
      } catch (error) {
        console.error('❌ Erreur parsing détails d\'urgence:', error);
      }
    }
    return;
  }
  setTimeout(waitAndRestoreEmergency, 100);
}

// ===== SYNCHRONISATION FORCÉE =====
async function forceSyncToFirebase() {
  if (!userAuthenticationCompleted || !currentUser) {
    showNotification("⚠️ Synchronisation impossible - utilisateur non connecté", "warning");
    return false;
  }
  const syncBtn = document.getElementById('manual-sync-btn');
  const statusIcon = document.getElementById('status-icon');

  try {
    if (statusIcon) statusIcon.textContent = '🔄';
    if (syncBtn) { syncBtn.textContent = '⏳'; syncBtn.disabled = true; }

    showNotification("🔄 Synchronisation en cours...", "info");
    const connected = await checkFirebaseConnection();
    if (!connected) throw new Error("Connexion Firebase indisponible");

    if (typeof syncToDatabase === 'function') {
      await syncToDatabase();
    } else {
      await Promise.all([
        db.ref('plongeurs').set(plongeurs || []),
        db.ref('palanquees').set(palanquees || [])
      ]);
      if (typeof saveSessionData === 'function') await saveSessionData();
    }

    lastSyncTimestamp = Date.now();
    offlineDataPending = false;
    sessionStorage.removeItem('jsas_emergency_backup');
    showNotification("✅ Synchronisation réussie !", "success");
    updateConnectionIndicator(true);
    return true;
  } catch (error) {
    console.error("⌚ Erreur synchronisation forcée:", error);
    showNotification(`⌚ Échec de synchronisation : ${error.message}`, "error");
    updateConnectionIndicator(false);
    return false;
  } finally {
    if (statusIcon) statusIcon.textContent = isOnline ? '🟢' : '🔴';
    if (syncBtn) { syncBtn.textContent = '🔄'; syncBtn.disabled = false; }
  }
}

// ===== EXPORT =====
window.forceSyncToFirebase = forceSyncToFirebase;
window.emergencyLocalSave = emergencyLocalSave;
window.waitAndRestoreEmergency = waitAndRestoreEmergency;