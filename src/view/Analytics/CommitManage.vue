<template>
  <div class="comment-manage">
    <!-- 顶部统计和操作栏 -->
    <div class="comment-header">
      <div class="stats-cards">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总评论数</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number unread">{{ stats.unread }}</div>
            <div class="stat-label">未读评论</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number new">{{ stats.new }}</div>
            <div class="stat-label">新评论</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number handled">{{ stats.handled }}</div>
            <div class="stat-label">已处理</div>
          </div>
        </el-card>
      </div>

      <div class="action-bar">
        <div class="filters">
          <el-select
            v-model="filters.status"
            placeholder="状态筛选"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="新评论" value="new" />
            <el-option label="已读" value="read" />
            <el-option label="已处理" value="handled" />
          </el-select>

          <el-select
            v-model="filters.isRead"
            placeholder="已读状态"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="未读" value="false" />
            <el-option label="已读" value="true" />
          </el-select>

          <el-select
            v-model="filters.sortBy"
            placeholder="排序方式"
            @change="handleFilterChange"
          >
            <el-option label="创建时间" value="created_at" />
            <el-option label="热度分数" value="heat_score" />
            <el-option label="点赞数" value="like_count" />
            <el-option label="回复数" value="reply_count" />
          </el-select>

          <el-select
            v-model="filters.sortOrder"
            placeholder="排序顺序"
            @change="handleFilterChange"
          >
            <el-option label="降序" value="DESC" />
            <el-option label="升序" value="ASC" />
          </el-select>
        </div>

        <div class="search-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索评论内容..."
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch" icon="Search" />
            </template>
          </el-input>

          <el-button @click="handleRefresh" icon="Refresh">刷新</el-button>
          <el-button @click="showLogsDialog" icon="View">操作日志</el-button>
          <el-button @click="createTestComment" type="primary" icon="Plus">创建测试评论</el-button>
        </div>
      </div>

      <!-- 新评论提示 -->
      <div v-if="hasNewComments" class="new-comments-notice">
        <el-alert
          title="有新评论"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <span>有新的评论，点击</span>
            <el-button type="text" @click="handleRefresh">刷新</el-button>
            <span>查看</span>
          </template>
        </el-alert>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comment-list">
      <div v-loading="loading" class="list-container">
        <div v-if="comments.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无评论数据" />
        </div>

        <div v-else class="comments">
          <CommentCard
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            @mark-read="handleMarkRead"
            @update-status="handleUpdateStatus"
            @reply="handleReply"
            @refresh="loadComments"
          />
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 回复编辑器弹窗 -->
    <ReplyDialog
      v-model:visible="replyDialog.visible"
      :comment="replyDialog.comment"
      @success="handleReplySuccess"
    />

    <!-- 操作日志弹窗 -->
    <LogsDialog
      v-model:visible="logsDialog.visible"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import CommentCard from '@/view/Analytics/CommitManage/components/CommentCard.vue'
import ReplyDialog from '@/view/Analytics/CommitManage/components/ReplyDialog.vue'
import LogsDialog from '@/view/Analytics/CommitManage/components/LogsDialog.vue'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import http, { buildApiUrl } from '@/utils/http'

const commentsStore = useCommentsStore()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const hasNewComments = ref(false)

// 统计数据
const stats = reactive({
  total: 0,
  unread: 0,
  new: 0,
  handled: 0
})

// 筛选条件
const filters = reactive({
  status: '',
  isRead: '',
  sortBy: 'created_at',
  sortOrder: 'DESC'
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 评论列表
const comments = ref([])

// 弹窗状态
const replyDialog = reactive({
  visible: false,
  comment: null
})

const logsDialog = reactive({
  visible: false
})

// SSE连接
let eventSource = null
let pollInterval = null

// 初始化
onMounted(async () => {
  // 初始化认证状态
  authStore.initAuth()
  await loadComments()
  initRealTimeConnection()
})

onUnmounted(() => {
  cleanupRealTimeConnection()
})

// 加载评论列表
const loadComments = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    }

    // 如果有搜索关键词，添加到参数中
    if (searchKeyword.value.trim()) {
      params.search = searchKeyword.value.trim()
    }

    const response = await commentsStore.fetchComments(params)

    if (response.success) {
      comments.value = response.data.comments
      Object.assign(pagination, response.data.pagination)
      Object.assign(stats, response.data.stats)
    } else {
      ElMessage.error(response.message || '加载评论失败')
    }
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

// 初始化实时连接
const initRealTimeConnection = () => {
  // 优先尝试SSE
  if (typeof EventSource !== 'undefined') {
    try {
      const token = authStore.token || localStorage.getItem('token') || ''
      const url = new URL(buildApiUrl('/comments/stream'))
      if (token) url.searchParams.set('token', token)
      eventSource = new EventSource(url.toString())

      eventSource.onopen = () => {
        console.log('SSE连接已建立')
      }

      // 监听命名事件
      eventSource.addEventListener('connected', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE已连接', data)
        } catch {}
      })

      eventSource.addEventListener('new_comment', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          hasNewComments.value = true
          ElMessage.info('有新评论')
        } catch (e) {
          console.error('解析SSE消息失败:', e)
        }
      })

      eventSource.onerror = () => {
        console.error('SSE连接错误，切换到轮询模式')
        cleanupRealTimeConnection()
        startPolling()
      }
    } catch (error) {
      console.error('创建SSE连接失败:', error)
      startPolling()
    }
  } else {
    startPolling()
  }
}

// 开始轮询
const startPolling = () => {
  pollInterval = setInterval(async () => {
    try {
      const lastCheck = new Date(Date.now() - 15000).toISOString() // 15秒前
      const { data } = await http.get('/comments', {
        params: { after: lastCheck }
      })
      if (data.success && data.data.comments.length > 0) {
        hasNewComments.value = true
        ElMessage.info('有新评论')
      }
    } catch (error) {
      console.error('轮询检查新评论失败:', error)
    }
  }, 15000) // 每15秒检查一次
}

// 清理实时连接
const cleanupRealTimeConnection = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// 处理筛选条件变化
const handleFilterChange = () => {
  pagination.page = 1
  loadComments()
}

// 处理搜索
const handleSearch = () => {
  pagination.page = 1
  loadComments()
}

// 处理刷新
const handleRefresh = () => {
  hasNewComments.value = false
  loadComments()
}

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  loadComments()
}

// 处理页面大小变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  loadComments()
}

// 标记已读/未读
const handleMarkRead = async (commentId: number, isRead: boolean) => {
  try {
    const response = await commentsStore.updateCommentReadStatus(commentId, isRead)
    if (response.success) {
      ElMessage.success(isRead ? '已标记为已读' : '已标记为未读')
      loadComments() // 刷新列表
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('更新已读状态失败:', error)
    ElMessage.error('操作失败')
  }
}

// 更新评论状态
const handleUpdateStatus = async (commentId: number, status: string) => {
  try {
    const response = await commentsStore.updateCommentStatus(commentId, status)
    if (response.success) {
      ElMessage.success('状态更新成功')
      loadComments() // 刷新列表
    } else {
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新评论状态失败:', error)
    ElMessage.error('状态更新失败')
  }
}

// 回复评论
const handleReply = (comment: any) => {
  replyDialog.comment = comment
  replyDialog.visible = true
}

// 回复成功回调
const handleReplySuccess = () => {
  replyDialog.visible = false
  replyDialog.comment = null
  loadComments() // 刷新列表
}

// 显示操作日志
const showLogsDialog = () => {
  logsDialog.visible = true
}

// 创建测试评论
const createTestComment = async () => {
  try {
    const testContent = `测试评论 ${Date.now()}`
    const response = await http.post('/comments/test', {
      bookId: 1,
      chapterId: 1,
      nickname: '测试用户',
      content: testContent
    });

    const data = response.data
    if (data.success) {
      ElMessage.success('测试评论创建成功')
      loadComments()
    } else {
      ElMessage.error(data.message || '创建测试评论失败')
    }
  } catch (error) {
    console.error('创建测试评论失败:', error)
    ElMessage.error('创建测试评论失败')
  }
}
</script>

<style lang="scss" scoped>
.comment-manage {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.comment-header {
  margin-bottom: 20px;
}

.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;

  .stat-card {
    flex: 1;
    min-width: 120px;
  }

  .stat-item {
    text-align: center;

    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #333;

      &.unread {
        color: #e6a23c;
      }

      &.new {
        color: #409eff;
      }

      &.handled {
        color: #67c23a;
      }
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }
  }
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;

  .filters {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .search-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.new-comments-notice {
  margin-bottom: 16px;
}

.comment-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-container {
  flex: 1;
  min-height: 400px;
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters,
  .search-actions {
    justify-content: center;
  }

  .stats-cards {
    flex-wrap: wrap;
  }
}
</style>