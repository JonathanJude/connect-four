/**
 * Replay Viewer Component
 * Complete replay interface with board visualization, controls, and game information
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Board } from '@/components/board/Board'
import { ReplayControls } from '@/components/history/ReplayControls'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  type ReplaySession,
  type ReplayViewerProps
} from '@/types/replay'

/**
 * Game Info Panel Component
 * Displays detailed game information during replay
 */
function GameInfoPanel({
  session,
  showExtendedInfo = true
}: {
  session: ReplaySession
  showExtendedInfo?: boolean
}) {
  const game = session.metadata.gameData
  const totalMoves = game.moves.length
  const currentMove = session.state.currentMove
  const progress = totalMoves > 0 ? (currentMove / totalMoves) * 100 : 0
  const remainingMoves = totalMoves - currentMove

  const stats = {
    progress,
    speed: session.state.speed,
    remainingMoves,
    estimatedTime: remainingMoves * 2000 // Estimate 2 seconds per move
  }

  const getResultDisplay = () => {
    switch (game.winner) {
      case 'HUMAN':
        return { text: 'You Won!', icon: '🎉', color: 'text-green-600 dark:text-green-400' }
      case 'AI':
        return { text: 'AI Won', icon: '🤖', color: 'text-red-600 dark:text-red-400' }
      case 'DRAW':
        return { text: 'Draw', icon: '🤝', color: 'text-yellow-600 dark:text-yellow-400' }
      default:
        return { text: 'In Progress', icon: '⏳', color: 'text-blue-600 dark:text-blue-400' }
    }
  }

  const result = getResultDisplay()

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Game Information
      </h3>

      {/* Result */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Result</div>
        <div className={cn('font-medium flex items-center space-x-1', result.color)}>
          <span>{result.icon}</span>
          <span>{result.text}</span>
        </div>
      </div>

      {/* Basic Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Difficulty</div>
          <div className="font-medium capitalize">{game.difficulty}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Moves</div>
          <div className="font-medium">{game.moves.length}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
          <div className="font-medium">{formatDuration(game.duration)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
          <div className="font-medium capitalize">{game.status.replace('_', ' ')}</div>
        </div>
      </div>

      {/* Player Colors */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Players</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-4 h-4 rounded-full',
              game.playerDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
            )} />
            <span className="text-sm font-medium">You ({game.playerDisc})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-4 h-4 rounded-full',
              game.aiDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
            )} />
            <span className="text-sm font-medium">AI ({game.aiDisc})</span>
          </div>
        </div>
      </div>

      {/* Extended Info */}
      {showExtendedInfo && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Date Played</div>
                <div className="font-medium">{formatDate(game.createdAt)}</div>
              </div>
              {game.completedAt && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="font-medium">{formatDate(game.completedAt)}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Game ID</div>
                <div className="font-medium text-xs font-mono">{game.id}</div>
              </div>
            </div>
          </div>

          {/* Replay Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Replay Progress</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Progress</div>
                <div className="font-medium">{stats.progress.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Speed</div>
                <div className="font-medium">{stats.speed}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Moves Left</div>
                <div className="font-medium">{stats.remainingMoves}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Est. Time</div>
                <div className="font-medium">{Math.round(stats.estimatedTime / 1000)}s</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Move List Component
 * Shows the list of moves with navigation
 */
function MoveList({
  session,
  onMoveSelect,
  showTimestamps = true
}: {
  session: ReplaySession
  onMoveSelect: (moveIndex: number) => void
  showTimestamps?: boolean
}) {
  const moves = session.metadata.gameData.moves
  const currentMove = session.state.currentMove

  const formatTimestamp = (timestamp: number) => {
    const seconds = Math.floor(timestamp / 1000)
    return `${seconds}s`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Move History
      </h3>
      <div className="space-y-1">
        {/* Initial state */}
        <button
          onClick={() => onMoveSelect(0)}
          className={cn(
            'w-full text-left p-2 rounded-lg transition-colors',
            'flex items-center justify-between',
            currentMove === 0
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Start</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Empty board</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">#0</div>
        </button>

        {/* Moves */}
        {moves.map((move: any, index: number) => {
          const moveNumber = index + 1
          const isCurrentMove = currentMove === moveNumber
          const isPastMove = currentMove > moveNumber

          return (
            <button
              key={index}
              onClick={() => onMoveSelect(moveNumber)}
              className={cn(
                'w-full text-left p-2 rounded-lg transition-colors',
                'flex items-center justify-between space-x-2',
                isCurrentMove
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                  : isPastMove
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div className="flex items-center space-x-2 flex-1">
                <div className={cn(
                  'w-4 h-4 rounded-full flex-shrink-0',
                  move.player === 'HUMAN'
                    ? session.metadata.gameData.playerDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                    : session.metadata.gameData.aiDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                )} />
                <span className="text-sm font-medium">
                  {move.player === 'HUMAN' ? 'You' : 'AI'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Column {move.position.col + 1}
                </span>
                {showTimestamps && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(move.timestamp)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                #{moveNumber}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Main Replay Viewer Component
 */
export function ReplayViewer({
  session,
  interactive = true,
  showControls = true,
  showMoveList = true,
  showGameInfo = true,
  className,
  onComplete,
  onMoveChange,
  onPlaybackChange
}: ReplayViewerProps) {
  const [localSession, setLocalSession] = useState(session)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Update local session when prop changes
  useEffect(() => {
    setLocalSession(session)
  }, [session])

  // Update session state periodically for smooth playback
  useEffect(() => {
    const interval = setInterval(() => {
      if (localSession.state.isPlaying) {
        const newState = localSession.controls.getState()

        // Check if replay completed
        if (newState.isComplete && !localSession.state.isComplete) {
          if (onComplete) {
            onComplete()
          }
        }

        // Force re-render by updating state reference
        setLocalSession({ ...localSession, state: newState })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [localSession, onComplete])

  // Handle playback state changes
  useEffect(() => {
    if (onPlaybackChange) {
      onPlaybackChange(localSession.state.isPlaying)
    }
  }, [localSession.state.isPlaying, onPlaybackChange])

  // Handle move changes
  useEffect(() => {
    if (onMoveChange) {
      onMoveChange(localSession.state.currentMove)
    }
  }, [localSession.state.currentMove, onMoveChange])

  // Keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'f' && event.ctrlKey) {
        event.preventDefault()
        setIsFullscreen(!isFullscreen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Event handlers
  const handleControlUsed = useCallback((action: string) => {
    // Log control usage for analytics if needed
    console.log(`Replay control used: ${action}`)
  }, [])

  const handleMoveSelect = useCallback((moveIndex: number) => {
    localSession.controls.seek(moveIndex)
    setLocalSession({ ...localSession })
  }, [localSession])

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false)
  }, [])

  // Prepare board props
  const boardProps = {
    board: localSession.state.boardState,
    lastMove: localSession.state.lastMove,
    winningLine: localSession.state.winningLine,
    onColumnClick: () => {}, // Read-only during replay
    onColumnHover: () => {},
    onColumnLeave: () => {},
    disabled: true,
    showHoverPreview: false,
  }

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Fullscreen header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Connect Four Replay</h1>
          <Button
            onClick={handleExitFullscreen}
            variant="outline"
            size="sm"
            className="text-white border-gray-600 hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit Fullscreen
          </Button>
        </div>

        {/* Fullscreen content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
              <div className="flex justify-center mb-8">
                <Board {...boardProps} />
              </div>

              {showControls && (
                <ReplayControls
                  session={localSession}
                  onControlUsed={handleControlUsed}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal viewer layout
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with fullscreen option */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Game Replay
        </h2>
        {interactive && (
          <Button
            onClick={() => setIsFullscreen(true)}
            variant="outline"
            size="sm"
            title="Fullscreen (Ctrl+F)"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Fullscreen
          </Button>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Board and Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Board */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-center">
              <Board {...boardProps} />
            </div>
          </div>

          {/* Replay Controls */}
          {showControls && (
            <ReplayControls
              session={localSession}
              onControlUsed={handleControlUsed}
            />
          )}
        </div>

        {/* Right panel - Info and Move List */}
        <div className="space-y-6">
          {/* Game Info */}
          {showGameInfo && (
            <GameInfoPanel session={localSession} />
          )}

          {/* Move List */}
          {showMoveList && (
            <MoveList
              session={localSession}
              onMoveSelect={handleMoveSelect}
            />
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <div className={cn(
          'w-2 h-2 rounded-full',
          localSession.state.isPlaying ? 'bg-green-500' : 'bg-gray-400'
        )} />
        <span>
          {localSession.state.isComplete ? 'Replay Complete' :
           localSession.state.isPlaying ? 'Playing' : 'Paused'}
        </span>
        <span>•</span>
        <span>Move {localSession.state.currentMove} of {localSession.metadata.gameData.moves.length}</span>
        <span>•</span>
        <span>Speed: {localSession.state.speed}</span>
      </div>
    </div>
  )
}