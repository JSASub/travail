// improved-auto-save-fixed.js - Version simple et robuste
console.log('✅ Système de sauvegarde automatique chargé');

(function() {
    'use strict';
    
    const STORAGE_KEY = 'jsas_simple_save';
    let saveTimer = null;
    let hasShownRestore = false;
    
    // Fonction pour capturer les données réelles depuis le DOM
    function captureRealData() {
        const data = {
            timestamp: Date.now(),
            plongeursEnListe: 0,
            plongeursEnPalanquees: 0,
            nombrePalanquees: 0,
            plongeurs: [],
            palanquees: [],
            metadata: {}
        };
        
        // Capturer plongeurs en liste
        const listePlongeurs = document.getElementById('listePlongeurs');
        if (listePlongeurs) {
            const items = listePlongeurs.querySelectorAll('.plongeur-item:not([style*="display: none"])');
            data.plongeursEnListe = items.length;
            
            items.forEach(item => {
                const nom = item.querySelector('.plongeur-nom')?.textContent?.trim() || '';
                const niveau = item.querySelector('.plongeur-niveau')?.textContent?.trim() || '';
                const pre = item.querySelector('.plongeur-prerogatives')?.textContent?.replace(/[\[\]]/g, '').trim() || '';
                
                if (nom) {
                    data.plongeurs.push({ nom, niveau, pre });
                }
            });
        }
        
        // Capturer palanquées
        const palanqueeElements = document.querySelectorAll('.palanquee:not([style*="display: none"])');
        data.nombrePalanquees = palanqueeElements.length;
        
        palanqueeElements.forEach((palEl, index) => {
            const plongeursItems = palEl.querySelectorAll('.palanquee-plongeur-item:not([style*="display: none"])');
            data.plongeursEnPalanquees += plongeursItems.length;
            
            const palanquee = [];
            plongeursItems.forEach(item => {
                const nom = item.querySelector('.plongeur-nom')?.textContent?.trim() || '';
                const niveau = item.querySelector('.plongeur-niveau')?.textContent?.trim() || '';
                const preInput = item.querySelector('.plongeur-prerogatives-editable');
                const pre = preInput ? preInput.value.trim() : '';
                
                if (nom) {
                    palanquee.push({ nom, niveau, pre });
                }
            });
            
            if (palanquee.length > 0) {
                data.palanquees.push(palanquee);
            }
        });
        
        // Capturer métadonnées
        const dpSelect = document.getElementById('dp-select');
        const dpDate = document.getElementById('dp-date');
        const dpLieu = document.getElementById('dp-lieu');
        const dpPlongee = document.getElementById('dp-plongee');
        
        data.metadata = {
            dp: dpSelect && dpSelect.selectedOptions[0] ? dpSelect.selectedOptions[0].text : '',
            date: dpDate ? dpDate.value : '',
            lieu: dpLieu ? dpLieu.value.trim() : '',
            plongee: dpPlongee ? dpPlongee.value : 'matin'
        };
        
        data.totalGeneral = data.plongeursEnListe + data.plongeursEnPalanquees;
        
        return data;
    }
    
    // Sauvegarder les données
    function saveData() {
        try {
            const data = captureRealData();
            
            // Seulement si il y a des données significatives
            if (data.totalGeneral >= 2) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                console.log(`💾 Sauvegarde: ${data.totalGeneral} plongeurs total (${data.plongeursEnListe} en liste + ${data.plongeursEnPalanquees} en palanquées)`);
                showSaveIndicator();
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }
    
    // Indicateur de sauvegarde
    function showSaveIndicator() {
        let indicator = document.getElementById('simple-save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'simple-save-indicator';
            indicator.innerHTML = '✓ Sauvé';
            indicator.style.cssText = `
                position: fixed; top: 10px; right: 10px; background: #28a745;
                color: white; padding: 6px 12px; border-radius: 4px;
                font-size: 12px; z-index: 10000; opacity: 0; transition: opacity 0.3s;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
        setTimeout(() => indicator.style.opacity = '0', 1500);
    }
    
    // Déclencheur de sauvegarde avec délai
    function triggerSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(saveData, 1000);
    }
    
    // Vérifier sauvegarde existante
    function checkRestore() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved || hasShownRestore) return;
            
            const data = JSON.parse(saved);
            const age = Date.now() - data.timestamp;
            
            // Vérifier âge (24h max) et données significatives
            if (age > 24 * 60 * 60 * 1000 || data.totalGeneral < 2) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }
            
            hasShownRestore = true;
            showRestoreDialog(data);
            
        } catch (error) {
            console.error('Erreur vérification restore:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    // Dialog de restauration
    function showRestoreDialog(data) {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 20000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: 8px; padding: 24px; max-width: 480px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 16px 0; color: #333;">🔄 Session précédente trouvée</h3>
                    <div style="margin: 16px 0; padding: 16px; background: #f8f9fa; border-radius: 6px; font-size: 14px;">
                        <div style="font-weight: 600; color: #28a745; text-align: center; margin-bottom: 12px; background: #e8f5e8; padding: 8px; border-radius: 4px;">
                            📊 ${data.totalGeneral} plongeurs TOTAL
                        </div>
                        <div style="color: #666; border-left: 3px solid #28a745; padding-left: 12px; background: #f1f8f1; padding: 8px 12px; border-radius: 0 4px 4px 0;">
                            📋 ${data.plongeursEnListe} en liste d'attente<br>
                            🏊 ${data.plongeursEnPalanquees} assignés dans ${data.nombrePalanquees} palanquée(s)
                        </div>
                        ${data.metadata.dp ? `
                        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #dee2e6;">
                            <strong>👨‍💼 DP:</strong> ${data.metadata.dp}<br>
                            ${data.metadata.date ? `<strong>📅 Date:</strong> ${new Date(data.metadata.date).toLocaleDateString('fr-FR')}<br>` : ''}
                            ${data.metadata.lieu ? `<strong>📍 Lieu:</strong> ${data.metadata.lieu}` : ''}
                        </div>
                        ` : ''}
                        <div style="text-align: center; margin-top: 8px; font-size: 12px; color: #666;">
                            ⏰ Sauvée il y a ${Math.floor((Date.now() - data.timestamp) / 60000)} minutes
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
                        <button onclick="ignoreRestore(this)" style="padding: 10px 20px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">Ignorer</button>
                        <button onclick="acceptRestore(this)" style="padding: 10px 20px; border: none; background: #28a745; color: white; border-radius: 4px; cursor: pointer;">Restaurer</button>
                    </div>
                </div>
            </div>
        `;
        
        // Fonctions des boutons
        window.acceptRestore = function(btn) {
            restoreData(data);
            document.body.removeChild(dialog);
        };
        
        window.ignoreRestore = function(btn) {
            localStorage.removeItem(STORAGE_KEY);
            document.body.removeChild(dialog);
        };
        
        document.body.appendChild(dialog);
    }
    
    // Restaurer les données
    function restoreData(data) {
        try {
            console.log('🔄 Restauration en cours...');
            
            // Restaurer variables globales
            if (data.plongeurs) window.plongeurs = data.plongeurs;
            if (data.palanquees) window.palanquees = data.palanquees;
            if (data.plongeurs) window.plongeursOriginaux = [...data.plongeurs];
            
            // Restaurer métadonnées
            if (data.metadata) {
                const dpSelect = document.getElementById('dp-select');
                const dpDate = document.getElementById('dp-date');
                const dpLieu = document.getElementById('dp-lieu');
                const dpPlongee = document.getElementById('dp-plongee');
                
                if (dpSelect && data.metadata.dp) {
                    const options = Array.from(dpSelect.options);
                    const option = options.find(opt => opt.text.includes(data.metadata.dp));
                    if (option) dpSelect.value = option.value;
                }
                if (dpDate && data.metadata.date) dpDate.value = data.metadata.date;
                if (dpLieu && data.metadata.lieu) dpLieu.value = data.metadata.lieu;
                if (dpPlongee && data.metadata.plongee) dpPlongee.value = data.metadata.plongee;
            }
            
            // Re-rendu
            setTimeout(() => {
                if (typeof window.renderPlongeurs === 'function') window.renderPlongeurs();
                if (typeof window.renderPalanquees === 'function') window.renderPalanquees();
                if (typeof window.updateCompteurs === 'function') window.updateCompteurs();
                if (typeof window.updateAlertes === 'function') window.updateAlertes();
            }, 100);
            
            // Supprimer sauvegarde après restauration
            localStorage.removeItem(STORAGE_KEY);
            
            // Message de succès
            const success = document.createElement('div');
            success.innerHTML = `✅ Session restaurée: ${data.totalGeneral} plongeurs (${data.nombrePalanquees} palanquées)`;
            success.style.cssText = `
                position: fixed; top: 20px; right: 20px; background: #28a745; color: white;
                padding: 12px 20px; border-radius: 4px; z-index: 10001; font-weight: 500;
            `;
            document.body.appendChild(success);
            setTimeout(() => success.remove(), 4000);
            
            console.log('✅ Restauration terminée');
            
        } catch (error) {
            console.error('❌ Erreur restauration:', error);
            alert('Erreur lors de la restauration: ' + error.message);
        }
    }
    
    // Surveillance des changements
    function setupWatchers() {
        // Observer DOM
        ['listePlongeurs', 'palanqueesContainer'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                new MutationObserver(triggerSave).observe(element, {
                    childList: true, subtree: true, attributes: true
                });
            }
        });
        
        // Observer champs
        ['dp-select', 'dp-date', 'dp-lieu', 'dp-plongee'].forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.addEventListener('change', triggerSave);
                field.addEventListener('input', triggerSave);
            }
        });
        
        console.log('👀 Surveillance activée');
    }
    
    // Sauvegarde avant fermeture
    window.addEventListener('beforeunload', saveData);
    window.addEventListener('visibilitychange', () => {
        if (document.hidden) saveData();
    });
    
    // Surveillance continue des variables globales pour détecter les chargements
    function setupGlobalWatcher() {
    let saveCount = 0;
    
    const forceSaveIfNeeded = () => {
        const data = captureRealData();
        if (data.totalGeneral > 10 && saveCount < 3) {
            console.log('Force sauvegarde:', data.totalGeneral, 'plongeurs');
            saveData();
            saveCount++;
        }
    };
    
    // Vérification plus fréquente et plus simple
    setInterval(forceSaveIfNeeded, 1000);  // Chaque seconde
    setTimeout(forceSaveIfNeeded, 2000);   // Après 2s
    setTimeout(forceSaveIfNeeded, 5000);   // Après 5s
    setTimeout(forceSaveIfNeeded, 10000);  // Après 10s
}
    
    // Initialisation
    function init() {
        console.log('🚀 Initialisation sauvegarde automatique simple...');
        
        // Nettoyer anciennes sauvegardes
        ['jsas_auto_save', 'jsas_emergency_save', 'jsas_last_session'].forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🧹 Supprimé: ${key}`);
            }
        });
        
        setupWatchers();
        setupGlobalWatcher();
        
        // Écouter l'événement de restauration de session si disponible
        window.addEventListener('sessionRestored', () => {
            console.log('🔄 Session restaurée détectée, sauvegarde...');
            setTimeout(saveData, 800);
        });
        
        // Vérifier restauration après délai court
        setTimeout(checkRestore, 500);
        
        console.log('✅ Sauvegarde automatique active avec surveillance globale');
    }
    
    // Fonctions publiques
    window.ImprovedAutoSave = {
        save: saveData,
        clear: () => localStorage.removeItem(STORAGE_KEY),
        debug: () => {
            const data = captureRealData();
            console.log('📊 État actuel:', data);
            return data;
        }
    };
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
    } else {
        setTimeout(init, 200);
    }
    
})();