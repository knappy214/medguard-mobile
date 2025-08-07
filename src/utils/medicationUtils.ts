/**
 * MedGuard SA - Medication calculation and utility helpers
 * Provides medication-specific calculations, validations, and formatting
 * Supports South African medical standards and practices
 */

import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';

export interface MedicationDose {
  amount: number;
  unit: 'mg' | 'mcg' | 'ml' | 'units' | 'tablets' | 'capsules' | 'drops' | 'puffs';
  frequency: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'as_needed' | 'weekly' | 'monthly';
}

export interface MedicationStock {
  currentCount: number;
  totalCount: number;
  unitType: 'tablets' | 'capsules' | 'ml' | 'units';
  lowStockThreshold: number;
}

export interface MedicationSchedule {
  id: number;
  medicationId: number;
  timing: 'morning' | 'noon' | 'evening' | 'night' | 'custom';
  customTime?: string;
  daysOfWeek: boolean[];
  startDate: Date;
  endDate?: Date;
  dose: MedicationDose;
}

/**
 * Calculate daily medication intake amount
 */
export const calculateDailyIntake = (dose: MedicationDose): number => {
  const frequencyMultipliers = {
    once_daily: 1,
    twice_daily: 2,
    three_times_daily: 3,
    four_times_daily: 4,
    as_needed: 0, // Variable, cannot calculate
    weekly: 1/7,
    monthly: 1/30,
  };

  const multiplier = frequencyMultipliers[dose.frequency];
  return dose.amount * multiplier;
};

/**
 * Calculate how many days medication will last
 */
export const calculateDaysRemaining = (
  stock: MedicationStock,
  dose: MedicationDose
): number => {
  const dailyUsage = calculateDailyIntake(dose);
  
  if (dailyUsage === 0) {
    return -1; // Cannot calculate for "as needed" medications
  }
  
  return Math.floor(stock.currentCount / dailyUsage);
};

/**
 * Check if medication stock is low
 */
export const isStockLow = (stock: MedicationStock): boolean => {
  return stock.currentCount <= stock.lowStockThreshold;
};

/**
 * Check if medication is expired
 */
export const isMedicationExpired = (expirationDate: Date): boolean => {
  return isAfter(new Date(), expirationDate);
};

/**
 * Check if medication expires within specified days
 */
export const isExpiringWithinDays = (expirationDate: Date, days: number = 30): boolean => {
  const warningDate = addDays(new Date(), days);
  return isBefore(expirationDate, warningDate) && !isMedicationExpired(expirationDate);
};

/**
 * Format medication dosage for display
 */
export const formatDosage = (dose: MedicationDose): string => {
  const unitLabels = {
    mg: 'mg',
    mcg: 'mcg',
    ml: 'ml',
    units: dose.amount === 1 ? 'unit' : 'units',
    tablets: dose.amount === 1 ? 'tablet' : 'tablets',
    capsules: dose.amount === 1 ? 'capsule' : 'capsules',
    drops: dose.amount === 1 ? 'drop' : 'drops',
    puffs: dose.amount === 1 ? 'puff' : 'puffs',
  };

  return `${dose.amount} ${unitLabels[dose.unit]}`;
};

/**
 * Format medication frequency for display
 */
export const formatFrequency = (frequency: MedicationDose['frequency']): string => {
  const frequencyLabels = {
    once_daily: 'Once daily',
    twice_daily: 'Twice daily',
    three_times_daily: 'Three times daily',
    four_times_daily: 'Four times daily',
    as_needed: 'As needed',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return frequencyLabels[frequency];
};

/**
 * Calculate adherence rate based on taken vs scheduled doses
 */
export const calculateAdherenceRate = (
  dosesTaken: number,
  scheduledDoses: number
): number => {
  if (scheduledDoses === 0) return 0;
  return Math.round((dosesTaken / scheduledDoses) * 100);
};

/**
 * Get adherence rating based on percentage
 */
export const getAdherenceRating = (adherenceRate: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (adherenceRate >= 95) return 'excellent';
  if (adherenceRate >= 85) return 'good';
  if (adherenceRate >= 70) return 'fair';
  return 'poor';
};

/**
 * Calculate next dose time based on schedule
 */
export const calculateNextDoseTime = (schedule: MedicationSchedule): Date | null => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if schedule is active
  if (schedule.endDate && isAfter(now, schedule.endDate)) {
    return null; // Schedule has ended
  }
  
  if (isBefore(now, schedule.startDate)) {
    return null; // Schedule hasn't started yet
  }
  
  // Get time for dose
  let doseTime: Date;
  if (schedule.timing === 'custom' && schedule.customTime) {
    const [hours, minutes] = schedule.customTime.split(':').map(Number);
    doseTime = new Date(today.getTime());
    doseTime.setHours(hours, minutes, 0, 0);
  } else {
    const defaultTimes = {
      morning: { hours: 8, minutes: 0 },
      noon: { hours: 12, minutes: 0 },
      evening: { hours: 17, minutes: 0 },
      night: { hours: 20, minutes: 0 },
    };
    const time = defaultTimes[schedule.timing] || defaultTimes.morning;
    doseTime = new Date(today.getTime());
    doseTime.setHours(time.hours, time.minutes, 0, 0);
  }
  
  // Check if today's dose time has passed
  const todayDayIndex = now.getDay();
  if (schedule.daysOfWeek[todayDayIndex] && isAfter(doseTime, now)) {
    return doseTime; // Today's dose is still upcoming
  }
  
  // Find next scheduled day
  for (let i = 1; i <= 7; i++) {
    const nextDate = addDays(today, i);
    const nextDayIndex = nextDate.getDay();
    
    if (schedule.daysOfWeek[nextDayIndex]) {
      const nextDoseTime = new Date(nextDate.getTime());
      if (schedule.timing === 'custom' && schedule.customTime) {
        const [hours, minutes] = schedule.customTime.split(':').map(Number);
        nextDoseTime.setHours(hours, minutes, 0, 0);
      } else {
        const defaultTimes = {
          morning: { hours: 8, minutes: 0 },
          noon: { hours: 12, minutes: 0 },
          evening: { hours: 17, minutes: 0 },
          night: { hours: 20, minutes: 0 },
        };
        const time = defaultTimes[schedule.timing] || defaultTimes.morning;
        nextDoseTime.setHours(time.hours, time.minutes, 0, 0);
      }
      
      // Check if within schedule end date
      if (!schedule.endDate || isBefore(nextDoseTime, schedule.endDate)) {
        return nextDoseTime;
      }
    }
  }
  
  return null; // No more doses scheduled
};

/**
 * Validate medication name (South African naming conventions)
 */
export const validateMedicationName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Medication name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Medication name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Medication name must be less than 100 characters' };
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens, parentheses)
  const validNamePattern = /^[a-zA-Z0-9\s\-\(\)\.]+$/;
  if (!validNamePattern.test(name)) {
    return { isValid: false, error: 'Medication name contains invalid characters' };
  }
  
  return { isValid: true };
};

/**
 * Validate dosage amount
 */
export const validateDosage = (dose: MedicationDose): { isValid: boolean; error?: string } => {
  if (dose.amount <= 0) {
    return { isValid: false, error: 'Dosage amount must be greater than 0' };
  }
  
  // Check reasonable limits based on unit type
  const limits = {
    mg: { min: 0.001, max: 10000 },
    mcg: { min: 0.001, max: 10000 },
    ml: { min: 0.1, max: 500 },
    units: { min: 0.1, max: 1000 },
    tablets: { min: 0.25, max: 20 },
    capsules: { min: 1, max: 10 },
    drops: { min: 1, max: 50 },
    puffs: { min: 1, max: 20 },
  };
  
  const limit = limits[dose.unit];
  if (dose.amount < limit.min || dose.amount > limit.max) {
    return { 
      isValid: false, 
      error: `Dosage amount must be between ${limit.min} and ${limit.max} ${dose.unit}` 
    };
  }
  
  return { isValid: true };
};

/**
 * Parse medication strength string (e.g., "500mg", "2.5ml")
 */
export const parseStrength = (strengthStr: string): { amount: number; unit: string } | null => {
  const strengthPattern = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/;
  const match = strengthStr.trim().match(strengthPattern);
  
  if (!match) return null;
  
  const amount = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  return { amount, unit };
};

/**
 * Convert between medication units where possible
 */
export const convertUnits = (
  amount: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  const conversions: Record<string, Record<string, number>> = {
    mg: { mcg: 1000, g: 0.001 },
    mcg: { mg: 0.001, g: 0.000001 },
    g: { mg: 1000, mcg: 1000000 },
    ml: { l: 0.001 },
    l: { ml: 1000 },
  };
  
  if (fromUnit === toUnit) return amount;
  
  const fromConversions = conversions[fromUnit.toLowerCase()];
  if (!fromConversions) return null;
  
  const conversionFactor = fromConversions[toUnit.toLowerCase()];
  if (conversionFactor === undefined) return null;
  
  return amount * conversionFactor;
};

/**
 * Generate medication reminder text based on timing
 */
export const generateReminderText = (
  medicationName: string,
  dose: MedicationDose,
  timing: string
): string => {
  const dosageText = formatDosage(dose);
  const timingText = timing === 'custom' ? 'medication time' : timing;
  
  return `Time for your ${dosageText} of ${medicationName} (${timingText})`;
};

/**
 * Calculate medication cost per day (if price is available)
 */
export const calculateDailyCost = (
  totalCost: number,
  totalQuantity: number,
  dose: MedicationDose
): number => {
  const dailyUsage = calculateDailyIntake(dose);
  const costPerUnit = totalCost / totalQuantity;
  return costPerUnit * dailyUsage;
};

/**
 * Get medication interaction risk level
 */
export const getMedicationInteractionRisk = (
  medications: Array<{ activeIngredients: string[]; category: string }>
): 'low' | 'medium' | 'high' => {
  // This is a simplified risk assessment
  // In a real app, this would use a comprehensive drug interaction database
  
  const highRiskCombinations = [
    ['warfarin', 'aspirin'],
    ['digoxin', 'furosemide'],
    ['metformin', 'contrast'],
  ];
  
  const allIngredients = medications.flatMap(med => 
    med.activeIngredients.map(ingredient => ingredient.toLowerCase())
  );
  
  // Check for high-risk combinations
  for (const combo of highRiskCombinations) {
    if (combo.every(ingredient => allIngredients.includes(ingredient))) {
      return 'high';
    }
  }
  
  // Check for medium risk (multiple medications in same category)
  const categories = medications.map(med => med.category);
  const duplicateCategories = categories.filter(
    (category, index) => categories.indexOf(category) !== index
  );
  
  if (duplicateCategories.length > 0) {
    return 'medium';
  }
  
  return 'low';
};
