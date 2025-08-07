import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';
// Define the interface locally since it's not exported from apiService
interface MedicationSchedule {
  id: number;
  medication: any;
  patient: number;
  timing: 'morning' | 'noon' | 'night' | 'custom';
  customTime?: string;
  dosageAmount: string;
  frequency: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'paused' | 'completed';
  instructions?: string;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: data.priority === 'critical' 
        ? Notifications.AndroidNotificationPriority.HIGH
        : Notifications.AndroidNotificationPriority.DEFAULT,
    };
  },
});

interface NotificationSchedule {
  id: string;
  medicationId: number;
  medicationName: string;
  scheduleId: number;
  dosage: string;
  time: Date;
  recurring: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface ReminderSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderMinutesBefore: number;
  missedDoseReminders: boolean;
  lowStockReminders: boolean;
  refillReminders: boolean;
  customSoundUri?: string;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "08:00"
  weekendReminders: boolean;
}

class NotificationService {
  private static NOTIFICATION_SETTINGS_KEY = 'notification_settings';
  private static SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';
  
  private defaultSettings: ReminderSettings = {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    reminderMinutesBefore: 15,
    missedDoseReminders: true,
    lowStockReminders: true,
    refillReminders: true,
    weekendReminders: true,
  };
  
  async initializeNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return null;
      }
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: true,
            allowProvisional: false,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Notification permissions not granted');
      }
      
      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }
      
      // Get and register push token
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'medguard-sa-mobile-uuid',
      });
      
      // Register token with backend
      await this.registerPushToken(pushToken.data);
      
      return pushToken.data;
    } catch (error) {
      console.error('Initialize notifications error:', error);
      return null;
    }
  }
  
  private async setupNotificationChannels(): Promise<void> {
    // Medication reminder channel
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      description: 'Notifications for scheduled medication doses',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'medication-reminder.wav',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    
    // Critical alerts channel
    await Notifications.setNotificationChannelAsync('critical-alerts', {
      name: 'Critical Medical Alerts',
      description: 'Urgent medical notifications',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'urgent-alert.wav',
      vibrationPattern: [0, 1000, 500, 1000],
      lightColor: '#EF4444',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    
    // Stock alerts channel
    await Notifications.setNotificationChannelAsync('stock-alerts', {
      name: 'Stock Level Alerts',
      description: 'Notifications about medication stock levels',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
    
    // General notifications channel
    await Notifications.setNotificationChannelAsync('general', {
      name: 'General Notifications',
      description: 'General app notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }
  
  private async registerPushToken(token: string): Promise<void> {
    try {
      const headers = await authService.getAuthHeaders();
      await fetch('https://api.medguard-sa.com/api/push-tokens/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          deviceModel: Device.modelName,
          osVersion: Device.osVersion,
        }),
      });
    } catch (error) {
      console.error('Register push token error:', error);
      // Store token locally for later registration
      await AsyncStorage.setItem('pending_push_token', token);
    }
  }
  
  async scheduleMedicationReminders(schedules: MedicationSchedule[]): Promise<void> {
    try {
      // Cancel existing notifications
      await this.cancelAllScheduledNotifications();
      
      const settings = await this.getReminderSettings();
      if (!settings.enabled) return;
      
      const scheduledNotifications: NotificationSchedule[] = [];
      
      for (const schedule of schedules) {
        if (schedule.status !== 'active') continue;
        
        const notifications = await this.createNotificationsForSchedule(schedule, settings);
        scheduledNotifications.push(...notifications);
      }
      
      // Store scheduled notifications for reference
      await AsyncStorage.setItem(
        NotificationService.SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify(scheduledNotifications)
      );
      
    } catch (error) {
      console.error('Schedule medication reminders error:', error);
    }
  }
  
  private async createNotificationsForSchedule(
    schedule: MedicationSchedule,
    settings: ReminderSettings
  ): Promise<NotificationSchedule[]> {
    const notifications: NotificationSchedule[] = [];
    const now = new Date();
    const endDate = schedule.endDate ? new Date(schedule.endDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year if no end date
    
    // Create recurring notifications for the next 30 days
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const actualEndDate = endDate < maxDate ? endDate : maxDate;
    
    const daysOfWeek = [
      schedule.sunday,
      schedule.monday,
      schedule.tuesday, 
      schedule.wednesday,
      schedule.thursday,
      schedule.friday,
      schedule.saturday
    ];
    
    for (let date = new Date(now); date <= actualEndDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      if (!daysOfWeek[dayOfWeek]) continue;
      
      // Skip weekends if disabled
      if (!settings.weekendReminders && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
      
      const notificationTime = this.getNotificationTime(date, schedule, settings);
      
      // Skip past times
      if (notificationTime <= now) continue;
      
      // Check quiet hours
      if (this.isInQuietHours(notificationTime, settings)) continue;
      
      const notificationId = await this.scheduleNotification({
        time: notificationTime,
        medication: schedule.medication,
        schedule,
        settings,
      });
      
      if (notificationId) {
        notifications.push({
          id: notificationId,
          medicationId: schedule.medication.id,
          medicationName: schedule.medication.name,
          scheduleId: schedule.id,
          dosage: schedule.dosageAmount,
          time: notificationTime,
          recurring: true,
          priority: 'normal',
        });
      }
    }
    
    return notifications;
  }
  
  private getNotificationTime(date: Date, schedule: MedicationSchedule, settings: ReminderSettings): Date {
    const notificationTime = new Date(date);
    
    let hours: number, minutes: number;
    
    if (schedule.timing === 'custom' && schedule.customTime) {
      const [timeHours, timeMinutes] = schedule.customTime.split(':').map(Number);
      hours = timeHours || 0;
      minutes = timeMinutes || 0;
    } else {
      // Default times
      switch (schedule.timing) {
        case 'morning':
          hours = 8;
          minutes = 0;
          break;
        case 'noon':
          hours = 12;
          minutes = 0;
          break;
        case 'night':
          hours = 20;
          minutes = 0;
          break;
        default:
          hours = 9;
          minutes = 0;
      }
    }
    
    notificationTime.setHours(hours, minutes - settings.reminderMinutesBefore, 0, 0);
    return notificationTime;
  }
  
  private isInQuietHours(time: Date, settings: ReminderSettings): boolean {
    if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;
    
    const timeStr = time.toLocaleTimeString('en-GB', { hour12: false }).slice(0, 5);
    const start = settings.quietHoursStart;
    const end = settings.quietHoursEnd;
    
    if (start <= end) {
      return timeStr >= start && timeStr <= end;
    } else {
      // Quiet hours cross midnight
      return timeStr >= start || timeStr <= end;
    }
  }
  
  private async scheduleNotification({
    time,
    medication,
    schedule,
    settings,
  }: {
    time: Date;
    medication: any;
    schedule: MedicationSchedule;
    settings: ReminderSettings;
  }): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${medication.name}`,
          body: `Time for your ${schedule.dosageAmount} dose`,
          data: {
            type: 'medication_reminder',
            medicationId: medication.id,
            scheduleId: schedule.id,
            scheduledTime: time.toISOString(),
            priority: 'normal',
          },
          sound: settings.soundEnabled ? 'medication-reminder.wav' : false,
          badge: 1,
          categoryIdentifier: 'medication_reminder',
        },
        trigger: {
          date: time,
          channelId: 'medication-reminders',
        },
      });
      
      return identifier;
    } catch (error) {
      console.error('Schedule notification error:', error);
      return null;
    }
  }
  
  async sendCriticalAlert(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ ${title}`,
          body,
          data: {
            type: 'critical_alert',
            priority: 'critical',
            ...data,
          },
          sound: 'urgent-alert.wav',
          badge: 1,
          categoryIdentifier: 'critical_alert',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Send critical alert error:', error);
    }
  }
  
  async sendStockAlert(medication: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📦 Low Stock Alert`,
          body: `${medication.name} is running low (${medication.pillCount} pills remaining)`,
          data: {
            type: 'stock_alert',
            medicationId: medication.id,
            currentStock: medication.pillCount,
            priority: 'high',
          },
          sound: 'default',
          badge: 1,
          categoryIdentifier: 'stock_alert',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Send stock alert error:', error);
    }
  }
  
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NotificationService.SCHEDULED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Cancel notifications error:', error);
    }
  }
  
  async getReminderSettings(): Promise<ReminderSettings> {
    try {
      const settings = await AsyncStorage.getItem(NotificationService.NOTIFICATION_SETTINGS_KEY);
      return settings ? { ...this.defaultSettings, ...JSON.parse(settings) } : this.defaultSettings;
    } catch (error) {
      console.error('Get reminder settings error:', error);
      return this.defaultSettings;
    }
  }
  
  async updateReminderSettings(settings: Partial<ReminderSettings>): Promise<void> {
    try {
      const currentSettings = await this.getReminderSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(
        NotificationService.NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
      
      // Reschedule notifications with new settings
      // This would need to be called with current schedules
      // await this.scheduleMedicationReminders(currentSchedules);
      
    } catch (error) {
      console.error('Update reminder settings error:', error);
    }
  }
}

export default new NotificationService();
