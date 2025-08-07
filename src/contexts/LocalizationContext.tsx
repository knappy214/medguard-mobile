import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLocale = 'en-ZA' | 'af-ZA';

export interface LocalizationState {
  locale: SupportedLocale;
  isLoading: boolean;
  translations: Record<string, any>;
}

export interface LocalizationContextType extends LocalizationState {
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  getDirection: () => 'ltr' | 'rtl';
  isRTL: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

// Simplified translations
const defaultTranslations = {
  'en-ZA': {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      confirm: 'Confirm',
      back: 'Back',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      close: 'Close',
      search: 'Search',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',
      phoneNumber: 'Phone Number',
      dateOfBirth: 'Date of Birth',
      notes: 'Notes',
      instructions: 'Instructions',
      dosage: 'Dosage',
      frequency: 'Frequency',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      completed: 'Completed',
      discontinued: 'Discontinued',
      yes: 'Yes',
      no: 'No',
      enabled: 'Enabled',
      disabled: 'Disabled',
      required: 'Required',
      optional: 'Optional',
    },
    navigation: {
      dashboard: 'Dashboard',
      medications: 'Medications',
      reminders: 'Reminders',
      pharmacy: 'Pharmacy',
      profile: 'Profile',
      settings: 'Settings',
      emergencyAccess: 'Emergency Access',
      healthcareAnalytics: 'Healthcare Analytics',
      privacySettings: 'Privacy Settings',
      support: 'Support',
      about: 'About',
    },
    auth: {
      welcome: 'Welcome to MedGuard SA',
      loginTitle: 'Sign In',
      registerTitle: 'Create Account',
      loginSubtitle: 'Sign in to access your medication management',
      registerSubtitle: 'Create your account to get started',
      emailPlaceholder: 'Enter your email address',
      passwordPlaceholder: 'Enter your password',
      firstNamePlaceholder: 'Enter your first name',
      lastNamePlaceholder: 'Enter your last name',
      loginButton: 'Sign In',
      registerButton: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      loginSuccess: 'Successfully signed in',
      loginError: 'Invalid email or password',
      registerSuccess: 'Account created successfully',
      registerError: 'Failed to create account',
    },
    dashboard: {
      title: 'Dashboard',
      welcomeMessage: 'Welcome back, {{name}}',
      todayMedications: 'Today\'s Medications',
      upcomingReminders: 'Upcoming Reminders',
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      addMedication: 'Add Medication',
      scanPrescription: 'Scan Prescription',
      findPharmacy: 'Find Pharmacy',
      noMedicationsToday: 'No medications scheduled for today',
      noUpcomingReminders: 'No upcoming reminders',
      noRecentActivity: 'No recent activity',
    },
    medications: {
      title: 'Medications',
      addMedication: 'Add Medication',
      editMedication: 'Edit Medication',
      medicationDetails: 'Medication Details',
      noMedications: 'No medications found',
      addYourFirstMedication: 'Add your first medication to get started',
      medicationName: 'Medication Name',
      genericName: 'Generic Name',
      dosage: 'Dosage',
      frequency: 'Frequency',
      instructions: 'Instructions',
      startDate: 'Start Date',
      endDate: 'End Date',
      status: 'Status',
      prescribedBy: 'Prescribed By',
      pharmacy: 'Pharmacy',
      notes: 'Notes',
      medicationAddedSuccess: 'Medication added successfully',
      medicationUpdatedSuccess: 'Medication updated successfully',
      medicationDeletedSuccess: 'Medication deleted successfully',
      confirmDeleteMedication: 'Are you sure you want to delete this medication?',
    },
    reminders: {
      title: 'Reminders',
      addReminder: 'Add Reminder',
      editReminder: 'Edit Reminder',
      noReminders: 'No reminders found',
      addYourFirstReminder: 'Add your first reminder to get started',
      reminderTime: 'Reminder Time',
      reminderDays: 'Reminder Days',
      enabled: 'Enabled',
      disabled: 'Disabled',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      everyDay: 'Every Day',
      weekdays: 'Weekdays',
      weekends: 'Weekends',
      reminderAddedSuccess: 'Reminder added successfully',
      reminderUpdatedSuccess: 'Reminder updated successfully',
      reminderDeletedSuccess: 'Reminder deleted successfully',
    },
    pharmacy: {
      title: 'Pharmacy',
      pharmacyList: 'Pharmacy List',
      pharmacyMap: 'Pharmacy Map',
      findNearbyPharmacies: 'Find Nearby Pharmacies',
      noPharmaciesFound: 'No pharmacies found nearby',
      searchPharmacies: 'Search pharmacies',
      pharmacyName: 'Pharmacy Name',
      address: 'Address',
      phone: 'Phone',
      distance: 'Distance',
      open: 'Open',
      closed: 'Closed',
      getDirections: 'Get Directions',
      callPharmacy: 'Call Pharmacy',
    },
    profile: {
      title: 'Profile',
      personalInformation: 'Personal Information',
      preferences: 'Preferences',
      security: 'Security',
      notifications: 'Notifications',
      privacy: 'Privacy',
      support: 'Support',
      about: 'About',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      enableBiometric: 'Enable Biometric Authentication',
      disableBiometric: 'Disable Biometric Authentication',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      profileUpdatedSuccess: 'Profile updated successfully',
      profileUpdatedError: 'Failed to update profile',
    },
    notifications: {
      title: 'Notifications',
      noNotifications: 'No notifications',
      markAllAsRead: 'Mark all as read',
      deleteAll: 'Delete all',
      medicationReminder: 'Medication Reminder',
      urgentAlert: 'Urgent Alert',
      generalNotification: 'General Notification',
      medicationReminderTitle: 'Time to take your medication',
      medicationReminderBody: 'It\'s time to take {{medicationName}}',
    },
    errors: {
      networkError: 'Network error. Please check your connection and try again.',
      serverError: 'Server error. Please try again later.',
      unknownError: 'An unknown error occurred. Please try again.',
      validationError: 'Please check your input and try again.',
      permissionDenied: 'Permission denied. Please enable the required permissions.',
      notFound: 'The requested resource was not found.',
      unauthorized: 'You are not authorized to perform this action.',
      forbidden: 'Access denied.',
      timeout: 'Request timed out. Please try again.',
      offline: 'You are currently offline. Please check your connection.',
    },
  },
  'af-ZA': {
    common: {
      save: 'Stoor',
      cancel: 'Kanselleer',
      delete: 'Verwyder',
      edit: 'Wysig',
      add: 'Voeg by',
      confirm: 'Bevestig',
      back: 'Terug',
      loading: 'Laai...',
      error: 'Fout',
      success: 'Sukses',
      warning: 'Waarskuwing',
      close: 'Sluit',
      search: 'Soek',
      settings: 'Instellings',
      profile: 'Profiel',
      logout: 'Teken uit',
      login: 'Teken in',
      register: 'Registreer',
      email: 'E-pos',
      password: 'Wagwoord',
      firstName: 'Voornaam',
      lastName: 'Van',
      phoneNumber: 'Telefoonnommer',
      dateOfBirth: 'Geboortedatum',
      notes: 'Notas',
      instructions: 'Instruksies',
      dosage: 'Dosis',
      frequency: 'Frekwensie',
      status: 'Status',
      active: 'Aktief',
      inactive: 'Inaktief',
      completed: 'Voltooi',
      discontinued: 'Gestop',
      yes: 'Ja',
      no: 'Nee',
      enabled: 'Geaktiveer',
      disabled: 'Gedeaktiveer',
      required: 'Vereis',
      optional: 'Opsioneel',
    },
    navigation: {
      dashboard: 'Dashboard',
      medications: 'Medikasie',
      reminders: 'Herinnerings',
      pharmacy: 'Apteek',
      profile: 'Profiel',
      settings: 'Instellings',
      emergencyAccess: 'Noodtoegang',
      healthcareAnalytics: 'Gesondheidsanalise',
      privacySettings: 'Privaatheidinstellings',
      support: 'Ondersteuning',
      about: 'Aangaande',
    },
    auth: {
      welcome: 'Welkom by MedGuard SA',
      loginTitle: 'Teken in',
      registerTitle: 'Skep rekening',
      loginSubtitle: 'Teken in om toegang tot jou medikasiebestuur te kry',
      registerSubtitle: 'Skep jou rekening om te begin',
      emailPlaceholder: 'Voer jou e-posadres in',
      passwordPlaceholder: 'Voer jou wagwoord in',
      firstNamePlaceholder: 'Voer jou voornaam in',
      lastNamePlaceholder: 'Voer jou van in',
      loginButton: 'Teken in',
      registerButton: 'Skep rekening',
      alreadyHaveAccount: 'Het jy reeds \'n rekening?',
      dontHaveAccount: 'Het jy nie \'n rekening nie?',
      loginSuccess: 'Suksesvol ingeteken',
      loginError: 'Ongeldige e-pos of wagwoord',
      registerSuccess: 'Rekening suksesvol geskep',
      registerError: 'Kon nie rekening skep nie',
    },
    dashboard: {
      title: 'Dashboard',
      welcomeMessage: 'Welkom terug, {{name}}',
      todayMedications: 'Vandag se medikasie',
      upcomingReminders: 'Kommende herinnerings',
      recentActivity: 'Onlangse aktiwiteit',
      quickActions: 'Vinnige aksies',
      addMedication: 'Voeg medikasie by',
      scanPrescription: 'Skandeer voorskrif',
      findPharmacy: 'Vind apteek',
      noMedicationsToday: 'Geen medikasie vir vandag geskeduleer nie',
      noUpcomingReminders: 'Geen komende herinnerings nie',
      noRecentActivity: 'Geen onlangse aktiwiteit nie',
    },
    medications: {
      title: 'Medikasie',
      addMedication: 'Voeg medikasie by',
      editMedication: 'Wysig medikasie',
      medicationDetails: 'Medikasie besonderhede',
      noMedications: 'Geen medikasie gevind nie',
      addYourFirstMedication: 'Voeg jou eerste medikasie by om te begin',
      medicationName: 'Medikasie naam',
      genericName: 'Generiese naam',
      dosage: 'Dosis',
      frequency: 'Frekwensie',
      instructions: 'Instruksies',
      startDate: 'Begindatum',
      endDate: 'Einddatum',
      status: 'Status',
      prescribedBy: 'Voorgeskryf deur',
      pharmacy: 'Apteek',
      notes: 'Notas',
      medicationAddedSuccess: 'Medikasie suksesvol bygevoeg',
      medicationUpdatedSuccess: 'Medikasie suksesvol opgedateer',
      medicationDeletedSuccess: 'Medikasie suksesvol verwyder',
      confirmDeleteMedication: 'Is jy seker jy wil hierdie medikasie verwyder?',
    },
    reminders: {
      title: 'Herinnerings',
      addReminder: 'Voeg herinnering by',
      editReminder: 'Wysig herinnering',
      noReminders: 'Geen herinnerings gevind nie',
      addYourFirstReminder: 'Voeg jou eerste herinnering by om te begin',
      reminderTime: 'Herinnering tyd',
      reminderDays: 'Herinnering dae',
      enabled: 'Geaktiveer',
      disabled: 'Gedeaktiveer',
      monday: 'Maandag',
      tuesday: 'Dinsdag',
      wednesday: 'Woensdag',
      thursday: 'Donderdag',
      friday: 'Vrydag',
      saturday: 'Saterdag',
      sunday: 'Sondag',
      everyDay: 'Elke dag',
      weekdays: 'Weeksdae',
      weekends: 'Naweke',
      reminderAddedSuccess: 'Herinnering suksesvol bygevoeg',
      reminderUpdatedSuccess: 'Herinnering suksesvol opgedateer',
      reminderDeletedSuccess: 'Herinnering suksesvol verwyder',
    },
    pharmacy: {
      title: 'Apteek',
      pharmacyList: 'Apteek lys',
      pharmacyMap: 'Apteek kaart',
      findNearbyPharmacies: 'Vind nabygeleë apteke',
      noPharmaciesFound: 'Geen apteke naby gevind nie',
      searchPharmacies: 'Soek apteke',
      pharmacyName: 'Apteek naam',
      address: 'Adres',
      phone: 'Telefoon',
      distance: 'Afstand',
      open: 'Oop',
      closed: 'Toe',
      getDirections: 'Kry aanwysings',
      callPharmacy: 'Bel apteek',
    },
    profile: {
      title: 'Profiel',
      personalInformation: 'Persoonlike inligting',
      preferences: 'Voorkeure',
      security: 'Sekuriteit',
      notifications: 'Kennisgewings',
      privacy: 'Privaatheid',
      support: 'Ondersteuning',
      about: 'Aangaande',
      editProfile: 'Wysig profiel',
      changePassword: 'Verander wagwoord',
      enableBiometric: 'Aktiveer biometriese verifikasie',
      disableBiometric: 'Deaktiveer biometriese verifikasie',
      language: 'Taal',
      theme: 'Tema',
      light: 'Lig',
      dark: 'Donker',
      auto: 'Outomaties',
      profileUpdatedSuccess: 'Profiel suksesvol opgedateer',
      profileUpdatedError: 'Kon nie profiel opdateer nie',
    },
    notifications: {
      title: 'Kennisgewings',
      noNotifications: 'Geen kennisgewings nie',
      markAllAsRead: 'Merk alles as gelees',
      deleteAll: 'Verwyder alles',
      medicationReminder: 'Medikasie herinnering',
      urgentAlert: 'Dringende waarskuwing',
      generalNotification: 'Algemene kennisgewing',
      medicationReminderTitle: 'Tyd om jou medikasie te neem',
      medicationReminderBody: 'Dit is tyd om {{medicationName}} te neem',
    },
    errors: {
      networkError: 'Netwerk fout. Kontroleer asseblief jou verbinding en probeer weer.',
      serverError: 'Bediener fout. Probeer asseblief later weer.',
      unknownError: '\'n Onbekende fout het voorgekom. Probeer asseblief weer.',
      validationError: 'Kontroleer asseblief jou inset en probeer weer.',
      permissionDenied: 'Toestemming geweier. Aktiveer asseblief die vereiste toestemmings.',
      notFound: 'Die versoekte hulpbron is nie gevind nie.',
      unauthorized: 'Jy is nie gemagtig om hierdie aksie uit te voer nie.',
      forbidden: 'Toegang geweier.',
      timeout: 'Versoek het uitgetel. Probeer asseblief weer.',
      offline: 'Jy is tans vanlyn. Kontroleer asseblief jou verbinding.',
    },
  },
};

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [state, setState] = useState<LocalizationState>({
    locale: 'en-ZA',
    isLoading: true,
    translations: defaultTranslations['en-ZA'],
  });

  useEffect(() => {
    initializeLocalization();
  }, []);

  const initializeLocalization = async () => {
    try {
      // Load stored locale preference
      const storedLocale = await AsyncStorage.getItem('locale');
      
      // Determine initial locale
      let initialLocale: SupportedLocale = 'en-ZA';
      
      if (storedLocale && (storedLocale === 'en-ZA' || storedLocale === 'af-ZA')) {
        initialLocale = storedLocale;
      } else {
        // Use device locale if supported, otherwise default to English
        const deviceLocale = Localization.getLocales()[0]?.languageCode;
        if (deviceLocale?.startsWith('af')) {
          initialLocale = 'af-ZA';
        } else {
          initialLocale = 'en-ZA';
        }
      }

      setState({
        locale: initialLocale,
        isLoading: false,
        translations: defaultTranslations[initialLocale],
      });
    } catch (error) {
      console.error('Error initializing localization:', error);
      setState({
        locale: 'en-ZA',
        isLoading: false,
        translations: defaultTranslations['en-ZA'],
      });
    }
  };

  const setLocale = async (locale: SupportedLocale): Promise<void> => {
    try {
      await AsyncStorage.setItem('locale', locale);
      
      setState({
        locale,
        isLoading: false,
        translations: defaultTranslations[locale],
      });
    } catch (error) {
      console.error('Error setting locale:', error);
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = state.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = defaultTranslations['en-ZA'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] !== undefined ? String(params[param]) : match;
      });
    }

    return value;
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Intl.DateTimeFormat(state.locale, { ...defaultOptions, ...options }).format(date);
  };

  const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    return new Intl.DateTimeFormat(state.locale, { ...defaultOptions, ...options }).format(date);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(state.locale, options).format(number);
  };

  const formatCurrency = (amount: number, currency = 'ZAR'): string => {
    return new Intl.NumberFormat(state.locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getDirection = (): 'ltr' | 'rtl' => {
    // Both English and Afrikaans are left-to-right languages
    return 'ltr';
  };

  const isRTL = getDirection() === 'rtl';

  const value: LocalizationContextType = {
    ...state,
    setLocale,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    getDirection,
    isRTL,
  };

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
