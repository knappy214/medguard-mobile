import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMedication } from '../contexts/MedicationContext';
import StockAnalyticsCard from '../components/StockAnalyticsCard';
import PharmacyIntegrationCard from '../components/PharmacyIntegrationCard';
import intelligentStockService from '../services/intelligentStockService';

const StockAnalyticsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { medications, getMedicationById } = useMedication();
  
  const [selectedMedicationId, setSelectedMedicationId] = useState(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIntelligentStockData();
  }, []);

  const loadIntelligentStockData = async () => {
    try {
      setLoading(true);
      const [analytics, alerts, expiring] = await Promise.all([
        intelligentStockService.getDashboardAnalytics(),
        intelligentStockService.getLowStockAlerts(),
        intelligentStockService.getExpiringSoonMedications(),
      ]);
      
      setDashboardAnalytics(analytics);
      setLowStockAlerts(alerts);
      setExpiringSoon(expiring);
    } catch (error) {
      console.error('Error loading intelligent stock data:', error);
      Alert.alert(t('common.error'), t('medication.stockAnalytics.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIntelligentStockData();
    setRefreshing(false);
  };

  const handleCheckAlerts = async () => {
    try {
      setLoading(true);
      const newAlerts = await intelligentStockService.checkAndCreateStockAlerts();
      await loadIntelligentStockData();
      
      if (newAlerts.length > 0) {
        Alert.alert(
          t('common.success'),
          t('medication.stockAnalytics.alertsChecked', { count: newAlerts.length })
        );
      } else {
        Alert.alert(t('common.info'), t('medication.stockAnalytics.noNewAlerts'));
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
      Alert.alert(t('common.error'), t('medication.stockAnalytics.checkAlertsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (medicationId) => {
    const medication = getMedicationById(medicationId);
    if (!medication) return;

    Alert.prompt(
      t('medication.stockAnalytics.adjustStock'),
      t('medication.stockAnalytics.adjustStockMessage', { 
        name: medication.name,
        current: medication.stockQuantity 
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async (quantity) => {
            try {
              const numQuantity = parseInt(quantity);
              if (isNaN(numQuantity)) {
                Alert.alert(t('common.error'), t('errors.invalidQuantity'));
                return;
              }

              await intelligentStockService.adjustStock(
                medicationId, 
                numQuantity, 
                'Manual adjustment',
                'Adjusted via mobile app'
              );
              
              await loadIntelligentStockData();
              Alert.alert(t('common.success'), t('medication.stockAnalytics.stockAdjusted'));
            } catch (error) {
              console.error('Error adjusting stock:', error);
              Alert.alert(t('common.error'), t('medication.stockAnalytics.adjustStockError'));
            }
          }
        }
      ],
      'plain-text',
      '0'
    );
  };

  const renderDashboardOverview = () => {
    if (!dashboardAnalytics) return null;

    return (
      <View style={styles.dashboardSection}>
        <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.overview')}</Text>
        
        <View style={styles.dashboardGrid}>
          <View style={styles.dashboardCard}>
            <Ionicons name="medical" size={24} color="#2563EB" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.totalMedications}</Text>
            <Text style={styles.dashboardLabel}>{t('medications.title')}</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.lowStockCount}</Text>
            <Text style={styles.dashboardLabel}>{t('notifications.lowStock')}</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.criticalStockCount}</Text>
            <Text style={styles.dashboardLabel}>{t('common.warning')}</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <Text style={styles.dashboardNumber}>{dashboardAnalytics.averageConfidence}%</Text>
            <Text style={styles.dashboardLabel}>{t('medication.stockAnalytics.confidence')}</Text>
          </View>
        </View>

        <View style={styles.dashboardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCheckAlerts}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>
              {loading ? t('common.loading') : t('medication.stockAnalytics.checkAlerts')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMedicationList = () => {
    const activeMedications = medications.filter(m => m.isActive);
    
    if (activeMedications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="medical" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>{t('medication.stockAnalytics.noMedications')}</Text>
          <Text style={styles.emptySubtitle}>{t('medication.stockAnalytics.addMedicationsFirst')}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMedication')}
          >
            <Text style={styles.addButtonText}>{t('medications.addNew')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.medicationsSection}>
        <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.selectMedication')}</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.medicationScroll}>
          {activeMedications.map((medication) => (
            <TouchableOpacity
              key={medication.id}
              style={[
                styles.medicationCard,
                selectedMedicationId === medication.id && styles.medicationCardSelected
              ]}
              onPress={() => setSelectedMedicationId(medication.id)}
            >
              <Text style={[
                styles.medicationName,
                selectedMedicationId === medication.id && styles.medicationNameSelected
              ]}>
                {medication.name}
              </Text>
              <Text style={styles.medicationStock}>
                {medication.stockQuantity} {t('stockLevels.stockCount', { count: medication.stockQuantity })}
              </Text>
              <View style={[
                styles.stockIndicator,
                { backgroundColor: getStockLevelColor(medication.stockLevel) }
              ]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAlertsSection = () => {
    if (lowStockAlerts.length === 0 && expiringSoon.length === 0) {
      return null;
    }

    return (
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.alerts')}</Text>
        
        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <View style={styles.alertGroup}>
            <Text style={styles.alertGroupTitle}>{t('notifications.lowStock')}</Text>
            {lowStockAlerts.slice(0, 5).map((alert) => {
              const medication = getMedicationById(alert.medicationId);
              return (
                <TouchableOpacity
                  key={alert.id}
                  style={styles.alertItem}
                  onPress={() => setSelectedMedicationId(alert.medicationId)}
                >
                  <Ionicons 
                    name="warning" 
                    size={20} 
                    color={alert.priority === 'critical' ? '#EF4444' : '#F59E0B'} 
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{medication?.name || 'Unknown'}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => handleAdjustStock(alert.medicationId)}
                  >
                    <Ionicons name="add-circle" size={20} color="#2563EB" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Expiring Soon */}
        {expiringSoon.length > 0 && (
          <View style={styles.alertGroup}>
            <Text style={styles.alertGroupTitle}>{t('medication.stockAnalytics.expiringSoon')}</Text>
            {expiringSoon.slice(0, 5).map((medication) => (
              <TouchableOpacity
                key={medication.id}
                style={styles.alertItem}
                onPress={() => setSelectedMedicationId(medication.id)}
              >
                <Ionicons name="time" size={20} color="#F59E0B" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{medication.name}</Text>
                  <Text style={styles.alertMessage}>
                    {t('medication.stockAnalytics.expiresIn', { 
                      days: medication.daysUntilExpiration 
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => handleAdjustStock(medication.id)}
                >
                  <Ionicons name="add-circle" size={20} color="#2563EB" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getStockLevelColor = (stockLevel) => {
    switch (stockLevel) {
      case 'full': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'low': return '#EF4444';
      case 'empty': return '#6B7280';
      default: return '#6B7280';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dashboard Overview */}
        {renderDashboardOverview()}

        {/* Alerts Section */}
        {renderAlertsSection()}

        {/* Medication Selection */}
        {renderMedicationList()}

        {/* Selected Medication Analytics */}
        {selectedMedicationId && (
          <StockAnalyticsCard 
            medicationId={selectedMedicationId}
            onRefresh={loadIntelligentStockData}
          />
        )}

        {/* Pharmacy Integration */}
        <PharmacyIntegrationCard />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  dashboardSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dashboardCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  dashboardNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  dashboardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  dashboardActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 8,
  },
  alertsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertGroup: {
    marginBottom: 16,
  },
  alertGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  alertMessage: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  adjustButton: {
    padding: 4,
  },
  medicationsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationScroll: {
    marginBottom: 8,
  },
  medicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  medicationCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F9FF',
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  medicationNameSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  medicationStock: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default StockAnalyticsScreen; 