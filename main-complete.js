// main-complete.js - Application principale ultra-sécurisée (VERSION MODIFIÉE SESSIONS)

// Mode production - logs réduits
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('🔄') || args[0].includes('✅') || args[0].includes('❌'))) {
            originalConsoleLog.apply(console, args);
        }
    };
}

// Vérifier que les variables globales existent
const plongeursLocal = typeof plongeurs !== 'undefined' ? plongeurs : [];
const palanqueesLocal = typeof palanquees !== 'undefined' ? palanquees : [];

// === EN-TÊTE PRINCIPAL ===

// Gestion des états globaux
let currentDP = '';
let currentDate = '';
let currentLocation = '';
let sessions = [];
let plongeurs = [];
let palanquees = [];
let dpHistory = {};

// Variables globales pour la gestion des mots de passe
let isPasswordProtected = false;
let passwordHash = '';

console.log('🔄 Démarrage de l\'application principale...');

// === GESTION DES SESSIONS ===

function generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
}

async function saveSessionData() {
    console.log('🔄 Sauvegarde session initiée...');
    
    // Validation des champs obligatoires
    if (!currentDP || !currentDate || !currentLocation) {
        showAlert('❌ Veuillez renseigner DP, date et lieu avant de sauvegarder.', 'error');
        return false;
    }
    
    if (palanquees.length === 0) {
        showAlert('❌ Aucune palanquée à sauvegarder.', 'error');
        return false;
    }
    
    try {
        // Préparer les données de session
        const sessionData = {
            id: generateSessionId(),
            dp: currentDP,
            date: currentDate,
            location: currentLocation,
            palanquees: JSON.parse(JSON.stringify(palanquees)),
            plongeurs: JSON.parse(JSON.stringify(plongeurs)),
            timestamp: new Date().toISOString(),
            stats: {
                totalPalanquees: palanquees.length,
                totalPlongeurs: plongeurs.length,
                niveaux: getNiveauxStats()
            }
        };
        
        // Ajouter à la liste des sessions
        sessions.unshift(sessionData);
        
        // Limiter à 50 sessions max
        if (sessions.length > 50) {
            sessions = sessions.slice(0, 50);
        }
        
        // Sauvegarder localement
        localStorage.setItem('diving_sessions', JSON.stringify(sessions));
        
        // Sauvegarder en ligne si disponible
        if (typeof saveOnlineSession === 'function') {
            try {
                await saveOnlineSession(sessionData);
                console.log('✅ Session sauvegardée en ligne');
            } catch (error) {
                console.log('⚠️ Erreur sauvegarde en ligne:', error.message);
            }
        }
        
        console.log('✅ Session sauvegardée avec succès');
        showAlert(`✅ Session sauvegardée avec succès ! (${palanquees.length} palanquées)`, 'success');
        
        // Rafraîchir les listes
        setTimeout(() => {
            loadAndDisplaySessions();
        }, 500);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showAlert('❌ Erreur lors de la sauvegarde de la session.', 'error');
        return false;
    }
}

function getNiveauxStats() {
    const niveaux = {};
    plongeurs.forEach(plongeur => {
        if (plongeur.niveau) {
            niveaux[plongeur.niveau] = (niveaux[plongeur.niveau] || 0) + 1;
        }
    });
    return niveaux;
}

function loadSessions() {
    try {
        const savedSessions = localStorage.getItem('diving_sessions');
        if (savedSessions) {
            sessions = JSON.parse(savedSessions);
            console.log(`✅ ${sessions.length} sessions chargées`);
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des sessions:', error);
        sessions = [];
    }
}

async function loadAndDisplaySessions() {
    loadSessions();
    
    // Charger aussi les sessions en ligne si disponible
    if (typeof loadOnlineSessions === 'function') {
        try {
            const onlineSessions = await loadOnlineSessions();
            if (onlineSessions && onlineSessions.length > 0) {
                // Fusionner avec les sessions locales (éviter les doublons)
                const existingIds = new Set(sessions.map(s => s.id));
                const newOnlineSessions = onlineSessions.filter(s => !existingIds.has(s.id));
                sessions = [...sessions, ...newOnlineSessions];
                sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Limiter à 50 sessions
                if (sessions.length > 50) {
                    sessions = sessions.slice(0, 50);
                }
                
                localStorage.setItem('diving_sessions', JSON.stringify(sessions));
                console.log(`✅ ${newOnlineSessions.length} nouvelles sessions en ligne ajoutées`);
            }
        } catch (error) {
            console.log('⚠️ Erreur chargement sessions en ligne:', error.message);
        }
    }
    
    displaySessions();
}

function displaySessions() {
    const container = document.getElementById('sessionsContainer');
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Aucune session sauvegardée</p>';
        return;
    }
    
    let html = '<div class="sessions-list">';
    
    sessions.forEach((session, index) => {
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString('fr-FR');
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div class="session-item" data-session-id="${session.id}">
                <div class="session-header">
                    <h3>📋 ${session.dp} - ${session.location}</h3>
                    <div class="session-meta">
                        <span class="session-date">📅 ${session.date}</span>
                        <span class="session-time">🕒 ${dateStr} ${timeStr}</span>
                    </div>
                </div>
                <div class="session-stats">
                    <span class="stat-item">👥 ${session.stats.totalPlongeurs} plongeurs</span>
                    <span class="stat-item">🏊 ${session.stats.totalPalanquees} palanquées</span>
                </div>
                <div class="session-actions">
                    <button onclick="loadSession('${session.id}')" class="btn-load">📂 Charger</button>
                    <button onclick="viewSession('${session.id}')" class="btn-view">👁️ Voir</button>
                    <button onclick="deleteSession('${session.id}')" class="btn-delete">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function loadSession(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        showAlert('❌ Session introuvable', 'error');
        return;
    }
    
    try {
        // Charger les données de la session
        currentDP = session.dp;
        currentDate = session.date;
        currentLocation = session.location;
        plongeurs = JSON.parse(JSON.stringify(session.plongeurs));
        palanquees = JSON.parse(JSON.stringify(session.palanquees));
        
        // Mettre à jour l'interface
        document.getElementById('dpInput').value = currentDP;
        document.getElementById('dateInput').value = currentDate;
        document.getElementById('locationInput').value = currentLocation;
        
        // Rafraîchir les affichages
        if (typeof displayPlongeurs === 'function') displayPlongeurs();
        if (typeof displayPalanquees === 'function') displayPalanquees();
        if (typeof updateCurrentInfo === 'function') updateCurrentInfo();
        
        showAlert(`✅ Session chargée : ${session.dp} - ${session.location}`, 'success');
        console.log(`✅ Session ${sessionId} chargée avec succès`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la session:', error);
        showAlert('❌ Erreur lors du chargement de la session', 'error');
    }
}

function viewSession(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        showAlert('❌ Session introuvable', 'error');
        return;
    }
    
    // Créer une modal pour afficher la session
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content session-view-modal">
            <div class="modal-header">
                <h2>📋 ${session.dp} - ${session.location}</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">✕</button>
            </div>
            <div class="modal-body">
                <div class="session-info">
                    <p><strong>📅 Date de plongée :</strong> ${session.date}</p>
                    <p><strong>🕒 Sauvegardée le :</strong> ${new Date(session.timestamp).toLocaleString('fr-FR')}</p>
                    <p><strong>👥 Plongeurs :</strong> ${session.stats.totalPlongeurs}</p>
                    <p><strong>🏊 Palanquées :</strong> ${session.stats.totalPalanquees}</p>
                </div>
                <div class="palanquees-list">
                    <h3>🏊 Palanquées</h3>
                    ${session.palanquees.map((palanquee, index) => `
                        <div class="palanquee-item">
                            <h4>Palanquée ${index + 1}</h4>
                            <div class="plongeurs-in-palanquee">
                                ${palanquee.plongeurs.map(plongeurId => {
                                    const plongeur = session.plongeurs.find(p => p.id === plongeurId);
                                    return plongeur ? `
                                        <span class="plongeur-tag">
                                            ${plongeur.nom} ${plongeur.prenom} 
                                            <span class="niveau">${plongeur.niveau}</span>
                                        </span>
                                    ` : '';
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function deleteSession(sessionId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
        return;
    }
    
    try {
        // Supprimer de la liste
        sessions = sessions.filter(s => s.id !== sessionId);
        
        // Sauvegarder
        localStorage.setItem('diving_sessions', JSON.stringify(sessions));
        
        // Supprimer en ligne si disponible
        if (typeof deleteOnlineSession === 'function') {
            deleteOnlineSession(sessionId).catch(error => {
                console.log('⚠️ Erreur suppression en ligne:', error.message);
            });
        }
        
        // Rafraîchir l'affichage
        displaySessions();
        
        showAlert('✅ Session supprimée avec succès', 'success');
        console.log(`✅ Session ${sessionId} supprimée`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showAlert('❌ Erreur lors de la suppression de la session', 'error');
    }
}

// === GESTION DES ALERTES ===

function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = `
        <span class="alert-message">${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-suppression après la durée spécifiée
    setTimeout(() => {
        if (alertElement.parentElement) {
            alertElement.remove();
        }
    }, duration);
}

// === GESTION DES PLONGEURS ===

function addPlongeur() {
    const nom = document.getElementById('nomInput').value.trim();
    const prenom = document.getElementById('prenomInput').value.trim();
    const niveau = document.getElementById('niveauSelect').value;
    
    if (!nom || !prenom || !niveau) {
        showAlert('❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Vérifier les doublons
    const exists = plongeurs.some(p => 
        p.nom.toLowerCase() === nom.toLowerCase() && 
        p.prenom.toLowerCase() === prenom.toLowerCase()
    );
    
    if (exists) {
        showAlert('❌ Ce plongeur existe déjà', 'error');
        return;
    }
    
    const nouveauPlongeur = {
        id: generateId(),
        nom: nom,
        prenom: prenom,
        niveau: niveau,
        createdAt: new Date().toISOString()
    };
    
    plongeurs.push(nouveauPlongeur);
    
    // Vider les champs
    document.getElementById('nomInput').value = '';
    document.getElementById('prenomInput').value = '';
    document.getElementById('niveauSelect').value = '';
    
    displayPlongeurs();
    updateCurrentInfo();
    showAlert(`✅ Plongeur ajouté : ${nom} ${prenom}`, 'success');
    
    console.log(`✅ Plongeur ajouté: ${nom} ${prenom} (${niveau})`);
}

function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function removePlongeur(plongeurId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plongeur ?')) {
        return;
    }
    
    // Retirer le plongeur de toutes les palanquées
    palanquees.forEach(palanquee => {
        palanquee.plongeurs = palanquee.plongeurs.filter(id => id !== plongeurId);
    });
    
    // Supprimer les palanquées vides
    palanquees = palanquees.filter(palanquee => palanquee.plongeurs.length > 0);
    
    // Supprimer le plongeur
    const plongeur = plongeurs.find(p => p.id === plongeurId);
    plongeurs = plongeurs.filter(p => p.id !== plongeurId);
    
    displayPlongeurs();
    displayPalanquees();
    updateCurrentInfo();
    
    if (plongeur) {
        showAlert(`✅ Plongeur supprimé : ${plongeur.nom} ${plongeur.prenom}`, 'success');
    }
}

function displayPlongeurs() {
    const container = document.getElementById('plongeursContainer');
    if (!container) return;
    
    if (plongeurs.length === 0) {
        container.innerHTML = '<p style="color: #666;">Aucun plongeur ajouté</p>';
        return;
    }
    
    // Trier par nom puis prénom
    const plongeursTries = [...plongeurs].sort((a, b) => {
        const nomA = a.nom.toLowerCase();
        const nomB = b.nom.toLowerCase();
        if (nomA !== nomB) return nomA.localeCompare(nomB);
        return a.prenom.toLowerCase().localeCompare(b.prenom.toLowerCase());
    });
    
    let html = '<div class="plongeurs-list">';
    plongeursTries.forEach(plongeur => {
        const isInPalanquee = palanquees.some(p => p.plongeurs.includes(plongeur.id));
        const statusClass = isInPalanquee ? 'assigned' : 'available';
        
        html += `
            <div class="plongeur-item ${statusClass}" data-plongeur-id="${plongeur.id}">
                <div class="plongeur-info">
                    <span class="plongeur-nom">${plongeur.nom} ${plongeur.prenom}</span>
                    <span class="plongeur-niveau niveau-${plongeur.niveau.toLowerCase().replace(/\s+/g, '-')}">${plongeur.niveau}</span>
                </div>
                <div class="plongeur-actions">
                    <button onclick="removePlongeur('${plongeur.id}')" class="btn-remove" title="Supprimer">🗑️</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// === GESTION DES PALANQUÉES ===

function createPalanquee() {
    const selectedPlongeurs = getSelectedPlongeurs();
    
    if (selectedPlongeurs.length < 2) {
        showAlert('❌ Sélectionnez au moins 2 plongeurs pour créer une palanquée', 'error');
        return;
    }
    
    if (selectedPlongeurs.length > 4) {
        showAlert('❌ Maximum 4 plongeurs par palanquée', 'error');
        return;
    }
    
    // Vérifier que les plongeurs ne sont pas déjà dans une palanquée
    const plongeursDejaAssignes = selectedPlongeurs.filter(plongeurId => 
        palanquees.some(p => p.plongeurs.includes(plongeurId))
    );
    
    if (plongeursDejaAssignes.length > 0) {
        const nomsAssignes = plongeursDejaAssignes.map(id => {
            const plongeur = plongeurs.find(p => p.id === id);
            return plongeur ? `${plongeur.nom} ${plongeur.prenom}` : 'Inconnu';
        });
        showAlert(`❌ Ces plongeurs sont déjà dans une palanquée : ${nomsAssignes.join(', ')}`, 'error');
        return;
    }
    
    const nouvellePalanquee = {
        id: generateId(),
        plongeurs: selectedPlongeurs,
        createdAt: new Date().toISOString()
    };
    
    palanquees.push(nouvellePalanquee);
    
    // Déselectionner tous les plongeurs
    clearPlongeurSelection();
    
    displayPlongeurs();
    displayPalanquees();
    updateCurrentInfo();
    
    showAlert(`✅ Palanquée créée avec ${selectedPlongeurs.length} plongeurs`, 'success');
    console.log(`✅ Palanquée créée avec ${selectedPlongeurs.length} plongeurs`);
}

function getSelectedPlongeurs() {
    const checkboxes = document.querySelectorAll('input[name="plongeurSelect"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function clearPlongeurSelection() {
    const checkboxes = document.querySelectorAll('input[name="plongeurSelect"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function removePalanquee(palanqueeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette palanquée ?')) {
        return;
    }
    
    palanquees = palanquees.filter(p => p.id !== palanqueeId);
    
    displayPlongeurs();
    displayPalanquees();
    updateCurrentInfo();
    
    showAlert('✅ Palanquée supprimée', 'success');
}

function displayPalanquees() {
    const container = document.getElementById('palanqueesContainer');
    if (!container) return;
    
    if (palanquees.length === 0) {
        container.innerHTML = '<p style="color: #666;">Aucune palanquée créée</p>';
        return;
    }
    
    let html = '<div class="palanquees-list">';
    palanquees.forEach((palanquee, index) => {
        html += `
            <div class="palanquee-item" data-palanquee-id="${palanquee.id}">
                <div class="palanquee-header">
                    <h3>🏊 Palanquée ${index + 1}</h3>
                    <button onclick="removePalanquee('${palanquee.id}')" class="btn-remove" title="Supprimer palanquée">🗑️</button>
                </div>
                <div class="palanquee-plongeurs">
                    ${palanquee.plongeurs.map(plongeurId => {
                        const plongeur = plongeurs.find(p => p.id === plongeurId);
                        if (!plongeur) return '';
                        return `
                            <div class="plongeur-in-palanquee">
                                <span class="plongeur-nom">${plongeur.nom} ${plongeur.prenom}</span>
                                <span class="plongeur-niveau niveau-${plongeur.niveau.toLowerCase().replace(/\s+/g, '-')}">${plongeur.niveau}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// === MISE À JOUR DES INFORMATIONS ===

function updateCurrentInfo() {
    // Mettre à jour l'en-tête avec les informations actuelles
    const dpElement = document.getElementById('currentDP');
    const dateElement = document.getElementById('currentDate');
    const locationElement = document.getElementById('currentLocation');
    
    if (dpElement) dpElement.textContent = currentDP || 'Non défini';
    if (dateElement) dateElement.textContent = currentDate || 'Non définie';
    if (locationElement) locationElement.textContent = currentLocation || 'Non défini';
    
    // Mettre à jour les statistiques
    updateStats();
}

function updateStats() {
    // Calculer les alertes
    const alertes = [];
    
    // Plongeurs non assignés
    const plongeursNonAssignes = plongeurs.filter(plongeur => 
        !palanquees.some(p => p.plongeurs.includes(plongeur.id))
    );
    
    if (plongeursNonAssignes.length > 0) {
        alertes.push({
            type: 'warning',
            message: `${plongeursNonAssignes.length} plongeur(s) non assigné(s)`,
            details: plongeursNonAssignes.map(p => `${p.nom} ${p.prenom}`).join(', ')
        });
    }
    
    // Palanquées avec un seul plongeur
    const palanqueesSolos = palanquees.filter(p => p.plongeurs.length === 1);
    if (palanqueesSolos.length > 0) {
        alertes.push({
            type: 'error',
            message: `${palanqueesSolos.length} palanquée(s) avec un seul plongeur`,
            details: 'Les palanquées doivent avoir au moins 2 plongeurs'
        });
    }
    
    // Palanquées dépassant 4 plongeurs
    const palanqueesGrandes = palanquees.filter(p => p.plongeurs.length > 4);
    if (palanqueesGrandes.length > 0) {
        alertes.push({
            type: 'warning',
            message: `${palanqueesGrandes.length} palanquée(s) avec plus de 4 plongeurs`,
            details: 'Recommandation: maximum 4 plongeurs par palanquée'
        });
    }
    
    // Afficher les alertes dans le dashboard
    displayDashboard(alertes);
}

function displayDashboard(alertes = []) {
    const container = document.getElementById('dashboardContainer');
    if (!container) return;
    
    const alertesTotal = alertes || [];
    
    let htmlContent = '<section class="dashboard-stats">';
    htmlContent += '<h2>📊 État actuel</h2>';
    htmlContent += '<p>Plongeurs: ' + plongeursLocal.length + '</p>';
    htmlContent += '<p>Palanquées: ' + palanqueesLocal.length + '</p>';
    htmlContent += '<p>Alertes: ' + alertesTotal.length + '</p>';
    htmlContent += '</section>';
    
    if (alertesTotal.length > 0) {
        htmlContent += '<section class="dashboard-alerts">';
        htmlContent += '<h3>⚠️ Alertes</h3>';
        alertesTotal.forEach(alerte => {
            htmlContent += `
                <div class="alert-item alert-${alerte.type}">
                    <strong>${alerte.message}</strong>
                    ${alerte.details ? `<p class="alert-details">${alerte.details}</p>` : ''}
                </div>
            `;
        });
        htmlContent += '</section>';
    }
    
    container.innerHTML = htmlContent;
}

// === GESTION DES ÉVÉNEMENTS ===

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM chargé, initialisation...');
    
    // Charger les sessions existantes
    loadAndDisplaySessions();
    
    // Event listeners pour les champs principaux
    const dpInput = document.getElementById('dpInput');
    const dateInput = document.getElementById('dateInput');
    const locationInput = document.getElementById('locationInput');
    
    if (dpInput) {
        dpInput.addEventListener('change', function() {
            currentDP = this.value;
            updateCurrentInfo();
        });
    }
    
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            currentDate = this.value;
            updateCurrentInfo();
        });
    }
    
    if (locationInput) {
        locationInput.addEventListener('change', function() {
            currentLocation = this.value;
            updateCurrentInfo();
        });
    }
    
    // Event listener pour le nouveau bouton "Enregistrer Session"
    const btnEnregistrerSession = document.getElementById('btnEnregistrerSession');
    if (btnEnregistrerSession) {
        btnEnregistrerSession.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;
            
            try {
                // Désactiver le bouton pendant l'opération
                btn.disabled = true;
                btn.innerHTML = '🔄 Enregistrement...';
                btn.style.backgroundColor = '#ffc107';
                
                const success = await saveSessionData();
                
                if (success) {
                    // Succès - bouton vert temporaire
                    btn.innerHTML = '✅ Enregistrée !';
                    btn.style.backgroundColor = '#28a745';
                    
                    // Rafraîchir les listes
                    setTimeout(() => {
                        if (typeof displayPlongeurs === 'function') displayPlongeurs();
                        if (typeof displayPalanquees === 'function') displayPalanquees();
                        if (typeof updateCurrentInfo === 'function') updateCurrentInfo();
                    }, 500);
                } else {
                    // Échec - bouton rouge temporaire
                    btn.innerHTML = '❌ Erreur';
                    btn.style.backgroundColor = '#dc3545';
                }
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'enregistrement:', error);
                btn.innerHTML = '❌ Erreur';
                btn.style.backgroundColor = '#dc3545';
            }
            
            // Restaurer le bouton après 2 secondes
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        });
    }
    
    // Event listener pour ajouter un plongeur
    const btnAddPlongeur = document.getElementById('btnAddPlongeur');
    if (btnAddPlongeur) {
        btnAddPlongeur.addEventListener('click', addPlongeur);
    }
    
    // Event listener pour créer une palanquée
    const btnCreatePalanquee = document.getElementById('btnCreatePalanquee');
    if (btnCreatePalanquee) {
        btnCreatePalanquee.addEventListener('click', createPalanquee);
    }
    
    // Event listeners pour les touches Entrée
    const nomInput = document.getElementById('nomInput');
    const prenomInput = document.getElementById('prenomInput');
    const niveauSelect = document.getElementById('niveauSelect');
    
    if (nomInput) {
        nomInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (prenomInput) prenomInput.focus();
            }
        });
    }
    
    if (prenomInput) {
        prenomInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (niveauSelect) niveauSelect.focus();
            }
        });
    }
    
    if (niveauSelect) {
        niveauSelect.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addPlongeur();
            }
        });
    }
    
    // Initialiser l'affichage
    updateCurrentInfo();
    displayPlongeurs();
    displayPalanquees();
    
    console.log('✅ Application initialisée avec succès');
});

// === FONCTIONS D'IMPORTATION/EXPORTATION ===

function exportSessions() {
    try {
        if (sessions.length === 0) {
            showAlert('❌ Aucune session à exporter', 'error');
            return;
        }
        
        const dataToExport = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            totalSessions: sessions.length,
            sessions: sessions
        };
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `diving-sessions-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert(`✅ ${sessions.length} sessions exportées avec succès`, 'success');
        console.log(`✅ Export de ${sessions.length} sessions effectué`);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'export:', error);
        showAlert('❌ Erreur lors de l\'export des sessions', 'error');
    }
}

function importSessions() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validation de base
                if (!importedData.sessions || !Array.isArray(importedData.sessions)) {
                    throw new Error('Format de fichier invalide');
                }
                
                // Fusionner avec les sessions existantes
                const existingIds = new Set(sessions.map(s => s.id));
                const newSessions = importedData.sessions.filter(s => !existingIds.has(s.id));
                
                if (newSessions.length === 0) {
                    showAlert('⚠️ Aucune nouvelle session à importer', 'warning');
                    return;
                }
                
                sessions = [...sessions, ...newSessions];
                sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                // Limiter à 100 sessions max
                if (sessions.length > 100) {
                    sessions = sessions.slice(0, 100);
                }
                
                // Sauvegarder
                localStorage.setItem('diving_sessions', JSON.stringify(sessions));
                
                // Rafraîchir l'affichage
                displaySessions();
                
                showAlert(`✅ ${newSessions.length} nouvelles sessions importées`, 'success');
                console.log(`✅ Import de ${newSessions.length} nouvelles sessions effectué`);
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'import:', error);
                showAlert('❌ Erreur lors de l\'import: fichier invalide', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// === FONCTIONS DE RECHERCHE ===

function searchSessions(query) {
    if (!query || query.trim().length < 2) {
        displaySessions();
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const filteredSessions = sessions.filter(session => {
        return (
            session.dp.toLowerCase().includes(searchTerm) ||
            session.location.toLowerCase().includes(searchTerm) ||
            session.date.includes(searchTerm) ||
            session.plongeurs.some(plongeur => 
                plongeur.nom.toLowerCase().includes(searchTerm) ||
                plongeur.prenom.toLowerCase().includes(searchTerm)
            )
        );
    });
    
    // Afficher les résultats filtrés
    displayFilteredSessions(filteredSessions, query);
}

function displayFilteredSessions(filteredSessions, query) {
    const container = document.getElementById('sessionsContainer');
    if (!container) return;
    
    if (filteredSessions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <p>Aucune session trouvée pour "${query}"</p>
                <button onclick="displaySessions()" class="btn-secondary">Afficher toutes les sessions</button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="search-results-header">
            <p><strong>${filteredSessions.length}</strong> session(s) trouvée(s) pour "<em>${query}</em>"</p>
            <button onclick="displaySessions()" class="btn-secondary">Afficher toutes les sessions</button>
        </div>
        <div class="sessions-list">
    `;
    
    filteredSessions.forEach((session, index) => {
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString('fr-FR');
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div class="session-item" data-session-id="${session.id}">
                <div class="session-header">
                    <h3>📋 ${session.dp} - ${session.location}</h3>
                    <div class="session-meta">
                        <span class="session-date">📅 ${session.date}</span>
                        <span class="session-time">🕒 ${dateStr} ${timeStr}</span>
                    </div>
                </div>
                <div class="session-stats">
                    <span class="stat-item">👥 ${session.stats.totalPlongeurs} plongeurs</span>
                    <span class="stat-item">🏊 ${session.stats.totalPalanquees} palanquées</span>
                </div>
                <div class="session-actions">
                    <button onclick="loadSession('${session.id}')" class="btn-load">📂 Charger</button>
                    <button onclick="viewSession('${session.id}')" class="btn-view">👁️ Voir</button>
                    <button onclick="deleteSession('${session.id}')" class="btn-delete">🗑️ Supprimer</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// === FONCTIONS DE VALIDATION ===

function validateCurrentData() {
    const errors = [];
    const warnings = [];
    
    // Vérifications obligatoires
    if (!currentDP) errors.push('DP non défini');
    if (!currentDate) errors.push('Date non définie');
    if (!currentLocation) errors.push('Lieu non défini');
    
    if (plongeurs.length === 0) {
        errors.push('Aucun plongeur ajouté');
    }
    
    if (palanquees.length === 0 && plongeurs.length > 0) {
        warnings.push('Plongeurs ajoutés mais aucune palanquée créée');
    }
    
    // Vérifications des palanquées
    palanquees.forEach((palanquee, index) => {
        if (palanquee.plongeurs.length < 2) {
            errors.push(`Palanquée ${index + 1}: moins de 2 plongeurs`);
        }
        if (palanquee.plongeurs.length > 4) {
            warnings.push(`Palanquée ${index + 1}: plus de 4 plongeurs`);
        }
    });
    
    // Plongeurs non assignés
    const plongeursNonAssignes = plongeurs.filter(plongeur => 
        !palanquees.some(p => p.plongeurs.includes(plongeur.id))
    );
    
    if (plongeursNonAssignes.length > 0) {
        warnings.push(`${plongeursNonAssignes.length} plongeur(s) non assigné(s)`);
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
}

// === FONCTIONS DE NETTOYAGE ===

function clearAllData() {
    if (!confirm('⚠️ ATTENTION ⚠️\n\nCette action va supprimer :\n- Tous les plongeurs\n- Toutes les palanquées\n- Toutes les informations actuelles\n\nLes sessions sauvegardées ne seront pas affectées.\n\nÊtes-vous sûr de vouloir continuer ?')) {
        return;
    }
    
    try {
        // Réinitialiser les données actuelles
        plongeurs.length = 0;
        palanquees.length = 0;
        currentDP = '';
        currentDate = '';
        currentLocation = '';
        
        // Vider les champs
        const dpInput = document.getElementById('dpInput');
        const dateInput = document.getElementById('dateInput');
        const locationInput = document.getElementById('locationInput');
        
        if (dpInput) dpInput.value = '';
        if (dateInput) dateInput.value = '';
        if (locationInput) locationInput.value = '';
        
        // Rafraîchir l'affichage
        displayPlongeurs();
        displayPalanquees();
        updateCurrentInfo();
        
        showAlert('✅ Toutes les données actuelles ont été effacées', 'success');
        console.log('✅ Données actuelles effacées');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'effacement:', error);
        showAlert('❌ Erreur lors de l\'effacement des données', 'error');
    }
}

function clearAllSessions() {
    if (!confirm('⚠️ ATTENTION ⚠️\n\nCette action va supprimer DÉFINITIVEMENT toutes les sessions sauvegardées.\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous vraiment sûr de vouloir continuer ?')) {
        return;
    }
    
    try {
        sessions.length = 0;
        localStorage.removeItem('diving_sessions');
        
        // Supprimer aussi en ligne si disponible
        if (typeof clearOnlineSessions === 'function') {
            clearOnlineSessions().catch(error => {
                console.log('⚠️ Erreur suppression sessions en ligne:', error.message);
            });
        }
        
        displaySessions();
        showAlert('✅ Toutes les sessions ont été supprimées', 'success');
        console.log('✅ Toutes les sessions supprimées');
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression des sessions:', error);
        showAlert('❌ Erreur lors de la suppression des sessions', 'error');
    }
}

// === TESTS DE CONNECTIVITÉ ===

async function testConnectivity() {
    console.log('🔄 Test de connectivité...');
    const results = {
        localStorage: false,
        firebase: false,
        online: false
    };
    
    try {
        // Test localStorage
        const testKey = 'connectivity_test';
        localStorage.setItem(testKey, 'test');
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        results.localStorage = retrieved === 'test';
        console.log(`📦 LocalStorage: ${results.localStorage ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ Erreur localStorage:', error.message);
    }
    
    try {
        // Test Firebase si disponible
        if (typeof db !== 'undefined' && db) {
            console.log("📖 Test 2: Lecture /sessions");
            const sessionsRead = await db.ref('sessions').once('value');
            console.log("✅ Lecture sessions OK:", sessionsRead.exists());
            results.firebase = true;
        }
    } catch (error) {
        console.log('❌ Erreur Firebase:', error.message);
    }
    
    try {
        // Test connectivité réseau
        results.online = navigator.onLine;
        console.log(`🌐 Réseau: ${results.online ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ Erreur réseau:', error.message);
    }
    
    // Afficher les résultats
    const statusMessage = `
        📦 LocalStorage: ${results.localStorage ? '✅' : '❌'}
        🔥 Firebase: ${results.firebase ? '✅' : '❌'}
        🌐 Réseau: ${results.online ? '✅' : '❌'}
    `;
    
    showAlert(statusMessage, 'info', 8000);
    
    return results;
}

// === FONCTIONS UTILITAIRES ===

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return dateString;
    }
}

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return '';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === GESTION DES ERREURS GLOBALES ===

window.addEventListener('error', function(event) {
    console.error('❌ Erreur globale:', event.error);
    showAlert('❌ Une erreur est survenue. Veuillez rafraîchir la page.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promesse rejetée:', event.reason);
    showAlert('❌ Une erreur de connexion est survenue.', 'error');
});

// === VARIABLES ET FONCTIONS EXPOSÉES GLOBALEMENT ===

// Exposer les fonctions principales pour les boutons HTML
window.addPlongeur = addPlongeur;
window.removePlongeur = removePlongeur;
window.createPalanquee = createPalanquee;
window.removePalanquee = removePalanquee;
window.saveSessionData = saveSessionData;
window.loadSession = loadSession;
window.viewSession = viewSession;
window.deleteSession = deleteSession;
window.exportSessions = exportSessions;
window.importSessions = importSessions;
window.searchSessions = searchSessions;
window.clearAllData = clearAllData;
window.clearAllSessions = clearAllSessions;
window.testConnectivity = testConnectivity;

// Exposer les variables pour d'autres scripts
window.sessions = sessions;
window.plongeurs = plongeurs;
window.palanquees = palanquees;
window.currentDP = currentDP;
window.currentDate = currentDate;
window.currentLocation = currentLocation;

console.log('✅ Script main-complete.js chargé avec succès');