// data-validator-fixer.js - Validateur et correcteur de données JSAS

// ===== VALIDATEUR DE DONNÉES =====
class JSASDataValidator {
  constructor(logger) {
    this.logger = logger;
    this.validationRules = this.setupValidationRules();
    this.fixStrategies = this.setupFixStrategies();
  }
  
  setupValidationRules() {
    return {
      plongeur: {
        required: ['nom', 'niveau'],
        optional: ['pre'],
        types: {
          nom: 'string',
          niveau: 'string',
          pre: 'string'
        },
        constraints: {
          nom: { minLength: 2, maxLength: 100 },
          niveau: { 
            enum: ['E4', 'E3', 'E2', 'GP', 'N4/GP', 'N4', 'N3', 'N2', 'N1', 
                   'Plg.Or', 'Plg.Ar', 'Plg.Br', 'Déb.', 'débutant', 'Déb'] 
          },
          pre: { maxLength: 50 }
        }
      },
      palanquee: {
        structure: 'array',
        properties: {
          horaire: 'string',
          profondeurPrevue: 'string',
          dureePrevue: 'string',
          profondeurRealisee: 'string',
          dureeRealisee: 'string',
          paliers: 'string'
        },
        constraints: {
          maxLength: 5, // Maximum 5 plongeurs par palanquée
          minLength: 0
        }
      },
      session: {
        required: ['meta', 'plongeurs', 'palanquees'],
        types: {
          meta: 'object',
          plongeurs: 'array',
          palanquees: 'array'
        },
        metaRequired: ['dp', 'date', 'lieu', 'plongee']
      }
    };
  }
  
  setupFixStrategies() {
    return {
      // Corrections pour les plongeurs
      fixPlongeur: (plongeur) => {
        const fixed = { ...plongeur };
        
        // Nom obligatoire
        if (!fixed.nom || typeof fixed.nom !== 'string') {
          fixed.nom = "Plongeur Inconnu";
          this.logger.warning("Nom de plongeur manquant corrigé", "DataValidator");
        }
        
        // Niveau obligatoire
        if (!fixed.niveau || typeof fixed.niveau !== 'string') {
          fixed.niveau = "N1";
          this.logger.warning("Niveau de plongeur manquant corrigé", "DataValidator");
        }
        
        // Vérifier que le niveau est valide
        const niveauxValides = this.validationRules.plongeur.constraints.niveau.enum;
        if (!niveauxValides.includes(fixed.niveau)) {
          this.logger.warning(`Niveau invalide détecté: ${fixed.niveau}`, "DataValidator");
          // Essayer de corriger les erreurs communes
          const corrections = {
            'N4-GP': 'N4/GP',
            'Deb': 'Déb.',
            'debutant': 'Déb.',
            'Débutant': 'Déb.',
            'PlgOr': 'Plg.Or',
            'PlgAr': 'Plg.Ar',
            'PlgBr': 'Plg.Br'
          };
          fixed.niveau = corrections[fixed.niveau] || "N1";
        }
        
        // Prérogatives (optionnel)
        if (fixed.pre && typeof fixed.pre !== 'string') {
          fixed.pre = String(fixed.pre);
        }
        if (!fixed.pre) {
          fixed.pre = "";
        }
        
        return fixed;
      },
      
      // Corrections pour les palanquées
      fixPalanquee: (palanquee, index) => {
        let fixed;
        
        // Si ce n'est pas un tableau, essayer de le convertir
        if (!Array.isArray(palanquee)) {
          this.logger.warning(`Palanquée ${index + 1} n'est pas un tableau`, "DataValidator");
          
          if (palanquee && typeof palanquee === 'object') {
            // Convertir objet vers tableau
            fixed = [];
            Object.keys(palanquee).forEach(key => {
              if (!isNaN(key) && palanquee[key] && typeof palanquee[key] === 'object' && palanquee[key].nom) {
                fixed.push(this.fixStrategies.fixPlongeur(palanquee[key]));
              }
            });
            
            // Restaurer les propriétés spéciales
            fixed.horaire = palanquee.horaire || '';
            fixed.profondeurPrevue = palanquee.profondeurPrevue || '';
            fixed.dureePrevue = palanquee.dureePrevue || '';
            fixed.profondeurRealisee = palanquee.profondeurRealisee || '';
            fixed.dureeRealisee = palanquee.dureeRealisee || '';
            fixed.paliers = palanquee.paliers || '';
          } else {
            // Créer un tableau vide avec propriétés
            fixed = [];
            fixed.horaire = '';
            fixed.profondeurPrevue = '';
            fixed.dureePrevue = '';
            fixed.profondeurRealisee = '';
            fixed.dureeRealisee = '';
            fixed.paliers = '';
          }
        } else {
          // C'est déjà un tableau, juste valider/corriger le contenu
          fixed = [...palanquee];
          
          // Corriger chaque plongeur
          for (let i = 0; i < fixed.length; i++) {
            if (fixed[i] && typeof fixed[i] === 'object') {
              fixed[i] = this.fixStrategies.fixPlongeur(fixed[i]);
            } else {
              // Supprimer les éléments invalides
              fixed.splice(i, 1);
              i--;
              this.logger.warning(`Élément invalide supprimé de palanquée ${index + 1}`, "DataValidator");
            }
          }
          
          // S'assurer que les propriétés spéciales existent
          if (!fixed.hasOwnProperty('horaire')) fixed.horaire = '';
          if (!fixed.hasOwnProperty('profondeurPrevue')) fixed.profondeurPrevue = '';
          if (!fixed.hasOwnProperty('dureePrevue')) fixed.dureePrevue = '';
          if (!fixed.hasOwnProperty('profondeurRealisee')) fixed.profondeurRealisee = '';
          if (!fixed.hasOwnProperty('dureeRealisee')) fixed.dureeRealisee = '';
          if (!fixed.hasOwnProperty('paliers')) fixed.paliers = '';
        }
        
        // Vérifier la taille de la palanquée
        if (fixed.length > 5) {
          this.logger.warning(`Palanquée ${index + 1} trop grande (${fixed.length} plongeurs)`, "DataValidator");
          // Ne pas corriger automatiquement car cela peut supprimer des données importantes
        }
        
        return fixed;
      },
      
      // Corrections pour les sessions
      fixSession: (session) => {
        const fixed = { ...session };
        
        // Meta obligatoire
        if (!fixed.meta || typeof fixed.meta !== 'object') {
          fixed.meta = {
            dp: "DP non défini",
            date: new Date().toISOString().split('T')[0],
            lieu: "Lieu non défini",
            plongee: "matin",
            timestamp: Date.now()
          };
          this.logger.warning("Métadonnées de session manquantes corrigées", "DataValidator");
        } else {
          // Vérifier chaque champ requis des meta
          if (!fixed.meta.dp) fixed.meta.dp = "DP non défini";
          if (!fixed.meta.date) fixed.meta.date = new Date().toISOString().split('T')[0];
          if (!fixed.meta.lieu) fixed.meta.lieu = "Lieu non défini";
          if (!fixed.meta.plongee) fixed.meta.plongee = "matin";
          if (!fixed.meta.timestamp) fixed.meta.timestamp = Date.now();
        }
        
        // Plongeurs obligatoire (tableau)
        if (!Array.isArray(fixed.plongeurs)) {
          fixed.plongeurs = [];
          this.logger.warning("Liste de plongeurs manquante corrigée", "DataValidator");
        } else {
          // Corriger chaque plongeur
          fixed.plongeurs = fixed.plongeurs
            .filter(p => p && typeof p === 'object')
            .map(p => this.fixStrategies.fixPlongeur(p));
        }
        
        // Palanquées obligatoire (tableau)
        if (!Array.isArray(fixed.palanquees)) {
          fixed.palanquees = [];
          this.logger.warning("Liste de palanquées manquante corrigée", "DataValidator");
        } else {
          // Corriger chaque palanquée
          fixed.palanquees = fixed.palanquees.map((pal, index) => 
            this.fixStrategies.fixPalanquee(pal, index)
          );
        }
        
        // Recalculer les stats si elles existent
        if (fixed.stats) {
          fixed.stats = {
            totalPlongeurs: fixed.plongeurs.length + fixed.palanquees.reduce((total, pal) => total + (pal ? pal.length : 0), 0),
            nombrePalanquees: fixed.palanquees.length,
            plongeursNonAssignes: fixed.plongeurs.length
          };
        }
        
        return fixed;
      }
    };
  }
  
  validatePlongeur(plongeur) {
    const errors = [];
    const warnings = [];
    
    if (!plongeur || typeof plongeur !== 'object') {
      errors.push("Plongeur doit être un objet");
      return { valid: false, errors, warnings };
    }
    
    // Vérifier les champs requis
    this.validationRules.plongeur.required.forEach(field => {
      if (!plongeur[field]) {
        errors.push(`Champ requis manquant: ${field}`);
      }
    });
    
    // Vérifier les types
    Object.entries(this.validationRules.plongeur.types).forEach(([field, expectedType]) => {
      if (plongeur[field] && typeof plongeur[field] !== expectedType) {
        errors.push(`Type incorrect pour ${field}: attendu ${expectedType}`);
      }
    });
    
    // Vérifier les contraintes
    if (plongeur.nom) {
      const { minLength, maxLength } = this.validationRules.plongeur.constraints.nom;
      if (plongeur.nom.length < minLength) {
        errors.push(`Nom trop court (minimum ${minLength} caractères)`);
      }
      if (plongeur.nom.length > maxLength) {
        warnings.push(`Nom très long (maximum recommandé ${maxLength} caractères)`);
      }
    }
    
    if (plongeur.niveau) {
      const niveauxValides = this.validationRules.plongeur.constraints.niveau.enum;
      if (!niveauxValides.includes(plongeur.niveau)) {
        errors.push(`Niveau invalide: ${plongeur.niveau}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validatePalanquee(palanquee, index = 0) {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(palanquee)) {
      errors.push("Palanquée doit être un tableau");
      return { valid: false, errors, warnings };
    }
    
    // Vérifier la taille
    const { maxLength } = this.validationRules.palanquee.constraints;
    if (palanquee.length > maxLength) {
      warnings.push(`Palanquée ${index + 1} a ${palanquee.length} plongeurs (maximum recommandé: ${maxLength})`);
    }
    
    // Vérifier chaque plongeur
    palanquee.forEach((plongeur, i) => {
      const validation = this.validatePlongeur(plongeur);
      if (!validation.valid) {
        errors.push(`Plongeur ${i + 1} de palanquée ${index + 1}: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        warnings.push(`Plongeur ${i + 1} de palanquée ${index + 1}: ${validation.warnings.join(', ')}`);
      }
    });
    
    // Vérifier les propriétés spéciales
    const requiredProps = this.validationRules.palanquee.properties;
    Object.keys(requiredProps).forEach(prop => {
      if (!palanquee.hasOwnProperty(prop)) {
        warnings.push(`Propriété manquante: ${prop}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  validateSession(session) {
    const errors = [];
    const warnings = [];
    
    if (!session || typeof session !== 'object') {
      errors.push("Session doit être un objet");
      return { valid: false, errors, warnings };
    }
    
    // Vérifier les champs requis
    this.validationRules.session.required.forEach(field => {
      if (!session[field]) {
        errors.push(`Champ requis manquant: ${field}`);
      }
    });
    
    // Vérifier les types
    Object.entries(this.validationRules.session.types).forEach(([field, expectedType]) => {
      if (session[field] && typeof session[field] !== expectedType) {
        errors.push(`Type incorrect pour ${field}: attendu ${expectedType}`);
      }
    });
    
    // Vérifier les métadonnées
    if (session.meta) {
      this.validationRules.session.metaRequired.forEach(field => {
        if (!session.meta[field]) {
          errors.push(`Métadonnée requise manquante: ${field}`);
        }
      });
    }
    
    // Valider les plongeurs
    if (Array.isArray(session.plongeurs)) {
      session.plongeurs.forEach((plongeur, i) => {
        const validation = this.validatePlongeur(plongeur);
        if (!validation.valid) {
          errors.push(`Plongeur ${i + 1}: ${validation.errors.join(', ')}`);
        }
      });
    }
    
    // Valider les palanquées
    if (Array.isArray(session.palanquees)) {
      session.palanquees.forEach((palanquee, i) => {
        const validation = this.validatePalanquee(palanquee, i);
        if (!validation.valid) {
          errors.push(`Palanquée ${i + 1}: ${validation.errors.join(', ')}`);
        }
        warnings.push(...validation.warnings);
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  fixData(data, type) {
    this.logger.info(`Correction des données de type: ${type}`, "DataValidator");
    
    try {
      switch (type) {
        case 'plongeur':
          return this.fixStrategies.fixPlongeur(data);
        case 'palanquee':
          return this.fixStrategies.fixPalanquee(data, 0);
        case 'session':
          return this.fixStrategies.fixSession(data);
        default:
          this.logger.warning(`Type de données non supporté: ${type}`, "DataValidator");
          return data;
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la correction: ${error.message}`, "DataValidator", error);
      return data;
    }
  }
  
  validateAndFix(data, type) {
    // Valider d'abord
    const validation = this.validate(data, type);
    
    if (!validation.valid) {
      this.logger.warning(`Données invalides détectées pour ${type}`, "DataValidator", {
        errors: validation.errors,
        warnings: validation.warnings
      });
      
      // Essayer de corriger
      const fixed = this.fixData(data, type);
      
      // Revalider après correction
      const revalidation = this.validate(fixed, type);
      
      return {
        original: data,
        fixed: fixed,
        wasFixed: true,
        validation: revalidation,
        originalValidation: validation
      };
    }
    
    if (validation.warnings.length > 0) {
      this.logger.info(`Avertissements pour ${type}`, "DataValidator", validation.warnings);
    }
    
    return {
      original: data,
      fixed: data,
      wasFixed: false,
      validation: validation
    };
  }
  
  validate(data, type) {
    switch (type) {
      case 'plongeur':
        return this.validatePlongeur(data);
      case 'palanquee':
        return this.validatePalanquee(data);
      case 'session':
        return this.validateSession(data);
      default:
        return { valid: false, errors: [`Type non supporté: ${type}`], warnings: [] };
    }
  }
}

// ===== ANALYSEUR DE DONNÉES CORROMPUES =====
class CorruptedDataAnalyzer {
  constructor(logger) {
    this.logger = logger;
  }
  
  analyzeFirebaseData(db) {
    return new Promise(async (resolve) => {
      const analysis = {
        timestamp: Date.now(),
        sessions: { total: 0, corrupted: 0, issues: [] },
        plongeurs: { total: 0, corrupted: 0, issues: [] },
        palanquees: { total: 0, corrupted: 0, issues: [] },
        dpInfo: { total: 0, corrupted: 0, issues: [] }
      };
      
      try {
        this.logger.info("Début de l'analyse des données Firebase", "CorruptedDataAnalyzer");
        
        // Analyser les sessions
        try {
          const sessionsSnapshot = await db.ref('sessions').once('value');
          if (sessionsSnapshot.exists()) {
            const sessions = sessionsSnapshot.val();
            analysis.sessions.total = Object.keys(sessions).length;
            
            Object.entries(sessions).forEach(([key, session]) => {
              if (!this.isValidSession(session)) {
                analysis.sessions.corrupted++;
                analysis.sessions.issues.push({
                  key: key,
                  issue: this.detectSessionIssues(session)
                });
              }
            });
          }
        } catch (error) {
          analysis.sessions.issues.push({ error: error.message });
        }
        
        // Analyser les plongeurs actuels
        try {
          const plongeursSnapshot = await db.ref('plongeurs').once('value');
          if (plongeursSnapshot.exists()) {
            const plongeurs = plongeursSnapshot.val();
            if (Array.isArray(plongeurs)) {
              analysis.plongeurs.total = plongeurs.length;
              
              plongeurs.forEach((plongeur, index) => {
                if (!this.isValidPlongeur(plongeur)) {
                  analysis.plongeurs.corrupted++;
                  analysis.plongeurs.issues.push({
                    index: index,
                    issue: this.detectPlongeurIssues(plongeur)
                  });
                }
              });
            } else {
              analysis.plongeurs.issues.push({ error: "Plongeurs n'est pas un tableau" });
            }
          }
        } catch (error) {
          analysis.plongeurs.issues.push({ error: error.message });
        }
        
        // Analyser les palanquées actuelles
        try {
          const palanqueesSnapshot = await db.ref('palanquees').once('value');
          if (palanqueesSnapshot.exists()) {
            const palanquees = palanqueesSnapshot.val();
            if (Array.isArray(palanquees)) {
              analysis.palanquees.total = palanquees.length;
              
              palanquees.forEach((palanquee, index) => {
                if (!this.isValidPalanquee(palanquee)) {
                  analysis.palanquees.corrupted++;
                  analysis.palanquees.issues.push({
                    index: index,
                    issue: this.detectPalanqueeIssues(palanquee)
                  });
                }
              });
            } else {
              analysis.palanquees.issues.push({ error: "Palanquées n'est pas un tableau" });
            }
          }
        } catch (error) {
          analysis.palanquees.issues.push({ error: error.message });
        }
        
        // Analyser les infos DP
        try {
          const dpInfoSnapshot = await db.ref('dpInfo').once('value');
          if (dpInfoSnapshot.exists()) {
            const dpInfos = dpInfoSnapshot.val();
            analysis.dpInfo.total = Object.keys(dpInfos).length;
            
            Object.entries(dpInfos).forEach(([key, dpInfo]) => {
              if (!this.isValidDPInfo(dpInfo)) {
                analysis.dpInfo.corrupted++;
                analysis.dpInfo.issues.push({
                  key: key,
                  issue: this.detectDPInfoIssues(dpInfo)
                });
              }
            });
          }
        } catch (error) {
          analysis.dpInfo.issues.push({ error: error.message });
        }
        
        this.logger.info("Analyse des données terminée", "CorruptedDataAnalyzer", analysis);
        resolve(analysis);
        
      } catch (error) {
        this.logger.error("Erreur lors de l'analyse", "CorruptedDataAnalyzer", error);
        resolve(analysis);
      }
    });
  }
  
  isValidSession(session) {
    return session && 
           typeof session === 'object' && 
           session.meta && 
           Array.isArray(session.plongeurs) && 
           Array.isArray(session.palanquees);
  }
  
  isValidPlongeur(plongeur) {
    return plongeur && 
           typeof plongeur === 'object' && 
           typeof plongeur.nom === 'string' && 
           typeof plongeur.niveau === 'string' && 
           plongeur.nom.length > 0;
  }
  
  isValidPalanquee(palanquee) {
    return Array.isArray(palanquee);
  }
  
  isValidDPInfo(dpInfo) {
    return dpInfo && 
           typeof dpInfo === 'object' && 
           typeof dpInfo.nom === 'string' && 
           typeof dpInfo.date === 'string';
  }
  
  detectSessionIssues(session) {
    const issues = [];
    
    if (!session) return ["Session null ou undefined"];
    if (typeof session !== 'object') return ["Session n'est pas un objet"];
    
    if (!session.meta) issues.push("Métadonnées manquantes");
    else {
      if (!session.meta.dp) issues.push("DP manquant dans meta");
      if (!session.meta.date) issues.push("Date manquante dans meta");
    }
    
    if (!Array.isArray(session.plongeurs)) issues.push("Plongeurs n'est pas un tableau");
    if (!Array.isArray(session.palanquees)) issues.push("Palanquées n'est pas un tableau");
    
    return issues;
  }
  
  detectPlongeurIssues(plongeur) {
    const issues = [];
    
    if (!plongeur) return ["Plongeur null ou undefined"];
    if (typeof plongeur !== 'object') return ["Plongeur n'est pas un objet"];
    
    if (!plongeur.nom || typeof plongeur.nom !== 'string') issues.push("Nom manquant ou invalide");
    if (!plongeur.niveau || typeof plongeur.niveau !== 'string') issues.push("Niveau manquant ou invalide");
    
    return issues;
  }
  
  detectPalanqueeIssues(palanquee) {
    const issues = [];
    
    if (!Array.isArray(palanquee)) return ["Palanquée n'est pas un tableau"];
    
    palanquee.forEach((plongeur, index) => {
      if (!this.isValidPlongeur(plongeur)) {
        issues.push(`Plongeur ${index + 1} invalide`);
      }
    });
    
    return issues;
  }
  
  detectDPInfoIssues(dpInfo) {
    const issues = [];
    
    if (!dpInfo) return ["DPInfo null ou undefined"];
    if (typeof dpInfo !== 'object') return ["DPInfo n'est pas un objet"];
    
    if (!dpInfo.nom || typeof dpInfo.nom !== 'string') issues.push("Nom DP manquant");
    if (!dpInfo.date || typeof dpInfo.date !== 'string') issues.push("Date manquante");
    
    return issues;
  }
}

// ===== SYSTÈME DE RÉPARATION AUTOMATIQUE =====
class AutoDataRepairer {
  constructor(logger, validator) {
    this.logger = logger;
    this.validator = validator;
    this.repairStats = {
      sessions: { repaired: 0, failed: 0 },
      plongeurs: { repaired: 0, failed: 0 },
      palanquees: { repaired: 0, failed: 0 }
    };
  }
  
  async repairFirebaseData(db, analysis) {
    this.logger.info("Début de la réparation des données Firebase", "AutoDataRepairer");
    
    const repairResults = {
      sessions: [],
      plongeurs: [],
      palanquees: [],
      success: true
    };
    
    try {
      // Réparer les sessions corrompues
      if (analysis.sessions.corrupted > 0) {
        this.logger.info(`Réparation de ${analysis.sessions.corrupted} sessions`, "AutoDataRepairer");
        
        for (const issue of analysis.sessions.issues) {
          if (issue.key && !issue.error) {
            try {
              const sessionSnapshot = await db.ref(`sessions/${issue.key}`).once('value');
              if (sessionSnapshot.exists()) {
                const session = sessionSnapshot.val();
                const result = this.validator.validateAndFix(session, 'session');
                
                if (result.wasFixed) {
                  await db.ref(`sessions/${issue.key}`).set(result.fixed);
                  repairResults.sessions.push({
                    key: issue.key,
                    status: 'repaired',
                    issues: result.originalValidation.errors
                  });
                  this.repairStats.sessions.repaired++;
                } else {
                  repairResults.sessions.push({
                    key: issue.key,
                    status: 'no_repair_needed'
                  });
                }
              }
            } catch (error) {
              this.logger.error(`Erreur réparation session ${issue.key}`, "AutoDataRepairer", error);
              repairResults.sessions.push({
                key: issue.key,
                status: 'failed',
                error: error.message
              });
              this.repairStats.sessions.failed++;
            }
          }
        }
      }
      
      // Réparer les plongeurs actuels
      if (analysis.plongeurs.corrupted > 0) {
        this.logger.info(`Réparation de ${analysis.plongeurs.corrupted} plongeurs`, "AutoDataRepairer");
        
        try {
          const plongeursSnapshot = await db.ref('plongeurs').once('value');
          if (plongeursSnapshot.exists()) {
            const plongeurs = plongeursSnapshot.val();
            
            if (Array.isArray(plongeurs)) {
              const repairedPlongeurs = plongeurs.map((plongeur, index) => {
                const result = this.validator.validateAndFix(plongeur, 'plongeur');
                
                if (result.wasFixed) {
                  repairResults.plongeurs.push({
                    index: index,
                    status: 'repaired',
                    issues: result.originalValidation.errors
                  });
                  this.repairStats.plongeurs.repaired++;
                }
                
                return result.fixed;
              });
              
              await db.ref('plongeurs').set(repairedPlongeurs);
            }
          }
        } catch (error) {
          this.logger.error("Erreur réparation plongeurs", "AutoDataRepairer", error);
          repairResults.success = false;
        }
      }
      
      // Réparer les palanquées actuelles
      if (analysis.palanquees.corrupted > 0) {
        this.logger.info(`Réparation de ${analysis.palanquees.corrupted} palanquées`, "AutoDataRepairer");
        
        try {
          const palanqueesSnapshot = await db.ref('palanquees').once('value');
          if (palanqueesSnapshot.exists()) {
            const palanquees = palanqueesSnapshot.val();
            
            if (Array.isArray(palanquees)) {
              const repairedPalanquees = palanquees.map((palanquee, index) => {
                const result = this.validator.validateAndFix(palanquee, 'palanquee');
                
                if (result.wasFixed) {
                  repairResults.palanquees.push({
                    index: index,
                    status: 'repaired',
                    issues: result.originalValidation.errors
                  });
                  this.repairStats.palanquees.repaired++;
                }
                
                return result.fixed;
              });
              
              await db.ref('palanquees').set(repairedPalanquees);
            }
          }
        } catch (error) {
          this.logger.error("Erreur réparation palanquées", "AutoDataRepairer", error);
          repairResults.success = false;
        }
      }
      
      this.logger.info("Réparation terminée", "AutoDataRepairer", {
        stats: this.repairStats,
        results: repairResults
      });
      
      return repairResults;
      
    } catch (error) {
      this.logger.error("Erreur générale lors de la réparation", "AutoDataRepairer", error);
      repairResults.success = false;
      return repairResults;
    }
  }
  
  getRepairStats() {
    return { ...this.repairStats };
  }
  
  resetStats() {
    this.repairStats = {
      sessions: { repaired: 0, failed: 0 },
      plongeurs: { repaired: 0, failed: 0 },
      palanquees: { repaired: 0, failed: 0 }
    };
  }
}

// ===== INITIALISATION ET EXPORT =====
window.jsasDataValidator = new JSASDataValidator(window.jsasLogger);
window.jsasCorruptedDataAnalyzer = new CorruptedDataAnalyzer(window.jsasLogger);
window.jsasAutoDataRepairer = new AutoDataRepairer(window.jsasLogger, window.jsasDataValidator);

// ===== FONCTIONS UTILITAIRES GLOBALES =====

// Fonction pour valider les données actuelles en mémoire
window.validateCurrentData = () => {
  const results = {
    plongeurs: null,
    palanquees: null,
    timestamp: Date.now()
  };
  
  // Valider les plongeurs
  if (typeof plongeurs !== 'undefined' && Array.isArray(plongeurs)) {
    const allValid = plongeurs.every(p => window.jsasDataValidator.validate(p, 'plongeur').valid);
    const invalidCount = plongeurs.filter(p => !window.jsasDataValidator.validate(p, 'plongeur').valid).length;
    
    results.plongeurs = {
      total: plongeurs.length,
      valid: plongeurs.length - invalidCount,
      invalid: invalidCount,
      allValid: allValid
    };
  }
  
  // Valider les palanquées
  if (typeof palanquees !== 'undefined' && Array.isArray(palanquees)) {
    const allValid = palanquees.every(p => window.jsasDataValidator.validate(p, 'palanquee').valid);
    const invalidCount = palanquees.filter(p => !window.jsasDataValidator.validate(p, 'palanquee').valid).length;
    
    results.palanquees = {
      total: palanquees.length,
      valid: palanquees.length - invalidCount,
      invalid: invalidCount,
      allValid: allValid
    };
  }
  
  console.log("🔍 Validation des données actuelles:", results);
  return results;
};

// Fonction pour corriger les données actuelles en mémoire
window.fixCurrentData = () => {
  const results = {
    plongeurs: { fixed: 0, errors: [] },
    palanquees: { fixed: 0, errors: [] }
  };
  
  // Corriger les plongeurs
  if (typeof plongeurs !== 'undefined' && Array.isArray(plongeurs)) {
    const originalLength = plongeurs.length;
    
    for (let i = 0; i < plongeurs.length; i++) {
      try {
        const result = window.jsasDataValidator.validateAndFix(plongeurs[i], 'plongeur');
        if (result.wasFixed) {
          plongeurs[i] = result.fixed;
          results.plongeurs.fixed++;
        }
      } catch (error) {
        results.plongeurs.errors.push(`Plongeur ${i}: ${error.message}`);
      }
    }
    
    // Mettre à jour plongeursOriginaux si il existe
    if (typeof plongeursOriginaux !== 'undefined') {
      plongeursOriginaux = [...plongeurs];
    }
  }
  
  // Corriger les palanquées
  if (typeof palanquees !== 'undefined' && Array.isArray(palanquees)) {
    for (let i = 0; i < palanquees.length; i++) {
      try {
        const result = window.jsasDataValidator.validateAndFix(palanquees[i], 'palanquee');
        if (result.wasFixed) {
          palanquees[i] = result.fixed;
          results.palanquees.fixed++;
        }
      } catch (error) {
        results.palanquees.errors.push(`Palanquée ${i}: ${error.message}`);
      }
    }
  }
  
  // Synchroniser avec Firebase si possible
  if (typeof syncToDatabase === 'function') {
    try {
      syncToDatabase();
      window.jsasLogger.info("Données corrigées synchronisées", "DataValidator");
    } catch (error) {
      window.jsasLogger.error("Erreur synchronisation après correction", "DataValidator", error);
    }
  }
  
  console.log("🔧 Correction des données terminée:", results);
  return results;
};

// Fonction complète d'analyse et réparation Firebase
window.analyzeAndRepairFirebase = async () => {
  if (typeof db === 'undefined' || !db) {
    alert("❌ Firebase non disponible pour l'analyse");
    return;
  }
  
  console.log("🔍 === ANALYSE ET RÉPARATION FIREBASE ===");
  
  try {
    // 1. Analyser les données
    console.log("📊 Phase 1: Analyse des données...");
    const analysis = await window.jsasCorruptedDataAnalyzer.analyzeFirebaseData(db);
    
    console.log("📊 Résultats de l'analyse:", analysis);
    
    const totalCorrupted = analysis.sessions.corrupted + 
                          analysis.plongeurs.corrupted + 
                          analysis.palanquees.corrupted + 
                          analysis.dpInfo.corrupted;
    
    if (totalCorrupted === 0) {
      console.log("✅ Aucune donnée corrompue détectée");
      alert("✅ Toutes les données Firebase sont valides !");
      return analysis;
    }
    
    // 2. Demander confirmation pour la réparation
    const confirmRepair = confirm(
      `🔍 ANALYSE TERMINÉE\n\n` +
      `📊 Données corrompues détectées:\n` +
      `• Sessions: ${analysis.sessions.corrupted}/${analysis.sessions.total}\n` +
      `• Plongeurs: ${analysis.plongeurs.corrupted}/${analysis.plongeurs.total}\n` +
      `• Palanquées: ${analysis.palanquees.corrupted}/${analysis.palanquees.total}\n` +
      `• Infos DP: ${analysis.dpInfo.corrupted}/${analysis.dpInfo.total}\n\n` +
      `Voulez-vous lancer la réparation automatique ?`
    );
    
    if (!confirmRepair) {
      console.log("⏹️ Réparation annulée par l'utilisateur");
      return analysis;
    }
    
    // 3. Réparer les données
    console.log("🔧 Phase 2: Réparation des données...");
    const repairResults = await window.jsasAutoDataRepairer.repairFirebaseData(db, analysis);
    
    console.log("🔧 Résultats de la réparation:", repairResults);
    
    // 4. Rapport final
    const stats = window.jsasAutoDataRepairer.getRepairStats();
    
    alert(
      `🔧 RÉPARATION TERMINÉE\n\n` +
      `✅ Données réparées:\n` +
      `• Sessions: ${stats.sessions.repaired}\n` +
      `• Plongeurs: ${stats.plongeurs.repaired}\n` +
      `• Palanquées: ${stats.palanquees.repaired}\n\n` +
      `❌ Échecs: ${stats.sessions.failed + stats.plongeurs.failed + stats.palanquees.failed}\n\n` +
      `Consultez la console pour plus de détails.`
    );
    
    return { analysis, repairResults, stats };
    
  } catch (error) {
    console.error("❌ Erreur lors de l'analyse/réparation:", error);
    window.jsasLogger.error("Erreur analyse/réparation Firebase", "DataValidator", error);
    alert("❌ Erreur lors de l'analyse/réparation : " + error.message);
    return null;
  }
};

// Fonction de diagnostic express
window.quickDataDiagnostic = () => {
  console.log("⚡ === DIAGNOSTIC EXPRESS ===");
  
  const currentData = validateCurrentData();
  
  const issues = [];
  
  if (currentData.plongeurs && !currentData.plongeurs.allValid) {
    issues.push(`${currentData.plongeurs.invalid} plongeurs invalides`);
  }
  
  if (currentData.palanquees && !currentData.palanquees.allValid) {
    issues.push(`${currentData.palanquees.invalid} palanquées invalides`);
  }
  
  if (issues.length === 0) {
    console.log("✅ Toutes les données en mémoire sont valides");
  } else {
    console.log("⚠️ Problèmes détectés:", issues);
    
    const shouldFix = confirm(
      `⚠️ PROBLÈMES DÉTECTÉS\n\n${issues.join('\n')}\n\nVoulez-vous les corriger automatiquement ?`
    );
    
    if (shouldFix) {
      const fixResults = fixCurrentData();
      console.log("🔧 Correction terminée:", fixResults);
    }
  }
  
  return currentData;
};

console.log(`
🔍 === SYSTÈME DE VALIDATION ET RÉPARATION JSAS ===

Fonctions disponibles:
• validateCurrentData() - Valider données en mémoire
• fixCurrentData() - Corriger données en mémoire  
• analyzeAndRepairFirebase() - Analyse complète Firebase
• quickDataDiagnostic() - Diagnostic express

Validation automatique: ✅
Réparation automatique: ✅
Support Firebase: ✅

===============================================
`);

console.log("✅ Système de validation et réparation chargé - Version 1.0.0");