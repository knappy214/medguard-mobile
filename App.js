import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n/config';
import { Platform } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import MedicationListScreen from './src/screens/MedicationListScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MedicationDetailScreen from './src/screens/MedicationDetailScreen';

// Import context providers
import { NotificationProvider } from './src/contexts/NotificationContext';
import { MedicationProvider } from './src/contexts/MedicationContext';
import { LanguageProvider } from './src/contexts/LanguageContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Medications') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2563EB',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Today' }}
      />
      <Tab.Screen 
        name="Medications" 
        component={MedicationListScreen}
        options={{ title: 'Medications' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563EB',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddMedication" 
        component={AddMedicationScreen}
        options={{ title: 'Add Medication' }}
      />
      <Stack.Screen 
        name="MedicationDetail" 
        component={MedicationDetailScreen}
        options={{ title: 'Medication Details' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <NotificationProvider>
          <MedicationProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <MainNavigator />
            </NavigationContainer>
          </MedicationProvider>
        </NotificationProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });
  }

  if (Device.isDevice) {
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
    
    try {
      // For Expo Go, we need to handle the case where project ID might not be available
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                       Constants?.easConfig?.projectId ?? 
                       Constants?.manifest?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.log('Project ID not found - notifications will work locally but not for push notifications');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);
    } catch (e) {
      console.error('Error getting push token:', e);
      // Don't throw - allow app to continue without push notifications
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
