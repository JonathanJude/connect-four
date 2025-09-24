'use client';

import { GameState, DiscColor, GameStatus } from '@/types/game';

interface GameBoardProps {
  gameState: GameState;
  onColumnClick: (column: number) => void;
}

export function GameBoard({ gameState, onColumnClick }: GameBoardProps) {
  const { board, currentPlayer, winner, status, playerDisc, aiDisc } = gameState;

  const getCellColor = (disc: DiscColor | null) => {
    switch (disc) {
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-400';
      default:
        return 'bg-gray-100';
    }
  };

  const isDraw = status === GameStatus.DRAW;

  const getWinnerBanner = () => {
    if (!winner) return null;

    const winningDisc = winner === 'HUMAN' ? playerDisc : aiDisc;
    const colorClasses =
      winningDisc === 'red'
        ? 'bg-red-500/90 border-red-300 text-white shadow-red-200'
        : 'bg-yellow-400/90 border-yellow-200 text-gray-900 shadow-yellow-100';

    const playerLabel = winner === 'HUMAN' ? 'Human' : 'AI';

    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border px-6 py-3 text-xl font-semibold shadow-lg transition-all ${colorClasses}`}
        role="status"
        aria-live="polite"
        aria-label={`Winner: ${playerLabel}`}
      >
        <span className="text-3xl" aria-hidden>
          🏆
        </span>
        <span className="font-semibold" aria-hidden>
          Winner:&nbsp;
        </span>
        <span className="font-semibold">{playerLabel}</span>
      </div>
    );
  };

  const getTurnBanner = () => {
    if (winner) {
      return getWinnerBanner();
    }

    if (isDraw) {
      return (
        <div
          className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3 text-xl font-semibold text-slate-700 shadow-inner"
          role="status"
          aria-live="polite"
        >
          It's a draw!
        </div>
      );
    }

    const isHumanTurn = currentPlayer === 'HUMAN';
    const discPreview = isHumanTurn ? playerDisc : aiDisc;
    const discClass = discPreview === 'red' ? 'bg-red-500' : 'bg-yellow-400';

    return (
      <div
        className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-6 py-3 text-xl font-semibold text-blue-700 shadow"
        role="status"
        aria-live="polite"
      >
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${discClass}`} aria-hidden />
        <span>{`Current player: ${isHumanTurn ? 'Human' : 'AI'}`}</span>
      </div>
    );
  };

  const disableColumnButtons = Boolean(winner) || isDraw;

  return (
    <div className="flex flex-col items-center space-y-6">
      {getTurnBanner()}

      <div className="bg-blue-600 p-4 rounded-lg shadow-2xl">
        {/* Column headers */}
        <div className="flex mb-2">
          {board.grid[0]?.map((_, colIndex) => (
            <button
              key={`header-${colIndex}`}
              onClick={() => onColumnClick(colIndex)}
              disabled={disableColumnButtons}
              className="w-12 h-8 mx-1 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↓
            </button>
          )) || []}
        </div>

        {/* Game board */}
        <div className="bg-blue-600 p-2 rounded">
          {board.grid?.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex">
              {row.map((cell, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="w-12 h-12 m-1 rounded-full border-2 border-blue-700 flex items-center justify-center"
                >
                  <div
                    className={`w-10 h-10 rounded-full ${getCellColor(cell)} transition-all duration-300`}
                  />
                </div>
              ))}
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
}
