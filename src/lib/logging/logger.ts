/**
 * Comprehensive Logging and Error Tracking System
 * Provides structured logging, error tracking, and performance monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  timestamp: number
  level: LogLevel
  category: string
  message: string
  data?: any
  userId?: string
  sessionId?: string
  stack?: string
  tags?: string[]
  duration?: number
}

export interface LogConfig {
  level: LogLevel
  enableConsole: boolean
  enableStorage: boolean
  maxEntries: number
  enablePerformanceTracking: boolean
  enableErrorTracking: boolean
  sanitizeData: boolean
}

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  category: string
  data?: any
}

export interface ErrorReport {
  id: string
  timestamp: number
  type: string
  message: string
  stack?: string
  context: any
  userAgent?: string
  url?: string
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  count: number
}

// Default configuration
const DEFAULT_CONFIG: LogConfig = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableConsole: true,
  enableStorage: true,
  maxEntries: 1000,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  sanitizeData: true
}

// Log level priorities
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
}

// Console styling
const CONSOLE_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6b7280; font-weight: normal',
  info: 'color: #3b82f6; font-weight: normal',
  warn: 'color: #f59e0b; font-weight: bold',
  error: 'color: #ef4444; font-weight: bold',
  fatal: 'color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 4px; border-radius: 4px'
}

/**
 * Main Logger Class
 */
export class Logger {
  private config: LogConfig
  private entries: LogEntry[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private errorReports: Map<string, ErrorReport> = new Map()
  private sessionMetrics: Map<string, number> = new Map()

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initialize()
  }

  private initialize() {
    // Load stored logs if storage is enabled
    if (this.config.enableStorage) {
      this.loadFromStorage()
    }

    // Set up global error handlers
    if (this.config.enableErrorTracking && typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers()
    }

    // Set up performance monitoring
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceMonitoring()
    }
  }

  /**
   * Log a message
   */
  log(level: LogLevel, category: string, message: string, data?: any, tags?: string[]): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.config.level]) {
      return
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data: this.config.sanitizeData ? this.sanitizeData(data) : data,
      sessionId: this.getSessionId(),
      tags
    }

    this.entries.push(entry)

    // Keep only the most recent entries
    if (this.entries.length > this.config.maxEntries) {
      this.entries = this.entries.slice(-this.config.maxEntries)
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    // Storage persistence
    if (this.config.enableStorage) {
      this.saveToStorage()
    }

    // Error tracking
    if (level === 'error' || level === 'fatal') {
      this.trackError(entry)
    }
  }

  /**
   * Convenience methods
   */
  debug(category: string, message: string, data?: any, tags?: string[]): void {
    this.log('debug', category, message, data, tags)
  }

  info(category: string, message: string, data?: any, tags?: string[]): void {
    this.log('info', category, message, data, tags)
  }

  warn(category: string, message: string, data?: any, tags?: string[]): void {
    this.log('warn', category, message, data, tags)
  }

  error(category: string, message: string, data?: any, tags?: string[]): void {
    this.log('error', category, message, data, tags)
  }

  fatal(category: string, message: string, data?: any, tags?: string[]): void {
    this.log('fatal', category, message, data, tags)
  }

  /**
   * Performance monitoring
   */
  startTimer(name: string, category: string = 'performance'): () => void {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      this.recordPerformance(name, duration, category)
    }
  }

  recordPerformance(name: string, duration: number, category: string = 'performance', data?: any): void {
    if (!this.config.enablePerformanceTracking) return

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      category,
      data: this.config.sanitizeData ? this.sanitizeData(data) : data
    }

    this.performanceMetrics.push(metric)

    // Keep only recent metrics
    if (this.performanceMetrics.length > 500) {
      this.performanceMetrics = this.performanceMetrics.slice(-500)
    }

    // Log slow operations
    if (duration > 1000) { // Over 1 second
      this.warn('performance', `Slow operation: ${name} took ${duration.toFixed(2)}ms`, { duration, category })
    }
  }

  /**
   * Error tracking
   */
  private trackError(entry: LogEntry): void {
    if (!this.config.enableErrorTracking) return

    const errorKey = `${entry.category}:${entry.message}`
    const existingReport = this.errorReports.get(errorKey)

    if (existingReport) {
      existingReport.count++
      existingReport.timestamp = Date.now()
    } else {
      const report: ErrorReport = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type: entry.category,
        message: entry.message,
        stack: entry.stack,
        context: entry.data,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        severity: entry.level === 'fatal' ? 'critical' : 'high',
        count: 1
      }

      this.errorReports.set(errorKey, report)
    }
  }

  /**
   * Session metrics
   */
  incrementSessionMetric(name: string, value: number = 1): void {
    const current = this.sessionMetrics.get(name) || 0
    this.sessionMetrics.set(name, current + value)
  }

  getSessionMetric(name: string): number {
    return this.sessionMetrics.get(name) || 0
  }

  /**
   * Data retrieval
   */
  getEntries(level?: LogLevel, category?: string, limit?: number): LogEntry[] {
    let filtered = this.entries

    if (level) {
      filtered = filtered.filter(entry => entry.level === level)
    }

    if (category) {
      filtered = filtered.filter(entry => entry.category === category)
    }

    if (limit) {
      filtered = filtered.slice(-limit)
    }

    return filtered
  }

  getPerformanceMetrics(category?: string, since?: number): PerformanceMetric[] {
    let filtered = this.performanceMetrics

    if (category) {
      filtered = filtered.filter(metric => metric.category === category)
    }

    if (since) {
      filtered = filtered.filter(metric => metric.timestamp >= since)
    }

    return filtered
  }

  getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  getStats() {
    const totalEntries = this.entries.length
    const errorCount = this.entries.filter(e => e.level === 'error' || e.level === 'fatal').length
    const avgResponseTime = this.performanceMetrics.length > 0
      ? this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length
      : 0

    return {
      totalEntries,
      errorCount,
      errorRate: totalEntries > 0 ? (errorCount / totalEntries) * 100 : 0,
      avgResponseTime,
      sessionMetrics: Object.fromEntries(this.sessionMetrics),
      topErrors: this.getErrorReports().slice(0, 5)
    }
  }

  /**
   * Data export
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        entries: this.entries,
        performanceMetrics: this.performanceMetrics,
        errorReports: this.getErrorReports(),
        sessionMetrics: Object.fromEntries(this.sessionMetrics),
        stats: this.getStats()
      }, null, 2)
    }

    // CSV format
    const headers = ['timestamp', 'level', 'category', 'message', 'data']
    const rows = this.entries.map(entry => [
      entry.timestamp,
      entry.level,
      entry.category,
      entry.message.replace(/"/g, '""'), // Escape quotes
      JSON.stringify(entry.data || {}).replace(/"/g, '""')
    ])

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  /**
   * Clear data
   */
  clearEntries(): void {
    this.entries = []
    if (this.config.enableStorage) {
      this.saveToStorage()
    }
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics = []
  }

  clearErrorReports(): void {
    this.errorReports.clear()
  }

  clearAll(): void {
    this.clearEntries()
    this.clearPerformanceMetrics()
    this.clearErrorReports()
    this.sessionMetrics.clear()
    if (this.config.enableStorage) {
      this.clearStorage()
    }
  }

  /**
   * Private methods
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    const style = CONSOLE_STYLES[entry.level]

    if (entry.data) {
      console.log(`%c${prefix} ${entry.message}`, style, entry.data)
    } else {
      console.log(`%c${prefix} ${entry.message}`, style)
    }

    // Log stack trace for errors
    if (entry.stack) {
      console.trace(entry.stack)
    }
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.error('global', 'Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, ['unhandled'])
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('global', 'Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      }, ['promise'])
    })

    // Custom error events
    window.addEventListener('app-error', (event) => {
      const errorInfo = event.detail
      this.error(errorInfo.type || 'component', errorInfo.message, errorInfo, ['component'])
    })
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return

    // Monitor page load performance
    window.addEventListener('load', () => {
      if (performance.timing) {
        const navigation = performance.timing
        const pageLoadTime = navigation.loadEventEnd - navigation.navigationStart
        this.recordPerformance('page_load', pageLoadTime, 'navigation')
      }
    })

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.recordPerformance('resource_load', entry.duration, 'resource', {
                name: entry.name,
                type: entry.initiatorType
              })
            }
          }
        })
        observer.observe({ entryTypes: ['resource'] })
      } catch (e) {
        this.warn('performance', 'PerformanceObserver not available', { error: e })
      }
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'

    let sessionId = sessionStorage.getItem('logger_session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('logger_session_id', sessionId)
    }
    return sessionId
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credit', 'card']
    const sanitized = Array.isArray(data) ? [...data] : { ...data }

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    }

    return sanitized
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = {
        entries: this.entries.slice(-100), // Save only recent entries
        config: this.config
      }
      localStorage.setItem('logger_data', JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save logs to storage:', e)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('logger_data')
      if (stored) {
        const data = JSON.parse(stored)
        this.entries = data.entries || []
        // Don't override config with stored config
      }
    } catch (e) {
      console.warn('Failed to load logs from storage:', e)
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('logger_data')
    } catch (e) {
      console.warn('Failed to clear logs from storage:', e)
    }
  }
}

// Global logger instance
export const logger = new Logger()

// Convenience hooks
export function useLogger(category: string) {
  return {
    debug: (message: string, data?: any, tags?: string[]) => logger.debug(category, message, data, tags),
    info: (message: string, data?: any, tags?: string[]) => logger.info(category, message, data, tags),
    warn: (message: string, data?: any, tags?: string[]) => logger.warn(category, message, data, tags),
    error: (message: string, data?: any, tags?: string[]) => logger.error(category, message, data, tags),
    fatal: (message: string, data?: any, tags?: string[]) => logger.fatal(category, message, data, tags),
    startTimer: (name: string, subCategory?: string) => logger.startTimer(name, `${category}${subCategory ? `.${subCategory}` : ''}`),
    incrementMetric: (name: string, value?: number) => logger.incrementSessionMetric(`${category}.${name}`, value),
    getMetric: (name: string) => logger.getSessionMetric(`${category}.${name}`)
  }
}

// Performance monitoring hook
export function usePerformance() {
  const metrics = React.useRef<Map<string, number>>(new Map())

  const startMeasurement = React.useCallback((name: string) => {
    metrics.current.set(name, performance.now())
  }, [])

  const endMeasurement = React.useCallback((name: string) => {
    const startTime = metrics.current.get(name)
    if (startTime) {
      const duration = performance.now() - startTime
      logger.recordPerformance(name, duration, 'react-component')
      metrics.current.delete(name)
      return duration
    }
    return 0
  }, [])

  return { startMeasurement, endMeasurement }
}

// Error boundary hook
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error)
      logger.error('component', 'Component error', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno
      })
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, resetError }
}

export default Logger