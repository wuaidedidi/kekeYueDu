/**
 * 性能监控工具
 * 提供性能指标收集和分析功能
 */

interface PerformanceMetrics {
  // 核心Web指标
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte

  // 自定义指标
  domInteractive?: number
  loadComplete?: number
  routeChangeTime?: number

  // 资源加载
  resourceTiming?: PerformanceResourceTiming[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
    this.collectBasicMetrics()
  }

  /**
   * 初始化性能观察器
   */
  private initializeObservers() {
    // 监控 Web Vitals
    this.observeWebVitals()

    // 监控资源加载时间
    this.observeResourceTiming()

    // 监控长任务
    this.observeLongTasks()
  }

  /**
   * 监控Web核心指标
   */
  private observeWebVitals() {
    try {
      // LCP (Largest Contentful Paint)
      this.observe('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })

      // FID (First Input Delay)
      this.observe('first-input', (entries) => {
        const firstEntry = entries[0]
        this.metrics.fid = (firstEntry as PerformanceEventTiming).processingStart - firstEntry.startTime
      })

      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      this.observe('layout-shift', (entries) => {
        entries.forEach(entry => {
          if (!(entry as PerformanceEntry).hadRecentInput) {
            clsValue += (entry as PerformanceEntry).value
          }
        })
        this.metrics.cls = clsValue
      })

      // FCP (First Contentful Paint)
      this.observe('paint', (entries) => {
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime
          }
        })
      })

    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error)
    }
  }

  /**
   * 监控资源加载时间
   */
  private observeResourceTiming() {
    this.observe('resource', (entries) => {
      this.metrics.resourceTiming = entries as PerformanceResourceTiming[]
    })
  }

  /**
   * 监控长任务
   */
  private observeLongTasks() {
    try {
      this.observe('longtask', (entries) => {
        entries.forEach(entry => {
          console.warn('Long task detected:', entry.duration, 'ms')
        })
      })
    } catch (error) {
      // longtask 可能不被所有浏览器支持
    }
  }

  /**
   * 通用的性能观察器
   */
  private observe(type: string, callback: (entries: PerformanceEntryList) => void) {
    if (typeof PerformanceObserver === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })

      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  /**
   * 收集基础性能指标
   */
  private collectBasicMetrics() {
    // DOM 加载完成时间
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domInteractive = performance.now()
      })
    } else {
      this.metrics.domInteractive = performance.now()
    }

    // 页面完全加载时间
    if (document.readyState === 'complete') {
      this.metrics.loadComplete = performance.now()
    } else {
      window.addEventListener('load', () => {
        this.metrics.loadComplete = performance.now()
      })
    }

    // TTFB (Time to First Byte)
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart
    }
  }

  /**
   * 测量路由切换时间
   */
  measureRouteChange(routeName: string) {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.metrics.routeChangeTime = duration

      console.log(`Route ${routeName} took ${duration.toFixed(2)}ms`)
      return duration
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metrics: this.metrics,
      scores: this.calculateScores()
    }

    return report
  }

  /**
   * 计算性能评分
   */
  private calculateScores() {
    const scores: Record<string, number | string> = {}

    if (this.metrics.lcp) {
      scores.lcpScore = this.getLCPScore(this.metrics.lcp)
    }

    if (this.metrics.fid) {
      scores.fidScore = this.getFIDScore(this.metrics.fid)
    }

    if (this.metrics.cls !== undefined) {
      scores.clsScore = this.getCLSScore(this.metrics.cls)
    }

    return scores
  }

  /**
   * LCP评分 (0-100)
   */
  private getLCPScore(lcp: number): number {
    if (lcp < 2500) return 100
    if (lcp < 4000) return Math.round(100 - ((lcp - 2500) / 1500) * 50)
    return Math.round(50 - Math.min(((lcp - 4000) / 4000) * 50, 50))
  }

  /**
   * FID评分 (0-100)
   */
  private getFIDScore(fid: number): number {
    if (fid < 100) return 100
    if (fid < 300) return Math.round(100 - ((fid - 100) / 200) * 50)
    return Math.round(50 - Math.min(((fid - 300) / 500) * 50, 50))
  }

  /**
   * CLS评分 (0-100)
   */
  private getCLSScore(cls: number): number {
    if (cls < 0.1) return 100
    if (cls < 0.25) return Math.round(100 - ((cls - 0.1) / 0.15) * 50)
    return Math.round(50 - Math.min(((cls - 0.25) / 0.25) * 50, 50))
  }

  /**
   * 将性能数据发送到分析服务
   */
  async sendToAnalytics(endpoint?: string) {
    const report = this.generateReport()

    try {
      const analyticsEndpoint = endpoint || '/api/analytics/performance'

      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      })

      console.log('Performance data sent to analytics')
    } catch (error) {
      console.warn('Failed to send performance data:', error)
    }
  }

  /**
   * 清理观察器
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 创建单例实例
let performanceMonitor: PerformanceMonitor | null = null

/**
 * 获取性能监控实例
 */
export function usePerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

/**
 * 手动测量函数执行时间
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const startTime = performance.now()

  const measure = () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    console.log(`${name} took ${duration.toFixed(2)}ms`)

    // 标记性能时间线
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }

  const result = fn()

  if (result instanceof Promise) {
    return result.finally(measure)
  } else {
    measure()
    return result
  }
}

export default PerformanceMonitor