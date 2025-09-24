/**
 * Game History Page
 * Displays list of completed games with filtering, pagination, and statistics
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ThemeToggle } from '@/components/theme/ThemeProvider'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { GameStatus, type DiscColor } from '@/types/game'
import { historyService } from '@/lib/history/service'

/**
 * Game History Entry Interface
 */
interface GameHistoryEntry {
  id: string
  playerDisc: DiscColor
  aiDisc: DiscColor
  difficulty: string
  status: GameStatus
  winner: 'HUMAN' | 'AI' | GameStatus.DRAW
  moves: number
  duration: number
  createdAt: Date
  completedAt?: Date
}

/**
 * Convert history service data to display format
 */
function convertToDisplayFormat(historyData: any[]): GameHistoryEntry[] {
  return historyData.map(game => {
    const gameEntry: GameHistoryEntry = {
      id: game.id,
      playerDisc: game.playerDisc,
      aiDisc: game.aiDisc,
      difficulty: game.difficulty,
      status: game.status,
      winner: game.winner,
      moves: game.moves.length,
      duration: game.duration,
      createdAt: new Date(game.createdAt),
    }

    if (game.completedAt) {
      gameEntry.completedAt = new Date(game.completedAt)
    }

    return gameEntry
  })
}

/**
 * Game Card Component
 */
function GameCard({ game, onViewReplay }: { game: GameHistoryEntry; onViewReplay: (id: string) => void }) {
  const getResultIcon = () => {
    switch (game.winner) {
      case 'HUMAN':
        return '🎉'
      case 'AI':
        return '🤖'
      case GameStatus.DRAW:
        return '🤝'
      default:
        return '❓'
    }
  }

  const getResultText = () => {
    switch (game.winner) {
      case 'HUMAN':
        return 'You Won!'
      case 'AI':
        return 'AI Won'
      case GameStatus.DRAW:
        return 'Draw'
      default:
        return 'Unknown'
    }
  }

  const getResultColor = () => {
    switch (game.winner) {
      case 'HUMAN':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'AI':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      case GameStatus.DRAW:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Game Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              getResultColor()
            )}>
              <span className="mr-1">{getResultIcon()}</span>
              {getResultText()}
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-4 h-4 rounded-full',
                game.playerDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
              )} />
              <span className="text-sm text-gray-600 dark:text-gray-400">vs</span>
              <div className={cn(
                'w-4 h-4 rounded-full',
                game.aiDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Difficulty</div>
              <div className="font-medium capitalize">{game.difficulty}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Moves</div>
              <div className="font-medium">{game.moves}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Duration</div>
              <div className="font-medium">{formatDuration(game.duration)}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Date</div>
              <div className="font-medium">{formatDate(game.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 ml-4">
          <Button
            onClick={() => onViewReplay(game.id)}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Replay
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Stats Summary Component
 */
function StatsSummary({ games }: { games: GameHistoryEntry[] }) {
  const stats = {
    total: games.length,
    wins: games.filter(g => g.winner === 'HUMAN').length,
    losses: games.filter(g => g.winner === 'AI').length,
    draws: games.filter(g => g.winner === GameStatus.DRAW).length,
    winRate: games.length > 0 ? (games.filter(g => g.winner === 'HUMAN').length / games.length * 100) : 0,
    avgMoves: games.length > 0 ? games.reduce((sum, g) => sum + g.moves, 0) / games.length : 0,
    avgDuration: games.length > 0 ? games.reduce((sum, g) => sum + g.duration, 0) / games.length : 0,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {stats.total}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Total Games</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {stats.wins}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Wins</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {stats.losses}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Losses</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {stats.draws}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Draws</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
          {stats.winRate.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
          {Math.round(stats.avgMoves)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Avg Moves</div>
      </div>
    </div>
  )
}

/**
 * History Filter Component
 */
function HistoryFilter({
  filter,
  onFilterChange,
}: {
  filter: string
  onFilterChange: (filter: string) => void
}) {
  const filters = [
    { value: 'all', label: 'All Games' },
    { value: 'wins', label: 'Wins' },
    { value: 'losses', label: 'Losses' },
    { value: 'draws', label: 'Draws' },
    { value: 'recent', label: 'Recent' },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filter === f.value
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Main History Page Component
 */
export default function HistoryPage() {
  const [games, setGames] = useState<GameHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load games from history service
  useEffect(() => {
    const loadGames = async () => {
      try {
        const history = await historyService.loadHistory()
        const displayGames = convertToDisplayFormat(history)
        setGames(displayGames)
      } catch (error) {
        console.error('Failed to load game history:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadGames()
  }, [])
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 10

  // Filter and search games
  const filteredGames = games.filter((game) => {
    const matchesFilter = filter === 'all' ||
      (filter === 'wins' && game.winner === 'HUMAN') ||
      (filter === 'losses' && game.winner === 'AI') ||
      (filter === 'draws' && game.winner === GameStatus.DRAW) ||
      (filter === 'recent' && new Date(game.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)

    const matchesSearch = searchQuery === '' ||
      game.difficulty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.winner.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage)
  const startIndex = (currentPage - 1) * gamesPerPage
  const paginatedGames = filteredGames.slice(startIndex, startIndex + gamesPerPage)

  const handleViewReplay = useCallback((gameId: string) => {
    window.location.href = `/history/${gameId}`
  }, [])

  const handleClearHistory = useCallback(async () => {
    if (confirm('Are you sure you want to clear all game history? This action cannot be undone.')) {
      try {
        await historyService.clearHistory()
        setGames([])
        setCurrentPage(1)
      } catch (error) {
        console.error('Failed to clear history:', error)
      }
    }
  }, [])

  const handleExportHistory = useCallback(() => {
    const dataStr = JSON.stringify(games, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `connect-four-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [games])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/'}
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
                Game History
              </h2>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Play</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleExportHistory}
              variant="outline"
              size="sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
            <Button
              onClick={handleClearHistory}
              variant="outline"
              size="sm"
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <StatsSummary games={games} />

        {/* Filter */}
        <HistoryFilter filter={filter} onFilterChange={setFilter} />

        {/* Results Info */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedGames.length} of {filteredGames.length} games
          </div>
        </div>

        {/* Game List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Loading game history...
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Please wait while we load your game history.
              </p>
            </div>
          ) : paginatedGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No games found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' && searchQuery === ''
                  ? 'Start playing to see your game history here.'
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
              {filter === 'all' && searchQuery === '' && (
                <Button
                  onClick={() => window.location.href = '/'}
                  className="mt-4"
                >
                  Play Your First Game
                </Button>
              )}
            </div>
          ) : (
            paginatedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onViewReplay={handleViewReplay}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}