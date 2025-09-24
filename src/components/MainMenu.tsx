/**
 * Main Menu Component
 * Provides game mode selection and quick access to game features
 */

'use client'

import React, { useState } from 'react'
import { GameModeSelector } from './GameModeSelector'
import { MultiplayerSetupDialog } from './MultiplayerSetupDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { GameMode, PlayerInfo } from '@/lib/game/constants'
import { createDefaultPlayers } from '@/lib/player-management'

interface MainMenuProps {
  onStartSinglePlayer: (difficulty: 'easy' | 'medium' | 'hard') => void
  onStartMultiplayer: (players: PlayerInfo[]) => void
  disabled?: boolean
}

export function MainMenu({
  onStartSinglePlayer,
  onStartMultiplayer,
  disabled = false
}: MainMenuProps) {
  const [showGameModeSelector, setShowGameModeSelector] = useState(false)
  const [showMultiplayerSetup, setShowMultiplayerSetup] = useState(false)

  const handleModeSelect = (mode: GameMode) => {
    setShowGameModeSelector(false)

    if (mode === 'SINGLE_PLAYER') {
      // For single player, we'll show difficulty selection
      // This will be handled by the parent component
      onStartSinglePlayer('medium') // Default to medium
    } else if (mode === 'MULTIPLAYER') {
      setShowMultiplayerSetup(true)
    }
  }

  const handleMultiplayerStart = (players: PlayerInfo[]) => {
    setShowMultiplayerSetup(false)
    onStartMultiplayer(players)
  }

  const handleQuickSinglePlayer = (difficulty: 'easy' | 'medium' | 'hard') => {
    onStartSinglePlayer(difficulty)
  }

  const handleQuickMultiplayer = () => {
    const defaultPlayers = createDefaultPlayers()
    onStartMultiplayer(defaultPlayers)
  }

  const handleCloseDialogs = () => {
    setShowGameModeSelector(false)
    setShowMultiplayerSetup(false)
  }

  return (
    <div className="space-y-6">
      {/* Quick Play Options */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center text-white">
          Quick Play
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick Single Player */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer border border-white/20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                vs Computer
              </h3>
              <p className="text-sm text-gray-200">
                Challenge the AI opponent
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleQuickSinglePlayer('easy')}
                  disabled={disabled}
                  variant="outline"
                  className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Easy
                </Button>
                <Button
                  onClick={() => handleQuickSinglePlayer('medium')}
                  disabled={disabled}
                  variant="outline"
                  className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Medium
                </Button>
                <Button
                  onClick={() => handleQuickSinglePlayer('hard')}
                  disabled={disabled}
                  variant="outline"
                  className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Hard
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Multiplayer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer border border-white/20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                vs Friend
              </h3>
              <p className="text-sm text-gray-200">
                Play with a friend on the same device
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleQuickMultiplayer}
                  disabled={disabled}
                  variant="outline"
                  className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Quick Start
                </Button>
                <Button
                  onClick={() => setShowMultiplayerSetup(true)}
                  disabled={disabled}
                  variant="outline"
                  className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Custom Setup
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browse Game Modes */}
      <div className="text-center">
        <Button
          onClick={() => setShowGameModeSelector(true)}
          disabled={disabled}
          variant="outline"
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          Browse All Game Modes
        </Button>
      </div>

      {/* Game Mode Selector Modal */}
      {showGameModeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Choose Game Mode
                </h2>
                <Button
                  onClick={handleCloseDialogs}
                  variant="ghost"
                  size="sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <GameModeSelector
                onSelectMode={handleModeSelect}
                disabled={disabled}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Multiplayer Setup Dialog */}
      <MultiplayerSetupDialog
        isOpen={showMultiplayerSetup}
        onClose={handleCloseDialogs}
        onStartGame={handleMultiplayerStart}
      />
    </div>
  )
}