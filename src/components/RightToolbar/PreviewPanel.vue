<template>
  <div class="preview-panel">
    <div class="panel-header">
      <div class="panel-title">
        <el-icon><View /></el-icon>
        <span>预览</span>
      </div>
      <div class="panel-controls">
        <el-button
          :icon="FullScreen"
          size="small"
          circle
          @click="toggleFullscreen"
        />
        <el-button
          :icon="Setting"
          size="small"
          circle
          @click="showSettingsDialog = true"
        />
      </div>
    </div>

    <div class="preview-content" :class="{ fullscreen: isFullscreen }">
      <!-- 预览模式切换 -->
      <div class="preview-modes" v-if="!isFullscreen">
        <el-radio-group v-model="previewMode" size="small">
          <el-radio-button label="raw">原始</el-radio-button>
          <el-radio-button label="formatted">格式化</el-radio-button>
          <el-radio-button label="export">导出预览</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 导出格式选择 -->
      <div
        class="export-format"
        v-if="!isFullscreen && previewMode === 'export'"
      >
        <el-select
          v-model="exportFormat"
          size="small"
          placeholder="选择导出格式"
          style="width: 120px"
        >
          <el-option label="HTML" value="html" />
          <el-option label="TXT" value="txt" />
          <el-option label="Markdown" value="md" />
        </el-select>
      </div>

      <!-- 文档统计 -->
      <div class="document-stats" v-if="!isFullscreen">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">字符数</span>
            <span class="stat-value">{{ stats.characterCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">词数</span>
            <span class="stat-value">{{ stats.wordCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">段落</span>
            <span class="stat-value">{{ stats.paragraphCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">行数</span>
            <span class="stat-value">{{ stats.lineCount }}</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-header">
            <span>写作进度</span>
            <span class="progress-text">{{ completedProgress }}%</span>
          </div>
          <el-progress
            :percentage="completedProgress"
            :color="progressColor"
            :show-text="false"
          />
          <div class="progress-info">
            <span
              >{{ stats.wordCount }} /
              {{ toolbarStore.toolbarSettings.targetWords }} 字</span
            >
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview-area" ref="previewAreaRef">
        <!-- 原始预览 -->
        <div v-if="previewMode === 'raw'" class="raw-preview">
          <div class="preview-text">{{ textContent }}</div>
        </div>

        <!-- 格式化预览 -->
        <div v-else-if="previewMode === 'formatted'" class="formatted-preview">
          <div class="preview-document" v-html="formattedContent"></div>
        </div>

        <!-- 导出预览 -->
        <div v-else-if="previewMode === 'export'" class="export-preview">
          <div class="export-header">
            <h3>{{ documentTitle || '未命名文档' }}</h3>
            <p class="export-meta">
              创建时间：{{ formatDate(new Date()) }} | 字数：{{
                stats.wordCount
              }}
              | 预计阅读时间：{{ readingTime }}分钟 | 格式：{{
                exportFormat.toUpperCase()
              }}
            </p>
          </div>

          <!-- HTML格式预览 -->
          <div
            v-if="exportFormat === 'html'"
            class="export-content"
            v-html="exportContent"
          ></div>

          <!-- TXT格式预览 -->
          <div
            v-else-if="exportFormat === 'txt'"
            class="export-content export-text"
          >
            <pre>{{ exportContent }}</pre>
          </div>

          <!-- Markdown格式预览 -->
          <div
            v-else-if="exportFormat === 'md'"
            class="export-content export-markdown"
          >
            <pre>{{ exportContent }}</pre>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!textContent" class="empty-preview">
          <el-icon><Document /></el-icon>
          <p>暂无内容</p>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="preview-toolbar" v-if="!isFullscreen && textContent">
        <el-button :icon="Download" size="small" @click="exportDocument">
          导出
        </el-button>
        <el-button :icon="Printer" size="small" @click="printDocument">
          打印
        </el-button>
        <el-button :icon="CopyDocument" size="small" @click="copyContent">
          复制
        </el-button>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettingsDialog" title="预览设置" width="500px">
      <div class="settings-content">
        <el-form label-width="120px">
          <el-form-item label="默认预览模式">
            <el-select
              v-model="previewSettings.defaultMode"
              style="width: 100%"
            >
              <el-option label="原始" value="raw" />
              <el-option label="格式化" value="formatted" />
              <el-option label="导出预览" value="export" />
            </el-select>
          </el-form-item>

          <el-form-item label="字体大小">
            <el-slider
              v-model="previewSettings.fontSize"
              :min="12"
              :max="24"
              :step="1"
              show-input
              input-size="small"
            />
          </el-form-item>

          <el-form-item label="行高">
            <el-slider
              v-model="previewSettings.lineHeight"
              :min="1.2"
              :max="2.5"
              :step="0.1"
              show-input
              input-size="small"
            />
          </el-form-item>

          <el-form-item label="页面宽度">
            <el-select v-model="previewSettings.pageWidth" style="width: 100%">
              <el-option label="自适应" value="auto" />
              <el-option label="600px" value="600px" />
              <el-option label="700px" value="700px" />
              <el-option label="800px" value="800px" />
            </el-select>
          </el-form-item>

          <el-form-item label="显示字数统计">
            <el-switch
              v-model="previewSettings.showStats"
              @change="saveSettings"
            />
          </el-form-item>

          <el-form-item label="显示进度条">
            <el-switch
              v-model="previewSettings.showProgress"
              @change="saveSettings"
            />
          </el-form-item>

          <el-form-item label="语法高亮">
            <el-switch
              v-model="previewSettings.syntaxHighlight"
              @change="saveSettings"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettingsDialog = false">关闭</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ElIcon,
  ElButton,
  ElRadioGroup,
  ElRadioButton,
  ElProgress,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElSlider,
  ElSwitch,
} from 'element-plus'
import {
  View,
  FullScreen,
  Setting,
  Document,
  Download,
  Printer,
  CopyDocument,
} from '@element-plus/icons-vue'
import { useToolbarStore } from '@/store/toolbarStore'
import { editorBridge } from '@/utils/editorBridge'
import { sanitizeHtml, validateHtmlSafety } from '@/utils/sanitizer'

const toolbarStore = useToolbarStore()

// 状态
const previewMode = ref('formatted')
const isFullscreen = ref(false)
const showSettingsDialog = ref(false)
const documentTitle = ref('未命名文档')
const previewAreaRef = ref()
const exportFormat = ref('html')

// 内容
const textContent = ref('')
const htmlContent = ref('')

// 设置
const previewSettings = reactive({
  defaultMode: 'formatted',
  fontSize: 16,
  lineHeight: 1.6,
  pageWidth: 'auto',
  showStats: true,
  showProgress: true,
  syntaxHighlight: true,
})

// 计算属性
const stats = computed(() => {
  if (!editorBridge.isReady()) {
    return {
      characterCount: 0,
      wordCount: 0,
      paragraphCount: 0,
      lineCount: 0,
    }
  }
  return editorBridge.getTextStats()
})

const completedProgress = computed(() => {
  if (toolbarStore.toolbarSettings.targetWords <= 0) return 0
  return Math.min(
    100,
    Math.round(
      (stats.value.wordCount / toolbarStore.toolbarSettings.targetWords) * 100
    )
  )
})

const progressColor = computed(() => {
  const progress = completedProgress.value
  if (progress < 30) return '#f56c6c'
  if (progress < 70) return '#e6a23c'
  return '#67c23a'
})

// 安全配置
const previewConfig = {
  ALLOWED_TAGS: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'del',
    'ins',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'a',
    'img',
    'div',
    'span',
    'hr',
    'mark',
    'kbd',
    'samp',
    'var',
  ],
  ALLOWED_ATTR: [
    'href',
    'title',
    'alt',
    'src',
    'width',
    'height',
    'class',
    'id',
    'style',
    'target',
    'rel',
    'data-line-number',
    'data-word-count',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
}

const formattedContent = computed(() => {
  if (!htmlContent.value) return ''

  let content = htmlContent.value

  // 处理标题
  content = content.replace(
    /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi,
    (match, level, text) => {
      return `<h${level} class="preview-heading preview-heading-${level}">${text}</h${level}>`
    }
  )

  // 处理段落
  content = content.replace(
    /<p[^>]*>(.*?)<\/p>/gi,
    '<p class="preview-paragraph">$1</p>'
  )

  // 处理列表
  content = content.replace(
    /<ul[^>]*>(.*?)<\/ul>/gi,
    '<ul class="preview-list">$1</ul>'
  )
  content = content.replace(
    /<ol[^>]*>(.*?)<\/ol>/gi,
    '<ol class="preview-list-numbered">$1</ol>'
  )
  content = content.replace(
    /<li[^>]*>(.*?)<\/li>/gi,
    '<li class="preview-list-item">$1</li>'
  )

  // 处理代码块
  if (previewSettings.syntaxHighlight) {
    content = content.replace(
      /<pre[^>]*>(.*?)<\/pre>/gi,
      '<pre class="preview-code-block">$1</pre>'
    )
    content = content.replace(
      /<code[^>]*>(.*?)<\/code>/gi,
      '<code class="preview-inline-code">$1</code>'
    )
  }

  // 处理引用
  content = content.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
    '<blockquote class="preview-quote">$1</blockquote>'
  )

  // 处理链接
  content = content.replace(
    /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    '<a href="$1" class="preview-link" target="_blank">$2</a>'
  )

  // 处理图片
  content = content.replace(
    /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
    '<img src="$1" alt="$2" class="preview-image" />'
  )

  // 使用统一的sanitizeHtml方法
  return sanitizeHtml(content, 'preview')
})

const exportContent = computed(() => {
  if (!htmlContent.value) return ''

  let content = ''

  switch (exportFormat.value) {
    case 'txt':
      content = convertToTXT(htmlContent.value)
      // 添加文档信息
      content = `${documentTitle.value || '未命名文档'}
创建时间：${formatDate(new Date())}
字数统计：${stats.value.wordCount} 字
预计阅读时间：${readingTime.value} 分钟
${'='.repeat(50)}

${content}`
      break

    case 'md':
      content = convertToMarkdown(htmlContent.value)
      // 添加文档信息
      content = `# ${documentTitle.value || '未命名文档'}

**创建时间：** ${formatDate(new Date())}
**字数统计：** ${stats.value.wordCount} 字
**预计阅读时间：** ${readingTime.value} 分钟

---

${content}`
      break

    case 'html':
    default:
      // HTML格式的处理
      let htmlContent_formatted = formattedContent.value
      const docInfo = `
        <div class="document-info">
          <p><strong>文档标题：</strong>${documentTitle.value}</p>
          <p><strong>创建时间：</strong>${formatDate(new Date())}</p>
          <p><strong>字数统计：</strong>${stats.value.wordCount} 字</p>
          <p><strong>预计阅读时间：</strong>${readingTime.value} 分钟</p>
        </div>
        <hr class="document-divider" />
      `

      // 使用统一的sanitizeHtml方法处理导出内容
      content = sanitizeHtml(docInfo + htmlContent_formatted, 'export')
      break
  }

  return content
})

const readingTime = computed(() => {
  // 平均阅读速度：中英文混合约 250 字/分钟
  return Math.ceil(stats.value.wordCount / 250)
})

// 方法
const updateContent = () => {
  if (!editorBridge.isReady()) return

  textContent.value = editorBridge.getTextContent()
  htmlContent.value = editorBridge.getHTMLContent()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const exportDocument = () => {
  let content = ''
  let fileName = ''
  let mimeType = ''

  if (previewMode.value === 'raw') {
    // 原始模式只支持TXT格式
    content = textContent.value
    fileName = `${documentTitle.value || '文档'}_${formatDate(new Date())}.txt`
    mimeType = 'text/plain;charset=utf-8'
  } else {
    // 其他模式根据选择的格式导出
    content = exportContent.value

    switch (exportFormat.value) {
      case 'txt':
        fileName = `${documentTitle.value || '文档'}_${formatDate(new Date())}.txt`
        mimeType = 'text/plain;charset=utf-8'
        break
      case 'md':
        fileName = `${documentTitle.value || '文档'}_${formatDate(new Date())}.md`
        mimeType = 'text/markdown;charset=utf-8'
        break
      case 'html':
      default:
        fileName = `${documentTitle.value || '文档'}_${formatDate(new Date())}.html`
        mimeType = 'text/html;charset=utf-8'
        break
    }
  }

  // 创建下载链接
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  const formatName = exportFormat.value.toUpperCase() || 'TXT'
  ElMessage.success(`文档已导出为${formatName}格式`)
}

const printDocument = () => {
  const content = exportContent.value
  const printWindow = window.open('', '_blank')

  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle.value || '文档'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; }
            p { margin-bottom: 16px; }
            pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
            code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()

    ElMessage.success('打印窗口已打开')
  } else {
    ElMessage.error('无法打开打印窗口')
  }
}

const copyContent = async () => {
  const content =
    previewMode.value === 'raw' ? textContent.value : exportContent.value

  try {
    await navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ''))
    ElMessage.success('内容已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const saveSettings = () => {
  localStorage.setItem('preview-settings', JSON.stringify(previewSettings))
  previewMode.value = previewSettings.defaultMode
  ElMessage.success('设置已保存')
}

const loadSettings = () => {
  try {
    const stored = localStorage.getItem('preview-settings')
    if (stored) {
      Object.assign(previewSettings, JSON.parse(stored))
      previewMode.value = previewSettings.defaultMode
    }
  } catch (error) {
    console.warn('Failed to load preview settings:', error)
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式转换函数
const convertToTXT = (html: string): string => {
  if (!html) return ''

  let txt = html

  // 移除HTML标签并保留文本结构
  txt = txt.replace(
    /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi,
    (match, level, text) => {
      const prefix = '#'.repeat(parseInt(level))
      return `\n${prefix} ${text.trim()}\n`
    }
  )

  // 处理段落
  txt = txt.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

  // 处理列表
  txt = txt.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    return '\n' + items + '\n'
  })

  txt = txt.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
    let index = 1
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
      return `${index++}. $1\n`
    })
    return '\n' + items + '\n'
  })

  // 处理换行
  txt = txt.replace(/<br[^>]*>/gi, '\n')

  // 处理引用
  txt = txt.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
    (match, content) => {
      return '\n> ' + content.replace(/\n/g, '\n> ') + '\n'
    }
  )

  // 处理代码块
  txt = txt.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n')
  txt = txt.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

  // 处理链接
  txt = txt.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')

  // 处理图片
  txt = txt.replace(
    /<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi,
    '[图片: $1] ($2)'
  )

  // 移除剩余的HTML标签
  txt = txt.replace(/<[^>]*>/g, '')

  // 解码HTML实体
  txt = txt.replace(/&nbsp;/g, ' ')
  txt = txt.replace(/&lt;/g, '<')
  txt = txt.replace(/&gt;/g, '>')
  txt = txt.replace(/&amp;/g, '&')
  txt = txt.replace(/&quot;/g, '"')
  txt = txt.replace(/&#39;/g, "'")

  // 清理多余的空行
  txt = txt.replace(/\n{3,}/g, '\n\n')

  return txt.trim()
}

const convertToMarkdown = (html: string): string => {
  if (!html) return ''

  let md = html

  // 处理标题
  md = md.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (match, level, text) => {
    const prefix = '#'.repeat(parseInt(level))
    return `\n${prefix} ${text.trim()}\n`
  })

  // 处理段落
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

  // 处理列表
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    return '\n' + items + '\n'
  })

  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
    let index = 1
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
      return `${index++}. $1\n`
    })
    return '\n' + items + '\n'
  })

  // 处理强调
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

  // 处理删除线
  md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
  md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')

  // 处理代码
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n')
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

  // 处理引用
  md = md.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
    (match, content) => {
      return '\n> ' + content.replace(/\n/g, '\n> ') + '\n'
    }
  )

  // 处理链接
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

  // 处理图片
  md = md.replace(
    /<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi,
    '![$1]($2)'
  )

  // 处理换行
  md = md.replace(/<br[^>]*>/gi, '\n')

  // 处理水平线
  md = md.replace(/<hr[^>]*>/gi, '\n---\n')

  // 移除剩余的HTML标签
  md = md.replace(/<[^>]*>/g, '')

  // 解码HTML实体
  md = md.replace(/&nbsp;/g, ' ')
  md = md.replace(/&lt;/g, '<')
  md = md.replace(/&gt;/g, '>')
  md = md.replace(/&amp;/g, '&')
  md = md.replace(/&quot;/g, '"')
  md = md.replace(/&#39;/g, "'")

  // 清理多余的空行
  md = md.replace(/\n{3,}/g, '\n\n')

  return md.trim()
}

// 监听器
watch(
  () => toolbarStore.toolbarSettings.targetWords,
  () => {
    // 目标字数变化时可以添加相关逻辑
  }
)

// 监听编辑器内容变化
let contentUpdateTimer: NodeJS.Timeout | null = null

const startContentWatcher = () => {
  contentUpdateTimer = setInterval(() => {
    updateContent()
  }, 2000) // 每2秒更新一次内容
}

const stopContentWatcher = () => {
  if (contentUpdateTimer) {
    clearInterval(contentUpdateTimer)
    contentUpdateTimer = null
  }
}

onMounted(() => {
  loadSettings()
  updateContent()
  startContentWatcher()

  // 添加样式
  const style = document.createElement('style')
  style.textContent = `
    .preview-document {
      font-size: ${previewSettings.fontSize}px;
      line-height: ${previewSettings.lineHeight};
      max-width: ${previewSettings.pageWidth};
      margin: 0 auto;
      padding: 20px;
    }

    .preview-heading-1 { font-size: 2em; font-weight: 700; margin: 24px 0 16px; }
    .preview-heading-2 { font-size: 1.5em; font-weight: 600; margin: 20px 0 14px; }
    .preview-heading-3 { font-size: 1.25em; font-weight: 600; margin: 16px 0 12px; }
    .preview-heading-4 { font-size: 1.1em; font-weight: 600; margin: 14px 0 10px; }
    .preview-heading-5 { font-size: 1em; font-weight: 600; margin: 12px 0 8px; }
    .preview-heading-6 { font-size: 0.9em; font-weight: 600; margin: 10px 0 6px; }

    .preview-paragraph { margin: 16px 0; text-align: justify; }
    .preview-list { margin: 16px 0; padding-left: 20px; }
    .preview-list-numbered { margin: 16px 0; padding-left: 20px; }
    .preview-list-item { margin: 8px 0; }
    .preview-code-block { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; margin: 16px 0; }
    .preview-inline-code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
    .preview-quote { border-left: 4px solid #ddd; margin: 16px 0; padding: 0 16px; color: #666; font-style: italic; }
    .preview-link { color: #007bff; text-decoration: underline; }
    .preview-image { max-width: 100%; height: auto; border-radius: 4px; margin: 16px 0; }

    .document-info { background: #f8f9fa; padding: 16px; border-radius: 4px; margin-bottom: 20px; }
    .document-divider { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  `
  document.head.appendChild(style)
})

// 清理
const cleanup = () => {
  stopContentWatcher()
  document.body.style.overflow = ''
}
</script>

<style lang="scss" scoped>
.preview-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: white;
  }
}

.preview-modes {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
}

.export-format {
  padding: 8px 16px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 8px;

  .el-select {
    font-size: 13px;
  }
}

.document-stats {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.stat-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;

  .stat-label {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .stat-value {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.progress-section {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .progress-text {
    font-weight: 600;
    color: #333;
  }

  .progress-info {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }
}

.preview-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.raw-preview,
.formatted-preview,
.export-preview {
  min-height: 200px;
}

.preview-text {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  color: #333;
}

.export-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;

  h3 {
    margin: 0 0 8px 0;
    color: #333;
  }

  .export-meta {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
}

.export-content {
  &.export-text,
  &.export-markdown {
    pre {
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      margin: 0;
      color: #333;
    }
  }

  &.export-markdown {
    pre {
      background: #f6f8fa;
      border-color: #d0d7de;
    }
  }
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;

  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
}

.preview-toolbar {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.settings-content {
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 全屏样式
:deep(.fullscreen .preview-area) {
  padding: 32px;
}

:deep(.fullscreen .preview-document) {
  max-width: 900px;
  font-size: 18px;
}
</style>
