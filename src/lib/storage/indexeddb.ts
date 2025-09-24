/**
 * IndexedDB Storage Layer
 * Persistent storage for game history, settings, and offline functionality
 */

import {
  type GameState,
  type GameHistory,
  type GameSettings,
  type Player,
  type DiscColor,
  Difficulty,
} from '../game/constants'

/**
 * Stored Game interface for IndexedDB
 */
export interface StoredGame {
  id: string
  playerDisc: DiscColor
  aiDisc: DiscColor
  difficulty: Difficulty
  status: 'IN_PROGRESS' | 'HUMAN_WIN' | 'AI_WIN' | 'DRAW'
  moves: Array<{
    column: number
    row: number
    player: Player
    timestamp: Date
  }>
  startedAt: Date
  endedAt?: Date
  winner?: Player
  duration?: number
  boardState: string // Serialized board for replay
}

/**
 * Stored Settings interface for IndexedDB
 */
export interface StoredSettings {
  id: string
  playerDisc: DiscColor
  difficulty: Difficulty
  soundEnabled: boolean
  animationsEnabled: boolean
  theme: 'light' | 'dark' | 'auto'
  language: string
  lastUpdated: Date
}

/**
 * IndexedDB Schema Version
 */
const DB_VERSION = 1

/**
 * Database and Store Names
 */
const DB_NAME = 'connect_four_db'
const GAMES_STORE = 'games'
const SETTINGS_STORE = 'settings'
const STATS_STORE = 'statistics'

/**
 * IndexedDB Storage Service
 */
export class IndexedDBStorage {
  private db: IDBDatabase | null = null
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create games store
        if (!db.objectStoreNames.contains(GAMES_STORE)) {
          const gamesStore = db.createObjectStore(GAMES_STORE, { keyPath: 'id' })
          gamesStore.createIndex('status', 'status', { unique: false })
          gamesStore.createIndex('difficulty', 'difficulty', { unique: false })
          gamesStore.createIndex('startedAt', 'startedAt', { unique: false })
          gamesStore.createIndex('playerDisc', 'playerDisc', { unique: false })
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          const settingsStore = db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' })
          settingsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false })
        }

        // Create statistics store
        if (!db.objectStoreNames.contains(STATS_STORE)) {
          const statsStore = db.createObjectStore(STATS_STORE, { keyPath: 'id' })
        }
      }
    })

    return this.initializationPromise
  }

  /**
   * Save game state to IndexedDB
   */
  async saveGame(gameState: GameState): Promise<void> {
    await this.ensureInitialized()

    const storedGame: StoredGame = {
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
      boardState: this.serializeBoard(gameState.board),
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([GAMES_STORE], 'readwrite')
      const store = transaction.objectStore(GAMES_STORE)
      const request = store.put(storedGame)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to save game: ${request.error?.message}`))
    })
  }

  /**
   * Load game state from IndexedDB
   */
  async loadGame(gameId: string): Promise<StoredGame | null> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([GAMES_STORE], 'readonly')
      const store = transaction.objectStore(GAMES_STORE)
      const request = store.get(gameId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error(`Failed to load game: ${request.error?.message}`))
    })
  }

  /**
   * Delete game from IndexedDB
   */
  async deleteGame(gameId: string): Promise<void> {
    await this.ensureInitialized()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([GAMES_STORE], 'readwrite')
      const store = transaction.objectStore(GAMES_STORE)
      const request = store.delete(gameId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to delete game: ${request.error?.message}`))
    })
  }

  /**
   * Get all games from IndexedDB
   */
  async getAllGames(): Promise<StoredGame[]> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([GAMES_STORE], 'readonly')
      const store = transaction.objectStore(GAMES_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(new Error(`Failed to get games: ${request.error?.message}`))
    })
  }

  /**
   * Get games with filtering and sorting
   */
  async getGames(options: {
    status?: StoredGame['status']
    difficulty?: Difficulty
    playerDisc?: DiscColor
    limit?: number
    offset?: number
    sortBy?: 'startedAt' | 'duration' | 'difficulty'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{ games: StoredGame[]; total: number }> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([GAMES_STORE], 'readonly')
      const store = transaction.objectStore(GAMES_STORE)
      let request: IDBRequest

      if (options.status) {
        const index = store.index('status')
        request = index.getAll(options.status)
      } else {
        request = store.getAll()
      }

      request.onsuccess = () => {
        let games = request.result || []

        // Apply additional filters
        if (options.difficulty) {
          games = games.filter(game => game.difficulty === options.difficulty)
        }

        if (options.playerDisc) {
          games = games.filter(game => game.playerDisc === options.playerDisc)
        }

        // Sort games
        const sortBy = options.sortBy || 'startedAt'
        const sortOrder = options.sortOrder || 'desc'

        games.sort((a, b) => {
          let valueA: any, valueB: any

          switch (sortBy) {
            case 'startedAt':
              valueA = a.startedAt.getTime()
              valueB = b.startedAt.getTime()
              break
            case 'duration':
              valueA = a.duration || 0
              valueB = b.duration || 0
              break
            case 'difficulty':
              const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
              valueA = difficultyOrder[a.difficulty]
              valueB = difficultyOrder[b.difficulty]
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
        const total = games.length
        const offset = options.offset || 0
        const limit = options.limit || games.length

        games = games.slice(offset, offset + limit)

        resolve({ games, total })
      }

      request.onerror = () => reject(new Error(`Failed to get games: ${request.error?.message}`))
    })
  }

  /**
   * Save settings to IndexedDB
   */
  async saveSettings(settings: GameSettings): Promise<void> {
    await this.ensureInitialized()

    const storedSettings: StoredSettings = {
      id: 'default',
      playerDisc: settings.playerDisc,
      difficulty: settings.difficulty,
      soundEnabled: settings.soundEnabled,
      animationsEnabled: settings.animationsEnabled,
      theme: settings.theme,
      language: settings.language,
      lastUpdated: new Date(),
    }

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.put(storedSettings)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to save settings: ${request.error?.message}`))
    })
  }

  /**
   * Load settings from IndexedDB
   */
  async loadSettings(): Promise<GameSettings | null> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.get('default')

      request.onsuccess = () => {
        const stored = request.result
        if (!stored) {
          resolve(null)
          return
        }

        resolve({
          playerDisc: stored.playerDisc,
          difficulty: stored.difficulty,
          soundEnabled: stored.soundEnabled,
          animationsEnabled: stored.animationsEnabled,
          theme: stored.theme,
          language: stored.language,
        })
      }

      request.onerror = () => reject(new Error(`Failed to load settings: ${request.error?.message}`))
    })
  }

  /**
   * Get game statistics
   */
  async getStatistics(): Promise<{
    totalGames: number
    wins: number
    losses: number
    draws: number
    winRate: number
    averageGameDuration: number
    gamesByDifficulty: Record<Difficulty, number>
    gamesByDisc: Record<DiscColor, number>
  }> {
    await this.ensureInitialized()

    const games = await this.getAllGames()

    const stats = {
      totalGames: games.length,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      averageGameDuration: 0,
      gamesByDifficulty: { easy: 0, medium: 0, hard: 0 },
      gamesByDisc: { red: 0, yellow: 0 },
    }

    let totalDuration = 0
    let gamesWithDuration = 0

    for (const game of games) {
      if (game.winner === 'HUMAN') stats.wins++
      else if (game.winner === 'AI') stats.losses++
      else stats.draws++

      if (game.duration) {
        totalDuration += game.duration
        gamesWithDuration++
      }

      stats.gamesByDifficulty[game.difficulty]++
      stats.gamesByDisc[game.playerDisc]++
    }

    stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames) * 100 : 0
    stats.averageGameDuration = gamesWithDuration > 0 ? totalDuration / gamesWithDuration : 0

    return stats
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<{
    games: StoredGame[]
    settings: StoredSettings | null
    exportedAt: Date
  }> {
    await this.ensureInitialized()

    const games = await this.getAllGames()
    const settings = await this.loadSettings()

    return {
      games,
      settings,
      exportedAt: new Date(),
    }
  }

  /**
   * Import data from backup
   */
  async importData(data: {
    games: StoredGame[]
    settings?: StoredSettings
  }): Promise<void> {
    await this.ensureInitialized()

    // Clear existing data
    await this.clearAllData()

    // Import games
    const gameTransaction = this.db!.transaction([GAMES_STORE], 'readwrite')
    const gameStore = gameTransaction.objectStore(GAMES_STORE)

    for (const game of data.games) {
      gameStore.put(game)
    }

    // Import settings if provided
    if (data.settings) {
      const settingsTransaction = this.db!.transaction([SETTINGS_STORE], 'readwrite')
      const settingsStore = settingsTransaction.objectStore(SETTINGS_STORE)
      settingsStore.put(data.settings)
    }
  }

  /**
   * Clear all data from IndexedDB
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized()

    const stores = [GAMES_STORE, SETTINGS_STORE, STATS_STORE]

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new Error(`Failed to clear ${storeName}: ${request.error?.message}`))
      })
    }
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window
  }

  /**
   * Get storage quota information
   */
  async getStorageInfo(): Promise<{
    used: number
    total: number
    available: number
    usagePercentage: number
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const total = estimate.quota || 0
      const available = total - used
      const usagePercentage = total > 0 ? (used / total) * 100 : 0

      return { used, total, available, usagePercentage }
    }

    return {
      used: 0,
      total: 0,
      available: 0,
      usagePercentage: 0,
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Serialize board state to string
   */
  private serializeBoard(board: any): string {
    return JSON.stringify(board.grid)
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }
}

/**
 * Create a new IndexedDB Storage instance
 */
export function createIndexedDBStorage(): IndexedDBStorage {
  return new IndexedDBStorage()
}

/**
 * Global IndexedDB storage instance
 */
export const indexedDBStorage = createIndexedDBStorage()