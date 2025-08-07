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
  Spinner,
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

// Components
import { ScheduleCard, DoseCard } from '../../components/schedule/ScheduleCard';

// Types
import { MedicationSchedule, ScheduledDose } from '../../types/schedule';

const { width: screenWidth } = Dimensions.get('window');

// Icon components
const AddIcon = (props: IconProps) => <Icon {...props} name='plus-outline' />;
const CalendarIcon = (props: IconProps) => <Icon {...props} name='calendar-outline' />;
const ListIcon = (props: IconProps) => <Icon {...props} name='list-outline' />;
const ClockIcon = (props: IconProps) => <Icon {...props} name='clock-outline' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-circle-2-outline' />;
const AlertIcon = (props: IconProps) => <Icon {...props} name='alert-circle-outline' />;
const EditIcon = (props: IconProps) => <Icon {...props} name='edit-outline' />;

// Performance optimization constants
const SCHEDULES_PER_PAGE = 15;
const DOSES_PER_PAGE = 20;

const ScheduleScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  
  // Pagination state
  const [currentSchedulePage, setCurrentSchedulePage] = useState(1);
  const [currentDosePage, setCurrentDosePage] = useState(1);
  const [loadingMoreSchedules, setLoadingMoreSchedules] = useState(false);
  const [loadingMoreDoses, setLoadingMoreDoses] = useState(false);

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
    // Reset pagination when doses change
    setCurrentDosePage(1);
  }, [schedules, selectedDate, showActiveOnly]);

  // Memoized pagination for large datasets
  const paginatedSchedules = useMemo(() => 
    schedules.slice(0, currentSchedulePage * SCHEDULES_PER_PAGE), 
    [schedules, currentSchedulePage]
  );

  const paginatedDoses = useMemo(() => 
    scheduledDoses.slice(0, currentDosePage * DOSES_PER_PAGE), 
    [scheduledDoses, currentDosePage]
  );

  const hasMoreSchedules = useMemo(() => 
    schedules.length > currentSchedulePage * SCHEDULES_PER_PAGE,
    [schedules.length, currentSchedulePage]
  );

  const hasMoreDoses = useMemo(() => 
    scheduledDoses.length > currentDosePage * DOSES_PER_PAGE,
    [scheduledDoses.length, currentDosePage]
  );

  const loadMoreSchedules = useCallback(() => {
    if (!loadingMoreSchedules && hasMoreSchedules) {
      setLoadingMoreSchedules(true);
      setTimeout(() => {
        setCurrentSchedulePage(prev => prev + 1);
        setLoadingMoreSchedules(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    }
  }, [loadingMoreSchedules, hasMoreSchedules]);

  const loadMoreDoses = useCallback(() => {
    if (!loadingMoreDoses && hasMoreDoses) {
      setLoadingMoreDoses(true);
      setTimeout(() => {
        setCurrentDosePage(prev => prev + 1);
        setLoadingMoreDoses(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    }
  }, [loadingMoreDoses, hasMoreDoses]);

  const markDoseAsTaken = useCallback(async (dose: ScheduledDose) => {
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
  }, []);

  const navigateToAddSchedule = useCallback(() => {
    navigation.navigate('AddSchedule');
  }, [navigation]);

  const navigateToEditSchedule = useCallback((scheduleId: number) => {
    navigation.navigate('EditSchedule', { scheduleId });
  }, [navigation]);

  // Note: Status color and text logic moved to ScheduleCard and DoseCard components for better performance

  // Optimized render function with useCallback for better FlatList performance
  const renderScheduleItem = useCallback(({ item, index }: { item: MedicationSchedule; index: number }) => (
    <ScheduleCard 
      key={item.id}
      item={item}
      index={index}
      onPress={navigateToEditSchedule}
    />
  ), [navigateToEditSchedule]);

  // Optimized render function with useCallback for better FlatList performance
  const renderDoseItem = useCallback(({ item, index }: { item: ScheduledDose; index: number }) => (
    <DoseCard 
      key={item.id}
      item={item}
      index={index}
      onMarkTaken={markDoseAsTaken}
    />
  ), [markDoseAsTaken]);

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
            data={paginatedDoses}
            renderItem={renderDoseItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            onEndReached={loadMoreDoses}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              if (loadingMoreDoses) {
                return (
                  <View style={styles.loadingMoreContainer}>
                    <Spinner size="small" />
                    <Text category="caption1" appearance="hint" style={styles.loadingMoreText}>
                      {i18n.t('common.loading_more')}
                    </Text>
                  </View>
                );
              }
              return null;
            }}
            style={styles.dosesList}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={8}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate item height
              offset: 80 * index,
              index,
            })}
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
          data={paginatedSchedules.filter(s => showActiveOnly ? s.status === 'active' : true)}
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
          onEndReached={loadMoreSchedules}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (loadingMoreSchedules) {
              return (
                <View style={styles.loadingMoreContainer}>
                  <Spinner size="small" />
                  <Text category="caption1" appearance="hint" style={styles.loadingMoreText}>
                    {i18n.t('common.loading_more')}
                  </Text>
                </View>
              );
            }
            return null;
          }}
          contentContainerStyle={styles.schedulesList}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={12}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 75, // Approximate item height
            offset: 75 * index,
            index,
          })}
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
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    marginLeft: 8,
  },
  // Note: Schedule and dose item styles moved to ScheduleCard and DoseCard components
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
