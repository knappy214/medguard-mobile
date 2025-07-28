import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES } from '../types';
import { 
  initializeI18nAsync, 
  changeLanguageWithPersistence, 
  getCurrentLanguage,
  getAvailableLanguages 
} from '../i18n/config';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES.ENGLISH);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize i18n on component mount
  useEffect(() => {
    initializeI18n();
  }, []);

  const initializeI18n = async () => {
    try {
      setIsLoading(true);
      
      // Initialize i18n with enhanced configuration
      await initializeI18nAsync();
      
      // Get the current language after initialization
      const currentLang = getCurrentLanguage();
      setCurrentLanguage(currentLang);
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing i18n:', error);
      // Fallback to English if initialization fails
      setCurrentLanguage(LANGUAGES.ENGLISH);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language) => {
    try {
      if (Object.values(LANGUAGES).includes(language)) {
        const success = await changeLanguageWithPersistence(language);
        if (success) {
          setCurrentLanguage(language);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === LANGUAGES.ENGLISH 
      ? LANGUAGES.AFRIKAANS 
      : LANGUAGES.ENGLISH;
    return await changeLanguage(newLanguage);
  };

  // Get available languages
  const getLanguages = () => {
    return getAvailableLanguages();
  };

  // Check if a specific language is supported
  const isLanguageSupported = (language) => {
    return getLanguages().includes(language);
  };

  // Get language display name
  const getLanguageDisplayName = (languageCode) => {
    const languageNames = {
      en: 'English',
      af: 'Afrikaans',
    };
    return languageNames[languageCode] || languageCode;
  };

  // Get current language display name
  const getCurrentLanguageDisplayName = () => {
    return getLanguageDisplayName(currentLanguage);
  };

  // Reset language to device default
  const resetToDeviceLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('@medguard_language');
      if (savedLanguage) {
        await AsyncStorage.removeItem('@medguard_language');
      }
      // Reinitialize to get device language
      await initializeI18n();
    } catch (error) {
      console.error('Error resetting to device language:', error);
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isLoading,
    isInitialized,
    isEnglish: currentLanguage === LANGUAGES.ENGLISH,
    isAfrikaans: currentLanguage === LANGUAGES.AFRIKAANS,
    getLanguages,
    isLanguageSupported,
    getLanguageDisplayName,
    getCurrentLanguageDisplayName,
    resetToDeviceLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 