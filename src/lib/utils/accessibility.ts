/**
 * Accessibility Utilities
 * Helper functions for screen reader announcements, focus management, and ARIA attributes
 */

/**
 * Screen reader announcement utility
 * Uses a live region to announce changes to screen readers
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer
  private announcementElement: HTMLElement | null = null

  private constructor() {
    this.initialize()
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer()
    }
    return ScreenReaderAnnouncer.instance
  }

  private initialize() {
    // Create announcement element if it doesn't exist
    if (!this.announcementElement) {
      this.announcementElement = document.createElement('div')
      this.announcementElement.setAttribute('aria-live', 'polite')
      this.announcementElement.setAttribute('aria-atomic', 'true')
      this.announcementElement.className = 'sr-only'
      document.body.appendChild(this.announcementElement)
    }
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.announcementElement) {
      this.announcementElement.setAttribute('aria-live', priority)
      this.announcementElement.textContent = message

      // Clear after announcement to allow repeated messages
      setTimeout(() => {
        if (this.announcementElement) {
          this.announcementElement.textContent = ''
        }
      }, 1000)
    }
  }

  /**
   * Announce game state changes
   */
  announceGameState(gameState: {
    status: string
    currentPlayer?: string
    winner?: string
    lastMove?: { row: number; col: number }
  }): void {
    const { status, currentPlayer, winner, lastMove } = gameState

    switch (status) {
      case 'PLAYER_WON':
        this.announce('Congratulations! You won the game!', 'assertive')
        break
      case 'AI_WON':
        this.announce('Game over. The AI won. Better luck next time!', 'assertive')
        break
      case 'DRAW':
        this.announce('Game ended in a draw. Great game!', 'assertive')
        break
      case 'IN_PROGRESS':
        if (currentPlayer === 'HUMAN') {
          this.announce('Your turn. Click a column to place your disc.')
        } else {
          this.announce('AI is thinking...')
        }
        break
      case 'PAUSED':
        this.announce('Game is paused. Press resume to continue.')
        break
    }

    // Announce last move
    if (lastMove) {
      this.announce(`Disc placed in column ${lastMove.col + 1}, row ${lastMove.row + 1}`)
    }
  }

  /**
   * Announce focus changes
   */
  announceFocus(element: string, position?: { row: number; col: number }): void {
    let message = `Focused on ${element}`
    if (position) {
      message += ` at column ${position.col + 1}`
    }
    this.announce(message)
  }

  /**
   * Announce errors
   */
  announceError(error: string): void {
    this.announce(`Error: ${error}`, 'assertive')
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Focus first element
    firstElement.focus()

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Move focus to next element
   */
  static moveFocusNext(currentElement: HTMLElement): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const currentIndex = Array.from(focusableElements).indexOf(currentElement)
    const nextIndex = (currentIndex + 1) % focusableElements.length
    focusableElements[nextIndex].focus()
  }

  /**
   * Move focus to previous element
   */
  static moveFocusPrevious(currentElement: HTMLElement): void {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const currentIndex = Array.from(focusableElements).indexOf(currentElement)
    const previousIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1
    focusableElements[previousIndex].focus()
  }

  /**
   * Restore focus to element after delay
   */
  static restoreFocus(element: HTMLElement, delay: number = 0): void {
    setTimeout(() => {
      element.focus()
    }, delay)
  }
}

/**
 * ARIA attribute utilities
 */
export class AriaUtils {
  /**
   * Generate ARIA label for game cell
   */
  static getCellLabel(
    row: number,
    col: number,
    disc: 'red' | 'yellow' | null,
    isLastMove: boolean,
    isWinningCell: boolean
  ): string {
    const position = `Row ${row + 1}, column ${col + 1}`

    if (!disc) {
      return `Empty cell at ${position}`
    }

    let label = `${disc.charAt(0).toUpperCase() + disc.slice(1)} disc at ${position}`

    if (isLastMove) {
      label += ', last move'
    }

    if (isWinningCell) {
      label += ', winning position'
    }

    return label
  }

  /**
   * Generate ARIA label for game board
   */
  static getBoardLabel(rows: number, cols: number, gameStatus: string): string {
    let label = `Connect Four game board with ${rows} rows and ${cols} columns`

    switch (gameStatus) {
      case 'NOT_STARTED':
        label += ', ready to play'
        break
      case 'IN_PROGRESS':
        label += ', game in progress'
        break
      case 'PLAYER_WON':
        label += ', you won'
        break
      case 'AI_WON':
        label += ', AI won'
        break
      case 'DRAW':
        label += ', game ended in draw'
        break
      case 'PAUSED':
        label += ', game paused'
        break
    }

    return label
  }

  /**
   * Generate ARIA description for controls
   */
  static getControlDescription(action: string, shortcut?: string): string {
    let description = action
    if (shortcut) {
      description += `, shortcut: ${shortcut}`
    }
    return description
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation
   */
  static handleArrowKeys(
    event: KeyboardEvent,
    currentIndex: number,
    maxIndex: number,
    onNavigate: (index: number) => void
  ): boolean {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        const prevIndex = Math.max(0, currentIndex - 1)
        onNavigate(prevIndex)
        return true
      case 'ArrowRight':
        event.preventDefault()
        const nextIndex = Math.min(maxIndex, currentIndex + 1)
        onNavigate(nextIndex)
        return true
      case 'Home':
        event.preventDefault()
        onNavigate(0)
        return true
      case 'End':
        event.preventDefault()
        onNavigate(maxIndex)
        return true
      default:
        return false
    }
  }

  /**
   * Handle activation keys
   */
  static handleActivationKeys(
    event: KeyboardEvent,
    onActivate: () => void
  ): boolean {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        onActivate()
        return true
      default:
        return false
    }
  }

  /**
   * Handle escape key
   */
  static handleEscapeKey(
    event: KeyboardEvent,
    onEscape: () => void
  ): boolean {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
      return true
    }
    return false
  }
}

/**
 * High contrast mode utilities
 */
export class HighContrastMode {
  private static isHighContrast = false

  /**
   * Check if high contrast mode is enabled
   */
  static check(): boolean {
    if (typeof window === 'undefined') return false

    // Check for Windows high contrast mode
    const testElement = document.createElement('div')
    testElement.style.backgroundColor = 'rgb(255, 0, 0)'
    testElement.style.color = 'rgb(0, 255, 0)'
    testElement.style.position = 'absolute'
    testElement.style.left = '-9999px'
    document.body.appendChild(testElement)

    const computedColor = window.getComputedStyle(testElement).backgroundColor
    const computedBackground = window.getComputedStyle(testElement).color

    document.body.removeChild(testElement)

    // If colors don't match, high contrast mode is likely enabled
    this.isHighContrast = computedColor !== 'rgb(255, 0, 0)' ||
                         computedBackground !== 'rgb(0, 255, 0)'

    return this.isHighContrast
  }

  /**
   * Add high contrast class to body if needed
   */
  static initialize(): void {
    if (this.check()) {
      document.body.classList.add('high-contrast')
    }
  }
}

/**
 * Reduced motion utilities
 */
export class ReducedMotion {
  private static prefersReducedMotion = false

  /**
   * Check if user prefers reduced motion
   */
  static check(): boolean {
    if (typeof window === 'undefined') return false

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.prefersReducedMotion = mediaQuery.matches

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches
    })

    return this.prefersReducedMotion
  }

  /**
   * Get animation duration based on preference
   */
  static getDuration(normalDuration: number, reducedDuration: number = 0): number {
    return this.prefersReducedMotion ? reducedDuration : normalDuration
  }
}

// Export instances for convenience
export const announcer = ScreenReaderAnnouncer.getInstance()
export const focusManager = FocusManager
export const ariaUtils = AriaUtils
export const keyboardNav = KeyboardNavigation
export const highContrast = HighContrastMode
export const reducedMotion = ReducedMotion