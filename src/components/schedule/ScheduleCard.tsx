/**
 * MedGuard SA - Memoized Schedule Card Component
 * Optimized for FlatList performance with React.memo and useMemo
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ListItem,
  Text,
  Button,
  Icon,
} from '@ui-kitten/components';
import { format } from 'date-fns';
import { enZA, af } from 'date-fns/locale';

// Utils and services
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';
import i18n from '../../i18n';

// Types
import { MedicationSchedule, ScheduledDose } from '../../types/schedule';

interface ScheduleCardProps {
  item: MedicationSchedule;
  index?: number;
  onPress: (scheduleId: number) => void;
}

interface DoseCardProps {
  item: ScheduledDose;
  index?: number;
  onMarkTaken: (dose: ScheduledDose) => Promise<void>;
}

const EditIcon = (props: any) => <Icon {...props} name='edit-outline' />;
const CheckIcon = (props: any) => <Icon {...props} name='checkmark-circle-2-outline' />;

/**
 * Memoized schedule card component for optimized FlatList rendering
 */
export const ScheduleCard: React.FC<ScheduleCardProps> = memo(({ 
  item, 
  index, 
  onPress 
}) => {
  // Memoize active days calculation
  const activeDays = useMemo(() => {
    const days = [
      item.monday && 'Mon',
      item.tuesday && 'Tue', 
      item.wednesday && 'Wed',
      item.thursday && 'Thu',
      item.friday && 'Fri',
      item.saturday && 'Sat',
      item.sunday && 'Sun',
    ].filter(Boolean);
    return days.join(', ');
  }, [item.monday, item.tuesday, item.wednesday, item.thursday, item.friday, item.saturday, item.sunday]);

  const statusColor = useMemo(() => 
    item.status === 'active' 
      ? MedGuardColors.alerts.successGreen 
      : MedGuardColors.extended.mediumGray,
    [item.status]
  );

  const handlePress = useMemo(() => 
    () => onPress(item.id), 
    [item.id, onPress]
  );

  return (
    <ListItem
      title={item.medication.name}
      description={`${item.dosageAmount} - ${item.frequency}\n${activeDays}`}
      accessoryLeft={() => (
        <View style={[
          styles.statusIndicator,
          { backgroundColor: statusColor }
        ]} />
      )}
      accessoryRight={() => (
        <Button
          size="tiny"
          appearance="ghost"
          accessoryLeft={EditIcon}
          onPress={handlePress}
        />
      )}
      onPress={handlePress}
      style={styles.scheduleItem}
    />
  );
});

/**
 * Memoized dose card component for optimized FlatList rendering
 */
export const DoseCard: React.FC<DoseCardProps> = memo(({ 
  item, 
  index, 
  onMarkTaken 
}) => {
  const locale = i18n.getCurrentLanguage() === 'af' ? af : enZA;

  const statusColor = useMemo(() => {
    switch (item.status) {
      case 'taken': return MedGuardColors.alerts.successGreen;
      case 'upcoming': return MedGuardColors.primary.trustBlue;
      case 'overdue': return MedGuardColors.alerts.criticalRed;
      case 'missed': return MedGuardColors.alerts.warningAmber;
      default: return MedGuardColors.extended.mediumGray;
    }
  }, [item.status]);

  const statusText = useMemo(() => {
    switch (item.status) {
      case 'taken': return i18n.t('schedule.taken_today');
      case 'upcoming': return i18n.t('schedule.upcoming_doses');
      case 'overdue': return i18n.t('reminders.overdue_medication');
      case 'missed': return i18n.t('schedule.missed_doses');
      default: return '';
    }
  }, [item.status]);

  const timeText = useMemo(() => 
    format(item.scheduledTime, 'HH:mm', { locale }), 
    [item.scheduledTime, locale]
  );

  const description = useMemo(() => 
    `${item.dosageAmount} at ${timeText}${item.instructions ? `\n${item.instructions}` : ''}`,
    [item.dosageAmount, timeText, item.instructions]
  );

  const handleMarkTaken = useMemo(() => 
    () => onMarkTaken(item), 
    [item, onMarkTaken]
  );

  return (
    <ListItem
      title={item.medicationName}
      description={description}
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
            onPress={handleMarkTaken}
          >
            {i18n.t('reminders.take_now')}
          </Button>
        ) : (
          <Text 
            category="caption1" 
            style={{ color: statusColor }}
          >
            {statusText}
          </Text>
        )
      )}
      style={styles.doseItem}
    />
  );
});

// Display names for debugging
ScheduleCard.displayName = 'ScheduleCard';
DoseCard.displayName = 'DoseCard';

const styles = StyleSheet.create({
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  doseStatusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  doseStatusIcon: {
    width: 20,
    height: 20,
  },
});

export default ScheduleCard;
