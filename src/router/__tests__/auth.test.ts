import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards } from '../auth'
import { useUserStore } from '@/store/userStore'

// Mock user store
vi.mock('@/store/userStore', () => ({
  useUserStore: vi.fn(),
}))

describe('路由守卫', () => {
  let router: any
  let mockUserStore: any

  beforeEach(() => {
    // 创建测试路由
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/login',
          name: 'Login',
          component: { template: '<div>Login</div>' },
        },
        {
          path: '/workspace/all-books',
          name: 'AllBooks',
          component: { template: '<div>All Books</div>' },
          meta: { requiresAuth: true },
        },
        {
          path: '/profile',
          name: 'Profile',
          component: { template: '<div>Profile</div>' },
          meta: { requireAuth: true },
        },
        {
          path: '/public',
          name: 'Public',
          component: { template: '<div>Public</div>' },
        },
      ],
    })

    // Mock user store
    mockUserStore = {
      user: null,
      token: null,
      isLoggedIn: false,
      initAuth: vi.fn(),
      setUser: vi.fn(),
    }

    vi.mocked(useUserStore).mockReturnValue(mockUserStore)

    // 设置路由守卫
    setupRouterGuards(router)
  })

  it('应该初始化用户状态当未初始化时', async () => {
    const to = { path: '/public', matched: [] }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(mockUserStore.initAuth).toHaveBeenCalled()
  })

  it('应该允许未登录用户访问公共页面', async () => {
    const to = { path: '/public', matched: [] }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('应该重定向未登录用户到登录页当访问需要认证的页面', async () => {
    const to = {
      path: '/workspace/all-books',
      matched: [{ meta: { requiresAuth: true } }],
    }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith('/login')
  })

  it('应该重定向未登录用户到登录页当使用旧的 requireAuth 标记', async () => {
    const to = { path: '/profile', matched: [{ meta: { requireAuth: true } }] }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith('/login')
  })

  it('应该允许已登录用户访问需要认证的页面', async () => {
    // 设置用户为已登录
    mockUserStore.isLoggedIn = true
    mockUserStore.user = { id: 1, name: 'Test User' }
    mockUserStore.token = 'test-token'

    const to = {
      path: '/workspace/all-books',
      matched: [{ meta: { requiresAuth: true } }],
    }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('应该重定向已登录用户到主页当访问登录页', async () => {
    // 设置用户为已登录
    mockUserStore.isLoggedIn = true
    mockUserStore.user = { id: 1, name: 'Test User' }
    mockUserStore.token = 'test-token'

    const to = { path: '/login', matched: [] }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith('/workspace/all-books')
  })

  it('应该允许已登录用户访问登录页之外的页面', async () => {
    // 设置用户为已登录
    mockUserStore.isLoggedIn = true
    mockUserStore.user = { id: 1, name: 'Test User' }
    mockUserStore.token = 'test-token'

    const to = { path: '/public', matched: [] }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('不应该重复初始化已经初始化的用户状态', async () => {
    // 设置用户已经有token
    mockUserStore.user = { id: 1, name: 'Test User' }
    mockUserStore.token = 'test-token'

    const to = { path: '/public', matched: [] }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(mockUserStore.initAuth).not.toHaveBeenCalled()
  })

  it('应该正确处理复杂的路由匹配', async () => {
    // 测试嵌套路由
    const to = {
      path: '/workspace/all-books',
      matched: [{ meta: {} }, { meta: { requiresAuth: true } }],
    }
    const from = {}
    const next = vi.fn()

    await router.beforeEach(to, from, next)

    expect(next).toHaveBeenCalledWith('/login')
  })
})
