import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.expoPushToken = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await this.setupAndroidChannel();
    }

    // Register for push notifications
    if (Device.isDevice) {
      await this.registerForPushNotifications();
    }

    this.isInitialized = true;
  }

  async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('low-stock-alerts', {
      name: 'Low Stock Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('refill-reminders', {
      name: 'Refill Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  async registerForPushNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      this.expoPushToken = token;
      console.log('Push token:', token);

      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async scheduleMedicationReminder(medication, schedule, reminderMinutes = 15) {
    try {
      const scheduledTime = new Date(schedule.scheduledTime);
      const reminderTime = new Date(scheduledTime.getTime() - (reminderMinutes * 60 * 1000));

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take ${medication.dosage} ${medication.unit} of ${medication.name}`,
          data: {
            type: 'medication_reminder',
            medicationId: medication.id,
            scheduleId: schedule.id,
            scheduledTime: schedule.scheduledTime,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: reminderTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling medication reminder:', error);
      return null;
    }
  }

  async scheduleLowStockAlert(medication) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Low Stock Alert',
          body: `${medication.name} is running low. Please refill soon.`,
          data: {
            type: 'low_stock_alert',
            medicationId: medication.id,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          seconds: 1, // Send immediately
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling low stock alert:', error);
      return null;
    }
  }

  async scheduleRefillReminder(medication, daysUntilRefill) {
    try {
      const refillDate = new Date();
      refillDate.setDate(refillDate.getDate() + daysUntilRefill);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Refill Reminder',
          body: `Time to refill ${medication.name}. Please contact your pharmacy.`,
          data: {
            type: 'refill_reminder',
            medicationId: medication.id,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          date: refillDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling refill reminder:', error);
      return null;
    }
  }

  async scheduleDailyReminder(hour, minute) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Medication Check',
          body: 'Don\'t forget to check your medication schedule for today!',
          data: {
            type: 'daily_reminder',
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  }

  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  async cancelNotificationsByType(type) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationsToCancel = scheduledNotifications.filter(
        notification => notification.content.data?.type === type
      );

      for (const notification of notificationsToCancel) {
        await this.cancelNotification(notification.identifier);
      }

      return true;
    } catch (error) {
      console.error('Error canceling notifications by type:', error);
      return false;
    }
  }

  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getNotificationPermissions() {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Error getting notification permissions:', error);
      return { status: 'undetermined' };
    }
  }

  async requestPermissions() {
    try {
      return await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { status: 'denied' };
    }
  }

  async addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  async addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Utility methods
  getExpoPushToken() {
    return this.expoPushToken;
  }

  isDevice() {
    return Device.isDevice;
  }

  getPlatform() {
    return Platform.OS;
  }
}

export default new NotificationService(); 