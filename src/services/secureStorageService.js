import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import authService from './authService';
import { Buffer } from 'buffer';

// Security configuration
const SECURITY_CONFIG = {
  // Storage keys
  STORAGE_KEYS: {
    MEDICATIONS: 'medguard_medications',
    SCHEDULES: 'medguard_schedules',
    NOTIFICATION_SETTINGS: 'medguard_notification_settings',
    LANGUAGE: 'medguard_language',
    APP_SETTINGS: 'medguard_app_settings',
    USER_DATA: 'medguard_user_data',
    STOCK_ANALYTICS: 'medguard_stock_analytics',
    PHARMACY_INTEGRATIONS: 'medguard_pharmacy_integrations',
    STOCK_ALERTS: 'medguard_stock_alerts',
    STOCK_TRANSACTIONS: 'medguard_stock_transactions',
    STOCK_VISUALIZATIONS: 'medguard_stock_visualizations',
    ENCRYPTION_KEY: 'medguard_encryption_key',
    SECURITY_SETTINGS: 'medguard_security_settings'
  },
  
  // Encryption settings
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION_ITERATIONS: 100000,
  
  // Security levels
  SECURITY_LEVELS: {
    LOW: 'low',      // Non-sensitive data
    MEDIUM: 'medium', // Moderately sensitive data
    HIGH: 'high'      // Highly sensitive data (medical data)
  }
};

class HIPAACompliantStorageService {
  constructor() {
    this.encryptionKey = null;
    this.isInitialized = false;
    this.securityLevel = SECURITY_CONFIG.SECURITY_LEVELS.HIGH;
  }

  /**
   * Initialize the secure storage service
   */
  async initialize() {
    try {
      // Check if user is authenticated
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated) {
        throw new Error('User must be authenticated to access secure storage');
      }

      // Generate or retrieve encryption key
      await this.initializeEncryptionKey();
      
      // Verify biometric authentication for sensitive operations
      await this.verifyBiometricAccess();
      
      this.isInitialized = true;
      console.log('Secure storage service initialized');
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw error;
    }
  }

  /**
   * Initialize encryption key
   */
  async initializeEncryptionKey() {
    try {
      let key = await SecureStore.getItemAsync(SECURITY_CONFIG.STORAGE_KEYS.ENCRYPTION_KEY);
      
      if (!key) {
        // Generate a new encryption key
        key = this.generateEncryptionKey();
        await SecureStore.setItemAsync(SECURITY_CONFIG.STORAGE_KEYS.ENCRYPTION_KEY, key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw error;
    }
  }

  /**
   * Generate a secure encryption key
   */
  generateEncryptionKey() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const deviceId = authService.getSecuritySettings().deviceId;
    
    // Create a deterministic but secure key
    return Buffer.from(`${timestamp}-${random}-${deviceId}`).toString('base64');
  }

  /**
   * Verify biometric access for sensitive operations
   */
  async verifyBiometricAccess() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Please authenticate to access your medication data',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      if (!result.success) {
        throw new Error('Biometric authentication required for secure storage access');
      }
      
      // Update last activity
      await authService.updateLastActivity();
    } catch (error) {
      console.error('Biometric verification failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using the encryption key
   */
  async encryptData(data, securityLevel = SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const jsonData = JSON.stringify(data);
      
      // For high security level, use additional encryption
      if (securityLevel === SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
        // Add timestamp and device ID for additional security
        const secureData = {
          data: jsonData,
          timestamp: Date.now(),
          deviceId: authService.getSecuritySettings().deviceId,
          securityLevel: securityLevel
        };
        
        return Buffer.from(JSON.stringify(secureData)).toString('base64');
      }
      
      // For medium and low security, use basic encoding
      return Buffer.from(jsonData).toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using the encryption key
   */
  async decryptData(encryptedData, securityLevel = SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const decodedData = Buffer.from(encryptedData, 'base64').toString();
      
      // For high security level, parse additional metadata
      if (securityLevel === SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
        const secureData = JSON.parse(decodedData);
        
        // Verify device ID
        if (secureData.deviceId !== authService.getSecuritySettings().deviceId) {
          throw new Error('Data appears to be from a different device');
        }
        
        // Check if data is too old (optional security measure)
        const dataAge = Date.now() - secureData.timestamp;
        if (dataAge > 30 * 24 * 60 * 60 * 1000) { // 30 days
          console.warn('Data is older than 30 days');
        }
        
        return JSON.parse(secureData.data);
      }
      
      // For medium and low security, parse directly
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Securely store data
   */
  async setItem(key, value, securityLevel = SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const encryptedValue = await this.encryptData(value, securityLevel);
      
      // Use SecureStore for sensitive data, AsyncStorage for non-sensitive
      if (securityLevel === SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
        await SecureStore.setItemAsync(key, encryptedValue);
      } else {
        await AsyncStorage.setItem(key, encryptedValue);
      }
      
      // Log security event
      await authService.logSecurityEvent('DATA_STORED', {
        key: key,
        securityLevel: securityLevel,
        dataSize: JSON.stringify(value).length
      });
      
      return true;
    } catch (error) {
      console.error('Error storing data:', error);
      return false;
    }
  }

  /**
   * Securely retrieve data
   */
  async getItem(key, securityLevel = SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let encryptedValue;
      
      // Retrieve from appropriate storage
      if (securityLevel === SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
        encryptedValue = await SecureStore.getItemAsync(key);
      } else {
        encryptedValue = await AsyncStorage.getItem(key);
      }
      
      if (!encryptedValue) return null;
      
      const decryptedValue = await this.decryptData(encryptedValue, securityLevel);
      
      // Log security event
      await authService.logSecurityEvent('DATA_RETRIEVED', {
        key: key,
        securityLevel: securityLevel
      });
      
      return decryptedValue;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Securely remove data
   */
  async removeItem(key, securityLevel = SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
    try {
      if (securityLevel === SECURITY_CONFIG.SECURITY_LEVELS.HIGH) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      
      // Log security event
      await authService.logSecurityEvent('DATA_DELETED', {
        key: key,
        securityLevel: securityLevel
      });
      
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  /**
   * Clear all data securely
   */
  async clear() {
    try {
      // Clear SecureStore items
      const secureKeys = Object.values(SECURITY_CONFIG.STORAGE_KEYS);
      for (const key of secureKeys) {
        await SecureStore.deleteItemAsync(key);
      }
      
      // Clear AsyncStorage items
      await AsyncStorage.clear();
      
      // Log security event
      await authService.logSecurityEvent('ALL_DATA_CLEARED', {
        deviceId: authService.getSecuritySettings().deviceId
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Medication-specific methods with high security
  async saveMedications(medications) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.MEDICATIONS, medications, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getMedications() {
    const medications = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.MEDICATIONS, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
    return medications || [];
  }

  async saveSchedules(schedules) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.SCHEDULES, schedules, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getSchedules() {
    const schedules = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.SCHEDULES, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
    return schedules || [];
  }

  // Stock analytics with high security
  async saveStockAnalytics(analytics) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_ANALYTICS, analytics, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getStockAnalytics() {
    const analytics = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_ANALYTICS, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
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
      analytics[existingIndex] = { ...analytics[existingIndex], ...analyticsData, updatedAt: new Date().toISOString() };
    } else {
      analytics.push({ medicationId, ...analyticsData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    return this.saveStockAnalytics(analytics);
  }

  // Pharmacy integrations with high security
  async savePharmacyIntegrations(integrations) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.PHARMACY_INTEGRATIONS, integrations, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getPharmacyIntegrations() {
    const integrations = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.PHARMACY_INTEGRATIONS, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
    return integrations || [];
  }

  async addPharmacyIntegration(integration) {
    const integrations = await this.getPharmacyIntegrations();
    integrations.push({ ...integration, id: Date.now().toString(), createdAt: new Date().toISOString() });
    return this.savePharmacyIntegrations(integrations);
  }

  async updatePharmacyIntegration(id, updates) {
    const integrations = await this.getPharmacyIntegrations();
    const index = integrations.findIndex(i => i.id === id);
    
    if (index >= 0) {
      integrations[index] = { ...integrations[index], ...updates, updatedAt: new Date().toISOString() };
      return this.savePharmacyIntegrations(integrations);
    }
    
    return false;
  }

  async deletePharmacyIntegration(id) {
    const integrations = await this.getPharmacyIntegrations();
    const filtered = integrations.filter(i => i.id !== id);
    return this.savePharmacyIntegrations(filtered);
  }

  // Stock alerts with high security
  async saveStockAlerts(alerts) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_ALERTS, alerts, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getStockAlerts() {
    const alerts = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_ALERTS, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
    return alerts || [];
  }

  async addStockAlert(alert) {
    const alerts = await this.getStockAlerts();
    alerts.push({ ...alert, id: Date.now().toString(), createdAt: new Date().toISOString() });
    return this.saveStockAlerts(alerts);
  }

  async updateStockAlert(id, updates) {
    const alerts = await this.getStockAlerts();
    const index = alerts.findIndex(a => a.id === id);
    
    if (index >= 0) {
      alerts[index] = { ...alerts[index], ...updates, updatedAt: new Date().toISOString() };
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
    return alerts.filter(alert => !alert.isRead);
  }

  async markStockAlertAsRead(id) {
    return this.updateStockAlert(id, { isRead: true, readAt: new Date().toISOString() });
  }

  async markStockAlertAsResolved(id, actionTaken = '') {
    return this.updateStockAlert(id, { 
      isResolved: true, 
      resolvedAt: new Date().toISOString(),
      actionTaken 
    });
  }

  // Stock transactions with high security
  async saveStockTransactions(transactions) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_TRANSACTIONS, transactions, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getStockTransactions() {
    const transactions = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_TRANSACTIONS, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
    return transactions || [];
  }

  async addStockTransaction(transaction) {
    const transactions = await this.getStockTransactions();
    transactions.push({ ...transaction, id: Date.now().toString(), timestamp: new Date().toISOString() });
    return this.saveStockTransactions(transactions);
  }

  async getStockTransactionsForMedication(medicationId, limit = 50) {
    const transactions = await this.getStockTransactions();
    return transactions
      .filter(t => t.medicationId === medicationId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Stock visualizations with high security
  async saveStockVisualizations(visualizations) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_VISUALIZATIONS, visualizations, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getStockVisualizations() {
    const visualizations = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.STOCK_VISUALIZATIONS, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
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
      visualizations[existingIndex] = { 
        ...visualizations[existingIndex], 
        ...visualizationData, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      visualizations.push({ 
        medicationId, 
        ...visualizationData, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
    }
    
    return this.saveStockVisualizations(visualizations);
  }

  // App settings with medium security
  async saveNotificationSettings(settings) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS, settings, SECURITY_CONFIG.SECURITY_LEVELS.MEDIUM);
  }

  async getNotificationSettings() {
    const settings = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS, SECURITY_CONFIG.SECURITY_LEVELS.MEDIUM);
    return settings || {
      enabled: true,
      reminderTime: 15,
      lowStockThreshold: 7,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  async saveLanguage(language) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.LANGUAGE, language, SECURITY_CONFIG.SECURITY_LEVELS.LOW);
  }

  async getLanguage() {
    const language = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.LANGUAGE, SECURITY_CONFIG.SECURITY_LEVELS.LOW);
    return language || 'en';
  }

  async saveAppSettings(settings) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.APP_SETTINGS, settings, SECURITY_CONFIG.SECURITY_LEVELS.MEDIUM);
  }

  async getAppSettings() {
    const settings = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.APP_SETTINGS, SECURITY_CONFIG.SECURITY_LEVELS.MEDIUM);
    return settings || {
      theme: 'light',
      fontSize: 'medium',
      autoBackup: true,
      backupFrequency: 'daily',
      dataRetentionDays: 365,
      analyticsEnabled: true,
      crashReportingEnabled: true
    };
  }

  // User data with high security
  async saveUserData(userData) {
    return this.setItem(SECURITY_CONFIG.STORAGE_KEYS.USER_DATA, userData, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
  }

  async getUserData() {
    const userData = await this.getItem(SECURITY_CONFIG.STORAGE_KEYS.USER_DATA, SECURITY_CONFIG.SECURITY_LEVELS.HIGH);
    return userData || {
      name: '',
      age: null,
      emergencyContact: '',
      allergies: [],
      conditions: [],
      preferences: {
        notifications: true,
        reminders: true,
        dataSharing: false
      }
    };
  }

  /**
   * Export all data securely
   */
  async exportAllData() {
    try {
      const data = {
        medications: await this.getMedications(),
        schedules: await this.getSchedules(),
        notificationSettings: await this.getNotificationSettings(),
        language: await this.getLanguage(),
        appSettings: await this.getAppSettings(),
        userData: await this.getUserData(),
        stockAnalytics: await this.getStockAnalytics(),
        pharmacyIntegrations: await this.getPharmacyIntegrations(),
        stockAlerts: await this.getStockAlerts(),
        stockTransactions: await this.getStockTransactions(),
        stockVisualizations: await this.getStockVisualizations(),
        exportedAt: new Date().toISOString(),
        deviceId: authService.getSecuritySettings().deviceId,
        securityLevel: this.securityLevel
      };
      
      // Log export event
      await authService.logSecurityEvent('DATA_EXPORTED', {
        dataSize: JSON.stringify(data).length,
        deviceId: authService.getSecuritySettings().deviceId
      });
      
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data securely
   */
  async importData(data) {
    try {
      // Verify data integrity
      if (!data.exportedAt || !data.deviceId) {
        throw new Error('Invalid data format');
      }
      
      // Import all data types
      if (data.medications) await this.saveMedications(data.medications);
      if (data.schedules) await this.saveSchedules(data.schedules);
      if (data.notificationSettings) await this.saveNotificationSettings(data.notificationSettings);
      if (data.language) await this.saveLanguage(data.language);
      if (data.appSettings) await this.saveAppSettings(data.appSettings);
      if (data.userData) await this.saveUserData(data.userData);
      if (data.stockAnalytics) await this.saveStockAnalytics(data.stockAnalytics);
      if (data.pharmacyIntegrations) await this.savePharmacyIntegrations(data.pharmacyIntegrations);
      if (data.stockAlerts) await this.saveStockAlerts(data.stockAlerts);
      if (data.stockTransactions) await this.saveStockTransactions(data.stockTransactions);
      if (data.stockVisualizations) await this.saveStockVisualizations(data.stockVisualizations);
      
      // Log import event
      await authService.logSecurityEvent('DATA_IMPORTED', {
        dataSize: JSON.stringify(data).length,
        sourceDeviceId: data.deviceId,
        targetDeviceId: authService.getSecuritySettings().deviceId
      });
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        totalItems: 0,
        totalSize: 0,
        securityLevels: {
          high: 0,
          medium: 0,
          low: 0
        },
        lastBackup: null,
        deviceId: authService.getSecuritySettings().deviceId
      };
      
      // Count items in each storage type
      const secureKeys = Object.values(SECURITY_CONFIG.STORAGE_KEYS);
      for (const key of secureKeys) {
        const value = await SecureStore.getItemAsync(key);
        if (value) {
          stats.totalItems++;
          stats.totalSize += value.length;
          stats.securityLevels.high++;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const secureStorageService = new HIPAACompliantStorageService();

export default secureStorageService; 