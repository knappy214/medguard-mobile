import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import storageService from '../services/storageService';
import intelligentStockService from '../services/intelligentStockService';
import { 
  createPharmacyIntegration, 
  INTEGRATION_TYPES, 
  INTEGRATION_STATUS 
} from '../types';

const PharmacyIntegrationCard = () => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [testingIntegration, setTestingIntegration] = useState(null);
  const [syncingIntegration, setSyncingIntegration] = useState(null);

  const [form, setForm] = useState({
    name: '',
    pharmacyName: '',
    integrationType: INTEGRATION_TYPES.API,
    apiEndpoint: '',
    apiKey: '',
    webhookUrl: '',
    autoOrder: false,
    autoOrderThreshold: 7,
    autoOrderLeadTime: 3,
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await storageService.getPharmacyIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
      Alert.alert(
        t('common.error'),
        t('medication.pharmacyIntegration.loadError')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = () => {
    setEditingIntegration(null);
    resetForm();
    setModalVisible(true);
  };

  const handleEditIntegration = (integration) => {
    setEditingIntegration(integration);
    setForm({
      name: integration.name,
      pharmacyName: integration.pharmacyName,
      integrationType: integration.integrationType,
      apiEndpoint: integration.apiEndpoint || '',
      apiKey: integration.apiKey || '',
      webhookUrl: integration.webhookUrl || '',
      autoOrder: integration.autoOrder || false,
      autoOrderThreshold: integration.autoOrderThreshold || 7,
      autoOrderLeadTime: integration.autoOrderLeadTime || 3,
    });
    setModalVisible(true);
  };

  const handleSaveIntegration = async () => {
    try {
      if (!form.name || !form.pharmacyName) {
        Alert.alert(t('common.error'), t('medication.pharmacyIntegration.fillRequiredFields'));
        return;
      }

      const integrationData = {
        name: form.name,
        pharmacyName: form.pharmacyName,
        integrationType: form.integrationType,
        apiEndpoint: form.apiEndpoint,
        apiKey: form.apiKey,
        webhookUrl: form.webhookUrl,
        status: INTEGRATION_STATUS.INACTIVE,
        autoOrder: form.autoOrder,
        autoOrderThreshold: form.autoOrderThreshold,
        autoOrderLeadTime: form.autoOrderLeadTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingIntegration) {
        integrationData.id = editingIntegration.id;
        integrationData.createdAt = editingIntegration.createdAt;
        await storageService.updatePharmacyIntegration(editingIntegration.id, integrationData);
      } else {
        integrationData.id = Date.now().toString();
        await storageService.addPharmacyIntegration(integrationData);
      }

      setModalVisible(false);
      resetForm();
      loadIntegrations();
      
      Alert.alert(
        t('common.success'),
        editingIntegration ? 
          t('medication.pharmacyIntegration.updated') : 
          t('medication.pharmacyIntegration.added')
      );
    } catch (error) {
      console.error('Error saving integration:', error);
      Alert.alert(t('common.error'), t('medication.pharmacyIntegration.saveError'));
    }
  };

  const handleDeleteIntegration = (integration) => {
    Alert.alert(
      t('medication.pharmacyIntegration.deleteTitle'),
      t('medication.pharmacyIntegration.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deletePharmacyIntegration(integration.id);
              loadIntegrations();
              Alert.alert(t('common.success'), t('medication.pharmacyIntegration.deleted'));
            } catch (error) {
              console.error('Error deleting integration:', error);
              Alert.alert(t('common.error'), t('medication.pharmacyIntegration.deleteError'));
            }
          }
        }
      ]
    );
  };

  const handleTestConnection = async (integration) => {
    try {
      setTestingIntegration(integration.id);
      const result = await intelligentStockService.testPharmacyIntegration(integration.id);
      
      Alert.alert(
        result.success ? t('common.success') : t('common.error'),
        result.message
      );
      
      loadIntegrations(); // Refresh to show updated status
    } catch (error) {
      console.error('Error testing connection:', error);
      Alert.alert(t('common.error'), t('medication.pharmacyIntegration.testError'));
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleSyncStock = async (integration) => {
    try {
      setSyncingIntegration(integration.id);
      const result = await intelligentStockService.syncStockWithPharmacy(integration.id);
      
      Alert.alert(
        result.success ? t('common.success') : t('common.error'),
        result.message
      );
      
      loadIntegrations(); // Refresh to show updated sync time
    } catch (error) {
      console.error('Error syncing stock:', error);
      Alert.alert(t('common.error'), t('medication.pharmacyIntegration.syncError'));
    } finally {
      setSyncingIntegration(null);
    }
  };

  const handleToggleStatus = async (integration) => {
    try {
      const newStatus = integration.status === INTEGRATION_STATUS.ACTIVE ? 
        INTEGRATION_STATUS.INACTIVE : INTEGRATION_STATUS.ACTIVE;
      
      await storageService.updatePharmacyIntegration(integration.id, { status: newStatus });
      loadIntegrations();
    } catch (error) {
      console.error('Error toggling status:', error);
      Alert.alert(t('common.error'), t('medication.pharmacyIntegration.toggleError'));
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      pharmacyName: '',
      integrationType: INTEGRATION_TYPES.API,
      apiEndpoint: '',
      apiKey: '',
      webhookUrl: '',
      autoOrder: false,
      autoOrderThreshold: 7,
      autoOrderLeadTime: 3,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case INTEGRATION_STATUS.ACTIVE: return '#10B981';
      case INTEGRATION_STATUS.INACTIVE: return '#6B7280';
      case INTEGRATION_STATUS.TESTING: return '#F59E0B';
      case INTEGRATION_STATUS.ERROR: return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case INTEGRATION_STATUS.ACTIVE: return 'check-circle';
      case INTEGRATION_STATUS.INACTIVE: return 'radio-button-unchecked';
      case INTEGRATION_STATUS.TESTING: return 'hourglass-empty';
      case INTEGRATION_STATUS.ERROR: return 'error';
      default: return 'radio-button-unchecked';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('medication.pharmacyIntegration.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('medication.pharmacyIntegration.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddIntegration}>
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {integrations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="pharmacy" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('medication.pharmacyIntegration.noIntegrations')}</Text>
            <Text style={styles.emptySubtitle}>{t('medication.pharmacyIntegration.addFirst')}</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddIntegration}>
              <Text style={styles.emptyButtonText}>{t('medication.pharmacyIntegration.addIntegration')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          integrations.map((integration) => (
            <View key={integration.id} style={styles.integrationCard}>
              <View style={styles.integrationHeader}>
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationName}>{integration.name}</Text>
                  <Text style={styles.pharmacyName}>{integration.pharmacyName}</Text>
                  <View style={styles.integrationMeta}>
                    <Text style={styles.integrationType}>
                      {t(`medication.pharmacyIntegration.types.${integration.integrationType}`)}
                    </Text>
                    <View style={styles.statusContainer}>
                      <Icon 
                        name={getStatusIcon(integration.status)} 
                        size={16} 
                        color={getStatusColor(integration.status)} 
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(integration.status) }]}>
                        {t(`medication.pharmacyIntegration.status.${integration.status}`)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.integrationActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleToggleStatus(integration)}
                  >
                    <Icon 
                      name={integration.status === INTEGRATION_STATUS.ACTIVE ? 'pause' : 'play-arrow'} 
                      size={20} 
                      color="#2563EB" 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditIntegration(integration)}
                  >
                    <Icon name="edit" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDeleteIntegration(integration)}
                  >
                    <Icon name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.integrationDetails}>
                {integration.lastSync && (
                  <Text style={styles.lastSync}>
                    {t('medication.pharmacyIntegration.lastSync')}: {
                      new Date(integration.lastSync).toLocaleString()
                    }
                  </Text>
                )}
                
                {integration.autoOrder && (
                  <View style={styles.autoOrderInfo}>
                    <Icon name="auto-awesome" size={16} color="#10B981" />
                    <Text style={styles.autoOrderText}>
                      {t('medication.pharmacyIntegration.autoOrderEnabled')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.integrationButtons}>
                <TouchableOpacity 
                  style={[styles.integrationButton, styles.testButton]}
                  onPress={() => handleTestConnection(integration)}
                  disabled={testingIntegration === integration.id}
                >
                  {testingIntegration === integration.id ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <Icon name="wifi-tethering" size={16} color="#2563EB" />
                  )}
                  <Text style={styles.testButtonText}>
                    {testingIntegration === integration.id ? 
                      t('common.testing') : t('medication.pharmacyIntegration.testConnection')
                    }
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.integrationButton, styles.syncButton]}
                  onPress={() => handleSyncStock(integration)}
                  disabled={syncingIntegration === integration.id || integration.status !== INTEGRATION_STATUS.ACTIVE}
                >
                  {syncingIntegration === integration.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="sync" size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.syncButtonText}>
                    {syncingIntegration === integration.id ? 
                      t('common.syncing') : t('medication.pharmacyIntegration.syncStock')
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Integration Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIntegration ? 
                  t('medication.pharmacyIntegration.editIntegration') : 
                  t('medication.pharmacyIntegration.addIntegration')
                }
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.name')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder={t('medication.pharmacyIntegration.namePlaceholder')}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.pharmacyName')} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.pharmacyName}
                  onChangeText={(text) => setForm({ ...form, pharmacyName: text })}
                  placeholder={t('medication.pharmacyIntegration.pharmacyNamePlaceholder')}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.integrationType')}</Text>
                <View style={styles.typeButtons}>
                  {Object.values(INTEGRATION_TYPES).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        form.integrationType === type && styles.typeButtonActive
                      ]}
                      onPress={() => setForm({ ...form, integrationType: type })}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        form.integrationType === type && styles.typeButtonTextActive
                      ]}>
                        {t(`medication.pharmacyIntegration.types.${type}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {form.integrationType === INTEGRATION_TYPES.API && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.apiEndpoint')}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.apiEndpoint}
                      onChangeText={(text) => setForm({ ...form, apiEndpoint: text })}
                      placeholder={t('medication.pharmacyIntegration.apiEndpointPlaceholder')}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.apiKey')}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.apiKey}
                      onChangeText={(text) => setForm({ ...form, apiKey: text })}
                      placeholder={t('medication.pharmacyIntegration.apiKeyPlaceholder')}
                      secureTextEntry
                    />
                  </View>
                </>
              )}

              {form.integrationType === INTEGRATION_TYPES.WEBHOOK && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.webhookUrl')}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.webhookUrl}
                    onChangeText={(text) => setForm({ ...form, webhookUrl: text })}
                    placeholder={t('medication.pharmacyIntegration.webhookUrlPlaceholder')}
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setForm({ ...form, autoOrder: !form.autoOrder })}
                >
                  <Icon 
                    name={form.autoOrder ? 'check-box' : 'check-box-outline-blank'} 
                    size={24} 
                    color="#2563EB" 
                  />
                  <Text style={styles.checkboxLabel}>
                    {t('medication.pharmacyIntegration.enableAutoOrder')}
                  </Text>
                </TouchableOpacity>
              </View>

              {form.autoOrder && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.autoOrderThreshold')}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.autoOrderThreshold.toString()}
                      onChangeText={(text) => setForm({ ...form, autoOrderThreshold: parseInt(text) || 7 })}
                      keyboardType="numeric"
                      placeholder="7"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>{t('medication.pharmacyIntegration.autoOrderLeadTime')}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.autoOrderLeadTime.toString()}
                      onChangeText={(text) => setForm({ ...form, autoOrderLeadTime: parseInt(text) || 3 })}
                      keyboardType="numeric"
                      placeholder="3"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveIntegration}
              >
                <Text style={styles.saveButtonText}>
                  {editingIntegration ? t('common.update') : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  integrationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  integrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pharmacyName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  integrationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  integrationType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  integrationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  integrationDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lastSync: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  autoOrderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoOrderText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  integrationButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  integrationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  testButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  testButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  syncButton: {
    backgroundColor: '#2563EB',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
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
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default PharmacyIntegrationCard; 