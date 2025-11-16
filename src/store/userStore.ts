import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户接口定义
export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  created_at: string
  updated_at: string
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoggedIn = computed(() => !!user.value && !!token.value)

  // 初始化：从localStorage恢复状态
  const initAuth = () => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('token')

      if (savedUser && savedToken) {
        user.value = JSON.parse(savedUser)
        token.value = savedToken
      }
    } catch (error) {
      console.error('恢复用户状态失败:', error)
      clearAuth()
    }
  }

  // 设置用户信息
  const setUser = (userData: User, userToken: string) => {
    user.value = userData
    token.value = userToken

    // 保存到localStorage
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userToken)
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null

    // 清除localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // 登出
  const logout = () => {
    clearAuth()
    // 可以在这里添加其他登出逻辑，比如跳转到登录页
    window.location.href = '/login'
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    initAuth,
    setUser,
    clearAuth,
    logout,
    updateUser,
  }
})
