/**
 * MedGuard SA - Memoized Medication Card Component
 * Optimized for FlatList performance with React.memo and useMemo
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ListItem,
  Text,
  Avatar,
  Icon,
} from '@ui-kitten/components';

// Utils and services
import { formatMedicationDate } from '../../utils/dateUtils';
import { MedGuardColors } from '../../theme/colors';
import i18n from '../../i18n';

// Types
interface Medication {
  id: number;
  name: string;
  genericName?: string;
  strength: string;
  medicationType: string;
  prescriptionType: string;
  pillCount: number;
  lowStockThreshold: number;
  description?: string;
  manufacturer?: string;
  medicationImage?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface MedicationCardProps {
  medication: Medication;
  index?: number;
  onPress: (medicationId: number) => void;
}

/**
 * Memoized medication card component for optimized FlatList rendering
 */
const MedicationCard: React.FC<MedicationCardProps> = memo(({ 
  medication, 
  index, 
  onPress 
}) => {
  // Memoize expensive calculations
  const formattedDate = useMemo(() => 
    formatMedicationDate(medication.expirationDate), 
    [medication.expirationDate]
  );

  const statusColor = useMemo(() => {
    if (medication.expirationDate) {
      const now = new Date();
      const expiryDate = new Date(medication.expirationDate);
      
      if (now > expiryDate) {
        return MedGuardColors.alerts.criticalRed; // Expired
      }
      
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) {
        return MedGuardColors.alerts.warningAmber; // Expiring soon
      }
    }
    
    if (medication.pillCount <= medication.lowStockThreshold) {
      return MedGuardColors.alerts.warningAmber; // Low stock
    }
    
    return MedGuardColors.alerts.successGreen; // Normal
  }, [medication.expirationDate, medication.pillCount, medication.lowStockThreshold]);

  const statusText = useMemo(() => {
    if (formattedDate) {
      return `${medication.strength} - ${formattedDate}`;
    }
    
    if (medication.pillCount <= medication.lowStockThreshold) {
      return `${medication.strength} - ${i18n.t('medications.low_stock')}`;
    }
    
    const pillCountText = i18n.getPluralForm(medication.pillCount, 'pill_counting.pill');
    return `${medication.strength} - ${pillCountText}`;
  }, [medication.strength, formattedDate, medication.pillCount, medication.lowStockThreshold]);

  const handlePress = useMemo(() => 
    () => onPress(medication.id), 
    [medication.id, onPress]
  );

  return (
    <ListItem
      title={medication.name}
      description={statusText}
      accessoryLeft={() => (
        <Avatar
          source={medication.medicationImage ? { uri: medication.medicationImage } : undefined}
          style={[styles.medicationAvatar, { backgroundColor: statusColor }]}
        />
      )}
      accessoryRight={() => (
        <View style={styles.medicationMeta}>
          <Text category="caption1" appearance="hint">
            {i18n.formatNumber(medication.pillCount)}
          </Text>
          <Icon
            name="chevron-right"
            style={styles.chevronIcon}
            fill={MedGuardColors.extended.mediumGray}
          />
        </View>
      )}
      onPress={handlePress}
      style={styles.medicationItem}
    />
  );
});

// Display name for debugging
MedicationCard.displayName = 'MedicationCard';

const styles = StyleSheet.create({
  medicationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  medicationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  medicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronIcon: {
    width: 16,
    height: 16,
  },
});

export default MedicationCard;
