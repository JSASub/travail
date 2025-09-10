// password-manager.js - Gestionnaire de changement de mot de passe

// ===== INTERFACE DE CHANGEMENT DE MOT DE PASSE =====
function showPasswordChangeModal() {
  // Créer le modal s'il n'existe pas
  let modal = document.getElementById('password-change-modal');
  if (modal) {
    modal.remove();
  }
  
  modal = document.createElement('div');
  modal.id = 'password-change-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 10px;
      padding: 30px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    ">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="color: #004080; margin: 0; font-size: 24px;">🔐 Changer le mot de passe</h2>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
          Utilisateur : <strong>${currentUser?.email || 'Non connecté'}</strong>
        </p>
      </div>
      
      <form id="password-change-form">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
            🔒 Mot de passe actuel :
          </label>
          <input 
            type="password" 
            id="current-password" 
            required 
            style="
              width: 100%; 
              padding: 12px; 
              border: 2px solid #ddd; 
              border-radius: 6px; 
              font-size: 16px;
              box-sizing: border-box;
            "
            placeholder="Votre mot de passe actuel"
          />
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
            🆕 Nouveau mot de passe :
          </label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input 
              type="password" 
              id="new-password" 
              required 
              minlength="6"
              style="
                flex: 1;
                padding: 12px; 
                border: 2px solid #ddd; 
                border-radius: 6px; 
                font-size: 16px;
                box-sizing: border-box;
              "
              placeholder="Nouveau mot de passe (min. 6 caractères)"
            />
            <button 
              type="button" 
              onclick="showPasswordGeneratorSuggestion()" 
              style="
                padding: 12px; 
                background: #28a745; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                white-space: nowrap;
              "
              title="Générer un mot de passe sécurisé"
            >
              🎲 Générer
            </button>
          </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
            ✅ Confirmer le nouveau mot de passe :
          </label>
          <input 
            type="password" 
            id="confirm-password" 
            required 
            minlength="6"
            style="
              width: 100%; 
              padding: 12px; 
              border: 2px solid #ddd; 
              border-radius: 6px; 
              font-size: 16px;
              box-sizing: border-box;
            "
            placeholder="Confirmer le nouveau mot de passe"
          />
        </div>
        
        <div style="margin-bottom: 20px; text-align: center;">
          <label style="display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-size: 14px; color: #666;">
            <input type="checkbox" id="show-passwords" onchange="togglePasswordVisibility()" />
            👁️ Afficher les mots de passe
          </label>
        </div>
        
        <div id="password-change-message" style="
          margin-bottom: 20px; 
          padding: 10px; 
          border-radius: 5px; 
          display: none;
          text-align: center;
          font-weight: bold;
        "></div>
        
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button 
            type="button" 
            onclick="closePasswordChangeModal()" 
            style="
              padding: 12px 25px; 
              background: #6c757d; 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 16px;
              min-width: 100px;
            "
          >
            Annuler
          </button>
          <button 
            type="submit" 
            id="change-password-btn"
            style="
              padding: 12px 25px; 
              background: #007bff; 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 16px;
              min-width: 100px;
            "
          >
            🔄 Changer
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Ajouter les styles CSS pour les animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(modal);
  
  // Event listener pour le formulaire
  document.getElementById('password-change-form').addEventListener('submit', handlePasswordChange);
  
  // Focus sur le premier champ
  document.getElementById('current-password').focus();
  
  // Fermer avec Échap
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePasswordChangeModal();
    }
  });
  
  // Fermer en cliquant sur l'arrière-plan
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePasswordChangeModal();
    }
  });
}

function closePasswordChangeModal() {
  const modal = document.getElementById('password-change-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
  }
}

// ===== GESTION DU CHANGEMENT DE MOT DE PASSE =====
async function handlePasswordChange(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const messageDiv = document.getElementById('password-change-message');
  const changeBtn = document.getElementById('change-password-btn');
  
  // Validation côté client
  if (!currentPassword || !newPassword || !confirmPassword) {
    showPasswordMessage("⚠️ Veuillez remplir tous les champs", "error");
    return;
  }
  
  if (newPassword.length < 6) {
    showPasswordMessage("⚠️ Le nouveau mot de passe doit contenir au moins 6 caractères", "error");
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showPasswordMessage("⚠️ Les nouveaux mots de passe ne correspondent pas", "error");
    return;
  }
  
  if (currentPassword === newPassword) {
    showPasswordMessage("⚠️ Le nouveau mot de passe doit être différent de l'ancien", "error");
    return;
  }
  
  // Vérification de sécurité du mot de passe
  const passwordStrength = checkPasswordStrength(newPassword);
  if (passwordStrength.score < 2) {
    const confirmWeak = confirm(
      `⚠️ Mot de passe peu sécurisé !\n\n` +
      `Problèmes détectés :\n${passwordStrength.issues.join('\n')}\n\n` +
      `Recommandations :\n${passwordStrength.suggestions.join('\n')}\n\n` +
      `Voulez-vous continuer malgré tout ?`
    );
    
    if (!confirmWeak) {
      return;
    }
  }
  
  try {
    // Désactiver le bouton et afficher le chargement
    changeBtn.disabled = true;
    changeBtn.textContent = "🔄 Changement...";
    showPasswordMessage("🔄 Changement du mot de passe en cours...", "info");
    
    // Vérifier que l'utilisateur est connecté
    if (!currentUser) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Ré-authentifier l'utilisateur avec son mot de passe actuel
    const credential = firebase.auth.EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    
    await currentUser.reauthenticateWithCredential(credential);
    console.log("✅ Ré-authentification réussie");
    
    // Changer le mot de passe
    await currentUser.updatePassword(newPassword);
    console.log("✅ Mot de passe changé avec succès");
    
    // Succès
    showPasswordMessage("✅ Mot de passe changé avec succès !", "success");
    
    // Notification système
    if (typeof showNotification === 'function') {
      showNotification("🔐 Mot de passe mis à jour avec succès", "success");
    }
    
    // Fermer le modal après 2 secondes
    setTimeout(() => {
      closePasswordChangeModal();
    }, 2000);
    
  } catch (error) {
    console.error("❌ Erreur changement mot de passe:", error);
    
    let errorMessage = "❌ Erreur lors du changement de mot de passe";
    
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = "❌ Mot de passe actuel incorrect";
        break;
      case 'auth/weak-password':
        errorMessage = "❌ Le nouveau mot de passe est trop faible";
        break;
      case 'auth/requires-recent-login':
        errorMessage = "❌ Veuillez vous reconnecter avant de changer votre mot de passe";
        break;
      case 'auth/network-request-failed':
        errorMessage = "❌ Problème de connexion réseau";
        break;
      case 'auth/too-many-requests':
        errorMessage = "❌ Trop de tentatives. Réessayez plus tard";
        break;
      default:
        if (error.message) {
          errorMessage = `❌ ${error.message}`;
        }
    }
    
    showPasswordMessage(errorMessage, "error");
    
  } finally {
    // Réactiver le bouton
    changeBtn.disabled = false;
    changeBtn.textContent = "🔄 Changer";
  }
}

function showPasswordMessage(message, type) {
  const messageDiv = document.getElementById('password-change-message');
  if (!messageDiv) return;
  
  messageDiv.style.display = 'block';
  messageDiv.textContent = message;
  
  // Couleurs selon le type
  switch (type) {
    case 'success':
      messageDiv.style.background = '#d4edda';
      messageDiv.style.color = '#155724';
      messageDiv.style.border = '1px solid #c3e6cb';
      break;
    case 'error':
      messageDiv.style.background = '#f8d7da';
      messageDiv.style.color = '#721c24';
      messageDiv.style.border = '1px solid #f5c6cb';
      break;
    case 'info':
      messageDiv.style.background = '#d1ecf1';
      messageDiv.style.color = '#0c5460';
      messageDiv.style.border = '1px solid #bee5eb';
      break;
    case 'warning':
      messageDiv.style.background = '#fff3cd';
      messageDiv.style.color = '#856404';
      messageDiv.style.border = '1px solid #ffeaa7';
      break;
  }
}

// ===== VÉRIFICATION DE LA FORCE DU MOT DE PASSE =====
function checkPasswordStrength(password) {
  const issues = [];
  const suggestions = [];
  let score = 0;
  
  // Longueur
  if (password.length >= 8) {
    score += 1;
  } else {
    issues.push("• Trop court (moins de 8 caractères)");
    suggestions.push("• Utilisez au moins 8 caractères");
  }
  
  // Majuscules
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    issues.push("• Aucune majuscule");
    suggestions.push("• Ajoutez au moins une majuscule");
  }
  
  // Minuscules
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    issues.push("• Aucune minuscule");
    suggestions.push("• Ajoutez au moins une minuscule");
  }
  
  // Chiffres
  if (/\d/.test(password)) {
    score += 1;
  } else {
    issues.push("• Aucun chiffre");
    suggestions.push("• Ajoutez au moins un chiffre");
  }
  
  // Caractères spéciaux
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    issues.push("• Aucun caractère spécial");
    suggestions.push("• Ajoutez des caractères spéciaux (!@#$%...)");
  }
  
  // Mots de passe communs (quelques exemples)
  const commonPasswords = ['password', '123456', 'azerty', 'qwerty', 'admin', 'jsas'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score -= 2;
    issues.push("• Contient un mot de passe commun");
    suggestions.push("• Évitez les mots de passe courants");
  }
  
  return {
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

// ===== FONCTIONS UTILITAIRES =====
function togglePasswordVisibility() {
  const checkbox = document.getElementById('show-passwords');
  const currentPassword = document.getElementById('current-password');
  const newPassword = document.getElementById('new-password');
  const confirmPassword = document.getElementById('confirm-password');
  
  const type = checkbox.checked ? 'text' : 'password';
  
  if (currentPassword) currentPassword.type = type;
  if (newPassword) newPassword.type = type;
  if (confirmPassword) confirmPassword.type = type;
}

function generateStrongPassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Garantir au moins un caractère de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

function showPasswordGeneratorSuggestion() {
  const suggested = generateStrongPassword();
  const useGenerated = confirm(
    `🔐 Suggestion de mot de passe sécurisé :\n\n${suggested}\n\n` +
    `Voulez-vous utiliser ce mot de passe ?\n\n` +
    `⚠️ Notez-le bien quelque part de sûr !`
  );
  
  if (useGenerated) {
    document.getElementById('new-password').value = suggested;
    document.getElementById('confirm-password').value = suggested;
    
    // Copier dans le presse-papier si possible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(suggested).then(() => {
        showPasswordMessage("📋 Mot de passe copié dans le presse-papier", "success");
      });
    }
  }
}

// ===== EXPORT DES FONCTIONS =====
window.showPasswordChangeModal = showPasswordChangeModal;
window.closePasswordChangeModal = closePasswordChangeModal;
window.showPasswordGeneratorSuggestion = showPasswordGeneratorSuggestion;

console.log("🔐 Gestionnaire de mot de passe chargé");