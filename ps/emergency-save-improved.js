alert('DEBUT SCRIPT');
console.log('Script emergency démarre');

window.EmergencySaveManager = function() {
    console.log('Constructor appelé');
    this.test = function() { return 'OK'; };
};

window.emergencySaveManager = new window.EmergencySaveManager();

console.log('Variables créées:', typeof window.EmergencySaveManager, typeof window.emergencySaveManager);
alert('FIN SCRIPT - Variables: ' + typeof window.EmergencySaveManager + ' / ' + typeof window.emergencySaveManager);