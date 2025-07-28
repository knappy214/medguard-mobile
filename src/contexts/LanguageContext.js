import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES } from '../types';

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

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('@medguard_language');
      if (savedLanguage && Object.values(LANGUAGES).includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language) => {
    try {
      if (Object.values(LANGUAGES).includes(language)) {
        await i18n.changeLanguage(language);
        setCurrentLanguage(language);
        await AsyncStorage.setItem('@medguard_language', language);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = currentLanguage === LANGUAGES.ENGLISH 
      ? LANGUAGES.AFRIKAANS 
      : LANGUAGES.ENGLISH;
    await changeLanguage(newLanguage);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isLoading,
    isEnglish: currentLanguage === LANGUAGES.ENGLISH,
    isAfrikaans: currentLanguage === LANGUAGES.AFRIKAANS,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 