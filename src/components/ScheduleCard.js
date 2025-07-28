import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatTime, getTimePeriod } from '../utils/scheduleUtils';

const ScheduleCard = ({ 
  schedule, 
  medication, 
  onMarkTaken, 
  onMarkMissed, 
  onMarkSkipped 
}) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken': return '#10B981';
      case 'missed': return '#EF4444';
      case 'skipped': return '#F59E0B';
      case 'upcoming': return '#2563EB';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken': return 'checkmark-circle';
      case 'missed': return 'close-circle';
      case 'skipped': return 'remove-circle';
      case 'upcoming': return 'time';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'taken': return t('schedule.status.taken');
      case 'missed': return t('schedule.status.missed');
      case 'skipped': return t('schedule.status.skipped');
      case 'upcoming': return t('schedule.status.upcoming');
      default: return t('schedule.status.unknown');
    }
  };

  const isActionable = schedule.status === 'upcoming';

  return (
    <View style={[styles.card, { borderLeftColor: getStatusColor(schedule.status) }]}>
      <View style={styles.header}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.dosage}>
            {medication.dosage} {medication.unit}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(schedule.status)} 
            size={20} 
            color={getStatusColor(schedule.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(schedule.status) }]}>
            {getStatusText(schedule.status)}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Ionicons name="time-outline" size={16} color="#6B7280" />
        <Text style={styles.timeText}>
          {formatTime(schedule.scheduledTime)} ({getTimePeriod(schedule.scheduledTime)})
        </Text>
      </View>

      {medication.instructions && (
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.instructions} numberOfLines={2}>
            {medication.instructions}
          </Text>
        </View>
      )}

      {isActionable && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.takenButton]} 
            onPress={() => onMarkTaken(schedule.id)}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.takenButtonText}>{t('schedule.actions.taken')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.missedButton]} 
            onPress={() => onMarkMissed(schedule.id)}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.missedButtonText}>{t('schedule.actions.missed')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.skippedButton]} 
            onPress={() => onMarkSkipped(schedule.id)}
          >
            <Ionicons name="remove" size={16} color="#FFFFFF" />
            <Text style={styles.skippedButtonText}>{t('schedule.actions.skipped')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  dosage: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  instructions: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  takenButton: {
    backgroundColor: '#10B981',
  },
  missedButton: {
    backgroundColor: '#EF4444',
  },
  skippedButton: {
    backgroundColor: '#F59E0B',
  },
  takenButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  missedButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  skippedButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ScheduleCard; 