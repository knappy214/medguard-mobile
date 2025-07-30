import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, Rect, Ellipse, Circle, Filter, FeDropShadow } from 'react-native-svg';

const Logo = ({ size = 'md', showText = true, variant = 'default', style }) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  const textSizeMap = {
    sm: 10,
    md: 12,
    lg: 14,
    xl: 16
  };

  const iconSize = sizeMap[size];
  const textSize = textSizeMap[size];

  return (
    <View style={[styles.container, style]}>
      {/* Logo Icon */}
      <View style={[styles.iconContainer, { width: iconSize, height: iconSize }]}>
        <Svg width={iconSize} height={iconSize} viewBox="0 0 64 64">
          <Defs>
            <LinearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="50%" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="50%" stopColor="#2563EB" stopOpacity="1" />
              <Stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
            </LinearGradient>
            <Filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <FeDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
            </Filter>
          </Defs>
          
          {/* Shield Shape */}
          <Path 
            d="M32 8 L48 12 L48 28 C48 36 42 40 32 44 L24 42 C18 40 12 36 12 28 L12 12 Z" 
            fill="url(#shieldGradient)" 
            stroke="white" 
            strokeWidth="1"
            filter="url(#logo-shadow)"
          />
          
          {/* Medical Cross (Left Side) */}
          <G transform="translate(20, 24)">
            <Rect x="-4" y="-1" width="8" height="2" fill="white" rx="1"/>
            <Rect x="-1" y="-4" width="2" height="8" fill="white" rx="1"/>
          </G>
          
          {/* Pill/Capsule (Right Side) */}
          <G transform="translate(44, 26)">
            {/* Left segment of capsule */}
            <Ellipse cx="-4" cy="0" rx="6" ry="4" fill="#60A5FA"/>
            <Ellipse cx="-4" cy="0" rx="5" ry="3" fill="#93C5FD"/>
            {/* Curved line in left segment */}
            <Path d="M-8 -1.5 Q-6 -0.5 -4 -1.5 Q-2 -2.5 0 -1.5" stroke="white" strokeWidth="0.5" fill="none"/>
            
            {/* Right segment of capsule */}
            <Ellipse cx="4" cy="0" rx="6" ry="4" fill="white"/>
            {/* Medical cross in right segment */}
            <G transform="translate(4, 0)">
              <Rect x="-1.5" y="-0.5" width="3" height="1" fill="#60A5FA" rx="0.5"/>
              <Rect x="-0.5" y="-1.5" width="1" height="3" fill="#60A5FA" rx="0.5"/>
            </G>
            
            {/* Center line connecting segments */}
            <Rect x="-1" y="-4" width="2" height="8" fill="#E5E7EB" rx="1"/>
          </G>
        </Svg>
      </View>
      
      {/* Brand Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: textSize }]}>MEDGUARD SA</Text>
          <Text style={[styles.taglineText, { fontSize: textSize * 0.7 }]}>PROFESSIONAL APP</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    flexShrink: 0,
  },
  textContainer: {
    flexDirection: 'column',
  },
  brandText: {
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 16,
  },
  taglineText: {
    color: '#6B7280',
    lineHeight: 12,
  },
});

export default Logo; 