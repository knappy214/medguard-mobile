import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStackParamList, MainTabParamList, DrawerParamList } from '@/types/navigation';

// Import screens
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import PlaceholderScreen from '@/screens/PlaceholderScreen';

// Import components
import CustomDrawerContent from '@/components/navigation/CustomDrawerContent';
import CustomTabBar from '@/components/navigation/CustomTabBar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Auth Stack Navigator
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Onboarding" component={() => <PlaceholderScreen title="Onboarding" subtitle="Welcome to MedGuard SA" />} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={() => <PlaceholderScreen title="Forgot Password" subtitle="Reset your password" />} />
    <Stack.Screen name="BiometricSetup" component={() => <PlaceholderScreen title="Biometric Setup" subtitle="Set up secure authentication" />} />
  </Stack.Navigator>
);

// Medication Stack Navigator
const MedicationStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MedicationList" component={() => <PlaceholderScreen title="Medications" subtitle="Manage your medications" />} />
    <Stack.Screen name="AddMedication" component={() => <PlaceholderScreen title="Add Medication" subtitle="Add a new medication" />} />
    <Stack.Screen name="MedicationDetail" component={() => <PlaceholderScreen title="Medication Details" subtitle="View medication information" />} />
    <Stack.Screen name="PrescriptionScan" component={() => <PlaceholderScreen title="Scan Prescription" subtitle="Scan your prescription" />} />
    <Stack.Screen name="DrugInteractions" component={() => <PlaceholderScreen title="Drug Interactions" subtitle="Check for interactions" />} />
    <Stack.Screen name="MedicationHistory" component={() => <PlaceholderScreen title="Medication History" subtitle="View medication history" />} />
  </Stack.Navigator>
);

// Reminder Stack Navigator
const ReminderStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ReminderList" component={() => <PlaceholderScreen title="Reminders" subtitle="Manage your medication reminders" />} />
    <Stack.Screen name="AddReminder" component={() => <PlaceholderScreen title="Add Reminder" subtitle="Set up a new reminder" />} />
    <Stack.Screen name="ReminderDetail" component={() => <PlaceholderScreen title="Reminder Details" subtitle="View reminder information" />} />
    <Stack.Screen name="ReminderSettings" component={() => <PlaceholderScreen title="Reminder Settings" subtitle="Configure reminder preferences" />} />
  </Stack.Navigator>
);

// Pharmacy Stack Navigator
const PharmacyStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="PharmacyList" component={() => <PlaceholderScreen title="Pharmacies" subtitle="Find nearby pharmacies" />} />
    <Stack.Screen name="PharmacyMap" component={() => <PlaceholderScreen title="Pharmacy Map" subtitle="View pharmacies on map" />} />
    <Stack.Screen name="PharmacyDetail" component={() => <PlaceholderScreen title="Pharmacy Details" subtitle="View pharmacy information" />} />
    <Stack.Screen name="PrescriptionUpload" component={() => <PlaceholderScreen title="Upload Prescription" subtitle="Upload your prescription" />} />
  </Stack.Navigator>
);

// Profile Stack Navigator
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="ProfileMain" component={() => <PlaceholderScreen title="Profile" subtitle="Manage your profile" />} />
    <Stack.Screen name="Settings" component={() => <PlaceholderScreen title="Settings" subtitle="Configure app settings" />} />
    <Stack.Screen name="EmergencyAccess" component={() => <PlaceholderScreen title="Emergency Access" subtitle="Emergency contact information" />} />
    <Stack.Screen name="HealthcareAnalytics" component={() => <PlaceholderScreen title="Healthcare Analytics" subtitle="View your health data" />} />
    <Stack.Screen name="PrivacySettings" component={() => <PlaceholderScreen title="Privacy Settings" subtitle="Manage your privacy" />} />
    <Stack.Screen name="Support" component={() => <PlaceholderScreen title="Support" subtitle="Get help and support" />} />
    <Stack.Screen name="About" component={() => <PlaceholderScreen title="About" subtitle="About MedGuard SA" />} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Dashboard" component={() => <PlaceholderScreen title="Dashboard" subtitle="Welcome to MedGuard SA" />} />
    <Tab.Screen name="Medications" component={MedicationStack} />
    <Tab.Screen name="Reminders" component={ReminderStack} />
    <Tab.Screen name="Pharmacy" component={PharmacyStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Drawer Navigator
const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Drawer.Screen name="Main" component={MainTabNavigator} />
    <Drawer.Screen name="EmergencyAccess" component={() => <PlaceholderScreen title="Emergency Access" subtitle="Emergency contact information" />} />
    <Drawer.Screen name="HealthcareAnalytics" component={() => <PlaceholderScreen title="Healthcare Analytics" subtitle="View your health data" />} />
    <Drawer.Screen name="PrivacySettings" component={() => <PlaceholderScreen title="Privacy Settings" subtitle="Manage your privacy" />} />
    <Drawer.Screen name="Support" component={() => <PlaceholderScreen title="Support" subtitle="Get help and support" />} />
    <Drawer.Screen name="About" component={() => <PlaceholderScreen title="About" subtitle="About MedGuard SA" />} />
  </Drawer.Navigator>
);

// Root Navigator
const RootNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Auth" component={AuthStack} />
    <Stack.Screen name="Main" component={DrawerNavigator} />
  </Stack.Navigator>
);

// Main Navigation Container
const Navigation = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default Navigation;
