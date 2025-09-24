/**
 * History Service
 * Game history CRUD operations with filtering, export, and statistics
 */

import {
  type GameHistory,
  type GameHistoryEntry,
  type GameHistoryFilter,
  type GameHistoryStats,
  type GameExportFormat,
} from '@/types/history'
import { persistenceService } from '@/lib/storage/service'

/**
 * History Service Configuration
 */
const HISTORY_CONFIG = {
  STORE_NAME: 'connect-four-history',
  MAX_ENTRIES: 1000,
  AUTO_CLEANUP: true,
  CLEANUP_THRESHOLD: 1200, // Start cleanup when we exceed this
} as const

/**
 * Game History Entry Implementation
 */
class GameHistoryEntryImpl implements GameHistoryEntry {
  constructor(
    public id: string,
    public playerId: string,
    public playerDisc: 'red' | 'yellow',
    public aiDisc: 'red' | 'yellow',
    public difficulty: 'easy' | 'medium' | 'hard',
    public status: 'IN_PROGRESS' | 'PLAYER_WON' | 'AI_WON' | 'DRAW',
    public winner: 'HUMAN' | 'AI' | 'DRAW' | null,
    public moves: Array<{
      player: 'HUMAN' | 'AI'
      position: { row: number; col: number }
      timestamp: number
      boardState: any
    }>,
    public duration: number,
    public createdAt: Date,
    public completedAt: Date | null,
    public metadata?: {
      aiThinkTime?: number
      playerThinkTime?: number
      boardState?: any
      winningLine?: Array<{ row: number; col: number }>
      [key: string]: any
    }
  ) {}

  /**
   * Check if the game is completed
   */
  get isCompleted(): boolean {
    return this.status !== 'IN_PROGRESS'
  }

  /**
   * Get game result for display
   */
  get result(): string {
    switch (this.winner) {
      case 'HUMAN': return 'Win'
      case 'AI': return 'Loss'
      case 'DRAW': return 'Draw'
      default: return 'In Progress'
    }
  }

  /**
   * Get formatted duration
   */
  get formattedDuration(): string {
    if (this.completedAt && this.createdAt) {
      const duration = this.completedAt.getTime() - this.createdAt.getTime()
      return formatDuration(duration)
    }
    return formatDuration(this.duration)
  }

  /**
   * Convert to plain object for storage
   */
  toJSON(): any {
    return {
      id: this.id,
      playerId: this.playerId,
      playerDisc: this.playerDisc,
      aiDisc: this.aiDisc,
      difficulty: this.difficulty,
      status: this.status,
      winner: this.winner,
      moves: this.moves,
      duration: this.duration,
      createdAt: this.createdAt.toISOString(),
      completedAt: this.completedAt?.toISOString() || null,
      metadata: this.metadata,
    }
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: any): GameHistoryEntryImpl {
    return new GameHistoryEntryImpl(
      data.id,
      data.playerId,
      data.playerDisc,
      data.aiDisc,
      data.difficulty,
      data.status,
      data.winner,
      data.moves || [],
      data.duration,
      new Date(data.createdAt),
      data.completedAt ? new Date(data.completedAt) : null,
      data.metadata
    )
  }
}

/**
 * History Service Implementation
 */
export class HistoryService implements GameHistory {
  private initialized = false

  /**
   * Initialize the history service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await persistenceService.initialize()
      await this.performCleanup()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize history service:', error)
      throw new Error('History service initialization failed')
    }
  }

  /**
   * Save a game to history
   */
  async saveGame(game: Omit<GameHistoryEntry, 'id' | 'createdAt'>): Promise<string> {
    await this.ensureInitialized()

    try {
      const storedHistory = await this.loadHistoryFromStorage()
      const entryId = typeof game.metadata?.id === 'string' ? game.metadata.id : generateGameId()
      const existingIndex = storedHistory.findIndex(entry => entry.id === entryId)
      const existingEntry = existingIndex >= 0 ? storedHistory[existingIndex] : null
      const createdAt = existingEntry?.createdAt ? new Date(existingEntry.createdAt) : new Date()
      const completedAt = game.completedAt ?? (existingEntry?.completedAt ? new Date(existingEntry.completedAt) : null)

      const entry = new GameHistoryEntryImpl(
        entryId,
        game.playerId || 'default',
        game.playerDisc,
        game.aiDisc,
        game.difficulty,
        game.status,
        game.winner,
        game.moves,
        game.duration,
        createdAt,
        completedAt,
        game.metadata
      )

      const serializedEntry = entry.toJSON()

      if (existingIndex >= 0) {
        const preservedCreatedAt = storedHistory[existingIndex].createdAt
        storedHistory[existingIndex] = {
          ...storedHistory[existingIndex],
          ...serializedEntry,
          createdAt: preservedCreatedAt,
          completedAt: serializedEntry.completedAt ?? storedHistory[existingIndex].completedAt ?? null,
        }
      } else {
        storedHistory.push(serializedEntry)
      }

      // Maintain max entries limit
      if (storedHistory.length > HISTORY_CONFIG.MAX_ENTRIES) {
        storedHistory.splice(0, storedHistory.length - HISTORY_CONFIG.MAX_ENTRIES)
      }

      await persistenceService.setItem(HISTORY_CONFIG.STORE_NAME, storedHistory)
      return entryId
    } catch (error) {
      console.error('Failed to save game to history:', error)
      throw new Error('Failed to save game to history')
    }
  }

  /**
   * Update an existing game in history
   */
  async updateGame(id: string, updates: Partial<GameHistoryEntry>): Promise<void> {
    await this.ensureInitialized()

    try {
      const history = await this.loadHistory()
      const index = history.findIndex(entry => entry.id === id)

      if (index === -1) {
        throw new Error(`Game with id ${id} not found`)
      }

      const updatedEntry = { ...history[index], ...updates }
      history[index] = updatedEntry

      await persistenceService.setItem(HISTORY_CONFIG.STORE_NAME, history)
    } catch (error) {
      console.error('Failed to update game in history:', error)
      throw new Error('Failed to update game in history')
    }
  }

  /**
   * Load game history
   */
  async loadHistory(filter?: GameHistoryFilter): Promise<GameHistoryEntry[]> {
    await this.ensureInitialized()

    try {
      let history = await this.loadHistoryFromStorage()

      // Apply filters
      if (filter) {
        history = this.applyFilter(history, filter)
      }

      // Sort by creation date (newest first)
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return history.map(entry => GameHistoryEntryImpl.fromJSON(entry))
    } catch (error) {
      console.error('Failed to load game history:', error)
      return []
    }
  }

  /**
   * Get a specific game by ID
   */
  async getGame(id: string): Promise<GameHistoryEntry | null> {
    await this.ensureInitialized()

    try {
      const history = await this.loadHistoryFromStorage()
      const entry = history.find(entry => entry.id === id)

      return entry ? GameHistoryEntryImpl.fromJSON(entry) : null
    } catch (error) {
      console.error('Failed to get game:', error)
      return null
    }
  }

  /**
   * Delete a game from history
   */
  async deleteGame(id: string): Promise<void> {
    await this.ensureInitialized()

    try {
      const history = await this.loadHistoryFromStorage()
      const filtered = history.filter(entry => entry.id !== id)

      await persistenceService.setItem(HISTORY_CONFIG.STORE_NAME, filtered)
    } catch (error) {
      console.error('Failed to delete game:', error)
      throw new Error('Failed to delete game')
    }
  }

  /**
   * Clear all game history
   */
  async clearHistory(): Promise<void> {
    await this.ensureInitialized()

    try {
      await persistenceService.removeItem(HISTORY_CONFIG.STORE_NAME)
    } catch (error) {
      console.error('Failed to clear history:', error)
      throw new Error('Failed to clear history')
    }
  }

  /**
   * Get history statistics
   */
  async getStats(filter?: GameHistoryFilter): Promise<GameHistoryStats> {
    await this.ensureInitialized()

    try {
      const history = await this.loadHistory(filter)

      const stats: GameHistoryStats = {
        totalGames: history.length,
        wins: history.filter(g => g.winner === 'HUMAN').length,
        losses: history.filter(g => g.winner === 'AI').length,
        draws: history.filter(g => g.winner === 'DRAW').length,
        winRate: 0,
        averageMoves: 0,
        averageDuration: 0,
        difficultyBreakdown: {
          easy: { games: 0, wins: 0, losses: 0, draws: 0 },
          medium: { games: 0, wins: 0, losses: 0, draws: 0 },
          hard: { games: 0, wins: 0, losses: 0, draws: 0 },
        },
        recentPerformance: [],
      }

      if (stats.totalGames === 0) {
        return stats
      }

      // Calculate overall stats
      stats.winRate = (stats.wins / stats.totalGames) * 100
      stats.averageMoves = history.reduce((sum, g) => sum + g.moves.length, 0) / stats.totalGames
      stats.averageDuration = history.reduce((sum, g) => sum + g.duration, 0) / stats.totalGames

      // Calculate difficulty breakdown
      history.forEach(game => {
        const difficulty = game.difficulty
        stats.difficultyBreakdown[difficulty].games++

        if (game.winner === 'HUMAN') stats.difficultyBreakdown[difficulty].wins++
        else if (game.winner === 'AI') stats.difficultyBreakdown[difficulty].losses++
        else if (game.winner === 'DRAW') stats.difficultyBreakdown[difficulty].draws++
      })

      // Calculate recent performance (last 10 games)
      const recentGames = history.slice(0, 10).reverse()
      stats.recentPerformance = recentGames.map((game, index) => ({
        gameIndex: index + 1,
        result: game.winner || 'DRAW',
        difficulty: game.difficulty,
        moves: game.moves.length,
        duration: game.duration,
        date: new Date(game.createdAt),
      }))

      return stats
    } catch (error) {
      console.error('Failed to get history stats:', error)
      return {
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
      }
    }
  }

  /**
   * Export history data
   */
  async exportHistory(format: GameExportFormat = 'json'): Promise<string> {
    await this.ensureInitialized()

    try {
      const history = await this.loadHistoryFromStorage()
      const stats = await this.getStats()

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalGames: history.length,
        stats,
        games: history,
      }

      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2)

        case 'csv':
          return this.exportToCSV(history)

        case 'summary':
          return JSON.stringify({
            exportedAt: exportData.exportedAt,
            version: exportData.version,
            stats: exportData.stats,
          }, null, 2)

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Failed to export history:', error)
      throw new Error('Failed to export history')
    }
  }

  /**
   * Import history data
   */
  async importHistory(data: string, format: GameExportFormat = 'json'): Promise<void> {
    await this.ensureInitialized()

    try {
      let importData: any

      switch (format) {
        case 'json':
          importData = JSON.parse(data)
          break

        default:
          throw new Error(`Unsupported import format: ${format}`)
      }

      // Validate import data structure
      if (!importData.games || !Array.isArray(importData.games)) {
        throw new Error('Invalid import data format')
      }

      // Merge with existing history, avoiding duplicates
      const existingHistory = await this.loadHistoryFromStorage()
      const existingIds = new Set(existingHistory.map(g => g.id))

      const newGames = importData.games
        .filter((game: any) => !existingIds.has(game.id))
        .map((game: any) => ({
          ...game,
          createdAt: new Date(game.createdAt),
          completedAt: game.completedAt ? new Date(game.completedAt) : null,
        }))

      const mergedHistory = [...newGames, ...existingHistory]

      // Apply max entries limit
      if (mergedHistory.length > HISTORY_CONFIG.MAX_ENTRIES) {
        mergedHistory.splice(0, mergedHistory.length - HISTORY_CONFIG.MAX_ENTRIES)
      }

      await persistenceService.setItem(HISTORY_CONFIG.STORE_NAME, mergedHistory)
    } catch (error) {
      console.error('Failed to import history:', error)
      throw new Error('Failed to import history')
    }
  }

  /**
   * Get incomplete games (games in progress)
   */
  async getIncompleteGames(): Promise<GameHistoryEntry[]> {
    await this.ensureInitialized()

    try {
      const history = await this.loadHistoryFromStorage()
      const incompleteGames = history.filter(game => game.status === 'IN_PROGRESS')

      return incompleteGames.map(entry => GameHistoryEntryImpl.fromJSON(entry))
    } catch (error) {
      console.error('Failed to get incomplete games:', error)
      return []
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  private async loadHistoryFromStorage(): Promise<any[]> {
    try {
      const data = await persistenceService.getItem(HISTORY_CONFIG.STORE_NAME)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Failed to load history from storage:', error)
      return []
    }
  }

  private applyFilter(history: any[], filter: GameHistoryFilter): any[] {
    let filtered = [...history]

    if (filter.difficulty) {
      filtered = filtered.filter(game => game.difficulty === filter.difficulty)
    }

    if (filter.winner) {
      filtered = filtered.filter(game => game.winner === filter.winner)
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(game => new Date(game.createdAt) >= filter.dateFrom!)
    }

    if (filter.dateTo) {
      filtered = filtered.filter(game => new Date(game.createdAt) <= filter.dateTo!)
    }

    if (filter.playerDisc) {
      filtered = filtered.filter(game => game.playerDisc === filter.playerDisc)
    }

    if (filter.minMoves !== undefined) {
      filtered = filtered.filter(game => game.moves.length >= filter.minMoves!)
    }

    if (filter.maxMoves !== undefined) {
      filtered = filtered.filter(game => game.moves.length <= filter.maxMoves!)
    }

    if (filter.minDuration !== undefined) {
      filtered = filtered.filter(game => game.duration >= filter.minDuration!)
    }

    if (filter.maxDuration !== undefined) {
      filtered = filtered.filter(game => game.duration <= filter.maxDuration!)
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      filtered = filtered.filter(game =>
        game.difficulty.toLowerCase().includes(searchLower) ||
        game.winner?.toLowerCase().includes(searchLower) ||
        game.id.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  private async performCleanup(): Promise<void> {
    if (!HISTORY_CONFIG.AUTO_CLEANUP) return

    try {
      const history = await this.loadHistoryFromStorage()

      if (history.length > HISTORY_CONFIG.CLEANUP_THRESHOLD) {
        // Remove oldest entries beyond the max limit
        const keepCount = HISTORY_CONFIG.MAX_ENTRIES
        history.splice(0, history.length - keepCount)

        await persistenceService.setItem(HISTORY_CONFIG.STORE_NAME, history)
        console.log(`History service: Cleaned up ${history.length - keepCount} old entries`)
      }
    } catch (error) {
      console.error('History cleanup failed:', error)
    }
  }

  private exportToCSV(history: any[]): string {
    const headers = [
      'ID',
      'Date',
      'Duration',
      'Difficulty',
      'Player Disc',
      'AI Disc',
      'Status',
      'Winner',
      'Moves',
      'Result',
    ]

    const rows = history.map(game => [
      game.id,
      new Date(game.createdAt).toISOString(),
      game.duration,
      game.difficulty,
      game.playerDisc,
      game.aiDisc,
      game.status,
      game.winner || '',
      game.moves.length,
      game.winner === 'HUMAN' ? 'Win' : game.winner === 'AI' ? 'Loss' : game.winner === 'DRAW' ? 'Draw' : '',
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }
}

// Utility functions

function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

// Export singleton instance
export const historyService = new HistoryService()
