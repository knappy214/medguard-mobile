
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  View,
  Alert,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Icon,
  IconProps,
  List,
  ListItem,
  TopNavigation,
  TopNavigationAction,
  Divider,
  Toggle,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isToday, isYesterday } from 'date-fns';
import { enZA, af } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import notificationService from '../../services/notificationService';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';
import i18n from '../../i18n';

const BellIcon = (props: IconProps) => <Icon {...props} name='bell-outline' />;
const SettingsIcon = (props: IconProps) => <Icon {...props} name='settings-outline' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-circle-outline' />;
const ClockIcon = (props: IconProps) => <Icon {...props} name='clock-outline' />;
const AlertIcon = (props: IconProps) => <Icon {...props} name='alert-circle-outline' />;
const TrashIcon = (props: IconProps) => <Icon {...props} name='trash-2-outline' />;

interface Notification {
  id: string;
  type: 'medication_reminder' | 'low_stock' | 'expiring_soon' | 'missed_dose' | 'general';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  medicationId?: number;
  scheduleId?: number;
}

const NotificationsScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'medication_reminder',
      title: '💊 Metformin',
      body: 'Time for your 500mg dose',
      timestamp: new Date(),
      read: false,
      actionable: true,
      medicationId: 1,
      scheduleId: 1,
    },
    {
      id: '2',
      type: 'low_stock',
      title: '📦 Low Stock Alert',
      body: 'Lisinopril is running low (3 pills remaining)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionable: false,
      medicationId: 2,
    },
    {
      id: '3',
      type: 'missed_dose',
      title: '⚠️ Missed Dose',
      body: 'You missed your morning dose of Aspirin',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      actionable: false,
      medicationId: 3,
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const locale = i18n.getCurrentLanguage() === 'af' ? af : enZA;

  useEffect(() => {
    loadNotifications();
    loadNotificationSettings();
  }, []);

  const loadNotifications = async () => {
    try {
      // In a real app, load from API or local storage
      // const notificationsData = await apiService.getNotifications();
      // setNotifications(notificationsData);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await notificationService.getReminderSettings();
      setNotificationsEnabled(settings.enabled);
    } catch (error) {
      console.error('Load notification settings error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteNotification = (notificationId: string) => {
    Alert.alert(
      i18n.t('common.delete'),
      'Delete this notification?',
      [
        { text: i18n.t('common.cancel') },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setNotifications(prev =>
              prev.filter(notification => notification.id !== notificationId)
            );
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      i18n.t('common.delete'),
      'Clear all notifications?',
      [
        { text: i18n.t('common.cancel') },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const handleNotificationAction = async (notification: Notification) => {
    if (notification.type === 'medication_reminder' && notification.scheduleId) {
      // Mark medication as taken
      try {
        // await apiService.logMedicationTaken(notification.scheduleId, new Date());
        Alert.alert(
          i18n.t('common.success'),
          i18n.t('reminders.dose_taken')
        );
        markAsRead(notification.id);
      } catch (error) {
        console.error('Mark dose taken error:', error);
        Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
      }
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      await notificationService.updateReminderSettings({ enabled });
      setNotificationsEnabled(enabled);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Toggle notifications error:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'medication_reminder':
        return <Icon name="activity" style={styles.notificationIcon} fill={MedGuardColors.primary.trustBlue} />;
      case 'low_stock':
        return <Icon name="package" style={styles.notificationIcon} fill={MedGuardColors.alerts.warningAmber} />;
      case 'expiring_soon':
        return <Icon name="calendar" style={styles.notificationIcon} fill={MedGuardColors.alerts.warningAmber} />;
      case 'missed_dose':
        return <Icon name="alert-circle" style={styles.notificationIcon} fill={MedGuardColors.alerts.criticalRed} />;
      default:
        return <Icon name="bell" style={styles.notificationIcon} fill={MedGuardColors.primary.healingGreen} />;
    }
  };

  const formatNotificationTime = (timestamp: Date): string => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm', { locale });
    } else if (isYesterday(timestamp)) {
      return i18n.t('days.yesterday');
    } else {
      return format(timestamp, 'MMM d', { locale });
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <ListItem
      title={item.title}
      description={`${item.body}\n${formatNotificationTime(item.timestamp)}`}
      accessoryLeft={() => getNotificationIcon(item.type)}
      accessoryRight={() => (
        <View style={styles.notificationActions}>
          {item.actionable && (
            <Button
              size="tiny"
              status="success"
              accessoryLeft={CheckIcon}
              onPress={() => handleNotificationAction(item)}
            >
              {i18n.t('reminders.take_now')}
            </Button>
          )}
          <Button
            size="tiny"
            appearance="ghost"
            accessoryLeft={TrashIcon}
            onPress={() => deleteNotification(item.id)}
          />
        </View>
      )}
      onPress={() => markAsRead(item.id)}
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
    />
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={`${i18n.t('navigation.notifications')} ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
        alignment="center"
        accessoryRight={() => (
          <View style={styles.topActions}>
            <TopNavigationAction
              icon={CheckIcon}
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
            />
            <TopNavigationAction
              icon={SettingsIcon}
              onPress={() => navigation.navigate('Settings')}
            />
          </View>
        )}
      />

      {/* Notification Settings */}
      <Card style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsInfo}>
            <Icon
              name="bell"
              style={styles.settingsIcon}
              fill={MedGuardColors.primary.trustBlue}
            />
            <Text category="s1">{i18n.t('reminders.enable_reminders')}</Text>
          </View>
          <Toggle
            checked={notificationsEnabled}
            onChange={toggleNotifications}
          />
        </View>

        {notifications.length > 0 && (
          <Button
            appearance="ghost"
            size="small"
            accessoryLeft={TrashIcon}
            onPress={clearAllNotifications}
          >
            {i18n.t('notifications.clear_all')}
          </Button>
        )}
      </Card>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[MedGuardColors.primary.trustBlue]}
              tintColor={MedGuardColors.primary.trustBlue}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon
            name="bell-off-outline"
            style={styles.emptyStateIcon}
            fill={MedGuardColors.extended.mediumGray}
          />
          <Text category="h6" style={styles.emptyStateTitle}>
            {i18n.t('notifications.no_notifications')}
          </Text>
          <Text category="s1" appearance="hint" style={styles.emptyStateDescription}>
            {i18n.t('notifications.no_notifications_description')}
          </Text>
        </View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topActions: {
    flexDirection: 'row',
  },
  settingsCard: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  settingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.sm,
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  notificationItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  unreadNotification: {
    backgroundColor: MedGuardColors.primary.trustBlue + '08', // 8% opacity
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    textAlign: 'center',
  },
});

export default NotificationsScreen;
