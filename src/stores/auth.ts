import { defineStore } from 'pinia'
import http from '@/utils/http'

interface User {
  id: number
  username: string
  email?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || '',
    isAuthenticated: false,
  }),

  getters: {
    isAdmin: (state) => {
      // 暂时简化处理：用户ID为12的管理员
      return state.user?.id === 12
    },
  },

  actions: {
    // 设置用户信息和token
    setUser(user: User, token: string) {
      this.user = user
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('token', token)
    },

    // 清除用户信息
    clearUser() {
      this.user = null
      this.token = ''
      this.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    // 从token解析用户信息
    parseToken(token: string) {
      try {
        // 简单的JWT解析（仅用于客户端）
        const payload = token.split('.')[1]
        const decoded = JSON.parse(atob(payload))
        // 过期校验
        const now = Math.floor(Date.now() / 1000)
        if (decoded.exp && decoded.exp < now) {
          console.warn('Token 已过期')
          this.clearUser()
          return false
        }
        this.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
        }
        this.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(this.user))
        return true
      } catch (error) {
        console.error('解析token失败:', error)
        this.clearUser()
        return false
      }
    },

    // 初始化认证状态
    initAuth() {
      const token = localStorage.getItem('token') || this.token
      if (token) {
        this.token = token
        this.parseToken(token)
      }
    },

    // 登录
    async login(username: string, password: string) {
      try {
        const response = await http.post('/login', { username, password })

        if (response.data.success) {
          this.setUser(response.data.data.user, response.data.data.token)
          return response.data
        } else {
          throw new Error(response.data.message || '登录失败')
        }
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    // 注册
    async register(
      username: string,
      password: string,
      confirmPassword: string
    ) {
      try {
        const response = await http.post('/register', {
          username,
          password,
          confirmPassword,
        })

        if (response.data.success) {
          this.setUser(response.data.data.user, response.data.data.token)
          return response.data
        } else {
          throw new Error(response.data.message || '注册失败')
        }
      } catch (error) {
        console.error('注册失败:', error)
        throw error
      }
    },

    // 登出
    logout() {
      this.clearUser()
    },
  },
})
