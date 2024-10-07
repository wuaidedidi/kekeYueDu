<template>
  <div class="content">
    <div class="header">
      <div @click="toggleFullScreen">
        <el-tooltip content="进入全屏CTRL">
          <el-image src="/icon/quanping.png" />
        </el-tooltip>
        全屏
      </div>

      <el-popover placement="bottom-start" :width="400" trigger="click">
        <template #reference>
          <div>
            <el-tooltip content="字体排版">
              <el-image src="/icon/ziti.png" />
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
                <el-image src="/icon/beijing.png" />
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
        <el-image src="/icon/zhongzuo.png" />
      </el-tooltip>
      <el-tooltip content="撤销重做(Ctrl+shift+z)">
        <el-image src="/icon/chexiao.png" />
      </el-tooltip>
      <div @click="">
        <el-tooltip content="一键排版CtrlK">
          <el-image src="/icon/zidongpaiban.png" />
        </el-tooltip>
      </div>
      <div @click="insertDivider">
        <el-tooltip content="分割线">
          <el-image src="/icon/charu.png" />
        </el-tooltip>
        插入
      </div>

      <div class="rightHeader">
        <div>
          <el-popover trigger="click" placement="bottom-start" width="300px">
            <template #reference>
              <div @click="replaceOpenPop">
                <el-tooltip content="查找替换CtrlF">
                  <el-image src="/icon/chazhaotihuan.png" /> </el-tooltip
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
                    ></el-input>
                    <el-button
                      @click="replaceSearchAll"
                      style="margin-left: 8px"
                      >搜索全书</el-button
                    >
                  </div>
                </el-form-item>

                <el-form-item>
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      margin-top: 8px;
                      justify-content: center;
                    "
                  >
                    <div style="width: 76px">替换:</div>

                    <el-input
                      v-model="replaceForm.replaceText"
                      placeholder="输入替换词"
                      style="margin-left: 8px"
                    ></el-input>
                  </div>
                </el-form-item>

                <el-form-item>
                  <el-button @click="goToPrevious">上一个</el-button>
                  <el-button @click="goToNext">下一个</el-button>
                  <el-button @click="replace">替换</el-button>
                  <el-button @click="replaceCurrent">本章替换</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-popover>
        </div>
        <el-tooltip content="取名">
          <el-image src="/icon/jiaosequming.png" />
        </el-tooltip>
        取名
        <el-tooltip content="历史">
          <el-image src="/icon/lishi.png" />
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
            <ElButton type="primary">新建章</ElButton>
            <ElButton>新建卷</ElButton>
          </div>
          <div class="directory">
            <span>目录</span>
            <el-tooltip content="回收站">
              <el-image src="/icon/huishouzhan.png" />
            </el-tooltip>

            <el-tooltip content="导入导出">
              <ElImage src="/icon/daorudaochu.png" />
            </el-tooltip>
            <el-tooltip content="排序">
              <ElImage src="/icon/paixu.png" />
            </el-tooltip>
          </div>
          <div class="bookSetInfo">
            <el-image src="/icon/a-weidakaidewenjianjiajiami.png" />作品相关
          </div>
          <el-tree :data="treeData" :props="defaultProps" :icon="renderIcon" />
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
            <input id="trix-editor" type="hidden" name="content" />
            <trix-editor input="trix-editor"></trix-editor>
          </div>
          <div class="mainFooter">
            <div class="addChapterButton">
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
                <div class="menuItem">
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
                纠错面板
              </div>
            </el-tab-pane>
            <el-tab-pane label="拼字">
              <template #label>
                <div class="menuItem">
                  <el-icon><EditPen /></el-icon>
                  <div>拼字</div>
                </div></template
              >
              <div
                class="rightTabContent"
                v-show="rightTab.PINGZI === currentRightTab"
              >
                拼字面板
                <el-button
                  @click="currentRightTab = rightTab.NOTAB"
                ></el-button></div
            ></el-tab-pane>
            <el-tab-pane label="大纲">
              <template #label>
                <div class="menuItem">
                  <el-icon><Comment /></el-icon>
                  <div>大纲</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.DAGANG === currentRightTab"
              >
                大纲面板
              </div></el-tab-pane
            >
            <el-tab-pane label="角色">
              <template #label>
                <div class="menuItem">
                  <el-icon><Avatar /></el-icon>
                  <div>角色</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.JIAOSE === currentRightTab"
              >
                角色面板
              </div>
            </el-tab-pane>
            <el-tab-pane label="设定">
              <template #label>
                <div class="menuItem">
                  <el-icon><Tools /></el-icon>
                  <div>设定</div>
                </div>
              </template>
              <div
                class="rightTabContent"
                v-show="rightTab.SHEDING === currentRightTab"
              >
                设定面板
              </div></el-tab-pane
            >
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
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
} from '@element-plus/icons-vue'
import {
  ElButton,
  ElImage,
  ElInput,
  ElTree,
  ElPopover,
  ElDialog,
  ElForm,
} from 'element-plus'
import { h, onMounted, ref, toRaw, watch } from 'vue'
import 'trix/dist/trix.css'
import 'trix'

const { ipcRenderer } = window

const searchBook = ref('')

const editContent = ref('')

enum rightTab {
  JIUCUO = 0,
  PINGZI = 1,
  DAGANG = 2,
  JIAOSE = 3,
  SHEDING = 4,
  NOTAB = 999,
}
const currentRightTab = ref<number>(rightTab.NOTAB)
// 树形数据
const treeData = ref([
  {
    label: '作品相关',
    isEmpty: true,
    children: [{ label: '第一章' }, { label: '第二章' }],
  },

  {
    label: '卷一',
    children: [{ label: '第一章' }, { label: '第二章' }],
  },
  {
    label: '卷二',
    children: [{ label: '第三章' }, { label: '第四章' }],
  },
])

// tree的默认属性
const defaultProps = {
  children: 'children',
  label: 'label',
}
interface Tree {
  label: string
  children?: Tree[]
}
// 自定义图标渲染函数
// 自定义图标渲染函数
const renderIcon = (node: any, test: any, abc: any) => {
  const iconSrc = node.children
    ? '/icon/a-weidakaidewenjianjiajiami.png'
    : '/icon/dakaidewenjianjia.png'
  return h(ElImage, {
    src: iconSrc, // 根据是否有子节点来判断使用哪个图标
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
onMounted(async () => {})

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

    console.log(trixEditor)
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
  console.log('启动')
  const contentDetail = document.querySelector('.contentDetail') as HTMLElement
  if (contentDetail) {
    contentDetail.style.backgroundColor = formSettings.value.backgroundColor // 应用背景颜色
  }
}

// const formatText = () => {
//   const trimEditor = document.querySelector('trix-editor') as HTMLElement

//   if (trimEditor) {
//     // 设置字体类型
//     trimEditor.style.fontFamily =
//       formSettings.value.fontType === 'default'
//         ? 'initial'
//         : formSettings.value.fontType

//     // 设置字体大小
//     trimEditor.style.fontSize = `${formSettings.value.fontSize}px`

//     // 设置行高
//     trimEditor.style.lineHeight = `${formSettings.value.lineHeight}em`

//     // 设置段落间距
//     trimEditor.style.marginBottom = formSettings.value.paragraphSpacing
//       ? '1em'
//       : '0'

//     // 设置段落缩进
//     trimEditor.querySelectorAll('p').forEach((p) => {
//       ;(p as HTMLElement).style.textIndent = '2em' // 设置缩进为两个空格
//     })

//     // 处理章节标题
//     const headings = trimEditor.querySelectorAll('h1, h2, h3')
//     headings.forEach((heading) => {
//       ;(heading as HTMLElement).style.fontSize = '1.5em' // 设置章节标题的大小
//       ;(heading as HTMLElement).style.fontWeight = 'bold' // 加粗标题
//       ;(heading as HTMLElement).style.textAlign = 'center' // 居中标题
//     })

//     // 插入分页符
//     const newPage = document.createElement('div')
//     newPage.style.pageBreakAfter = 'always' // 分页符样式
//     trimEditor.appendChild(newPage)
//   }
// }

// // 监听按键事件
// document.addEventListener('keydown', (event) => {
//   if (event.ctrlKey && event.key === 'k') {
//     event.preventDefault() // 防止默认行为
//     formatText() // 调用排版函数
//   }
// })

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
const rightTabClick = (element) => {
  currentRightTab.value = Number(element.index)
}
</script>

<style lang="scss" scoped>
.content {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
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

        .right-tabs {
          el-tab-pane {
            position: relative;
          }

          .rightTabContent {
            position: fixed;
            right: 50px;
            top: 95px;
            background-color: #ffffff;
            width: 500px;
            height: 100%;
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
</style>
