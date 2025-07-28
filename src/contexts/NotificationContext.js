import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { NOTIFICATION_TYPES } from '../types';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { t } = useTranslation();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    reminderTime: 15, // minutes before scheduled time
    lowStockThreshold: 7, // days
  });
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  useEffect(() => {
    loadNotificationSettings();
    setupNotificationListeners();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('@medguard_notification_settings');
      if (savedSettings) {
        setNotificationSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async (settings) => {
    try {
      await AsyncStorage.setItem('@medguard_notification_settings', JSON.stringify(settings));
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const setupNotificationListeners = () => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  };

  const handleNotificationResponse = (response) => {
    const { data } = response.notification.request.content;
    
    switch (data.type) {
      case NOTIFICATION_TYPES.MEDICATION_REMINDER:
        // Navigate to medication detail or mark as taken
        break;
      case NOTIFICATION_TYPES.LOW_STOCK:
        // Navigate to medication list
        break;
      case NOTIFICATION_TYPES.REFILL_REMINDER:
        // Navigate to medication detail
        break;
      default:
        break;
    }
  };

  const scheduleMedicationReminder = async (medication, schedule) => {
    if (!notificationSettings.enabled) return;

    const reminderDate = new Date(schedule.date);
    const [hours, minutes] = schedule.time.split(':');
    reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Subtract reminder time
    reminderDate.setMinutes(reminderDate.getMinutes() - notificationSettings.reminderTime);

    // Don't schedule if reminder time has passed
    if (reminderDate <= new Date()) return;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.medicationReminder'),
        body: t('notifications.reminderMessage', { medication: medication.name }),
        data: {
          type: NOTIFICATION_TYPES.MEDICATION_REMINDER,
          medicationId: medication.id,
          scheduleId: schedule.id,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: reminderDate,
      },
    });

    setScheduledNotifications(prev => [...prev, {
      id: notificationId,
      type: NOTIFICATION_TYPES.MEDICATION_REMINDER,
      medicationId: medication.id,
      scheduleId: schedule.id,
      scheduledFor: reminderDate,
    }]);

    return notificationId;
  };

  const scheduleLowStockReminder = async (medication) => {
    if (!notificationSettings.enabled) return;

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + notificationSettings.lowStockThreshold);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.lowStock'),
        body: t('notifications.lowStockMessage', { medication: medication.name }),
        data: {
          type: NOTIFICATION_TYPES.LOW_STOCK,
          medicationId: medication.id,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MEDIUM,
      },
      trigger: {
        date: reminderDate,
      },
    });

    setScheduledNotifications(prev => [...prev, {
      id: notificationId,
      type: NOTIFICATION_TYPES.LOW_STOCK,
      medicationId: medication.id,
      scheduledFor: reminderDate,
    }]);

    return notificationId;
  };

  const scheduleRefillReminder = async (medication) => {
    if (!notificationSettings.enabled || !medication.refillReminder) return;

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1); // Remind tomorrow

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.refillReminder'),
        body: t('notifications.refillMessage', { medication: medication.name }),
        data: {
          type: NOTIFICATION_TYPES.REFILL_REMINDER,
          medicationId: medication.id,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MEDIUM,
      },
      trigger: {
        date: reminderDate,
      },
    });

    setScheduledNotifications(prev => [...prev, {
      id: notificationId,
      type: NOTIFICATION_TYPES.REFILL_REMINDER,
      medicationId: medication.id,
      scheduledFor: reminderDate,
    }]);

    return notificationId;
  };

  const cancelNotification = async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      setScheduledNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setScheduledNotifications([]);
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  const cancelNotificationsForMedication = async (medicationId) => {
    const notificationsToCancel = scheduledNotifications.filter(
      notification => notification.medicationId === medicationId
    );

    for (const notification of notificationsToCancel) {
      await cancelNotification(notification.id);
    }
  };

  const getPendingNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted');
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const value = {
    expoPushToken,
    notificationSettings,
    scheduledNotifications,
    scheduleMedicationReminder,
    scheduleLowStockReminder,
    scheduleRefillReminder,
    cancelNotification,
    cancelAllNotifications,
    cancelNotificationsForMedication,
    getPendingNotifications,
    requestPermissions,
    saveNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 