import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import authService from '../services/authService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | undefined;
  dateOfBirth?: string | undefined;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  } | undefined;
  preferences: {
    notifications: boolean;
    biometricAuth: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    biometricEnabled: false,
  });

  // Check for stored authentication on app start
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        const tokens = await authService.getCurrentTokens();
        const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');

        if (user && tokens) {
          // Transform API user to local User interface
          const localUser: User = {
            id: user.id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: undefined, // Will be populated from profile
            dateOfBirth: undefined, // Will be populated from profile
            emergencyContact: undefined, // Will be populated from profile
            preferences: {
              notifications: true,
              biometricAuth: false,
              language: user.preferredLanguage === 'af' ? 'af-ZA' : 'en-ZA',
              theme: 'auto',
            },
          };

          setAuthState({
            user: localUser,
            token: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
            biometricEnabled: biometricEnabled === 'true',
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Call the actual authentication service
      const { user: apiUser, tokens } = await authService.login(email, password);

      // Transform API user to local User interface
      const user: User = {
        id: apiUser.id.toString(),
        email: apiUser.email,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        phoneNumber: undefined, // Will be populated from profile
        dateOfBirth: undefined, // Will be populated from profile
        emergencyContact: undefined, // Will be populated from profile
        preferences: {
          notifications: true,
          biometricAuth: false,
          language: apiUser.preferredLanguage === 'af' ? 'af-ZA' : 'en-ZA',
          theme: 'auto',
        },
      };

      // Store in secure storage
      await SecureStore.setItemAsync('auth_token', tokens.accessToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));

      setAuthState({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: authState.biometricEnabled,
      });

      // Trigger haptic feedback for successful login
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      // Trigger haptic feedback for failed login
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Call the actual registration service
      const { password, ...userInfo } = userData;
      const { user: apiUser, tokens } = await authService.register({
        email: userInfo.email || '',
        password,
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        userType: 'PATIENT', // Default to patient, can be updated later
        preferredLanguage: userInfo.preferences?.language === 'af-ZA' ? 'af' : 'en',
      });

      // Transform API user to local User interface
      const user: User = {
        id: apiUser.id.toString(),
        email: apiUser.email,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        phoneNumber: undefined, // Will be populated from profile
        dateOfBirth: undefined, // Will be populated from profile
        emergencyContact: undefined, // Will be populated from profile
        preferences: {
          notifications: true,
          biometricAuth: false,
          language: apiUser.preferredLanguage === 'af' ? 'af-ZA' : 'en-ZA',
          theme: 'auto',
        },
      };

      // Store in secure storage
      await SecureStore.setItemAsync('auth_token', tokens.accessToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));

      setAuthState({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: false,
      });

      // Trigger haptic feedback for successful registration
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      // Trigger haptic feedback for failed registration
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call the auth service logout method
      await authService.logout();

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        biometricEnabled: false,
      });

      // Trigger haptic feedback for logout
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear local state even if API call fails
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        biometricEnabled: false,
      });
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!authState.user) return;

      // Transform local User interface to API format
      const apiProfileData: any = {};
      
      if (userData.firstName) apiProfileData.firstName = userData.firstName;
      if (userData.lastName) apiProfileData.lastName = userData.lastName;
      if (userData.preferences?.language) {
        apiProfileData.preferredLanguage = userData.preferences.language === 'af-ZA' ? 'af' : 'en';
      }

      // Call the API to update profile
      const updatedApiUser = await authService.updateProfile(apiProfileData);

      // Transform API user back to local User interface
      const updatedUser: User = {
        id: updatedApiUser.id.toString(),
        email: updatedApiUser.email,
        firstName: updatedApiUser.firstName,
        lastName: updatedApiUser.lastName,
        phoneNumber: authState.user.phoneNumber, // Keep existing local data
        dateOfBirth: authState.user.dateOfBirth, // Keep existing local data
        emergencyContact: authState.user.emergencyContact, // Keep existing local data
        preferences: {
          ...authState.user.preferences,
          language: updatedApiUser.preferredLanguage === 'af' ? 'af-ZA' : 'en-ZA',
          ...userData.preferences,
        },
      };

      // Update local storage
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      // Trigger haptic feedback for successful update
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Update user error:', error);
      
      // Trigger haptic feedback for failed update
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setAuthState(prev => ({ ...prev, biometricEnabled: true }));
      return true;
    } catch (error) {
      console.error('Enable biometric error:', error);
      return false;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('biometric_enabled');
      setAuthState(prev => ({ ...prev, biometricEnabled: false }));
    } catch (error) {
      console.error('Disable biometric error:', error);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access MedGuard SA',
        fallbackLabel: 'Use passcode',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const success = await authService.forgotPassword(email);
      
      if (success) {
        // Trigger haptic feedback for successful request
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return success;
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Trigger haptic feedback for failed request
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return false;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      const success = await authService.resetPassword(token, newPassword);
      
      if (success) {
        // Trigger haptic feedback for successful reset
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return success;
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Trigger haptic feedback for failed reset
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return false;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
