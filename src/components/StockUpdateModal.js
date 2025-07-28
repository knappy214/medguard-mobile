import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const StockUpdateModal = ({ 
  visible, 
  medication, 
  onClose, 
  onUpdate 
}) => {
  const { t } = useTranslation();
  const [stockLevel, setStockLevel] = useState(medication?.stockLevel || 'medium');
  const [quantity, setQuantity] = useState(medication?.stockQuantity?.toString() || '');

  const handleUpdate = () => {
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
      Alert.alert(
        t('stock.error.title'),
        t('stock.error.invalidQuantity'),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }

    onUpdate({
      stockLevel,
      stockQuantity: parseInt(quantity),
    });
    onClose();
  };

  const getStockLevelColor = (level) => {
    switch (level) {
      case 'low': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'high': return '#10B981';
      default: return '#6B7280';
    }
  };

  const stockLevels = [
    { value: 'low', label: t('stock.low'), color: '#EF4444' },
    { value: 'medium', label: t('stock.medium'), color: '#F59E0B' },
    { value: 'high', label: t('stock.high'), color: '#10B981' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('stock.updateTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {medication && (
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDosage}>
                {medication.dosage} {medication.unit}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('stock.level')}</Text>
            <View style={styles.stockLevelContainer}>
              {stockLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.stockLevelButton,
                    stockLevel === level.value && {
                      backgroundColor: level.color + '20',
                      borderColor: level.color,
                    },
                  ]}
                  onPress={() => setStockLevel(level.value)}
                >
                  <View
                    style={[
                      styles.stockIndicator,
                      { backgroundColor: level.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stockLevelText,
                      stockLevel === level.value && { color: level.color },
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('stock.quantity')}</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder={t('stock.quantityPlaceholder')}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <Text style={styles.updateButtonText}>{t('common.update')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  medicationInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  stockLevelContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  stockLevelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  stockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stockLevelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  updateButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default StockUpdateModal; 