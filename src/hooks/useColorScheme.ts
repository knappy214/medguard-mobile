import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useAppState } from './useAppState';

export type ColorScheme = 'light' | 'dark';

export const useColorScheme = (): ColorScheme => {
  const nativeColorScheme = useNativeColorScheme();
  const appState = useAppState();

  // Default to light theme if no native color scheme is available
  if (!nativeColorScheme) {
    return 'light';
  }

  // Return the native color scheme
  return nativeColorScheme as ColorScheme;
};

// Hook to get app state for potential theme switching based on app state
export const useAppState = () => {
  // This could be expanded to handle app state changes
  // For now, we'll just return a simple state
  return {
    isActive: true,
    isBackground: false,
  };
};
