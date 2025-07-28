import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = ({ style }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{t('language.title')}</Text>
      <View style={styles.languageContainer}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageButton,
              currentLanguage === language.code && styles.activeLanguageButton,
            ]}
            onPress={() => changeLanguage(language.code)}
          >
            <Text style={styles.flag}>{language.flag}</Text>
            <Text
              style={[
                styles.languageText,
                currentLanguage === language.code && styles.activeLanguageText,
              ]}
            >
              {language.name}
            </Text>
            {currentLanguage === language.code && (
              <Ionicons name="checkmark" size={16} color="#2563EB" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  activeLanguageButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  flag: {
    fontSize: 20,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeLanguageText: {
    color: '#2563EB',
  },
});

export default LanguageSelector; 