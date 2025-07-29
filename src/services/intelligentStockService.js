import storageService from './storageService';
import { 
  createStockAnalytics, 
  createStockAlert, 
  createStockTransaction,
  STOCK_ALERT_TYPES,
  STOCK_ALERT_PRIORITIES,
  INTEGRATION_STATUS
} from '../types';

class IntelligentStockService {
  // Stock Analytics Methods
  
  /**
   * Calculate stock analytics for a medication
   */
  async calculateStockAnalytics(medicationId) {
    try {
      const medications = await storageService.getMedications();
      const medication = medications.find(m => m.id === medicationId);
      
      if (!medication) {
        throw new Error('Medication not found');
      }

      const transactions = await storageService.getStockTransactionsForMedication(medicationId, 100);
      const schedules = await storageService.getSchedules();
      const medicationSchedules = schedules.filter(s => s.medicationId === medicationId);

      // Calculate usage patterns
      const usagePattern = this.calculateUsagePattern(medicationSchedules, transactions);
      
      // Calculate stock prediction
      const stockPrediction = this.calculateStockPrediction(
        medication.stockQuantity,
        usagePattern.daily,
        usagePattern.volatility
      );

      // Generate warnings
      const warnings = this.generateWarnings(medication, stockPrediction);

      const analytics = createStockAnalytics({
        medicationId,
        currentStock: medication.stockQuantity,
        daysUntilStockout: stockPrediction.daysUntilStockout,
        dailyUsageRate: usagePattern.daily,
        weeklyUsageRate: usagePattern.weekly,
        monthlyUsageRate: usagePattern.monthly,
        usageVolatility: usagePattern.volatility,
        recommendedOrderQuantity: stockPrediction.recommendedOrderQuantity,
        recommendedOrderDate: stockPrediction.recommendedOrderDate,
        predictionConfidence: stockPrediction.confidence,
        lastUpdated: new Date(),
        warnings,
      });

      await storageService.updateStockAnalytics(medicationId, analytics);
      return analytics;
    } catch (error) {
      console.error('Error calculating stock analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate usage pattern from schedules and transactions
   */
  calculateUsagePattern(schedules, transactions) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate from schedules
    const recentSchedules = schedules.filter(s => 
      new Date(s.date) >= thirtyDaysAgo && s.status === 'taken'
    );

    // Calculate from transactions
    const usageTransactions = transactions.filter(t => 
      t.type === 'usage' && new Date(t.transactionDate) >= thirtyDaysAgo
    );

    const totalUsage = recentSchedules.length + usageTransactions.length;
    const dailyUsage = totalUsage / 30;
    const weeklyUsage = dailyUsage * 7;
    const monthlyUsage = dailyUsage * 30;

    // Calculate volatility (standard deviation of daily usage)
    const dailyUsageArray = this.getDailyUsageArray(schedules, transactions, 30);
    const volatility = this.calculateVolatility(dailyUsageArray);

    return {
      daily: Math.round(dailyUsage * 100) / 100,
      weekly: Math.round(weeklyUsage * 100) / 100,
      monthly: Math.round(monthlyUsage * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
    };
  }

  /**
   * Calculate stock prediction
   */
  calculateStockPrediction(currentStock, dailyUsage, volatility) {
    if (dailyUsage <= 0) {
      return {
        daysUntilStockout: 999,
        confidence: 0,
        recommendedOrderQuantity: 30,
        recommendedOrderDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }

    const daysUntilStockout = Math.floor(currentStock / dailyUsage);
    const confidence = Math.max(0, 100 - (volatility * 20)); // Higher volatility = lower confidence
    
    // Recommend ordering when 7 days of stock remaining
    const recommendedOrderDate = new Date(Date.now() + (daysUntilStockout - 7) * 24 * 60 * 60 * 1000);
    const recommendedOrderQuantity = Math.ceil(dailyUsage * 30); // 30 days supply

    return {
      daysUntilStockout,
      confidence: Math.round(confidence),
      recommendedOrderQuantity,
      recommendedOrderDate,
    };
  }

  /**
   * Generate warnings based on stock levels and predictions
   */
  generateWarnings(medication, stockPrediction) {
    const warnings = [];

    // Low stock warning
    if (stockPrediction.daysUntilStockout <= 7) {
      warnings.push({
        type: 'low_stock',
        severity: stockPrediction.daysUntilStockout <= 3 ? 'critical' : 'high',
        message: `Low stock: ${stockPrediction.daysUntilStockout} days remaining`,
      });
    }

    // Expiration warning
    if (medication.expirationDate) {
      const daysUntilExpiration = Math.ceil(
        (new Date(medication.expirationDate) - new Date()) / (24 * 60 * 60 * 1000)
      );
      
      if (daysUntilExpiration <= 30) {
        warnings.push({
          type: 'expiring_soon',
          severity: daysUntilExpiration <= 7 ? 'critical' : 'medium',
          message: `Expires in ${daysUntilExpiration} days`,
        });
      }
    }

    // Low confidence warning
    if (stockPrediction.confidence < 70) {
      warnings.push({
        type: 'low_confidence',
        severity: 'medium',
        message: `Low prediction confidence: ${stockPrediction.confidence}%`,
      });
    }

    return warnings;
  }

  /**
   * Get daily usage array for volatility calculation
   */
  getDailyUsageArray(schedules, transactions, days) {
    const usageByDay = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      usageByDay[dateKey] = 0;
    }

    // Count usage from schedules
    schedules.forEach(schedule => {
      if (schedule.status === 'taken') {
        const dateKey = new Date(schedule.date).toISOString().split('T')[0];
        if (usageByDay[dateKey] !== undefined) {
          usageByDay[dateKey]++;
        }
      }
    });

    // Count usage from transactions
    transactions.forEach(transaction => {
      if (transaction.type === 'usage') {
        const dateKey = new Date(transaction.transactionDate).toISOString().split('T')[0];
        if (usageByDay[dateKey] !== undefined) {
          usageByDay[dateKey]++;
        }
      }
    });

    return Object.values(usageByDay);
  }

  /**
   * Calculate volatility (standard deviation)
   */
  calculateVolatility(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  // Stock Alert Methods

  /**
   * Check and create stock alerts
   */
  async checkAndCreateStockAlerts() {
    try {
      const medications = await storageService.getMedications();
      const alerts = [];

      for (const medication of medications) {
        if (!medication.isActive) continue;

        const analytics = await this.calculateStockAnalytics(medication.id);
        
        // Check for low stock alerts
        if (analytics.daysUntilStockout <= 7) {
          const priority = analytics.daysUntilStockout <= 3 ? 
            STOCK_ALERT_PRIORITIES.CRITICAL : STOCK_ALERT_PRIORITIES.HIGH;

          alerts.push(createStockAlert({
            medicationId: medication.id,
            type: STOCK_ALERT_TYPES.LOW_STOCK,
            priority,
            title: 'Low Stock Alert',
            message: `${medication.name} is running low. ${analytics.daysUntilStockout} days remaining.`,
            currentStock: medication.stockQuantity,
            threshold: 7,
          }));
        }

        // Check for expiration alerts
        if (medication.expirationDate) {
          const daysUntilExpiration = Math.ceil(
            (new Date(medication.expirationDate) - new Date()) / (24 * 60 * 60 * 1000)
          );

          if (daysUntilExpiration <= 30) {
            alerts.push(createStockAlert({
              medicationId: medication.id,
              type: STOCK_ALERT_TYPES.EXPIRING_SOON,
              priority: daysUntilExpiration <= 7 ? 
                STOCK_ALERT_PRIORITIES.CRITICAL : STOCK_ALERT_PRIORITIES.MEDIUM,
              title: 'Expiration Warning',
              message: `${medication.name} expires in ${daysUntilExpiration} days.`,
              currentStock: medication.stockQuantity,
              threshold: 30,
            }));
          }
        }
      }

      // Save new alerts
      for (const alert of alerts) {
        await storageService.addStockAlert(alert);
      }

      return alerts;
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      throw error;
    }
  }

  // Stock Transaction Methods

  /**
   * Record a dose taken (usage transaction)
   */
  async recordDoseTaken(medicationId, quantity = 1, notes = '') {
    try {
      const medications = await storageService.getMedications();
      const medication = medications.find(m => m.id === medicationId);
      
      if (!medication) {
        throw new Error('Medication not found');
      }

      const previousStock = medication.stockQuantity;
      const newStock = Math.max(0, previousStock - quantity);

      // Create transaction
      const transaction = createStockTransaction({
        medicationId,
        type: 'usage',
        quantity: -quantity,
        previousStock,
        newStock,
        reason: 'Dose taken',
        notes,
        transactionDate: new Date(),
      });

      await storageService.addStockTransaction(transaction);

      // Update medication stock
      medication.stockQuantity = newStock;
      medication.lastStockUpdate = new Date();
      await storageService.saveMedications(medications);

      // Recalculate analytics
      await this.calculateStockAnalytics(medicationId);

      return transaction;
    } catch (error) {
      console.error('Error recording dose taken:', error);
      throw error;
    }
  }

  /**
   * Adjust stock manually
   */
  async adjustStock(medicationId, quantity, reason, notes = '') {
    try {
      const medications = await storageService.getMedications();
      const medication = medications.find(m => m.id === medicationId);
      
      if (!medication) {
        throw new Error('Medication not found');
      }

      const previousStock = medication.stockQuantity;
      const newStock = Math.max(0, previousStock + quantity);

      // Create transaction
      const transaction = createStockTransaction({
        medicationId,
        type: 'adjustment',
        quantity,
        previousStock,
        newStock,
        reason,
        notes,
        transactionDate: new Date(),
      });

      await storageService.addStockTransaction(transaction);

      // Update medication stock
      medication.stockQuantity = newStock;
      medication.lastStockUpdate = new Date();
      await storageService.saveMedications(medications);

      // Recalculate analytics
      await this.calculateStockAnalytics(medicationId);

      return transaction;
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  // Pharmacy Integration Methods

  /**
   * Test pharmacy integration connection
   */
  async testPharmacyIntegration(integrationId) {
    try {
      const integrations = await storageService.getPharmacyIntegrations();
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Update status to testing
      await storageService.updatePharmacyIntegration(integrationId, {
        status: INTEGRATION_STATUS.TESTING,
      });

      // Simulate connection test (in real app, this would make API calls)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const isSuccess = Math.random() > 0.3; // 70% success rate for demo

      const newStatus = isSuccess ? INTEGRATION_STATUS.ACTIVE : INTEGRATION_STATUS.ERROR;
      
      await storageService.updatePharmacyIntegration(integrationId, {
        status: newStatus,
        lastSync: isSuccess ? new Date() : null,
      });

      return {
        success: isSuccess,
        message: isSuccess ? 'Connection successful' : 'Connection failed',
        status: newStatus,
      };
    } catch (error) {
      console.error('Error testing pharmacy integration:', error);
      throw error;
    }
  }

  /**
   * Sync stock with pharmacy
   */
  async syncStockWithPharmacy(integrationId) {
    try {
      const integrations = await storageService.getPharmacyIntegrations();
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        throw new Error('Integration not found');
      }

      if (integration.status !== INTEGRATION_STATUS.ACTIVE) {
        throw new Error('Integration is not active');
      }

      // Simulate stock sync (in real app, this would make API calls)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const success = Math.random() > 0.2; // 80% success rate for demo

      if (success) {
        await storageService.updatePharmacyIntegration(integrationId, {
          lastSync: new Date(),
        });
      }

      return {
        success,
        message: success ? 'Stock synced successfully' : 'Sync failed',
        syncedAt: success ? new Date() : null,
      };
    } catch (error) {
      console.error('Error syncing stock:', error);
      throw error;
    }
  }

  // Dashboard Methods

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics() {
    try {
      const medications = await storageService.getMedications();
      const activeMedications = medications.filter(m => m.isActive);
      
      const analytics = await Promise.all(
        activeMedications.map(m => this.calculateStockAnalytics(m.id))
      );

      const totalStock = activeMedications.reduce((sum, m) => sum + m.stockQuantity, 0);
      const lowStockCount = analytics.filter(a => a.daysUntilStockout <= 7).length;
      const criticalStockCount = analytics.filter(a => a.daysUntilStockout <= 3).length;
      const expiringSoonCount = activeMedications.filter(m => {
        if (!m.expirationDate) return false;
        const daysUntilExpiration = Math.ceil(
          (new Date(m.expirationDate) - new Date()) / (24 * 60 * 60 * 1000)
        );
        return daysUntilExpiration <= 30;
      }).length;

      const unreadAlerts = await storageService.getUnreadStockAlerts();

      return {
        totalMedications: activeMedications.length,
        totalStock,
        lowStockCount,
        criticalStockCount,
        expiringSoonCount,
        unreadAlertsCount: unreadAlerts.length,
        averageConfidence: analytics.length > 0 ? 
          Math.round(analytics.reduce((sum, a) => sum + a.predictionConfidence, 0) / analytics.length) : 0,
        recentAnalytics: analytics.slice(0, 5), // Top 5 medications
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get low stock alerts for dashboard
   */
  async getLowStockAlerts() {
    try {
      const alerts = await storageService.getStockAlerts();
      return alerts
        .filter(a => a.type === STOCK_ALERT_TYPES.LOW_STOCK && !a.isResolved)
        .sort((a, b) => {
          // Sort by priority (critical first)
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 10); // Top 10 alerts
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      throw error;
    }
  }

  /**
   * Get expiring soon medications
   */
  async getExpiringSoonMedications() {
    try {
      const medications = await storageService.getMedications();
      const now = new Date();
      
      return medications
        .filter(m => m.isActive && m.expirationDate)
        .map(m => {
          const daysUntilExpiration = Math.ceil(
            (new Date(m.expirationDate) - now) / (24 * 60 * 60 * 1000)
          );
          return { ...m, daysUntilExpiration };
        })
        .filter(m => m.daysUntilExpiration <= 30)
        .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
        .slice(0, 10); // Top 10 expiring soon
    } catch (error) {
      console.error('Error getting expiring soon medications:', error);
      throw error;
    }
  }
}

export default new IntelligentStockService(); 