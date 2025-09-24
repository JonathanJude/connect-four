/**
 * Persistence Service
 * Unified storage service that handles both IndexedDB and localStorage
 * Provides fallback mechanisms and data synchronization
 */

import {
  type GameState,
  type GameHistory,
  type GameSettings,
  type Player,
  type DiscColor,
  Difficulty,
} from '../game/constants'
import {
  IndexedDBStorage,
  type StoredGame,
  type StoredSettings,
  createIndexedDBStorage,
} from './indexeddb'
import {
  LocalStorageSettings,
  createLocalStorageSettings,
} from './localstorage'

/**
 * Storage Mode
 */
export type StorageMode = 'indexeddb' | 'localstorage' | 'hybrid'

/**
 * Game Statistics interface
 */
export interface GameStatistics {
  totalGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  averageGameDuration: number
  gamesByDifficulty: Record<Difficulty, number>
  gamesByDisc: Record<DiscColor, number>
  currentStreak: number
  bestStreak: number
  lastPlayed: Date | null
}

/**
 * Storage Service Configuration
 */
export interface StorageConfig {
  mode: StorageMode
  autoSync: boolean
  syncInterval: number // in milliseconds
  compressionEnabled: boolean
  offlineFirst: boolean
}

/**
 * Persistence Service class
 */
export class PersistenceService {
  private indexedDB: IndexedDBStorage
  private localStorage: LocalStorageSettings
  private config: StorageConfig
  private syncTimer: NodeJS.Timeout | null = null
  private isOnline = true
  private pendingSyncs = new Set<string>()
  private static STORAGE_PREFIX = 'connect_four_generic_'

  constructor(config: Partial<StorageConfig> = {}) {
    this.indexedDB = createIndexedDBStorage()
    this.localStorage = createLocalStorageSettings()

    this.config = {
      mode: 'hybrid',
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      compressionEnabled: false,
      offlineFirst: true,
      ...config,
    }

    this.initializeService()
  }

  /**
   * Public initialize method for external services
   */
  async initialize(): Promise<void> {
    await this.initializeService()
  }

  /**
   * Initialize the persistence service
   */
  private async initializeService(): Promise<void> {
    // Determine best storage mode
    if (this.config.mode === 'hybrid') {
      this.config.mode = IndexedDBStorage.isAvailable() ? 'indexeddb' : 'localstorage'
    }

    // Initialize IndexedDB if available
    if (this.config.mode === 'indexeddb') {
      try {
        await this.indexedDB.initialize()
      } catch (error) {
        console.warn('Failed to initialize IndexedDB, falling back to localStorage:', error)
        this.config.mode = 'localstorage'
      }
    }

    // Set up online/offline detection
    this.setupNetworkDetection()

    // Start auto-sync if enabled
    if (this.config.autoSync && this.config.mode === 'indexeddb') {
      this.startAutoSync()
    }
  }

  /**
   * Save game state
   */
  async saveGame(gameState: GameState): Promise<void> {
    const gameId = gameState.id

    try {
      if (this.config.mode === 'indexeddb') {
        await this.indexedDB.saveGame(gameState)
      } else {
        // For localStorage, we only save minimal game info
        await this.saveGameToLocalStorage(gameState)
      }

      // Update last played timestamp
      this.localStorage.setLastPlayed()

      // If offline, add to pending syncs
      if (!this.isOnline && this.config.mode === 'indexeddb') {
        this.pendingSyncs.add(gameId)
      }
    } catch (error) {
      console.error('Failed to save game:', error)
      throw error
    }
  }

  /**
   * Load game state
   */
  async loadGame(gameId: string): Promise<GameState | null> {
    try {
      if (this.config.mode === 'indexeddb') {
        const storedGame = await this.indexedDB.loadGame(gameId)
        if (storedGame) {
          return this.convertStoredGameToGameState(storedGame)
        }
      }

      // Try localStorage as fallback
      return this.loadGameFromLocalStorage(gameId)
    } catch (error) {
      console.error('Failed to load game:', error)
      throw error
    }
  }

  /**
   * Delete game
   */
  async deleteGame(gameId: string): Promise<void> {
    try {
      if (this.config.mode === 'indexeddb') {
        await this.indexedDB.deleteGame(gameId)
      }

      // Also remove from localStorage if present
      this.removeGameFromLocalStorage(gameId)

      this.pendingSyncs.delete(gameId)
    } catch (error) {
      console.error('Failed to delete game:', error)
      throw error
    }
  }

  /**
   * Get game history with filtering and pagination
   */
  async getGameHistory(options: {
    status?: GameState['status']
    difficulty?: Difficulty
    playerDisc?: DiscColor
    limit?: number
    offset?: number
    sortBy?: 'startedAt' | 'duration' | 'difficulty'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<GameHistory> {
    try {
      if (this.config.mode === 'indexeddb') {
        const result = await this.indexedDB.getGames(options)
        return {
          games: result.games.map(game => this.convertStoredGameToGameState(game)),
          total: result.total,
        }
      }

      // Fallback to localStorage
      return this.getGameHistoryFromLocalStorage(options)
    } catch (error) {
      console.error('Failed to get game history:', error)
      return { games: [], total: 0 }
    }
  }

  /**
   * Get game statistics
   */
  async getGameStatistics(): Promise<GameStatistics> {
    try {
      let stats: any

      if (this.config.mode === 'indexeddb') {
        stats = await this.indexedDB.getStatistics()
      } else {
        stats = this.getStatisticsFromLocalStorage()
      }

      // Calculate additional statistics
      const quickStats = this.localStorage.getQuickStats()
      const lastPlayed = this.localStorage.getLastPlayed()

      return {
        ...stats,
        currentStreak: this.calculateCurrentStreak(),
        bestStreak: this.calculateBestStreak(),
        lastPlayed,
      }
    } catch (error) {
      console.error('Failed to get game statistics:', error)
      return this.getDefaultStatistics()
    }
  }

  /**
   * Save settings
   */
  async saveSettings(settings: GameSettings): Promise<void> {
    try {
      // Always save to localStorage for quick access
      this.localStorage.saveSettings(settings)

      if (this.config.mode === 'indexeddb') {
        await this.indexedDB.saveSettings(settings)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  }

  /**
   * Load settings
   */
  async loadSettings(): Promise<GameSettings> {
    try {
      // Try IndexedDB first if available
      if (this.config.mode === 'indexeddb') {
        const settings = await this.indexedDB.loadSettings()
        if (settings) {
          // Also save to localStorage for consistency
          this.localStorage.saveSettings(settings)
          return settings
        }
      }

      // Fallback to localStorage
      return this.localStorage.loadSettings()
    } catch (error) {
      console.error('Failed to load settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Export all data
   */
  async exportData(): Promise<{
    games: GameState[]
    settings: GameSettings
    statistics: GameStatistics
    exportedAt: Date
  }> {
    try {
      let games: GameState[] = []
      let settings = await this.loadSettings()
      const statistics = await this.getGameStatistics()

      if (this.config.mode === 'indexeddb') {
        const data = await this.indexedDB.exportData()
        games = data.games.map(game => this.convertStoredGameToGameState(game))
        if (data.settings) {
          settings = data.settings
        }
      }

      return {
        games,
        settings,
        statistics,
        exportedAt: new Date(),
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  /**
   * Import data
   */
  async importData(data: {
    games?: GameState[]
    settings?: GameSettings
    statistics?: GameStatistics
  }): Promise<void> {
    try {
      // Import settings
      if (data.settings) {
        await this.saveSettings(data.settings)
      }

      // Import games
      if (data.games && this.config.mode === 'indexeddb') {
        const storedGames = data.games.map(game => this.convertGameStateToStoredGame(game))
        await this.indexedDB.importData({
          games: storedGames,
          settings: data.settings,
        })
      }

      // Update quick stats
      if (data.statistics) {
        this.updateQuickStatsFromStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Failed to import data:', error)
      throw error
    }
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    try {
      if (this.config.mode === 'indexeddb') {
        await this.indexedDB.clearAllData()
      }

      this.localStorage.clearAllSettings()
      this.pendingSyncs.clear()
    } catch (error) {
      console.error('Failed to clear all data:', error)
      throw error
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<{
    mode: StorageMode
    indexedDB?: {
      used: number
      total: number
      available: number
      usagePercentage: number
    }
    localStorage: {
      used: number
      total: number
      available: number
      usagePercentage: number
    }
    pendingSyncs: number
    isOnline: boolean
  }> {
    const localStorageInfo = this.localStorage.getStorageInfo()

    const result = {
      mode: this.config.mode,
      localStorage: localStorageInfo,
      pendingSyncs: this.pendingSyncs.size,
      isOnline: this.isOnline,
    } as any

    if (this.config.mode === 'indexeddb') {
      result.indexedDB = await this.indexedDB.getStorageInfo()
    }

    return result
  }

  /**
   * Update game statistics after a game ends
   */
  async updateGameStatistics(
    gameState: GameState,
    result: 'win' | 'loss' | 'draw'
  ): Promise<void> {
    try {
      // Update localStorage quick stats
      this.localStorage.updateQuickStats(result)

      // If the game is saved to IndexedDB, statistics will be calculated from there
      if (gameState.status !== 'IN_PROGRESS') {
        await this.saveGame(gameState)
      }
    } catch (error) {
      console.error('Failed to update game statistics:', error)
    }
  }

  /**
   * Get current storage mode
   */
  getStorageMode(): StorageMode {
    return this.config.mode
  }

  /**
   * Change storage mode
   */
  async changeStorageMode(mode: StorageMode): Promise<void> {
    if (mode === this.config.mode) {
      return
    }

    // Stop current auto-sync
    this.stopAutoSync()

    // Update configuration
    this.config.mode = mode

    // Re-initialize with new mode
    await this.initializeService()

    // Restart auto-sync if enabled
    if (this.config.autoSync && this.config.mode === 'indexeddb') {
      this.startAutoSync()
    }
  }

  /**
   * Start auto-sync
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      this.syncPendingData()
    }, this.config.syncInterval)
  }

  /**
   * Stop auto-sync
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  /**
   * Set up network detection
   */
  private setupNetworkDetection(): void {
    // Skip network detection in SSR environment
    if (typeof window === 'undefined') {
      this.isOnline = true
      return
    }

    const handleOnline = () => {
      this.isOnline = true
      this.syncPendingData()
    }

    const handleOffline = () => {
      this.isOnline = false
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    this.isOnline = navigator.onLine
  }

  /**
   * Sync pending data when online
   */
  private async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.pendingSyncs.size === 0) {
      return
    }

    try {
      // Sync each pending game
      for (const gameId of Array.from(this.pendingSyncs)) {
        // Try to load the game and re-save it
        const game = await this.loadGame(gameId)
        if (game) {
          await this.saveGame(game)
        }

        this.pendingSyncs.delete(gameId)
      }
    } catch (error) {
      console.error('Failed to sync pending data:', error)
    }
  }

  /**
   * Convert stored game to game state
   */
  private convertStoredGameToGameState(storedGame: StoredGame): GameState {
    return {
      id: storedGame.id,
      board: JSON.parse(storedGame.boardState),
      currentPlayer: 'HUMAN', // Default, will be calculated from moves
      status: storedGame.status,
      moves: storedGame.moves.map(move => ({
        id: `move-${move.timestamp.getTime()}`,
        gameId: storedGame.id,
        column: move.column,
        row: move.row,
        player: move.player,
        timestamp: move.timestamp,
      })),
      difficulty: storedGame.difficulty,
      playerDisc: storedGame.playerDisc,
      aiDisc: storedGame.aiDisc,
      startedAt: storedGame.startedAt,
      endedAt: storedGame.endedAt,
      winner: storedGame.winner,
    }
  }

  /**
   * Convert game state to stored game
   */
  private convertGameStateToStoredGame(gameState: GameState): StoredGame {
    return {
      id: gameState.id,
      playerDisc: gameState.playerDisc,
      aiDisc: gameState.aiDisc,
      difficulty: gameState.difficulty,
      status: gameState.status,
      moves: gameState.moves.map(move => ({
        column: move.column,
        row: move.row,
        player: move.player,
        timestamp: move.timestamp,
      })),
      startedAt: gameState.startedAt,
      endedAt: gameState.endedAt,
      winner: gameState.winner,
      duration: gameState.endedAt
        ? gameState.endedAt.getTime() - gameState.startedAt.getTime()
        : undefined,
      boardState: JSON.stringify(gameState.board.grid),
    }
  }

  /**
   * Save game to localStorage (minimal version)
   */
  private async saveGameToLocalStorage(gameState: GameState): Promise<void> {
    try {
      const minimalGame = {
        id: gameState.id,
        difficulty: gameState.difficulty,
        playerDisc: gameState.playerDisc,
        status: gameState.status,
        startedAt: gameState.startedAt.toISOString(),
        endedAt: gameState.endedAt?.toISOString(),
        winner: gameState.winner,
        moveCount: gameState.moves.length,
      }

      localStorage.setItem(`connect_four_game_${gameState.id}`, JSON.stringify(minimalGame))
    } catch (error) {
      console.warn('Failed to save game to localStorage:', error)
    }
  }

  /**
   * Load game from localStorage
   */
  private async loadGameFromLocalStorage(gameId: string): Promise<GameState | null> {
    try {
      const stored = localStorage.getItem(`connect_four_game_${gameId}`)
      if (!stored) {
        return null
      }

      // For localStorage, we can only return minimal game info
      const minimalGame = JSON.parse(stored)

      // Create a basic game state
      return {
        id: minimalGame.id,
        board: { rows: 6, columns: 7, grid: Array(6).fill(null).map(() => Array(7).fill(null)) },
        currentPlayer: 'HUMAN',
        status: minimalGame.status,
        moves: [],
        difficulty: minimalGame.difficulty,
        playerDisc: minimalGame.playerDisc,
        aiDisc: minimalGame.playerDisc === 'red' ? 'yellow' : 'red',
        startedAt: new Date(minimalGame.startedAt),
        endedAt: minimalGame.endedAt ? new Date(minimalGame.endedAt) : undefined,
        winner: minimalGame.winner,
      }
    } catch (error) {
      console.warn('Failed to load game from localStorage:', error)
      return null
    }
  }

  /**
   * Remove game from localStorage
   */
  private removeGameFromLocalStorage(gameId: string): void {
    try {
      localStorage.removeItem(`connect_four_game_${gameId}`)
    } catch (error) {
      console.warn('Failed to remove game from localStorage:', error)
    }
  }

  /**
   * Store arbitrary JSON-serializable data (used by history service)
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    const storageKey = this.getNamespacedKey(key)

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify(value))
      }
    } catch (error) {
      console.warn('Failed to persist item to localStorage:', error)
      throw error
    }
  }

  /**
   * Load arbitrary JSON-serializable data (used by history service)
   */
  async getItem<T>(key: string): Promise<T | null> {
    const storageKey = this.getNamespacedKey(key)

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null
      }

      const storedValue = window.localStorage.getItem(storageKey)
      if (!storedValue) {
        return null
      }

      return JSON.parse(storedValue) as T
    } catch (error) {
      console.warn('Failed to read persisted item from localStorage:', error)
      return null
    }
  }

  /**
   * Remove arbitrary data (used by history service)
   */
  async removeItem(key: string): Promise<void> {
    const storageKey = this.getNamespacedKey(key)

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.warn('Failed to remove persisted item from localStorage:', error)
      throw error
    }
  }

  private getNamespacedKey(key: string): string {
    return `${PersistenceService.STORAGE_PREFIX}${key}`
  }

  /**
   * Get game history from localStorage
   */
  private async getGameHistoryFromLocalStorage(options: any): Promise<GameHistory> {
    try {
      const games: GameState[] = []
      const keys = Object.keys(localStorage).filter(key => key.startsWith('connect_four_game_'))

      for (const key of keys) {
        const stored = localStorage.getItem(key)
        if (stored) {
          const minimalGame = JSON.parse(stored)
          const gameState = await this.loadGameFromLocalStorage(minimalGame.id)
          if (gameState) {
            games.push(gameState)
          }
        }
      }

      // Apply sorting and filtering
      let filteredGames = games

      if (options.status) {
        filteredGames = filteredGames.filter(game => game.status === options.status)
      }

      if (options.difficulty) {
        filteredGames = filteredGames.filter(game => game.difficulty === options.difficulty)
      }

      if (options.playerDisc) {
        filteredGames = filteredGames.filter(game => game.playerDisc === options.playerDisc)
      }

      // Sort games
      const sortBy = options.sortBy || 'startedAt'
      const sortOrder = options.sortOrder || 'desc'

      filteredGames.sort((a, b) => {
        let valueA: any, valueB: any

        switch (sortBy) {
          case 'startedAt':
            valueA = a.startedAt.getTime()
            valueB = b.startedAt.getTime()
            break
          case 'duration':
            valueA = a.endedAt ? a.endedAt.getTime() - a.startedAt.getTime() : 0
            valueB = b.endedAt ? b.endedAt.getTime() - b.startedAt.getTime() : 0
            break
          default:
            valueA = a.startedAt.getTime()
            valueB = b.startedAt.getTime()
        }

        if (sortOrder === 'asc') {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        } else {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
        }
      })

      // Apply pagination
      const total = filteredGames.length
      const offset = options.offset || 0
      const limit = options.limit || filteredGames.length

      filteredGames = filteredGames.slice(offset, offset + limit)

      return { games: filteredGames, total }
    } catch (error) {
      console.warn('Failed to get game history from localStorage:', error)
      return { games: [], total: 0 }
    }
  }

  /**
   * Get statistics from localStorage
   */
  private getStatisticsFromLocalStorage(): any {
    const quickStats = this.localStorage.getQuickStats()

    return {
      totalGames: quickStats.totalGames,
      wins: quickStats.wins,
      losses: quickStats.losses,
      draws: quickStats.draws,
      winRate: quickStats.totalGames > 0 ? (quickStats.wins / quickStats.totalGames) * 100 : 0,
      averageGameDuration: 0, // Not tracked in localStorage
      gamesByDifficulty: { easy: 0, medium: 0, hard: 0 }, // Not tracked in localStorage
      gamesByDisc: { red: 0, yellow: 0 }, // Not tracked in localStorage
    }
  }

  /**
   * Calculate current winning/losing streak
   */
  private calculateCurrentStreak(): number {
    // This would require loading recent games to calculate
    // For now, return 0
    return 0
  }

  /**
   * Calculate best winning streak
   */
  private calculateBestStreak(): number {
    // This would require loading all games to calculate
    // For now, return 0
    return 0
  }

  /**
   * Get default statistics
   */
  private getDefaultStatistics(): GameStatistics {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      averageGameDuration: 0,
      gamesByDifficulty: { easy: 0, medium: 0, hard: 0 },
      gamesByDisc: { red: 0, yellow: 0 },
      currentStreak: 0,
      bestStreak: 0,
      lastPlayed: null,
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): GameSettings {
    return {
      playerDisc: 'red',
      difficulty: 'medium',
      soundEnabled: true,
      animationsEnabled: true,
      theme: 'auto',
      language: 'en',
    }
  }

  /**
   * Update quick stats from imported statistics
   */
  private updateQuickStatsFromStatistics(statistics: GameStatistics): void {
    const quickStats = {
      totalGames: statistics.totalGames,
      wins: statistics.wins,
      losses: statistics.losses,
      draws: statistics.draws,
      lastUpdated: new Date(),
    }

    try {
      localStorage.setItem('connect_four_quick_stats', JSON.stringify(quickStats))
    } catch (error) {
      console.warn('Failed to update quick stats from imported statistics:', error)
    }
  }
}

/**
 * Create a new Persistence Service instance
 */
export function createPersistenceService(config?: Partial<StorageConfig>): PersistenceService {
  return new PersistenceService(config)
}

/**
 * Global persistence service instance
 */
export const persistenceService = createPersistenceService()
