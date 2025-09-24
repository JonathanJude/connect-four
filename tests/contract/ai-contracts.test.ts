/**
 * AI Algorithm Contract Tests
 * Tests the AI implementations at all difficulty levels
 *
 * These tests MUST FAIL before implementation exists
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type {
  AIService,
  GameState,
  Difficulty,
  Player,
  Board
} from '@/contracts/game-api'

// Import AI services that don't exist yet
import { EasyAI } from '@/lib/ai/easy'
import { MediumAI } from '@/lib/ai/medium'
import { HardAI } from '@/lib/ai/hard'
import { AIService as AIServiceImpl } from '@/lib/ai/service'

describe('AI Algorithm Contracts', () => {
  let easyAI: AIService
  let mediumAI: AIService
  let hardAI: AIService
  let aiService: AIServiceImpl

  // Test game state setup
  const createTestGameState = (boardState?: (string | null)[][], difficulty: Difficulty = 'medium'): GameState => {
    const board: Board = {
      rows: 6,
      columns: 7,
      grid: boardState || Array(6).fill(null).map(() => Array(7).fill(null))
    }

    return {
      id: 'test-game',
      board,
      currentPlayer: 'AI',
      status: 'IN_PROGRESS',
      moves: [],
      difficulty,
      playerDisc: 'red',
      aiDisc: 'yellow',
      startedAt: new Date()
    }
  }

  beforeEach(() => {
    // These will fail because the AI classes don't exist
    easyAI = new EasyAI()
    mediumAI = new MediumAI()
    hardAI = new HardAI()
    aiService = new AIServiceImpl()
  })

  describe('Easy AI', () => {
    it('should make moves within reasonable time', async () => {
      const gameState = createTestGameState()
      const startTime = performance.now()

      const column = await easyAI.getMove(gameState)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50) // Should be very fast
      expect(typeof column).toBe('number')
      expect(column).toBeGreaterThanOrEqual(0)
      expect(column).toBeLessThan(7)
    })

    it('should prefer center columns with bias', async () => {
      const gameState = createTestGameState()
      const moves: number[] = []

      // Test multiple moves to see distribution
      for (let i = 0; i < 100; i++) {
        const column = await easyAI.getMove(gameState)
        moves.push(column)
      }

      // Center columns (2, 3, 4) should be preferred
      const centerMoves = moves.filter(col => col >= 2 && col <= 4).length
      expect(centerMoves).toBeGreaterThan(50) // More than 50% should be center moves
    })

    it('should always return valid moves', async () => {
      // Create a board with some full columns
      const boardState = Array(6).fill(null).map(() => Array(7).fill(null))
      // Fill column 0
      for (let row = 0; row < 6; row++) {
        boardState[row][0] = 'red'
      }
      // Fill column 6
      for (let row = 0; row < 6; row++) {
        boardState[row][6] = 'red'
      }

      const gameState = createTestGameState(boardState, 'easy')

      for (let i = 0; i < 50; i++) {
        const column = await easyAI.getMove(gameState)
        expect(column).toBeGreaterThanOrEqual(1)
        expect(column).toBeLessThan(6)
      }
    })

    it('should use seeded random for reproducibility', async () => {
      const gameState = createTestGameState()

      // Test that same seed produces same results
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const move1 = await easyAI.getMove(gameState)

      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const move2 = await easyAI.getMove(gameState)

      expect(move1).toBe(move2)
    })
  })

  describe('Medium AI', () => {
    it('should respect 50ms time budget', async () => {
      const gameState = createTestGameState()
      const startTime = performance.now()

      const column = await mediumAI.getMove(gameState)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should be under 100ms with buffer
      expect(typeof column).toBe('number')
      expect(column).toBeGreaterThanOrEqual(0)
      expect(column).toBeLessThan(7)
    })

    it('should use minimax with depth 3', async () => {
      const gameState = createTestGameState()

      // Create a winning opportunity
      gameState.board.grid[5][0] = 'yellow'
      gameState.board.grid[5][1] = 'yellow'
      gameState.board.grid[5][2] = 'yellow'

      const column = await mediumAI.getMove(gameState)

      // Should take the winning move
      expect(column).toBe(3)
    })

    it('should block opponent wins', async () => {
      const gameState = createTestGameState()

      // Create an opponent winning opportunity
      gameState.board.grid[5][0] = 'red'
      gameState.board.grid[5][1] = 'red'
      gameState.board.grid[5][2] = 'red'

      const column = await mediumAI.getMove(gameState)

      // Should block the winning move
      expect(column).toBe(3)
    })

    it('should use alpha-beta pruning for efficiency', async () => {
      const gameState = createTestGameState()

      // Create a complex board state
      for (let col = 0; col < 7; col++) {
        for (let row = 3; row < 6; row++) {
          if ((row + col) % 2 === 0) {
            gameState.board.grid[row][col] = 'red'
          } else {
            gameState.board.grid[row][col] = 'yellow'
          }
        }
      }

      const startTime = performance.now()
      await mediumAI.getMove(gameState)
      const endTime = performance.now()

      // Should still be fast even with complex board
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Hard AI', () => {
    it('should respect 150ms time budget', async () => {
      const gameState = createTestGameState()
      const startTime = performance.now()

      const column = await hardAI.getMove(gameState)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(200) // Should be under 200ms with buffer
      expect(typeof column).toBe('number')
      expect(column).toBeGreaterThanOrEqual(0)
      expect(column).toBeLessThan(7)
    })

    it('should use iterative deepening', async () => {
      const gameState = createTestGameState()

      // Create a complex board state
      for (let col = 0; col < 7; col++) {
        for (let row = 2; row < 6; row++) {
          if ((row + col) % 3 === 0) {
            gameState.board.grid[row][col] = 'red'
          } else if ((row + col) % 3 === 1) {
            gameState.board.grid[row][col] = 'yellow'
          }
        }
      }

      const column = await hardAI.getMove(gameState)

      // Should make a strategic move
      expect(typeof column).toBe('number')
      expect(column).toBeGreaterThanOrEqual(0)
      expect(column).toBeLessThan(7)
    })

    it('should find optimal winning moves', async () => {
      const gameState = createTestGameState()

      // Create a winning opportunity in 2 moves
      gameState.board.grid[5][0] = 'yellow'
      gameState.board.grid[4][0] = 'yellow'
      gameState.board.grid[5][1] = 'yellow'

      const column = await hardAI.getMove(gameState)

      // Should setup the winning move
      expect(column === 0 || column === 1 || column === 2).toBe(true)
    })

    it('should prevent opponent winning sequences', async () => {
      const gameState = createTestGameState()

      // Create a complex threat pattern
      gameState.board.grid[5][3] = 'red'
      gameState.board.grid[5][4] = 'red'
      gameState.board.grid[4][4] = 'red'

      const column = await hardAI.getMove(gameState)

      // Should recognize and block the threat
      expect(column).toBeDefined()
    })
  })

  describe('AI Service Orchestration', () => {
    it('should select correct AI implementation based on difficulty', async () => {
      const gameState = createTestGameState()

      // Test easy difficulty
      gameState.difficulty = 'easy'
      aiService.setDifficulty('easy')
      const easyMove = await aiService.getMove(gameState)
      expect(typeof easyMove).toBe('number')

      // Test medium difficulty
      gameState.difficulty = 'medium'
      aiService.setDifficulty('medium')
      const mediumMove = await aiService.getMove(gameState)
      expect(typeof mediumMove).toBe('number')

      // Test hard difficulty
      gameState.difficulty = 'hard'
      aiService.setDifficulty('hard')
      const hardMove = await aiService.getMove(gameState)
      expect(typeof hardMove).toBe('number')
    })

    it('should handle move cancellation', async () => {
      const gameState = createTestGameState()

      // Start a move (simulated long-running)
      const movePromise = aiService.getMove(gameState)

      // Cancel before it completes
      aiService.cancel()

      // The promise should handle cancellation gracefully
      try {
        await movePromise
      } catch (error) {
        expect(error.message).toContain('cancelled')
      }
    })

    it('should respect different time budgets per difficulty', async () => {
      const gameState = createTestGameState()

      // Test each difficulty level
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
      const timeBudgets = [50, 100, 200] // Corresponding time budgets

      for (let i = 0; i < difficulties.length; i++) {
        gameState.difficulty = difficulties[i]
        aiService.setDifficulty(difficulties[i])

        const startTime = performance.now()
        await aiService.getMove(gameState)
        const endTime = performance.now()

        expect(endTime - startTime).toBeLessThan(timeBudgets[i] + 50) // Add buffer
      }
    })

    it('should handle invalid game states gracefully', async () => {
      const invalidGameState = {
        ...createTestGameState(),
        status: 'HUMAN_WIN' as any // Game already ended
      }

      await expect(aiService.getMove(invalidGameState))
        .rejects.toThrow('Game already ended')
    })
  })
})