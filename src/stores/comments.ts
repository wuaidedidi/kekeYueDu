import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import http from '@/utils/http'

export const useCommentsStore = defineStore('comments', {
  state: () => ({
    comments: [] as any[],
    stats: {
      total: 0,
      unread: 0,
      new: 0,
      handled: 0
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    },
    loading: false
  }),

  actions: {
    // 获取评论列表
    async fetchComments(params: any = {}) {
      try {
        const authStore = useAuthStore()
        const { data } = await http.get('/comments', {
          params
        })
        return data
      } catch (error) {
        console.error('获取评论列表失败:', error)
        throw error
      }
    },

    // 搜索评论
    async searchComments(params: { q: string; page?: number; pageSize?: number }) {
      try {
        const authStore = useAuthStore()
        const { data } = await http.post('/comments/search', params)
        return data
      } catch (error) {
        console.error('搜索评论失败:', error)
        throw error
      }
    },

    // 更新评论已读状态
    async updateCommentReadStatus(commentId: number, isRead: boolean) {
      try {
        const authStore = useAuthStore()
        const { data } = await http.patch(`/comments/${commentId}/read`, { isRead })
        return data
      } catch (error) {
        console.error('更新评论已读状态失败:', error)
        throw error
      }
    },

    // 更新评论状态
    async updateCommentStatus(commentId: number, status: string) {
      try {
        const authStore = useAuthStore()
        const { data } = await http.patch(`/comments/${commentId}/status`, { status })
        return data
      } catch (error) {
        console.error('更新评论状态失败:', error)
        throw error
      }
    },

    // 回复评论
    async replyComment(commentId: number, contentHtml: string) {
      try {
        const authStore = useAuthStore()
        const { data } = await http.post(`/comments/${commentId}/replies`, { contentHtml })
        return data
      } catch (error) {
        console.error('回复评论失败:', error)
        throw error
      }
    },

    // 创建测试评论
    async createTestComment(params: {
      bookId?: number
      chapterId?: number
      nickname?: string
      content: string
    }) {
      try {
        const { data } = await http.post('/comments/test', {
          bookId: params.bookId || 1,
          chapterId: params.chapterId || 1,
          nickname: params.nickname || '测试用户',
          content: params.content
        })
        return data
      } catch (error) {
        console.error('创建测试评论失败:', error)
        throw error
      }
    }
  }
})