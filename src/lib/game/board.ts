/**
 * Board Utilities
 * Comprehensive board manipulation and analysis utilities for Connect Four
 */

import {
  type Board,
  type Position,
  type DiscColor,
  BOARD_ROWS,
  BOARD_COLUMNS,
  CONNECT_LENGTH,
  createEmptyBoard,
  isValidPosition,
  generateId,
} from './constants'

/**
 * Create a deep copy of a board
 */
export function cloneBoard(board: Board): Board {
  return {
    ...board,
    grid: board.grid.map(row => [...row]),
  }
}

/**
 * Check if a position on the board is occupied
 */
export function isPositionOccupied(board: Board, position: Position): boolean {
  if (!isValidPosition(position)) {
    return false
  }
  return board.grid[position.row][position.column] !== null
}

/**
 * Get the disc color at a specific position
 */
export function getDiscAtPosition(board: Board, position: Position): DiscColor | null {
  if (!isValidPosition(position)) {
    return null
  }
  return board.grid[position.row][position.column]
}

/**
 * Find the lowest empty row in a column
 */
export function findLowestEmptyRow(board: Board, column: number): number | null {
  if (column < 0 || column >= BOARD_COLUMNS) {
    return null
  }

  // Start from the bottom and work up
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    if (board.grid[row][column] === null) {
      return row
    }
  }

  // Column is full
  return null
}

/**
 * Check if a column is full
 */
export function isColumnFull(board: Board, column: number): boolean {
  return findLowestEmptyRow(board, column) === null
}

/**
 * Check if the entire board is full
 */
export function isBoardFull(board: Board): boolean {
  // Check top row - if any cell is empty, board is not full
  return board.grid[0].every(cell => cell !== null)
}

/**
 * Count the number of discs on the board for a specific player
 */
export function countDiscs(board: Board, discColor: DiscColor): number {
  let count = 0
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      if (board.grid[row][col] === discColor) {
        count++
      }
    }
  }
  return count
}

/**
 * Get all occupied positions for a specific disc color
 */
export function getPositionsForDisc(board: Board, discColor: DiscColor): Position[] {
  const positions: Position[] = []

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      if (board.grid[row][col] === discColor) {
        positions.push({ row, column: col })
      }
    }
  }

  return positions
}

/**
 * Get all valid moves (columns that can accept a disc)
 */
export function getValidMoves(board: Board): number[] {
  const moves: number[] = []

  for (let col = 0; col < BOARD_COLUMNS; col++) {
    if (!isColumnFull(board, col)) {
      moves.push(col)
    }
  }

  return moves
}

/**
 * Place a disc at the lowest available position in a column
 */
export function placeDisc(board: Board, column: number, discColor: DiscColor): Board {
  const row = findLowestEmptyRow(board, column)
  if (row === null) {
    throw new Error(`Column ${column} is full`)
  }

  const newBoard = cloneBoard(board)
  newBoard.grid[row][column] = discColor

  return newBoard
}

/**
 * Remove the top disc from a column (useful for AI simulation)
 */
export function removeTopDisc(board: Board, column: number): Board {
  if (column < 0 || column >= BOARD_COLUMNS) {
    throw new Error(`Invalid column: ${column}`)
  }

  const newBoard = cloneBoard(board)

  // Find the highest disc in the column
  for (let row = 0; row < BOARD_ROWS; row++) {
    if (newBoard.grid[row][column] !== null) {
      newBoard.grid[row][column] = null
      break
    }
  }

  return newBoard
}

/**
 * Count consecutive discs in a line starting from a position
 */
export function countConsecutiveInLine(
  board: Board,
  position: Position,
  deltaRow: number,
  deltaCol: number,
  discColor: DiscColor
): number {
  if (!isValidPosition(position)) {
    return 0
  }

  const disc = getDiscAtPosition(board, position)
  if (disc !== discColor) {
    return 0
  }

  let count = 1 // Count the starting position

  // Count in the positive direction
  let row = position.row + deltaRow
  let col = position.column + deltaCol
  while (
    row >= 0 && row < BOARD_ROWS &&
    col >= 0 && col < BOARD_COLUMNS &&
    board.grid[row][col] === discColor
  ) {
    count++
    row += deltaRow
    col += deltaCol
  }

  // Count in the negative direction
  row = position.row - deltaRow
  col = position.column - deltaCol
  while (
    row >= 0 && row < BOARD_ROWS &&
    col >= 0 && col < BOARD_COLUMNS &&
    board.grid[row][col] === discColor
  ) {
    count++
    row -= deltaRow
    col -= deltaCol
  }

  return count
}

/**
 * Check if a position creates a winning opportunity
 */
export function createsWinningOpportunity(
  board: Board,
  position: Position,
  discColor: DiscColor
): boolean {
  if (!isValidPosition(position) || isPositionOccupied(board, position)) {
    return false
  }

  const tempBoard = cloneBoard(board)
  tempBoard.grid[position.row][position.column] = discColor

  const directions = [
    { dr: 0, dc: 1 },   // Horizontal
    { dr: 1, dc: 0 },   // Vertical
    { dr: 1, dc: 1 },   // Diagonal down-right
    { dr: 1, dc: -1 },  // Diagonal up-right
  ]

  for (const { dr, dc } of directions) {
    const consecutive = countConsecutiveInLine(tempBoard, position, dr, dc, discColor)
    if (consecutive >= CONNECT_LENGTH) {
      return true
    }
  }

  return false
}

/**
 * Check if a position blocks an opponent's winning opportunity
 */
export function blocksOpponentWin(
  board: Board,
  position: Position,
  playerDisc: DiscColor
): boolean {
  const opponentDisc = playerDisc === 'red' ? 'yellow' : 'red'
  return createsWinningOpportunity(board, position, opponentDisc)
}

/**
 * Get all positions that would create a winning opportunity
 */
export function getWinningOpportunities(board: Board, discColor: DiscColor): Position[] {
  const opportunities: Position[] = []

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      const position = { row, column: col }
      if (!isPositionOccupied(board, position) && createsWinningOpportunity(board, position, discColor)) {
        opportunities.push(position)
      }
    }
  }

  return opportunities
}

/**
 * Calculate board symmetry score (for AI evaluation)
 */
export function calculateBoardSymmetry(board: Board): number {
  let symmetryScore = 0
  const centerCol = Math.floor(BOARD_COLUMNS / 2)

  // Check horizontal symmetry around center column
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < centerCol; col++) {
      const mirrorCol = BOARD_COLUMNS - 1 - col
      if (board.grid[row][col] === board.grid[row][mirrorCol]) {
        symmetryScore++
      }
    }
  }

  return symmetryScore
}

/**
 * Calculate center control score (for AI evaluation)
 */
export function calculateCenterControl(board: Board, discColor: DiscColor): number {
  let centerScore = 0
  const centerCol = Math.floor(BOARD_COLUMNS / 2)
  const weight = [1, 2, 3, 4, 3, 2, 1] // Center column gets highest weight

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      if (board.grid[row][col] === discColor) {
        centerScore += weight[col]
      }
    }
  }

  return centerScore
}

/**
 * Convert board to a compact string representation (for storage)
 */
export function boardToString(board: Board): string {
  const chars: string[] = []

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      const disc = board.grid[row][col]
      if (disc === 'red') {
        chars.push('R')
      } else if (disc === 'yellow') {
        chars.push('Y')
      } else {
        chars.push('_')
      }
    }
  }

  return chars.join('')
}

/**
 * Create board from string representation
 */
export function boardFromString(boardString: string): Board {
  if (boardString.length !== BOARD_ROWS * BOARD_COLUMNS) {
    throw new Error(`Invalid board string length: ${boardString.length}`)
  }

  const board = createEmptyBoard()
  let index = 0

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      const char = boardString[index++]
      if (char === 'R') {
        board.grid[row][col] = 'red'
      } else if (char === 'Y') {
        board.grid[row][col] = 'yellow'
      } else {
        board.grid[row][col] = null
      }
    }
  }

  return board
}

/**
 * Get board state hash (for move history and caching)
 */
export function getBoardHash(board: Board): string {
  // Use simple string hash for now
  return boardToString(board)
}

/**
 * Validate board state consistency
 */
export function validateBoard(board: Board): boolean {
  // Check dimensions
  if (board.rows !== BOARD_ROWS || board.columns !== BOARD_COLUMNS) {
    return false
  }

  // Check grid dimensions
  if (board.grid.length !== BOARD_ROWS) {
    return false
  }

  for (let row = 0; row < BOARD_ROWS; row++) {
    if (board.grid[row].length !== BOARD_COLUMNS) {
      return false
    }

    // Check that discs stack properly (no floating discs)
    let foundEmpty = false
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      if (board.grid[row][col] === null) {
        foundEmpty = true
      } else if (foundEmpty && board.grid[row][col] !== null) {
        // Found a disc above an empty space
        return false
      }
    }
  }

  return true
}

/**
 * Get all positions that are part of potential winning lines
 */
export function getThreatPositions(board: Board, discColor: DiscColor): Position[] {
  const threats: Position[] = []
  const opponentDisc = discColor === 'red' ? 'yellow' : 'red'

  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      const position = { row, column: col }

      if (!isPositionOccupied(board, position)) {
        const directions = [
          { dr: 0, dc: 1 },   // Horizontal
          { dr: 1, dc: 0 },   // Vertical
          { dr: 1, dc: 1 },   // Diagonal down-right
          { dr: 1, dc: -1 },  // Diagonal up-right
        ]

        for (const { dr, dc } of directions) {
          // Temporarily place disc and check if it creates a threat
          const tempBoard = cloneBoard(board)
          tempBoard.grid[row][col] = discColor

          const consecutive = countConsecutiveInLine(tempBoard, position, dr, dc, discColor)
          if (consecutive === CONNECT_LENGTH - 1) {
            threats.push(position)
            break
          }
        }
      }
    }
  }

  return threats
}