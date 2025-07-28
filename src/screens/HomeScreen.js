import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMedication } from '../contexts/MedicationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime, getTimePeriod } from '../utils/scheduleUtils';
import { STOCK_LEVELS } from '../types';

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const {
    getTodaySchedules,
    getMedicationById,
    markDoseAsTaken,
    markDoseAsMissed,
    skipDose,
    isLoading,
  } = useMedication();

  const [todaySchedules, setTodaySchedules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTodaySchedules();
  }, []);

  const loadTodaySchedules = () => {
    const schedules = getTodaySchedules();
    setTodaySchedules(schedules);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTodaySchedules();
    setRefreshing(false);
  };

  const handleMarkAsTaken = (schedule) => {
    Alert.alert(
      t('alerts.markAsTaken'),
      t('alerts.markAsTakenMessage', {
        medication: getMedicationById(schedule.medicationId)?.name || '',
        time: formatTime(schedule.time),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            markDoseAsTaken(schedule.id);
            loadTodaySchedules();
          },
        },
      ]
    );
  };

  const handleMarkAsMissed = (schedule) => {
    Alert.alert(
      t('alerts.markAsMissed'),
      t('alerts.markAsMissedMessage', {
        medication: getMedicationById(schedule.medicationId)?.name || '',
        time: formatTime(schedule.time),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            markDoseAsMissed(schedule.id);
            loadTodaySchedules();
          },
        },
      ]
    );
  };

  const handleSkipDose = (schedule) => {
    Alert.alert(
      t('alerts.skipDose'),
      t('alerts.skipDoseMessage', {
        medication: getMedicationById(schedule.medicationId)?.name || '',
        time: formatTime(schedule.time),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            skipDose(schedule.id);
            loadTodaySchedules();
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken':
        return '#10B981';
      case 'missed':
        return '#EF4444';
      case 'skipped':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return 'checkmark-circle';
      case 'missed':
        return 'close-circle';
      case 'skipped':
        return 'pause-circle';
      default:
        return 'time';
    }
  };

  const getStockLevelColor = (stockLevel) => {
    switch (stockLevel) {
      case STOCK_LEVELS.FULL:
        return '#10B981';
      case STOCK_LEVELS.MEDIUM:
        return '#F59E0B';
      case STOCK_LEVELS.LOW:
        return '#EF4444';
      case STOCK_LEVELS.EMPTY:
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const renderScheduleItem = (schedule) => {
    const medication = getMedicationById(schedule.medicationId);
    if (!medication) return null;

    const statusColor = getStatusColor(schedule.status);
    const statusIcon = getStatusIcon(schedule.status);
    const stockColor = getStockLevelColor(medication.stockLevel);

    return (
      <View key={schedule.id} style={styles.scheduleItem}>
        <View style={styles.scheduleHeader}>
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationDosage}>{medication.dosage}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name={statusIcon} size={24} color={statusColor} />
            <View style={[styles.stockIndicator, { backgroundColor: stockColor }]} />
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.timeText}>{formatTime(schedule.time)}</Text>
          </View>

          {schedule.status === 'taken' && schedule.takenAt && (
            <Text style={styles.takenAtText}>
              {t('home.taken')} at {formatTime(schedule.takenAt.toTimeString().slice(0, 5))}
            </Text>
          )}

          {schedule.notes && (
            <Text style={styles.notesText}>{schedule.notes}</Text>
          )}
        </View>

        {schedule.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.takenButton]}
              onPress={() => handleMarkAsTaken(schedule)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>{t('home.markAsTaken')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.missedButton]}
              onPress={() => handleMarkAsMissed(schedule)}
            >
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>{t('home.markAsMissed')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => handleSkipDose(schedule)}
            >
              <Ionicons name="pause" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>{t('home.skip')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const groupSchedulesByStatus = () => {
    const grouped = {
      upcoming: [],
      taken: [],
      missed: [],
      skipped: [],
    };

    todaySchedules.forEach(schedule => {
      grouped[schedule.status].push(schedule);
    });

    return grouped;
  };

  const groupedSchedules = groupSchedulesByStatus();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedication')}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {todaySchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>{t('home.noMedications')}</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('AddMedication')}
            >
              <Text style={styles.addFirstButtonText}>{t('home.quickAdd')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {groupedSchedules.upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('home.upcoming')}</Text>
                {groupedSchedules.upcoming.map(renderScheduleItem)}
              </View>
            )}

            {groupedSchedules.taken.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('home.taken')}</Text>
                {groupedSchedules.taken.map(renderScheduleItem)}
              </View>
            )}

            {groupedSchedules.missed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('home.missed')}</Text>
                {groupedSchedules.missed.map(renderScheduleItem)}
              </View>
            )}

            {groupedSchedules.skipped.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('schedule.skipped')}</Text>
                {groupedSchedules.skipped.map(renderScheduleItem)}
              </View>
            )}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  scheduleItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'center',
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  scheduleDetails: {
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  takenAtText: {
    fontSize: 14,
    color: '#10B981',
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  takenButton: {
    backgroundColor: '#10B981',
  },
  missedButton: {
    backgroundColor: '#EF4444',
  },
  skipButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default HomeScreen; 