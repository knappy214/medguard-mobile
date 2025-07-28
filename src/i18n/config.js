import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language files
import en from './en.json';
import af from './af.json';

const resources = {
  en: {
    translation: en,
  },
  af: {
    translation: af,
  },
};

// English pluralization rules
const englishPlurals = {
  numbers: [1, 2],
  plurals: (n) => {
    if (n === 1) return 0;
    return 1;
  }
};

// Afrikaans pluralization rules (similar to English but with some differences)
const afrikaansPlurals = {
  numbers: [1, 2],
  plurals: (n) => {
    if (n === 1) return 0;
    return 1;
  }
};

// Safely get language code from device locale with fallback
const getDeviceLanguage = () => {
  try {
    const locale = Localization.locale;
    if (locale && typeof locale === 'string') {
      const languageCode = locale.split('-')[0].toLowerCase();
      // Check if we support this language
      if (['en', 'af'].includes(languageCode)) {
        return languageCode;
      }
    }
  } catch (error) {
    console.warn('Error getting device locale:', error);
  }
  return 'en'; // fallback to English
};

// Load saved language preference from AsyncStorage
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('@medguard_language');
    if (savedLanguage && ['en', 'af'].includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn('Error loading saved language:', error);
  }
  return null;
};

// Initialize i18n with enhanced configuration
const initializeI18n = async () => {
  const savedLanguage = await loadSavedLanguage();
  const deviceLanguage = getDeviceLanguage();
  const initialLanguage = savedLanguage || deviceLanguage;

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      debug: __DEV__, // Enable debug in development
      
      // Pluralization configuration
      pluralSeparator: '_',
      contextSeparator: '_',
      
      // Interpolation settings
      interpolation: {
        escapeValue: false, // React already escapes values
        skipOnVariables: false,
      },
      
      // React settings
      react: {
        useSuspense: false, // Important for React Native
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
        nsMode: 'default',
      },
      
      // Language detection
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      
      // Backend configuration (if needed later)
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
      
      // Namespace configuration
      ns: ['translation'],
      defaultNS: 'translation',
      
      // Key separator
      keySeparator: '.',
      nsSeparator: ':',
      
      // Pluralization rules
      pluralRules: {
        en: englishPlurals,
        af: afrikaansPlurals,
      },
      
      // Missing key handling
      missingKeyHandler: (lng, ns, key, fallbackValue) => {
        if (__DEV__) {
          console.warn(`Missing translation key: ${key} for language: ${lng}`);
        }
        return fallbackValue;
      },
      
      // Parse missing key handler
      parseMissingKeyHandler: (key) => {
        if (__DEV__) {
          console.warn(`Missing translation key: ${key}`);
        }
        return key;
      },
    });

  // Save the initial language to AsyncStorage
  try {
    await AsyncStorage.setItem('@medguard_language', initialLanguage);
  } catch (error) {
    console.warn('Error saving initial language:', error);
  }

  return i18n;
};

// Export the initialization function
export const initializeI18nAsync = initializeI18n;

// Export a function to change language with persistence
export const changeLanguageWithPersistence = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('@medguard_language', language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Export a function to get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Export a function to get available languages
export const getAvailableLanguages = () => {
  return Object.keys(resources);
};

// Export the configured i18n instance
export default i18n; 