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

      <!-- 添加Markdown格式按钮 -->
      <div class="markdown-tools">
        <el-tooltip content="标题1">
          <el-button @click="insertHeading(1)">H1</el-button>
        </el-tooltip>
        <el-tooltip content="标题2">
          <el-button @click="insertHeading(2)">H2</el-button>
        </el-tooltip>
        <el-tooltip content="标题3">
          <el-button @click="insertHeading(3)">H3</el-button>
        </el-tooltip>
        <el-tooltip content="无序列表">
          <el-button @click="insertList('unordered')">•</el-button>
        </el-tooltip>
        <el-tooltip content="有序列表">
          <el-button @click="insertList('ordered')">1.</el-button>
        </el-tooltip>
        <el-tooltip content="引用">
          <el-button @click="insertQuote">></el-button>
        </el-tooltip>
        <el-tooltip content="代码块">
          <el-button @click="insertCodeBlock">```</el-button>
        </el-tooltip>
        <el-tooltip content="插入图片">
          <el-upload
            class="upload-demo"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageUploadSuccess"
            :before-upload="beforeImageUpload"
          >
            <el-button>图片</el-button>
          </el-upload>
        </el-tooltip>
      </div>

      <div class="rightHeader">
        <div>
          <el-popover trigger="click" placement="bottom-start" width="300px">
            <template #reference>
              <div @click="replaceOpenPop">
                <el-tooltip content="查找替换CtrlF">
                  <el-image src="./icon/chazhaotihuan.png" /> </el-tooltip
                >查找替换
              </div>
            </template>
            <div>
              <h3>查找替换</h3>

              <el-form>
                <el-form-item>
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    "
                  >
                    <div style="width: 100px">查找:</div>
                    <el-input
                      v-model="replaceForm.searchText"
                      placeholder="输入查找词"
                      style="margin-left: 8px"
                      @change="inputSearchTextHandler"
                    ></el-input>
                    <div class="mb-2">
                      <el-input
                        placeholder="替换为"
                        v-model="replaceForm.replaceText"
                      ></el-input>
                      <el-button
                        @click="handleReplaceInBook"
                        style="margin-left: 8px"
                        >全书替换</el-button
                      >
                    </div>
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-button @click="goToNextMatch">上一个</el-button>
                  <el-button @click="goToPreviousMatch">下一个</el-button>
                  <el-button @click="replace">替换</el-button>
                  <el-button @click="replaceInChapter">本章替换</el-button>
                </el-form-item>
              </el-form>
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
        <div class="mainRight">
          <el-tabs
            tab-position="right"
            style="height: 100%"
            class="right-tabs"
            @tab-click="rightTabClick"
          >
            <el-tab-pane label="纠错">
              <template #label>
                <div
                  class="menuItem"
                  :class="{ active: rightTab.JIUCUO === currentRightTab }"
                >
                  <div>
                    <el-icon><CircleCheckFilled /></el-icon>
                  </div>
                  <div>纠错</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.JIUCUO === currentRightTab"
              >
                <div class="panel-header">
                  <span>纠错面板</span>
                  <el-button
                    @click="currentRightTab = rightTab.NOTAB"
                    type="danger"
                    size="small"
                    circle
                    class="close-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="panel-content">
                  <!-- 纠错面板内容 -->
                  纠错功能区域
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="拼字">
              <template #label>
                <div
                  class="menuItem"
                  :class="{ active: rightTab.PINGZI === currentRightTab }"
                >
                  <el-icon><EditPen /></el-icon>
                  <div>拼字</div>
                </div></template
              >
              <div
                class="rightTabContent"
                v-show="rightTab.PINGZI === currentRightTab"
              >
                <div class="panel-header">
                  <span>拼字面板</span>
                  <el-button
                    @click="currentRightTab = rightTab.NOTAB"
                    type="danger"
                    size="small"
                    circle
                    class="close-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="panel-content">
                  <!-- 拼字面板内容 -->
                  拼字功能区域
                </div>
              </div></el-tab-pane
            >
            <el-tab-pane label="大纲">
              <template #label>
                <div
                  class="menuItem"
                  :class="{ active: rightTab.DAGANG === currentRightTab }"
                >
                  <el-icon><Comment /></el-icon>
                  <div>大纲</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.DAGANG === currentRightTab"
              >
                <div class="panel-header">
                  <span>大纲面板</span>
                  <el-button
                    @click="currentRightTab = rightTab.NOTAB"
                    type="danger"
                    size="small"
                    circle
                    class="close-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="panel-content">
                  <!-- 大纲面板内容 -->
                  大纲功能区域
                </div>
              </div></el-tab-pane
            >
            <el-tab-pane label="角色">
              <template #label>
                <div
                  class="menuItem"
                  :class="{ active: rightTab.JIAOSE === currentRightTab }"
                >
                  <el-icon><Avatar /></el-icon>
                  <div>角色</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.JIAOSE === currentRightTab"
              >
                <div class="panel-header">
                  <span>角色面板</span>
                  <el-button
                    @click="currentRightTab = rightTab.NOTAB"
                    type="danger"
                    size="small"
                    circle
                    class="close-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="panel-content">
                  <!-- 角色面板内容 -->
                  角色功能区域
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="设定">
              <template #label>
                <div
                  class="menuItem"
                  :class="{ active: rightTab.SHEDING === currentRightTab }"
                >
                  <el-icon><Tools /></el-icon>
                  <div>设定</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.SHEDING === currentRightTab"
              >
                <div class="panel-header">
                  <span>设定面板</span>
                  <el-button
                    @click="currentRightTab = rightTab.NOTAB"
                    type="danger"
                    size="small"
                    circle
                    class="close-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="panel-content">
                  <!-- 设定面板内容 -->
                  设定功能区域
                </div>
              </div></el-tab-pane
            >
            <el-tab-pane label="预览">
              <template #label>
                <div
                  class="menuItem"
                  :class="{ active: rightTab.PREVIEW === currentRightTab }"
                >
                  <div>
                    <el-icon><Document /></el-icon>
                  </div>
                  <div>预览</div>
                </div>
              </template>
              <div
                class="rightTabContent markdown-preview"
                v-show="rightTab.PREVIEW === currentRightTab"
              >
                <div class="panel-header">
                  <span>预览内容</span>
                  <el-button
                    @click="currentRightTab = rightTab.NOTAB"
                    type="danger"
                    size="small"
                    circle
                    class="close-btn"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="panel-content" v-html="renderedMarkdown"></div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
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
      <!-- 左边分类标签 -->
      <div class="dialog-left">
        <el-tabs
          v-model="activeTab"
          tab-position="left"
          @tab-click="handleTabClick"
        >
          <el-tab-pane label="人物" name="person"></el-tab-pane>
          <el-tab-pane label="地点" name="place"></el-tab-pane>
          <el-tab-pane label="招式" name="move"></el-tab-pane>
          <el-tab-pane label="装备" name="equipment"></el-tab-pane>
          <el-tab-pane label="怪物" name="monster"></el-tab-pane>
          <el-tab-pane label="道具" name="item"></el-tab-pane>
        </el-tabs>
      </div>

      <!-- 中间部分条件选择与按钮 -->
      <div class="dialog-center">
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
        <div v-if="getNameActiveTab === 'place'">
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
      </div>

      <!-- 右边展示生成的名字 -->
      <div class="dialog-right">
        <h3>生成的名字</h3>
        <div class="generated-names">
          <el-tag
            v-for="(name, index) in generatedNames"
            :key="index"
            type="success"
          >
            {{ name }}
          </el-tag>
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
  Search,
  CircleCheckFilled,
  EditPen,
  Comment,
  Avatar,
  Tools,
  Plus,
  Document,
  Close,
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
import { processText } from '@/utils/sensitiveWordUtils'
import type { TreeNodeData as ElTreeNodeData } from 'element-plus/es/components/tree/src/tree.type'
import { marked } from 'marked'

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

enum rightTab {
  JIUCUO = 0,
  PINGZI = 1,
  DAGANG = 2,
  JIAOSE = 3,
  SHEDING = 4,
  PREVIEW = 5,
  NOTAB = 999,
}
const currentRightTab = ref<number>(rightTab.NOTAB)
const currentVolumeId = ref(0)
const treeData = ref<TreeNode[]>([])

const appLoaded = ref(false)

// 上传地址与鉴权头
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const API_ROOT = API_BASE.endsWith('/api')
  ? API_BASE
  : API_BASE.replace(/\/$/, '') + '/api'
const uploadAction = computed(() => API_ROOT + '/upload')
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

onMounted(async () => {
  // 初始化数据
  await initTreeData()

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

    // 设置键盘事件监听
    document.addEventListener('keydown', handleKeyDown)

    // 设置自动保存
    setupAutoSave()
    setupMarkdownPreview()

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
  replaceDialogVisible.value = true
}

const replaceSearchAll = () => {
  // 实现搜索全书的逻辑
}

const replace = () => {
  // 实现替换的逻辑
}

const goToPrevious = () => {
  // 实现上一个的逻辑
}

const goToNext = () => {
  // 实现下一个的逻辑
}

const replaceCurrent = () => {
  // 实现本章替换的逻辑
}
const rightTabClick = (element: TabsPaneContext) => {
  console.log('标签点击:', element.index, '当前选中:', currentRightTab.value)

  // 如果点击当前已经激活的标签，则关闭它
  if (currentRightTab.value === Number(element.index)) {
    currentRightTab.value = rightTab.NOTAB
    console.log('关闭当前标签')
    return
  }

  // 否则，激活点击的标签
  currentRightTab.value = Number(element.index)
  console.log('激活标签:', currentRightTab.value)

  // 根据标签索引处理不同的功能
  if (currentRightTab.value === rightTab.JIUCUO) {
    console.log('处理纠错功能')
    sensitiveWordHandler()
  } else if (currentRightTab.value === rightTab.PREVIEW) {
    console.log('处理预览功能')
    // 确保DOM已更新后再获取trix-editor的内容
    nextTick(() => {
      console.log('立即更新预览...')
      updateMarkdownPreview()
    })
  }
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

// 改进的保存章节内容函数
const saveChapterContent = async (
  id: number,
  updateContent?: string
): Promise<void> => {
  try {
    // 验证章节ID有效性
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
    return response.data || ''
  } catch (error) {
    console.error('获取章节内容时出错:', error)
    return ''
  }
}

const inputSearchTextHandler = async (currentValue: string) => {
  const chapterContent = getCurrentEditorContent() // 获取章节内容
  currentSearchValue.value = currentValue.trim() // 查找的词语

  if (!currentSearchValue.value) return

  // 正则表达式查找所有匹配项（忽略大小写）
  const regex = new RegExp(currentSearchValue.value, 'gi')
  matches.value = [] // 清空之前的匹配
  let match

  // 查找所有匹配项的起始位置
  while ((match = regex.exec(chapterContent)) !== null) {
    matches.value.push(match.index) // 存储匹配项的位置
  }

  // 高亮第一个匹配项
  highlightCurrentMatch()
}

// 高亮当前匹配的词
const highlightCurrentMatch = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement

  const trixEditorInstance = (trixEditor as any).editor
  const currentPosition = matches.value[currentMatchIndex.value]

  if (currentPosition !== undefined) {
    const searchValue = currentSearchValue.value
    const content = trixEditorInstance.getDocument().toString()

    // 分割内容，将匹配到的部分用 <mark> 标签包裹
    const highlightedContent =
      content.slice(0, currentPosition) +
      `<strong style="background-color: yellow;">` +
      content.slice(currentPosition, currentPosition + searchValue.length) +
      `</strong>` +
      content.slice(currentPosition + searchValue.length)

    // 更新富文本内容
    trixEditorInstance.setSelectedRange([0, content.length]) // 选中所有文本
    trixEditorInstance.deleteInDirection('forward') // 删除所有文本
    trixEditorInstance.insertHTML(highlightedContent) // 插入高亮后的文本
  }
}

// 查找下一个匹配项
const goToNextMatch = () => {
  if (matches.value.length > 0) {
    currentMatchIndex.value =
      (currentMatchIndex.value + 1) % matches.value.length // 循环到下一个匹配项
    highlightCurrentMatch() // 高亮显示
  }
}

// 查找上一个匹配项
const goToPreviousMatch = () => {
  if (matches.value.length > 0) {
    currentMatchIndex.value =
      (currentMatchIndex.value - 1 + matches.value.length) %
      matches.value.length // 循环到上一个匹配项
    highlightCurrentMatch() // 高亮显示
  }
}

const replaceInChapter = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  const trixEditorInstance = (trixEditor as any).editor
  const chapterContent = trixEditorInstance.getDocument().toString() // 获取当前章节内容
  const searchValue = currentSearchValue.value
  const regex = new RegExp(searchValue, 'gi')
  // 替换所有匹配项
  const updatedContent = chapterContent.replace(
    regex,
    replaceForm.value.replaceText
  )
  // 更新富文本内容
  trixEditorInstance.setSelectedRange([0, chapterContent.length])
  trixEditorInstance.deleteInDirection('forward')
  trixEditorInstance.insertHTML(updatedContent)
}

// 全书替换 - 使用现有章节保存API逐个替换
const replaceInBook = async (oldName: string, newName: string) => {
  try {
    console.log('全书替换功能：', oldName, '->', newName)
    // TODO: 实现批量替换逻辑
    // 1. 获取所有章节
    // 2. 对每个章节内容进行替换
    // 3. 逐个保存章节
    ElMessage.info('全书替换功能待实现，请手动替换')
  } catch (error) {
    console.error('替换失败:', error)
    ElMessage.error('替换失败')
  }
}

// 获取全书所有章节的内容
const getAllChapters = async () => {
  try {
    const response = await http.get('/chapters')
    return response.data // 返回章节数据
  } catch (error) {
    console.error('Error fetching chapters:', error)
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

// 设置选中的 tag
const setTag = (key: keyof NameForm, value: string) => {
  getNameform.value[key] = value
}
// 生成随机名字
const generateName = () => {
  const namesPool: NamesPool = {
    china: ['张三', '李四', '王五'],
    japan: ['Sakura', 'Taro', 'Haruto'],
    west: ['John', 'Mary', 'Tom'],
    city: ['Gotham', 'Metropolis', 'Springfield'],
    village: ['Konoha', 'Pallet', 'Whiterun'],
    forest: ['Blackwood', 'Dark Forest', 'Enchanted'],
  }

  let randomName = ''
  if (activeTab.value === 'person') {
    const regionNames = namesPool[getNameform.value.region] || []
    randomName = regionNames[Math.floor(Math.random() * regionNames.length)]
  } else if (activeTab.value === 'place') {
    const placeNames = namesPool[getNameform.value.placeType] || []
    randomName = placeNames[Math.floor(Math.random() * placeNames.length)]
  }

  generatedNames.value.push(randomName)
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

// 插入标题，并在预览模式下更新预览
const insertHeading = (level: number) => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor
    if (!trixEditorInstance) return

    // 获取当前选区位置
    const currentPosition = trixEditorInstance.getSelectedRange()[0]

    // 检查是否需要先插入新行
    if (currentPosition > 0) {
      const content = trixEditorInstance.getDocument().toString()
      if (content[currentPosition - 1] !== '\n') {
        trixEditorInstance.insertString('\n')
      }
    }

    // 插入HTML标题
    trixEditorInstance.insertHTML(`<h${level}>标题${level}</h${level}>`)

    // 如果当前是预览模式，立即更新预览
    if (currentRightTab.value === rightTab.PREVIEW) {
      nextTick(() => {
        updateMarkdownPreview()
      })
    }
  }
}

// 插入列表，使用HTML格式
const insertList = (type: 'ordered' | 'unordered') => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor
    if (!trixEditorInstance) return

    if (type === 'ordered') {
      trixEditorInstance.insertHTML('<ol><li>有序列表项</li></ol>')
    } else {
      trixEditorInstance.insertHTML('<ul><li>无序列表项</li></ul>')
    }

    // 如果当前是预览模式，立即更新预览
    if (currentRightTab.value === rightTab.PREVIEW) {
      nextTick(() => {
        updateMarkdownPreview()
      })
    }
  }
}

// 插入引用，使用HTML格式
const insertQuote = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor
    if (!trixEditorInstance) return

    trixEditorInstance.insertHTML(
      '<blockquote style="border-left: 4px solid #ddd; padding-left: 1em; color: #666;">引用内容</blockquote>'
    )

    // 如果当前是预览模式，立即更新预览
    if (currentRightTab.value === rightTab.PREVIEW) {
      nextTick(() => {
        updateMarkdownPreview()
      })
    }
  }
}

// 插入代码块，使用HTML格式
const insertCodeBlock = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor
    if (!trixEditorInstance) return

    trixEditorInstance.insertHTML(
      '<pre style="background-color: #f6f8fa; padding: 1em; border-radius: 5px;"><code>// 这里是代码块</code></pre>'
    )

    // 如果当前是预览模式，立即更新预览
    if (currentRightTab.value === rightTab.PREVIEW) {
      nextTick(() => {
        updateMarkdownPreview()
      })
    }
  }
}

// 添加快捷键支持
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否按下了Ctrl键
  if (event.ctrlKey) {
    switch (event.key) {
      case '1':
        event.preventDefault()
        insertHeading(1)
        break
      case '2':
        event.preventDefault()
        insertHeading(2)
        break
      case '3':
        event.preventDefault()
        insertHeading(3)
        break
      case 'l':
        event.preventDefault()
        insertList('unordered')
        break
      case 'o':
        event.preventDefault()
        insertList('ordered')
        break
      case 'q':
        event.preventDefault()
        insertQuote()
        break
      case 'k':
        event.preventDefault()
        insertCodeBlock()
        break
    }
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

// 图片上传成功后的处理
const handleImageUploadSuccess = (response: any) => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    const trixEditorInstance = (trixEditor as any).editor
    const imageUrl = response.url // 假设服务器返回图片URL
    const markdownImage = `![图片描述](${imageUrl})`
    trixEditorInstance.insertString(markdownImage)
  }
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
    // 使用trix编辑器的innerHTML获取HTML内容
    return trixEditor.innerHTML
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

// 添加Markdown预览功能
const renderedMarkdown = ref('')

const updateMarkdownPreview = () => {
  try {
    const trixEditor = document.querySelector('trix-editor') as HTMLElement
    if (!trixEditor) {
      renderedMarkdown.value = '<p>预览出错：找不到编辑器元素</p>'
      return
    }

    // 直接使用trix-editor的innerHTML获取内容
    renderedMarkdown.value = trixEditor.innerHTML

    // 调试输出
    console.log('预览内容已更新，长度:', trixEditor.innerHTML.length)
  } catch (error) {
    console.error('预览渲染错误:', error)
    renderedMarkdown.value = '<p>预览出错</p>'
  }
}

// 监听编辑器内容变化，更新预览
const setupMarkdownPreview = () => {
  const trixEditor = document.querySelector('trix-editor') as HTMLElement
  if (trixEditor) {
    // 监听trix-change事件，当编辑器内容变化时更新预览
    trixEditor.addEventListener('trix-change', () => {
      console.log('编辑器内容变化')
      // 如果当前显示的是预览标签页，则更新预览内容
      if (currentRightTab.value === rightTab.PREVIEW) {
        updateMarkdownPreview()
      }
    })

    // 初始加载后自动触发一次预览更新
    nextTick(() => {
      console.log('初始预览更新')
      if (currentRightTab.value === rightTab.PREVIEW) {
        updateMarkdownPreview()
      }
    })

    // 创建一个定时检查器，确保预览面板在激活时能够显示内容
    const previewInterval = setInterval(() => {
      if (currentRightTab.value === rightTab.PREVIEW) {
        updateMarkdownPreview()
      }
    }, 2000) // 每2秒检查一次

    // 为定时器添加数据属性，以便在卸载时清理
    const markerElement = document.createElement('div')
    markerElement.style.display = 'none'
    markerElement.dataset.previewInterval = previewInterval.toString()
    document.body.appendChild(markerElement)
  }
}

// 添加onUnmounted函数来清理资源
onUnmounted(() => {
  // 清理键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)

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
    height: 45px;
    width: 100%;
    display: flex;
    align-items: center;
    border-bottom: 1px lightgray solid;

    .rightHeader {
      display: flex;
      align-items: center;
      margin-left: auto;
    }

    .el-image {
      margin: 0px 5px 0px 20px;
      height: 15px;
      width: 15px;
    }
  }
  .main {
    width: 100%;
    background-color: #ffffff;
    flex: 1;
    display: flex;
    .aside {
      height: 100%;
      width: 300px;

      .asideContent {
        margin: 0 auto;
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 15px;
        height: 100%; /* 可根据需要调整 */
        width: 90%;
        .addRow {
          height: 50px;
          display: flex;
          width: 100%;
          justify-content: center;
          button {
            flex: 1;
          }
        }
        .directory {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          width: 100%;
          .el-image {
            margin-left: 10px;
            height: 15px;
            width: 15px;
          }
          span {
            margin-right: auto;
            color: rgb(159, 152, 152);
            font-size: small;
          }
        }
        .bookSetInfo {
          display: flex;
          justify-content: flex-start;
          width: 100%;
          align-items: center;
          font-size: small;
          .el-image {
            margin-right: 10px;
            height: 15px;
            width: 15px;
          }
        }
        .el-tree {
          width: 100%;
          .custom-node {
            width: 100%;
            height: 20px;

            .el-image {
              height: 15px;
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
      .mainRight {
        height: 100%;
        width: 50px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        background-color: #ffffff;
        align-items: center;
        position: relative;

        .right-tabs {
          .el-tabs__content {
            overflow: visible; /* 允许内容溢出以显示浮动面板 */
          }

          .el-tab-pane {
            position: relative;
          }

          .rightTabContent {
            position: fixed;
            right: 50px;
            top: 95px;
            background-color: #ffffff;
            width: 500px;
            height: calc(100vh - 140px);
            box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
            z-index: 10;
            padding: 15px;
            overflow-y: auto;
            transition:
              transform 0.3s ease-in-out,
              opacity 0.3s ease;
            /* 默认隐藏所有面板 */
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
        .contentDetail {
          /* 你的样式 */
          border: 1px solid lightgray;
          padding: 10px;
          height: 100%; /* 根据需要设置高度 */
          overflow-y: auto; /* 如果内容超过可视区域，允许滚动 */
          line-height: 1.5; /* 默认行间距 */
          max-width: 100%; /* 默认宽度为100% */
        }
        .mainFooter {
          border-top: 1px rgb(167, 163, 163) solid;
          width: 100%;
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 12px;
          .addChapterButton {
            &:hover {
              background-color: rgb(236, 231, 231);
            }
          }
          .bugFix {
            margin-left: auto;
            height: 100%;
            display: flex;
            gap: 10px;
            align-items: center;
            .bugText {
              &:hover {
                background-color: rgb(236, 231, 231);
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
.dialog-content {
  display: flex;
}

.dialog-left {
  width: 20%;
  border-right: 1px solid #ebeef5;
}

.dialog-center {
  width: 50%;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dialog-right {
  width: 30%;
  padding-left: 20px;
}

.generated-names {
  margin-top: 10px;
}

.random-name-btn {
  margin-top: 20px;
}

.markdown-tools {
  display: flex;
  gap: 8px;
  margin-left: 20px;

  .el-button {
    padding: 4px 8px;
    min-width: 32px;
  }

  .upload-demo {
    display: inline-block;
  }
}

.save-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;

  &.saved {
    background-color: #67c23a;
    color: white;
  }

  &.saving {
    background-color: #e6a23c;
    color: white;
  }

  &.unsaved {
    background-color: #f56c6c;
    color: white;
  }

  .last-save-time {
    margin-left: 8px;
    font-size: 12px;
    opacity: 0.8;
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
</style>
