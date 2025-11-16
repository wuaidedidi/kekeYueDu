<template>
  <el-dialog
    v-model="dialogVisible"
    title="管理操作日志"
    width="900px"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="logs-dialog">
      <!-- 筛选条件 -->
      <div class="filters-bar">
        <div class="filters">
          <el-select
            v-model="filters.action"
            placeholder="操作类型"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="标记已读" value="mark_read" />
            <el-option label="标记未读" value="mark_unread" />
            <el-option label="更新状态" value="update_status" />
            <el-option label="回复评论" value="reply_comment" />
          </el-select>

          <el-select
            v-model="filters.targetType"
            placeholder="目标类型"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="评论" value="comment" />
          </el-select>

          <el-input
            v-model="filters.userId"
            placeholder="用户ID"
            style="width: 120px"
            @keyup.enter="handleFilterChange"
            @change="handleFilterChange"
          />
        </div>

        <el-button @click="refreshLogs" icon="Refresh">刷新</el-button>
      </div>

      <!-- 日志列表 -->
      <div v-loading="loading" class="logs-content">
        <div v-if="logs.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无操作日志" />
        </div>

        <div v-else class="logs-list">
          <div v-for="log in logs" :key="log.id" class="log-item">
            <div class="log-header">
              <div class="log-info">
                <div class="action-info">
                  <el-tag :type="getActionTagType(log.action)" size="small">
                    {{ getActionText(log.action) }}
                  </el-tag>
                  <span v-if="log.target_type" class="target-type">
                    {{ getTargetTypeText(log.target_type) }}
                  </span>
                  <span v-if="log.target_id" class="target-id">
                    #{{ log.target_id }}
                  </span>
                </div>
                <div class="user-info">
                  <el-avatar :size="24" class="user-avatar">
                    {{ (log.username || '未知用户').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <span class="username">{{ log.username || '未知用户' }}</span>
                </div>
              </div>
              <div class="log-time">
                {{ formatDateTime(log.created_at) }}
              </div>
            </div>

            <div v-if="log.details" class="log-details">
              <el-collapse>
                <el-collapse-item title="详细信息">
                  <pre class="details-content">{{
                    formatDetails(log.details)
                  }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div v-if="log.ip_address || log.user_agent" class="log-meta">
              <span v-if="log.ip_address" class="meta-item">
                <el-icon><Location /></el-icon>
                {{ log.ip_address }}
              </span>
              <span v-if="log.user_agent" class="meta-item">
                <el-icon><Monitor /></el-icon>
                {{ formatUserAgent(log.user_agent) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.total > 0" class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button @click="exportLogs" type="primary" icon="Download">
          导出日志
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, Monitor, Download } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import http from '@/utils/http'

interface Log {
  id: number
  user_id: number
  action: string
  target_type?: string
  target_id?: number
  details?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  username?: string
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const loading = ref(false)
const logs = ref<Log[]>([])

// 筛选条件
const filters = reactive({
  action: '',
  targetType: '',
  userId: '',
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0,
})

// 监听弹窗显示状态
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetFilters()
      loadLogs()
    }
  }
)

// 重置筛选条件
const resetFilters = () => {
  filters.action = ''
  filters.targetType = ''
  filters.userId = ''
  pagination.page = 1
  pagination.pageSize = 50
}

// 加载日志列表
const loadLogs = async () => {
  loading.value = true
  const authStore = useAuthStore()
  try {
    const { data } = await http.get('/admin/logs', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
      },
    })

    if (data.success) {
      logs.value = data.data.logs
      Object.assign(pagination, data.data.pagination)
    } else {
      ElMessage.error(data.message || '加载日志失败')
    }
  } catch (error) {
    console.error('加载日志失败:', error)
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

// 刷新日志
const refreshLogs = () => {
  loadLogs()
}

// 处理筛选条件变化
const handleFilterChange = () => {
  pagination.page = 1
  loadLogs()
}

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  loadLogs()
}

// 处理页面大小变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.page = 1
  pagination.pageSize = pageSize
  loadLogs()
}

// 获取操作标签类型
const getActionTagType = (action: string) => {
  switch (action) {
    case 'mark_read':
      return 'success'
    case 'mark_unread':
      return 'warning'
    case 'update_status':
      return 'primary'
    case 'reply_comment':
      return 'info'
    default:
      return 'default'
  }
}

// 获取操作文本
const getActionText = (action: string) => {
  switch (action) {
    case 'mark_read':
      return '标记已读'
    case 'mark_unread':
      return '标记未读'
    case 'update_status':
      return '更新状态'
    case 'reply_comment':
      return '回复评论'
    default:
      return action
  }
}

// 获取目标类型文本
const getTargetTypeText = (targetType: string) => {
  switch (targetType) {
    case 'comment':
      return '评论'
    default:
      return targetType
  }
}

// 格式化日期时间
const formatDateTime = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 格式化详细信息
const formatDetails = (details: string) => {
  try {
    return JSON.stringify(JSON.parse(details), null, 2)
  } catch {
    return details
  }
}

// 格式化User-Agent
const formatUserAgent = (userAgent: string) => {
  // 简化User-Agent显示
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    return `Chrome ${match ? match[1] : ''}`
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    return `Firefox ${match ? match[1] : ''}`
  } else if (userAgent.includes('Safari')) {
    return 'Safari'
  } else {
    return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '')
  }
}

// 导出日志
const exportLogs = async () => {
  const authStore = useAuthStore()
  try {
    const { data } = await http.get('/admin/logs', {
      params: {
        page: 1,
        pageSize: 10000,
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
      },
    })

    if (data.success) {
      const logs = data.data.logs
      const csvContent = convertToCSV(logs)
      downloadCSV(
        csvContent,
        `admin_logs_${new Date().toISOString().split('T')[0]}.csv`
      )
      ElMessage.success('日志导出成功')
    } else {
      ElMessage.error(data.message || '导出失败')
    }
  } catch (error) {
    console.error('导出日志失败:', error)
    ElMessage.error('导出失败')
  }
}

// 转换为CSV格式
const convertToCSV = (logs: Log[]) => {
  const headers = [
    'ID',
    '用户名',
    '操作类型',
    '目标类型',
    '目标ID',
    'IP地址',
    'User Agent',
    '详细信息',
    '创建时间',
  ]

  const rows = logs.map((log) => [
    log.id,
    log.username || '',
    getActionText(log.action),
    getTargetTypeText(log.target_type || ''),
    log.target_id || '',
    log.ip_address || '',
    formatUserAgent(log.user_agent || ''),
    formatDetails(log.details || ''),
    formatDateTime(log.created_at),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return '\ufeff' + csvContent // 添加BOM以支持中文
}

// 下载CSV文件
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.logs-dialog {
  .filters-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;

    .filters {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .logs-content {
    min-height: 400px;
    max-height: 600px;
    overflow-y: auto;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .log-item {
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s ease;

    &:hover {
      background: #f5f7fa;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .log-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .action-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .target-type {
    font-size: 12px;
    color: #666;
  }

  .target-id {
    font-size: 12px;
    color: #999;
    font-family: monospace;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar {
    background: #409eff;
    color: white;
    font-size: 12px;
  }

  .username {
    font-size: 14px;
    color: #333;
  }

  .log-time {
    font-size: 12px;
    color: #999;
  }

  .log-details {
    margin: 8px 0;
  }

  .details-content {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
  }

  .log-meta {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    font-size: 12px;
    color: #999;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .logs-dialog {
    .filters-bar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .filters {
      justify-content: center;
    }

    .log-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .log-info {
      width: 100%;
      justify-content: space-between;
    }

    .log-meta {
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style>
