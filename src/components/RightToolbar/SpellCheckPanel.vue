<template>
  <div class="spellcheck-panel">
    <div class="panel-header">
      <div class="panel-title">
        <el-icon><EditPen /></el-icon>
        <span>拼写检查</span>
      </div>
      <div class="panel-controls">
        <el-button
          :icon="Refresh"
          size="small"
          circle
          @click="checkSpelling"
          :loading="isChecking"
        />
      </div>
    </div>

    <div class="spell-check-content">
      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalWords }}</div>
          <div class="stat-label">总词数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ spellingErrors.length }}</div>
          <div class="stat-label">拼写错误</div>
        </div>
      </div>

      <div class="errors-list" v-if="spellingErrors.length > 0">
        <div
          v-for="error in spellingErrors"
          :key="error.word"
          class="error-item"
          @click="highlightError(error)"
        >
          <div class="error-word">{{ error.word }}</div>
          <div class="error-suggestions">
            <el-button
              v-for="suggestion in error.suggestions"
              :key="suggestion"
              size="small"
              text
              @click.stop="fixWord(error.word, suggestion)"
            >
              {{ suggestion }}
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="no-errors">
        <el-icon><Check /></el-icon>
        <p>未发现拼写错误</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
import { EditPen, Refresh, Check } from '@element-plus/icons-vue'
import { editorBridge } from '@/utils/editorBridge'

const isChecking = ref(false)
const spellingErrors = ref<
  Array<{
    word: string
    line: number
    column: number
    suggestions: string[]
  }>
>([])

const totalWords = computed(() => {
  return editorBridge.getTextStats().wordCount
})

const checkSpelling = () => {
  if (!editorBridge.isReady()) return

  isChecking.value = true
  const text = editorBridge.getTextContent()

  // 简单的拼写检查实现
  const errors: typeof spellingErrors.value = []
  const words = text.match(/[a-zA-Z]+|[一-龯]+/g) || []

  words.forEach((word, index) => {
    // 这里可以集成更复杂的拼写检查逻辑
    // 目前使用简单的常见错误检查
    const commonMisspellings: Record<string, string[]> = {
      alot: ['allot'],
      seperate: ['separate'],
      recieve: ['receive'],
      beleive: ['believe'],
      occured: ['occurred'],
    }

    if (commonMisspellings[word.toLowerCase()]) {
      const line = text.substring(0, text.indexOf(word)).split('\n').length
      const column = text.lastIndexOf(word.substring(0, word.indexOf(word))) + 1

      errors.push({
        word,
        line,
        column,
        suggestions: commonMisspellings[word.toLowerCase()],
      })
    }
  })

  spellingErrors.value = errors
  isChecking.value = false
}

const highlightError = (error: (typeof spellingErrors.value)[0]) => {
  const position = editorBridge.getPositionFromLine(error.line)
  if (position) {
    editorBridge.scrollToPosition(position)
  }
}

const fixWord = (wrongWord: string, correctWord: string) => {
  if (!editorBridge.isReady()) return

  // 查找并替换错误的词
  const text = editorBridge.getTextContent()
  const position = editorBridge.findText(wrongWord)

  if (position) {
    editorBridge.setSelection({
      start: position,
      end: {
        line: position.line,
        column: position.column + wrongWord.length,
        offset: position.offset + wrongWord.length,
      },
    })
    editorBridge.replaceSelectedText(correctWord)

    // 更新错误列表
    spellingErrors.value = spellingErrors.value.filter(
      (e) => e.word !== wrongWord
    )
  }
}

onMounted(() => {
  checkSpelling()
})
</script>

<style lang="scss" scoped>
.spellcheck-panel {
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

.stats {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.stat-item {
  text-align: center;
  flex: 1;

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  .stat-label {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }
}

.spell-check-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.errors-list {
  .error-item {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #007bff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .error-word {
      font-weight: 600;
      color: #dc3545;
      margin-bottom: 8px;
    }

    .error-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
}

.no-errors {
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
    color: #28a745;
  }
}
</style>
