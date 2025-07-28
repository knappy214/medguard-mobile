import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const MedicationCard = ({ 
  medication, 
  onPress, 
  onUpdateStock, 
  onDelete,
  showActions = true 
}) => {
  const { t } = useTranslation();

  const getStockColor = (level) => {
    switch (level) {
      case 'low': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'high': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStockText = (level) => {
    switch (level) {
      case 'low': return t('stock.low');
      case 'medium': return t('stock.medium');
      case 'high': return t('stock.high');
      default: return t('stock.unknown');
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{medication.name}</Text>
          <Text style={styles.type}>{t(`medication.types.${medication.type}`)}</Text>
        </View>
        <View style={styles.stockContainer}>
          <View style={[styles.stockIndicator, { backgroundColor: getStockColor(medication.stockLevel) }]} />
          <Text style={styles.stockText}>{getStockText(medication.stockLevel)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.dosage}>
          {medication.dosage} {medication.unit}
        </Text>
        <Text style={styles.frequency}>
          {t(`frequency.${medication.frequency}`)}
        </Text>
      </View>

      {medication.instructions && (
        <Text style={styles.instructions} numberOfLines={2}>
          {medication.instructions}
        </Text>
      )}

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.updateButton]} 
            onPress={() => onUpdateStock(medication.id)}
          >
            <Ionicons name="refresh" size={16} color="#2563EB" />
            <Text style={styles.updateButtonText}>{t('actions.updateStock')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => onDelete(medication.id)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={styles.deleteButtonText}>{t('actions.delete')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
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
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  type: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dosage: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  frequency: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructions: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  updateButton: {
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  updateButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
});

export default MedicationCard; 