# MedGuard SA Mobile App Performance Optimization Guide

## Overview

This guide provides comprehensive performance optimization strategies for the MedGuard SA mobile application built with React Native and Expo SDK 51+.

## 1. React Native Performance Optimizations

### Component Optimization

```typescript
// Use React.memo for expensive components
import React, { memo } from 'react';

const MedicationCard = memo(({ medication, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.dosage}>{medication.dosage}</Text>
      </View>
    </TouchableOpacity>
  );
});

// Use useCallback for event handlers
const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  
  const handleMedicationPress = useCallback((medication) => {
    navigation.navigate('MedicationDetail', { medication });
  }, [navigation]);
  
  return (
    <FlatList
      data={medications}
      renderItem={({ item }) => (
        <MedicationCard 
          medication={item} 
          onPress={handleMedicationPress} 
        />
      )}
      keyExtractor={item => item.id}
    />
  );
};
```

### FlatList Optimization

```typescript
// Optimized FlatList for large datasets
const OptimizedMedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const renderItem = useCallback(({ item }) => (
    <MedicationCard medication={item} />
  ), []);
  
  const keyExtractor = useCallback((item) => item.id, []);
  
  const getItemLayout = useCallback((data, index) => ({
    length: 80, // Fixed height for each item
    offset: 80 * index,
    index,
  }), []);
  
  return (
    <FlatList
      data={medications}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      onEndReachedThreshold={0.5}
      onEndReached={loadMoreMedications}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
    />
  );
};
```

### Image Optimization

```typescript
// Optimized image loading with caching
import FastImage from 'react-native-fast-image';

const OptimizedMedicationImage = ({ uri, style }) => {
  return (
    <FastImage
      style={style}
      source={{
        uri: uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      }}
      resizeMode={FastImage.resizeMode.contain}
    />
  );
};

// Progressive image loading
const ProgressiveImage = ({ uri, style }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <View style={style}>
      {!imageLoaded && (
        <View style={[style, styles.placeholder]} />
      )}
      <FastImage
        style={[style, { opacity: imageLoaded ? 1 : 0 }]}
        source={{ uri }}
        onLoad={() => setImageLoaded(true)}
      />
    </View>
  );
};
```

## 2. State Management Optimization

### Redux Toolkit Optimization

```typescript
// Optimized Redux slice with memoization
import { createSlice, createSelector } from '@reduxjs/toolkit';

const medicationSlice = createSlice({
  name: 'medications',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setMedications: (state, action) => {
      state.items = action.payload;
    },
    addMedication: (state, action) => {
      state.items.push(action.payload);
    },
  },
});

// Memoized selectors
export const selectAllMedications = (state) => state.medications.items;

export const selectMedicationById = createSelector(
  [selectAllMedications, (state, id) => id],
  (medications, id) => medications.find(med => med.id === id)
);

export const selectLowStockMedications = createSelector(
  [selectAllMedications],
  (medications) => medications.filter(med => med.isLowStock)
);

export const selectExpiringMedications = createSelector(
  [selectAllMedications],
  (medications) => medications.filter(med => med.isExpiringSoon)
);
```

### Async Storage Optimization

```typescript
// Optimized async storage with compression
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compress, decompress } from 'react-native-gzip';

class OptimizedStorage {
  static async setItem(key: string, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      const compressed = await compress(jsonValue);
      await AsyncStorage.setItem(key, compressed);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
  
  static async getItem(key: string) {
    try {
      const compressed = await AsyncStorage.getItem(key);
      if (compressed) {
        const decompressed = await decompress(compressed);
        return JSON.parse(decompressed);
      }
      return null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  }
  
  static async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }
}
```

## 3. Network Optimization

### API Client Optimization

```typescript
// Optimized API client with caching and retry logic
import axios from 'axios';
import { setupCache } from 'axios-cache-adapter';

const cache = setupCache({
  maxAge: 15 * 60 * 1000, // 15 minutes
  exclude: { query: false },
  clearOnError: true,
});

const api = axios.create({
  baseURL: 'https://api.medguard-sa.com',
  timeout: 10000,
  adapter: cache.adapter,
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
      const newToken = await refreshAuthToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

// Optimized API methods
export const medicationAPI = {
  getMedications: async (params = {}) => {
    const response = await api.get('/medications/', { params });
    return response.data;
  },
  
  getMedicationById: async (id: string) => {
    const response = await api.get(`/medications/${id}/`);
    return response.data;
  },
  
  updateMedication: async (id: string, data: any) => {
    const response = await api.patch(`/medications/${id}/`, data);
    return response.data;
  },
};
```

### Offline Support

```typescript
// Offline queue for API requests
import NetInfo from '@react-native-netinfo/netinfo';
import { Queue } from 'react-native-queue';

class OfflineQueue {
  private queue = new Queue();
  private isOnline = true;
  
  constructor() {
    this.setupNetworkListener();
  }
  
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }
  
  async addToQueue(action: string, data: any) {
    await this.queue.add({
      action,
      data,
      timestamp: Date.now(),
    });
  }
  
  private async processQueue() {
    const items = await this.queue.get();
    
    for (const item of items) {
      try {
        await this.processQueueItem(item);
        await this.queue.remove(item.id);
      } catch (error) {
        console.error('Error processing queue item:', error);
      }
    }
  }
  
  private async processQueueItem(item: any) {
    switch (item.action) {
      case 'UPDATE_MEDICATION':
        await medicationAPI.updateMedication(item.data.id, item.data);
        break;
      case 'ADD_MEDICATION_LOG':
        await medicationAPI.addMedicationLog(item.data);
        break;
      // Add more actions as needed
    }
  }
}
```

## 4. Memory Management

### Memory Leak Prevention

```typescript
// Custom hooks for memory management
import { useEffect, useRef } from 'react';

export const useInterval = (callback: () => void, delay: number) => {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export const useTimeout = (callback: () => void, delay: number) => {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay !== null) {
      const id = setTimeout(() => savedCallback.current(), delay);
      return () => clearTimeout(id);
    }
  }, [delay]);
};

// Cleanup on unmount
const MedicationDetailScreen = () => {
  const [medication, setMedication] = useState(null);
  const mounted = useRef(true);
  
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  
  const fetchMedication = async (id: string) => {
    try {
      const data = await medicationAPI.getMedicationById(id);
      if (mounted.current) {
        setMedication(data);
      }
    } catch (error) {
      console.error('Error fetching medication:', error);
    }
  };
  
  // ... rest of component
};
```

## 5. Bundle Size Optimization

### Code Splitting

```typescript
// Lazy loading for screens
import { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

const MedicationDetailScreen = lazy(() => import('./screens/MedicationDetailScreen'));
const AnalyticsScreen = lazy(() => import('./screens/AnalyticsScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

const AppNavigator = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Stack.Navigator>
        <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </Suspense>
  );
};
```

### Asset Optimization

```typescript
// Optimized asset loading
import { Asset } from 'expo-asset';

class AssetManager {
  static async preloadAssets() {
    const imageAssets = [
      require('./assets/icons/medication.png'),
      require('./assets/icons/alert.png'),
      require('./assets/icons/settings.png'),
    ];
    
    const cachePromises = imageAssets.map(image => {
      return Asset.fromModule(image).downloadAsync();
    });
    
    await Promise.all(cachePromises);
  }
  
  static async preloadFonts() {
    await Font.loadAsync({
      'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
      'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
    });
  }
}
```

## 6. Performance Monitoring

### Performance Metrics

```typescript
// Performance monitoring
import { Performance } from 'expo-performance';

class PerformanceMonitor {
  static startTrace(traceName: string) {
    return Performance.startTrace(traceName);
  }
  
  static async measureAsync(operation: () => Promise<any>, name: string) {
    const trace = this.startTrace(name);
    try {
      const result = await operation();
      trace.stop();
      return result;
    } catch (error) {
      trace.stop();
      throw error;
    }
  }
  
  static logMetric(name: string, value: number) {
    Performance.logMetric(name, value);
  }
}

// Usage in components
const MedicationList = () => {
  const loadMedications = async () => {
    return PerformanceMonitor.measureAsync(
      () => medicationAPI.getMedications(),
      'load_medications'
    );
  };
  
  // ... rest of component
};
```

### Error Boundary

```typescript
// Error boundary for React Native
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send error to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong.</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

## 7. Expo-Specific Optimizations

### Expo Updates

```typescript
// Optimized update handling
import * as Updates from 'expo-updates';

class UpdateManager {
  static async checkForUpdates() {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
  
  static async reloadApp() {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error reloading app:', error);
    }
  }
}
```

### Expo Constants Optimization

```typescript
// Optimized constants usage
import Constants from 'expo-constants';

const isDevelopment = Constants.appOwnership === 'expo';
const isStandalone = Constants.appOwnership === 'standalone';

// Use platform-specific optimizations
const platformConfig = {
  ios: {
    enableHermes: true,
    enableFlipper: isDevelopment,
  },
  android: {
    enableHermes: true,
    enableProguardInReleaseBuilds: !isDevelopment,
  },
};
```

## 8. Testing Performance

### Performance Testing

```typescript
// Performance testing utilities
import { render, fireEvent } from '@testing-library/react-native';

describe('MedicationList Performance', () => {
  it('should render large lists efficiently', () => {
    const largeMedicationList = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Medication ${i}`,
      dosage: '100mg',
    }));
    
    const startTime = Date.now();
    const { getByTestId } = render(
      <MedicationList medications={largeMedicationList} />
    );
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
  });
  
  it('should handle rapid scrolling', () => {
    const { getByTestId } = render(<MedicationList />);
    const flatList = getByTestId('medication-list');
    
    // Simulate rapid scrolling
    for (let i = 0; i < 10; i++) {
      fireEvent.scroll(flatList, {
        nativeEvent: {
          contentOffset: { y: i * 100 },
          contentSize: { height: 1000, width: 400 },
          layoutMeasurement: { height: 600, width: 400 },
        },
      });
    }
    
    // Should not crash or show performance issues
  });
});
```

## 9. Configuration Files

### Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Hermes
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimize bundle
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
```

### Babel Configuration

```javascript
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Enable Hermes
      '@babel/plugin-transform-flow-strip-types',
      
      // Optimize reanimated
      'react-native-reanimated/plugin',
      
      // Tree shaking
      ['@babel/plugin-transform-runtime', {
        regenerator: true,
      }],
    ],
  };
};
```

## 10. Deployment Optimization

### EAS Build Configuration

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "NODE_ENV": "production"
      }
    },
    "production": {
      "env": {
        "NODE_ENV": "production"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

This comprehensive optimization guide will significantly improve the performance of your MedGuard SA mobile application. Implement these optimizations gradually and monitor their impact on app performance and user experience. 