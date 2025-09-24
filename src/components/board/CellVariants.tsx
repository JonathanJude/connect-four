/**
 * Cell Component Variants
 * Different sized versions of the Cell component for various contexts
 */

import React from 'react'
import { Cell } from './Cell'
import { type CellProps } from '@/types/game'

/**
 * Smaller cell variant for compact displays
 */
export const CompactCell = React.memo(function CompactCell(props: CellProps) {
  return (
    <Cell {...props} />
  )
})

/**
 * Large cell variant for accessibility
 */
export const LargeCell = React.memo(function LargeCell(props: CellProps) {
  return (
    <Cell {...props} />
  )
})

/**
 * Preview cell for game setup
 */
export const PreviewCell = React.memo(function PreviewCell({
  disc,
  isInteractive = false,
  onClick,
}: {
  disc: 'red' | 'yellow' | null
  isInteractive?: boolean
  onClick?: () => void
}) {
  const cellClasses = `
    relative w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg
    bg-gray-50 dark:bg-gray-800
    ${isInteractive ? 'cursor-pointer hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
  `

  const discClasses = `
    absolute inset-1 rounded-full transition-all duration-200
    ${disc === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-200' : ''}
    ${disc === 'yellow' ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-yellow-200' : ''}
    ${!disc ? 'bg-transparent' : ''}
  `

  return (
    <div
      className={cellClasses}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-label={disc ? `${disc} disc preview` : 'Empty cell preview'}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {disc && <div className={discClasses} />}
    </div>
  )
})

// Utility functions for cell interactions

/**
 * Check if a cell should be interactive
 */
export function isCellInteractive(
  gameState: any,
  row: number,
  col: number
): boolean {
  return (
    gameState.status === 'IN_PROGRESS' &&
    gameState.currentPlayer === 'HUMAN' &&
    !gameState.isPaused &&
    gameState.board.grid[row][col] === null &&
    row === 0 // Only top row cells are clickable
  )
}

/**
 * Get cell accessibility label
 */
export function getCellLabel(
  row: number,
  col: number,
  disc: 'red' | 'yellow' | null,
  isLastMove: boolean,
  isWinningCell: boolean
): string {
  const position = `Row ${row + 1}, column ${col + 1}`

  if (!disc) {
    return `Empty cell at ${position}`
  }

  let label = `${disc.charAt(0).toUpperCase() + disc.slice(1)} disc at ${position}`

  if (isLastMove) {
    label += ', last move'
  }

  if (isWinningCell) {
    label += ', winning position'
  }

  return label
}

// React hook for cell state management
export function useCellState(
  initialDisc: 'red' | 'yellow' | null = null
) {
  const [disc, setDisc] = React.useState<'red' | 'yellow' | null>(initialDisc)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const placeDisc = React.useCallback((color: 'red' | 'yellow') => {
    if (disc === null) {
      setDisc(color)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [disc])

  const clearDisc = React.useCallback(() => {
    setDisc(null)
    setIsAnimating(false)
  }, [])

  return {
    disc,
    isAnimating,
    isHovered,
    setIsHovered,
    placeDisc,
    clearDisc,
  }
}