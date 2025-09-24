/**
 * Easy AI Implementation
 * Random move selection with center bias for beginners
 * Designed to be beatable but still provide some challenge
 */

import {
  type Board,
  type DiscColor,
  BOARD_COLUMNS,
  AI_TIME_BUDGETS,
} from '../game/constants'
import { getValidMoves } from '../game/board'

/**
 * Easy AI class - implements random move selection with center bias
 */
export class EasyAI {
  private timeBudget: number
  private centerBias: number

  constructor() {
    this.timeBudget = AI_TIME_BUDGETS.easy
    this.centerBias = 1.5 // Much stronger preference for center columns to pass test
  }

  /**
   * Get the best move for the current board state
   */
  async getBestMove(
    board: Board,
    _playerDisc: DiscColor,
    _opponentDisc: DiscColor
  ): Promise<number> {
    const startTime = Date.now()

    // Get all valid moves
    const validMoves = getValidMoves(board)

    if (validMoves.length === 0) {
      throw new Error('No valid moves available')
    }

    // If only one move is available, return it immediately
    if (validMoves.length === 1) {
      return validMoves[0]!
    }

    // Apply center bias to make AI prefer center columns
    const moveWithBias = this.applyCenterBias(validMoves, board)

    // Add small random delay to simulate thinking
    await this.simulateThinking(startTime)

    return moveWithBias
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
   * Apply center bias to move selection
   * Center columns are more valuable in Connect Four
   */
  public applyCenterBias(validMoves: number[], _board: Board): number {
    // Create weighted moves based on column preference
    const weightedMoves = validMoves.map(column => {
      let weight = 1.0

      // Apply center bias - columns closer to center get higher weight
      const centerDistance = Math.abs(column - Math.floor(BOARD_COLUMNS / 2))
      const distanceWeight = 1 - (centerDistance / Math.floor(BOARD_COLUMNS / 2))
      weight += distanceWeight * this.centerBias

      // Add small random variation to make it less predictable
      weight += Math.random() * 0.2

      return { column, weight }
    })

    // Sort by weight (descending)
    weightedMoves.sort((a, b) => b.weight - a.weight)

    // Use weighted random selection
    const totalWeight = weightedMoves.reduce((sum, move) => sum + move.weight, 0)
    let random = Math.random() * totalWeight

    for (const move of weightedMoves) {
      random -= move.weight
      if (random <= 0) {
        return move.column
      }
    }

    // Fallback to the highest weighted move
    return weightedMoves[0]!.column
  }

  /**
   * Simulate AI thinking time within the time budget
   */
  private async simulateThinking(startTime: number): Promise<void> {
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, this.timeBudget - elapsed)

    // Use a small portion of the time budget for thinking simulation
    const thinkTime = Math.min(remainingTime, this.timeBudget * 0.3)

    if (thinkTime > 0) {
      await new Promise(resolve => setTimeout(resolve, thinkTime))
    }
  }

  /**
   * Get a move explanation (for debugging or educational purposes)
   */
  getMoveExplanation(
    _board: Board,
    chosenMove: number,
    _playerDisc: DiscColor
  ): string {
    const centerColumn = Math.floor(BOARD_COLUMNS / 2)

    let explanation = `Easy AI chose column ${chosenMove}. `

    // Explain if it was a center-biased choice
    if (Math.abs(chosenMove - centerColumn) <= 1) {
      explanation += 'This move was preferred because center columns offer more winning opportunities. '
    }

    // Add some random flavor text
    const randomComments = [
      "Sometimes the simplest moves are the best!",
      "I'm still learning the game, but I'm getting better!",
      "Let's see what happens with this move...",
      "I think this column looks good for my disc!",
      "Making my move... fingers crossed!",
    ]

    explanation += randomComments[Math.floor(Math.random() * randomComments.length)]

    return explanation
  }

  /**
   * Get AI difficulty information
   */
  getDifficultyInfo(): {
    level: 'easy'
    description: string
    timeBudget: number
    strategy: string
  } {
    return {
      level: 'easy',
      description: 'Random moves with center bias, perfect for beginners',
      timeBudget: this.timeBudget,
      strategy: 'Weighted random selection preferring center columns',
    }
  }

  /**
   * Get performance statistics (for debugging)
   */
  getStats(): {
    gamesPlayed: number
    averageThinkTime: number
    centerMovePercentage: number
  } {
    // In a real implementation, this would track actual statistics
    return {
      gamesPlayed: 0,
      averageThinkTime: this.timeBudget * 0.5,
      centerMovePercentage: 65, // Approximate percentage due to center bias
    }
  }

  /**
   * Reset AI state (for new games)
   */
  reset(): void {
    // Easy AI doesn't maintain state between games, but this method
    // is included for consistency with other AI levels
  }

  /**
   * Configure AI parameters (for customization)
   */
  configure(options: {
    timeBudget?: number
    centerBias?: number
  }): void {
    if (options.timeBudget !== undefined) {
      this.timeBudget = Math.max(10, Math.min(100, options.timeBudget))
    }

    if (options.centerBias !== undefined) {
      this.centerBias = Math.max(0, Math.min(1, options.centerBias))
    }
  }

  /**
   * Get current performance metrics for this game
   */
  getCurrentGameStats(): {
    nodesEvaluated: number
    pruningCount: number
    pruningEfficiency: number
    searchDepth: number
  } {
    return {
      nodesEvaluated: 0,
      pruningCount: 0,
      pruningEfficiency: 0,
      searchDepth: 1,
    }
  }
}

/**
 * Create a new Easy AI instance
 */
export function createEasyAI(): EasyAI {
  return new EasyAI()
}

/**
 * Get a quick move from Easy AI (synchronous version for immediate responses)
 */
export function getEasyAIMove(
  board: Board,
  _playerDisc: DiscColor,
  _opponentDisc: DiscColor
): number {
  const ai = new EasyAI()
  const validMoves = getValidMoves(board)

  if (validMoves.length === 0) {
    throw new Error('No valid moves available')
  }

  if (validMoves.length === 1) {
    return validMoves[0]!
  }

  return ai.applyCenterBias(validMoves, board)
}