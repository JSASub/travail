// ps/floating-menus-manager.js
// Module de gestion des menus flottants pour l'application JSAS
// Gère le bouton de sauvegarde flottant et le menu des plongeurs

(function() {
    'use strict';

    // Variables globales du module
    let plongeursMenuCollapsed = false;
    let floatingMenuInitialized = false;
    let floatingButtonInitialized = false;

    // ===== GESTION DU BOUTON FLOTTANT DE SAUVEGARDE =====

    /**
     * Fonction principale pour sauvegarder depuis le bouton flottant
     */
    function saveSessionFromFloatingButton() {
        const floatingBtn = document.getElementById('floating-save-btn');
        const originalBtn = document.getElementById('valider-dp');
        
        // Désactiver le bouton et afficher le chargement
        floatingBtn.disabled = true;
        floatingBtn.classList.add('loading');
        
        try {
            // Vérifier que les données nécessaires sont présentes
            const dpSelect = document.getElementById('dp-select');
            const dpDate = document.getElementById('dp-date');
            
            if (!dpSelect || !dpSelect.value) {
                showFloatingNotification('⚠ Veuillez sélectionner un Directeur de Plongée', 'error');
                return;
            }
            
            if (!dpDate || !dpDate.value) {
                showFloatingNotification('⚠ Veuillez saisir une date', 'error');
                return;
            }
            
            // Déclencher la fonction de sauvegarde existante en simulant un clic
            if (originalBtn) {
                originalBtn.click();
            }
            
            // Afficher la notification de succès
            const selectedDPText = dpSelect.options[dpSelect.selectedIndex]?.text || dpSelect.value;
            showFloatingNotification(`✅ Session sauvegardée !<br><small>DP: ${selectedDPText}<br>Date: ${dpDate.value}</small>`);
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde depuis le bouton flottant:', error);
            showFloatingNotification('⚠ Erreur lors de la sauvegarde', 'error');
        } finally {
            // Réactiver le bouton
            setTimeout(() => {
                floatingBtn.disabled = false;
                floatingBtn.classList.remove('loading');
            }, 1000);
        }
    }

    /**
     * Afficher les notifications flottantes
     */
    function showFloatingNotification(message, type = 'success') {
        const notification = document.getElementById('save-notification');
        if (!notification) return;
        
        notification.innerHTML = message;
        
        // Appliquer le style selon le type
        if (type === 'error') {
            notification.classList.add('error');
        } else {
            notification.classList.remove('error');
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    /**
     * Gérer la visibilité du bouton flottant
     */
    function updateFloatingButtonVisibility() {
        const floatingBtn = document.getElementById('floating-save-btn');
        const mainApp = document.getElementById('main-app');
        
        if (!floatingBtn) return;
        
        // Afficher le bouton seulement dans l'application principale
        if (mainApp && mainApp.style.display !== 'none') {
            floatingBtn.style.display = 'flex';
        } else {
            floatingBtn.style.display = 'none';
        }
    }

    /**
     * Mettre à jour le texte du bouton selon l'état
     */
    function updateFloatingButtonState() {
        const floatingBtn = document.getElementById('floating-save-btn');
        const btnText = floatingBtn?.querySelector('.btn-text');
        
        if (!floatingBtn || !btnText) return;
        
        const dpSelect = document.getElementById('dp-select');
        const dpDate = document.getElementById('dp-date');
        
        // Vérification simple
        if (dpSelect && dpDate && dpSelect.value && dpDate.value) {
            floatingBtn.style.opacity = '1';
            btnText.textContent = '💾 Save Session + DP';
        } else {
            floatingBtn.style.opacity = '0.8';
            btnText.textContent = '💾 Save Session + DP';
        }
    }

    /**
     * Initialiser le bouton flottant
     */
    function initFloatingButton() {
        if (floatingButtonInitialized) return;
        
        console.log('Initialisation du bouton flottant de sauvegarde...');
        
        // Vérifier la visibilité du bouton
        setInterval(updateFloatingButtonVisibility, 1000);
        
        // Mettre à jour l'état du bouton
        setInterval(updateFloatingButtonState, 1000);
        
        // Mise à jour immédiate
        updateFloatingButtonVisibility();
        updateFloatingButtonState();
        
        // Ajouter le gestionnaire de clic
        const floatingBtn = document.getElementById('floating-save-btn');
        if (floatingBtn) {
            floatingBtn.onclick = saveSessionFromFloatingButton;
        }
        
        floatingButtonInitialized = true;
        console.log('Bouton flottant initialisé avec succès');
    }

    // ===== GESTION DU MENU FLOTTANT DES PLONGEURS =====

    /**
     * Vérifier si l'application principale est visible
     */
    function isMainAppVisible() {
        const mainApp = document.getElementById('main-app');
        return mainApp && mainApp.style.display !== 'none' && 
               window.getComputedStyle(mainApp).display !== 'none';
    }

    /**
     * Basculer l'affichage du menu des plongeurs
     */
    function togglePlongeursMenu() {
        const menu = document.getElementById('floating-plongeurs-menu');
        const list = document.getElementById('floating-plongeurs-list');
        const toggleBtn = document.getElementById('toggle-plongeurs-menu');
        const header = document.getElementById('floating-plongeurs-header');
        
        if (!menu || !list || !toggleBtn || !header) return;
        
        plongeursMenuCollapsed = !plongeursMenuCollapsed;
        
        if (plongeursMenuCollapsed) {
            list.style.display = 'none';
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Cliquer pour agrandir le menu';
            menu.style.maxHeight = '40px';
            header.style.padding = '8px 12px';
            header.style.cursor = 'pointer';
            header.style.backgroundColor = '#f8f9fa';
            header.style.borderRadius = '8px';
            
            // Rendre tout le header cliquable quand rétracté
            header.onclick = function(e) {
                // Éviter le double-clic si on clique sur le bouton
                if (e.target === toggleBtn) return;
                togglePlongeursMenu();
            };
            
            // Ajouter un effet hover visible
            header.onmouseenter = function() {
                if (plongeursMenuCollapsed) {
                    header.style.backgroundColor = '#e9ecef';
                    header.style.transform = 'scale(1.02)';
                    header.style.transition = 'all 0.2s ease';
                }
            };
            
            header.onmouseleave = function() {
                if (plongeursMenuCollapsed) {
                    header.style.backgroundColor = '#f8f9fa';
                    header.style.transform = 'scale(1)';
                }
            };
            
        } else {
            list.style.display = 'block';
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Réduire le menu';
            menu.style.maxHeight = '200px';
            header.style.padding = '6px 12px';
            header.style.cursor = 'move';
            header.style.backgroundColor = '';
            header.style.borderRadius = '';
            header.style.transform = '';
            header.style.transition = '';
            
            // Désactiver le clic sur tout le header quand ouvert
            header.onclick = null;
            header.onmouseenter = null;
            header.onmouseleave = null;
        }
    }

    /**
     * Mettre à jour la liste des plongeurs flottante
     */
    function updateFloatingPlongeursList() {
    const floatingList = document.getElementById('floating-plongeurs-list');
    const floatingCount = document.getElementById('floating-plongeurs-count');
    
    if (!floatingList || !floatingCount) return;
    
    // Obtenir les plongeurs depuis la variable globale
    let plongeurs = window.plongeurs || [];
    
    // AJOUT : Filtrer les plongeurs qui ne sont PAS dans les palanquées
    const plongeursDisponibles = plongeurs.filter(plongeur => {
        // Vérifier si ce plongeur est dans une palanquée
        const estDansPalanquee = window.palanquees && window.palanquees.some(palanquee => 
            palanquee.plongeurs && palanquee.plongeurs.some(p => 
                p.nom === plongeur.nom && p.niveau === plongeur.niveau
            )
        );
        return !estDansPalanquee; // Ne garder que ceux qui ne sont PAS dans une palanquée
    });
    
    // Obtenir le tri actuel de la liste principale
    const currentSortBtn = document.querySelector('.sort-btn.active');
    const currentSort = currentSortBtn ? currentSortBtn.dataset.sort : 'none';
    
    // Copier les plongeurs DISPONIBLES pour ne pas modifier l'original
    let plongeursTriés = [...plongeursDisponibles];
    
    // Appliquer EXACTEMENT le même tri que la liste principale
    switch(currentSort) {
        case 'nom':
            plongeursTriés.sort((a, b) => a.nom.localeCompare(b.nom));
            break;
        case 'niveau':
            // Ordre de priorité identique à ui-interface.js
            const niveauOrder = {
                'E4': 1, 'E3': 2, 'E2': 3, 'GP': 4, 'N4/GP': 5, 'N4': 6,
                'N3': 7, 'N2': 8, 'N1': 9,
                'Plg.Or': 10, 'Plg.Ar': 11, 'Plg.Br': 12,
                'Déb.': 13, 'débutant': 14, 'Déb': 15
            };
            
            plongeursTriés.sort((a, b) => {
                const orderA = niveauOrder[a.niveau] || 99;
                const orderB = niveauOrder[b.niveau] || 99;
                
                // Si même niveau, trier par nom (critère secondaire)
                if (orderA === orderB) {
                    return a.nom.localeCompare(b.nom);
                }
                
                return orderA - orderB;
            });
            break;
        case 'none':
        default:
            // Utiliser l'ordre original exact pour les disponibles seulement
            plongeursTriés = plongeursDisponibles.filter(p => 
                (window.plongeursOriginaux || plongeurs).includes(p)
            );
            break;
    }
    
    // Mettre à jour l'affichage avec l'ordre correct
    floatingCount.textContent = `(${plongeursTriés.length})`;
    floatingList.innerHTML = '';
    
    if (plongeursTriés.length === 0) {
        floatingList.innerHTML = '<div class="floating-plongeurs-empty">Tous les plongeurs sont assignés</div>';
        return;
    }
    
    // Créer les éléments dans l'ordre trié
    plongeursTriés.forEach((plongeur, sortedIndex) => {
        // Trouver l'index original dans window.plongeurs pour le drag & drop
        const originalIndex = window.plongeurs.findIndex(p => 
            p.nom === plongeur.nom && p.niveau === plongeur.niveau && p.pre === plongeur.pre
        );
        
        const nom = plongeur.nom || 'Nom inconnu';
        const niveau = plongeur.niveau || 'N/A';
        
        const floatingItem = document.createElement('div');
        floatingItem.className = 'floating-plongeur-item';
        floatingItem.draggable = true;
        floatingItem.dataset.originalIndex = originalIndex;
        floatingItem.dataset.sortedIndex = sortedIndex;
        
        floatingItem.innerHTML = `
            <span class="floating-plongeur-nom">${nom}</span>
            <span class="floating-plongeur-niveau">${niveau}</span>
        `;
        
        // Events de drag & drop
        floatingItem.addEventListener('dragstart', function(e) {
            floatingItem.classList.add('dragging');
            
            const dragData = {
                type: "fromMainList",
                plongeur: {
                    nom: plongeur.nom,
                    niveau: plongeur.niveau,
                    pre: plongeur.pre || ''
                },
                originalIndex: originalIndex
            };
            
            try {
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                e.dataTransfer.effectAllowed = 'move';
                window.dragData = dragData;
            } catch (error) {
                window.dragData = dragData;
            }
        });
        
        floatingItem.addEventListener('dragend', function(e) {
            floatingItem.classList.remove('dragging');
            window.dragData = null;
        });
        
        floatingList.appendChild(floatingItem);
    });
    
    console.log('Menu synchronisé - Disponibles:', plongeursTriés.length, '- Tri:', currentSort);
}

    /**
     * Gérer la visibilité du menu des plongeurs
     */
	function updateFloatingPlongeursVisibility() {
		const menu = document.getElementById('floating-plongeurs-menu');
		const mainApp = document.getElementById('main-app');
    
		if (!menu) return;
    
		// Afficher le menu si l'application principale est visible
		if (mainApp && mainApp.style.display !== 'none') {
			menu.style.display = 'flex';
			console.log('Menu latéral maintenu visible');
		}
		// ✅ SUPPRIMÉ le else qui cachait le menu
	}
    /**
     * Synchronisation automatique du menu des plongeurs
     */
    function autoSyncPlongeursMenu() {
        // Vérifier si les variables globales existent et sont synchronisées
        if (typeof window.plongeurs === 'undefined') {
            window.plongeurs = [];
        }
        
        const listDOM = document.getElementById('listePlongeurs');
        const domCount = listDOM ? listDOM.children.length : 0;
        const globalCount = window.plongeurs.length;
        
        // Si désynchronisation détectée, corriger
        if (domCount > 0 && (globalCount === 0 || domCount !== globalCount)) {
            console.log('Désynchronisation détectée - Correction automatique...');
            window.plongeurs = [];
            
            Array.from(listDOM.children).forEach(li => {
                const nomSpan = li.querySelector('.plongeur-nom');
                const niveauSpan = li.querySelector('.plongeur-niveau');
                const preSpan = li.querySelector('.plongeur-prerogatives');
                
                if (nomSpan && niveauSpan) {
                    window.plongeurs.push({
                        nom: nomSpan.textContent.trim(),
                        niveau: niveauSpan.textContent.trim(),
                        pre: preSpan ? preSpan.textContent.replace(/[\[\]]/g, '').trim() : ''
                    });
                }
            });
            
            window.plongeursOriginaux = [...window.plongeurs];
            
            // Mettre à jour le menu flottant
            updateFloatingPlongeursList();
            
            console.log('Synchronisation automatique terminée:', window.plongeurs.length, 'plongeurs');
        }
    }

    /**
     * Rendre le menu déplaçable
     */
    function makeMenuDraggable() {
        const menu = document.getElementById('floating-plongeurs-menu');
        const header = document.getElementById('floating-plongeurs-header');
        
        if (!menu || !header) return;
        
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('toggle-btn')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(menu).right);
            startTop = parseInt(window.getComputedStyle(menu).bottom);
            
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const deltaX = startX - e.clientX;
            const deltaY = e.clientY - startY;
            
            menu.style.right = (startLeft + deltaX) + 'px';
            menu.style.bottom = (startTop - deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
            }
        });
    }

    /**
     * Initialisation sécurisée du menu des plongeurs
     */
    function initFloatingPlongeursMenuSafe() {
        // Éviter la double initialisation
        if (floatingMenuInitialized) {
            console.log('Menu déjà initialisé, mise à jour...');
            updateFloatingPlongeursList();
            updateFloatingPlongeursVisibility();
            return true;
        }

        console.log('Initialisation sécurisée du menu des plongeurs...');
        
        // Vérifier que les éléments DOM existent
        const menu = document.getElementById('floating-plongeurs-menu');
        const mainApp = document.getElementById('main-app');
        
        if (!menu || !mainApp) {
            console.warn('Éléments DOM non trouvés, report de l\'initialisation');
            return false;
        }

        // Vérifier que l'application principale est visible
        if (!isMainAppVisible()) {
            console.log('Application principale non visible, report...');
            return false;
        }

        // Vérifier que les variables globales existent
        if (typeof window.plongeurs === 'undefined') {
            window.plongeurs = [];
        }
        
        // Marquer comme initialisé
        floatingMenuInitialized = true;
        
        // Initialisation complète
        updateFloatingPlongeursList();
        updateFloatingPlongeursVisibility();
        
        // Mettre à jour régulièrement
        setInterval(updateFloatingPlongeursList, 3000);
        //setInterval(updateFloatingPlongeursVisibility, 1000);
        
        // Observer les changements
        let lastPlongeursLength = window.plongeurs.length;
        
        setInterval(() => {
            if (typeof window.plongeurs !== 'undefined' && window.plongeurs.length !== lastPlongeursLength) {
                console.log('Changement détecté dans plongeurs:', lastPlongeursLength, '->', window.plongeurs.length);
                lastPlongeursLength = window.plongeurs.length;
                updateFloatingPlongeursList();
            }
        }, 500);
        
        // Observer les changements dans le DOM
        const originalList = document.getElementById('listePlongeurs');
        if (originalList) {
            const observer = new MutationObserver(function(mutations) {
                console.log('Changement DOM détecté dans la liste des plongeurs');
                setTimeout(updateFloatingPlongeursList, 100);
            });
            observer.observe(originalList, {
                childList: true,
                subtree: true
            });
        }
        
        // Rendre le menu déplaçable
        makeMenuDraggable();
        
        // Synchroniser la largeur avec le bouton de sauvegarde
        setTimeout(() => {
            const saveBtn = document.getElementById('floating-save-btn');
            if (saveBtn && menu) {
                menu.style.width = saveBtn.offsetWidth + 'px';
            }
        }, 500);
        
        // Ajouter le gestionnaire pour le bouton toggle
        const toggleBtn = document.getElementById('toggle-plongeurs-menu');
        if (toggleBtn) {
            toggleBtn.onclick = togglePlongeursMenu;
        }
        
        console.log('Menu des plongeurs initialisé avec succès');
        return true;
    }

    /**
     * Surveiller et initialiser le menu dès que possible
     */
    function watchForMainAppVisibility() {
        const checkInterval = setInterval(() => {
            if (isMainAppVisible() && !floatingMenuInitialized) {
                console.log('Application principale détectée, initialisation du menu...');
                const success = initFloatingPlongeursMenuSafe();
                if (success) {
                    clearInterval(checkInterval);
                }
            }
        }, 500); // Vérification toutes les 500ms

        // Arrêter la surveillance après 30 secondes pour éviter les fuites de mémoire
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30000);
    }

    /**
     * Fonction à appeler après une connexion réussie
     */
    function onUserAuthenticated() {
        console.log('Utilisateur connecté, initialisation des éléments UI...');
        
        // Attendre que l'application principale soit visible
        setTimeout(() => {
            initFloatingButton();
            initFloatingPlongeursMenuSafe();
            enhanceDragDropCompatibility();
        }, 500);
    }

    /**
     * Surveilleur de l'état d'authentification Firebase
     */
    function setupAuthStateListener() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    console.log('État d\'authentification : utilisateur connecté');
                    // L'utilisateur est connecté, initialiser les menus
                    setTimeout(onUserAuthenticated, 1000);
                } else {
                    console.log('État d\'authentification : utilisateur déconnecté');
                    // Réinitialiser l'état
                    floatingMenuInitialized = false;
                    floatingButtonInitialized = false;
                }
            });
        }
    }

    // ===== GESTION DU DRAG & DROP =====

    /**
     * Améliorer la compatibilité du drag & drop
     */
    function enhanceDragDropCompatibility() {
        // S'assurer que la variable globale dragData existe
        if (typeof window.dragData === 'undefined') {
            window.dragData = null;
        }
        
        // Améliorer les handlers existants pour supporter le menu flottant
        const originalHandleDrop = window.handleDrop;
        
        if (originalHandleDrop) {
            window.handleDrop = function(e) {
                console.log('Drop amélioré détecté');
                
                // Essayer d'abord la logique originale
                try {
                    originalHandleDrop.call(this, e);
                } catch (error) {
                    console.warn('Erreur handler original:', error);
                    
                    // Fallback pour le menu flottant
                    handleFloatingMenuDrop(e);
                }
            };
        }
    }

    /**
     * Handler de drop spécifique pour le menu flottant
     */
    function handleFloatingMenuDrop(e) {
        e.preventDefault();
        
        const dropZone = e.target.closest('.palanquee') || e.target.closest('#listePlongeurs');
        if (!dropZone) return;
        
        dropZone.classList.remove('drag-over');
        
        // Récupérer les données
        let data = window.dragData;
        
        if (!data) {
            try {
                const dataStr = e.dataTransfer.getData('text/plain');
                if (dataStr) {
                    data = JSON.parse(dataStr);
                }
            } catch (error) {
                console.warn('Erreur parsing dataTransfer:', error);
            }
        }
        
        if (!data) return;
        
        console.log('Données de drop:', data);
        
        // S'assurer que les variables globales existent
        if (typeof window.plongeurs === 'undefined') window.plongeurs = [];
        if (typeof window.palanquees === 'undefined') window.palanquees = [];
        
        // Drop vers la liste principale
        if (dropZone.id === 'listePlongeurs') {
            console.log('Drop vers liste principale');
            return; // La logique principale devrait gérer cela
        } else {
            // Drop vers une palanquée
            const palanqueeIndex = parseInt(dropZone.dataset.index);
            if (isNaN(palanqueeIndex)) return;
            
            console.log('Drop vers palanquée', palanqueeIndex);
            
            if (data.type === "fromMainList") {
                // Trouver et supprimer le plongeur de la liste principale
                const indexToRemove = data.originalIndex;
                
                if (indexToRemove >= 0 && indexToRemove < window.plongeurs.length) {
                    const plongeur = window.plongeurs.splice(indexToRemove, 1)[0];
                    
                    // Ajouter à la palanquée
                    if (window.palanquees[palanqueeIndex]) {
                        window.palanquees[palanqueeIndex].push(plongeur);
                        
                        console.log('Plongeur déplacé:', plongeur.nom, 'vers palanquée', palanqueeIndex + 1);
                        
                        // Synchroniser
                        if (typeof window.syncToDatabase === 'function') {
                            window.syncToDatabase();
                        }
                    }
                }
            }
        }
        
        // Nettoyer
        window.dragData = null;
    }

    // ===== GESTION DES RACCOURCIS CLAVIER =====

    /**
     * Initialiser les raccourcis clavier
     */
    function initKeyboardShortcuts() {
        // Raccourci clavier pour sauvegarder (Ctrl+S)
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const floatingBtn = document.getElementById('floating-save-btn');
                if (floatingBtn && floatingBtn.style.display !== 'none' && !floatingBtn.disabled) {
                    saveSessionFromFloatingButton();
                }
            }
        });
    }

    // ===== INITIALISATION PRINCIPALE =====

    /**
     * Initialisation principale du module
     */
    function initFloatingMenusManager() {
        console.log('Initialisation du gestionnaire de menus flottants...');
        
        // Initialiser les raccourcis clavier
        initKeyboardShortcuts();
        
        // Surveiller les changements d'état d'authentification
        setupAuthStateListener();
        
        // Surveiller la visibilité de l'application principale
        watchForMainAppVisibility();
        
        // Initialisation immédiate si l'application est déjà visible
        setTimeout(() => {
            if (isMainAppVisible()) {
                initFloatingButton();
                initFloatingPlongeursMenuSafe();
                enhanceDragDropCompatibility();
            }
        }, 1000);
        
        // Synchronisation automatique du menu des plongeurs
        setInterval(autoSyncPlongeursMenu, 2000);
        setTimeout(autoSyncPlongeursMenu, 3000);
        
        console.log('Gestionnaire de menus flottants initialisé');
    }

    // ===== FONCTIONS DE DEBUG =====

    /**
     * Fonction de debug pour le menu des plongeurs
     */
    window.testPlongeursMenu = function() {
        console.log('=== DEBUG MENU PLONGEURS ===');
        console.log('Plongeurs globaux:', window.plongeurs);
        console.log('Nombre:', window.plongeurs?.length || 0);
        
        const menu = document.getElementById('floating-plongeurs-menu');
        console.log('Menu visible:', menu?.style.display);
        
        // Forcer la mise à jour
        updateFloatingPlongeursList();
        
        console.log('=== FIN DEBUG ===');
    };

    /**
     * Forcer la mise à jour du menu des plongeurs
     */
    window.forceUpdatePlongeursMenu = function() {
        console.log('Mise à jour forcée du menu des plongeurs');
        updateFloatingPlongeursList();
        updateFloatingPlongeursVisibility();
    };

    /**
     * Debug complet du menu flottant
     */
    window.debugFloatingMenu = function() {
        console.log('=== DEBUG MENU FLOTTANT ===');
        console.log('Menu initialisé:', floatingMenuInitialized);
        console.log('Bouton initialisé:', floatingButtonInitialized);
        console.log('App principale visible:', isMainAppVisible());
        console.log('Plongeurs globaux:', window.plongeurs?.length || 0);
        
        const menu = document.getElementById('floating-plongeurs-menu');
        const mainApp = document.getElementById('main-app');
        const saveBtn = document.getElementById('floating-save-btn');
        
        console.log('Menu element:', !!menu);
        console.log('Menu display style:', menu?.style.display);
        console.log('Save button element:', !!saveBtn);
        console.log('Save button display:', saveBtn?.style.display);
        console.log('Main app element:', !!mainApp);
        console.log('Main app display style:', mainApp?.style.display);
        
        console.log('=== FIN DEBUG ===');
    };

    // ===== EXPOSITION DES FONCTIONS PUBLIQUES =====

    // Exposer les fonctions publiques nécessaires
    window.saveSessionFromFloatingButton = saveSessionFromFloatingButton;
    window.togglePlongeursMenu = togglePlongeursMenu;
    window.initFloatingMenusManager = initFloatingMenusManager;

    // Auto-initialisation lors du chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingMenusManager);
    } else {
        // Si le DOM est déjà chargé
        setTimeout(initFloatingMenusManager, 100);
    }

})();