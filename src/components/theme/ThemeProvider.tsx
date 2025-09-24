/**
 * Theme Provider Component
 * Provides theme context and manages dark/light mode with system preference detection
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from '@/hooks/useSettings'

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Theme Provider Component
 *
 * Wraps the application with theme context and manages
 * theme application to the document element.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering theme-dependent UI until mounted
  if (!mounted) {
    return (
      <div className="invisible">
        {children}
      </div>
    )
  }

  return (
    <div className={currentTheme} data-theme={currentTheme}>
      {children}
    </div>
  )
}

/**
 * Theme toggle button component
 */
export function ThemeToggle() {
  const { currentTheme, setTheme, systemTheme, settingsTheme } = useTheme()

  const cycleTheme = () => {
    if (currentTheme === 'light') {
      setTheme('dark')
    } else if (currentTheme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  const getThemeIcon = () => {
    switch (settingsTheme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'auto':
        return systemTheme === 'dark' ? '🌗' : '🌗'
      default:
        return '🌗'
    }
  }

  const getThemeLabel = () => {
    switch (settingsTheme) {
      case 'light':
        return 'Light Mode'
      case 'dark':
        return 'Dark Mode'
      case 'auto':
        return `Auto (${systemTheme} Mode)`
      default:
        return 'System Theme'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={getThemeLabel()}
      aria-label={`Toggle theme. Current theme: ${getThemeLabel()}`}
    >
      <span className="text-lg">{getThemeIcon()}</span>
      <span className="text-sm font-medium hidden sm:inline">
        {getThemeLabel()}
      </span>
    </button>
  )
}

/**
 * Theme script for SSR flash prevention
 * This script runs before the page is rendered to prevent flash of incorrect theme
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var storedTheme = localStorage.getItem('connect-four-settings');
              if (storedTheme) {
                var settings = JSON.parse(storedTheme);
                var theme = settings.theme || 'auto';

                if (theme === 'auto') {
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.toggle('dark', systemTheme === 'dark');
                } else {
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                }
              } else {
                var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', systemTheme === 'dark');
              }
            } catch (e) {
              console.error('Failed to apply theme:', e);
            }
          })();
        `,
      }}
    />
  )
}