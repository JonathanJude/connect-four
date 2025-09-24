/**
 * localStorage Settings Storage
 * Fallback storage for settings when IndexedDB is not available
 */

import {
  type GameSettings,
  type DiscColor,
  Difficulty,
} from '../game/constants'

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  SETTINGS: 'connect_four_settings',
  THEME: 'connect_four_theme',
  SOUND: 'connect_four_sound',
  ANIMATIONS: 'connect_four_animations',
  LANGUAGE: 'connect_four_language',
  LAST_PLAYED: 'connect_four_last_played',
  QUICK_STATS: 'connect_four_quick_stats',
} as const

/**
 * Default settings
 */
const DEFAULT_SETTINGS: GameSettings = {
  playerDisc: 'red',
  difficulty: 'medium',
  soundEnabled: true,
  animationsEnabled: true,
  theme: 'auto',
  language: 'en',
}

/**
 * Quick Stats interface for localStorage
 */
interface QuickStats {
  totalGames: number
  wins: number
  losses: number
  draws: number
  lastUpdated: Date
}

/**
 * localStorage Settings Service
 */
export class LocalStorageSettings {
  private static instance: LocalStorageSettings
  private settings: GameSettings | null = null
  private quickStats: QuickStats | null = null

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LocalStorageSettings {
    if (!LocalStorageSettings.instance) {
      LocalStorageSettings.instance = new LocalStorageSettings()
    }
    return LocalStorageSettings.instance
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): GameSettings {
    if (this.settings) {
      return this.settings
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (stored) {
        const parsed = JSON.parse(stored)

        // Validate and merge with defaults
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
        }

        // Ensure theme compatibility
        if (!['light', 'dark', 'auto'].includes(this.settings.theme)) {
          this.settings.theme = 'auto'
        }

        // Ensure difficulty compatibility
        if (!['easy', 'medium', 'hard'].includes(this.settings.difficulty)) {
          this.settings.difficulty = 'medium'
        }

        // Ensure disc color compatibility
        if (this.settings.playerDisc !== 'red' && this.settings.playerDisc !== 'yellow') {
          this.settings.playerDisc = 'red'
        }

        return this.settings
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }

    // Return default settings if none stored
    this.settings = { ...DEFAULT_SETTINGS }
    return this.settings
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: Partial<GameSettings>): void {
    const currentSettings = this.loadSettings()
    this.settings = { ...currentSettings, ...settings }

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings))

      // Also save individual settings for easier access
      this.saveIndividualSettings()
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }

  /**
   * Get theme setting
   */
  getTheme(): 'light' | 'dark' | 'auto' {
    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME)
      if (theme && ['light', 'dark', 'auto'].includes(theme)) {
        return theme as 'light' | 'dark' | 'auto'
      }
    } catch (error) {
      console.warn('Failed to get theme from localStorage:', error)
    }

    return this.loadSettings().theme
  }

  /**
   * Set theme setting
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme)
      this.saveSettings({ theme })
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  /**
   * Get sound enabled setting
   */
  getSoundEnabled(): boolean {
    try {
      const sound = localStorage.getItem(STORAGE_KEYS.SOUND)
      if (sound !== null) {
        return sound === 'true'
      }
    } catch (error) {
      console.warn('Failed to get sound setting from localStorage:', error)
    }

    return this.loadSettings().soundEnabled
  }

  /**
   * Set sound enabled setting
   */
  setSoundEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, enabled.toString())
      this.saveSettings({ soundEnabled: enabled })
    } catch (error) {
      console.warn('Failed to save sound setting to localStorage:', error)
    }
  }

  /**
   * Get animations enabled setting
   */
  getAnimationsEnabled(): boolean {
    try {
      const animations = localStorage.getItem(STORAGE_KEYS.ANIMATIONS)
      if (animations !== null) {
        return animations === 'true'
      }
    } catch (error) {
      console.warn('Failed to get animations setting from localStorage:', error)
    }

    return this.loadSettings().animationsEnabled
  }

  /**
   * Set animations enabled setting
   */
  setAnimationsEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ANIMATIONS, enabled.toString())
      this.saveSettings({ animationsEnabled: enabled })
    } catch (error) {
      console.warn('Failed to save animations setting to localStorage:', error)
    }
  }

  /**
   * Get language setting
   */
  getLanguage(): string {
    try {
      const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
      if (language) {
        return language
      }
    } catch (error) {
      console.warn('Failed to get language from localStorage:', error)
    }

    return this.loadSettings().language
  }

  /**
   * Set language setting
   */
  setLanguage(language: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, language)
      this.saveSettings({ language })
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error)
    }
  }

  /**
   * Get last played timestamp
   */
  getLastPlayed(): Date | null {
    try {
      const lastPlayed = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED)
      if (lastPlayed) {
        return new Date(JSON.parse(lastPlayed))
      }
    } catch (error) {
      console.warn('Failed to get last played from localStorage:', error)
    }

    return null
  }

  /**
   * Set last played timestamp
   */
  setLastPlayed(timestamp: Date = new Date()): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, JSON.stringify(timestamp.toISOString()))
    } catch (error) {
      console.warn('Failed to save last played to localStorage:', error)
    }
  }

  /**
   * Get quick statistics
   */
  getQuickStats(): QuickStats {
    if (this.quickStats) {
      return this.quickStats
    }

    try {
      const stats = localStorage.getItem(STORAGE_KEYS.QUICK_STATS)
      if (stats) {
        const parsed = JSON.parse(stats)

        // Validate the structure
        if (typeof parsed === 'object' && parsed !== null) {
          this.quickStats = {
            totalGames: Math.max(0, parsed.totalGames || 0),
            wins: Math.max(0, parsed.wins || 0),
            losses: Math.max(0, parsed.losses || 0),
            draws: Math.max(0, parsed.draws || 0),
            lastUpdated: new Date(parsed.lastUpdated || Date.now()),
          }
          return this.quickStats
        }
      }
    } catch (error) {
      console.warn('Failed to load quick stats from localStorage:', error)
    }

    // Return default stats if none stored
    this.quickStats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      lastUpdated: new Date(),
    }
    return this.quickStats
  }

  /**
   * Update quick statistics
   */
  updateQuickStats(result: 'win' | 'loss' | 'draw'): void {
    const stats = this.getQuickStats()

    stats.totalGames++
    if (result === 'win') stats.wins++
    else if (result === 'loss') stats.losses++
    else stats.draws++

    stats.lastUpdated = new Date()

    this.quickStats = stats

    try {
      localStorage.setItem(STORAGE_KEYS.QUICK_STATS, JSON.stringify(stats))
    } catch (error) {
      console.warn('Failed to save quick stats to localStorage:', error)
    }
  }

  /**
   * Reset quick statistics
   */
  resetQuickStats(): void {
    this.quickStats = {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      lastUpdated: new Date(),
    }

    try {
      localStorage.setItem(STORAGE_KEYS.QUICK_STATS, JSON.stringify(this.quickStats))
    } catch (error) {
      console.warn('Failed to reset quick stats in localStorage:', error)
    }
  }

  /**
   * Export all settings for backup
   */
  exportSettings(): {
    settings: GameSettings
    quickStats: QuickStats
    exportedAt: Date
  } {
    return {
      settings: this.loadSettings(),
      quickStats: this.getQuickStats(),
      exportedAt: new Date(),
    }
  }

  /**
   * Import settings from backup
   */
  importSettings(data: {
    settings?: Partial<GameSettings>
    quickStats?: Partial<QuickStats>
  }): void {
    if (data.settings) {
      this.saveSettings(data.settings)
    }

    if (data.quickStats) {
      const currentStats = this.getQuickStats()
      this.quickStats = {
        ...currentStats,
        ...data.quickStats,
        lastUpdated: new Date(data.quickStats.lastUpdated || Date.now()),
      }

      try {
        localStorage.setItem(STORAGE_KEYS.QUICK_STATS, JSON.stringify(this.quickStats))
      } catch (error) {
        console.warn('Failed to import quick stats to localStorage:', error)
      }
    }
  }

  /**
   * Clear all settings from localStorage
   */
  clearAllSettings(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error)
      }
    })

    this.settings = null
    this.quickStats = null
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    used: number
    total: number
    available: number
    usagePercentage: number
  } {
    let used = 0

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('connect_four_')) {
          used += localStorage.getItem(key)!.length
        }
      })
    } catch (error) {
      console.warn('Failed to calculate localStorage usage:', error)
    }

    // localStorage typically has a 5MB limit
    const total = 5 * 1024 * 1024 // 5MB in bytes
    const available = Math.max(0, total - used)
    const usagePercentage = total > 0 ? (used / total) * 100 : 0

    return { used, total, available, usagePercentage }
  }

  /**
   * Save individual settings for easier access
   */
  private saveIndividualSettings(): void {
    if (!this.settings) return

    try {
      localStorage.setItem(STORAGE_KEYS.THEME, this.settings.theme)
      localStorage.setItem(STORAGE_KEYS.SOUND, this.settings.soundEnabled.toString())
      localStorage.setItem(STORAGE_KEYS.ANIMATIONS, this.settings.animationsEnabled.toString())
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, this.settings.language)
    } catch (error) {
      console.warn('Failed to save individual settings to localStorage:', error)
    }
  }
}

/**
 * Create a new localStorage settings instance
 */
export function createLocalStorageSettings(): LocalStorageSettings {
  return LocalStorageSettings.getInstance()
}

/**
 * Global localStorage settings instance
 */
export const localStorageSettings = LocalStorageSettings.getInstance()