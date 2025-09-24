/**
 * Replay Controls Component
 * Provides comprehensive playback controls for game replays
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  type ReplayControlsProps,
  type ReplaySpeed
} from '@/types/replay'

/**
 * Play/Pause Button Component
 */
function PlayPauseButton({
  isPlaying,
  onToggle,
  disabled = false
}: {
  isPlaying: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <Button
      onClick={onToggle}
      disabled={disabled}
      variant="default"
      size="sm"
      className="w-12 h-12 rounded-full"
    >
      {isPlaying ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </Button>
  )
}

/**
 * Step Controls Component
 */
function StepControls({
  onPrevious,
  onNext,
  onFirst,
  onLast,
  currentMove,
  totalMoves,
  disabled = false
}: {
  onPrevious: () => void
  onNext: () => void
  onFirst: () => void
  onLast: () => void
  currentMove: number
  totalMoves: number
  disabled?: boolean
}) {
  return (
    <div className="flex items-center space-x-1">
      <Button
        onClick={onFirst}
        disabled={disabled || currentMove === 0}
        variant="outline"
        size="sm"
        title="First Move"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </Button>
      <Button
        onClick={onPrevious}
        disabled={disabled || currentMove === 0}
        variant="outline"
        size="sm"
        title="Previous Move"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>
      <Button
        onClick={onNext}
        disabled={disabled || currentMove >= totalMoves}
        variant="outline"
        size="sm"
        title="Next Move"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
      <Button
        onClick={onLast}
        disabled={disabled || currentMove >= totalMoves}
        variant="outline"
        size="sm"
        title="Last Move"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  )
}

/**
 * Speed Control Component
 */
function SpeedControl({
  currentSpeed,
  onSpeedChange,
  disabled = false
}: {
  currentSpeed: ReplaySpeed
  onSpeedChange: (speed: ReplaySpeed) => void
  disabled?: boolean
}) {
  const speeds: ReplaySpeed[] = ['0.5x', '1x', '1.5x', '2x', '4x']

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {speeds.map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            disabled={disabled}
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium transition-colors',
              currentSpeed === speed
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            {speed}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Progress Bar Component
 */
function ProgressBar({
  currentMove,
  totalMoves,
  onSeek,
  disabled = false
}: {
  currentMove: number
  totalMoves: number
  onSeek: (move: number) => void
  disabled?: boolean
}) {
  const progress = totalMoves > 0 ? (currentMove / totalMoves) * 100 : 0

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Interactive seek bar */}
      <input
        type="range"
        min="0"
        max={totalMoves}
        value={currentMove}
        onChange={(e) => onSeek(parseInt(e.target.value))}
        disabled={disabled}
        className={cn(
          'absolute inset-0 w-full h-2 opacity-0 cursor-pointer',
          disabled && 'cursor-not-allowed'
        )}
      />

      {/* Progress labels */}
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Move {currentMove}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {totalMoves} moves
        </span>
      </div>
    </div>
  )
}

/**
 * Time Display Component
 */
function TimeDisplay({
  currentMove,
  totalMoves,
  speed
}: {
  currentMove: number
  totalMoves: number
  speed: ReplaySpeed
}) {
  const speedMultiplier = {
    '0.5x': 2,
    '1x': 1,
    '1.5x': 0.67,
    '2x': 0.5,
    '4x': 0.25
  }[speed]

  const baseDelay = 1000 // Base delay per move in ms
  const currentDelay = baseDelay * speedMultiplier

  const currentTime = currentMove * currentDelay
  const totalTime = totalMoves * currentDelay
  const remainingTime = (totalMoves - currentMove) * currentDelay

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
      <span>{formatTime(currentTime)}</span>
      <span className="text-xs">- {formatTime(remainingTime)}</span>
      <span>{formatTime(totalTime)}</span>
    </div>
  )
}

/**
 * Keyboard Shortcuts Component
 */
function KeyboardShortcuts({
  onPlayPause,
  onPrevious,
  onNext,
  onSpeedUp,
  onSpeedDown
}: {
  onPlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onSpeedUp: () => void
  onSpeedDown: () => void
}): JSX.Element {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key.toLowerCase()) {
        case ' ':
        case 'k':
          event.preventDefault()
          onPlayPause()
          break
        case 'arrowleft':
          event.preventDefault()
          onPrevious()
          break
        case 'arrowright':
          event.preventDefault()
          onNext()
          break
        case 'arrowup':
          event.preventDefault()
          onSpeedUp()
          break
        case 'arrowdown':
          event.preventDefault()
          onSpeedDown()
          break
        case 'home':
          event.preventDefault()
          onPrevious() // Go to first move
          break
        case 'end':
          event.preventDefault()
          onNext() // Go to last move
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPlayPause, onPrevious, onNext, onSpeedUp, onSpeedDown])

  return null
}

/**
 * Main Replay Controls Component
 */
export function ReplayControls({
  session,
  showSpeed = true,
  showSeek = true,
  showStep = true,
  className,
  onControlUsed
}: ReplayControlsProps) {
  const [localSession, setLocalSession] = useState(session)

  // Update local session when prop changes
  useEffect(() => {
    setLocalSession(session)
  }, [session])

  // Update session state periodically for smooth playback
  useEffect(() => {
    const interval = setInterval(() => {
      if (localSession.state.isPlaying) {
        // Force re-render by updating state reference
        setLocalSession({ ...localSession })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [localSession])

  const handleControlUsed = useCallback((action: string) => {
    if (onControlUsed) {
      onControlUsed(action)
    }
  }, [onControlUsed])

  // Control handlers
  const handlePlayPause = useCallback(() => {
    if (localSession.state.isPlaying) {
      localSession.controls.pause()
    } else {
      localSession.controls.play()
    }
    setLocalSession({ ...localSession })
    handleControlUsed('play_pause')
  }, [localSession, handleControlUsed])

  const handleStop = useCallback(() => {
    localSession.controls.stop()
    setLocalSession({ ...localSession })
    handleControlUsed('stop')
  }, [localSession, handleControlUsed])

  const handleSeek = useCallback((move: number) => {
    localSession.controls.seek(move)
    setLocalSession({ ...localSession })
    handleControlUsed('seek')
  }, [localSession, handleControlUsed])

  const handlePrevious = useCallback(() => {
    localSession.controls.previous()
    setLocalSession({ ...localSession })
    handleControlUsed('previous')
  }, [localSession, handleControlUsed])

  const handleNext = useCallback(() => {
    localSession.controls.next()
    setLocalSession({ ...localSession })
    handleControlUsed('next')
  }, [localSession, handleControlUsed])

  const handleFirst = useCallback(() => {
    localSession.controls.seek(0)
    setLocalSession({ ...localSession })
    handleControlUsed('first')
  }, [localSession, handleControlUsed])

  const handleLast = useCallback(() => {
    const totalMoves = localSession.metadata.gameData.moves.length
    localSession.controls.seek(totalMoves)
    setLocalSession({ ...localSession })
    handleControlUsed('last')
  }, [localSession, handleControlUsed])

  const handleSpeedChange = useCallback((speed: ReplaySpeed) => {
    localSession.controls.setSpeed(speed)
    setLocalSession({ ...localSession })
    handleControlUsed('speed_change')
  }, [localSession, handleControlUsed])

  const handleSpeedUp = useCallback(() => {
    const speeds: ReplaySpeed[] = ['0.5x', '1x', '1.5x', '2x', '4x']
    const currentIndex = speeds.indexOf(localSession.state.speed || '1x')
    if (currentIndex < speeds.length - 1) {
      const newSpeed = speeds[currentIndex + 1]
      if (newSpeed) handleSpeedChange(newSpeed)
    }
  }, [localSession.state.speed, handleSpeedChange])

  const handleSpeedDown = useCallback(() => {
    const speeds: ReplaySpeed[] = ['0.5x', '1x', '1.5x', '2x', '4x']
    const currentIndex = speeds.indexOf(localSession.state.speed || '1x')
    if (currentIndex > 0) {
      const newSpeed = speeds[currentIndex - 1]
      if (newSpeed) handleSpeedChange(newSpeed)
    }
  }, [localSession.state.speed, handleSpeedChange])

  const totalMoves = localSession.metadata.gameData.moves.length
  const isComplete = localSession.state.isComplete

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4",
      className
    )}>
      {/* Keyboard shortcuts */}
      <KeyboardShortcuts
        onPlayPause={handlePlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSpeedUp={handleSpeedUp}
        onSpeedDown={handleSpeedDown}
      />

      <div className="space-y-4">
        {/* Main controls row */}
        <div className="flex items-center justify-between">
          {/* Play/Pause and Stop */}
          <div className="flex items-center space-x-2">
            <PlayPauseButton
              isPlaying={localSession.state.isPlaying}
              onToggle={handlePlayPause}
              disabled={isComplete}
            />
            <Button
              onClick={handleStop}
              variant="outline"
              size="sm"
              title="Stop and Reset"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </Button>
          </div>

          {/* Speed control */}
          {showSpeed && (
            <SpeedControl
              currentSpeed={localSession.state.speed}
              onSpeedChange={handleSpeedChange}
            />
          )}

          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              localSession.state.isPlaying ? 'bg-green-500' : 'bg-gray-400'
            )} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isComplete ? 'Complete' : localSession.state.isPlaying ? 'Playing' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {showSeek && (
          <ProgressBar
            currentMove={localSession.state.currentMove}
            totalMoves={totalMoves}
            onSeek={handleSeek}
          />
        )}

        {/* Time display */}
        <TimeDisplay
          currentMove={localSession.state.currentMove}
          totalMoves={totalMoves}
          speed={localSession.state.speed}
        />

        {/* Step controls */}
        {showStep && (
          <div className="flex items-center justify-between">
            <StepControls
              onPrevious={handlePrevious}
              onNext={handleNext}
              onFirst={handleFirst}
              onLast={handleLast}
              currentMove={localSession.state.currentMove}
              totalMoves={totalMoves}
            />

            {/* Move counter */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Move {localSession.state.currentMove} of {totalMoves}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
          <div className="font-medium mb-1">Keyboard Shortcuts:</div>
          <div className="grid grid-cols-2 gap-1">
            <div>Space/K: Play/Pause</div>
            <div>←/→: Previous/Next</div>
            <div>↑/↓: Speed Up/Down</div>
            <div>Home/End: First/Last</div>
          </div>
        </div>
      </div>
    </div>
  )
}