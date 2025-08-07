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
  Datepicker,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import apiService from '../../services/apiService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

const BackIcon = (props: IconProps) => <Icon {...props} name='arrow-back' />;
const SaveIcon = (props: IconProps) => <Icon {...props} name='checkmark-outline' />;
const CameraIcon = (props: IconProps) => <Icon {...props} name='camera-outline' />;

const AddMedicationScreen: React.FC = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { ocrResult } = route.params || {};
  
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [strength, setStrength] = useState('');
  const [pillCount, setPillCount] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [description, setDescription] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [selectedMedicationType, setSelectedMedicationType] = useState(new IndexPath(0));
  const [selectedPrescriptionType, setSelectedPrescriptionType] = useState(new IndexPath(0));
  const [loading, setLoading] = useState(false);

  const medicationTypes = Object.keys(i18n.t('medication_types', { returnObjects: true }) as unknown as Record<string, string>);
  const prescriptionTypes = Object.keys(i18n.t('prescription_types', { returnObjects: true }) as unknown as Record<string, string>);

  useEffect(() => {
    if (ocrResult && ocrResult.medications && ocrResult.medications.length > 0) {
      const firstMed = ocrResult.medications[0];
      setName(firstMed.name || '');
      setStrength(firstMed.strength || '');
      setDescription(firstMed.instructions || '');
    }
  }, [ocrResult]);

  const handleSave = async () => {
    if (!name || !strength || !pillCount) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.validation_error'));
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const medicationData = {
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        strength: strength.trim(),
        medicationType: medicationTypes[selectedMedicationType.row],
        prescriptionType: prescriptionTypes[selectedPrescriptionType.row],
        pillCount: parseInt(pillCount),
        lowStockThreshold: parseInt(lowStockThreshold),
        description: description.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        expirationDate: expirationDate?.toISOString() || undefined,
      };

      // await apiService.createMedication(medicationData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        i18n.t('common.success'),
        i18n.t('medications.medication_saved'),
        [
          {
            text: i18n.t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Save medication error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={i18n.t('medications.add_medication')}
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
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('medications.basic_information')}
            </Text>

            <Input
              label={i18n.t('medications.medication_name')}
              placeholder={i18n.t('medications.medication_name')}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Input
              label={i18n.t('medications.generic_name')}
              placeholder={i18n.t('medications.generic_name')}
              value={genericName}
              onChangeText={setGenericName}
              style={styles.input}
            />

            <Input
              label={i18n.t('medications.strength')}
              placeholder="e.g., 500mg, 10ml"
              value={strength}
              onChangeText={setStrength}
              style={styles.input}
            />

            <Select
              label={i18n.t('medications.medication_type')}
              selectedIndex={selectedMedicationType}
              onSelect={(index) => setSelectedMedicationType(index as IndexPath)}
              value={i18n.t(`medication_types.${medicationTypes[selectedMedicationType.row]}`)}
              style={styles.input}
            >
              {medicationTypes.map((type, index) => (
                <SelectItem
                  key={index}
                  title={i18n.t(`medication_types.${type}`)}
                />
              ))}
            </Select>

            <Select
              label={i18n.t('medications.prescription_type')}
              selectedIndex={selectedPrescriptionType}
              onSelect={(index) => setSelectedPrescriptionType(index as IndexPath)}
              value={i18n.t(`prescription_types.${prescriptionTypes[selectedPrescriptionType.row]}`)}
              style={styles.input}
            >
              {prescriptionTypes.map((type, index) => (
                <SelectItem
                  key={index}
                  title={i18n.t(`prescription_types.${type}`)}
                />
              ))}
            </Select>
          </Card>

          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('medications.inventory')}
            </Text>

            <Input
              label={i18n.t('medications.pill_count')}
              placeholder="30"
              value={pillCount}
              onChangeText={setPillCount}
              keyboardType="numeric"
              style={styles.input}
            />

            <Input
              label={i18n.t('medications.low_stock_threshold')}
              placeholder="5"
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="numeric"
              style={styles.input}
            />

            <Datepicker
              label={i18n.t('medications.expiration_date')}
              date={expirationDate}
              onSelect={setExpirationDate}
              style={styles.input}
            />
          </Card>

          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('medications.additional_info')}
            </Text>

            <Input
              label={i18n.t('medications.manufacturer')}
              placeholder={i18n.t('medications.manufacturer')}
              value={manufacturer}
              onChangeText={setManufacturer}
              style={styles.input}
            />

            <Input
              label={i18n.t('medications.description')}
              placeholder={i18n.t('medications.instructions')}
              value={description}
              onChangeText={setDescription}
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
  actionsContainer: {
    paddingVertical: Spacing.xl,
  },
  saveButton: {
    marginBottom: Spacing.md,
  },
});

export default AddMedicationScreen;
