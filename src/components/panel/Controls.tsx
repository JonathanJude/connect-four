/**
 * Game Controls Component
 * New game, difficulty select, reset, and settings controls
 */

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { type ControlsProps } from '@/types/game'
import { type Difficulty } from '@/types/game'

/**
 * Game Controls Component
 *
 * Provides game control buttons including new game, pause/resume,
 * reset, and settings. Also includes difficulty selection.
 */
export const Controls = React.memo(function Controls({
  gameStatus,
  onNewGame,
  onPause,
  onResume,
  onReset,
  onSettings,
  disabled,
}: ControlsProps) {
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')

  // Determine which buttons to show based on game state
  const showPause = gameStatus === 'IN_PROGRESS'
  const showResume = gameStatus === 'PAUSED'
  const showReset = gameStatus !== 'NOT_STARTED'

  // Get button states
  const getButtonState = () => {
    const baseDisabled = disabled

    return {
      newGame: baseDisabled,
      pause: baseDisabled || !showPause,
      resume: baseDisabled || !showResume,
      reset: baseDisabled || !showReset,
      settings: baseDisabled,
    }
  }

  const buttonStates = getButtonState()

  // Handle difficulty change
  const handleDifficultyChange = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty)
    setShowDifficultyMenu(false)
    onNewGame()
  }

  // Render difficulty menu
  const renderDifficultyMenu = () => {
    if (!showDifficultyMenu) return null

    const difficulties: Array<{ value: Difficulty; label: string; description: string }> = [
      { value: 'easy', label: 'Easy', description: 'Perfect for beginners' },
      { value: 'medium', label: 'Medium', description: 'Balanced challenge' },
      { value: 'hard', label: 'Hard', description: 'Expert level AI' },
    ]

    return (
      <div className="absolute top-full left-0 z-50 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <div className="p-4 text-slate-100">
          <h3 className="mb-3 text-lg font-semibold">
            Select Difficulty
          </h3>
          <div className="space-y-2">
            {difficulties.map((diff) => (
              <button
                key={diff.value}
                onClick={() => handleDifficultyChange(diff.value)}
                className={cn(
                  'w-full rounded-xl border border-transparent p-3 text-left transition-colors',
                  'hover:border-slate-700 hover:bg-slate-900',
                  selectedDifficulty === diff.value && 'border-blue-500/40 bg-blue-500/10',
                )}
              >
                <div className="font-medium text-slate-100">
                  {diff.label}
                </div>
                <div className="text-sm text-slate-400">
                  {diff.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Control button component
  const ControlButton = ({
    onClick,
    disabled,
    children,
    variant = 'default',
    ...props
  }: {
    onClick: () => void
    disabled: boolean
    children: React.ReactNode
    variant?: 'default' | 'outline' | 'ghost'
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={cn(
        'px-4 py-2 text-sm font-medium',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        !disabled && 'hover:scale-105 active:scale-95'
      )}
      {...props}
    >
      {children}
    </Button>
  )

  // Get game status text
  const getGameStatusText = () => {
    switch (gameStatus) {
      case 'NOT_STARTED': return 'Ready to Play'
      case 'IN_PROGRESS': return 'Game in Progress'
      case 'PLAYER_WON': return 'You Won!'
      case 'AI_WON': return 'AI Won!'
      case 'DRAW': return "It's a Draw!"
      case 'PAUSED': return 'Game Paused'
      default: return 'Game Status'
    }
  }

  // Container classes
  const containerClasses = cn(
    'flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-5 py-4',
    'bg-slate-900 text-slate-100 border-slate-800 shadow-lg'
  )

  return (
    <div className={containerClasses}>
      {/* New Game Button */}
      <div className="relative">
        <ControlButton
          onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
          disabled={buttonStates.newGame}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Game</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </ControlButton>
        {renderDifficultyMenu()}
      </div>

      {/* Pause Button */}
      {showPause && (
        <ControlButton
          onClick={onPause}
          disabled={buttonStates.pause}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Pause</span>
        </ControlButton>
      )}

      {/* Resume Button */}
      {showResume && (
        <ControlButton
          onClick={onResume}
          disabled={buttonStates.resume}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Resume</span>
        </ControlButton>
      )}

      {/* Reset Button */}
      {showReset && (
        <ControlButton
          onClick={onReset}
          disabled={buttonStates.reset}
          variant="ghost"
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset</span>
        </ControlButton>
      )}

      {/* Settings Button */}
      <ControlButton
        onClick={onSettings}
        disabled={buttonStates.settings}
        variant="ghost"
        className="flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826 2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Settings</span>
      </ControlButton>

      {/* Game Status Display */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getGameStatusText()}
        </span>
      </div>
    </div>
  )
})

// Controls component variants

/**
 * Compact controls for mobile screens
 */
const CompactControls = (props: ControlsProps) => {
  return (
    <div className="scale-90 origin-center">
      <Controls {...props} />
    </div>
  )
}

/**
 * Minimal controls for inline display
 */
const MinimalControls = ({
  onNewGame,
  onSettings,
  disabled,
}: Omit<ControlsProps, 'onPause' | 'onResume' | 'onReset' | 'gameStatus'>) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={onNewGame}
        disabled={disabled}
        variant="outline"
        size="sm"
        className="px-3 py-1"
      >
        New Game
      </Button>
      <Button
        onClick={onSettings}
        disabled={disabled}
        variant="ghost"
        size="sm"
        className="px-3 py-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826 2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Button>
    </div>
  )
}

/**
 * Keyboard shortcuts indicator
 */
const KeyboardShortcuts = () => {
  const shortcuts = [
    { key: 'N', action: 'New Game' },
    { key: 'P', action: 'Pause/Resume' },
    { key: 'R', action: 'Reset' },
    { key: 'S', action: 'Settings' },
    { key: '←→', action: 'Navigate Columns' },
    { key: 'Enter/Space', action: 'Place Disc' },
  ]

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400">
      <div className="font-medium mb-1">Keyboard Shortcuts:</div>
      <div className="grid grid-cols-2 gap-1">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center space-x-1">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
              {shortcut.key}
            </kbd>
            <span>{shortcut.action}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// React hook for controls state management
const useControlsState = (
  _gameStatus: typeof import('@/types/game').GameStatus,
  disabled: boolean = false
) => {
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false)

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return

      // Ignore if typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setShowDifficultyMenu(true)
          }
          break
        case 'p':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            // Handle pause/resume toggle
          }
          break
        case 'r':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            // Handle reset
          }
          break
        case 's':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            // Handle settings
          }
          break
        case 'escape':
          setShowDifficultyMenu(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled])

  return {
    showDifficultyMenu,
    setShowDifficultyMenu,
  }
}

export { CompactControls, MinimalControls, KeyboardShortcuts, useControlsState }