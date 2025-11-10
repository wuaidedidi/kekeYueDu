<template>
  <el-dialog
    v-model="dialogVisible"
    title="回复评论"
    width="600px"
    :before-close="handleClose"
    destroy-on-close
  >
    <div v-if="comment" class="reply-dialog">
      <!-- 原评论信息 -->
      <div class="original-comment">
        <div class="comment-header">
          <div class="user-info">
            <el-avatar :size="32" :src="comment.avatar_url">
              {{ (comment.nickname || comment.user_name || '匿名用户').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="user-details">
              <div class="username">{{ comment.nickname || comment.user_name || '匿名用户' }}</div>
              <div class="time">{{ formatTime(comment.created_at) }}</div>
            </div>
          </div>
          <el-tag :type="getStatusTagType(comment.status)" size="small">
            {{ getStatusText(comment.status) }}
          </el-tag>
        </div>
        <div class="comment-content" v-html="comment.content_html"></div>
      </div>

      <!-- 分隔线 -->
      <el-divider>回复内容</el-divider>

      <!-- 回复编辑器 -->
      <div class="reply-editor">
        <div class="editor-toolbar">
          <el-button-group>
            <el-button
              size="small"
              @click="insertFormat('bold')"
              title="加粗"
              :type="editorFormats.bold ? 'primary' : 'default'"
            >
              <el-icon><EditPen /></el-icon>
            </el-button>
            <el-button
              size="small"
              @click="insertFormat('italic')"
              title="斜体"
              :type="editorFormats.italic ? 'primary' : 'default'"
            >
              <el-icon><EditPen /></el-icon>
            </el-button>
            <el-button
              size="small"
              @click="insertFormat('underline')"
              title="下划线"
              :type="editorFormats.underline ? 'primary' : 'default'"
            >
              <el-icon><EditPen /></el-icon>
            </el-button>
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button-group>
            <el-button
              size="small"
              @click="insertFormat('link')"
              title="插入链接"
              :type="editorFormats.link ? 'primary' : 'default'"
            >
              <el-icon><Link /></el-icon>
            </el-button>
            <el-button
              size="small"
              @click="insertFormat('quote')"
              title="引用"
              :type="editorFormats.quote ? 'primary' : 'default'"
            >
              <el-icon><EditPen /></el-icon>
            </el-button>
          </el-button-group>

          <el-divider direction="vertical" />

          <el-button-group>
            <el-button
              size="small"
              @click="insertFormat('ul')"
              title="无序列表"
              :type="editorFormats.ul ? 'primary' : 'default'"
            >
              <el-icon><List /></el-icon>
            </el-button>
            <el-button
              size="small"
              @click="insertFormat('ol')"
              title="有序列表"
              :type="editorFormats.ol ? 'primary' : 'default'"
            >
              <el-icon><Rank /></el-icon>
            </el-button>
          </el-button-group>

          <el-button
            size="small"
            @click="previewMode = !previewMode"
            :type="previewMode ? 'primary' : 'default'"
            style="margin-left: auto"
          >
            <el-icon><View v-if="!previewMode" /><Edit v-else /></el-icon>
            {{ previewMode ? '编辑' : '预览' }}
          </el-button>
        </div>

        <div class="editor-content">
          <!-- 编辑模式 -->
          <div v-if="!previewMode" class="editor-wrapper">
            <div
              ref="editorRef"
              class="rich-editor"
              contenteditable="true"
              @input="handleInput"
              @keydown="handleKeydown"
              @paste="handlePaste"
              placeholder="请输入回复内容..."
            ></div>
          </div>

          <!-- 预览模式 -->
          <div v-else class="preview-wrapper">
            <div class="preview-content" v-html="replyContent || '<em>暂无内容</em>'"></div>
          </div>
        </div>

        <!-- 字数统计 -->
        <div class="editor-footer">
          <div class="char-count">
            {{ charCount }} / 2000 字符
          </div>
          <div class="tips">
            支持 Ctrl+B 加粗、Ctrl+I 斜体、Ctrl+U 下划线等快捷键
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
          :disabled="!replyContent.trim()"
        >
          发送回复
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  EditPen, Link, List, Rank,
  View, Edit
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import http from '@/utils/http'

interface Comment {
  id: number
  nickname?: string
  user_name?: string
  avatar_url?: string
  content_html: string
  content_text: string
  created_at: string
  status: string
}

const props = defineProps<{
  visible: boolean
  comment: Comment | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  success: []
}>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const editorRef = ref<HTMLElement>()
const replyContent = ref('')
const submitting = ref(false)
const previewMode = ref(false)

// 编辑器格式状态
const editorFormats = reactive({
  bold: false,
  italic: false,
  underline: false,
  link: false,
  quote: false,
  ul: false,
  ol: false
})

// 字数统计
const charCount = computed(() => {
  return replyContent.value.replace(/<[^>]*>/g, '').length
})

// 监听弹窗显示状态
watch(() => props.visible, (visible) => {
  if (visible && props.comment) {
    // 重置状态
    replyContent.value = ''
    previewMode.value = false
    submitting.value = false
    resetFormats()

    // 等待DOM更新后聚焦编辑器
    nextTick(() => {
      if (editorRef.value) {
        editorRef.value.focus()
      }
    })
  }
})

// 监听内容变化，更新格式状态
watch(replyContent, () => {
  updateFormatStates()
})

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
      minute: '2-digit'
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

// 处理输入
const handleInput = () => {
  if (editorRef.value) {
    replyContent.value = editorRef.value.innerHTML
  }
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault()
        insertFormat('bold')
        break
      case 'i':
        event.preventDefault()
        insertFormat('italic')
        break
      case 'u':
        event.preventDefault()
        insertFormat('underline')
        break
    }
  }
}

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()

  const text = event.clipboardData?.getData('text/plain') || ''
  const html = event.clipboardData?.getData('text/html') || ''

  if (editorRef.value) {
    if (html) {
      // 粘贴HTML内容（经过清理）
      const cleanHtml = sanitizeHtml(html)
      document.execCommand('insertHTML', false, cleanHtml)
    } else {
      // 粘贴纯文本
      document.execCommand('insertText', false, text)
    }

    handleInput()
  }
}

// 简单的HTML清理
const sanitizeHtml = (html: string) => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, (match) => {
      const tagName = match.match(/<\/?([a-zA-Z]+)/)
      const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'blockquote']
      if (tagName && allowedTags.includes(tagName[1].toLowerCase())) {
        return match
      }
      return ''
    })
}

// 插入格式
const insertFormat = (format: string) => {
  if (!editorRef.value) return

  const selection = window.getSelection()
  const range = selection?.getRangeAt(0)

  if (!range) return

  let html = ''

  switch (format) {
    case 'bold':
      html = '<strong>粗体文本</strong>'
      break
    case 'italic':
      html = '<em>斜体文本</em>'
      break
    case 'underline':
      html = '<u>下划线文本</u>'
      break
    case 'link':
      const url = prompt('请输入链接地址：', 'https://')
      if (url) {
        html = `<a href="${url}" target="_blank">${url}</a>`
      }
      break
    case 'quote':
      html = '<blockquote>引用内容</blockquote>'
      break
    case 'ul':
      html = '<ul><li>列表项 1</li><li>列表项 2</li></ul>'
      break
    case 'ol':
      html = '<ol><li>列表项 1</li><li>列表项 2</li></ol>'
      break
  }

  if (html) {
    document.execCommand('insertHTML', false, html)
    handleInput()
  }
}

// 重置格式状态
const resetFormats = () => {
  Object.keys(editorFormats).forEach(key => {
    editorFormats[key] = false
  })
}

// 更新格式状态
const updateFormatStates = () => {
  if (!editorRef.value) return

  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    const parentElement =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as HTMLElement)
        : container.parentElement

    if (!parentElement) return

    resetFormats()

    // 检查当前选中的格式
    if (parentElement.closest('strong, b')) editorFormats.bold = true
    if (parentElement.closest('em, i')) editorFormats.italic = true
    if (parentElement.closest('u')) editorFormats.underline = true
    if (parentElement.closest('a')) editorFormats.link = true
    if (parentElement.closest('blockquote')) editorFormats.quote = true
    if (parentElement.closest('ul')) editorFormats.ul = true
    if (parentElement.closest('ol')) editorFormats.ol = true
  }
}

// 提交回复
const handleSubmit = async () => {
  if (!props.comment || !replyContent.value.trim()) return

  if (charCount.value > 2000) {
    ElMessage.error('回复内容不能超过2000字符')
    return
  }

  submitting.value = true

  try {
    const response = await http.post(`/comments/${props.comment.id}/replies`, {
      contentHtml: replyContent.value
    })

    if (response.data.success) {
      ElMessage.success('回复发送成功')
      emit('success')
    } else {
      ElMessage.error(response.data.message || '回复发送失败')
    }
  } catch (error) {
    console.error('发送回复失败:', error)
    ElMessage.error('发送回复失败')
  } finally {
    submitting.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.reply-dialog {
  .original-comment {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-details {
    .username {
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
    }

    .time {
      font-size: 12px;
      color: #999;
    }
  }

  .comment-content {
    color: #333;
    line-height: 1.6;

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
  }

  .reply-editor {
    .editor-toolbar {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid #dcdfe6;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      background: #fafafa;
      gap: 8px;
    }

    .editor-content {
      border: 1px solid #dcdfe6;
      border-radius: 0 0 4px 4px;
      min-height: 200px;
    }

    .editor-wrapper {
      .rich-editor {
        min-height: 200px;
        padding: 12px;
        outline: none;
        line-height: 1.6;
        font-size: 14px;
        color: #333;

        &:empty:before {
          content: attr(placeholder);
          color: #c0c4cc;
          pointer-events: none;
        }

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

        :deep(ul), :deep(ol) {
          padding-left: 20px;
          margin: 8px 0;
        }

        :deep(li) {
          margin: 4px 0;
        }

        :deep(strong), :deep(b) {
          font-weight: bold;
        }

        :deep(em), :deep(i) {
          font-style: italic;
        }

        :deep(u) {
          text-decoration: underline;
        }
      }
    }

    .preview-wrapper {
      .preview-content {
        min-height: 200px;
        padding: 12px;
        line-height: 1.6;
        color: #333;

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

        :deep(ul), :deep(ol) {
          padding-left: 20px;
          margin: 8px 0;
        }

        :deep(li) {
          margin: 4px 0;
        }
      }
    }

    .editor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid #dcdfe6;
      border-top: none;
      border-radius: 0 0 4px 4px;
      background: #fafafa;
    }

    .char-count {
      font-size: 12px;
      color: #666;
    }

    .tips {
      font-size: 12px;
      color: #999;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .reply-dialog {
    .editor-toolbar {
      flex-wrap: wrap;
      gap: 4px;
    }

    .editor-footer {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
      text-align: center;
    }
  }
}
</style>