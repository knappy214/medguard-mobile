import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  MEDICATIONS: 'medguard_medications',
  SCHEDULES: 'medguard_schedules',
  NOTIFICATION_SETTINGS: 'medguard_notification_settings',
  LANGUAGE: 'medguard_language',
  APP_SETTINGS: 'medguard_app_settings',
  USER_DATA: 'medguard_user_data',
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
        exportDate: new Date().toISOString(),
        version: '1.0.0',
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