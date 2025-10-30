<template>
  <div class="proofread-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title">
        <el-icon><Document /></el-icon>
        <span>文本纠错</span>
      </div>
      <div class="panel-controls">
        <el-button
          :icon="Refresh"
          size="small"
          circle
          @click="refreshIssues"
          :loading="isScanning"
        />
        <el-button
          :icon="Setting"
          size="small"
          circle
          @click="showSettings = true"
        />
      </div>
    </div>

    <!-- 问题统计 -->
    <div class="issue-stats">
      <div class="stat-item error" v-if="errorCount > 0">
        <div class="stat-number">{{ errorCount }}</div>
        <div class="stat-label">错误</div>
      </div>
      <div class="stat-item warning" v-if="warningCount > 0">
        <div class="stat-number">{{ warningCount }}</div>
        <div class="stat-label">警告</div>
      </div>
      <div class="stat-item info" v-if="suggestionCount > 0">
        <div class="stat-number">{{ suggestionCount }}</div>
        <div class="stat-label">建议</div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <el-select
        v-model="selectedSeverity"
        placeholder="严重程度"
        size="small"
        style="width: 100%"
      >
        <el-option label="全部" value="" />
        <el-option label="错误" value="error" />
        <el-option label="警告" value="warning" />
        <el-option label="建议" value="info" />
      </el-select>
    </div>

    <!-- 问题列表 -->
    <div class="issues-list">
      <div v-if="filteredIssues.length === 0" class="empty-state">
        <el-icon><DocumentChecked /></el-icon>
        <p>暂无文本问题</p>
        <el-button @click="refreshIssues" size="small" type="primary">
          重新检查
        </el-button>
      </div>

      <div
        v-for="(issue, index) in filteredIssues"
        :key="issue.id"
        class="issue-item"
        :class="[
          `severity-${issue.severity}`,
          { active: activeIssueIndex === index }
        ]"
        @click="selectIssue(index)"
      >
        <div class="issue-header">
          <div class="issue-type">
            <el-icon>
              <CircleClose v-if="issue.severity === 'error'" />
              <Warning v-else-if="issue.severity === 'warning'" />
              <InfoFilled v-else />
            </el-icon>
            <span class="type-label">{{ getIssueTypeLabel(issue.type) }}</span>
          </div>
          <div class="issue-actions">
            <el-button
              v-if="issue.status === 'pending'"
              size="small"
              text
              @click.stop="fixIssue(issue, index)"
            >
              修复
            </el-button>
            <el-button
              v-if="issue.status === 'pending'"
              size="small"
              text
              @click.stop="ignoreIssue(issue, index)"
            >
              忽略
            </el-button>
            <el-button
              v-if="issue.status === 'fixed'"
              size="small"
              text
              @click.stop="undoFix(issue, index)"
            >
              撤销
            </el-button>
          </div>
        </div>

        <div class="issue-content">
          <div class="original-text">
            <span class="highlight" v-if="issue.text">{{ issue.text }}</span>
          </div>
          <div class="suggestion" v-if="issue.suggestion">
            <el-icon><ArrowRight /></el-icon>
            <span>{{ issue.suggestion }}</span>
          </div>
        </div>

        <div class="issue-meta">
          <span class="line-number">行 {{ issue.line }}</span>
          <span class="status-badge" :class="issue.status">
            {{ getStatusLabel(issue.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="纠错设置"
      width="500px"
    >
      <div class="proofread-settings">
        <div class="setting-item">
          <div class="setting-label">自动检查</div>
          <el-switch
            v-model="settings.autoCheck"
            @change="saveSettings"
          />
        </div>
        <div class="setting-item">
          <div class="setting-label">检查语法错误</div>
          <el-switch
            v-model="settings.checkGrammar"
            @change="saveSettings"
          />
        </div>
        <div class="setting-item">
          <div class="setting-label">检查拼写错误</div>
          <el-switch
            v-model="settings.checkSpelling"
            @change="saveSettings"
          />
        </div>
        <div class="setting-item">
          <div class="setting-label">检查标点符号</div>
          <el-switch
            v-model="settings.checkPunctuation"
            @change="saveSettings"
          />
        </div>
        <div class="setting-item">
          <div class="setting-label">检查格式问题</div>
          <el-switch
            v-model="settings.checkStyle"
            @change="saveSettings"
          />
        </div>
        <div class="setting-item">
          <div class="setting-label">最大问题数量</div>
          <el-input-number
            v-model="settings.maxIssues"
            :min="10"
            :max="1000"
            @change="saveSettings"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">
          保存设置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElButton, ElIcon, ElSelect, ElOption, ElDialog, ElInputNumber, ElSwitch } from 'element-plus'
import { Document, DocumentChecked, CircleClose, Warning, InfoFilled, ArrowRight, Setting, Refresh } from '@element-plus/icons-vue'
import { useToolbarStore } from '@/store/toolbarStore'
import { editorBridge, type ProofreadIssue } from '@/utils/editorBridge'

const toolbarStore = useToolbarStore()

// 响应式数据
const isScanning = ref(false)
const showSettings = ref(false)
const selectedSeverity = ref('')
const activeIssueIndex = ref(-1)

// 设置
const settings = ref({
  autoCheck: true,
  checkGrammar: true,
  checkSpelling: true,
  checkPunctuation: true,
  checkStyle: true,
  maxIssues: 100
})

// 计算属性
const filteredIssues = computed(() => {
  let issues = toolbarStore.proofreadIssues

  if (selectedSeverity.value) {
    issues = issues.filter(issue => issue.severity === selectedSeverity.value)
  }

  return issues
})

const errorCount = computed(() => {
  return toolbarStore.proofreadIssues.filter(issue =>
    issue.status === 'pending' && issue.severity === 'error'
  ).length
})

const warningCount = computed(() => {
  return toolbarStore.proofreadIssues.filter(issue =>
    issue.status === 'pending' && issue.severity === 'warning'
  ).length
})

const suggestionCount = computed(() => {
  return toolbarStore.proofreadIssues.filter(issue =>
    issue.status === 'pending' && issue.severity === 'info'
  ).length
})

// 方法
const getIssueTypeLabel = (type: string): string => {
  const labels = {
    grammar: '语法',
    spelling: '拼写',
    punctuation: '标点',
    style: '格式'
  }
  return labels[type as keyof typeof labels] || type
}

const getStatusLabel = (status: string): string => {
  const labels = {
    pending: '待处理',
    fixed: '已修复',
    ignored: '已忽略'
  }
  return labels[status as keyof typeof labels] || status
}

const selectIssue = (index: number) => {
  activeIssueIndex.value = index
  const issue = filteredIssues.value[index]

  if (issue) {
    // 滚动到问题位置
    const position = editorBridge.getPositionFromLine(issue.line)
    if (position) {
      editorBridge.scrollToPosition(position)
    }
  }
}

const fixIssue = async (issue: ProofreadIssue, index: number) => {
  if (!editorBridge.isReady()) return

  try {
    // 获取当前位置
    const currentPosition = editorBridge.getSelection()

    // 定位到问题位置
    const position = editorBridge.getPositionFromLine(issue.line)
    if (position) {
      editorBridge.setSelection({
        start: position,
        end: position
      })
    }

    // 替换文本
    editorBridge.replaceSelectedText(issue.suggestion)

    // 更新问题状态
    toolbarStore.updateProofreadIssue(issue.id, { status: 'fixed' })

    // 恢复原选区
    if (currentPosition) {
      editorBridge.setSelection(currentPosition)
    }

  } catch (error) {
    console.error('修复问题时出错:', error)
  }
}

const ignoreIssue = (issue: ProofreadIssue, index: number) => {
  toolbarStore.updateProofreadIssue(issue.id, { status: 'ignored' })

  // 如果当前选中的问题被忽略，清除选中
  if (activeIssueIndex.value === index) {
    activeIssueIndex.value = -1
  }
}

const undoFix = (issue: ProofreadIssue, index: number) => {
  if (!editorBridge.isReady()) return

  try {
    // 恢复原文
    editorBridge.replaceSelectedText(issue.text)

    // 更新问题状态
    toolbarStore.updateProofreadIssue(issue.id, { status: 'pending' })
  } catch (error) {
    console.error('撤销修复时出错:', error)
  }
}

const refreshIssues = async () => {
  if (!editorBridge.isReady()) {
    console.warn('编辑器未准备好')
    return
  }

  isScanning.value = true

  try {
    // 清除现有问题
    toolbarStore.clearProofreadIssues()

    // 获取文本内容
    const text = editorBridge.getTextContent()

    // 检查各种类型的问题
    const issues: ProofreadIssue[] = []

    if (settings.value.checkGrammar) {
      issues.push(...checkGrammar(text))
    }

    if (settings.value.checkSpelling) {
      issues.push(...checkSpelling(text))
    }

    if (settings.value.checkPunctuation) {
      issues.push(...checkPunctuation(text))
    }

    if (settings.value.checkStyle) {
      issues.push(...checkStyle(text))
    }

    // 限制问题数量
    const limitedIssues = issues.slice(0, settings.value.maxIssues)

    // 添加问题到store
    limitedIssues.forEach(issue => {
      toolbarStore.addProofreadIssue(issue)
    })

  } catch (error) {
    console.error('检查文本问题时出错:', error)
  } finally {
    isScanning.value = false
  }
}

const saveSettings = () => {
  localStorage.setItem('proofread-settings', JSON.stringify(settings.value))
}

const loadSettings = () => {
  try {
    const stored = localStorage.getItem('proofread-settings')
    if (stored) {
      const parsedSettings = JSON.parse(stored)
      settings.value = { ...settings.value, ...parsedSettings }
    }
  } catch (error) {
    console.warn('加载纠错设置失败:', error)
  }
}

const checkGrammar = (text: string): ProofreadIssue[] => {
  const issues: ProofreadIssue[] = []
  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    // 检查重复句号
    if (line.includes('。。')) {
      issues.push({
        id: `grammar_double_${lineIndex}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'grammar',
        text: '。。',
        suggestion: '。',
        line: lineIndex + 1,
        column: line.indexOf('。。') + 1,
        severity: 'error',
        status: 'pending'
      })
    }

    // 检查重复逗号
    if (line.includes('，，')) {
      issues.push({
        id: `grammar_comma_${lineIndex}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'grammar',
        text: '，，',
        suggestion: '，',
        line: lineIndex + 1,
        column: line.indexOf('，，') + 1,
        severity: 'error',
        status: 'pending'
      })
    }

    // 检查连续空格
    const doubleSpaceMatches = line.match(/  +/g)
    if (doubleSpaceMatches) {
      doubleSpaceMatches.forEach((match) => {
        const column = line.indexOf(match) + 1
        issues.push({
          id: `grammar_space_${lineIndex}_${column}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'grammar',
          text: match,
          suggestion: ' ',
          line: lineIndex + 1,
          column,
          severity: 'warning',
          status: 'pending'
        })
      })
    }
  })

  return issues
}

const checkSpelling = (text: string): ProofreadIssue[] => {
  const issues: Proofread[] = []
  const lines = text.split('\n')

  // 简单的常见拼写错误检查
  const commonErrors = [
    { wrong: '的的', correct: '的' },
    { wrong: '的的', correct: '的' },
    { wrong: '的的', correct: '的' },
    { wrong: '的的', correct: '的' }
  ]

  lines.forEach((line, lineIndex) => {
    commonErrors.forEach(error => {
      const index = line.indexOf(error.wrong)
      if (index !== -1) {
        issues.push({
          id: `spelling_${lineIndex}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'spelling',
          text: error.wrong,
          suggestion: error.correct,
          line: lineIndex + 1,
          column: index + 1,
          severity: 'warning',
          status: 'pending'
        })
      }
    })
  })

  return issues
}

const checkPunctuation = (text: string): ProofreadIssue[] => {
  const issues: ProofreadIssue[] = []
  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    // 检查缺少空格的标点
    const punctuationBefore = /[，。！？；：]/g
    const punctuationAfter = /[，。！？；：]/g

    // 简化的标点符号检查
    if (line.includes('，')) {
      const matches = line.match(/，[^，。，！？；：]/g)
      if (matches) {
        matches.forEach((match, index) => {
          const column = line.indexOf(match) + 2
          issues.push({
            id: `punctuation_space_${lineIndex}_${column}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'punctuation',
            text: match,
            suggestion: '， ',
            line: lineIndex + 1,
            column,
            severity: 'info',
            status: 'pending'
          })
        })
      }
    }
  })

  return issues
}

const checkStyle = (text: string): ProofreadIssue[] => {
  const issues: ProofreadIssue[] = []
  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    // 检查过长的句子
    if (line.length > 100) {
      issues.push({
        id: `style_long_sentence_${lineIndex}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'style',
        text: line.substring(0, 50) + '...',
        suggestion: '考虑将长句拆分为多个短句',
        line: lineIndex + 1,
        column: 1,
        severity: 'info',
        status: 'pending'
      })
    }

    // 检查段落开头空格
    if (line.startsWith('  ') || line.startsWith('\t')) {
      issues.push({
        id: `style_leading_space_${lineIndex}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'style',
        text: line.match(/^[\s\t]+/)![0],
        suggestion: '移除开头的空格',
        line: lineIndex + 1,
        column: 1,
        severity: 'warning',
        status: 'pending'
      })
    }
  })

  return issues
}

// 自动检查
const autoCheckTimer = ref<NodeJS.Timeout | null>(null)

const startAutoCheck = () => {
  if (autoCheckTimer.value) {
    clearInterval(autoCheckTimer.value)
  }

  if (settings.value.autoCheck) {
    autoCheckTimer.value = setInterval(() => {
      refreshIssues()
    }, 10000) // 每10秒检查一次
  }
}

const stopAutoCheck = () => {
  if (autoCheckTimer.value) {
    clearInterval(autoCheckTimer.value)
    autoCheckTimer.value = null
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  refreshIssues()
  startAutoCheck()
})

onUnmounted(() => {
  stopAutoCheck()
})

// 监听设置变化
watch(() => settings.value.autoCheck, (newValue) => {
  if (newValue) {
    startAutoCheck()
  } else {
    stopAutoCheck()
  }
})
</script>

<style lang="scss" scoped>
.proofread-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #333;
  }

  .panel-controls {
    display: flex;
    gap: 8px;
  }
}

.issue-stats {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;

  .stat-item {
    flex: 1;
    text-align: center;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &.error {
      background-color: #fef2f2;
      color: #dc3545;
    }

    &.warning {
      background-color: #fff4e5;
      color: #ff6b35;
    }

    &.info {
      background-color: #e8f4fd;
      color: #1890ff;
    }

    .stat-number {
      font-size: 20px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      margin-top: 2px;
      opacity: 0.8;
    }
  }
}

.filters {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.issues-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
    text-align: center;

    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 8px 0 16px 0;
    }
  }

  .issue-item {
    margin: 0 8px 8px 8px;
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #007bff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.active {
      border-color: #007bff;
      background-color: #f0f8ff;
    }

    &.severity-error {
      border-left: 4px solid #dc3545;
    }

    &.severity-warning {
      border-left: 4px solid #ff6b35;
    }

    &.severity-info {
      border-left: 4px solid #1890ff;
    }

    .issue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .issue-type {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;

        .type-label {
          text-transform: uppercase;
        }
      }

      .issue-actions {
        display: flex;
        gap: 4px;
      }
    }

    .issue-content {
      margin-bottom: 8px;

      .original-text {
        margin-bottom: 4px;
        color: #333;
        line-height: 1.4;

        .highlight {
          background-color: #fff3cd;
          color: #856404;
          padding: 1px 3px;
          border-radius: 3px;
        }
      }

      .suggestion {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #28a745;
        font-size: 14px;
        line-height: 1.4;
      }
    }

    .issue-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #999;

      .line-number {
        font-family: monospace;
      }

      .status-badge {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 500;

        &.pending {
          background-color: #fff3cd;
          color: #856404;
        }

        &.fixed {
          background-color: #d4edda;
          color: #155724;
        }

        &.ignored {
          background-color: #f8f9fa;
          color: #6c757d;
        }
      }
    }
  }
}

.proofread-settings {
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .setting-label {
      font-weight: 500;
      color: #333;
    }
  }
}
</style>