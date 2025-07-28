/**
 * i18n Test Utility
 * 
 * This file provides test functions to verify the internationalization
 * implementation, including pluralization and medical terminology.
 */

import { useTranslation } from 'react-i18next';

/**
 * Test pluralization functionality
 * @param {Function} t - Translation function
 * @returns {Object} Test results
 */
export const testPluralization = (t) => {
  const results = {
    medicationCount: {
      singular: t('home.medicationCount', { count: 1 }),
      plural: t('home.medicationCount', { count: 5 }),
    },
    doseCount: {
      singular: t('home.doseCount', { count: 1 }),
      plural: t('home.doseCount', { count: 3 }),
    },
    tabletCount: {
      singular: t('home.tabletCount', { count: 1 }),
      plural: t('home.tabletCount', { count: 10 }),
    },
    hourCount: {
      singular: t('times.hourCount', { count: 1 }),
      plural: t('times.hourCount', { count: 24 }),
    },
    dayCount: {
      singular: t('schedule.dayCount', { count: 1 }),
      plural: t('schedule.dayCount', { count: 7 }),
    },
  };

  console.log('Pluralization Test Results:', results);
  return results;
};

/**
 * Test medical terminology translations
 * @param {Function} t - Translation function
 * @returns {Object} Test results
 */
export const testMedicalTerminology = (t) => {
  const results = {
    medicationTypes: {
      prescription: t('medical.prescription'),
      overTheCounter: t('medical.overTheCounter'),
      supplement: t('medical.supplement'),
      antibiotic: t('medical.antibiotic'),
      painkiller: t('medical.painkiller'),
    },
    conditions: {
      bloodPressure: t('medical.bloodPressure'),
      diabetes: t('medical.diabetes'),
      heart: t('medical.heart'),
      cholesterol: t('medical.cholesterol'),
      asthma: t('medical.asthma'),
      allergy: t('medical.allergy'),
    },
    instructions: {
      takeWithFood: t('medical.takeWithFood'),
      takeOnEmptyStomach: t('medical.takeOnEmptyStomach'),
      avoidAlcohol: t('medical.avoidAlcohol'),
      avoidDairy: t('medical.avoidDairy'),
      storeInRefrigerator: t('medical.storeInRefrigerator'),
      keepAtRoomTemperature: t('medical.keepAtRoomTemperature'),
    },
    medicalTerms: {
      sideEffects: t('medical.sideEffects'),
      contraindications: t('medical.contraindications'),
      interactions: t('medical.interactions'),
      dosageInstructions: t('medical.dosageInstructions'),
    },
  };

  console.log('Medical Terminology Test Results:', results);
  return results;
};

/**
 * Test interpolation functionality
 * @param {Function} t - Translation function
 * @returns {Object} Test results
 */
export const testInterpolation = (t) => {
  const results = {
    reminderMessage: t('notifications.reminderMessage', { medication: 'Aspirin' }),
    lowStockMessage: t('notifications.lowStockMessage', { medication: 'Insulin' }),
    refillMessage: t('notifications.refillMessage', { medication: 'Metformin' }),
    markAsTakenMessage: t('alerts.markAsTakenMessage', { 
      medication: 'Warfarin', 
      time: 'morning' 
    }),
    markAsMissedMessage: t('alerts.markAsMissedMessage', { 
      medication: 'Lisinopril', 
      time: 'evening' 
    }),
  };

  console.log('Interpolation Test Results:', results);
  return results;
};

/**
 * Test common UI elements
 * @param {Function} t - Translation function
 * @returns {Object} Test results
 */
export const testCommonUI = (t) => {
  const results = {
    buttons: {
      save: t('common.save'),
      cancel: t('common.cancel'),
      delete: t('common.delete'),
      edit: t('common.edit'),
      add: t('common.add'),
      confirm: t('common.confirm'),
      back: t('common.back'),
      next: t('common.next'),
      done: t('common.done'),
    },
    status: {
      loading: t('common.loading'),
      error: t('common.error'),
      success: t('common.success'),
      warning: t('common.warning'),
      info: t('common.info'),
    },
    navigation: {
      home: t('navigation.home'),
      medications: t('navigation.medications'),
      settings: t('navigation.settings'),
      addMedication: t('navigation.addMedication'),
      medicationDetails: t('navigation.medicationDetails'),
    },
  };

  console.log('Common UI Test Results:', results);
  return results;
};

/**
 * Comprehensive i18n test function
 * Runs all tests and returns combined results
 * @returns {Object} All test results
 */
export const runAllI18nTests = () => {
  const { t } = useTranslation();
  
  const results = {
    pluralization: testPluralization(t),
    medicalTerminology: testMedicalTerminology(t),
    interpolation: testInterpolation(t),
    commonUI: testCommonUI(t),
  };

  console.log('=== Complete i18n Test Results ===');
  console.log(results);
  
  return results;
};

/**
 * React Hook for i18n testing
 * Can be used in components for testing
 */
export const useI18nTest = () => {
  const { t } = useTranslation();

  return {
    testPluralization: () => testPluralization(t),
    testMedicalTerminology: () => testMedicalTerminology(t),
    testInterpolation: () => testInterpolation(t),
    testCommonUI: () => testCommonUI(t),
    runAllTests: () => runAllI18nTests(),
  };
};

/**
 * Validate translation completeness
 * Checks if all required keys are present
 * @param {Function} t - Translation function
 * @returns {Object} Validation results
 */
export const validateTranslations = (t) => {
  const requiredKeys = [
    'common.save',
    'common.cancel',
    'common.delete',
    'common.edit',
    'common.add',
    'common.confirm',
    'common.back',
    'common.next',
    'common.done',
    'common.loading',
    'common.error',
    'common.success',
    'common.warning',
    'common.info',
    'navigation.home',
    'navigation.medications',
    'navigation.settings',
    'navigation.addMedication',
    'navigation.medicationDetails',
    'home.title',
    'home.noMedications',
    'home.upcoming',
    'home.taken',
    'home.missed',
    'medications.title',
    'medications.addNew',
    'medications.noMedications',
    'medical.prescription',
    'medical.antibiotic',
    'medical.diabetes',
    'medical.sideEffects',
    'medical.takeWithFood',
    'medical.avoidAlcohol',
  ];

  const missingKeys = [];
  const presentKeys = [];

  requiredKeys.forEach(key => {
    try {
      const translation = t(key);
      if (translation === key) {
        missingKeys.push(key);
      } else {
        presentKeys.push(key);
      }
    } catch (error) {
      missingKeys.push(key);
    }
  });

  const results = {
    total: requiredKeys.length,
    present: presentKeys.length,
    missing: missingKeys.length,
    missingKeys,
    presentKeys,
    completeness: (presentKeys.length / requiredKeys.length) * 100,
  };

  console.log('Translation Validation Results:', results);
  return results;
};

export default {
  testPluralization,
  testMedicalTerminology,
  testInterpolation,
  testCommonUI,
  runAllI18nTests,
  useI18nTest,
  validateTranslations,
}; 