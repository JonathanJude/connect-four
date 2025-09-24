/**
 * Validation Utilities
 * Comprehensive validation for game moves, AI inputs, and user data
 */

import type { Board, Position, Move } from '@/lib/game/rules'
import type { GameSettings } from '@/types/game'

// Validation result type
export interface ValidationResult<T = any> {
  isValid: boolean
  value?: T
  errors: string[]
  warnings?: string[]
}

// Validation rule type
export interface ValidationRule<T = any> {
  name: string
  validate: (value: T) => boolean
  message: string
  severity?: 'error' | 'warning'
}

// Game move validation
export interface MoveValidation {
  column: number
  board: Board
  playerDisc: 'red' | 'yellow'
  gameStatus: string
  isPlayerTurn: boolean
}

/**
 * Validate a game move
 */
export function validateMove(validation: MoveValidation): ValidationResult<number> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if it's player's turn
  if (!validation.isPlayerTurn) {
    errors.push('It is not your turn to make a move')
  }

  // Check game status
  if (validation.gameStatus !== 'IN_PROGRESS') {
    errors.push('Game is not in progress')
  }

  // Check column bounds
  if (validation.column < 0 || validation.column >= validation.board.columns) {
    errors.push(`Column must be between 0 and ${validation.board.columns - 1}`)
  }

  // Check if column is full
  if (validation.board.grid[0][validation.column] !== null) {
    errors.push('Column is full')
  }

  // Warning: Near-full board
  const emptyCells = validation.board.grid.flat().filter(cell => cell === null).length
  if (emptyCells <= 3) {
    warnings.push('Board is almost full')
  }

  // Warning: Center column preference hint
  if (validation.column !== Math.floor(validation.board.columns / 2)) {
    warnings.push('Consider playing in the center column for better strategic position')
  }

  return {
    isValid: errors.length === 0,
    value: validation.column,
    errors,
    warnings
  }
}

/**
 * Validate AI move
 */
export function validateAIMove(
  column: number | null,
  board: Board,
  difficulty: string
): ValidationResult<number | null> {
  const errors: string[] = []
  const warnings: string[] = []

  if (column === null) {
    errors.push('AI returned null move')
    return { isValid: false, errors }
  }

  // Check column bounds
  if (column < 0 || column >= board.columns) {
    errors.push(`AI move column ${column} is out of bounds`)
  }

  // Check if column is full
  if (board.grid[0][column] !== null) {
    errors.push(`AI attempted to move in full column ${column}`)
  }

  // AI-specific warnings
  if (difficulty === 'hard' && column === 0) {
    warnings.push('Hard AI should avoid edge columns when better options exist')
  }

  if (difficulty === 'medium' && Math.random() < 0.1) {
    warnings.push('Medium AI should occasionally miss optimal moves')
  }

  return {
    isValid: errors.length === 0,
    value: column,
    errors,
    warnings
  }
}

/**
 * Validate game settings
 */
export function validateGameSettings(settings: Partial<GameSettings>): ValidationResult<GameSettings> {
  const errors: string[] = []
  const warnings: string[] = []

  const validatedSettings: Partial<GameSettings> = {}

  // Validate difficulty
  if (settings.difficulty) {
    const validDifficulties = ['easy', 'medium', 'hard']
    if (!validDifficulties.includes(settings.difficulty)) {
      errors.push(`Invalid difficulty: ${settings.difficulty}. Must be one of: ${validDifficulties.join(', ')}`)
    } else {
      validatedSettings.difficulty = settings.difficulty
    }
  }

  // Validate player disc color
  if (settings.playerDisc) {
    const validDiscs = ['red', 'yellow']
    if (!validDiscs.includes(settings.playerDisc)) {
      errors.push(`Invalid player disc color: ${settings.playerDisc}. Must be one of: ${validDiscs.join(', ')}`)
    } else {
      validatedSettings.playerDisc = settings.playerDisc
    }
  }

  // Validate animations setting
  if (settings.enableAnimations !== undefined) {
    if (typeof settings.enableAnimations !== 'boolean') {
      errors.push('enableAnimations must be a boolean value')
    } else {
      validatedSettings.enableAnimations = settings.enableAnimations
    }
  }

  // Validate sound setting
  if (settings.enableSound !== undefined) {
    if (typeof settings.enableSound !== 'boolean') {
      errors.push('enableSound must be a boolean value')
    } else {
      validatedSettings.enableSound = settings.enableSound
    }
  }

  // Validate accessibility settings
  if (settings.highContrastMode !== undefined) {
    if (typeof settings.highContrastMode !== 'boolean') {
      errors.push('highContrastMode must be a boolean value')
    } else {
      validatedSettings.highContrastMode = settings.highContrastMode
    }
  }

  // Warnings for potentially problematic settings combinations
  if (settings.enableAnimations === false && settings.enableSound === true) {
    warnings.push('Sound is enabled but animations are disabled. Consider disabling sound for consistency.')
  }

  if (settings.difficulty === 'hard' && settings.playerDisc === 'yellow') {
    warnings.push('Playing as yellow against hard AI may be very challenging.')
  }

  return {
    isValid: errors.length === 0,
    value: validatedSettings as GameSettings,
    errors,
    warnings
  }
}

/**
 * Validate board state
 */
export function validateBoardState(board: Board): ValidationResult<Board> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check board dimensions
  if (board.rows !== 6) {
    errors.push(`Invalid board height: ${board.rows}. Expected 6 rows.`)
  }

  if (board.columns !== 7) {
    errors.push(`Invalid board width: ${board.columns}. Expected 7 columns.`)
  }

  // Check grid structure
  if (!Array.isArray(board.grid) || board.grid.length !== board.rows) {
    errors.push('Board grid has invalid structure')
  }

  // Check each cell
  let redCount = 0
  let yellowCount = 0
  let lastMoveRed = true // Red goes first

  for (let row = 0; row < board.rows; row++) {
    if (!Array.isArray(board.grid[row]) || board.grid[row].length !== board.columns) {
      errors.push(`Row ${row} has invalid structure`)
      continue
    }

    for (let col = 0; col < board.columns; col++) {
      const cell = board.grid[row][col]

      if (cell !== null && cell !== 'red' && cell !== 'yellow') {
        errors.push(`Invalid cell value at (${row}, ${col}): ${cell}`)
      }

      if (cell === 'red') {
        redCount++
      } else if (cell === 'yellow') {
        yellowCount++
      }
    }
  }

  // Check turn order
  if (redCount > yellowCount + 1) {
    errors.push(`Invalid turn order: Red has ${redCount} discs, yellow has ${yellowCount}`)
  }

  if (yellowCount > redCount) {
    errors.push(`Invalid turn order: Yellow cannot have more discs than red`)
  }

  // Check for floating discs
  for (let col = 0; col < board.columns; col++) {
    let foundEmpty = false
    for (let row = board.rows - 1; row >= 0; row--) {
      const cell = board.grid[row][col]
      if (cell === null) {
        foundEmpty = true
      } else if (foundEmpty) {
        errors.push(`Floating disc found at (${row}, ${col})`)
      }
    }
  }

  // Warnings
  if (redCount + yellowCount >= board.rows * board.columns - 1) {
    warnings.push('Board is nearly full - game will end soon')
  }

  if (Math.abs(redCount - yellowCount) > 10) {
    warnings.push('Large disc count difference - check for game balance issues')
  }

  return {
    isValid: errors.length === 0,
    value: board,
    errors,
    warnings
  }
}

/**
 * Validate position
 */
export function validatePosition(position: Position, board: Board): ValidationResult<Position> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check bounds
  if (position.row < 0 || position.row >= board.rows) {
    errors.push(`Row ${position.row} is out of bounds`)
  }

  if (position.col < 0 || position.col >= board.columns) {
    errors.push(`Column ${position.col} is out of bounds`)
  }

  // Check if position is occupied
  if (board.grid[position.row]?.[position.col] !== null) {
    errors.push(`Position (${position.row}, ${position.col}) is already occupied`)
  }

  return {
    isValid: errors.length === 0,
    value: position,
    errors,
    warnings
  }
}

/**
 * Validate move history
 */
export function validateMoveHistory(moves: Move[], board: Board): ValidationResult<Move[]> {
  const errors: string[] = []
  const warnings: string[] = []

  const validMoves: Move[] = []
  const tempBoard = JSON.parse(JSON.stringify(board)) // Deep clone

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]

    // Check move structure
    if (!move.position || typeof move.position.row !== 'number' || typeof move.position.col !== 'number') {
      errors.push(`Move ${i} has invalid position structure`)
      continue
    }

    // Check bounds
    if (move.position.row < 0 || move.position.row >= board.rows) {
      errors.push(`Move ${i} has invalid row: ${move.position.row}`)
      continue
    }

    if (move.position.col < 0 || move.position.col >= board.columns) {
      errors.push(`Move ${i} has invalid column: ${move.position.col}`)
      continue
    }

    // Check if move is valid on current board state
    if (tempBoard.grid[0][move.position.col] !== null) {
      errors.push(`Move ${i} column ${move.position.col} is full`)
      continue
    }

    // Simulate the move
    let placed = false
    for (let row = board.rows - 1; row >= 0; row--) {
      if (tempBoard.grid[row][move.position.col] === null) {
        tempBoard.grid[row][move.position.col] = move.player
        move.position = { row, col: move.position.col } // Update with actual row
        placed = true
        break
      }
    }

    if (!placed) {
      errors.push(`Move ${i} could not be placed`)
      continue
    }

    validMoves.push(move)
  }

  // Check if moves alternate between players
  for (let i = 1; i < validMoves.length; i++) {
    if (validMoves[i].player === validMoves[i - 1].player) {
      warnings.push(`Moves ${i - 1} and ${i} are by the same player`)
    }
  }

  return {
    isValid: errors.length === 0,
    value: validMoves,
    errors,
    warnings
  }
}

/**
 * Generic validation helper
 */
export function validateWithRules<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult<T> {
  const errors: string[] = []
  const warnings: string[] = []

  for (const rule of rules) {
    if (!rule.validate(value)) {
      if (rule.severity === 'warning') {
        warnings.push(rule.message)
      } else {
        errors.push(rule.message)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    value,
    errors,
    warnings
  }
}

/**
 * Create validation rules
 */
export function createValidationRules<T>(definitions: {
  [key: string]: {
    validate: (value: T) => boolean
    message: string
    severity?: 'error' | 'warning'
  }
}): ValidationRule<T>[] {
  return Object.entries(definitions).map(([name, def]) => ({
    name,
    validate: def.validate,
    message: def.message,
    severity: def.severity || 'error'
  }))
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)

  return {
    isValid,
    value: email,
    errors: isValid ? [] : ['Invalid email format']
  }
}

/**
 * Validate URL format
 */
export function validateURL(url: string): ValidationResult<string> {
  try {
    new URL(url)
    return {
      isValid: true,
      value: url,
      errors: []
    }
  } catch {
    return {
      isValid: false,
      value: url,
      errors: ['Invalid URL format']
    }
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): ValidationResult<string> {
  const errors: string[] = []
  let sanitized = input

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '')

  // Check for excessive length
  if (sanitized.length > 1000) {
    errors.push('Input is too long')
    sanitized = sanitized.substring(0, 1000)
  }

  // Check for potential injection attempts
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Input contains potentially dangerous content')
      sanitized = sanitized.replace(pattern, '')
    }
  }

  return {
    isValid: errors.length === 0,
    value: sanitized,
    errors
  }
}