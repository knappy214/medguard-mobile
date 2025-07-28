import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

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

// Safely get language code from device locale
const getLanguageCode = () => {
  try {
    const locale = Localization.locale;
    if (locale && typeof locale === 'string') {
      return locale.split('-')[0];
    }
  } catch (error) {
    console.warn('Error getting locale:', error);
  }
  return 'en'; // fallback to English
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLanguageCode(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 