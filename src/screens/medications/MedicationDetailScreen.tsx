import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Alert,
  Image,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Icon,
  IconProps,
  TopNavigation,
  TopNavigationAction,
  Divider,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { enZA, af } from 'date-fns/locale';
import apiService from '../../services/apiService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

const EditIcon = (props: IconProps) => <Icon {...props} name='edit-outline' />;
const DeleteIcon = (props: IconProps) => <Icon {...props} name='trash-2-outline' />;
const BackIcon = (props: IconProps) => <Icon {...props} name='arrow-back' />;
const CalendarIcon = (props: IconProps) => <Icon {...props} name='calendar-outline' />;
const AlertIcon = (props: IconProps) => <Icon {...props} name='alert-circle-outline' />;

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
  activeIngredients?: string;
  sideEffects?: string;
  contraindications?: string;
  storageInstructions?: string;
}

const MedicationDetailScreen: React.FC = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { medicationId } = route.params;
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  const locale = i18n.getCurrentLanguage() === 'af' ? af : enZA;

  useEffect(() => {
    loadMedication();
  }, []);

  const loadMedication = async () => {
    try {
      setLoading(true);
      // In a real app, you'd have an API endpoint for single medication
      const medications = await apiService.getMedications();
      const med = medications.find(m => m.id === medicationId);
      setMedication(med || null);
    } catch (error) {
      console.error('Load medication error:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditMedication', { medicationId });
  };

  const handleDelete = () => {
    Alert.alert(
      i18n.t('medications.delete_medication'),
      i18n.t('medications.delete_medication_confirm'),
      [
        { text: i18n.t('common.cancel') },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: deleteMedication,
        },
      ]
    );
  };

  const deleteMedication = async () => {
    try {
      // await apiService.deleteMedication(medicationId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        i18n.t('common.success'),
        i18n.t('medications.medication_deleted'),
        [
          {
            text: i18n.t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Delete medication error:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unknown_error'));
    }
  };

  const addSchedule = () => {
    navigation.navigate('Schedule', {
      screen: 'AddSchedule',
      params: { medicationId },
    });
  };

  if (loading) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text>{i18n.t('common.loading')}</Text>
        </View>
      </Layout>
    );
  }

  if (!medication) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text>{i18n.t('medications.medication_not_found')}</Text>
          <Button onPress={() => navigation.goBack()}>
            {i18n.t('common.back')}
          </Button>
        </View>
      </Layout>
    );
  }

  const isExpired = medication.expirationDate && 
    new Date() > parseISO(medication.expirationDate);
  const isLowStock = medication.pillCount <= medication.lowStockThreshold;

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={medication.name}
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={BackIcon}
            onPress={() => navigation.goBack()}
          />
        )}
        accessoryRight={() => (
          <View style={styles.topActions}>
            <TopNavigationAction icon={EditIcon} onPress={handleEdit} />
            <TopNavigationAction icon={DeleteIcon} onPress={handleDelete} />
          </View>
        )}
      />

      <ScrollView style={styles.scrollView}>
        {/* Medication Image and Basic Info */}
        <Card style={styles.imageCard}>
          <View style={styles.imageContainer}>
            {medication.medicationImage ? (
              <Image
                source={{ uri: medication.medicationImage }}
                style={styles.medicationImage}
              />
            ) : (
              <View style={[styles.medicationImage, styles.placeholderImage]}>
                <Icon
                  name="activity-outline"
                  style={styles.placeholderIcon}
                  fill={MedGuardColors.extended.mediumGray}
                />
              </View>
            )}
            <View style={styles.basicInfo}>
              <Text category="h4">{medication.name}</Text>
              {medication.genericName && (
                <Text category="s1" appearance="hint">
                  {medication.genericName}
                </Text>
              )}
              <Text category="h6" style={styles.strength}>
                {medication.strength}
              </Text>
            </View>
          </View>
        </Card>

        {/* Alerts */}
        {(isExpired || isLowStock) && (
          <Card style={styles.alertCard} status="danger">
            <View style={styles.alertHeader}>
              <Icon
                name="alert-circle"
                style={styles.alertIcon}
                fill={MedGuardColors.alerts.criticalRed}
              />
              <Text category="h6">{i18n.t('common.warning')}</Text>
            </View>
            {isExpired && (
              <Text category="s1">
                {i18n.t('alerts.medication_expired', { medication: medication.name })}
              </Text>
            )}
            {isLowStock && (
              <Text category="s1">
                {i18n.t('alerts.pills_remaining', { count: medication.pillCount })}
              </Text>
            )}
          </Card>
        )}

        {/* Details */}
        <Card style={styles.detailsCard}>
          <Text category="h6" style={styles.sectionTitle}>
            {i18n.t('medications.details')}
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <Text category="s2">{i18n.t('medications.medication_type')}:</Text>
            <Text category="s1">
              {i18n.t(`medication_types.${medication.medicationType}`)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text category="s2">{i18n.t('medications.prescription_type')}:</Text>
            <Text category="s1">
              {i18n.t(`prescription_types.${medication.prescriptionType}`)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text category="s2">{i18n.t('medications.pill_count')}:</Text>
            <Text category="s1">{i18n.formatNumber(medication.pillCount)}</Text>
          </View>

          {medication.expirationDate && (
            <View style={styles.detailRow}>
              <Text category="s2">{i18n.t('medications.expiration_date')}:</Text>
              <Text category="s1">
                {format(parseISO(medication.expirationDate), 'PPP', { locale })}
              </Text>
            </View>
          )}

          {medication.manufacturer && (
            <View style={styles.detailRow}>
              <Text category="s2">{i18n.t('medications.manufacturer')}:</Text>
              <Text category="s1">{medication.manufacturer}</Text>
            </View>
          )}
        </Card>

        {/* Additional Information */}
        {(medication.description || medication.activeIngredients) && (
          <Card style={styles.card}>
            <Text category="h6" style={styles.sectionTitle}>
              {i18n.t('medications.additional_info')}
            </Text>
            <Divider style={styles.divider} />

            {medication.description && (
              <View style={styles.infoSection}>
                <Text category="s2" style={styles.infoLabel}>
                  {i18n.t('medications.description')}:
                </Text>
                <Text category="s1">{medication.description}</Text>
              </View>
            )}

            {medication.activeIngredients && (
              <View style={styles.infoSection}>
                <Text category="s2" style={styles.infoLabel}>
                  {i18n.t('medications.active_ingredients')}:
                </Text>
                <Text category="s1">{medication.activeIngredients}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            style={styles.actionButton}
            accessoryLeft={CalendarIcon}
            onPress={addSchedule}
          >
            {i18n.t('schedule.add_schedule')}
          </Button>
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  topActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  imageCard: {
    marginBottom: Spacing.md,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  placeholderImage: {
    backgroundColor: MedGuardColors.extended.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 32,
    height: 32,
  },
  basicInfo: {
    flex: 1,
  },
  strength: {
    color: MedGuardColors.primary.trustBlue,
    marginTop: Spacing.xs,
  },
  alertCard: {
    marginBottom: Spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  alertIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.xs,
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: MedGuardColors.primary.trustBlue,
    marginBottom: Spacing.sm,
  },
  divider: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: MedGuardColors.extended.borderGray,
  },
  infoSection: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    marginBottom: Spacing.xs,
  },
  actionsContainer: {
    paddingVertical: Spacing.xl,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
});

export default MedicationDetailScreen;
