/**
 * Game Mode Selector Component
 * Allows users to choose between single-player and multiplayer modes
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { GameMode } from '@/lib/game/constants'

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode) => void
  disabled?: boolean
}

export function GameModeSelector({ onSelectMode, disabled = false }: GameModeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100">
        Choose Game Mode
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Single Player Mode */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Play vs Computer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Challenge the AI opponent in single-player mode
            </p>
            <Button
              onClick={() => onSelectMode('SINGLE_PLAYER')}
              disabled={disabled}
              className="w-full"
            >
              Play Solo
            </Button>
          </div>
        </Card>

        {/* Multiplayer Mode */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Play vs Friend
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Play with a friend on the same device
            </p>
            <Button
              onClick={() => onSelectMode('MULTIPLAYER')}
              disabled={disabled}
              className="w-full"
            >
              Play Together
            </Button>
          </div>
        </Card>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Use Tab to navigate, Enter to select</p>
      </div>
    </div>
  )
}