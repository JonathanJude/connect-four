/**
 * Replay Service
 * Manages replay sessions, state reconstruction, and playback controls
 */

import {
  type ReplaySession,
  type ReplaySessionState,
  type ReplayControls,
  type ReplayEvent,
  type ReplaySpeed
} from '@/types/replay'
import { historyService } from '@/lib/history/service'
import {
  type GameHistoryEntry,
  type GameHistoryFilter
} from '@/types/history'
import type { DiscColor, PlayerInfo } from '@/lib/game/constants'

/**
 * Replay Service Configuration
 */
const REPLAY_CONFIG = {
  DEFAULT_SPEED: 1 as ReplaySpeed,
  SPEED_MULTIPLIERS: {
    '0.5x': 0.5,
    '1x': 1,
    '1.5x': 1.5,
    '2x': 2,
    '4x': 4
  },
  AUTO_PLAY_DELAY: 1000, // Base delay between moves in ms
  MAX_REPLAY_SESSIONS: 10, // Maximum concurrent replay sessions
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes inactivity timeout
} as const

/**
 * Replay Session Implementation
 */
class ReplaySessionImpl implements ReplaySession {
  public id: string
  public gameId: string
  public state: ReplaySessionState
  public controls: ReplayControls
  public metadata: {
    createdAt: Date
    lastAccessed: Date
    gameData: GameHistoryEntry
  }

  constructor(
    gameId: string,
    gameData: GameHistoryEntry
  ) {
    this.id = generateSessionId()
    this.gameId = gameId
    this.state = {
      currentMove: 0,
      isPlaying: false,
      speed: REPLAY_CONFIG.DEFAULT_SPEED,
      currentTime: Date.now(),
      boardState: this.getBoardStateAtMove(0),
      lastMove: null,
      winningLine: null,
      isComplete: false
    }
    this.controls = {
      play: () => this.play(),
      pause: () => this.pause(),
      stop: () => this.stop(),
      seek: (move: number) => this.seek(move),
      next: () => this.next(),
      previous: () => this.previous(),
      setSpeed: (speed: ReplaySpeed) => this.setSpeed(speed),
      getState: () => this.getState()
    }
    this.metadata = {
      createdAt: new Date(),
      lastAccessed: new Date(),
      gameData
    }
  }

  /**
   * Get board state at specific move by reconstructing from all previous moves
   */
  private getBoardStateAtMove(moveIndex: number): any {
    // Return initial empty board
    const boardState = {
      rows: 6,
      columns: 7,
      grid: Array(6).fill(null).map(() => Array(7).fill(null))
    }

    // Apply all moves up to the current move index
    for (let i = 0; i < moveIndex && i < this.metadata.gameData.moves.length; i++) {
      const move = this.metadata.gameData.moves[i]
      if (move && move.position) {
        const { row, col } = move.position
        if (row >= 0 && row < 6 && col >= 0 && col < 7) {
          // Get the player's disc color
          let discColor: DiscColor
          if (move.player === 'HUMAN') {
            discColor = this.metadata.gameData.playerDisc
          } else if (move.player === 'AI') {
            discColor = this.metadata.gameData.aiDisc
          } else if (move.player === 'PLAYER_1' || move.player === 'PLAYER_2') {
            // For multiplayer games, get disc color from players metadata
            const players = this.metadata.gameData.metadata?.players || []
            const player = players.find(p => p.type === move.player)
            discColor = player?.discColor || (move.player === 'PLAYER_1' ? 'red' : 'yellow')
          } else {
            discColor = this.metadata.gameData.playerDisc // fallback
          }
          boardState.grid[row][col] = discColor
        }
      }
    }

    return boardState
  }

  /**
   * Check if game is complete at current move
   */
  private checkGameComplete(): boolean {
    const totalMoves = this.metadata.gameData.moves.length
    const winner = this.metadata.gameData.winner

    return this.state.currentMove >= totalMoves ||
           (winner && winner !== null && this.state.currentMove === totalMoves)
  }

  /**
   * Play the replay
   */
  private play(): void {
    if (this.state.isPlaying) return

    this.state.isPlaying = true
    this.state.currentTime = Date.now()
    this.updateLastAccessed()
  }

  /**
   * Pause the replay
   */
  private pause(): void {
    this.state.isPlaying = false
    this.updateLastAccessed()
  }

  /**
   * Stop the replay and reset to beginning
   */
  private stop(): void {
    this.state.isPlaying = false
    this.state.currentMove = 0
    this.state.boardState = this.getBoardStateAtMove(0)
    this.state.lastMove = null
    this.state.winningLine = null
    this.state.isComplete = false
    this.updateLastAccessed()
  }

  /**
   * Seek to specific move
   */
  private seek(moveIndex: number): void {
    const totalMoves = this.metadata.gameData.moves.length
    const targetMove = Math.max(0, Math.min(moveIndex, totalMoves))

    this.state.currentMove = targetMove
    this.state.boardState = this.getBoardStateAtMove(targetMove)

    // Set last move to the most recent move at this position for animations
    if (targetMove > 0) {
      this.state.lastMove = this.metadata.gameData.moves[targetMove - 1]?.position || null
    } else {
      this.state.lastMove = null
    }

    this.state.winningLine = this.getWinningLineAtMove(targetMove)
    this.state.isComplete = this.checkGameComplete()
    this.updateLastAccessed()
  }

  /**
   * Move to next move
   */
  private next(): void {
    const totalMoves = this.metadata.gameData.moves.length
    if (this.state.currentMove < totalMoves) {
      this.seek(this.state.currentMove + 1)
    }
  }

  /**
   * Move to previous move
   */
  private previous(): void {
    if (this.state.currentMove > 0) {
      this.seek(this.state.currentMove - 1)
    }
  }

  /**
   * Set playback speed
   */
  private setSpeed(speed: ReplaySpeed): void {
    this.state.speed = speed
    this.updateLastAccessed()
  }

  /**
   * Get current state
   */
  private getState(): ReplaySessionState {
    return { ...this.state }
  }

  /**
   * Update last accessed time
   */
  private updateLastAccessed(): void {
    this.metadata.lastAccessed = new Date()
  }

  /**
   * Get winning line at specific move
   */
  private getWinningLineAtMove(moveIndex: number): { row: number; col: number }[] | null {
    // This would use the actual game logic to detect winning positions
    // For now, we'll use a simplified implementation
    const gameData = this.metadata.gameData
    if (gameData.winningLine && moveIndex >= gameData.moves.length) {
      return gameData.winningLine
    }
    return null
  }

  /**
   * Update replay state (called by replay service during playback)
   */
  update(): void {
    if (!this.state.isPlaying) return

    const now = Date.now()
    const elapsed = now - this.state.currentTime
    const moveDelay = REPLAY_CONFIG.AUTO_PLAY_DELAY / REPLAY_CONFIG.SPEED_MULTIPLIERS[this.state.speed]

    if (elapsed >= moveDelay) {
      this.next()
      this.state.currentTime = now

      // Auto-pause when reaching the end
      if (this.state.isComplete) {
        this.pause()
      }
    }
  }

  /**
   * Get replay events for timeline
   */
  getEvents(): ReplayEvent[] {
    return this.metadata.gameData.moves.map((move, index) => ({
      id: `move_${index}`,
      type: 'MOVE',
      timestamp: move.timestamp,
      moveIndex: index,
      data: {
        player: move.player,
        position: move.position,
        boardState: move.boardState
      }
    }))
  }

  /**
   * Get session statistics
   */
  getStats() {
    const totalMoves = this.metadata.gameData.moves.length
    const progress = this.state.currentMove / totalMoves
    const remainingMoves = totalMoves - this.state.currentMove
    const estimatedTime = remainingMoves * (REPLAY_CONFIG.AUTO_PLAY_DELAY / REPLAY_CONFIG.SPEED_MULTIPLIERS[this.state.speed])

    return {
      totalMoves,
      currentMove: this.state.currentMove,
      progress: Math.min(100, progress * 100),
      remainingMoves,
      estimatedTime,
      speed: this.state.speed,
      isPlaying: this.state.isPlaying,
      isComplete: this.state.isComplete
    }
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    const now = Date.now()
    const inactiveTime = now - this.metadata.lastAccessed.getTime()
    return inactiveTime > REPLAY_CONFIG.SESSION_TIMEOUT
  }
}

/**
 * Replay Service Implementation
 */
export class ReplayService {
  private sessions: Map<string, ReplaySessionImpl> = new Map()
  private initialized = false
  private updateInterval: NodeJS.Timeout | null = null

  /**
   * Initialize the replay service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await historyService.initialize()
      this.startUpdateLoop()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize replay service:', error)
      throw new Error('Replay service initialization failed')
    }
  }

  /**
   * Create a new replay session
   */
  async createSession(gameId: string): Promise<ReplaySession> {
    await this.ensureInitialized()

    try {
      // Load game data from history
      const gameData = await historyService.getGame(gameId)
      if (!gameData) {
        throw new Error(`Game with id ${gameId} not found`)
      }

      // Check session limit
      if (this.sessions.size >= REPLAY_CONFIG.MAX_REPLAY_SESSIONS) {
        this.cleanupExpiredSessions()
      }

      // Create new session
      const session = new ReplaySessionImpl(gameId, gameData)
      this.sessions.set(session.id, session)

      return session
    } catch (error) {
      console.error('Failed to create replay session:', error)
      throw new Error('Failed to create replay session')
    }
  }

  /**
   * Get an existing replay session
   */
  getSession(sessionId: string): ReplaySession | null {
    const session = this.sessions.get(sessionId)
    if (session && !session.isExpired()) {
      session.updateLastAccessed()
      return session
    }
    return null
  }

  /**
   * Get all active sessions
   */
  getSessions(): ReplaySession[] {
    this.cleanupExpiredSessions()
    return Array.from(this.sessions.values())
  }

  /**
   * Delete a replay session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }

  /**
   * Clear all replay sessions
   */
  async clearSessions(): Promise<void> {
    this.sessions.clear()
  }

  /**
   * Create replay from game history entry
   */
  async createFromHistory(game: GameHistoryEntry): Promise<ReplaySession> {
    await this.ensureInitialized()

    try {
      // Save game to history first if it doesn't exist
      if (!game.id) {
        const gameId = await historyService.saveGame(game)
        game.id = gameId
      }

      return await this.createSession(game.id)
    } catch (error) {
      console.error('Failed to create replay from history:', error)
      throw new Error('Failed to create replay from history')
    }
  }

  /**
   * Export replay data
   */
  async exportSession(sessionId: string, format: 'json' | 'url' = 'json'): Promise<string> {
    const session = this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    try {
      const exportData = {
        sessionId: session.id,
        gameId: session.gameId,
        currentState: session.controls.getState(),
        gameData: session.metadata.gameData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2)

        case 'url':
          const encoded = btoa(JSON.stringify(exportData))
          return `${window.location.origin}/replay/${encoded}`

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Failed to export replay session:', error)
      throw new Error('Failed to export replay session')
    }
  }

  /**
   * Import replay from data
   */
  async importSession(data: string): Promise<ReplaySession> {
    try {
      const importData = JSON.parse(data)

      // Validate import data structure
      if (!importData.gameData || !importData.gameData.id) {
        throw new Error('Invalid import data format')
      }

      // Create session from imported game data
      return await this.createFromHistory(importData.gameData)
    } catch (error) {
      console.error('Failed to import replay session:', error)
      throw new Error('Failed to import replay session')
    }
  }

  /**
   * Get replay statistics across all sessions
   */
  getStats(): {
    totalSessions: number
    activeSessions: number
    completedSessions: number
    averageSessionDuration: number
    popularSpeeds: Record<ReplaySpeed, number>
  } {
    const sessions = Array.from(this.sessions.values())
    const now = Date.now()

    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.state.isPlaying).length,
      completedSessions: sessions.filter(s => s.state.isComplete).length,
      averageSessionDuration: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (now - s.metadata.createdAt.getTime()), 0) / sessions.length
        : 0,
      popularSpeeds: {
        '0.5x': 0,
        '1x': 0,
        '1.5x': 0,
        '2x': 0,
        '4x': 0
      } as Record<ReplaySpeed, number>
    }

    // Count popular speeds
    sessions.forEach(s => {
      stats.popularSpeeds[s.state.speed]++
    })

    return stats
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  private startUpdateLoop(): void {
    if (this.updateInterval) return

    this.updateInterval = setInterval(() => {
      this.updateSessions()
    }, 100) // Update every 100ms for smooth playback
  }

  private updateSessions(): void {
    this.sessions.forEach(session => {
      session.update()
    })
    this.cleanupExpiredSessions()
  }

  private cleanupExpiredSessions(): void {
    const expiredSessions: string[] = []

    this.sessions.forEach((session, sessionId) => {
      if (session.isExpired()) {
        expiredSessions.push(sessionId)
      }
    })

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId)
    })

    if (expiredSessions.length > 0) {
      console.log(`Replay service: Cleaned up ${expiredSessions.length} expired sessions`)
    }
  }
}

// Utility functions

function generateSessionId(): string {
  return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export singleton instance
export const replayService = new ReplayService()