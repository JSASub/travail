// offline-manager.js - Gestionnaire de connectivité et sauvegarde d'urgence (VERSION COMPLÈTE)

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
    position: fixed; top: 10px; left: 10px; padding: 8px 15px;
    border-radius: 20px; font-size: 12px; font-weight: bold;
    z-index: 1001; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease;
    cursor: pointer; user-select: none;
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

  document.getElementById('manual-sync-btn').addEventListener('click', e=>{
    e.stopPropagation(); forceSyncToFirebase();
  });
  indicator.addEventListener('click', showConnectionDetails);

  return indicator;
}

function updateConnectionIndicator(online, details='') {
  if (!userAuthenticationCompleted || !currentUser) return;

  const indicator = document.getElementById('connection-indicator');
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const syncBtn = document.getElementById('manual-sync-btn');
  if (!indicator || !statusIcon || !statusText) return;

  if(online){
    indicator.style.background='linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
    indicator.style.border='1px solid #28a745'; indicator.style.color='#155724';
    statusIcon.textContent='🟢'; statusText.textContent='En ligne - Sauvegarde auto';
    if(syncBtn) syncBtn.style.display='none';
  }else{
    indicator.style.background='linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
    indicator.style.border='1px solid #dc3545'; indicator.style.color='#721c24';
    statusIcon.textContent='🔴'; statusText.textContent='Hors ligne - Mode local';
    if(syncBtn) syncBtn.style.display='block';
  }
  if(offlineDataPending && !online){
    statusText.textContent='Hors ligne - Données à synchroniser';
    statusIcon.textContent='⚠️';
  }
}

function showConnectionDetails(){
  if(!userAuthenticationCompleted || !currentUser) return;

  const details = `
📊 État de la connexion :
• Statut : ${isOnline?'🟢 En ligne':'🔴 Hors ligne'}
• Dernière sync : ${lastSyncTimestamp?new Date(lastSyncTimestamp).toLocaleString('fr-FR'):'Jamais'}
• Données pendantes : ${offlineDataPending?'⚠️ Oui':'✅ Non'}

📱 Capacités actuelles :
• Édition : ✅ Disponible
• Sauvegarde locale : ✅ Active
• Sync Firebase : ${isOnline?'✅ Disponible':'⌚ Indisponible'}
• Partage temps réel : ${isOnline?'✅ Actif':'⌚ Désactivé'}
  `;
  alert(details);
}

// ===== VÉRIFICATION DE CONNEXION =====
async function checkFirebaseConnection(){
  if(!userAuthenticationCompleted || !currentUser) return false;
  try{
    if(!db){ console.warn("⚠️ DB non initialisée"); return false; }
    const connected = await new Promise(resolve=>{
      const timeout = setTimeout(()=>resolve(false), 3000);
      db.ref('.info/connected').once('value', snap=>{
        clearTimeout(timeout); resolve(snap.val()===true);
      }, ()=>{ clearTimeout(timeout); resolve(false); });
    });
    if(connected!==isOnline){
      const wasOnline=isOnline; isOnline=connected; firebaseConnected=connected;
      updateConnectionIndicator(isOnline);
      if(!wasOnline && isOnline){
        showNotification("🟢 Connexion rétablie ! Synchronisation...","success");
        await forceSyncToFirebase();
      }else if(wasOnline && !isOnline){
        showNotification("🔴 Connexion perdue. Mode hors ligne activé.","warning");
      }
    }
    return connected;
  }catch(e){ console.error("⌚ Erreur check connexion:", e); isOnline=false; firebaseConnected=false; updateConnectionIndicator(false); return false; }
}

// ===== SAUVEGARDE D'URGENCE =====
function emergencyLocalSave(){
  if(!userAuthenticationCompleted || !currentUser) return false;
  try{
    const dpNom=document.getElementById("dp-nom")?.value||"";
    const dpNiveau=document.getElementById("dp-niveau")?.value||"";
    const dpDate=document.getElementById("dp-date")?.value||"";
    const dpLieu=document.getElementById("dp-lieu")?.value||"";
    const dpPlongee=document.getElementById("dp-plongee")?.value||"matin";

    const emergencyData={
      timestamp: Date.now(),
      plongeurs: plongeurs||[],
      palanquees: palanquees||[],
      metadata:{dpNom, dpNiveau, dpDate, dpLieu, dpPlongee},
      version:"2.5.0-offline",
      userEmail: currentUser.email
    };

    sessionStorage.setItem('jsas_emergency_backup',JSON.stringify(emergencyData));
    localStorage.setItem('jsas_last_backup',JSON.stringify(emergencyData));

    offlineDataPending=true;
    updateConnectionIndicator(false);
    return true;
  }catch(e){ console.error("⌚ Erreur sauvegarde d'urgence:",e); return false; }
}

// ===== RESTAURATION DU DP =====
function restoreEmergencyMetadata(metadata){
  if(!metadata) return;
  const dpNomEl=document.getElementById("dp-nom");
  const dpNiveauEl=document.getElementById("dp-niveau");
  const dpDateEl=document.getElementById("dp-date");
  const dpLieuEl=document.getElementById("dp-lieu");
  const dpPlongeeEl=document.getElementById("dp-plongee");

  if(dpNomEl) dpNomEl.value=metadata.dpNom||"";
  if(dpNiveauEl) dpNiveauEl.value=metadata.dpNiveau||"";
  if(dpDateEl) dpDateEl.value=metadata.dpDate||"";
  if(dpLieuEl) dpLieuEl.value=metadata.dpLieu||"";
  if(dpPlongeeEl) dpPlongeeEl.value=metadata.dpPlongee||"matin";
}

// ===== RESTAURATION D'URGENCE =====
function waitAndRestoreEmergency() {
  const dpSelect = document.getElementById('dp-select');
  const palanqueeElements = document.querySelectorAll('.palanquee');

  // Vérifier si la sauvegarde d'urgence existe
  const savedBackup = localStorage.getItem('jsas_last_backup');
  if (!savedBackup) return;

  const backupData = JSON.parse(savedBackup);

  // Vérification si tous les éléments nécessaires sont présents
  if (!dpSelect || dpSelect.options.length <= 1 || palanqueeElements.length === 0) {
    console.log('⏳ Éléments pas encore prêts, nouvelle tentative dans 100ms...');
    setTimeout(waitAndRestoreEmergency, 100);
    return;
  }

  console.log('✅ Éléments prêts, début de la restauration d\'urgence');

  // Restaurer le DP
  if (backupData.metadata) {
    const dpNom = document.getElementById("dp-nom");
    const dpDate = document.getElementById("dp-date");
    const dpLieu = document.getElementById("dp-lieu");
    const dpPlongee = document.getElementById("dp-plongee");

    if (dpNom) { dpNom.value = backupData.metadata.dp || ""; dpNom.dispatchEvent(new Event('change', {bubbles: true})); }
    if (dpDate) { dpDate.value = backupData.metadata.date || ""; dpDate.dispatchEvent(new Event('change', {bubbles: true})); }
    if (dpLieu) { dpLieu.value = backupData.metadata.lieu || ""; dpLieu.dispatchEvent(new Event('change', {bubbles: true})); }
    if (dpPlongee) { dpPlongee.value = backupData.metadata.plongee || "matin"; dpPlongee.dispatchEvent(new Event('change', {bubbles: true})); }

    if (dpSelect && backupData.metadata.dpId) {
      dpSelect.value = backupData.metadata.dpId;
      dpSelect.dispatchEvent(new Event('change', {bubbles: true}));
    }
  }

  // Restaurer les palanquées et plongeurs
  const savedDetails = localStorage.getItem('emergency_palanquee_details');
  if (savedDetails) {
    const palanqueeDetails = JSON.parse(savedDetails);
    palanqueeDetails.forEach((details, index) => {
      const element = document.querySelector(`[data-index="${details.id}"]`) || palanqueeElements[index];
      if (!element) return;

      // Restaurer les champs de la palanquée
      const fields = [
        {selector: '.palanquee-horaire', value: details.horaire},
        {selector: '.palanquee-prof-prevue', value: details.profondeurPrevue},
        {selector: '.palanquee-duree-prevue', value: details.dureePrevue},
        {selector: '.palanquee-prof-realisee', value: details.profondeurRealisee},
        {selector: '.palanquee-duree-realisee', value: details.dureeRealisee},
        {selector: '.palanquee-paliers', value: details.paliers}
      ];
      fields.forEach(f => {
        const el = element.querySelector(f.selector);
        if (el && f.value) {
          el.value = f.value;
          el.dispatchEvent(new Event('change', {bubbles: true}));
        }
      });

      // Restaurer les plongeurs individuels
      if (details.plongeurs && details.plongeurs.length) {
        details.plongeurs.forEach(plongeurData => {
          let plongeurEl = element.querySelector(`[data-id="${plongeurData.id}"]`);
          if (plongeurEl) {
            Object.keys(plongeurData).forEach(key => {
              const input = plongeurEl.querySelector(`.${key}`);
              if (input) {
                input.value = plongeurData[key];
                input.dispatchEvent(new Event('change', {bubbles: true}));
              }
            });
          } else {
            console.warn(`Plongeur ${plongeurData.nom} introuvable dans la palanquée ${details.id}`);
          }
        });
      }
    });

    console.log('🎉 Restauration des palanquées et plongeurs terminée');
    localStorage.removeItem('emergency_palanquee_details');

    // Synchronisation post-restauration pour sauvegarder les valeurs restaurées
    setTimeout(() => {
      if (typeof syncToDatabase === 'function') {
        console.log('🔄 Synchronisation post-restauration...');
        syncToDatabase();
      }
    }, 1000);
  }
}


function loadEmergencyBackup(){
  if(!userAuthenticationCompleted || !currentUser){ console.log("ℹ️ Utilisateur non authentifié"); return false; }
  try{
    let backupData=sessionStorage.getItem('jsas_emergency_backup')||localStorage.getItem('jsas_last_backup');
    if(!backupData){ console.log("ℹ️ Aucune sauvegarde"); return false; }
    const data=JSON.parse(backupData);
    if(data.userEmail && data.userEmail!==currentUser.email){ sessionStorage.removeItem('jsas_emergency_backup'); localStorage.removeItem('jsas_last_backup'); return false; }
    const confirmRestore=confirm(`🔄 Sauvegarde d'urgence trouvée du ${new Date(data.timestamp).toLocaleString('fr-FR')}\nVoulez-vous restaurer ?`);
    if(confirmRestore){
      if(Array.isArray(data.plongeurs)) plongeurs=data.plongeurs;
      if(Array.isArray(data.palanquees)) palanquees=data.palanquees;
      restoreEmergencyMetadata(data.metadata);
      if(typeof renderPalanquees==='function') renderPalanquees();
      if(typeof renderPlongeurs==='function') renderPlongeurs();
      if(typeof updateAlertes==='function') updateAlertes();
      if(typeof updateCompteurs==='function') updateCompteurs();
      showNotification("✅ Sauvegarde d'urgence restaurée !","success");
      setTimeout(waitAndRestoreEmergency,500);
      offlineDataPending=true;
      return true;
    }
    return false;
  }catch(e){ console.error("⌚ Erreur chargement:",e); alert("Erreur chargement sauvegarde d'urgence"); return false; }
}

// ===== SYNCHRONISATION FORCÉE =====
async function forceSyncToFirebase(){
  if(!userAuthenticationCompleted || !currentUser){ showNotification("⚠️ Synchronisation impossible","warning"); return false; }
  const syncBtn=document.getElementById('manual-sync-btn');
  const statusIcon=document.getElementById('status-icon');
  try{
    if(statusIcon) statusIcon.textContent='🔄';
    if(syncBtn){ syncBtn.textContent='⏳'; syncBtn.disabled=true; }
    showNotification("🔄 Synchronisation en cours...","info");
    const connected=await checkFirebaseConnection();
    if(!connected) throw new Error("Connexion Firebase indisponible");
    if(typeof syncToDatabase==='function'){ await syncToDatabase(); }
    else{ await Promise.all([db.ref('plongeurs').set(plongeurs||[]), db.ref('palanquees').set(palanquees||[])]); if(typeof saveSessionData==='function') await saveSessionData(); }
    lastSyncTimestamp=Date.now(); offlineDataPending=false;
    sessionStorage.removeItem('jsas_emergency_backup');
    showNotification("✅ Synchronisation réussie !","success");
    updateConnectionIndicator(true);
    return true;
  }catch(e){ console.error("⌚ Erreur sync:",e); showNotification(`⌚ Échec sync : ${e.message}`,"error"); updateConnectionIndicator(false); return false; }
  finally{ if(statusIcon) statusIcon.textContent=isOnline?'🟢':'🔴'; if(syncBtn){ syncBtn.textContent='🔄'; syncBtn.disabled=false; } }
}

// ===== INITIALISATION =====
function initializeOfflineManager(){
  if(!userAuthenticationCompleted || !currentUser){ console.log("ℹ️ Gestionnaire en attente"); return; }
  createConnectionIndicator();
  checkFirebaseConnection();
  if(connectionCheckInterval) clearInterval(connectionCheckInterval);
  connectionCheckInterval=setInterval(checkFirebaseConnection,10000);
  if(emergencySaveInterval) clearInterval(emergencySaveInterval);
  emergencySaveInterval=setInterval(emergencyLocalSave,30000);
  setTimeout(()=>{ if(userAuthenticationCompleted && currentUser) loadEmergencyBackup(); },2000);
  setTimeout(()=>{ if(userAuthenticationCompleted && currentUser) waitAndRestoreEmergency(); },8000);
  window.addEventListener('beforeunload',()=>{ if(emergencySaveInterval) clearInterval(emergencySaveInterval); if(connectionCheckInterval) clearInterval(connectionCheckInterval); if(userAuthenticationCompleted && currentUser) emergencyLocalSave(); });
}

// ===== AUTHENTIFICATION UTILISATEUR =====
function setUserAuthenticated(authenticated=true){
  userAuthenticationCompleted=authenticated;
  if(authenticated && currentUser){ initializeOfflineManager(); }
  else{ cleanupOfflineManager(); }
}

// ===== NETTOYAGE =====
function cleanupOfflineManager(){
  if(emergencySaveInterval) { clearInterval(emergencySaveInterval); emergencySaveInterval=null; }
  if(connectionCheckInterval) { clearInterval(connectionCheckInterval); connectionCheckInterval=null; }
  const indicator=document.getElementById('connection-indicator'); if(indicator) indicator.remove();
  isOnline=false; lastSyncTimestamp=null; offlineDataPending=false;
}

// ===== EXPORTS =====
window.forceSyncToFirebase=forceSyncToFirebase;
window.emergencyLocalSave=emergencyLocalSave;
window.loadEmergencyBackup=loadEmergencyBackup;
window.clearOfflineData=()=>{ sessionStorage.removeItem('jsas_emergency_backup'); localStorage.removeItem('jsas_last_backup'); localStorage.removeItem('emergency_palanquee_details'); offlineDataPending=false; updateConnectionIndicator(isOnline); showNotification("🗑️ Données effacées","info"); };
window.getOfflineStats=()=>({ hasSessionBackup:!!sessionStorage.getItem('jsas_emergency_backup'), hasLocalBackup:!!localStorage.getItem('jsas_last_backup'), sessionBackupAge: sessionStorage.getItem('jsas_emergency_backup')?Date.now()-JSON.parse(sessionStorage.getItem('jsas_emergency_backup')).timestamp:null, localBackupAge: localStorage.getItem('jsas_last_backup')?Date.now()-JSON.parse(localStorage.getItem('jsas_last_backup')).timestamp:null, isOnline, lastSync:lastSyncTimestamp, pendingData:offlineDataPending });
window.setUserAuthenticated=setUserAuthenticated;
window.waitAndRestoreEmergency=waitAndRestoreEmergency;
