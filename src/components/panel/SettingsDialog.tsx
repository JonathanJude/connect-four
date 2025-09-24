/**
 * Game Settings Dialog Component
 * Modal dialog for game settings with tabs, validation, and real-time preview
 */

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  type GameSettings,
  type Difficulty,
  type DiscColor,
  DEFAULT_GAME_SETTINGS
} from '@/types/game'

/**
 * Settings Dialog Props
 */
export interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  onSave?: () => void
  onReset?: () => void
}

/**
 * Tab types for settings dialog
 */
type SettingsTab = 'game' | 'appearance' | 'advanced'

/**
 * Settings Dialog Component
 *
 * Modal dialog for configuring game settings with tabbed interface,
 * real-time validation, and live preview of changes.
 */
export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onSave,
  onReset,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('game')
  const [tempSettings, setTempSettings] = useState<GameSettings>(settings)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Reset temp settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings)
      setHasChanges(false)
      setValidationErrors([])
    }
  }, [isOpen, settings])

  // Validate settings
  const validateSettings = useCallback((settingsToValidate: Partial<GameSettings>): string[] => {
    const errors: string[] = []

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(settingsToValidate.difficulty || '')) {
      errors.push('Invalid difficulty setting')
    }

    // Validate player disc color
    if (!['red', 'yellow'].includes(settingsToValidate.playerDisc || '')) {
      errors.push('Invalid disc color selection')
    }

    // Validate boolean settings
    const booleanSettings = ['enableAnimations', 'enableSound', 'persistGames', 'saveHistory']
    booleanSettings.forEach(setting => {
      const value = (settingsToValidate as any)[setting]
      if (value !== undefined && typeof value !== 'boolean') {
        errors.push(`${setting} must be true or false`)
      }
    })

    // Validate theme
    if (!['light', 'dark', 'auto'].includes(settingsToValidate.theme || '')) {
      errors.push('Invalid theme setting')
    }

    return errors
  }, [])

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: Partial<GameSettings>) => {
    const updated = { ...tempSettings, ...newSettings }

    // Auto-calculate derived values
    if (newSettings.playerDisc) {
      updated.aiDisc = newSettings.playerDisc === 'red' ? 'yellow' : 'red'
    }

    setTempSettings(updated)

    // Check for changes
    const changes = JSON.stringify(updated) !== JSON.stringify(settings)
    setHasChanges(changes)

    // Validate
    const errors = validateSettings(updated)
    setValidationErrors(errors)
  }, [tempSettings, settings, validateSettings])

  // Save settings
  const handleSave = useCallback(async () => {
    if (validationErrors.length > 0) return

    setIsSaving(true)
    try {
      onSettingsChange(tempSettings)
      setHasChanges(false)
      onSave?.()
      onClose()
    } finally {
      setIsSaving(false)
    }
  }, [tempSettings, validationErrors, onSettingsChange, onSave, onClose])

  // Reset to defaults
  const handleReset = useCallback(() => {
    setTempSettings(DEFAULT_GAME_SETTINGS)
    setHasChanges(true)
    setValidationErrors([])
    onReset?.()
  }, [onReset])

  // Cancel changes
  const handleCancel = useCallback(() => {
    setTempSettings(settings)
    setHasChanges(false)
    setValidationErrors([])
    onClose()
  }, [settings, onClose])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel()
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (hasChanges && validationErrors.length === 0) {
          handleSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleCancel, handleSave, hasChanges, validationErrors])

  // Tab configuration
  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: 'game', label: 'Game', icon: '🎮' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' },
  ]

  // Render game settings tab
  const renderGameSettings = () => (
    <div className="space-y-6">
      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI Difficulty
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => handleSettingsChange({ difficulty })}
              className={cn(
                'p-3 rounded-lg border transition-all',
                'text-center font-medium',
                tempSettings.difficulty === difficulty
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div className="text-lg mb-1">
                {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'}
              </div>
              <div className="capitalize">{difficulty}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {difficulty === 'easy' ? 'Beginner' : difficulty === 'medium' ? 'Balanced' : 'Expert'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Player Disc Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Disc Color
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['red', 'yellow'] as DiscColor[]).map((color) => (
            <button
              key={color}
              onClick={() => handleSettingsChange({ playerDisc: color })}
              className={cn(
                'p-3 rounded-lg border transition-all',
                'flex items-center space-x-3',
                tempSettings.playerDisc === color
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full',
                  color === 'red'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-yellow-400 to-yellow-500'
                )}
              />
              <span className="capitalize font-medium">{color}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Render appearance settings tab
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => handleSettingsChange({ theme })}
              className={cn(
                'p-3 rounded-lg border transition-all',
                'text-center font-medium',
                tempSettings.theme === theme
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div className="text-lg mb-1">
                {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌗'}
              </div>
              <div className="capitalize">{theme}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Animations
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Smooth transitions and visual effects
          </p>
        </div>
        <Button
          onClick={() => handleSettingsChange({ enableAnimations: !tempSettings.enableAnimations })}
          variant={tempSettings.enableAnimations ? 'default' : 'outline'}
          size="sm"
        >
          {tempSettings.enableAnimations ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Sound */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Sound
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Game sounds and audio feedback
          </p>
        </div>
        <Button
          onClick={() => handleSettingsChange({ enableSound: !tempSettings.enableSound })}
          variant={tempSettings.enableSound ? 'default' : 'outline'}
          size="sm"
        >
          {tempSettings.enableSound ? 'On' : 'Off'}
        </Button>
      </div>
    </div>
  )

  // Render advanced settings tab
  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      {/* Game Persistence */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Persist Games
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Save game progress automatically
          </p>
        </div>
        <Button
          onClick={() => handleSettingsChange({ persistGames: !tempSettings.persistGames })}
          variant={tempSettings.persistGames ? 'default' : 'outline'}
          size="sm"
        >
          {tempSettings.persistGames ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Save History */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Save Game History
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Keep record of completed games
          </p>
        </div>
        <Button
          onClick={() => handleSettingsChange({ saveHistory: !tempSettings.saveHistory })}
          variant={tempSettings.saveHistory ? 'default' : 'outline'}
          size="sm"
        >
          {tempSettings.saveHistory ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Storage Info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Storage Information
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Settings stored in localStorage</div>
          <div>Game progress saved in IndexedDB</div>
          <div>Total storage used: ~2KB</div>
        </div>
      </div>
    </div>
  )

  // Dialog overlay and container
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
          'w-full max-w-md max-h-[90vh] flex flex-col',
          'border border-gray-200 dark:border-gray-700'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Game Settings
          </h2>
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                'flex items-center justify-center space-x-2',
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'game' && renderGameSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'advanced' && renderAdvancedSettings()}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Please fix the following errors:
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Changes Indicator */}
          {hasChanges && validationErrors.length === 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                You have unsaved changes
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              Reset to Defaults
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleCancel}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || validationErrors.length > 0 || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Settings button component for triggering the dialog
 */
export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="p-2"
      title="Game Settings"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </Button>
  )
}

/**
 * Hook for managing settings dialog state
 */
export function useSettingsDialog(initialSettings: GameSettings) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSettings, setCurrentSettings] = useState(initialSettings)

  const openDialog = useCallback(() => setIsOpen(true), [])
  const closeDialog = useCallback(() => setIsOpen(false), [])

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setCurrentSettings(newSettings)
  }, [])

  return {
    isOpen,
    openDialog,
    closeDialog,
    currentSettings,
    onSettingsChange: handleSettingsChange,
  }
}