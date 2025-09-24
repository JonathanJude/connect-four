/**
 * History List Component
 * Reusable component for displaying game history with filtering, pagination, and actions
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { historyService } from '@/lib/history/service'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  type GameHistoryEntry,
  type GameHistoryFilter,
  type GameHistoryStats,
  type GameExportFormat
} from '@/types/history'

/**
 * Game Card Component
 * Displays individual game information with action buttons
 */
function GameCard({
  game,
  onViewReplay,
  onDelete,
  onResume
}: {
  game: GameHistoryEntry
  onViewReplay: (id: string) => void
  onDelete: (id: string) => void
  onResume?: (id: string) => void
}) {
  const getResultIcon = () => {
    switch (game.winner) {
      case 'HUMAN':
        return '🎉'
      case 'AI':
        return '🤖'
      case 'DRAW':
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
      case 'DRAW':
        return 'Draw'
      default:
        return game.status === 'IN_PROGRESS' ? 'In Progress' : 'Unknown'
    }
  }

  const getResultColor = () => {
    switch (game.winner) {
      case 'HUMAN':
        return 'border border-green-500/40 bg-green-500/15 text-green-200'
      case 'AI':
        return 'border border-red-500/40 bg-red-500/15 text-red-200'
      case 'DRAW':
        return 'border border-yellow-400/40 bg-yellow-400/10 text-yellow-200'
      default:
        return 'border border-slate-700 bg-slate-800 text-slate-300'
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
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-100 shadow-sm transition-shadow hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        {/* Game Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold tracking-wide',
              getResultColor()
            )}>
              <span className="mr-1">{getResultIcon()}</span>
              {getResultText()}
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <div className={cn(
                'w-4 h-4 rounded-full',
                game.playerDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
              )} />
              <span className="text-sm text-slate-400">vs</span>
              <div className={cn(
                'w-4 h-4 rounded-full',
                game.aiDisc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-slate-400">Difficulty</div>
              <div className="font-medium capitalize text-slate-200">{game.difficulty}</div>
            </div>
            <div>
              <div className="text-slate-400">Moves</div>
              <div className="font-medium text-slate-200">{game.moves.length}</div>
            </div>
            <div>
              <div className="text-slate-400">Duration</div>
              <div className="font-medium text-slate-200">{formatDuration(game.duration)}</div>
            </div>
            <div>
              <div className="text-slate-400">Date</div>
              <div className="font-medium text-slate-200">{formatDate(game.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          {game.status === 'IN_PROGRESS' && onResume && (
            <Button
              onClick={() => onResume(game.id)}
              variant="outline"
              size="sm"
              className="whitespace-nowrap border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume Game
            </Button>
          )}
          <Button
            onClick={() => onViewReplay(game.id)}
            variant="outline"
            size="sm"
            className="whitespace-nowrap border-slate-700 text-slate-100 hover:bg-slate-800"
            disabled={game.status === 'IN_PROGRESS'}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Replay
          </Button>
          <Button
            onClick={() => onDelete(game.id)}
            variant="outline"
            size="sm"
            className="whitespace-nowrap border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Stats Summary Component
 * Displays aggregated statistics from game history
 */
function StatsSummary({ stats }: { stats: GameHistoryStats }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center shadow-sm">
        <div className="text-2xl font-semibold text-blue-300">
          {stats.totalGames}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Total Games</div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center shadow-sm">
        <div className="text-2xl font-semibold text-green-300">
          {stats.wins}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Wins</div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center shadow-sm">
        <div className="text-2xl font-semibold text-red-300">
          {stats.losses}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Losses</div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center shadow-sm">
        <div className="text-2xl font-semibold text-yellow-200">
          {stats.draws}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Draws</div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center shadow-sm">
        <div className="text-xl font-semibold text-purple-300">
          {stats.winRate.toFixed(1)}%
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Win Rate</div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center shadow-sm">
        <div className="text-lg font-semibold text-orange-300">
          {Math.round(stats.averageMoves)}
        </div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Avg Moves</div>
      </div>
    </div>
  )
}

/**
 * History Filter Component
 * Provides filtering options for game history
 */
function HistoryFilter({
  filter,
  onFilterChange,
}: {
  filter: GameHistoryFilter | string
  onFilterChange: (filter: GameHistoryFilter | string) => void
}) {
  const filters = [
    { value: 'all', label: 'All Games' },
    { value: 'wins', label: 'Wins' },
    { value: 'losses', label: 'Losses' },
    { value: 'draws', label: 'Draws' },
    { value: 'recent', label: 'Recent (7 days)' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
  ]

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            filter === f.value
              ? 'border-blue-400/40 bg-blue-500/10 text-blue-200 shadow'
              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Export Controls Component
 * Provides export and import functionality
 */
function ExportControls({
  onExport,
  onImport,
  onClear,
  isLoading,
}: {
  onExport: (format: GameExportFormat) => void
  onImport: (file: File) => void
  onClear: () => void
  isLoading: boolean
}) {
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImport(file)
      event.target.value = '' // Reset input
    }
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <div className="flex space-x-2">
        <Button
          onClick={() => onExport('json')}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="border-slate-700 text-slate-100 hover:bg-slate-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export JSON
        </Button>
        <Button
          onClick={() => onExport('csv')}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="border-slate-700 text-slate-100 hover:bg-slate-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </Button>
        <Button
          onClick={() => onExport('summary')}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="border-slate-700 text-slate-100 hover:bg-slate-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Summary
        </Button>
      </div>

      <div className="flex space-x-2">
        <label className="flex cursor-pointer items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
            disabled={isLoading}
          />
        </label>

        <Button
          onClick={onClear}
          variant="outline"
          size="sm"
          className="border-red-500/40 text-red-300 hover:bg-red-500/10"
          disabled={isLoading}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All
        </Button>
      </div>
    </div>
  )
}

/**
 * Pagination Component
 * Handles pagination for large history lists
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  totalItems: number
}) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {startItem}-{endItem} of {totalItems} games
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-100 hover:bg-slate-800 disabled:border-slate-800 disabled:text-slate-600"
        >
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page
            if (totalPages <= 5) {
              page = i + 1
            } else if (currentPage <= 3) {
              page = i + 1
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i
            } else {
              page = currentPage - 2 + i
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'h-10 w-10 rounded-lg border text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'border-blue-400/40 bg-blue-500/15 text-blue-200 shadow'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                )}
              >
                {page}
              </button>
            )
          })}
        </div>

        <Button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-100 hover:bg-slate-800 disabled:border-slate-800 disabled:text-slate-600"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

/**
 * Main History List Component Props
 */
export interface HistoryListProps {
  /** Enable/disable interactive features */
  interactive?: boolean
  /** Default page size */
  pageSize?: number
  /** Custom filter to apply */
  initialFilter?: GameHistoryFilter | string
  /** Callback when viewing a replay */
  onViewReplay?: (gameId: string) => void
  /** Callback when resuming a game */
  onResume?: (gameId: string) => void
  /** Custom className for styling */
  className?: string
}

/**
 * Main History List Component
 * Reusable component for displaying and managing game history
 */
export function HistoryList({
  interactive = true,
  pageSize = 10,
  initialFilter = 'all',
  onViewReplay,
  onResume,
  className
}: HistoryListProps) {
  const [games, setGames] = useState<GameHistoryEntry[]>([])
  const [stats, setStats] = useState<GameHistoryStats | null>(null)
  const [filter, setFilter] = useState<GameHistoryFilter | string>(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load games and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Initialize history service
        await historyService.initialize()

        // Load games with filter
        const filterObj: import('@/types/history').GameHistoryFilter | undefined = filter === 'all' ? undefined :
          filter === 'wins' ? { winner: 'HUMAN' } :
          filter === 'losses' ? { winner: 'AI' } :
          filter === 'draws' ? { winner: 'DRAW' } :
          filter === 'recent' ? { dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } :
          filter === 'completed' ? { winner: ['HUMAN', 'AI', 'DRAW'] } :
          filter === 'in-progress' ? { winner: null } :
          undefined

        const [gamesData, statsData] = await Promise.all([
          historyService.loadHistory(filterObj),
          historyService.getStats(filterObj)
        ])

        setGames(gamesData)
        setStats(statsData)
        setCurrentPage(1) // Reset to first page when filter changes
      } catch (err) {
        console.error('Failed to load history:', err)
        setError('Failed to load game history. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [filter])

  // Apply search filter
  const filteredGames = games.filter((game) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      game.difficulty.toLowerCase().includes(query) ||
      game.winner?.toLowerCase().includes(query) ||
      game.id.toLowerCase().includes(query) ||
      game.status.toLowerCase().includes(query)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedGames = filteredGames.slice(startIndex, startIndex + pageSize)

  // Event handlers
  const handleViewReplay = useCallback((gameId: string) => {
    if (onViewReplay) {
      onViewReplay(gameId)
    } else if (interactive) {
      window.location.href = `/history/${gameId}`
    }
  }, [onViewReplay, interactive])

  const handleDeleteGame = useCallback(async (gameId: string) => {
    if (!interactive) return

    if (confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      try {
        await historyService.deleteGame(gameId)
        setGames(prev => prev.filter(game => game.id !== gameId))
      } catch (err) {
        console.error('Failed to delete game:', err)
        setError('Failed to delete game. Please try again.')
      }
    }
  }, [interactive])

  const handleResumeGame = useCallback((gameId: string) => {
    if (!interactive) return

    if (onResume) {
      onResume(gameId)
    } else {
      // Default behavior: navigate to the game page with resume parameter
      window.location.href = `/?resume=${gameId}`
    }
  }, [interactive, onResume])

  const handleExport = useCallback(async (format: GameExportFormat) => {
    if (!interactive) return

    try {
      const data = await historyService.exportHistory(format)
      const dataBlob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `connect-four-history-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'json'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export history:', err)
      setError('Failed to export history. Please try again.')
    }
  }, [interactive])

  const handleImport = useCallback(async (file: File) => {
    if (!interactive) return

    try {
      const text = await file.text()
      await historyService.importHistory(text, 'json')

      // Reload data
      const [gamesData, statsData] = await Promise.all([
        historyService.loadHistory(),
        historyService.getStats()
      ])

      setGames(gamesData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to import history:', err)
      setError('Failed to import history. Please check the file format and try again.')
    }
  }, [interactive])

  const handleClearHistory = useCallback(async () => {
    if (!interactive) return

    if (confirm('Are you sure you want to clear all game history? This action cannot be undone.')) {
      try {
        await historyService.clearHistory()
        setGames([])
        setStats({
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          averageMoves: 0,
          averageDuration: 0,
          difficultyBreakdown: {
            easy: { games: 0, wins: 0, losses: 0, draws: 0 },
            medium: { games: 0, wins: 0, losses: 0, draws: 0 },
            hard: { games: 0, wins: 0, losses: 0, draws: 0 },
          },
          recentPerformance: [],
        })
      } catch (err) {
        console.error('Failed to clear history:', err)
        setError('Failed to clear history. Please try again.')
      }
    }
  }, [interactive])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 py-12 text-slate-200', className)}>
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-slate-300">Loading game history...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200', className)}>
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6 text-slate-100', className)}>
      {/* Search and Controls */}
      {interactive && (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {stats && <StatsSummary stats={stats} />}

      {/* Export Controls */}
      {interactive && (
        <ExportControls
          onExport={handleExport}
          onImport={handleImport}
          onClear={handleClearHistory}
          isLoading={isLoading}
        />
      )}

      {/* Filter */}
      <HistoryFilter filter={filter} onFilterChange={setFilter} />

      {/* Game List */}
      <div className="space-y-4">
        {paginatedGames.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 py-12 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-100">
              No games found
            </h3>
            <p className="text-slate-400">
              {filter === 'all' && searchQuery === ''
                ? 'Start playing to see your game history here.'
                : 'Try adjusting your filters or search terms.'
              }
            </p>
          </div>
        ) : (
          paginatedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onViewReplay={handleViewReplay}
              onDelete={handleDeleteGame}
              {...(onResume && { onResume: handleResumeGame })}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={pageSize}
          totalItems={filteredGames.length}
        />
      )}
    </div>
  )
}
