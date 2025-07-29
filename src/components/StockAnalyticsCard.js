import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import intelligentStockService from '../services/intelligentStockService';

const StockAnalyticsCard = ({ medicationId, onRefresh }) => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (medicationId) {
      loadAnalytics();
    }
  }, [medicationId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await intelligentStockService.calculateStockAnalytics(medicationId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert(
        t('common.error'),
        t('medication.stockAnalytics.loadError')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAnalytics();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = () => {
    Alert.alert(
      t('medication.stockAnalytics.generateReport'),
      t('medication.stockAnalytics.reportGenerated'),
      [{ text: t('common.ok') }]
    );
  };

  const handlePlaceOrder = () => {
    Alert.alert(
      t('medication.stockAnalytics.placeOrder'),
      t('medication.stockAnalytics.orderConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => {
          Alert.alert(t('common.success'), t('medication.stockAnalytics.orderPlaced'));
        }}
      ]
    );
  };

  const getStockLevelColor = (daysUntilStockout) => {
    if (daysUntilStockout <= 3) return '#EF4444'; // Red
    if (daysUntilStockout <= 7) return '#F59E0B'; // Orange
    if (daysUntilStockout <= 14) return '#10B981'; // Green
    return '#6B7280'; // Gray
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#10B981'; // Green
    if (confidence >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('medication.stockAnalytics.title')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('medication.stockAnalytics.title')}</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Icon 
            name="refresh" 
            size={24} 
            color="#2563EB" 
            style={refreshing ? styles.rotating : null}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Stock Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.currentStock')}</Text>
          <View style={styles.stockOverview}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t('medication.stockAnalytics.currentLevel')}</Text>
              <Text style={styles.stockValue}>{analytics.currentStock}</Text>
            </View>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>{t('medication.stockAnalytics.daysUntilStockout')}</Text>
              <Text style={[
                styles.stockValue, 
                { color: getStockLevelColor(analytics.daysUntilStockout) }
              ]}>
                {analytics.daysUntilStockout}
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Patterns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.usagePatterns')}</Text>
          <View style={styles.usageGrid}>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>{t('medication.stockAnalytics.daily')}</Text>
              <Text style={styles.usageValue}>{analytics.dailyUsageRate}</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>{t('medication.stockAnalytics.weekly')}</Text>
              <Text style={styles.usageValue}>{analytics.weeklyUsageRate}</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>{t('medication.stockAnalytics.monthly')}</Text>
              <Text style={styles.usageValue}>{analytics.monthlyUsageRate}</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageLabel}>{t('medication.stockAnalytics.volatility')}</Text>
              <Text style={styles.usageValue}>{analytics.usageVolatility}</Text>
            </View>
          </View>
        </View>

        {/* Stock Prediction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.prediction')}</Text>
          <View style={styles.predictionContainer}>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('medication.stockAnalytics.recommendedOrderQuantity')}</Text>
              <Text style={styles.predictionValue}>{analytics.recommendedOrderQuantity}</Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('medication.stockAnalytics.recommendedOrderDate')}</Text>
              <Text style={styles.predictionValue}>
                {analytics.recommendedOrderDate ? 
                  new Date(analytics.recommendedOrderDate).toLocaleDateString() : 
                  t('common.notAvailable')
                }
              </Text>
            </View>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>{t('medication.stockAnalytics.confidence')}</Text>
              <Text style={[
                styles.predictionValue, 
                { color: getConfidenceColor(analytics.predictionConfidence) }
              ]}>
                {analytics.predictionConfidence}%
              </Text>
            </View>
          </View>
        </View>

        {/* Warnings */}
        {analytics.warnings && analytics.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('medication.stockAnalytics.warnings')}</Text>
            {analytics.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Icon 
                  name="warning" 
                  size={20} 
                  color={warning.severity === 'critical' ? '#EF4444' : '#F59E0B'} 
                />
                <Text style={styles.warningText}>{warning.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleGenerateReport}>
            <Icon name="assessment" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>
              {t('medication.stockAnalytics.generateReport')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]} 
            onPress={handlePlaceOrder}
          >
            <Icon name="shopping-cart" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              {t('medication.stockAnalytics.placeOrder')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Last Updated */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('medication.stockAnalytics.lastUpdated')}: {
              new Date(analytics.lastUpdated).toLocaleString()
            }
          </Text>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  stockOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  predictionContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#374151',
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
});

export default StockAnalyticsCard; 