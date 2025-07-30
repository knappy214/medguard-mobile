import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n/config';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Logo from './src/components/Logo';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import MedicationListScreen from './src/screens/MedicationListScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MedicationDetailScreen from './src/screens/MedicationDetailScreen';
import StockAnalyticsScreen from './src/screens/StockAnalyticsScreen';

// Import context providers
import { NotificationProvider } from './src/contexts/NotificationContext';
import { MedicationProvider } from './src/contexts/MedicationContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Notification handler removed for Expo Go compatibility

// Loading component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      {/* Animated Logo */}
      <View style={styles.logoContainer}>
        <Logo size="xl" showText={false} />
      </View>
      
      {/* Loading Message */}
      <Text style={styles.loadingText}>
        Loading MedGuard SA...
      </Text>
      
      {/* Loading Spinner */}
      <ActivityIndicator size="large" color="#2563EB" style={styles.spinner} />
      
      {/* Brand Text */}
      <View style={styles.brandContainer}>
        <Logo size="lg" />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContent: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  loadingText: {
    marginBottom: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  spinner: {
    marginBottom: 32,
  },
  brandContainer: {
    alignItems: 'center',
  },
});

function TabNavigator() {
  const { t } = useLanguage();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Medications') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'StockAnalytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
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
        options={{ title: t('navigation.home') }}
      />
      <Tab.Screen 
        name="Medications" 
        component={MedicationListScreen}
        options={{ title: t('navigation.medications') }}
      />
      <Tab.Screen 
        name="StockAnalytics" 
        component={StockAnalyticsScreen}
        options={{ title: t('medication.stockAnalytics.title') }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: t('navigation.settings') }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { t } = useLanguage();
  
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
        options={{ 
          title: t('navigation.addMedication'),
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="MedicationDetails" 
        component={MedicationDetailScreen}
        options={{ title: t('navigation.medicationDetails') }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Starting app initialization...');
        
        // Simple loading simulation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('App initialization complete');
        setIsReady(true);
      } catch (error) {
        console.warn('Error during app initialization:', error);
        setIsReady(true); // Continue anyway
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <MainNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <NotificationProvider>
          <MedicationProvider>
            <AppContent />
          </MedicationProvider>
        </NotificationProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}

// Notification functions removed for Expo Go compatibility
