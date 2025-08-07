/**
 * MedGuard SA - Large Button Press Component
 * Elderly-friendly button with enhanced touch targets and accessibility
 * Optimized for users with motor difficulties or visual impairments
 */

import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  View, 
  StyleSheet, 
  ViewStyle, 
  Dimensions,
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { AccessibleText } from './AccessibleText';

export interface LargeButtonPressProps extends Omit<TouchableOpacityProps, 'style'> {
  // Content
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  
  // Variants
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'extraLarge';
  
  // Medical context
  medicalAction?: 'take_medication' | 'skip_dose' | 'emergency_call' | 'scan_prescription' | 'add_medication';
  
  // Visual states
  loading?: boolean;
  disabled?: boolean;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  
  // Interaction
  onPress: () => void;
  onLongPress?: () => void;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  confirmPress?: boolean; // Require confirmation for critical actions
  
  // Layout
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  
  // Animation
  animationDuration?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const LargeButtonPress: React.FC<LargeButtonPressProps> = ({
  title,
  subtitle,
  icon,
  variant = 'primary',
  size = 'large',
  medicalAction,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  importance = 'medium',
  onPress,
  onLongPress,
  hapticFeedback = 'medium',
  confirmPress = false,
  fullWidth = false,
  style,
  animationDuration,
  ...touchableProps
}) => {
  const { colors, settings } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Get button dimensions based on size and accessibility settings
  const getButtonDimensions = () => {
    const baseMinHeight = {
      small: 48,
      medium: 56,
      large: 72,
      extraLarge: 88,
    };
    
    const minHeight = baseMinHeight[size];
    const enhancedHeight = settings.increaseTouchTargets ? minHeight + 16 : minHeight;
    
    const padding = {
      small: { horizontal: 16, vertical: 8 },
      medium: { horizontal: 20, vertical: 12 },
      large: { horizontal: 24, vertical: 16 },
      extraLarge: { horizontal: 32, vertical: 20 },
    };
    
    return {
      minHeight: enhancedHeight,
      ...padding[size],
    };
  };
  
  // Get button colors based on variant and state
  const getButtonColors = () => {
    const variants = {
      primary: {
        background: disabled ? colors.disabled : colors.primary,
        text: colors.textInverse,
        border: 'transparent',
      },
      secondary: {
        background: disabled ? colors.disabled : colors.secondary,
        text: colors.textInverse,
        border: 'transparent',
      },
      success: {
        background: disabled ? colors.disabled : colors.success,
        text: colors.textInverse,
        border: 'transparent',
      },
      warning: {
        background: disabled ? colors.disabled : colors.warning,
        text: colors.textInverse,
        border: 'transparent',
      },
      error: {
        background: disabled ? colors.disabled : colors.error,
        text: colors.textInverse,
        border: 'transparent',
      },
      outline: {
        background: 'transparent',
        text: disabled ? colors.disabled : colors.primary,
        border: disabled ? colors.disabled : colors.primary,
      },
      ghost: {
        background: 'transparent',
        text: disabled ? colors.disabled : colors.text,
        border: 'transparent',
      },
    };
    
    const baseColors = variants[variant];
    
    // Adjust for high contrast mode
    if (settings.highContrast && !disabled) {
      return {
        ...baseColors,
        background: variant === 'outline' || variant === 'ghost' 
          ? baseColors.background 
          : colors.text,
        text: variant === 'outline' || variant === 'ghost' 
          ? colors.text 
          : colors.background,
        border: variant === 'outline' ? colors.text : baseColors.border,
      };
    }
    
    return baseColors;
  };
  
  // Get medical action specific styling
  const getMedicalActionStyle = () => {
    if (!medicalAction) return {};
    
    const actionStyles = {
      take_medication: {
        backgroundColor: colors.success,
        borderColor: colors.success,
      },
      skip_dose: {
        backgroundColor: colors.warning,
        borderColor: colors.warning,
      },
      emergency_call: {
        backgroundColor: colors.error,
        borderColor: colors.error,
        elevation: 8,
        shadowOpacity: 0.3,
      },
      scan_prescription: {
        backgroundColor: colors.info,
        borderColor: colors.info,
      },
      add_medication: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
    };
    
    return actionStyles[medicalAction] || {};
  };
  
  // Handle press with haptic feedback and confirmation
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback
    if (hapticFeedback && !settings.reduceMotion) {
      switch (hapticFeedback) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    }
    
    // Handle confirmation for critical actions
    if (confirmPress && !showConfirmation) {
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000); // Auto-hide after 3 seconds
      return;
    }
    
    setShowConfirmation(false);
    onPress();
  };
  
  // Generate accessibility label
  const getAccessibilityLabel = (): string => {
    if (accessibilityLabel) return accessibilityLabel;
    
    let label = title;
    if (subtitle) label += `, ${subtitle}`;
    
    // Add medical context
    if (medicalAction) {
      const actionLabels = {
        take_medication: 'Take medication button',
        skip_dose: 'Skip dose button',
        emergency_call: 'Emergency call button',
        scan_prescription: 'Scan prescription button',
        add_medication: 'Add medication button',
      };
      label = `${actionLabels[medicalAction]}: ${label}`;
    }
    
    // Add state information
    if (loading) label += ', loading';
    if (disabled) label += ', disabled';
    if (showConfirmation) label += ', press again to confirm';
    
    return label;
  };
  
  // Get accessibility traits
  const getAccessibilityTraits = (): string[] => {
    const traits: string[] = ['button'];
    
    if (disabled) traits.push('disabled');
    if (importance === 'critical' || medicalAction === 'emergency_call') traits.push('alert');
    
    return traits;
  };
  
  const dimensions = getButtonDimensions();
  const buttonColors = getButtonColors();
  const medicalActionStyle = getMedicalActionStyle();
  
  // Create button style
  const createButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      minHeight: dimensions.minHeight,
      paddingHorizontal: dimensions.horizontal,
      paddingVertical: dimensions.vertical,
      backgroundColor: buttonColors.background,
      borderColor: buttonColors.border,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderRadius: settings.increaseTouchTargets ? 16 : 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: icon ? 'row' : 'column',
      ...medicalActionStyle,
    };
    
    // Full width handling
    if (fullWidth) {
      baseStyle.width = '100%';
    } else {
      baseStyle.minWidth = screenWidth * 0.4; // Minimum 40% of screen width
    }
    
    // Pressed state
    if (isPressed && !disabled) {
      baseStyle.opacity = 0.8;
      baseStyle.transform = [{ scale: 0.98 }];
    }
    
    // Shadow for elevation (iOS)
    if (Platform.OS === 'ios' && variant !== 'ghost') {
      baseStyle.shadowColor = colors.shadow;
      baseStyle.shadowOffset = { width: 0, height: 2 };
      baseStyle.shadowOpacity = disabled ? 0.1 : 0.2;
      baseStyle.shadowRadius = 4;
    }
    
    // Elevation for Android
    if (Platform.OS === 'android' && variant !== 'ghost') {
      baseStyle.elevation = disabled ? 1 : 3;
    }
    
    return baseStyle;
  };
  
  const finalStyle = [createButtonStyle(), style].filter(Boolean);
  
  // Animation duration based on user preferences
  const getAnimationDuration = () => {
    if (settings.reduceMotion) return 0;
    return animationDuration || 150;
  };
  
  return (
    <TouchableOpacity
      {...touchableProps}
      style={finalStyle}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      accessibilityTraits={getAccessibilityTraits()}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      activeOpacity={0.8}
      delayPressIn={0}
      delayPressOut={getAnimationDuration()}
      // Enhanced hit area for accessibility
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {showConfirmation && (
        <View style={styles.confirmationOverlay}>
          <AccessibleText
            variant="caption"
            color="white"
            weight="medium"
            importance="high"
            accessibilityLiveRegion="assertive"
          >
            Press again to confirm
          </AccessibleText>
        </View>
      )}
      
      <View style={styles.buttonContent}>
        {icon && (
          <View style={[
            styles.iconContainer,
            subtitle ? styles.iconWithSubtitle : undefined
          ]}>
            {icon}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <AccessibleText
            variant={size === 'small' ? 'body' : 'button'}
            color={buttonColors.text === colors.textInverse ? 'white' : 'text'}
            weight="semibold"
            align="center"
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {loading ? 'Loading...' : title}
          </AccessibleText>
          
          {subtitle && (
            <AccessibleText
              variant="caption"
              color={buttonColors.text === colors.textInverse ? 'white' : 'textSecondary'}
              align="center"
              numberOfLines={1}
              style={styles.subtitle}
            >
              {subtitle}
            </AccessibleText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Specialized button components for common medical actions
export const TakeMedicationButton: React.FC<Omit<LargeButtonPressProps, 'medicalAction' | 'variant'>> = (props) => (
  <LargeButtonPress
    variant="success"
    medicalAction="take_medication"
    hapticFeedback="success"
    {...props}
  />
);

export const SkipDoseButton: React.FC<Omit<LargeButtonPressProps, 'medicalAction' | 'variant'>> = (props) => (
  <LargeButtonPress
    variant="warning"
    medicalAction="skip_dose"
    hapticFeedback="warning"
    confirmPress={true}
    {...props}
  />
);

export const EmergencyCallButton: React.FC<Omit<LargeButtonPressProps, 'medicalAction' | 'variant'>> = (props) => (
  <LargeButtonPress
    variant="error"
    medicalAction="emergency_call"
    hapticFeedback="error"
    importance="critical"
    confirmPress={true}
    size="extraLarge"
    {...props}
  />
);

export const ScanPrescriptionButton: React.FC<Omit<LargeButtonPressProps, 'medicalAction' | 'variant'>> = (props) => (
  <LargeButtonPress
    variant="primary"
    medicalAction="scan_prescription"
    hapticFeedback="medium"
    {...props}
  />
);

export const AddMedicationButton: React.FC<Omit<LargeButtonPressProps, 'medicalAction' | 'variant'>> = (props) => (
  <LargeButtonPress
    variant="primary"
    medicalAction="add_medication"
    hapticFeedback="light"
    {...props}
  />
);

const styles = StyleSheet.create({
  confirmationOverlay: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    marginBottom: 4,
  },
  iconWithSubtitle: {
    marginBottom: 8,
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.8,
  },
});
