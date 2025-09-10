// ps/password-manager.js
// Module de gestion du changement de mot de passe
// Corrigé pour éviter l'erreur 404 en cas de mot de passe incorrect

(function() {
    'use strict';

    /**
     * Afficher la modal de changement de mot de passe
     */
    function showPasswordChangeModal() {
        // Créer la modal si elle n'existe pas
        if (!document.getElementById('password-change-modal')) {
            createPasswordChangeModal();
        }
        
        const modal = document.getElementById('password-change-modal');
        modal.style.display = 'flex';
        
        // Vider les champs et messages
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
        clearPasswordMessages();
        
        // Focus sur le premier champ
        setTimeout(() => {
            document.getElementById('current-password').focus();
        }, 100);
    }

    /**
     * Créer la modal de changement de mot de passe
     */
    function createPasswordChangeModal() {
        const modalHTML = `
            <div id="password-change-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0; color: #004080;">🔒 Changer le mot de passe</h3>
                        <button onclick="hidePasswordChangeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    
                    <form id="password-change-form" onsubmit="return false;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Mot de passe actuel :</label>
                            <input type="password" id="current-password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nouveau mot de passe :</label>
                            <input type="password" id="new-password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
                            <small style="color: #666; font-size: 12px;">Minimum 6 caractères</small>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Confirmer le nouveau mot de passe :</label>
                            <input type="password" id="confirm-new-password" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
                        </div>
                        
                        <div id="password-change-message" style="margin-bottom: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="hidePasswordChangeModal()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Annuler
                            </button>
                            <button type="button" onclick="changePassword()" id="change-password-submit" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Changer le mot de passe
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Ajouter la gestion de la touche Échap
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hidePasswordChangeModal();
            }
        });
        
        // Ajouter la validation en temps réel
        document.getElementById('confirm-new-password').addEventListener('input', validatePasswordMatch);
    }

    /**
     * Masquer la modal de changement de mot de passe
     */
    function hidePasswordChangeModal() {
        const modal = document.getElementById('password-change-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Valider que les mots de passe correspondent
     */
    function validatePasswordMatch() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        const confirmField = document.getElementById('confirm-new-password');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmField.style.borderColor = '#dc3545';
        } else {
            confirmField.style.borderColor = '#ddd';
        }
    }

    /**
     * Afficher un message dans la modal
     */
    function showPasswordMessage(message, type = 'info') {
        const messageDiv = document.getElementById('password-change-message');
        if (!messageDiv) return;
        
        messageDiv.style.display = 'block';
        messageDiv.innerHTML = message;
        
        // Appliquer le style selon le type
        switch(type) {
            case 'success':
                messageDiv.style.backgroundColor = '#d4edda';
                messageDiv.style.color = '#155724';
                messageDiv.style.borderColor = '#c3e6cb';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.style.borderColor = '#f5c6cb';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#fff3cd';
                messageDiv.style.color = '#856404';
                messageDiv.style.borderColor = '#ffeaa7';
                break;
            default:
                messageDiv.style.backgroundColor = '#d1ecf1';
                messageDiv.style.color = '#0c5460';
                messageDiv.style.borderColor = '#bee5eb';
        }
    }

    /**
     * Effacer les messages d'erreur
     */
    function clearPasswordMessages() {
        const messageDiv = document.getElementById('password-change-message');
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.innerHTML = '';
        }
    }

    /**
     * Changer le mot de passe - VERSION CORRIGÉE
     */
    function changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        const submitButton = document.getElementById('change-password-submit');
        
        // Validation côté client
        if (!currentPassword || !newPassword || !confirmPassword) {
            showPasswordMessage('Veuillez remplir tous les champs.', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showPasswordMessage('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showPasswordMessage('Les nouveaux mots de passe ne correspondent pas.', 'error');
            return;
        }
        
        if (currentPassword === newPassword) {
            showPasswordMessage('Le nouveau mot de passe doit être différent de l\'actuel.', 'error');
            return;
        }
        
        // Désactiver le bouton et afficher le chargement
        submitButton.disabled = true;
        submitButton.innerHTML = 'Changement en cours...';
        showPasswordMessage('Vérification du mot de passe actuel...', 'info');
        
        // Obtenir l'utilisateur actuel
        const user = firebase.auth().currentUser;
        if (!user) {
            showPasswordMessage('Erreur : utilisateur non connecté. Veuillez vous reconnecter.', 'error');
            resetSubmitButton();
            return;
        }
        
        // Créer les credentials pour la ré-authentification
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        
        // ÉTAPE 1: Ré-authentifier l'utilisateur avec le mot de passe actuel
        user.reauthenticateWithCredential(credential)
            .then(function() {
                console.log('Ré-authentification réussie');
                showPasswordMessage('Mot de passe actuel vérifié. Mise à jour...', 'info');
                
                // ÉTAPE 2: Changer le mot de passe
                return user.updatePassword(newPassword);
            })
            .then(function() {
                console.log('Mot de passe changé avec succès');
                showPasswordMessage('✅ Mot de passe changé avec succès !', 'success');
                
                // Fermer la modal après 2 secondes
                setTimeout(() => {
                    hidePasswordChangeModal();
                }, 2000);
            })
            .catch(function(error) {
                console.error('Erreur lors du changement de mot de passe:', error);
                handlePasswordChangeError(error);
            })
            .finally(function() {
                resetSubmitButton();
            });
    }

    /**
     * Gérer les erreurs de changement de mot de passe
     */
    function handlePasswordChangeError(error) {
        let errorMessage = 'Erreur lors du changement de mot de passe.';
        
        switch(error.code) {
            case 'auth/wrong-password':
                errorMessage = '❌ Le mot de passe actuel est incorrect.';
                // Mettre en évidence le champ du mot de passe actuel
                document.getElementById('current-password').style.borderColor = '#dc3545';
                document.getElementById('current-password').focus();
                break;
                
            case 'auth/weak-password':
                errorMessage = '❌ Le nouveau mot de passe est trop faible. Utilisez au moins 6 caractères.';
                document.getElementById('new-password').style.borderColor = '#dc3545';
                document.getElementById('new-password').focus();
                break;
                
            case 'auth/requires-recent-login':
                errorMessage = '❌ Votre session a expiré. Veuillez vous reconnecter et réessayer.';
                // Optionnel : rediriger vers la page de connexion
                setTimeout(() => {
                    if (confirm('Votre session a expiré. Voulez-vous vous reconnecter ?')) {
                        firebase.auth().signOut();
                    }
                }, 2000);
                break;
                
            case 'auth/network-request-failed':
                errorMessage = '❌ Problème de connexion réseau. Vérifiez votre connexion internet.';
                break;
                
            case 'auth/too-many-requests':
                errorMessage = '❌ Trop de tentatives. Veuillez patienter avant de réessayer.';
                break;
                
            default:
                errorMessage = `❌ Erreur : ${error.message}`;
                console.error('Code d\'erreur non géré:', error.code);
        }
        
        showPasswordMessage(errorMessage, 'error');
    }

    /**
     * Réinitialiser le bouton de soumission
     */
    function resetSubmitButton() {
        const submitButton = document.getElementById('change-password-submit');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Changer le mot de passe';
        }
        
        // Réinitialiser les couleurs des bordures
        setTimeout(() => {
            const fields = ['current-password', 'new-password', 'confirm-new-password'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.style.borderColor = '#ddd';
                }
            });
        }, 3000);
    }

    /**
     * Initialisation du module
     */
    function initPasswordManager() {
        console.log('Module password-manager initialisé');
        
        // Vérifier que Firebase est disponible
        if (typeof firebase === 'undefined') {
            console.error('Firebase n\'est pas chargé pour le password-manager');
            return;
        }
        
        // Le module est prêt
        console.log('Password manager prêt');
    }

    // Exposer les fonctions publiques
    window.showPasswordChangeModal = showPasswordChangeModal;
    window.hidePasswordChangeModal = hidePasswordChangeModal;
    window.changePassword = changePassword;

    // Auto-initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPasswordManager);
    } else {
        initPasswordManager();
    }

})();