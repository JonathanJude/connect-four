# Connect Four Game - Quick Start Guide

## Overview

This guide provides step-by-step instructions to set up and run the Connect Four web game locally.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start Steps

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd connect-four

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Verify Application

- Open `http://localhost:3000` in your browser
- You should see the Connect Four game board
- Try clicking on a column to drop a disc
- Verify AI responds automatically

### 3. Test Core Features

#### Basic Gameplay

1. **Start a new game**: Click "New Game" button
2. **Change difficulty**: Use difficulty selector (Easy/Medium/Hard)
3. **Make moves**: Click columns or use keyboard (arrow keys + Enter)
4. **Verify win detection**: Try to connect 4 discs
5. **Test draw condition**: Fill the board without winner

#### Settings and Persistence

1. **Change settings**: Modify difficulty, theme, motion preferences
2. **Test persistence**: Refresh page - game should resume
3. **Verify settings**: Changes should persist across sessions

#### History and Replay

1. **Complete games**: Play several games to build history
2. **View history**: Navigate to `/history` page
3. **Test replay**: Click "View Replay" on any completed game
4. **Replay controls**: Use play/pause, step controls, speed adjustment

#### Accessibility

1. **Keyboard navigation**: Play entire game using only keyboard
2. **Screen reader**: Verify game state announcements
3. **Reduced motion**: Enable in OS settings and verify

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Testing
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:e2e     # Run end-to-end tests

# Deployment
npm run deploy       # Deploy to Vercel (requires setup)
```

## File Structure Overview

```
connect-four/
├── app/                    # Next.js App Router
│   ├── (game)/            # Game route group
│   │   └── page.tsx       # Main game page
│   ├── history/           # History route
│   │   └── page.tsx       # History list page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── board/            # Game board components
│   ├── panel/            # UI panel components
│   ├── history/          # History components
│   └── ui/               # shadcn/ui components
├── lib/                  # Core logic
│   ├── ai/               # AI implementations
│   ├── game/             # Game rules and logic
│   ├── storage/          # Persistence layer
│   └── utils/            # Utility functions
├── hooks/                # Custom React hooks
├── tests/                # Test files
└── public/               # Static assets
```

## Key Components

### Game Board (`Board.tsx`)

- Renders 7×6 grid with interactive columns
- Handles click/keyboard events for move selection
- Shows hover preview and disc drop animations

### AI Service (`lib/ai/`)

- **Easy**: Random move selection with center bias
- **Medium**: Minimax depth 3 with alpha-beta pruning
- **Hard**: Iterative deepening minimax with 150ms time cap

### Storage (`lib/storage/`)

- **localStorage**: User settings and preferences
- **IndexedDB**: Game history and state snapshots
- Automatic migration and cleanup

### Game Hooks (`hooks/`)

- `useGameState`: Game state management and rules
- `useAI`: AI move orchestration with cancellation

## Configuration

### Environment Variables

```bash
# Optional: Analytics and error tracking (if implemented)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_ERROR_TRACKING_KEY=your-key
```

### Tailwind Configuration

Custom animations defined in `tailwind.config.js`:

- Disc drop animations
- Victory highlighting effects
- Hover preview effects

### shadcn/ui Components

Configured in `shadcn.json`:

- Button, Dialog, Select components
- Custom theme configuration
- Accessibility features

## Testing

### Unit Tests

```bash
npm run test:unit
```

Tests game rules, AI logic, and utility functions.

### Integration Tests

```bash
npm run test:integration
```

Tests component interactions and state management.

### End-to-End Tests

```bash
npm run test:e2e
```

Tests complete user flows including keyboard navigation.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm run start
```

## Troubleshooting

### Common Issues

**Game doesn't start**

- Check Node.js version (18+ required)
- Clear browser cache and localStorage
- Verify all dependencies installed

**AI not responding**

- Check browser console for errors
- Verify game state is valid
- Try resetting the game

**History not saving**

- Check IndexedDB permissions
- Verify browser supports IndexedDB
- Clear browser data and retry

**Animations not working**

- Check `reduceMotion` setting
- Verify Tailwind configuration
- Test in different browsers

### Debug Mode

Add `?debug=true` to URL for enhanced logging and state inspection.

## Contributing

1. Follow constitutional requirements (see `constitution.md`)
2. Maintain TypeScript strict mode
3. Include tests for new features
4. Verify accessibility compliance
5. Use conventional commit messages

## Support

For issues and questions:

- Check existing GitHub issues
- Review feature specification (`spec.md`)
- Consult implementation plan (`plan.md`)

---

**Next Steps**: After verifying the quickstart works, proceed to implement specific features following the task list generated by `/tasks` command.
