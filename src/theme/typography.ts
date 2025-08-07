import { Platform } from 'react-native';

export const Typography = {
  // Font Families optimized for medical readability
  fonts: {
    primary: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    secondary: Platform.select({
      ios: 'Georgia', 
      android: 'serif',
      default: 'serif',
    }),
    monospace: Platform.select({
      ios: 'Courier',
      android: 'monospace', 
      default: 'monospace',
    }),
  },
  
  // Font Sizes for Different User Groups
  sizes: {
    // Standard sizes for tech-savvy users
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    
    // Large sizes for elderly/vision-impaired users
    accessible: {
      small: 18,
      medium: 22,
      large: 26,
      xlarge: 32,
      heading: 38,
      title: 44,
    }
  },
  
  // Line Heights for Medical Content Readability
  lineHeights: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Font Weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Text Styles for Specific Medical Use Cases
  styles: {
    medicationName: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    dosageInfo: {
      fontSize: 16,
      fontWeight: '500', 
      lineHeight: 1.5,
    },
    instructions: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.6,
    },
    alertText: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    accessibleBody: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 1.8,
    },
    accessibleHeading: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 1.3,
    }
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  
  // Touch targets optimized for elderly users
  touchTarget: {
    minimum: 44, // iOS/Android minimum
    recommended: 56, // Better for elderly users
    large: 72, // For critical actions
  }
};
