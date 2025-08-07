/**
 * MedGuard SA - Optimized FlatList Hook
 * Performance hook for rendering large lists efficiently
 * Includes virtualization, memoization, and accessibility features
 */

import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { FlatListProps, ListRenderItemInfo, ViewToken } from 'react-native';

export interface OptimizedFlatListConfig<T> {
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement | null;
  itemHeight?: number;
  estimatedItemSize?: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: {
    itemVisiblePercentThreshold?: number;
    minimumViewTime?: number;
    viewAreaCoveragePercentThreshold?: number;
    waitForInteraction?: boolean;
  };
  enableVirtualization?: boolean;
  maintainVisibleContentPosition?: {
    minIndexForVisible: number;
    autoscrollToTopThreshold?: number;
  };
}

export interface OptimizedFlatListReturn<T> extends Partial<FlatListProps<T>> {
  // Performance metrics
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  
  // Helper functions
  scrollToIndex: (index: number, animated?: boolean) => void;
  scrollToItem: (item: T, animated?: boolean) => void;
  scrollToTop: (animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
  
  // Accessibility helpers
  announceForAccessibility: (message: string) => void;
  getAccessibilityLabel: (item: T, index: number) => string;
  
  // State management
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  
  // Virtualization info
  visibleRange: { start: number; end: number };
  totalItems: number;
}

export const useOptimizedFlatList = <T extends any>(
  config: OptimizedFlatListConfig<T>
): OptimizedFlatListReturn<T> => {
  const {
    data,
    keyExtractor,
    renderItem,
    itemHeight,
    estimatedItemSize = 80,
    windowSize = 10,
    initialNumToRender = 10,
    maxToRenderPerBatch = 10,
    updateCellsBatchingPeriod = 50,
    removeClippedSubviews = true,
    getItemLayout,
    onViewableItemsChanged,
    viewabilityConfig = {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
    },
    enableVirtualization = true,
    maintainVisibleContentPosition,
  } = config;

  // Performance tracking
  const [renderCount, setRenderCount] = useState(0);
  const [renderTimes, setRenderTimes] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: initialNumToRender });

  // Refs
  const flatListRef = useRef<any>(null);
  const renderStartTime = useRef<number>(0);

  // Memoized key extractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number): string => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      
      // Default key extraction strategies
      if (typeof item === 'object' && item !== null) {
        if ('id' in item) return String((item as any).id);
        if ('key' in item) return String((item as any).key);
        if ('uuid' in item) return String((item as any).uuid);
      }
      
      return String(index);
    },
    [keyExtractor]
  );

  // Memoized render item with performance tracking
  const memoizedRenderItem = useCallback(
    (info: ListRenderItemInfo<T>) => {
      renderStartTime.current = performance.now();
      
      const result = renderItem(info);
      
      const renderTime = performance.now() - renderStartTime.current;
      setRenderTimes(prev => [...prev.slice(-99), renderTime]); // Keep last 100 render times
      setRenderCount(prev => prev + 1);
      
      return result;
    },
    [renderItem]
  );

  // Optimized getItemLayout
  const memoizedGetItemLayout = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    
    if (itemHeight) {
      return (data: T[] | null | undefined, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    
    return undefined;
  }, [getItemLayout, itemHeight]);

  // Viewability config with performance optimizations
  const optimizedViewabilityConfig = useMemo(() => ({
    ...viewabilityConfig,
    waitForInteraction: true, // Improve performance on scroll
  }), [viewabilityConfig]);

  // Enhanced onViewableItemsChanged with range tracking
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (info.viewableItems.length > 0) {
        const start = Math.min(...info.viewableItems.map(item => item.index || 0));
        const end = Math.max(...info.viewableItems.map(item => item.index || 0));
        setVisibleRange({ start, end });
      }
      
      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged]
  );

  // Scroll functions
  const scrollToIndex = useCallback((index: number, animated: boolean = true) => {
    flatListRef.current?.scrollToIndex({ index, animated });
  }, []);

  const scrollToItem = useCallback((item: T, animated: boolean = true) => {
    const index = data.findIndex(dataItem => 
      memoizedKeyExtractor(dataItem, 0) === memoizedKeyExtractor(item, 0)
    );
    if (index !== -1) {
      scrollToIndex(index, animated);
    }
  }, [data, memoizedKeyExtractor, scrollToIndex]);

  const scrollToTop = useCallback((animated: boolean = true) => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated });
  }, []);

  const scrollToEnd = useCallback((animated: boolean = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  // Accessibility helpers
  const announceForAccessibility = useCallback((message: string) => {
    // This would integrate with React Native's accessibility announcement system
    console.log('Accessibility announcement:', message);
  }, []);

  const getAccessibilityLabel = useCallback((item: T, index: number): string => {
    if (typeof item === 'object' && item !== null) {
      if ('name' in item) return `Item ${index + 1}: ${(item as any).name}`;
      if ('title' in item) return `Item ${index + 1}: ${(item as any).title}`;
      if ('label' in item) return `Item ${index + 1}: ${(item as any).label}`;
    }
    
    return `Item ${index + 1} of ${data.length}`;
  }, [data.length]);

  // Performance calculations
  const lastRenderTime = renderTimes[renderTimes.length - 1] || 0;
  const averageRenderTime = renderTimes.length > 0 
    ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
    : 0;

  // Performance monitoring effect
  useEffect(() => {
    if (averageRenderTime > 16.67) { // 60fps threshold
      console.warn('FlatList render performance warning:', {
        averageRenderTime: averageRenderTime.toFixed(2),
        recommendation: 'Consider reducing item complexity or implementing item memoization',
      });
    }
  }, [averageRenderTime]);

  // FlatList props optimized for performance
  const flatListProps: Partial<FlatListProps<T>> = {
    ref: flatListRef,
    data,
    keyExtractor: memoizedKeyExtractor,
    renderItem: memoizedRenderItem,
    getItemLayout: memoizedGetItemLayout,
    
    // Performance optimizations
    windowSize,
    initialNumToRender,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    removeClippedSubviews: enableVirtualization ? removeClippedSubviews : false,
    
    // Viewability
    onViewableItemsChanged: handleViewableItemsChanged,
    viewabilityConfig: optimizedViewabilityConfig,
    
    // Content position maintenance
    maintainVisibleContentPosition,
    
    // Accessibility
    accessibilityRole: 'list',
    accessibilityLabel: `List with ${data.length} items`,
    
    // Additional optimizations
    legacyImplementation: false,
    disableVirtualization: !enableVirtualization,
  };

  return {
    ...flatListProps,
    
    // Performance metrics
    renderCount,
    lastRenderTime,
    averageRenderTime,
    
    // Helper functions
    scrollToIndex,
    scrollToItem,
    scrollToTop,
    scrollToEnd,
    
    // Accessibility helpers
    announceForAccessibility,
    getAccessibilityLabel,
    
    // State management
    refreshing,
    setRefreshing,
    
    // Virtualization info
    visibleRange,
    totalItems: data.length,
  };
};

// Hook for optimizing medication list specifically
export const useMedicationList = (medications: any[]) => {
  return useOptimizedFlatList({
    data: medications,
    keyExtractor: (item) => item.id,
    renderItem: ({ item, index }) => {
      // This would be implemented by the consuming component
      return null;
    },
    itemHeight: 80, // Standard medication item height
    estimatedItemSize: 80,
    viewabilityConfig: {
      itemVisiblePercentThreshold: 60,
      minimumViewTime: 200,
    },
    enableVirtualization: medications.length > 50, // Only virtualize for large lists
  });
};

// Hook for optimizing schedule/reminder lists
export const useScheduleList = (schedules: any[]) => {
  return useOptimizedFlatList({
    data: schedules,
    keyExtractor: (item) => `${item.medicationId}-${item.time}`,
    renderItem: ({ item, index }) => {
      // This would be implemented by the consuming component
      return null;
    },
    itemHeight: 60, // Compact schedule item height
    estimatedItemSize: 60,
    windowSize: 15, // Larger window for schedule views
    viewabilityConfig: {
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 150,
    },
  });
};

// Hook for optimizing notification lists
export const useNotificationList = (notifications: any[]) => {
  return useOptimizedFlatList({
    data: notifications,
    keyExtractor: (item) => item.id,
    renderItem: ({ item, index }) => {
      // This would be implemented by the consuming component
      return null;
    },
    itemHeight: 100, // Taller notification items
    estimatedItemSize: 100,
    initialNumToRender: 8, // Fewer initial items for notifications
    viewabilityConfig: {
      itemVisiblePercentThreshold: 40,
      minimumViewTime: 300, // Longer view time for notifications
    },
    maintainVisibleContentPosition: {
      minIndexForVisible: 0,
      autoscrollToTopThreshold: 100,
    },
  });
};
