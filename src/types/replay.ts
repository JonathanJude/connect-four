/**
 * Replay Types
 * Type definitions for game replay functionality
 */

/**
 * Replay session state
 */
export interface ReplaySessionState {
  /** Current move index (0 = before first move) */
  currentMove: number
  /** Whether replay is currently playing */
  isPlaying: boolean
  /** Current playback speed */
  speed: ReplaySpeed
  /** Current timestamp for playback timing */
  currentTime: number
  /** Current board state */
  boardState: any
  /** Last move position */
  lastMove: { row: number; col: number } | null
  /** Winning line positions if game is won */
  winningLine: { row: number; col: number }[] | null
  /** Whether replay has reached the end */
  isComplete: boolean
}

/**
 * Playback speed options
 */
export type ReplaySpeed = '0.5x' | '1x' | '1.5x' | '2x' | '4x'

/**
 * Replay control interface
 */
export interface ReplayControls {
  /** Start playback */
  play: () => void
  /** Pause playback */
  pause: () => void
  /** Stop playback and reset to beginning */
  stop: () => void
  /** Seek to specific move */
  seek: (move: number) => void
  /** Move to next move */
  next: () => void
  /** Move to previous move */
  previous: () => void
  /** Set playback speed */
  setSpeed: (speed: ReplaySpeed) => void
  /** Get current state */
  getState: () => ReplaySessionState
}

/**
 * Replay event types
 */
export type ReplayEventType = 'MOVE' | 'PAUSE' | 'PLAY' | 'SEEK' | 'SPEED_CHANGE' | 'COMPLETE'

/**
 * Replay event interface
 */
export interface ReplayEvent {
  /** Unique event identifier */
  id: string
  /** Event type */
  type: ReplayEventType
  /** Event timestamp */
  timestamp: number
  /** Move index (for move events) */
  moveIndex?: number
  /** Event-specific data */
  data: any
}

/**
 * Replay session interface
 */
export interface ReplaySession {
  /** Unique session identifier */
  id: string
  /** Associated game ID */
  gameId: string
  /** Current session state */
  state: ReplaySessionState
  /** Playback controls */
  controls: ReplayControls
  /** Session metadata */
  metadata: {
    /** Session creation timestamp */
    createdAt: Date
    /** Last accessed timestamp */
    lastAccessed: Date
    /** Associated game data */
    gameData: any
  }
}

/**
 * Replay statistics
 */
export interface ReplayStats {
  totalSessions: number
  activeSessions: number
  completedSessions: number
  averageSessionDuration: number
  popularSpeeds: Record<ReplaySpeed, number>
}

/**
 * Replay configuration options
 */
export interface ReplayConfig {
  /** Default playback speed */
  defaultSpeed: ReplaySpeed
  /** Auto-play delay between moves (ms) */
  autoPlayDelay: number
  /** Maximum concurrent replay sessions */
  maxSessions: number
  /** Session inactivity timeout (ms) */
  sessionTimeout: number
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts: boolean
  /** Enable sound effects */
  enableSoundEffects: boolean
  /** Show move timestamps */
  showTimestamps: boolean
  /** Show board coordinates */
  showCoordinates: boolean
}

/**
 * Replay viewer component props
 */
export interface ReplayViewerProps {
  /** Replay session to display */
  session: ReplaySession
  /** Whether viewer is interactive */
  interactive?: boolean
  /** Show/hide controls */
  showControls?: boolean
  /** Show/hide timeline */
  showTimeline?: boolean
  /** Show/hide move list */
  showMoveList?: boolean
  /** Show/hide game info */
  showGameInfo?: boolean
  /** Custom CSS className */
  className?: string
  /** Callback when replay completes */
  onComplete?: () => void
  /** Callback when move changes */
  onMoveChange?: (move: number) => void
  /** Callback when playback state changes */
  onPlaybackChange?: (isPlaying: boolean) => void
}

/**
 * Replay controls component props
 */
export interface ReplayControlsProps {
  /** Replay session to control */
  session: ReplaySession
  /** Show/hide speed controls */
  showSpeed?: boolean
  /** Show/hide seek controls */
  showSeek?: boolean
  /** Show/hide step controls */
  showStep?: boolean
  /** Custom CSS className */
  className?: string
  /** Callback when controls are used */
  onControlUsed?: (action: string) => void
}

/**
 * Timeline component props
 */
export interface ReplayTimelineProps {
  /** Replay session */
  session: ReplaySession
  /** Show/hide timestamps */
  showTimestamps?: boolean
  /** Show/hide event markers */
  showEvents?: boolean
  /** Custom CSS className */
  className?: string
  /** Callback when timeline is clicked */
  onSeek?: (move: number) => void
}

/**
 * Move list component props
 */
export interface ReplayMoveListProps {
  /** Replay session */
  session: ReplaySession
  /** Show/hide player indicators */
  showPlayers?: boolean
  /** Show/hide move numbers */
  showMoveNumbers?: boolean
  /** Show/hide timestamps */
  showTimestamps?: boolean
  /** Custom CSS className */
  className?: string
  /** Callback when move is selected */
  onMoveSelect?: (move: number) => void
}

/**
 * Replay export options
 */
export interface ReplayExportOptions {
  /** Export format */
  format: 'json' | 'url' | 'shareable'
  /** Include session state */
  includeState?: boolean
  /** Include game metadata */
  includeMetadata?: boolean
  /** Include move timestamps */
  includeTimestamps?: boolean
  /** Include board states */
  includeBoardStates?: boolean
  /** Compress export data */
  compress?: boolean
}

/**
 * Replay import result
 */
export interface ReplayImportResult {
  /** Whether import was successful */
  success: boolean
  /** Imported session (if successful) */
  session?: ReplaySession
  /** Error message (if failed) */
  error?: string
  /** Validation warnings */
  warnings?: string[]
}