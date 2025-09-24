/**
 * Player Management Utilities
 * Helper functions for managing player information in multiplayer mode
 */

import { PlayerInfo, DiscColor } from '../lib/game/constants'

/**
 * Create default player info for multiplayer games
 */
export function createDefaultPlayers(): PlayerInfo[] {
  return [
    {
      id: generatePlayerId(),
      name: 'Player 1',
      discColor: 'red',
      type: 'PLAYER_1',
    },
    {
      id: generatePlayerId(),
      name: 'Player 2',
      discColor: 'yellow',
      type: 'PLAYER_2',
    },
  ]
}

/**
 * Create custom players with provided information
 */
export function createCustomPlayers(
  player1Name: string,
  player2Name: string,
  player1Disc: DiscColor = 'red',
  player2Disc: DiscColor = 'yellow'
): PlayerInfo[] {
  // Ensure different colors
  if (player1Disc === player2Disc) {
    player2Disc = player1Disc === 'red' ? 'yellow' : 'red'
  }

  return [
    {
      id: generatePlayerId(),
      name: player1Name.trim() || 'Player 1',
      discColor: player1Disc,
      type: 'PLAYER_1',
    },
    {
      id: generatePlayerId(),
      name: player2Name.trim() || 'Player 2',
      discColor: player2Disc,
      type: 'PLAYER_2',
    },
  ]
}

/**
 * Switch player turns in multiplayer mode
 */
export function switchPlayerTurn(currentPlayer: PlayerInfo, players: PlayerInfo[]): PlayerInfo {
  return currentPlayer.type === 'PLAYER_1' ? players[1] : players[0]
}

/**
 * Get player by type
 */
export function getPlayerByType(players: PlayerInfo[], type: 'PLAYER_1' | 'PLAYER_2'): PlayerInfo | undefined {
  return players.find(player => player.type === type)
}

/**
 * Get the winning player based on game status
 */
export function getWinningPlayer(
  players: PlayerInfo[],
  gameStatus: 'PLAYER_1_WON' | 'PLAYER_2_WON' | 'HUMAN_WIN' | 'AI_WON'
): PlayerInfo | null {
  if (gameStatus === 'PLAYER_1_WON') {
    const player = players.find(p => p.type === 'PLAYER_1')
    return player || null
  }
  if (gameStatus === 'PLAYER_2_WON') {
    const player = players.find(p => p.type === 'PLAYER_2')
    return player || null
  }
  return null
}

/**
 * Validate player information
 */
export function validatePlayerInfo(player: Partial<PlayerInfo>): string[] {
  const errors: string[] = []

  if (!player.name || player.name.trim().length === 0) {
    errors.push('Player name cannot be empty')
  }

  if (player.name && player.name.length > 20) {
    errors.push('Player name cannot exceed 20 characters')
  }

  if (player.name && !/^[a-zA-Z0-9\s\-_']+$/.test(player.name)) {
    errors.push('Player name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes')
  }

  return errors
}

/**
 * Validate multiplayer setup
 */
export function validateMultiplayerSetup(players: PlayerInfo[]): string[] {
  const errors: string[] = []

  if (players.length !== 2) {
    errors.push('Exactly 2 players are required for multiplayer mode')
    return errors
  }

  const player1 = players[0]
  const player2 = players[1]

  if (!player1 || !player2) {
    errors.push('Both players must be provided')
    return errors
  }

  // Validate player 1
  const player1Errors = validatePlayerInfo(player1)
  errors.push(...player1Errors.map(err => `Player 1: ${err}`))

  // Validate player 2
  const player2Errors = validatePlayerInfo(player2)
  errors.push(...player2Errors.map(err => `Player 2: ${err}`))

  // Check if names are the same
  if (player1.name.trim() === player2.name.trim()) {
    errors.push('Players cannot have the same name')
  }

  // Check if colors are the same
  if (player1.discColor === player2.discColor) {
    errors.push('Players cannot have the same disc color')
  }

  return errors
}

/**
 * Format player name for display
 */
export function formatPlayerName(player: PlayerInfo): string {
  return player.name.trim()
}

/**
 * Get player display text for turn indicators
 */
export function getPlayerTurnText(player: PlayerInfo): string {
  return `${formatPlayerName(player)}'s Turn`
}

/**
 * Get player victory text
 */
export function getPlayerVictoryText(player: PlayerInfo): string {
  return `${formatPlayerName(player)} Wins!`
}

/**
 * Generate unique player ID
 */
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Deep clone player info
 */
export function clonePlayerInfo(player: PlayerInfo): PlayerInfo {
  return {
    id: player.id,
    name: player.name,
    discColor: player.discColor,
    type: player.type,
  }
}

/**
 * Clone player array
 */
export function clonePlayers(players: PlayerInfo[]): PlayerInfo[] {
  return players.map(clonePlayerInfo)
}

/**
 * Switch player colors
 */
export function switchPlayerColors(players: PlayerInfo[]): PlayerInfo[] {
  return players.map((player) => ({
    ...player,
    discColor: player.discColor === 'red' ? 'yellow' : 'red',
  }))
}

/**
 * Get player color class for CSS
 */
export function getPlayerColorClass(discColor: DiscColor): string {
  return discColor === 'red' ? 'bg-red-500' : 'bg-yellow-500'
}

/**
 * Get player border color class for CSS
 */
export function getPlayerBorderColorClass(discColor: DiscColor): string {
  return discColor === 'red' ? 'border-red-500' : 'border-yellow-500'
}