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
import intelligentStockService from '../services/intelligentStockService';

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
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);

  useEffect(() => {
    loadTodaySchedules();
    loadIntelligentStockData();
  }, []);

  const loadTodaySchedules = () => {
    const schedules = getTodaySchedules();
    setTodaySchedules(schedules);
  };

  const loadIntelligentStockData = async () => {
    try {
      const [analytics, alerts, expiring] = await Promise.all([
        intelligentStockService.getDashboardAnalytics(),
        intelligentStockService.getLowStockAlerts(),
        intelligentStockService.getExpiringSoonMedications(),
      ]);
      
      setDashboardAnalytics(analytics);
      setLowStockAlerts(alerts);
      setExpiringSoon(expiring);
    } catch (error) {
      console.error('Error loading intelligent stock data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadTodaySchedules();
    await loadIntelligentStockData();
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
          onPress: async () => {
            markDoseAsTaken(schedule.id);
            // Record dose taken for stock tracking
            try {
              await intelligentStockService.recordDoseTaken(schedule.medicationId);
            } catch (error) {
              console.error('Error recording dose:', error);
            }
            loadTodaySchedules();
            loadIntelligentStockData();
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
        return '#6B7280';
      default:
        return '#F59E0B';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return 'checkmark-circle';
      case 'missed':
        return 'close-circle';
      case 'skipped':
        return 'remove-circle';
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

  const renderIntelligentStockDashboard = () => {
    if (!dashboardAnalytics) return null;

    return (
      <View style={styles.dashboardSection}>
        <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.title')}</Text>
        
        <View style={styles.dashboardGrid}>
          <View style={styles.dashboardCard}>
            <Ionicons name="medical" size={24} color="#2563EB" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.totalMedications}</Text>
            <Text style={styles.dashboardLabel}>{t('medications.title')}</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.lowStockCount}</Text>
            <Text style={styles.dashboardLabel}>{t('notifications.lowStock')}</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.criticalStockCount}</Text>
            <Text style={styles.dashboardLabel}>{t('common.warning')}</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.averageConfidence}%</Text>
            <Text style={styles.dashboardLabel}>{t('medication.stockAnalytics.confidence')}</Text>
          </View>
        </View>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsTitle}>{t('notifications.lowStock')}</Text>
            {lowStockAlerts.slice(0, 3).map((alert, index) => {
              const medication = getMedicationById(alert.medicationId);
              return (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={() => navigation.navigate('MedicationDetails', { 
                    medicationId: alert.medicationId 
                  })}
                >
                  <Ionicons 
                    name="warning" 
                    size={20} 
                    color={alert.priority === 'critical' ? '#EF4444' : '#F59E0B'} 
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{medication?.name || 'Unknown'}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              );
            })}
            {lowStockAlerts.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  {t('common.view')} {lowStockAlerts.length - 3} {t('common.more')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Expiring Soon */}
        {expiringSoon.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsTitle}>{t('medication.stockAnalytics.warnings')}</Text>
            {expiringSoon.slice(0, 3).map((medication, index) => (
              <TouchableOpacity
                key={medication.id}
                style={styles.alertItem}
                onPress={() => navigation.navigate('MedicationDetails', { 
                  medicationId: medication.id 
                })}
              >
                <Ionicons name="time" size={20} color="#F59E0B" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{medication.name}</Text>
                  <Text style={styles.alertMessage}>
                    {t('medication.stockAnalytics.expiringSoon', { 
                      days: medication.daysUntilExpiration 
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
            {expiringSoon.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  {t('common.view')} {expiringSoon.length - 3} {t('common.more')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderScheduleItem = (schedule) => {
    const medication = getMedicationById(schedule.medicationId);
    if (!medication) return null;

    return (
      <View key={schedule.id} style={styles.scheduleItem}>
        <View style={styles.scheduleHeader}>
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.medicationDosage}>{medication.dosage}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons
              name={getStatusIcon(schedule.status)}
              size={24}
              color={getStatusColor(schedule.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(schedule.status) }]}>
              {t(`schedule.${schedule.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <View style={styles.timeContainer}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.timeText}>{formatTime(schedule.time)}</Text>
          </View>
          
          <View style={styles.stockContainer}>
            <Ionicons name="medical" size={16} color="#6B7280" />
            <Text style={styles.stockText}>
              {medication.stockQuantity} {t('stockLevels.stockCount', { count: medication.stockQuantity })}
            </Text>
            <View
              style={[
                styles.stockIndicator,
                { backgroundColor: getStockLevelColor(medication.stockLevel) },
              ]}
            />
          </View>
        </View>

        {schedule.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.takenButton]}
              onPress={() => handleMarkAsTaken(schedule)}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.takenButtonText}>{t('home.markAsTaken')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.missedButton]}
              onPress={() => handleMarkAsMissed(schedule)}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
              <Text style={styles.missedButtonText}>{t('home.markAsMissed')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => handleSkipDose(schedule)}
            >
              <Ionicons name="remove" size={16} color="#6B7280" />
              <Text style={styles.skipButtonText}>{t('home.skip')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {schedule.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>{schedule.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const groupSchedulesByStatus = () => {
    const grouped = {
      pending: [],
      taken: [],
      missed: [],
      skipped: [],
    };

    todaySchedules.forEach((schedule) => {
      if (grouped[schedule.status]) {
        grouped[schedule.status].push(schedule);
      }
    });

    return grouped;
  };

  const groupedSchedules = groupSchedulesByStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Intelligent Stock Dashboard */}
        {renderIntelligentStockDashboard()}

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>{t('home.title')}</Text>
          
          {todaySchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>{t('home.noMedications')}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddMedication')}
              >
                <Text style={styles.addButtonText}>{t('home.quickAdd')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Pending Schedules */}
              {groupedSchedules.pending.length > 0 && (
                <View style={styles.statusGroup}>
                  <Text style={styles.statusGroupTitle}>{t('home.upcoming')}</Text>
                  {groupedSchedules.pending.map(renderScheduleItem)}
                </View>
              )}

              {/* Taken Schedules */}
              {groupedSchedules.taken.length > 0 && (
                <View style={styles.statusGroup}>
                  <Text style={styles.statusGroupTitle}>{t('home.taken')}</Text>
                  {groupedSchedules.taken.map(renderScheduleItem)}
                </View>
              )}

              {/* Missed Schedules */}
              {groupedSchedules.missed.length > 0 && (
                <View style={styles.statusGroup}>
                  <Text style={styles.statusGroupTitle}>{t('home.missed')}</Text>
                  {groupedSchedules.missed.map(renderScheduleItem)}
                </View>
              )}

              {/* Skipped Schedules */}
              {groupedSchedules.skipped.length > 0 && (
                <View style={styles.statusGroup}>
                  <Text style={styles.statusGroupTitle}>{t('home.skip')}</Text>
                  {groupedSchedules.skipped.map(renderScheduleItem)}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  dashboardSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dashboardCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dashboardNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  dashboardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  alertsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  alertMessage: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  scheduleSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statusGroup: {
    marginBottom: 24,
  },
  statusGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  scheduleItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 16,
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
  statusText: {
    fontSize: 12,
    marginTop: 4,
  },
  scheduleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 8,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  takenButton: {
    backgroundColor: '#10B981',
  },
  takenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  missedButton: {
    backgroundColor: '#EF4444',
  },
  missedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default HomeScreen; 