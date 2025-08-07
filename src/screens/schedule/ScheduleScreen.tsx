import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Alert,
  Dimensions,
  FlatList,
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
  Calendar,
  CalendarRange,
  Toggle,
  Select,
  SelectItem,
  IndexPath,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  format, 
  isToday, 
  isTomorrow, 
  addDays, 
  startOfDay, 
  endOfDay,
  parseISO,
  isWithinInterval,
  getDay,
} from 'date-fns';
import { enZA, af } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';

// Services and utilities
import apiService from '../../services/apiService';
import notificationService from '../../services/notificationService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

// Types
interface MedicationSchedule {
  id: number;
  medication: any;
  patient: number;
  timing: 'morning' | 'noon' | 'night' | 'custom';
  customTime?: string;
  dosageAmount: string;
  frequency: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'paused' | 'completed';
  instructions?: string;
}

interface ScheduledDose {
  id: string;
  scheduleId: number;
  medicationId: number;
  medicationName: string;
  dosageAmount: string;
  scheduledTime: Date;
  status: 'upcoming' | 'taken' | 'missed' | 'overdue';
  instructions?: string;
}

const { width: screenWidth } = Dimensions.get('window');

// Icon components
const AddIcon = (props: IconProps) => <Icon {...props} name='plus-outline' />;
const CalendarIcon = (props: IconProps) => <Icon {...props} name='calendar-outline' />;
const ListIcon = (props: IconProps) => <Icon {...props} name='list-outline' />;
const ClockIcon = (props: IconProps) => <Icon {...props} name='clock-outline' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-circle-2-outline' />;
const AlertIcon = (props: IconProps) => <Icon {...props} name='alert-circle-outline' />;
const EditIcon = (props: IconProps) => <Icon {...props} name='edit-outline' />;

const ScheduleScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const locale = i18n.getCurrentLanguage() === 'af' ? af : enZA;

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    generateScheduledDoses();
  }, [schedules, selectedDate]);

  const loadSchedules = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const schedulesData = await apiService.getMedicationSchedules(forceRefresh);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Load schedules error:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('errors.network_error'),
        [
          { text: i18n.t('common.ok') },
          { text: i18n.t('common.retry'), onPress: () => loadSchedules(true) },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchedules(true);
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const generateScheduledDoses = useCallback(() => {
    const doses: ScheduledDose[] = [];
    const targetDate = selectedDate;
    const dayOfWeek = getDay(targetDate); // 0 = Sunday, 1 = Monday, etc.
    
    // Day mapping for schedule properties
    const dayFields = [
      'sunday', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday'
    ];
    
    schedules
      .filter(schedule => {
        if (showActiveOnly && schedule.status !== 'active') return false;
        
        // Check if schedule applies to this day
        const dayField = dayFields[dayOfWeek] as keyof MedicationSchedule;
        if (!schedule[dayField]) return false;
        
        // Check date range
        const startDate = parseISO(schedule.startDate);
        const endDate = schedule.endDate ? parseISO(schedule.endDate) : null;
        
        if (targetDate < startOfDay(startDate)) return false;
        if (endDate && targetDate > endOfDay(endDate)) return false;
        
        return true;
      })
      .forEach(schedule => {
        let scheduledTimes: Date[] = [];
        
        if (schedule.timing === 'custom' && schedule.customTime) {
          const [hours, minutes] = schedule.customTime.split(':').map(Number);
          const scheduledTime = new Date(targetDate);
          scheduledTime.setHours(hours || 0, minutes || 0, 0, 0);
          scheduledTimes.push(scheduledTime);
        } else {
          // Handle frequency-based scheduling
          const timingMap: Record<string, { hours: number; minutes: number }[]> = {
            morning: [{ hours: 8, minutes: 0 }],
            noon: [{ hours: 12, minutes: 0 }],
            night: [{ hours: 20, minutes: 0 }],
            daily: [{ hours: 8, minutes: 0 }],
            twice_daily: [
              { hours: 8, minutes: 0 },
              { hours: 20, minutes: 0 }
            ],
            three_times_daily: [
              { hours: 8, minutes: 0 },
              { hours: 13, minutes: 0 },
              { hours: 20, minutes: 0 }
            ],
          };
          
          const times = timingMap[schedule.frequency] || timingMap[schedule.timing] || [{ hours: 8, minutes: 0 }];
          
          times.forEach(time => {
            const scheduledTime = new Date(targetDate);
            scheduledTime.setHours(time.hours, time.minutes, 0, 0);
            scheduledTimes.push(scheduledTime);
          });
        }
        
        scheduledTimes.forEach((scheduledTime, index) => {
          const now = new Date();
          let status: ScheduledDose['status'] = 'upcoming';
          
          if (scheduledTime < now) {
            if (isToday(scheduledTime)) {
              status = 'overdue'; // This would be checked against actual logs in real implementation
            } else {
              status = 'missed';
            }
          }
          
          doses.push({
            id: `${schedule.id}-${index}-${format(scheduledTime, 'yyyy-MM-dd-HH-mm')}`,
            scheduleId: schedule.id,
            medicationId: schedule.medication.id,
            medicationName: schedule.medication.name,
            dosageAmount: schedule.dosageAmount,
            scheduledTime,
            status,
            instructions: schedule.instructions || '',
          });
        });
      });
    
    // Sort by scheduled time
    doses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    setScheduledDoses(doses);
  }, [schedules, selectedDate, showActiveOnly]);

  const markDoseAsTaken = async (dose: ScheduledDose) => {
    try {
      await apiService.logMedicationTaken(dose.scheduleId, new Date());
      
      // Update local state
      setScheduledDoses(prev => 
        prev.map(d => 
          d.id === dose.id ? { ...d, status: 'taken' } : d
        )
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        i18n.t('common.success'),
        i18n.t('reminders.dose_taken')
      );
    } catch (error) {
      console.error('Mark dose taken error:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('errors.unknown_error')
      );
    }
  };

  const navigateToAddSchedule = () => {
    navigation.navigate('AddSchedule');
  };

  const navigateToEditSchedule = (scheduleId: number) => {
    navigation.navigate('EditSchedule', { scheduleId });
  };

  const getDoseStatusColor = (status: ScheduledDose['status']): string => {
    switch (status) {
      case 'taken': return MedGuardColors.alerts.successGreen;
      case 'upcoming': return MedGuardColors.alerts.infoBlue;
      case 'overdue': return MedGuardColors.alerts.warningAmber;
      case 'missed': return MedGuardColors.alerts.criticalRed;
      default: return MedGuardColors.extended.mediumGray;
    }
  };

  const getDoseStatusText = (status: ScheduledDose['status']): string => {
    switch (status) {
      case 'taken': return i18n.t('schedule.taken_today');
      case 'upcoming': return i18n.t('schedule.upcoming_doses');
      case 'overdue': return i18n.t('reminders.overdue_medication');
      case 'missed': return i18n.t('schedule.missed_doses');
      default: return '';
    }
  };

  const renderScheduleItem = ({ item }: { item: MedicationSchedule }) => {
    const activeDays = [
      item.monday && 'Mon',
      item.tuesday && 'Tue', 
      item.wednesday && 'Wed',
      item.thursday && 'Thu',
      item.friday && 'Fri',
      item.saturday && 'Sat',
      item.sunday && 'Sun',
    ].filter(Boolean).join(', ');

    return (
      <ListItem
        title={item.medication.name}
        description={`${item.dosageAmount} - ${item.frequency}\n${activeDays}`}
        accessoryLeft={() => (
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.status === 'active' 
              ? MedGuardColors.alerts.successGreen 
              : MedGuardColors.extended.mediumGray 
            }
          ]} />
        )}
        accessoryRight={() => (
          <Button
            size="tiny"
            appearance="ghost"
            accessoryLeft={EditIcon}
            onPress={() => navigateToEditSchedule(item.id)}
          />
        )}
        onPress={() => navigateToEditSchedule(item.id)}
        style={styles.scheduleItem}
      />
    );
  };

  const renderDoseItem = ({ item }: { item: ScheduledDose }) => {
    const statusColor = getDoseStatusColor(item.status);
    const timeText = format(item.scheduledTime, 'HH:mm', { locale });
    
    return (
      <ListItem
        title={item.medicationName}
        description={`${item.dosageAmount} at ${timeText}${item.instructions ? `\n${item.instructions}` : ''}`}
        accessoryLeft={() => (
          <View style={[styles.doseStatusIndicator, { backgroundColor: statusColor }]}>
            <Icon
              name={item.status === 'taken' ? 'checkmark' : 'clock'}
              style={styles.doseStatusIcon}
              fill={MedGuardColors.primary.cleanWhite}
            />
          </View>
        )}
        accessoryRight={() => (
          item.status === 'upcoming' || item.status === 'overdue' ? (
            <Button
              size="small"
              status="success"
              accessoryLeft={CheckIcon}
              onPress={() => markDoseAsTaken(item)}
            >
              {i18n.t('reminders.take_now')}
            </Button>
          ) : (
            <Text 
              category="caption1" 
              style={{ color: statusColor }}
            >
              {getDoseStatusText(item.status)}
            </Text>
          )
        )}
        style={styles.doseItem}
      />
    );
  };

  const renderCalendarView = () => (
    <View style={styles.calendarContainer}>
      <Calendar
        date={selectedDate}
        onSelect={setSelectedDate}
        style={styles.calendar}
      />
      
      <Card style={styles.dayScheduleCard}>
        <View style={styles.dayScheduleHeader}>
          <Text category="h6">
            {isToday(selectedDate) 
              ? i18n.t('days.today')
              : isTomorrow(selectedDate)
              ? i18n.t('days.tomorrow')
              : format(selectedDate, 'EEEE, MMMM do', { locale })
            }
          </Text>
          <Text category="s1" appearance="hint">
            {scheduledDoses.length} {i18n.getPluralForm(scheduledDoses.length, 'pill_counting.dose')}
          </Text>
        </View>
        
        {scheduledDoses.length > 0 ? (
          <FlatList
            data={scheduledDoses}
            renderItem={renderDoseItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            style={styles.dosesList}
          />
        ) : (
          <View style={styles.emptyDay}>
            <Text category="s1" appearance="hint">
              {i18n.t('schedule.no_schedules')}
            </Text>
          </View>
        )}
      </Card>
    </View>
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      <View style={styles.filterContainer}>
        <View style={styles.toggleContainer}>
          <Toggle
            checked={showActiveOnly}
            onChange={setShowActiveOnly}
          />
          <Text category="s1" style={styles.toggleText}>
            {i18n.t('schedule.active')}
          </Text>
        </View>
      </View>
      
      {schedules.length > 0 ? (
        <FlatList
          data={schedules.filter(s => showActiveOnly ? s.status === 'active' : true)}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[MedGuardColors.primary.trustBlue]}
              tintColor={MedGuardColors.primary.trustBlue}
            />
          }
          contentContainerStyle={styles.schedulesList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon
            name="calendar-outline"
            style={styles.emptyStateIcon}
            fill={MedGuardColors.extended.mediumGray}
          />
          <Text category="h6" style={styles.emptyStateTitle}>
            {i18n.t('schedule.no_schedules')}
          </Text>
          <Text category="s1" appearance="hint" style={styles.emptyStateDescription}>
            {i18n.t('schedule.create_first_schedule')}
          </Text>
          
          <Button
            style={styles.emptyStateButton}
            accessoryLeft={AddIcon}
            onPress={navigateToAddSchedule}
          >
            {i18n.t('schedule.add_schedule')}
          </Button>
        </View>
      )}
    </View>
  );

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
        title={i18n.t('schedule.title')}
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={viewMode === 'calendar' ? ListIcon : CalendarIcon}
            onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          />
        )}
        accessoryRight={() => (
          <TopNavigationAction
            icon={AddIcon}
            onPress={navigateToAddSchedule}
          />
        )}
      />

      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    flex: 1,
  },
  calendar: {
    margin: Spacing.md,
  },
  dayScheduleCard: {
    flex: 1,
    margin: Spacing.md,
    marginTop: 0,
  },
  dayScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: MedGuardColors.extended.borderGray,
  },
  dosesList: {
    flex: 1,
  },
  emptyDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  listContainer: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: MedGuardColors.extended.lightGray,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    marginLeft: Spacing.sm,
  },
  schedulesList: {
    paddingBottom: Spacing.xl,
  },
  scheduleItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  doseItem: {
    paddingVertical: Spacing.sm,
  },
  doseStatusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doseStatusIcon: {
    width: 16,
    height: 16,
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
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    minWidth: 200,
  },
});

export default ScheduleScreen;
