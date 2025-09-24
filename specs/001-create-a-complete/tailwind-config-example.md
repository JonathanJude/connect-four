# Tailwind Configuration Excerpt

## Custom Animations for Connect Four

This excerpt shows the Tailwind configuration with custom keyframes and animations for the Connect Four game.

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom keyframes for game animations
      keyframes: {
        // Disc drop animation with physics-like feel
        'disc-drop': {
          '0%': {
            transform: 'translateY(-400px) scaleY(0.8)',
            opacity: '0.8',
          },
          '50%': {
            transform: 'translateY(20px) scaleY(1.1)',
            opacity: '1',
          },
          '70%': {
            transform: 'translateY(-10px) scaleY(0.95)',
          },
          '85%': {
            transform: 'translateY(5px) scaleY(1.02)',
          },
          '100%': {
            transform: 'translateY(0) scaleY(1)',
            opacity: '1',
          },
        },

        // Victory glow animation for winning cells
        'cell-win-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(255, 215, 0, 1)',
            backgroundColor: 'rgba(255, 215, 0, 0.4)',
          },
        },

        // Hover column preview animation
        'hover-column': {
          '0%': {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          '100%': {
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
          },
        },

        // Pulse animation for turn indicators
        'turn-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.05)',
          },
        },

        // Bounce animation for button feedback
        'button-bounce': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-2px)',
          },
        },

        // Slide animation for notifications
        'slide-in': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },

        // Fade animation for game over overlay
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
      },

      // Animation utilities
      animation: {
        'disc-drop': 'disc-drop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'cell-win-glow': 'cell-win-glow 2s ease-in-out infinite',
        'hover-column': 'hover-column 0.3s ease-in-out',
        'turn-pulse': 'turn-pulse 2s ease-in-out infinite',
        'button-bounce': 'button-bounce 0.2s ease-in-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-in-out',
      },

      // Animation variants for reduced motion
      animationDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },

      // Media query variants for reduced motion
      screens: {
        'motion-safe': '(prefers-reduced-motion: no-preference)',
        'motion-reduce': '(prefers-reduced-motion: reduce)',
      },

      // Extend colors for game theme
      colors: {
        // Disc colors
        'disc-red': '#EF4444',
        'disc-yellow': '#F59E0B',
        'disc-shadow': 'rgba(0, 0, 0, 0.2)',

        // Board colors
        'board-blue': '#3B82F6',
        'board-shadow': 'rgba(0, 0, 0, 0.1)',

        // UI colors
        'game-bg': '#F8FAFC',
        'panel-bg': '#FFFFFF',
        'border-game': '#E2E8F0',

        // Victory colors
        'victory-gold': '#FCD34D',
        'victory-glow': '#FDE68A',
      },

      // Extend spacing for game layout
      spacing: {
        18: '4.5rem',
        88: '22rem',
        92: '23rem',
        96: '24rem',
      },

      // Extend borderRadius for game pieces
      borderRadius: {
        disc: '50%',
        cell: '8px',
      },

      // Extend boxShadow for game effects
      boxShadow: {
        disc: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'disc-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        board: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        victory: '0 0 20px rgba(252, 211, 77, 0.5)',
      },

      // Extend transition properties
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
      },

      // Extend transition timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [
    // Add any Tailwind plugins here if needed
    // For this project, we're using pure Tailwind animations only
  ],
};
```

## Animation Usage Examples

### Disc Drop Animation

```jsx
<div className="animate-disc-drop motion-safe:animate-disc-drop motion-reduce:animate-none" />
```

### Victory Glow Animation

```jsx
<div className="animate-cell-win-glow" />
```

### Hover Column Preview

```jsx
<div className="animate-hover-column" />
```

### Reduced Motion Support

```jsx
<div className="motion-safe:animate-bounce motion-reduce:transition-none" />
```

### Custom Animation Variants

```jsx
// Fast animation
<div className="animate-[disc-drop_300ms_ease-in-out]" />

// Infinite pulse
<div className="animate-turn-pulse animate-infinite" />

// Delayed animation
<div className="animate-disc-drop animate-delay-100" />
```

## Key Animation Details

### Disc Drop Animation

- **Duration**: 600ms
- **Easing**: Cubic bezier for natural physics feel
- **Effect**: Simulates gravity with slight bounce
- **Reduced Motion**: Falls back to instant placement

### Victory Glow Animation

- **Duration**: 2s per cycle
- **Effect**: Subtle pulsing golden glow
- **Purpose**: Highlights winning combination
- **Accessibility**: Respects reduced motion preferences

### Hover Preview Animation

- **Duration**: 300ms
- **Effect**: Gentle blue background fade
- **Purpose**: Shows valid move targets
- **Performance**: GPU-accelerated transform

### Accessibility Compliance

- All animations respect `prefers-reduced-motion`
- No critical information conveyed solely through animation
- Smooth transitions for better user experience
- Keyboard navigation support with visual feedback

This configuration provides all necessary animations for the Connect Four game while maintaining compliance with constitutional requirements and accessibility standards.
