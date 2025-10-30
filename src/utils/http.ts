// src/utils/http.ts

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

// 创建 axios 实例（从环境变量读取 API 基址）
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080'
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
    // 响应错误处理
    return Promise.reject(error)
  }
)

export default http
