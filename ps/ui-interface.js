// ui-interface.js - Interface utilisateur et utilitaires avec système de verrous (VERSION SÉCURISÉE)

// ===== COMPTEURS D'AFFICHAGE CORRIGÉS =====
function updateCompteurs() {
  try {
    // Compter les plongeurs de manière sécurisée
    const plongeursCount = Array.isArray(window.plongeurs) ? window.plongeurs.length : 0;
    
    // NOUVELLE MÉTHODE UNIFIÉE POUR COMPTER LES PALANQUÉES
    let palanqueesCount = 0;
    let plongeursEnPalanquees = 0;
    
    // Méthode 1: Depuis le DOM (plus fiable pour l'affichage)
    const palanqueeElements = document.querySelectorAll('.palanquee');
    palanqueesCount = palanqueeElements.length;
    
    // Compter les plongeurs dans le DOM
    palanqueeElements.forEach(palanqueeEl => {
      const plongeurItems = palanqueeEl.querySelectorAll('.palanquee-plongeur-item');
      plongeursEnPalanquees += plongeurItems.length;
    });
    
    // Fallback: vérifier avec la variable globale si DOM vide
    if (palanqueesCount === 0 && Array.isArray(window.palanquees) && window.palanquees.length > 0) {
      palanqueesCount = window.palanquees.length;
      
      for (let i = 0; i < window.palanquees.length; i++) {
        const pal = window.palanquees[i];
        if (Array.isArray(pal)) {
          plongeursEnPalanquees += pal.length;
        } else if (pal && typeof pal.length === 'number') {
          plongeursEnPalanquees += pal.length;
        }
      }
    }
    
    // Mettre à jour les compteurs dans l'interface
    const compteurPlongeurs = document.getElementById('compteur-plongeurs');
    if (compteurPlongeurs) {
      compteurPlongeurs.textContent = `(${plongeursCount})`;
    }
    
    const compteurPalanquees = document.getElementById('compteur-palanquees');
    if (compteurPalanquees) {
      // CORRECTION: S'assurer que le texte est correct
      const texteCorrect = `(${plongeursEnPalanquees} plongeurs dans ${palanqueesCount} palanquées)`;
      
      // Ne mettre à jour que si différent pour éviter les conflits
      if (compteurPalanquees.textContent !== texteCorrect) {
        compteurPalanquees.textContent = texteCorrect;
        console.log(`✅ Compteur palanquées mis à jour: ${texteCorrect}`);
      }
    }
    
    console.log(`Compteurs: ${plongeursCount} plongeurs disponibles, ${palanqueesCount} palanquées, ${plongeursEnPalanquees} plongeurs assignés`);
    
  } catch (error) {
    console.error('Erreur updateCompteurs:', error);
    
    // Fallback sécurisé
    const compteurPlongeurs = document.getElementById('compteur-plongeurs');
    if (compteurPlongeurs) {
      compteurPlongeurs.textContent = '(?)';
    }
    
    const compteurPalanquees = document.getElementById('compteur-palanquees');
    if (compteurPalanquees) {
      compteurPalanquees.textContent = '(Erreur de comptage)';
    }
  }
}

// NOUVELLE FONCTION: Force la mise à jour des compteurs depuis le DOM
function forceUpdateCompteursFromDOM() {
  try {
    const palanqueeElements = document.querySelectorAll('.palanquee');
    const palanqueesCount = palanqueeElements.length;
    
    let plongeursEnPalanquees = 0;
    palanqueeElements.forEach(palanqueeEl => {
      plongeursEnPalanquees += palanqueeEl.querySelectorAll('.palanquee-plongeur-item').length;
    });
    
    const plongeursCount = Array.isArray(window.plongeurs) ? window.plongeurs.length : 0;
    
    // Mettre à jour immédiatement
    const compteurPlongeurs = document.getElementById('compteur-plongeurs');
    const compteurPalanquees = document.getElementById('compteur-palanquees');
    
    if (compteurPlongeurs) {
      compteurPlongeurs.textContent = `(${plongeursCount})`;
    }
    
    if (compteurPalanquees) {
      compteurPalanquees.textContent = `(${plongeursEnPalanquees} plongeurs dans ${palanqueesCount} palanquées)`;
    }
    
    console.log(`🔄 Compteurs forcés depuis DOM: ${palanqueesCount} palanquées, ${plongeursEnPalanquees} plongeurs assignés`);
    
  } catch (error) {
    console.error('Erreur forceUpdateCompteursFromDOM:', error);
  }
}

// ===== NOUVEAU : GESTION DES VERROUS UI (VERSION SÉCURISÉE) =====
function updatePalanqueeLockUI() {
  if (!currentUser || typeof palanqueeLocks === 'undefined') {
    return; // Sortir silencieusement si pas prêt
  }
  
  try {
    // Créer ou mettre à jour l'indicateur de statut DP
    let statusIndicator = $("dp-status-indicator");
    
    if (!statusIndicator) {
      statusIndicator = document.createElement("div");
      statusIndicator.id = "dp-status-indicator";
      statusIndicator.className = "dp-status-indicator";
      
      const metaInfo = $("meta-info");
      if (metaInfo) {
        metaInfo.insertAdjacentElement('afterend', statusIndicator);
      } else {
        // Si meta-info n'existe pas encore, ne pas créer l'indicateur
        return;
      }
    }
    
    const lockCount = Object.keys(palanqueeLocks).length;
    const activeLocks = Object.values(palanqueeLocks).map(lock => lock.userName).join(', ');
    
    statusIndicator.innerHTML = `
      <span class="dp-status-icon">👨‍💼</span>
      <span>Système DP actif - ${lockCount} palanquée(s) en modification</span>
      ${lockCount > 0 ? `<span style="font-size: 12px; color: #666;"> (${activeLocks})</span>` : ''}
    `;
    
    // Mettre à jour les palanquées existantes
    document.querySelectorAll('.palanquee').forEach((element, index) => {
      const palanqueeId = `palanquee-${index}`;
      const lock = palanqueeLocks[palanqueeId];
      
      // Supprimer les anciens indicateurs
      const oldIndicator = element.querySelector('.lock-indicator');
      if (oldIndicator) {
        oldIndicator.remove();
      }
      
      // Réinitialiser les classes
      element.classList.remove('editing-self', 'editing-other');
      element.style.pointerEvents = 'auto';
      element.style.opacity = '1';
      
      // Réactiver tous les champs
      const fields = element.querySelectorAll('input, select, textarea');
      fields.forEach(field => {
        field.disabled = false;
        field.classList.remove('locked-field');
      });
      
      if (lock && currentUser) {
        const indicator = document.createElement('div');
        indicator.className = 'lock-indicator';
        
        if (lock.userId === currentUser.uid) {
          indicator.className += ' editing-self';
          indicator.textContent = '🔧 En modification par vous';
          element.classList.add('editing-self');
        } else {
          indicator.className += ' editing-other';
          indicator.textContent = `🔒 ${lock.userName} modifie`;
          element.classList.add('editing-other');
          element.style.pointerEvents = 'none';
          element.style.opacity = '0.7';
          
          // Désactiver tous les champs
          fields.forEach(field => {
            field.disabled = true;
            field.classList.add('locked-field');
          });
        }
        
        const title = element.querySelector('.palanquee-title');
        if (title) {
          title.appendChild(indicator);
        }
      }
    });
  } catch (error) {
    console.error("⚠ Erreur updatePalanqueeLockUI:", error);
  }
}

// Notifications de verrous (VERSION SÉCURISÉE)
function showLockNotification(message, type = "info") {
  try {
    let container = $("lock-notifications");
    
    if (!container) {
      container = document.createElement("div");
      container.id = "lock-notifications";
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1500;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
    
    const notification = document.createElement("div");
    notification.style.cssText = `
      background: white;
      border-left: 4px solid ${type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 4000);
  } catch (error) {
    console.error("⚠ Erreur showLockNotification:", error);
  }
}

// ===== SYSTÈME D'ALERTES AVEC NOUVELLES RÈGLES =====
function checkAllAlerts() {
  try {
    const alertes = [];
    
    if (!Array.isArray(palanquees)) {
      console.warn("⚠️ palanquees n'est pas un tableau dans checkAllAlerts");
      return alertes;
    }
    
    palanquees.forEach((palanquee, idx) => {
      if (!Array.isArray(palanquee)) {
        console.warn(`⚠️ palanquee ${idx} n'est pas un tableau`);
        return;
      }
      
      // Classification des plongeurs selon les nouvelles règles
      const n1s = palanquee.filter(p => p && p.niveau === "N1");
      const plgOr = palanquee.filter(p => p && p.niveau === "Plg.Or");
      const plgAr = palanquee.filter(p => p && p.niveau === "Plg.Ar");
      const plgBr = palanquee.filter(p => p && p.niveau === "Plg.Br");
      const debutants = palanquee.filter(p => p && ["Déb.", "débutant", "Déb"].includes(p.niveau));
      const gps = palanquee.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4", "GP"].includes(p.niveau));
      const autonomes = palanquee.filter(p => p && ["N2", "N3"].includes(p.niveau));
      
      // RÈGLES GÉNÉRALES
      if (palanquee.length > 5) {
        alertes.push(`Palanquée ${idx + 1}: Plus de 5 plongeurs (${palanquee.length})`);
      }
      
      if (palanquee.length <= 1) {
        alertes.push(`Palanquée ${idx + 1}: Palanquée de ${palanquee.length} plongeur(s)`);
      }
      
      // NOUVELLES RÈGLES POUR LES PLONGEURS BRONZE
      if (plgBr.length > 0) {
        if (gps.length === 0) {
          alertes.push(`Palanquée ${idx + 1}: Plongeur(s) Bronze sans Guide de Palanquée (GP/E2/E3/E4)`);
        }
        if (plgBr.length > 2) {
          alertes.push(`Palanquée ${idx + 1}: Plus de 2 plongeurs Bronze autorisés (${plgBr.length})`);
        }
      }
      
      // NOUVELLES RÈGLES POUR LES PLONGEURS ARGENT
      if (plgAr.length > 0) {
        if (gps.length === 0) {
          alertes.push(`Palanquée ${idx + 1}: Plongeur(s) Argent sans Guide de Palanquée (GP/E2/E3/E4)`);
        }
        if (plgAr.length > 2) {
          alertes.push(`Palanquée ${idx + 1}: Plus de 2 plongeurs Argent autorisés (${plgAr.length})`);
        }
      }
      
      // NOUVELLES RÈGLES POUR LES PLONGEURS OR (considérés comme N1)
      const totalN1etOr = n1s.length + plgOr.length;
      if (totalN1etOr > 0 && gps.length === 0) {
        alertes.push(`Palanquée ${idx + 1}: N1/Plongeur Or sans Guide de Palanquée`);
      }
      
      // RÈGLES POUR LES DÉBUTANTS
      if (debutants.length > 0 && gps.length === 0) {
        alertes.push(`Palanquée ${idx + 1}: Débutant(s) sans Guide de Palanquée`);
      }
      
      // RÈGLES POUR LES AUTONOMES
      if (autonomes.length > 3) {
        alertes.push(`Palanquée ${idx + 1}: Plus de 3 plongeurs autonomes (${autonomes.length})`);
      }
      
      // RÈGLE EFFECTIF AVEC GP
      if ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0) {
        alertes.push(`Palanquée ${idx + 1}: ${palanquee.length} plongeurs sans Guide de Palanquée`);
      }
      
      // RÈGLES SPÉCIFIQUES JEUNES PLONGEURS (mélange avec adultes)
      const jeunesPlongeurs = plgBr.length + plgAr.length + plgOr.length;
      const plongeursAdultes = n1s.length + autonomes.length + debutants.length;
      
      if (jeunesPlongeurs > 0 && plongeursAdultes > 0) {
        // Effectif maximal palanquée avec enfants : 3 plongeurs dont 2 enfants max
        if (palanquee.length > 3) {
          alertes.push(`Palanquée ${idx + 1}: Effectif trop important avec jeunes plongeurs (max 3, actuel ${palanquee.length})`);
        }
        if (jeunesPlongeurs > 2) {
          alertes.push(`Palanquée ${idx + 1}: Plus de 2 jeunes plongeurs autorisés avec adultes (${jeunesPlongeurs})`);
        }
      }
      
      // RÈGLES POUR PALANQUÉE UNIQUEMENT JEUNES PLONGEURS
      if (jeunesPlongeurs > 0 && plongeursAdultes === 0 && gps.length > 0) {
        if (palanquee.length > 3) { // 2 enfants + 1 GP
          alertes.push(`Palanquée ${idx + 1}: Effectif trop important pour palanquée jeunes (max 3 avec GP, actuel ${palanquee.length})`);
        }
      }
    });
    
    return alertes;
  } catch (error) {
    console.error("⚠ Erreur checkAllAlerts:", error);
    return [];
  }
}

function updateAlertes() {
  try {
    const alertes = checkAllAlerts();
    const alerteSection = $("alertes-section");
    const alerteContent = $("alertes-content");
    
    if (alerteSection && alerteContent) {
      if (alertes.length === 0) {
        alerteSection.classList.add("alert-hidden");
      } else {
        alerteSection.classList.remove("alert-hidden");
        alerteContent.innerHTML = alertes.map(alerte => 
          `<div class="alert-item">${alerte}</div>`
        ).join('');
      }
    }
  } catch (error) {
    console.error("⚠ Erreur updateAlertes:", error);
  }
}

function checkAlert(palanquee) {
  try {
    // Vérifier que palanquee est bien un tableau
    if (!Array.isArray(palanquee)) {
      console.warn("⚠️ checkAlert: palanquee n'est pas un tableau:", palanquee);
      
      // Si c'est un objet, essayer de le convertir à la volée
      if (palanquee && typeof palanquee === 'object') {
        const plongeursArray = [];
        Object.keys(palanquee).forEach(key => {
          if (!isNaN(key) && palanquee[key] && typeof palanquee[key] === 'object' && palanquee[key].nom) {
            plongeursArray.push(palanquee[key]);
          }
        });
        
        // Utiliser le tableau converti pour la vérification
        return checkAlertForArray(plongeursArray);
      }
      
      return false;
    }
    
    return checkAlertForArray(palanquee);
  } catch (error) {
    console.error("⚠ Erreur checkAlert:", error);
    return false;
  }
}

function checkAlertForArray(palanquee) {
  // Classification des plongeurs selon les nouvelles règles
  const n1s = palanquee.filter(p => p && p.niveau === "N1");
  const plgOr = palanquee.filter(p => p && p.niveau === "Plg.Or");
  const plgAr = palanquee.filter(p => p && p.niveau === "Plg.Ar");
  const plgBr = palanquee.filter(p => p && p.niveau === "Plg.Br");
  const debutants = palanquee.filter(p => p && ["Déb.", "débutant", "Déb"].includes(p.niveau));
  const gps = palanquee.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4", "GP"].includes(p.niveau));
  const autonomes = palanquee.filter(p => p && ["N2", "N3"].includes(p.niveau));
  
  // Calculs pour les vérifications
  const totalN1etOr = n1s.length + plgOr.length;
  const jeunesPlongeurs = plgBr.length + plgAr.length + plgOr.length;
  const plongeursAdultes = n1s.length + autonomes.length + debutants.length;
  
  // Vérifications des alertes selon les nouvelles règles
  const alertes = [
    // Effectif général
    palanquee.length > 5,
    palanquee.length <= 1,
    
    // Nouvelles règles Plongeurs Bronze
    (plgBr.length > 0 && gps.length === 0),
    (plgBr.length > 2),
    
    // Nouvelles règles Plongeurs Argent
    (plgAr.length > 0 && gps.length === 0),
    (plgAr.length > 2),
    
    // N1 et Plongeurs Or (Or considéré comme N1)
    (totalN1etOr > 0 && gps.length === 0),
    
    // Débutants
    (debutants.length > 0 && gps.length === 0),
    
    // Autonomes
    (autonomes.length > 3),
    
    // Effectif sans GP
    ((palanquee.length === 4 || palanquee.length === 5) && gps.length === 0),
    
    // Nouvelles règles mélange jeunes/adultes
    (jeunesPlongeurs > 0 && plongeursAdultes > 0 && palanquee.length > 3),
    (jeunesPlongeurs > 0 && plongeursAdultes > 0 && jeunesPlongeurs > 2),
    
    // Palanquée uniquement jeunes
    (jeunesPlongeurs > 0 && plongeursAdultes === 0 && gps.length > 0 && palanquee.length > 3)
  ];
  
  return alertes.some(alerte => alerte);
}

// ===== FONCTION DE VALIDATION AVANT AJOUT À UNE PALANQUÉE =====
// Alternative avec validation basique uniquement sur l'effectif maximum
function validatePalanqueeAdditionBasic(palanqueeIndex, newPlongeur) {
  if (!Array.isArray(palanquees[palanqueeIndex])) return { valid: false, messages: ["Erreur: palanquée invalide"] };
  
  // Simuler l'ajout pour tester
  const testPalanquee = [...palanquees[palanqueeIndex], newPlongeur];
  
  // Validation basique - seulement l'effectif maximum
  if (testPalanquee.length > 5) {
    return {
      valid: false,
      messages: ["🚫 Maximum 5 plongeurs par palanquée"]
    };
  }
  
  return { 
    valid: true, 
    messages: ["✅ Ajout autorisé"] 
  };
}

// ===== FONCTION POUR AFFICHER LES STATISTIQUES DÉTAILLÉES =====
function getDetailedStats(palanquee) {
  if (!Array.isArray(palanquee)) return "Stats indisponibles";
  
  const stats = {
    gps: palanquee.filter(p => p && ["N4/GP", "N4", "E2", "E3", "E4", "GP"].includes(p.niveau)).length,
    n1s: palanquee.filter(p => p && p.niveau === "N1").length,
    autonomes: palanquee.filter(p => p && ["N2", "N3"].includes(p.niveau)).length,
    plgOr: palanquee.filter(p => p && p.niveau === "Plg.Or").length,
    plgAr: palanquee.filter(p => p && p.niveau === "Plg.Ar").length,
    plgBr: palanquee.filter(p => p && p.niveau === "Plg.Br").length,
    debutants: palanquee.filter(p => p && ["Déb.", "débutant", "Déb"].includes(p.niveau)).length
  };
  
  let display = `GP: ${stats.gps}`;
  
  if (stats.n1s > 0 || stats.plgOr > 0) {
    display += ` | N1/Or: ${stats.n1s + stats.plgOr}`;
  }
  
  if (stats.autonomes > 0) {
    display += ` | Auto: ${stats.autonomes}`;
  }
  
  if (stats.plgAr > 0) {
    display += ` | Argent: ${stats.plgAr}`;
  }
  
  if (stats.plgBr > 0) {
    display += ` | Bronze: ${stats.plgBr}`;
  }
  
  if (stats.debutants > 0) {
    display += ` | Déb: ${stats.debutants}`;
  }
  
  return display;
}

// ===== TRI DES PLONGEURS AVEC NOUVEAUX NIVEAUX =====
function sortPlongeurs(type) {
  try {
    currentSort = type;
    
    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.sort === type) {
        btn.classList.add('active');
      }
    });
    
    switch(type) {
      case 'nom':
        plongeurs.sort((a, b) => a.nom.localeCompare(b.nom));
        break;
      case 'niveau':
		const niveauOrder = {
			'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
			'N3': 7, 'N2': 8, 'N1': 9,
			'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
			'Déb.': 13, 'débutant': 14, 'Déb': 15
	  };
  
	  plongeurs.sort((a, b) => {
		const orderA = niveauOrder[a.niveau] || 99;
		const orderB = niveauOrder[b.niveau] || 99;
    
		// Si même niveau, trier par nom
		if (orderA === orderB) {
			return a.nom.localeCompare(b.nom);
		}
    
		return orderA - orderB;
	});
	break;
      case 'none':
      default:
        plongeurs = [...plongeursOriginaux];
        break;
    }
	// Mettre à jour le menu flottant avec le même tri
	if (typeof updateFloatingPlongeursList === 'function') {
		setTimeout(updateFloatingPlongeursList, 100);
	}
    
    if (typeof renderPlongeurs === 'function') {
      renderPlongeurs();
    }
  } catch (error) {
    console.error("⚠ Erreur sortPlongeurs:", error);
  }

}

// ===== EXPORT JSON =====
function exportToJSON() {
  try {
    const dpNom = $("dp-nom")?.value || "Non défini";
    const dpDate = $("dp-date")?.value || "Non définie";
    const dpLieu = $("dp-lieu")?.value || "Non défini";
    const dpPlongee = $("dp-plongee")?.value || "matin";
    
    const exportData = {
      meta: {
        dp: dpNom,
        date: dpDate,
        lieu: dpLieu,
        plongee: dpPlongee,
        version: "7.7.1",
        exportDate: new Date().toISOString()
      },
      plongeurs: plongeurs.map(p => ({
        nom: p.nom,
        niveau: p.niveau,
        prerogatives: p.pre || ""
      })),
      palanquees: palanquees.map((pal, idx) => ({
        numero: idx + 1,
        plongeurs: pal.map(p => ({
          nom: p.nom,
          niveau: p.niveau,
          prerogatives: p.pre || ""
        })),
        alertes: checkAlert(pal) ? checkAllAlerts().filter(a => a.includes(`Palanquée ${idx + 1}`)) : []
      })),
      resume: {
        totalPlongeurs: plongeurs.length + palanquees.flat().length,
        nombrePalanquees: palanquees.length,
        plongeursNonAssignes: plongeurs.length,
        alertesTotal: checkAllAlerts().length
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palanquees-${dpDate || 'export'}-${dpPlongee}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log("📤 Export JSON effectué");
  } catch (error) {
    console.error("⚠ Erreur exportToJSON:", error);
    alert("Erreur lors de l'export : " + error.message);
  }
}

// Exposer la fonction de correction forcée
window.forceUpdateCompteursFromDOM = forceUpdateCompteursFromDOM;