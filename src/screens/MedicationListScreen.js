import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMedication } from '../contexts/MedicationContext';
import { STOCK_LEVELS, MEDICATION_TYPES } from '../types';

const MedicationListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    medications,
    deleteMedication,
    updateStockLevel,
    getLowStockMedications,
    isLoading,
  } = useMedication();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // name, stock, type

  useEffect(() => {
    filterAndSortMedications();
  }, [medications, searchQuery, sortBy]);

  const filterAndSortMedications = () => {
    let filtered = medications.filter(medication =>
      medication.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort medications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return getStockLevelPriority(b.stockLevel) - getStockLevelPriority(a.stockLevel);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    setFilteredMedications(filtered);
  };

  const getStockLevelPriority = (stockLevel) => {
    switch (stockLevel) {
      case STOCK_LEVELS.EMPTY:
        return 4;
      case STOCK_LEVELS.LOW:
        return 3;
      case STOCK_LEVELS.MEDIUM:
        return 2;
      case STOCK_LEVELS.FULL:
        return 1;
      default:
        return 0;
    }
  };

  const handleDeleteMedication = (medication) => {
    Alert.alert(
      t('alerts.deleteMedication'),
      t('alerts.deleteMedicationMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMedication(medication.id),
        },
      ]
    );
  };

  const handleUpdateStock = (medication) => {
    Alert.prompt(
      t('medicationForm.stockQuantity'),
      t('medicationForm.stockQuantity'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: (quantity) => {
            const newQuantity = parseInt(quantity);
            if (!isNaN(newQuantity) && newQuantity >= 0) {
              updateStockLevel(medication.id, newQuantity);
            }
          },
        },
      ],
      'plain-text',
      medication.stockQuantity.toString()
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

  const renderMedicationItem = ({ item: medication }) => {
    const stockColor = getStockLevelColor(medication.stockLevel);
    const stockText = getStockLevelText(medication.stockLevel);
    const typeIcon = getMedicationTypeIcon(medication.type);

    return (
      <TouchableOpacity
        style={styles.medicationItem}
        onPress={() => navigation.navigate('MedicationDetail', { medicationId: medication.id })}
      >
        <View style={styles.medicationHeader}>
          <View style={styles.medicationInfo}>
            <View style={styles.nameContainer}>
              <Ionicons name={typeIcon} size={20} color="#6B7280" style={styles.typeIcon} />
              <Text style={styles.medicationName}>{medication.name}</Text>
            </View>
            <Text style={styles.medicationDosage}>{medication.dosage}</Text>
            <Text style={styles.medicationType}>{t(`medicationTypes.${medication.type}`)}</Text>
          </View>
          <View style={styles.stockContainer}>
            <View style={[styles.stockIndicator, { backgroundColor: stockColor }]} />
            <Text style={[styles.stockText, { color: stockColor }]}>{stockText}</Text>
            <Text style={styles.stockQuantity}>{medication.stockQuantity}</Text>
          </View>
        </View>

        <View style={styles.medicationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateStock(medication)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>{t('common.add')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MedicationDetail', { medicationId: medication.id })}
          >
            <Ionicons name="eye-outline" size={20} color="#6B7280" />
            <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteMedication(medication)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
              {t('common.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyText}>{t('medications.noMedications')}</Text>
      <Text style={styles.emptySubtext}>{t('medications.addFirstMedication')}</Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('AddMedication')}
      >
        <Text style={styles.addFirstButtonText}>{t('medications.addNew')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('medications.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'name' && styles.activeFilterButton]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'name' && styles.activeFilterButtonText]}>
            {t('medications.name')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'stock' && styles.activeFilterButton]}
          onPress={() => setSortBy('stock')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'stock' && styles.activeFilterButtonText]}>
            {t('medications.stock')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'type' && styles.activeFilterButton]}
          onPress={() => setSortBy('type')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'type' && styles.activeFilterButtonText]}>
            {t('medications.type')}
          </Text>
        </TouchableOpacity>
      </View>

      {getLowStockMedications().length > 0 && (
        <View style={styles.lowStockWarning}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.lowStockText}>
            {getLowStockMedications().length} {t('notifications.lowStock')}
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredMedications}
        renderItem={renderMedicationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedication')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  listContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  lowStockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
  },
  lowStockText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  medicationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
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
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  medicationType: {
    fontSize: 12,
    color: '#9CA3AF',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  medicationActions: {
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
  deleteButton: {
    // Additional styling for delete button
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2563EB',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default MedicationListScreen; 