/**
 * MedGuard SA - Form validation utilities
 * Provides comprehensive validation for user inputs across the application
 * Supports South African formats and medical data validation
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation with South African domain support
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email address is required' };
  }

  // Basic email format validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Check for common South African domains
  const commonSADomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'webmail.co.za', 'mweb.co.za', 'telkomsa.net', 'vodamail.co.za',
    'iafrica.com', 'icon.co.za', 'global.co.za'
  ];

  // Email length validation
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  return { isValid: true };
};

/**
 * South African phone number validation
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, hyphens, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // South African phone number patterns:
  // Mobile: 0[6-8][0-9]{8} or +27[6-8][0-9]{8}
  // Landline: 0[1-5][0-9]{7,8} or +27[1-5][0-9]{7,8}
  const saPhonePatterns = [
    /^0[6-8][0-9]{8}$/, // Mobile (011 digits starting with 06-08)
    /^0[1-5][0-9]{7,8}$/, // Landline (010-011 digits starting with 01-05)
    /^\+27[6-8][0-9]{8}$/, // International mobile
    /^\+27[1-5][0-9]{7,8}$/, // International landline
  ];

  const isValidSANumber = saPhonePatterns.some(pattern => pattern.test(cleanPhone));

  if (!isValidSANumber) {
    return { 
      isValid: false, 
      error: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' 
    };
  }

  return { isValid: true };
};

/**
 * South African ID number validation
 */
export const validateSAIdNumber = (idNumber: string): ValidationResult => {
  if (!idNumber || idNumber.trim().length === 0) {
    return { isValid: false, error: 'ID number is required' };
  }

  const cleanId = idNumber.replace(/\s/g, '');

  // SA ID numbers are 13 digits
  if (!/^\d{13}$/.test(cleanId)) {
    return { isValid: false, error: 'ID number must be 13 digits' };
  }

  // Luhn algorithm check for SA ID numbers
  const digits = cleanId.split('').map(Number);
  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 2; i >= 0; i--) {
    let digit = digits[i];
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  if (checkDigit !== digits[12]) {
    return { isValid: false, error: 'Invalid ID number' };
  }

  // Additional validation: birth date
  const birthDate = cleanId.substring(0, 6);
  const year = parseInt(birthDate.substring(0, 2), 10);
  const month = parseInt(birthDate.substring(2, 4), 10);
  const day = parseInt(birthDate.substring(4, 6), 10);

  // Determine century (00-21 = 20xx, 22-99 = 19xx)
  const fullYear = year <= 21 ? 2000 + year : 1900 + year;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { isValid: false, error: 'Invalid birth date in ID number' };
  }

  // Check if person is at least 13 years old (minimum age for medical app)
  const birthDateObj = new Date(fullYear, month - 1, day);
  const today = new Date();
  const age = today.getFullYear() - birthDateObj.getFullYear();
  
  if (age < 13) {
    return { isValid: false, error: 'Must be at least 13 years old to use this app' };
  }

  return { isValid: true };
};

/**
 * Password validation with medical app security requirements
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 
    'admin123', 'letmein', 'welcome123', 'password1'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'This password is too common. Please choose a stronger password' };
  }

  return { isValid: true };
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Name validation (first name, last name)
 */
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }

  if (name.length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const namePattern = /^[a-zA-Z\s\-']+$/;
  if (!namePattern.test(name)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { isValid: true };
};

/**
 * Date validation (birth date, expiration date, etc.)
 */
export const validateDate = (
  dateStr: string, 
  fieldName: string = 'Date',
  options: {
    allowFuture?: boolean;
    allowPast?: boolean;
    minAge?: number;
    maxAge?: number;
  } = {}
): ValidationResult => {
  const { allowFuture = true, allowPast = true, minAge, maxAge } = options;

  if (!dateStr || dateStr.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  // Support multiple date formats
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or DD/M/YYYY etc.
  ];

  const isValidFormat = dateFormats.some(pattern => pattern.test(dateStr));
  if (!isValidFormat) {
    return { isValid: false, error: `${fieldName} must be in DD/MM/YYYY format` };
  }

  let date: Date;
  
  if (dateStr.includes('-')) {
    // YYYY-MM-DD format
    date = new Date(dateStr);
  } else {
    // DD/MM/YYYY format
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    date = new Date(year, month, day);
  }

  if (isNaN(date.getTime())) {
    return { isValid: false, error: `${fieldName} is not a valid date` };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!allowFuture && date > today) {
    return { isValid: false, error: `${fieldName} cannot be in the future` };
  }

  if (!allowPast && date < today) {
    return { isValid: false, error: `${fieldName} cannot be in the past` };
  }

  // Age validation for birth dates
  if (minAge || maxAge) {
    const ageInYears = Math.floor((today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (minAge && ageInYears < minAge) {
      return { isValid: false, error: `Must be at least ${minAge} years old` };
    }
    
    if (maxAge && ageInYears > maxAge) {
      return { isValid: false, error: `Must be less than ${maxAge} years old` };
    }
  }

  return { isValid: true };
};

/**
 * Medical information validation
 */
export const validateMedicalInfo = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return { isValid: true }; // Medical info is often optional
  }

  if (value.length > 500) {
    return { isValid: false, error: `${fieldName} must be less than 500 characters` };
  }

  // Basic sanitization check - no HTML tags
  const htmlPattern = /<[^>]*>/g;
  if (htmlPattern.test(value)) {
    return { isValid: false, error: `${fieldName} cannot contain HTML tags` };
  }

  return { isValid: true };
};

/**
 * Emergency contact validation
 */
export const validateEmergencyContact = (contact: {
  name: string;
  phone: string;
  relationship: string;
}): ValidationResult => {
  const nameValidation = validateName(contact.name, 'Emergency contact name');
  if (!nameValidation.isValid) return nameValidation;

  const phoneValidation = validatePhoneNumber(contact.phone);
  if (!phoneValidation.isValid) return phoneValidation;

  if (!contact.relationship || contact.relationship.trim().length === 0) {
    return { isValid: false, error: 'Relationship is required' };
  }

  if (contact.relationship.length > 50) {
    return { isValid: false, error: 'Relationship must be less than 50 characters' };
  }

  return { isValid: true };
};

/**
 * Medication dosage validation
 */
export const validateDosage = (dosage: string): ValidationResult => {
  if (!dosage || dosage.trim().length === 0) {
    return { isValid: false, error: 'Dosage is required' };
  }

  // Pattern for dosage: number + unit (e.g., "500mg", "2.5ml", "1 tablet")
  const dosagePattern = /^\d+(\.\d+)?\s*(mg|mcg|g|ml|l|tablet|tablets|capsule|capsules|drop|drops|puff|puffs|unit|units)$/i;
  
  if (!dosagePattern.test(dosage.trim())) {
    return { 
      isValid: false, 
      error: 'Dosage must include amount and unit (e.g., "500mg", "2 tablets")' 
    };
  }

  return { isValid: true };
};

/**
 * Time validation (HH:mm format)
 */
export const validateTime = (time: string): ValidationResult => {
  if (!time || time.trim().length === 0) {
    return { isValid: false, error: 'Time is required' };
  }

  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(time)) {
    return { isValid: false, error: 'Time must be in HH:mm format (e.g., 08:30)' };
  }

  return { isValid: true };
};

/**
 * Validate form data object
 */
export const validateForm = (
  data: Record<string, any>,
  validationRules: Record<string, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validationRules)) {
    const result = validator(data[field]);
    if (!result.isValid) {
      errors[field] = result.error || 'Invalid value';
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate file upload (for prescription images)
 */
export const validateFileUpload = (
  file: { size: number; type: string; name: string }
): ValidationResult => {
  // Max file size: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  // Allowed image types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File must be a JPEG, PNG, or WebP image' };
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }

  return { isValid: true };
};

/**
 * Validate medication search query
 */
export const validateSearchQuery = (query: string): ValidationResult => {
  if (!query || query.trim().length === 0) {
    return { isValid: false, error: 'Search query cannot be empty' };
  }

  if (query.trim().length < 2) {
    return { isValid: false, error: 'Search query must be at least 2 characters' };
  }

  if (query.length > 100) {
    return { isValid: false, error: 'Search query must be less than 100 characters' };
  }

  // Basic sanitization
  const sanitized = sanitizeInput(query);
  if (sanitized !== query) {
    return { isValid: false, error: 'Search query contains invalid characters' };
  }

  return { isValid: true };
};
