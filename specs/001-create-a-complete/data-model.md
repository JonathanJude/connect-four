# Phase 1: Data Model Design

## Entity Definitions

### Game

Represents a single game instance with complete state information.

```typescript
interface Game {
  id: string; // Unique game identifier
  board: Board; // Current board state
  currentPlayer: Player; // Current active player
  status: GameStatus; // Current game status
  moves: Move[]; // Complete move history
  difficulty: Difficulty; // AI difficulty level
  playerDisc: DiscColor; // Human player's disc color
  aiDisc: DiscColor; // AI player's disc color
  startedAt: Date; // Game start timestamp
  endedAt?: Date; // Game end timestamp (if completed)
  winner?: Player; // Winner (if game completed)
  duration?: number; // Game duration in milliseconds
}
```

**Validation Rules**:

- `board` must be 6x7 grid (ROWS x COLS)
- `currentPlayer` must alternate between moves
- `status` transitions: IN_PROGRESS → HUMAN_WIN/AI_WIN/DRAW
- `moves` array must be sequential and valid
- `difficulty` must be one of: 'easy', 'medium', 'hard'
- `playerDisc` and `aiDisc` must be different colors

### Board

Represents the game board state.

```typescript
interface Board {
  grid: (DiscColor | null)[][]; // 6x7 grid, null = empty
  columns: number; // Always 7
  rows: number; // Always 6
}
```

**Validation Rules**:

- `grid` must be exactly 6 rows x 7 columns
- Each cell contains either a disc color or null
- Columns fill from bottom to top (gravity)

### Move

Represents a single move in the game.

```typescript
interface Move {
  id: string; // Unique move identifier
  gameId: string; // Associated game ID
  player: Player; // Player who made the move
  column: number; // Column index (0-6)
  row: number; // Row index where disc landed (0-5)
  timestamp: Date; // When move was made
  boardState?: Board; // Board state after move (for replay)
}
```

**Validation Rules**:

- `column` must be between 0 and 6
- `row` must be between 0 and 5
- `column` must not be full when move is made
- Move must be made by current player

### GameSettings

Stores user preferences and settings.

```typescript
interface GameSettings {
  difficulty: Difficulty; // Default AI difficulty
  playerDisc: DiscColor; // Preferred player disc color
  theme: 'light' | 'dark'; // UI theme preference
  reduceMotion: boolean; // Reduced motion preference
  soundEnabled: boolean; // Sound effects preference
  lastVersion?: string; // Last app version used
}
```

**Validation Rules**:

- `difficulty` must be one of: 'easy', 'medium', 'hard'
- `playerDisc` must be either 'red' or 'yellow'
- `theme` must be either 'light' or 'dark'

### GameHistory

Represents a completed game record for history viewing.

```typescript
interface GameHistory {
  id: string; // Unique history entry ID
  gameId: string; // Original game ID
  difficulty: Difficulty; // AI difficulty level
  result: GameResult; // Game result
  winner?: Player; // Winner if applicable
  movesCount: number; // Total moves made
  duration: number; // Game duration in milliseconds
  startedAt: Date; // Game start timestamp
  endedAt: Date; // Game end timestamp
  playerDisc: DiscColor; // Human player's disc color
  // Compressed move data for replay
  moveSequence: number[]; // Column sequence for replay
}
```

**Validation Rules**:

- `movesCount` must match length of `moveSequence`
- `endedAt` must be after `startedAt`
- `duration` must equal `endedAt - startedAt`

### ReplaySession

Represents an active replay viewing session.

```typescript
interface ReplaySession {
  gameId: string; // Game being replayed
  playheadIndex: number; // Current move index being viewed
  isPlaying: boolean; // Auto-play state
  playbackSpeed: number; // Playback speed multiplier
  startTime: Date; // When replay session started
}
```

**Validation Rules**:

- `playheadIndex` must be between 0 and total moves
- `playbackSpeed` must be positive (typically 0.5x, 1x, 2x)

## Type Definitions

### Core Types

```typescript
type Player = 'HUMAN' | 'AI';
type GameStatus = 'IN_PROGRESS' | 'HUMAN_WIN' | 'AI_WIN' | 'DRAW';
type GameResult = 'WIN' | 'LOSS' | 'DRAW';
type Difficulty = 'easy' | 'medium' | 'hard';
type DiscColor = 'red' | 'yellow' | null;
```

### Board Position

```typescript
interface Position {
  row: number; // 0-5 (bottom to top)
  column: number; // 0-6 (left to right)
}
```

### Winning Line

```typescript
interface WinningLine {
  start: Position; // Starting position
  end: Position; // Ending position
  direction: 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down';
}
```

## State Transitions

### Game State Machine

```
NOT_STARTED → IN_PROGRESS → (HUMAN_WIN | AI_WIN | DRAW) → COMPLETED
```

### Valid Transitions

- `NOT_STARTED` → `IN_PROGRESS`: First move made
- `IN_PROGRESS` → `HUMAN_WIN`: Human connects 4
- `IN_PROGRESS` → `AI_WIN`: AI connects 4
- `IN_PROGRESS` → `DRAW`: Board full, no winner
- Any terminal state → `COMPLETED`: Game finalized and archived

## Relationships

### Entity Relationships

```
Game (1) → (N) Move
Game (1) → (1) GameSettings
Game (1) → (1) GameHistory (when completed)
GameHistory (1) → (N) ReplaySession
```

### Data Flow

```
GameSettings → Game creation → Move sequence → Game completion → GameHistory → Replay
```

## Storage Schema

### IndexedDB Object Stores

```
Database: connect-four (v1)
├── games (keyPath: id)
│   ├── Complete game state for in-progress games
│   ├── Index: status (for finding active games)
│   └── Index: startedAt (for cleanup)
├── gameHistory (keyPath: id)
│   ├── Completed game records
│   ├── Index: difficulty
│   ├── Index: result
│   ├── Index: startedAt
│   └── Index: endedAt
└── snapshots (keyPath: gameId)
    ├── Latest game state for resume
    └── Auto-cleanup on game completion
```

### localStorage Schema

```
Key: cf:settings
Value: GameSettings (JSON serialized)

Key: cf:lastGameId
Value: string (most recent game ID)
```

## Serialization Rules

### Game State Serialization

- Board grid: Array of arrays (row-major)
- Move sequence: Array of column indices
- Dates: ISO string format
- Enumerations: String values

### Compression for Storage

- Move sequence: Column indices only (reconstructible)
- Board state: Only store final state for history
- Intermediate states: Compute during replay

## Validation Summary

All entities include:

- Type safety through TypeScript interfaces
- Runtime validation for data integrity
- Business rule enforcement
- Storage constraint compliance
- Performance optimization considerations

This data model provides a comprehensive foundation for the Connect Four game implementation while adhering to constitutional requirements and supporting all specified features.
