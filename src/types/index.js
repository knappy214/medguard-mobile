// Medication Types
export const MEDICATION_TYPES = {
  TABLET: 'tablet',
  CAPSULE: 'capsule',
  LIQUID: 'liquid',
  INJECTION: 'injection',
  INHALER: 'inhaler',
  CREAM: 'cream',
  DROPS: 'drops',
  OTHER: 'other',
};

export const FREQUENCY_TYPES = {
  DAILY: 'daily',
  TWICE_DAILY: 'twice_daily',
  THREE_TIMES_DAILY: 'three_times_daily',
  FOUR_TIMES_DAILY: 'four_times_daily',
  WEEKLY: 'weekly',
  CUSTOM: 'custom',
};

export const TIME_PERIODS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
  BEDTIME: 'bedtime',
};

export const STOCK_LEVELS = {
  FULL: 'full',
  MEDIUM: 'medium',
  LOW: 'low',
  EMPTY: 'empty',
};

export const NOTIFICATION_TYPES = {
  MEDICATION_REMINDER: 'medication_reminder',
  LOW_STOCK: 'low_stock',
  REFILL_REMINDER: 'refill_reminder',
  MISSED_DOSE: 'missed_dose',
  STOCK_ALERT: 'stock_alert',
  EXPIRATION_WARNING: 'expiration_warning',
};

export const LANGUAGES = {
  ENGLISH: 'en',
  AFRIKAANS: 'af',
};

// Intelligent Stock Tracking Types
export const INTEGRATION_TYPES = {
  API: 'api',
  EDI: 'edi',
  WEBHOOK: 'webhook',
  MANUAL: 'manual',
};

export const INTEGRATION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TESTING: 'testing',
  ERROR: 'error',
};

export const STOCK_ALERT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const STOCK_ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  EXPIRING_SOON: 'expiring_soon',
  OUT_OF_STOCK: 'out_of_stock',
  USAGE_SPIKE: 'usage_spike',
  PREDICTION_ALERT: 'prediction_alert',
};

// Medication Object Structure
export const createMedication = ({
  id = null,
  name = '',
  type = MEDICATION_TYPES.TABLET,
  dosage = '',
  frequency = FREQUENCY_TYPES.DAILY,
  times = [],
  instructions = '',
  stockLevel = STOCK_LEVELS.FULL,
  stockQuantity = 0,
  pillCount = 0, // Added for backend compatibility
  refillReminder = false,
  refillQuantity = 0,
  startDate = new Date(),
  endDate = null,
  isActive = true,
  createdAt = new Date(),
  updatedAt = new Date(),
  // Intelligent stock tracking fields
  expirationDate = null,
  batchNumber = '',
  supplier = '',
  cost = 0,
  autoOrder = false,
  autoOrderThreshold = 7,
  autoOrderQuantity = 30,
  lastStockUpdate = new Date(),
  usagePattern = {
    daily: 0,
    weekly: 0,
    monthly: 0,
    volatility: 0,
  },
  stockPrediction = {
    daysUntilStockout: 0,
    confidence: 0,
    recommendedOrderDate: null,
    recommendedOrderQuantity: 0,
  },
}) => ({
  id,
  name,
  type,
  dosage,
  frequency,
  times,
  instructions,
  stockLevel,
  stockQuantity,
  pillCount,
  refillReminder,
  refillQuantity,
  startDate,
  endDate,
  isActive,
  createdAt,
  updatedAt,
  expirationDate,
  batchNumber,
  supplier,
  cost,
  autoOrder,
  autoOrderThreshold,
  autoOrderQuantity,
  lastStockUpdate,
  usagePattern,
  stockPrediction,
});

// Stock Analytics Object Structure
export const createStockAnalytics = ({
  medicationId = null,
  currentStock = 0,
  daysUntilStockout = 0,
  dailyUsageRate = 0,
  weeklyUsageRate = 0,
  monthlyUsageRate = 0,
  usageVolatility = 0,
  recommendedOrderQuantity = 0,
  recommendedOrderDate = null,
  predictionConfidence = 0,
  lastUpdated = new Date(),
  warnings = [],
  trends = {
    stockLevel: [],
    usageRate: [],
    predictionAccuracy: [],
  },
}) => ({
  medicationId,
  currentStock,
  daysUntilStockout,
  dailyUsageRate,
  weeklyUsageRate,
  monthlyUsageRate,
  usageVolatility,
  recommendedOrderQuantity,
  recommendedOrderDate,
  predictionConfidence,
  lastUpdated,
  warnings,
  trends,
});

// Pharmacy Integration Object Structure
export const createPharmacyIntegration = ({
  id = null,
  name = '',
  pharmacyName = '',
  integrationType = INTEGRATION_TYPES.API,
  apiEndpoint = '',
  apiKey = '',
  webhookUrl = '',
  status = INTEGRATION_STATUS.INACTIVE,
  autoOrder = false,
  autoOrderThreshold = 7,
  autoOrderLeadTime = 3,
  lastSync = null,
  syncFrequency = 'daily',
  credentials = {},
  settings = {},
  createdAt = new Date(),
  updatedAt = new Date(),
}) => ({
  id,
  name,
  pharmacyName,
  integrationType,
  apiEndpoint,
  apiKey,
  webhookUrl,
  status,
  autoOrder,
  autoOrderThreshold,
  autoOrderLeadTime,
  lastSync,
  syncFrequency,
  credentials,
  settings,
  createdAt,
  updatedAt,
});

// Stock Alert Object Structure
export const createStockAlert = ({
  id = null,
  medicationId = null,
  type = STOCK_ALERT_TYPES.LOW_STOCK,
  priority = STOCK_ALERT_PRIORITIES.MEDIUM,
  title = '',
  message = '',
  currentStock = 0,
  threshold = 0,
  isRead = false,
  isResolved = false,
  createdAt = new Date(),
  resolvedAt = null,
  actionTaken = '',
}) => ({
  id,
  medicationId,
  type,
  priority,
  title,
  message,
  currentStock,
  threshold,
  isRead,
  isResolved,
  createdAt,
  resolvedAt,
  actionTaken,
});

// Stock Transaction Object Structure
export const createStockTransaction = ({
  id = null,
  medicationId = null,
  type = 'adjustment', // adjustment, usage, order, delivery, expiration
  quantity = 0,
  previousStock = 0,
  newStock = 0,
  reason = '',
  notes = '',
  transactionDate = new Date(),
  batchNumber = '',
  cost = 0,
  supplier = '',
}) => ({
  id,
  medicationId,
  type,
  quantity,
  previousStock,
  newStock,
  reason,
  notes,
  transactionDate,
  batchNumber,
  cost,
  supplier,
});

// Schedule Object Structure
export const createSchedule = ({
  id = null,
  medicationId = null,
  date = new Date(),
  time = '',
  status = 'pending', // pending, taken, missed, skipped
  takenAt = null,
  notes = '',
}) => ({
  id,
  medicationId,
  date,
  time,
  status,
  takenAt,
  notes,
});

// Notification Object Structure
export const createNotification = ({
  id = null,
  type = NOTIFICATION_TYPES.MEDICATION_REMINDER,
  title = '',
  body = '',
  data = {},
  scheduledFor = null,
  isRead = false,
  createdAt = new Date(),
}) => ({
  id,
  type,
  title,
  body,
  data,
  scheduledFor,
  isRead,
  createdAt,
});

// App Settings Object Structure
export const createAppSettings = ({
  language = LANGUAGES.ENGLISH,
  notificationsEnabled = true,
  reminderTime = 15, // minutes before scheduled time
  lowStockThreshold = 7, // days
  theme = 'light', // light, dark, auto
  accessibility = {
    largeText: false,
    highContrast: false,
    screenReader: false,
  },
  // Intelligent stock tracking settings
  stockTrackingEnabled = true,
  autoOrderEnabled = false,
  predictionEnabled = true,
  alertThresholds = {
    lowStock: 7,
    criticalStock: 3,
    expirationWarning: 30,
  },
  syncFrequency = 'daily',
  analyticsEnabled = true,
}) => ({
  language,
  notificationsEnabled,
  reminderTime,
  lowStockThreshold,
  theme,
  accessibility,
  stockTrackingEnabled,
  autoOrderEnabled,
  predictionEnabled,
  alertThresholds,
  syncFrequency,
  analyticsEnabled,
}); 