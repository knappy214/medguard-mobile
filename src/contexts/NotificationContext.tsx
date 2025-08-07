import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledDate?: Date;
  type: 'medication_reminder' | 'urgent_alert' | 'general' | 'system';
  priority: 'high' | 'default' | 'low';
  read: boolean;
  createdAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  medicationReminders: boolean;
  urgentAlerts: boolean;
  generalNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface NotificationState {
  notifications: NotificationData[];
  settings: NotificationSettings;
  expoPushToken: string | null;
  isLoading: boolean;
}

export interface NotificationContextType extends NotificationState {
  scheduleNotification: (notification: Omit<NotificationData, 'id' | 'createdAt' | 'read'>) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, data?: Record<string, any>) => Promise<void>;
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    settings: {
      enabled: true,
      medicationReminders: true,
      urgentAlerts: true,
      generalNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    },
    expoPushToken: null,
    isLoading: true,
  });

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Load stored notifications and settings
      await loadStoredData();
      
      // Request permissions
      await requestPermissions();
      
      // Set up notification listeners
      setupNotificationListeners();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadStoredData = async () => {
    try {
      const [storedNotifications, storedSettings] = await Promise.all([
        AsyncStorage.getItem('notifications'),
        AsyncStorage.getItem('notification_settings'),
      ]);

      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        setState(prev => ({ ...prev, notifications }));
      }

      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setState(prev => ({ ...prev, settings }));
      }
    } catch (error) {
      console.error('Error loading stored notification data:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const notificationData: NotificationData = {
        id: notification.request.identifier,
        title: notification.request.content.title || '',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        type: (notification.request.content.data?.type as any) || 'general',
        priority: (notification.request.content.data?.priority as any) || 'default',
        read: false,
        createdAt: new Date(),
      };

      setState(prev => ({
        ...prev,
        notifications: [notificationData, ...prev.notifications],
      }));

      // Trigger haptic feedback
      triggerHapticFeedback('light');
    });

    // Handle notification response (user tapped notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;
      markAsRead(notificationId);
      
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // TODO: Navigate to specific screen
        console.log('Navigate to:', data.screen, data.params);
      }
    });

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '66b89b4f-56df-4fd2-a12f-135b3bac185a', // From app.json
      });

      setState(prev => ({ ...prev, expoPushToken: token.data }));
      
      // TODO: Send token to backend
      console.log('Expo push token:', token.data);

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const scheduleNotification = async (
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'read'>
  ): Promise<string> => {
    try {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const notificationContent = {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          type: notification.type,
          priority: notification.priority,
        },
        ...(state.settings.soundEnabled && { sound: 'default' }),
      };

      let trigger: Notifications.NotificationTriggerInput | null = null;

      if (notification.scheduledDate) {
        trigger = {
          date: notification.scheduledDate,
        } as Notifications.NotificationTriggerInput;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: notificationContent,
        trigger,
      });

      const notificationData: NotificationData = {
        ...notification,
        id,
        read: false,
        createdAt: new Date(),
      };

      setState(prev => ({
        ...prev,
        notifications: [notificationData, ...prev.notifications],
      }));

      // Store in AsyncStorage
      await AsyncStorage.setItem('notifications', JSON.stringify([notificationData, ...state.notifications]));

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };

  const cancelNotification = async (id: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
      }));

      // Update AsyncStorage
      const updatedNotifications = state.notifications.filter(n => n.id !== id);
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      }));

      // Update AsyncStorage
      const updatedNotifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
      }));

      // Update AsyncStorage
      const updatedNotifications = state.notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      await cancelNotification(id);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id),
      }));

      // Update AsyncStorage
      const updatedNotifications = state.notifications.filter(n => n.id !== id);
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      setState(prev => ({
        ...prev,
        notifications: [],
      }));

      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const updateSettings = async (settings: Partial<NotificationSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...state.settings, ...settings };
      
      setState(prev => ({
        ...prev,
        settings: updatedSettings,
      }));

      await AsyncStorage.setItem('notification_settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          ...(data && { data }),
          ...(state.settings.soundEnabled && { sound: 'default' }),
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  };

  const triggerHapticFeedback = async (
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
  ): Promise<void> => {
    try {
      if (!state.settings.vibrationEnabled) return;

      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  };

  const value: NotificationContextType = {
    ...state,
    scheduleNotification,
    cancelNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    requestPermissions,
    sendLocalNotification,
    triggerHapticFeedback,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
