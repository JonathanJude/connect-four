# OpenSpec Change Proposal: Add 1v1 Multiplayer Mode

**Change ID**: `002-add-multiplayer-1v1`
**Created**: 2025-01-27
**Status**: Draft
**Priority**: High
**Impact**: Major Feature Addition

## Summary

Add offline 1v1 multiplayer functionality to the Connect Four game, allowing two human players to play against each other on the same device. This feature will coexist with the existing Player vs AI mode, giving users the choice between single-player (vs AI) and multiplayer (vs human) gameplay.

## Motivation

The current Connect Four game only supports single-player mode where a human plays against an AI opponent. Adding 1v1 multiplayer capability will:

1. **Expand User Base**: Appeal to users who prefer playing with friends and family
2. **Increase Engagement**: Enable social gameplay experiences on the same device
3. **Enhance Accessibility**: Provide an option that doesn't rely on AI difficulty levels
4. **Maintain Simplicity**: Keep the offline-first, no-network-required approach

## Current State Analysis

### Existing Architecture

- **Player Types**: Currently supports `'HUMAN' | 'AI'` players only
- **Game Flow**: Human makes move → AI computes and makes move → repeat
- **UI**: Shows "Your Turn" vs "AI Thinking..." indicators
- **Settings**: Include AI difficulty levels (Easy, Medium, Hard)
- **Game State**: Tracks winner as HUMAN_WON or AI_WON
- **History**: Records games as wins/losses against AI

### Technical Constraints

- Must remain fully offline-capable
- No network connectivity required
- Maintain existing single-player functionality
- Preserve all current game features (history, replay, settings)
- Keep responsive design for all screen sizes

## Proposed Changes

### 1. Core Type System Extensions

#### New Game Mode Enum

```typescript
export type GameMode = 'SINGLE_PLAYER' | 'MULTIPLAYER';
```

#### Extended Player Types

```typescript
// Maintain backward compatibility
export type Player = 'HUMAN' | 'AI' | 'PLAYER_1' | 'PLAYER_2';

// New player info structure for multiplayer
export interface PlayerInfo {
  id: 'PLAYER_1' | 'PLAYER_2';
  name: string; // Default: "Player 1", "Player 2"
  discColor: DiscColor;
  isHuman: true;
}
```

#### Extended Game Status

```typescript
export type GameStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'HUMAN_WON' // Keep for backward compatibility
  | 'AI_WON' // Keep for backward compatibility
  | 'PLAYER_1_WON' // New for multiplayer
  | 'PLAYER_2_WON' // New for multiplayer
  | 'DRAW'
  | 'PAUSED';
```

### 2. Game State Modifications

#### Enhanced GameState Interface

```typescript
export interface GameState {
  // Existing fields...
  id: string;
  board: Board;
  status: GameStatus;
  currentPlayer: Player;
  moves: Move[];

  // New fields for multiplayer support
  gameMode: GameMode;
  player1Info?: PlayerInfo; // Only for multiplayer mode
  player2Info?: PlayerInfo; // Only for multiplayer mode

  // Modified fields
  winner?: Player; // Can now be PLAYER_1 or PLAYER_2

  // Existing fields remain unchanged
  difficulty: Difficulty; // Only relevant for SINGLE_PLAYER mode
  playerDisc: DiscColor; // Only relevant for SINGLE_PLAYER mode
  aiDisc: DiscColor; // Only relevant for SINGLE_PLAYER mode
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  duration: number;
  isPaused: boolean;
  winningLine?: { row: number; col: number }[];
}
```

#### Enhanced GameSettings Interface

```typescript
export interface GameSettings {
  // Existing single-player settings
  difficulty: Difficulty;
  playerDisc: DiscColor;
  aiDisc: DiscColor;

  // New multiplayer settings
  defaultPlayer1Name: string;
  defaultPlayer2Name: string;
  defaultPlayer1Color: DiscColor;
  defaultPlayer2Color: DiscColor;

  // Existing general settings
  enableAnimations: boolean;
  enableSound: boolean;
  theme: 'light' | 'dark' | 'auto';
  persistGames: boolean;
  saveHistory: boolean;
}
```

### 3. User Interface Changes

#### New Components Required

**GameModeSelector Component**

- Radio buttons or toggle for "Play vs Computer" / "Play vs Friend"
- Clear visual distinction between modes
- Prominent placement on main game screen

**MultiplayerSetupDialog Component**

- Player name inputs (optional, with defaults)
- Color selection for each player
- "Switch Colors" button for convenience
- Start game button

**Enhanced TurnIndicator Component**

- Current: "Your Turn" / "AI Thinking..."
- New for multiplayer: "Player 1's Turn" / "Player 2's Turn"
- Show player names when available
- Display disc colors clearly

#### Modified Components

**GameBoard Component**

- No functional changes to game logic
- Visual indicators remain the same
- Hover effects work for both players

**ControlsPanel Component**

- New Game button respects current game mode
- Settings button opens mode-appropriate settings
- Pause/Resume works for both modes

**SettingsDialog Component**

- Conditional sections based on game mode
- Show AI difficulty only for single-player mode
- Show player name/color settings only for multiplayer mode

**GameEndDialog Component**

- "Player 1 Wins!" instead of "You Win!" for multiplayer
- "Player 2 Wins!" instead of "AI Wins!" for multiplayer
- Maintain existing celebration animations

**HistoryPanel Component**

- Show game mode indicator (vs AI / vs Human)
- Display player names in multiplayer game entries
- Filter options by game mode

### 4. Game Logic Updates

#### Game Reducer Actions

```typescript
export type GameAction =
  // Existing actions...
  | { type: 'START_GAME'; payload: { difficulty: Difficulty; playerDisc: DiscColor } }
  | { type: 'MAKE_MOVE'; payload: { column: number } }
  | { type: 'AI_MOVE'; payload: { column: number; thinkingTime: number } }

  // New multiplayer actions
  | {
      type: 'START_MULTIPLAYER_GAME';
      payload: {
        player1: PlayerInfo;
        player2: PlayerInfo;
      };
    }
  | {
      type: 'MAKE_MULTIPLAYER_MOVE';
      payload: {
        column: number;
        player: 'PLAYER_1' | 'PLAYER_2';
      };
    }

  // Existing actions remain...
  | { type: 'RESET_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' };
```

#### Turn Management Logic

- **Single-player mode**: Human → AI → Human (existing)
- **Multiplayer mode**: Player 1 → Player 2 → Player 1 (new)
- No AI computation in multiplayer mode
- Same move validation and win detection logic

### 5. Persistence and History

#### Enhanced GameHistory Interface

```typescript
export interface GameHistory {
  id: string;
  gameMode: GameMode; // New field

  // Single-player fields (existing)
  playerDisc?: DiscColor;
  aiDisc?: DiscColor;
  difficulty?: Difficulty;
  result?: 'win' | 'loss' | 'draw';

  // Multiplayer fields (new)
  player1Info?: PlayerInfo;
  player2Info?: PlayerInfo;
  winner?: 'PLAYER_1' | 'PLAYER_2' | 'DRAW';

  // Common fields
  moves: Move[];
  duration: number;
  date: Date;
  boardStates: Board[];
}
```

#### Storage Keys

```typescript
export const PERSISTENCE_KEYS = {
  GAME_SETTINGS: 'connect_four_settings',
  CURRENT_GAME: 'connect_four_current_game',
  GAME_HISTORY: 'connect_four_game_history',
  GAME_STATS: 'connect_four_game_stats',
  MULTIPLAYER_SETTINGS: 'connect_four_multiplayer_settings', // New
} as const;
```

## User Experience Flow

### Game Mode Selection

1. User opens the game
2. Main screen shows two prominent options:
   - "Play vs Computer" (existing functionality)
   - "Play vs Friend" (new functionality)
3. User selects desired mode

### Single-Player Flow (Unchanged)

1. Select "Play vs Computer"
2. Choose difficulty level
3. Choose disc color
4. Start playing against AI

### Multiplayer Flow (New)

1. Select "Play vs Friend"
2. Optional: Enter player names (default: "Player 1", "Player 2")
3. Choose disc colors for each player
4. Start game
5. Players alternate turns on the same device
6. Game ends with "Player X Wins!" message

### Settings Management

- **Single-player settings**: AI difficulty, player color preferences
- **Multiplayer settings**: Default player names, default color preferences
- **General settings**: Animations, sound, theme (apply to both modes)

## Acceptance Criteria

### Functional Requirements

- [ ] **FR-MP-001**: System MUST support game mode selection between single-player and multiplayer
- [ ] **FR-MP-002**: System MUST allow two human players to play alternating turns in multiplayer mode
- [ ] **FR-MP-003**: System MUST provide player name customization with sensible defaults
- [ ] **FR-MP-004**: System MUST allow independent disc color selection for each player
- [ ] **FR-MP-005**: System MUST display appropriate turn indicators for multiplayer mode
- [ ] **FR-MP-006**: System MUST detect and announce wins for Player 1 or Player 2
- [ ] **FR-MP-007**: System MUST maintain game history separately for single-player and multiplayer modes
- [ ] **FR-MP-008**: System MUST preserve multiplayer game state across page refreshes
- [ ] **FR-MP-009**: System MUST provide replay functionality for multiplayer games
- [ ] **FR-MP-010**: System MUST maintain all existing single-player functionality unchanged

### User Experience Requirements

- [ ] **UX-MP-001**: Game mode selection MUST be prominent and intuitive
- [ ] **UX-MP-002**: Multiplayer setup MUST be quick and optional (good defaults)
- [ ] **UX-MP-003**: Turn indicators MUST clearly show which player's turn it is
- [ ] **UX-MP-004**: Victory messages MUST clearly identify the winning player
- [ ] **UX-MP-005**: Settings MUST show only relevant options for the current mode
- [ ] **UX-MP-006**: History MUST clearly distinguish between game modes

### Technical Requirements

- [ ] **TECH-MP-001**: All multiplayer functionality MUST work offline
- [ ] **TECH-MP-002**: No network connectivity MUST be required
- [ ] **TECH-MP-003**: Existing single-player code MUST remain functional
- [ ] **TECH-MP-004**: Game state persistence MUST support both modes
- [ ] **TECH-MP-005**: Performance MUST remain consistent (60fps animations)
- [ ] **TECH-MP-006**: Memory usage MUST not significantly increase

## Testing Strategy

### Unit Tests

- Game mode selection logic
- Multiplayer turn management
- Player info validation
- Game state transitions for multiplayer
- Settings persistence for both modes

### Integration Tests

- Complete multiplayer game flow
- Mode switching functionality
- Settings dialog behavior per mode
- History tracking for both modes
- Replay functionality for multiplayer games

### User Acceptance Tests

- Two players can complete a full game
- Game mode selection is intuitive
- Player names and colors work correctly
- Victory conditions display properly
- Settings are preserved correctly
- History shows appropriate information

## Migration Strategy

### Backward Compatibility

- All existing single-player games continue to work
- Existing settings are preserved
- Game history remains accessible
- No breaking changes to existing APIs

### Data Migration

- Add `gameMode: 'SINGLE_PLAYER'` to existing game states
- Convert existing history entries to include game mode
- Extend settings with new multiplayer defaults
- Maintain existing persistence keys

### Rollout Plan

1. **Phase 1**: Implement core multiplayer types and logic
2. **Phase 2**: Add UI components for game mode selection
3. **Phase 3**: Implement multiplayer setup and gameplay
4. **Phase 4**: Add multiplayer-specific settings and history
5. **Phase 5**: Testing and refinement

## Risk Assessment

### Low Risk

- Game logic remains unchanged (same Connect Four rules)
- Existing single-player functionality preserved
- No network dependencies introduced

### Medium Risk

- UI complexity increases with mode-specific components
- Settings management becomes more complex
- Game state structure changes require careful migration

### Mitigation Strategies

- Comprehensive testing of both game modes
- Gradual rollout with feature flags if needed
- Extensive backward compatibility testing
- Clear user documentation for new features

## Success Metrics

### User Engagement

- Percentage of users who try multiplayer mode
- Average session length for multiplayer games
- Retention rate for users who play multiplayer

### Technical Performance

- No regression in single-player performance
- Multiplayer games complete without errors
- Settings and history persistence works reliably

### User Satisfaction

- Positive feedback on multiplayer experience
- Intuitive game mode selection
- Clear understanding of turn management

## Future Considerations

### Potential Enhancements

- Timer-based turns (optional)
- Tournament mode (best of N games)
- Player statistics tracking
- Custom disc designs per player
- Sound effects per player

### Technical Debt

- Consider refactoring Player type system for better extensibility
- Evaluate component architecture for mode-specific logic
- Review settings management for scalability

## Conclusion

This change proposal adds significant value to the Connect Four game by enabling social gameplay while maintaining the simplicity and offline-first approach that makes the current game successful. The implementation strategy preserves all existing functionality while providing a clear path for users to enjoy multiplayer experiences.

The proposed architecture minimizes technical risk by extending rather than replacing existing systems, ensuring a smooth transition for both users and developers.
