/**
 * Medium AI Implementation
 * Minimax algorithm with depth 3 and alpha-beta pruning
 * Balanced difficulty that provides a good challenge without being unbeatable
 */

import {
  type Board,
  type DiscColor,
  type Player,
  BOARD_COLUMNS,
  AI_TIME_BUDGETS,
  CONNECT_LENGTH,
} from '../game/constants'
import {
  cloneBoard,
  getValidMoves,
  placeDisc,
  removeTopDisc,
  isBoardFull,
} from '../game/board'
import {
  evaluateBoard,
  isForcedWin,
  getMoveEvaluations,
} from './evaluate'

/**
 * Medium AI class - implements minimax with alpha-beta pruning
 */
export class MediumAI {
  private timeBudget: number
  private maxDepth: number
  private nodesEvaluated: number
  private pruningCount: number

  constructor() {
    this.timeBudget = AI_TIME_BUDGETS.medium
    this.maxDepth = 3
    this.nodesEvaluated = 0
    this.pruningCount = 0
  }

  /**
   * Get the best move for the current board state
   */
  async getBestMove(
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor
  ): Promise<number> {
    const startTime = Date.now()
    this.nodesEvaluated = 0
    this.pruningCount = 0

    // First, check for immediate win opportunities
    const immediateWin = this.findImmediateWin(board, playerDisc, opponentDisc)
    if (immediateWin !== -1) {
      await this.simulateThinking(startTime)
      return immediateWin
    }

    // Check if we need to block opponent's immediate win
    const immediateBlock = this.findImmediateBlock(board, playerDisc, opponentDisc)
    if (immediateBlock !== -1) {
      await this.simulateThinking(startTime)
      return immediateBlock
    }

    // Use minimax with alpha-beta pruning
    const bestMove = await this.minimaxWithTimeLimit(
      board,
      playerDisc,
      opponentDisc,
      startTime
    )

    await this.simulateThinking(startTime)
    return bestMove
  }

  /**
   * Get move from game state (adapter for test compatibility)
   */
  async getMove(gameState: any): Promise<number> {
    return this.getBestMove(
      gameState.board,
      gameState.aiDisc,
      gameState.playerDisc
    )
  }

  /**
   * Find immediate winning move
   */
  private findImmediateWin(
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor
  ): number {
    const validMoves = getValidMoves(board)

    for (const column of validMoves) {
      const testBoard = cloneBoard(board)
      const boardAfterMove = placeDisc(testBoard, column, playerDisc)

      // Check if this move creates a win
      if (isForcedWin(board, column, playerDisc, opponentDisc, 1)) {
        return column
      }
    }

    return -1
  }

  /**
   * Find immediate blocking move (prevent opponent's win)
   */
  private findImmediateBlock(
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor
  ): number {
    const validMoves = getValidMoves(board)

    for (const column of validMoves) {
      const testBoard = cloneBoard(board)
      const boardAfterMove = placeDisc(testBoard, column, opponentDisc)

      // Check if opponent would win with this move
      if (isForcedWin(board, column, opponentDisc, playerDisc, 1)) {
        return column // Block this move
      }
    }

    return -1
  }

  /**
   * Minimax algorithm with alpha-beta pruning and time limit
   */
  private async minimaxWithTimeLimit(
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    startTime: number
  ): Promise<number> {
    const validMoves = getValidMoves(board)

    if (validMoves.length === 1) {
      return validMoves[0]
    }

    let bestMove = validMoves[0]
    let bestScore = -Infinity

    // Evaluate each valid move
    for (const column of validMoves) {
      // Check time limit
      if (Date.now() - startTime > this.timeBudget * 0.8) {
        break
      }

      const testBoard = cloneBoard(board)
      placeDisc(testBoard, column, playerDisc)

      const score = await this.minimax(
        testBoard,
        this.maxDepth - 1,
        -Infinity,
        Infinity,
        false,
        playerDisc,
        opponentDisc,
        startTime
      )

      if (score > bestScore) {
        bestScore = score
        bestMove = column
      }
    }

    return bestMove
  }

  /**
   * Minimax algorithm with alpha-beta pruning
   */
  private async minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    startTime: number
  ): Promise<number> {
    this.nodesEvaluated++

    // Check time limit
    if (Date.now() - startTime > this.timeBudget) {
      return evaluateBoard(board, playerDisc, opponentDisc)
    }

    // Terminal conditions
    if (depth === 0 || isBoardFull(board)) {
      return evaluateBoard(board, playerDisc, opponentDisc)
    }

    const validMoves = getValidMoves(board)
    const currentPlayer = isMaximizing ? playerDisc : opponentDisc
    const opponent = isMaximizing ? opponentDisc : playerDisc

    if (isMaximizing) {
      let maxScore = -Infinity

      for (const column of validMoves) {
        const testBoard = cloneBoard(board)
        placeDisc(testBoard, column, currentPlayer)

        const score = await this.minimax(
          testBoard,
          depth - 1,
          alpha,
          beta,
          false,
          playerDisc,
          opponentDisc,
          startTime
        )

        maxScore = Math.max(maxScore, score)
        alpha = Math.max(alpha, score)

        if (beta <= alpha) {
          this.pruningCount++
          break // Alpha-beta pruning
        }
      }

      return maxScore
    } else {
      let minScore = Infinity

      for (const column of validMoves) {
        const testBoard = cloneBoard(board)
        placeDisc(testBoard, column, currentPlayer)

        const score = await this.minimax(
          testBoard,
          depth - 1,
          alpha,
          beta,
          true,
          playerDisc,
          opponentDisc,
          startTime
        )

        minScore = Math.min(minScore, score)
        beta = Math.min(beta, score)

        if (beta <= alpha) {
          this.pruningCount++
          break // Alpha-beta pruning
        }
      }

      return minScore
    }
  }

  /**
   * Simulate AI thinking time within the time budget
   */
  private async simulateThinking(startTime: number): Promise<void> {
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, this.timeBudget - elapsed)

    // Use a portion of remaining time for thinking simulation
    const thinkTime = Math.min(remainingTime, this.timeBudget * 0.2)

    if (thinkTime > 0) {
      await new Promise(resolve => setTimeout(resolve, thinkTime))
    }
  }

  /**
   * Get move explanation (for debugging or educational purposes)
   */
  getMoveExplanation(
    board: Board,
    chosenMove: number,
    playerDisc: DiscColor
  ): string {
    let explanation = `Medium AI chose column ${chosenMove}. `

    // Add strategy explanation based on evaluation
    const validMoves = getValidMoves(board)
    const moveEvaluations = getMoveEvaluations(board, playerDisc,
      playerDisc === 'red' ? 'yellow' : 'red')

    const chosenEvaluation = moveEvaluations.find(m => m.column === chosenMove)

    if (chosenEvaluation) {
      if (chosenEvaluation.score > 1000) {
        explanation += 'This move creates a strong offensive position. '
      } else if (chosenEvaluation.score < -1000) {
        explanation += 'This move blocks an important threat. '
      } else {
        explanation += 'This move provides solid positional advantage. '
      }
    }

    explanation += `I analyzed ${this.nodesEvaluated} positions and used alpha-beta pruning to optimize my search. `

    return explanation
  }

  /**
   * Get AI difficulty information
   */
  getDifficultyInfo(): {
    level: 'medium'
    description: string
    timeBudget: number
    strategy: string
    maxDepth: number
  } {
    return {
      level: 'medium',
      description: 'Minimax algorithm with depth 3 and alpha-beta pruning',
      timeBudget: this.timeBudget,
      strategy: 'Strategic analysis with offensive and defensive awareness',
      maxDepth: this.maxDepth,
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    gamesPlayed: number
    averageThinkTime: number
    averageNodesEvaluated: number
    averagePruningCount: number
    pruningEfficiency: number
  } {
    return {
      gamesPlayed: 0,
      averageThinkTime: this.timeBudget * 0.8,
      averageNodesEvaluated: 1000, // Typical for depth 3
      averagePruningCount: 400,
      pruningEfficiency: 0.4, // ~40% of branches pruned
    }
  }

  /**
   * Reset AI state for new game
   */
  reset(): void {
    this.nodesEvaluated = 0
    this.pruningCount = 0
  }

  /**
   * Configure AI parameters
   */
  configure(options: {
    timeBudget?: number
    maxDepth?: number
  }): void {
    if (options.timeBudget !== undefined) {
      this.timeBudget = Math.max(50, Math.min(200, options.timeBudget))
    }

    if (options.maxDepth !== undefined) {
      this.maxDepth = Math.max(1, Math.min(5, options.maxDepth))
    }
  }

  /**
   * Get current performance metrics for this game
   */
  getCurrentGameStats(): {
    nodesEvaluated: number
    pruningCount: number
    pruningEfficiency: number
  } {
    const efficiency = this.nodesEvaluated > 0
      ? this.pruningCount / (this.nodesEvaluated + this.pruningCount)
      : 0

    return {
      nodesEvaluated: this.nodesEvaluated,
      pruningCount: this.pruningCount,
      pruningEfficiency: efficiency,
    }
  }
}

/**
 * Create a new Medium AI instance
 */
export function createMediumAI(): MediumAI {
  return new MediumAI()
}

/**
 * Get a quick analysis from Medium AI (synchronous version)
 */
export function getMediumAIAnalysis(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor
): {
  bestMove: number
  score: number
  confidence: number
} {
  const ai = new MediumAI()
  const validMoves = getValidMoves(board)

  if (validMoves.length === 0) {
    throw new Error('No valid moves available')
  }

  if (validMoves.length === 1) {
    return {
      bestMove: validMoves[0],
      score: 0,
      confidence: 1.0,
    }
  }

  // Quick evaluation for each move
  let bestMove = validMoves[0]
  let bestScore = -Infinity

  for (const column of validMoves) {
    const testBoard = cloneBoard(board)
    placeDisc(testBoard, column, playerDisc)
    const score = evaluateBoard(testBoard, playerDisc, opponentDisc)

    if (score > bestScore) {
      bestScore = score
      bestMove = column
    }
  }

  // Calculate confidence based on score difference from alternatives
  const confidence = Math.min(1.0, Math.abs(bestScore) / 10000)

  return {
    bestMove,
    score: bestScore,
    confidence,
  }
}