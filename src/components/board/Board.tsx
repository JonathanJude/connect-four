/**
 * Game Board Component
 * 7x6 grid board with hover preview, keyboard navigation, and visual feedback
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { type BoardProps } from '@/types/game'
import { type Board as BoardDataType } from '@/lib/game/constants'
import { Cell } from './Cell'
import { getCellLabel } from './CellVariants'

/**
 * Game Board Component
 *
 * Main game board component that renders the 7x6 Connect Four grid.
 * Handles column interactions, hover previews, and keyboard navigation.
 */
export const Board = React.memo(function Board({
  board,
  lastMove,
  winningLine,
  onColumnClick,
  onColumnHover,
  onColumnLeave,
  disabled,
  showHoverPreview,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null)
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [announcement, setAnnouncement] = useState<string>('')

  // Screen reader announcement function
  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncement(message)
    // Clear after announcement
    setTimeout(() => setAnnouncement(''), 1000)
  }, [])

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

  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        setFocusedColumn(prev => {
          if (prev === null) return Math.floor(board.columns / 2)
          return Math.max(0, prev - 1)
        })
        // Announce column change to screen readers
        if (focusedColumn !== null && focusedColumn > 0) {
          const newColumn = focusedColumn - 1
          announceToScreenReader(`Column ${newColumn + 1}`)
        }
        break

      case 'ArrowRight':
        event.preventDefault()
        setFocusedColumn(prev => {
          if (prev === null) return Math.floor(board.columns / 2)
          return Math.min(board.columns - 1, prev + 1)
        })
        // Announce column change to screen readers
        if (focusedColumn !== null && focusedColumn < board.columns - 1) {
          const newColumn = focusedColumn + 1
          announceToScreenReader(`Column ${newColumn + 1}`)
        }
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedColumn !== null) {
          onColumnClick(focusedColumn)
          announceToScreenReader(`Move made in column ${focusedColumn + 1}`)
        }
        break

      case 'Escape':
        event.preventDefault()
        setFocusedColumn(null)
        onColumnLeave()
        announceToScreenReader('Focus cleared from board')
        break

      case 'Tab':
        // Allow tab navigation but manage focus
        if (event.shiftKey) {
          // Shift+Tab: move to previous focusable element
          setFocusedColumn(null)
        }
        break

      case 'Home':
        event.preventDefault()
        setFocusedColumn(0)
        announceToScreenReader('Column 1')
        break

      case 'End':
        event.preventDefault()
        setFocusedColumn(board.columns - 1)
        announceToScreenReader(`Column ${board.columns}`)
        break
    }
  }, [board.columns, disabled, focusedColumn, onColumnClick, onColumnLeave])

  // Handle column hover
  const handleColumnHover = useCallback((column: number) => {
    if (!disabled) {
      setHoveredColumn(column)
      onColumnHover(column)
    }
  }, [disabled, onColumnHover])

  // Handle column leave
  const handleColumnLeave = useCallback(() => {
    setHoveredColumn(null)
    onColumnLeave()
  }, [onColumnLeave])

  // Check if a column is valid for moves
  const isValidColumn = useCallback((column: number) => {
    return column >= 0 && column < board.columns && board.grid[0]?.[column] === null
  }, [board])

  // Handle touch interactions for mobile
  const handleTouchStart = useCallback((column: number) => {
    if (!disabled && isValidColumn(column)) {
      setFocusedColumn(column)
    }
  }, [disabled, isValidColumn])

  const handleTouchEnd = useCallback((column: number) => {
    if (!disabled && isValidColumn(column)) {
      onColumnClick(column)
      setFocusedColumn(null)
    }
  }, [disabled, isValidColumn, onColumnClick])

  
  // Reset focus when disabled
  useEffect(() => {
    if (disabled) {
      setFocusedColumn(null)
      setHoveredColumn(null)
    }
  }, [disabled])

  // Check if a column should show hover preview
  const shouldShowHoverPreview = useCallback((column: number) => {
    return showHoverPreview && !disabled && isValidColumn(column) && (hoveredColumn === column || focusedColumn === column)
  }, [showHoverPreview, disabled, isValidColumn, hoveredColumn, focusedColumn])

  // Get column classes with enhanced hover animations
  const getColumnClasses = useCallback((column: number) => {
    const isValid = isValidColumn(column)
    const isFocused = focusedColumn === column
    const isHovered = hoveredColumn === column

    return cn(
      // Base styles
      'relative flex flex-col-reverse gap-1 p-2',
      'transition-all duration-200 ease-in-out',

      // Interactive state
      isValid && !disabled && 'cursor-pointer',

      // Focus styles with animation
      isFocused && [
        'ring-2 ring-blue-500 ring-offset-2 rounded-lg',
        !prefersReducedMotion && 'animate-pulse'
      ],
      isFocused && isValid && !disabled && 'bg-blue-50 dark:bg-blue-900/20',

      // Hover styles with animation
      isHovered && isValid && !disabled && [
        'bg-blue-100 dark:bg-blue-800/30',
        !prefersReducedMotion && 'animate-hover-column transform scale-105'
      ],
      !isValid && 'opacity-60',
    )
  }, [isValidColumn, focusedColumn, hoveredColumn, disabled, prefersReducedMotion])

  // Render hover indicator for column with enhanced animation
  const renderHoverIndicator = useCallback((column: number) => {
    if (!shouldShowHoverPreview(column)) return null

    const indicatorClasses = cn(
      'absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2',
      'w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-50 transition-all duration-200',
      !prefersReducedMotion && 'animate-bounce hover:animate-pulse',
      column % 2 === 0
        ? 'bg-red-400 dark:bg-red-600 hover:bg-red-500'
        : 'bg-yellow-400 dark:bg-yellow-500 hover:bg-yellow-400'
    )

    return <div className={indicatorClasses} />
  }, [shouldShowHoverPreview, prefersReducedMotion])

  // Render column header (for accessibility)
  const renderColumnHeader = (column: number) => {
    if (process.env.NODE_ENV !== 'development') return null

    return (
      <div className="text-xs text-gray-500 text-center mb-1">
        Col {column + 1}
      </div>
    )
  }

  // Board container classes - responsive sizing with victory animation
  const boardClasses = cn(
    'inline-block bg-gradient-to-br from-blue-200 to-blue-300',
    'dark:from-gray-800 dark:to-gray-700',
    'p-2 sm:p-4 rounded-2xl shadow-2xl border-2 border-blue-300 dark:border-gray-600',
    'transition-all duration-300',
    'w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl',
    disabled && 'opacity-70',
    // Victory animation with reduced motion support
    winningLine && [
      !prefersReducedMotion && 'animate-victory-pulse border-yellow-400 shadow-yellow-400/50',
      prefersReducedMotion && 'border-yellow-400 bg-yellow-400/10'
    ]
  )

  // Grid container classes - responsive gap and sizing
  const gridClasses = cn(
    'grid gap-1 sm:gap-2',
    'grid-cols-7' // Fixed 7 columns for Connect Four
  )

  return (
    <div
      ref={boardRef}
      className={boardClasses}
      role="grid"
      aria-label="Connect Four game board"
      aria-rowcount={board.rows}
      aria-colcount={board.columns}
      aria-busy={disabled}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      data-board-disabled={disabled}
    >
      {/* Column headers and hover indicators */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: board.columns }, (_, col) => (
          <div
            key={`header-${col}`}
            className="relative h-8 sm:h-10 flex flex-col items-center justify-center"
            onMouseEnter={() => handleColumnHover(col)}
            onMouseLeave={handleColumnLeave}
            onTouchStart={() => handleTouchStart(col)}
            onTouchEnd={() => handleTouchEnd(col)}
            role="columnheader"
            aria-label={`Column ${col + 1}`}
            aria-selected={focusedColumn === col}
            aria-disabled={disabled || !isValidColumn(col)}
            tabIndex={focusedColumn === col ? 0 : -1}
          >
            {renderHoverIndicator(col)}
            {renderColumnHeader(col)}
          </div>
        ))}
      </div>

      {/* Main game grid */}
      <div className={gridClasses}>
        {Array.from({ length: board.rows }, (_, row) =>
          Array.from({ length: board.columns }, (_, col) => {
            const disc = board.grid[row]?.[col] || null
            const isLastMoveCell = lastMove?.row === row && lastMove?.col === col
            const isWinningCell = winningLine?.some(cell => cell.row === row && cell.col === col) || false

            return (
              <div
                key={`${row}-${col}`}
                className={getColumnClasses(col)}
                onMouseEnter={() => handleColumnHover(col)}
                onMouseLeave={handleColumnLeave}
                role="gridcell"
                aria-rowindex={row + 1}
                aria-colindex={col + 1}
                aria-label={getCellLabel(row, col, disc, isLastMoveCell, isWinningCell)}
                data-row={row}
                data-col={col}
                data-disc={disc || 'empty'}
              >
                <Cell
                  row={row}
                  col={col}
                  disc={disc}
                  isLastMove={isLastMoveCell}
                  isWinningCell={isWinningCell}
                  onHover={() => handleColumnHover(col)}
                  onLeave={() => handleColumnLeave()}
                  onClick={() => onColumnClick(col)}
                  disabled={disabled || !isValidColumn(col)}
                />
              </div>
            )
          })
        )}
      </div>

      {/* Board status indicator */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {disabled ? 'Board disabled' : 'Click a column to place your disc'}
        </div>
      </div>

      {/* Accessibility live region for board state changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {winningLine && 'Game won! Winning line highlighted.'}
        {lastMove && `Last move: column ${lastMove.col + 1}, row ${lastMove.row + 1}`}
        {announcement && announcement}
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to navigate columns, Enter or Space to make a move, Escape to clear focus
      </div>
    </div>
  )
})

// Board component variants

/**
 * Compact board variant for smaller screens
 */
const CompactBoard = (props: BoardProps) => {
  return (
    <div className="scale-75 origin-top">
      <Board {...props} />
    </div>
  )
}

/**
 * Large board variant for accessibility
 */
const LargeBoard = (props: BoardProps) => {
  return (
    <div className="scale-125 origin-top">
      <Board {...props} />
    </div>
  )
}

/**
 * Preview board for game setup
 */
const PreviewBoard = ({
  board,
  showLabels = false,
}: {
  board: BoardDataType
  showLabels?: boolean
}) => {
  return (
    <div className="inline-block bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: board.rows }, (_, row) =>
          Array.from({ length: board.columns }, (_, col) => {
            const disc = board.grid[row]?.[col] || null

            return (
              <div
                key={`preview-${row}-${col}`}
                className="w-6 h-6 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center"
              >
                {disc && (
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full',
                      disc === 'red' ? 'bg-red-500' : 'bg-yellow-400'
                    )}
                  />
                )}
                {showLabels && (
                  <span className="text-xs text-gray-500">
                    {row},{col}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// React hook for board interaction state
const useBoardInteraction = (
  _onColumnClick: (column: number) => void,
  disabled: boolean = false
) => {
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null)

  const handleColumnHover = useCallback((column: number) => {
    if (!disabled) {
      setHoveredColumn(column)
    }
  }, [disabled])

  const handleColumnLeave = useCallback(() => {
    setHoveredColumn(null)
  }, [])

  const handleColumnFocus = useCallback((column: number) => {
    if (!disabled) {
      setFocusedColumn(column)
    }
  }, [disabled])

  const handleColumnBlur = useCallback(() => {
    setFocusedColumn(null)
  }, [])

  return {
    hoveredColumn,
    focusedColumn,
    handleColumnHover,
    handleColumnLeave,
    handleColumnFocus,
    handleColumnBlur,
  }
}

// Utility functions

/**
 * Check if board is in a winning state
 */
const isBoardInWinningState = (
  _board: BoardDataType,
  winningLine: { row: number; col: number }[] | null
): boolean => {
  return winningLine !== null && winningLine.length > 0
}

/**
 * Get board statistics
 */
const getBoardStats = (
  board: BoardDataType
): {
  totalDiscs: number
  redDiscs: number
  yellowDiscs: number
  emptyCells: number
  isFull: boolean
} => {
  let redDiscs = 0
  let yellowDiscs = 0

  for (let row = 0; row < board.rows; row++) {
    for (let col = 0; col < board.columns; col++) {
      const disc = board.grid[row]?.[col]
      if (disc === 'red') redDiscs++
      else if (disc === 'yellow') yellowDiscs++
    }
  }

  const totalDiscs = redDiscs + yellowDiscs
  const emptyCells = board.rows * board.columns - totalDiscs
  const isFull = emptyCells === 0

  return {
    totalDiscs,
    redDiscs,
    yellowDiscs,
    emptyCells,
    isFull,
  }
}

export { CompactBoard, LargeBoard, PreviewBoard, useBoardInteraction, isBoardInWinningState, getBoardStats }
