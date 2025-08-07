export const MedGuardColors = {
  // Primary Brand Colors
  primary: {
    trustBlue: '#2563EB',
    healingGreen: '#10B981',
    cleanWhite: '#FFFFFF',
    neutralGray: '#6B7280',
  },
  
  // Alert Colors for Medical Functions
  alerts: {
    successGreen: '#22C55E',
    warningAmber: '#F59E0B', 
    criticalRed: '#EF4444',
    infoBlue: '#3B82F6',
  },
  
  // Extended Palette for UI Elements
  extended: {
    lightGray: '#F3F4F6',
    darkGray: '#374151',
    mediumGray: '#9CA3AF',
    borderGray: '#D1D5DB',
    backgroundGray: '#F9FAFB',
    shadowGray: '#1F2937',
  },
  
  // South African Cultural Colors (optional accents)
  cultural: {
    springbokGold: '#FFD700',
    proteosPink: '#FF69B4',
    oceanBlue: '#0077BE',
    sunsetOrange: '#FF8C00',
  },
  
  // Accessibility-Compliant Contrasts
  text: {
    primary: '#111827',
    secondary: '#6B7280', 
    inverse: '#FFFFFF',
    disabled: '#9CA3AF',
  },
  
  // Status Colors for Medication Tracking
  medication: {
    taken: '#22C55E',
    missed: '#EF4444',
    upcoming: '#3B82F6',
    overdue: '#F59E0B',
    lowStock: '#F59E0B',
    outOfStock: '#EF4444',
  }
} as const;

// UI Kitten Theme Configuration
export const medGuardTheme = {
  "color-primary-100": "#E0E7FF",
  "color-primary-200": "#C7D2FE", 
  "color-primary-300": "#A5B4FC",
  "color-primary-400": "#818CF8",
  "color-primary-500": "#2563EB", // Trust Blue
  "color-primary-600": "#1D4ED8",
  "color-primary-700": "#1E40AF",
  "color-primary-800": "#1E3A8A",
  "color-primary-900": "#1E3A8A",
  
  "color-success-100": "#DCFCE7",
  "color-success-200": "#BBF7D0",
  "color-success-300": "#86EFAC", 
  "color-success-400": "#4ADE80",
  "color-success-500": "#22C55E", // Success Green
  "color-success-600": "#16A34A",
  "color-success-700": "#15803D",
  "color-success-800": "#166534",
  "color-success-900": "#14532D",
  
  "color-warning-100": "#FEF3C7",
  "color-warning-200": "#FDE68A",
  "color-warning-300": "#FCD34D",
  "color-warning-400": "#FBBF24",
  "color-warning-500": "#F59E0B", // Warning Amber
  "color-warning-600": "#D97706",
  "color-warning-700": "#B45309",
  "color-warning-800": "#92400E",
  "color-warning-900": "#78350F",
  
  "color-danger-100": "#FEE2E2",
  "color-danger-200": "#FECACA",
  "color-danger-300": "#FCA5A5",
  "color-danger-400": "#F87171", 
  "color-danger-500": "#EF4444", // Critical Red
  "color-danger-600": "#DC2626",
  "color-danger-700": "#B91C1C",
  "color-danger-800": "#991B1B",
  "color-danger-900": "#7F1D1D",
};
