# Game Modes Capability

## ADDED Requirements

### REQ-GM-001: Game Mode Selection

The system MUST provide users with the ability to choose between single-player and multiplayer game modes.

#### Scenario: User selects single-player mode

- **WHEN** the user is on the main game screen
- **AND** the user selects "Play vs Computer" option
- **THEN** the system MUST initialize a single-player game with AI opponent
- **AND** the system MUST show AI difficulty selection options
- **AND** the system MUST allow player disc color selection

#### Scenario: User selects multiplayer mode

- **WHEN** the user is on the main game screen
- **AND** the user selects "Play vs Friend" option
- **THEN** the system MUST initialize a multiplayer setup dialog
- **AND** the system MUST provide player name input fields with defaults "Player 1" and "Player 2"
- **AND** the system MUST allow disc color selection for each player

### REQ-GM-002: Multiplayer Game Flow

The system MUST support two human players taking alternating turns on the same device.

#### Scenario: Multiplayer game turn management

- **WHEN** a multiplayer game is in progress
- **AND** it is Player 1's turn
- **THEN** the system MUST display "Player 1's Turn" indicator
- **AND** the system MUST accept input only from Player 1
- **WHEN** Player 1 makes a valid move
- **THEN** the system MUST switch to Player 2's turn
- **AND** the system MUST display "Player 2's Turn" indicator

#### Scenario: Multiplayer game victory

- **WHEN** a multiplayer game is in progress
- **AND** Player 1 achieves four consecutive discs
- **THEN** the system MUST display "Player 1 Wins!" message
- **AND** the system MUST highlight the winning line
- **AND** the system MUST record the victory in game history

### REQ-GM-003: Game Mode Persistence

The system MUST maintain separate game states and settings for each game mode.

#### Scenario: Game mode state persistence

- **WHEN** the user is playing a single-player game
- **AND** the user switches to multiplayer mode
- **THEN** the system MUST preserve the single-player game state
- **AND** the system MUST initialize a new multiplayer game state
- **WHEN** the user switches back to single-player mode
- **THEN** the system MUST restore the previous single-player game state

#### Scenario: Settings persistence per mode

- **WHEN** the user has configured single-player settings (AI difficulty, colors)
- **AND** the user switches to multiplayer mode
- **THEN** the system MUST show multiplayer-specific settings (player names, colors)
- **AND** the system MUST preserve single-player settings separately

### REQ-GM-004: Game History Tracking

The system MUST track game history separately for single-player and multiplayer modes.

#### Scenario: Multiplayer game history tracking

- **WHEN** a multiplayer game has been completed
- **AND** the user views game history
- **THEN** the system MUST display the game mode indicator
- **AND** the system MUST show player names used in the game
- **AND** the system MUST indicate which player won or if it was a draw

#### Scenario: Game history filtering

- **WHEN** the user has played both single-player and multiplayer games
- **AND** the user views game history
- **THEN** the system MUST provide filtering options by game mode
- **AND** the system MUST allow viewing single-player games only
- **AND** the system MUST allow viewing multiplayer games only

### REQ-GM-005: Replay System

The system MUST support replay functionality for both single-player and multiplayer games.

#### Scenario: Multiplayer game replay

- **WHEN** a completed multiplayer game is in history
- **AND** the user selects replay for that game
- **THEN** the system MUST show player names and colors used
- **AND** the system MUST replay moves with appropriate turn indicators
- **AND** the system MUST maintain the same playback controls as single-player replays
