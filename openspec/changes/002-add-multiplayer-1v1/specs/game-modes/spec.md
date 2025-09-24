# Game Modes Capability

## ADDED Requirements

### REQ-GM-001: Game Mode Selection

The system MUST provide users with the ability to choose between single-player and multiplayer game modes.

#### Scenario: User selects single-player mode

**Given** the user is on the main game screen  
**When** the user selects "Play vs Computer" option  
**Then** the system MUST initialize a single-player game with AI opponent  
**And** the system MUST show AI difficulty selection options  
**And** the system MUST allow player disc color selection

#### Scenario: User selects multiplayer mode

**Given** the user is on the main game screen  
**When** the user selects "Play vs Friend" option  
**Then** the system MUST initialize a multiplayer setup dialog  
**And** the system MUST provide player name input fields with defaults "Player 1" and "Player 2"  
**And** the system MUST allow disc color selection for each player

### REQ-GM-002: Multiplayer Game Flow

The system MUST support two human players taking alternating turns on the same device.

#### Scenario: Multiplayer game turn management

**Given** a multiplayer game is in progress  
**When** it is Player 1's turn  
**Then** the system MUST display "Player 1's Turn" indicator  
**And** the system MUST accept input only from Player 1  
**When** Player 1 makes a valid move  
**Then** the system MUST switch to Player 2's turn  
**And** the system MUST display "Player 2's Turn" indicator

#### Scenario: Multiplayer game victory

**Given** a multiplayer game is in progress  
**When** Player 1 achieves four consecutive discs  
**Then** the system MUST display "Player 1 Wins!" message  
**And** the system MUST highlight the winning line  
**And** the system MUST record the victory in game history

### REQ-GM-003: Game Mode Persistence

The system MUST maintain separate game states and settings for each game mode.

#### Scenario: Game mode state persistence

**Given** the user is playing a single-player game  
**When** the user switches to multiplayer mode  
**Then** the system MUST preserve the single-player game state  
**And** the system MUST initialize a new multiplayer game state  
**When** the user switches back to single-player mode  
**Then** the system MUST restore the previous single-player game state

#### Scenario: Settings persistence per mode

**Given** the user has configured single-player settings (AI difficulty, colors)  
**When** the user switches to multiplayer mode  
**Then** the system MUST show multiplayer-specific settings (player names, colors)  
**And** the system MUST preserve single-player settings separately

## MODIFIED Requirements

### REQ-GM-004: Enhanced Game History

The system MUST track game history separately for single-player and multiplayer modes.

#### Scenario: Multiplayer game history tracking

**Given** a multiplayer game has been completed  
**When** the user views game history  
**Then** the system MUST display the game mode indicator  
**And** the system MUST show player names used in the game  
**And** the system MUST indicate which player won or if it was a draw

#### Scenario: Game history filtering

**Given** the user has played both single-player and multiplayer games  
**When** the user views game history  
**Then** the system MUST provide filtering options by game mode  
**And** the system MUST allow viewing single-player games only  
**And** the system MUST allow viewing multiplayer games only

### REQ-GM-005: Enhanced Replay System

The system MUST support replay functionality for both single-player and multiplayer games.

#### Scenario: Multiplayer game replay

**Given** a completed multiplayer game in history  
**When** the user selects replay for that game  
**Then** the system MUST show player names and colors used  
**And** the system MUST replay moves with appropriate turn indicators  
**And** the system MUST maintain the same playback controls as single-player replays
