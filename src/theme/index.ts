import { light as lightTheme, dark as darkTheme } from '@eva-design/eva';
import { ThemeType } from '@ui-kitten/components';

// MedGuard SA Brand Colors
const medguardColors = {
  primary: '#2563EB', // Blue
  secondary: '#10B981', // Green
  warning: '#F59E0B', // Orange
  danger: '#EF4444', // Red
  success: '#10B981', // Green
  info: '#3B82F6', // Blue
  light: '#F8FAFC', // Light gray
  dark: '#1E293B', // Dark gray
  white: '#FFFFFF',
  black: '#000000',
};

// Custom Light Theme
export const customLightTheme: ThemeType = {
  ...lightTheme,
  'color-primary-100': '#DBEAFE',
  'color-primary-200': '#BFDBFE',
  'color-primary-300': '#93C5FD',
  'color-primary-400': '#60A5FA',
  'color-primary-500': medguardColors.primary,
  'color-primary-600': '#1D4ED8',
  'color-primary-700': '#1E40AF',
  'color-primary-800': '#1E3A8A',
  'color-primary-900': '#1E3A8A',

  'color-success-100': '#D1FAE5',
  'color-success-200': '#A7F3D0',
  'color-success-300': '#6EE7B7',
  'color-success-400': '#34D399',
  'color-success-500': medguardColors.success,
  'color-success-600': '#059669',
  'color-success-700': '#047857',
  'color-success-800': '#065F46',
  'color-success-900': '#064E3B',

  'color-warning-100': '#FEF3C7',
  'color-warning-200': '#FDE68A',
  'color-warning-300': '#FCD34D',
  'color-warning-400': '#FBBF24',
  'color-warning-500': medguardColors.warning,
  'color-warning-600': '#D97706',
  'color-warning-700': '#B45309',
  'color-warning-800': '#92400E',
  'color-warning-900': '#78350F',

  'color-danger-100': '#FEE2E2',
  'color-danger-200': '#FECACA',
  'color-danger-300': '#FCA5A5',
  'color-danger-400': '#F87171',
  'color-danger-500': medguardColors.danger,
  'color-danger-600': '#DC2626',
  'color-danger-700': '#B91C1C',
  'color-danger-800': '#991B1B',
  'color-danger-900': '#7F1D1D',

  'color-basic-100': medguardColors.white,
  'color-basic-200': '#F1F5F9',
  'color-basic-300': '#E2E8F0',
  'color-basic-400': '#CBD5E1',
  'color-basic-500': '#94A3B8',
  'color-basic-600': '#64748B',
  'color-basic-700': '#475569',
  'color-basic-800': '#334155',
  'color-basic-900': '#1E293B',
  'color-basic-1000': '#0F172A',
  'color-basic-1100': '#020617',

  // Healthcare specific colors
  'color-healthcare-primary': medguardColors.primary,
  'color-healthcare-secondary': medguardColors.secondary,
  'color-healthcare-warning': medguardColors.warning,
  'color-healthcare-danger': medguardColors.danger,
  'color-healthcare-success': medguardColors.success,
  'color-healthcare-info': medguardColors.info,
  'color-healthcare-light': medguardColors.light,
  'color-healthcare-dark': medguardColors.dark,
};

// Custom Dark Theme
export const customDarkTheme: ThemeType = {
  ...darkTheme,
  'color-primary-100': '#1E3A8A',
  'color-primary-200': '#1E40AF',
  'color-primary-300': '#1D4ED8',
  'color-primary-400': '#2563EB',
  'color-primary-500': '#3B82F6',
  'color-primary-600': '#60A5FA',
  'color-primary-700': '#93C5FD',
  'color-primary-800': '#BFDBFE',
  'color-primary-900': '#DBEAFE',

  'color-success-100': '#064E3B',
  'color-success-200': '#065F46',
  'color-success-300': '#047857',
  'color-success-400': '#059669',
  'color-success-500': '#10B981',
  'color-success-600': '#34D399',
  'color-success-700': '#6EE7B7',
  'color-success-800': '#A7F3D0',
  'color-success-900': '#D1FAE5',

  'color-warning-100': '#78350F',
  'color-warning-200': '#92400E',
  'color-warning-300': '#B45309',
  'color-warning-400': '#D97706',
  'color-warning-500': '#F59E0B',
  'color-warning-600': '#FBBF24',
  'color-warning-700': '#FCD34D',
  'color-warning-800': '#FDE68A',
  'color-warning-900': '#FEF3C7',

  'color-danger-100': '#7F1D1D',
  'color-danger-200': '#991B1B',
  'color-danger-300': '#B91C1C',
  'color-danger-400': '#DC2626',
  'color-danger-500': '#EF4444',
  'color-danger-600': '#F87171',
  'color-danger-700': '#FCA5A5',
  'color-danger-800': '#FECACA',
  'color-danger-900': '#FEE2E2',

  'color-basic-100': '#020617',
  'color-basic-200': '#0F172A',
  'color-basic-300': '#1E293B',
  'color-basic-400': '#334155',
  'color-basic-500': '#475569',
  'color-basic-600': '#64748B',
  'color-basic-700': '#94A3B8',
  'color-basic-800': '#CBD5E1',
  'color-basic-900': '#E2E8F0',
  'color-basic-1000': '#F1F5F9',
  'color-basic-1100': medguardColors.white,

  // Healthcare specific colors for dark theme
  'color-healthcare-primary': '#3B82F6',
  'color-healthcare-secondary': '#34D399',
  'color-healthcare-warning': '#FBBF24',
  'color-healthcare-danger': '#F87171',
  'color-healthcare-success': '#6EE7B7',
  'color-healthcare-info': '#60A5FA',
  'color-healthcare-light': '#1E293B',
  'color-healthcare-dark': '#F8FAFC',
};

// Theme configuration
export const themeConfig = {
  light: customLightTheme,
  dark: customDarkTheme,
};

// Spacing and sizing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
  },
  h5: {
    fontSize: 18,
    fontWeight: '600',
  },
  h6: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal',
  },
};

// Healthcare specific theme utilities
export const healthcareTheme = {
  colors: medguardColors,
  spacing,
  borderRadius,
  typography,
  // Medication status colors
  medicationStatus: {
    active: medguardColors.success,
    inactive: medguardColors.danger,
    pending: medguardColors.warning,
    completed: medguardColors.info,
  },
  // Alert colors
  alert: {
    info: medguardColors.info,
    success: medguardColors.success,
    warning: medguardColors.warning,
    error: medguardColors.danger,
  },
  // Accessibility
  accessibility: {
    contrastRatio: 4.5,
    focusColor: medguardColors.primary,
    errorColor: medguardColors.danger,
  },
};
