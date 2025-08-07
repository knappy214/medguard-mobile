
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Input,
  Icon,
  IconProps,
  Select,
  SelectItem,
  IndexPath,
  Toggle,
  Datepicker,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import apiService from '../../services/apiService';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';
import i18n from '../../i18n';

const BackIcon = (props: IconProps) => <Icon {...props} name='arrow-back' />;
const SaveIcon = (props: IconProps) => <Icon {...props} name='checkmark-outline' />;
const ClockIcon = (props: IconProps) => <Icon {...props} name='clock-outline' />;

interface Medication {
  id: number;
  name: string;
  strength: string;
}

const AddScheduleScreen: React.FC = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { medicationId } = route.params || {};
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState(new IndexPath(0));
  const [selectedTiming, setSelectedTiming] = useState(new IndexPath(0));
  const [selectedFrequency, setSelectedFrequency] = useState(new IndexPath(0));
  const [customTime, setCustomTime] = useState('08:00');
  const [dosageAmount, setDosageAmount] = useState('');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Days of the week toggles
  const [monday, setMonday] = useState(true);
  const [tuesday, setTuesday] = useState(true);
  const [wednesday, setWednesday] = useState(true);
  const [thursday, setThursday] = useState(true);
  const [friday, setFriday] = useState(true);
  const [saturday, setSaturday] = useState(true);
  const [sunday, setSunday] = useState(true);

  const timingOptions = [
    i18n.t('schedule.morning'),
    i18n.t('schedule.noon'),
    i18n.t('schedule.night'),
    i18n.t('schedule.custom'),
  ];

  const frequencyOptions = [
    i18n.t('schedule.daily'),
    i18n.t('schedule.twice_daily'),
    i18n.t('schedule.three_times_daily'),
    i18n.t('schedule.weekly'),
    i18n.t('schedule.as_needed'),
  ];

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    if (medicationId && medications.length > 0) {
      const index = medications.findIndex(med => med.id === medicationId);
      if (index >= 0) {
        setSelectedMedication(new IndexPath(index));
      }
    }
  }, [medicationId, medications]);

  const loadMedications = async () => {
    try {
      const medicationsData = await apiService.getMedications();
      setMedications(medicationsData);
    } catch (error) {
      console.error('Load medications error:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.network_error'));
    }
  };

  const handleSave = async () => {
    if (!dosageAmount) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.validation_error'));
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const scheduleData = {
        medication: medications[selectedMedication.row]?.id,
        timing: selectedTiming.row === 3 ? 'custom' : 
                selectedTiming.row === 0 ? 'morning' :
                selectedTiming.row === 1 ? 'noon' : 'night',
        customTime: selectedTiming.row === 3 ? customTime : undefined,
        dosageAmount: dosageAmount.trim(),
        frequency: frequencyOptions[selectedFrequency.row],
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString() || undefined,
        status: 'active',
        instructions: instructions.trim() || undefined,
      };

      // await apiService.createSchedule(scheduleData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        i18n.t('common.success'),
        i18n.t('schedule.schedule_saved'),
        [
          {
            text: i18n.t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Save schedule error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAllDays = (value: boolean) => {
    setMonday(value);
    setTuesday(value);
    setWednesday(value);
    setThursday(value);
    setFriday(value);
    setSaturday(value);
    setSunday(value);
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={i18n.t('schedule.add_schedule')}
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={BackIcon}
            onPress={() => navigation.goBack()}
          />
        )}
        accessoryRight={() => (
          <TopNavigationAction
            icon={SaveIcon}
            onPress={handleSave}
            disabled={loading}
          />
        )}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          {/* Medication Selection */}
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('medications.medication_name')}
            </Text>

            <Select
              label={i18n.t('medications.select_medication')}
              selectedIndex={selectedMedication}
              onSelect={(index) => setSelectedMedication(index as IndexPath)}
              value={medications.length > 0 ? 
                `${medications[selectedMedication.row]?.name} - ${medications[selectedMedication.row]?.strength}` :
                i18n.t('medications.no_medications')
              }
              style={styles.input}
            >
              {medications.map((medication, index) => (
                <SelectItem
                  key={index}
                  title={`${medication.name} - ${medication.strength}`}
                />
              ))}
            </Select>
          </Card>

          {/* Schedule Settings */}
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('schedule.timing')}
            </Text>

            <Select
              label={i18n.t('schedule.timing')}
              selectedIndex={selectedTiming}
              onSelect={(index) => setSelectedTiming(index as IndexPath)}
              value={timingOptions[selectedTiming.row]}
              style={styles.input}
            >
              {timingOptions.map((option, index) => (
                <SelectItem key={index} title={option} />
              ))}
            </Select>

            {selectedTiming.row === 3 && (
              <Input
                label={i18n.t('schedule.custom_time')}
                placeholder="08:00"
                value={customTime}
                onChangeText={setCustomTime}
                accessoryLeft={ClockIcon}
                style={styles.input}
              />
            )}

            <Select
              label={i18n.t('schedule.frequency')}
              selectedIndex={selectedFrequency}
              onSelect={(index) => setSelectedFrequency(index as IndexPath)}
              value={frequencyOptions[selectedFrequency.row]}
              style={styles.input}
            >
              {frequencyOptions.map((option, index) => (
                <SelectItem key={index} title={option} />
              ))}
            </Select>

            <Input
              label={i18n.t('schedule.dosage_amount')}
              placeholder="1 tablet, 5ml, etc."
              value={dosageAmount}
              onChangeText={setDosageAmount}
              style={styles.input}
            />
          </Card>

          {/* Days of Week */}
          <Card style={styles.card}>
            <View style={styles.daysHeader}>
              <Text category="h6" style={styles.sectionTitle}>
                {i18n.t('schedule.days_of_week')}
              </Text>
              <View style={styles.toggleAllButtons}>
                <Button
                  size="tiny"
                  appearance="outline"
                  onPress={() => toggleAllDays(true)}
                >
                  {i18n.t('common.select_all')}
                </Button>
                <Button
                  size="tiny"
                  appearance="outline"
                  onPress={() => toggleAllDays(false)}
                >
                  {i18n.t('common.clear_all')}
                </Button>
              </View>
            </View>

            <View style={styles.daysContainer}>
              <Toggle checked={monday} onChange={setMonday}>
                {i18n.t('schedule.monday')}
              </Toggle>
              <Toggle checked={tuesday} onChange={setTuesday}>
                {i18n.t('schedule.tuesday')}
              </Toggle>
              <Toggle checked={wednesday} onChange={setWednesday}>
                {i18n.t('schedule.wednesday')}
              </Toggle>
              <Toggle checked={thursday} onChange={setThursday}>
                {i18n.t('schedule.thursday')}
              </Toggle>
              <Toggle checked={friday} onChange={setFriday}>
                {i18n.t('schedule.friday')}
              </Toggle>
              <Toggle checked={saturday} onChange={setSaturday}>
                {i18n.t('schedule.saturday')}
              </Toggle>
              <Toggle checked={sunday} onChange={setSunday}>
                {i18n.t('schedule.sunday')}
              </Toggle>
            </View>
          </Card>

          {/* Date Range */}
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('schedule.date_range')}
            </Text>

            <Datepicker
              label={i18n.t('schedule.start_date')}
              date={startDate}
              onSelect={setStartDate}
              style={styles.input}
            />

            <Datepicker
              label={i18n.t('schedule.end_date')}
              date={endDate}
              onSelect={setEndDate}
              style={styles.input}
              placeholder={i18n.t('schedule.no_end_date')}
            />
          </Card>

          {/* Additional Information */}
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('schedule.additional_info')}
            </Text>

            <Input
              label={i18n.t('schedule.instructions')}
              placeholder={i18n.t('schedule.special_instructions')}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card>

          <View style={styles.actionsContainer}>
            <Button
              style={styles.saveButton}
              size="large"
              onPress={handleSave}
              disabled={loading}
              accessoryLeft={SaveIcon}
            >
              {loading ? i18n.t('common.loading') : i18n.t('common.save')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: MedGuardColors.primary.trustBlue,
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  toggleAllButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  daysContainer: {
    gap: Spacing.sm,
  },
  actionsContainer: {
    paddingVertical: Spacing.xl,
  },
  saveButton: {
    marginBottom: Spacing.md,
  },
});

export default AddScheduleScreen;
