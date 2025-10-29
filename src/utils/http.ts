// src/utils/http.ts

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

// 创建 axios 实例
const http: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api', // 指向简化服务器
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
