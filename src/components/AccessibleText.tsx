/**
 * MedGuard SA - Accessible Text Component
 * Screen reader optimized text component with enhanced accessibility features
 * Supports dynamic font sizing, high contrast, and semantic markup
 */

import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface AccessibleTextProps extends Omit<TextProps, 'style'> {
  // Content
  children: React.ReactNode;
  
  // Semantic variants
  variant?: 'body' | 'caption' | 'heading1' | 'heading2' | 'heading3' | 'subtitle' | 'button' | 'label' | 'error' | 'success' | 'warning';
  
  // Visual styling
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'textTertiary' | 'error' | 'success' | 'warning' | 'white' | 'disabled';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  
  // Accessibility
  role?: 'header' | 'text' | 'button' | 'label' | 'alert' | 'status';
  importance?: 'low' | 'medium' | 'high' | 'critical';
  semanticLabel?: string; // Override for screen readers
  hint?: string; // Additional context for screen readers
  
  // Medical context
  medicalContext?: 'medication' | 'dosage' | 'time' | 'instruction' | 'warning' | 'emergency';
  
  // Styling overrides
  style?: TextStyle | TextStyle[];
  
  // Interaction
  onPress?: () => void;
  selectable?: boolean;
  
  // Truncation
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  
  // Responsive
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  color = 'text',
  weight = 'normal',
  align = 'left',
  role = 'text',
  importance = 'medium',
  semanticLabel,
  hint,
  medicalContext,
  style,
  onPress,
  selectable = true,
  numberOfLines,
  ellipsizeMode = 'tail',
  adjustsFontSizeToFit = false,
  minimumFontScale = 0.8,
  ...textProps
}) => {
  const { colors, settings } = useTheme();
  
  // Get font size multiplier based on user preference
  const getFontSizeMultiplier = () => {
    switch (settings.fontSize) {
      case 'small': return 0.9;
      case 'normal': return 1.0;
      case 'large': return 1.2;
      case 'extraLarge': return 1.4;
      default: return 1.0;
    }
  };
  
  const fontSizeMultiplier = getFontSizeMultiplier();
  
  // Base font sizes (scaled by user preference)
  const getFontSize = (): number => {
    const baseSizes = {
      caption: 12,
      body: 16,
      label: 14,
      button: 16,
      subtitle: 18,
      heading3: 20,
      heading2: 24,
      heading1: 32,
      error: 14,
      success: 14,
      warning: 14,
    };
    
    return (baseSizes[variant] || baseSizes.body) * fontSizeMultiplier;
  };
  
  // Get text color based on theme and color prop
  const getTextColor = (): string => {
    const colorMap = {
      primary: colors.primary,
      secondary: colors.secondary,
      text: colors.text,
      textSecondary: colors.textSecondary,
      textTertiary: colors.textTertiary,
      error: colors.error,
      success: colors.success,
      warning: colors.warning,
      white: '#FFFFFF',
      disabled: colors.disabled,
    };
    
    return colorMap[color] || colors.text;
  };
  
  // Get font weight
  const getFontWeight = (): TextStyle['fontWeight'] => {
    const weightMap = {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    };
    
    return weightMap[weight];
  };
  
  // Get accessibility role
  const getAccessibilityRole = () => {
    const roleMap = {
      header: 'header' as const,
      text: 'text' as const,
      button: 'button' as const,
      label: 'text' as const,
      alert: 'alert' as const,
      status: 'text' as const,
    };
    
    return roleMap[role] || 'text';
  };
  
  // Generate accessibility label
  const getAccessibilityLabel = (): string => {
    if (semanticLabel) return semanticLabel;
    
    let label = typeof children === 'string' ? children : '';
    
    // Add context based on medical context
    if (medicalContext) {
      const contextPrefixes = {
        medication: 'Medication: ',
        dosage: 'Dosage: ',
        time: 'Time: ',
        instruction: 'Instruction: ',
        warning: 'Warning: ',
        emergency: 'Emergency: ',
      };
      
      label = contextPrefixes[medicalContext] + label;
    }
    
    // Add variant context for screen readers
    if (variant.startsWith('heading')) {
      label = `Heading: ${label}`;
    }
    
    return label;
  };
  
  // Get accessibility traits based on importance and context
  const getAccessibilityTraits = (): string[] => {
    const traits: string[] = [];
    
    if (onPress) traits.push('button');
    
    if (importance === 'critical' || variant === 'error') {
      traits.push('alert');
    }
    
    if (variant.startsWith('heading')) {
      traits.push('header');
    }
    
    if (medicalContext === 'warning' || medicalContext === 'emergency') {
      traits.push('alert');
    }
    
    return traits;
  };
  
  // Create style object
  const createStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: getFontSize(),
      color: getTextColor(),
      fontWeight: getFontWeight(),
      textAlign: align,
      includeFontPadding: false, // Better text alignment on Android
    };
    
    // Add line height for better readability
    baseStyle.lineHeight = baseStyle.fontSize * 1.4;
    
    // Adjust for high contrast mode
    if (settings.highContrast) {
      baseStyle.textShadowColor = colors.background;
      baseStyle.textShadowOffset = { width: 1, height: 1 };
      baseStyle.textShadowRadius = 1;
    }
    
    // Variant-specific styles
    const variantStyles: Record<string, Partial<TextStyle>> = {
      heading1: { fontWeight: 'bold', marginBottom: 8 },
      heading2: { fontWeight: 'bold', marginBottom: 6 },
      heading3: { fontWeight: '600', marginBottom: 4 },
      subtitle: { fontWeight: '500' },
      button: { fontWeight: '600', textTransform: 'uppercase' },
      label: { fontWeight: '500' },
      error: { color: colors.error, fontWeight: '500' },
      success: { color: colors.success, fontWeight: '500' },
      warning: { color: colors.warning, fontWeight: '500' },
    };
    
    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };
  
  const finalStyle = [createStyle(), style].filter(Boolean);
  
  return (
    <Text
      {...textProps}
      style={finalStyle}
      accessible={true}
      accessibilityRole={getAccessibilityRole()}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={hint}
      accessibilityTraits={getAccessibilityTraits()}
      accessibilityLiveRegion={
        importance === 'critical' || variant === 'error' ? 'assertive' : 
        importance === 'high' ? 'polite' : 'none'
      }
      onPress={onPress}
      selectable={selectable}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      // Enhanced touch targets for accessibility
      hitSlop={settings.increaseTouchTargets ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined}
    >
      {children}
    </Text>
  );
};

// Specialized text components for common use cases
export const MedicationName: React.FC<Omit<AccessibleTextProps, 'variant' | 'medicalContext'>> = (props) => (
  <AccessibleText variant="subtitle" weight="semibold" medicalContext="medication" {...props} />
);

export const DosageText: React.FC<Omit<AccessibleTextProps, 'variant' | 'medicalContext'>> = (props) => (
  <AccessibleText variant="body" weight="medium" medicalContext="dosage" {...props} />
);

export const TimeText: React.FC<Omit<AccessibleTextProps, 'variant' | 'medicalContext'>> = (props) => (
  <AccessibleText variant="body" weight="medium" medicalContext="time" {...props} />
);

export const InstructionText: React.FC<Omit<AccessibleTextProps, 'variant' | 'medicalContext'>> = (props) => (
  <AccessibleText variant="body" medicalContext="instruction" {...props} />
);

export const WarningText: React.FC<Omit<AccessibleTextProps, 'variant' | 'medicalContext' | 'color'>> = (props) => (
  <AccessibleText variant="warning" color="warning" medicalContext="warning" importance="high" {...props} />
);

export const EmergencyText: React.FC<Omit<AccessibleTextProps, 'variant' | 'medicalContext' | 'color'>> = (props) => (
  <AccessibleText variant="error" color="error" medicalContext="emergency" importance="critical" {...props} />
);

export const SuccessText: React.FC<Omit<AccessibleTextProps, 'variant' | 'color'>> = (props) => (
  <AccessibleText variant="success" color="success" {...props} />
);

export const HeadingText: React.FC<Omit<AccessibleTextProps, 'variant' | 'role'> & { level: 1 | 2 | 3 }> = ({ level, ...props }) => (
  <AccessibleText variant={`heading${level}` as any} role="header" {...props} />
);

// Hook for generating accessible announcements
export const useAccessibleAnnouncement = () => {
  const announceForScreenReader = (message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    // This would integrate with React Native's AccessibilityInfo.announceForAccessibility
    // For now, we'll log it for development
    console.log(`[Accessibility Announcement - ${priority}]:`, message);
  };
  
  const announceMedicationTaken = (medicationName: string, dosage: string) => {
    announceForScreenReader(`${medicationName} ${dosage} marked as taken`, 'medium');
  };
  
  const announceMedicationMissed = (medicationName: string) => {
    announceForScreenReader(`${medicationName} marked as missed`, 'high');
  };
  
  const announceEmergency = (message: string) => {
    announceForScreenReader(`Emergency: ${message}`, 'high');
  };
  
  const announceSuccess = (message: string) => {
    announceForScreenReader(`Success: ${message}`, 'medium');
  };
  
  return {
    announceForScreenReader,
    announceMedicationTaken,
    announceMedicationMissed,
    announceEmergency,
    announceSuccess,
  };
};

const styles = StyleSheet.create({
  // Additional styles if needed
});
