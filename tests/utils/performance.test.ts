import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePerformanceMonitor, measurePerformance } from '../../src/utils/performance'

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
}

// Mock global performance
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
})

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('usePerformanceMonitor', () => {
    it('应该创建性能监控实例', () => {
      const monitor = usePerformanceMonitor()
      expect(monitor).toBeDefined()
      expect(typeof monitor.getMetrics).toBe('function')
      expect(typeof monitor.generateReport).toBe('function')
    })

    it('应该返回相同的实例（单例模式）', () => {
      const monitor1 = usePerformanceMonitor()
      const monitor2 = usePerformanceMonitor()
      expect(monitor1).toBe(monitor2)
    })

    it('应该收集基本指标', () => {
      const monitor = usePerformanceMonitor()
      const metrics = monitor.getMetrics()
      expect(metrics).toHaveProperty('domInteractive')
      expect(metrics).toHaveProperty('loadComplete')
      expect(metrics).toHaveProperty('ttfb')
    })

    it('应该生成性能报告', () => {
      const monitor = usePerformanceMonitor()
      const report = monitor.generateReport()

      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('userAgent')
      expect(report).toHaveProperty('url')
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('scores')
    })

    it('应该计算性能评分', () => {
      const monitor = usePerformanceMonitor()

      // Mock LCP数据
      mockPerformance.now.mockReturnValue(1000)
      const report = monitor.generateReport()

      expect(report.scores).toBeDefined()
    })

    it('应该测量路由切换时间', () => {
      const monitor = usePerformanceMonitor()
      mockPerformance.now.mockReturnValue(100)

      const endMeasure = monitor.measureRouteChange('home')
      expect(typeof endMeasure).toBe('function')

      mockPerformance.now.mockReturnValue(200)
      const duration = endMeasure()
      expect(duration).toBe(100)
    })
  })

  describe('measurePerformance', () => {
    it('应该测量同步函数执行时间', () => {
      mockPerformance.now.mockReturnValue(100)

      const result = measurePerformance('test-function', () => {
        mockPerformance.now.mockReturnValue(150)
        return 'test-result'
      })

      expect(result).toBe('test-result')
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-function-end')
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-function', 'test-function-start', 'test-function-end')
    })

    it('应该测量异步函数执行时间', async () => {
      mockPerformance.now.mockReturnValue(100)

      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        mockPerformance.now.mockReturnValue(200)
        return 'async-result'
      }

      const result = await measurePerformance('async-function', asyncFunction)
      expect(result).toBe('async-result')
    })

    it('应该处理Promise rejection', async () => {
      mockPerformance.now.mockReturnValue(100)

      const errorFunction = async () => {
        mockPerformance.now.mockReturnValue(150)
        throw new Error('Test error')
      }

      await expect(measurePerformance('error-function', errorFunction)).rejects.toThrow('Test error')
    })
  })
})