import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  MedicationDetail: { medicationId: string };
  PrescriptionScan: undefined;
  PharmacyLocator: undefined;
  Settings: undefined;
  Profile: undefined;
  EmergencyAccess: undefined;
  DrugInteractions: { medicationIds: string[] };
  MedicationReminder: { medicationId: string; time: string };
  HealthcareAnalytics: undefined;
  PrivacySettings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  BiometricSetup: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Medications: NavigatorScreenParams<MedicationStackParamList>;
  Reminders: NavigatorScreenParams<ReminderStackParamList>;
  Pharmacy: NavigatorScreenParams<PharmacyStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type MedicationStackParamList = {
  MedicationList: undefined;
  AddMedication: undefined;
  MedicationDetail: { medicationId: string };
  PrescriptionScan: undefined;
  DrugInteractions: { medicationIds: string[] };
  MedicationHistory: { medicationId: string };
};

export type ReminderStackParamList = {
  ReminderList: undefined;
  AddReminder: undefined;
  ReminderDetail: { reminderId: string };
  ReminderSettings: undefined;
};

export type PharmacyStackParamList = {
  PharmacyList: undefined;
  PharmacyMap: undefined;
  PharmacyDetail: { pharmacyId: string };
  PrescriptionUpload: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EmergencyAccess: undefined;
  HealthcareAnalytics: undefined;
  PrivacySettings: undefined;
  Support: undefined;
  About: undefined;
};

export type DrawerParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  EmergencyAccess: undefined;
  HealthcareAnalytics: undefined;
  PrivacySettings: undefined;
  Support: undefined;
  About: undefined;
  Logout: undefined;
};
