import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useMedication } from '../contexts/MedicationContext';
import { LANGUAGES } from '../types';

const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { notificationSettings, saveNotificationSettings } = useNotification();
  const { exportData, importData, clearAllData } = useMedication();

  const [localSettings, setLocalSettings] = useState({
    ...notificationSettings,
    largeText: false,
    highContrast: false,
    screenReader: false,
  });

  const handleLanguageChange = async (language) => {
    try {
      await changeLanguage(language);
      Alert.alert(t('success.settingsSaved'), t('success.settingsSaved'));
    } catch (error) {
      Alert.alert(t('errors.general'), error.message);
    }
  };

  const handleNotificationSettingChange = async (setting, value) => {
    const newSettings = { ...localSettings, [setting]: value };
    setLocalSettings(newSettings);
    
    try {
      await saveNotificationSettings(newSettings);
    } catch (error) {
      Alert.alert(t('errors.general'), error.message);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      // In a real app, you would share this data or save it to a file
      Alert.alert(
        t('success.dataExported'),
        `${t('success.dataExported')}\n\n${JSON.stringify(data, null, 2)}`,
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(t('errors.general'), error.message);
    }
  };

  const handleImportData = () => {
    Alert.prompt(
      t('settings.importData'),
      t('settings.importData'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.import'),
          onPress: async (dataString) => {
            try {
              const data = JSON.parse(dataString);
              await importData(data);
              Alert.alert(t('success.dataImported'), t('success.dataImported'));
            } catch (error) {
              Alert.alert(t('errors.general'), error.message);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleClearData = () => {
    Alert.alert(
      t('alerts.clearData'),
      t('alerts.clearDataMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert(t('success.settingsSaved'), t('success.settingsSaved'));
            } catch (error) {
              Alert.alert(t('errors.general'), error.message);
            }
          },
        },
      ]
    );
  };

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (icon, title, subtitle, action, rightComponent) => (
    <TouchableOpacity style={styles.settingItem} onPress={action}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#6B7280" style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon, title, subtitle, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#6B7280" style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderInputItem = (icon, title, value, onChangeText, placeholder, keyboardType = 'default') => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#6B7280" style={styles.settingIcon} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <TextInput
        style={styles.settingInput}
        value={value.toString()}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection(t('settings.language'), (
          <View style={styles.languageContainer}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                currentLanguage === LANGUAGES.ENGLISH && styles.selectedLanguageButton,
              ]}
              onPress={() => handleLanguageChange(LANGUAGES.ENGLISH)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  currentLanguage === LANGUAGES.ENGLISH && styles.selectedLanguageButtonText,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                currentLanguage === LANGUAGES.AFRIKAANS && styles.selectedLanguageButton,
              ]}
              onPress={() => handleLanguageChange(LANGUAGES.AFRIKAANS)}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  currentLanguage === LANGUAGES.AFRIKAANS && styles.selectedLanguageButtonText,
                ]}
              >
                Afrikaans
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {renderSection(t('settings.notifications'), (
          <View>
            {renderSwitchItem(
              'notifications-outline',
              t('settings.notificationsEnabled'),
              null,
              localSettings.enabled,
              (value) => handleNotificationSettingChange('enabled', value)
            )}
            {renderInputItem(
              'time-outline',
              t('settings.reminderTime'),
              localSettings.reminderTime,
              (value) => handleNotificationSettingChange('reminderTime', parseInt(value) || 15),
              '15',
              'numeric'
            )}
            {renderInputItem(
              'warning-outline',
              t('settings.lowStockThreshold'),
              localSettings.lowStockThreshold,
              (value) => handleNotificationSettingChange('lowStockThreshold', parseInt(value) || 7),
              '7',
              'numeric'
            )}
          </View>
        ))}

        {renderSection(t('settings.accessibility'), (
          <View>
            {renderSwitchItem(
              'text-outline',
              t('settings.largeText'),
              null,
              localSettings.largeText,
              (value) => setLocalSettings(prev => ({ ...prev, largeText: value }))
            )}
            {renderSwitchItem(
              'contrast-outline',
              t('settings.highContrast'),
              null,
              localSettings.highContrast,
              (value) => setLocalSettings(prev => ({ ...prev, highContrast: value }))
            )}
            {renderSwitchItem(
              'ear-outline',
              t('settings.screenReader'),
              null,
              localSettings.screenReader,
              (value) => setLocalSettings(prev => ({ ...prev, screenReader: value }))
            )}
          </View>
        ))}

        {renderSection(t('settings.data'), (
          <View>
            {renderSettingItem(
              'download-outline',
              t('settings.exportData'),
              null,
              handleExportData,
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            )}
            {renderSettingItem(
              'upload-outline',
              t('settings.importData'),
              null,
              handleImportData,
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            )}
            {renderSettingItem(
              'trash-outline',
              t('settings.clearData'),
              null,
              handleClearData,
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            )}
          </View>
        ))}

        {renderSection(t('settings.about'), (
          <View>
            {renderSettingItem(
              'information-circle-outline',
              t('settings.version'),
              '1.0.0',
              null,
              <Text style={styles.versionText}>1.0.0</Text>
            )}
            {renderSettingItem(
              'document-text-outline',
              t('settings.privacyPolicy'),
              null,
              () => Alert.alert('Privacy Policy', 'Privacy policy content would go here'),
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            )}
            {renderSettingItem(
              'document-text-outline',
              t('settings.termsOfService'),
              null,
              () => Alert.alert('Terms of Service', 'Terms of service content would go here'),
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            )}
            {renderSettingItem(
              'mail-outline',
              t('settings.contactSupport'),
              null,
              () => Alert.alert('Contact Support', 'Contact support information would go here'),
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  selectedLanguageButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedLanguageButtonText: {
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#fff',
    minWidth: 60,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default SettingsScreen; 