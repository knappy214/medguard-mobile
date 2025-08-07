import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import {
  Layout,
  Text,
  Card,
  Button,
  Icon,
  IconProps,
  Avatar,
  List,
  ListItem,
  TopNavigation,
  TopNavigationAction,
  Divider,
  Input,
  Select,
  SelectItem,
  IndexPath,
  Modal,
  Spinner,
} from '@ui-kitten/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isAfter, differenceInDays, parseISO } from 'date-fns';
import { enZA, af } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';

// Services and utilities
import apiService from '../../services/apiService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

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

const { width: screenWidth } = Dimensions.get('window');

// Icon components
const AddIcon = (props: IconProps) => <Icon {...props} name='plus-outline' />;
const SearchIcon = (props: IconProps) => <Icon {...props} name='search-outline' />;
const FilterIcon = (props: IconProps) => <Icon {...props} name='funnel-outline' />;
const ScanIcon = (props: IconProps) => <Icon {...props} name='camera-outline' />;
const AlertIcon = (props: IconProps) => <Icon {...props} name='alert-circle-outline' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-circle-outline' />;
const CloseIcon = (props: IconProps) => <Icon {...props} name='close-outline' />;

const MedicationsScreen: React.FC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<IndexPath>(new IndexPath(0));

  // Filter options
  const filterOptions = [
    i18n.t('medications.all_types'),
    i18n.t('medications.low_stock'),
    i18n.t('medications.expired'),
    i18n.t('medications.expiring_soon'),
    ...Object.keys(i18n.t('medication_types', { returnObjects: true }) as unknown as Record<string, string>).map(
      key => i18n.t(`medication_types.${key}`)
    ),
  ];

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [medications, searchQuery, selectedFilter]);

  const loadMedications = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const medicationsData = await apiService.getMedications(forceRefresh);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Load medications error:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('errors.network_error'),
        [
          { text: i18n.t('common.ok') },
          { text: i18n.t('common.retry'), onPress: () => loadMedications(true) },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMedications(true);
    setRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...medications];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(query) ||
        (med.genericName && med.genericName.toLowerCase().includes(query)) ||
        (med.manufacturer && med.manufacturer.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    const filterIndex = selectedFilter.row;
    if (filterIndex > 0) {
      const filterValue = filterOptions[filterIndex];
      
      if (filterValue === i18n.t('medications.low_stock')) {
        filtered = filtered.filter(med => med.pillCount <= med.lowStockThreshold);
      } else if (filterValue === i18n.t('medications.expired')) {
        const now = new Date();
        filtered = filtered.filter(med => 
          med.expirationDate && isAfter(now, parseISO(med.expirationDate))
        );
      } else if (filterValue === i18n.t('medications.expiring_soon')) {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        filtered = filtered.filter(med => {
          if (!med.expirationDate) return false;
          const expiryDate = parseISO(med.expirationDate);
          return isAfter(expiryDate, now) && isAfter(thirtyDaysFromNow, expiryDate);
        });
      } else {
        // Filter by medication type
        const typeKey = Object.keys(i18n.t('medication_types', { returnObjects: true }) as unknown as Record<string, string>)
          .find(key => i18n.t(`medication_types.${key}`) === filterValue);
        if (typeKey) {
          filtered = filtered.filter(med => med.medicationType === typeKey);
        }
      }
    }

    setFilteredMedications(filtered);
  }, [medications, searchQuery, selectedFilter]);

  const getMedicationStatusColor = (medication: Medication): string => {
    if (medication.expirationDate) {
      const now = new Date();
      const expiryDate = parseISO(medication.expirationDate);
      
      if (isAfter(now, expiryDate)) {
        return MedGuardColors.alerts.criticalRed;
      }
      
      const daysUntilExpiry = differenceInDays(expiryDate, now);
      if (daysUntilExpiry <= 30) {
        return MedGuardColors.alerts.warningAmber;
      }
    }
    
    if (medication.pillCount <= medication.lowStockThreshold) {
      return MedGuardColors.alerts.warningAmber;
    }
    
    return MedGuardColors.alerts.successGreen;
  };

  const getMedicationStatusText = (medication: Medication): string => {
    if (medication.expirationDate) {
      const now = new Date();
      const expiryDate = parseISO(medication.expirationDate);
      
      if (isAfter(now, expiryDate)) {
        return i18n.t('medications.expired');
      }
      
      const daysUntilExpiry = differenceInDays(expiryDate, now);
      if (daysUntilExpiry <= 30) {
        return i18n.t('alerts.expires_in_days', { days: daysUntilExpiry });
      }
    }
    
    if (medication.pillCount <= medication.lowStockThreshold) {
      return i18n.t('medications.low_stock');
    }
    
    return i18n.getPluralForm(medication.pillCount, 'pill_counting.pill');
  };

  const navigateToAddMedication = () => {
    navigation.navigate('AddMedication');
  };

  const navigateToScanPrescription = () => {
    navigation.navigate('Camera');
  };

  const navigateToMedicationDetail = (medicationId: number) => {
    navigation.navigate('MedicationDetail', { medicationId });
  };

  const renderMedicationItem = ({ item }: { item: Medication }) => {
    const statusColor = getMedicationStatusColor(item);
    const statusText = getMedicationStatusText(item);
    
    return (
      <ListItem
        title={item.name}
        description={`${item.strength} - ${statusText}`}
        accessoryLeft={() => (
          <Avatar
            source={item.medicationImage ? { uri: item.medicationImage } : undefined}
            style={[styles.medicationAvatar, { backgroundColor: statusColor }]}
          />
        )}
        accessoryRight={() => (
          <View style={styles.medicationMeta}>
            <Text category="caption1" appearance="hint">
              {i18n.formatNumber(item.pillCount)}
            </Text>
            <Icon
              name="chevron-right"
              style={styles.chevronIcon}
              fill={MedGuardColors.extended.mediumGray}
            />
          </View>
        )}
        onPress={() => navigateToMedicationDetail(item.id)}
        style={styles.medicationItem}
      />
    );
  };

  const renderEmptyState = () => (
    <Layout style={styles.emptyState}>
      <Icon
        name="activity-outline"
        style={styles.emptyStateIcon}
        fill={MedGuardColors.extended.mediumGray}
      />
      <Text category="h6" style={styles.emptyStateTitle}>
        {i18n.t('medications.no_medications')}
      </Text>
      <Text category="s1" appearance="hint" style={styles.emptyStateDescription}>
        {i18n.t('medications.add_first_medication')}
      </Text>
      
      <View style={styles.emptyStateActions}>
        <Button
          style={styles.emptyStateButton}
          accessoryLeft={AddIcon}
          onPress={navigateToAddMedication}
        >
          {i18n.t('medications.add_medication')}
        </Button>
        
        <Button
          style={styles.emptyStateButton}
          appearance="outline"
          accessoryLeft={ScanIcon}
          onPress={navigateToScanPrescription}
        >
          {i18n.t('camera.title')}
        </Button>
      </View>
    </Layout>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setShowFilters(false)}
    >
      <Card disabled={true} style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <Text category="h6">{i18n.t('medications.filter_by_type')}</Text>
          <Button
            appearance="ghost"
            accessoryLeft={CloseIcon}
            onPress={() => setShowFilters(false)}
          />
        </View>
        
        <Select
          selectedIndex={selectedFilter}
          value={filterOptions[selectedFilter.row]}
          onSelect={(index) => {
            setSelectedFilter(index as IndexPath);
            setShowFilters(false);
          }}
        >
          {filterOptions.map((option, index) => (
            <SelectItem key={index} title={option} />
          ))}
        </Select>
      </Card>
    </Modal>
  );

  if (loading) {
    return (
      <Layout style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            {i18n.t('common.loading')}
          </Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={[styles.container, { paddingTop: insets.top }]} level="2">
      <TopNavigation
        title={i18n.t('medications.title')}
        alignment="center"
        accessoryLeft={() => (
          <TopNavigationAction
            icon={FilterIcon}
            onPress={() => setShowFilters(true)}
          />
        )}
        accessoryRight={() => (
          <View style={styles.topNavActions}>
            <TopNavigationAction
              icon={ScanIcon}
              onPress={navigateToScanPrescription}
            />
            <TopNavigationAction
              icon={AddIcon}
              onPress={navigateToAddMedication}
            />
          </View>
        )}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder={i18n.t('medications.search_medications')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessoryLeft={SearchIcon}
          style={styles.searchInput}
        />
      </View>

      {/* Medications List */}
      {filteredMedications.length > 0 ? (
        <FlatList
          data={filteredMedications}
          renderItem={renderMedicationItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[MedGuardColors.primary.trustBlue]}
              tintColor={MedGuardColors.primary.trustBlue}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNavActions: {
    flexDirection: 'row',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  medicationItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  medicationAvatar: {
    width: 48,
    height: 48,
  },
  medicationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 16,
    height: 16,
    marginTop: Spacing.xs,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyStateActions: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  emptyStateButton: {
    marginBottom: Spacing.md,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModal: {
    width: screenWidth * 0.8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
});

export default MedicationsScreen;
