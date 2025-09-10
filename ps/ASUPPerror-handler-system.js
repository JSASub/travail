// error-handler-system.js - Système de gestion d'erreurs avancé

// ===== SYSTÈME DE LOGGING CENTRALISÉ =====
class JSASLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.errorCount = 0;
    this.warningCount = 0;
  }
  
  log(level, message, context = "", data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      context: context,
      data: data,
      id: this.logs.length + 1
    };
    
    this.logs.push(logEntry);
    
    // Maintenir la limite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Compter les erreurs
    if (level === 'ERROR') this.errorCount++;
    if (level === 'WARNING') this.warningCount++;
    
    // Affichage console avec couleurs
    const consoleMethod = {
      'ERROR': 'error',
      'WARNING': 'warn',
      'INFO': 'log',
      'DEBUG': 'debug'
    }[level] || 'log';
    
    const emoji = {
      'ERROR': '❌',
      'WARNING': '⚠️',
      'INFO': 'ℹ️',
      'DEBUG': '🔍'
    }[level] || '📝';
    
    console[consoleMethod](`${emoji} [${level}] ${context}: ${message}`, data || '');
    
    return logEntry;
  }
  
  error(message, context = "", data = null) {
    return this.log('ERROR', message, context, data);
  }
  
  warning(message, context = "", data = null) {
    return this.log('WARNING', message, context, data);
  }
  
  info(message, context = "", data = null) {
    return this.log('INFO', message, context, data);
  }
  
  debug(message, context = "", data = null) {
    return this.log('DEBUG', message, context, data);
  }
  
  getStats() {
    return {
      totalLogs: this.logs.length,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      lastError: this.logs.filter(l => l.level === 'ERROR').slice(-1)[0] || null,
      recentLogs: this.logs.slice(-10)
    };
  }
  
  exportLogs() {
    const logData = {
      exported: new Date().toISOString(),
      stats: this.getStats(),
      logs: this.logs
    };
    
    const dataStr = JSON.stringify(logData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jsas-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log("📁 Logs exportés");
  }
  
  clearLogs() {
    this.logs = [];
    this.errorCount = 0;
    this.warningCount = 0;
    console.log("🧹 Logs effacés");
  }
}

// ===== GESTIONNAIRE D'ERREURS FIREBASE AVANCÉ =====
class AdvancedFirebaseErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.retryCount = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }
  
  handleError(error, context = "Firebase", options = {}) {
    const errorInfo = this.analyzeError(error);
    
    this.logger.error(
      `${errorInfo.message} (Code: ${errorInfo.code})`,
      context,
      {
        originalError: error,
        stackTrace: error.stack,
        errorType: errorInfo.type,
        recoverable: errorInfo.recoverable,
        suggested_action: errorInfo.suggestedAction
      }
    );
    
    // Gestion automatique selon le type d'erreur
    this.handleErrorType(errorInfo, context, options);
    
    // Notification utilisateur si nécessaire
    if (errorInfo.notifyUser) {
      this.notifyUser(errorInfo, context);
    }
    
    return errorInfo;
  }
  
  analyzeError(error) {
    const errorCode = error.code || error.name || 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'Erreur inconnue';
    
    const errorTypes = {
      // Erreurs Firebase Auth
      'auth/user-not-found': {
        type: 'AUTH',
        message: 'Utilisateur non trouvé',
        recoverable: false,
        notifyUser: true,
        suggestedAction: 'Vérifier les identifiants'
      },
      'auth/wrong-password': {
        type: 'AUTH',
        message: 'Mot de passe incorrect',
        recoverable: false,
        notifyUser: true,
        suggestedAction: 'Réessayer ou réinitialiser le mot de passe'
      },
      'auth/too-many-requests': {
        type: 'AUTH',
        message: 'Trop de tentatives de connexion',
        recoverable: true,
        notifyUser: true,
        suggestedAction: 'Attendre avant de réessayer'
      },
      'auth/network-request-failed': {
        type: 'NETWORK',
        message: 'Problème de connexion réseau',
        recoverable: true,
        notifyUser: true,
        suggestedAction: 'Vérifier la connexion internet'
      },
      'auth/expired-action-code': {
        type: 'AUTH',
        message: 'Code d\'action expiré',
        recoverable: false,
        notifyUser: true,
        suggestedAction: 'Demander un nouveau lien'
      },
      
      // Erreurs Firebase Database
      'PERMISSION_DENIED': {
        type: 'PERMISSION',
        message: 'Accès refusé à la base de données',
        recoverable: false,
        notifyUser: true,
        suggestedAction: 'Vérifier les droits d\'accès'
      },
      'NETWORK_ERROR': {
        type: 'NETWORK',
        message: 'Erreur de connexion réseau',
        recoverable: true,
        notifyUser: false,
        suggestedAction: 'Réessayer automatiquement'
      },
      'DISCONNECTED': {
        type: 'NETWORK',
        message: 'Connexion Firebase perdue',
        recoverable: true,
        notifyUser: false,
        suggestedAction: 'Reconnexion automatique'
      },
      
      // Erreurs application
      'TypeError': {
        type: 'CODE',
        message: 'Erreur de type JavaScript',
        recoverable: false,
        notifyUser: false,
        suggestedAction: 'Vérifier le code'
      },
      'ReferenceError': {
        type: 'CODE',
        message: 'Variable non définie',
        recoverable: false,
        notifyUser: false,
        suggestedAction: 'Initialiser la variable'
      }
    };
    
    const errorInfo = errorTypes[errorCode] || {
      type: 'UNKNOWN',
      message: errorMessage,
      recoverable: false,
      notifyUser: true,
      suggestedAction: 'Contacter le support'
    };
    
    return {
      ...errorInfo,
      code: errorCode,
      originalMessage: errorMessage,
      timestamp: Date.now()
    };
  }
  
  handleErrorType(errorInfo, context, options) {
    switch (errorInfo.type) {
      case 'NETWORK':
        this.handleNetworkError(errorInfo, context, options);
        break;
      case 'AUTH':
        this.handleAuthError(errorInfo, context, options);
        break;
      case 'PERMISSION':
        this.handlePermissionError(errorInfo, context, options);
        break;
      case 'CODE':
        this.handleCodeError(errorInfo, context, options);
        break;
      default:
        this.logger.warning("Type d'erreur non géré", context, errorInfo);
    }
  }
  
  handleNetworkError(errorInfo, context, options) {
    if (errorInfo.recoverable && options.retry !== false) {
      const retryKey = `${context}_${errorInfo.code}`;
      const currentRetries = this.retryCount.get(retryKey) || 0;
      
      if (currentRetries < this.maxRetries) {
        this.retryCount.set(retryKey, currentRetries + 1);
        
        this.logger.info(
          `Tentative de récupération ${currentRetries + 1}/${this.maxRetries}`,
          context
        );
        
        setTimeout(() => {
          if (options.retryCallback && typeof options.retryCallback === 'function') {
            options.retryCallback();
          }
        }, this.retryDelay * (currentRetries + 1));
      } else {
        this.logger.error("Échec définitif après maximum de tentatives", context);
        this.notifyUser({
          message: "Impossible de se connecter après plusieurs tentatives",
          suggestedAction: "Vérifiez votre connexion internet"
        }, context);
      }
    }
    
    // Activer le mode hors ligne si disponible
    if (typeof window.isOnline !== 'undefined') {
      window.isOnline = false;
      this.logger.info("Mode hors ligne activé", context);
    }
  }
  
  handleAuthError(errorInfo, context, options) {
    switch (errorInfo.code) {
      case 'auth/expired-action-code':
      case 'auth/invalid-action-code':
        // Rediriger vers la page de connexion
        if (typeof signOut === 'function') {
          signOut();
        }
        break;
      case 'auth/too-many-requests':
        // Bloquer temporairement les tentatives
        if (options.lockForm) {
          this.lockLoginForm(300000); // 5 minutes
        }
        break;
    }
  }
  
  handlePermissionError(errorInfo, context, options) {
    this.logger.warning("Problème de permissions détecté", context, {
      currentUser: typeof currentUser !== 'undefined' ? currentUser?.email : 'undefined',
      timestamp: Date.now()
    });
    
    // Essayer de re-authentifier
    if (typeof auth !== 'undefined' && auth.currentUser) {
      auth.currentUser.getIdToken(true).then(() => {
        this.logger.info("Token rafraîchi avec succès", context);
      }).catch(tokenError => {
        this.logger.error("Échec rafraîchissement token", context, tokenError);
      });
    }
  }
  
  handleCodeError(errorInfo, context, options) {
    // Pour les erreurs de code, on log juste - pas de récupération automatique
    this.logger.error("Erreur de code détectée", context, {
      type: errorInfo.type,
      message: errorInfo.originalMessage,
      suggestedAction: errorInfo.suggestedAction
    });
  }
  
  lockLoginForm(duration) {
    const loginForm = document.getElementById("login-form");
    const submitBtn = loginForm?.querySelector('button[type="submit"]');
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "🔒 Bloqué temporairement";
      
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Se connecter";
      }, duration);
      
      this.logger.info(`Formulaire de connexion bloqué pour ${duration/1000}s`, "Security");
    }
  }
  
  notifyUser(errorInfo, context) {
    // Essayer d'utiliser le système de notification de l'app
    if (typeof showNotification === 'function') {
      const type = {
        'AUTH': 'warning',
        'NETWORK': 'warning',
        'PERMISSION': 'error',
        'CODE': 'error',
        'UNKNOWN': 'error'
      }[errorInfo.type] || 'error';
      
      showNotification(
        `${errorInfo.message}\n${errorInfo.suggestedAction}`,
        type
      );
    } else {
      // Fallback vers alert (non bloquant si possible)
      console.warn("Notification système:", errorInfo.message);
    }
  }
  
  getRetryStats() {
    const stats = {};
    for (const [key, count] of this.retryCount.entries()) {
      stats[key] = count;
    }
    return stats;
  }
  
  resetRetryCount(key = null) {
    if (key) {
      this.retryCount.delete(key);
    } else {
      this.retryCount.clear();
    }
  }
}

// ===== SURVEILLANCE DES PERFORMANCES =====
class PerformanceMonitor {
  constructor(logger) {
    this.logger = logger;
    this.metrics = new Map();
    this.thresholds = {
      functionCall: 1000, // 1 seconde
      databaseOperation: 5000, // 5 secondes
      rendering: 100 // 100ms
    };
  }
  
  startTimer(name, type = 'functionCall') {
    this.metrics.set(name, {
      startTime: performance.now(),
      type: type
    });
  }
  
  endTimer(name) {
    const metric = this.metrics.get(name);
    if (!metric) {
      this.logger.warning("Timer non trouvé", "Performance", { name });
      return;
    }
    
    const duration = performance.now() - metric.startTime;
    const threshold = this.thresholds[metric.type];
    
    if (duration > threshold) {
      this.logger.warning(
        `Performance lente détectée: ${name}`,
        "Performance",
        {
          duration: `${duration.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          type: metric.type
        }
      );
    } else {
      this.logger.debug(
        `Performance OK: ${name}`,
        "Performance",
        { duration: `${duration.toFixed(2)}ms` }
      );
    }
    
    this.metrics.delete(name);
    return duration;
  }
  
  monitorFunction(fn, name, type = 'functionCall') {
    return async (...args) => {
      this.startTimer(name, type);
      try {
        const result = await fn(...args);
        this.endTimer(name);
        return result;
      } catch (error) {
        this.endTimer(name);
        throw error;
      }
    };
  }
}

// ===== INITIALISATION DU SYSTÈME =====
// Créer les instances globales
window.jsasLogger = new JSASLogger();
window.jsasErrorHandler = new AdvancedFirebaseErrorHandler(window.jsasLogger);
window.jsasPerformanceMonitor = new PerformanceMonitor(window.jsasLogger);

// Intercepter les erreurs globales
window.addEventListener('error', (event) => {
  window.jsasErrorHandler.handleError(event.error, 'Global JavaScript Error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  window.jsasErrorHandler.handleError(event.reason, 'Unhandled Promise Rejection');
  event.preventDefault();
});

// Surveiller les performances de rendu
if (typeof PerformanceObserver !== 'undefined') {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) { // Plus de 100ms
          window.jsasLogger.warning(
            `Rendu lent détecté: ${entry.name}`,
            "Performance",
            { duration: `${entry.duration.toFixed(2)}ms` }
          );
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
  } catch (error) {
    console.warn("PerformanceObserver non supporté:", error);
  }
}

// Fonctions utilitaires pour l'application
window.logError = (message, context = "", data = null) => {
  return window.jsasLogger.error(message, context, data);
};

window.logWarning = (message, context = "", data = null) => {
  return window.jsasLogger.warning(message, context, data);
};

window.logInfo = (message, context = "", data = null) => {
  return window.jsasLogger.info(message, context, data);
};

window.handleFirebaseError = (error, context = "Firebase", options = {}) => {
  return window.jsasErrorHandler.handleError(error, context, options);
};

window.monitorPerformance = (fn, name, type = 'functionCall') => {
  return window.jsasPerformanceMonitor.monitorFunction(fn, name, type);
};

// Console de debug pour l'administrateur
window.jsasDebugConsole = {
  showLogs: () => {
    const stats = window.jsasLogger.getStats();
    console.log("📊 === JSAS DEBUG CONSOLE ===");
    console.log("Stats:", stats);
    console.log("Logs récents:", stats.recentLogs);
    console.log("=========================");
    return stats;
  },
  
  exportLogs: () => {
    window.jsasLogger.exportLogs();
  },
  
  clearLogs: () => {
    window.jsasLogger.clearLogs();
  },
  
  testError: () => {
    window.jsasErrorHandler.handleError(
      new Error("Test d'erreur"),
      "Debug Console",
      { test: true }
    );
  },
  
  showRetryStats: () => {
    console.log("🔄 Statistiques de retry:", window.jsasErrorHandler.getRetryStats());
  },
  
  resetRetries: () => {
    window.jsasErrorHandler.resetRetryCount();
    console.log("✅ Compteurs de retry réinitialisés");
  },
  
  simulateNetworkError: () => {
    window.jsasErrorHandler.handleError(
      { code: 'NETWORK_ERROR', message: 'Simulation erreur réseau' },
      "Debug Simulation",
      { retry: true, retryCallback: () => console.log("🔄 Retry callback exécuté") }
    );
  },
  
  help: () => {
    console.log(`
🛠️ JSAS DEBUG CONSOLE

Commandes disponibles:
• jsasDebugConsole.showLogs() - Afficher les logs
• jsasDebugConsole.exportLogs() - Exporter les logs
• jsasDebugConsole.clearLogs() - Effacer les logs
• jsasDebugConsole.testError() - Tester le système d'erreurs
• jsasDebugConsole.showRetryStats() - Stats des tentatives
• jsasDebugConsole.resetRetries() - Reset des compteurs
• jsasDebugConsole.simulateNetworkError() - Simuler erreur réseau
• jsasDebugConsole.help() - Afficher cette aide

Raccourcis globaux:
• logError(message, context, data) - Logger une erreur
• logWarning(message, context, data) - Logger un avertissement  
• logInfo(message, context, data) - Logger une info
• handleFirebaseError(error, context, options) - Gérer erreur Firebase
• monitorPerformance(function, name, type) - Surveiller performance
    `);
  }
};

// ===== GESTIONNAIRE D'ÉTAT APPLICATION =====
class ApplicationStateManager {
  constructor(logger) {
    this.logger = logger;
    this.state = {
      initialized: false,
      firebaseConnected: false,
      userAuthenticated: false,
      dataLoaded: false,
      lockSystemActive: false,
      offlineMode: false,
      errors: [],
      warnings: []
    };
    this.stateChangeCallbacks = new Map();
  }
  
  setState(key, value, context = "") {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    this.logger.debug(
      `État changé: ${key} = ${value}`,
      context || "StateManager",
      { oldValue, newValue: value }
    );
    
    // Déclencher les callbacks
    const callbacks = this.stateChangeCallbacks.get(key) || [];
    callbacks.forEach(callback => {
      try {
        callback(value, oldValue);
      } catch (error) {
        this.logger.error("Erreur callback état", "StateManager", error);
      }
    });
    
    // Vérifications automatiques
    this.checkApplicationHealth();
  }
  
  getState(key = null) {
    return key ? this.state[key] : { ...this.state };
  }
  
  onStateChange(key, callback) {
    if (!this.stateChangeCallbacks.has(key)) {
      this.stateChangeCallbacks.set(key, []);
    }
    this.stateChangeCallbacks.get(key).push(callback);
  }
  
  checkApplicationHealth() {
    const issues = [];
    
    if (!this.state.firebaseConnected && this.state.userAuthenticated) {
      issues.push("Utilisateur connecté mais Firebase déconnecté");
    }
    
    if (this.state.lockSystemActive && !this.state.userAuthenticated) {
      issues.push("Système de verrous actif sans utilisateur");
    }
    
    if (this.state.errors.length > 10) {
      issues.push(`Beaucoup d'erreurs récentes: ${this.state.errors.length}`);
    }
    
    if (issues.length > 0) {
      this.logger.warning(
        "Problèmes de santé application détectés",
        "HealthCheck",
        { issues, currentState: this.state }
      );
    }
  }
  
  addError(error, context) {
    this.state.errors.push({
      error: error.message || error,
      context,
      timestamp: Date.now()
    });
    
    // Garder seulement les 20 dernières erreurs
    if (this.state.errors.length > 20) {
      this.state.errors = this.state.errors.slice(-20);
    }
  }
  
  addWarning(warning, context) {
    this.state.warnings.push({
      warning,
      context,
      timestamp: Date.now()
    });
    
    // Garder seulement les 20 derniers avertissements
    if (this.state.warnings.length > 20) {
      this.state.warnings = this.state.warnings.slice(-20);
    }
  }
  
  getHealthReport() {
    const now = Date.now();
    const last5Minutes = now - (5 * 60 * 1000);
    
    const recentErrors = this.state.errors.filter(e => e.timestamp > last5Minutes);
    const recentWarnings = this.state.warnings.filter(w => w.timestamp > last5Minutes);
    
    const health = {
      overall: "GOOD",
      details: {
        state: this.state,
        recentErrors: recentErrors.length,
        recentWarnings: recentWarnings.length,
        timestamp: new Date().toISOString()
      }
    };
    
    if (recentErrors.length > 5) {
      health.overall = "CRITICAL";
    } else if (recentErrors.length > 2 || recentWarnings.length > 10) {
      health.overall = "WARNING";
    }
    
    return health;
  }
}

// ===== SYSTÈME DE RÉCUPÉRATION AUTOMATIQUE =====
class AutoRecoverySystem {
  constructor(logger, stateManager) {
    this.logger = logger;
    this.stateManager = stateManager;
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    this.recoveryStrategies = new Map();
    
    this.setupRecoveryStrategies();
  }
  
  setupRecoveryStrategies() {
    // Stratégie de récupération Firebase
    this.recoveryStrategies.set('firebase_disconnected', async () => {
      this.logger.info("Tentative de reconnexion Firebase", "AutoRecovery");
      
      if (typeof testFirebaseConnectionSafe === 'function') {
        const connected = await testFirebaseConnectionSafe();
        if (connected) {
          this.stateManager.setState('firebaseConnected', true, "AutoRecovery");
          this.logger.info("Reconnexion Firebase réussie", "AutoRecovery");
          return true;
        }
      }
      return false;
    });
    
    // Stratégie de récupération des variables globales
    this.recoveryStrategies.set('missing_variables', async () => {
      this.logger.info("Réinitialisation des variables globales", "AutoRecovery");
      
      if (typeof initializeGlobalVariables === 'function') {
        initializeGlobalVariables();
        this.logger.info("Variables globales réinitialisées", "AutoRecovery");
        return true;
      }
      return false;
    });
    
    // Stratégie de récupération du rendu
    this.recoveryStrategies.set('rendering_failed', async () => {
      this.logger.info("Tentative de re-rendu", "AutoRecovery");
      
      try {
        if (typeof renderPalanquees === 'function') renderPalanquees();
        if (typeof renderPlongeurs === 'function') renderPlongeurs();
        if (typeof updateAlertes === 'function') updateAlertes();
        if (typeof updateCompteurs === 'function') updateCompteurs();
        
        this.logger.info("Re-rendu réussi", "AutoRecovery");
        return true;
      } catch (error) {
        this.logger.error("Échec du re-rendu", "AutoRecovery", error);
        return false;
      }
    });
  }
  
  async attemptRecovery(issueType, context = "") {
    const attemptKey = `${issueType}_${context}`;
    const currentAttempts = this.recoveryAttempts.get(attemptKey) || 0;
    
    if (currentAttempts >= this.maxRecoveryAttempts) {
      this.logger.error(
        `Maximum de tentatives de récupération atteint pour ${issueType}`,
        "AutoRecovery"
      );
      return false;
    }
    
    this.recoveryAttempts.set(attemptKey, currentAttempts + 1);
    
    const strategy = this.recoveryStrategies.get(issueType);
    if (!strategy) {
      this.logger.warning(`Aucune stratégie de récupération pour ${issueType}`, "AutoRecovery");
      return false;
    }
    
    this.logger.info(
      `Tentative de récupération ${currentAttempts + 1}/${this.maxRecoveryAttempts} pour ${issueType}`,
      "AutoRecovery"
    );
    
    try {
      const success = await strategy();
      
      if (success) {
        // Reset le compteur en cas de succès
        this.recoveryAttempts.delete(attemptKey);
        this.logger.info(`Récupération réussie pour ${issueType}`, "AutoRecovery");
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération ${issueType}`, "AutoRecovery", error);
      return false;
    }
  }
  
  resetRecoveryAttempts(issueType = null) {
    if (issueType) {
      // Reset pour un type spécifique
      for (const [key] of this.recoveryAttempts) {
        if (key.startsWith(issueType)) {
          this.recoveryAttempts.delete(key);
        }
      }
    } else {
      // Reset complet
      this.recoveryAttempts.clear();
    }
    
    this.logger.info("Compteurs de récupération réinitialisés", "AutoRecovery");
  }
  
  getRecoveryStats() {
    const stats = {};
    for (const [key, attempts] of this.recoveryAttempts) {
      stats[key] = attempts;
    }
    return stats;
  }
}

// ===== INITIALISATION DU SYSTÈME COMPLET =====
window.jsasStateManager = new ApplicationStateManager(window.jsasLogger);
window.jsasAutoRecovery = new AutoRecoverySystem(window.jsasLogger, window.jsasStateManager);

// Surveillance automatique de l'état de l'application
setInterval(() => {
  const health = window.jsasStateManager.getHealthReport();
  
  if (health.overall === "CRITICAL") {
    window.jsasLogger.error("État critique de l'application", "HealthMonitor", health);
    
    // Tentative de récupération automatique
    if (health.details.recentErrors > 5) {
      window.jsasAutoRecovery.attemptRecovery("critical_errors", "HealthMonitor");
    }
  }
}, 30000); // Toutes les 30 secondes

// Fonction de diagnostic complète
window.jsasDiagnostic = () => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    logs: window.jsasLogger.getStats(),
    state: window.jsasStateManager.getState(),
    health: window.jsasStateManager.getHealthReport(),
    retryStats: window.jsasErrorHandler.getRetryStats(),
    recoveryStats: window.jsasAutoRecovery.getRecoveryStats(),
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled
    },
    performance: {
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      } : 'Non disponible'
    }
  };
  
  console.log("🔍 === DIAGNOSTIC COMPLET JSAS ===");
  console.log(diagnostic);
  console.log("===============================");
  
  return diagnostic;
};

// Raccourci pour exporter le diagnostic
window.exportDiagnostic = () => {
  const diagnostic = window.jsasDiagnostic();
  
  const dataStr = JSON.stringify(diagnostic, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jsas-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log("📁 Diagnostic exporté");
};

// Fonction de nettoyage de l'état
window.cleanupJSASState = () => {
  window.jsasLogger.clearLogs();
  window.jsasErrorHandler.resetRetryCount();
  window.jsasAutoRecovery.resetRecoveryAttempts();
  
  // Réinitialiser l'état de l'application
  window.jsasStateManager.state = {
    initialized: false,
    firebaseConnected: false,
    userAuthenticated: false,
    dataLoaded: false,
    lockSystemActive: false,
    offlineMode: false,
    errors: [],
    warnings: []
  };
  
  console.log("🧹 État JSAS nettoyé");
};

// Messages de démarrage
window.jsasLogger.info("Système de gestion d'erreurs initialisé", "ErrorHandler");
window.jsasLogger.info("Gestionnaire d'état application initialisé", "StateManager");
window.jsasLogger.info("Système de récupération automatique initialisé", "AutoRecovery");

console.log(`
🛠️ === SYSTÈME D'ERREURS JSAS ACTIVÉ ===

Fonctions disponibles:
• jsasDebugConsole.help() - Console de debug
• jsasDiagnostic() - Diagnostic complet
• exportDiagnostic() - Exporter diagnostic
• cleanupJSASState() - Nettoyer l'état

Logs automatiques: ✅
Récupération auto: ✅
Surveillance santé: ✅

=====================================
`);

console.log("✅ Système de gestion d'erreurs JSAS chargé - Version 1.0.0");