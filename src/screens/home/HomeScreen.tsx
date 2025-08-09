import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Icon,
  IconProps,
  Avatar,
  List,
  ListItem,
  TopNavigation,
  TopNavigationAction,
  Divider,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { enZA, af } from 'date-fns/locale';

// Services and utilities
import apiService from '../../services/apiService';
import offlineService from '../../services/offlineService';
import notificationService from '../../services/notificationService';
import authService from '../../services/authService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';
import { LargeAccessibleButton } from '../../components/accessibility/AccessibleComponents'

// Types
interface DashboardData {
  upcomingDoses: Array<{
    id: number;
    medication: any;
    scheduledTime: string;
    dosageAmount: string;
  }>;
  todaysDoses: {
    total: number;
    taken: number;
    missed: number;
    upcoming: number;
  };
  lowStockMedications: any[];
  expiringMedications: any[];
  adherenceRate: number;
}

const { width: screenWidth } = Dimensions.get('window');

// Icon components
const MedicationIcon = (props: IconProps) => <Icon {...props} name='activity' pack='eva' />;
const CalendarIcon = (props: IconProps) => <Icon {...props} name='calendar' pack='eva' />;
const AlertIcon = (props: IconProps) => <Icon {...props} name='alert-circle' pack='eva' />;
const TrendIcon = (props: IconProps) => <Icon {...props} name='trending-up' pack='eva' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-circle-2' pack='eva' />;
const ClockIcon = (props: IconProps) => <Icon {...props} name='clock' pack='eva' />;
const SettingsIcon = (props: IconProps) => <Icon {...props} name='settings' pack='eva' />;
const EmergencyIcon = (props: IconProps) => <Icon {...props} name='phone' pack='eva' />;

const HomeScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUser(),
        loadDashboardData(),
        initializeNotifications(),
      ]);
    } catch (error) {
      console.error('Initialize screen error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [medications, schedules] = await Promise.all([
        apiService.getMedications(),
        apiService.getMedicationSchedules(),
      ]);

      // Calculate dashboard metrics
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      
      // Filter today's doses
      const todaysSchedules = schedules.filter(schedule => {
        if (schedule.status !== 'active') return false;
        
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const dayFields = [
          schedule.sunday, schedule.monday, schedule.tuesday,
          schedule.wednesday, schedule.thursday, schedule.friday, schedule.saturday
        ];
        
        return dayFields[dayOfWeek];
      });

      // Get upcoming doses (next 6 hours)
      const upcomingDoses = todaysSchedules
        .map(schedule => {
          let scheduledTime: Date;
          
          if (schedule.timing === 'custom' && schedule.customTime) {
            const [hours, minutes] = schedule.customTime.split(':').map(Number);
            scheduledTime = new Date(now);
            scheduledTime.setHours(hours || 0, minutes || 0, 0, 0);
          } else {
            const timeMap = {
              morning: { hours: 8, minutes: 0 },
              noon: { hours: 12, minutes: 0 },
              night: { hours: 20, minutes: 0 },
            };
            
            const time = timeMap[schedule.timing as keyof typeof timeMap] || timeMap.morning;
            scheduledTime = new Date(now);
            scheduledTime.setHours(time.hours, time.minutes, 0, 0);
          }

          return {
            id: schedule.id,
            medication: schedule.medication,
            scheduledTime: scheduledTime.toISOString(),
            dosageAmount: schedule.dosageAmount,
            schedule,
          };
        })
        .filter(dose => {
          const doseTime = new Date(dose.scheduledTime);
          const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
          return doseTime >= now && doseTime <= sixHoursLater;
        })
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

      // Calculate adherence metrics (this would come from logs in real implementation)
      const todaysDoses = {
        total: todaysSchedules.length,
        taken: Math.floor(todaysSchedules.length * 0.8), // Mock data
        missed: Math.floor(todaysSchedules.length * 0.1), // Mock data
        upcoming: todaysSchedules.length - Math.floor(todaysSchedules.length * 0.9),
      };

      // Find low stock medications
      const lowStockMedications = medications.filter(
        med => med.pillCount <= med.lowStockThreshold
      );

      // Find expiring medications (within 30 days)
      const thirtyDaysFromNow = addDays(now, 30);
      const expiringMedications = medications.filter(med => {
        if (!med.expirationDate) return false;
        const expiryDate = new Date(med.expirationDate);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
      });

      // Calculate overall adherence rate
      const adherenceRate = todaysDoses.total > 0 
        ? Math.round((todaysDoses.taken / todaysDoses.total) * 100)
        : 100;

      setDashboardData({
        upcomingDoses,
        todaysDoses,
        lowStockMedications,
        expiringMedications,
        adherenceRate,
      });
    } catch (error) {
      console.error('Load dashboard data error:', error);
    }
  };

  const initializeNotifications = async () => {
    try {
      await notificationService.initializeNotifications();
    } catch (error) {
      console.error('Initialize notifications error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await offlineService.smartSync();
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const markDoseAsTaken = async (scheduleId: number) => {
    try {
      await apiService.logMedicationTaken(scheduleId, new Date());
      await loadDashboardData(); // Refresh dashboard
    } catch (error) {
      console.error('Mark dose taken error:', error);
      // Show error message to user
    }
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || user?.username || '';
    
    let greeting: string;
    if (hour < 12) {
      greeting = i18n.getCurrentLanguage() === 'af' ? 'Goeie môre' : 'Good morning';
    } else if (hour < 17) {
      greeting = i18n.getCurrentLanguage() === 'af' ? 'Goeie middag' : 'Good afternoon';
    } else {
      greeting = i18n.getCurrentLanguage() === 'af' ? 'Goeie aand' : 'Good evening';
    }
    
    return `${greeting}${firstName ? `, ${firstName}` : ''}!`;
  };

  const formatUpcomingDoseTime = (scheduledTime: string): string => {
    const time = new Date(scheduledTime);
    const locale = i18n.getCurrentLanguage() === 'af' ? af : enZA;
    
    if (isToday(time)) {
      return format(time, 'HH:mm', { locale });
    } else if (isTomorrow(time)) {
      const tomorrow = i18n.getCurrentLanguage() === 'af' ? 'Môre' : 'Tomorrow';
      return `${tomorrow} ${format(time, 'HH:mm', { locale })}`;
    } else {
      return format(time, 'EEE HH:mm', { locale });
    }
  };

  const renderUpcomingDoseItem = ({ item }: any) => (
    <ListItem
      title={item.medication.name}
      description={`${item.dosageAmount} - ${formatUpcomingDoseTime(item.scheduledTime)}`}
      accessoryLeft={() => (
        <Avatar
          source={{ uri: item.medication.medicationImage }}
          ImageComponent={MedicationIcon}
          style={styles.medicationAvatar}
        />
      )}
      accessoryRight={() => (
        <Button
          size="small"
          status="success"
          accessoryLeft={CheckIcon}
          onPress={() => markDoseAsTaken(item.id)}
        >
          {i18n.t('reminders.take_now')}
        </Button>
      )}
      style={styles.upcomingDoseItem}
    />
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Icon
            name="checkmark-circle"
            fill={MedGuardColors.alerts.successGreen}
            style={styles.statIcon}
          />
          <Text category="h6" style={styles.statNumber}>
            {dashboardData?.todaysDoses.taken || 0}
          </Text>
          <Text category="caption1" style={styles.statLabel}>
            {i18n.t('analytics.doses_taken')}
          </Text>
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Icon
            name="clock"
            fill={MedGuardColors.alerts.infoBlue}
            style={styles.statIcon}
          />
          <Text category="h6" style={styles.statNumber}>
            {dashboardData?.todaysDoses.upcoming || 0}
          </Text>
          <Text category="caption1" style={styles.statLabel}>
            {i18n.t('schedule.upcoming_doses')}
          </Text>
        </View>
      </Card>

      <Card style={styles.statCard}>
        <View style={styles.statContent}>
          <Icon
            name="trending-up"
            fill={MedGuardColors.primary.healingGreen}
            style={styles.statIcon}
          />
          <Text category="h6" style={styles.statNumber}>
            {dashboardData?.adherenceRate || 0}%
          </Text>
          <Text category="caption1" style={styles.statLabel}>
            {i18n.t('analytics.adherence_rate')}
          </Text>
        </View>
      </Card>
    </View>
  );

  const renderAlerts = () => {
    const alertsToShow = [
      ...dashboardData?.lowStockMedications || [],
      ...dashboardData?.expiringMedications || [],
    ];

    if (alertsToShow.length === 0) return null;

    return (
      <Card style={styles.alertsCard} status="warning">
        <View style={styles.cardHeader}>
          <Icon
            name="alert-circle"
            fill={MedGuardColors.alerts.warningAmber}
            style={styles.cardIcon}
          />
          <Text category="h6">{i18n.t('common.warning')}</Text>
        </View>
        
        {dashboardData?.lowStockMedications.map(med => (
          <View key={`low-${med.id}`} style={styles.alertItem}>
            <Text category="s1">
              {i18n.t('alerts.medication_running_low', { medication: med.name })}
            </Text>
            <Text category="caption1" appearance="hint">
              {i18n.t('alerts.pills_remaining', { count: med.pillCount })}
            </Text>
          </View>
        ))}
        
        {dashboardData?.expiringMedications.map(med => (
          <View key={`exp-${med.id}`} style={styles.alertItem}>
            <Text category="s1">
              {i18n.t('alerts.expiring_soon')} - {med.name}
            </Text>
            <Text category="caption1" appearance="hint">
              {format(new Date(med.expirationDate), 'PPP', {
                locale: i18n.getCurrentLanguage() === 'af' ? af : enZA
              })}
            </Text>
          </View>
        ))}
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text category="h6">{i18n.t('common.loading')}</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={getGreeting()}
        alignment="start"
        style={styles.topNav}
        accessoryRight={() => (
          <View style={styles.topNavActions}>
            <TopNavigationAction
              icon={EmergencyIcon}
              onPress={() => navigation.navigate('Profile', { screen: 'Emergency' })}
            />
            <TopNavigationAction
              icon={SettingsIcon}
              onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}
            />
          </View>
        )}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Alerts */}
        {renderAlerts()}

        {/* Upcoming Doses */}
        <Card style={styles.upcomingDosesCard}>
          <View style={styles.cardHeader}>
            <Icon
              name="clock"
              fill={MedGuardColors.primary.trustBlue}
              style={styles.cardIcon}
            />
            <Text category="h6">{i18n.t('schedule.upcoming_doses')}</Text>
          </View>
          
          {dashboardData?.upcomingDoses.length ? (
            <List
              data={dashboardData.upcomingDoses}
              renderItem={renderUpcomingDoseItem}
              ItemSeparatorComponent={() => <Divider />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text category="s1" appearance="hint">
                {i18n.t('schedule.no_schedules')}
              </Text>
              <LargeAccessibleButton onPress={() => navigation.navigate('Schedule')} accessibilityLabel={i18n.t('schedule.add_schedule')}>
                {i18n.t('schedule.add_schedule')}
              </LargeAccessibleButton>
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <LargeAccessibleButton onPress={() => navigation.navigate('Medications')} accessibilityLabel={i18n.t('medications.add_medication')}>
            {i18n.t('medications.add_medication')}
          </LargeAccessibleButton>
          
          <LargeAccessibleButton onPress={() => navigation.navigate('Schedule')} accessibilityLabel={i18n.t('schedule.add_schedule')}>
            {i18n.t('schedule.add_schedule')}
          </LargeAccessibleButton>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    backgroundColor: 'transparent',
  },
  topNavActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    marginBottom: Spacing.xs,
  },
  statNumber: {
    fontWeight: 'bold',
    color: MedGuardColors.primary.trustBlue,
  },
  statLabel: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  alertsCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  alertItem: {
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: MedGuardColors.extended.borderGray,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  upcomingDosesCard: {
    marginBottom: Spacing.md,
  },
  upcomingDoseItem: {
    paddingVertical: Spacing.sm,
  },
  medicationAvatar: {
    width: 40,
    height: 40,
    backgroundColor: MedGuardColors.primary.healingGreen,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyStateButton: {
    marginTop: Spacing.md,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
});

export default HomeScreen;
