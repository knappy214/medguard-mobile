import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import AppNavigator from './src/navigation/AppNavigator';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { medGuardTheme } from './src/theme/colors';
import notificationService from './src/services/notificationService';
import apiService from './src/services/apiService';
import offlineService from './src/services/offlineService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Register notification handlers
    Notifications.addNotificationReceivedListener(notification => {
      // Handle notification reception
      console.log('Notification Received:', notification);
    });
    Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap
      console.log('Notification Response:', response);
    });

    // Sync offline actions on app start/resume
    const sync = async () => {
      await offlineService.smartSync();
      await apiService.ensureSync();
      await notificationService.scheduleMedicationReminders(await apiService.getMedicationSchedules());
      SplashScreen.hideAsync();
    };

    sync();

    // Sync on resume
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      sync();
    });

    // Background sync timer while app is active
    const intervalId = setInterval(() => {
      offlineService.smartSync();
    }, 15 * 60 * 1000); // every 15 minutes

    // Foreground resume trigger
    const appStateHandler = (state: AppStateStatus) => {
      if (state === 'active') {
        offlineService.smartSync();
      }
    };
    const appStateSub = AppState.addEventListener('change', appStateHandler);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
      appStateSub.remove();
    };
  }, []);

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={{ ...eva.light, ...medGuardTheme }}>
        <AccessibilityProvider>
          <AppNavigator />
        </AccessibilityProvider>
      </ApplicationProvider>
    </>
  );
}
