/**
 * Settings Context Provider
 * Provides global settings context to all components with change notifications
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { type GameSettings } from '@/types/game'

/**
 * Settings Context Type
 */
interface SettingsContextType {
  settings: GameSettings
  updateSettings: (newSettings: Partial<GameSettings>) => void
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  hasChanges: boolean
  saveSettings: () => Promise<boolean>
  resetToDefaults: () => void
  discardChanges: () => void
}

/**
 * Settings Context
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

/**
 * Settings Provider Props
 */
interface SettingsProviderProps {
  children: React.ReactNode
}

/**
 * Settings Provider Component
 *
 * Provides global settings context to all components in the application.
 * Handles settings persistence, validation, and change notifications.
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const {
    settings,
    isLoading,
    isSaving,
    error,
    hasChanges,
    updateSettings,
    saveSettings,
    resetToDefaults,
    discardChanges,
  } = useSettings()

  const [contextSettings, setContextSettings] = useState(settings)

  // Update context settings when settings change
  useEffect(() => {
    setContextSettings(settings)
  }, [settings])

  // Enhanced update settings function that updates context immediately
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setContextSettings(prev => ({ ...prev, ...newSettings }))
    updateSettings(newSettings)
  }

  const contextValue: SettingsContextType = {
    settings: contextSettings,
    updateSettings: handleUpdateSettings,
    isLoading,
    isSaving,
    error,
    hasChanges,
    saveSettings,
    resetToDefaults,
    discardChanges,
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

/**
 * Hook to use settings context
 */
export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return context
}

/**
 * Higher-order component for accessing settings
 */
export function withSettings<T>(
  Component: React.ComponentType<T & { settings: GameSettings }>
) {
  return function WithSettings(props: Omit<T, 'settings'>) {
    const { settings } = useSettingsContext()
    return <Component {...(props as T)} settings={settings} />
  }
}

/**
 * Settings Consumer Component
 */
export function SettingsConsumer({
  children,
}: {
  children: (context: SettingsContextType) => React.ReactNode
}) {
  return (
    <SettingsContext.Consumer>
      {(context) => {
        if (context === undefined) {
          throw new Error('SettingsConsumer must be used within a SettingsProvider')
        }
        return children(context)
      }}
    </SettingsContext.Consumer>
  )
}

/**
 * Type guard for settings context
 */
export function hasSettingsContext(
  value: unknown
): value is SettingsContextType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'settings' in value &&
    'updateSettings' in value &&
    'saveSettings' in value
  )
}

/**
 * Debug utilities for development
 */
export const SettingsDebug = {
  /**
   * Log current settings to console
   */
  logSettings: (context: SettingsContextType) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔧 Settings Debug')
      console.log('Current Settings:', context.settings)
      console.log('Has Changes:', context.hasChanges)
      console.log('Loading:', context.isLoading)
      console.log('Saving:', context.isSaving)
      console.log('Error:', context.error)
      console.groupEnd()
    }
  },

  /**
   * Export settings as JSON
   */
  exportSettings: (context: SettingsContextType) => {
    return JSON.stringify(context.settings, null, 2)
  },

  /**
   * Import settings from JSON
   */
  importSettings: (json: string, context: SettingsContextType) => {
    try {
      const parsed = JSON.parse(json)
      context.updateSettings(parsed)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  },

  /**
   * Reset to defaults with confirmation
   */
  resetWithConfirmation: (context: SettingsContextType) => {
    if (process.env.NODE_ENV === 'development' &&
        confirm('Are you sure you want to reset all settings to defaults?')) {
      context.resetToDefaults()
      return true
    }
    return false
  },
}