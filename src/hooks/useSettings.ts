/**
 * Settings Persistence Hook
 * React hook for managing game settings with localStorage persistence and migration support
 */

import { useState, useEffect, useCallback } from 'react'
import {
  type GameSettings,
  DEFAULT_GAME_SETTINGS,
} from '../types/game'
// Lazy import to avoid server-side initialization
let persistenceService: any = null
const getPersistenceService = async () => {
  if (!persistenceService && typeof window !== 'undefined') {
    const { persistenceService: service } = await import('../lib/storage/service')
    persistenceService = service
  }
  return persistenceService
}

/**
 * Hook return type
 */
export interface UseSettingsReturn {
  // Settings state
  settings: GameSettings
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  hasChanges: boolean

  // Actions
  updateSettings: (newSettings: Partial<GameSettings>) => void
  saveSettings: () => Promise<boolean>
  resetToDefaults: () => void
  discardChanges: () => void

  // Migration
  migrateFromOldFormat: (oldSettings: any) => GameSettings

  // Validation
  validateSettings: (settings: Partial<GameSettings>) => boolean
  getValidationErrors: (settings: Partial<GameSettings>) => string[]
}

/**
 * Settings validation schema
 */
const SETTINGS_VALIDATION = {
  difficulty: (value: any): boolean => ['easy', 'medium', 'hard'].includes(value),
  playerDisc: (value: any): boolean => ['red', 'yellow'].includes(value),
  enableAnimations: (value: any): boolean => typeof value === 'boolean',
  enableSound: (value: any): boolean => typeof value === 'boolean',
  theme: (value: any): boolean => ['light', 'dark', 'auto'].includes(value),
  persistGames: (value: any): boolean => typeof value === 'boolean',
  saveHistory: (value: any): boolean => typeof value === 'boolean',
} as const

/**
 * Custom hook for managing game settings with persistence
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS)
  const [tempSettings, setTempSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  /**
   * Load settings from persistence
   */
  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const service = await getPersistenceService()
      if (!service) {
        // If no service available (SSR), use defaults
        setSettings(DEFAULT_GAME_SETTINGS)
        setTempSettings(DEFAULT_GAME_SETTINGS)
        setIsLoading(false)
        return
      }

      const savedSettings = await service.loadSettings()

      if (savedSettings) {
        // Validate and migrate settings if needed
        const validatedSettings = validateAndMigrateSettings(savedSettings)
        setSettings(validatedSettings)
        setTempSettings(validatedSettings)
      } else {
        // Initialize with defaults
        await saveSettingsToStorage(DEFAULT_GAME_SETTINGS)
        setSettings(DEFAULT_GAME_SETTINGS)
        setTempSettings(DEFAULT_GAME_SETTINGS)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError(err instanceof Error ? err : new Error('Failed to load settings'))

      // Fallback to defaults
      setSettings(DEFAULT_GAME_SETTINGS)
      setTempSettings(DEFAULT_GAME_SETTINGS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update settings (creates temporary copy)
   */
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    const updated = { ...tempSettings, ...newSettings }

    // Auto-calculate derived values
    if (newSettings.playerDisc) {
      updated.aiDisc = newSettings.playerDisc === 'red' ? 'yellow' : 'red'
    }

    setTempSettings(updated)
    setHasChanges(true)
    setError(null)
  }, [tempSettings])

  /**
   * Save settings to persistence
   */
  const saveSettings = useCallback(async (): Promise<boolean> => {
    if (!hasChanges) {
      return true
    }

    setIsSaving(true)
    setError(null)

    try {
      // Validate settings before saving
      const validationErrors = getValidationErrors(tempSettings)
      if (validationErrors.length > 0) {
        throw new Error(`Invalid settings: ${validationErrors.join(', ')}`)
      }

      await saveSettingsToStorage(tempSettings)
      setSettings(tempSettings)
      setHasChanges(false)

      return true
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(err instanceof Error ? err : new Error('Failed to save settings'))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [tempSettings, hasChanges])

  /**
   * Reset to default settings
   */
  const resetToDefaults = useCallback(() => {
    setTempSettings(DEFAULT_GAME_SETTINGS)
    setHasChanges(true)
    setError(null)
  }, [])

  /**
   * Discard unsaved changes
   */
  const discardChanges = useCallback(() => {
    setTempSettings(settings)
    setHasChanges(false)
    setError(null)
  }, [settings])

  /**
   * Migrate settings from old format
   */
  const migrateFromOldFormat = useCallback((oldSettings: any): GameSettings => {
    const migrated = { ...DEFAULT_GAME_SETTINGS }

    // Map old properties to new format
    if (oldSettings.difficulty && SETTINGS_VALIDATION.difficulty(oldSettings.difficulty)) {
      migrated.difficulty = oldSettings.difficulty
    }

    if (oldSettings.playerColor && SETTINGS_VALIDATION.playerDisc(oldSettings.playerColor)) {
      migrated.playerDisc = oldSettings.playerColor
      migrated.aiDisc = oldSettings.playerColor === 'red' ? 'yellow' : 'red'
    }

    if (typeof oldSettings.animations === 'boolean') {
      migrated.enableAnimations = oldSettings.animations
    }

    if (typeof oldSettings.sound === 'boolean') {
      migrated.enableSound = oldSettings.sound
    }

    if (oldSettings.theme && SETTINGS_VALIDATION.theme(oldSettings.theme)) {
      migrated.theme = oldSettings.theme
    }

    if (typeof oldSettings.persistence === 'boolean') {
      migrated.persistGames = oldSettings.persistence
    }

    return migrated
  }, [])

  /**
   * Validate settings
   */
  const validateSettings = useCallback((settingsToValidate: Partial<GameSettings>): boolean => {
    return getValidationErrors(settingsToValidate).length === 0
  }, [])

  /**
   * Get validation errors
   */
  const getValidationErrors = useCallback((settingsToValidate: Partial<GameSettings>): string[] => {
    const errors: string[] = []

    Object.entries(SETTINGS_VALIDATION).forEach(([key, validator]) => {
      if (key in settingsToValidate) {
        const value = (settingsToValidate as any)[key]
        if (!validator(value)) {
          errors.push(`Invalid ${key}: ${value}`)
        }
      }
    })

    return errors
  }, [])

  return {
    settings,
    isLoading,
    isSaving,
    error,
    hasChanges,
    updateSettings,
    saveSettings,
    resetToDefaults,
    discardChanges,
    migrateFromOldFormat,
    validateSettings,
    getValidationErrors,
  }
}

/**
 * Hook for theme management with system preference detection
 */
export function useTheme() {
  const { settings, updateSettings } = useSettings()
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)

      if (settings.theme === 'auto') {
        setCurrentTheme(newSystemTheme)
        applyTheme(newSystemTheme)
      }
    }

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // Add listener for system theme changes
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [settings.theme])

  // Update theme when settings change
  useEffect(() => {
    let theme: 'light' | 'dark'

    switch (settings.theme) {
      case 'light':
        theme = 'light'
        break
      case 'dark':
        theme = 'dark'
        break
      case 'auto':
      default:
        theme = systemTheme
        break
    }

    setCurrentTheme(theme)
    applyTheme(theme)
  }, [settings.theme, systemTheme])

  /**
   * Apply theme to document
   */
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement

      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [])

  /**
   * Change theme
   */
  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'auto') => {
    updateSettings({ theme: newTheme })
  }, [updateSettings])

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [currentTheme, setTheme])

  return {
    currentTheme,
    systemTheme,
    settingsTheme: settings.theme,
    setTheme,
    toggleTheme,
    isAutoTheme: settings.theme === 'auto',
  }
}

/**
 * Hook for settings change notifications
 */
export function useSettingsNotifications() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    timestamp: number
  } | null>(null)

  const showNotification = useCallback((
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({
      type,
      message,
      timestamp: Date.now(),
    })

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    showNotification,
    hideNotification,
  }
}

// Helper functions

/**
 * Save settings to storage with error handling
 */
async function saveSettingsToStorage(settings: GameSettings): Promise<void> {
  try {
    const service = await getPersistenceService()
    if (service) {
      await service.saveSettings(settings)
    }
  } catch (error) {
    console.error('Failed to save settings to storage:', error)
    throw new Error('Failed to save settings')
  }
}

/**
 * Validate and migrate settings from old format
 */
function validateAndMigrateSettings(savedSettings: any): GameSettings {
  // Check if settings need migration
  if (savedSettings.version === undefined) {
    return migrateFromOldFormat(savedSettings)
  }

  // Validate each setting
  const validated = { ...DEFAULT_GAME_SETTINGS }

  Object.entries(SETTINGS_VALIDATION).forEach(([key, validator]) => {
    if (key in savedSettings) {
      const value = savedSettings[key]
      if (validator(value)) {
        (validated as any)[key] = value
      }
    }
  })

  // Ensure derived values are correct
  if (validated.playerDisc) {
    validated.aiDisc = validated.playerDisc === 'red' ? 'yellow' : 'red'
  }

  return validated
}

/**
 * Migrate settings from old format
 */
function migrateFromOldFormat(oldSettings: any): GameSettings {
  const migrated = { ...DEFAULT_GAME_SETTINGS, version: 1 }

  // Map old property names to new ones
  const propertyMap: Record<string, string> = {
    difficulty: 'difficulty',
    playerColor: 'playerDisc',
    animations: 'enableAnimations',
    sound: 'enableSound',
    theme: 'theme',
    persistence: 'persistGames',
  }

  Object.entries(propertyMap).forEach(([oldKey, newKey]) => {
    if (oldKey in oldSettings) {
      const value = oldSettings[oldKey]
      const validator = SETTINGS_VALIDATION[newKey as keyof typeof SETTINGS_VALIDATION]

      if (validator && validator(value)) {
        (migrated as any)[newKey] = value
      }
    }
  })

  // Set derived values
  if (migrated.playerDisc) {
    migrated.aiDisc = migrated.playerDisc === 'red' ? 'yellow' : 'red'
  }

  return migrated
}