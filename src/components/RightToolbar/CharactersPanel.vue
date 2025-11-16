<template>
  <div class="characters-panel">
    <div class="panel-header">
      <div class="panel-title">
        <el-icon><User /></el-icon>
        <span>角色管理</span>
      </div>
      <div class="panel-controls">
        <el-button
          :icon="Plus"
          size="small"
          circle
          @click="showAddDialog = true"
        />
        <el-button
          :icon="Setting"
          size="small"
          circle
          @click="showSettingsDialog = true"
        />
      </div>
    </div>

    <div class="characters-content">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="toolbarStore.characterSearchQuery"
          placeholder="搜索角色名称、别名或标签..."
          :prefix-icon="Search"
          clearable
        />
      </div>

      <!-- 角色列表 -->
      <div class="characters-list">
        <div
          v-for="character in toolbarStore.filteredCharacters"
          :key="character.id"
          class="character-item"
          :class="{ active: selectedCharacter?.id === character.id }"
          @click="selectCharacter(character)"
        >
          <div class="character-avatar">
            <el-avatar :size="48" :src="character.avatar" :alt="character.name">
              {{ character.name.charAt(0) }}
            </el-avatar>
          </div>

          <div class="character-info">
            <div class="character-name">
              {{ character.name }}
              <el-tag
                v-if="character.mentions > 0"
                size="small"
                type="primary"
                class="mention-count"
              >
                {{ character.mentions }}
              </el-tag>
            </div>

            <div class="character-aliases" v-if="character.aliases.length > 0">
              <span class="alias-label">别名：</span>
              <el-tag
                v-for="alias in character.aliases.slice(0, 3)"
                :key="alias"
                size="small"
                class="alias-tag"
              >
                {{ alias }}
              </el-tag>
              <span v-if="character.aliases.length > 3" class="more-aliases">
                +{{ character.aliases.length - 3 }}
              </span>
            </div>

            <div class="character-description">
              {{ character.description }}
            </div>

            <div class="character-tags" v-if="character.tags.length > 0">
              <el-tag
                v-for="tag in character.tags"
                :key="tag"
                size="small"
                type="info"
                class="character-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <div class="character-actions">
            <el-button
              :icon="Edit"
              size="small"
              circle
              @click.stop="editCharacter(character)"
            />
            <el-button
              :icon="Delete"
              size="small"
              circle
              type="danger"
              @click.stop="deleteCharacter(character)"
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="toolbarStore.filteredCharacters.length === 0"
        class="empty-state"
      >
        <el-icon><User /></el-icon>
        <p v-if="toolbarStore.characterSearchQuery">未找到匹配的角色</p>
        <p v-else>暂无角色信息</p>
        <el-button
          v-if="!toolbarStore.characterSearchQuery"
          type="primary"
          @click="showAddDialog = true"
        >
          添加角色
        </el-button>
      </div>
    </div>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingCharacter ? '编辑角色' : '添加角色'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="characterFormRef"
        :model="characterForm"
        :rules="characterRules"
        label-width="80px"
      >
        <el-form-item label="角色名" prop="name">
          <el-input v-model="characterForm.name" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="别名">
          <el-tag
            v-for="alias in characterForm.aliases"
            :key="alias"
            closable
            @close="removeAlias(alias)"
            class="alias-input-tag"
          >
            {{ alias }}
          </el-tag>
          <el-input
            v-if="aliasInputVisible"
            ref="aliasInputRef"
            v-model="aliasInputValue"
            size="small"
            @keyup.enter="addAlias"
            @blur="addAlias"
            style="width: 120px; margin-left: 8px"
          />
          <el-button
            v-else
            size="small"
            @click="showAliasInput"
            style="margin-left: 8px"
          >
            + 添加别名
          </el-button>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="characterForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入角色描述"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-tag
            v-for="tag in characterForm.tags"
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

        <el-form-item label="头像">
          <el-input
            v-model="characterForm.avatar"
            placeholder="请输入头像URL"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCharacter">
            {{ editingCharacter ? '更新' : '添加' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettingsDialog" title="角色管理设置" width="500px">
      <div class="settings-content">
        <el-form label-width="120px">
          <el-form-item label="自动检测角色">
            <el-switch
              v-model="characterSettings.autoDetect"
              @change="saveSettings"
            />
          </el-form-item>

          <el-form-item label="高亮角色名称">
            <el-switch
              v-model="characterSettings.highlightNames"
              @change="saveSettings"
            />
          </el-form-item>

          <el-form-item label="显示提及次数">
            <el-switch
              v-model="characterSettings.showMentions"
              @change="saveSettings"
            />
          </el-form-item>

          <el-form-item label="高亮颜色">
            <el-color-picker
              v-model="characterSettings.highlightColor"
              @change="saveSettings"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettingsDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ElIcon,
  ElButton,
  ElInput,
  ElTag,
  ElAvatar,
  ElDialog,
  ElForm,
  ElFormItem,
  ElSwitch,
  ElColorPicker,
} from 'element-plus'
import {
  User,
  Plus,
  Setting,
  Search,
  Edit,
  Delete,
} from '@element-plus/icons-vue'
import { useToolbarStore } from '@/store/toolbarStore'
import type { Character } from '@/store/toolbarStore'
import { editorBridge } from '@/utils/editorBridge'

const toolbarStore = useToolbarStore()

// 对话框状态
const showAddDialog = ref(false)
const showSettingsDialog = ref(false)
const editingCharacter = ref<Character | null>(null)
const selectedCharacter = ref<Character | null>(null)

// 表单状态
const characterFormRef = ref()
const characterForm = reactive({
  name: '',
  aliases: [] as string[],
  description: '',
  tags: [] as string[],
  avatar: '',
})

const characterRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

// 别名输入
const aliasInputVisible = ref(false)
const aliasInputValue = ref('')
const aliasInputRef = ref()

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

// 设置
const characterSettings = reactive({
  autoDetect: true,
  highlightNames: true,
  showMentions: true,
  highlightColor: '#409eff',
})

// 选择角色
const selectCharacter = (character: Character) => {
  selectedCharacter.value = character
  toolbarStore.selectedCharacter = character

  // 滚动到角色在文档中的位置
  if (character.firstAppearance) {
    editorBridge.scrollToLine(character.firstAppearance)
  }
}

// 编辑角色
const editCharacter = (character: Character) => {
  editingCharacter.value = character
  characterForm.name = character.name
  characterForm.aliases = [...character.aliases]
  characterForm.description = character.description
  characterForm.tags = [...character.tags]
  characterForm.avatar = character.avatar || ''
  showAddDialog.value = true
}

// 删除角色
const deleteCharacter = async (character: Character) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${character.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    toolbarStore.removeCharacter(character.id)
    if (selectedCharacter.value?.id === character.id) {
      selectedCharacter.value = null
      toolbarStore.selectedCharacter = null
    }

    ElMessage.success('角色已删除')
  } catch {
    // 用户取消删除
  }
}

// 保存角色
const saveCharacter = async () => {
  try {
    await characterFormRef.value.validate()

    if (editingCharacter.value) {
      toolbarStore.updateCharacter(editingCharacter.value.id, characterForm)
      ElMessage.success('角色信息已更新')
    } else {
      const newCharacter = toolbarStore.addCharacter(characterForm)
      ElMessage.success('角色已添加')
      selectedCharacter.value = newCharacter
    }

    showAddDialog.value = false
    resetForm()
  } catch {
    // 表单验证失败
  }
}

// 重置表单
const resetForm = () => {
  editingCharacter.value = null
  characterForm.name = ''
  characterForm.aliases = []
  characterForm.description = ''
  characterForm.tags = []
  characterForm.avatar = ''

  if (characterFormRef.value) {
    characterFormRef.value.clearValidate()
  }
}

// 添加别名
const addAlias = () => {
  const alias = aliasInputValue.value.trim()
  if (alias && !characterForm.aliases.includes(alias)) {
    characterForm.aliases.push(alias)
  }
  aliasInputVisible.value = false
  aliasInputValue.value = ''
}

// 移除别名
const removeAlias = (alias: string) => {
  const index = characterForm.aliases.indexOf(alias)
  if (index > -1) {
    characterForm.aliases.splice(index, 1)
  }
}

// 显示别名输入框
const showAliasInput = () => {
  aliasInputVisible.value = true
  nextTick(() => {
    aliasInputRef.value?.focus()
  })
}

// 添加标签
const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !characterForm.tags.includes(tag)) {
    characterForm.tags.push(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

// 移除标签
const removeTag = (tag: string) => {
  const index = characterForm.tags.indexOf(tag)
  if (index > -1) {
    characterForm.tags.splice(index, 1)
  }
}

// 显示标签输入框
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

// 保存设置
const saveSettings = () => {
  localStorage.setItem('character-settings', JSON.stringify(characterSettings))

  // 更新编辑器中的角色高亮
  if (characterSettings.highlightNames) {
    highlightCharacterNames()
  } else {
    clearCharacterHighlights()
  }
}

// 高亮角色名称
const highlightCharacterNames = () => {
  if (!editorBridge.isReady() || !characterSettings.highlightNames) return

  toolbarStore.characters.forEach((character) => {
    const positions = editorBridge.findAllText(character.name, true)
    positions.forEach((position) => {
      const range = {
        start: position,
        end: {
          line: position.line,
          column: position.column + character.name.length,
          offset: position.offset + character.name.length,
        },
      }
      editorBridge.highlightRange(range, 'character-highlight')
    })

    // 也高亮别名
    character.aliases.forEach((alias) => {
      const aliasPositions = editorBridge.findAllText(alias, true)
      aliasPositions.forEach((position) => {
        const range = {
          start: position,
          end: {
            line: position.line,
            column: position.column + alias.length,
            offset: position.offset + alias.length,
          },
        }
        editorBridge.highlightRange(range, 'character-highlight')
      })
    })
  })
}

// 清除角色高亮
const clearCharacterHighlights = () => {
  editorBridge.clearHighlights('character-highlight')
}

// 加载设置
const loadSettings = () => {
  try {
    const stored = localStorage.getItem('character-settings')
    if (stored) {
      Object.assign(characterSettings, JSON.parse(stored))
    }
  } catch (error) {
    console.warn('Failed to load character settings:', error)
  }
}

onMounted(() => {
  loadSettings()

  // 添加高亮样式
  const style = document.createElement('style')
  style.textContent = `
    .character-highlight {
      background-color: ${characterSettings.highlightColor}33;
      border-bottom: 2px solid ${characterSettings.highlightColor};
      padding: 0 2px;
      border-radius: 2px;
    }
  `
  document.head.appendChild(style)
})
</script>

<style lang="scss" scoped>
.characters-panel {
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
  font-size: clamp(0.9rem, 1.2vw, 1.1rem);
}

.search-bar {
  padding: clamp(12px, 1.5vh, 16px);
  border-bottom: 1px solid #e9ecef;
}

.characters-content {
  flex: 1;
  overflow-y: auto;
}

.characters-list {
  padding: clamp(12px, 1.5vh, 16px);
}

.character-item {
  display: flex;
  align-items: flex-start;
  gap: clamp(8px, 1.5vw, 12px);
  padding: clamp(12px, 1.5vh, 16px);
  margin-bottom: clamp(8px, 1.2vh, 12px);
  border: 1px solid #e9ecef;
  border-radius: clamp(6px, 1vw, 8px);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: clamp(80px, 12vh, 100px);

  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &.active {
    border-color: #007bff;
    background: #f8f9ff;
    box-shadow: 0 2px 12px rgba(0, 123, 255, 0.15);
  }
}

.character-avatar {
  flex-shrink: 0;
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-name {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1vw, 8px);
  font-weight: 600;
  font-size: clamp(0.9rem, 1.3vw, 1rem);
  margin-bottom: clamp(3px, 0.5vh, 6px);
  line-height: 1.3;

  .mention-count {
    font-size: clamp(0.65rem, 1vw, 0.75rem);
    padding: clamp(2px, 0.3vh, 4px) clamp(5px, 0.8vw, 6px);
    border-radius: clamp(8px, 1.2vw, 10px);
    min-height: clamp(16px, 2.5vh, 20px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.character-aliases {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  flex-wrap: wrap;

  .alias-label {
    font-size: 12px;
    color: #666;
  }

  .alias-tag {
    font-size: 11px;
  }

  .more-aliases {
    font-size: 11px;
    color: #999;
  }
}

.character-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.character-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;

  .character-tag {
    font-size: 11px;
  }
}

.character-actions {
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.8vh, 6px);
  flex-shrink: 0;

  .el-button {
    min-width: clamp(32px, 4vw, 36px);
    min-height: clamp(32px, 4vw, 36px);
    width: clamp(32px, 4vw, 36px);
    height: clamp(32px, 4vw, 36px);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
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

.alias-input-tag,
.tag-input-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.settings-content {
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: clamp(6px, 1vw, 8px);

  .el-button {
    min-width: clamp(64px, 8vw, 80px);
    min-height: clamp(36px, 5vh, 44px);
    padding: clamp(8px, 1.2vh, 12px) clamp(16px, 2vw, 20px);
    font-size: clamp(0.8rem, 1.1vw, 0.9rem);
  }
}

// 移动端优化
@media (max-width: 768px) {
  .characters-panel {
    .character-item {
      padding: clamp(10px, 2vh, 12px);
      margin-bottom: clamp(6px, 1.5vh, 8px);
      flex-direction: column;
      align-items: stretch;
      gap: clamp(8px, 1.5vh, 10px);
    }

    .character-info {
      text-align: center;
    }

    .character-actions {
      flex-direction: row;
      justify-content: center;
      gap: clamp(8px, 2vw, 10px);
    }

    .panel-controls {
      .el-button {
        min-width: clamp(40px, 5vw, 44px);
        min-height: clamp(40px, 5vw, 44px);
      }
    }
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .character-item {
    &:hover {
      transform: none;
    }

    &:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
  }

  .character-actions .el-button {
    &:hover {
      transform: none;
    }

    &:active {
      transform: scale(0.9);
    }
  }
}
</style>
