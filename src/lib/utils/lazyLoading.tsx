/**
 * Lazy Loading Utilities
 * Provides dynamic imports and component lazy loading with fallbacks
 */

import React, { lazy, Suspense, ComponentType, LazyExoticComponent } from 'react'

// Loading fallback components
export function LoadingSpinner({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  )
}

export function LoadingBoard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}

// Error fallback for lazy loaded components
export function LazyLoadError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="text-red-800 dark:text-red-200">
        <h3 className="font-medium">Component Load Failed</h3>
        <p className="text-sm mt-1">{error.message}</p>
        <button
          onClick={retry}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// Lazy load history components (only needed when navigating to history)
export const LazyHistoryList = lazy(() => import('@/components/history/HistoryList').then(module => ({
  default: module.HistoryList
})))

export const LazyHistoryPage = lazy(() => import('@/app/history/page').then(module => ({
  default: module.default
})))

export const LazyReplayViewer = lazy(() => import('@/components/history/ReplayViewer').then(module => ({
  default: module.ReplayViewer
})))

export const LazyReplayControls = lazy(() => import('@/components/history/ReplayControls').then(module => ({
  default: module.ReplayControls
})))

export const LazyReplayPage = lazy(() => import('@/app/history/[id]/page').then(module => ({
  default: module.default
})))

// Lazy load settings dialog (only needed when settings is opened)
export const LazySettingsDialog = lazy(() => import('@/components/panel/SettingsDialog').then(module => ({
  default: module.SettingsDialog
})))

// Lazy load error components (only needed when errors occur)
export const LazyErrorBoundary = lazy(() => import('@/components/error/ErrorBoundary').then(module => ({
  default: module.GameErrorBoundary
})))

export const LazyToastContainer = lazy(() => import('@/components/error/ToastContainer').then(module => ({
  default: module.ToastContainer
})))

// Higher-order component for lazy loading with error handling
export function withLazyLoading<T extends ComponentType<any>>(
  Component: LazyExoticComponent<T>,
  fallback: ComponentType = LoadingSpinner,
  errorFallback: ComponentType = LazyLoadError
) {
  return function LazyComponent(props: Parameters<T>[0]) {
    return (
      <Suspense fallback={<fallback />}>
        <React.ErrorBoundary fallback={<errorFallback />}>
          <Component {...props} />
        </React.ErrorBoundary>
      </Suspense>
    )
  }
}

// Create lazy loaded versions with appropriate fallbacks
export const LazyHistoryListWithFallback = withLazyLoading(LazyHistoryList, LoadingCard)
export const LazyReplayViewerWithFallback = withLazyLoading(LazyReplayViewer, LoadingBoard)
export const LazySettingsDialogWithFallback = withLazyLoading(LazySettingsDialog, LoadingSpinner)

// Preload utilities for critical components
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>()

  static async preloadComponent<T>(componentName: string, importFn: () => Promise<T>): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return
    }

    try {
      await importFn()
      this.preloadedComponents.add(componentName)
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error)
    }
  }

  // Preload components when user is likely to need them
  static preloadLikelyComponents() {
    // Preload settings dialog on hover over settings button
    this.preloadComponent('SettingsDialog', () => import('@/components/panel/SettingsDialog'))

    // Preload history components when user navigates to history
    if (typeof window !== 'undefined' && window.location.pathname.includes('history')) {
      this.preloadComponent('HistoryList', () => import('@/components/history/HistoryList'))
      this.preloadComponent('ReplayViewer', () => import('@/components/history/ReplayViewer'))
    }
  }
}

// Performance monitoring for lazy loading
export class LazyLoadMonitor {
  private static loadTimes = new Map<string, number>()

  static trackLoad(componentName: string, loadTime: number) {
    this.loadTimes.set(componentName, loadTime)

    // Log slow loads
    if (loadTime > 1000) {
      console.warn(`Slow component load: ${componentName} took ${loadTime}ms`)
    }
  }

  static getLoadStats() {
    return {
      averageLoadTime: Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / this.loadTimes.size || 0,
      slowestComponent: Array.from(this.loadTimes.entries()).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]),
      totalComponentsLoaded: this.loadTimes.size
    }
  }
}

// Hook for lazy loading with timing
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) {
  const [Component, setComponent] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let isMounted = true
    const startTime = performance.now()

    importFn()
      .then(({ default: LoadedComponent }) => {
        if (isMounted) {
          const loadTime = performance.now() - startTime
          LazyLoadMonitor.trackLoad(componentName, loadTime)
          setComponent(LoadedComponent)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [importFn, componentName])

  return { Component, loading, error }
}

export default {
  LoadingSpinner,
  LoadingCard,
  LoadingBoard,
  LazyHistoryList,
  LazyReplayViewer,
  LazySettingsDialog,
  LazyHistoryListWithFallback,
  LazyReplayViewerWithFallback,
  LazySettingsDialogWithFallback,
  ComponentPreloader,
  LazyLoadMonitor,
  useLazyComponent
}