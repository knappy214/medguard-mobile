import React, { createContext, useContext, useState, useEffect } from 'react';
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
    console.log('NotificationContext: Running in Expo Go - notifications disabled');
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

  // Simplified notification functions for Expo Go
  const scheduleMedicationReminder = async (medication, schedule) => {
    console.log('Notification scheduling disabled in Expo Go');
    return null;
  };

  const scheduleLowStockReminder = async (medication) => {
    console.log('Notification scheduling disabled in Expo Go');
    return null;
  };

  const scheduleRefillReminder = async (medication) => {
    console.log('Notification scheduling disabled in Expo Go');
    return null;
  };

  const cancelNotification = async (notificationId) => {
    console.log('Notification cancellation disabled in Expo Go');
  };

  const cancelAllNotifications = async () => {
    console.log('Notification cancellation disabled in Expo Go');
  };

  const cancelNotificationsForMedication = async (medicationId) => {
    console.log('Notification cancellation disabled in Expo Go');
  };

  const getPendingNotifications = async () => {
    console.log('Getting notifications disabled in Expo Go');
    return [];
  };

  const requestPermissions = async () => {
    console.log('Permission requests disabled in Expo Go');
    return false;
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