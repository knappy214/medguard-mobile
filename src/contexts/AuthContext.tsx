import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
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
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await SecureStore.getItemAsync('user_data');
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
          biometricEnabled: biometricEnabled === 'true',
        });
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

      // TODO: Implement actual API call to backend
      // For now, simulate a successful login
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+27123456789',
        dateOfBirth: '1990-01-01',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+27123456788',
          relationship: 'Spouse',
        },
        preferences: {
          notifications: true,
          biometricAuth: false,
          language: 'en-ZA',
          theme: 'auto',
        },
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      // Store in secure storage
      await SecureStore.setItemAsync('auth_token', mockToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: authState.biometricEnabled,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // TODO: Implement actual API call to backend
      // For now, simulate a successful registration
      const { password, ...userInfo } = userData;
      const mockUser: User = {
        id: '1',
        email: userInfo.email || '',
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        phoneNumber: userInfo.phoneNumber,
        dateOfBirth: userInfo.dateOfBirth,
        emergencyContact: userInfo.emergencyContact,
        preferences: {
          notifications: true,
          biometricAuth: false,
          language: 'en-ZA',
          theme: 'auto',
          ...userInfo.preferences,
        },
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      // Store in secure storage
      await SecureStore.setItemAsync('auth_token', mockToken);
      await SecureStore.setItemAsync('user_data', JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        biometricEnabled: false,
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        biometricEnabled: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error('Update user error:', error);
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
      // TODO: Implement actual API call to backend
      console.log('Password reset requested for:', email);
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
      // TODO: Implement actual API call to backend
      console.log('Password reset with token:', token);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
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
