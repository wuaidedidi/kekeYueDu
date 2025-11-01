<template>
  <div class="version-history-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-left">
        <h3>版本历史</h3>
        <span v-if="versions.length > 0" class="version-count">
          共 {{ totalVersions }} 个版本
        </span>
      </div>
      <div class="header-right">
        <el-button
          size="small"
          :icon="Plus"
          @click="createManualVersion"
          :disabled="!currentChapterId"
        >
          创建版本
        </el-button>
        <el-button
          size="small"
          :icon="Refresh"
          @click="refreshVersions"
          :loading="loading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-select
            v-model="filters.source"
            placeholder="版本来源"
            clearable
            size="small"
            @change="handleFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="自动保存" value="auto" />
            <el-option label="手动创建" value="manual" />
            <el-option label="回退操作" value="revert" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select
            v-model="filters.type"
            placeholder="版本类型"
            clearable
            size="small"
            @change="handleFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="快照版本" value="snapshot" />
            <el-option label="增量版本" value="increment" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-checkbox
            v-model="filters.pinnedOnly"
            @change="handleFilterChange"
            size="small"
          >
            仅显示置顶版本
          </el-checkbox>
        </el-col>
      </el-row>
    </div>

    <!-- 版本列表 -->
    <div class="versions-container" v-loading="loading">
      <div v-if="versions.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无版本历史" :image-size="100">
          <el-button type="primary" @click="createManualVersion" :disabled="!currentChapterId">
            创建第一个版本
          </el-button>
        </el-empty>
      </div>

      <div v-else class="versions-list">
        <div
          v-for="version in versions"
          :key="version.id"
          class="version-item"
          :class="{
            'is-current': version.id === currentVersionId,
            'is-pinned': version.isPinned,
            'is-snapshot': version.isSnapshot
          }"
        >
          <!-- 版本头部信息 -->
          <div class="version-header">
            <div class="version-info">
              <div class="version-meta">
                <span class="version-number">v{{ version.versionSeq }}</span>
                <el-tag
                  v-if="version.isPinned"
                  type="warning"
                  size="small"
                  :icon="Star"
                >
                  置顶
                </el-tag>
                <el-tag
                  v-if="version.isSnapshot"
                  type="success"
                  size="small"
                  :icon="Camera"
                >
                  快照
                </el-tag>
                <el-tag
                  :type="getSourceTagType(version.source)"
                  size="small"
                >
                  {{ getSourceLabel(version.source) }}
                </el-tag>
              </div>
              <div class="version-time">
                {{ formatTime(version.createdAt) }}
              </div>
            </div>

            <div class="version-stats">
              <span class="word-count">{{ version.wordCount }} 字</span>
            </div>
          </div>

          <!-- 版本标签 -->
          <div v-if="version.label" class="version-label">
            {{ version.label }}
          </div>

          <!-- 操作按钮 -->
          <div class="version-actions">
            <el-button-group size="small">
              <el-button
                :icon="View"
                @click="viewVersion(version)"
                title="查看版本"
              />
              <el-button
                :icon="DocumentCopy"
                @click="compareWithCurrent(version)"
                title="与当前版本对比"
                :disabled="version.id === currentVersionId"
              />
              <el-button
                :icon="RefreshLeft"
                @click="revertToVersion(version)"
                title="回退到此版本"
                :disabled="version.id === currentVersionId"
              />
              <el-dropdown @command="(cmd) => handleVersionAction(cmd, version)">
                <el-button :icon="More" title="更多操作" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      command="pin"
                      :icon="version.isPinned ? StarFilled : Star"
                    >
                      {{ version.isPinned ? '取消置顶' : '置顶版本' }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="download"
                      :icon="Download"
                    >
                      下载版本
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      :icon="Delete"
                      :disabled="version.isPinned || version.id === currentVersionId"
                    >
                      删除版本
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalVersions"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 版本对比对话框 -->
    <el-dialog
      v-model="diffDialog.visible"
      :title="diffDialog.title"
      width="80%"
      :destroy-on-close="true"
    >
      <div v-loading="diffDialog.loading" class="diff-container">
        <div v-if="diffDialog.stats" class="diff-stats">
          <el-row :gutter="24">
            <el-col :span="8">
              <el-statistic title="新增字数" :value="diffDialog.stats.insertions">
                <template #suffix>字</template>
              </el-statistic>
            </el-col>
            <el-col :span="8">
              <el-statistic title="删除字数" :value="diffDialog.stats.deletions">
                <template #suffix>字</template>
              </el-statistic>
            </el-col>
            <el-col :span="8">
              <el-statistic title="净变化" :value="diffDialog.stats.insertions - diffDialog.stats.deletions">
                <template #suffix>字</template>
              </el-statistic>
            </el-col>
          </el-row>
        </div>

        <div v-if="diffDialog.diffs" class="diff-content">
          <div
            v-for="(diff, index) in diffDialog.diffs"
            :key="index"
            class="diff-line"
            :class="`diff-${diff.type}`"
          >
            <pre>{{ diff.value }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="diffDialog.visible = false">关闭</el-button>
        <el-button
          v-if="diffDialog.baseVersion"
          type="primary"
          @click="revertToVersion(diffDialog.baseVersion)"
        >
          回退到此版本
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本查看对话框 -->
    <el-dialog
      v-model="viewDialog.visible"
      :title="viewDialog.title"
      width="70%"
      :destroy-on-close="true"
    >
      <div v-loading="viewDialog.loading" class="view-container">
        <div v-if="viewDialog.content" class="version-content">
          <div v-html="viewDialog.content" class="content-display"></div>
        </div>
      </div>

      <template #footer>
        <el-button @click="viewDialog.visible = false">关闭</el-button>
        <el-button
          v-if="viewDialog.version"
          type="primary"
          @click="compareWithCurrent(viewDialog.version)"
        >
          与当前版本对比
        </el-button>
        <el-button
          v-if="viewDialog.version"
          type="success"
          @click="revertToVersion(viewDialog.version)"
        >
          回退到此版本
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import '@/assets/styles/version-history.css'
import {
  Plus, Refresh, Star, Camera, View, DocumentCopy, RefreshLeft,
  More, Download, Delete, StarFilled
} from '@element-plus/icons-vue'
import http from '@/utils/http'
import type { ChapterVersion, VersionStats, DiffItem } from './types'

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

// 响应式数据
const loading = ref(false)
const versions = ref<ChapterVersion[]>([])
const totalVersions = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const filters = reactive({
  source: '',
  type: '',
  pinnedOnly: false
})

const diffDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  stats: null as VersionStats | null,
  diffs: null as DiffItem[] | null,
  baseVersion: null as ChapterVersion | null
})

const viewDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  content: '',
  version: null as ChapterVersion | null
})

// 计算属性
const totalPages = computed(() => Math.ceil(totalVersions.value / pageSize.value))

// 方法
const loadVersions = async () => {
  if (!props.currentChapterId) return

  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }

    if (filters.source) params.source = filters.source
    if (filters.pinnedOnly) {
      // 需要后端支持pinnedOnly参数，这里先过滤客户端
    }

    const response = await http.get(`/chapters/${props.currentChapterId}/versions`, { params })

    if (response.data.success) {
      let allVersions = response.data.data.versions
      totalVersions.value = response.data.data.pagination.total

      // 客户端过滤
      if (filters.pinnedOnly) {
        allVersions = allVersions.filter(v => v.isPinned)
      }
      if (filters.type === 'snapshot') {
        allVersions = allVersions.filter(v => v.isSnapshot)
      } else if (filters.type === 'increment') {
        allVersions = allVersions.filter(v => !v.isSnapshot)
      }

      versions.value = allVersions
    }
  } catch (error) {
    console.error('加载版本列表失败:', error)
    ElMessage.error('加载版本列表失败')
  } finally {
    loading.value = false
  }
}

const createManualVersion = async () => {
  if (!props.currentChapterId) {
    ElMessage.warning('请先选择一个章节')
    return
  }

  try {
    const { value: label } = await ElMessageBox.prompt('请输入版本标签', '创建版本', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '可选，为这个版本添加备注'
    })

    // 获取当前章节内容
    const chapterResponse = await http.get(`/chapters/${props.currentChapterId}`)

    if (chapterResponse.data.success) {
      const content = chapterResponse.data.data.content

      const response = await http.post(`/chapters/${props.currentChapterId}/versions`, {
        content_html: content,
        source: 'manual',
        label: label || undefined,
        is_snapshot: true
      })

      if (response.data.success) {
        ElMessage.success('版本创建成功')
        await loadVersions()
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建版本失败:', error)
      ElMessage.error('创建版本失败')
    }
  }
}

const compareWithCurrent = async (version: ChapterVersion) => {
  if (!props.currentChapterId) return

  diffDialog.visible = true
  diffDialog.title = `版本对比: v${version.versionSeq} 与 当前版本`
  diffDialog.loading = true
  diffDialog.baseVersion = version

  try {
    const response = await http.get(`/chapters/${props.currentChapterId}/diff`, {
      params: {
        baseVersionId: version.id,
        format: 'json'
      }
    })

    if (response.data.success) {
      diffDialog.stats = response.data.data.stats
      diffDialog.diffs = response.data.data.diffs
    }
  } catch (error) {
    console.error('获取版本差异失败:', error)
    ElMessage.error('获取版本差异失败')
  } finally {
    diffDialog.loading = false
  }
}

const viewVersion = async (version: ChapterVersion) => {
  viewDialog.visible = true
  viewDialog.title = `查看版本 v${version.versionSeq}`
  viewDialog.loading = true
  viewDialog.version = version

  try {
    // 这里需要后端提供获取版本详细内容的接口
    // 暂时使用版本列表中的信息
    viewDialog.content = `
      <div class="version-info">
        <p><strong>版本号:</strong> v${version.versionSeq}</p>
        <p><strong>创建时间:</strong> ${formatTime(version.createdAt)}</p>
        <p><strong>字数:</strong> ${version.wordCount}</p>
        <p><strong>来源:</strong> ${getSourceLabel(version.source)}</p>
        ${version.label ? `<p><strong>标签:</strong> ${version.label}</p>` : ''}
      </div>
      <div class="content-preview">
        <p>内容预览功能待实现...</p>
      </div>
    `
  } catch (error) {
    console.error('获取版本内容失败:', error)
    ElMessage.error('获取版本内容失败')
  } finally {
    viewDialog.loading = false
  }
}

const revertToVersion = async (version: ChapterVersion) => {
  if (!props.currentChapterId) return

  try {
    await ElMessageBox.confirm(
      `确定要回退到版本 v${version.versionSeq} 吗？这将创建一个新的版本记录。`,
      '确认回退',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await http.post(`/chapters/${props.currentChapterId}/revert`, {
      toVersionId: version.id,
      label: `回退到版本 v${version.versionSeq}`
    })

    if (response.data.success) {
      ElMessage.success('已成功回退到指定版本')
      emit('versionReverted', {
        chapterId: props.currentChapterId,
        content: response.data.data.content
      })
      await loadVersions()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('回退版本失败:', error)
      ElMessage.error('回退版本失败')
    }
  }
}

const handleVersionAction = async (command: string, version: ChapterVersion) => {
  switch (command) {
    case 'pin':
      await togglePinVersion(version)
      break
    case 'download':
      await downloadVersion(version)
      break
    case 'delete':
      await deleteVersion(version)
      break
  }
}

const togglePinVersion = async (version: ChapterVersion) => {
  if (!props.currentChapterId) return

  try {
    const response = await http.post(`/chapters/${props.currentChapterId}/versions/${version.id}/pin`, {
      pinned: !version.isPinned
    })

    if (response.data.success) {
      ElMessage.success(version.isPinned ? '已取消置顶' : '已置顶版本')
      await loadVersions()
    }
  } catch (error) {
    console.error('更新置顶状态失败:', error)
    ElMessage.error('更新置顶状态失败')
  }
}

const downloadVersion = async (version: ChapterVersion) => {
  // 下载功能待实现
  ElMessage.info('下载功能待实现')
}

const deleteVersion = async (version: ChapterVersion) => {
  if (!props.currentChapterId) return

  try {
    await ElMessageBox.confirm(
      `确定要删除版本 v${version.versionSeq} 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await http.delete(`/chapters/${props.currentChapterId}/versions/${version.id}`)

    if (response.data.success) {
      ElMessage.success('版本已删除')
      await loadVersions()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除版本失败:', error)
      ElMessage.error('删除版本失败')
    }
  }
}

const refreshVersions = () => {
  loadVersions()
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadVersions()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadVersions()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadVersions()
}

// 工具方法
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSourceLabel = (source: string) => {
  const labels: Record<string, string> = {
    auto: '自动保存',
    manual: '手动创建',
    revert: '回退操作'
  }
  return labels[source] || source
}

const getSourceTagType = (source: string) => {
  const types: Record<string, string> = {
    auto: 'info',
    manual: 'success',
    revert: 'warning'
  }
  return types[source] || 'info'
}

// 生命周期
onMounted(() => {
  if (props.currentChapterId) {
    loadVersions()
  }
})

watch(() => props.currentChapterId, (newId) => {
  if (newId) {
    currentPage.value = 1
    loadVersions()
  }
})
</script>

<style lang="scss" scoped>
.version-history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .version-count {
      font-size: 12px;
      color: #909399;
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 12px;
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
  }
}

.filter-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
}

.versions-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.versions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.version-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &.is-current {
    background: #e6f7ff;
    border-left: 4px solid #1890ff;
  }

  &.is-pinned {
    background: #fffbf0;
    border-left: 4px solid #faad14;
  }

  &.is-snapshot {
    background: #f6ffed;
    border-left: 4px solid #52c41a;
  }
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-info {
  flex: 1;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  .version-number {
    font-weight: 600;
    color: #303133;
  }
}

.version-time {
  font-size: 12px;
  color: #909399;
}

.version-stats {
  .word-count {
    font-size: 12px;
    color: #606266;
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.version-label {
  margin: 8px 0;
  padding: 4px 8px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  font-size: 12px;
  color: #1e40af;
}

.version-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.pagination-container {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
}

// 对话框样式
.diff-container {
  max-height: 70vh;
  overflow-y: auto;
}

.diff-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.diff-content {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
}

.diff-line {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &.diff-equal {
    background: #ffffff;
  }

  &.diff-insert {
    background: #e6ffed;
    border-left: 3px solid #52c41a;
  }

  &.diff-delete {
    background: #fff2f0;
    border-left: 3px solid #ff4d4f;
  }
}

.view-container {
  max-height: 70vh;
  overflow-y: auto;
}

.version-content {
  .version-info {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    p {
      margin: 8px 0;
    }
  }

  .content-display {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 16px;
    min-height: 200px;
    background: #ffffff;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .header-right {
      justify-content: center;
    }
  }

  .filter-section .el-row {
    flex-direction: column;
    gap: 8px;
  }

  .version-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .version-actions {
    justify-content: center;
  }
}
</style>