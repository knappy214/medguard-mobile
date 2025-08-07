import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Icon,
  IconProps,
  Divider,
  List,
  ListItem,
  Toggle,
  Input,
  TopNavigation,
  Spinner,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import authService from '../../services/authService';
import notificationService from '../../services/notificationService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Typography, Spacing } from '../../theme/typography';

// Icon components
const BackupIcon = (props: IconProps) => <Icon {...props} name='download-outline' />;
const RestoreIcon = (props: IconProps) => <Icon {...props} name='upload-outline' />;
const SecurityIcon = (props: IconProps) => <Icon {...props} name='lock-outline' />;
const NotificationIcon = (props: IconProps) => <Icon {...props} name='bell-outline' />;
const LanguageIcon = (props: IconProps) => <Icon {...props} name='globe-2-outline' />;
const CloseIcon = (props: IconProps) => <Icon {...props} name='close-outline' />;
const SaveIcon = (props: IconProps) => <Icon {...props} name='checkmark-outline' />;

interface ReminderSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderMinutesBefore: number;
  missedDoseReminders: boolean;
  lowStockReminders: boolean;
  refillReminders: boolean;
  weekendReminders: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [quietHours, setQuietHours] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await notificationService.getReminderSettings();
      setReminderSettings(settings);
      setQuietHours(!!settings.quietHoursStart);
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!reminderSettings) return;
    try {
      await notificationService.updateReminderSettings(reminderSettings);
      Alert.alert(i18n.t('common.success'), 'Settings saved!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
    }
  };

  if (loading || !reminderSettings) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <Spinner size="giant" />
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation title={i18n.t('common.settings')} alignment="center" />
      <ScrollView style={styles.scroll}>
        <Card style={styles.card}>
          <Text category="h6">{i18n.t('reminders.reminder_settings')}</Text>
          <Divider style={styles.divider} />

          <Toggle
            checked={reminderSettings.enabled}
            onChange={value => setReminderSettings({ ...reminderSettings, enabled: value })}
          >
            {i18n.t('reminders.enable_reminders')}
          </Toggle>
          <Toggle
            checked={reminderSettings.soundEnabled}
            onChange={value => setReminderSettings({ ...reminderSettings, soundEnabled: value })}
          >
            {i18n.t('reminders.sound_enabled')}
          </Toggle>
          <Toggle
            checked={reminderSettings.vibrationEnabled}
            onChange={value => setReminderSettings({ ...reminderSettings, vibrationEnabled: value })}
          >
            {i18n.t('reminders.vibration_enabled')}
          </Toggle>
          <View style={styles.quietHoursRow}>
            <Toggle
              checked={quietHours}
              onChange={value => {
                setQuietHours(value);
                setReminderSettings({
                  ...reminderSettings,
                  quietHoursStart: value ? (reminderSettings.quietHoursStart || '22:00') : undefined,
                  quietHoursEnd: value ? (reminderSettings.quietHoursEnd || '08:00') : undefined,
                } as ReminderSettings);
              }}
            >
              {i18n.t('reminders.quiet_hours')}
            </Toggle>
          </View>
          {quietHours && (
            <View style={styles.timeInputs}>
              <Input
                label={i18n.t('reminders.quiet_hours_start')}
                value={reminderSettings.quietHoursStart || ''}
                onChangeText={text => setReminderSettings({ ...reminderSettings, quietHoursStart: text || undefined } as ReminderSettings)}
                placeholder="22:00"
                style={styles.timeInput}
              />
              <Input
                label={i18n.t('reminders.quiet_hours_end')}
                value={reminderSettings.quietHoursEnd || ''}
                onChangeText={text => setReminderSettings({ ...reminderSettings, quietHoursEnd: text || undefined } as ReminderSettings)}
                placeholder="08:00"
                style={styles.timeInput}
              />
            </View>
          )}
          <View style={styles.actions}>
            <Button accessoryLeft={SaveIcon} onPress={saveSettings}>
              {i18n.t('common.save')}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md },
  card: { marginBottom: Spacing.md },
  divider: { marginVertical: Spacing.sm },
  quietHoursRow: { marginTop: Spacing.md },
  timeInputs: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  timeInput: { width: '48%' },
  actions: { marginTop: Spacing.lg, alignItems: 'center' },
});

export default SettingsScreen;
