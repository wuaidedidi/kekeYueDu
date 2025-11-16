// src/store/toolbarStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WritingStats {
  characterCount: number
  wordCount: number
  targetWords: number
  progress: number
  lastSaved: Date | null
}

export interface ProofreadIssue {
  id: string
  type: 'grammar' | 'spelling' | 'punctuation' | 'style'
  text: string
  suggestion: string
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  status: 'pending' | 'fixed' | 'ignored'
}

export interface OutlineItem {
  id: string
  level: number
  text: string
  line: number
  children: OutlineItem[]
}

export interface Character {
  id: string
  name: string
  aliases: string[]
  description: string
  tags: string[]
  avatar?: string
  mentions: number
  firstAppearance?: number
}

export interface Setting {
  id: string
  category: 'world' | 'organization' | 'location' | 'item' | 'other'
  title: string
  content: string
  tags: string[]
  relations: string[]
  createdAt: Date
}

export interface ToolbarSettings {
  autoSave: boolean
  autoSaveInterval: number
  highlightErrors: boolean
  showWordCount: boolean
  showProgress: boolean
  targetWords: number
  proofreadEnabled: boolean
  spellCheckEnabled: boolean
  outlineAutoGenerate: boolean
  characterHighlightEnabled: boolean
  previewMode: 'split' | 'full' | 'hidden'
  fontSize: number
  fontFamily: string
  lineHeight: number
  contentWidth: number
  backgroundColor: string
}

export const useToolbarStore = defineStore('toolbar', () => {
  // 面板状态
  const activeTab = ref('proofread')
  const isPanelVisible = ref(true)
  const panelWidth = ref(400)

  // 写作统计
  const stats = ref<WritingStats>({
    characterCount: 0,
    wordCount: 0,
    targetWords: 5000,
    progress: 0,
    lastSaved: null,
  })

  // 纠错问题
  const proofreadIssues = ref<ProofreadIssue[]>([])
  const activeIssueIndex = ref(-1)

  // 大纲
  const outline = ref<OutlineItem[]>([])
  const activeOutlineItem = ref<string | null>(null)

  // 角色管理
  const characters = ref<Character[]>([])
  const selectedCharacter = ref<Character | null>(null)
  const characterSearchQuery = ref('')

  // 设定管理
  const settings = ref<Setting[]>([])
  const selectedSetting = ref<Setting | null>(null)
  const settingFilterCategory = ref<string>('all')

  // 工具栏设置
  const toolbarSettings = ref<ToolbarSettings>({
    autoSave: true,
    autoSaveInterval: 5000,
    highlightErrors: true,
    showWordCount: true,
    showProgress: true,
    targetWords: 5000,
    proofreadEnabled: true,
    spellCheckEnabled: true,
    outlineAutoGenerate: true,
    characterHighlightEnabled: true,
    previewMode: 'split',
    fontSize: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    lineHeight: 1.6,
    contentWidth: 100,
    backgroundColor: '#ffffff',
  })

  // 计算属性
  const hasErrors = computed(() =>
    proofreadIssues.value.some(
      (issue) => issue.status === 'pending' && issue.severity === 'error'
    )
  )

  const hasWarnings = computed(() =>
    proofreadIssues.value.some(
      (issue) => issue.status === 'pending' && issue.severity === 'warning'
    )
  )

  const filteredCharacters = computed(() => {
    if (!characterSearchQuery.value) return characters.value

    const query = characterSearchQuery.value.toLowerCase()
    return characters.value.filter(
      (char) =>
        char.name.toLowerCase().includes(query) ||
        char.aliases.some((alias) => alias.toLowerCase().includes(query)) ||
        char.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  const filteredSettings = computed(() => {
    if (settingFilterCategory.value === 'all') return settings.value
    return settings.value.filter(
      (setting) => setting.category === settingFilterCategory.value
    )
  })

  const completedProgress = computed(() =>
    Math.min(
      100,
      Math.round((stats.value.wordCount / stats.value.targetWords) * 100)
    )
  )

  // Actions
  const setActiveTab = (tab: string) => {
    activeTab.value = tab
    saveToLocalStorage()
  }

  const togglePanel = () => {
    isPanelVisible.value = !isPanelVisible.value
    saveToLocalStorage()
  }

  const setPanelWidth = (width: number) => {
    panelWidth.value = Math.max(300, Math.min(800, width))
    saveToLocalStorage()
  }

  const updateStats = (newStats: Partial<WritingStats>) => {
    stats.value = { ...stats.value, ...newStats }

    // 计算进度
    if (stats.value.targetWords > 0) {
      stats.value.progress = Math.round(
        (stats.value.wordCount / stats.value.targetWords) * 100
      )
    }

    saveToLocalStorage()
  }

  const addProofreadIssue = (issue: ProofreadIssue) => {
    proofreadIssues.value.push(issue)
    saveToLocalStorage()
  }

  const updateProofreadIssue = (
    id: string,
    updates: Partial<ProofreadIssue>
  ) => {
    const index = proofreadIssues.value.findIndex((issue) => issue.id === id)
    if (index !== -1) {
      proofreadIssues.value[index] = {
        ...proofreadIssues.value[index],
        ...updates,
      }
      saveToLocalStorage()
    }
  }

  const removeProofreadIssue = (id: string) => {
    proofreadIssues.value = proofreadIssues.value.filter(
      (issue) => issue.id !== id
    )
    saveToLocalStorage()
  }

  const clearProofreadIssues = () => {
    proofreadIssues.value = []
    saveToLocalStorage()
  }

  const setActiveIssue = (index: number) => {
    activeIssueIndex.value = index
  }

  const updateOutline = (newOutline: OutlineItem[]) => {
    outline.value = newOutline
    saveToLocalStorage()
  }

  const setActiveOutlineItem = (id: string | null) => {
    activeOutlineItem.value = id
    saveToLocalStorage()
  }

  const addCharacter = (character: Omit<Character, 'id'>) => {
    const newCharacter: Character = {
      ...character,
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mentions: 0,
    }
    characters.value.push(newCharacter)
    saveToLocalStorage()
    return newCharacter
  }

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    const index = characters.value.findIndex((char) => char.id === id)
    if (index !== -1) {
      characters.value[index] = { ...characters.value[index], ...updates }
      saveToLocalStorage()
    }
  }

  const removeCharacter = (id: string) => {
    characters.value = characters.value.filter((char) => char.id !== id)
    saveToLocalStorage()
  }

  const incrementCharacterMentions = (id: string) => {
    const character = characters.value.find((char) => char.id === id)
    if (character) {
      character.mentions++
      saveToLocalStorage()
    }
  }

  const addSetting = (setting: Omit<Setting, 'id' | 'createdAt'>) => {
    const newSetting: Setting = {
      ...setting,
      id: `setting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    settings.value.push(newSetting)
    saveToLocalStorage()
    return newSetting
  }

  const updateSetting = (id: string, updates: Partial<Setting>) => {
    const index = settings.value.findIndex((setting) => setting.id === id)
    if (index !== -1) {
      settings.value[index] = { ...settings.value[index], ...updates }
      saveToLocalStorage()
    }
  }

  const removeSetting = (id: string) => {
    settings.value = settings.value.filter((setting) => setting.id !== id)
    saveToLocalStorage()
  }

  const updateToolbarSettings = (newSettings: Partial<ToolbarSettings>) => {
    toolbarSettings.value = { ...toolbarSettings.value, ...newSettings }
    saveToLocalStorage()
  }

  // 本地存储
  const saveToLocalStorage = () => {
    const data = {
      activeTab: activeTab.value,
      isPanelVisible: isPanelVisible.value,
      panelWidth: panelWidth.value,
      stats: stats.value,
      toolbarSettings: toolbarSettings.value,
      characters: characters.value,
      settings: settings.value,
    }
    localStorage.setItem('toolbar-store', JSON.stringify(data))
  }

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('toolbar-store')
      if (stored) {
        const data = JSON.parse(stored)
        activeTab.value = data.activeTab || 'proofread'
        isPanelVisible.value = data.isPanelVisible !== false
        panelWidth.value = data.panelWidth || 400
        stats.value = { ...stats.value, ...data.stats }
        toolbarSettings.value = {
          ...toolbarSettings.value,
          ...data.toolbarSettings,
        }

        if (data.characters) {
          characters.value = data.characters.map((char: any) => ({
            ...char,
            createdAt: new Date(char.createdAt),
          }))
        }

        if (data.settings) {
          settings.value = data.settings.map((setting: any) => ({
            ...setting,
            createdAt: new Date(setting.createdAt),
          }))
        }
      }
    } catch (error) {
      console.warn('Failed to load toolbar store from localStorage:', error)
    }
  }

  // 初始化
  loadFromLocalStorage()

  return {
    // 状态
    activeTab,
    isPanelVisible,
    panelWidth,
    stats,
    proofreadIssues,
    activeIssueIndex,
    outline,
    activeOutlineItem,
    characters,
    selectedCharacter,
    characterSearchQuery,
    settings,
    selectedSetting,
    settingFilterCategory,
    toolbarSettings,

    // 计算属性
    hasErrors,
    hasWarnings,
    filteredCharacters,
    filteredSettings,
    completedProgress,

    // Actions
    setActiveTab,
    togglePanel,
    setPanelWidth,
    updateStats,
    addProofreadIssue,
    updateProofreadIssue,
    removeProofreadIssue,
    clearProofreadIssues,
    setActiveIssue,
    updateOutline,
    setActiveOutlineItem,
    addCharacter,
    updateCharacter,
    removeCharacter,
    incrementCharacterMentions,
    addSetting,
    updateSetting,
    removeSetting,
    updateToolbarSettings,

    // 工具方法
    saveToLocalStorage,
    loadFromLocalStorage,
  }
})

// 类型导出
export type ToolbarStore = ReturnType<typeof useToolbarStore>
