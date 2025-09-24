/**
 * Turn Indicator Component
 * Current player display with AI thinking state and visual feedback
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { type TurnIndicatorProps, type GameStatus } from '@/types/game'

/**
 * Turn Indicator Component
 *
 * Shows whose turn it is, AI thinking state, and game status.
 * Provides visual feedback and accessibility information.
 */
export const TurnIndicator = React.memo(function TurnIndicator({
  currentPlayer,
  playerDisc,
  aiDisc,
  isAIThinking,
  gameStatus,
}: TurnIndicatorProps) {
  // Determine display text and colors based on game state
  const getTurnDisplay = () => {
    const base = {
      text: 'Game Status',
      subtext: 'Unknown state',
      player: null as 'HUMAN' | 'AI' | null,
      accentClass: 'border-slate-800 bg-slate-900',
      textClass: 'text-slate-100',
      subtextClass: 'text-slate-400',
      iconColor: 'text-slate-400',
    }

    switch (gameStatus) {
      case 'NOT_STARTED':
        return {
          ...base,
          text: 'Ready to Play',
          subtext: 'Choose your difficulty and start',
          accentClass: 'border-slate-800 bg-slate-900',
        }

      case 'IN_PROGRESS':
        if (isAIThinking) {
          return {
            ...base,
            text: 'AI is Thinking...',
            subtext: 'Analyzing the best move',
            player: 'AI',
            accentClass: 'border-blue-500/40 bg-blue-500/10 ring-1 ring-inset ring-blue-500/30',
            textClass: 'text-blue-100',
            subtextClass: 'text-blue-200',
            iconColor: 'text-blue-200',
          }
        } else {
          const isPlayerTurn = currentPlayer === 'HUMAN'
          return {
            ...base,
            text: isPlayerTurn ? 'Your Turn' : "AI's Turn",
            subtext: isPlayerTurn ? 'Click a column to place your disc' : 'AI is calculating move',
            player: currentPlayer,
            accentClass: isPlayerTurn
              ? 'border-green-500/40 bg-green-500/10 ring-1 ring-inset ring-green-500/30'
              : 'border-orange-500/40 bg-orange-500/10 ring-1 ring-inset ring-orange-500/30',
            textClass: isPlayerTurn ? 'text-green-100' : 'text-orange-100',
            subtextClass: isPlayerTurn ? 'text-green-200' : 'text-orange-200',
            iconColor: isPlayerTurn ? 'text-green-200' : 'text-orange-200',
          }
        }

      case 'PLAYER_WON':
        return {
          ...base,
          text: 'You Won!',
          subtext: 'Congratulations!',
          player: 'HUMAN',
          accentClass: 'border-green-500/50 bg-green-500/15 ring-1 ring-inset ring-green-500/30',
          textClass: 'text-green-100',
          subtextClass: 'text-green-200',
          iconColor: 'text-green-300',
        }

      case 'AI_WON':
        return {
          ...base,
          text: 'AI Won!',
          subtext: 'Better luck next time!',
          player: 'AI',
          accentClass: 'border-red-500/50 bg-red-500/15 ring-1 ring-inset ring-red-500/30',
          textClass: 'text-red-100',
          subtextClass: 'text-red-200',
          iconColor: 'text-red-300',
        }

      case 'DRAW':
        return {
          ...base,
          text: "It's a Draw!",
          subtext: 'Great game!',
          player: null,
          accentClass: 'border-yellow-400/50 bg-yellow-400/10 ring-1 ring-inset ring-yellow-400/30',
          textClass: 'text-yellow-100',
          subtextClass: 'text-yellow-200',
          iconColor: 'text-yellow-300',
        }

      case 'PAUSED':
        return {
          ...base,
          text: 'Game Paused',
          subtext: 'Click resume to continue',
          player: null,
          accentClass: 'border-slate-700 bg-slate-900/95',
        }

      default:
        return base
    }
  }

  const display = getTurnDisplay()

  // Get disc color for display
  const getDiscColor = (player: 'HUMAN' | 'AI' | null) => {
    if (player === 'HUMAN') return playerDisc
    if (player === 'AI') return aiDisc
    return null
  }

  const discColor = getDiscColor(display.player as 'HUMAN' | 'AI' | null)

  // Container classes
  const containerClasses = cn(
    'flex items-center justify-between gap-4 rounded-2xl border px-5 py-4',
    'bg-slate-900 text-slate-100 border-slate-800 shadow-lg transition-all duration-300',
    display.accentClass,
  )

  // Disc indicator classes
  const discClasses = cn(
    'w-8 h-8 rounded-full shadow-md transition-all duration-300',
    discColor === 'red' && 'bg-gradient-to-br from-red-500 to-red-600',
    discColor === 'yellow' && 'bg-gradient-to-br from-yellow-400 to-yellow-500',
    !discColor && 'bg-slate-700',
  )

  // AI thinking animation
  const renderAIThinkingAnimation = () => {
    if (!isAIThinking) return null

    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 animate-bounce rounded-full bg-blue-300',
              i === 0 && 'animation-delay-0',
              i === 1 && 'animation-delay-150',
              i === 2 && 'animation-delay-300'
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    )
  }

  // Status icon based on game state
  const renderStatusIcon = () => {
    switch (gameStatus) {
      case 'PLAYER_WON':
        return (
          <div className={cn(display.iconColor)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )

      case 'AI_WON':
        return (
          <div className={cn(display.iconColor)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )

      case 'DRAW':
        return (
          <div className={cn(display.iconColor)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )

      case 'PAUSED':
        return (
          <div className={cn(display.iconColor)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={containerClasses}>
      {/* Status icon */}
      <div className="flex-shrink-0">
        {renderStatusIcon()}
      </div>

      {/* Disc indicator */}
      {discColor && (
        <div className="flex-shrink-0">
          <div className={discClasses} />
        </div>
      )}

      {/* Text content */}
      <div className="flex-grow">
        <div className={cn('text-lg font-semibold', display.textClass)}>
          {display.text}
        </div>
        <div className={cn('text-sm', display.subtextClass)}>
          {display.subtext}
        </div>
      </div>

      {/* AI thinking animation */}
      {renderAIThinkingAnimation()}

      {/* Accessibility live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {display.text}. {display.subtext}
        {isAIThinking && ' AI is currently thinking.'}
      </div>
    </div>
  )
})

// Turn indicator variants

/**
 * Compact turn indicator for smaller screens
 */
const CompactTurnIndicator = (props: TurnIndicatorProps) => {
  return (
    <div className="scale-90 origin-left">
      <TurnIndicator {...props} />
    </div>
  )
}

/**
 * Minimal turn indicator for inline display
 */
const MinimalTurnIndicator = ({
  currentPlayer,
  playerDisc,
  aiDisc,
  isAIThinking,
  gameStatus,
}: TurnIndicatorProps) => {
  const getPlayerDisplay = () => {
    if (gameStatus === 'PLAYER_WON') return 'You Win!'
    if (gameStatus === 'AI_WON') return 'AI Wins!'
    if (gameStatus === 'DRAW') return 'Draw!'
    if (gameStatus === 'PAUSED') return 'Paused'
    if (isAIThinking) return 'AI Thinking...'
    if (currentPlayer === 'HUMAN') return 'Your Turn'
    return "AI's Turn"
  }

  const getDiscColor = () => {
    if (gameStatus === 'PLAYER_WON') return playerDisc
    if (gameStatus === 'AI_WON') return aiDisc
    if (currentPlayer === 'HUMAN' && gameStatus === 'IN_PROGRESS') return playerDisc
    if (currentPlayer === 'AI' && gameStatus === 'IN_PROGRESS') return aiDisc
    return null
  }

  const discColor = getDiscColor()

  return (
    <div className="flex items-center space-x-2">
      {discColor && (
        <div
          className={cn(
            'w-4 h-4 rounded-full',
            discColor === 'red' && 'bg-red-500',
            discColor === 'yellow' && 'bg-yellow-400'
          )}
        />
      )}
      <span className="text-sm font-medium text-slate-200">
        {getPlayerDisplay()}
      </span>
      {isAIThinking && (
        <div className="flex space-x-1">
          <div className="h-1 w-1 animate-pulse rounded-full bg-blue-300" />
          <div className="h-1 w-1 animate-pulse rounded-full bg-blue-300" style={{ animationDelay: '200ms' }} />
          <div className="h-1 w-1 animate-pulse rounded-full bg-blue-300" style={{ animationDelay: '400ms' }} />
        </div>
      )}
    </div>
  )
}

// React hook for turn indicator state
const useTurnIndicator = (
  currentPlayer: 'HUMAN' | 'AI',
  gameStatus: GameStatus,
  _isAIThinking: boolean = false
) => {
  const [previousTurn, setPreviousTurn] = React.useState(currentPlayer)
  const [turnStartTime, setTurnStartTime] = React.useState(Date.now())

  // Track turn changes
  React.useEffect(() => {
    if (currentPlayer !== previousTurn && gameStatus === 'IN_PROGRESS') {
      setPreviousTurn(currentPlayer)
      setTurnStartTime(Date.now())
    }
  }, [currentPlayer, previousTurn, gameStatus])

  // Calculate turn duration
  const getTurnDuration = () => {
    if (gameStatus !== 'IN_PROGRESS') return 0
    return Date.now() - turnStartTime
  }

  // Get urgency level based on turn duration
  const getUrgencyLevel = () => {
    const duration = getTurnDuration()
    if (duration < 5000) return 'normal'
    if (duration < 15000) return 'thinking'
    return 'long-thinking'
  }

  return {
    previousTurn,
    turnDuration: getTurnDuration(),
    urgencyLevel: getUrgencyLevel(),
    formattedDuration: formatDuration(getTurnDuration()),
  }
}

// Utility function

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

export { CompactTurnIndicator, MinimalTurnIndicator, useTurnIndicator, formatDuration }