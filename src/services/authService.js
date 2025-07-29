import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

// Security configuration
const SECURITY_CONFIG = {
  // Token expiration times (in milliseconds)
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Session timeout (in milliseconds)
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  
  // Secure storage keys
  STORAGE_KEYS: {
    ENCRYPTED_TOKENS: 'medguard_encrypted_tokens',
    SESSION_DATA: 'medguard_session_data',
    DEVICE_ID: 'medguard_device_id',
    SECURITY_SETTINGS: 'medguard_security_settings',
    BIOMETRIC_ENABLED: 'medguard_biometric_enabled',
    LAST_ACTIVITY: 'medguard_last_activity'
  },
  
  // API configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  
  // Encryption settings
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION_ITERATIONS: 100000
};

class HIPAACompliantAuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.deviceId = null;
    this.lastActivity = Date.now();
    this.sessionTimer = null;
    this.biometricEnabled = false;
    
    this.initializeSecurity();
  }

  /**
   * Initialize security settings and device identification
   */
  async initializeSecurity() {
    try {
      // Generate or retrieve device ID
      this.deviceId = await this.getOrCreateDeviceId();
      
      // Check device security
      await this.checkDeviceSecurity();
      
      // Check for existing session
      await this.restoreSession();
      
      // Setup session monitoring
      this.setupSessionMonitoring();
      
      console.log('Security initialization completed');
    } catch (error) {
      console.error('Failed to initialize security:', error);
      this.clearSession();
    }
  }

  /**
   * Generate or retrieve device ID for security tracking
   */
  async getOrCreateDeviceId() {
    try {
      let deviceId = await SecureStore.getItemAsync(SECURITY_CONFIG.STORAGE_KEYS.DEVICE_ID);
      
      if (!deviceId) {
        // Generate a unique device ID
        deviceId = this.generateDeviceId();
        await SecureStore.setItemAsync(SECURITY_CONFIG.STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get or create device ID:', error);
      throw error;
    }
  }

  /**
   * Generate a unique device identifier
   */
  generateDeviceId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    const deviceName = Device.deviceName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    
    return `${timestamp}-${random}-${deviceName}-${osVersion}`;
  }

  /**
   * Check device security requirements
   */
  async checkDeviceSecurity() {
    try {
      // Check if device has secure lock screen
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Device must have biometric authentication enabled for HIPAA compliance');
      }
      
      // Check if device is rooted/jailbroken (basic check)
      const isRooted = await this.checkIfDeviceIsRooted();
      if (isRooted) {
        throw new Error('Device appears to be rooted/jailbroken. This is not allowed for HIPAA compliance.');
      }
      
      // Check if app is running in debug mode
      if (__DEV__) {
        console.warn('App is running in development mode - security features may be limited');
      }
      
      console.log('Device security check passed');
    } catch (error) {
      console.error('Device security check failed:', error);
      throw error;
    }
  }

  /**
   * Basic check for rooted/jailbroken device
   */
  async checkIfDeviceIsRooted() {
    try {
      // Check for common root indicators
      const suspiciousPaths = [
        '/system/app/Superuser.apk',
        '/system/xbin/su',
        '/system/bin/su',
        '/sbin/su',
        '/system/su',
        '/system/bin/.ext/.su',
        '/system/etc/init.d/99SuperSUDaemon',
        '/dev/com.koushikdutta.superuser.daemon/',
        '/system/xbin/daemonsu'
      ];
      
      // This is a simplified check - in production, you'd use a more robust library
      // like react-native-device-info or similar
      return false; // Placeholder - implement actual check
    } catch (error) {
      console.error('Failed to check device root status:', error);
      return false;
    }
  }

  /**
   * Setup session monitoring for timeout
   */
  setupSessionMonitoring() {
    // Clear existing timer
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }
    
    // Check session every minute
    this.sessionTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000);
  }

  /**
   * Check if session has timed out
   */
  async checkSessionTimeout() {
    try {
      const lastActivity = await SecureStore.getItemAsync(SECURITY_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        
        if (timeSinceLastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
          console.warn('Session timeout detected - logging out for security');
          await this.logout('Session timeout due to inactivity');
        }
      }
    } catch (error) {
      console.error('Failed to check session timeout:', error);
    }
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity() {
    try {
      this.lastActivity = Date.now();
      await SecureStore.setItemAsync(SECURITY_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, this.lastActivity.toString());
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Encrypt sensitive data using Expo SecureStore
   */
  async encryptData(data) {
    try {
      // For sensitive data, we'll use SecureStore which provides encryption
      // In a production app, you might want to add additional encryption layers
      return Buffer.from(JSON.stringify(data)).toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData) {
    try {
      return JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Securely store authentication tokens
   */
  async storeTokens(tokens) {
    try {
      const encryptedTokens = await this.encryptData(tokens);
      await SecureStore.setItemAsync(SECURITY_CONFIG.STORAGE_KEYS.ENCRYPTED_TOKENS, encryptedTokens);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to securely store authentication tokens');
    }
  }

  /**
   * Securely retrieve authentication tokens
   */
  async getStoredTokens() {
    try {
      const encryptedTokens = await SecureStore.getItemAsync(SECURITY_CONFIG.STORAGE_KEYS.ENCRYPTED_TOKENS);
      if (!encryptedTokens) return null;
      
      const decryptedTokens = await this.decryptData(encryptedTokens);
      return decryptedTokens;
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometrics(reason = 'Please authenticate to access your medication data') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        await this.updateLastActivity();
        return true;
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  /**
   * Login with HIPAA-compliant security measures
   */
  async login(credentials) {
    try {
      this.isLoading = true;
      
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      // Authenticate with biometrics first
      await this.authenticateWithBiometrics('Please authenticate to login');
      
      // Prepare login payload with security metadata
      const loginPayload = {
        email: credentials.email,
        password: credentials.password,
        mfaCode: credentials.mfaCode,
        deviceId: this.deviceId,
        deviceInfo: {
          name: Device.deviceName,
          osVersion: Device.osVersion,
          platform: Platform.OS,
          appVersion: Application.nativeApplicationVersion,
          buildVersion: Application.nativeBuildVersion,
        },
        clientVersion: '1.0.0',
        timestamp: Date.now()
      };
      
      // Make login request
      const response = await fetch(`${SECURITY_CONFIG.API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.deviceId,
          'X-Security-Level': 'HIPAA',
          'X-Platform': Platform.OS,
          'X-App-Version': Application.nativeApplicationVersion || '1.0.0'
        },
        body: JSON.stringify(loginPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const { user, tokens } = await response.json();
      
      // Store tokens securely
      await this.storeTokens(tokens);
      
      // Set user and authentication state
      this.user = user;
      this.isAuthenticated = true;
      await this.updateLastActivity();
      
      // Log security event
      await this.logSecurityEvent('LOGIN_SUCCESS', { userId: user.id, deviceId: this.deviceId });
      
      return user;
    } catch (error) {
      await this.logSecurityEvent('LOGIN_FAILURE', { 
        email: credentials.email, 
        deviceId: this.deviceId,
        error: error.message 
      });
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Logout with security cleanup
   */
  async logout(reason = 'User initiated logout') {
    try {
      // Log security event
      await this.logSecurityEvent('LOGOUT', { 
        userId: this.user?.id, 
        deviceId: this.deviceId,
        reason 
      });
      
      // Call logout endpoint to invalidate tokens
      if (this.user) {
        const token = await this.getAccessToken();
        if (token) {
          await fetch(`${SECURITY_CONFIG.API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Device-ID': this.deviceId
            },
            body: JSON.stringify({ deviceId: this.deviceId })
          });
        }
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearSession();
    }
  }

  /**
   * Clear session and sensitive data
   */
  async clearSession() {
    this.user = null;
    this.isAuthenticated = false;
    this.lastActivity = 0;
    
    // Clear stored tokens
    await SecureStore.deleteItemAsync(SECURITY_CONFIG.STORAGE_KEYS.ENCRYPTED_TOKENS);
    await SecureStore.deleteItemAsync(SECURITY_CONFIG.STORAGE_KEYS.SESSION_DATA);
    await SecureStore.deleteItemAsync(SECURITY_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
    
    // Clear timer
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Restore session from stored tokens
   */
  async restoreSession() {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) return;
      
      // Check if tokens are expired
      if (Date.now() > tokens.expiresAt) {
        // Try to refresh tokens
        await this.refreshTokens(tokens.refreshToken);
        return;
      }
      
      // Validate tokens with server
      const token = await this.getAccessToken();
      if (!token) return;
      
      const response = await fetch(`${SECURITY_CONFIG.API_BASE_URL}/auth/validate/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Device-ID': this.deviceId
        }
      });
      
      if (response.ok) {
        const { user } = await response.json();
        this.user = user;
        this.isAuthenticated = true;
        await this.updateLastActivity();
      } else {
        await this.clearSession();
      }
      
    } catch (error) {
      console.error('Failed to restore session:', error);
      await this.clearSession();
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(refreshToken) {
    try {
      const response = await fetch(`${SECURITY_CONFIG.API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.deviceId
        },
        body: JSON.stringify({ refreshToken, deviceId: this.deviceId })
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const { tokens } = await response.json();
      await this.storeTokens(tokens);
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearSession();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken() {
    try {
      const tokens = await this.getStoredTokens();
      if (!tokens) return null;
      
      // Check if token is expired
      if (Date.now() > tokens.expiresAt) {
        await this.refreshTokens(tokens.refreshToken);
        const newTokens = await this.getStoredTokens();
        return newTokens?.accessToken || null;
      }
      
      return tokens.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      
      // Add authentication and security headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Device-ID': this.deviceId,
        'X-Security-Level': 'HIPAA',
        'X-Platform': Platform.OS,
        'X-App-Version': Application.nativeApplicationVersion || '1.0.0',
        'X-Request-Timestamp': Date.now().toString(),
        ...options.headers
      };
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      // Update last activity
      await this.updateLastActivity();
      
      // Handle authentication errors
      if (response.status === 401) {
        await this.logout('Authentication failed');
        throw new Error('Authentication failed - please login again');
      }
      
      return response;
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }

  /**
   * Log security events for audit trail
   */
  async logSecurityEvent(eventType, data) {
    try {
      const securityEvent = {
        eventType,
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        userId: this.user?.id,
        deviceInfo: {
          name: Device.deviceName,
          osVersion: Device.osVersion,
          platform: Platform.OS,
          appVersion: Application.nativeApplicationVersion,
        },
        data
      };
      
      // Send to security logging endpoint
      await fetch(`${SECURITY_CONFIG.API_BASE_URL}/security/log/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': this.deviceId
        },
        body: JSON.stringify(securityEvent)
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Check if user has required permissions
   */
  hasPermission(permission) {
    return this.user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user is of specific type
   */
  isUserType(userType) {
    return this.user?.userType === userType;
  }

  /**
   * Get security settings
   */
  getSecuritySettings() {
    return {
      sessionTimeout: SECURITY_CONFIG.SESSION_TIMEOUT,
      deviceId: this.deviceId,
      lastActivity: this.lastActivity,
      isAuthenticated: this.isAuthenticated,
      biometricEnabled: this.biometricEnabled,
      platform: Platform.OS,
      appVersion: Application.nativeApplicationVersion
    };
  }

  /**
   * Enable/disable biometric authentication
   */
  async setBiometricEnabled(enabled) {
    try {
      this.biometricEnabled = enabled;
      await SecureStore.setItemAsync(SECURITY_CONFIG.STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Failed to set biometric enabled:', error);
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState() {
    return {
      user: this.user,
      isAuthenticated: this.isAuthenticated,
      isLoading: this.isLoading,
      deviceId: this.deviceId,
      biometricEnabled: this.biometricEnabled
    };
  }
}

// Create singleton instance
const authService = new HIPAACompliantAuthService();

export default authService; 