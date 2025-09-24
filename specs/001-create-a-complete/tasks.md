# Tasks: Connect Four Web Game Implementation

**Input**: Design documents from `/specs/001-create-a-complete/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/game-api.ts, quickstart.md

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: tech stack (Next.js 14+, React 18+, TypeScript, TailwindCSS, shadcn/ui)
   → Extract: structure (Next.js App Router, src/components/, src/lib/, src/hooks/)
2. Load design documents:
   → data-model.md: Extract entities (Game, Board, Move, GameSettings, GameHistory, ReplaySession)
   → contracts/game-api.ts: Extract interfaces (GameService, AIService, PersistenceService, etc.)
   → research.md: Extract decisions (AI levels, persistence, animations)
   → quickstart.md: Extract test scenarios and verification steps
3. Generate tasks by category:
   → Setup: Next.js project, dependencies, configuration
   → Tests: contract tests, integration tests, accessibility tests
   → Core: game logic, AI implementations, storage layer
   → Integration: components, hooks, persistence integration
   → Polish: animations, performance, docs, deployment
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js Application**: `src/`, `tests/` at repository root (per constitution)
- **Structure**: `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`
- Constitution-compliant with TailwindCSS-only animations and browser-native persistence

## Phase 3.1: Setup

- [x] T001 Initialize Next.js 14+ project with TypeScript and App Router
- [x] T002 Install dependencies: React 18+, Next.js 14+, TypeScript 5.0+, TailwindCSS, shadcn/ui, Vitest, React Testing Library
- [x] T003 [P] Configure ESLint, Prettier, TypeScript strict mode, and pre-commit hooks
- [x] T004 [P] Set up TailwindCSS configuration with custom animations (disc-drop, cell-win-glow, hover-column)
- [x] T005 [P] Initialize shadcn/ui components and configure theme (Button, Dialog, Select, etc.)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T006 [P] Game rules contract tests in tests/contract/test-game-rules.ts (covers win detection, move validation, board state)
- [x] T007 [P] AI algorithm contract tests in tests/contract/test-ai-contracts.ts (covers all three difficulty levels and time budgets)
- [ ] T008 [P] Persistence contract tests in tests/contract/test-persistence-contracts.ts (covers localStorage, IndexedDB, migrations)
- [ ] T009 [P] Game service integration tests in tests/integration/test-game-service.ts (covers complete game lifecycle)
- [ ] T010 [P] Accessibility integration tests in tests/integration/test-accessibility.ts (covers keyboard navigation, screen reader support)
- [ ] T011 [P] Offline functionality tests in tests/integration/test-offline-capability.ts (covers PWA behavior, offline resume)

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T012 [P] Game types and constants in src/lib/game/constants.ts (ROWS, COLS, Player, Difficulty, etc.)
- [x] T013 [P] Game rules engine in src/lib/game/rules.ts (isValidMove, applyMove, checkWinner, isDraw)
- [x] T014 [P] Board utilities in src/lib/game/board.ts (createBoard, getLegalMoves, serialize/deserialize)
- [x] T015 [P] AI evaluation heuristics in src/lib/ai/evaluate.ts (window scoring, position evaluation)
- [x] T016 [P] Easy AI implementation in src/lib/ai/easy.ts (random with center bias, seeded RNG)
- [x] T017 [P] Medium AI implementation in src/lib/ai/medium.ts (minimax depth 3, alpha-beta pruning, 50ms cap)
- [x] T018 [P] Hard AI implementation in src/lib/ai/hard.ts (iterative deepening minimax, 150ms cap)
- [x] T019 [P] AI service orchestration in src/lib/ai/service.ts (difficulty selection, move generation, cancellation)
- [x] T020 [P] IndexedDB storage layer in src/lib/storage/indexeddb.ts (database setup, CRUD operations, migrations)
- [x] T021 [P] localStorage settings in src/lib/storage/localstorage.ts (get/set settings, defaults)
- [x] T022 [P] Persistence service in src/lib/storage/service.ts (unified interface, error handling)

## Phase 3.4: Components and Hooks

- [x] T023 [P] Game state types in src/types/game.ts (GameState, Move, GameSettings interfaces)
- [x] T024 [P] Game state hook in src/hooks/useGameState.ts (reducer-based state management, move application)
- [x] T025 [P] AI orchestration hook in src/hooks/useAI.ts (async move generation, cancellation, time budgets)
- [x] T026 [P] Settings persistence hook in src/hooks/useSettings.ts (settings CRUD, defaults, migration)
- [x] T027 [P] Game cell component in src/components/board/Cell.tsx (individual cell with disc rendering, click handlers)
- [x] T028 [P] Game board component in src/components/board/Board.tsx (7x6 grid, hover preview, keyboard navigation)
- [x] T029 [P] Turn indicator component in src/components/panel/TurnIndicator.tsx (current player display, AI thinking state)
- [x] T030 [P] Game controls component in src/components/panel/Controls.tsx (new game, difficulty select, reset, settings)
- [x] T031 [P] Game settings dialog in src/components/panel/SettingsDialog.tsx (theme, motion, sound preferences)

## Phase 3.5: Game Pages and Routing ✅ COMPLETED

- [x] T032 Root layout in src/app/layout.tsx (theme provider, viewport, metadata, global styles)
- [x] T033 Main game page in src/app/(game)/page.tsx (game board, controls, game state integration)
- [x] T034 History page in src/app/history/page.tsx (game history list, filtering, pagination)
- [x] T035 Replay viewer page in src/app/history/[id]/page.tsx (replay controls, game state playback)

## Phase 3.6: History and Replay ✅ COMPLETED

- [x] T036 [P] History service in src/lib/history/service.ts (game history CRUD, filtering, export)
- [x] T037 [P] History list component in src/components/history/HistoryList.tsx (game cards, stats, actions)
- [x] T038 [P] Replay service in src/lib/replay/service.ts (replay session management, state reconstruction)
- [x] T039 [P] Replay controls component in src/components/history/ReplayControls.tsx (play/pause, step, speed control)
- [x] T040 [P] Replay viewer component in src/components/history/ReplayViewer.tsx (board with replay state)

## Phase 3.7: Integration and Polish

- [x] T041 [P] Game persistence integration (auto-save on moves, resume on load, cleanup on complete)
- [x] T042 [P] Responsive design implementation (mobile breakpoints, touch interactions, viewport units)
- [x] T043 [P] Tailwind animations integration (disc-drop, victory glow, hover effects, reduced motion support)
- [x] T044 [P] Accessibility implementation (ARIA labels, live regions, keyboard navigation, focus management)
- [x] T045 [P] Error handling and validation (user feedback, graceful degradation, error boundaries)
- [ ] T046 [P] Performance optimizations (React.memo, useCallback, lazy loading, AI time budgets)

## Phase 3.8: PWA and Deployment

- [ ] T047 [P] PWA manifest configuration in public/manifest.json (icons, colors, offline capability)
- [ ] T048 [P] Service worker implementation in public/sw.js (asset caching, offline fallback, updates)
- [ ] T049 [P] Vercel deployment configuration (vercel.json, build settings, environment variables)
- [ ] T050 [P] Build optimization and testing (production build, bundle analysis, performance testing)

## Dependencies

- Setup (T001-T005) before everything
- Tests (T006-T011) before implementation (TDD requirement)
- Types and constants (T012) before game logic (T013-T014)
- Game logic (T013-T014) before AI (T015-T019)
- Storage (T020-T022) before persistence integration (T041)
- Core logic (T012-T022) before components and hooks (T023-T031)
- Components (T027-T031) before pages (T032-T035)
- Core features before history and replay (T036-T040)
- Integration and polish (T041-T046) before PWA and deployment (T047-T050)

## Parallel Execution Examples

### Phase 3.2 Tests (All [P] - can run together)

```
Task: "Game rules contract tests in tests/contract/test-game-rules.ts"
Task: "AI algorithm contract tests in tests/contract/test-ai-contracts.ts"
Task: "Persistence contract tests in tests/contract/test-persistence-contracts.ts"
Task: "Game service integration tests in tests/integration/test-game-service.ts"
Task: "Accessibility integration tests in tests/integration/test-accessibility.ts"
Task: "Offline functionality tests in tests/integration/test-offline-capability.ts"
```

### Phase 3.3 Core Logic (Groups of [P] tasks)

```
# Types and Rules
Task: "Game types and constants in src/lib/game/constants.ts"
Task: "Game rules engine in src/lib/game/rules.ts"
Task: "Board utilities in src/lib/game/board.ts"

# AI Implementations
Task: "AI evaluation heuristics in src/lib/ai/evaluate.ts"
Task: "Easy AI implementation in src/lib/ai/easy.ts"
Task: "Medium AI implementation in src/lib/ai/medium.ts"
Task: "Hard AI implementation in src/lib/ai/hard.ts"
Task: "AI service orchestration in src/lib/ai/service.ts"

# Storage Layer
Task: "IndexedDB storage layer in src/lib/storage/indexeddb.ts"
Task: "localStorage settings in src/lib/storage/localstorage.ts"
Task: "Persistence service in src/lib/storage/service.ts"
```

### Phase 3.4 Components (Groups by file structure)

```
# Types and Hooks
Task: "Game state types in src/types/game.ts"
Task: "Game state hook in src/hooks/useGameState.ts"
Task: "AI orchestration hook in src/hooks/useAI.ts"
Task: "Settings persistence hook in src/hooks/useSettings.ts"

# Board Components
Task: "Game cell component in src/components/board/Cell.tsx"
Task: "Game board component in src/components/board/Board.tsx"

# Panel Components
Task: "Turn indicator component in src/components/panel/TurnIndicator.tsx"
Task: "Game controls component in src/components/panel/Controls.tsx"
Task: "Game settings dialog in src/components/panel/SettingsDialog.tsx"
```

## Task Generation Rules Applied

### From Game Requirements (spec.md)

- Game logic → T006, T013, T014
- Three AI difficulty levels → T007, T015-T019
- Game persistence → T008, T020-T022, T041
- History and replay → T036-T040
- Single player vs AI → T025, T019

### From Constitution Requirements

- React + Next.js + TypeScript → T001, T002
- TailwindCSS + shadcn/ui only → T004, T005, T043
- Browser native persistence → T020-T022
- Offline-first PWA → T011, T047, T048
- Accessibility compliance → T010, T044

### From Contracts (data-model.md)

- Game entity → T012, T013, T023, T024
- Board entity → T014
- Move entity → T012, T013
- GameSettings entity → T021, T025, T031
- GameHistory entity → T036, T037
- ReplaySession entity → T038, T039, T040

### From API Contracts (contracts/game-api.ts)

- GameService interface → T006, T009, T013, T024
- AIService interface → T007, T015-T019, T025
- PersistenceService interface → T008, T020-T022, T041
- HistoryService interface → T036, T037
- ReplayService interface → T038, T039, T040

### From User Stories (quickstart.md)

- Basic gameplay → T006, T013, T027-T030
- Settings persistence → T021, T025, T031
- History and replay → T034-T040
- Keyboard navigation → T010, T044
- Offline capability → T011, T047, T048

## Validation Checklist

- [x] All game logic has corresponding tests (T006, T013, T014)
- [x] Constitution requirements addressed:
  - React + Next.js + TypeScript (T001, T002)
  - TailwindCSS + shadcn/ui only (T004, T005, T043)
  - Browser native persistence (T020-T022)
  - Three AI difficulty levels (T007, T015-T019)
  - Offline-first PWA (T011, T047, T048)
  - Accessibility compliance (T010, T044)
- [x] All tests come before implementation (TDD enforced)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TypeScript and React best practices followed
- [x] TailwindCSS-only animations ensured (T043, T044)
- [x] PWA configuration included (T047, T048)
- [x] Complete feature coverage from specification

## Implementation Notes

- **TDD Strictly Enforced**: Tests T006-T011 MUST be written and MUST FAIL before any implementation tasks
- **Constitution Compliance**: All tasks follow constitutional requirements (no external animation libraries, browser-native persistence, etc.)
- **Performance Considerations**: AI time budgets, React optimizations, and bundle size considerations addressed
- **Accessibility First**: Keyboard navigation, ARIA support, and screen reader compatibility built-in
- **Offline Capability**: PWA features and IndexedDB persistence ensure full offline functionality
- **Future Extensibility**: Architecture supports future 1v1 multiplayer and additional features

---

**Ready for execution**: 50 detailed, ordered tasks with clear dependencies and parallel execution guidance. Each task is specific enough for immediate LLM implementation without additional context.
