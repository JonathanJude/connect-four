/**
 * Graceful Degradation Utilities
 * Provides fallback mechanisms and progressive enhancement for non-critical features
 */

import * as React from 'react'

export interface FeatureSupport {
  animations: boolean
  localStorage: boolean
  sessionStorage: boolean
  indexedDB: boolean
  serviceWorker: boolean
  webWorkers: boolean
  webGL: boolean
  touchEvents: boolean
  pointerEvents: boolean
  screenReader: boolean
  highContrast: boolean
  reducedMotion: boolean
}

export interface FallbackConfig {
  enabled: boolean
  fallbackComponent?: React.ComponentType<any>
  fallbackMessage?: string
  critical: boolean
  retryCount?: number
  retryDelay?: number
}

/**
 * Feature Detection Utility
 */
export class FeatureDetector {
  private static instance: FeatureDetector
  private support: FeatureSupport
  private detectionComplete: boolean = false

  private constructor() {
    this.support = this.detectFeatures()
  }

  static getInstance(): FeatureDetector {
    if (!FeatureDetector.instance) {
      FeatureDetector.instance = new FeatureDetector()
    }
    return FeatureDetector.instance
  }

  private detectFeatures(): FeatureSupport {
    return {
      animations: this.detectAnimations(),
      localStorage: this.detectLocalStorage(),
      sessionStorage: this.detectSessionStorage(),
      indexedDB: this.detectIndexedDB(),
      serviceWorker: this.detectServiceWorker(),
      webWorkers: this.detectWebWorkers(),
      webGL: this.detectWebGL(),
      touchEvents: this.detectTouchEvents(),
      pointerEvents: this.detectPointerEvents(),
      screenReader: this.detectScreenReader(),
      highContrast: this.detectHighContrast(),
      reducedMotion: this.detectReducedMotion()
    }
  }

  private detectAnimations(): boolean {
    try {
      const elm = document.createElement('div')
      return 'animation' in elm.style || 'webkitAnimation' in elm.style
    } catch {
      return false
    }
  }

  private detectLocalStorage(): boolean {
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      return true
    } catch {
      return false
    }
  }

  private detectSessionStorage(): boolean {
    try {
      sessionStorage.setItem('test', 'test')
      sessionStorage.removeItem('test')
      return true
    } catch {
      return false
    }
  }

  private detectIndexedDB(): boolean {
    return 'indexedDB' in window
  }

  private detectServiceWorker(): boolean {
    return 'serviceWorker' in navigator
  }

  private detectWebWorkers(): boolean {
    return 'Worker' in window
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(window as any).WebGLRenderingContext &&
             canvas.getContext('webgl') &&
             canvas.getContext('experimental-webgl')
    } catch {
      return false
    }
  }

  private detectTouchEvents(): boolean {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           (navigator as any).msMaxTouchPoints > 0
  }

  private detectPointerEvents(): boolean {
    return 'pointerEnabled' in navigator || 'PointerEvent' in window
  }

  private detectScreenReader(): boolean {
    // Try to detect screen readers through various heuristics
    try {
      // Check for high contrast mode (often used with screen readers)
      const testDiv = document.createElement('div')
      testDiv.style.backgroundColor = 'rgb(255, 0, 0)'
      testDiv.style.color = 'rgb(0, 255, 0)'
      testDiv.style.position = 'absolute'
      testDiv.style.left = '-9999px'
      document.body.appendChild(testDiv)

      const computedColor = window.getComputedStyle(testDiv).backgroundColor
      const computedBackground = window.getComputedStyle(testDiv).color
      document.body.removeChild(testDiv)

      const isHighContrast = computedColor !== 'rgb(255, 0, 0)' ||
                           computedBackground !== 'rgb(0, 255, 0)'

      return isHighContrast
    } catch {
      return false
    }
  }

  private detectHighContrast(): boolean {
    try {
      const testDiv = document.createElement('div')
      testDiv.style.backgroundColor = 'rgb(255, 0, 0)'
      testDiv.style.color = 'rgb(0, 255, 0)'
      testDiv.style.position = 'absolute'
      testDiv.style.left = '-9999px'
      document.body.appendChild(testDiv)

      const computedColor = window.getComputedStyle(testDiv).backgroundColor
      const computedBackground = window.getComputedStyle(testDiv).color
      document.body.removeChild(testDiv)

      return computedColor !== 'rgb(255, 0, 0)' ||
             computedBackground !== 'rgb(0, 255, 0)'
    } catch {
      return false
    }
  }

  private detectReducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }

  getSupport(): FeatureSupport {
    return this.support
  }

  isSupported(feature: keyof FeatureSupport): boolean {
    return this.support[feature]
  }

  getUnsupportedFeatures(): (keyof FeatureSupport)[] {
    return Object.entries(this.support)
      .filter(([_, supported]) => !supported)
      .map(([feature, _]) => feature as keyof FeatureSupport)
  }

  getDegradationLevel(): 'none' | 'minor' | 'moderate' | 'severe' {
    const unsupported = this.getUnsupportedFeatures().length

    if (unsupported === 0) return 'none'
    if (unsupported <= 2) return 'minor'
    if (unsupported <= 4) return 'moderate'
    return 'severe'
  }
}

/**
 * Fallback Manager for handling feature failures
 */
export class FallbackManager {
  private fallbacks: Map<string, FallbackConfig> = new Map()
  private retryAttempts: Map<string, number> = new Map()

  register(feature: string, config: FallbackConfig): void {
    this.fallbacks.set(feature, config)
  }

  async tryWithFallback<T>(
    feature: string,
    mainFunction: () => Promise<T>,
    fallbackFunction?: () => Promise<T>
  ): Promise<T> {
    const config = this.fallbacks.get(feature)
    if (!config || !config.enabled) {
      return mainFunction()
    }

    const attempts = this.retryAttempts.get(feature) || 0
    const maxAttempts = config.retryCount || 3

    try {
      const result = await mainFunction()
      // Success - clear retry attempts
      this.retryAttempts.delete(feature)
      return result
    } catch (error) {
      if (attempts < maxAttempts && fallbackFunction) {
        // Retry with fallback
        this.retryAttempts.set(feature, attempts + 1)

        if (config.retryDelay) {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay))
        }

        return fallbackFunction()
      }

      // No fallback or max attempts reached
      if (config.critical) {
        throw error // Re-throw critical errors
      }

      // Return default value for non-critical failures
      return null as T
    }
  }

  clearRetries(feature: string): void {
    this.retryAttempts.delete(feature)
  }

  clearAllRetries(): void {
    this.retryAttempts.clear()
  }
}

/**
 * Progressive Enhancement Helper
 */
export class ProgressiveEnhancer {
  private detector: FeatureDetector
  private fallbackManager: FallbackManager

  constructor() {
    this.detector = FeatureDetector.getInstance()
    this.fallbackManager = new FallbackManager()
  }

  /**
   * Apply CSS classes based on feature support
   */
  applyFeatureClasses(element: HTMLElement): void {
    const support = this.detector.getSupport()

    Object.entries(support).forEach(([feature, supported]) => {
      const className = `feature-${feature.toLowerCase()}`
      if (supported) {
        element.classList.add(`${className}-supported`)
        element.classList.remove(`${className}-unsupported`)
      } else {
        element.classList.add(`${className}-unsupported`)
        element.classList.remove(`${className}-supported`)
      }
    })

    // Add overall degradation level class
    const degradationLevel = this.detector.getDegradationLevel()
    element.classList.add(`degradation-${degradationLevel}`)
  }

  /**
   * Get feature-appropriate animation duration
   */
  getAnimationDuration(normalDuration: number): number {
    if (!this.detector.isSupported('animations') ||
        this.detector.isSupported('reducedMotion')) {
      return 0
    }
    return normalDuration
  }

  /**
   * Get appropriate storage mechanism with fallbacks
   */
  getStorage(): {
    set: (key: string, value: any) => Promise<boolean>
    get: (key: string) => Promise<any>
    remove: (key: string) => Promise<boolean>
    clear: () => Promise<boolean>
  } {
    const supportsLocalStorage = this.detector.isSupported('localStorage')
    const supportsSessionStorage = this.detector.isSupported('sessionStorage')

    return {
      set: async (key: string, value: any): Promise<boolean> => {
        try {
          const serialized = JSON.stringify(value)

          if (supportsLocalStorage) {
            localStorage.setItem(key, serialized)
            return true
          } else if (supportsSessionStorage) {
            sessionStorage.setItem(key, serialized)
            return true
          }
          return false
        } catch {
          return false
        }
      },

      get: async (key: string): Promise<any> => {
        try {
          if (supportsLocalStorage) {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : null
          } else if (supportsSessionStorage) {
            const item = sessionStorage.getItem(key)
            return item ? JSON.parse(item) : null
          }
          return null
        } catch {
          return null
        }
      },

      remove: async (key: string): Promise<boolean> => {
        try {
          if (supportsLocalStorage) {
            localStorage.removeItem(key)
            return true
          } else if (supportsSessionStorage) {
            sessionStorage.removeItem(key)
            return true
          }
          return false
        } catch {
          return false
        }
      },

      clear: async (): Promise<boolean> => {
        try {
          if (supportsLocalStorage) {
            localStorage.clear()
            return true
          } else if (supportsSessionStorage) {
            sessionStorage.clear()
            return true
          }
          return false
        } catch {
          return false
        }
      }
    }
  }

  /**
   * Get touch or mouse event handlers based on support
   */
  getInteractionHandlers(): {
    onClick: (handler: (event: Event) => void) => (event: Event) => void
    onTouchStart?: (handler: (event: TouchEvent) => void) => (event: TouchEvent) => void
    onMouseDown?: (handler: (event: MouseEvent) => void) => (event: MouseEvent) => void
  } {
    const supportsTouch = this.detector.isSupported('touchEvents')
    const supportsPointer = this.detector.isSupported('pointerEvents')

    return {
      onClick: (handler: (event: Event) => void) => handler,

      ...(supportsTouch && {
        onTouchStart: (handler: (event: TouchEvent) => void) => handler
      }),

      ...(!supportsTouch && {
        onMouseDown: (handler: (event: MouseEvent) => void) => handler
      })
    }
  }

  /**
   * Check if advanced features should be enabled
   */
  shouldEnableAdvancedFeatures(): boolean {
    const unsupported = this.detector.getUnsupportedFeatures()
    const criticalUnsupported = unsupported.filter(feature =>
      ['localStorage', 'sessionStorage'].includes(feature)
    )

    return criticalUnsupported.length === 0
  }

  getFallbackManager(): FallbackManager {
    return this.fallbackManager
  }

  getFeatureDetector(): FeatureDetector {
    return this.detector
  }
}

// Global instance
export const gracefulDegradation = new ProgressiveEnhancer()

// React hook for graceful degradation
export function useGracefulDegradation() {
  const [featureSupport, setFeatureSupport] = React.useState<FeatureSupport | null>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const detector = FeatureDetector.getInstance()
      setFeatureSupport(detector.getSupport())
    }
  }, [])

  const registerFallback = React.useCallback((feature: string, config: FallbackConfig) => {
    gracefulDegradation.getFallbackManager().register(feature, config)
  }, [])

  const tryWithFallback = React.useCallback(async function <T>(
    feature: string,
    mainFunction: () => Promise<T>,
    fallbackFunction?: () => Promise<T>
  ): Promise<T> {
    return gracefulDegradation.getFallbackManager().tryWithFallback(
      feature, mainFunction, fallbackFunction
    )
  }, [])

  const getAnimationDuration = React.useCallback((normalDuration: number): number => {
    return gracefulDegradation.getAnimationDuration(normalDuration)
  }, [])

  const shouldEnableAdvancedFeatures = React.useCallback((): boolean => {
    return gracefulDegradation.shouldEnableAdvancedFeatures()
  }, [])

  return {
    featureSupport,
    registerFallback,
    tryWithFallback,
    getAnimationDuration,
    shouldEnableAdvancedFeatures
  }
}

// Fallback component for unsupported features
export interface FallbackComponentProps {
  featureName: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function FallbackComponent({
  featureName,
  message,
  onRetry,
  className
}: FallbackComponentProps) {
  return (
    <div className={className || 'p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'}>
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {featureName} Not Available
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            {message || `This feature requires ${featureName.toLowerCase()} support in your browser.`}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export default FeatureDetector