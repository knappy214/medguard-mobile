import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface AccessibilityPreferences {
  largeTouchTargets: boolean
  voiceGuidance: boolean
  hapticFeedback: boolean
}

const DEFAULT_PREFS: AccessibilityPreferences = {
  largeTouchTargets: true,
  voiceGuidance: false,
  hapticFeedback: true,
}

interface AccessibilityContextValue extends AccessibilityPreferences {
  setPreferences: (prefs: Partial<AccessibilityPreferences>) => Promise<void>
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined)

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_PREFS)

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem('accessibility_prefs')
        if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
      } catch {}
    })()
  }, [])

  const setPreferences = useCallback(async (next: Partial<AccessibilityPreferences>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next }
      AsyncStorage.setItem('accessibility_prefs', JSON.stringify(merged)).catch(() => {})
      return merged
    })
  }, [])

  return (
    <AccessibilityContext.Provider value={{ ...prefs, setPreferences }}>{children}</AccessibilityContext.Provider>
  )
}

export const useAccessibility = (): AccessibilityContextValue => {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}


