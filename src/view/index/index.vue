<template>
  <div class="box">
    <div class="titlebar">
      <div class="tagList">
        <el-tag
          v-for="(tag, index) in tags"
          :key="tag.name"
          :type="tag.type"
          round
          closable
          :class="[index === checked ? 'flash-tag' : 'gradient-tag']"
          @click="
            () => {
              checked = index
              changeChildrenRouterPath(tag.path)
            }
          "
          size="large"
        >
          {{ tag.name }}
        </el-tag>
        <div class="dragArea"></div>
      </div>

      <div class="menuBar"></div>
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMenuStore } from '@/store/menuStore'
import { useIpcRenderer } from '@vueuse/electron'
import { ElButton } from 'element-plus'

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const ipcRenderer = useIpcRenderer()
const openNewWin = () => {
  ipcRenderer.send('window-new', {
    route: '/helloworld',
    width: 1200,
    height: 1080,
  })
}
interface Tag {
  name: string
  type: string
  path: string
}
const checked = ref(0)

const changeChildrenRouterPath = (path: string) => {
  router.push(path)
}
const allTags = ref([
  { name: '工作台', type: '', path: 'workspace/all-books' },
  { name: '工作台', type: '', path: 'writing-stats' },
  { name: '工作台', type: '', path: 'subscription-stats' },
  { name: '订阅统计', type: 'success', path: 'subscription-stats' },
  { name: '评论管理', type: 'warning', path: 'commitManage' },
  { name: '通知', type: 'info', path: 'writer-consultation' },
  { name: '帮助中心', type: 'warning', path: 'help-center' },
  { name: '反馈', type: 'warning', path: '' },
])
const tags = ref<(Tag & { TagId: number })[]>([])
const menuStore = useMenuStore()
const selectedMenu = useMenuStore().selectedMenu!
const checkTags = computed(() => {
  const temp = allTags.value[selectedMenu]
  //增加tag
  if (tags) tags.value.push()
  //切换tag
  return selectedMenu
})
// let menus = [
//   {
//     name: '全部作品',
//     preIcon: Star as DefineComponent<any, any, any>,
//     fixIcon: null,
//     isEject: false,
//     routePath: 'workspace/all-books',
//   },
//   {
//     name: '码字统计',
//     preIcon: Notebook as DefineComponent<any, any, any>,
//     fixIcon: null,
//     isEject: false,
//     routePath: 'writing-stats',
//   },
//   {
//     name: '墨水商店',
//     preIcon: Shop,
//     fixIcon: null,
//     isEject: false,
//     routePath: 'workspace/store',
//   },
//   {
//     name: '订阅统计',
//     preIcon: Platform,
//     fixIcon: CaretRight,
//     isEject: true,
//     routePath: 'subscription-stats',
//   },
//   {
//     name: '评论管理',
//     preIcon: Comment,
//     fixIcon: CaretRight,
//     isEject: true,
//     routePath: 'commitManage',
//   },
//   {
//     name: '通知',
//     preIcon: Promotion,
//     fixIcon: CaretRight,
//     isEject: true,
//     routePath: 'writer-consultation',
//   },
//   {
//     name: '帮助中心',
//     preIcon: HelpFilled,
//     fixIcon: null,
//     isEject: true,
//     routePath: 'help-center',
//   },
//   {
//     name: '反馈',
//     preIcon: Collection,
//     isEject: false,
//     fixIcon: null,
//     routePath: '',
//   },
// ]
</script>
<style scoped lang="scss">
html,
body {
  height: 100%;
  width: 100%;
  // /* 引用 public 文件夹中的图片 */
  // cursor: url('/star.png'), auto !important;
}
.titlebar {
  display: flex;
  height: 50px;
  width: 100%;
  align-items: center;
  // background: radial-gradient(circle, #02121e, #4824b5, #bc24ac);
  background: repeating-linear-gradient(
    45deg,
    #a6cb91,
    #e293c9 214px,
    #a792e7 222px,
    #9d85e4 222px
  );
}
.tagList {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  flex: 1;
  height: 100%;
}
.dragArea {
  display: flex;
  height: 100%;
  -webkit-app-region: drag; /* 允许拖动窗口 */
  flex: 1;
}
.menuBar {
  display: flex;
  height: 100%;
  width: 200px;
}
.content {
  flex: 1;
  width: 100%;
}
.box {
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

/* 自定义渐变效果 */
.gradient-tag {
  background: linear-gradient(45deg, #02121e, #4824b5, #bc24ac);

  color: white;
  border: none;
  transition: all 0.3s ease;
}

/* 添加悬停的放大和阴影效果 */
.gradient-tag:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.flash-tag {
  animation: flash 3s infinite;
}

@keyframes flash {
  0%,
  100% {
    background-color: #d069c1;
  }
  75% {
    background-color: #a46d97;
  }
  50% {
    background-color: #b76070;
  }
}
</style>
