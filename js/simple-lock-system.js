console.log('FICHIER CHARGE');
window.ImprovedAutoSave = {
    test: true,
    save: function() {
        console.log('SAUVEGARDE MANUELLE');
        if (window.plongeurs) {
            localStorage.setItem('backup_test', JSON.stringify({
                plongeurs: window.plongeurs,
                timestamp: Date.now()
            }));
            console.log('SAUVE:', window.plongeurs.length, 'plongeurs');
        }
    }
};

setInterval(() => {
    if (window.plongeurs && window.plongeurs.length > 0) {
        console.log('AUTO SAVE:', window.plongeurs.length, 'plongeurs');
        window.ImprovedAutoSave.save();
    }
}, 15000);

console.log('SYSTEME ACTIF');