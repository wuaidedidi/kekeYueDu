<template>
  <div class="right-toolbar" :class="{ collapsed: !toolbarStore.isPanelVisible }">
    <!-- 折叠按钮 -->
    <button
      class="toolbar-toggle"
      @click="toolbarStore.togglePanel"
      :aria-expanded="toolbarStore.isPanelVisible"
      :aria-label="toolbarStore.isPanelVisible ? '折叠右侧面板' : '展开右侧面板'"
      tabindex="0"
      @keydown.enter="toolbarStore.togglePanel"
      @keydown.space.prevent="toolbarStore.togglePanel"
    >
      <el-icon>
        <ArrowRight v-if="!toolbarStore.isPanelVisible" />
        <ArrowLeft v-else />
      </el-icon>
    </button>

    <!-- 主内容区 -->
    <div v-if="toolbarStore.isPanelVisible" class="toolbar-content">
      <!-- 标签页导航 -->
      <div class="toolbar-tabs">
        <el-tabs
          v-model="toolbarStore.activeTab"
          type="border-card"
          tab-position="top"
          @tab-click="handleTabClick"
        >
          <el-tab-pane
            label="纠错"
            name="proofread"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><EditPen /></el-icon>
                <span>纠错</span>
                <el-badge
                  v-if="toolbarStore.hasErrors"
                  :value="errorCount"
                  type="danger"
                  class="tab-badge"
                />
              </div>
            </template>
            <ProofreadPanel />
          </el-tab-pane>

          <el-tab-pane
            label="拼写"
            name="spellcheck"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><View /></el-icon>
                <span>拼写</span>
                <el-badge
                  v-if="spellingErrorCount > 0"
                  :value="spellingErrorCount"
                  type="warning"
                  class="tab-badge"
                />
              </div>
            </template>
            <SpellCheckPanel />
          </el-tab-pane>

          <el-tab-pane
            label="大纲"
            name="outline"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><List /></el-icon>
                <span>大纲</span>
              </div>
            </template>
            <OutlinePanel />
          </el-tab-pane>

          <el-tab-pane
            label="角色"
            name="characters"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><User /></el-icon>
                <span>角色</span>
                <el-badge
                  v-if="toolbarStore.characters.length > 0"
                  :value="toolbarStore.characters.length"
                  type="primary"
                  class="tab-badge"
                />
              </div>
            </template>
            <CharactersPanel />
          </el-tab-pane>

          <el-tab-pane
            label="设定"
            name="settings"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><Setting /></el-icon>
                <span>设定</span>
                <el-badge
                  v-if="toolbarStore.settings.length > 0"
                  :value="toolbarStore.settings.length"
                  type="info"
                  class="tab-badge"
                />
              </div>
            </template>
            <SettingsPanel />
          </el-tab-pane>

          <el-tab-pane
            label="版本历史"
            name="versions"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><Clock /></el-icon>
                <span>版本历史</span>
                <el-badge
                  v-if="versionCount > 0"
                  :value="versionCount"
                  type="info"
                  class="tab-badge"
                />
              </div>
            </template>
            <VersionHistoryPanel
              :current-chapter-id="props.currentChapterId"
              :current-version-id="props.currentVersionId"
              @version-reverted="handleVersionReverted"
            />
          </el-tab-pane>

          <el-tab-pane
            label="预览"
            name="preview"
          >
            <template #label>
              <div class="tab-label">
                <el-icon><Document /></el-icon>
                <span>预览</span>
              </div>
            </template>
            <PreviewPanel />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 调整宽度手柄 -->
      <div
        class="resize-handle"
        role="separator"
        aria-label="调整面板宽度"
        tabindex="0"
        @mousedown="startResize"
        @keydown.enter="startKeyboardResize"
        @keydown.escape="stopResize"
        :aria-orientation="'vertical'"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElIcon, ElTabs, ElTabPane, ElBadge } from 'element-plus'
import { ArrowRight, ArrowLeft, EditPen, View, List, User, Setting, Document, Clock } from '@element-plus/icons-vue'
import { useToolbarStore } from '@/store/toolbarStore'
import { editorBridge } from '@/utils/editorBridge'

// 导入所有面板组件
import ProofreadPanel from './ProofreadPanel.vue'
import SpellCheckPanel from './SpellCheckPanel.vue'
import OutlinePanel from './OutlinePanel.vue'
import CharactersPanel from './CharactersPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import PreviewPanel from './PreviewPanel.vue'
import VersionHistoryPanel from '../VersionHistory/VersionHistoryPanel.vue'

const toolbarStore = useToolbarStore()

// Props
interface Props {
  currentChapterId?: number
  currentVersionId?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentChapterId: undefined,
  currentVersionId: undefined
})

// Emits
const emit = defineEmits<{
  versionReverted: [data: { chapterId: number; content: string }]
}>()

// 拖拽调整宽度相关
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// 计算属性
const errorCount = computed(() => {
  return toolbarStore.proofreadIssues.filter(
    issue => issue.status === 'pending' && issue.severity === 'error'
  ).length
})

const spellingErrorCount = computed(() => {
  return toolbarStore.proofreadIssues.filter(
    issue => issue.status === 'pending' && issue.type === 'spelling'
  ).length
})

// 版本历史相关
const versionCount = ref(0)

// 处理版本回退
const handleVersionReverted = (data: { chapterId: number; content: string }) => {
  // 向上传递版本回退事件
  emit('versionReverted', data)
  console.log('版本已回退:', data)
}

// 方法
const handleTabClick = (tab: any) => {
  toolbarStore.setActiveTab(tab.props.name)
}

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = toolbarStore.panelWidth

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return

  const deltaX = startX.value - e.clientX
  const newWidth = startWidth.value + deltaX
  toolbarStore.setPanelWidth(newWidth)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('keydown', handleKeyboardResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 键盘调整宽度
const startKeyboardResize = () => {
  isResizing.value = true
  startWidth.value = toolbarStore.panelWidth

  document.addEventListener('keydown', handleKeyboardResize)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

const handleKeyboardResize = (e: KeyboardEvent) => {
  if (!isResizing.value) return

  const step = 10 // 每次调整10px

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      toolbarStore.setPanelWidth(Math.max(300, startWidth.value - step))
      break
    case 'ArrowRight':
      e.preventDefault()
      toolbarStore.setPanelWidth(Math.min(800, startWidth.value + step))
      break
    case 'Escape':
      e.preventDefault()
      stopResize()
      break
  }
}

// 自动保存功能
let autoSaveTimer: NodeJS.Timeout | null = null

const startAutoSave = () => {
  if (toolbarStore.toolbarSettings.autoSave) {
    autoSaveTimer = setInterval(() => {
      if (editorBridge.isReady()) {
        const stats = editorBridge.getTextStats()
        toolbarStore.updateStats(stats)
      }
    }, toolbarStore.toolbarSettings.autoSaveInterval)
  }
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 监听设置变化
const watchSettings = () => {
  stopAutoSave()
  startAutoSave()
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + Shift + R 切换右侧面板
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
    e.preventDefault()
    toolbarStore.togglePanel()
  }

  // Ctrl/Cmd + Shift + 1-6 切换到对应标签页
  if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
    const keyMap: Record<string, string> = {
      '1': 'proofread',
      '2': 'spellcheck',
      '3': 'outline',
      '4': 'characters',
      '5': 'settings',
      '6': 'preview'
    }

    const tabName = keyMap[e.key]
    if (tabName) {
      e.preventDefault()
      toolbarStore.setActiveTab(tabName)
      if (!toolbarStore.isPanelVisible) {
        toolbarStore.togglePanel()
      }
    }
  }
}

onMounted(() => {
  // 初始化编辑器桥接
  editorBridge.init()

  // 启动自动保存
  startAutoSave()

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)

  // 添加全局样式
  const style = document.createElement('style')
  style.textContent = `
    .right-toolbar {
      --panel-width: ${toolbarStore.panelWidth}px;
    }
  `
  document.head.appendChild(style)
})

onUnmounted(() => {
  stopAutoSave()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.right-toolbar {
  position: relative;
  height: 100%;
  display: flex;
  background: white;
  border-left: 1px solid #e9ecef;
  transition: all 0.3s ease;
  width: var(--panel-width, 400px);
  max-width: 800px;
  min-width: 300px;

  &.collapsed {
    width: 40px;
    min-width: 40px;
  }
}

.toolbar-toggle {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 14px;

  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }

  &:focus-visible {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  .el-icon {
    font-size: 14px;
    color: #666;
  }
}

.toolbar-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-tabs__header) {
    margin: 0;
    flex-shrink: 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  position: relative;

  .el-icon {
    font-size: 14px;
  }

  span {
    font-size: 13px;
  }

  .tab-badge {
    :deep(.el-badge__content) {
      font-size: 10px;
      height: 16px;
      line-height: 16px;
      padding: 0 4px;
      min-width: 16px;
    }
  }
}

.resize-handle {
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 5;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(0, 123, 255, 0.1);
  }

  &:focus-visible {
    outline: 2px solid #007bff;
    outline-offset: -1px;
    background: rgba(0, 123, 255, 0.1);
  }

  &:active {
    background: rgba(0, 123, 255, 0.2);
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .right-toolbar {
    --panel-width: 380px;
  }

  .tab-label {
    .el-icon {
      font-size: 14px;
    }

    span {
      font-size: 12px;
    }
  }
}

@media (max-width: 1200px) {
  .right-toolbar {
    --panel-width: 350px;
  }

  .tab-label {
    padding: 0 6px;

    span {
      font-size: 11px;
    }
  }
}

@media (max-width: 1024px) {
  .right-toolbar {
    --panel-width: 320px;
  }

  .toolbar-tabs {
    :deep(.el-tabs__item) {
      height: 36px;
      font-size: 12px;
    }
  }

  .tab-label {
    .el-icon {
      font-size: 13px;
    }
  }
}

@media (max-width: 768px) {
  .right-toolbar {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    --panel-width: 100vw;
    max-width: 400px;

    &.collapsed {
      transform: translateX(calc(100% - 50px));
    }
  }

  .tab-label span {
    display: none;
  }

  .resize-handle {
    display: none;
  }

  .toolbar-toggle {
    width: 30px;
    height: 50px;
    left: -15px;
  }

  .toolbar-tabs {
    :deep(.el-tabs__item) {
      height: 32px;
      font-size: 11px;
      padding: 0 8px;
    }
  }

  .tab-label {
    .el-icon {
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .right-toolbar {
    --panel-width: 100vw;
    max-width: 350px;
  }

  .toolbar-toggle {
    width: 25px;
    height: 40px;
    left: -12px;
  }

  .toolbar-tabs {
    :deep(.el-tabs__item) {
      height: 30px;
      font-size: 10px;
      padding: 0 6px;
    }
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .toolbar-toggle {
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    left: -22px;
  }

  .tab-label .el-icon {
    font-size: 16px;
  }

  .toolbar-tabs {
    :deep(.el-tabs__item) {
      min-height: 44px;
      height: auto;
      padding: 8px 12px;
    }
  }
}

// Element Plus 标签页样式自定义
:deep(.el-tabs--border-card) {
  border: none;
  box-shadow: none;

  .el-tabs__header {
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    margin: 0;
  }

  .el-tabs__nav {
    border: none;
  }

  .el-tabs__item {
    border: none;
    padding: 0;
    margin: 0;
    height: 40px;
    line-height: 40px;
    color: #666;
    background: transparent;
    transition: all 0.2s ease;

    &:hover {
      color: #007bff;
      background: rgba(0, 123, 255, 0.05);
    }

    &.is-active {
      color: #007bff;
      background: white;
      border-bottom: 2px solid #007bff;
    }
  }
}
</style>