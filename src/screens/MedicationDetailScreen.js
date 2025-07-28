import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMedication } from '../contexts/MedicationContext';
import { formatTime } from '../utils/scheduleUtils';
import { STOCK_LEVELS, MEDICATION_TYPES } from '../types';

const MedicationDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { medicationId } = route.params;
  const {
    getMedicationById,
    getSchedulesByMedicationId,
    updateMedication,
    deleteMedication,
    updateStockLevel,
  } = useMedication();

  const [medication, setMedication] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadMedicationData();
  }, [medicationId]);

  const loadMedicationData = () => {
    const med = getMedicationById(medicationId);
    if (med) {
      setMedication(med);
      setEditData({
        name: med.name,
        dosage: med.dosage,
        instructions: med.instructions,
      });
    }

    const medSchedules = getSchedulesByMedicationId(medicationId);
    setSchedules(medSchedules);
  };

  const handleSave = async () => {
    try {
      await updateMedication(medicationId, editData);
      setIsEditing(false);
      loadMedicationData();
      Alert.alert(t('success.medicationUpdated'), t('success.medicationUpdated'));
    } catch (error) {
      Alert.alert(t('errors.general'), error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('alerts.deleteMedication'),
      t('alerts.deleteMedicationMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medicationId);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('errors.general'), error.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStock = () => {
    Alert.prompt(
      t('medicationForm.stockQuantity'),
      t('medicationForm.stockQuantity'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async (quantity) => {
            const newQuantity = parseInt(quantity);
            if (!isNaN(newQuantity) && newQuantity >= 0) {
              await updateStockLevel(medicationId, newQuantity);
              loadMedicationData();
            }
          },
        },
      ],
      'plain-text',
      medication?.stockQuantity.toString()
    );
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

  const getStockLevelText = (stockLevel) => {
    return t(`stockLevels.${stockLevel}`);
  };

  const getMedicationTypeIcon = (type) => {
    switch (type) {
      case MEDICATION_TYPES.TABLET:
        return 'medical';
      case MEDICATION_TYPES.CAPSULE:
        return 'ellipse';
      case MEDICATION_TYPES.LIQUID:
        return 'water';
      case MEDICATION_TYPES.INJECTION:
        return 'medical-outline';
      case MEDICATION_TYPES.INHALER:
        return 'airplane';
      case MEDICATION_TYPES.CREAM:
        return 'color-palette';
      case MEDICATION_TYPES.DROPS:
        return 'water-outline';
      default:
        return 'medical-outline';
    }
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

  const renderScheduleItem = (schedule) => {
    const statusColor = getStatusColor(schedule.status);
    const statusIcon = getStatusIcon(schedule.status);
    const date = new Date(schedule.date);
    const formattedDate = date.toLocaleDateString();

    return (
      <View key={schedule.id} style={styles.scheduleItem}>
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleDate}>{formattedDate}</Text>
            <Text style={styles.scheduleTime}>{formatTime(schedule.time)}</Text>
          </View>
          <Ionicons name={statusIcon} size={24} color={statusColor} />
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
    );
  };

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockColor = getStockLevelColor(medication.stockLevel);
  const stockText = getStockLevelText(medication.stockLevel);
  const typeIcon = getMedicationTypeIcon(medication.type);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.medicationHeader}>
            <View style={styles.medicationInfo}>
              <View style={styles.nameContainer}>
                <Ionicons name={typeIcon} size={24} color="#6B7280" style={styles.typeIcon} />
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editData.name}
                    onChangeText={(value) => setEditData(prev => ({ ...prev, name: value }))}
                    placeholder={t('medicationForm.namePlaceholder')}
                  />
                ) : (
                  <Text style={styles.medicationName}>{medication.name}</Text>
                )}
              </View>
              <Text style={styles.medicationType}>{t(`medicationTypes.${medication.type}`)}</Text>
            </View>
            <View style={styles.stockContainer}>
              <View style={[styles.stockIndicator, { backgroundColor: stockColor }]} />
              <Text style={[styles.stockText, { color: stockColor }]}>{stockText}</Text>
              <Text style={styles.stockQuantity}>{medication.stockQuantity}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUpdateStock}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              <Text style={styles.actionButtonText}>{t('common.add')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name="pencil" size={20} color="#6B7280" />
              <Text style={styles.actionButtonText}>
                {isEditing ? t('common.cancel') : t('common.edit')}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSave}
              >
                <Ionicons name="checkmark" size={20} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                  {t('common.save')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                {t('common.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medicationForm.dosage')}</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editData.dosage}
              onChangeText={(value) => setEditData(prev => ({ ...prev, dosage: value }))}
              placeholder={t('medicationForm.dosagePlaceholder')}
            />
          ) : (
            <Text style={styles.sectionContent}>{medication.dosage}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medicationForm.instructions')}</Text>
          {isEditing ? (
            <TextInput
              style={[styles.editInput, styles.textArea]}
              value={editData.instructions}
              onChangeText={(value) => setEditData(prev => ({ ...prev, instructions: value }))}
              placeholder={t('medicationForm.instructionsPlaceholder')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.sectionContent}>
              {medication.instructions || t('common.noInstructions')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medications.frequency')}</Text>
          <Text style={styles.sectionContent}>
            {t(`frequencies.${medication.frequency}`)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medicationForm.times')}</Text>
          <View style={styles.timesContainer}>
            {medication.times.map((time, index) => (
              <View key={index} style={styles.timeItem}>
                <Text style={styles.timeText}>{formatTime(time)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medications.stock')}</Text>
          <View style={styles.stockInfo}>
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>{t('medicationForm.stockQuantity')}:</Text>
              <Text style={styles.stockValue}>{medication.stockQuantity}</Text>
            </View>
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>{t('medications.stock')}:</Text>
              <Text style={[styles.stockValue, { color: stockColor }]}>{stockText}</Text>
            </View>
            {medication.refillReminder && (
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>{t('medicationForm.refillQuantity')}:</Text>
                <Text style={styles.stockValue}>{medication.refillQuantity}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('schedule.thisWeek')}</Text>
          {schedules.length > 0 ? (
            schedules.slice(0, 10).map(renderScheduleItem)
          ) : (
            <Text style={styles.emptyText}>{t('home.noMedications')}</Text>
          )}
        </View>
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
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    marginRight: 8,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  medicationType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  stockContainer: {
    alignItems: 'center',
  },
  stockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  stockQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  stockInfo: {
    gap: 8,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  scheduleItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  scheduleTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  takenAtText: {
    fontSize: 12,
    color: '#10B981',
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MedicationDetailScreen; 