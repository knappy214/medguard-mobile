import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'PATIENT' | 'CAREGIVER' | 'HEALTHCARE_PROVIDER';
  preferredLanguage: 'en' | 'af';
  profileComplete: boolean;
}

class AuthService {
  private baseUrl = 'https://api.medguard-sa.com';
  private wagtailApiUrl = 'https://api.medguard-sa.com/api/v2';
  
  // Secure token storage keys
  private static TOKEN_KEY = 'medguard_auth_tokens';
  private static USER_KEY = 'medguard_user_data';
  private static BIOMETRIC_KEY = 'medguard_biometric_enabled';
  
  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // Securely store tokens
      await this.storeTokens(data.tokens);
      await this.storeUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: 'PATIENT' | 'CAREGIVER' | 'HEALTHCARE_PROVIDER';
    preferredLanguage?: 'en' | 'af';
  }): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          preferredLanguage: userData.preferredLanguage || 'en',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Securely store tokens
      await this.storeTokens(data.tokens);
      await this.storeUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Password reset request failed');
      }
      
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Password reset failed');
      }
      
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/change-password/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Password change failed');
      }
      
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/auth/profile/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Profile update failed');
      }
      
      const updatedUser = await response.json();
      
      // Update stored user data
      await this.storeUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  async loginWithBiometrics(): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      // Check if biometrics are enabled
      const biometricEnabled = await SecureStore.getItemAsync(AuthService.BIOMETRIC_KEY);
      if (!biometricEnabled) {
        throw new Error('Biometric authentication not enabled');
      }
      
      // Check biometric hardware availability
      const biometricType = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (biometricType.length === 0) {
        throw new Error('Biometric authentication not available');
      }
      
      // Perform biometric authentication
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Access MedGuard SA',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      
      if (!biometricResult.success) {
        throw new Error('Biometric authentication failed');
      }
      
      // Retrieve stored credentials
      const storedTokens = await this.getStoredTokens();
      const storedUser = await this.getStoredUser();
      
      if (!storedTokens || !storedUser) {
        throw new Error('No stored credentials found');
      }
      
      // Verify token validity and refresh if needed
      const validTokens = await this.ensureValidTokens(storedTokens);
      
      return {
        user: storedUser,
        tokens: validTokens,
      };
    } catch (error) {
      console.error('Biometric login error:', error);
      throw error;
    }
  }
  
  async enableBiometricAuth(user: User, tokens: AuthTokens): Promise<void> {
    try {
      // Check biometric capability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available');
      }
      
      // Authenticate to enable biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Login',
      });
      
      if (result.success) {
        await SecureStore.setItemAsync(AuthService.BIOMETRIC_KEY, 'true');
        await this.storeTokens(tokens);
        await this.storeUser(user);
      }
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }
  
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      const tokens = await this.getStoredTokens();
      if (tokens) {
        await fetch(`${this.baseUrl}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: tokens.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all stored data
      await this.clearStoredData();
    }
  }
  
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(AuthService.TOKEN_KEY, JSON.stringify(tokens));
  }
  
  private async storeUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(AuthService.USER_KEY, JSON.stringify(user));
  }
  
  private async getStoredTokens(): Promise<AuthTokens | null> {
    const tokensJson = await SecureStore.getItemAsync(AuthService.TOKEN_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  }
  
  private async getStoredUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(AuthService.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
  
  private async ensureValidTokens(tokens: AuthTokens): Promise<AuthTokens> {
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes buffer
    
    if (tokens.expiresAt - buffer > now) {
      return tokens; // Token still valid
    }
    
    // Refresh token
    const response = await fetch(`${this.baseUrl}/api/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: tokens.refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const newTokens = await response.json();
    await this.storeTokens(newTokens);
    return newTokens;
  }
  
  private async clearStoredData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(AuthService.TOKEN_KEY),
      SecureStore.deleteItemAsync(AuthService.USER_KEY), 
      SecureStore.deleteItemAsync(AuthService.BIOMETRIC_KEY),
    ]);
  }
  
    async getCurrentUser(): Promise<User | null> {
    return await this.getStoredUser();
  }

  async getCurrentTokens(): Promise<AuthTokens | null> {
    return await this.getStoredTokens();
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    const user = await this.getStoredUser();
    return !!(tokens && user);
  }
  
  async getAuthHeaders(): Promise<Record<string, string>> {
    const tokens = await this.getStoredTokens();
    if (!tokens) {
      throw new Error('No authentication tokens available');
    }
    
    const validTokens = await this.ensureValidTokens(tokens);
    
    return {
      'Authorization': `Bearer ${validTokens.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Security-Level': 'high',
      'X-Request-Timestamp': new Date().toISOString(),
    };
  }
}

export default new AuthService();
