/**
 * MedGuard SA - Theme Context Provider
 * Provides dynamic theming support with accessibility features
 * Supports light/dark/auto modes with high contrast options
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // UI colors
  border: string;
  borderLight: string;
  shadow: string;
  overlay: string;
  
  // Medical specific colors
  medication: string;
  reminder: string;
  emergency: string;
  
  // Interactive colors
  link: string;
  disabled: string;
  placeholder: string;
}

export interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extraLarge';
  reduceMotion: boolean;
  increaseTouchTargets: boolean;
}

export interface ThemeContextType {
  colors: ThemeColors;
  settings: ThemeSettings;
  isDark: boolean;
  updateThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleHighContrast: () => Promise<void>;
  updateFontSize: (size: ThemeSettings['fontSize']) => Promise<void>;
  toggleReduceMotion: () => Promise<void>;
  toggleIncreaseTouchTargets: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

// Light theme colors (WCAG AA compliant)
const lightColors: ThemeColors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  surface: '#FFFFFF',
  
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textInverse: '#FFFFFF',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  medication: '#8B5CF6',
  reminder: '#F59E0B',
  emergency: '#EF4444',
  
  link: '#2563EB',
  disabled: '#9CA3AF',
  placeholder: '#9CA3AF',
};

// Dark theme colors (WCAG AA compliant)
const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  secondary: '#34D399',
  secondaryLight: '#6EE7B7',
  secondaryDark: '#10B981',
  
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',
  surface: '#1E293B',
  
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  border: '#475569',
  borderLight: '#334155',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  medication: '#A78BFA',
  reminder: '#FBBF24',
  emergency: '#F87171',
  
  link: '#60A5FA',
  disabled: '#6B7280',
  placeholder: '#6B7280',
};

// High contrast variants
const lightHighContrastColors: ThemeColors = {
  ...lightColors,
  primary: '#0000FF',
  text: '#000000',
  textSecondary: '#000000',
  background: '#FFFFFF',
  border: '#000000',
  error: '#CC0000',
  success: '#006600',
  warning: '#FF6600',
};

const darkHighContrastColors: ThemeColors = {
  ...darkColors,
  primary: '#00FFFF',
  text: '#FFFFFF',
  textSecondary: '#FFFFFF',
  background: '#000000',
  border: '#FFFFFF',
  error: '#FF0000',
  success: '#00FF00',
  warning: '#FFFF00',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'theme_settings';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ThemeSettings>({
    mode: 'auto',
    colorScheme: 'light',
    highContrast: false,
    fontSize: 'normal',
    reduceMotion: false,
    increaseTouchTargets: false,
  });

  useEffect(() => {
    loadStoredSettings();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (settings.mode === 'auto') {
        setSettings(prev => ({
          ...prev,
          colorScheme: colorScheme || 'light',
        }));
      }
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    // Update color scheme when mode changes
    if (settings.mode === 'auto') {
      const systemColorScheme = Appearance.getColorScheme() || 'light';
      setSettings(prev => ({
        ...prev,
        colorScheme: systemColorScheme,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        colorScheme: settings.mode as ColorScheme,
      }));
    }
  }, [settings.mode]);

  const loadStoredSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
      } else {
        // Set initial color scheme based on system
        const systemColorScheme = Appearance.getColorScheme() || 'light';
        setSettings(prev => ({
          ...prev,
          colorScheme: systemColorScheme,
        }));
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const saveSettings = async (newSettings: ThemeSettings) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };

  const updateThemeMode = async (mode: ThemeMode) => {
    const newSettings = { ...settings, mode };
    
    if (mode === 'auto') {
      const systemColorScheme = Appearance.getColorScheme() || 'light';
      newSettings.colorScheme = systemColorScheme;
    } else {
      newSettings.colorScheme = mode as ColorScheme;
    }
    
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const toggleHighContrast = async () => {
    const newSettings = { ...settings, highContrast: !settings.highContrast };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const updateFontSize = async (fontSize: ThemeSettings['fontSize']) => {
    const newSettings = { ...settings, fontSize };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const toggleReduceMotion = async () => {
    const newSettings = { ...settings, reduceMotion: !settings.reduceMotion };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const toggleIncreaseTouchTargets = async () => {
    const newSettings = { ...settings, increaseTouchTargets: !settings.increaseTouchTargets };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const resetToDefaults = async () => {
    const defaultSettings: ThemeSettings = {
      mode: 'auto',
      colorScheme: Appearance.getColorScheme() || 'light',
      highContrast: false,
      fontSize: 'normal',
      reduceMotion: false,
      increaseTouchTargets: false,
    };
    
    setSettings(defaultSettings);
    await saveSettings(defaultSettings);
  };

  // Get current colors based on settings
  const getCurrentColors = (): ThemeColors => {
    const isDark = settings.colorScheme === 'dark';
    
    if (settings.highContrast) {
      return isDark ? darkHighContrastColors : lightHighContrastColors;
    }
    
    return isDark ? darkColors : lightColors;
  };

  const colors = getCurrentColors();
  const isDark = settings.colorScheme === 'dark';

  const value: ThemeContextType = {
    colors,
    settings,
    isDark,
    updateThemeMode,
    toggleHighContrast,
    updateFontSize,
    toggleReduceMotion,
    toggleIncreaseTouchTargets,
    resetToDefaults,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper function to get font size multiplier
export const getFontSizeMultiplier = (fontSize: ThemeSettings['fontSize']): number => {
  switch (fontSize) {
    case 'small':
      return 0.9;
    case 'normal':
      return 1.0;
    case 'large':
      return 1.2;
    case 'extraLarge':
      return 1.4;
    default:
      return 1.0;
  }
};

// Helper function to get touch target size
export const getTouchTargetSize = (increaseTouchTargets: boolean): number => {
  return increaseTouchTargets ? 48 : 44; // Minimum 44pt for accessibility, 48pt for enhanced
};

// Helper function to get animation duration
export const getAnimationDuration = (reduceMotion: boolean, defaultDuration: number = 300): number => {
  return reduceMotion ? 0 : defaultDuration;
};

// Predefined color combinations for medical contexts
export const medicalColorCombinations = {
  medication: {
    light: { background: '#F3E8FF', text: '#7C3AED', border: '#C4B5FD' },
    dark: { background: '#2D1B69', text: '#C4B5FD', border: '#7C3AED' },
  },
  reminder: {
    light: { background: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
    dark: { background: '#451A03', text: '#FCD34D', border: '#D97706' },
  },
  emergency: {
    light: { background: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
    dark: { background: '#450A0A', text: '#FCA5A5', border: '#DC2626' },
  },
  success: {
    light: { background: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
    dark: { background: '#022C22', text: '#6EE7B7', border: '#059669' },
  },
  warning: {
    light: { background: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
    dark: { background: '#451A03', text: '#FCD34D', border: '#D97706' },
  },
  info: {
    light: { background: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
    dark: { background: '#1E3A8A', text: '#93C5FD', border: '#2563EB' },
  },
};
