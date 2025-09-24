import { GameState, Player, Board, Position } from '@/types/game';

export const createEmptyBoard = (): Board => {
  return Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));
};

export const createInitialGameState = (): GameState => {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'red',
    winner: null,
    isDraw: false,
  };
};

export const dropPiece = (board: Board, column: number, player: Player): Board | null => {
  const newBoard = board.map(row => [...row]);

  // Find the lowest empty row in the column
  for (let row = 5; row >= 0; row--) {
    if (newBoard[row][column] === null) {
      newBoard[row][column] = player;
      return newBoard;
    }
  }

  // Column is full
  return null;
};

export const checkWinner = (board: Board, lastMove: Position): Player => {
  const { row, col } = lastMove;
  const player = board[row][col];

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
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }

    // Check in negative direction
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count >= 4) {
      return player;
    }
  }

  return null;
};

export const checkDraw = (board: Board): boolean => {
  return board[0].every(cell => cell !== null);
};

export const isValidMove = (board: Board, column: number): boolean => {
  return column >= 0 && column < 7 && board[0][column] === null;
};

export const getAvailableColumns = (board: Board): number[] => {
  return board[0].map((cell, index) => (cell === null ? index : -1)).filter(col => col !== -1);
};
