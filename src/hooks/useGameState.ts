/**
 * Game State Hook
 * React hook for managing Connect Four game state with reducer-based state management
 */

'use client'

import { useReducer, useEffect, useCallback, useRef, useState } from 'react'
import {
  type Player,
  type Move,
  type DiscColor,
  type Difficulty,
  generateId,
  WinningLine,
} from '../lib/game/constants'
import {
  type GameState as NewGameState,
  GameStatus as NewGameStatus,
  createDefaultGameState,
  createMultiplayerGameState,
  type PlayerInfo,
} from '../types/game'
import {
  isValidMove,
  applyMove,
  checkWinner,
} from '../lib/game/rules'
import {
  isBoardFull,
  getValidMoves,
} from '../lib/game/board'
import { aiService, type AIMoveRequest } from '../lib/ai/service'
import { persistenceService } from '../lib/storage/service'
import { historyService } from '../lib/history/service'
import { type GameHistoryEntry } from '../types/history'

/**
 * Game reducer for state management
 */
function gameReducer(state: NewGameState, action: any): NewGameState {
  const currentTime = new Date()

  switch (action.type) {
    case 'START_GAME': {
      return {
        ...createDefaultGameState(),
        id: generateId(),
        status: NewGameStatus.IN_PROGRESS,
        difficulty: action.payload.difficulty,
        playerDisc: action.payload.playerDisc,
        aiDisc: action.payload.playerDisc === 'red' ? 'yellow' : 'red',
        startedAt: currentTime,
      }
    }

    case 'MAKE_MOVE': {
      if (state.status !== 'IN_PROGRESS' || state.isPaused) {
        return state
      }

      const column = action.payload.column
      const move: Move = {
        id: generateId(),
        gameId: state.id,
        player: 'HUMAN',
        column,
        row: 0, // Will be set by applyMove
        timestamp: currentTime,
      }

      try {
        console.log('🎯 PLAYER MOVE - Before applying move:', {
          column,
          boardState: state.board.grid.map(row => row.map(cell => cell || '.')).join('\n'),
          playerDisc: state.playerDisc,
          aiDisc: state.aiDisc
        });
        
        const newBoard = applyMove(state.board, move, state.playerDisc, state.aiDisc)
        
        console.log('🎯 PLAYER MOVE - After applying move:', {
          boardState: newBoard.grid.map(row => row.map(cell => cell || '.')).join('\n')
        });
        
        // Create a temporary game state for winner checking
        const tempGameState = {
          ...state,
          board: newBoard
        }
        
        console.log('🔍 CHECKING WINNER after player move...');
        const winner = checkWinner(convertToPersistenceFormat(tempGameState))
        console.log('🔍 WINNER CHECK RESULT:', winner);
        
        console.log('🔍 CHECKING BOARD FULL...');
        const boardFull = isBoardFull(newBoard);
        console.log('🔍 BOARD FULL RESULT:', boardFull);
        console.log('🔍 BOARD TOP ROW:', newBoard.grid[0]);
        
        const newStatus = winner?.winner
          ? winner.winner === 'HUMAN'
            ? NewGameStatus.PLAYER_WON
            : NewGameStatus.AI_WON
          : boardFull
          ? NewGameStatus.DRAW
          : NewGameStatus.IN_PROGRESS

        console.log('🎯 STATUS CALCULATION:', {
          hasWinner: !!winner?.winner,
          winnerPlayer: winner?.winner,
          boardFull,
          finalStatus: newStatus
        });

        console.log('🎯 FINAL GAME STATUS:', newStatus);

        const result: NewGameState = {
          ...state,
          board: newBoard,
          status: newStatus,
          currentPlayer: 'AI',
          moves: [...state.moves, move],
        }

        // Only add winner property if it exists
        if (winner?.winner) {
          result.winner = winner.winner
        }

        // Only add winningLine property if it exists
        if (winner?.winningLine) {
          result.winningLine = convertWinningLineToArray(winner.winningLine)
        }

        return result
      } catch (error) {
        console.error('Invalid move:', error)
        return state
      }
    }

    case 'AI_MOVE': {
      if (state.status !== 'IN_PROGRESS' || state.isPaused) {
        return state
      }

      const column = action.payload.column
      const move: Move = {
        id: generateId(),
        gameId: state.id,
        player: 'AI',
        column,
        row: 0, // Will be set by applyMove
        timestamp: currentTime,
      }

      try {
        const newBoard = applyMove(state.board, move, state.playerDisc, state.aiDisc)
        
        // Create a temporary game state for winner checking
        const tempGameState = {
          ...state,
          board: newBoard
        }
        
        const winner = checkWinner(convertToPersistenceFormat(tempGameState))
        const newStatus = winner?.winner
          ? winner.winner === 'HUMAN'
            ? NewGameStatus.PLAYER_WON
            : NewGameStatus.AI_WON
          : isBoardFull(newBoard)
          ? NewGameStatus.DRAW
          : NewGameStatus.IN_PROGRESS

        const result: NewGameState = {
          ...state,
          board: newBoard,
          status: newStatus,
          currentPlayer: 'HUMAN',
          moves: [...state.moves, move],
        }

        // Only add winner property if it exists
        if (winner?.winner) {
          result.winner = winner.winner
        }

        // Only add winningLine property if it exists
        if (winner?.winningLine) {
          result.winningLine = convertWinningLineToArray(winner.winningLine)
        }

        return result
      } catch (error) {
        console.error('Invalid AI move:', error)
        return state
      }
    }

    case 'RESET_GAME': {
      return {
        ...createDefaultGameState(),
        difficulty: state.difficulty,
        playerDisc: state.playerDisc,
        aiDisc: state.aiDisc,
      }
    }

    case 'PAUSE_GAME': {
      if (state.status !== 'IN_PROGRESS') {
        return state
      }
      return {
        ...state,
        status: NewGameStatus.PAUSED,
        isPaused: true,
      }
    }

    case 'RESUME_GAME': {
      if (state.status !== NewGameStatus.PAUSED) {
        return state
      }
      return {
        ...state,
        status: NewGameStatus.IN_PROGRESS,
        isPaused: false,
      }
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        difficulty: action.payload.difficulty || state.difficulty,
        playerDisc: action.payload.playerDisc || state.playerDisc,
        aiDisc: action.payload.playerDisc
          ? action.payload.playerDisc === 'red'
            ? 'yellow'
            : 'red'
          : state.aiDisc,
      }
    }

    case 'START_MULTIPLAYER_GAME': {
      const players = action.payload.players
      const multiplayerState = createMultiplayerGameState(players)

      return {
        ...multiplayerState,
        id: generateId(),
        status: NewGameStatus.IN_PROGRESS,
        startedAt: currentTime,
        players: players,
        currentPlayerInfo: players[0],
      }
    }

    case 'MAKE_MULTIPLAYER_MOVE': {
      if (state.status !== 'IN_PROGRESS' || state.isPaused || state.gameMode !== 'MULTIPLAYER') {
        return state
      }

      const column = action.payload.column
      const player = action.payload.player

      const move: Move = {
        id: generateId(),
        gameId: state.id,
        player: player.type,
        column,
        row: 0, // Will be set by applyMove
        timestamp: currentTime,
      }

      try {
        const newBoard = applyMove(state.board, move, player.discColor, player.discColor === 'red' ? 'yellow' : 'red')

        // Create a temporary game state for winner checking
        const tempGameState = {
          ...state,
          board: newBoard
        }

        const winner = checkWinner(convertToPersistenceFormat(tempGameState))
        const boardFull = isBoardFull(newBoard)

        // Determine game status
        let newStatus: NewGameStatus
        if (winner?.winner) {
          if (winner.winner === 'HUMAN') {
            // In multiplayer, we need to determine which player won based on the disc color
            newStatus = player.discColor === state.playerDisc ? NewGameStatus.PLAYER_WON : NewGameStatus.PLAYER_1_WON
          } else {
            newStatus = NewGameStatus.AI_WON
          }
        } else if (boardFull) {
          newStatus = NewGameStatus.DRAW
        } else {
          newStatus = NewGameStatus.IN_PROGRESS
        }

        // Switch to the other player
        const nextPlayer = state.players?.find(p => p.type !== player.type)

        const result: NewGameState = {
          ...state,
          board: newBoard,
          status: newStatus,
          currentPlayer: nextPlayer?.type || 'PLAYER_1',
          moves: [...state.moves, move],
        }

        // Only add currentPlayerInfo if it exists
        if (nextPlayer) {
          result.currentPlayerInfo = nextPlayer
        }

        // Only add winner property if it exists
        if (winner?.winner) {
          if (winner.winner === 'HUMAN') {
            // In multiplayer, set the winner to the actual player type
            result.winner = player.type
          } else {
            result.winner = winner.winner
          }
        }

        // Only add winningLine property if it exists
        if (winner?.winningLine) {
          result.winningLine = convertWinningLineToArray(winner.winningLine)
        }

        return result
      } catch (error) {
        console.error('Invalid multiplayer move:', error)
        return state
      }
    }

    case 'LOAD_GAME': {
      return {
        ...action.payload,
      }
    }

    case 'SET_HOVERED_COLUMN': {
      // This action is for UI state, handled separately
      return state
    }

    case 'SET_ANIMATION': {
      // This action is for UI state, handled separately
      return state
    }

    default:
      return state
  }
}

/**
 * Hook return type
 */
export interface UseGameStateReturn {
  // State
  gameState: NewGameState
  boardUIState: {
    hoveredColumn: number | null
    isAnimating: boolean
    animationType: 'drop' | 'win' | 'none'
    animationTarget?: { column: number; row: number }
  }

  // Actions
  startNewGame: (difficulty: Difficulty, playerDisc: DiscColor) => void
  startMultiplayerGame: (players: PlayerInfo[]) => void
  makeMove: (column: number) => void
  makeMultiplayerMove: (column: number, player: PlayerInfo) => void
  resetGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  updateSettings: (settings: Partial<{ difficulty: Difficulty; playerDisc: DiscColor }>) => void

  // UI Actions
  setHoveredColumn: (column: number | null) => void
  startAnimation: (type: 'drop' | 'win', column?: number, row?: number) => void
  endAnimation: () => void

  // Computed values
  isAIThinking: boolean
  canPlayerMove: boolean
  canPause: boolean
  canResume: boolean
  gameStats: {
    totalMoves: number
    duration: string
    isValid: boolean
  }

  // Board helpers
  isValidMove: (column: number) => boolean
  getValidMoves: () => number[]
  getCellOwner: (row: number, col: number) => Player | null
  isLastMove: (row: number, col: number) => boolean
  isWinningCell: (row: number, col: number) => boolean

  // Game persistence
  loadIncompleteGame: (gameId?: string) => Promise<boolean>
}


/**
 * Converts WinningLine interface to position array
 */
function convertWinningLineToArray(winningLine: WinningLine): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = []

  if (winningLine.direction === 'horizontal' || winningLine.direction === 'vertical') {
    const rowIncrement = winningLine.direction === 'vertical' ? 1 : 0
    const colIncrement = winningLine.direction === 'horizontal' ? 1 : 0

    for (let i = 0; i < 4; i++) {
      positions.push({
        row: winningLine.start.row + (rowIncrement * i),
        col: winningLine.start.column + (colIncrement * i)
      })
    }
  } else if (winningLine.direction === 'diagonal-up' || winningLine.direction === 'diagonal-down') {
    const rowIncrement = winningLine.direction === 'diagonal-down' ? 1 : -1
    const colIncrement = 1

    for (let i = 0; i < 4; i++) {
      positions.push({
        row: winningLine.start.row + (rowIncrement * i),
        col: winningLine.start.column + (colIncrement * i)
      })
    }
  }

  return positions
}


/**
 * Custom hook for managing Connect Four game state
 */
export function useGameState(): UseGameStateReturn {
  const [oldGameState, dispatch] = useReducer(gameReducer, createDefaultGameState())
  const [gameState, setGameState] = useState<NewGameState>(createDefaultGameState())
  const [boardUIState, setBoardUIState] = useState<{
    hoveredColumn: number | null
    isAnimating: boolean
    animationType: 'drop' | 'win' | 'none'
    animationTarget?: { column: number; row: number }
  }>({
    hoveredColumn: null,
    isAnimating: false,
    animationType: 'none',
  })

  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAIThinkingRef = useRef(false)

  // Sync old state to new state format
  useEffect(() => {
    setGameState(oldGameState)
  }, [oldGameState])

  // Load incomplete games from history
  const loadIncompleteGame = useCallback(async (gameId?: string) => {
    try {
      const incompleteGames = await historyService.getIncompleteGames()
      let gameToLoad

      if (gameId) {
        // Find specific game by ID
        gameToLoad = incompleteGames.find(game => game.id === gameId)
      } else {
        // Load most recent game
        gameToLoad = incompleteGames[0]
      }

      if (gameToLoad) {
        const gameData = gameToLoad.metadata as any

        const currentTime = new Date()
        const loadedState: NewGameState = {
          id: gameData.id,
          board: gameData.boardState || gameData.board,
          status: gameData.status,
          difficulty: gameToLoad.difficulty || 'medium',
          playerDisc: gameToLoad.playerDisc,
          aiDisc: gameToLoad.aiDisc || (gameToLoad.playerDisc === 'red' ? 'yellow' : 'red'),
          currentPlayer: gameData.currentPlayer,
          isPaused: gameData.isPaused,
          gameMode: gameData.gameMode || 'SINGLE_PLAYER',
          moves: gameToLoad.moves.map(move => ({
            id: generateId(),
            gameId: gameData.id,
            player: move.player,
            column: move.position?.col || 0,
            row: move.position?.row || 0,
            timestamp: new Date(move.timestamp || Date.now())
          })),
          startedAt: new Date(Date.now() - gameToLoad.duration),
          createdAt: currentTime,
          updatedAt: currentTime,
          duration: gameToLoad.duration,
        }

        // Only add winner property if it exists
        if (gameToLoad.winner === 'HUMAN' || gameToLoad.winner === 'AI') {
          loadedState.winner = gameToLoad.winner
        }

        // Only add winningLine property if it exists
        if (gameData.winningLine) {
          loadedState.winningLine = gameData.winningLine
        }

        dispatch({ type: 'LOAD_GAME', payload: loadedState })
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to load incomplete game:', error)
      return false
    }
  }, [])

  // Load saved game on mount
  useEffect(() => {
    const loadSavedGame = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const resumeGameId = searchParams.get('resume')

        if (resumeGameId) {
          console.log('Resuming game with ID:', resumeGameId)
          const success = await loadIncompleteGame(resumeGameId)
          if (success) {
            // Clear the resume parameter from URL
            const url = new URL(window.location.href)
            url.searchParams.delete('resume')
            window.history.replaceState({}, '', url.toString())
          }
        } else {
          // Try to load most recent incomplete game
          console.log('Attempting to load most recent incomplete game')
          await loadIncompleteGame()
        }
      } catch (error) {
        console.error('Failed to load saved game:', error)
      }
    }

    loadSavedGame()
  }, [loadIncompleteGame])

  // Auto-save game state
  useEffect(() => {
    if (gameState.status !== NewGameStatus.NOT_STARTED) {
      persistenceService.saveGame(convertToPersistenceFormat(gameState)).catch(console.error)
    }
  }, [gameState])

  // Handle AI moves
  useEffect(() => {
    console.log('=== AI EFFECT DEBUG ===');
    console.log('Game status:', gameState.status);
    console.log('Current player:', gameState.currentPlayer);
    console.log('Is paused:', gameState.isPaused);
    console.log('Is AI thinking:', isAIThinkingRef.current);
    console.log('Game state object:', gameState);

    if (
      gameState.status === 'IN_PROGRESS' &&
      gameState.currentPlayer === 'AI' &&
      !gameState.isPaused &&
      !isAIThinkingRef.current
    ) {
      console.log('🤖 AI MOVE CONDITIONS MET - Starting AI move...');
      isAIThinkingRef.current = true

      const makeAIMove = async () => {
        try {
          console.log('🎯 Making AI move request...');
          const aiRequest: AIMoveRequest = {
            board: gameState.board,
            playerDisc: gameState.aiDisc,
            opponentDisc: gameState.playerDisc,
            difficulty: gameState.difficulty,
          }

          console.log('AI Request:', aiRequest);
          const aiResponse = await aiService.getBestMove(aiRequest)
          console.log('AI Response:', aiResponse);

          dispatch({
            type: 'AI_MOVE',
            payload: {
              column: aiResponse.move,
              thinkingTime: aiResponse.thinkingTime,
            },
          })
          console.log('✅ AI move dispatched successfully');
        } catch (error) {
          console.error('❌ AI move failed:', error)
          // Fallback to random move
          const validMoves = getValidMoves(gameState.board)
          if (validMoves.length > 0) {
            const randomColumn = validMoves[Math.floor(Math.random() * validMoves.length)]
            console.log('🎲 Using fallback random move:', randomColumn);
            dispatch({
              type: 'AI_MOVE',
              payload: { column: randomColumn, thinkingTime: 0 },
            })
          }
        } finally {
          isAIThinkingRef.current = false
        }
      }

      // Add small delay for better UX
      console.log('⏱️ Setting AI move timeout...');
      aiTimeoutRef.current = setTimeout(makeAIMove, 500)
    } else {
      console.log('❌ AI move conditions NOT met');
      console.log('- Status check:', gameState.status === 'IN_PROGRESS');
      console.log('- Player check:', gameState.currentPlayer === 'AI');
      console.log('- Paused check:', !gameState.isPaused);
      console.log('- AI thinking check:', !isAIThinkingRef.current);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current)
      }
    }
  }, [gameState])

  // Auto-save game to history on moves and completion
  useEffect(() => {
    const saveGameToHistory = async () => {
      if (gameState.status === 'NOT_STARTED') return

      try {
        // Transform moves from Move format to GameHistoryMove format
        const transformedMoves = gameState.moves.map((move) => ({
          player: move.player,
          position: { row: move.row, col: move.column },
          timestamp: move.timestamp.getTime(),
          boardState: {
            rows: gameState.board.rows,
            columns: gameState.board.columns,
            grid: gameState.board.grid,
          },
        }))

        // Map game status to winner field for history
        let winner: Player | 'DRAW' | null = null
        if (gameState.status === NewGameStatus.PLAYER_WON) {
          winner = 'HUMAN'
        } else if (gameState.status === NewGameStatus.AI_WON) {
          winner = 'AI'
        } else if (gameState.status === NewGameStatus.PLAYER_1_WON) {
          winner = 'PLAYER_1'
        } else if (gameState.status === NewGameStatus.PLAYER_2_WON) {
          winner = 'PLAYER_2'
        } else if (gameState.status === NewGameStatus.DRAW) {
          winner = 'DRAW'
        }

        const gameData: Omit<GameHistoryEntry, 'id' | 'createdAt'> = {
          playerId: 'default',
          playerDisc: gameState.playerDisc,
          aiDisc: gameState.gameMode === 'SINGLE_PLAYER' ? gameState.aiDisc : undefined,
          difficulty: gameState.gameMode === 'SINGLE_PLAYER' ? gameState.difficulty : undefined,
          status: gameState.status,
          winner,
          moves: transformedMoves,
          duration: gameState.startedAt ? new Date().getTime() - gameState.startedAt.getTime() : 0,
          completedAt: gameState.status !== NewGameStatus.IN_PROGRESS && gameState.status !== NewGameStatus.PAUSED ? new Date() : null,
          metadata: {
            ...(gameState.gameMode === 'MULTIPLAYER' ? {
              gameMode: 'MULTIPLAYER' as const,
              players: gameState.players || []
            } : {
              gameMode: 'SINGLE_PLAYER' as const,
              aiThinkTime: 0,
              playerThinkTime: 0
            }),
            boardState: {
              rows: gameState.board.rows,
              columns: gameState.board.columns,
              grid: gameState.board.grid,
            },
            ...(gameState.winningLine && { winningLine: gameState.winningLine }),
          }
        } as any

        await historyService.saveGame(gameData)

        // Cleanup completed games from persistence
        if (gameState.status === NewGameStatus.PLAYER_WON || gameState.status === NewGameStatus.AI_WON || gameState.status === NewGameStatus.DRAW) {
          // await persistenceService.clearGame() // TODO: Implement this method
        }
      } catch (error) {
        console.error('Failed to save game to history:', error)
      }
    }

    saveGameToHistory()
  }, [gameState.moves.length, gameState.status])

  // Action handlers
  const startNewGame = useCallback(
    (difficulty: Difficulty, playerDisc: DiscColor) => {
      dispatch({ type: 'START_GAME', payload: { difficulty, playerDisc } })
      setBoardUIState(prev => ({ ...prev, hoveredColumn: null }))
    },
    []
  )

  const startMultiplayerGame = useCallback(
    (players: PlayerInfo[]) => {
      dispatch({ type: 'START_MULTIPLAYER_GAME', payload: { players } })
      setBoardUIState(prev => ({ ...prev, hoveredColumn: null }))
    },
    []
  )

  const makeMove = useCallback(
    (column: number) => {
      if (gameState.status === 'IN_PROGRESS' && gameState.currentPlayer === 'HUMAN') {
        dispatch({ type: 'MAKE_MOVE', payload: { column } })
      }
    },
    [gameState.status, gameState.currentPlayer]
  )

  const makeMultiplayerMove = useCallback(
    (column: number, player: PlayerInfo) => {
      if (gameState.status === 'IN_PROGRESS' && gameState.gameMode === 'MULTIPLAYER') {
        dispatch({ type: 'MAKE_MULTIPLAYER_MOVE', payload: { column, player } })
      }
    },
    [gameState.status, gameState.gameMode]
  )

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' })
    setBoardUIState(prev => ({ ...prev, hoveredColumn: null }))
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current)
      isAIThinkingRef.current = false
    }
  }, [])

  const pauseGame = useCallback(() => {
    if (gameState.status === 'IN_PROGRESS') {
      dispatch({ type: 'PAUSE_GAME' })
    }
  }, [gameState.status])

  const resumeGame = useCallback(() => {
    if (gameState.status === NewGameStatus.PAUSED) {
      dispatch({ type: 'RESUME_GAME' })
    }
  }, [gameState.status])

  const updateSettings = useCallback(
    (settings: Partial<{ difficulty: Difficulty; playerDisc: DiscColor }>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
    },
    []
  )

  // UI action handlers
  const setHoveredColumn = useCallback(
    (column: number | null) => {
      setBoardUIState(prev => ({ ...prev, hoveredColumn: column }))
    },
    []
  )

  const startAnimation = useCallback(
    (type: 'drop' | 'win', column?: number, row?: number) => {
      setBoardUIState(prev => {
        const newState = {
          ...prev,
          isAnimating: true,
          animationType: type,
        }

        if (column !== undefined && row !== undefined) {
          newState.animationTarget = { column, row }
        } else {
          delete newState.animationTarget
        }

        return newState
      })
    },
    []
  )

  const endAnimation = useCallback(() => {
    setBoardUIState(prev => {
      const newState = {
        ...prev,
        isAnimating: false,
        animationType: 'none' as const,
      }
      delete newState.animationTarget
      return newState
    })
  }, [])

  // Computed values
  const isAIThinking = isAIThinkingRef.current
  const canPlayerMove =
    gameState.status === 'IN_PROGRESS' &&
    gameState.currentPlayer === 'HUMAN' &&
    !gameState.isPaused

  const canPause = gameState.status === 'IN_PROGRESS' && !gameState.isPaused
  const canResume = gameState.status === NewGameStatus.PAUSED

  const gameStats = {
    totalMoves: gameState.moves?.length || 0,
    duration: gameState.startedAt ? formatDuration(new Date().getTime() - gameState.startedAt.getTime()) : '0s',
    isValid: isValidGameState(gameState),
  }

  // Board helpers
  const isValidMoveHandler = useCallback(
    (column: number) => {
      return isValidMove(gameState.board, column)
    },
    [gameState.board]
  )

  const getValidMovesHandler = useCallback(() => {
    return getValidMoves(gameState.board)
  }, [gameState.board])

  const getCellOwner = useCallback(
    (row: number, col: number) => {
      const cell = gameState.board.grid[row]?.[col]
      if (cell === gameState.playerDisc) return 'HUMAN'
      if (cell === gameState.aiDisc) return 'AI'
      return null
    },
    [gameState.board, gameState.playerDisc, gameState.aiDisc]
  )

  const isLastMove = useCallback(
    (row: number, col: number) => {
      const lastMove = gameState.moves[gameState.moves.length - 1]
      return lastMove?.row === row && lastMove?.column === col
    },
    [gameState.moves]
  )

  const isWinningCell = useCallback(
    (row: number, col: number) => {
      return gameState.winningLine?.some(cell => cell.row === row && cell.col === col) || false
    },
    [gameState.winningLine]
  )

  return {
    gameState,
    boardUIState,
    startNewGame,
    startMultiplayerGame,
    makeMove,
    makeMultiplayerMove,
    resetGame,
    pauseGame,
    resumeGame,
    updateSettings,
    setHoveredColumn,
    startAnimation,
    endAnimation,
    isAIThinking,
    canPlayerMove,
    canPause,
    canResume,
    gameStats,
    isValidMove: isValidMoveHandler,
    getValidMoves: getValidMovesHandler,
    getCellOwner,
    isLastMove,
    isWinningCell,
    loadIncompleteGame,
  }
}

// Helper functions

// Convert NewGameState to the old GameState format for persistence service
function convertToPersistenceFormat(newState: NewGameState) {
  const result: any = {
    id: newState.id,
    board: newState.board,
    status: newState.status as any,
    currentPlayer: newState.currentPlayer,
    playerDisc: newState.playerDisc,
    aiDisc: newState.aiDisc,
    difficulty: newState.difficulty,
    moves: newState.moves,
    startedAt: newState.startedAt,
    createdAt: newState.createdAt,
    updatedAt: newState.updatedAt,
    duration: newState.duration,
    isPaused: newState.isPaused,
  }

  // Only add winner if it exists (for exactOptionalPropertyTypes)
  if (newState.winner !== undefined) {
    result.winner = newState.winner
  }

  // Only add winningLine if it exists (for exactOptionalPropertyTypes)
  if (newState.winningLine !== undefined) {
    result.winningLine = newState.winningLine
  }

  return result
}

function isValidGameState(state: NewGameState): boolean {
  return state.id !== '' && state.board !== null
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}
