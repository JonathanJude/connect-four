/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Game colors
        'disc-red': '#DC2626',
        'disc-yellow': '#EAB308',
        'board-blue': '#1E40AF',
        'board-hover': '#3B82F6',
      },
      animation: {
        'disc-drop': 'disc-drop 0.5s ease-in-out',
        'cell-win-glow': 'cell-win-glow 1s ease-in-out infinite alternate',
        'hover-column': 'hover-column 0.3s ease-in-out',
        'victory-pulse': 'victory-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'disc-drop': {
          '0%': { transform: 'translateY(-400px) scale(0.8)', opacity: '0' },
          '50%': { transform: 'translateY(0) scale(1.1)', opacity: '1' },
          '70%': { transform: 'translateY(-10px) scale(0.95)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        'cell-win-glow': {
          '0%': { boxShadow: '0 0 5px rgba(251, 191, 36, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.4)' },
        },
        'hover-column': {
          '0%': { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          '100%': { backgroundColor: 'rgba(59, 130, 246, 0.3)' },
        },
        'victory-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      spacing: {
        'board-cell': '3.5rem',
        'board-gap': '0.5rem',
      },
      boxShadow: {
        'disc': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'disc-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'board': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
