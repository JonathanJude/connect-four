"use client"

/**
 * Toast Notification System
 * Provides user feedback for errors, success messages, and loading states
 */

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
  timestamp: number
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
}

const TOAST_ICONS = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

const TOAST_STYLES = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
  loading: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
}

const ICON_STYLES = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  info: 'text-blue-500 dark:text-blue-400',
  loading: 'text-gray-500 dark:text-gray-400'
}

export function ToastContainer({ position = 'top-right', maxToasts = 5 }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: Date.now()
    }

    setToasts(prev => {
      const updated = [...prev, newToast]
      return updated.slice(-maxToasts)
    })

    // Auto-remove toast if not persistent
    if (!toast.persistent && toast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }

    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  // Expose toast functions globally
  useEffect(() => {
    const toast = {
      success: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
        addToast({ type: 'success', title, message: message || '', ...options }),
      error: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
        addToast({ type: 'error', title, message: message || '', ...options }),
      warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
        addToast({ type: 'warning', title, message: message || '', ...options }),
      info: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
        addToast({ type: 'info', title, message: message || '', ...options }),
      loading: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
        addToast({ type: 'loading', title, message: message || '', persistent: true, ...options }),
      dismiss: removeToast,
      clear: clearAllToasts
    }

    // @ts-ignore
    window.toast = toast

    return () => {
      // @ts-ignore
      delete window.toast
    }
  }, [maxToasts])

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  return (
    <div className={cn(
      'fixed z-50 space-y-2',
      getPositionClasses()
    )}>
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation
  }

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-in-out',
        'max-w-sm w-full shadow-lg rounded-lg border p-4',
        TOAST_STYLES[toast.type],
        isVisible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className={cn('flex-shrink-0 mr-3', ICON_STYLES[toast.type])}>
          {TOAST_ICONS[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium mb-1">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm opacity-90">{toast.message}</p>
          )}

          {/* Action */}
          {toast.action && (
            <div className="mt-2">
              <button
                onClick={toast.action.onClick}
                className={cn(
                  'text-sm font-medium underline hover:no-underline',
                  toast.type === 'error' && 'text-red-700 dark:text-red-300',
                  toast.type === 'success' && 'text-green-700 dark:text-green-300',
                  toast.type === 'warning' && 'text-yellow-700 dark:text-yellow-300',
                  toast.type === 'info' && 'text-blue-700 dark:text-blue-300'
                )}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {!toast.persistent && (
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 ml-3 p-1 rounded hover:bg-black/10',
              'transition-colors focus:outline-none focus:ring-2',
              toast.type === 'error' && 'focus:ring-red-500',
              toast.type === 'success' && 'focus:ring-green-500',
              toast.type === 'warning' && 'focus:ring-yellow-500',
              toast.type === 'info' && 'focus:ring-blue-500'
            )}
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar for non-persistent toasts */}
      {!toast.persistent && toast.type !== 'loading' && toast.duration && (
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className="bg-current h-1 rounded-full transition-all duration-[5000ms] ease-linear"
            style={{
              width: '100%',
              animation: 'shrink 5s linear forwards'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Hook for using toast in components
export function useToast() {
  const showToast = React.useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    if (typeof window !== 'undefined' && (window as any).toast) {
      const id = (window as any).toast[toast.type](toast.title, toast.message, {
        duration: toast.duration,
        action: toast.action,
        persistent: toast.persistent
      })
      return id
    }
    return null
  }, [])

  const dismissToast = React.useCallback((id: string) => {
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.dismiss(id)
    }
  }, [])

  const clearAllToasts = React.useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.clear()
    }
  }, [])

  return {
    showToast,
    dismissToast,
    clearAllToasts,
    success: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
      showToast({ type: 'success', title, message: message || '', ...options }),
    error: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
      showToast({ type: 'error', title, message: message || '', ...options }),
    warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
      showToast({ type: 'warning', title, message: message || '', ...options }),
    info: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
      showToast({ type: 'info', title, message: message || '', ...options }),
    loading: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'timestamp' | 'type' | 'title'>>) =>
      showToast({ type: 'loading', title, message: message || '', persistent: true, ...options })
  }
}

export default ToastContainer