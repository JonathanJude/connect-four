# Connect Four

A modern Connect Four game built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- Built with Next.js 14 and App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design
- Game logic implementation
- Clean component architecture

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # UI components
│   └── GameBoard.tsx      # Game board component
├── lib/                   # Utility functions
│   ├── game-logic.ts      # Game logic
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript type definitions
    └── game.ts           # Game-related types
```

## Technologies Used

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [React 18](https://reactjs.org/) - UI library
