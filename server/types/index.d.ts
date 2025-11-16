// 用户相关类型定义
export interface User {
  id: number
  username: string
  password: string
  email?: string
  role?: string
  created_at?: string
  updated_at?: string
}

export interface UserResponse {
  id: number
  username: string
  email?: string
  role?: string
  created_at?: string
}

export interface AuthRequest {
  body: {
    username: string
    password: string
    confirmPassword?: string
    email?: string
  }
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: UserResponse
    token: string
  }
}

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
}

// 草稿相关类型
export interface Draft {
  id: number
  bookName: string
  fontCount: number
  src: string
  created_at?: string
  updated_at?: string
}

// 分卷相关类型
export interface Volume {
  id: number
  title: string
  book_id: number
  order_index: number
  created_at?: string
}

// 章节相关类型
export interface Chapter {
  id: number
  title: string
  content?: string
  volume_id: number
  order_index: number
  created_at?: string
  updated_at?: string
  current_version_id?: number
}

// 评论相关类型
export interface Comment {
  id: number
  book_id?: number
  chapter_id?: number
  user_id?: number
  nickname?: string
  avatar_url?: string
  content_html?: string
  content_text?: string
  created_at?: string
  updated_at?: string
  is_read: boolean
  status: 'new' | 'read' | 'handled'
  like_count: number
  reply_count: number
  heat_score: number
  user_name?: string
}

// 商品相关类型
export interface Product {
  id: number
  title: string
  subtitle?: string
  description?: string
  type: 'vip' | 'coupon' | 'skin' | 'ai_tool' | 'tool'
  price: number
  charge_mode: 'duration' | 'times' | 'points'
  duration_days?: number
  times?: number
  activation_required: number
  icon_url?: string
  status: 'active' | 'inactive'
  stock: number
  created_at?: string
  updated_at?: string
}

// 订单相关类型
export interface ShopOrder {
  id: number
  user_id: number
  product_id: number
  quantity: number
  points_cost: number
  status: string
  created_at?: string
}

// 用户权益相关类型
export interface UserRight {
  id: number
  user_id: number
  product_id: number
  status: string
  expires_at?: string
  created_at?: string
  updated_at?: string
  product_title?: string
  product_type?: string
  duration_days?: number
}

// 管理操作日志相关类型
export interface AdminLog {
  id: number
  user_id: number
  action: string
  target_type?: string
  target_id?: number
  details?: string
  ip_address?: string
  user_agent?: string
  created_at?: string
  username?: string
}

// Express 请求扩展
export interface AuthenticatedRequest {
  user: {
    id: number
    username: string
  }
}

// 数据库查询选项
export interface QueryOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}
