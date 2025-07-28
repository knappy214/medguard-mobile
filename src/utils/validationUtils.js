// Validation utilities for form inputs and data validation

export const validateMedicationName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }
  return { isValid: true, error: null };
};

export const validateDosage = (dosage) => {
  if (!dosage || dosage <= 0) {
    return { isValid: false, error: 'Dosage must be greater than 0' };
  }
  if (dosage > 1000) {
    return { isValid: false, error: 'Dosage must be less than 1000' };
  }
  return { isValid: true, error: null };
};

export const validateUnit = (unit) => {
  const validUnits = ['mg', 'g', 'ml', 'mcg', 'units', 'tablets', 'capsules', 'drops'];
  if (!unit || !validUnits.includes(unit.toLowerCase())) {
    return { isValid: false, error: 'Please select a valid unit' };
  }
  return { isValid: true, error: null };
};

export const validateFrequency = (frequency) => {
  const validFrequencies = ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'custom'];
  if (!frequency || !validFrequencies.includes(frequency)) {
    return { isValid: false, error: 'Please select a valid frequency' };
  }
  return { isValid: true, error: null };
};

export const validateTimes = (times, frequency) => {
  if (!times || times.length === 0) {
    return { isValid: false, error: 'At least one time is required' };
  }

  if (frequency === 'once_daily' && times.length !== 1) {
    return { isValid: false, error: 'Once daily requires exactly one time' };
  }

  if (frequency === 'twice_daily' && times.length !== 2) {
    return { isValid: false, error: 'Twice daily requires exactly two times' };
  }

  if (frequency === 'three_times_daily' && times.length !== 3) {
    return { isValid: false, error: 'Three times daily requires exactly three times' };
  }

  if (frequency === 'four_times_daily' && times.length !== 4) {
    return { isValid: false, error: 'Four times daily requires exactly four times' };
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  for (const time of times) {
    if (!timeRegex.test(time)) {
      return { isValid: false, error: 'Invalid time format. Use HH:MM' };
    }
  }

  // Check for duplicate times
  const uniqueTimes = new Set(times);
  if (uniqueTimes.size !== times.length) {
    return { isValid: false, error: 'Duplicate times are not allowed' };
  }

  return { isValid: true, error: null };
};

export const validateInstructions = (instructions) => {
  if (instructions && instructions.trim().length > 500) {
    return { isValid: false, error: 'Instructions must be less than 500 characters' };
  }
  return { isValid: true, error: null };
};

export const validateStockQuantity = (quantity) => {
  if (quantity === null || quantity === undefined) {
    return { isValid: true, error: null }; // Optional field
  }
  if (quantity < 0) {
    return { isValid: false, error: 'Stock quantity cannot be negative' };
  }
  if (quantity > 9999) {
    return { isValid: false, error: 'Stock quantity must be less than 9999' };
  }
  return { isValid: true, error: null };
};

export const validateStockLevel = (level) => {
  const validLevels = ['low', 'medium', 'high'];
  if (!level || !validLevels.includes(level)) {
    return { isValid: false, error: 'Please select a valid stock level' };
  }
  return { isValid: true, error: null };
};

export const validateMedicationData = (medication) => {
  const errors = {};

  const nameValidation = validateMedicationName(medication.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }

  const dosageValidation = validateDosage(medication.dosage);
  if (!dosageValidation.isValid) {
    errors.dosage = dosageValidation.error;
  }

  const unitValidation = validateUnit(medication.unit);
  if (!unitValidation.isValid) {
    errors.unit = unitValidation.error;
  }

  const frequencyValidation = validateFrequency(medication.frequency);
  if (!frequencyValidation.isValid) {
    errors.frequency = frequencyValidation.error;
  }

  const timesValidation = validateTimes(medication.times, medication.frequency);
  if (!timesValidation.isValid) {
    errors.times = timesValidation.error;
  }

  const instructionsValidation = validateInstructions(medication.instructions);
  if (!instructionsValidation.isValid) {
    errors.instructions = instructionsValidation.error;
  }

  const stockQuantityValidation = validateStockQuantity(medication.stockQuantity);
  if (!stockQuantityValidation.isValid) {
    errors.stockQuantity = stockQuantityValidation.error;
  }

  const stockLevelValidation = validateStockLevel(medication.stockLevel);
  if (!stockLevelValidation.isValid) {
    errors.stockLevel = stockLevelValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateTimeInput = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return { isValid: false, error: 'Invalid time format. Use HH:MM' };
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { isValid: false, error: 'Invalid time values' };
  }

  return { isValid: true, error: null };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: null };
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phone || !phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  return { isValid: true, error: null };
};

export const validateAge = (age) => {
  if (!age || age < 0 || age > 150) {
    return { isValid: false, error: 'Please enter a valid age' };
  }
  return { isValid: true, error: null };
};

// Utility function to format validation errors for display
export const formatValidationErrors = (errors) => {
  return Object.values(errors).filter(error => error).join('\n');
};

// Utility function to check if a form is valid
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0;
}; 