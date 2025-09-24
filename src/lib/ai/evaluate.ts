/**
 * AI Evaluation Heuristics
 * Core evaluation functions for Connect Four AI decision making
 */

import {
  type Board,
  type DiscColor,
  BOARD_ROWS,
  BOARD_COLUMNS,
  CONNECT_LENGTH,
} from '../game/constants'
import {
  cloneBoard,
  getPositionsForDisc,
  countConsecutiveInLine,
  getWinningOpportunities,
  calculateCenterControl,
  calculateBoardSymmetry,
  getThreatPositions,
} from '../game/board'

/**
 * Evaluation score weights for different board features
 */
const EVALUATION_WEIGHTS = {
  WIN: 100000,
  WIN_OPPORTUNITY: 10000,
  BLOCK_OPPONENT_WIN: 8000,
  THREE_IN_A_ROW: 1000,
  TWO_IN_A_ROW: 100,
  CENTER_CONTROL: 50,
  SYMMETRY: 10,
  THREAT_BLOCKING: 500,
} as const

/**
 * Evaluate a board position for a given player
 * Returns a score where positive is good for the player, negative is good for opponent
 */
export function evaluateBoard(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  let score = 0

  // Check for immediate win/loss
  const winScore = evaluateWinConditions(board, playerDisc, opponentDisc)
  if (Math.abs(winScore) >= EVALUATION_WEIGHTS.WIN) {
    return winScore
  }

  // Evaluate opportunities and threats
  score += evaluateOpportunities(board, playerDisc, opponentDisc)
  score += evaluateThreats(board, playerDisc, opponentDisc)
  score += evaluatePatterns(board, playerDisc, opponentDisc)
  score += evaluatePositionalAdvantage(board, playerDisc, opponentDisc)

  return score
}

/**
 * Evaluate immediate win/loss conditions
 */
function evaluateWinConditions(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  // Check if player can win immediately
  const playerWinOpportunities = getWinningOpportunities(board, playerDisc)
  if (playerWinOpportunities.length > 0) {
    return EVALUATION_WEIGHTS.WIN
  }

  // Check if opponent can win immediately
  const opponentWinOpportunities = getWinningOpportunities(board, opponentDisc)
  if (opponentWinOpportunities.length > 0) {
    return -EVALUATION_WEIGHTS.WIN
  }

  return 0
}

/**
 * Evaluate winning opportunities and blocking opportunities
 */
function evaluateOpportunities(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  let score = 0

  // Player's winning opportunities
  const playerOpportunities = getWinningOpportunities(board, playerDisc)
  score += playerOpportunities.length * EVALUATION_WEIGHTS.WIN_OPPORTUNITY

  // Block opponent's winning opportunities
  const opponentOpportunities = getWinningOpportunities(board, opponentDisc)
  score += opponentOpportunities.length * EVALUATION_WEIGHTS.BLOCK_OPPONENT_WIN

  return score
}

/**
 * Evaluate threats and potential threats
 */
function evaluateThreats(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  let score = 0

  // Player's threats (positions that could lead to wins)
  const playerThreats = getThreatPositions(board, playerDisc)
  score += playerThreats.length * EVALUATION_WEIGHTS.THREAT_BLOCKING

  // Block opponent's threats
  const opponentThreats = getThreatPositions(board, opponentDisc)
  score += opponentThreats.length * EVALUATION_WEIGHTS.THREAT_BLOCKING

  return score
}

/**
 * Evaluate patterns (2-in-a-row, 3-in-a-row, etc.)
 */
function evaluatePatterns(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  let score = 0

  // Evaluate player patterns
  score += evaluatePlayerPatterns(board, playerDisc)

  // Evaluate opponent patterns (defensive evaluation)
  score -= evaluatePlayerPatterns(board, opponentDisc) * 0.8 // Slightly less weight for defense

  return score
}

/**
 * Evaluate patterns for a specific player
 */
function evaluatePlayerPatterns(board: Board, discColor: DiscColor): number {
  let score = 0
  const positions = getPositionsForDisc(board, discColor)

  for (const position of positions) {
    // Check all four directions for patterns
    const directions = [
      { dr: 0, dc: 1 },   // Horizontal
      { dr: 1, dc: 0 },   // Vertical
      { dr: 1, dc: 1 },   // Diagonal down-right
      { dr: 1, dc: -1 },  // Diagonal up-right
    ]

    for (const { dr, dc } of directions) {
      const consecutive = countConsecutiveInLine(board, position, dr, dc, discColor)

      // Score based on length of consecutive discs
      if (consecutive >= 3) {
        score += EVALUATION_WEIGHTS.THREE_IN_A_ROW
      } else if (consecutive >= 2) {
        score += EVALUATION_WEIGHTS.TWO_IN_A_ROW
      }
    }
  }

  return score
}

/**
 * Evaluate positional advantages (center control, symmetry, etc.)
 */
function evaluatePositionalAdvantage(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  let score = 0

  // Center control is valuable in Connect Four
  const playerCenterControl = calculateCenterControl(board, playerDisc)
  const opponentCenterControl = calculateCenterControl(board, opponentDisc)
  score += (playerCenterControl - opponentCenterControl) * EVALUATION_WEIGHTS.CENTER_CONTROL

  // Board symmetry can be advantageous
  const playerSymmetry = calculateBoardSymmetry(board)
  score += playerSymmetry * EVALUATION_WEIGHTS.SYMMETRY

  return score
}

/**
 * Evaluate a specific move for its potential value
 */
export function evaluateMove(
  board: Board,
  column: number,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  // Create a copy of the board and simulate the move
  const testBoard = cloneBoard(board)

  // Find the lowest empty row in the column
  let targetRow = BOARD_ROWS - 1
  while (targetRow >= 0 && testBoard.grid[targetRow]![column] !== null) {
    targetRow--
  }

  if (targetRow < 0) {
    return -Infinity // Column is full
  }

  // Place the disc
  testBoard.grid[targetRow]![column] = playerDisc

  // Evaluate the resulting board position
  return evaluateBoard(testBoard, playerDisc, opponentDisc)
}

/**
 * Get all possible moves with their evaluation scores
 */
export function getMoveEvaluations(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): Array<{ column: number; score: number }> {
  const evaluations: Array<{ column: number; score: number }> = []

  for (let col = 0; col < BOARD_COLUMNS; col++) {
    // Check if column is valid (not full)
    if (board.grid[0]![col] === null) {
      const score = evaluateMove(board, col, playerDisc, opponentDisc)
      evaluations.push({ column: col, score })
    }
  }

  // Sort by score (descending)
  evaluations.sort((a, b) => b.score - a.score)

  return evaluations
}

/**
 * Check if a player has won immediately (4 in a row)
 */
function checkForImmediateWin(board: Board, discColor: DiscColor): boolean {
  const grid = board.grid
  const rows = board.rows
  const cols = board.columns

  // Check horizontal
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols - CONNECT_LENGTH; col++) {
      if (grid[row]![col] === discColor &&
          grid[row]![col + 1] === discColor &&
          grid[row]![col + 2] === discColor &&
          grid[row]![col + 3] === discColor) {
        return true
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= rows - CONNECT_LENGTH; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row]![col] === discColor &&
          grid[row + 1]![col] === discColor &&
          grid[row + 2]![col] === discColor &&
          grid[row + 3]![col] === discColor) {
        return true
      }
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= rows - CONNECT_LENGTH; row++) {
    for (let col = 0; col <= cols - CONNECT_LENGTH; col++) {
      if (grid[row]![col] === discColor &&
          grid[row + 1]![col + 1] === discColor &&
          grid[row + 2]![col + 2] === discColor &&
          grid[row + 3]![col + 3] === discColor) {
        return true
      }
    }
  }

  // Check diagonal (top-right to bottom-left)
  for (let row = 0; row <= rows - CONNECT_LENGTH; row++) {
    for (let col = CONNECT_LENGTH - 1; col < cols; col++) {
      if (grid[row]![col] === discColor &&
          grid[row + 1]![col - 1] === discColor &&
          grid[row + 2]![col - 2] === discColor &&
          grid[row + 3]![col - 3] === discColor) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if a move creates a forced win sequence
 */
export function isForcedWin(
  board: Board,
  column: number,
  playerDisc: DiscColor,
  opponentDisc: DiscColor,
  depth: number = 3
): boolean {
  const testBoard = cloneBoard(board)

  // Apply the move
  let targetRow = BOARD_ROWS - 1
  while (targetRow >= 0 && testBoard.grid[targetRow]![column] !== null) {
    targetRow--
  }

  if (targetRow < 0) {
    return false
  }

  testBoard.grid[targetRow]![column] = playerDisc

  // Check if this creates an immediate win by checking for 4 in a row
  if (checkForImmediateWin(testBoard, playerDisc)) {
    return true
  }

  // If depth > 0, check if all opponent responses lead to player wins
  if (depth > 0) {
    const opponentMoves = getMoveEvaluations(testBoard, opponentDisc, playerDisc)

    // Check if any opponent move prevents a forced win
    for (const move of opponentMoves) {
      const opponentBoard = cloneBoard(testBoard)
      let opponentTargetRow = BOARD_ROWS - 1
      while (opponentTargetRow >= 0 && opponentBoard.grid[opponentTargetRow]![move.column] !== null) {
        opponentTargetRow--
      }

      if (opponentTargetRow >= 0) {
        opponentBoard.grid[opponentTargetRow]![move.column] = opponentDisc

        // Check if player can still force a win from this position
        const playerResponses = getMoveEvaluations(opponentBoard, playerDisc, opponentDisc)
        let canStillForceWin = false

        for (const response of playerResponses) {
          if (isForcedWin(opponentBoard, response.column, playerDisc, opponentDisc, depth - 1)) {
            canStillForceWin = true
            break
          }
        }

        if (!canStillForceWin) {
          return false // Opponent can prevent the forced win
        }
      }
    }

    return true // All opponent responses lead to player wins
  }

  return false
}

/**
 * Calculate the relative strength of a board position
 * Returns a value between -1 (worst) and 1 (best)
 */
export function calculatePositionStrength(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  const score = evaluateBoard(board, playerDisc, opponentDisc)

  // Normalize the score to a range between -1 and 1
  const maxPossibleScore = EVALUATION_WEIGHTS.WIN * 2
  return Math.max(-1, Math.min(1, score / maxPossibleScore))
}

/**
 * Evaluate endgame scenarios (when board is nearly full)
 */
export function evaluateEndgame(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): number {
  let score = 0
  const emptyCells = countEmptyCells(board)

  // In endgame, immediate wins/blocks are even more valuable
  if (emptyCells <= 10) {
    const winMultiplier = 1 + (10 - emptyCells) * 0.1
    score += evaluateWinConditions(board, playerDisc, opponentDisc) * winMultiplier
  }

  return score
}

/**
 * Count empty cells on the board
 */
function countEmptyCells(board: Board): number {
  let count = 0
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLUMNS; col++) {
      if (board.grid[row]![col] === null) {
        count++
      }
    }
  }
  return count
}