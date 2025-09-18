// improved-auto-save-fixed.js - Version ultra-simplifiée qui fonctionne
console.log('✅ Système de sauvegarde ultra-simple chargé');

const STORAGE_KEY = 'jsas_ultra_simple';
let hasShownRestore = false;

// Capturer les données
function captureData() {
    const data = {
        timestamp: Date.now(),
        plongeurs: window.plongeurs || [],
        palanquees: window.palanquees || [],
        metadata: {
            dp: '',
            date: '',
            lieu: '',
            plongee: 'matin'
        }
    };
    
    // Capturer métadonnées
    const dpSelect = document.getElementById('dp-select');
    const dpDate = document.getElementById('dp-date');
    const dpLieu = document.getElementById('dp-lieu');
    const dpPlongee = document.getElementById('dp-plongee');
    
    if (dpSelect && dpSelect.selectedOptions[0]) {
        data.metadata.dp = dpSelect.selectedOptions[0].text;
    }
    if (dpDate) data.metadata.date = dpDate.value;
    if (dpLieu) data.metadata.lieu = dpLieu.value.trim();
    if (dpPlongee) data.metadata.plongee = dpPlongee.value;
    
    // Calculer totaux
    let totalPalanquees = 0;
    if (Array.isArray(data.palanquees)) {
        data.palanquees.forEach(pal => {
            if (Array.isArray(pal)) {
                totalPalanquees += pal.length;
            }
        });
    }
    
    data.stats = {
        plongeursEnListe: data.plongeurs.length,
        plongeursEnPalanquees: totalPalanquees,
        nombrePalanquees: data.palanquees.length,
        totalGeneral: data.plongeurs.length + totalPalanquees
    };
    
    return data;
}

// Sauvegarder
function saveNow() {
    try {
        const data = captureData();
        
        if (data.stats.totalGeneral > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log('💾 Sauvegardé:', data.stats.totalGeneral, 'plongeurs total');
            
            // Indicateur visuel
            showSaveIndicator();
        }
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
    }
}

// Indicateur de sauvegarde
function showSaveIndicator() {
    let indicator = document.getElementById('ultra-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'ultra-save-indicator';
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

// Vérifier restauration
function checkRestore() {
    if (hasShownRestore) return;
    
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        
        const data = JSON.parse(saved);
        const age = Date.now() - data.timestamp;
        
        // Vérifier âge (24h) et données significatives
        if (age > 24 * 60 * 60 * 1000 || data.stats.totalGeneral < 2) {
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
                <div style="margin: 16px 0; padding: 16px; background: #f8f9fa; border-radius: 6px;">
                    <div style="font-weight: 600; color: #28a745; text-align: center; margin-bottom: 12px; background: #e8f5e8; padding: 8px; border-radius: 4px;">
                        📊 ${data.stats.totalGeneral} plongeurs TOTAL
                    </div>
                    <div style="color: #666; font-size: 14px;">
                        📋 ${data.stats.plongeursEnListe} en liste d'attente<br>
                        🏊 ${data.stats.plongeursEnPalanquees} assignés dans ${data.stats.nombrePalanquees} palanquée(s)
                    </div>
                    ${data.metadata.dp ? `
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #dee2e6; font-size: 13px;">
                        <strong>👨‍💼 DP:</strong> ${data.metadata.dp}<br>
                        ${data.metadata.date ? `<strong>📅 Date:</strong> ${new Date(data.metadata.date).toLocaleDateString('fr-FR')}<br>` : ''}
                        ${data.metadata.lieu ? `<strong>📍 Lieu:</strong> ${data.metadata.lieu}` : ''}
                    </div>
                    ` : ''}
                    <div style="text-align: center; margin-top: 8px; font-size: 12px; color: #666;">
                        ⏰ Sauvée il y a ${Math.floor((Date.now() - data.timestamp) / 60000)} minutes
                    </div>
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="ignoreRestoreUltra()" style="padding: 10px 20px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">Ignorer</button>
                    <button onclick="acceptRestoreUltra()" style="padding: 10px 20px; border: none; background: #28a745; color: white; border-radius: 4px; cursor: pointer;">Restaurer</button>
                </div>
            </div>
        </div>
    `;
    
    // Fonctions globales pour les boutons
    window.acceptRestoreUltra = function() {
        restoreData(data);
        document.body.removeChild(dialog);
    };
    
    window.ignoreRestoreUltra = function() {
        localStorage.removeItem(STORAGE_KEY);
        document.body.removeChild(dialog);
    };
    
    document.body.appendChild(dialog);
}

// Restaurer données
function restoreData(data) {
    try {
        console.log('🔄 Restauration ultra-simple...');
        
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
                const option = options.find(opt => opt.text.includes(data.metadata.dp.substring(0, 10)));
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
        }, 200);
        
        // Supprimer sauvegarde
        localStorage.removeItem(STORAGE_KEY);
        
        // Message succès
        const success = document.createElement('div');
        success.innerHTML = `✅ Session restaurée: ${data.stats.totalGeneral} plongeurs`;
        success.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #28a745; color: white;
            padding: 12px 20px; border-radius: 4px; z-index: 10001; font-weight: 500;
        `;
        document.body.appendChild(success);
        setTimeout(() => success.remove(), 4000);
        
        console.log('✅ Restauration terminée');
        
    } catch (error) {
        console.error('Erreur restauration:', error);
        alert('Erreur: ' + error.message);
    }
}

// Nettoyage avant fermeture
window.addEventListener('beforeunload', saveNow);

// API publique
window.ImprovedAutoSave = {
    save: saveNow,
    clear: () => localStorage.removeItem(STORAGE_KEY),
    debug: () => {
        const data = captureData();
        console.log('📊 État actuel:', data);
        return data;
    }
};

// Initialisation - sauvegarde toutes les 6 secondes
console.log('🚀 Démarrage sauvegarde automatique toutes les 6 secondes...');
setInterval(saveNow, 6000);

// Première sauvegarde après 4 secondes
setTimeout(saveNow, 4000);

// Vérifier restauration après 1 seconde
setTimeout(checkRestore, 1000);

console.log('✅ Système ultra-simple actif');