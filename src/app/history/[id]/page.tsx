/**
 * Game Replay Viewer Page
 * Interactive replay of completed games with playback controls and board visualization
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Board } from '@/components/board/Board'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/theme/ThemeProvider'
import { cn } from '@/lib/utils'
import { type Board as BoardType, type Position, type DiscColor } from '@/types/game'
import type { PlayerInfo } from '@/types/game'
import { historyService } from '@/lib/history/service'

/**
 * Replay Move Interface
 */
interface ReplayMove {
  player: 'HUMAN' | 'AI' | 'PLAYER_1' | 'PLAYER_2'
  position: Position
  timestamp: number
  boardState: BoardType
}

/**
 * Replay Game Interface
 */
interface ReplayGame {
  id: string
  playerDisc: DiscColor
  aiDisc?: DiscColor
  difficulty?: string
  winner: 'HUMAN' | 'AI' | 'PLAYER_1' | 'PLAYER_2' | 'DRAW'
  moves: ReplayMove[]
  createdAt: Date
  duration: number
  gameMode?: 'SINGLE_PLAYER' | 'MULTIPLAYER'
  players?: PlayerInfo[]
  metadata?: any
}

/**
 * Get player display name for replay
 */
function getPlayerDisplayName(player: string, game: ReplayGame): string {
  if (player === 'HUMAN') return 'You'
  if (player === 'AI') return 'AI'
  if (player === 'PLAYER_1' || player === 'PLAYER_2') {
    const playerInfo = game.players?.find(p => p.type === player)
    return playerInfo?.name || player.replace('_', ' ')
  }
  return player
}

/**
 * Get player disc color for replay
 */
function getPlayerDiscColor(player: string, game: ReplayGame): DiscColor {
  if (player === 'HUMAN') return game.playerDisc
  if (player === 'AI') return game.aiDisc || 'yellow'
  if (player === 'PLAYER_1' || player === 'PLAYER_2') {
    const playerInfo = game.players?.find(p => p.type === player)
    return playerInfo?.discColor || (player === 'PLAYER_1' ? 'red' : 'yellow')
  }
  return game.playerDisc
}

/**
 * Convert history service data to replay format
 */
function convertToReplayFormat(historyData: any): ReplayGame {
  return {
    id: historyData.id,
    playerDisc: historyData.playerDisc,
    aiDisc: historyData.aiDisc,
    difficulty: historyData.difficulty,
    winner: historyData.winner,
    moves: historyData.moves.map((move: any) => ({
      player: move.player,
      position: {
        row: move.position.row,
        column: move.position.col
      },
      timestamp: move.timestamp,
      boardState: move.boardState || {
        rows: 6,
        columns: 7,
        grid: Array(6).fill(null).map(() => Array(7).fill(null))
      }
    })),
    createdAt: new Date(historyData.createdAt),
    duration: historyData.duration,
    gameMode: historyData.metadata?.gameMode,
    players: historyData.metadata?.players,
    metadata: historyData.metadata,
  }
}

/**
 * Playback Controls Component
 */
function PlaybackControls({
  currentMove,
  totalMoves,
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onSpeedChange,
}: {
  currentMove: number
  totalMoves: number
  isPlaying: boolean
  playbackSpeed: number
  onPlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onSeek: (move: number) => void
  onSpeedChange: (speed: number) => void
}) {
  const progress = totalMoves > 0 ? (currentMove / totalMoves) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Move {currentMove} of {totalMoves}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onPrevious}
            disabled={currentMove === 0}
            variant="outline"
            size="sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button
            onClick={onPlayPause}
            variant="default"
            size="sm"
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </Button>
          <Button
            onClick={onNext}
            disabled={currentMove >= totalMoves}
            variant="outline"
            size="sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max={totalMoves}
            value={currentMove}
            onChange={(e) => onSeek(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Speed Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatTime(currentMove * playbackSpeed * 1000)} / {formatTime(totalMoves * playbackSpeed * 1000)}
        </div>
      </div>
    </div>
  )
}

/**
 * Move List Component
 */
function MoveList({
  moves,
  currentMove,
  onMoveSelect,
  game,
}: {
  moves: ReplayMove[]
  currentMove: number
  onMoveSelect: (moveIndex: number) => void
  game: ReplayGame
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Move History
      </h3>
      <div className="space-y-2">
        {moves.map((move, index) => (
          <button
            key={index}
            onClick={() => onMoveSelect(index)}
            className={cn(
              'w-full text-left p-2 rounded-lg transition-colors',
              'flex items-center justify-between space-x-2',
              index <= currentMove
                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-4 h-4 rounded-full',
                getPlayerDiscColor(move.player, game) === 'red' ? 'bg-red-500' : 'bg-yellow-400'
              )} />
              <span className="text-sm font-medium">
                {getPlayerDisplayName(move.player, game)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Column {move.position.column + 1}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              #{index + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Game Info Component
 */
function GameInfo({ game }: { game: ReplayGame }) {
  const getResultDisplay = () => {
    if (game.winner === 'DRAW') {
      return { text: 'Draw', icon: '🤝', color: 'text-yellow-600 dark:text-yellow-400' }
    }

    if (game.gameMode === 'MULTIPLAYER' && (game.winner === 'PLAYER_1' || game.winner === 'PLAYER_2')) {
      const winnerName = getPlayerDisplayName(game.winner, game)
      return { text: `${winnerName} Won!`, icon: '🎉', color: 'text-green-600 dark:text-green-400' }
    }

    switch (game.winner) {
      case 'HUMAN':
        return { text: 'You Won!', icon: '🎉', color: 'text-green-600 dark:text-green-400' }
      case 'AI':
        return { text: 'AI Won', icon: '🤖', color: 'text-red-600 dark:text-red-400' }
      default:
        return { text: 'Unknown', icon: '❓', color: 'text-gray-600 dark:text-gray-400' }
    }
  }

  const result = getResultDisplay()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Game Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Game Mode</div>
          <div className="font-medium capitalize">
            {game.gameMode === 'MULTIPLAYER' ? 'Multiplayer' : 'Single Player'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Result</div>
          <div className={cn('font-medium flex items-center space-x-1', result.color)}>
            <span>{result.icon}</span>
            <span>{result.text}</span>
          </div>
        </div>
        {game.gameMode === 'SINGLE_PLAYER' && (
          <>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Difficulty</div>
              <div className="font-medium capitalize">{game.difficulty || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">AI Color</div>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-4 h-4 rounded-full',
                  game.aiDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                )} />
                <span className="font-medium capitalize">{game.aiDisc || 'yellow'}</span>
              </div>
            </div>
          </>
        )}
        {game.gameMode === 'MULTIPLAYER' && game.players && (
          <>
            {game.players.map((player, index) => (
              <div key={player.type}>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Player {index + 1}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full',
                    player.discColor === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                  )} />
                  <span className="font-medium">{player.name}</span>
                </div>
              </div>
            ))}
          </>
        )}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Moves</div>
          <div className="font-medium">{game.moves.length}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
          <div className="font-medium">{formatDuration(game.duration)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Date Played</div>
          <div className="font-medium">
            {new Intl.DateTimeFormat('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(game.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Replay Page Component
 */
export default function ReplayPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params['id'] as string

  const [game, setGame] = useState<ReplayGame | null>(null)
  const [currentMove, setCurrentMove] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get game from history
        const games = await historyService.loadHistory()
        const gameData = games.find(game => game.id === gameId)

        if (!gameData) {
          setError('Game not found')
          return
        }

        const replayGame = convertToReplayFormat(gameData)
        setGame(replayGame)
        setCurrentBoard(createEmptyBoard()) // Start with empty board
        setCurrentMove(0)
      } catch (error) {
        console.error('Failed to load game:', error)
        setError('Failed to load game replay')
      } finally {
        setIsLoading(false)
      }
    }

    loadGame()
  }, [gameId])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !game || currentMove >= game.moves.length) {
      setIsPlaying(false)
      return
    }

    const timer = setTimeout(() => {
      setCurrentMove(prev => prev + 1)
    }, 1000 / playbackSpeed)

    return () => clearTimeout(timer)
  }, [isPlaying, currentMove, game, playbackSpeed])

  // Update board when current move changes - reconstruct board from all moves up to current point
  useEffect(() => {
    if (game) {
      const board = createEmptyBoard()

      // Apply all moves up to the current move index
      for (let i = 0; i <= currentMove && i < game.moves.length; i++) {
        const move = game.moves[i]
        if (move && move.position) {
          const { row, column } = move.position
          if (row >= 0 && row < 6 && column >= 0 && column < 7) {
            const discColor = getPlayerDiscColor(move.player, game)
            if (discColor && board.grid[row] && board.grid[row][column] !== undefined) {
              board.grid[row][column] = discColor
            }
          }
        }
      }

      setCurrentBoard(board)
    }
  }, [currentMove, game])

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handlePrevious = useCallback(() => {
    setIsPlaying(false)
    setCurrentMove(Math.max(0, currentMove - 1))
  }, [currentMove])

  const handleNext = useCallback(() => {
    setIsPlaying(false)
    if (game) {
      setCurrentMove(Math.min(game.moves.length, currentMove + 1))
    }
  }, [currentMove, game])

  const handleSeek = useCallback((move: number) => {
    setIsPlaying(false)
    setCurrentMove(move)
  }, [])

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
  }, [])

  const handleMoveSelect = useCallback((moveIndex: number) => {
    setIsPlaying(false)
    setCurrentMove(moveIndex)
  }, [])

  const handleExit = useCallback(() => {
    router.push('/history')
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading replay...</p>
        </div>
      </div>
    )
  }

  if (error || !game || !currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {error || 'Failed to load game replay'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The game replay could not be loaded. Please try again or go back to the history page.
          </p>
          <Button onClick={() => router.push('/history')}>
            Back to History
          </Button>
        </div>
      </div>
    )
  }

  const lastMove = currentMove > 0 ? {
  row: game.moves[currentMove - 1]?.position.row || 0,
  col: game.moves[currentMove - 1]?.position.column || 0
} : null
  const winningLine = currentMove === game.moves.length && game.winner !== 'DRAW'
    ? getWinningLine(currentBoard)
    : null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExit}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C4</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Connect Four
                </h1>
              </button>
              <div className="text-gray-400">/</div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Game Replay
              </h2>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                onClick={handleExit}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to History
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Board and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Board */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-center">
                <Board
                  board={currentBoard}
                  lastMove={lastMove}
                  winningLine={winningLine}
                  onColumnClick={() => {}} // Read-only during replay
                  onColumnHover={() => {}}
                  onColumnLeave={() => {}}
                  disabled={true}
                  showHoverPreview={false}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <PlaybackControls
              currentMove={currentMove}
              totalMoves={game.moves.length}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onPlayPause={handlePlayPause}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSeek={handleSeek}
              onSpeedChange={handleSpeedChange}
            />
          </div>

          {/* Right Panel - Info and Move List */}
          <div className="space-y-6">
            {/* Game Info */}
            <GameInfo game={game} />

            {/* Move List */}
            <MoveList
              moves={game.moves}
              currentMove={currentMove}
              onMoveSelect={handleMoveSelect}
              game={game}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

// Utility functions

function createEmptyBoard(): BoardType {
  return {
    rows: 6,
    columns: 7,
    grid: Array(6).fill(null).map(() => Array(7).fill(null))
  }
}

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

function getWinningLine(_board: BoardType): { row: number; col: number }[] | null {
  // Simplified winning line detection for replay
  // In a real implementation, this would use the actual game logic
  return null
}