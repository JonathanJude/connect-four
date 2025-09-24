import type { DiscColor, Difficulty, Player, GameMode } from '@/lib/game/constants'
import type { GameStatus } from '@/types/game'
import type { PlayerInfo } from './game'

export interface GameHistoryMove {
  player: Player
  position: { row: number; col: number }
  timestamp: number
  boardState: {
    rows: number
    columns: number
    grid: (DiscColor | null)[][]
  }
}

export interface MultiplayerGameMetadata {
  gameMode: 'MULTIPLAYER'
  players: PlayerInfo[]
  playerThinkTimes?: Record<string, number>
}

export interface SinglePlayerGameMetadata {
  gameMode: 'SINGLE_PLAYER'
  aiThinkTime?: number
  playerThinkTime?: number
}

export type GameMetadata = MultiplayerGameMetadata | SinglePlayerGameMetadata

export interface GameHistoryEntry {
  id: string
  playerId: string
  playerDisc: DiscColor
  aiDisc?: DiscColor // Optional for multiplayer games
  difficulty?: Difficulty // Optional for multiplayer games
  status: GameStatus
  winner: Player | 'DRAW' | null
  moves: GameHistoryMove[]
  duration: number
  createdAt: Date
  completedAt: Date | null
  metadata?: GameMetadata & {
    boardState?: {
      rows: number
      columns: number
      grid: (DiscColor | null)[][]
    }
    winningLine?: Array<{ row: number; col: number }>
    [key: string]: unknown
  }
}

export interface GameHistoryFilter {
  difficulty?: Difficulty
  winner?: Player | 'DRAW' | null | Array<Player | 'DRAW' | null>
  gameMode?: GameMode
  dateFrom?: Date
  dateTo?: Date
  playerDisc?: DiscColor
  minMoves?: number
  maxMoves?: number
  minDuration?: number
  maxDuration?: number
  search?: string
}

export interface GameHistoryStats {
  totalGames: number
  singlePlayerGames: number
  multiplayerGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  averageMoves: number
  averageDuration: number
  difficultyBreakdown: Record<Difficulty, {
    games: number
    wins: number
    losses: number
    draws: number
  }>
  gameModeBreakdown: {
    singlePlayer: {
      games: number
      wins: number
      losses: number
      draws: number
    }
    multiplayer: {
      games: number
      player1Wins: number
      player2Wins: number
      draws: number
    }
  }
  recentPerformance: Array<{
    gameIndex: number
    result: Player | 'DRAW' | null
    difficulty?: Difficulty
    gameMode: GameMode
    moves: number
    duration: number
    date: Date
  }>
}

export type GameExportFormat = 'json' | 'csv' | 'summary'

export interface GameHistory {
  initialize: () => Promise<void>
  saveGame: (game: Omit<GameHistoryEntry, 'id' | 'createdAt'>) => Promise<string>
  updateGame: (id: string, updates: Partial<GameHistoryEntry>) => Promise<void>
  loadHistory: (filter?: GameHistoryFilter) => Promise<GameHistoryEntry[]>
  getGame: (id: string) => Promise<GameHistoryEntry | null>
  deleteGame: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  getStats: (filter?: GameHistoryFilter) => Promise<GameHistoryStats>
  exportHistory: (format?: GameExportFormat) => Promise<string>
  importHistory: (data: string, format?: GameExportFormat) => Promise<void>
  getIncompleteGames: () => Promise<GameHistoryEntry[]>
}
