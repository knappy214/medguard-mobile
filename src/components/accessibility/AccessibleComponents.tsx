import React from 'react'
import { StyleSheet } from 'react-native'
import { Button, Text } from '@ui-kitten/components'
import * as Haptics from 'expo-haptics'
import * as Speech from 'expo-speech'
import { Spacing, Typography } from '../../theme/typography'
import { useAccessibility } from '../../contexts/AccessibilityContext'

export interface LargeAccessibleButtonProps {
  onPress: () => void
  children: React.ReactNode
  hapticFeedback?: boolean
  voiceGuidance?: boolean
  accessibilityLabel?: string
}

export const LargeAccessibleButton: React.FC<LargeAccessibleButtonProps> = ({
  onPress,
  children,
  hapticFeedback,
  voiceGuidance,
  accessibilityLabel,
}) => {
  const { largeTouchTargets, voiceGuidance: vgPref, hapticFeedback: hPref } = useAccessibility()
  const handlePress = async () => {
    const useHaptics = hapticFeedback ?? hPref
    const useVoice = voiceGuidance ?? vgPref
    if (useHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    
    if (useVoice) {
      const phrase = typeof children === 'string' ? children : 'Action'
      await Speech.speak(`Button pressed: ${phrase}`)
    }

    onPress()
  }

  const label =
    accessibilityLabel ||
    (typeof children === 'string' ? `${children}. Double tap to activate.` : 'Activate action')

  return (
    <Button
      style={[styles.accessibleButton, largeTouchTargets && styles.accessibleButtonLarge]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="This will perform the requested action"
    >
      <Text style={styles.accessibleText}>{children}</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  accessibleButton: {
    minHeight: Spacing.touchTarget.minimum,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  accessibleButtonLarge: {
    minHeight: Spacing.touchTarget.large, // 72px for elderly users
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  accessibleText: {
    fontSize: Typography.sizes.accessible.medium, // 22px
    lineHeight: Typography.lineHeights.loose as unknown as number,
    fontWeight: Typography.weights.semibold as any,
  },
})


