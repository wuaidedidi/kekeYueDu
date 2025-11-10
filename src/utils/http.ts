// src/utils/http.ts

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

// 创建 axios 实例（从环境变量读取 API 基址）
// 默认回退端口改为 9999，与 .env 保持一致
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:9999'
const BASE = RAW_BASE.endsWith('/api') ? RAW_BASE : RAW_BASE.replace(/\/$/, '') + '/api'
const http: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: 10000, // 请求超时时间
})

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 这里可以在请求发送前做一些处理，比如添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 可以在这里处理响应数据
    return response
  },
  (error) => {
    // 响应错误处理：自动处理令牌无效/过期
    const resp = error?.response
    if (resp) {
      const status = resp.status
      const msg: string = resp.data?.message || ''
      const isAuthError =
        status === 401 ||
        (status === 403 && (
          msg.includes('令牌无效') ||
          msg.includes('过期') ||
          msg.includes('未提供认证令牌') ||
          msg.includes('未认证')
        ))

      if (isAuthError) {
        try {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        } catch (_) {}
        // 跳转到登录页
        if (typeof window !== 'undefined') {
          window.location.hash = '#/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// 导出 API 基址与 URL 构造辅助，便于 SSE 等场景统一使用
export const API_BASE_URL = BASE
export const buildApiUrl = (path: string) => {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${BASE.replace(/\/$/, '')}${clean}`
}

// 导出 Server 基址（无 /api）与静态资源 URL 构造辅助
export const SERVER_BASE_URL = BASE.replace(/\/api$/, '')
export const buildServerUrl = (path: string) => {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${SERVER_BASE_URL}${clean}`
}

export default http
