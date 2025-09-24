'use client'

/**
 * Error Boundary Components
 * Comprehensive error handling for React components with graceful degradation
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Error types for better error categorization
export type ErrorType =
  | 'game-state'
  | 'ai-error'
  | 'storage-error'
  | 'network-error'
  | 'validation-error'
  | 'render-error'
  | 'unknown'

export interface CustomErrorInfo {
  type: ErrorType
  message: string
  stack?: string
  component?: string
  timestamp: number
  userAgent?: string
  url?: string
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error context interface
export interface ErrorContext {
  errors: CustomErrorInfo[]
  addError: (error: CustomErrorInfo) => void
  clearErrors: () => void
  dismissError: (timestamp: number) => void
}

// Error severity mapping
const ERROR_SEVERITY: Record<ErrorType, ErrorSeverity> = {
  'game-state': 'medium',
  'ai-error': 'medium',
  'storage-error': 'low',
  'network-error': 'medium',
  'validation-error': 'low',
  'render-error': 'high',
  'unknown': 'medium'
}

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, string> = {
  'game-state': 'There was a problem with the game state. Please restart the game.',
  'ai-error': 'The AI encountered an error. Please try again.',
  'storage-error': 'Unable to save your progress. Your browser storage might be full.',
  'network-error': 'Network connection issue. Please check your internet connection.',
  'validation-error': 'Invalid input. Please check your settings and try again.',
  'render-error': 'Display error. Please refresh the page.',
  'unknown': 'An unexpected error occurred. Please try again.'
}

// Recovery suggestions for each error type
const RECOVERY_SUGGESTIONS: Record<ErrorType, string> = {
  'game-state': 'Start a new game to continue playing.',
  'ai-error': 'Try making your move again or restart the game.',
  'storage-error': 'Clear browser data or try a different browser.',
  'network-error': 'Check your connection and refresh the page.',
  'validation-error': 'Review your settings and ensure all fields are valid.',
  'render-error': 'Refresh the page or try a different browser.',
  'unknown': 'Refresh the page and try again. If the problem persists, contact support.'
}

/**
 * Main Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: CustomErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Create structured error info
    const structuredError: CustomErrorInfo = {
      type: 'render-error',
      message: error.message,
      stack: error.stack || '',
      component: 'Unknown',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    return {
      hasError: true,
      error,
      errorInfo: structuredError
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update structured error info with component stack
    const structuredError: CustomErrorInfo = {
      type: 'render-error',
      message: error.message,
      stack: error.stack || '',
      component: errorInfo.componentStack || '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    }

    // Update state with complete error info
    this.setState({ errorInfo: structuredError })

    this.setState({
      errorInfo: structuredError
    })

    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report error to monitoring service (if available)
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        extra: structuredError,
        tags: {
          component: 'ErrorBoundary',
          context: this.props.context || 'unknown'
        }
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          onReset={this.handleReset}
          context={this.props.context || ''}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Error Fallback UI Component
 * Displays user-friendly error messages with recovery options
 */
interface ErrorFallbackProps {
  error: Error
  errorInfo: CustomErrorInfo
  onReset: () => void
  context?: string
}

function ErrorFallback({ error, errorInfo, onReset, context }: ErrorFallbackProps) {
  // Add null check for errorInfo
  if (!errorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">An unexpected error occurred.</p>
          <button
            onClick={onReset}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const severity = ERROR_SEVERITY[errorInfo.type] || 'medium'
  const message = ERROR_MESSAGES[errorInfo.type] || ERROR_MESSAGES.unknown
  const suggestion = RECOVERY_SUGGESTIONS[errorInfo.type] || RECOVERY_SUGGESTIONS.unknown

  const severityColors = {
    low: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    medium: 'border-orange-200 bg-orange-50 text-orange-800',
    high: 'border-red-200 bg-red-50 text-red-800',
    critical: 'border-red-300 bg-red-100 text-red-900'
  }

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      type: errorInfo.type,
      timestamp: errorInfo.timestamp,
      context,
      userAgent: errorInfo.userAgent,
      url: errorInfo.url
    }

    // Copy error details to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert('Error details copied to clipboard')
        })
        .catch(() => {
          console.error('Failed to copy error details')
        })
    }
  }

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className={cn(
          'rounded-lg border-2 p-6 shadow-lg',
          severityColors[severity]
        )}>
          {/* Error Icon */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">
                Something went wrong
              </h3>
              {context && (
                <p className="text-sm opacity-75">
                  in {context}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">
              {message}
            </p>
            <p className="text-sm opacity-75">
              {suggestion}
            </p>
          </div>

          {/* Error Details (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="text-sm font-medium cursor-pointer hover:opacity-75">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-black bg-opacity-10 rounded text-xs font-mono">
                <p><strong>Error:</strong> {error.message}</p>
                <p><strong>Type:</strong> {errorInfo.type}</p>
                <p><strong>Time:</strong> {new Date(errorInfo.timestamp).toLocaleString()}</p>
                {errorInfo.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {errorInfo.stack}
                    </pre>
                  </details>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReset}
              className="flex-1 px-4 py-2 bg-white border border-current rounded-md text-sm font-medium hover:bg-opacity-75 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleRefresh}
              className="flex-1 px-4 py-2 bg-current text-white rounded-md text-sm font-medium hover:opacity-75 transition-opacity"
            >
              Refresh Page
            </button>
          </div>

          {/* Report Error Button (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleReportError}
              className="w-full mt-3 px-4 py-2 border border-current rounded-md text-sm font-medium hover:bg-opacity-10 transition-colors"
            >
              Copy Error Details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Async Error Boundary for handling promise rejections
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  const errorBoundaryProps = {
    fallback,
    context: "async-operation",
    ...(onError && { onError })
  }

  return (
    <ErrorBoundary {...errorBoundaryProps}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * Game-specific Error Boundary
 */
export function GameErrorBoundary({ children }: { children: ReactNode }) {
  const handleGameError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Game Error:', error, errorInfo)
    
    // Report game-specific errors
    if (typeof window !== 'undefined' && (window as any).gameAnalytics) {
      (window as any).gameAnalytics.trackError('game_error', {
        message: error.message,
        stack: error.stack,
        component: errorInfo.componentStack
      })
    }
  }

  return (
    <ErrorBoundary
      onError={handleGameError}
      context="game-engine"
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Storage Error Boundary for data persistence issues
 */
export function StorageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="storage-operations"
      fallback={
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            Unable to access storage. Some features may not work properly.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Network Error Boundary for API and network-related errors
 */
export function NetworkErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="network-operations"
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            Network error. Please check your connection and try again.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-specific Error Boundary
 */
export function ComponentErrorBoundary({
  children,
  fallback,
  componentName
}: {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}) {
  const errorBoundaryProps = {
    fallback,
    ...(componentName && { context: componentName })
  }

  return (
    <ErrorBoundary {...errorBoundaryProps}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error, errorInfo?: Partial<CustomErrorInfo>) => {
    console.error('Captured error:', error)
    setError(error)

    // Report to error boundary context if available
    const errorContext = React.useContext(ErrorContext)
    if (errorContext) {
      errorContext.addError({
        type: errorInfo?.type || 'unknown',
        message: error.message,
        stack: error.stack || '',
        timestamp: Date.now(),
        ...errorInfo
      })
    }
  }, [])

  // Throw error to be caught by error boundary
  if (error) {
    throw error
  }

  return { captureError, resetError }
}

/**
 * Error Context for managing application-wide errors
 */
export const ErrorContext = React.createContext<ErrorContext | null>(null)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = React.useState<CustomErrorInfo[]>([])

  const addError = React.useCallback((error: CustomErrorInfo) => {
    setErrors(prev => [...prev, error])
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  const dismissError = React.useCallback((timestamp: number) => {
    setErrors(prev => prev.filter(error => error.timestamp !== timestamp))
  }, [])

  const contextValue = React.useMemo(() => ({
    errors,
    addError,
    clearErrors,
    dismissError
  }), [errors, addError, clearErrors, dismissError])

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  )
}

/**
 * Hook to access error context
 */
export function useErrorContext() {
  const context = React.useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider')
  }
  return context
}

export default ErrorBoundary