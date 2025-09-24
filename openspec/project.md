# Project Context

## Purpose

A modern, offline-capable Connect Four web game built for casual and competitive players. The game features AI opponents with multiple difficulty levels, smooth animations, game history tracking, and replay functionality. Designed to be accessible, responsive, and provide an engaging user experience with persistent game state and comprehensive game statistics.

## Tech Stack

### Core Framework & Runtime

- **Next.js 15** - React framework with App Router for modern web development
- **React 18** - UI library with hooks and modern patterns
- **TypeScript 5** - Type-safe JavaScript with strict configuration
- **Node.js** - Runtime environment

### Styling & UI

- **Tailwind CSS 3** - Utility-first CSS framework with custom game-specific animations
- **Radix UI** - Accessible, unstyled UI components (@radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-icons)
- **Lucide React** - Modern icon library
- **Class Variance Authority** - Type-safe component variants
- **clsx & tailwind-merge** - Conditional class name utilities

### Development & Quality Tools

- **ESLint** - Code linting with Next.js, TypeScript, React, and accessibility rules
- **Prettier** - Code formatting with consistent style
- **Husky** - Git hooks for pre-commit quality checks
- **lint-staged** - Run linters on staged files only

### Testing

- **Vitest** - Fast unit testing framework with React Testing Library integration
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for testing

### Build & Development

- **PostCSS** - CSS processing with Autoprefixer
- **@vitejs/plugin-react** - Vite plugin for React support

## Project Conventions

### Code Style

- **Formatting**: Prettier with 100-character line width, single quotes, trailing commas, 2-space indentation
- **Naming**:
  - Components: PascalCase (e.g., `GameBoard.tsx`, `SettingsDialog.tsx`)
  - Files: kebab-case for utilities, PascalCase for components
  - Variables/Functions: camelCase with descriptive names
  - Constants: UPPER_SNAKE_CASE (e.g., `BOARD_ROWS`, `AI_TIME_BUDGETS`)
  - Types/Interfaces: PascalCase with descriptive prefixes (e.g., `GameState`, `AIThinkingState`)
- **Imports**: Absolute imports using `@/` path mapping for clean module resolution
- **File Organization**: Feature-based structure with clear separation of concerns

### Architecture Patterns

- **Component Architecture**:
  - Functional components with React hooks
  - Custom hooks for business logic (`useGameState`, `useAI`, `useSettings`)
  - Context providers for global state (`SettingsContext`)
  - Compound component patterns for complex UI
- **State Management**:
  - React hooks and context for global state
  - Local component state for UI-specific concerns
  - Reducer pattern for complex state transitions
- **Data Flow**:
  - Unidirectional data flow
  - Props drilling minimized with context
  - Event handlers passed down, state lifted up
- **Type Safety**:
  - Strict TypeScript configuration with comprehensive type coverage
  - Domain-specific types and interfaces
  - Runtime validation for critical game state
- **Error Handling**:
  - Custom error classes with specific error codes
  - Graceful degradation for non-critical features
  - User-friendly error messages

### Testing Strategy

- **Unit Testing**: Vitest with React Testing Library for component and utility testing
- **Test Structure**: Tests organized in `/tests` directory with contract, integration, and unit subdirectories
- **Coverage**: Comprehensive test coverage for game logic, components, and utilities
- **Test Types**:
  - Contract tests for game rules and AI behavior
  - Integration tests for component interactions
  - Unit tests for individual functions and components
- **Testing Philosophy**: Test behavior, not implementation details

### Git Workflow

- **Pre-commit Hooks**: Husky runs lint-staged to ensure code quality
- **Linting**: ESLint with TypeScript, React, and accessibility rules
- **Formatting**: Prettier runs on staged files before commit
- **Branch Strategy**: Feature branches with descriptive names
- **Commit Standards**: Clear, descriptive commit messages

## Domain Context

### Game Rules & Logic

- **Board**: 7 columns × 6 rows grid-based game board
- **Objective**: Connect 4 discs in a row (horizontal, vertical, or diagonal)
- **Players**: Human vs AI (single-player) and Human vs Human (1v1 multiplayer)
- **Game Modes**: Single-player (vs AI) and offline 1v1 multiplayer (two humans on same device)
- **Disc Colors**: Red and Yellow (player-selectable, customizable per player in multiplayer)
- **Win Conditions**: 4 consecutive discs in any direction
- **Draw Condition**: Board full with no winner

### AI Implementation

- **Difficulty Levels**: Easy (50ms), Medium (100ms), Hard (200ms) thinking time
- **Algorithm**: Minimax with alpha-beta pruning
- **Performance Tracking**: Nodes evaluated, pruning efficiency, win rates
- **Responsive**: Non-blocking AI computation with progress indicators

### Game Features

- **Game Modes**: Single-player (Human vs AI) and offline 1v1 multiplayer (Human vs Human)
- **Player Management**: Customizable player names and disc colors in multiplayer mode
- **Persistence**: Local storage for game state, settings, and history (supports both game modes)
- **History**: Track up to 50 completed games with full replay capability (separate tracking per mode)
- **Replay System**: Step-by-step move playback with variable speed (works for both modes)
- **Animations**: Smooth disc dropping, winning line highlights, hover effects
- **Accessibility**: Keyboard navigation, screen reader support
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Business Rules

- **Offline-First**: No network dependency, fully client-side (applies to both game modes)
- **Data Retention**: Games and settings persist across browser sessions (supports both single-player and multiplayer)
- **Performance**: Smooth 60fps animations, sub-200ms AI response times (AI performance applies to single-player mode only)
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design (applies to both game modes)

## Important Constraints

### Technical Constraints

- **Client-Side Only**: No backend services, all logic runs in browser
- **Storage Limitations**: Browser local storage capacity limits
- **Performance**: Must maintain 60fps during animations
- **Browser Compatibility**: Modern browsers with ES2020+ support
- **Memory Management**: Efficient handling of game history and replay data

### Design Constraints

- **Responsive Design**: Must work on screens from 320px to 4K
- **Accessibility**: Full keyboard navigation and screen reader support
- **Animation Performance**: Smooth animations without blocking UI
- **Color Accessibility**: High contrast ratios for disc colors

### Business Constraints

- **Offline Capability**: Must function without internet connection
- **Data Privacy**: No external data transmission or tracking
- **Performance Budget**: Fast loading and responsive interactions
- **Cross-Platform**: Consistent experience across devices and browsers

## External Dependencies

### Runtime Dependencies

- **React Ecosystem**: React 18, React DOM for UI rendering
- **Next.js Framework**: App Router, built-in optimizations, development server
- **Radix UI Components**: Accessible dialog, select, and icon components
- **Styling Libraries**: Tailwind CSS for styling, Lucide React for icons

### Development Dependencies

- **TypeScript Compiler**: Type checking and compilation
- **ESLint Ecosystem**: Code quality with React, TypeScript, and accessibility plugins
- **Testing Framework**: Vitest with React Testing Library and jsdom
- **Build Tools**: PostCSS, Autoprefixer for CSS processing

### No External Services

- **No APIs**: Fully self-contained application
- **No CDNs**: All assets bundled and served locally
- **No Analytics**: Privacy-focused, no tracking or telemetry
- **No Authentication**: Single-player game with local storage only

### Browser APIs Used

- **Local Storage**: Game persistence and settings
- **Canvas/DOM**: Game board rendering and animations
- **Web Workers**: Potential future enhancement for AI computation
- **Intersection Observer**: Performance optimizations for animations
