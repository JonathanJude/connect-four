# IndexedDB Schema and Migration Documentation

## Database Overview

**Database Name**: `connect-four`
**Current Version**: 1
**Description**: Browser-based storage for Connect Four game state, settings, and history

## Object Stores

### 1. `games` Store

**Purpose**: Store complete game state for in-progress games
**Key Path**: `id` (auto-generated)
**Indexes**:

- `status`: For finding active/completed games
- `startedAt`: For cleanup and ordering

**Schema**:

```typescript
interface GameRecord {
  id: string; // Primary key (UUID)
  board: (DiscColor | null)[][]; // 6x7 grid state
  currentPlayer: Player; // 'HUMAN' | 'AI'
  status: GameStatus; // 'IN_PROGRESS' | 'HUMAN_WIN' | 'AI_WIN' | 'DRAW'
  moves: MoveRecord[]; // Move history
  difficulty: Difficulty; // 'easy' | 'medium' | 'hard'
  playerDisc: DiscColor; // 'red' | 'yellow'
  aiDisc: DiscColor; // 'red' | 'yellow'
  startedAt: Date; // Game start timestamp
  endedAt?: Date; // Game end timestamp
  winner?: Player; // Winner if game completed
  winningLine?: WinningLine; // Winning combination
  duration?: number; // Game duration in milliseconds
  lastSaved: Date; // Last save timestamp
}
```

### 2. `gameHistory` Store

**Purpose**: Store completed game records for history viewing
**Key Path**: `id` (auto-generated)
**Indexes**:

- `difficulty`: Filter by difficulty level
- `result`: Filter by win/loss/draw
- `startedAt`: Sort by date
- `endedAt`: Time-based queries
- `movesCount`: Filter by game length

**Schema**:

```typescript
interface GameHistoryRecord {
  id: string; // Primary key (UUID)
  gameId: string; // Original game ID
  difficulty: Difficulty; // 'easy' | 'medium' | 'hard'
  result: 'WIN' | 'LOSS' | 'DRAW';
  winner?: Player; // 'HUMAN' | 'AI'
  movesCount: number; // Total moves in game
  duration: number; // Game duration in milliseconds
  startedAt: Date; // Game start timestamp
  endedAt: Date; // Game end timestamp
  playerDisc: DiscColor; // Human player's disc color
  moveSequence: number[]; // Column sequence for replay
  compressed?: boolean; // Whether data is compressed
  lastAccessed: Date; // Last accessed timestamp
}
```

### 3. `snapshots` Store

**Purpose**: Store latest game state for resume functionality
**Key Path**: `gameId` (game ID as key)
**Indexes**: None (single record per game)

**Schema**:

```typescript
interface GameSnapshot {
  gameId: string; // Game ID (primary key)
  gameData: GameRecord; // Complete game state
  timestamp: Date; // Snapshot timestamp
  version: number; // Snapshot format version
}
```

### 4. `settings` Store

**Purpose**: Store user preferences and settings
**Key Path**: `key` (string key names)
**Indexes**: None

**Schema**:

```typescript
interface SettingsRecord {
  key: string; // Setting key name
  value: any; // Setting value
  timestamp: Date; // Last updated
  version: number; // Settings version
}
```

**Common Settings Keys**:

- `gameSettings`: Main game preferences
- `appVersion`: Last app version used
- `lastGameId`: Most recent game ID
- `analyticsConsent`: User analytics preference

## Database Initialization

### Open Database

```typescript
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('connect-four', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    // Create object stores on first run
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create games store
      if (!db.objectStoreNames.contains('games')) {
        const gamesStore = db.createObjectStore('games', {
          keyPath: 'id',
          autoIncrement: false,
        });

        // Create indexes
        gamesStore.createIndex('status', 'status', { unique: false });
        gamesStore.createIndex('startedAt', 'startedAt', { unique: false });
      }

      // Create gameHistory store
      if (!db.objectStoreNames.contains('gameHistory')) {
        const historyStore = db.createObjectStore('gameHistory', {
          keyPath: 'id',
          autoIncrement: false,
        });

        // Create indexes
        historyStore.createIndex('difficulty', 'difficulty', { unique: false });
        historyStore.createIndex('result', 'result', { unique: false });
        historyStore.createIndex('startedAt', 'startedAt', { unique: false });
        historyStore.createIndex('endedAt', 'endedAt', { unique: false });
        historyStore.createIndex('movesCount', 'movesCount', { unique: false });
      }

      // Create snapshots store
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', {
          keyPath: 'gameId',
          autoIncrement: false,
        });
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', {
          keyPath: 'key',
          autoIncrement: false,
        });
      }
    };
  });
};
```

## Migration Strategy

### Version 1 → Version 2 (Future)

```typescript
const migrateToV2 = (db: IDBDatabase) => {
  // Add new object store or modify existing ones
  if (!db.objectStoreNames.contains('statistics')) {
    const statsStore = db.createObjectStore('statistics', {
      keyPath: 'id',
    });
    statsStore.createIndex('date', 'date', { unique: false });
  }

  // Add new indexes to existing stores
  const gamesStore = db.transaction.objectStore('games');
  gamesStore.createIndex('playerDisc', 'playerDisc', { unique: false });
};
```

## Storage Operations

### Save Game State

```typescript
const saveGame = async (game: GameState): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['games', 'snapshots'], 'readwrite');

  // Save complete game state
  await tx.objectStore('games').put(game);

  // Update snapshot for resume
  await tx.objectStore('snapshots').put({
    gameId: game.id,
    gameData: game,
    timestamp: new Date(),
    version: 1,
  });

  await tx.done;
};
```

### Load Game for Resume

```typescript
const loadCurrentGame = async (): Promise<GameState | null> => {
  const db = await openDB();
  const settingsTx = db.transaction('settings', 'readonly');
  const settingsStore = settingsTx.objectStore('settings');

  // Get last game ID
  const lastGameId = await settingsStore.get('lastGameId');
  if (!lastGameId?.value) return null;

  // Load snapshot
  const snapshotTx = db.transaction('snapshots', 'readonly');
  const snapshot = await snapshotTx.objectStore('snapshots').get(lastGameId.value);

  return snapshot?.gameData || null;
};
```

### Save Game History

```typescript
const saveGameHistory = async (history: GameHistory): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('gameHistory', 'readwrite');

  // Add timestamp for tracking
  const historyWithTimestamp = {
    ...history,
    lastAccessed: new Date(),
  };

  await tx.objectStore('gameHistory').put(historyWithTimestamp);
  await tx.done;
};
```

### Query Game History

```typescript
const getGameHistory = async (options: HistoryQueryOptions = {}): Promise<GameHistory[]> => {
  const db = await openDB();
  const tx = db.transaction('gameHistory', 'readonly');
  const store = tx.objectStore('gameHistory');

  let index: IDBIndex | undefined;
  let query: IDBKeyRange | undefined;

  // Determine index and query based on filters
  if (options.difficulty) {
    index = store.index('difficulty');
    query = IDBKeyRange.only(options.difficulty);
  } else if (options.result) {
    index = store.index('result');
    query = IDBKeyRange.only(options.result);
  }

  // Get records
  const request = index ? index.openCursor(query) : store.openCursor();
  const results: GameHistory[] = [];

  return new Promise(resolve => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        // Apply additional filters and sorting
        let filtered = results;

        if (options.limit) {
          filtered = filtered.slice(0, options.limit);
        }

        // Sort results
        if (options.sortBy) {
          filtered.sort((a, b) => {
            const aVal = a[options.sortBy!];
            const bVal = b[options.sortBy!];
            const order = options.sortOrder === 'desc' ? -1 : 1;
            return aVal > bVal ? order : -order;
          });
        }

        resolve(filtered);
      }
    };
  });
};
```

## Cleanup and Maintenance

### Cleanup Old Games

```typescript
const cleanupOldGames = async (maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(['games', 'snapshots'], 'readwrite');
  const now = Date.now();

  // Find old incomplete games
  const gamesStore = tx.objectStore('games');
  const oldGames = await gamesStore
    .index('startedAt')
    .openCursor(IDBKeyRange.upperBound(now - maxAge));

  const gamesToDelete: string[] = [];

  return new Promise(resolve => {
    oldGames.onsuccess = () => {
      const cursor = oldGames.result;
      if (cursor) {
        const game = cursor.value;
        if (game.status === 'IN_PROGRESS') {
          gamesToDelete.push(game.id);
        }
        cursor.continue();
      } else {
        // Delete old games and snapshots
        const deletePromises = gamesToDelete.map(gameId => {
          return Promise.all([
            tx.objectStore('games').delete(gameId),
            tx.objectStore('snapshots').delete(gameId),
          ]);
        });

        Promise.all(deletePromises).then(() => {
          resolve();
        });
      }
    };
  });
};
```

### Storage Quota Management

```typescript
const checkStorageQuota = async (): Promise<{ used: number; total: number; available: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      total: estimate.quota || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0),
    };
  }

  // Fallback for browsers without Storage API
  return { used: 0, total: 0, available: 0 };
};
```

## Error Handling

### Database Error Handler

```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'VERSION_ERROR' | 'UNKNOWN',
    public originalError?: DOMException,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

const handleDatabaseError = (error: DOMException): DatabaseError => {
  switch (error.name) {
    case 'QuotaExceededError':
      return new DatabaseError('Storage quota exceeded', 'QUOTA_EXCEEDED', error);
    case 'VersionError':
      return new DatabaseError('Database version mismatch', 'VERSION_ERROR', error);
    default:
      return new DatabaseError('Unknown database error', 'UNKNOWN', error);
  }
};
```

## Performance Considerations

### Bulk Operations

```typescript
const bulkImportHistory = async (games: GameHistory[]): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('gameHistory', 'readwrite');
  const store = tx.objectStore('gameHistory');

  // Use bulk operations for better performance
  const promises = games.map(game => store.add(game));
  await Promise.all(promises);
  await tx.done;
};
```

### Transaction Optimization

- Use read-only transactions for queries
- Batch related operations in single transactions
- Keep transactions short-lived
- Use proper error handling and cleanup

## Security Considerations

- All data is stored locally in browser
- No sensitive information stored in IndexedDB
- Data is not encrypted (browser storage limitation)
- Consider adding data compression for large game histories
- Implement proper cleanup to prevent storage bloat

This IndexedDB schema provides a robust foundation for the Connect Four game's persistence needs while ensuring performance, scalability, and maintainability.
