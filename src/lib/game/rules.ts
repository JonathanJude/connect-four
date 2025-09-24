/**
 * Game Rules Engine
 * Core game logic for Connect Four including move validation, win detection, and game state management
 */

import {
  type Board,
  type Move,
  type GameState,
  type Position,
  type WinningLine,
  type Player,
  type DiscColor,
  BOARD_ROWS,
  BOARD_COLUMNS,
  CONNECT_LENGTH,
  GameError,
  GameErrorCode,
  createEmptyBoard,
  isValidPosition,
  generateId,
} from './constants'

/**
 * Check if a move is valid for the given board state
 */
export function isValidMove(board: Board, column: number): boolean {
  // Check if column is within bounds
  if (column < 0 || column >= BOARD_COLUMNS) {
    return false
  }

  // Check if column has space (top cell is empty)
  return board.grid[0][column] === null
}

/**
 * Get all legal moves for the current board state
 */
export function getLegalMoves(board: Board): number[] {
  const moves: number[] = []

  for (let col = 0; col < BOARD_COLUMNS; col++) {
    if (isValidMove(board, col)) {
      moves.push(col)
    }
  }

  return moves
}

/**
 * Apply a move to the board and return the new board state
 */
export function applyMove(board: Board, move: Move, playerDisc: DiscColor, aiDisc: DiscColor): Board {
  if (!isValidMove(board, move.column)) {
    throw new GameError('Invalid move', 'INVALID_MOVE', { column: move.column })
  }

  // Create a deep copy of the board
  const newGrid = board.grid.map(row => [...row])

  // Find the lowest empty row in the column
  let targetRow = BOARD_ROWS - 1
  while (targetRow >= 0 && newGrid[targetRow][move.column] !== null) {
    targetRow--
  }

  // Place the disc
  newGrid[targetRow][move.column] = move.player === 'HUMAN' ? playerDisc : aiDisc

  // Update the move with the correct row
  move.row = targetRow

  return {
    ...board,
    grid: newGrid,
  }
}

/**
 * Check for a winner in the current board state
 */
export function checkWinner(gameState: GameState): { winner: Player | null; winningLine?: WinningLine } {
  const { board, playerDisc, aiDisc } = gameState

  // Check all possible positions for a winning line
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      const disc = board.grid[row][col]
      if (!disc) continue

      // Determine which player this disc belongs to
      const player = disc === playerDisc ? 'HUMAN' : 'AI'

      // Check all four directions from this position
      const directions = [
        { dr: 0, dc: 1, name: 'horizontal' as const },  // Horizontal
        { dr: 1, dc: 0, name: 'vertical' as const },    // Vertical
        { dr: 1, dc: 1, name: 'diagonal-down' as const }, // Diagonal down-right
        { dr: 1, dc: -1, name: 'diagonal-up' as const }, // Diagonal up-right
      ]

      for (const { dr, dc, name } of directions) {
        const line = checkLineFromPosition(board, row, col, dr, dc)
        if (line && line.length >= CONNECT_LENGTH) {
          return {
            winner: player,
            winningLine: {
              start: { row, column: col },
              end: {
                row: row + dr * (CONNECT_LENGTH - 1),
                column: col + dc * (CONNECT_LENGTH - 1)
              },
              direction: name,
            },
          }
        }
      }
    }
  }

  return { winner: null }
}

/**
 * Check if there's a winning line starting from a given position in a given direction
 */
function checkLineFromPosition(
  board: Board,
  startRow: number,
  startCol: number,
  deltaRow: number,
  deltaCol: number
): { row: number; col: number; disc: DiscColor }[] | null {
  const disc = board.grid[startRow][startCol]
  if (!disc) return null

  const line = [{ row: startRow, col: startCol, disc }]

  // Check in the positive direction
  let row = startRow + deltaRow
  let col = startCol + deltaCol
  while (
    row >= 0 && row < BOARD_ROWS &&
    col >= 0 && col < BOARD_COLUMNS &&
    board.grid[row][col] === disc
  ) {
    line.push({ row, col, disc })
    row += deltaRow
    col += deltaCol
  }

  // Check in the negative direction
  row = startRow - deltaRow
  col = startCol - deltaCol
  while (
    row >= 0 && row < BOARD_ROWS &&
    col >= 0 && col < BOARD_COLUMNS &&
    board.grid[row][col] === disc
  ) {
    line.unshift({ row, col, disc })
    row -= deltaRow
    col -= deltaCol
  }

  // Debug logging to see what's happening
  if (line.length >= CONNECT_LENGTH) {
    console.log('🏆 WINNING LINE DETECTED:', {
      disc,
      lineLength: line.length,
      connectLength: CONNECT_LENGTH,
      line: line.map(l => `(${l.row},${l.col})`),
      direction: `dr:${deltaRow}, dc:${deltaCol}`
    });
  }

  return line.length >= CONNECT_LENGTH ? line : null
}

/**
 * Check if the game is a draw (board is full with no winner)
 */
export function isDraw(gameState: GameState): boolean {
  // If there's a winner, it's not a draw
  const { winner } = checkWinner(gameState)
  if (winner) return false

  // Check if top row is completely filled
  return gameState.board.grid[0].every(cell => cell !== null)
}

/**
 * Create a new game state
 */
export function createGameState(
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  playerDisc: DiscColor = 'red'
): GameState {
  const aiDisc = playerDisc === 'red' ? 'yellow' : 'red'

  return {
    id: generateId(),
    board: createEmptyBoard(),
    currentPlayer: 'HUMAN',
    status: 'IN_PROGRESS',
    moves: [],
    difficulty,
    playerDisc,
    aiDisc,
    startedAt: new Date(),
  }
}

/**
 * Update game state after a move
 */
export function updateGameStateAfterMove(
  gameState: GameState,
  move: Move
): GameState {
  // Apply the move to get new board state
  const newBoard = applyMove(gameState.board, move, gameState.playerDisc, gameState.aiDisc)

  // Add move to moves array
  const newMoves = [...gameState.moves, move]

  // Check for winner
  const { winner, winningLine } = checkWinner({ ...gameState, board: newBoard, moves: newMoves })

  // Check for draw
  const draw = winner ? false : isDraw({ ...gameState, board: newBoard, moves: newMoves })

  // Determine new game status
  let status: GameStatus = 'IN_PROGRESS'
  if (winner === 'HUMAN') status = 'HUMAN_WIN'
  else if (winner === 'AI') status = 'AI_WIN'
  else if (draw) status = 'DRAW'

  // Determine next player
  const currentPlayer = winner || draw ? gameState.currentPlayer : getOppositePlayer(gameState.currentPlayer)

  return {
    ...gameState,
    board: newBoard,
    currentPlayer,
    status,
    moves: newMoves,
    winner,
    winningLine,
    endedAt: (winner || draw) ? new Date() : undefined,
  }
}

/**
 * Get the opposite player
 */
function getOppositePlayer(player: Player): Player {
  return player === 'HUMAN' ? 'AI' : 'HUMAN'
}

/**
 * Validate a game state
 */
export function validateGameState(gameState: GameState): void {
  // Validate board dimensions
  if (gameState.board.rows !== BOARD_ROWS || gameState.board.columns !== BOARD_COLUMNS) {
    throw new GameError('Invalid board dimensions', 'INVALID_MOVE')
  }

  // Validate current player
  if (gameState.currentPlayer !== 'HUMAN' && gameState.currentPlayer !== 'AI') {
    throw new GameError('Invalid current player', 'INVALID_MOVE')
  }

  // Validate game status
  if (gameState.status === 'IN_PROGRESS' && (gameState.winner || gameState.endedAt)) {
    throw new GameError('Inconsistent game state', 'INVALID_MOVE')
  }

  // Validate moves are consistent with board state
  // This is a simplified check - in production you might want full state reconstruction
  if (gameState.moves.length > 0 && gameState.status === 'IN_PROGRESS') {
    const lastMove = gameState.moves[gameState.moves.length - 1]
    if (lastMove.player === gameState.currentPlayer) {
      throw new GameError('Current player should not match last move player', 'INVALID_MOVE')
    }
  }
}

/**
 * Reset a game to initial state
 */
export function resetGame(gameState: GameState): GameState {
  return {
    ...gameState,
    board: createEmptyBoard(),
    currentPlayer: 'HUMAN',
    status: 'IN_PROGRESS',
    moves: [],
    winner: undefined,
    winningLine: undefined,
    endedAt: undefined,
    startedAt: new Date(),
  }
}

/**
 * Get the disc color for a given player
 */
export function getDiscColorForPlayer(
  gameState: GameState,
  player: Player
): DiscColor {
  return player === 'HUMAN' ? gameState.playerDisc : gameState.aiDisc
}