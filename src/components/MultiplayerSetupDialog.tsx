/**
 * Multiplayer Setup Dialog Component
 * Allows players to configure their names and colors before starting a multiplayer game
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlayerInfo, DiscColor } from '@/lib/game/constants'
import {
  createCustomPlayers,
  validateMultiplayerSetup,
  getPlayerColorClass,
} from '@/lib/player-management'

interface MultiplayerSetupDialogProps {
  isOpen: boolean
  onClose: () => void
  onStartGame: (players: PlayerInfo[]) => void
  initialPlayers?: PlayerInfo[]
}

export function MultiplayerSetupDialog({
  isOpen,
  onClose,
  onStartGame,
  initialPlayers
}: MultiplayerSetupDialogProps) {
  const [player1Name, setPlayer1Name] = useState(initialPlayers?.[0]?.name || 'Player 1')
  const [player2Name, setPlayer2Name] = useState(initialPlayers?.[1]?.name || 'Player 2')
  const [player1Disc, setPlayer1Disc] = useState<DiscColor>(initialPlayers?.[0]?.discColor || 'red')
  const [player2Disc, setPlayer2Disc] = useState<DiscColor>(initialPlayers?.[1]?.discColor || 'yellow')
  const [errors, setErrors] = useState<string[]>([])

  if (!isOpen) return null

  const handleStartGame = () => {
    const players = createCustomPlayers(player1Name, player2Name, player1Disc, player2Disc)
    const validationErrors = validateMultiplayerSetup(players)

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    onStartGame(players)
  }

  const handleSwitchColors = () => {
    const [newPlayer1Disc, newPlayer2Disc] = [player2Disc, player1Disc]
    setPlayer1Disc(newPlayer1Disc)
    setPlayer2Disc(newPlayer2Disc)
  }

  const handleClose = () => {
    setErrors([])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              Multiplayer Setup
            </h2>
            <p className="text-gray-200 mt-1">
              Configure your game settings
            </p>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-sm text-red-100">
                {errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}

          {/* Player 1 Configuration */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">
              Player 1
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all"
                  placeholder="Enter player name"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Disc Color
                </label>
                <div className="flex space-x-2">
                  {(['red', 'yellow'] as DiscColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setPlayer1Disc(color)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all backdrop-blur-sm ${
                        player1Disc === color
                          ? 'bg-white/30 border-white/50 shadow-lg transform scale-105'
                          : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${getPlayerColorClass(color)}`} />
                        <span className="text-sm font-medium text-white capitalize">
                          {color}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Player 2 Configuration */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">
              Player 2
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-300 backdrop-blur-sm transition-all"
                  placeholder="Enter player name"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Disc Color
                </label>
                <div className="flex space-x-2">
                  {(['red', 'yellow'] as DiscColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setPlayer2Disc(color)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all backdrop-blur-sm ${
                        player2Disc === color
                          ? 'bg-white/30 border-white/50 shadow-lg transform scale-105'
                          : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-4 h-4 rounded-full ${getPlayerColorClass(color)}`} />
                        <span className="text-sm font-medium text-white capitalize">
                          {color}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-center">
            <Button
              onClick={handleSwitchColors}
              variant="outline"
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>Switch Colors</span>
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartGame}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
            >
              Start Game
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
