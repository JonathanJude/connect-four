/**
 * Main Game Page
 * Primary game interface with integrated board, controls, and game state management
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Board } from '@/components/board/Board'
import { Controls } from '@/components/panel/Controls'
import { TurnIndicator } from '@/components/panel/TurnIndicator'
import { MainMenu } from '@/components/MainMenu'
import WinCelebration from '@/components/celebration/WinCelebration'
import { useGameState } from '@/hooks/useGameState'
import { useAI } from '@/hooks/useAI'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { GameErrorBoundary } from '@/components/error/ErrorBoundary'
import { useLogger } from '@/lib/logging/logger'
import { validateMove, validateAIMove } from '@/lib/validation/validators'
import { GameStatus, PlayerInfo } from '@/types/game'

/**
 * Convert GameStatus from constants to component format for compatibility
 */
function convertGameStatus(status: any): GameStatus {
  switch (status) {
    case 'IN_PROGRESS': return GameStatus.IN_PROGRESS
    case 'HUMAN_WIN': return GameStatus.PLAYER_WON
    case 'AI_WIN': return GameStatus.AI_WON
    case 'PLAYER_1_WON': return GameStatus.PLAYER_1_WON
    case 'PLAYER_2_WON': return GameStatus.PLAYER_2_WON
    case 'DRAW': return GameStatus.DRAW
    case 'PAUSED': return GameStatus.PAUSED
    case 'NOT_STARTED': return GameStatus.NOT_STARTED
    default: return GameStatus.NOT_STARTED
  }
}

/**
 * Convert winner from game state to WinCelebration format
 */
function convertWinnerForCelebration(winner: any): 'HUMAN' | 'AI' | null {
  if (!winner) return null
  if (winner === 'HUMAN' || winner === 'AI') return winner
  // For multiplayer, map PLAYER_1 and PLAYER_2 to HUMAN for celebration purposes
  if (winner === 'PLAYER_1' || winner === 'PLAYER_2') return 'HUMAN'
  return null
}

/**
 * Game Stats Component
 * Displays current game statistics and information
 */
function GameStats({ gameState }: { gameState: any }) {
  const getGameStats = () => {
    const moves = gameState.moves || []
    const duration = gameState.duration || 0
    const formattedDuration = formatDuration(duration)

    // Handle different game modes
    if (gameState.gameMode === 'MULTIPLAYER') {
      return {
        moves: moves.length,
        duration: formattedDuration,
        currentPlayer: gameState.currentPlayerInfo?.name || 'Unknown',
        gameMode: 'Multiplayer',
        players: gameState.players || [],
      }
    }

    return {
      moves: moves.length,
      duration: formattedDuration,
      currentPlayer: gameState.currentPlayer === 'HUMAN' ? 'You' : 'AI',
      gameMode: 'Single Player',
      difficulty: gameState.difficulty,
    }
  }

  const stats = getGameStats()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 min-h-[80px] flex flex-col justify-center">
        <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
          {stats.moves}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Moves</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 min-h-[80px] flex flex-col justify-center">
        <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 leading-tight">
          {stats.duration}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Duration</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 min-h-[80px] flex flex-col justify-center">
        <div className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400 leading-tight break-words">
          {stats.gameMode}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mode</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 min-h-[80px] flex flex-col justify-center">
        <div className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400 leading-tight break-words">
          {stats.currentPlayer}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Turn</div>
      </div>
    </div>
  )
}

/**
 * Main Game Page Component
 */
export default function GamePage() {
  const { settings } = useSettingsContext()
  const logger = useLogger('game')

  // Simple error handler for now
  const handleError = (error: any, category: string) => {
    console.error(`Error in ${category}:`, error)
  }

  // Simple toast function for now
  const toast = (message: string) => {
    console.log(`Toast: ${message}`)
  }

  const {
    gameState,
    makeMove,
    startNewGame,
    startMultiplayerGame,
    makeMultiplayerMove,
    pauseGame,
    resumeGame,
    resetGame,
    isAIThinking,
  } = useGameState()

  // Initialize accessibility features (commented out for now)
  // useEffect(() => {
  //   highContrast.initialize()
  //   reducedMotion.check()
  // }, [])

  // Announce game state changes (commented out for now)
  // useEffect(() => {
  //   announcer.announceGameState({
  //     status: gameState.status,
  //     currentPlayer: gameState.currentPlayer,
  //     winner: gameState.winner,
  //     lastMove: gameState.moves[gameState.moves.length - 1]?.position
  //   })
  // }, [gameState.status, gameState.currentPlayer, gameState.winner, gameState.moves.length])

  const { getAIMove, cancelCurrentMove } = useAI()
  // Settings dialog functionality commented out for now
  // const { isOpen, openDialog, closeDialog, currentSettings, onSettingsChange } = useSettingsDialog(settings)

  const [boardDisabled, setBoardDisabled] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Show celebration when game is won
  useEffect(() => {
    const convertedStatus = convertGameStatus(gameState.status)
    if ((convertedStatus === GameStatus.PLAYER_WON ||
         convertedStatus === GameStatus.AI_WON ||
         convertedStatus === GameStatus.PLAYER_1_WON ||
         convertedStatus === GameStatus.PLAYER_2_WON) && !showCelebration) {
      setShowCelebration(true)
    }
  }, [gameState.status, showCelebration])

  // Handle AI moves (only for single player mode)
  useEffect(() => {
    if (gameState.gameMode === 'MULTIPLAYER') {
      // In multiplayer mode, AI is not used
      setBoardDisabled(false)
      return
    }

    if (gameState.status === 'IN_PROGRESS' &&
        gameState.currentPlayer === 'AI' &&
        !isAIThinking) {

      setBoardDisabled(true)

      const makeAIMove = async () => {
        try {
          logger.info('ai', `AI (${gameState.difficulty}) starting to think`)

          const aiTimer = logger.startTimer('ai_move')
          const column = await getAIMove(
            gameState.board,
            gameState.aiDisc,
            gameState.playerDisc,
            gameState.difficulty
          )
          aiTimer()

          // Validate AI move
          if (column !== null) {
            const validation = validateAIMove(column, gameState.board, gameState.difficulty)

            if (!validation.isValid) {
              logger.error('ai', `AI returned invalid move in column ${column}`, [
                `Errors: ${validation.errors ? validation.errors.join(', ') : 'none'}`,
                `Board state: ${JSON.stringify(gameState.board)}`,
                `Difficulty: ${gameState.difficulty}`
              ])
              console.error('AI Error: The AI encountered an error. Please try again.')
              return
            }

            if (validation.warnings && validation.warnings.length > 0) {
              logger.warn('ai', `AI move validation warnings for column ${column}`, [
                `Warnings: ${validation.warnings ? validation.warnings.join(', ') : 'none'}`
              ])
            }

            logger.info('ai', `AI selected column ${column}`, [
              `Difficulty: ${gameState.difficulty}`,
              `Move count: ${gameState.moves.length}`
            ])

            await makeMove(column)
          } else {
            logger.warn('ai', 'AI returned null move', [
              `Difficulty: ${gameState.difficulty}`,
              `Board: ${JSON.stringify(gameState.board)}`
            ])
            console.warn('AI Error: The AI could not make a move. Please try again.')
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown AI error'
          logger.error('ai', `AI move failed with error: ${errorMessage}`, [
            `Difficulty: ${gameState.difficulty}`,
            `Board state: ${JSON.stringify(gameState.board)}`
          ])
          console.error('AI Error: The AI encountered an error. Please try again.')
          handleError(error, 'ai-error')
        } finally {
          setBoardDisabled(false)
        }
      }

      makeAIMove()
    } else {
      setBoardDisabled(isAIThinking)
    }
  }, [gameState.gameMode, gameState.status, gameState.currentPlayer, isAIThinking, getAIMove, makeMove, gameState.board, gameState.aiDisc, gameState.playerDisc, gameState.difficulty])

  // Handle column interactions with validation and error handling
  const handleColumnClick = useCallback(async (column: number) => {
    if (gameState.status !== 'IN_PROGRESS' || isAIThinking) {
      return
    }

    // Check if it's a valid turn for the current player
    const isHumanTurn = gameState.currentPlayer === 'HUMAN'
    const isPlayer1Turn = gameState.currentPlayer === 'PLAYER_1'
    const isPlayer2Turn = gameState.currentPlayer === 'PLAYER_2'

    if (!isHumanTurn && !isPlayer1Turn && !isPlayer2Turn) {
      return
    }

    try {
      // For multiplayer games, validate differently
      if (gameState.gameMode === 'MULTIPLAYER') {
        if (!gameState.currentPlayerInfo) {
          console.warn('No current player info available for multiplayer game')
          return
        }

        // Validate multiplayer move
        const validation = validateMove({
          column,
          board: gameState.board,
          playerDisc: gameState.currentPlayerInfo.discColor,
          gameStatus: gameState.status,
          isPlayerTurn: true // In multiplayer, human players always make moves
        })

        if (!validation.isValid) {
          validation.errors.forEach(error => {
            console.warn(`Invalid Move: ${error}`)
            logger.warn('validation', `Invalid multiplayer move attempt: ${error}`, [
              `Column: ${column}`,
              `Player: ${gameState.currentPlayerInfo?.name || 'Unknown'}`,
              `Validation: ${JSON.stringify(validation)}`
            ])
          })
          return
        }

        // Log the multiplayer move attempt
        logger.info('move', `Player ${gameState.currentPlayerInfo?.name || 'Unknown'} attempting move in column ${column}`, [
          `Column: ${column}`,
          `Game state: ${gameState.status}`,
          `Move count: ${gameState.moves.length}`
        ])

        // Make the multiplayer move
        const moveTimer = logger.startTimer('multiplayer_move')
        if (gameState.currentPlayerInfo) {
          await makeMultiplayerMove(column, gameState.currentPlayerInfo)
        }
        moveTimer()

        logger.info('move', `Player ${gameState.currentPlayerInfo?.name || 'Unknown'} successfully moved in column ${column}`, [])
      } else {
        // Single player game
        const validation = validateMove({
          column,
          board: gameState.board,
          playerDisc: gameState.playerDisc,
          gameStatus: gameState.status,
          isPlayerTurn: gameState.currentPlayer === 'HUMAN'
        })

        if (!validation.isValid) {
          validation.errors.forEach(error => {
            console.warn(`Invalid Move: ${error}`)
            logger.warn('validation', `Invalid move attempt: ${error}`, [
              `Column: ${column}`,
              `Validation: ${JSON.stringify(validation)}`
            ])
          })
          return
        }

        // Show validation warnings
        if (validation.warnings && validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            console.log(`Strategy Tip: ${warning}`)
          })
        }

        // Log the move attempt
        logger.info('move', `Player attempting move in column ${column}`, [
          `Column: ${column}`,
          `Game state: ${gameState.status}`,
          `Move count: ${gameState.moves.length}`
        ])

        // Make the move with timing
        const moveTimer = logger.startTimer('player_move')
        await makeMove(column)
        moveTimer()

        logger.info('move', `Player successfully moved in column ${column}`, [])
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      logger.error('move', `Failed to make move in column ${column}`, [`Error: ${errorMessage}`, `Column: ${column}`])
      console.error('Move Failed: Unable to complete your move. Please try again.')
      handleError(error, 'game-state')
    }
  }, [gameState.status, gameState.currentPlayer, gameState.gameMode, gameState.currentPlayerInfo, isAIThinking, makeMove, makeMultiplayerMove, gameState.board, gameState.playerDisc, logger, handleError])

  const handleColumnHover = useCallback((_column: number) => {
    // Handle hover preview logic here if needed
  }, [])

  const handleColumnLeave = useCallback(() => {
    // Handle hover leave logic here if needed
  }, [])

  // Game control handlers with error handling and logging

  const handlePause = useCallback(() => {
    try {
      logger.info('game', 'Pausing game', [])
      pauseGame()
      console.log('Game Paused: Game has been paused. Click resume to continue.')
    } catch (error) {
      logger.error('game', `Failed to pause game: ${error instanceof Error ? error.message : error}`, [])
      console.error('Pause Error: Unable to pause the game.')
      handleError(error, 'game-state')
    }
  }, [pauseGame, logger, toast, handleError])

  const handleResume = useCallback(() => {
    try {
      logger.info('game', 'Resuming game', [])
      resumeGame()
      console.log('Game Resumed: Game has been resumed!')
    } catch (error) {
      logger.error('game', `Failed to resume game: ${error instanceof Error ? error.message : error}`, [])
      console.error('Resume Error: Unable to resume the game.')
      handleError(error, 'game-state')
    }
  }, [resumeGame, logger, toast, handleError])

  const handleReset = useCallback(() => {
    try {
      setShowCelebration(false)
      logger.info('game', 'Resetting game', [])
      cancelCurrentMove()
      resetGame()
      console.log('Game Reset: Game has been reset to initial state.')
    } catch (error) {
      logger.error('game', `Failed to reset game: ${error instanceof Error ? error.message : error}`, [])
      console.error('Reset Error: Unable to reset the game.')
      handleError(error, 'game-state')
    }
  }, [cancelCurrentMove, resetGame, logger, toast, handleError])

  const handleNewGame = useCallback(() => {
    try {
      setShowCelebration(false)
      logger.info('game', 'Starting new game', [])
      cancelCurrentMove()
      startNewGame(settings.difficulty, settings.playerDisc)
      console.log('New Game: Game started successfully!')
    } catch (error) {
      logger.error('game', `Failed to start new game: ${error instanceof Error ? error.message : error}`, [])
      console.error('Game Error: Unable to start a new game. Please refresh the page.')
      handleError(error, 'game-state')
    }
  }, [cancelCurrentMove, startNewGame, logger, handleError])

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false)
  }, [])

  // Handle starting a new single player game
  const handleStartSinglePlayer = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
    startNewGame(difficulty, 'red')
  }, [startNewGame])

  // Handle starting a new multiplayer game
  const handleStartMultiplayer = useCallback((players: PlayerInfo[]) => {
    startMultiplayerGame(players)
  }, [startMultiplayerGame])



  // Settings functionality commented out for now
  // const handleSettings = useCallback(() => {
  //   openDialog()
  // }, [openDialog])

  // Settings functionality commented out for now
  // const handleSettingsSave = useCallback(() => {
  //   try {
  //     // Validate settings before saving
  //     const validation = validateGameSettings(currentSettings)
  //
  //     if (!validation.isValid) {
  //       validation.errors.forEach(error => {
  //         console.error(`Invalid Settings: ${error}`)
  //       })
  //       return
  //     }
  //
  //     if (validation.warnings && validation.warnings.length > 0) {
  //       validation.warnings.forEach(warning => {
  //         console.warn(`Settings Warning: ${warning}`)
  //       })
  //     }
  //
  //     logger.info('settings', 'Saving game settings', [
  //       `Old settings: ${JSON.stringify(settings)}`,
  //       `New settings: ${JSON.stringify(currentSettings)}`
  //     ])
  //
  //     onSettingsChange(currentSettings)
  //
  //     // Restart game with new settings if needed
  //     if (gameState.status !== 'NOT_STARTED') {
  //       startNewGame(currentSettings.difficulty, currentSettings.playerDisc)
  //     }
  //
  //     console.log('Settings Saved: Game settings have been updated successfully.')
  //
  //   } catch (error) {
  //     logger.error('settings', `Failed to save settings: ${error instanceof Error ? error.message : error}`, [
  //       `Settings: ${JSON.stringify(currentSettings)}`
  //     ])
  //     console.error('Settings Error: Unable to save settings. Please try again.')
  //     handleError(error, 'validation')
  //   }
  // }, [currentSettings, onSettingsChange, gameState.status, startNewGame, settings, logger, toast, handleError])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            handleNewGame()
          }
          break
        case 'p':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            if (gameState.status === 'IN_PROGRESS') {
              handlePause()
            } else if (gameState.status === 'PAUSED') {
              handleResume()
            }
          }
          break
        case 'r':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            handleReset()
          }
          break
        case 's':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            // handleSettings()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewGame, handlePause, handleResume, handleReset, gameState.status])

  return (
    <GameErrorBoundary>
      <div className="min-h-screen flex flex-col">

      {/* Win Celebration Overlay */}
      {showCelebration && (
        <WinCelebration
          gameStatus={convertGameStatus(gameState.status)}
          playerDisc={gameState.playerDisc}
          aiDisc={gameState.aiDisc}
          winner={convertWinnerForCelebration(gameState.winner)}
          onAnimationComplete={handleCelebrationComplete}
        />
      )}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C4</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Connect Four
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/history'}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Mobile-first: Board first, then info below */}
        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Game Board - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 relative">
              <div className="flex justify-center">
                <Board
                  board={gameState.board}
                  lastMove={null}
                  winningLine={gameState.winningLine || null}
                  onColumnClick={handleColumnClick}
                  onColumnHover={handleColumnHover}
                  onColumnLeave={handleColumnLeave}
                  disabled={boardDisabled}
                  showHoverPreview={settings.enableAnimations}
                />
              </div>

              {/* Start Game Overlay */}
              {convertGameStatus(gameState.status) === GameStatus.NOT_STARTED && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                  <div className="text-center text-white p-6 w-full max-w-md">
                    <div className="text-4xl mb-4">🎮</div>
                    <h3 className="text-xl font-bold mb-2">Welcome to Connect Four!</h3>
                    <p className="text-gray-300 mb-4">Choose your game mode to get started</p>
                    <MainMenu
                      onStartSinglePlayer={handleStartSinglePlayer}
                      onStartMultiplayer={handleStartMultiplayer}
                      disabled={isAIThinking}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Info - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1 space-y-6">
            {/* Turn Indicator */}
            <div>
              <TurnIndicator
                currentPlayer={gameState.currentPlayer}
                playerDisc={gameState.playerDisc}
                aiDisc={gameState.aiDisc}
                isAIThinking={isAIThinking}
                gameStatus={convertGameStatus(gameState.status)}
                players={gameState.players || []}
                {...(gameState.currentPlayerInfo && { currentPlayerInfo: gameState.currentPlayerInfo })}
              />
            </div>

            {/* Game Stats */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                Game Stats
              </h2>
              <GameStats gameState={gameState} />
            </div>

            {/* Game Controls */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                Controls
              </h2>
              <Controls
                gameStatus={convertGameStatus(gameState.status)}
                onNewGame={handleNewGame}
                onPause={handlePause}
                onResume={handleResume}
                onReset={handleReset}
                onSettings={() => {
                    // For now, show a toast or alert that settings are coming soon
                    alert('Game settings will be available in a future update!')
                  }}
                disabled={isAIThinking}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Settings Dialog - Lazy Loaded - Commented out for now */}
      {/* {isOpen && (
        <LazySettingsDialogWithFallback
          isOpen={isOpen}
          onClose={closeDialog}
          settings={currentSettings}
          onSettingsChange={onSettingsChange}
          onSave={handleSettingsSave}
        />
      )} */}

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="font-medium mb-1">Shortcuts:</div>
        <div>N: New Game | P: Pause | R: Reset | S: Settings</div>
      </div>
    </div>
      </GameErrorBoundary>
  )
}

/**
 * Utility function to format duration
 */
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}