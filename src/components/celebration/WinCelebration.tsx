/**
 * Win Celebration Component
 * Animated overlay with confetti and celebration effects when someone wins
 */

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { type GameStatus } from '@/types/game'

interface WinCelebrationProps {
  gameStatus: GameStatus
  playerDisc: 'red' | 'yellow'
  aiDisc: 'red' | 'yellow'
  winner: 'HUMAN' | 'AI' | null
  onAnimationComplete?: () => void
}

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  delay: number
  duration: number
}

const WinCelebration: React.FC<WinCelebrationProps> = ({
  gameStatus,
  playerDisc,
  aiDisc,
  winner,
  onAnimationComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])
  const [fireworks, setFireworks] = useState<{ id: number; x: number; y: number }[]>([])

  // Generate confetti pieces
  const generateConfetti = useCallback(() => {
    const colors = winner === 'HUMAN'
      ? ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669'] // Green colors for player win
      : ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#dc2626'] // Red colors for AI win

    const pieces: ConfettiPiece[] = []
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)] || '#10b981',
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      })
    }
    return pieces
  }, [winner])

  // Generate fireworks
  const generateFireworks = useCallback(() => {
    const fireworks: { id: number; x: number; y: number }[] = []
    for (let i = 0; i < 5; i++) {
      fireworks.push({
        id: i,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 40,
      })
    }
    return fireworks
  }, [])

  // Handle celebration start
  useEffect(() => {
    if ((gameStatus === 'PLAYER_WON' || gameStatus === 'AI_WON') && winner) {
      setIsVisible(true)
      setConfettiPieces(generateConfetti())
      setFireworks(generateFireworks())

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false)
        onAnimationComplete?.()
      }, 8000)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [gameStatus, winner, generateConfetti, generateFireworks, onAnimationComplete])

  // Handle close manually
  const handleClose = () => {
    setIsVisible(false)
    onAnimationComplete?.()
  }

  if (!isVisible || !winner) return null

  const isPlayerWin = winner === 'HUMAN'
  const winColor = isPlayerWin ? 'text-green-500' : 'text-red-500'
  const bgColor = isPlayerWin ? 'bg-green-500/10' : 'bg-red-500/10'
  const borderColor = isPlayerWin ? 'border-green-500/30' : 'border-red-500/30'
  const discColor = isPlayerWin ? playerDisc : aiDisc

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop with blur */}
      <div className={cn(
        'absolute inset-0 backdrop-blur-sm transition-all duration-1000',
        bgColor
      )} />

      {/* Confetti animation */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm pointer-events-none"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards`,
          }}
        />
      ))}

      {/* Fireworks */}
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full pointer-events-none"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            animation: 'firework-burst 2s ease-out forwards',
          }}
        />
      ))}

      {/* Main celebration overlay */}
      <div className={cn(
        'relative bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 shadow-2xl border-2',
        borderColor,
        'pointer-events-auto transform transition-all duration-500',
        'animate-scale-in'
      )}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Victory emoji and text */}
        <div className="text-center space-y-6">
          {/* Victory emoji */}
          <div className="text-6xl sm:text-8xl animate-bounce">
            {isPlayerWin ? '🎉' : '🤖'}
          </div>

          {/* Winner disc */}
          <div className="flex justify-center">
            <div className={cn(
              'w-16 h-16 rounded-full shadow-lg',
              discColor === 'red' && 'bg-gradient-to-br from-red-500 to-red-600',
              discColor === 'yellow' && 'bg-gradient-to-br from-yellow-400 to-yellow-500',
              'animate-pulse'
            )} />
          </div>

          {/* Win message */}
          <div className="space-y-2">
            <h2 className={cn(
              'text-3xl sm:text-5xl font-bold',
              winColor,
              'animate-pulse'
            )}>
              {isPlayerWin ? 'Victory!' : 'AI Wins!'}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
              {isPlayerWin
                ? 'Congratulations! You played an excellent game!'
                : 'The AI played a perfect strategy. Better luck next time!'
              }
            </p>
          </div>

          {/* Celebration stats */}
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">🏆</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Achievement</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">⭐</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Excellent Play</div>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={handleClose}
            className={cn(
              'px-6 py-3 rounded-lg font-semibold text-white transition-all',
              'hover:scale-105 active:scale-95',
              isPlayerWin
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            )}
          >
            Continue Playing
          </button>
        </div>
      </div>

      {/* Floating emojis */}
      <div className="absolute top-10 left-10 text-2xl animate-float">⭐</div>
      <div className="absolute top-20 right-20 text-2xl animate-float" style={{ animationDelay: '0.5s' }}>🎊</div>
      <div className="absolute bottom-20 left-20 text-2xl animate-float" style={{ animationDelay: '1s' }}>🎈</div>
      <div className="absolute bottom-10 right-10 text-2xl animate-float" style={{ animationDelay: '1.5s' }}>✨</div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes firework-burst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default WinCelebration