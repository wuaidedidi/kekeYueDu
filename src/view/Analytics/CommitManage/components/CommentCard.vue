<template>
  <el-card class="comment-card" :class="{ 'is-unread': !comment.is_read }">
    <template #header>
      <div class="comment-header">
        <div class="comment-info">
          <div class="user-avatar">
            <el-avatar
              :size="40"
              :src="comment.avatar_url"
              :alt="comment.nickname || comment.user_name"
            >
              {{
                (comment.nickname || comment.user_name || '匿名用户')
                  .charAt(0)
                  .toUpperCase()
              }}
            </el-avatar>
          </div>
          <div class="user-info">
            <div class="username">
              {{ comment.nickname || comment.user_name || '匿名用户' }}
            </div>
            <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
          </div>
        </div>

        <div class="comment-meta">
          <el-tag
            :type="getStatusTagType(comment.status)"
            size="small"
            effect="light"
          >
            {{ getStatusText(comment.status) }}
          </el-tag>

          <el-tag
            v-if="!comment.is_read"
            type="warning"
            size="small"
            effect="light"
          >
            未读
          </el-tag>

          <div class="stats">
            <span v-if="comment.like_count > 0" class="stat-item">
              <el-icon><Star /></el-icon>
              {{ comment.like_count }}
            </span>
            <span v-if="comment.reply_count > 0" class="stat-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ comment.reply_count }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <div class="comment-content">
      <div class="content-text" v-html="comment.content_html"></div>
    </div>

    <template #footer>
      <div class="comment-actions">
        <el-button
          v-if="!comment.is_read"
          size="small"
          @click="markAsRead"
          :loading="actionLoading.markRead"
        >
          标记已读
        </el-button>

        <el-button
          v-if="comment.is_read"
          size="small"
          type="warning"
          plain
          @click="markAsUnread"
          :loading="actionLoading.markUnread"
        >
          标记未读
        </el-button>

        <el-dropdown @command="handleStatusChange" trigger="click">
          <el-button size="small" :loading="actionLoading.status">
            更改状态 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="status in statusOptions"
                :key="status.value"
                :command="status.value"
                :disabled="status.value === comment.status"
              >
                {{ status.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button
          size="small"
          type="primary"
          @click="replyComment"
          :loading="actionLoading.reply"
        >
          回复
        </el-button>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Star, ChatDotRound, ArrowDown } from '@element-plus/icons-vue'

interface Comment {
  id: number
  book_id?: number
  chapter_id?: number
  user_id?: number
  nickname?: string
  user_name?: string
  avatar_url?: string
  content_html: string
  content_text: string
  created_at: string
  updated_at: string
  is_read: boolean
  status: 'new' | 'read' | 'handled'
  like_count: number
  reply_count: number
  heat_score: number
}

const props = defineProps<{
  comment: Comment
}>()

const emit = defineEmits<{
  markRead: [commentId: number, isRead: boolean]
  updateStatus: [commentId: number, status: string]
  reply: [comment: Comment]
  refresh: []
}>()

// 操作加载状态
const actionLoading = reactive({
  markRead: false,
  markUnread: false,
  status: false,
  reply: false,
})

// 状态选项
const statusOptions = [
  { value: 'new', label: '新评论' },
  { value: 'read', label: '已读' },
  { value: 'handled', label: '已处理' },
]

// 格式化时间
const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'new':
      return 'primary'
    case 'read':
      return 'info'
    case 'handled':
      return 'success'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'new':
      return '新评论'
    case 'read':
      return '已读'
    case 'handled':
      return '已处理'
    default:
      return status
  }
}

// 标记为已读
const markAsRead = async () => {
  actionLoading.markRead = true
  try {
    emit('markRead', props.comment.id, true)
  } finally {
    actionLoading.markRead = false
  }
}

// 标记为未读
const markAsUnread = async () => {
  actionLoading.markUnread = true
  try {
    emit('markRead', props.comment.id, false)
  } finally {
    actionLoading.markUnread = false
  }
}

// 处理状态变化
const handleStatusChange = async (status: string) => {
  if (status === props.comment.status) return

  actionLoading.status = true
  try {
    emit('updateStatus', props.comment.id, status)
  } finally {
    actionLoading.status = false
  }
}

// 回复评论
const replyComment = () => {
  emit('reply', props.comment)
}
</script>

<style lang="scss" scoped>
.comment-card {
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &.is-unread {
    border-left: 4px solid #409eff;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
  }

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.comment-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.comment-content {
  margin: 16px 0;
  line-height: 1.6;
  color: #333;
}

.content-text {
  word-wrap: break-word;
  overflow-wrap: break-word;

  // 简单的样式重置
  :deep(p) {
    margin: 0 0 8px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(a) {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid #e4e7ed;
    padding-left: 12px;
    margin: 8px 0;
    color: #666;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  :deep(li) {
    margin: 4px 0;
  }

  :deep(strong),
  :deep(b) {
    font-weight: bold;
  }

  :deep(em),
  :deep(i) {
    font-style: italic;
  }
}

.comment-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-info {
    width: 100%;
  }

  .comment-meta {
    width: 100%;
    justify-content: space-between;
  }

  .comment-actions {
    justify-content: flex-start;
  }
}
</style>
