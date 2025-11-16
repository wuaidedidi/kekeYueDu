import { vi } from 'vitest'

// Node.js environment setup - no browser APIs needed for server testing

// Mock crypto if not available
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
      getRandomValues: vi.fn(() => new Uint8Array(16))
    }
  })
}

// Mock fetch
global.fetch = vi.fn()

// Mock performance for Node.js
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
} as any

// Mock URL constructor if needed
if (!global.URL) {
  global.URL = class URL {
    constructor(public href: string, base?: string) {
      this.pathname = '/'
    }
    pathname = ''
    search = ''
    hash = ''
    origin = 'http://localhost:3000'
  } as any
}