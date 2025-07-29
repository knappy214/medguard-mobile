import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  MEDICATIONS: 'medguard_medications',
  SCHEDULES: 'medguard_schedules',
  NOTIFICATION_SETTINGS: 'medguard_notification_settings',
  LANGUAGE: 'medguard_language',
  APP_SETTINGS: 'medguard_app_settings',
  USER_DATA: 'medguard_user_data',
  // Intelligent stock tracking keys
  STOCK_ANALYTICS: 'medguard_stock_analytics',
  PHARMACY_INTEGRATIONS: 'medguard_pharmacy_integrations',
  STOCK_ALERTS: 'medguard_stock_alerts',
  STOCK_TRANSACTIONS: 'medguard_stock_transactions',
  STOCK_VISUALIZATIONS: 'medguard_stock_visualizations',
};

class StorageService {
  // Generic storage methods
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Medication-specific methods
  async saveMedications(medications) {
    return this.setItem(STORAGE_KEYS.MEDICATIONS, medications);
  }

  async getMedications() {
    const medications = await this.getItem(STORAGE_KEYS.MEDICATIONS);
    return medications || [];
  }

  async saveSchedules(schedules) {
    return this.setItem(STORAGE_KEYS.SCHEDULES, schedules);
  }

  async getSchedules() {
    const schedules = await this.getItem(STORAGE_KEYS.SCHEDULES);
    return schedules || [];
  }

  // Intelligent Stock Tracking Methods

  // Stock Analytics
  async saveStockAnalytics(analytics) {
    return this.setItem(STORAGE_KEYS.STOCK_ANALYTICS, analytics);
  }

  async getStockAnalytics() {
    const analytics = await this.getItem(STORAGE_KEYS.STOCK_ANALYTICS);
    return analytics || [];
  }

  async getStockAnalyticsForMedication(medicationId) {
    const analytics = await this.getStockAnalytics();
    return analytics.find(a => a.medicationId === medicationId) || null;
  }

  async updateStockAnalytics(medicationId, analyticsData) {
    const analytics = await this.getStockAnalytics();
    const existingIndex = analytics.findIndex(a => a.medicationId === medicationId);
    
    if (existingIndex >= 0) {
      analytics[existingIndex] = { ...analytics[existingIndex], ...analyticsData };
    } else {
      analytics.push({ medicationId, ...analyticsData });
    }
    
    return this.saveStockAnalytics(analytics);
  }

  // Pharmacy Integrations
  async savePharmacyIntegrations(integrations) {
    return this.setItem(STORAGE_KEYS.PHARMACY_INTEGRATIONS, integrations);
  }

  async getPharmacyIntegrations() {
    const integrations = await this.getItem(STORAGE_KEYS.PHARMACY_INTEGRATIONS);
    return integrations || [];
  }

  async addPharmacyIntegration(integration) {
    const integrations = await this.getPharmacyIntegrations();
    integrations.push(integration);
    return this.savePharmacyIntegrations(integrations);
  }

  async updatePharmacyIntegration(id, updates) {
    const integrations = await this.getPharmacyIntegrations();
    const index = integrations.findIndex(i => i.id === id);
    
    if (index >= 0) {
      integrations[index] = { ...integrations[index], ...updates };
      return this.savePharmacyIntegrations(integrations);
    }
    return false;
  }

  async deletePharmacyIntegration(id) {
    const integrations = await this.getPharmacyIntegrations();
    const filtered = integrations.filter(i => i.id !== id);
    return this.savePharmacyIntegrations(filtered);
  }

  // Stock Alerts
  async saveStockAlerts(alerts) {
    return this.setItem(STORAGE_KEYS.STOCK_ALERTS, alerts);
  }

  async getStockAlerts() {
    const alerts = await this.getItem(STORAGE_KEYS.STOCK_ALERTS);
    return alerts || [];
  }

  async addStockAlert(alert) {
    const alerts = await this.getStockAlerts();
    alerts.push(alert);
    return this.saveStockAlerts(alerts);
  }

  async updateStockAlert(id, updates) {
    const alerts = await this.getStockAlerts();
    const index = alerts.findIndex(a => a.id === id);
    
    if (index >= 0) {
      alerts[index] = { ...alerts[index], ...updates };
      return this.saveStockAlerts(alerts);
    }
    return false;
  }

  async deleteStockAlert(id) {
    const alerts = await this.getStockAlerts();
    const filtered = alerts.filter(a => a.id !== id);
    return this.saveStockAlerts(filtered);
  }

  async getUnreadStockAlerts() {
    const alerts = await this.getStockAlerts();
    return alerts.filter(a => !a.isRead);
  }

  async markStockAlertAsRead(id) {
    return this.updateStockAlert(id, { isRead: true });
  }

  async markStockAlertAsResolved(id, actionTaken = '') {
    return this.updateStockAlert(id, { 
      isResolved: true, 
      resolvedAt: new Date().toISOString(),
      actionTaken 
    });
  }

  // Stock Transactions
  async saveStockTransactions(transactions) {
    return this.setItem(STORAGE_KEYS.STOCK_TRANSACTIONS, transactions);
  }

  async getStockTransactions() {
    const transactions = await this.getItem(STORAGE_KEYS.STOCK_TRANSACTIONS);
    return transactions || [];
  }

  async addStockTransaction(transaction) {
    const transactions = await this.getStockTransactions();
    transactions.push(transaction);
    return this.saveStockTransactions(transactions);
  }

  async getStockTransactionsForMedication(medicationId, limit = 50) {
    const transactions = await this.getStockTransactions();
    return transactions
      .filter(t => t.medicationId === medicationId)
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, limit);
  }

  // Stock Visualizations
  async saveStockVisualizations(visualizations) {
    return this.setItem(STORAGE_KEYS.STOCK_VISUALIZATIONS, visualizations);
  }

  async getStockVisualizations() {
    const visualizations = await this.getItem(STORAGE_KEYS.STOCK_VISUALIZATIONS);
    return visualizations || [];
  }

  async getStockVisualizationForMedication(medicationId) {
    const visualizations = await this.getStockVisualizations();
    return visualizations.find(v => v.medicationId === medicationId) || null;
  }

  async updateStockVisualization(medicationId, visualizationData) {
    const visualizations = await this.getStockVisualizations();
    const existingIndex = visualizations.findIndex(v => v.medicationId === medicationId);
    
    if (existingIndex >= 0) {
      visualizations[existingIndex] = { ...visualizations[existingIndex], ...visualizationData };
    } else {
      visualizations.push({ medicationId, ...visualizationData });
    }
    
    return this.saveStockVisualizations(visualizations);
  }

  // Notification settings
  async saveNotificationSettings(settings) {
    return this.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
  }

  async getNotificationSettings() {
    const settings = await this.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return settings || {
      enabled: true,
      reminderTime: 15,
      lowStockThreshold: 7,
      refillReminderDays: 3,
      soundEnabled: true,
      vibrationEnabled: true,
      // Intelligent stock tracking notification settings
      stockAlertsEnabled: true,
      expirationWarningsEnabled: true,
      predictionAlertsEnabled: true,
      autoOrderNotificationsEnabled: true,
    };
  }

  // Language settings
  async saveLanguage(language) {
    return this.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  async getLanguage() {
    const language = await this.getItem(STORAGE_KEYS.LANGUAGE);
    return language || 'en';
  }

  // App settings
  async saveAppSettings(settings) {
    return this.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  async getAppSettings() {
    const settings = await this.getItem(STORAGE_KEYS.APP_SETTINGS);
    return settings || {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      autoBackup: true,
      backupFrequency: 'weekly',
      // Intelligent stock tracking settings
      stockTrackingEnabled: true,
      autoOrderEnabled: false,
      predictionEnabled: true,
      alertThresholds: {
        lowStock: 7,
        criticalStock: 3,
        expirationWarning: 30,
      },
      syncFrequency: 'daily',
      analyticsEnabled: true,
    };
  }

  // User data
  async saveUserData(userData) {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  async getUserData() {
    const userData = await this.getItem(STORAGE_KEYS.USER_DATA);
    return userData || {
      name: '',
      age: null,
      emergencyContact: '',
      allergies: [],
      conditions: [],
    };
  }

  // Data export/import
  async exportAllData() {
    try {
      const data = {
        medications: await this.getMedications(),
        schedules: await this.getSchedules(),
        notificationSettings: await this.getNotificationSettings(),
        language: await this.getLanguage(),
        appSettings: await this.getAppSettings(),
        userData: await this.getUserData(),
        // Intelligent stock tracking data
        stockAnalytics: await this.getStockAnalytics(),
        pharmacyIntegrations: await this.getPharmacyIntegrations(),
        stockAlerts: await this.getStockAlerts(),
        stockTransactions: await this.getStockTransactions(),
        stockVisualizations: await this.getStockVisualizations(),
        exportDate: new Date().toISOString(),
        version: '2.0.0',
      };
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  async importData(data) {
    try {
      if (data.medications) {
        await this.saveMedications(data.medications);
      }
      if (data.schedules) {
        await this.saveSchedules(data.schedules);
      }
      if (data.notificationSettings) {
        await this.saveNotificationSettings(data.notificationSettings);
      }
      if (data.language) {
        await this.saveLanguage(data.language);
      }
      if (data.appSettings) {
        await this.saveAppSettings(data.appSettings);
      }
      if (data.userData) {
        await this.saveUserData(data.userData);
      }
      // Import intelligent stock tracking data
      if (data.stockAnalytics) {
        await this.saveStockAnalytics(data.stockAnalytics);
      }
      if (data.pharmacyIntegrations) {
        await this.savePharmacyIntegrations(data.pharmacyIntegrations);
      }
      if (data.stockAlerts) {
        await this.saveStockAlerts(data.stockAlerts);
      }
      if (data.stockTransactions) {
        await this.saveStockTransactions(data.stockTransactions);
      }
      if (data.stockVisualizations) {
        await this.saveStockVisualizations(data.stockVisualizations);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Backup and restore
  async createBackup() {
    try {
      const data = await this.exportAllData();
      const backupKey = `backup_${Date.now()}`;
      await this.setItem(backupKey, data);
      return backupKey;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  }

  async getBackups() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith('backup_'));
      const backups = [];
      
      for (const key of backupKeys) {
        const backup = await this.getItem(key);
        if (backup) {
          backups.push({
            key,
            date: backup.exportDate,
            version: backup.version,
          });
        }
      }
      
      return backups.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  async restoreBackup(backupKey) {
    try {
      const backup = await this.getItem(backupKey);
      if (backup) {
        return await this.importData(backup);
      }
      return false;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  async deleteBackup(backupKey) {
    return this.removeItem(backupKey);
  }

  // Cleanup old backups (keep only last 5)
  async cleanupOldBackups() {
    try {
      const backups = await this.getBackups();
      if (backups.length > 5) {
        const backupsToDelete = backups.slice(5);
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }
}

export default new StorageService(); 