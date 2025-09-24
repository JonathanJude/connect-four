import { GameState, Player, Board, Position, DiscColor } from '@/types/game';
import { BOARD_ROWS, BOARD_COLUMNS } from './game/constants';

export const createEmptyBoard = (): Board => {
  return {
    grid: Array(BOARD_ROWS)
      .fill(null)
      .map(() => Array(BOARD_COLUMNS).fill(null)),
    rows: BOARD_ROWS,
    columns: BOARD_COLUMNS,
  };
};

import { createDefaultGameState } from '@/types/game';

export const createInitialGameState = (): GameState => {
  return createDefaultGameState();
};

export const dropPiece = (board: Board, column: number, player: DiscColor): Board | null => {
  const newBoard = {
    ...board,
    grid: board.grid.map(row => [...row]),
  };

  // Find the lowest empty row in the column
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    if (newBoard.grid[row][column] === null) {
      newBoard.grid[row][column] = player;
      return newBoard;
    }
  }

  // Column is full
  return null;
};

export const checkWinner = (board: Board, lastMove: Position): DiscColor | null => {
  const { row, column } = lastMove;
  const player = board.grid[row][column];

  if (!player) return null;

  // Check all four directions
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal /
    [1, -1], // diagonal \
  ];

  for (const [dr, dc] of directions) {
    let count = 1; // Count the piece we just placed

    // Check in positive direction
    let r = row + dr!;
    let c = column + dc!;
    while (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLUMNS && board.grid[r][c] === player) {
      count++;
      r += dr!;
      c += dc!;
    }

    // Check in negative direction
    r = row - dr!;
    c = column - dc!;
    while (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLUMNS && board.grid[r][c] === player) {
      count++;
      r -= dr!;
      c -= dc!;
    }

    if (count >= 4) {
      return player;
    }
  }

  return null;
};

export const checkDraw = (board: Board): boolean => {
  return board.grid[0].every(cell => cell !== null);
};

export const isValidMove = (board: Board, column: number): boolean => {
  return column >= 0 && column < BOARD_COLUMNS && board.grid[0][column] === null;
};

export const getAvailableColumns = (board: Board): number[] => {
  return Array.from({ length: BOARD_COLUMNS }, (_, i) => i).filter(col => 
    board.grid[0][col] === null
  );
};
