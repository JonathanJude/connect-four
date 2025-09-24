<!-- Sync Impact Report -->
<!-- Version change: 0.0.0 → 1.0.0 -->
<!-- Modified principles: All principles added (new constitution) -->
<!-- Added sections: Core Principles, Technical Requirements, Development Standards, Governance -->
<!-- Removed sections: None -->
<!-- Templates requiring updates: ✅ updated - .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md -->
<!-- Follow-up TODOs: None -->

# Connect Four Constitution

## Core Principles

### I. React + Next.js Stack Only

Every component MUST use React with Next.js App Router and TypeScript exclusively. No alternative frameworks or libraries permitted. All code must leverage Next.js features for routing, data fetching, and optimization.

### II. TailwindCSS + shadcn/ui Styling

All styling MUST use TailwindCSS utilities and custom keyframes only. shadcn/ui components are permitted for base UI elements. Animation libraries like Framer Motion are strictly prohibited - all animations must be implemented via Tailwind keyframes and utilities.

### III. Browser Native Persistence

All persistence MUST use browser Web APIs directly (localStorage + IndexedDB). External persistence libraries are forbidden. Data models must be designed for browser storage limitations and offline functionality.

### IV. AI Game Logic Implementation

Single player vs Computer gameplay MUST be implemented with three AI difficulty levels:

- Easy: Random move selection
- Medium: Heuristic-based shallow minimax
- Hard: Full minimax with alpha-beta pruning

### V. Offline-First PWA Architecture

Application MUST run fully offline after initial load and be deployable to Vercel as a Progressive Web App. All assets and logic must be cacheable, with service worker implementation for offline functionality.

## Technical Requirements

### Technology Stack Mandates

- Frontend: React 18+ with Next.js 14+ (App Router only)
- Language: TypeScript exclusively
- Styling: TailwindCSS with shadcn/ui components
- State Management: React hooks and context only
- Persistence: localStorage + IndexedDB (no external libraries)
- Deployment: Vercel with PWA configuration

### Styling Requirements

- Modern, playful, colorful visual design
- Smooth animations using only TailwindCSS keyframes
- Responsive design for all screen sizes
- Dark/light theme support via CSS variables

### Performance Requirements

- Bundle size optimization for offline capability
- Lazy loading of non-critical components
- Efficient state management to prevent unnecessary re-renders
- Optimized AI algorithms for smooth gameplay

## Development Standards

### Code Quality Standards

- All code MUST be written in TypeScript with strict mode enabled
- ESLint and Prettier configurations enforced
- Component naming must follow PascalCase for components, camelCase for functions
- File structure must follow Next.js App Router conventions

### Documentation Requirements

- Every component MUST have JSDoc comments
- Complex algorithms (especially AI logic) must be thoroughly documented
- User stories and technical specifications must be comprehensive
- Accessibility considerations must be documented

### Testing Requirements

- Unit tests for all game logic and utility functions
- Integration tests for component interactions
- End-to-end tests for complete user flows
- AI difficulty levels must be tested for correctness
- Accessibility testing with keyboard navigation and screen readers

### Deliverable Standards

Every specification, plan, and task MUST include:

- Clear user stories & flows
- Component and file breakdown with names and purposes
- Accessibility checklist (keyboard, ARIA, color contrast)
- Tailwind keyframe/animation plan
- Testing strategy
- Roadmap for future features (1v1 local multiplayer, themes)

## Governance

### Constitution Compliance

This constitution supersedes all other development practices. All pull requests and code reviews MUST verify compliance with these principles. Any deviation requires explicit justification and team approval.

### Amendment Process

- Amendments require documentation, team approval, and migration plan
- Version changes follow semantic versioning:
  - MAJOR: Backward incompatible principle removals or redefinitions
  - MINOR: New principles or substantially expanded guidance
  - PATCH: Clarifications, wording fixes, non-semantic refinements
- All amendments must update dependent templates and documentation

### Quality Assurance

- Regular code reviews must check constitution compliance
- Architecture decisions must align with core principles
- New dependencies require evaluation against constitution constraints
- Technical debt must be documented and addressed according to priority

**Version**: 1.0.0 | **Ratified**: 2025-09-22 | **Last Amended**: 2025-09-22
