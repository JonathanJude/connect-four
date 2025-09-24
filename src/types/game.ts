/**
 * Game State Types
 * Core TypeScript interfaces for Connect Four game state management
 */

import {
  type Board,
  type DiscColor,
  type Move,
  type Player,
  Difficulty,
  GameMode,
  BOARD_ROWS,
  BOARD_COLUMNS,
} from '../lib/game/constants'

/**
 * Game status enumeration
 */
export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PLAYER_WON = 'PLAYER_WON',
  AI_WON = 'AI_WON',
  PLAYER_1_WON = 'PLAYER_1_WON',
  PLAYER_2_WON = 'PLAYER_2_WON',
  DRAW = 'DRAW',
  PAUSED = 'PAUSED',
}

/**
 * Game settings interface
 */
export interface GameSettings {
  difficulty: Difficulty
  playerDisc: DiscColor
  aiDisc: DiscColor
  enableAnimations: boolean
  enableSound: boolean
  theme: 'light' | 'dark' | 'auto'
  persistGames: boolean
  saveHistory: boolean
  gameMode: GameMode
  multiplayerSettings: MultiplayerSettings
}

/**
 * Player information interface
 */
export interface PlayerInfo {
  id: string
  name: string
  discColor: DiscColor
  type: 'PLAYER_1' | 'PLAYER_2'
}

/**
 * Multiplayer settings interface
 */
export interface MultiplayerSettings {
  player1Name: string
  player2Name: string
  player1Disc: DiscColor
  player2Disc: DiscColor
  enableAnimations: boolean
  enableSound: boolean
  theme: 'light' | 'dark' | 'auto'
}

/**
 * Complete game state
 */
export interface GameState {
  id: string
  board: Board
  status: GameStatus
  currentPlayer: Player
  playerDisc: DiscColor
  aiDisc: DiscColor
  difficulty: Difficulty
  moves: Move[]
  winner?: Player
  winningLine?: { row: number; col: number }[]
  startedAt: Date
  createdAt: Date
  updatedAt: Date
  duration: number
  isPaused: boolean
  gameMode: GameMode
  players?: PlayerInfo[]
  currentPlayerInfo?: PlayerInfo
}

/**
 * Game history entry
 */
export interface GameHistory {
  id: string
  playerDisc: DiscColor
  aiDisc: DiscColor
  difficulty: Difficulty
  result: 'win' | 'loss' | 'draw'
  moves: Move[]
  duration: number
  date: Date
  boardStates: Board[]
  gameMode: GameMode
  players?: PlayerInfo[]
  winnerName?: string
}

/**
 * Replay session state
 */
export interface ReplaySession {
  id: string
  gameId: string
  moves: Move[]
  currentMoveIndex: number
  boardStates: Board[]
  isPlaying: boolean
  playbackSpeed: number
  startTime: Date
}

/**
 * AI thinking state
 */
export interface AIThinkingState {
  isThinking: boolean
  progress: number
  estimatedTimeRemaining: number
  currentDepth: number
  nodesEvaluated: number
}

/**
 * UI state for game board
 */
export interface BoardUIState {
  hoveredColumn: number | null
  lastMoveColumn: number | null
  lastMoveRow: number | null
  isAnimating: boolean
  animationType: 'drop' | 'win' | 'none'
}

/**
 * Game action types for reducer
 */
export type GameAction =
  | { type: 'START_GAME'; payload: { difficulty: Difficulty; playerDisc: DiscColor } }
  | { type: 'START_MULTIPLAYER_GAME'; payload: { players: PlayerInfo[] } }
  | { type: 'MAKE_MOVE'; payload: { column: number } }
  | { type: 'MAKE_MULTIPLAYER_MOVE'; payload: { column: number; player: PlayerInfo } }
  | { type: 'AI_MOVE'; payload: { column: number; thinkingTime: number } }
  | { type: 'RESET_GAME' }
  | { type: 'SWITCH_GAME_MODE'; payload: { gameMode: GameMode } }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'SET_HOVERED_COLUMN'; payload: number | null }
  | { type: 'SET_ANIMATION'; payload: { type: 'drop' | 'win' | 'none'; column?: number; row?: number } }

/**
 * Component props interfaces
 */

/**
 * Props for Cell component
 */
export interface CellProps {
  row: number
  col: number
  disc: DiscColor | null
  isLastMove: boolean
  isWinningCell: boolean
  onHover: (col: number) => void
  onLeave: () => void
  onClick: (col: number) => void
  disabled: boolean
}

/**
 * Props for Board component
 */
export interface BoardProps {
  board: Board
  lastMove?: { row: number; col: number } | null
  winningLine?: { row: number; col: number }[] | null
  onColumnClick: (column: number) => void
  onColumnHover: (column: number) => void
  onColumnLeave: () => void
  disabled: boolean
  showHoverPreview: boolean
}

/**
 * Props for TurnIndicator component
 */
export interface TurnIndicatorProps {
  currentPlayer: Player
  playerDisc: DiscColor
  aiDisc: DiscColor
  isAIThinking: boolean
  gameStatus: GameStatus
  players?: PlayerInfo[]
  currentPlayerInfo?: PlayerInfo
}

/**
 * Props for Controls component
 */
export interface ControlsProps {
  gameStatus: GameStatus
  onNewGame: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSettings: () => void
  disabled: boolean
}

/**
 * Props for SettingsDialog component
 */
export interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  settings: GameSettings
  onSave: (settings: GameSettings) => void
  onResetToDefaults: () => void
}

/**
 * Game statistics
 */
export interface GameStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  averageGameTime: number
  longestWinStreak: number
  currentStreak: number
  winRate: number
}

/**
 * AI performance metrics
 */
export interface AIPerformance {
  difficulty: Difficulty
  gamesPlayed: number
  averageThinkTime: number
  nodesEvaluated: number
  pruningEfficiency: number
  winRate: number
}

/**
 * Persistence keys
 */
export const PERSISTENCE_KEYS = {
  GAME_SETTINGS: 'connect_four_settings',
  CURRENT_GAME: 'connect_four_current_game',
  GAME_HISTORY: 'connect_four_game_history',
  GAME_STATS: 'connect_four_game_stats',
} as const

/**
 * Default game settings
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  difficulty: 'medium',
  playerDisc: 'red',
  aiDisc: 'yellow',
  enableAnimations: true,
  enableSound: false,
  theme: 'auto',
  persistGames: true,
  saveHistory: true,
  gameMode: 'SINGLE_PLAYER',
  multiplayerSettings: {
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    player1Disc: 'red',
    player2Disc: 'yellow',
    enableAnimations: true,
    enableSound: false,
    theme: 'auto',
  },
}

/**
 * Default game state
 */
export function createDefaultGameState(): GameState {
  return {
    id: generateGameId(),
    board: {
      rows: BOARD_ROWS,
      columns: BOARD_COLUMNS,
      grid: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLUMNS).fill(null)),
    },
    status: GameStatus.NOT_STARTED,
    currentPlayer: 'HUMAN',
    playerDisc: 'red',
    aiDisc: 'yellow',
    difficulty: 'medium',
    moves: [],
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    duration: 0,
    isPaused: false,
    gameMode: 'SINGLE_PLAYER',
  }
}

/**
 * Create multiplayer game state
 */
export function createMultiplayerGameState(players: PlayerInfo[]): GameState {
  const gameState: GameState = {
    id: generateGameId(),
    board: {
      rows: BOARD_ROWS,
      columns: BOARD_COLUMNS,
      grid: Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLUMNS).fill(null)),
    },
    status: GameStatus.NOT_STARTED,
    currentPlayer: 'PLAYER_1',
    playerDisc: players[0].discColor,
    aiDisc: players[1].discColor,
    difficulty: 'medium', // Default difficulty, not used in multiplayer
    moves: [],
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    duration: 0,
    isPaused: false,
    gameMode: 'MULTIPLAYER',
    players: players,
  }

  // Only set currentPlayerInfo if players exist
  if (players && players.length > 0) {
    gameState.currentPlayerInfo = players[0]
  }

  return gameState
}

/**
 * Generate unique game ID
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Validate game state
 */
export function validateGameState(state: GameState): boolean {
  if (!state.id || !state.board || !Array.isArray(state.moves)) {
    return false
  }

  if (state.board.rows !== BOARD_ROWS || state.board.columns !== BOARD_COLUMNS) {
    return false
  }

  if (!Object.values(GameStatus).includes(state.status)) {
    return false
  }

  return true
}

/**
 * Check if a move is valid in current game state
 */
export function isValidMoveInState(gameState: GameState, column: number): boolean {
  if (gameState.status !== GameStatus.IN_PROGRESS || gameState.isPaused) {
    return false
  }

  if (gameState.currentPlayer !== 'HUMAN') {
    return false
  }

  return column >= 0 && column < BOARD_COLUMNS && gameState.board.grid[0]?.[column] === null
}

/**
 * Get game result text
 */
export function getGameResultText(gameState: GameState): string {
  switch (gameState.status) {
    case GameStatus.PLAYER_WON:
      return 'You Win!'
    case GameStatus.AI_WON:
      return 'AI Wins!'
    case GameStatus.PLAYER_1_WON:
      return `${gameState.players?.[0]?.name || 'Player 1'} Wins!`
    case GameStatus.PLAYER_2_WON:
      return `${gameState.players?.[1]?.name || 'Player 2'} Wins!`
    case GameStatus.DRAW:
      return "It's a Draw!"
    case GameStatus.PAUSED:
      return 'Game Paused'
    default:
      return ''
  }
}

/**
 * Format game duration
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// Re-export all types from constants for backward compatibility
export * from '../lib/game/constants'
