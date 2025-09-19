/**
 * Système de sauvegarde automatique amélioré et corrigé
 * Corrige les problèmes de capture incomplète des données
 */

class ImprovedAutoSave {
    constructor() {
        this.saveKey = 'jsas_auto_save';
        this.lastSaveKey = 'jsas_last_save_time';
        this.saveInterval = 30000; // 30 secondes
        this.intervalId = null;
        this.lastSaveHash = '';
        this.isEnabled = true;
        this.debugMode = false;
        
        this.init();
    }
    
    init() {
        this.log('Initialisation du système de sauvegarde automatique');
        this.startAutoSave();
        this.setupRestorePrompt();
        this.setupManualControls();
    }
    
    log(message, data = null) {
        if (this.debugMode) {
            console.log('[AutoSave]', message, data || '');
        }
    }
    
    /**
     * CORRECTION PRINCIPALE: Collecte complète et sécurisée des données
     */
    collectAllData() {
        this.log('Collecte des données...');
        
        const data = {
            timestamp: Date.now(),
            version: '2.0.0',
            plongeurs: [],
            palanquees: [],
            metadata: {},
            stats: {}
        };
        
        // CORRECTION 1: Collecte sécurisée des plongeurs
        try {
            // Essayer plusieurs sources pour les plongeurs
            if (window.plongeurs && Array.isArray(window.plongeurs)) {
                data.plongeurs = [...window.plongeurs];
                this.log('Plongeurs collectés depuis window.plongeurs', data.plongeurs.length);
            } else {
                // Fallback: lire depuis le DOM
                const plongeurRows = document.querySelectorAll('#plongeur-list tr:not(.header-row)');
                data.plongeurs = Array.from(plongeurRows).map(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 8) {
                        return {
                            numero: cells[0]?.textContent?.trim() || '',
                            nom: cells[1]?.textContent?.trim() || '',
                            prenom: cells[2]?.textContent?.trim() || '',
                            niveau: cells[3]?.textContent?.trim() || '',
                            club: cells[4]?.textContent?.trim() || '',
                            bapteme: cells[5]?.textContent?.trim() || '',
                            nitrox: cells[6]?.textContent?.trim() || '',
                            recycleur: cells[7]?.textContent?.trim() || '',
                            remarques: cells[8]?.textContent?.trim() || ''
                        };
                    }
                }).filter(p => p && (p.nom || p.prenom));
                this.log('Plongeurs collectés depuis DOM', data.plongeurs.length);
            }
        } catch (e) {
            this.log('Erreur collecte plongeurs:', e.message);
            data.plongeurs = [];
        }
        
        // CORRECTION 2: Collecte sécurisée des palanquées
        try {
            if (window.palanquees && Array.isArray(window.palanquees)) {
                data.palanquees = this.deepClonePalanquees(window.palanquees);
                this.log('Palanquées collectées depuis window.palanquees', data.palanquees.length);
            } else {
                // Fallback: lire depuis le DOM
                data.palanquees = this.collectPalanqueesFromDOM();
                this.log('Palanquées collectées depuis DOM', data.palanquees.length);
            }
        } catch (e) {
            this.log('Erreur collecte palanquées:', e.message);
            data.palanquees = [];
        }
        
        // CORRECTION 3: Métadonnées complètes
        try {
            const dpSelect = document.getElementById('dp-select');
            const dpDate = document.getElementById('dp-date');
            const dpLieu = document.getElementById('dp-lieu');
            
            data.metadata = {
                dp: dpSelect?.selectedOptions?.[0]?.text || dpSelect?.value || '',
                date: dpDate?.value || '',
                lieu: dpLieu?.value || '',
                url: window.location.href,
                userAgent: navigator.userAgent.substring(0, 100)
            };
        } catch (e) {
            this.log('Erreur collecte métadonnées:', e.message);
            data.metadata = {};
        }
        
        // CORRECTION 4: Statistiques précises
        this.calculateStats(data);
        
        this.log('Données collectées:', {
            plongeurs: data.plongeurs.length,
            palanquees: data.palanquees.length,
            totalStats: data.stats
        });
        
        return data;
    }
    
    /**
     * Clonage profond des palanquées pour éviter les références
     */
    deepClonePalanquees(palanquees) {
        return palanquees.map(palanquee => {
            if (Array.isArray(palanquee)) {
                return palanquee.map(plongeur => ({...plongeur}));
            }
            return {...palanquee};
        });
    }
    
    /**
     * Collecte des palanquées depuis le DOM
     */
    collectPalanqueesFromDOM() {
        const palanquees = [];
        const palanqueeContainers = document.querySelectorAll('.palanquee-container');
        
        palanqueeContainers.forEach((container, index) => {
            const plongeurs = [];
            const plongeurCards = container.querySelectorAll('.plongeur-card');
            
            plongeurCards.forEach(card => {
                const nom = card.querySelector('.plongeur-nom')?.textContent?.trim();
                const niveau = card.querySelector('.plongeur-niveau')?.textContent?.trim();
                const numero = card.dataset.numero || '';
                
                if (nom) {
                    plongeurs.push({
                        numero: numero,
                        nom: nom,
                        niveau: niveau || '',
                        // Récupérer d'autres propriétés si disponibles
                        prenom: card.dataset.prenom || '',
                        club: card.dataset.club || '',
                        bapteme: card.dataset.bapteme || '',
                        nitrox: card.dataset.nitrox || '',
                        recycleur: card.dataset.recycleur || ''
                    });
                }
            });
            
            if (plongeurs.length > 0) {
                palanquees.push(plongeurs);
            }
        });
        
        return palanquees;
    }
    
    /**
     * Calcul des statistiques précises
     */
    calculateStats(data) {
        data.stats = {
            plongeursEnListe: data.plongeurs.length,
            plongeursEnPalanquees: 0,
            nombrePalanquees: data.palanquees.length,
            totalGeneral: 0
        };
        
        // Compter les plongeurs en palanquées
        if (Array.isArray(data.palanquees)) {
            data.palanquees.forEach(palanquee => {
                if (Array.isArray(palanquee)) {
                    data.stats.plongeursEnPalanquees += palanquee.length;
                }
            });
        }
        
        data.stats.totalGeneral = data.stats.plongeursEnListe + data.stats.plongeursEnPalanquees;
    }
    
    /**
     * Génère un hash des données pour détecter les changements
     */
    generateDataHash(data) {
        const hashData = {
            plongeurs: data.plongeurs.length,
            palanquees: data.palanquees.length,
            dp: data.metadata.dp,
            date: data.metadata.date,
            lieu: data.metadata.lieu
        };
        return JSON.stringify(hashData);
    }
    
    /**
     * Sauvegarde les données
     */
    saveData() {
        if (!this.isEnabled) return;
        
        try {
            const data = this.collectAllData();
            const currentHash = this.generateDataHash(data);
            
            // Ne sauvegarder que si les données ont changé
            if (currentHash === this.lastSaveHash) {
                this.log('Aucun changement détecté, sauvegarde ignorée');
                return false;
            }
            
            // Sauvegarder les données
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            localStorage.setItem(this.lastSaveKey, data.timestamp.toString());
            
            this.lastSaveHash = currentHash;
            this.log('Sauvegarde réussie', data.stats);
            
            // Afficher notification discrète
            this.showSaveNotification(`Sauvegarde: ${data.stats.totalGeneral} plongeurs`);
            
            return true;
        } catch (error) {
            console.error('[AutoSave] Erreur de sauvegarde:', error);
            return false;
        }
    }
    
    /**
     * Démarre la sauvegarde automatique
     */
    startAutoSave() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            this.saveData();
        }, this.saveInterval);
        
        this.log('Sauvegarde automatique démarrée');
    }
    
    /**
     * Arrête la sauvegarde automatique
     */
    stopAutoSave() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.log('Sauvegarde automatique arrêtée');
    }
    
    /**
     * Vérifie s'il y a une sauvegarde à restaurer
     */
    checkForRestore() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            const lastSaveTime = localStorage.getItem(this.lastSaveKey);
            
            if (!savedData || !lastSaveTime) return null;
            
            const data = JSON.parse(savedData);
            const saveTime = parseInt(lastSaveTime);
            const now = Date.now();
            const ageMinutes = Math.floor((now - saveTime) / (1000 * 60));
            
            // Ne proposer la restauration que si la sauvegarde est récente (< 2h)
            if (ageMinutes > 120) {
                this.log('Sauvegarde trop ancienne, ignorée');
                return null;
            }
            
            return {
                data: data,
                age: ageMinutes,
                timestamp: saveTime
            };
        } catch (error) {
            console.error('[AutoSave] Erreur vérification restauration:', error);
            return null;
        }
    }
    
    /**
     * Configure l'invite de restauration
     */
    setupRestorePrompt() {
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.showRestorePrompt(), 1000);
            });
        } else {
            setTimeout(() => this.showRestorePrompt(), 1000);
        }
    }
    
    /**
     * Affiche l'invite de restauration si nécessaire
     */
    showRestorePrompt() {
        const restore = this.checkForRestore();
        if (!restore) return;
        
        const currentData = this.collectAllData();
        
        // Ne pas proposer la restauration si les données actuelles sont équivalentes
        if (currentData.stats.totalGeneral >= restore.data.stats.totalGeneral) {
            this.log('Données actuelles plus complètes, pas de restauration');
            return;
        }
        
        const message = `Sauvegarde automatique trouvée (${restore.age} min):
${restore.data.stats.totalGeneral} plongeurs total
- ${restore.data.stats.plongeursEnListe} en liste
- ${restore.data.stats.plongeursEnPalanquees} en palanquées
- ${restore.data.stats.nombrePalanquees} palanquées

Données actuelles: ${currentData.stats.totalGeneral} plongeurs

Restaurer la sauvegarde ?`;
        
        if (confirm(message)) {
            this.restoreData(restore.data);
        } else {
            // Effacer la sauvegarde si refusée
            this.clearSave();
        }
    }
    
    /**
     * Restaure les données
     */
    restoreData(data) {
        try {
            this.log('Début de la restauration...', data.stats);
            
            // Restaurer les variables globales
            if (data.plongeurs) {
                window.plongeurs = [...data.plongeurs];
                this.log('Plongeurs restaurés:', window.plongeurs.length);
            }
            
            if (data.palanquees) {
                window.palanquees = this.deepClonePalanquees(data.palanquees);
                this.log('Palanquées restaurées:', window.palanquees.length);
            }
            
            // Restaurer les métadonnées
            if (data.metadata) {
                const dpSelect = document.getElementById('dp-select');
                const dpDate = document.getElementById('dp-date');
                const dpLieu = document.getElementById('dp-lieu');
                
                if (dpDate && data.metadata.date) dpDate.value = data.metadata.date;
                if (dpLieu && data.metadata.lieu) dpLieu.value = data.metadata.lieu;
                
                // Pour le DP, essayer de trouver l'option correspondante
                if (dpSelect && data.metadata.dp) {
                    for (let option of dpSelect.options) {
                        if (option.text === data.metadata.dp || option.value === data.metadata.dp) {
                            option.selected = true;
                            break;
                        }
                    }
                }
            }
            
            // Déclencher la reconstruction de l'interface
            this.triggerInterfaceUpdate();
            
            // Effacer la sauvegarde après restauration réussie
            this.clearSave();
            
            alert(`Restauration réussie!\n${data.stats.totalGeneral} plongeurs restaurés`);
            this.log('Restauration terminée avec succès');
            
        } catch (error) {
            console.error('[AutoSave] Erreur de restauration:', error);
            alert('Erreur lors de la restauration des données');
        }
    }
    
    /**
     * Déclenche la mise à jour de l'interface
     */
    triggerInterfaceUpdate() {
        // Déclencher les événements de mise à jour si les fonctions existent
        if (typeof updatePlongeurList === 'function') {
            updatePlongeurList();
        }
        
        if (typeof updatePalanquees === 'function') {
            updatePalanquees();
        }
        
        if (typeof refreshInterface === 'function') {
            refreshInterface();
        }
        
        // Déclencher des événements personnalisés
        window.dispatchEvent(new CustomEvent('dataRestored', {
            detail: { source: 'autoSave' }
        }));
    }
    
    /**
     * Efface la sauvegarde
     */
    clearSave() {
        localStorage.removeItem(this.saveKey);
        localStorage.removeItem(this.lastSaveKey);
        this.lastSaveHash = '';
        this.log('Sauvegarde effacée');
    }
    
    /**
     * Configure les contrôles manuels
     */
    setupManualControls() {
        // Ajouter des contrôles dans l'interface si possible
        const controlsContainer = document.getElementById('controls') || document.body;
        
        const autoSaveStatus = document.createElement('div');
        autoSaveStatus.id = 'autosave-status';
        autoSaveStatus.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f0f0f0;
            border: 1px solid #ccc;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0.7;
        `;
        autoSaveStatus.innerHTML = `
            <div>AutoSave: <span id="autosave-toggle">ON</span></div>
            <div><button onclick="autoSave.saveData()" style="font-size:10px;">Sauvegarder</button></div>
            <div><button onclick="autoSave.clearSave()" style="font-size:10px;">Effacer</button></div>
        `;
        
        document.body.appendChild(autoSaveStatus);
        
        // Toggle pour activer/désactiver
        document.getElementById('autosave-toggle').onclick = () => {
            this.isEnabled = !this.isEnabled;
            document.getElementById('autosave-toggle').textContent = this.isEnabled ? 'ON' : 'OFF';
            document.getElementById('autosave-toggle').style.color = this.isEnabled ? 'green' : 'red';
            
            if (this.isEnabled) {
                this.startAutoSave();
            } else {
                this.stopAutoSave();
            }
        };
    }
    
    /**
     * Affiche une notification de sauvegarde
     */
    showSaveNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => notification.style.opacity = '1', 10);
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
    }
    
    /**
     * Active le mode debug
     */
    enableDebug() {
        this.debugMode = true;
        console.log('[AutoSave] Mode debug activé');
    }
    
    /**
     * Obtient les statistiques actuelles
     */
    getStats() {
        const data = this.collectAllData();
        return {
            enabled: this.isEnabled,
            interval: this.saveInterval,
            lastSave: localStorage.getItem(this.lastSaveKey),
            currentData: data.stats,
            hasBackup: !!localStorage.getItem(this.saveKey)
        };
    }
}

// Initialiser le système de sauvegarde automatique
window.autoSave = new ImprovedAutoSave();

// Exposer des fonctions utiles globalement
window.saveNow = () => window.autoSave.saveData();
window.clearAutoSave = () => window.autoSave.clearSave();
window.autoSaveStats = () => console.table(window.autoSave.getStats());
window.enableAutoSaveDebug = () => window.autoSave.enableDebug();

console.log('[AutoSave] Système de sauvegarde automatique initialisé et corrigé');