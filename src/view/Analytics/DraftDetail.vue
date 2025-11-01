<template>
  <div class="content" :class="{ 'content-loaded': appLoaded }">
    <div class="loading-overlay" v-if="!appLoaded">
      <div class="loader-container">
        <div class="book">
          <div class="book__page"></div>
          <div class="book__page"></div>
          <div class="book__page"></div>
        </div>
      </div>
      <div class="loading-text">正在加载您的创作空间...</div>
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div class="header">
      <div @click="toggleFullScreen">
        <el-tooltip content="进入全屏CTRL">
          <el-image src="./icon/quanping.png" />
        </el-tooltip>
        全屏
      </div>

      <el-popover placement="bottom-start" :width="400" trigger="click">
        <template #reference>
          <div>
            <el-tooltip content="字体排版">
              <el-image src="./icon/ziti.png" />
            </el-tooltip>
            字体
          </div>
        </template>

        <div>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="正文" name="text">
              <el-form>
                <el-form-item label="字体类型">
                  <el-select
                    v-model="formSettings.fontType"
                    :teleported="false"
                  >
                    <el-option label="默认" value="default"></el-option>
                    <el-option label="黑体" value="hei"></el-option>
                    <el-option label="宋体" value="song"></el-option>
                    <el-option label="楷体" value="kai"></el-option>
                    <!-- 新增的字体类型 -->
                    <el-option label="仿宋" value="fangsong"></el-option>
                    <el-option label="汉仪旗黑" value="hanyi"></el-option>
                    <!-- 新增 -->
                    <el-option
                      label="思源宋体"
                      value="sourceHanSerif"
                    ></el-option>
                    <!-- 新增 -->
                    <!-- 新增的字体类型 -->
                  </el-select>
                </el-form-item>

                <el-form-item label="字体颜色">
                  <div class="color-bold-controls">
                    <span class="font-control" @click="toggleBold">B</span>
                    <el-color-picker
                      :teleported="false"
                      v-model="formSettings.fontColor"
                      style="margin-left: 10px"
                    />
                  </div>
                </el-form-item>

                <el-form-item label="字体大小">
                  <el-slider
                    v-model="formSettings.fontSize"
                    :min="10"
                    :max="30"
                  ></el-slider>
                </el-form-item>
                <el-form-item label="字体间距">
                  <el-slider
                    v-model="formSettings.lineHeight"
                    :min="0"
                    :max="2"
                    step="0.1"
                  ></el-slider>
                </el-form-item>
                <el-form-item label="正文宽度">
                  <el-slider
                    v-model="formSettings.contentWidth"
                    :min="50"
                    :max="100"
                  ></el-slider>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="formSettings.paragraphSpacing"
                    >段落间距</el-checkbox
                  >
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="右侧面板" name="sidebar">
              <el-form>
                <el-form-item label="大纲字体大小">
                  <el-slider
                    v-model="formSettings.outlineFontSize"
                    :min="10"
                    :max="30"
                  ></el-slider>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-popover>

      <div>
        <el-popover placement="bottom-start" :width="200" trigger="click">
          <template #reference>
            <div>
              <el-tooltip content="背景颜色">
                <el-image src="./icon/beijing.png" />
              </el-tooltip>
              背景
            </div>
          </template>

          <el-form>
            <el-form-item label="选择背景颜色">
              <el-color-picker
                v-model="formSettings.backgroundColor"
                @click.native.stop
                :teleported="false"
              />
            </el-form-item>
            <el-button type="primary" @click="applyBackground">应用</el-button>
          </el-form>
        </el-popover>
      </div>

      <div
        class="divider"
        style="
          margin-left: 20px;
          width: 2px; /* 竖线宽度 */
          background-color: lightgray; /* 竖线颜色 */
          height: 50%;
        "
      ></div>
      <el-tooltip content="撤销(Ctrl+z)">
        <el-image src="./icon/zhongzuo.png" />
      </el-tooltip>
      <el-tooltip content="撤销重做(Ctrl+shift+z)">
        <el-image src="./icon/chexiao.png" />
      </el-tooltip>
      <div @click="">
        <el-tooltip content="一键排版CtrlK">
          <el-image src="./icon/zidongpaiban.png" />
        </el-tooltip>
      </div>
      <div @click="insertDivider">
        <el-tooltip content="分割线">
          <el-image src="./icon/charu.png" />
        </el-tooltip>
        插入
      </div>

  
      <div class="rightHeader">
        <div>
          <el-popover
            trigger="click"
            placement="bottom-start"
            width="320px"
            :teleported="false"
          >
            <template #reference>
              <div>
                <el-tooltip content="查找替换CtrlF">
                  <el-image src="./icon/chazhaotihuan.png" />
                </el-tooltip>
                查找替换
              </div>
            </template>
            <div class="find-replace-panel">
              <div class="panel-header">
                <h3>查找替换</h3>
              </div>

              <div class="panel-content">
                <!-- 查找输入框 -->
                <div class="input-group">
                  <label class="input-label">查找内容:</label>
                  <el-input
                    v-model="replaceForm.searchText"
                    placeholder="请输入要查找的内容"
                    class="search-input"
                    @input="handleSearchInput"
                    clearable
                  >
                    <template #suffix>
                      <el-icon class="search-icon">
                        <Search />
                      </el-icon>
                    </template>
                  </el-input>
                </div>

                <!-- 替换输入框 -->
                <div class="input-group">
                  <label class="input-label">替换为:</label>
                  <el-input
                    v-model="replaceForm.replaceText"
                    placeholder="请输入替换内容（可选）"
                    class="replace-input"
                    clearable
                  />
                </div>

                <!-- 查找统计信息 -->
                <div v-if="matches.length > 0" class="search-info">
                  <div class="info-item">
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                    <span class="info-text">
                      找到 <strong>{{ matches.length }}</strong> 个匹配项
                      <span v-if="matches.length > 0">，当前第 {{ currentMatchIndex + 1 }} 个</span>
                    </span>
                  </div>
                </div>

                <!-- 导航按钮组 - 始终显示 -->
                <div class="navigation-section">
                  <div class="nav-buttons">
                    <el-button
                      @click="goToPreviousMatch"
                      size="small"
                      :disabled="matches.length === 0"
                      class="nav-btn"
                    >
                      <el-icon><ArrowLeft /></el-icon>
                      上一个
                    </el-button>
                    <el-button
                      @click="goToNextMatch"
                      size="small"
                      :disabled="matches.length === 0"
                      class="nav-btn"
                    >
                      下一个
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </div>
                </div>

                <!-- 替换按钮组 - 始终显示 -->
                <div class="action-section">
                  <div class="action-buttons">
                    <el-button
                      @click="replace"
                      type="primary"
                      size="small"
                      :disabled="matches.length === 0 || !replaceForm.searchText"
                      class="action-btn"
                    >
                      <el-icon><Edit /></el-icon>
                      替换当前
                    </el-button>
                    <el-button
                      @click="replaceInChapter"
                      type="warning"
                      size="small"
                      :disabled="matches.length === 0 || !replaceForm.searchText"
                      class="action-btn"
                    >
                      <el-icon><DocumentCopy /></el-icon>
                      本章替换
                    </el-button>
                  </div>

                  <div class="book-replace-section">
                    <el-button
                      @click="handleReplaceInBook"
                      type="danger"
                      size="small"
                      :disabled="!replaceForm.searchText || !replaceForm.replaceText"
                      class="book-replace-btn"
                    >
                      <el-icon><FolderOpened /></el-icon>
                      全书替换
                    </el-button>
                  </div>
                </div>

                <!-- 提示信息 -->
                <div v-if="replaceForm.searchText && matches.length === 0" class="no-results">
                  <el-icon><Warning /></el-icon>
                  <span>未找到匹配项</span>
                </div>

                <!-- 空状态提示 -->
                <div v-if="!replaceForm.searchText" class="empty-hint">
                  <el-icon><InfoFilled /></el-icon>
                  <span>请输入要查找的内容</span>
                </div>
              </div>
            </div>
          </el-popover>
        </div>
        <div
          @click="
            () => {
              console.log(dialogVisible)
              dialogVisible = true
            }
          "
        >
          <el-tooltip content="取名">
            <el-image src="./icon/jiaosequming.png" />
          </el-tooltip>
          取名
        </div>

        <el-tooltip content="历史">
          <el-image src="./icon/lishi.png" />
        </el-tooltip>
        历史
      </div>

      <ElButton style="margin-left: 20px">发布</ElButton>
    </div>
    <div class="main">
      <div class="aside">
        <div class="asideContent">
          <el-input
            v-model="searchBook"
            style="width: 100%; display: flex"
            placeholder="全书"
            :prefix-icon="Search"
          />
          <div class="addRow">
            <ElButton type="primary" @click="createChapter">新建章</ElButton>
            <!-- 新建卷按钮 -->
            <ElButton type="primary" @click="openVolumnDialog">新建卷</ElButton>
          </div>
          <div class="directory">
            <span>目录</span>
            <el-tooltip content="回收站">
              <el-image src="./icon/huishouzhan.png" />
            </el-tooltip>

            <el-tooltip content="导入导出">
              <ElImage src="./icon/daorudaochu.png" />
            </el-tooltip>
            <el-tooltip content="排序">
              <ElImage src="./icon/paixu.png" />
            </el-tooltip>
          </div>
          <div class="bookSetInfo">
            <el-image src="./icon/a-weidakaidewenjianjiajiami.png" />作品相关
          </div>
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="defaultProps"
            :icon="renderIcon"
            highlight-current
            @node-click="nodeClickHandler"
            node-key="key"
          />
        </div>
      </div>
      <div class="mainContent">
        <div class="mainLeft">
          <EditorToolbar @insert-image="handleInsertImage" />
          <div
            class="contentDetail"
            :style="{
              lineHeight: formSettings.lineHeight + 'em',
              maxWidth: formSettings.contentWidth + '%',
            }"
          >
            <input
              id="trix-editor"
              type="hidden"
              name="content"
              :value="trixContent"
            />
            <trix-editor input="trix-editor"></trix-editor>
          </div>
          <div class="mainFooter">
            <div class="addChapterButton" @click="createChapter">
              <el-icon><Plus /></el-icon>新建章节
            </div>
            <div class="bugFix">
              <text class="bugText">点击纠错</text>

              <div
                style="
                  width: 1px; /* 竖线宽度 */
                  opacity: 0.5;
                  background-color: rgb(167, 163, 163); /* 竖线颜色 */
                  height: 70%;
                "
              ></div>
              本章5000字
            </div>
          </div>
        </div>
        <RightToolbar />
      </div>
    </div>
    <div class="save-status" :class="saveStatus">
      <span v-if="saveStatus === 'saved'">已保存</span>
      <span v-else-if="saveStatus === 'saving'">保存中...</span>
      <span v-else>未保存</span>
      <span v-if="lastSaveTime" class="last-save-time">
        (最后保存: {{ lastSaveTime.toLocaleTimeString() }})
      </span>
    </div>
  </div>
  <!--dialog面板================================================-->
  <el-dialog
    title="取名面板"
    v-model.async="dialogVisible"
    width="800px"
    center
    class="naming-dialog"
  >
    <div class="dialog-content">
      <!-- 左侧分类栏移除，改为顶部分类切换 -->
      <div class="dialog-left" style="display: none"></div>

      <!-- 中间部分条件选择与按钮 -->
      <div class="dialog-center">
        <!-- 顶部分类切换 -->
        <div class="category-switcher">
          <el-radio-group v-model="activeTab" size="small">
            <el-radio-button label="person">人物</el-radio-button>
            <el-radio-button label="place">地点</el-radio-button>
            <el-radio-button label="move">招式</el-radio-button>
            <el-radio-button label="equipment">装备</el-radio-button>
            <el-radio-button label="monster">怪物</el-radio-button>
            <el-radio-button label="item">道具</el-radio-button>
          </el-radio-group>
        </div>
        <!-- 人物筛选条件 -->
        <div v-if="activeTab === 'person'">
          <h3>人物分类</h3>
          <el-tag
            :type="getNameform.region === 'china' ? 'primary' : ''"
            @click="setTag('region', 'china')"
            >中国</el-tag
          >
          <el-tag
            :type="getNameform.region === 'japan' ? 'primary' : ''"
            @click="setTag('region', 'japan')"
            >日本</el-tag
          >
          <el-tag
            :type="getNameform.region === 'west' ? 'primary' : ''"
            @click="setTag('region', 'west')"
            >西方</el-tag
          >
          <br />
          <el-tag
            :type="getNameform.gender === 'male' ? 'primary' : ''"
            @click="setTag('gender', 'male')"
            >男性</el-tag
          >
          <el-tag
            :type="getNameform.gender === 'female' ? 'primary' : ''"
            @click="setTag('gender', 'female')"
            >女性</el-tag
          >
          <el-tag
            :type="getNameform.gender === 'neutral' ? 'primary' : ''"
            @click="setTag('gender', 'neutral')"
            >中性</el-tag
          >
        </div>

      <!-- 地点筛选条件 -->
        <div v-if="activeTab === 'place'">
          <h3>地点分类</h3>
          <el-tag
            :type="getNameform.placeType === 'city' ? 'primary' : ''"
            @click="setTag('placeType', 'city')"
            >城市</el-tag
          >
          <el-tag
            :type="getNameform.placeType === 'village' ? 'primary' : ''"
            @click="setTag('placeType', 'village')"
            >村庄</el-tag
          >
          <el-tag
            :type="getNameform.placeType === 'forest' ? 'primary' : ''"
            @click="setTag('placeType', 'forest')"
            >森林</el-tag
          >
        </div>

        <!-- 其他分类类似，依次类推... -->

        <!-- 随机取名按钮 -->
        <div class="random-name-btn">
          <el-button type="primary" @click="generateName">随机取名</el-button>
        </div>

        <!-- 批量生成与策略设置 -->
        <div class="batch-and-strategy">
          <div class="batch-controls">
            <span class="label">批量数量</span>
            <el-input-number v-model="batchCount" :min="1" :max="50" size="small" />
            <el-button type="success" size="small" @click="generateBatchNames(batchCount)">批量生成</el-button>
          </div>

          <el-divider content-position="left">生成策略</el-divider>
          <div class="strategy-controls">
            <span class="label">复杂度</span>
            <el-radio-group v-model="userPreferences.complexityPreference" size="small">
              <el-radio-button label="simple">简单</el-radio-button>
              <el-radio-button label="medium">平衡</el-radio-button>
              <el-radio-button label="complex">复杂</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- 右边展示生成的名字 -->
      <div class="dialog-right">
        <h3>
          <span>生成的名字</span>
          <span class="name-count">{{ generatedNames.length }} 个</span>
        </h3>

        <!-- 空状态提示 -->
        <div v-if="generatedNames.length === 0" class="empty-state">
          <div class="empty-icon">✨</div>
          <p>还没有生成名字</p>
          <p class="empty-hint">选择条件后点击生成按钮开始</p>
        </div>

        <div v-else class="generated-names">
          <el-tag
            v-for="(name, index) in generatedNames"
            :key="index"
            type="success"
            class="name-tag"
            @click="insertNameToEditor(name)"
          >
            <span class="name-text">{{ name }}</span>
            <div class="name-actions">
              <el-tooltip content="复制" placement="top">
                <el-button type="text" size="small" @click.stop="copyNameToClipboard(name)">
                  <el-icon><DocumentCopy /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="收藏" placement="top">
                <el-button type="text" size="small" @click.stop="addToFavorites(name)">
                  <el-icon><Star /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="屏蔽" placement="top">
                <el-button type="text" size="small" @click.stop="addToBlocked(name)">
                  <el-icon><Close /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </el-tag>
        </div>

        <!-- 快捷操作栏 -->
        <div v-if="generatedNames.length > 0" class="quick-actions">
          <el-button size="small" @click="clearAllNames">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
          <el-button size="small" @click="batchCopyNames">
            <el-icon><DocumentCopy /></el-icon>
            批量复制
          </el-button>
          <el-button size="small" @click="regenerateNames">
            <el-icon><Refresh /></el-icon>
            重新生成
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>

  <!--============================新建分卷-->
  <!-- 弹出的el-dialog -->
  <el-dialog
    title="分卷信息"
    v-model="volumnDialogVisible"
    width="500px"
    center
  >
    <!-- 分卷名称 -->
    <el-form
      :model="volumnForm"
      label-width="80px"
      center="true"
      align-center="true"
    >
      <el-form-item label="分卷名称">
        <el-input
          v-model="volumnForm.name"
          placeholder="请输入分卷名称"
        ></el-input>
      </el-form-item>

      <!-- 分卷简介 -->
      <el-form-item label="分卷简介">
        <el-input
          v-model="volumnForm.description"
          type="textarea"
          placeholder="请输入分卷简介"
          :rows="3"
        ></el-input>
      </el-form-item>
    </el-form>

    <!-- 底部按钮 -->
    <div slot="footer" class="dialog-footer">
      <el-button @click="closeVolumnDialog">取消</el-button>
      <el-button type="primary" @click="saveVolumn">保存</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  CircleCheckFilled,
  EditPen,
  Comment,
  Avatar,
  Tools,
  Plus,
  Document,
  Close,
  Delete,
  Refresh,
} from '@element-plus/icons-vue'
import {
  ElButton,
  ElImage,
  ElInput,
  ElTree,
  ElPopover,
  ElDialog,
  ElForm,
  ElMessage,
  TabsPaneContext,
} from 'element-plus'
import {
  computed,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  watch,
} from 'vue'
import 'trix'
import { useRoute } from 'vue-router'
import http from '@/utils/http'
import { processText, loadSensitiveWords, detectAndReplaceSensitiveWords } from '@/utils/sensitiveWordUtils'
import type { TreeNodeData as ElTreeNodeData } from 'element-plus/es/components/tree/src/tree.type'
import { marked } from 'marked'
import RightToolbar from '@/components/RightToolbar/RightToolbar.vue'
import EditorToolbar from '@/components/Editor/EditorToolbar.vue'
import '@/assets/styles/editor-image.css'

// 命名系统
import {
  IntelligentNamingEngine,
  type NamingContext,
  type UserPreferences,
  type GeneratedName,
  createNamingEngine
} from '@/utils/naming'

// Element Plus 图标
import {
  Search,
  ArrowLeft,
  ArrowRight,
  InfoFilled,
  Edit,
  DocumentCopy,
  Star,
  FolderOpened,
  Warning
} from '@element-plus/icons-vue'

// 删除重复的 Chapter 接口定义，使用下面的定义

interface TreeNodeData {
  id: number
  order: number
  title: string
  vid: number
  children?: TreeNodeData[]
  key?: number
  label?: string
  isVolumn?: boolean
  data?: any
  level?: number
  expanded?: boolean
  loaded?: boolean
  disabled?: boolean
  isLeaf?: boolean
  parent?: TreeNodeData
  rawNode?: any
}

interface TreeNode extends TreeNodeData {
  key: number
  label: string
}

// 定义章节接口
interface Chapter {
  id: number
  content: string
  volume_id: number
  title: string
  order: number
}

// 定义保存状态类型
type SaveStatus = 'saved' | 'saving' | 'unsaved'

// 定义名字池接口
interface NamesPool {
  [key: string]: string[]
}

// 定义表单接口
interface NameForm {
  region: string
  gender: string
  placeType: string
  [key: string]: string
}

// 常量定义
const SEARCH_HIGHLIGHT_DURATION = 1000 // 搜索高亮显示持续时间（毫秒）
const SEARCH_DEBOUNCE_DELAY = 300 // 搜索输入防抖延迟（毫秒）

// 本地防抖函数，避免错误从 vue 导入
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: any
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const route = useRoute()
const bookId = Number(route.params.id as string)

// 检查bookId是否有效
if (!bookId || isNaN(bookId)) {
  console.error('无效的书籍ID:', route.params.id)
  // 可以选择重定向到其他页面或显示错误信息
}

const currentcheckNode = ref<TreeNode | null>(null)
const matches = ref<number[]>([])
const currentMatchIndex = ref(0)
const currentSearchValue = ref('')
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const { ipcRenderer } = window
const trixContent = ref('')
const searchBook = ref('')
const editContent = ref('')

const currentVolumeId = ref(0)
const treeData = ref<TreeNode[]>([])

const appLoaded = ref(false)
// 敏感词缓存
const sensitiveWords = ref<string[]>([])


onMounted(async () => {
  // 初始化数据
  await initTreeData()

  // 预加载敏感词库
  try {
    sensitiveWords.value = await loadSensitiveWords()
  } catch (e) {
    console.warn('敏感词库加载失败，继续运行但不进行过滤')
  }

  // 监听图片插入事件
  const handleInsertImageEvent = (event: CustomEvent) => {
    handleInsertImage(event.detail.html)
  }
  document.addEventListener('insertImage', handleInsertImageEvent as EventListener)

  // 确保 DOM 完成更新后执行
  nextTick(() => {
    // 检查 treeData 的存在性，确保有数据和子节点存在
    if (treeData.value && treeData.value[1]?.children?.[0]?.key) {
      const firstChildKey = treeData.value[1].children[0].key
      treeRef.value?.setCurrentKey(firstChildKey) // 第二个参数为 true 表示自动滚动

      // 手动触发 node-click 事件，模拟用户点击行为
      const selectedNode = treeRef.value?.getCurrentNode()
      if (selectedNode) {
        nodeClickHandler(selectedNode) // 调用点击事件处理函数
      }
    } else {
      console.warn('treeData 或子节点不存在，无法设置默认选中项')
    }

    
    // 设置自动保存
    setupAutoSave()

    // 每30秒自动保存一次
    saveInterval.value = setInterval(async () => {
      if (saveStatus.value === 'unsaved' && currentcheckNode.value) {
        await saveChapterContent(
          currentcheckNode.value.id,
          currentcheckNode.value.title
        )
      }
    }, 30000)

    // 延迟显示内容，添加平滑的加载体验
    setTimeout(() => {
      appLoaded.value = true
    }, 800)
  })
})

const initTreeData = async () => {
  try {
    const res = await http.get('/treeData')

    // 确保获取正确的数据格式
    const rawData = res.data?.data || res.data || []
    treeData.value = rawData
    console.log('树形数据:', JSON.stringify(rawData, null, 2))
  } catch (error) {
    console.error('获取树形数据失败', error)
  }
}

// tree的默认属性
const defaultProps = {
  children: 'children',
  label: 'title',
}
interface Tree {
  label: string
  children?: Tree[]
}

// 自定义图标渲染函数
const renderIcon = (node: TreeNode) => {
  const hasChildren = Array.isArray(node.children)
  const iconSrc = hasChildren
    ? './icon/a-weidakaidewenjianjiajiami.png'
    : './icon/dakaidewenjianjia.png'

  return h(ElImage, {
    key: node.id,
    src: iconSrc,
    style: { width: '15px', height: '15px' },
  })
}

const toggleFullScreen = () => {
  if (ipcRenderer) {
    ipcRenderer.send('toggle-fullscreen')
  } else {
    console.error('ipcRenderer is not available')
  }
}

const activeTab = ref('text')

const formSettings = ref({
  fontType: 'default',
  fontColor: '#000000',
  fontSize: 16,
  lineHeight: 1.5,
  contentWidth: 100,
  paragraphSpacing: false,
  outlineFontSize: 16,
  backgroundColor: '#ffffff', // 新增背景颜色
})
const toggleBold = () => {
  // 逻辑来处理加粗功能
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor

    // 切换加粗
    trixEditorInstance.activateAttribute('bold')
  }
}

watch(
  formSettings,
  () => {
    const trixEditor = document.querySelector('trix-editor') as HTMLElement

    if (trixEditor) {
      const trixEditorInstance = (trixEditor as any).editor

      trixEditor.style.fontSize = `${formSettings.value.fontSize}px`
      trixEditor.style.fontFamily =
        formSettings.value.fontType === 'default'
          ? 'initial'
          : formSettings.value.fontType // 应用所选字体
      trixEditor.style.lineHeight = `${formSettings.value.lineHeight}em`
      trixEditor.style.maxWidth = `${formSettings.value.contentWidth}%`
    }
  },
  { deep: true }
)

const applyBackground = () => {
  const contentDetail = document.querySelector('.contentDetail') as HTMLElement
  if (contentDetail) {
    contentDetail.style.backgroundColor = formSettings.value.backgroundColor // 应用背景颜色
  }
}

const insertDivider = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor

    // 插入换行
    trixEditorInstance.insertLineBreak()

    trixEditorInstance.insertString(
      '_______________________________________________'
    )

    // 重新设置光标位置到分割线后
    trixEditorInstance.setSelectedRange(
      trixEditorInstance.getDocument().toString().length
    )
  }
}

/////////////////////////查找替换////////////////////////////////
const replaceDialogVisible = ref(false)
const replaceForm = ref({
  searchText: '',
  replaceText: '',
})

const replaceOpenPop = () => {
  // 同步搜索文本到替换表单
  if (currentSearchValue.value) {
    replaceForm.value.searchText = currentSearchValue.value
  }
  replaceDialogVisible.value = true
}

const replaceSearchAll = () => {
  // 重新执行搜索以更新匹配项
  if (currentSearchValue.value) {
    // 延迟一下再搜索，确保DOM更新完成
    setTimeout(() => {
      inputSearchTextHandler(currentSearchValue.value)
    }, 100)
  }
}

const replace = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  const trixEditorInstance = (trixEditor as any).editor

  if (!currentSearchValue.value) {
    ElMessage.warning('请输入要查找的内容')
    return
  }

  if (!replaceForm.value.replaceText) {
    ElMessage.warning('请输入要替换的内容')
    return
  }

  if (matches.value.length === 0) {
    ElMessage.warning('没有找到匹配项')
    return
  }

  if (currentMatchIndex.value >= 0 && currentMatchIndex.value < matches.value.length) {
    try {
      // 选中当前匹配项
      const matchStartIndex = matches.value[currentMatchIndex.value]
      const matchEndIndex = matchStartIndex + currentSearchValue.value.length

      trixEditorInstance.setSelectedRange([matchStartIndex, matchEndIndex])

      // 替换选中的文本
      trixEditorInstance.insertString(replaceForm.value.replaceText)

      // 重新查找更新后的匹配项
      replaceSearchAll()

      ElMessage.success('已替换当前匹配项')
    } catch (error) {
      console.error('替换失败:', error)
      ElMessage.error('替换失败，请重试')
    }
  } else {
    ElMessage.warning('请先选择要替换的匹配项')
  }
}

// 删除空的占位函数，使用已经实现的 goToPreviousMatch 和 goToNextMatch

const replaceCurrent = () => {
  replaceInChapter()
}

/**
 *对敏感词进行检测
 */
const sensitiveWordHandler = async () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  const trixEditorInstance = (trixEditor as any).editor
  const chapterContent = trixEditorInstance.getDocument().toString() // 获取当前章节内容

  trixEditorInstance.setSelectedRange([0, chapterContent.length])
  trixEditorInstance.deleteInDirection('forward')
  const resultText = await handleInputText(chapterContent)
  console.log(resultText)
  trixEditorInstance.insertHTML(resultText)
}
// 示例：调用 processText 方法
async function handleInputText(inputText: string) {
  // const inputText = '这里有一个傻逼和狗屎的例子。'
  const resultText = await processText(inputText)
  return resultText
}

// 添加保存状态相关的变量
const saveStatus = ref<'saved' | 'saving' | 'unsaved'>('saved')
const lastSaveTime = ref<Date | null>(null)
const saveInterval = ref<NodeJS.Timeout | null>(null)
const autoSaveTimeout = ref<NodeJS.Timeout | null>(null)

// 改进的保存章节内容函数（仅用于当前章节）
const saveChapterContent = async (
  id: number,
  updateContent?: string
): Promise<void> => {
  try {
    // 验证章节ID有效性（仅限当前章节）
    if (!id || id <= 0 || !currentcheckNode.value || currentcheckNode.value.id !== id) {
      console.warn('保存章节时ID无效或不匹配，跳过保存:', {
        saveId: id,
        currentNodeId: currentcheckNode.value?.id
      })
      return
    }

    saveStatus.value = 'saving'
    const chapterContent = updateContent || getCurrentEditorContent()

    console.log('开始保存章节:', {
      id,
      title: currentcheckNode.value.title,
      contentLength: chapterContent.length
    })

    const res = await http.post('/saveChapter', {
      id,
      content: chapterContent,
    })

    if (res.status === 200) {
      saveStatus.value = 'saved'
      lastSaveTime.value = new Date()
      ElMessage.success('保存成功')
    } else {
      saveStatus.value = 'unsaved'
      ElMessage.error('保存失败，请重试')
    }
  } catch (error) {
    saveStatus.value = 'unsaved'
    ElMessage.error('保存失败，请检查网络连接')
    console.error('保存失败:', error)
  }
}

// 批量保存专用函数（用于全书替换）- 绕过当前章节限制
const saveChapterContentDirect = async (id: number, content: string): Promise<boolean> => {
  try {
    if (!id || id <= 0) {
      console.warn('批量保存：章节ID无效', { id })
      return false
    }

    console.log('批量保存章节:', {
      id,
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + '...'
    })

    const res = await http.post('/saveChapter', {
      id,
      content,
    })

    if (res.status === 200) {
      console.log('批量保存成功:', id, '响应:', res.data)
      return true
    } else {
      console.error('批量保存失败:', res.status, res.data)
      return false
    }
  } catch (error) {
    console.error('批量保存异常:', error)
    return false
  }
}

// 监听编辑器内容变化
const setupAutoSave = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    trixEditor.addEventListener('trix-change', () => {
      console.log('编辑器内容变化，标记为未保存')
      saveStatus.value = 'unsaved'

      // 清除之前的自动保存定时器
      if (autoSaveTimeout.value) {
        clearTimeout(autoSaveTimeout.value)
        autoSaveTimeout.value = null
      }

      // 延迟3秒后自动保存
      autoSaveTimeout.value = setTimeout(() => {
        if (saveStatus.value === 'unsaved' && currentcheckNode.value) {
          console.log('执行自动保存，章节ID:', currentcheckNode.value.id)
          saveChapterContent(currentcheckNode.value.id)
        }
        autoSaveTimeout.value = null
      }, 3000)
    })
  } else {
    console.warn('未找到trix-editor元素')
  }
}

// 处理Element Plus树节点点击事件
const nodeClickHandler = (data: ElTreeNodeData) => {
  const treeData = data as unknown as TreeNodeData

  if (treeData.children && treeData.children.length > 0) {
    return
  }

  // 清除当前的自动保存定时器，避免切换章节时保存错误的内容
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
    autoSaveTimeout.value = null
    console.log('切换章节，清除自动保存定时器')
  }

  const node: TreeNode = {
    id: Number(treeData.id || 0),
    key: Number(treeData.id || 0),
    label: treeData.label || '',
    title: treeData.label || '',
    order: treeData.order || 0,
    vid: treeData.vid || 0,
  }

  console.log('切换到章节:', node.title, 'ID:', node.id)
  currentcheckNode.value = node
  if (node.id) {
    getChapterContent(node.id)
  }
}

const getFirstChapterContent = async (id: number): Promise<string> => {
  try {
    const url = '/getChapter/' + id
    const response = await http.get(url)
    console.log('API返回的章节数据:', response.data)

    // 处理不同的数据结构
    let content = response.data

    // 如果是对象，提取实际内容
    if (content && typeof content === 'object') {
      // 处理 {success: true, data: 章节对象} 格式
      if (content.success && content.data) {
        content = content.data
      }

      // 现在从章节对象中提取content字段
      content = content.content || content.data || content.text || ''
    }

    // 确保返回字符串
    if (typeof content !== 'string') {
      console.warn('章节数据不是字符串格式:', content)
      content = String(content || '')
    }

    console.log('提取的章节内容:', content.substring(0, 100) + '...')
    return content
  } catch (error) {
    console.error('获取章节内容时出错:', error)
    return ''
  }
}

// 防抖处理的搜索输入处理函数
const debouncedSearchHandler = debounce(async (searchText: string) => {
  await inputSearchTextHandler(searchText)
}, SEARCH_DEBOUNCE_DELAY)

const handleSearchInput = () => {
  debouncedSearchHandler(replaceForm.value.searchText)
}

// 统一的Trix编辑器工具函数
const getTrixEditor = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (!trixEditor) {
    console.warn('Trix editor element not found')
    return null
  }

  const trixEditorInstance = (trixEditor as any).editor
  if (!trixEditorInstance) {
    console.warn('Trix editor instance not found')
    return null
  }

  return {
    element: trixEditor,
    instance: trixEditorInstance,
    // 便捷方法
    getSelectedRange: () => trixEditorInstance.getSelectedRange(),
    setSelectedRange: (range: [number, number]) => trixEditorInstance.setSelectedRange(range),
    getDocument: () => trixEditorInstance.getDocument(),
    activateAttribute: (attr: string) => trixEditorInstance.activateAttribute(attr),
    deactivateAttribute: (attr: string) => trixEditorInstance.deactivateAttribute(attr),
    insertString: (text: string) => trixEditorInstance.insertString(text),
    insertHTML: (html: string) => trixEditorInstance.insertHTML(html),
    deleteInDirection: (direction: string) => trixEditorInstance.deleteInDirection(direction)
  }
}

// 正则表达式安全转义工具函数
const escapeRegExp = (s: string): string => {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const inputSearchTextHandler = async (currentValue: string) => {
  const chapterContent = getCurrentEditorContent() // 获取章节内容
  currentSearchValue.value = currentValue.trim() // 查找的词语

  console.log('搜索调试信息:', {
    搜索内容: currentSearchValue.value,
    章节内容长度: chapterContent.length,
    章节内容预览: chapterContent.substring(0, 100) + '...'
  })

  if (!currentSearchValue.value) {
    matches.value = []
    currentMatchIndex.value = 0
    clearHighlight()
    return
  }

  // 使用安全转义的搜索词创建正则表达式（忽略大小写）
  const safeSearch = escapeRegExp(currentSearchValue.value)
  const regex = new RegExp(safeSearch, 'gi')
  matches.value = [] // 清空之前的匹配
  let match

  // 查找所有匹配项的起始位置
  while ((match = regex.exec(chapterContent)) !== null) {
    matches.value.push(match.index) // 存储匹配项的位置
    console.log(`找到匹配项 at ${match.index}: "${match[0]}"`)
  }

  // 重置当前匹配索引
  currentMatchIndex.value = 0

  console.log('搜索结果:', {
    匹配项数量: matches.value.length,
    匹配位置: matches.value,
    当前匹配索引: currentMatchIndex.value
  })

  // 高亮第一个匹配项
  if (matches.value.length > 0) {
    highlightCurrentMatch()
  } else {
    ElMessage.info('未找到匹配内容')
  }
}

// 清除所有高亮 - 仅清除我们添加的高亮标记
const clearHighlight = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  const trixEditorInstance = (trixEditor as any).editor

  if (trixEditorInstance) {
    // 移除所有高亮标记
    const doc = trixEditorInstance.getDocument()
    const currentHTML = doc.toString()

    // 仅移除我们添加的高亮标记（使用唯一class标识）
    const cleanHTML = currentHTML
      // 移除带有 search-highlight class 的 mark 标签
      .replace(/<mark[^>]*class="[^"]*?\bsearch-highlight\b[^"]*"[^>]*>/gi, '')
      .replace(/<\/mark>/gi, '')
      // 移除带有 search-highlight class 且有背景色样式的 strong 标签
      .replace(/<strong[^>]*class="[^"]*?\bsearch-highlight\b[^"]*"[^>]*style="background-color:[^"]*"[^>]*>/gi, '')
      .replace(/<\/strong>/gi, '')

    // 如果内容有变化，则更新编辑器
    if (cleanHTML !== currentHTML) {
      trixEditorInstance.setSelectedRange([0, currentHTML.length])
      trixEditorInstance.deleteInDirection('forward')
      trixEditorInstance.insertHTML(cleanHTML)
    }
  }
}

// 高亮当前匹配的词 - 使用更安全的方式
const highlightCurrentMatch = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  const trixEditorInstance = (trixEditor as any).editor

  console.log('开始高亮匹配项:', {
    编辑器实例: !!trixEditorInstance,
    匹配项数量: matches.value.length,
    当前索引: currentMatchIndex.value,
    搜索内容: currentSearchValue.value
  })

  if (!trixEditorInstance || matches.value.length === 0) {
    console.warn('无法高亮：编辑器不可用或没有匹配项')
    return
  }

  const currentPosition = matches.value[currentMatchIndex.value]
  if (currentPosition === undefined) {
    console.warn('无法高亮：当前位置未定义')
    return
  }

  const searchValue = currentSearchValue.value
  if (!searchValue) {
    console.warn('无法高亮：搜索内容为空')
    return
  }

  try {
    // 先清除之前的高亮
    clearHighlight()

    // 使用选择来高亮当前匹配项
    const matchEnd = currentPosition + searchValue.length

    console.log('高亮详情:', {
      匹配位置: currentPosition,
      结束位置: matchEnd,
      匹配文本长度: searchValue.length,
      总文本长度: trixEditorInstance.getDocument().toString().length
    })

    // 选中要高亮的文本
    trixEditorInstance.setSelectedRange([currentPosition, matchEnd])

    // 滚动到选中位置
    trixEditor.scrollIntoView({ behavior: 'smooth', block: 'center' })

    console.log('已设置选中区域并滚动到位置')

    // 保持选中状态指定时间后取消选中，但保留用户可以清楚看到匹配位置
    setTimeout(() => {
      if (trixEditorInstance && trixEditorInstance.getSelectedRange()[0] !== trixEditorInstance.getSelectedRange()[1]) {
        // 将光标移动到匹配项之后，而不是取消选中
        trixEditorInstance.setSelectedRange([matchEnd, matchEnd])
        console.log('已取消选中状态，光标移动到匹配项之后')
      }
    }, SEARCH_HIGHLIGHT_DURATION)

  } catch (error) {
    console.error('高亮匹配项时出错:', error)
  }
}

// 查找下一个匹配项
const goToNextMatch = () => {
  console.log('点击下一个匹配项:', {
    当前索引: currentMatchIndex.value,
    总匹配数: matches.value.length
  })

  if (matches.value.length > 0) {
    const oldIndex = currentMatchIndex.value
    currentMatchIndex.value =
      (currentMatchIndex.value + 1) % matches.value.length // 循环到下一个匹配项

    console.log('切换到下一个匹配项:', {
      旧索引: oldIndex,
      新索引: currentMatchIndex.value,
      匹配位置: matches.value[currentMatchIndex.value]
    })

    highlightCurrentMatch() // 高亮显示
  } else {
    console.warn('没有可用的匹配项')
    ElMessage.warning('没有找到匹配项')
  }
}

// 查找上一个匹配项
const goToPreviousMatch = () => {
  console.log('点击上一个匹配项:', {
    当前索引: currentMatchIndex.value,
    总匹配数: matches.value.length
  })

  if (matches.value.length > 0) {
    const oldIndex = currentMatchIndex.value
    currentMatchIndex.value =
      (currentMatchIndex.value - 1 + matches.value.length) %
      matches.value.length // 循环到上一个匹配项

    console.log('切换到上一个匹配项:', {
      旧索引: oldIndex,
      新索引: currentMatchIndex.value,
      匹配位置: matches.value[currentMatchIndex.value]
    })

    highlightCurrentMatch() // 高亮显示
  } else {
    console.warn('没有可用的匹配项')
    ElMessage.warning('没有找到匹配项')
  }
}

const replaceInChapter = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  const trixEditorInstance = (trixEditor as any).editor

  if (!currentSearchValue.value) {
    ElMessage.warning('请输入要查找的内容')
    return
  }

  if (!replaceForm.value.replaceText) {
    ElMessage.warning('请输入要替换的内容')
    return
  }

  try {
    const chapterContent = trixEditorInstance.getDocument().toString() // 获取当前章节内容
    const searchValue = currentSearchValue.value
    const regex = new RegExp(searchValue, 'gi')

    // 统计替换数量
    const matches = chapterContent.match(regex)
    const replacementCount = matches ? matches.length : 0

    if (replacementCount === 0) {
      ElMessage.info('没有找到需要替换的内容')
      return
    }

    // 执行替换
    const updatedContent = chapterContent.replace(regex, replaceForm.value.replaceText)

    // 更新富文本内容
    trixEditorInstance.setSelectedRange([0, chapterContent.length])
    trixEditorInstance.deleteInDirection('forward')
    trixEditorInstance.insertHTML(updatedContent)

    // 清除高亮并重新搜索
    clearHighlight()
    matches.value = []
    currentMatchIndex.value = -1

    ElMessage.success('本章替换完成，共替换了 ' + replacementCount + ' 处')

  } catch (error) {
    console.error('本章替换失败:', error)
    ElMessage.error('本章替换失败，请重试')
  }
}

// 全书替换 - 使用现有章节保存API逐个替换
const replaceInBook = async (oldName: string, newName: string) => {
  try {
    if (!oldName || !newName) {
      ElMessage.error('请输入查找内容和替换内容')
      return
    }

    console.log('全书替换功能：', oldName, '->', newName)

    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要在全书中将"${oldName}"替换为"${newName}"吗？此操作将影响所有章节，且不可恢复。`,
      '全书替换确认',
      {
        confirmButtonText: '确定替换',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 获取所有章节
    const allChapters = await getAllChapters()
    if (!allChapters || allChapters.length === 0) {
      ElMessage.warning('没有找到章节')
      return
    }

    // 统计信息
    let totalReplacements = 0
    let processedChapters = 0
    const failedChapters: string[] = []

    // 显示进度提示
    let currentProgressMessage: any = null

    const updateProgress = (message: string) => {
      if (currentProgressMessage) {
        currentProgressMessage.close()
      }
      currentProgressMessage = ElMessage({
        message,
        type: 'info',
        duration: 0,
        showClose: false,
      })
    }

    updateProgress('正在替换中...')

    try {
      // 遍历所有章节进行替换
      for (const chapter of allChapters) {
        try {
          console.log('处理章节:', chapter)

          // 确保章节有有效的ID
          const chapterId = chapter.id || chapter.chapter_id || chapter.chapterId
          if (!chapterId) {
            console.warn('章节没有有效的ID:', chapter)
            failedChapters.push(chapter.title || chapter.name || '未知章节')
            continue
          }

          // 获取章节内容
          const chapterContent = await getFirstChapterContent(chapterId)

          if (chapterContent) {
            // 使用安全转义的搜索词创建正则表达式
            const safeSearch = escapeRegExp(oldName)
            const regex = new RegExp(safeSearch, 'gi')
            const matches = chapterContent.match(regex)
            const replacementCount = matches ? matches.length : 0

            if (replacementCount > 0) {
              const updatedContent = chapterContent.replace(regex, newName)

              // 使用批量保存专用函数
              const saveSuccess = await saveChapterContentDirect(chapterId, updatedContent)
              if (saveSuccess) {
                totalReplacements += replacementCount
                console.log(`章节 ${chapter.title || chapterId} 替换了 ${replacementCount} 处`)
              } else {
                failedChapters.push(chapter.title || `章节 ${chapterId}`)
                console.error(`章节 ${chapter.title || chapterId} 保存失败`)
              }
            }
          } else {
            console.warn('章节内容为空:', chapterId)
          }

          processedChapters++

          // 更新进度信息
          updateProgress(`正在替换中... ${processedChapters}/${allChapters.length} 章节`)

        } catch (chapterError) {
          console.error(`处理章节 ${chapter.title || chapter.id || '未知'} 时出错:`, chapterError)
          failedChapters.push(chapter.title || chapter.name || `章节 ${chapter.id || chapter.chapter_id || '未知'}`)
        }
      }

      // 关闭进度提示
      if (currentProgressMessage) {
        currentProgressMessage.close()
      }

      // 显示结果
      if (totalReplacements > 0) {
        let resultMessage = `全书替换完成！\n总共替换了 ${totalReplacements} 处\n处理了 ${processedChapters} 个章节`

        if (failedChapters.length > 0) {
          resultMessage += `\n${failedChapters.length} 个章节处理失败：\n${failedChapters.join(', ')}`
        }

        await ElMessageBox.alert(resultMessage, '替换完成', {
          confirmButtonText: '确定',
          type: totalReplacements > 0 ? 'success' : 'info'
        })
      } else {
        ElMessage.info('没有找到需要替换的内容')
      }

      // 刷新当前章节内容（如果当前章节受影响）
      if (currentcheckNode.value) {
        await getChapterContent(currentcheckNode.value.id)
      }

    } catch (progressError) {
      progressMessage.close()
      throw progressError
    }

  } catch (error) {
    if (error !== 'cancel') {
      console.error('全书替换失败:', error)
      ElMessage.error('全书替换失败：' + (error.message || '未知错误'))
    }
  }
}

// 获取全书所有章节的内容
const getAllChapters = async () => {
  try {
    const response = await http.get('/chapters')
    console.log('API返回的章节数据:', response.data)

    // 确保返回的是数组
    let chapters = response.data

    // 如果数据是对象，可能包含在某个属性中
    if (chapters && typeof chapters === 'object' && !Array.isArray(chapters)) {
      // 尝试常见的属性名
      chapters = chapters.data || chapters.chapters || chapters.list || []
    }

    // 确保最终是数组
    if (!Array.isArray(chapters)) {
      console.warn('API返回的数据不是数组格式:', chapters)
      return []
    }

    console.log('处理后的章节数组:', chapters)
    return chapters
  } catch (error) {
    console.error('获取章节列表失败:', error)
    return []
  }
}

// 控制弹窗的可见性
const dialogVisible = ref(false)
const getNameActiveTab = ref('person')

interface NameForm {
  region: string // 人物分类的区域
  gender: string // 人物分类的性别
  placeType: string // 地点分类的类型
}
// 表单数据
const getNameform = ref<NameForm>({
  region: '', // 人物分类的区域
  gender: '', // 人物分类的性别
  placeType: '', // 地点分类的类型
})
// 存放生成的名字
const generatedNames = ref<string[]>([])

// 命名系统相关变量
const userPreferences = ref<UserPreferences>({
  stylePreference: 'balanced',
  complexityPreference: 'medium',
  culturalPreference: ['chinese'],
  favoriteElements: [],
  avoidedElements: []
})

// 命名历史记录
const namingHistory = ref<GeneratedName[]>([])
const maxHistoryItems = 50

// 选中的地点类型（用于批量生成）
const selectedPlaceTypes = ref<string[]>(['city'])

// 使用外部命名系统（保持单例与稳定种子）
const namingEngineRef = ref<IntelligentNamingEngine | null>(null)
const namingSeed = ref<number>(Date.now())
const getNamingEngine = () => {
  if (!namingEngineRef.value) {
    namingEngineRef.value = createNamingEngine(userPreferences.value, namingSeed.value)
  }
  return namingEngineRef.value
}

// 批量生成数量
const batchCount = ref<number>(10)

// 更新用户偏好学习
const updateUserPreferences = (generatedName: GeneratedName) => {
  // 基于生成的名称学习用户偏好
  const engine = getNamingEngine()
  engine.updateUserPreferencesDirect({
    favoriteElements: [...userPreferences.value.favoriteElements],
    avoidedElements: [...userPreferences.value.avoidedElements]
  })
}

// 设置选中的 tag
const setTag = (key: keyof NameForm, value: string) => {
  getNameform.value[key] = value
}
// 生成名称 - 使用外部命名系统
const generateName = async () => {
  // 确定文化类型（根据选择的区域标签，而非 getNameActiveTab）
  const region = getNameform.value.region || 'china'
  const culture = region

  // 确定生成类别
  const category = activeTab.value === 'person' ? 'person' : 'place'

  const context: NamingContext = {
    category,
    culture,
    userPreferences: userPreferences.value,
    complexity: userPreferences.value.complexityPreference,
    count: 1
  }

  // 如果是人物类型，需要包含性别偏好
  if (category === 'person') {
    userPreferences.value.stylePreference = getNameform.value.gender || 'balanced'
  }

  // 如果是地点类型，需要包含子类别
  if (category === 'place') {
    context.subcategory = getNameform.value.placeType || 'city'
  }

  try {
    const engine = getNamingEngine()
    await engine.ready()
    const result = engine.generateBatch(context, 1)

    if (result.names.length > 0) {
      // 敏感词过滤
      const nameText = result.names[0].text
      const replaced = sensitiveWords.value.length > 0
        ? detectAndReplaceSensitiveWords(nameText, sensitiveWords.value)
        : nameText
      if (replaced !== nameText && replaced.includes('*')) {
        ElMessage.warning('生成结果包含敏感词，已过滤')
        return
      }
      // 添加到显示列表
      generatedNames.value.unshift(nameText)
      if (generatedNames.value.length > 20) { // 限制显示列表长度
        generatedNames.value = generatedNames.value.slice(0, 20)
      }

      // 添加到历史记录
      namingHistory.value.unshift(result.names[0])
      if (namingHistory.value.length > maxHistoryItems) {
        namingHistory.value = namingHistory.value.slice(0, maxHistoryItems)
      }

      // 更新用户偏好学习
      updateUserPreferences(result.names[0])

      ElMessage.success('生成成功: ' + nameText)
    } else {
      ElMessage.warning('未能生成合适的名称，请重试')
    }
  } catch (error) {
    console.error('命名生成错误:', error)
    ElMessage.error('命名生成失败，请检查设置')
  }
}

// 批量生成名称
const generateBatchNames = async (count: number) => {
  // 确定文化类型（根据选择的区域标签，而非 getNameActiveTab）
  const region = getNameform.value.region || 'china'
  const culture = region

  // 确定生成类别
  const category = activeTab.value === 'person' ? 'person' : 'place'

  const context: NamingContext = {
    category,
    culture,
    userPreferences: userPreferences.value,
    complexity: userPreferences.value.complexityPreference,
    count
  }

  // 如果是人物类型，需要包含性别偏好
  if (category === 'person') {
    userPreferences.value.stylePreference = getNameform.value.gender || 'balanced'
  }

  // 如果是地点类型，需要包含子类别
  if (category === 'place') {
    context.subcategory = getNameform.value.placeType || 'city'
  }

  try {
    const engine = getNamingEngine()
    await engine.ready()
    const result = engine.generateBatch(context, count)

    if (result.names.length > 0) {
      // 添加到显示列表（敏感词过滤与去重）
      const nameSet = new Set<string>()
      result.names.forEach(name => {
        const replaced = sensitiveWords.value.length > 0
          ? detectAndReplaceSensitiveWords(name.text, sensitiveWords.value)
          : name.text
        if (replaced !== name.text && replaced.includes('*')) {
          return
        }
        if (!nameSet.has(name.text)) {
          nameSet.add(name.text)
          generatedNames.value.unshift(name.text)
        }
      })
      if (generatedNames.value.length > 50) { // 批量生成时增加显示限制
        generatedNames.value = generatedNames.value.slice(0, 50)
      }

      // 添加到历史记录
      namingHistory.value.unshift(...result.names)
      if (namingHistory.value.length > maxHistoryItems) {
        namingHistory.value = namingHistory.value.slice(0, maxHistoryItems)
      }

      ElMessage.success('批量生成成功，共生成 ' + result.names.length + ' 个名称')
    } else {
      ElMessage.warning('未能生成合适的名称，请重试')
    }
  } catch (error) {
    console.error('批量命名生成错误:', error)
    ElMessage.error('批量命名生成失败，请检查设置')
  }
}

// 复制名称到剪贴板
const copyNameToClipboard = async (name: string) => {
  try {
    await navigator.clipboard.writeText(name)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 插入名称到编辑器
const insertNameToEditor = (name: string) => {
  try {
    // 获取编辑器实例并插入文本
    const editor = document.querySelector('trix-editor')
    if (editor) {
      const trixEditor = (editor as any)
      trixEditor.insertString(name)
      ElMessage.success('已插入到编辑器')
    } else {
      ElMessage.warning('未找到编辑器')
    }
  } catch (error) {
    console.error('插入失败:', error)
    ElMessage.error('插入失败')
  }
}

// 收藏名称
const addToFavorites = (name: string) => {
  // 这里可以实现收藏功能，比如保存到本地存储或后端
  const favorites = JSON.parse(localStorage.getItem('favoriteNames') || '[]')
  if (!favorites.includes(name)) {
    favorites.push(name)
    localStorage.setItem('favoriteNames', JSON.stringify(favorites))
    ElMessage.success('已添加到收藏')
  } else {
    ElMessage.info('该名称已在收藏中')
  }
}

// 屏蔽名称（加入用户避免列表并从展示列表移除）
const addToBlocked = (name: string) => {
  if (!userPreferences.value.avoidedElements.includes(name)) {
    userPreferences.value.avoidedElements.push(name)
    generatedNames.value = generatedNames.value.filter(n => n !== name)
    ElMessage.success('已屏蔽该名称')
  } else {
    ElMessage.info('该名称已在屏蔽列表中')
  }
}

// 新增的快捷操作功能
const clearAllNames = () => {
  if (generatedNames.value.length === 0) {
    ElMessage.info('当前没有名称需要清空')
    return
  }

  ElMessageBox.confirm(
    '确定要清空所有生成的名称吗？',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    generatedNames.value = []
    ElMessage.success('已清空所有名称')
  }).catch(() => {
    // 用户取消操作
  })
}

const batchCopyNames = () => {
  if (generatedNames.value.length === 0) {
    ElMessage.warning('没有可复制的名称')
    return
  }

  const namesText = generatedNames.value.join('\n')
  navigator.clipboard.writeText(namesText).then(() => {
    ElMessage.success('已复制 ' + generatedNames.value.length + ' 个名称到剪贴板')
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = namesText
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('已复制 ' + generatedNames.value.length + ' 个名称到剪贴板')
  })
}

const regenerateNames = async () => {
  if (generatedNames.value.length === 0) {
    ElMessage.warning('请先生成一些名称再重新生成')
    return
  }

  const currentCount = generatedNames.value.length
  await generateBatchNames(currentCount)
  ElMessage.info('正在重新生成 ' + currentCount + ' 个名称...')
}

// 处理分类切换
const handleTabClick = (tab: { props: { name: string } }) => {
  activeTab.value = tab.props.name
}

// 对话框的显示状态
const volumnDialogVisible = ref(false)

// 分卷表单的数据
const volumnForm = ref({
  name: '',
  description: '',
})

// 打开对话框
const openVolumnDialog = () => {
  volumnDialogVisible.value = true
}

// 关闭对话框
const closeVolumnDialog = () => {
  volumnDialogVisible.value = false
}

// volumnTreeData 代表现有的分卷树
const volumnTreeData = ref<any[]>([])

// 保存分卷并传入后台
const saveVolumn = async () => {
  // 检查表单内容是否为空
  if (!volumnForm.value.name) {
    ElMessage.error('请填写分卷名称')
    return
  }

  // 传入后台保存
  const response = await saveVolumnToBackend()

  if (!response) return

  // 创建新分卷对象
  const newVolumn = {
    id: response.data.id,
    key: treeData.value.length + 2,
    label: response.data.title,
    title: response.data.title,
    order: treeData.value.length + 2,
    vid: response.data.id,
    children: [], // 新建的分卷可能有章节，因此初始化一个空数组
    isVolumn: true,
  }

  // 将新分卷加入到 volumnTreeData 中
  treeData.value.push(newVolumn)
  // 使用 nextTick 确保 ElTree 组件在 DOM 中已更新后再调用 refresh
  currentVolumeId.value = newVolumn.id
  // 关闭对话框
  closeVolumnDialog()
}

// 修改saveVolumnToBackend函数
const saveVolumnToBackend = async () => {
  try {
    const response = await http.post('/saveVolume', {
      bookId: bookId,
      title: volumnForm.value.name,
      order: treeData.value.length + 2,
    })
    console.log(response)

    // 弹出保存成功的提示
    ElMessage.success('新建分卷成功')
    return response
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
    return null
  }
}

const createChapter = async () => {
  // id, content,volume_id,title,\`order\`

  let vid = currentVolumeId.value
  // currentcheckNode.value?.vid
  //   ? currentcheckNode.value.vid
  //   : currentVolumeId.value

  const children = treeData.value.find((e) => e.id === vid)?.children

  let order = children ? children.length + 1 : 1

  const param = {
    content: '',
    vid: vid,
    title: '第' + order + '章',
    order: order,
  }

  const res = await http.post('/createChapter', param)

  const key = countNodes()
  children?.push({
    id: res.data.data.id,
    key: key,
    label: '第' + order + '章',
    order: order,
    title: '第' + order + '章',
    vid: vid,
  })
  // 使用 nextTick 确保 DOM 完全更新后再设置选中状态
  await nextTick()
  treeRef.value?.setCurrentKey(key, true) // 第二个参数为 true 表示自动滚动

  // 手动触发 node-click 事件，模拟用户点击行为
  const selectedNode = treeRef.value?.getCurrentNode()

  if (selectedNode) {
    nodeClickHandler(selectedNode) // 调用点击事件处理函数
  }
}

const countNodes = () => {
  let count = 1

  // 遍历所有的父节点
  treeData.value.forEach((parentNode) => {
    count += 1 // 父节点自己算一个
    if (parentNode.children) {
      // 如果有子节点，增加子节点的数量
      count += parentNode.children.length
    }
  })

  return count
}


// 处理图片插入
const handleInsertImage = (html: string) => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor
    if (!trixEditorInstance) {
      console.error('Trix editor instance not found')
      return
    }

    try {
      console.log('准备插入的HTML:', html)

      // 解析HTML获取图片信息
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      const img = tempDiv.querySelector('img')

      if (img && img.src) {
        console.log('检测到图片，src:', img.src)

        // 简单直接的方法：直接插入HTML
        trixEditorInstance.insertHTML(html)

        // 验证插入是否成功
        setTimeout(() => {
          const editorContent = trixEditorInstance.getDocument().toString()
          if (editorContent.includes(img.src) || editorContent.includes(img.alt)) {
            console.log('图片插入成功')
          } else {
            console.warn('图片可能未正确插入，尝试备选方案')
            // 备选方案：插入简化的HTML
            const simpleHtml = `<img src="${img.src}" alt="${img.alt || ''}" style="max-width: 100%; height: auto; display: block; margin: 16px 0;">`
            trixEditorInstance.insertHTML(simpleHtml)
          }
        }, 100)

      } else {
        console.log('未检测到图片，直接插入HTML')
        trixEditorInstance.insertHTML(html)
      }

      // 触发自动保存
      setTimeout(() => {
        trixEditorInstance.element.dispatchEvent(new Event('change'))
      }, 50)

      ElMessage.success('图片已插入到编辑器')
    } catch (error) {
      console.error('插入图片失败:', error)
      ElMessage.error('插入图片失败，请重试')
    }
  } else {
    console.error('Trix editor element not found')
  }
}


// 图片上传前的验证
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}


// 获取章节内容
const getChapterContent = async (id: number): Promise<void> => {
  try {
    console.log('开始加载章节内容，ID:', id)

    // 清除当前的自动保存定时器，避免在加载新章节内容时触发旧章节的保存
    if (autoSaveTimeout.value) {
      clearTimeout(autoSaveTimeout.value)
      autoSaveTimeout.value = null
      console.log('加载章节内容，清除自动保存定时器')
    }

    const url = '/getChapter/' + id
    const response = await http.get(url)

    // 正确提取章节内容，处理API响应格式
    let content = ''
    if (response.data) {
      if (typeof response.data === 'string') {
        content = response.data
      } else if (response.data.data && typeof response.data.data === 'string') {
        content = response.data.data
      } else if (response.data.data && response.data.data.content && typeof response.data.data.content === 'string') {
        content = response.data.data.content
      } else if (response.data.content && typeof response.data.content === 'string') {
        content = response.data.content
      } else {
        console.warn('未知的API响应格式:', response.data)
        content = ''
      }
    }

    trixContent.value = content

    // 设置编辑器内容
    nextTick(() => {
      const trixEditor = document.querySelector('trix-editor') as HTMLElement
      if (trixEditor) {
        const trixEditorInstance = (trixEditor as any).editor
        if (typeof trixContent.value === 'string') {
          trixEditorInstance.loadHTML(trixContent.value)
        } else {
          console.warn('trixContent不是字符串类型:', typeof trixContent.value)
          trixEditorInstance.loadHTML('')
        }
      }
    })
  } catch (error) {
    console.error('获取章节内容时出错:', error)
    trixContent.value = ''
  }
}

// 仅用于获取当前编辑器内容的函数
const getCurrentEditorContent = (): string => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    // 使用Trix编辑器的API获取纯文本内容
    const trixEditorInstance = (trixEditor as any).editor
    if (trixEditorInstance) {
      return trixEditorInstance.getDocument().toString()
    }
    // 如果API不可用，使用textContent作为备选方案
    return trixEditor.textContent || ''
  }
  return ''
}

// 定义API函数 - 使用现有的treeData API获取章节列表
const getChapters = async (volumeId: number): Promise<Chapter[]> => {
  try {
    // 从treeData中提取指定volume的章节
    const response = await http.get('/treeData')
    const treeData = response.data.data || response.data

    // 递归查找指定volumeId的章节
    const findChaptersInVolume = (items: any[], targetVolumeId: number): Chapter[] => {
      const chapters: Chapter[] = []

      for (const item of items) {
        if (item.type === 'volume' && item.id === targetVolumeId) {
          // 找到目标卷，收集所有章节
          if (item.children) {
            for (const chapter of item.children) {
              if (chapter.type === 'chapter') {
                chapters.push({
                  id: chapter.id,
                  title: chapter.title,
                  content: '', // 章节内容需要单独获取
                  volumeId: targetVolumeId,
                  bookId: item.bookId || 1,
                  order: chapters.length + 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              }
            }
          }
        } else if (item.children) {
          // 递归查找
          chapters.push(...findChaptersInVolume(item.children, targetVolumeId))
        }
      }

      return chapters
    }

    return findChaptersInVolume(treeData, volumeId)
  } catch (error) {
    console.error('获取章节列表失败:', error)
    return []
  }
}

const updateChapterContent = async (
  chapterId: number,
  content: string
): Promise<void> => {
  try {
    // 使用现有的saveChapter API
    await http.post('/saveChapter', {
      id: chapterId,
      content: content
    })
  } catch (error) {
    console.error('更新章节内容失败:', error)
    throw error
  }
}

// 修改handleNodeClick函数
const handleNodeClick = (data: ElTreeNodeData) => {
  nodeClickHandler(data)
}

// 修改handleDragEnd函数
const handleDragEnd = (
  draggingNode: ElTreeNodeData,
  dropNode: ElTreeNodeData
) => {
  // 处理拖拽结束逻辑
}

const handleCheck = (data: ElTreeNodeData, checked: boolean) => {
  const treeData = data as unknown as TreeNodeData
  if (treeData.children && treeData.children.length > 0) {
    return
  }
  // ... existing code ...
}

// 添加处理全书替换的事件处理函数
const handleReplaceInBook = () => {
  if (currentSearchValue.value && replaceForm.value.replaceText) {
    replaceInBook(currentSearchValue.value, replaceForm.value.replaceText)
  } else {
    ElMessage.error('请输入查找内容和替换内容')
  }
}



// 添加onUnmounted函数来清理资源
onUnmounted(() => {
  // 移除图片插入事件监听器
  document.removeEventListener('insertImage', handleInsertImage as EventListener)

  // 清理自动保存定时器
  if (saveInterval.value) {
    clearInterval(saveInterval.value)
    saveInterval.value = null
  }

  // 清理自动保存延迟定时器
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
    autoSaveTimeout.value = null
  }

  // 清理预览更新定时器
  const previewIntervals = document.querySelectorAll('[data-preview-interval]')
  previewIntervals.forEach((interval) => {
    if (interval && typeof interval === 'object' && 'id' in interval) {
      clearInterval(Number(interval.id))
    }
  })

  console.log('组件已卸载，资源已清理')
})
</script>

<style lang="scss" scoped>
.content {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;

  &.content-loaded {
    opacity: 1;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition:
      opacity 0.5s ease-out,
      visibility 0.5s ease-out;

    .loading-text {
      margin-top: 30px;
      font-size: 20px;
      color: #4a4a4a;
      font-weight: 500;
      letter-spacing: 1px;
      text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.5);
    }

    .loading-dots {
      margin-top: 15px;
      display: flex;
      span {
        width: 8px;
        height: 8px;
        margin: 0 5px;
        background-color: #4a4a4a;
        border-radius: 50%;
        display: inline-block;
        animation: dots 1.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }

        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }

    .loader-container {
      perspective: 1000px;
    }

    .book {
      position: relative;
      width: 100px;
      height: 120px;
      transform-style: preserve-3d;
      animation: bookRotate 4s infinite linear;

      &__page {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        background-color: #1989fa;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);

        &:nth-child(1) {
          transform: rotateY(0deg) translateZ(10px);
          background: linear-gradient(45deg, #1989fa, #53a8ff);
        }

        &:nth-child(2) {
          transform: rotateY(30deg) translateZ(5px);
          background: linear-gradient(45deg, #53a8ff, #85c1ff);
        }

        &:nth-child(3) {
          transform: rotateY(60deg) translateZ(0);
          background: linear-gradient(45deg, #85c1ff, #b3d8ff);
        }
      }
    }
  }

  .header {
    height: clamp(40px, 6vh, 60px); // 响应式高度
    width: 100%;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
    padding: 0 clamp(0.5rem, 1vw, 1rem);
    flex-shrink: 0;

    .rightHeader {
      display: flex;
      align-items: center;
      margin-left: auto;
      gap: clamp(0.5rem, 1vw, 1rem);

      .el-button {
        height: clamp(28px, 4vh, 36px);
        font-size: clamp(0.75rem, 1vw, 0.875rem);
        padding: 0 clamp(0.5rem, 1vw, 0.75rem);
      }
    }

    .el-image {
      margin: 0 clamp(3px, 0.5vw, 5px) 0 clamp(10px, 2vw, 20px);
      height: clamp(12px, 2vh, 18px);
      width: clamp(12px, 2vh, 18px);
    }
  }

  .main {
    width: 100%;
    background-color: #ffffff;
    flex: 1;
    display: flex;
    overflow: hidden; // 防止内容溢出

    .aside {
      height: 100%;
      width: clamp(250px, 25vw, 350px); // 响应式宽度
      min-width: 250px; // 最小宽度
      max-width: 350px; // 最大宽度
      border-right: 1px solid #e0e0e0;
      flex-shrink: 0;

      .asideContent {
        margin: 0 auto;
        margin-top: clamp(1rem, 2vh, 1.5rem);
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: clamp(0.75rem, 2vh, 1rem);
        height: 100%;
        width: 90%;
        padding-bottom: clamp(1rem, 2vh, 1.5rem);

        .addRow {
          height: clamp(40px, 6vh, 50px);
          display: flex;
          width: 100%;
          justify-content: center;
          gap: clamp(0.5rem, 1vw, 0.75rem);

          button {
            flex: 1;
            height: 100%;
            font-size: clamp(0.75rem, 1vw, 0.875rem);
            border-radius: clamp(4px, 1vw, 6px);
            transition: all 0.3s ease;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
          }
        }

        .directory {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          width: 100%;
          padding: clamp(0.5rem, 1vh, 0.75rem) 0;

          .el-image {
            margin-left: clamp(5px, 1vw, 10px);
            height: clamp(12px, 2vh, 18px);
            width: clamp(12px, 2vh, 18px);
          }

          span {
            margin-right: auto;
            color: rgb(159, 152, 152);
            font-size: clamp(0.75rem, 1vw, 0.875rem);
          }
        }

        .bookSetInfo {
          display: flex;
          justify-content: flex-start;
          width: 100%;
          align-items: center;
          font-size: clamp(0.75rem, 1vw, 0.875rem);
          padding: clamp(0.5rem, 1vh, 0.75rem) 0;

          .el-image {
            margin-right: clamp(5px, 1vw, 10px);
            height: clamp(12px, 2vh, 18px);
            width: clamp(12px, 2vh, 18px);
          }
        }

        .el-tree {
          width: 100%;
          flex: 1;
          overflow-y: auto;

          :deep(.el-tree-node__content) {
            height: clamp(32px, 5vh, 40px);
            padding: clamp(4px, 0.5vw, 8px) 0;
          }

          .custom-node {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;

            .el-image {
              height: clamp(12px, 2vh, 16px);
              width: clamp(12px, 2vh, 16px);
              margin-right: clamp(4px, 0.5vw, 8px);
            }

            span {
              font-size: clamp(0.75rem, 1vw, 0.875rem);
              line-height: 1.4;
            }
          }
        }
      }
    }

    .mainContent {
      height: 100%;
      width: 100%;
      flex: 1;
      background-color: #f3f3f6;
      display: flex;
      justify-content: flex-end;
      overflow: hidden;

      .mainRight {
        height: 100%;
        width: clamp(40px, 5vw, 60px);
        display: flex;
        flex-direction: column;
        gap: clamp(1rem, 2vh, 1.5rem);
        background-color: #ffffff;
        align-items: center;
        position: relative;
        flex-shrink: 0;

        .right-tabs {
          height: 100%;
          width: 100%;

          :deep(.el-tabs__content) {
            overflow: visible;
          }

          :deep(.el-tab-pane) {
            position: relative;
          }

          .rightTabContent {
            position: fixed;
            right: clamp(40px, 5vw, 60px);
            top: clamp(80px, 10vh, 120px);
            background-color: #ffffff;
            width: clamp(300px, 40vw, 600px);
            height: clamp(300px, 60vh, calc(100vh - 140px));
            max-width: 80vw;
            max-height: 80vh;
            box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
            border-radius: clamp(8px, 1.5vw, 16px) 0 0 clamp(8px, 1.5vw, 16px);
            z-index: 10;
            padding: clamp(1rem, 2vh, 1.5rem);
            overflow-y: auto;
            transition:
              transform 0.3s ease-in-out,
              opacity 0.3s ease;
            // 默认隐藏所有面板
            transform: translateX(100%);
            opacity: 0;
            pointer-events: none;
          }
        }
        .menuItem {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          &:hover {
            background-color: #f5eeee;
          }
          &.active {
            color: var(--el-color-primary);
            background-color: #ecf5ff;
          }
        }
      }
      .mainLeft {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0; // 防止flex子项溢出
        overflow: hidden;

        .contentDetail {
          flex: 1;
          border: 1px solid #e0e0e0;
          padding: clamp(0.75rem, 2vh, 1.5rem);
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden; // 防止横向滚动
          line-height: 1.6;
          max-width: 100%;
          background-color: #ffffff;
          border-radius: clamp(4px, 0.5vw, 8px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;

          // Trix编辑器样式优化
          :deep(trix-editor) {
            min-height: clamp(300px, 60vh, 800px);
            max-height: 100%;
            padding: clamp(1rem, 2vh, 1.5rem);
            font-size: clamp(0.875rem, 1.2vw, 1rem);
            line-height: 1.7;
            color: #333;
            background-color: transparent;
            border: none;
            outline: none;
            border-radius: 0;
            overflow-y: auto;
            overflow-x: hidden;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;

            // 编辑器工具栏样式
            &::before {
              content: '';
              display: none; // 隐藏默认工具栏
            }

            // 编辑器内容区域
            .trix-content {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: inherit;
              line-height: inherit;
              color: inherit;
              width: 100%;
              max-width: 100%;
              overflow-wrap: break-word;
              word-wrap: break-word;
              word-break: break-word;
              hyphens: auto;
              overflow-x: hidden;
              box-sizing: border-box;

              // 确保所有内联元素不会导致溢出
              * {
                max-width: 100%;
                box-sizing: border-box;
              }

              // 处理长文本不换行的情况
              span, strong, em, b, i, u, s {
                word-wrap: break-word;
                word-break: break-word;
                overflow-wrap: break-word;
              }

              // 标题样式
              h1, h2, h3, h4, h5, h6 {
                margin: clamp(1rem, 2vh, 1.5rem) 0 clamp(0.5rem, 1vh, 0.75rem) 0;
                font-weight: 600;
                line-height: 1.3;
                color: #2c3e50;
              }

              h1 { font-size: clamp(1.5rem, 3vw, 2rem); }
              h2 { font-size: clamp(1.25rem, 2.5vw, 1.75rem); }
              h3 { font-size: clamp(1.1rem, 2vw, 1.5rem); }
              h4 { font-size: clamp(1rem, 1.8vw, 1.25rem); }
              h5 { font-size: clamp(0.9rem, 1.6vw, 1.1rem); }
              h6 { font-size: clamp(0.8rem, 1.4vw, 1rem); }

              // 段落样式
              p {
                margin: clamp(0.75rem, 1.5vh, 1rem) 0;
                text-align: justify;
                word-wrap: break-word;
                word-break: break-word;
              }

              // 列表样式
              ul, ol {
                margin: clamp(0.5rem, 1vh, 0.75rem) 0;
                padding-left: clamp(1.5rem, 3vw, 2rem);

                li {
                  margin: clamp(0.25rem, 0.5vh, 0.5rem) 0;
                  line-height: inherit;
                }
              }

              // 引用样式
              blockquote {
                margin: clamp(1rem, 2vh, 1.5rem) 0;
                padding: clamp(0.75rem, 1.5vh, 1rem) clamp(1rem, 2vw, 1.5rem);
                border-left: clamp(3px, 0.3vw, 5px) solid #42b983;
                background-color: #f8f9fa;
                border-radius: 0 4px 4px 0;
                color: #6c757d;
                font-style: italic;
              }

              // 代码样式
              pre {
                margin: clamp(1rem, 2vh, 1.5rem) 0;
                padding: clamp(1rem, 2vh, 1.25rem);
                background-color: #f6f8fa;
                border-radius: clamp(4px, 0.5vw, 8px);
                overflow-x: auto;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                font-size: clamp(0.8rem, 1vw, 0.9rem);
                line-height: 1.5;

                code {
                  background: none;
                  padding: 0;
                  border-radius: 0;
                  color: inherit;
                }
              }

              code {
                background-color: #f1f3f4;
                color: #d73a49;
                padding: 0.2em 0.4em;
                border-radius: 3px;
                font-size: 85%;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                word-wrap: break-word;
                word-break: break-word;
                overflow-wrap: break-word;
                max-width: 100%;
                display: inline-block;
              }

              // 链接样式
              a {
                color: #42b983;
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: border-color 0.3s ease;

                &:hover {
                  border-bottom-color: #42b983;
                }
              }

              // 图片样式
              img {
                max-width: 100%;
                height: auto;
                border-radius: clamp(4px, 0.5vw, 8px);
                margin: clamp(0.5rem, 1vh, 0.75rem) 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }

              // 表格样式
              table {
                width: 100%;
                max-width: 100%;
                border-collapse: collapse;
                margin: clamp(1rem, 2vh, 1.5rem) 0;
                font-size: clamp(0.875rem, 1.2vw, 1rem);
                overflow-x: auto;
                display: block;
                white-space: nowrap;

                th, td {
                  border: 1px solid #e0e0e0;
                  padding: clamp(0.5rem, 1vh, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
                  text-align: left;
                  word-wrap: break-word;
                  max-width: 200px;
                  white-space: normal;
                }

                th {
                  background-color: #f8f9fa;
                  font-weight: 600;
                }
              }

              // 分隔线样式
              hr {
                border: none;
                height: 1px;
                background-color: #e0e0e0;
                margin: clamp(1.5rem, 3vh, 2rem) 0;
              }
            }

            // 选中状态样式
            &.trix-focused {
              outline: none;
              box-shadow: inset 0 0 0 2px rgba(66, 185, 131, 0.3);
            }
          }

          // 滚动条美化
          &::-webkit-scrollbar {
            width: clamp(6px, 1vw, 8px);
          }

          &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
            transition: background 0.3s ease;

            &:hover {
              background: #a8a8a8;
            }
          }
        }

        .mainFooter {
          border-top: 1px solid #e0e0e0;
          width: 100%;
          height: clamp(35px, 5vh, 45px);
          min-height: 35px; // 最小高度
          display: flex;
          align-items: center;
          font-size: clamp(0.7rem, 1vw, 0.8rem);
          padding: 0 clamp(0.75rem, 1.5vw, 1rem);
          background-color: #fafafa;
          flex-shrink: 0;

          .addChapterButton {
            padding: clamp(0.25rem, 0.5vh, 0.5rem) clamp(0.75rem, 1.5vw, 1rem);
            font-size: inherit;
            border-radius: clamp(3px, 0.4vw, 5px);
            transition: all 0.3s ease;

            &:hover {
              background-color: #f0f0f0;
              transform: translateY(-1px);
            }
          }

          .bugFix {
            margin-left: auto;
            height: 100%;
            display: flex;
            gap: clamp(0.5rem, 1vw, 0.75rem);
            align-items: center;

            .bugText {
              padding: clamp(0.25rem, 0.5vh, 0.5rem) clamp(0.5rem, 1vw, 0.75rem);
              font-size: inherit;
              border-radius: clamp(3px, 0.4vw, 5px);
              cursor: pointer;
              transition: all 0.3s ease;

              &:hover {
                background-color: #f0f0f0;
                transform: translateY(-1px);
              }
            }
          }
        }
      }
    }
  }
}
.dialog-footer {
  text-align: right;
}
// 命名面板现代化样式
.naming-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    margin: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 18px;
        transition: all 0.3s ease;

        &:hover {
          color: #f0f0f0;
          transform: rotate(90deg);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 70vh;
    overflow-y: auto;
  }
}

.dialog-content {
  display: flex;
  min-height: 500px;
  background: white;
}

.dialog-left {
  display: none;

  :deep(.el-tabs) {
    height: 100%;

    .el-tabs__header {
      margin: 0;
      background: white;
      border-bottom: 1px solid #e5e7eb;

      .el-tabs__nav-wrap {
        &::after {
          display: none;
        }
      }

      .el-tabs__item {
        text-align: center;
        width: 100%;
        padding: 12px 4px;
        border-bottom: 1px solid #f3f4f6;
        transition: all 0.3s ease;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        line-height: 1.2;

        &:hover {
          color: #667eea;
          background: #f3f4ff;
        }

        &.is-active {
          color: #667eea;
          background: linear-gradient(90deg, #f3f4ff 0%, #e8eaff 100%);
          border-right: 3px solid #667eea;
          font-weight: 600;
        }
      }
    }

    .el-tabs__content {
      display: none;
    }
  }
}

.dialog-center {
  flex: 1 1 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: white;

  .category-switcher {
    margin-bottom: 12px;
  }

  h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      width: 4px;
      height: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
      margin-right: 10px;
    }
  }

  .el-tag {
    margin: 6px 8px 6px 0;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
      color: #667eea;
      background: #f3f4ff;
    }

    &.el-tag--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
  }

  .naming-actions {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .el-button {
      height: 44px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;

      &.el-button--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
      }

      &.el-button--success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
      }
    }
  }
}

.dialog-right {
  flex: 1 1 0;
  min-width: 320px;
  padding: 20px 20px 20px 20px;
  background: #f9fafb;
  border-left: 1px solid #e5e7eb;

  h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &::before {
      content: '';
      width: 4px;
      height: 18px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 2px;
      margin-right: 10px;
    }

    .name-count {
      font-size: 12px;
      color: #6b7280;
      background: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 500;
    }
  }
}

.generated-names {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .name-tag {
    margin: 0;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
    color: #374151;
    position: relative;
    overflow: hidden;
    min-height: 40px; // 保证垂直空间充足
    display: flex;
    align-items: center;
    justify-content: space-between;

    // 修正 Element Plus 内部包裹导致的垂直不居中问题
    :deep(.el-tag__content) {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: #10b981;
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
    }

    &.el-tag--success {
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
      border-color: #10b981;
      color: #065f46;

      &:hover {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      }
    }

    .el-button {
      position: relative;
      z-index: 2;
      margin-left: 8px;

      &:hover {
        transform: scale(1.1);
      }
    }

    // 为名称添加渐变背景效果
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      transition: left 0.6s ease;
    }

    &:hover::before {
      left: 100%;
    }
  }

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;

    &:hover {
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    }
  }
}

.random-name-btn {
  margin-top: 16px;

  .el-button {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
    color: white;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }
  }
}

.batch-and-strategy {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 10px;
}

.batch-controls {
  display: flex;
  align-items: center;
  gap: 8px;

  .label {
    color: #6b7280;
    font-size: 12px;
  }
}

.strategy-controls {
  display: flex;
  align-items: center;
  gap: 10px;

  .label {
    color: #6b7280;
    font-size: 12px;
    margin-right: 4px;
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .dialog-content {
    flex-direction: column;
    min-height: auto;
    max-height: 60vh;
  }

  .dialog-left,
  .dialog-center,
  .dialog-right {
    width: 100%;
    border: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .dialog-left {
    :deep(.el-tabs__header) {
      .el-tabs__nav {
        display: flex;

        .el-tabs__item {
          width: auto;
          flex: 1;
          border-bottom: none;
        }
      }
    }
  }

  .generated-names {
    max-height: 200px;
  }
}

// 新增UI元素样式
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  p {
    margin: 8px 0;
    color: #6b7280;
    font-size: 14px;

    &.empty-hint {
      font-size: 12px;
      color: #9ca3af;
    }
  }
}

.name-text {
  flex: 1;
  margin-right: 8px;
  font-weight: 500;
  line-height: 1.4; // 提升可读性，避免被顶部裁切
}

.name-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;

  .el-button {
    padding: 4px;
    min-height: 24px;
    width: 24px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: scale(1.1);
    }
  }
}

.name-tag:hover .name-actions {
  opacity: 1;
}

.quick-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  justify-content: center;

  .el-button {
    height: 32px;
    padding: 0 12px;
    font-size: 12px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

// 动画效果
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.name-tag {
  animation: slideInRight 0.3s ease-out;

  &:nth-child(even) {
    animation-delay: 0.05s;
  }

  &:nth-child(3n) {
    animation-delay: 0.1s;
  }
}

.empty-state {
  animation: fadeIn 0.5s ease-out;
}


.save-status {
  position: fixed;
  bottom: clamp(1rem, 2vh, 1.5rem);
  right: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(6px, 1vh, 8px) clamp(12px, 2vw, 16px);
  border-radius: clamp(4px, 0.5vw, 8px);
  font-size: clamp(0.7rem, 1vw, 0.8rem);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  transition: all 0.3s ease;

  &.saving {
    background-color: rgba(64, 158, 255, 0.9);
    color: white;
  }

  &.saved {
    background-color: rgba(103, 194, 58, 0.9);
    color: white;
  }

  &.error {
    background-color: rgba(245, 108, 108, 0.9);
    color: white;
  }
}

// 编辑器工具栏样式
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  padding: clamp(0.5rem, 1vh, 0.75rem) clamp(1rem, 2vw, 1.5rem);
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  border-radius: clamp(4px, 0.5vw, 8px) clamp(4px, 0.5vw, 8px) 0 0;
  flex-wrap: wrap;
  min-height: clamp(40px, 6vh, 50px);

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: clamp(4px, 0.8vw, 8px);
    padding-right: clamp(8px, 1.5vw, 16px);
    border-right: 1px solid #d0d0d0;

    &:last-child {
      border-right: none;
    }

    .toolbar-label {
      font-size: clamp(0.7rem, 1vw, 0.8rem);
      color: #666;
      font-weight: 500;
      white-space: nowrap;
    }

    .el-button {
      height: clamp(24px, 3.5vh, 32px);
      min-width: clamp(24px, 3vw, 32px);
      padding: 0 clamp(4px, 0.8vw, 8px);
      font-size: clamp(0.65rem, 0.9vw, 0.75rem);

      &.is-active {
        background-color: #42b983;
        color: white;
        border-color: #42b983;
      }
    }

    .el-input-number {
      width: clamp(60px, 8vw, 100px);

      :deep(.el-input__inner) {
        height: clamp(24px, 3.5vh, 32px);
        font-size: clamp(0.7rem, 1vw, 0.8rem);
      }
    }

    .el-color-picker {
      width: clamp(24px, 3.5vh, 32px);
      height: clamp(24px, 3.5vh, 32px);

      :deep(.el-color-picker__trigger) {
        width: 100%;
        height: 100%;
        border-radius: clamp(3px, 0.4vw, 5px);
      }
    }
  }
}

// 浮动面板内容样式优化
.panel-content {
  height: calc(100% - clamp(40px, 6vh, 60px)); // 减去标题栏高度
  overflow-y: auto;
  padding: clamp(0.75rem, 1.5vh, 1rem);

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: clamp(4px, 0.8vw, 6px);
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
    transition: background 0.3s ease;

    &:hover {
      background: #a8a8a8;
    }
  }

  // 设置面板样式
  .settings-section {
    margin-bottom: clamp(1rem, 2vh, 1.5rem);

    .settings-title {
      font-size: clamp(0.8rem, 1.2vw, 1rem);
      font-weight: 600;
      color: #333;
      margin-bottom: clamp(0.5rem, 1vh, 0.75rem);
      padding-bottom: clamp(4px, 0.8vh, 8px);
      border-bottom: 1px solid #e0e0e0;
    }

    .settings-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: clamp(0.75rem, 1.5vh, 1rem);
      padding: clamp(0.5rem, 1vh, 0.75rem);
      background-color: #f8f9fa;
      border-radius: clamp(4px, 0.5vw, 8px);
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #f0f2f5;
      }

      .settings-label {
        font-size: clamp(0.7rem, 1vw, 0.8rem);
        color: #666;
        flex: 1;
      }

      .settings-control {
        flex-shrink: 0;
        margin-left: clamp(0.5rem, 1vw, 0.75rem);

        .el-slider {
          width: clamp(80px, 12vw, 120px);

          :deep(.el-slider__runway) {
            height: 4px;
          }
        }

        .el-switch {
          transform: scale(0.9);
        }
      }
    }
  }

  // 字符统计样式
  .char-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: clamp(0.75rem, 1.5vh, 1rem);
    margin-bottom: clamp(1rem, 2vh, 1.5rem);

    .stat-item {
      padding: clamp(0.75rem, 1.5vh, 1rem);
      background-color: #f8f9fa;
      border-radius: clamp(4px, 0.5vw, 8px);
      text-align: center;
      border-left: 3px solid #42b983;

      .stat-value {
        font-size: clamp(1.2rem, 2vw, 1.5rem);
        font-weight: 600;
        color: #42b983;
        margin-bottom: 0.25rem;
      }

      .stat-label {
        font-size: clamp(0.65rem, 0.9vw, 0.75rem);
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }
}

.rightTabContent {
  // 通用面板样式
  .panel-header,
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    margin-bottom: 15px;
    border-bottom: 1px solid #eaecef;

    span {
      font-size: 16px;
      font-weight: bold;
    }

    .close-btn {
      padding: 6px;
    }
  }

  .panel-content {
    height: calc(100% - 50px); // 减去标题栏高度
    overflow-y: auto;
  }
}

// Markdown预览面板特殊样式
.rightTabContent.markdown-preview {
  width: 700px !important; /* 预览面板宽度更宽 */
  background-color: #fdfdfd;
  border-left: 1px solid #ececec;
  padding: 20px 30px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;

  :deep(h1) {
    font-size: 2em;
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }

  :deep(h2) {
    font-size: 1.5em;
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }

  :deep(h3) {
    font-size: 1.25em;
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  :deep(p) {
    margin: 1em 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 2em;
    margin: 1em 0;
  }

  :deep(blockquote) {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    color: #666;
    margin: 1em 0;
  }

  :deep(code) {
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
  }

  :deep(pre) {
    background-color: #f6f8fa;
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

/* 修复预览面板显示问题 */
.rightTabContent[v-show='true'],
.rightTabContent.markdown-preview[v-show='true'] {
  transform: translateX(0) !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

@keyframes bookRotate {
  0% {
    transform: rotateY(0deg) rotateX(20deg);
  }
  100% {
    transform: rotateY(360deg) rotateX(20deg);
  }
}

@keyframes dots {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// 响应式断点 - DraftDetail组件专用
@media screen and (max-width: 1400px) {
  .main {
    .aside {
      width: clamp(220px, 22vw, 300px);
    }

    .mainContent .mainRight {
      width: clamp(35px, 4.5vw, 50px);
    }

    .mainLeft {
      .contentDetail {
        :deep(trix-editor) {
          min-height: clamp(250px, 50vh, 700px);
          font-size: clamp(0.8rem, 1.1vw, 0.95rem);
        }
      }

      .mainFooter {
        .bugFix {
          gap: clamp(4px, 0.8vw, 6px);
        }
      }
    }
  }

  }

@media screen and (max-width: 1200px) {
  .main {
    flex-direction: column;

    .aside {
      width: 100%;
      height: clamp(180px, 25vh, 280px);
      border-right: none;
      border-bottom: 1px solid #e0e0e0;

      .asideContent {
        flex-direction: row;
        overflow-x: auto;
        padding: clamp(0.75rem, 1.5vh, 1rem);
        gap: clamp(0.5rem, 1vw, 0.75rem);

        .el-tree {
          min-width: clamp(250px, 30vw, 350px);
          flex-shrink: 0;

          :deep(.el-tree-node__content) {
            height: clamp(28px, 4vh, 36px);
            padding: 0 clamp(4px, 0.8vw, 8px);
          }
        }

        .addRow {
          min-width: 150px;
          height: clamp(32px, 5vh, 40px);
        }
      }
    }

    .mainContent {
      .mainRight {
        width: clamp(32px, 4vw, 45px);

        .right-tabs .rightTabContent {
          width: clamp(280px, 35vw, 550px);
          right: clamp(32px, 4vw, 45px);
        }
      }

      .mainLeft {
        .contentDetail {
          :deep(trix-editor) {
            min-height: clamp(280px, 55vh, 600px);
            padding: clamp(0.75rem, 1.5vh, 1.25rem);
            font-size: clamp(0.85rem, 1.1vw, 0.95rem);

            .trix-content {
              h1 { font-size: clamp(1.3rem, 2.5vw, 1.8rem); }
              h2 { font-size: clamp(1.1rem, 2vw, 1.5rem); }
              h3 { font-size: clamp(1rem, 1.8vw, 1.3rem); }
              h4 { font-size: clamp(0.9rem, 1.6vw, 1.15rem); }
              h5 { font-size: clamp(0.85rem, 1.5vw, 1rem); }
              h6 { font-size: clamp(0.75rem, 1.3vw, 0.9rem); }
            }
          }
        }

        .mainFooter {
          height: clamp(30px, 4.5vh, 40px);
          padding: 0 clamp(0.5rem, 1vw, 0.75rem);
          font-size: clamp(0.65rem, 0.9vw, 0.75rem);

          .bugFix {
            gap: clamp(3px, 0.6vw, 5px);

            .bugText {
              padding: clamp(2px, 0.4vh, 4px) clamp(4px, 0.8vw, 6px);
            }
          }
        }
      }
    }
  }

  
  .editor-toolbar {
    padding: clamp(0.4rem, 0.8vh, 0.6rem) clamp(0.75rem, 1.5vw, 1rem);
    gap: clamp(6px, 1vw, 12px);
    min-height: clamp(35px, 5vh, 45px);

    .toolbar-section {
      gap: clamp(3px, 0.6vw, 6px);
      padding-right: clamp(6px, 1vw, 12px);

      .el-button {
        height: clamp(20px, 2.5vh, 26px);
        min-width: clamp(20px, 2.5vw, 26px);
        font-size: clamp(0.6rem, 0.8vw, 0.7rem);
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .header {
    height: clamp(50px, 8vh, 70px);
    padding: 0 0.5rem;

    .rightHeader {
      .el-button {
        height: clamp(24px, 5vh, 32px);
        font-size: clamp(0.65rem, 0.9vw, 0.75rem);
        padding: 0 clamp(0.4rem, 0.8vw, 0.5rem);
      }
    }
  }

  .main {
    .aside {
      height: clamp(160px, 22vh, 220px);

      .asideContent {
        padding: clamp(0.5rem, 1vh, 0.75rem);
        gap: clamp(0.4rem, 0.8vw, 0.6rem);

        .addRow {
          height: clamp(28px, 5vh, 36px);

          button {
            font-size: clamp(0.65rem, 0.9vw, 0.75rem);
          }
        }

        .el-tree {
          :deep(.el-tree-node__content) {
            height: clamp(24px, 3.5vh, 32px);
            padding: 0 clamp(3px, 0.6vw, 6px);

            .custom-node {
              span {
                font-size: clamp(0.7rem, 1vw, 0.8rem);
              }
            }
          }
        }
      }
    }

    .mainContent {
      .mainRight {
        width: clamp(28px, 3.5vw, 38px);
        gap: clamp(0.6rem, 1.2vh, 0.8rem);

        .right-tabs .rightTabContent {
          width: clamp(230px, 40vw, 380px);
          height: clamp(230px, 50vh, calc(100vh - 90px));
          right: clamp(28px, 3.5vw, 38px);
          top: clamp(65px, 8vh, 95px);
          padding: clamp(0.6rem, 1.2vh, 0.8rem);
          border-radius: clamp(6px, 1vw, 12px) 0 0 clamp(6px, 1vw, 12px);
        }
      }

      .mainLeft {
        .contentDetail {
          :deep(trix-editor) {
            min-height: clamp(260px, 50vh, 500px);
            padding: clamp(0.6rem, 1.2vh, 0.8rem);
            font-size: clamp(0.8rem, 1.1vw, 0.9rem);

            .trix-content {
              h1 { font-size: clamp(1.2rem, 2.2vw, 1.6rem); }
              h2 { font-size: clamp(1rem, 1.8vw, 1.4rem); }
              h3 { font-size: clamp(0.9rem, 1.6vw, 1.2rem); }
              h4 { font-size: clamp(0.85rem, 1.4vw, 1.1rem); }
              h5 { font-size: clamp(0.8rem, 1.3vw, 1rem); }
              h6 { font-size: clamp(0.7rem, 1.2vw, 0.85rem); }

              p {
                margin: clamp(0.6rem, 1.2vh, 0.8rem) 0;
              }

              ul, ol {
                padding-left: clamp(1.2rem, 2.5vw, 1.5rem);
                margin: clamp(0.4rem, 0.8vh, 0.6rem) 0;
              }

              blockquote {
                margin: clamp(0.8rem, 1.5vh, 1.2rem) 0;
                padding: clamp(0.6rem, 1.2vh, 0.8rem) clamp(0.8rem, 1.5vw, 1rem);
                border-left-width: clamp(2px, 0.3vw, 3px);
              }

              pre {
                margin: clamp(0.8rem, 1.5vh, 1.2rem) 0;
                padding: clamp(0.8rem, 1.5vh, 1rem);
                font-size: clamp(0.75rem, 1vw, 0.85rem);
              }

              img {
                margin: clamp(0.4rem, 0.8vh, 0.6rem) 0;
              }
            }
          }
        }

        .mainFooter {
          height: clamp(28px, 4vh, 38px);
          padding: 0 clamp(0.4rem, 0.8vw, 0.6rem);
          font-size: clamp(0.6rem, 0.85vw, 0.7rem);

          .addChapterButton {
            padding: clamp(2px, 0.4vh, 3px) clamp(0.5rem, 1vw, 0.6rem);
          }

          .bugFix {
            gap: clamp(2px, 0.4vw, 3px);

            .bugText {
              padding: clamp(2px, 0.4vh, 3px) clamp(3px, 0.6vw, 4px);
              font-size: inherit;
            }
          }
        }
      }
    }
  }

  
  .editor-toolbar {
    padding: clamp(0.3rem, 0.6vh, 0.4rem) clamp(0.5rem, 1vw, 0.75rem);
    gap: clamp(4px, 0.8vw, 8px);
    min-height: clamp(30px, 4.5vh, 40px);

    .toolbar-section {
      gap: clamp(2px, 0.4vw, 4px);
      padding-right: clamp(4px, 0.8vw, 8px);

      .toolbar-label {
        font-size: clamp(0.6rem, 0.8vw, 0.7rem);
      }

      .el-button {
        height: clamp(18px, 2.2vh, 24px);
        min-width: clamp(18px, 2.2vw, 24px);
        font-size: clamp(0.55rem, 0.75vw, 0.65rem);
        padding: 0 clamp(2px, 0.4vw, 4px);
      }

      .el-input-number {
        width: clamp(50px, 6vw, 70px);

        :deep(.el-input__inner) {
          height: clamp(18px, 2.2vh, 24px);
          font-size: clamp(0.6rem, 0.8vw, 0.7rem);
        }
      }

      .el-color-picker {
        width: clamp(18px, 2.2vh, 24px);
        height: clamp(18px, 2.2vh, 24px);
      }
    }
  }

  .save-status {
    bottom: clamp(0.8rem, 1.5vh, 1rem);
    right: clamp(0.8rem, 1.5vw, 1rem);
    padding: clamp(4px, 0.8vh, 6px) clamp(8px, 1.5vw, 12px);
    font-size: clamp(0.6rem, 0.85vw, 0.7rem);
  }
}

@media screen and (max-width: 480px) {
  .content {
    padding: 0 clamp(0.125rem, 0.5vw, 0.25rem);
  }

  .header {
    height: clamp(55px, 9vh, 75px);
    flex-wrap: wrap;
    padding: 0 clamp(0.25rem, 0.8vw, 0.5rem);

    .rightHeader {
      width: 100%;
      justify-content: center;
      margin-top: clamp(0.25rem, 0.5vh, 0.4rem);
      gap: clamp(0.25rem, 0.6vw, 0.4rem);

      .el-button {
        height: clamp(20px, 3.5vh, 28px);
        font-size: clamp(0.55rem, 0.8vw, 0.65rem);
        padding: 0 clamp(0.3rem, 0.7vw, 0.4rem);
      }
    }
  }

  .main {
    .aside {
      height: clamp(140px, 18vh, 180px);

      .asideContent {
        flex-direction: column;
        padding: clamp(0.3rem, 0.8vh, 0.5rem);
        gap: clamp(0.3rem, 0.8vw, 0.5rem);

        .directory span,
        .bookSetInfo {
          font-size: clamp(0.55rem, 0.85vw, 0.65rem);
        }

        .el-tree :deep(.el-tree-node__content) {
          height: clamp(22px, 3vh, 28px);
          padding: 0 clamp(2px, 0.4vw, 4px);

          .custom-node {
            span {
              font-size: clamp(0.6rem, 0.9vw, 0.7rem);
            }

            .el-image {
              width: clamp(10px, 1.5vh, 12px);
              height: clamp(10px, 1.5vh, 12px);
              margin-right: clamp(2px, 0.3vw, 3px);
            }
          }
        }

        .addRow {
          height: clamp(24px, 4vh, 32px);
          gap: clamp(0.2rem, 0.5vw, 0.3rem);

          button {
            font-size: clamp(0.55rem, 0.8vw, 0.65rem);
            padding: 0 clamp(0.3rem, 0.7vw, 0.4rem);
          }
        }
      }
    }

    .mainContent {
      .mainRight {
        width: clamp(22px, 2.5vw, 30px);
        gap: clamp(0.4rem, 0.8vh, 0.6rem);

        .right-tabs .rightTabContent {
          width: calc(100vw - clamp(22px, 2.5vw, 30px));
          height: clamp(200px, 55vh, calc(100vh - 70px));
          right: clamp(22px, 2.5vw, 30px);
          top: clamp(55px, 8vh, 85px);
          border-radius: clamp(6px, 1vw, 10px) clamp(6px, 1vw, 10px) 0 0;
          padding: clamp(0.5rem, 1vh, 0.6rem);
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.12);
        }
      }

      .mainLeft {
        .contentDetail {
          :deep(trix-editor) {
            min-height: clamp(240px, 45vh, 400px);
            padding: clamp(0.4rem, 1vh, 0.6rem);
            font-size: clamp(0.75rem, 1.1vw, 0.85rem);
            line-height: 1.6;

            .trix-content {
              h1 { font-size: clamp(1.1rem, 2vw, 1.4rem); }
              h2 { font-size: clamp(0.95rem, 1.6vw, 1.25rem); }
              h3 { font-size: clamp(0.85rem, 1.4vw, 1.1rem); }
              h4 { font-size: clamp(0.8rem, 1.3vw, 1rem); }
              h5 { font-size: clamp(0.75rem, 1.2vw, 0.9rem); }
              h6 { font-size: clamp(0.65rem, 1.1vw, 0.8rem); }

              p {
                margin: clamp(0.5rem, 1vh, 0.7rem) 0;
                font-size: inherit;
                line-height: 1.6;
              }

              ul, ol {
                padding-left: clamp(1rem, 2vw, 1.2rem);
                margin: clamp(0.3rem, 0.7vh, 0.5rem) 0;

                li {
                  margin: clamp(0.2rem, 0.4vh, 0.3rem) 0;
                }
              }

              blockquote {
                margin: clamp(0.6rem, 1.2vh, 0.9rem) 0;
                padding: clamp(0.5rem, 1vh, 0.6rem) clamp(0.6rem, 1.2vw, 0.8rem);
                border-left-width: clamp(2px, 0.3vw, 3px);
                font-size: clamp(0.7rem, 1vw, 0.8rem);
              }

              pre {
                margin: clamp(0.6rem, 1.2vh, 0.9rem) 0;
                padding: clamp(0.6rem, 1.2vh, 0.8rem);
                font-size: clamp(0.65rem, 1vw, 0.75rem);
                line-height: 1.4;
                overflow-x: auto;
              }

              code {
                font-size: clamp(0.6rem, 0.9vw, 0.7rem);
                padding: 0.1em 0.3em;
              }

              a {
                font-size: inherit;
              }

              img {
                margin: clamp(0.3rem, 0.7vh, 0.5rem) 0;
                border-radius: clamp(3px, 0.5vw, 6px);
              }

              table {
                font-size: clamp(0.7rem, 1vw, 0.8rem);

                th, td {
                  padding: clamp(0.3rem, 0.7vh, 0.5rem) clamp(0.4rem, 0.8vw, 0.6rem);
                }
              }

              hr {
                margin: clamp(1rem, 1.5vh, 1.3rem) 0;
              }
            }
          }
        }

        .mainFooter {
          height: clamp(25px, 3.5vh, 35px);
          padding: 0 clamp(0.3rem, 0.7vw, 0.4rem);
          font-size: clamp(0.5rem, 0.75vw, 0.6rem);

          .addChapterButton {
            padding: clamp(1px, 0.3vh, 2px) clamp(0.3rem, 0.7vw, 0.4rem);
            font-size: inherit;
          }

          .bugFix {
            gap: clamp(1px, 0.3vw, 2px);

            .bugText {
              padding: clamp(1px, 0.3vh, 2px) clamp(2px, 0.4vw, 3px);
              font-size: inherit;
            }
          }
        }
      }
    }
  }

  
  .editor-toolbar {
    padding: clamp(0.2rem, 0.4vh, 0.3rem) clamp(0.3rem, 0.7vw, 0.4rem);
    gap: clamp(2px, 0.4vw, 4px);
    min-height: clamp(25px, 3.5vh, 35px);

    .toolbar-section {
      gap: clamp(1px, 0.2vw, 2px);
      padding-right: clamp(2px, 0.4vw, 4px);

      .toolbar-label {
        font-size: clamp(0.5rem, 0.7vw, 0.6rem);
        display: none; // 小屏幕隐藏标签节省空间
      }

      .el-button {
        height: clamp(14px, 1.8vh, 20px);
        min-width: clamp(14px, 1.8vw, 20px);
        font-size: clamp(0.45rem, 0.65vw, 0.55rem);
        padding: 0 clamp(1px, 0.2vw, 2px);
        border-radius: 2px;
      }

      .el-input-number {
        width: clamp(40px, 5vw, 55px);

        :deep(.el-input__inner) {
          height: clamp(14px, 1.8vh, 20px);
          font-size: clamp(0.5rem, 0.7vw, 0.6rem);
        }
      }

      .el-color-picker {
        width: clamp(14px, 1.8vh, 20px);
        height: clamp(14px, 1.8vh, 20px);

        :deep(.el-color-picker__trigger) {
          border-radius: 2px;
        }
      }
    }
  }

  .save-status {
    bottom: clamp(0.5rem, 1vh, 0.7rem);
    right: clamp(0.5rem, 1vw, 0.7rem);
    padding: clamp(3px, 0.6vh, 4px) clamp(6px, 1.2vw, 8px);
    font-size: clamp(0.5rem, 0.7vw, 0.6rem);
    border-radius: clamp(3px, 0.5vw, 6px);
  }

  // 浮动面板内容优化
  .panel-content {
    padding: clamp(0.4rem, 0.8vh, 0.5rem);

    .settings-section {
      .settings-title {
        font-size: clamp(0.7rem, 1vw, 0.8rem);
        margin-bottom: clamp(0.3rem, 0.6vh, 0.4rem);
      }

      .settings-item {
        padding: clamp(0.3rem, 0.6vh, 0.4rem);
        margin-bottom: clamp(0.5rem, 1vh, 0.6rem);

        .settings-label {
          font-size: clamp(0.6rem, 0.8vw, 0.7rem);
        }

        .settings-control {
          .el-slider {
            width: clamp(60px, 8vw, 80px);
          }
        }
      }
    }

    .char-stats {
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: clamp(0.4rem, 0.8vh, 0.5rem);

      .stat-item {
        padding: clamp(0.4rem, 0.8vh, 0.5rem);

        .stat-value {
          font-size: clamp(0.9rem, 1.5vw, 1.1rem);
        }

        .stat-label {
          font-size: clamp(0.5rem, 0.7vw, 0.6rem);
        }
      }
    }
  }

  // 优化Markdown预览在小屏幕上的显示
  .rightTabContent.markdown-preview {
    width: 100% !important;
    padding: clamp(0.5rem, 1vh, 0.6rem) !important;

    :deep(h1) {
      font-size: clamp(1.1rem, 1.8vw, 1.3rem);
      margin: clamp(0.8rem, 1.2vh, 1rem) 0 clamp(0.4rem, 0.6vh, 0.5rem) 0;
    }

    :deep(h2) {
      font-size: clamp(0.95rem, 1.5vw, 1.15rem);
      margin: clamp(0.7rem, 1vh, 0.9rem) 0 clamp(0.3rem, 0.5vh, 0.4rem) 0;
    }

    :deep(h3) {
      font-size: clamp(0.85rem, 1.3vw, 1rem);
      margin: clamp(0.6rem, 0.9vh, 0.8rem) 0 clamp(0.25rem, 0.4vh, 0.3rem) 0;
    }

    :deep(p) {
      font-size: clamp(0.7rem, 1vw, 0.8rem);
      margin: clamp(0.5rem, 0.8vh, 0.6rem) 0;
    }

    :deep(ul), :deep(ol) {
      padding-left: clamp(1rem, 1.5vw, 1.2rem);
    }

    :deep(blockquote) {
      padding: clamp(0.4rem, 0.8vh, 0.5rem) clamp(0.5rem, 1vw, 0.7rem);
      font-size: clamp(0.65rem, 0.9vw, 0.75rem);
    }

    :deep(pre) {
      padding: clamp(0.5rem, 1vh, 0.6rem);
      font-size: clamp(0.6rem, 0.9vw, 0.7rem);
    }
  }
}

// 查找替换相关样式
.find-replace-panel {
  width: 320px;
  max-width: 90vw;

  .panel-header {
    padding: 16px 16px 8px 16px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .panel-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .input-label {
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        margin-bottom: 2px;
      }

      .search-input,
      .replace-input {
        :deep(.el-input__wrapper) {
          border-radius: 6px;
          box-shadow: 0 0 0 1px #dcdfe6;
          transition: all 0.2s ease;

          &:hover {
            border-color: #c0c4cc;
          }

          &:focus-within {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
          }
        }

        .search-icon {
          color: #c0c4cc;
        }
      }
    }

    .search-info {
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .info-icon {
          color: #409eff;
          font-size: 16px;
        }

        .info-text {
          font-size: 13px;
          color: #1e40af;

          strong {
            font-weight: 600;
            color: #0052d9;
          }
        }
      }
    }

    .navigation-section {
      .nav-buttons {
        display: flex;
        gap: 8px;
        justify-content: space-between;

        .nav-btn {
          flex: 1;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;

          .el-icon {
            font-size: 14px;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    .action-section {
      .action-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;

        .action-btn {
          flex: 1;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;

          .el-icon {
            font-size: 14px;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }

      .book-replace-section {
        .book-replace-btn {
          width: 100%;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;

          .el-icon {
            font-size: 14px;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }

    .no-results {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #fef7e6;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      color: #d97706;
      font-size: 13px;

      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .find-replace-panel {
    width: 280px;

    .panel-content {
      gap: 12px;
      padding: 12px;

      .input-group {
        .input-label {
          font-size: 12px;
        }
      }

      .search-info {
        padding: 10px;

        .info-item {
          gap: 6px;

          .info-icon {
            font-size: 14px;
          }

          .info-text {
            font-size: 12px;
          }
        }
      }

      .nav-buttons,
      .action-buttons {
        gap: 6px;
      }

      .nav-btn,
      .action-btn,
      .book-replace-btn {
        font-size: 11px;
      }
    }
  }
}

// 空状态提示样式
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #909399;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 13px;

  .el-icon {
    font-size: 16px;
  }
}
</style>
