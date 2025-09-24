/**
 * Game API Contracts
 * Defines the interface for game operations and state management
 *
 * Generated from feature specification requirements
 */

// Core Types
export type Player = 'HUMAN' | 'AI';
export type GameStatus = 'IN_PROGRESS' | 'HUMAN_WIN' | 'AI_WIN' | 'DRAW';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DiscColor = 'red' | 'yellow';

// Position Types
export interface Position {
  row: number; // 0-5 (bottom to top)
  column: number; // 0-6 (left to right)
}

export interface WinningLine {
  start: Position;
  end: Position;
  direction: 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down';
}

// Game State Types
export interface Board {
  grid: (DiscColor | null)[][]; // 6 rows x 7 columns
  columns: number; // Always 7
  rows: number; // Always 6
}

export interface Move {
  id: string;
  gameId: string;
  player: Player;
  column: number;
  row: number;
  timestamp: Date;
}

export interface GameState {
  id: string;
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  moves: Move[];
  difficulty: Difficulty;
  playerDisc: DiscColor;
  aiDisc: DiscColor;
  startedAt: Date;
  endedAt?: Date;
  winner?: Player;
  winningLine?: WinningLine;
}

// Game Operations Interface
export interface GameService {
  // Game Lifecycle
  createGame(options: CreateGameOptions): Promise<GameState>;
  makeMove(gameId: string, column: number): Promise<GameState>;
  resetGame(gameId: string): Promise<GameState>;
  endGame(gameId: string): Promise<void>;

  // Game State
  getGame(gameId: string): Promise<GameState | null>;
  getCurrentGame(): Promise<GameState | null>;

  // AI Operations
  getAIMove(gameState: GameState): Promise<number>;
  cancelAIMove(): void;

  // Validation
  isValidMove(gameState: GameState, column: number): boolean;
  getLegalMoves(gameState: GameState): number[];

  // Game Rules
  checkWinner(gameState: GameState): { winner: Player | null; winningLine?: WinningLine };
  isDraw(gameState: GameState): boolean;
}

export interface CreateGameOptions {
  difficulty: Difficulty;
  playerDisc?: DiscColor; // Defaults to 'red'
}

// Settings Interface
export interface SettingsService {
  getSettings(): Promise<GameSettings>;
  updateSettings(settings: Partial<GameSettings>): Promise<GameSettings>;
  resetSettings(): Promise<GameSettings>;
}

export interface GameSettings {
  difficulty: Difficulty;
  playerDisc: DiscColor;
  theme: 'light' | 'dark';
  reduceMotion: boolean;
  soundEnabled: boolean;
  lastVersion?: string;
}

// History Interface
export interface HistoryService {
  getGameHistory(options?: HistoryQueryOptions): Promise<GameHistory[]>;
  getGameById(id: string): Promise<GameHistory | null>;
  deleteGameHistory(id: string): Promise<void>;
  clearAllHistory(): Promise<void>;
  exportHistory(): Promise<string>;
}

export interface HistoryQueryOptions {
  difficulty?: Difficulty;
  result?: 'WIN' | 'LOSS' | 'DRAW';
  limit?: number;
  offset?: number;
  sortBy?: 'startedAt' | 'duration' | 'movesCount';
  sortOrder?: 'asc' | 'desc';
}

export interface GameHistory {
  id: string;
  gameId: string;
  difficulty: Difficulty;
  result: 'WIN' | 'LOSS' | 'DRAW';
  winner?: Player;
  movesCount: number;
  duration: number;
  startedAt: Date;
  endedAt: Date;
  playerDisc: DiscColor;
  moveSequence: number[];
}

// Replay Interface
export interface ReplayService {
  startReplay(gameId: string): Promise<ReplaySession>;
  getReplayState(sessionId: string): Promise<ReplayState>;
  stepForward(sessionId: string): Promise<ReplayState>;
  stepBackward(sessionId: string): Promise<ReplayState>;
  setPlayhead(sessionId: string, moveIndex: number): Promise<ReplayState>;
  togglePlayback(sessionId: string, isPlaying: boolean): Promise<ReplayState>;
  setPlaybackSpeed(sessionId: string, speed: number): Promise<void>;
  endReplay(sessionId: string): Promise<void>;
}

export interface ReplaySession {
  id: string;
  gameId: string;
  playheadIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  startTime: Date;
}

export interface ReplayState {
  session: ReplaySession;
  currentBoard: Board;
  currentMove: Move | null;
  canStepForward: boolean;
  canStepBackward: boolean;
  isGameComplete: boolean;
}

// Persistence Interface
export interface PersistenceService {
  // Game Persistence
  saveGame(game: GameState): Promise<void>;
  loadGame(gameId: string): Promise<GameState | null>;
  deleteGame(gameId: string): Promise<void>;
  getCurrentGameId(): Promise<string | null>;
  setCurrentGameId(gameId: string): Promise<void>;

  // Settings Persistence
  saveSettings(settings: GameSettings): Promise<void>;
  loadSettings(): Promise<GameSettings | null>;

  // History Persistence
  saveGameHistory(history: GameHistory): Promise<void>;
  loadGameHistory(): Promise<GameHistory[]>;
  deleteGameHistory(id: string): Promise<void>;
  clearGameHistory(): Promise<void>;

  // Migration
  migrate(): Promise<void>;
}

// Storage Events
export interface StorageEvents {
  onGameSaved: (game: GameState) => void;
  onGameLoaded: (game: GameState) => void;
  onSettingsChanged: (settings: GameSettings) => void;
  onHistoryUpdated: (history: GameHistory[]) => void;
}

// Error Types
export class GameError extends Error {
  constructor(
    message: string,
    public code: GameErrorCode,
    public details?: any,
  ) {
    super(message);
    this.name = 'GameError';
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
  | 'SETTINGS_INVALID';

// AI Interface
export interface AIService {
  getMove(gameState: GameState): Promise<number>;
  cancel(): void;
  setDifficulty(difficulty: Difficulty): void;
}

// Validation Rules
export interface ValidationRules {
  BOARD_ROWS: 6;
  BOARD_COLUMNS: 7;
  CONNECT_LENGTH: 4;
  MAX_HISTORY_SIZE: 50;
  MAX_AI_THINK_TIME: 200; // milliseconds
}

// Event Bus Interface
export interface GameEventBus {
  emit(event: GameEvent): void;
  on(event: GameEventType, handler: GameEventHandler): void;
  off(event: GameEventType, handler: GameEventHandler): void;
}

export type GameEventType =
  | 'gameCreated'
  | 'moveMade'
  | 'gameEnded'
  | 'gameReset'
  | 'settingsChanged'
  | 'historyUpdated'
  | 'replayStarted'
  | 'replayEnded';

export interface GameEvent {
  type: GameEventType;
  payload: any;
  timestamp: Date;
}

export type GameEventHandler = (event: GameEvent) => void;

