// whatsapp-share.js - Module de partage WhatsApp pour JSAS

/**
 * Module de partage WhatsApp pour les palanquées JSAS
 * Génère le PDF et ouvre WhatsApp avec un message pré-rempli
 */

// Configuration par défaut
const WHATSAPP_CONFIG = {
  defaultGroupId: '', // À remplir avec l'ID du groupe par défaut
  defaultMessage: 'Voici les palanquées JSAS du {date} - Session {session} à {lieu}',
  shareOptions: {
    includeStats: true,
    includeAlerts: true,
    autoDownload: true
  }
};

/**
 * Génère le PDF et ouvre WhatsApp pour partage
 * @param {string} target - 'group' ou numéro de téléphone
 * @param {Object} options - Options de partage
 */
function shareToWhatsApp(target = 'group', options = {}) {
  console.log("📱 Initialisation du partage WhatsApp...");
  
  try {
    // Récupération des données de la session
    const dpSelect = document.getElementById("dp-select");
    const dpNom = dpSelect && dpSelect.selectedIndex > 0 ? dpSelect.options[dpSelect.selectedIndex].text : "Non défini";
    const dpDate = document.getElementById("dp-date")?.value || formatDateFrench(new Date());
    const dpLieu = document.getElementById("dp-lieu")?.value || "Non défini";
    const dpPlongee = document.getElementById("dp-plongee")?.value || "matin";
    
    // Statistiques
    const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
    const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];
    const totalPlongeurs = plongeursLocal.length + palanqueesLocal.reduce((total, pal) => total + (pal?.length || 0), 0);
    const alertesTotal = typeof checkAllAlerts === 'function' ? checkAllAlerts() : [];
    
    // Construction du message WhatsApp
    let message = WHATSAPP_CONFIG.defaultMessage
      .replace('{date}', formatDateFrench(dpDate))
      .replace('{session}', capitalize(dpPlongee))
      .replace('{lieu}', dpLieu);
    
    // Ajout des statistiques si demandé
    if (WHATSAPP_CONFIG.shareOptions.includeStats) {
      message += `\n\n📊 RÉSUMÉ:`;
      message += `\n• ${totalPlongeurs} plongeurs`;
      message += `\n• ${palanqueesLocal.length} palanquées`;
      message += `\n• DP: ${dpNom}`;
    }
    
    // Ajout des alertes si présentes
    if (WHATSAPP_CONFIG.shareOptions.includeAlerts && alertesTotal.length > 0) {
      message += `\n\n⚠️ ALERTES (${alertesTotal.length}):`;
      alertesTotal.slice(0, 3).forEach(alerte => {
        message += `\n• ${alerte}`;
      });
      if (alertesTotal.length > 3) {
        message += `\n• ... et ${alertesTotal.length - 3} autres`;
      }
    }
    
    message += `\n\n📎 Le PDF des palanquées sera joint manuellement à ce message.`;
    
    // Génération du PDF en arrière-plan si demandé
    if (WHATSAPP_CONFIG.shareOptions.autoDownload) {
      console.log("📄 Génération automatique du PDF...");
      
      // Utiliser la fonction existante pour générer le PDF
      if (typeof exportToPDF === 'function') {
        exportToPDF();
      } else {
        console.warn("⚠️ Fonction exportToPDF non disponible");
      }
    }
    
    // Construction de l'URL WhatsApp
    let whatsappUrl;
    const encodedMessage = encodeURIComponent(message);
    
    if (target === 'group' && WHATSAPP_CONFIG.defaultGroupId) {
      // Partage vers un groupe spécifique (nécessite l'ID du groupe)
      whatsappUrl = `https://chat.whatsapp.com/${WHATSAPP_CONFIG.defaultGroupId}?text=${encodedMessage}`;
    } else if (target !== 'group' && target.match(/^[\d+]+$/)) {
      // Partage vers un numéro spécifique
      whatsappUrl = `https://wa.me/${target}?text=${encodedMessage}`;
    } else {
      // Partage général (l'utilisateur choisira le contact)
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }
    
    // Ouverture de WhatsApp
    console.log("🚀 Ouverture de WhatsApp...");
    window.open(whatsappUrl, '_blank');
    
    // Message de confirmation
    const confirmMessage = `✅ WhatsApp ouvert avec le message pré-rempli !

📱 Étapes suivantes :
1. Le PDF a été téléchargé automatiquement
2. Dans WhatsApp, cliquez sur le trombone 📎
3. Sélectionnez "Document" et joignez le PDF
4. Envoyez le message

📊 Résumé partagé : ${totalPlongeurs} plongeurs, ${palanqueesLocal.length} palanquées${alertesTotal.length > 0 ? `, ${alertesTotal.length} alertes` : ''}`;
    
    // Affichage avec délai pour laisser le temps au PDF de se générer
    setTimeout(() => {
      alert(confirmMessage);
    }, 1000);
    
  } catch (error) {
    console.error("❌ Erreur partage WhatsApp:", error);
    alert("Erreur lors du partage WhatsApp : " + error.message);
  }
}

/**
 * Configure le partage WhatsApp (ID de groupe, message par défaut, etc.)
 */
function configureWhatsAppShare(config = {}) {
  Object.assign(WHATSAPP_CONFIG, config);
  console.log("⚙️ Configuration WhatsApp mise à jour:", WHATSAPP_CONFIG);
}

/**
 * Interface utilisateur pour sélectionner le destinataire WhatsApp
 */
function showWhatsAppShareModal() {
  const modal = document.createElement('div');
  modal.id = 'whatsapp-share-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 25px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    ">
      <h3 style="margin: 0 0 20px 0; color: #25D366; text-align: center;">
        📱 Partager sur WhatsApp
      </h3>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Destination :</label>
        <select id="whatsapp-target" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="general">💬 Choisir le contact dans WhatsApp</option>
          <option value="group">👥 Groupe JSAS (si configuré)</option>
          <option value="custom">📞 Numéro spécifique</option>
        </select>
      </div>
      
      <div id="custom-number-div" style="display: none; margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Numéro (format international) :</label>
        <input type="tel" id="custom-number" placeholder="33123456789" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="auto-download" checked>
          <span>📄 Télécharger automatiquement le PDF</span>
        </label>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="closeWhatsAppModal()" style="
          padding: 10px 20px;
          background: #ccc;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">
          Annuler
        </button>
        <button onclick="executeWhatsAppShare()" style="
          padding: 10px 20px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">
          📱 Partager
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Gestion du select pour afficher/masquer le champ numéro
  document.getElementById('whatsapp-target').addEventListener('change', function() {
    const customDiv = document.getElementById('custom-number-div');
    customDiv.style.display = this.value === 'custom' ? 'block' : 'none';
  });
}

/**
 * Exécute le partage WhatsApp depuis la modal
 */
function executeWhatsAppShare() {
  const target = document.getElementById('whatsapp-target').value;
  const customNumber = document.getElementById('custom-number').value;
  const autoDownload = document.getElementById('auto-download').checked;
  
  // Mise à jour de la configuration pour ce partage
  WHATSAPP_CONFIG.shareOptions.autoDownload = autoDownload;
  
  let destination;
  switch(target) {
    case 'custom':
      if (!customNumber || !customNumber.match(/^[\d+]+$/)) {
        alert('Veuillez saisir un numéro valide (format international, ex: 33123456789)');
        return;
      }
      destination = customNumber;
      break;
    case 'group':
      destination = 'group';
      break;
    default:
      destination = 'general';
  }
  
  closeWhatsAppModal();
  shareToWhatsApp(destination);
}

/**
 * Ferme la modal de partage WhatsApp
 */
function closeWhatsAppModal() {
  const modal = document.getElementById('whatsapp-share-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Fonction utilitaire pour formater les dates
 */
function formatDateFrench(dateInput) {
  let date;
  if (typeof dateInput === 'string') {
    date = dateInput ? new Date(dateInput) : new Date();
  } else {
    date = dateInput;
  }
  
  try {
    return date.toLocaleDateString('fr-FR');
  } catch (error) {
    return date.toString();
  }
}

/**
 * Fonction utilitaire pour capitaliser
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Initialisation du module WhatsApp
 */
function initWhatsAppShare() {
  console.log("📱 Module WhatsApp Share initialisé");
  
  // Configuration par défaut pour JSAS
  configureWhatsAppShare({
    defaultMessage: '🤿 Palanquées JSAS du {date}\n📍 {lieu} - Session {session}\n\nDP: ' + (document.getElementById("dp-select")?.selectedOptions[0]?.textContent || 'N/A'),
    shareOptions: {
      includeStats: true,
      includeAlerts: true,
      autoDownload: true
    }
  });
}

// Export des fonctions pour usage global
window.shareToWhatsApp = shareToWhatsApp;
window.showWhatsAppShareModal = showWhatsAppShareModal;
window.closeWhatsAppModal = closeWhatsAppModal;
window.executeWhatsAppShare = executeWhatsAppShare;
window.configureWhatsAppShare = configureWhatsAppShare;
window.initWhatsAppShare = initWhatsAppShare;

// Initialisation automatique
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhatsAppShare);
} else {
  initWhatsAppShare();
}

console.log("📱 Module WhatsApp Share JSAS chargé et prêt");