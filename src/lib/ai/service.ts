/**
 * AI Service Orchestration
 * Central service that manages AI difficulty levels and provides unified interface
 */

import {
  type Board,
  type DiscColor,
  Difficulty,
  AI_TIME_BUDGETS,
} from '../game/constants'
import { EasyAI, createEasyAI, getEasyAIMove } from './easy'
import { MediumAI, createMediumAI, getMediumAIAnalysis } from './medium'
import { HardAI, createHardAI, getHardAIAnalysis } from './hard'
import { evaluateBoard, getMoveEvaluations, calculatePositionStrength } from './evaluate'

/**
 * AI Move Request interface
 */
export interface AIMoveRequest {
  board: Board
  playerDisc: DiscColor
  opponentDisc: DiscColor
  difficulty: Difficulty
  timeBudget?: number
}

/**
 * AI Move Response interface
 */
export interface AIMoveResponse {
  move: number
  score: number
  confidence: number
  thinkingTime: number
  explanation?: string
  stats?: {
    nodesEvaluated: number
    pruningCount: number
    pruningEfficiency: number
    searchDepth: number
  }
}

/**
 * AI Performance Stats interface
 */
export interface AIPerformanceStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  averageThinkTime: number
  totalNodesEvaluated: number
  averageNodesEvaluated: number
  totalPruningCount: number
  averagePruningCount: number
  averagePruningEfficiency: number
}

/**
 * AI Service class - orchestrates different AI difficulty levels
 */
export class AIService {
  private easyAI: EasyAI
  private mediumAI: MediumAI
  private hardAI: HardAI
  private currentDifficulty: Difficulty
  private performanceStats: Map<Difficulty, AIPerformanceStats>
  private customTimeBudgets: Map<Difficulty, number>

  constructor() {
    this.easyAI = createEasyAI()
    this.mediumAI = createMediumAI()
    this.hardAI = createHardAI()
    this.currentDifficulty = 'medium'
    this.performanceStats = new Map()
    this.customTimeBudgets = new Map()

    // Initialize performance stats
    this.initializePerformanceStats()
  }

  /**
   * Set difficulty level (adapter for test compatibility)
   */
  setDifficulty(difficulty: Difficulty): void {
    this.currentDifficulty = difficulty
  }

  /**
   * Get move from game state (adapter for test compatibility)
   */
  async getMove(gameState: any): Promise<number> {
    // Check for invalid game states
    if (gameState.status && gameState.status !== 'IN_PROGRESS') {
      throw new Error('Game already ended')
    }

    const ai = this.getAIInstance(this.currentDifficulty)
    return ai.getMove(gameState)
  }

  /**
   * Cancel current AI operation (adapter for test compatibility)
   */
  cancel(): void {
    // No-op for now, cancellation not implemented
  }

  /**
   * Get the best move for the current board state
   */
  async getBestMove(request: AIMoveRequest): Promise<AIMoveResponse> {
    const startTime = Date.now()

    // Get AI instance based on difficulty
    const ai = this.getAIInstance(request.difficulty)

    try {
      // Get move from AI
      const move = await ai.getBestMove(
        request.board,
        request.playerDisc,
        request.opponentDisc
      )

      const thinkingTime = Date.now() - startTime

      // Calculate score and confidence
      const evaluation = this.evaluateMoveQuality(
        request.board,
        move,
        request.playerDisc,
        request.opponentDisc
      )

      // Get explanation if available
      const explanation = this.getExplanation(ai, request.board, move, request.playerDisc)

      // Get stats if available
      const stats = this.getGameStats(ai)

      return {
        move,
        score: evaluation.score,
        confidence: evaluation.confidence,
        thinkingTime,
        explanation,
        stats,
      }
    } catch (error) {
      // Fallback to safe move calculation
      console.error('AI move calculation failed, using fallback:', error)
      return this.getFallbackMove(request, startTime)
    }
  }

  /**
   * Get quick analysis without full AI search (for UI hints)
   */
  getQuickAnalysis(
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    difficulty: Difficulty
  ): {
    bestMove: number
    score: number
    confidence: number
    moveEvaluations: Array<{ column: number; score: number }>
  } {
    switch (difficulty) {
      case 'easy':
        const easyMove = getEasyAIMove(board, playerDisc, opponentDisc)
        return {
          bestMove: easyMove,
          score: 0,
          confidence: 0.5,
          moveEvaluations: getMoveEvaluations(board, playerDisc, opponentDisc),
        }

      case 'medium':
        const mediumAnalysis = getMediumAIAnalysis(board, playerDisc, opponentDisc)
        return {
          bestMove: mediumAnalysis.bestMove,
          score: mediumAnalysis.score,
          confidence: mediumAnalysis.confidence,
          moveEvaluations: getMoveEvaluations(board, playerDisc, opponentDisc),
        }

      case 'hard':
        const hardAnalysis = getHardAIAnalysis(board, playerDisc, opponentDisc)
        return {
          bestMove: hardAnalysis.bestMove,
          score: hardAnalysis.score,
          confidence: hardAnalysis.confidence,
          moveEvaluations: getMoveEvaluations(board, playerDisc, opponentDisc),
        }

      default:
        throw new Error(`Unknown difficulty: ${difficulty}`)
    }
  }

  /**
   * Get AI difficulty information
   */
  getDifficultyInfo(difficulty: Difficulty): {
    level: Difficulty
    description: string
    timeBudget: number
    strategy: string
    features: string[]
  } {
    const ai = this.getAIInstance(difficulty)
    const baseInfo = ai.getDifficultyInfo()

    const features = []

    switch (difficulty) {
      case 'easy':
        features.push('Random move selection')
        features.push('Center bias preference')
        features.push('Short thinking time')
        break

      case 'medium':
        features.push('Minimax algorithm')
        features.push('Alpha-beta pruning')
        features.push('Position evaluation')
        features.push('Immediate win/loss detection')
        break

      case 'hard':
        features.push('Iterative deepening')
        features.push('Transposition table')
        features.push('Killer move heuristics')
        features.push('History heuristics')
        features.push('Advanced pruning')
        break
    }

    return {
      level: difficulty,
      description: baseInfo.description,
      timeBudget: baseInfo.timeBudget,
      strategy: baseInfo.strategy,
      features,
    }
  }

  /**
   * Configure AI parameters
   */
  configureAI(
    difficulty: Difficulty,
    options: {
      timeBudget?: number
      maxDepth?: number
      useEndgameDatabase?: boolean
      centerBias?: number
    }
  ): void {
    const ai = this.getAIInstance(difficulty)

    // Store custom time budget
    if (options.timeBudget !== undefined) {
      this.customTimeBudgets.set(difficulty, options.timeBudget)
    }

    // Configure AI-specific parameters
    ai.configure(options)
  }

  /**
   * Reset AI state for new game
   */
  resetAI(difficulty?: Difficulty): void {
    if (difficulty) {
      const ai = this.getAIInstance(difficulty)
      ai.reset()
    } else {
      // Reset all AIs
      this.easyAI.reset()
      this.mediumAI.reset()
      this.hardAI.reset()
    }
  }

  /**
   * Update performance stats after a game
   */
  updateGameStats(
    difficulty: Difficulty,
    result: 'win' | 'loss' | 'draw',
    thinkingTime: number,
    nodesEvaluated: number,
    pruningCount: number
  ): void {
    const stats = this.performanceStats.get(difficulty)!

    stats.gamesPlayed++
    stats.totalNodesEvaluated += nodesEvaluated
    stats.totalPruningCount += pruningCount

    if (result === 'win') {
      stats.wins++
    } else if (result === 'loss') {
      stats.losses++
    } else {
      stats.draws++
    }

    // Update averages
    stats.averageThinkTime = (stats.averageThinkTime * (stats.gamesPlayed - 1) + thinkingTime) / stats.gamesPlayed
    stats.averageNodesEvaluated = Math.round(stats.totalNodesEvaluated / stats.gamesPlayed)
    stats.averagePruningCount = Math.round(stats.totalPruningCount / stats.gamesPlayed)

    const totalEfficiency = nodesEvaluated + pruningCount
    const currentEfficiency = totalEfficiency > 0 ? pruningCount / totalEfficiency : 0
    stats.averagePruningEfficiency = (stats.averagePruningEfficiency * (stats.gamesPlayed - 1) + currentEfficiency) / stats.gamesPlayed
  }

  /**
   * Get performance statistics for a difficulty level
   */
  getPerformanceStats(difficulty: Difficulty): AIPerformanceStats {
    return { ...this.performanceStats.get(difficulty)! }
  }

  /**
   * Get all performance statistics
   */
  getAllPerformanceStats(): Record<Difficulty, AIPerformanceStats> {
    return {
      easy: this.getPerformanceStats('easy'),
      medium: this.getPerformanceStats('medium'),
      hard: this.getPerformanceStats('hard'),
    }
  }

  /**
   * Get AI instance for difficulty level
   */
  private getAIInstance(difficulty: Difficulty): EasyAI | MediumAI | HardAI {
    switch (difficulty) {
      case 'easy':
        return this.easyAI
      case 'medium':
        return this.mediumAI
      case 'hard':
        return this.hardAI
      default:
        throw new Error(`Unknown difficulty: ${difficulty}`)
    }
  }

  /**
   * Evaluate move quality for scoring
   */
  private evaluateMoveQuality(
    board: Board,
    move: number,
    playerDisc: DiscColor,
    opponentDisc: DiscColor
  ): { score: number; confidence: number } {
    // Simulate the move
    const testBoard = JSON.parse(JSON.stringify(board))
    let targetRow = board.rows - 1

    while (targetRow >= 0 && testBoard.grid[targetRow][move] !== null) {
      targetRow--
    }

    if (targetRow >= 0) {
      testBoard.grid[targetRow][move] = playerDisc
    }

    const score = evaluateBoard(testBoard, playerDisc, opponentDisc)
    const confidence = calculatePositionStrength(testBoard, playerDisc, opponentDisc)

    return {
      score,
      confidence: Math.abs(confidence),
    }
  }

  /**
   * Get move explanation from AI
   */
  private getExplanation(
    ai: EasyAI | MediumAI | HardAI,
    board: Board,
    move: number,
    playerDisc: DiscColor
  ): string {
    return ai.getMoveExplanation(board, move, playerDisc)
  }

  /**
   * Get game stats from AI
   */
  private getGameStats(
    ai: EasyAI | MediumAI | HardAI
  ): {
    nodesEvaluated: number
    pruningCount: number
    pruningEfficiency: number
    searchDepth: number
  } {
    const stats = ai.getCurrentGameStats()

    return {
      nodesEvaluated: stats.nodesEvaluated,
      pruningCount: stats.pruningCount,
      pruningEfficiency: stats.pruningEfficiency,
      searchDepth: 1, // Default search depth since it's not available in AI stats
    }
  }

  /**
   * Get fallback move when AI fails
   */
  private getFallbackMove(
    request: AIMoveRequest,
    startTime: number
  ): AIMoveResponse {
    // Get all valid moves
    const validMoves: number[] = []

    for (let col = 0; col < request.board.columns; col++) {
      if (request.board.grid[0]?.[col] === null) {
        validMoves.push(col)
      }
    }

    // Choose center column if available
    let move = Math.floor(request.board.columns / 2)

    if (!validMoves.includes(move)) {
      // Choose first valid move
      move = validMoves[0] ?? 0
    }

    const thinkingTime = Date.now() - startTime

    return {
      move,
      score: 0,
      confidence: 0.1,
      thinkingTime,
      explanation: 'Fallback move due to AI calculation error',
    }
  }

  /**
   * Initialize performance statistics
   */
  private initializePerformanceStats(): void {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

    for (const difficulty of difficulties) {
      this.performanceStats.set(difficulty, {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        averageThinkTime: AI_TIME_BUDGETS[difficulty],
        totalNodesEvaluated: 0,
        averageNodesEvaluated: 0,
        totalPruningCount: 0,
        averagePruningCount: 0,
        averagePruningEfficiency: 0,
      })
    }
  }
}

/**
 * Create a new AI Service instance
 */
export function createAIService(): AIService {
  return new AIService()
}

/**
 * Global AI service instance
 */
export const aiService = createAIService()

/**
 * Convenience function to get AI move
 */
export async function getAIMove(request: AIMoveRequest): Promise<AIMoveResponse> {
  return aiService.getBestMove(request)
}

/**
 * Convenience function to get quick analysis
 */
export function getQuickAIAnalysis(
  board: Board,
  playerDisc: DiscColor,
  opponentDisc: DiscColor,
  difficulty: Difficulty
) {
  return aiService.getQuickAnalysis(board, playerDisc, opponentDisc, difficulty)
}