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
};

export const LANGUAGES = {
  ENGLISH: 'en',
  AFRIKAANS: 'af',
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
  refillReminder = false,
  refillQuantity = 0,
  startDate = new Date(),
  endDate = null,
  isActive = true,
  createdAt = new Date(),
  updatedAt = new Date(),
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
  refillReminder,
  refillQuantity,
  startDate,
  endDate,
  isActive,
  createdAt,
  updatedAt,
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
}) => ({
  language,
  notificationsEnabled,
  reminderTime,
  lowStockThreshold,
  theme,
  accessibility,
}); 