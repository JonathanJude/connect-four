/**
 * Game Cell Component
 * Individual game board cell with disc rendering and interaction handlers
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { type CellProps } from '@/types/game'

/**
 * Game Cell Component
 *
 * Represents a single cell on the Connect Four board.
 * Handles disc rendering, hover effects, and click interactions.
 */
export const Cell = React.memo(function Cell({
  row,
  col,
  disc,
  isLastMove,
  isWinningCell,
  onHover,
  onLeave,
  onClick,
  disabled,
}: CellProps) {
  const cellRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Handle drop animation with Tailwind classes
  useEffect(() => {
    if (disc && !isLastMove) {
      setIsAnimating(true)
      const animationDuration = prefersReducedMotion ? 0 : 500
      const timer = setTimeout(() => setIsAnimating(false), animationDuration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [disc, isLastMove, prefersReducedMotion])

  // Handle hover state
  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true)
      onHover(col)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onLeave()
  }

  const handleClick = () => {
    if (!disabled && !disc) {
      onClick(col)
    }
  }

  // Keyboard accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && !disc) {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault()
          onClick(col)
          break
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          // Allow arrow key navigation to pass through to parent
          break
      }
    }
  }

  // Cell classes based on state
  const cellClasses = cn(
    // Base styles
    'relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
    'border border-gray-300 rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

    // Background and borders
    'bg-gradient-to-br from-blue-50 to-blue-100',
    'dark:from-gray-800 dark:to-gray-700',
    'border-blue-200 dark:border-gray-600',

    // Hover effect with animation
    !disabled && !disc && [
      'hover:from-blue-100 hover:to-blue-200 hover:border-blue-300',
      'dark:hover:from-gray-700 dark:hover:to-gray-600 dark:hover:border-gray-500',
      !prefersReducedMotion && 'hover:animate-hover-column'
    ],

    // Disabled state
    disabled && 'opacity-60 cursor-not-allowed',

    // Winning cell animation with reduced motion support
    isWinningCell && [
      'ring-2 ring-yellow-400 ring-opacity-75',
      !prefersReducedMotion ? 'animate-cell-win-glow' : 'bg-yellow-400 bg-opacity-20'
    ],

    // Last move indicator with subtle animation
    isLastMove && [
      'ring-2 ring-green-400 ring-opacity-50',
      !prefersReducedMotion && 'animate-pulse'
    ],
  )

  // Disc classes based on disc color and state
  const getDiscClasses = useCallback(() => {
    const baseClasses = cn(
      'absolute inset-1 rounded-full transition-all duration-300',
      'shadow-md transform',
    )

    if (!disc) {
      return cn(baseClasses, 'bg-transparent')
    }

    const discColorClasses = {
      red: cn(
        'bg-gradient-to-br from-red-500 to-red-600',
        'shadow-red-200 dark:shadow-red-900',
        'ring-1 ring-red-300 dark:ring-red-700'
      ),
      yellow: cn(
        'bg-gradient-to-br from-yellow-400 to-yellow-500',
        'shadow-yellow-200 dark:shadow-yellow-900',
        'ring-1 ring-yellow-300 dark:ring-yellow-700'
      ),
    }

    // Animation classes with reduced motion support
    const animationClasses = [
      isAnimating && !prefersReducedMotion && 'animate-disc-drop',
      isHovered && !disabled && !prefersReducedMotion && 'hover:scale-110 hover:shadow-lg',
      !isAnimating && !isHovered && 'scale-100'
    ].filter(Boolean)

    return cn(
      baseClasses,
      discColorClasses[disc],
      animationClasses,
      // Enhanced shine effect with animation
      'before:absolute before:top-1 before:left-2 before:w-2 before:h-2',
      'before:bg-white before:rounded-full before:opacity-30',
      !prefersReducedMotion && 'before:animate-pulse',
    )
  }, [disc, isAnimating, isHovered, disabled, prefersReducedMotion])

  // Hover preview disc (for empty cells)
  const renderHoverPreview = useCallback(() => {
    if (!isHovered || disc || disabled) return null

    const previewColor = col % 2 === 0 ? 'red' : 'yellow' // Alternate for visual variety

    const previewClasses = cn(
      'absolute inset-1 rounded-full transition-all duration-300',
      'opacity-30 hover:opacity-50',
      !prefersReducedMotion && 'animate-bounce',
      previewColor === 'red'
        ? 'bg-red-400 dark:bg-red-600'
        : 'bg-yellow-300 dark:bg-yellow-500'
    )

    return <div className={previewClasses} />
  }, [isHovered, disc, disabled, col, prefersReducedMotion])

  // Cell position indicator (for debugging)
  const renderPositionIndicator = () => {
    if (process.env.NODE_ENV !== 'development') return null

    return (
      <div className="absolute top-0 left-0 text-xs text-gray-400 opacity-50">
        {row},{col}
      </div>
    )
  }

  return (
    <div
      ref={cellRef}
      className={cellClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={!disabled && !disc ? 0 : -1}
      role="gridcell"
      aria-label={getCellLabel(row, col, disc, isLastMove, isWinningCell)}
      aria-rowindex={row + 1}
      aria-colindex={col + 1}
      aria-disabled={disabled || !!disc}
      aria-pressed={!!disc}
      aria-selected={isLastMove || isWinningCell}
      data-row={row}
      data-col={col}
      data-disc={disc || 'empty'}
      data-last-move={isLastMove}
      data-winning={isWinningCell}
    >
      {/* Hover preview */}
      {renderHoverPreview()}

      {/* Main disc */}
      <div className={getDiscClasses()} />

      {/* Winning cell effect with enhanced animation */}
      {isWinningCell && (
        <div className={cn(
          'absolute inset-0 rounded-lg pointer-events-none',
          !prefersReducedMotion
            ? 'bg-yellow-400 bg-opacity-20 animate-cell-win-glow'
            : 'bg-yellow-400 bg-opacity-40 ring-2 ring-yellow-400'
        )} />
      )}

      {/* Last move indicator dot with animation */}
      {isLastMove && (
        <div className={cn(
          'absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full',
          !prefersReducedMotion && 'animate-ping'
        )} />
      )}

      {/* Position indicator (dev only) */}
      {renderPositionIndicator()}

      {/* Accessibility live region for state changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {disc && `Placed ${disc} disc at row ${row + 1}, column ${col + 1}`}
        {isWinningCell && 'Winning position'}
        {isLastMove && 'Last move'}
        {!disc && !disabled && `Empty cell at row ${row + 1}, column ${col + 1}`}
      </div>
    </div>
  )
})

// Utility functions

/**
 * Get cell accessibility label
 */
function getCellLabel(
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