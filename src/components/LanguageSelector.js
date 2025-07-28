import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { t } = useTranslation();
  const {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    getLanguages,
    getLanguageDisplayName,
    getCurrentLanguageDisplayName,
    resetToDeviceLanguage,
    isEnglish,
    isAfrikaans,
  } = useLanguage();

  const [showLanguageInfo, setShowLanguageInfo] = useState(false);

  const handleLanguageChange = async (language) => {
    try {
      const success = await changeLanguage(language);
      if (success) {
        Alert.alert(
          t('success.languageChanged', 'Language Changed'),
          t('success.languageChangedMessage', 'Language has been changed successfully')
        );
      } else {
        Alert.alert(
          t('errors.languageChangeFailed', 'Language Change Failed'),
          t('errors.languageChangeFailedMessage', 'Failed to change language. Please try again.')
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('errors.general'),
        t('errors.languageChangeFailedMessage', 'Failed to change language. Please try again.')
      );
    }
  };

  const handleResetToDevice = async () => {
    Alert.alert(
      t('alerts.resetLanguage', 'Reset Language'),
      t('alerts.resetLanguageMessage', 'Reset language to device default?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await resetToDeviceLanguage();
            Alert.alert(
              t('success.languageReset', 'Language Reset'),
              t('success.languageResetMessage', 'Language has been reset to device default.')
            );
          },
        },
      ]
    );
  };

  const renderPluralizationExamples = () => {
    return (
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>
          {t('common.pluralizationExamples', 'Pluralization Examples')}
        </Text>
        
        {/* Medication count examples */}
        <View style={styles.exampleRow}>
          <Text style={styles.exampleText}>
            {t('home.medicationCount', { count: 1 })}
          </Text>
          <Text style={styles.exampleText}>
            {t('home.medicationCount', { count: 5 })}
          </Text>
        </View>

        {/* Dose count examples */}
        <View style={styles.exampleRow}>
          <Text style={styles.exampleText}>
            {t('home.doseCount', { count: 1 })}
          </Text>
          <Text style={styles.exampleText}>
            {t('home.doseCount', { count: 3 })}
          </Text>
        </View>

        {/* Tablet count examples */}
        <View style={styles.exampleRow}>
          <Text style={styles.exampleText}>
            {t('home.tabletCount', { count: 1 })}
          </Text>
          <Text style={styles.exampleText}>
            {t('home.tabletCount', { count: 10 })}
          </Text>
        </View>

        {/* Time examples */}
        <View style={styles.exampleRow}>
          <Text style={styles.exampleText}>
            {t('times.hourCount', { count: 1 })}
          </Text>
          <Text style={styles.exampleText}>
            {t('times.hourCount', { count: 24 })}
          </Text>
        </View>
      </View>
    );
  };

  const renderMedicalTerminology = () => {
    return (
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>
          {t('common.medicalTerminology', 'Medical Terminology')}
        </Text>
        
        <View style={styles.medicalTermsGrid}>
          <View style={styles.medicalTermItem}>
            <Text style={styles.medicalTermLabel}>
              {t('medical.prescription')}
            </Text>
          </View>
          <View style={styles.medicalTermItem}>
            <Text style={styles.medicalTermLabel}>
              {t('medical.antibiotic')}
            </Text>
          </View>
          <View style={styles.medicalTermItem}>
            <Text style={styles.medicalTermLabel}>
              {t('medical.diabetes')}
            </Text>
          </View>
          <View style={styles.medicalTermItem}>
            <Text style={styles.medicalTermLabel}>
              {t('medical.sideEffects')}
            </Text>
          </View>
          <View style={styles.medicalTermItem}>
            <Text style={styles.medicalTermLabel}>
              {t('medical.takeWithFood')}
            </Text>
          </View>
          <View style={styles.medicalTermItem}>
            <Text style={styles.medicalTermLabel}>
              {t('medical.avoidAlcohol')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.language')}</Text>
        <TouchableOpacity
          onPress={() => setShowLanguageInfo(!showLanguageInfo)}
          style={styles.infoButton}
        >
          <Ionicons
            name={showLanguageInfo ? 'information-circle' : 'information-circle-outline'}
            size={24}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.currentLanguageContainer}>
        <Text style={styles.currentLanguageLabel}>
          {t('common.currentLanguage', 'Current Language')}:
        </Text>
        <Text style={styles.currentLanguageValue}>
          {getCurrentLanguageDisplayName()}
        </Text>
      </View>

      <View style={styles.languageButtonsContainer}>
        {getLanguages().map((language) => (
          <TouchableOpacity
            key={language}
            style={[
              styles.languageButton,
              currentLanguage === language && styles.activeLanguageButton,
            ]}
            onPress={() => handleLanguageChange(language)}
          >
            <Text
              style={[
                styles.languageButtonText,
                currentLanguage === language && styles.activeLanguageButtonText,
              ]}
            >
              {getLanguageDisplayName(language)}
            </Text>
            {currentLanguage === language && (
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={toggleLanguage}
      >
        <Ionicons name="swap-horizontal" size={20} color="#2563EB" />
        <Text style={styles.toggleButtonText}>
          {t('common.toggleLanguage', 'Toggle Language')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetToDevice}
      >
        <Ionicons name="refresh" size={20} color="#666" />
        <Text style={styles.resetButtonText}>
          {t('common.resetToDevice', 'Reset to Device Language')}
        </Text>
      </TouchableOpacity>

      {showLanguageInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            {t('common.languageInfo', 'Language Information')}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t('common.supportedLanguages', 'Supported Languages')}:
            </Text>
            <Text style={styles.infoValue}>
              {getLanguages().map(getLanguageDisplayName).join(', ')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t('common.deviceLanguage', 'Device Language')}:
            </Text>
            <Text style={styles.infoValue}>
              {t('common.detected', 'Detected automatically')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {t('common.persistence', 'Persistence')}:
            </Text>
            <Text style={styles.infoValue}>
              {t('common.asyncStorage', 'Saved to device storage')}
            </Text>
          </View>

          {renderPluralizationExamples()}
          {renderMedicalTerminology()}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoButton: {
    padding: 4,
  },
  currentLanguageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  currentLanguageLabel: {
    fontSize: 16,
    color: '#666',
  },
  currentLanguageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  languageButtonsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  languageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeLanguageButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#333',
  },
  activeLanguageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  examplesContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  medicalTermsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  medicalTermItem: {
    width: '48%',
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  medicalTermLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});

export default LanguageSelector; 