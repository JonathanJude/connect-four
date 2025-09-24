/**
 * Game Constants and Types
 * Defines all the core constants and types for the Connect Four game
 */

// Core Types
export type Player = 'HUMAN' | 'AI' | 'PLAYER_1' | 'PLAYER_2'
export type GameStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'HUMAN_WIN' | 'AI_WIN' | 'PLAYER_1_WON' | 'PLAYER_2_WON' | 'DRAW' | 'PAUSED'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type DiscColor = 'red' | 'yellow'
export type GameMode = 'SINGLE_PLAYER' | 'MULTIPLAYER'

// Board Configuration
export const BOARD_ROWS = 6
export const BOARD_COLUMNS = 7
export const CONNECT_LENGTH = 4

// Time Budgets for AI (in milliseconds)
export const AI_TIME_BUDGETS = {
  easy: 50,
  medium: 100,
  hard: 200,
} as const

// Game Configuration
export const MAX_HISTORY_SIZE = 50
export const MAX_AI_THINK_TIME = 200

// Position Types
export interface Position {
  row: number
  column: number
}

export interface WinningLine {
  start: Position
  end: Position
  direction: 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down'
}

// Board State
export interface Board {
  grid: (DiscColor | null)[][]
  rows: number
  columns: number
}

// Move Information
export interface Move {
  id: string
  gameId: string
  player: Player
  column: number
  row: number
  timestamp: Date
}

// Game State
export interface GameState {
  id: string
  board: Board
  currentPlayer: Player
  status: GameStatus
  moves: Move[]
  difficulty: Difficulty
  playerDisc: DiscColor
  aiDisc: DiscColor
  startedAt: Date
  endedAt?: Date
  winner?: Player
  winningLine?: WinningLine
  isPaused: boolean
}

// Game Settings
export interface GameSettings {
  difficulty: Difficulty
  playerDisc: DiscColor
  theme: 'light' | 'dark'
  reduceMotion: boolean
  soundEnabled: boolean
  lastVersion?: string
}

// Player Information for Multiplayer
export interface PlayerInfo {
  id: string
  name: string
  discColor: DiscColor
  type: 'PLAYER_1' | 'PLAYER_2'
}

// Multiplayer Settings
export interface MultiplayerSettings {
  player1Name: string
  player2Name: string
  player1Disc: DiscColor
  player2Disc: DiscColor
  enableAnimations: boolean
  enableSound: boolean
  theme: 'light' | 'dark' | 'auto'
}

// Extended Game State for Multiplayer
export interface MultiplayerGameState extends GameState {
  gameMode: GameMode
  players: PlayerInfo[]
  currentPlayerInfo: PlayerInfo
  multiplayerSettings: MultiplayerSettings
}

// Extended Game Settings for Multiplayer
export interface ExtendedGameSettings extends GameSettings {
  gameMode: GameMode
  multiplayerSettings: MultiplayerSettings
}

// Game History
export interface GameHistory {
  id: string
  gameId: string
  difficulty: Difficulty
  result: 'WIN' | 'LOSS' | 'DRAW'
  winner?: Player
  movesCount: number
  duration: number
  startedAt: Date
  endedAt: Date
  playerDisc: DiscColor
  moveSequence: number[]
}

// Replay Session
export interface ReplaySession {
  id: string
  gameId: string
  playheadIndex: number
  isPlaying: boolean
  playbackSpeed: number
  startTime: Date
}

// Replay State
export interface ReplayState {
  session: ReplaySession
  currentBoard: Board
  currentMove: Move | null
  canStepForward: boolean
  canStepBackward: boolean
  isGameComplete: boolean
}

// Default Settings
export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  playerDisc: 'red',
  theme: 'light',
  reduceMotion: false,
  soundEnabled: true,
}

// Utility Functions
export function createEmptyBoard(): Board {
  return {
    rows: BOARD_ROWS,
    columns: BOARD_COLUMNS,
    grid: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLUMNS).fill(null)),
  }
}

export function isValidPosition(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < BOARD_ROWS &&
    position.column >= 0 &&
    position.column < BOARD_COLUMNS
  )
}

export function getOppositePlayer(player: Player): Player {
  return player === 'HUMAN' ? 'AI' : 'HUMAN'
}

export function getOppositeDisc(color: DiscColor): DiscColor {
  return color === 'red' ? 'yellow' : 'red'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function isHumanPlayer(player: Player): player is 'HUMAN' {
  return player === 'HUMAN'
}

export function isAIPlayer(player: Player): player is 'AI' {
  return player === 'AI'
}

// Game Error Types
export class GameError extends Error {
  constructor(
    message: string,
    public code: GameErrorCode,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'GameError'
  }
}

export type GameErrorCode =
  | 'INVALID_MOVE'
  | 'GAME_NOT_FOUND'
  | 'GAME_ALREADY_ENDED'
  | 'INVALID_COLUMN'
  | 'COLUMN_FULL'
  | 'AI_TIMEOUT'
  | 'STORAGE_ERROR'
  | 'INVALID_REPLAY_STATE'
  | 'SETTINGS_INVALID'

// Validation Constants
export const VALIDATION_RULES = {
  BOARD_ROWS,
  BOARD_COLUMNS,
  CONNECT_LENGTH,
  MAX_HISTORY_SIZE,
  MAX_AI_THINK_TIME,
} as const