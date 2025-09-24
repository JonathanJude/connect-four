/**
 * AI Orchestration Hook
 * React hook for managing AI move generation with cancellation support and time budgets
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type Board,
  type DiscColor,
  type Difficulty,
  AI_TIME_BUDGETS,
} from '../lib/game/constants'
import {
  aiService,
  type AIMoveRequest,
  type AIMoveResponse,
  type AIPerformanceStats,
} from '../lib/ai/service'
import { type AIThinkingState } from '../types/game'

/**
 * Hook return type
 */
export interface UseAIHookReturn {
  // AI State
  isThinking: boolean
  thinkingState: AIThinkingState
  currentDifficulty: Difficulty

  // Actions
  getAIMove: (
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    difficulty: Difficulty
  ) => Promise<number | null>

  // Configuration
  setTimeBudget: (difficulty: Difficulty, budget: number) => void
  setDifficulty: (difficulty: Difficulty) => void

  // Analysis and info
  getQuickAnalysis: (
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    difficulty: Difficulty
  ) => {
    bestMove: number
    score: number
    confidence: number
    moveEvaluations: Array<{ column: number; score: number }>
  }

  getDifficultyInfo: (difficulty: Difficulty) => {
    level: Difficulty
    description: string
    timeBudget: number
    strategy: string
    features: string[]
  }

  // Performance
  getPerformanceStats: (difficulty: Difficulty) => AIPerformanceStats

  // Cancellation
  cancelCurrentMove: () => void
  isCancelled: boolean

  // Error handling
  lastError: Error | null
  clearError: () => void
}

/**
 * Custom hook for AI orchestration and move generation
 */
export function useAI(): UseAIHookReturn {
  const [isThinking, setIsThinking] = useState(false)
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium')
  const [thinkingState, setThinkingState] = useState<AIThinkingState>({
    isThinking: false,
    progress: 0,
    estimatedTimeRemaining: 0,
    currentDepth: 0,
    nodesEvaluated: 0,
  })
  const [lastError, setLastError] = useState<Error | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  /**
   * Get AI move with cancellation support and time budgets
   */
  const getAIMove = useCallback(async (
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    difficulty: Difficulty
  ): Promise<number | null> => {
    // Cancel any existing AI operation
    cancelCurrentMove()

    setIsThinking(true)
    setThinkingState(prev => ({
      ...prev,
      isThinking: true,
      progress: 0,
      estimatedTimeRemaining: AI_TIME_BUDGETS[difficulty],
      currentDepth: 0,
      nodesEvaluated: 0,
    }))
    setLastError(null)
    setIsCancelled(false)

    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController()
    startTimeRef.current = Date.now()

    // Start progress updates
    startProgressUpdates(difficulty)

    try {
      const request: AIMoveRequest = {
        board,
        playerDisc,
        opponentDisc,
        difficulty,
        timeBudget: AI_TIME_BUDGETS[difficulty],
      }

      // Set up abort signal timeout
      timeoutRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }, AI_TIME_BUDGETS[difficulty] + 100) // Add small buffer

      // Add abort signal to request
      const signal = abortControllerRef.current.signal

      // Check for cancellation before starting
      if (signal.aborted) {
        throw new Error('AI move cancelled')
      }

      const response = await Promise.race([
        aiService.getBestMove(request),
        new Promise<AIMoveResponse>((_, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('AI move cancelled'))
          })
        })
      ])

      // Check if cancelled during execution
      if (signal.aborted) {
        throw new Error('AI move cancelled')
      }

      // Update AI service performance stats
      aiService.updateGameStats(
        difficulty,
        'draw', // Will be updated by game state hook
        response.thinkingTime,
        response.stats?.nodesEvaluated || 0,
        response.stats?.pruningCount || 0
      )

      setIsThinking(false)
      setThinkingState(prev => ({
        ...prev,
        isThinking: false,
        progress: 100,
        estimatedTimeRemaining: 0,
        currentDepth: response.stats?.searchDepth || 0,
        nodesEvaluated: response.stats?.nodesEvaluated || 0,
      }))

      return response.move

    } catch (error) {
      if (error instanceof Error && error.message === 'AI move cancelled') {
        setIsCancelled(true)
      } else {
        setLastError(error instanceof Error ? error : new Error('Unknown AI error'))
      }

      setIsThinking(false)
      setThinkingState(prev => ({
        ...prev,
        isThinking: false,
        progress: 0,
        estimatedTimeRemaining: 0,
      }))

      return null
    } finally {
      cleanup()
    }
  }, [])

  /**
   * Get quick analysis without full AI search (for UI hints)
   */
  const getQuickAnalysis = useCallback((
    board: Board,
    playerDisc: DiscColor,
    opponentDisc: DiscColor,
    difficulty: Difficulty
  ) => {
    return aiService.getQuickAnalysis(board, playerDisc, opponentDisc, difficulty)
  }, [])

  /**
   * Get difficulty information
   */
  const getDifficultyInfo = useCallback((difficulty: Difficulty) => {
    return aiService.getDifficultyInfo(difficulty)
  }, [])

  /**
   * Get performance statistics
   */
  const getPerformanceStats = useCallback((difficulty: Difficulty) => {
    return aiService.getPerformanceStats(difficulty)
  }, [])

  /**
   * Set time budget for a difficulty level
   */
  const setTimeBudget = useCallback((difficulty: Difficulty, budget: number) => {
    aiService.configureAI(difficulty, { timeBudget: budget })
  }, [])

  /**
   * Set current difficulty
   */
  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty)
  }, [])

  /**
   * Cancel current AI operation
   */
  const cancelCurrentMove = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    cleanup()
    setIsCancelled(true)
    setIsThinking(false)
    setThinkingState(prev => ({
      ...prev,
      isThinking: false,
      progress: 0,
      estimatedTimeRemaining: 0,
    }))
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setLastError(null)
    setIsCancelled(false)
  }, [])

  /**
   * Start progress updates for better UX
   */
  const startProgressUpdates = useCallback((difficulty: Difficulty) => {
    const timeBudget = AI_TIME_BUDGETS[difficulty]
    const updateInterval = Math.max(50, timeBudget / 20) // Update every 50ms or 5% of budget

    updateIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min(100, (elapsed / timeBudget) * 100)
      const remaining = Math.max(0, timeBudget - elapsed)

      setThinkingState(prev => ({
        ...prev,
        progress,
        estimatedTimeRemaining: remaining,
        currentDepth: Math.floor(progress / 10) + 1, // Estimate depth based on progress
        nodesEvaluated: Math.floor(progress * 100), // Rough estimate
      }))

      // Auto-cancel if significantly over budget
      if (elapsed > timeBudget * 1.5) {
        cancelCurrentMove()
      }
    }, updateInterval)
  }, [])

  /**
   * Clean up resources
   */
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current = null
    }
  }, [])

  return {
    isThinking,
    thinkingState,
    currentDifficulty,
    getAIMove,
    setTimeBudget,
    setDifficulty,
    getQuickAnalysis,
    getDifficultyInfo,
    getPerformanceStats,
    cancelCurrentMove,
    isCancelled,
    lastError,
    clearError,
  }
}

/**
 * Hook for AI difficulty management with persistence
 */
export function useAIDifficulty() {
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium')
  const [isConfiguring, setIsConfiguring] = useState(false)

  // Load saved difficulty on mount
  useEffect(() => {
    const loadSavedDifficulty = async () => {
      try {
        // This would load from persistence service
        // For now, use default
        setCurrentDifficulty('medium')
      } catch (error) {
        console.error('Failed to load AI difficulty:', error)
      }
    }

    loadSavedDifficulty()
  }, [])

  /**
   * Change difficulty with optional confirmation
   */
  const changeDifficulty = useCallback(async (
    newDifficulty: Difficulty,
    requireConfirmation = false
  ): Promise<boolean> => {
    if (requireConfirmation && currentDifficulty !== newDifficulty) {
      // In a real implementation, this would show a confirmation dialog
      const confirmed = confirm(
        `Change AI difficulty from ${currentDifficulty} to ${newDifficulty}? This will start a new game.`
      )
      if (!confirmed) {
        return false
      }
    }

    setIsConfiguring(true)

    try {
      setCurrentDifficulty(newDifficulty)

      // Save to persistence
      // await persistenceService.updateSettings({ difficulty: newDifficulty })

      return true
    } catch (error) {
      console.error('Failed to save AI difficulty:', error)
      return false
    } finally {
      setIsConfiguring(false)
    }
  }, [currentDifficulty])

  /**
   * Reset to default difficulty
   */
  const resetDifficulty = useCallback(async () => {
    return changeDifficulty('medium', true)
  }, [changeDifficulty])

  return {
    currentDifficulty,
    isConfiguring,
    changeDifficulty,
    resetDifficulty,
    difficultyInfo: {
      easy: useAI().getDifficultyInfo('easy'),
      medium: useAI().getDifficultyInfo('medium'),
      hard: useAI().getDifficultyInfo('hard'),
    },
  }
}

/**
 * Hook for AI performance monitoring
 */
export function useAIPerformance() {
  const [performanceData, setPerformanceData] = useState<Record<Difficulty, AIPerformanceStats>>({
    easy: aiService.getPerformanceStats('easy'),
    medium: aiService.getPerformanceStats('medium'),
    hard: aiService.getPerformanceStats('hard'),
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  /**
   * Start monitoring AI performance
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)

    // Update performance data every second
    const interval = setInterval(() => {
      setPerformanceData({
        easy: aiService.getPerformanceStats('easy'),
        medium: aiService.getPerformanceStats('medium'),
        hard: aiService.getPerformanceStats('hard'),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  /**
   * Get performance summary
   */
  const getPerformanceSummary = useCallback(() => {
    const allStats = Object.values(performanceData)
    const totalGames = allStats.reduce((sum, stats) => sum + stats.gamesPlayed, 0)
    const totalNodes = allStats.reduce((sum, stats) => sum + stats.totalNodesEvaluated, 0)
    const avgThinkTime = allStats.reduce((sum, stats) => sum + stats.averageThinkTime, 0) / 3

    return {
      totalGames,
      totalNodesEvaluated: totalNodes,
      averageThinkTime: Math.round(avgThinkTime),
      isMonitoring,
    }
  }, [performanceData, isMonitoring])

  return {
    performanceData,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getPerformanceSummary,
  }
}