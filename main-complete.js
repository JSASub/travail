// main-complete.js - Application JSAS COMPLÈTE avec TOUTES les fonctionnalités

console.log("🚀 Chargement JSAS Palanquées - Version Complète");

// ===== VARIABLES GLOBALES =====
window.plongeurs = window.plongeurs || [];
window.palanquees = window.palanquees || [];
window.userConnected = window.userConnected || false;
window.currentSort = 'none';

// ===== GESTION DES DP =====
var dpList = [
  { nom: "AGUIRRE Raoul", niveau: "E3", email: "raoul.aguirre64@gmail.com" },
  { nom: "AUBARD Corinne", niveau: "P5", email: "aubard.c@gmail.com" },
  { nom: "BEST Sébastien", niveau: "P5", email: "sebastien.best@cma-nouvelleaquitaine.fr" },
  { nom: "CABIROL Joël", niveau: "E3", email: "joelcabirol@gmail.com" },
  { nom: "CATTEROU Sacha", niveau: "P5", email: "sacha.catterou@orange.fr" },
  { nom: "DARDER Olivier", niveau: "P5", email: "olivierdarder@gmail.com" },
  { nom: "GAUTHIER Christophe", niveau: "P5", email: "jsasubaquatique24@gmail.com" },
  { nom: "LE MAOUT Jean-François", niveau: "P5", email: "jf.lemaout@wanadoo.fr" },
  { nom: "MARTY David", niveau: "E3", email: "david.marty@sfr.fr" },
  { nom: "TROUBADIS Guillaume", niveau: "P5", email: "guillaume.troubadis@gmail.com" }
];

// ===== FONCTIONS UTILITAIRES =====
function showNotification(message, type) {
  type = type || 'info';
  var notification = document.createElement('div');
  notification.textContent = message;
  
  var bgColor = '#17a2b8';
  if (type === 'success') bgColor = '#28a745';
  if (type === 'error') bgColor = '#dc3545';
  if (type === 'warning') bgColor = '#ffc107';
  
  notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 20px; background: ' + bgColor + '; color: white; border-radius: 5px; z-index: 10000; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

function generateUniqueId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ===== GESTION DES PLONGEURS =====
function ajouterPlongeur() {
  var nomInput = document.getElementById('nom');
  var niveauSelect = document.getElementById('niveau');
  var prerogativesInput = document.getElementById('pre');
  
  if (!nomInput || !niveauSelect) {
    showNotification("❌ Éléments de formulaire non trouvés", "error");
    return;
  }
  
  var nom = nomInput.value.trim();
  var niveau = niveauSelect.value;
  var prerogatives = prerogativesInput ? prerogativesInput.value.trim() : '';
  
  if (!nom || !niveau) {
    showNotification("❌ Nom et niveau obligatoires", "error");
    return;
  }
  
  // Vérifier les doublons
  for (var i = 0; i < window.plongeurs.length; i++) {
    if (window.plongeurs[i].nom.toLowerCase() === nom.toLowerCase()) {
      showNotification("❌ Ce plongeur existe déjà", "error");
      return;
    }
  }
  
  var plongeur = {
    id: generateUniqueId(),
    nom: nom,
    niveau: niveau,
    prerogatives: prerogatives,
    certificatMedical: true,
    assurance: true,
    dateAjout: new Date().toISOString()
  };
  
  window.plongeurs.push(plongeur);
  
  // Vider le formulaire
  nomInput.value = '';
  niveauSelect.value = '';
  if (prerogativesInput) prerogativesInput.value = '';
  
  // Mettre à jour l'affichage
  updatePlongeursList();
  updateCompteurs();
  sauvegarderPlongeurs();
  
  showNotification("✅ Plongeur ajouté: " + nom, "success");
}

function supprimerPlongeur(plongeurId) {
  var confirmation = confirm("Supprimer ce plongeur ?");
  if (!confirmation) return;
  
  // Retirer le plongeur des palanquées
  for (var i = 0; i < window.palanquees.length; i++) {
    var palanquee = window.palanquees[i];
    if (palanquee.plongeurs) {
      var index = palanquee.plongeurs.indexOf(plongeurId);
      if (index > -1) {
        palanquee.plongeurs.splice(index, 1);
      }
    }
  }
  
  // Retirer de la liste des plongeurs
  for (var j = 0; j < window.plongeurs.length; j++) {
    if (window.plongeurs[j].id === plongeurId) {
      window.plongeurs.splice(j, 1);
      break;
    }
  }
  
  updatePlongeursList();
  updatePalanqueesList();
  updateCompteurs();
  sauvegarderPlongeurs();
  sauvegarderPalanquees();
  
  showNotification("✅ Plongeur supprimé", "success");
}

function updatePlongeursList() {
  var listePlongeurs = document.getElementById('listePlongeurs');
  if (!listePlongeurs) return;
  
  listePlongeurs.innerHTML = '';
  
  var plongeursAffiches = window.plongeurs.slice();
  
  // Tri selon la sélection actuelle
  if (window.currentSort === 'nom') {
    plongeursAffiches.sort(function(a, b) {
      return a.nom.localeCompare(b.nom);
    });
  } else if (window.currentSort === 'niveau') {
    var ordreNiveaux = {
      'GP': 1, 'E4': 2, 'E3': 3, 'E2': 4, 'E1': 5,
      'P5': 6, 'P4': 7, 'P3': 8, 'P2': 9, 'P1': 10,
      'N4': 11, 'N3': 12, 'N2': 13, 'N1': 14,
      'Plg.Or': 15, 'Plg.Ar': 16, 'Plg.Br': 17, 'Déb.': 18
    };
    plongeursAffiches.sort(function(a, b) {
      return (ordreNiveaux[a.niveau] || 99) - (ordreNiveaux[b.niveau] || 99);
    });
  }
  
  for (var i = 0; i < plongeursAffiches.length; i++) {
    var plongeur = plongeursAffiches[i];
    var li = document.createElement('li');
    li.className = 'plongeur-item';
    li.draggable = true;
    li.setAttribute('data-plongeur-id', plongeur.id);
    
    var prerogText = plongeur.prerogatives ? ' - ' + plongeur.prerogatives : '';
    li.innerHTML = 
      '<div class="plongeur-info">' +
        '<strong>' + plongeur.nom + '</strong> (' + plongeur.niveau + ')' + prerogText +
      '</div>' +
      '<div class="plongeur-actions">' +
        '<button onclick="supprimerPlongeur(\'' + plongeur.id + '\')" class="btn-danger btn-small">🗑️</button>' +
      '</div>';
    
    // Events drag & drop
    li.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', this.getAttribute('data-plongeur-id'));
      this.classList.add('dragging');
    });
    
    li.addEventListener('dragend', function(e) {
      this.classList.remove('dragging');
    });
    
    listePlongeurs.appendChild(li);
  }
}

// ===== GESTION DES PALANQUÉES =====
function ajouterPalanquee() {
  var palanquee = {
    id: generateUniqueId(),
    nom: 'Palanquée ' + (window.palanquees.length + 1),
    profondeur: 20,
    duree: 30,
    plongeurs: [],
    guide: '',
    securiteSurface: '',
    typeEspace: 'PE-20',
    nitrox: false,
    dateCreation: new Date().toISOString()
  };
  
  window.palanquees.push(palanquee);
  
  updatePalanqueesList();
  updateCompteurs();
  sauvegarderPalanquees();
  
  showNotification("✅ Nouvelle palanquée créée", "success");
}

function supprimerPalanquee(palanqueeId) {
  var confirmation = confirm("Supprimer cette palanquée ?");
  if (!confirmation) return;
  
  for (var i = 0; i < window.palanquees.length; i++) {
    if (window.palanquees[i].id === palanqueeId) {
      window.palanquees.splice(i, 1);
      break;
    }
  }
  
  updatePalanqueesList();
  updateCompteurs();
  sauvegarderPalanquees();
  
  showNotification("✅ Palanquée supprimée", "success");
}

function updatePalanqueesList() {
  var container = document.getElementById('palanqueesContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (var i = 0; i < window.palanquees.length; i++) {
    var palanquee = window.palanquees[i];
    var div = document.createElement('div');
    div.className = 'palanquee';
    div.setAttribute('data-palanquee-id', palanquee.id);
    
    // Calculer les plongeurs de la palanquée
    var plongeursTexte = '';
    if (palanquee.plongeurs && palanquee.plongeurs.length > 0) {
      for (var j = 0; j < palanquee.plongeurs.length; j++) {
        var plongeurId = palanquee.plongeurs[j];
        var plongeur = window.plongeurs.find(function(p) { return p.id === plongeurId; });
        if (plongeur) {
          plongeursTexte += '<div class="palanquee-plongeur">' + plongeur.nom + ' (' + plongeur.niveau + ')</div>';
        }
      }
    } else {
      plongeursTexte = '<div class="palanquee-vide">🔻 Déposez les plongeurs ici</div>';
    }
    
    div.innerHTML = 
      '<div class="palanquee-header">' +
        '<strong>' + palanquee.nom + '</strong>' +
        '<button onclick="supprimerPalanquee(\'' + palanquee.id + '\')" class="btn-danger btn-small">🗑️</button>' +
      '</div>' +
      '<div class="palanquee-controls">' +
        '<label>Profondeur: <input type="number" value="' + palanquee.profondeur + '" onchange="updatePalanqueeParam(\'' + palanquee.id + '\', \'profondeur\', this.value)" min="1" max="60" style="width: 60px;"> m</label>' +
        '<label>Durée: <input type="number" value="' + palanquee.duree + '" onchange="updatePalanqueeParam(\'' + palanquee.id + '\', \'duree\', this.value)" min="1" max="120" style="width: 60px;"> min</label>' +
      '</div>' +
      '<div class="palanquee-plongeurs dropzone" ondrop="dropPlongeur(event, \'' + palanquee.id + '\')" ondragover="allowDrop(event)">' +
        plongeursTexte +
      '</div>';
    
    container.appendChild(div);
  }
  
  // Vérifier les alertes
  verifierAlertes();
}

function updatePalanqueeParam(palanqueeId, param, value) {
  for (var i = 0; i < window.palanquees.length; i++) {
    if (window.palanquees[i].id === palanqueeId) {
      window.palanquees[i][param] = parseInt(value);
      break;
    }
  }
  
  sauvegarderPalanquees();
  verifierAlertes();
}

// ===== DRAG & DROP =====
function allowDrop(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.add('drag-over');
}

function dropPlongeur(ev, palanqueeId) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  
  var plongeurId = ev.dataTransfer.getData("text/plain");
  
  // Retirer le plongeur de toutes les autres palanquées
  for (var i = 0; i < window.palanquees.length; i++) {
    var pal = window.palanquees[i];
    if (pal.plongeurs) {
      var index = pal.plongeurs.indexOf(plongeurId);
      if (index > -1) {
        pal.plongeurs.splice(index, 1);
      }
    }
  }
  
  // Ajouter à la nouvelle palanquée
  for (var j = 0; j < window.palanquees.length; j++) {
    if (window.palanquees[j].id === palanqueeId) {
      if (!window.palanquees[j].plongeurs) {
        window.palanquees[j].plongeurs = [];
      }
      window.palanquees[j].plongeurs.push(plongeurId);
      break;
    }
  }
  
  updatePalanqueesList();
  updateCompteurs();
  sauvegarderPalanquees();
  
  showNotification("✅ Plongeur affecté à la palanquée", "success");
}

// ===== SYSTÈME D'ALERTES =====
function verifierAlertes() {
  var alertes = [];
  
  for (var i = 0; i < window.palanquees.length; i++) {
    var palanquee = window.palanquees[i];
    
    // Vérifier profondeur excessive
    if (palanquee.profondeur > 40) {
      alertes.push({
        type: 'warning',
        message: 'Palanquée ' + (i + 1) + ': Profondeur > 40m (' + palanquee.profondeur + 'm)'
      });
    }
    
    // Vérifier durée excessive
    if (palanquee.duree > 60) {
      alertes.push({
        type: 'warning',
        message: 'Palanquée ' + (i + 1) + ': Durée > 60min (' + palanquee.duree + 'min)'
      });
    }
    
    // Vérifier palanquée vide
    if (!palanquee.plongeurs || palanquee.plongeurs.length === 0) {
      alertes.push({
        type: 'danger',
        message: 'Palanquée ' + (i + 1) + ': Aucun plongeur assigné'
      });
    }
    
    // Vérifier les prérogatives
    if (palanquee.plongeurs && palanquee.plongeurs.length > 0) {
      var autonomes = 0;
      var encadres = 0;
      var guides = 0;
      
      for (var j = 0; j < palanquee.plongeurs.length; j++) {
        var plongeurId = palanquee.plongeurs[j];
        var plongeur = window.plongeurs.find(function(p) { return p.id === plongeurId; });
        
        if (plongeur) {
          var niveau = plongeur.niveau;
          
          if (['GP', 'E4', 'E3', 'E2', 'E1'].indexOf(niveau) > -1) {
            guides++;
          } else if (['P5', 'P4', 'P3', 'P2', 'P1', 'N4', 'N3'].indexOf(niveau) > -1) {
            autonomes++;
          } else {
            encadres++;
          }
        }
      }
      
      // Vérifications prérogatives
      if (encadres > 0 && guides === 0) {
        alertes.push({
          type: 'danger',
          message: 'Palanquée ' + (i + 1) + ': Plongeurs encadrés sans guide'
        });
      }
      
      if (palanquee.profondeur > 20 && encadres > 0 && guides === 0) {
        alertes.push({
          type: 'danger',
          message: 'Palanquée ' + (i + 1) + ': Profondeur > 20m avec plongeurs encadrés sans guide'
        });
      }
    }
  }
  
  afficherAlertes(alertes);
}

function afficherAlertes(alertes) {
  var alertesSection = document.getElementById('alertes-section');
  var alertesContent = document.getElementById('alertes-content');
  
  if (!alertesSection || !alertesContent) return;
  
  if (alertes.length === 0) {
    alertesSection.classList.add('alert-hidden');
    return;
  }
  
  alertesSection.classList.remove('alert-hidden');
  
  var html = '';
  for (var i = 0; i < alertes.length; i++) {
    var alerte = alertes[i];
    var classe = alerte.type === 'danger' ? 'severe' : '';
    html += '<div class="alert-item ' + classe + '">' + alerte.message + '</div>';
  }
  
  alertesContent.innerHTML = html;
}

// ===== GESTION DES COMPTEURS =====
function updateCompteurs() {
  var plongeursCount = document.getElementById('compteur-plongeurs');
  var palanqueesCount = document.getElementById('compteur-palanquees');
  
  if (plongeursCount) {
    plongeursCount.textContent = '(' + window.plongeurs.length + ')';
  }
  
  if (palanqueesCount) {
    var totalPlongeursDansPalanquees = 0;
    for (var i = 0; i < window.palanquees.length; i++) {
      var pal = window.palanquees[i];
      totalPlongeursDansPalanquees += pal.plongeurs ? pal.plongeurs.length : 0;
    }
    palanqueesCount.textContent = '(' + totalPlongeursDansPalanquees + ' plongeurs dans ' + window.palanquees.length + ' palanquées)';
  }
}

// ===== GESTION DES TRIS =====
function changerTri(typeTri) {
  window.currentSort = typeTri;
  
  // Mettre à jour les boutons
  var boutons = document.querySelectorAll('.sort-btn');
  for (var i = 0; i < boutons.length; i++) {
    boutons[i].classList.remove('active');
  }
  
  var boutonActif = document.querySelector('.sort-btn[data-sort="' + typeTri + '"]');
  if (boutonActif) {
    boutonActif.classList.add('active');
  }
  
  updatePlongeursList();
}

// ===== SAUVEGARDE AUTOMATIQUE =====
function sauvegarderPlongeurs() {
  try {
    if (typeof db !== 'undefined' && db && window.userConnected) {
      db.collection('plongeurs').doc('current').set({
        plongeurs: window.plongeurs,
        lastUpdate: new Date().toISOString()
      });
    }
    localStorage.setItem('jsas-plongeurs', JSON.stringify(window.plongeurs));
  } catch (error) {
    console.error("Erreur sauvegarde plongeurs:", error);
  }
}

function sauvegarderPalanquees() {
  try {
    if (typeof db !== 'undefined' && db && window.userConnected) {
      db.collection('palanquees').doc('current').set({
        palanquees: window.palanquees,
        lastUpdate: new Date().toISOString()
      });
    }
    localStorage.setItem('jsas-palanquees', JSON.stringify(window.palanquees));
  } catch (error) {
    console.error("Erreur sauvegarde palanquées:", error);
  }
}

function chargerDonnees() {
  try {
    // Charger plongeurs
    var savedPlongeurs = localStorage.getItem('jsas-plongeurs');
    if (savedPlongeurs) {
      window.plongeurs = JSON.parse(savedPlongeurs);
    }
    
    // Charger palanquées
    var savedPalanquees = localStorage.getItem('jsas-palanquees');
    if (savedPalanquees) {
      window.palanquees = JSON.parse(savedPalanquees);
    }
    
    updatePlongeursList();
    updatePalanqueesList();
    updateCompteurs();
    
    console.log("✅ Données chargées:", window.plongeurs.length, "plongeurs,", window.palanquees.length, "palanquées");
    
  } catch (error) {
    console.error("Erreur chargement données:", error);
  }
}

// ===== IMPORT/EXPORT JSON =====
function exporterJSON() {
  var data = {
    plongeurs: window.plongeurs,
    palanquees: window.palanquees,
    exportDate: new Date().toISOString(),
    version: "1.0"
  };
  
  var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  var url = URL.createObjectURL(blob);
  
  var a = document.createElement('a');
  a.href = url;
  a.download = 'plongeurs-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  
  URL.revokeObjectURL(url);
  
  showNotification("✅ Données exportées", "success");
}

function importerJSON(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      
      if (data.plongeurs) {
        window.plongeurs = data.plongeurs;
        updatePlongeursList();
        sauvegarderPlongeurs();
      }
      
      if (data.palanquees) {
        window.palanquees = data.palanquees;
        updatePalanqueesList();
        sauvegarderPalanquees();
      }
      
      updateCompteurs();
      
      showNotification("✅ Données importées: " + (data.plongeurs ? data.plongeurs.length : 0) + " plongeurs", "success");
      
    } catch (error) {
      showNotification("❌ Erreur lecture fichier JSON", "error");
    }
  };
  
  reader.readAsText(file);
}

// ===== GESTION DP (AJOUTÉE) =====
function updateDPDropdown() {
  var dpSelect = document.getElementById("dp-select");
  if (!dpSelect) return;

  dpSelect.innerHTML = '<option value="">-- Sélectionner un DP --</option>';
  
  for (var i = 0; i < dpList.length; i++) {
    var dp = dpList[i];
    var option = document.createElement('option');
    option.value = dp.nom;
    option.textContent = dp.nom + " (" + dp.niveau + ")";
    dpSelect.appendChild(option);
  }
}

function handleDPSelection() {
  var dpSelect = document.getElementById("dp-select");
  var dpNom = document.getElementById("dp-nom");
  
  if (!dpSelect || !dpNom) return;
  
  var selectedValue = dpSelect.value;
  if (selectedValue) {
    for (var i = 0; i < dpList.length; i++) {
      if (dpList[i].nom === selectedValue) {
        dpNom.value = dpList[i].nom + " (" + dpList[i].niveau + ")";
        dpNom.setAttribute("data-email", dpList[i].email);
        break;
      }
    }
  } else {
    dpNom.value = "";
    dpNom.removeAttribute("data-email");
  }
}

function openDPModal(editIndex) {
  var modal = document.getElementById("dp-modal");
  var overlay = document.getElementById("modal-overlay");
  
  if (!modal || !overlay) return;
  
  modal.style.display = "block";
  overlay.style.display = "block";
}

function closeDPModal() {
  var modal = document.getElementById("dp-modal");
  var overlay = document.getElementById("modal-overlay");
  
  if (modal) modal.style.display = "none";
  if (overlay) overlay.style.display = "none";
}

// ===== EXPORT PDF COMPLET =====
function exportToPDF() {
  try {
    console.log("🔄 Export PDF complet...");
    
    if (typeof jsPDF === 'undefined') {
      showNotification("❌ jsPDF non chargé", "error");
      return;
    }

    var jsPDFLib = window.jspdf.jsPDF;
    var doc = new jsPDFLib();
    
    // Couleurs
    var colors = {
      blueR: 0, blueG: 64, blueB: 128,
      darkR: 51, darkG: 51, darkB: 51
    };
    
    var margin = 15;
    var yPosition = margin;
    
    // EN-TÊTE
    doc.setFillColor(colors.blueR, colors.blueG, colors.blueB);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Palanquées JSAS', margin, 35); // Descendu de 15mm
    
    // Informations DP
    var dpNom = document.getElementById("dp-nom");
    var dateDP = document.getElementById("date-dp");
    var lieuDP = document.getElementById("lieu-dp");
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (dpNom && dpNom.value) {
      doc.text('DP: ' + dpNom.value, margin + 100, 15);
    }
    if (dateDP && dateDP.value) {
      doc.text('Date: ' + dateDP.value, margin + 100, 25);
    }
    if (lieuDP && lieuDP.value) {
      doc.text('Lieu: ' + lieuDP.value, margin + 100, 35);
    }
    
    yPosition = 50;
    
    // STATISTIQUES
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIQUES', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Plongeurs: ' + window.plongeurs.length, margin, yPosition);
    doc.text('Palanquées: ' + window.palanquees.length, margin + 50, yPosition);
    yPosition += 15;
    
    // LISTE DES PLONGEURS
    // LISTE DES PLONGEURS
    if (window.plongeurs.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LISTE DES PLONGEURS', margin, yPosition);
      yPosition += 8;
      
      // Tri par niveau
      var plongeursTries = window.plongeurs.slice().sort(function(a, b) {
        var ordreNiveaux = {
          'GP': 1, 'E4': 2, 'E3': 3, 'E2': 4, 'E1': 5,
          'P5': 6, 'P4': 7, 'P3': 8, 'P2': 9, 'P1': 10,
          'N4': 11, 'N3': 12, 'N2': 13, 'N1': 14
        };
        return (ordreNiveaux[a.niveau] || 99) - (ordreNiveaux[b.niveau] || 99);
      });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      for (var i = 0; i < plongeursTries.length; i++) {
        var plongeur = plongeursTries[i];
        if (yPosition > 250) {
          doc.addPage();
          yPosition = margin;
        }
        
        var texte = '• ' + plongeur.nom + ' (' + plongeur.niveau + ')';
        if (plongeur.prerogatives) {
          texte += ' - ' + plongeur.prerogatives;
        }
        
        doc.text(texte, margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 10;
    }
    
    // PALANQUÉES DÉTAILLÉES
    if (window.palanquees.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PALANQUÉES', margin, yPosition);
      yPosition += 8;
      
      for (var j = 0; j < window.palanquees.length; j++) {
        var palanquee = window.palanquees[j];
        
        if (yPosition > 240) {
          doc.addPage();
          yPosition = margin;
        }
        
        // En-tête palanquée
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, yPosition - 3, 180, 8, 'F');
        
        doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Palanquée ' + (j + 1), margin + 2, yPosition + 2);
        doc.text('Prof: ' + palanquee.profondeur + 'm | Durée: ' + palanquee.duree + 'min', margin + 120, yPosition + 2);
        yPosition += 10;
        
        // Plongeurs de la palanquée
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        if (palanquee.plongeurs && palanquee.plongeurs.length > 0) {
          for (var k = 0; k < palanquee.plongeurs.length; k++) {
            var plongeurId = palanquee.plongeurs[k];
            var plongeur = window.plongeurs.find(function(p) { return p.id === plongeurId; });
            
            if (plongeur) {
              var textePlongeur = '  → ' + plongeur.nom + ' (' + plongeur.niveau + ')';
              if (plongeur.prerogatives) {
                textePlongeur += ' - ' + plongeur.prerogatives;
              }
              doc.text(textePlongeur, margin + 5, yPosition);
              yPosition += 4;
            }
          }
        } else {
          doc.setTextColor(200, 0, 0);
          doc.text('  ⚠️ Aucun plongeur assigné', margin + 5, yPosition);
          doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
          yPosition += 4;
        }
        yPosition += 5;
      }
    }
    
    // ALERTES DE SÉCURITÉ
    var alertes = [];
    for (var l = 0; l < window.palanquees.length; l++) {
      var pal = window.palanquees[l];
      if (pal.profondeur > 40) {
        alertes.push('⚠️ Palanquée ' + (l + 1) + ': Profondeur > 40m');
      }
      if (pal.duree > 60) {
        alertes.push('⚠️ Palanquée ' + (l + 1) + ': Durée > 60min');
      }
      if (!pal.plongeurs || pal.plongeurs.length === 0) {
        alertes.push('❌ Palanquée ' + (l + 1) + ': Aucun plongeur');
      }
    }
    
    if (alertes.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      doc.text('ALERTES DE SÉCURITÉ', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      for (var m = 0; m < alertes.length; m++) {
        doc.text(alertes[m], margin + 5, yPosition);
        yPosition += 5;
      }
    } else {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setTextColor(0, 150, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('✅ Aucune alerte - Configuration conforme', margin, yPosition);
    }
    
    // PIED DE PAGE
    var pageHeight = doc.internal.pageSize.height;
    doc.setTextColor(colors.darkR, colors.darkG, colors.darkB);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Généré le ' + new Date().toLocaleString('fr-FR') + ' par JSAS Palanquées', margin, pageHeight - 10);
    
    // Sauvegarde
    var dateStr = new Date().toISOString().split('T')[0];
    var fileName = 'palanquees-jsas-' + dateStr + '.pdf';
    doc.save(fileName);
    
    showNotification("✅ PDF généré avec succès", "success");
    
  } catch (error) {
    console.error("🔥 Erreur export PDF:", error);
    showNotification("❌ Erreur génération PDF: " + error.message, "error");
  }
}

// ===== APERÇU HTML =====
function previewHTML() {
  try {
    var dpNom = document.getElementById("dp-nom");
    var dateDP = document.getElementById("date-dp");
    var lieuDP = document.getElementById("lieu-dp");
    
    var dpNomVal = dpNom ? dpNom.value : "Non renseigné";
    var dateDPVal = dateDP ? dateDP.value : new Date().toLocaleDateString('fr-FR');
    var lieuDPVal = lieuDP ? lieuDP.value : "Non renseigné";
    
    var htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Palanquées JSAS - ' + dateDPVal + '</title>';
    htmlContent += '<style>body{font-family:Arial,sans-serif;margin:20px;}.header{background:#004080;color:white;padding:20px;border-radius:10px;}.palanquee{border:2px solid #28a745;margin:10px 0;padding:15px;border-radius:8px;}.plongeur{margin:5px 0;padding:5px;background:#f8f9fa;border-radius:4px;}.alert{background:#fff3cd;border-left:4px solid #ffc107;padding:10px;margin:5px 0;}</style>';
    htmlContent += '</head><body>';
    
    htmlContent += '<div class="header"><h1>🤿 Palanquées JSAS</h1>';
    htmlContent += '<p><strong>DP:</strong> ' + dpNomVal + ' | <strong>Date:</strong> ' + dateDPVal + ' | <strong>Lieu:</strong> ' + lieuDPVal + '</p></div>';
    
    htmlContent += '<h2>📊 Statistiques</h2>';
    htmlContent += '<p>Plongeurs: <strong>' + window.plongeurs.length + '</strong> | Palanquées: <strong>' + window.palanquees.length + '</strong></p>';
    
    if (window.palanquees.length > 0) {
      htmlContent += '<h2>🤿 Palanquées</h2>';
      
      for (var i = 0; i < window.palanquees.length; i++) {
        var palanquee = window.palanquees[i];
        htmlContent += '<div class="palanquee">';
        htmlContent += '<h3>Palanquée ' + (i + 1) + ' - ' + palanquee.profondeur + 'm / ' + palanquee.duree + 'min</h3>';
        
        if (palanquee.plongeurs && palanquee.plongeurs.length > 0) {
          for (var j = 0; j < palanquee.plongeurs.length; j++) {
            var plongeurId = palanquee.plongeurs[j];
            var plongeur = window.plongeurs.find(function(p) { return p.id === plongeurId; });
            if (plongeur) {
              htmlContent += '<div class="plongeur">• ' + plongeur.nom + ' (' + plongeur.niveau + ')';
              if (plongeur.prerogatives) {
                htmlContent += ' - ' + plongeur.prerogatives;
              }
              htmlContent += '</div>';
            }
          }
        } else {
          htmlContent += '<div class="alert">⚠️ Aucun plongeur assigné</div>';
        }
        htmlContent += '</div>';
      }
    }
    
    htmlContent += '<hr><p style="text-align:center;color:#666;font-size:12px;">Généré le ' + new Date().toLocaleString('fr-FR') + ' par JSAS Palanquées</p>';
    htmlContent += '</body></html>';
    
    var newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
    
    showNotification("✅ Aperçu HTML généré", "success");
    
  } catch (error) {
    console.error("🔥 Erreur aperçu HTML:", error);
    showNotification("❌ Erreur génération aperçu", "error");
  }
}

// ===== VALIDATION DE SESSION =====
function validerSession() {
  try {
    var dpNom = document.getElementById("dp-nom");
    var dateDP = document.getElementById("date-dp");
    var lieuDP = document.getElementById("lieu-dp");
    
    if (!dpNom || !dpNom.value) {
      showNotification("❌ Veuillez sélectionner un DP", "error");
      return;
    }
    
    if (!dateDP || !dateDP.value) {
      showNotification("❌ Veuillez saisir une date", "error");
      return;
    }
    
    if (!lieuDP || !lieuDP.value) {
      showNotification("❌ Veuillez saisir un lieu", "error");
      return;
    }
    
    if (window.plongeurs.length === 0) {
      showNotification("❌ Aucun plongeur enregistré", "error");
      return;
    }
    
    if (window.palanquees.length === 0) {
      showNotification("❌ Aucune palanquée créée", "error");
      return;
    }
    
    // Vérifier que toutes les palanquées ont des plongeurs
    var palanqueesVides = 0;
    for (var i = 0; i < window.palanquees.length; i++) {
      if (!window.palanquees[i].plongeurs || window.palanquees[i].plongeurs.length === 0) {
        palanqueesVides++;
      }
    }
    
    if (palanqueesVides > 0) {
      var continuer = confirm("⚠️ " + palanqueesVides + " palanquée(s) sans plongeurs.\n\nContinuer la validation ?");
      if (!continuer) return;
    }
    
    // Sauvegarde de la session
    var sessionData = {
      dp: {
        nom: dpNom.value,
        email: dpNom.getAttribute("data-email") || "",
        date: dateDP.value,
        lieu: lieuDP.value
      },
      plongeurs: window.plongeurs,
      palanquees: window.palanquees,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
    
    try {
      if (typeof db !== 'undefined' && db && window.userConnected) {
        var sessionId = 'session-' + dateDP.value + '-' + Date.now();
        db.collection('sessions').doc(sessionId).set(sessionData);
      }
      
      var sessions = JSON.parse(localStorage.getItem('jsas-sessions') || '[]');
      sessions.push(sessionData);
      localStorage.setItem('jsas-sessions', JSON.stringify(sessions));
      
      showNotification("✅ Session validée et sauvegardée", "success");
      
      var genererPDF = confirm("Session validée !\n\nGénérer le PDF maintenant ?");
      if (genererPDF) {
        exportToPDF();
      }
      
    } catch (error) {
      console.error("Erreur sauvegarde session:", error);
      showNotification("❌ Erreur sauvegarde session", "error");
    }
    
  } catch (error) {
    console.error("🔥 Erreur validation:", error);
    showNotification("❌ Erreur validation session", "error");
  }
}

// ===== CONFIGURATION DES ÉVÉNEMENTS =====
function setupEventListeners() {
  console.log("🔄 Configuration événements complets...");
  
  try {
    // Formulaire ajout plongeur
    var addForm = document.getElementById('addForm');
    if (addForm) {
      addForm.addEventListener('submit', function(e) {
        e.preventDefault();
        ajouterPlongeur();
      });
    }
    
    // Bouton ajouter palanquée
    var addPalanqueeBtn = document.getElementById('addPalanquee');
    if (addPalanqueeBtn) {
      addPalanqueeBtn.addEventListener('click', ajouterPalanquee);
    }
    
    // Boutons de tri
    var sortButtons = document.querySelectorAll('.sort-btn');
    for (var i = 0; i < sortButtons.length; i++) {
      sortButtons[i].addEventListener('click', function() {
        changerTri(this.getAttribute('data-sort'));
      });
    }
    
    // Export JSON
    var exportJSONBtn = document.getElementById('exportJSON');
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener('click', exporterJSON);
    }
    
    // Import JSON
    var importJSONInput = document.getElementById('importJSON');
    if (importJSONInput) {
      importJSONInput.addEventListener('change', importerJSON);
    }
    
    // Export PDF
    var exportPDFBtn = document.getElementById('export-pdf');
    if (exportPDFBtn) {
      exportPDFBtn.addEventListener('click', exportToPDF);
    }
    
    // Aperçu HTML
    var previewBtn = document.getElementById('preview-html');
    if (previewBtn) {
      previewBtn.addEventListener('click', previewHTML);
    }
    
    // Validation session
    var validerBtn = document.getElementById('valider-session');
    if (validerBtn) {
      validerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        validerSession();
      });
    }
    
    // === GESTION DP ===
    var dpSelect = document.getElementById("dp-select");
    if (dpSelect) {
      dpSelect.addEventListener("change", handleDPSelection);
    }
    
    var nouveauDP = document.getElementById("nouveau-dp");
    if (nouveauDP) {
      nouveauDP.addEventListener("click", function() { openDPModal(); });
    }
    
    var modalOverlay = document.getElementById("modal-overlay");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", closeDPModal);
    }
    
    var modalClose = document.getElementById("modal-close");
    if (modalClose) {
      modalClose.addEventListener("click", closeDPModal);
    }
    
    var modalCancel = document.getElementById("modal-cancel");
    if (modalCancel) {
      modalCancel.addEventListener("click", closeDPModal);
    }
    
    // Zone de drop pour les palanquées
    var dropzones = document.querySelectorAll('.dropzone');
    for (var j = 0; j < dropzones.length; j++) {
      dropzones[j].addEventListener('dragover', allowDrop);
      dropzones[j].addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
      });
    }
    
    console.log("✅ Tous les événements configurés");
    
  } catch (error) {
    console.error("🔥 Erreur configuration événements:", error);
  }
}

// ===== FONCTIONS GLOBALES =====
window.ajouterPlongeur = ajouterPlongeur;
window.supprimerPlongeur = supprimerPlongeur;
window.ajouterPalanquee = ajouterPalanquee;
window.supprimerPalanquee = supprimerPalanquee;
window.updatePalanqueeParam = updatePalanqueeParam;
window.allowDrop = allowDrop;
window.dropPlongeur = dropPlongeur;
window.changerTri = changerTri;
window.exportToPDF = exportToPDF;
window.previewHTML = previewHTML;
window.validerSession = validerSession;
window.exporterJSON = exporterJSON;
window.openDPModal = openDPModal;
window.closeDPModal = closeDPModal;

// ===== DIAGNOSTIC =====
window.diagnosticJSAS = function() {
  console.log("🔧 === DIAGNOSTIC JSAS COMPLET ===");
  
  var diag = {
    donnees: {
      plongeurs: window.plongeurs.length,
      palanquees: window.palanquees.length,
      dpList: dpList.length
    },
    elements: {
      addForm: !!document.getElementById("addForm"),
      listePlongeurs: !!document.getElementById("listePlongeurs"),
      palanqueesContainer: !!document.getElementById("palanqueesContainer"),
      dpSelect: !!document.getElementById("dp-select"),
      alertesSection: !!document.getElementById("alertes-section")
    },
    fonctions: {
      ajouterPlongeur: typeof ajouterPlongeur === 'function',
      ajouterPalanquee: typeof ajouterPalanquee === 'function',
      exportToPDF: typeof exportToPDF === 'function',
      validerSession: typeof validerSession === 'function'
    }
  };
  
  console.table(diag.donnees);
  console.table(diag.elements);
  console.table(diag.fonctions);
  
  return diag;
};

// ===== INITIALISATION COMPLÈTE =====
function initializeFullApp() {
  console.log("🔄 Initialisation application complète...");
  
  try {
    // Affichage interface
    var authSection = document.getElementById("auth-section");
    var mainApp = document.getElementById("main-app");
    
    if (authSection) authSection.style.display = "none";
    if (mainApp) mainApp.style.display = "block";
    
    // Date par défaut
    var dateInput = document.getElementById("date-dp");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Initialiser les composants
    updateDPDropdown();
    chargerDonnees();
    setupEventListeners();
    
    // Sauvegarde automatique
    setInterval(function() {
      sauvegarderPlongeurs();
      sauvegarderPalanquees();
    }, 30000); // Toutes les 30 secondes
    
    showNotification("✅ Application JSAS initialisée complètement", "success");
    console.log("✅ JSAS Application complète opérationnelle");
    
  } catch (error) {
    console.error("🔥 Erreur initialisation:", error);
    showNotification("❌ Erreur initialisation", "error");
  }
}

// ===== INITIALISATION AUTOMATIQUE =====
document.addEventListener('DOMContentLoaded', function() {
  console.log("📋 DOM chargé - Démarrage JSAS complet...");
  
  setTimeout(function() {
    initializeFullApp();
  }, 100);
  
  // Gestion Firebase si disponible
  if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(function(user) {
      if (user) {
        console.log("✅ Utilisateur connecté:", user.email);
        window.userConnected = true;
      } else {
        console.log("👤 Mode non connecté");
        window.userConnected = false;
      }
    });
  } else {
    console.log("⚠️ Firebase non disponible - Mode local");
  }
});

console.log("✅ JSAS Palanquées - Application COMPLÈTE chargée v1.0");