@cursor Create medguard-mobile/src/navigation/AppNavigator.tsx with comprehensive navigation:
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  BottomNavigation,
  BottomNavigationTab,
  Icon,
  IconProps,
  Layout,
  Text,
  useTheme,
} from '@ui-kitten/components';
import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Services
import authService from '../services/authService';
import i18n from '../i18n';
import { MedGuardColors } from '../theme/colors';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import MedicationsScreen from '../screens/medications/MedicationsScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import MedicationDetailScreen from '../screens/medications/MedicationDetailScreen';
import AddMedicationScreen from '../screens/medications/AddMedicationScreen';
import EditMedicationScreen from '../screens/medications/EditMedicationScreen';
import AddScheduleScreen from '../screens/schedule/AddScheduleScreen';
import EditScheduleScreen from '../screens/schedule/EditScheduleScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Medications: undefined;
  Schedule: undefined;
  Camera: undefined;
  Profile: undefined;
};

export type MedicationsStackParamList = {
  MedicationsList: undefined;
  MedicationDetail: { medicationId: number };
  AddMedication: { ocrResult?: any };
  EditMedication: { medicationId: number };
};

export type ScheduleStackParamList = {
  ScheduleList: undefined;
  AddSchedule: { medicationId?: number };
  EditSchedule: { scheduleId: number };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Emergency: undefined;
  Notifications: undefined;
  Analytics: undefined;
};

// Navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const MedicationsStack = createStackNavigator<MedicationsStackParamList>();
const ScheduleStack = createStackNavigator<ScheduleStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Custom navigation theme
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: MedGuardColors.primary.trustBlue,
    background: MedGuardColors.primary.cleanWhite,
    card: MedGuardColors.primary.cleanWhite,
    text: MedGuardColors.text.primary,
    border: MedGuardColors.extended.borderGray,
  },
};

// Icon components for navigation
const HomeIcon = (props: IconProps) => <Icon {...props} name='home-outline' />;
const MedicationsIcon = (props: IconProps) => <Icon {...props} name='activity-outline' />;
const ScheduleIcon = (props: IconProps) => <Icon {...props} name='calendar-outline' />;
const CameraIcon = (props: IconProps) => <Icon {...props} name='camera-outline' />;
const ProfileIcon = (props: IconProps) => <Icon {...props} name='person-outline' />;

// Custom bottom tab bar component
const BottomTabBar = ({ navigation, state }: any) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <Layout
      style={{
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16,
        paddingTop: 8,
      }}
      level="2"
    >
      <BottomNavigation
        selectedIndex={state.index}
        onSelect={(index) => navigation.navigate(state.routeNames[index])}
        appearance="noIndicator"
        style={{
          backgroundColor: theme['background-basic-color-1'],
        }}
      >
        <BottomNavigationTab
          title={i18n.t('navigation.home')}
          icon={HomeIcon}
        />
        <BottomNavigationTab
          title={i18n.t('navigation.medications')}
          icon={MedicationsIcon}
        />
        <BottomNavigationTab
          title={i18n.t('navigation.schedule')}
          icon={ScheduleIcon}
        />
        <BottomNavigationTab
          title={i18n.t('navigation.camera')}
          icon={CameraIcon}
        />
        <BottomNavigationTab
          title={i18n.t('navigation.profile')}
          icon={ProfileIcon}
        />
      </BottomNavigation>
    </Layout>
  );
};

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Medications Navigator
const MedicationsNavigator = () => (
  <MedicationsStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: MedGuardColors.primary.trustBlue,
      },
      headerTintColor: MedGuardColors.primary.cleanWhite,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <MedicationsStack.Screen
      name="MedicationsList"
      component={MedicationsScreen}
      options={{ title: i18n.t('medications.title') }}
    />
    <MedicationsStack.Screen
      name="MedicationDetail"
      component={MedicationDetailScreen}
      options={{ title: i18n.t('medications.medication_name') }}
    />
    <MedicationsStack.Screen
      name="AddMedication"
      component={AddMedicationScreen}
      options={{ title: i18n.t('medications.add_medication') }}
    />
    <MedicationsStack.Screen
      name="EditMedication"
      component={EditMedicationScreen}
      options={{ title: i18n.t('medications.edit_medication') }}
    />
  </MedicationsStack.Navigator>
);

// Schedule Navigator
const ScheduleNavigator = () => (
  <ScheduleStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: MedGuardColors.primary.healingGreen,
      },
      headerTintColor: MedGuardColors.primary.cleanWhite,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <ScheduleStack.Screen
      name="ScheduleList"
      component={ScheduleScreen}
      options={{ title: i18n.t('schedule.title') }}
    />
    <ScheduleStack.Screen
      name="AddSchedule"
      component={AddScheduleScreen}
      options={{ title: i18n.t('schedule.add_schedule') }}
    />
    <ScheduleStack.Screen
      name="EditSchedule"
      component={EditScheduleScreen}
      options={{ title: i18n.t('schedule.edit_schedule') }}
    />
  </ScheduleStack.Navigator>
);

// Profile Navigator
const ProfileNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: MedGuardColors.primary.neutralGray,
      },
      headerTintColor: MedGuardColors.primary.cleanWhite,
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
    }}
  >
    <ProfileStack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: i18n.t('profile.title') }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: i18n.t('common.settings') }}
    />
    <ProfileStack.Screen
      name="Emergency"
      component={EmergencyScreen}
      options={{ title: i18n.t('emergency.title') }}
    />
    <ProfileStack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: i18n.t('navigation.notifications') }}
    />
    <ProfileStack.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{ title: i18n.t('analytics.title') }}
    />
  </ProfileStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => (
  <MainTab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <MainTab.Screen name="Home" component={HomeScreen} />
    <MainTab.Screen name="Medications" component={MedicationsNavigator} />
    <MainTab.Screen name="Schedule" component={ScheduleNavigator} />
    <MainTab.Screen name="Camera" component={CameraScreen} />
    <MainTab.Screen name="Profile" component={ProfileNavigator} />
  </MainTab.Navigator>
);

// Root App Navigator
const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    // Show loading screen while checking auth
    return (
      <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text category="h6">{i18n.t('common.loading')}</Text>
      </Layout>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={MedGuardColors.primary.trustBlue}
      />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
