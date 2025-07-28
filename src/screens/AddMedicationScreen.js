import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMedication } from '../contexts/MedicationContext';
import {
  MEDICATION_TYPES,
  FREQUENCY_TYPES,
  TIME_PERIODS,
  createMedication,
} from '../types';

const AddMedicationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { addMedication } = useMedication();

  const [formData, setFormData] = useState({
    name: '',
    type: MEDICATION_TYPES.TABLET,
    dosage: '',
    frequency: FREQUENCY_TYPES.DAILY,
    times: ['08:00'],
    instructions: '',
    stockQuantity: 30,
    refillReminder: false,
    refillQuantity: 7,
    startDate: new Date(),
    endDate: null,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = t('errors.required');
    }

    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = t('errors.invalidQuantity');
    }

    if (formData.refillReminder && formData.refillQuantity < 0) {
      newErrors.refillQuantity = t('errors.invalidQuantity');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(t('errors.validation'), t('errors.validation'));
      return;
    }

    try {
      await addMedication(formData);
      Alert.alert(t('success.medicationAdded'), t('success.medicationAdded'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(t('errors.general'), error.message);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addTime = () => {
    if (formData.times.length < 4) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, '12:00'],
      }));
    }
  };

  const removeTime = (index) => {
    if (formData.times.length > 1) {
      setFormData(prev => ({
        ...prev,
        times: prev.times.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTime = (index, value) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.map((time, i) => (i === index ? value : time)),
    }));
  };

  const renderTimeInput = (time, index) => (
    <View key={index} style={styles.timeInputContainer}>
      <TextInput
        style={styles.timeInput}
        value={time}
        onChangeText={(value) => updateTime(index, value)}
        placeholder="HH:MM"
        placeholderTextColor="#9CA3AF"
      />
      {formData.times.length > 1 && (
        <TouchableOpacity
          style={styles.removeTimeButton}
          onPress={() => removeTime(index)}
        >
          <Ionicons name="close-circle" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSection(t('medicationForm.name'), (
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder={t('medicationForm.namePlaceholder')}
            placeholderTextColor="#9CA3AF"
          />
        ))}

        {renderSection(t('medicationForm.type'), (
          <View style={styles.optionsContainer}>
            {Object.values(MEDICATION_TYPES).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  formData.type === type && styles.selectedOptionButton,
                ]}
                onPress={() => updateFormData('type', type)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    formData.type === type && styles.selectedOptionButtonText,
                  ]}
                >
                  {t(`medicationTypes.${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {renderSection(t('medicationForm.dosage'), (
          <TextInput
            style={[styles.input, errors.dosage && styles.inputError]}
            value={formData.dosage}
            onChangeText={(value) => updateFormData('dosage', value)}
            placeholder={t('medicationForm.dosagePlaceholder')}
            placeholderTextColor="#9CA3AF"
          />
        ))}

        {renderSection(t('medicationForm.frequency'), (
          <View style={styles.optionsContainer}>
            {Object.values(FREQUENCY_TYPES).map((frequency) => (
              <TouchableOpacity
                key={frequency}
                style={[
                  styles.optionButton,
                  formData.frequency === frequency && styles.selectedOptionButton,
                ]}
                onPress={() => updateFormData('frequency', frequency)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    formData.frequency === frequency && styles.selectedOptionButtonText,
                  ]}
                >
                  {t(`frequencies.${frequency}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {renderSection(t('medicationForm.times'), (
          <View>
            {formData.times.map(renderTimeInput)}
            {formData.times.length < 4 && (
              <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
                <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
                <Text style={styles.addTimeButtonText}>{t('medicationForm.addTime')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {renderSection(t('medicationForm.instructions'), (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.instructions}
            onChangeText={(value) => updateFormData('instructions', value)}
            placeholder={t('medicationForm.instructionsPlaceholder')}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        ))}

        {renderSection(t('medicationForm.stockQuantity'), (
          <TextInput
            style={[styles.input, errors.stockQuantity && styles.inputError]}
            value={formData.stockQuantity.toString()}
            onChangeText={(value) => updateFormData('stockQuantity', parseInt(value) || 0)}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        ))}

        {renderSection(t('medicationForm.refillReminder'), (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{t('medicationForm.refillReminder')}</Text>
            <Switch
              value={formData.refillReminder}
              onValueChange={(value) => updateFormData('refillReminder', value)}
              trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
              thumbColor="#fff"
            />
          </View>
        ))}

        {formData.refillReminder &&
          renderSection(t('medicationForm.refillQuantity'), (
            <TextInput
              style={[styles.input, errors.refillQuantity && styles.inputError]}
              value={formData.refillQuantity.toString()}
              onChangeText={(value) => updateFormData('refillQuantity', parseInt(value) || 0)}
              placeholder="7"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 80,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedOptionButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: '#fff',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  removeTimeButton: {
    padding: 4,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addTimeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AddMedicationScreen; 