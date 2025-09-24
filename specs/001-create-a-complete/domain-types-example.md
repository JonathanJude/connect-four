# Core Domain Model Types and Interfaces

## Game State Types

### Primary Game Entity

```typescript
/**
 * Represents the complete game state
 * Immutable - changes create new GameState objects
 */
interface GameState {
  // Identification
  readonly id: string;
  readonly version: number;

  // Board State
  readonly board: Board;
  readonly currentPlayer: Player;
  readonly status: GameStatus;

  // Game Configuration
  readonly difficulty: Difficulty;
  readonly playerDisc: DiscColor;
  readonly aiDisc: DiscColor;

  // Move History
  readonly moves: ReadonlyArray<Move>;
  readonly currentMoveIndex: number; // For replay/resume

  // Game Metadata
  readonly startedAt: Date;
  readonly endedAt?: Date;
  readonly winner?: Player;
  readonly winningLine?: WinningLine;
  readonly duration?: number;

  // Derived State (computed)
  readonly legalMoves: ReadonlyArray<number>;
  readonly isTerminal: boolean;
}

interface Board {
  readonly grid: ReadonlyArray<ReadonlyArray<DiscColor | null>>;
  readonly rows: number; // Always 6
  readonly columns: number; // Always 7
  readonly fullCells: number;
}

interface Move {
  readonly id: string;
  readonly gameId: string;
  readonly player: Player;
  readonly column: number; // 0-6
  readonly row: number; // 0-5
  readonly timestamp: Date;
  readonly moveNumber: number;
  readonly boardState?: Board; // For replay
}
```

### Core Enumerations

```typescript
type Player = 'HUMAN' | 'AI';
type GameStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'HUMAN_WIN' | 'AI_WIN' | 'DRAW' | 'ABANDONED';
type Difficulty = 'easy' | 'medium' | 'hard';
type DiscColor = 'red' | 'yellow';
type GameResult = 'WIN' | 'LOSS' | 'DRAW';

interface Position {
  readonly row: number; // 0-5 (bottom to top)
  readonly column: number; // 0-6 (left to right)
}

interface WinningLine {
  readonly start: Position;
  readonly end: Position;
  readonly direction: 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down';
  readonly cells: ReadonlyArray<Position>; // All 4 positions
}
```

## AI and Game Logic Types

### AI Service Interface

```typescript
interface AIService {
  /**
   * Get the best move for the current game state
   * @param gameState Current game state
   * @param timeBudget Maximum time in milliseconds for AI calculation
   * @returns Promise resolving to column index (0-6)
   */
  getMove(gameState: GameState, timeBudget: number): Promise<number>;

  /**
   * Cancel any ongoing AI calculation
   */
  cancel(): void;

  /**
   * Set AI difficulty level
   */
  setDifficulty(difficulty: Difficulty): void;

  /**
   * Get AI statistics (for debugging/analysis)
   */
  getStats(): AIStats | undefined;
}

interface AIStats {
  nodesEvaluated: number;
  searchDepth: number;
  timeTaken: number;
  pruningCount: number;
  cacheHits: number;
}

// Difficulty-specific AI interfaces
interface EasyAI extends AIService {
  getMove(gameState: GameState): Promise<number>;
}

interface MediumAI extends AIService {
  getMove(gameState: GameState, timeBudget: number): Promise<number>;
}

interface HardAI extends AIService {
  getMove(gameState: GameState, timeBudget: number): Promise<number>;
  enableIterativeDeepening(maxDepth: number): void;
  enableTranspositionTable(): void;
}
```

### Game Rules Engine

```typescript
interface GameRules {
  /**
   * Check if a move is valid
   */
  isValidMove(board: Board, column: number): boolean;

  /**
   * Apply a move and return new board state
   */
  applyMove(board: Board, column: number, player: Player): Board;

  /**
   * Get all legal moves for current board
   */
  getLegalMoves(board: Board): number[];

  /**
   * Check for winner and return winning line if exists
   */
  checkWinner(board: Board): { winner: Player | null; winningLine?: WinningLine };

  /**
   * Check if game is a draw
   */
  isDraw(board: Board): boolean;

  /**
   * Check if game is in terminal state
   */
  isTerminal(board: Board): boolean;

  /**
   * Evaluate board position (for AI)
   */
  evaluateBoard(board: Board, player: Player): number;
}

// Minimax specific types
interface MinimaxConfig {
  maxDepth: number;
  useAlphaBeta: boolean;
  useIterativeDeepening: boolean;
  timeBudget: number;
  enableTranspositionTable: boolean;
}

interface TranspositionTableEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'lower' | 'upper';
  bestMove?: number;
}
```

## Persistence Types

### Storage Interfaces

```typescript
interface StorageService {
  // Game State Persistence
  saveGame(game: GameState): Promise<void>;
  loadGame(gameId: string): Promise<GameState | null>;
  deleteGame(gameId: string): Promise<void>;
  listGames(): Promise<Array<{ id: string; status: GameStatus; startedAt: Date }>>;

  // Settings Persistence
  saveSettings(settings: GameSettings): Promise<void>;
  loadSettings(): Promise<GameSettings | null>;

  // History Persistence
  saveGameHistory(history: GameHistory): Promise<void>;
  loadGameHistory(options?: HistoryQuery): Promise<GameHistory[]>;
  deleteGameHistory(id: string): Promise<void>;
  clearHistory(): Promise<void>;

  // Snapshots (for resume)
  saveSnapshot(gameId: string, game: GameState): Promise<void>;
  loadSnapshot(gameId: string): Promise<GameState | null>;
  deleteSnapshot(gameId: string): Promise<void>;
}

interface GameSettings {
  difficulty: Difficulty;
  playerDisc: DiscColor;
  theme: 'light' | 'dark' | 'system';
  reduceMotion: boolean;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  analyticsEnabled: boolean;
  language: string;
  lastVersion: string;
  updatedAt: Date;
}

interface GameHistory {
  id: string;
  gameId: string;
  difficulty: Difficulty;
  result: GameResult;
  winner?: Player;
  movesCount: number;
  duration: number;
  startedAt: Date;
  endedAt: Date;
  playerDisc: DiscColor;
  moveSequence: number[]; // Column sequence for replay
  compressed?: boolean;
  tags?: string[]; // e.g., 'quick', 'long', 'comeback'
}
```

### Replay System Types

```typescript
interface ReplayService {
  startReplay(gameId: string): Promise<ReplaySession>;
  stepForward(sessionId: string): Promise<ReplayState>;
  stepBackward(sessionId: string): Promise<ReplayState>;
  jumpToMove(sessionId: string, moveIndex: number): Promise<ReplayState>;
  togglePlayback(sessionId: string, isPlaying: boolean): Promise<void>;
  setPlaybackSpeed(sessionId: string, speed: number): Promise<void>;
  endReplay(sessionId: string): Promise<void>;
}

interface ReplaySession {
  id: string;
  gameId: string;
  playheadIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  startTime: Date;
  totalMoves: number;
}

interface ReplayState {
  session: ReplaySession;
  currentBoard: Board;
  currentMove: Move | null;
  nextMove: Move | null;
  canStepForward: boolean;
  canStepBackward: boolean;
  isGameComplete: boolean;
}
```

## UI and Component Types

### Component Props Interfaces

```typescript
interface BoardProps {
  board: Board;
  onColumnSelect: (column: number) => void;
  disabled?: boolean;
  highlightColumn?: number;
  winningLine?: WinningLine;
  className?: string;
}

interface CellProps {
  row: number;
  column: number;
  disc: DiscColor | null;
  isWinningCell?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  disabled?: boolean;
  className?: string;
}

interface TurnIndicatorProps {
  currentPlayer: Player;
  isAIThinking?: boolean;
  difficulty?: Difficulty;
  className?: string;
}

interface GameControlsProps {
  onNewGame: () => void;
  onResetGame: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  currentDifficulty: Difficulty;
  gameStatus: GameStatus;
  className?: string;
}

interface HistoryListProps {
  games: GameHistory[];
  onSelectGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

interface ReplayControlsProps {
  session: ReplaySession;
  onStepForward: () => void;
  onStepBackward: () => void;
  onTogglePlayback: () => void;
  onSpeedChange: (speed: number) => void;
  availableSpeeds: number[];
  className?: string;
}
```

### Event Handlers and Callbacks

```typescript
type ColumnSelectHandler = (column: number) => void;
type GameEventHandler = (event: GameEvent) => void;
type SettingsChangeHandler = (settings: Partial<GameSettings>) => void;
type ReplayControlHandler = (action: ReplayAction) => void;

interface GameEvent {
  type: GameEventType;
  payload: unknown;
  timestamp: Date;
}

type GameEventType =
  | 'gameCreated'
  | 'gameStarted'
  | 'moveMade'
  | 'gameEnded'
  | 'gameReset'
  | 'settingsChanged'
  | 'replayStarted'
  | 'replayEnded';

type ReplayAction =
  | 'play'
  | 'pause'
  | 'stepForward'
  | 'stepBackward'
  | 'jumpToStart'
  | 'jumpToEnd'
  | 'changeSpeed';
```

## Error Handling Types

### Custom Error Classes

```typescript
class GameError extends Error {
  constructor(
    message: string,
    public readonly code: GameErrorCode,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'GameError';
  }
}

type GameErrorCode =
  | 'INVALID_MOVE'
  | 'GAME_NOT_FOUND'
  | 'GAME_ALREADY_ENDED'
  | 'INVALID_COLUMN'
  | 'COLUMN_FULL'
  | 'AI_TIMEOUT'
  | 'AI_CANCELLED'
  | 'STORAGE_ERROR'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'INVALID_REPLAY_STATE'
  | 'SETTINGS_INVALID'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED';

interface ErrorContext {
  gameId?: string;
  moveNumber?: number;
  timestamp: Date;
  userAgent: string;
  stack?: string;
}
```

## Utility and Helper Types

### Common Utilities

```typescript
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type AsyncResult<T> = Promise<Result<T>>;
type Result<T> = Success<T> | Failure;

interface Success<T> {
  ok: true;
  value: T;
}

interface Failure {
  ok: false;
  error: GameError;
}

// Discriminated union helpers
type DiscriminatedUnion<T, K extends keyof T> = T[keyof T] extends infer U
  ? U extends K
    ? { [P in K]: U } & T
    : never
  : never;
```

### Performance and Analytics Types

```typescript
interface PerformanceMetrics {
  moveTime: number[];
  aiThinkTime: number[];
  renderTime: number[];
  storageTime: number[];
}

interface GameAnalytics {
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  averageGameTime: number;
  averageMovesPerGame: number;
  difficultyStats: Record<
    Difficulty,
    {
      games: number;
      wins: number;
      losses: number;
      draws: number;
    }
  >;
}

interface SessionMetrics {
  sessionStart: Date;
  gamesPlayed: number;
  totalTime: number;
  movesMade: number;
  aiThinkTime: number;
}
```

These domain model types provide a comprehensive, type-safe foundation for the Connect Four game implementation while ensuring immutability, proper error handling, and extensibility for future features.
