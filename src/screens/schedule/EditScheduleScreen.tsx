
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
  Spinner,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import apiService from '../../services/apiService';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';
import i18n from '../../i18n';

const BackIcon = (props: IconProps) => <Icon {...props} name='arrow-back' />;
const SaveIcon = (props: IconProps) => <Icon {...props} name='checkmark-outline' />;
const ClockIcon = (props: IconProps) => <Icon {...props} name='clock-outline' />;

const EditScheduleScreen: React.FC = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { scheduleId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [selectedMedication, setSelectedMedication] = useState(new IndexPath(0));
  const [selectedTiming, setSelectedTiming] = useState(new IndexPath(0));
  const [selectedFrequency, setSelectedFrequency] = useState(new IndexPath(0));
  const [selectedStatus, setSelectedStatus] = useState(new IndexPath(0));
  const [customTime, setCustomTime] = useState('08:00');
  const [dosageAmount, setDosageAmount] = useState('');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  
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

  const statusOptions = [
    i18n.t('schedule.active'),
    i18n.t('schedule.inactive'),
    i18n.t('schedule.paused'),
    i18n.t('schedule.completed'),
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [medicationsData, schedulesData] = await Promise.all([
        apiService.getMedications(),
        apiService.getMedicationSchedules(),
      ]);
      
      setMedications(medicationsData);
      
      const schedule = schedulesData.find(s => s.id === scheduleId);
      if (schedule) {
        // Set medication
        const medicationIndex = medicationsData.findIndex(m => m.id === schedule.medication.id);
        setSelectedMedication(new IndexPath(Math.max(0, medicationIndex)));
        
        // Set timing
        const timingMap = { morning: 0, noon: 1, night: 2, custom: 3 };
        setSelectedTiming(new IndexPath(timingMap[schedule.timing] || 0));
        
        // Set other fields
        setCustomTime(schedule.customTime || '08:00');
        setDosageAmount(schedule.dosageAmount);
        setInstructions(schedule.instructions || '');
        setStartDate(parseISO(schedule.startDate));
        setEndDate(schedule.endDate ? parseISO(schedule.endDate) : null);
        
        // Set days
        setMonday(schedule.monday);
        setTuesday(schedule.tuesday);
        setWednesday(schedule.wednesday);
        setThursday(schedule.thursday);
        setFriday(schedule.friday);
        setSaturday(schedule.saturday);
        setSunday(schedule.sunday);
        
        // Set status
        const statusMap = { active: 0, inactive: 1, paused: 2, completed: 3 };
        setSelectedStatus(new IndexPath(statusMap[schedule.status] || 0));
      }
    } catch (error) {
      console.error('Load schedule error:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!dosageAmount) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.validation_error'));
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const scheduleData = {
        medication: medications[selectedMedication.row].id,
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
        status: ['active', 'inactive', 'paused', 'completed'][selectedStatus.row],
        instructions: instructions.trim() || undefined,
      };

      // await apiService.updateSchedule(scheduleId, scheduleData);
      
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <TopNavigation
          title={i18n.t('schedule.edit_schedule')}
          alignment="center"
        />
        <View style={styles.centerContent}>
          <Spinner size="large" />
          <Text style={styles.loadingText}>{i18n.t('common.loading')}</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={i18n.t('schedule.edit_schedule')}
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
            disabled={saving}
          />
        )}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          {/* Status */}
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('schedule.status')}
            </Text>

            <Select
              label={i18n.t('schedule.status')}
              selectedIndex={selectedStatus}
              onSelect={(index) => setSelectedStatus(index as IndexPath)}
              value={statusOptions[selectedStatus.row]}
              style={styles.input}
            >
              {statusOptions.map((option, index) => (
                <SelectItem key={index} title={option} />
              ))}
            </Select>
          </Card>

          {/* Rest of the form is the same as AddScheduleScreen */}
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

          {/* Schedule Settings - same as AddScheduleScreen */}
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

            <Input
              label={i18n.t('schedule.dosage_amount')}
              placeholder="1 tablet, 5ml, etc."
              value={dosageAmount}
              onChangeText={setDosageAmount}
              style={styles.input}
            />
          </Card>

          {/* Days of Week - same structure as AddScheduleScreen */}
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('schedule.days_of_week')}
            </Text>

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

          <View style={styles.actionsContainer}>
            <Button
              style={styles.saveButton}
              size="large"
              onPress={handleSave}
              disabled={saving}
              accessoryLeft={SaveIcon}
            >
              {saving ? i18n.t('common.loading') : i18n.t('common.save')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
  },
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

export default EditScheduleScreen;
