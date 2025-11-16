<template>
  <div class="settings-panel">
    <div class="panel-header">
      <div class="panel-title">
        <el-icon><Setting /></el-icon>
        <span>设定管理</span>
      </div>
      <div class="panel-controls">
        <el-button
          :icon="Plus"
          size="small"
          circle
          @click="showAddDialog = true"
        />
        <el-button
          :icon="Filter"
          size="small"
          circle
          @click="showFilterDialog = true"
        />
      </div>
    </div>

    <div class="settings-content">
      <!-- 分类筛选标签 -->
      <div class="category-filters">
        <el-radio-group
          v-model="toolbarStore.settingFilterCategory"
          size="small"
        >
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="world">世界观</el-radio-button>
          <el-radio-button label="organization">组织</el-radio-button>
          <el-radio-button label="location">地点</el-radio-button>
          <el-radio-button label="item">物品</el-radio-button>
          <el-radio-button label="other">其他</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索设定标题或内容..."
          :prefix-icon="Search"
          clearable
        />
      </div>

      <!-- 设定列表 -->
      <div class="settings-list">
        <div
          v-for="setting in filteredSettings"
          :key="setting.id"
          class="setting-item"
          :class="{ active: selectedSetting?.id === setting.id }"
          @click="selectSetting(setting)"
        >
          <div class="setting-category">
            <el-tag :type="getCategoryType(setting.category)" size="small">
              {{ getCategoryLabel(setting.category) }}
            </el-tag>
          </div>

          <div class="setting-info">
            <div class="setting-title">{{ setting.title }}</div>

            <div class="setting-content">
              {{ setting.content }}
            </div>

            <div class="setting-meta">
              <div class="setting-date">
                {{ formatDate(setting.createdAt) }}
              </div>

              <div class="setting-tags" v-if="setting.tags.length > 0">
                <el-tag
                  v-for="tag in setting.tags.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  class="setting-tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="setting.tags.length > 3" class="more-tags">
                  +{{ setting.tags.length - 3 }}
                </span>
              </div>
            </div>
          </div>

          <div class="setting-actions">
            <el-button
              :icon="Edit"
              size="small"
              circle
              @click.stop="editSetting(setting)"
            />
            <el-button
              :icon="Delete"
              size="small"
              circle
              type="danger"
              @click.stop="deleteSetting(setting)"
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredSettings.length === 0" class="empty-state">
        <el-icon><Document /></el-icon>
        <p v-if="searchQuery || toolbarStore.settingFilterCategory !== 'all'">
          未找到匹配的设定
        </p>
        <p v-else>暂无设定信息</p>
        <el-button
          v-if="!searchQuery && toolbarStore.settingFilterCategory === 'all'"
          type="primary"
          @click="showAddDialog = true"
        >
          添加设定
        </el-button>
      </div>
    </div>

    <!-- 添加/编辑设定对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingSetting ? '编辑设定' : '添加设定'"
      width="700px"
      @close="resetForm"
    >
      <el-form
        ref="settingFormRef"
        :model="settingForm"
        :rules="settingRules"
        label-width="80px"
      >
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="settingForm.category"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option label="世界观" value="world" />
            <el-option label="组织" value="organization" />
            <el-option label="地点" value="location" />
            <el-option label="物品" value="item" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="settingForm.title" placeholder="请输入设定标题" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="settingForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入设定内容"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-tag
            v-for="tag in settingForm.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-input-tag"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            @keyup.enter="addTag"
            @blur="addTag"
            style="width: 120px; margin-left: 8px"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput"
            style="margin-left: 8px"
          >
            + 添加标签
          </el-button>
        </el-form-item>

        <el-form-item label="关联设定">
          <div class="relations-list">
            <el-tag
              v-for="relationId in settingForm.relations"
              :key="relationId"
              closable
              @close="removeRelation(relationId)"
              class="relation-tag"
            >
              {{ getRelationTitle(relationId) }}
            </el-tag>
          </div>
          <el-select
            v-model="selectedRelationId"
            placeholder="选择关联的设定"
            size="small"
            style="width: 200px; margin-top: 8px"
            @change="addRelation"
          >
            <el-option
              v-for="setting in availableRelations"
              :key="setting.id"
              :label="setting.title"
              :value="setting.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSetting">
            {{ editingSetting ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 高级筛选对话框 -->
    <el-dialog v-model="showFilterDialog" title="高级筛选" width="500px">
      <div class="filter-content">
        <el-form label-width="100px">
          <el-form-item label="分类筛选">
            <el-checkbox-group v-model="filterCategories">
              <el-checkbox label="world">世界观</el-checkbox>
              <el-checkbox label="organization">组织</el-checkbox>
              <el-checkbox label="location">地点</el-checkbox>
              <el-checkbox label="item">物品</el-checkbox>
              <el-checkbox label="other">其他</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="包含标签">
            <el-input
              v-model="filterTags"
              placeholder="输入标签，多个标签用逗号分隔"
            />
          </el-form-item>

          <el-form-item label="排序方式">
            <el-select v-model="sortBy" style="width: 100%">
              <el-option label="创建时间（新到旧）" value="created_desc" />
              <el-option label="创建时间（旧到新）" value="created_asc" />
              <el-option label="标题（A-Z）" value="title_asc" />
              <el-option label="标题（Z-A）" value="title_desc" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="primary" @click="applyFilter">应用筛选</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ElIcon,
  ElButton,
  ElInput,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadioButton,
  ElCheckboxGroup,
  ElCheckbox,
  ElDatePicker,
} from 'element-plus'
import {
  Setting,
  Plus,
  Filter,
  Search,
  Edit,
  Delete,
  Document,
} from '@element-plus/icons-vue'
import { useToolbarStore } from '@/store/toolbarStore'
import type { Setting as SettingType } from '@/store/toolbarStore'

const toolbarStore = useToolbarStore()

// 对话框状态
const showAddDialog = ref(false)
const showFilterDialog = ref(false)
const editingSetting = ref<SettingType | null>(null)
const selectedSetting = ref<SettingType | null>(null)

// 搜索和筛选
const searchQuery = ref('')

// 表单状态
const settingFormRef = ref()
const settingForm = reactive({
  category: 'world' as SettingType['category'],
  title: '',
  content: '',
  tags: [] as string[],
  relations: [] as string[],
})

const settingRules = {
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 关联设定
const selectedRelationId = ref('')

// 高级筛选
const filterCategories = ref<string[]>([])
const filterDateRange = ref<[Date, Date] | null>(null)
const filterTags = ref('')
const sortBy = ref('created_desc')

// 计算属性
const filteredSettings = computed(() => {
  let settings = toolbarStore.filteredSettings

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    settings = settings.filter(
      (setting) =>
        setting.title.toLowerCase().includes(query) ||
        setting.content.toLowerCase().includes(query) ||
        setting.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  }

  // 高级筛选
  if (filterCategories.value.length > 0) {
    settings = settings.filter((setting) =>
      filterCategories.value.includes(setting.category)
    )
  }

  if (filterDateRange.value) {
    const [start, end] = filterDateRange.value
    settings = settings.filter((setting) => {
      const settingDate = new Date(setting.createdAt)
      return settingDate >= start && settingDate <= end
    })
  }

  if (filterTags.value) {
    const tags = filterTags.value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
    settings = settings.filter((setting) =>
      tags.every((tag) =>
        setting.tags.some((settingTag) =>
          settingTag.toLowerCase().includes(tag)
        )
      )
    )
  }

  // 排序
  settings = [...settings].sort((a, b) => {
    switch (sortBy.value) {
      case 'created_desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'created_asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'title_asc':
        return a.title.localeCompare(b.title)
      case 'title_desc':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  return settings
})

const availableRelations = computed(() => {
  return toolbarStore.settings.filter(
    (setting) =>
      setting.id !== editingSetting.value?.id &&
      !settingForm.relations.includes(setting.id)
  )
})

// 方法
const selectSetting = (setting: SettingType) => {
  selectedSetting.value = setting
  toolbarStore.selectedSetting = setting
}

const editSetting = (setting: SettingType) => {
  editingSetting.value = setting
  settingForm.category = setting.category
  settingForm.title = setting.title
  settingForm.content = setting.content
  settingForm.tags = [...setting.tags]
  settingForm.relations = [...setting.relations]
  showAddDialog.value = true
}

const deleteSetting = async (setting: SettingType) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设定 "${setting.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    toolbarStore.removeSetting(setting.id)
    if (selectedSetting.value?.id === setting.id) {
      selectedSetting.value = null
      toolbarStore.selectedSetting = null
    }

    ElMessage.success('设定已删除')
  } catch {
    // 用户取消删除
  }
}

const saveSetting = async () => {
  try {
    await settingFormRef.value.validate()

    if (editingSetting.value) {
      toolbarStore.updateSetting(editingSetting.value.id, settingForm)
      ElMessage.success('设定信息已更新')
    } else {
      toolbarStore.addSetting(settingForm)
      ElMessage.success('设定已添加')
    }

    showAddDialog.value = false
    resetForm()
  } catch {
    // 表单验证失败
  }
}

const resetForm = () => {
  editingSetting.value = null
  settingForm.category = 'world'
  settingForm.title = ''
  settingForm.content = ''
  settingForm.tags = []
  settingForm.relations = []

  if (settingFormRef.value) {
    settingFormRef.value.clearValidate()
  }
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !settingForm.tags.includes(tag)) {
    settingForm.tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = settingForm.tags.indexOf(tag)
  if (index > -1) {
    settingForm.tags.splice(index, 1)
  }
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addRelation = () => {
  if (
    selectedRelationId.value &&
    !settingForm.relations.includes(selectedRelationId.value)
  ) {
    settingForm.relations.push(selectedRelationId.value)
  }
  selectedRelationId.value = ''
}

const removeRelation = (relationId: string) => {
  const index = settingForm.relations.indexOf(relationId)
  if (index > -1) {
    settingForm.relations.splice(index, 1)
  }
}

const getRelationTitle = (relationId: string) => {
  const setting = toolbarStore.settings.find((s) => s.id === relationId)
  return setting?.title || relationId
}

const applyFilter = () => {
  // 将分类筛选转换为toolbarStore的格式
  if (filterCategories.value.length === 0) {
    toolbarStore.settingFilterCategory = 'all'
  } else if (filterCategories.value.length === 1) {
    toolbarStore.settingFilterCategory = filterCategories.value[0]
  }
  showFilterDialog.value = false
}

const resetFilter = () => {
  filterCategories.value = []
  filterDateRange.value = null
  filterTags.value = ''
  sortBy.value = 'created_desc'
  toolbarStore.settingFilterCategory = 'all'
}

const getCategoryLabel = (category: SettingType['category']) => {
  const labels = {
    world: '世界观',
    organization: '组织',
    location: '地点',
    item: '物品',
    other: '其他',
  }
  return labels[category] || category
}

const getCategoryType = (category: SettingType['category']) => {
  const types = {
    world: 'primary',
    organization: 'success',
    location: 'warning',
    item: 'info',
    other: '',
  }
  return types[category] || ''
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<style lang="scss" scoped>
.settings-panel {
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
  padding: clamp(8px, 1.2vh, 12px) clamp(12px, 1.5vw, 16px);
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  min-height: clamp(44px, 6vh, 56px);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1vw, 8px);
  font-weight: 600;
  font-size: clamp(0.9rem, 1.1vw, 1rem);
}

.panel-controls {
  display: flex;
  gap: clamp(6px, 1vw, 8px);

  .el-button {
    min-width: clamp(28px, 3.5vw, 36px);
    min-height: clamp(28px, 3.5vh, 36px);
    padding: 0;
    aspect-ratio: 1;
  }
}

.category-filters {
  padding: clamp(12px, 1.5vh, 16px);
  border-bottom: 1px solid #e9ecef;

  .el-radio-group {
    flex-wrap: wrap;
    gap: clamp(4px, 0.5vw, 6px);
  }

  .el-radio-button {
    min-height: clamp(32px, 4vh, 40px);
    font-size: clamp(0.8rem, 1vw, 0.9rem);
    padding: 0 clamp(8px, 1vw, 12px);
  }
}

.search-bar {
  padding: clamp(12px, 1.5vh, 16px);
  border-bottom: 1px solid #e9ecef;

  .el-input {
    .el-input__wrapper {
      min-height: clamp(36px, 4.5vh, 44px);
    }

    .el-input__inner {
      font-size: clamp(0.85rem, 1.1vw, 1rem);
      min-height: auto;
    }
  }
}

.settings-content {
  flex: 1;
  overflow-y: auto;
}

.settings-list {
  padding: 16px;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #007bff;
    background: #f8f9ff;
  }
}

.setting-category {
  flex-shrink: 0;
  width: 80px;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
}

.setting-content {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.setting-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.setting-date {
  font-size: 12px;
  color: #999;
}

.setting-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;

  .setting-tag {
    font-size: 11px;
  }

  .more-tags {
    font-size: 11px;
    color: #999;
  }
}

.setting-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.empty-state {
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

  p {
    margin-bottom: 16px;
  }
}

.tag-input-tag,
.relation-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.relations-list {
  margin-bottom: 8px;
}

.filter-content {
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
