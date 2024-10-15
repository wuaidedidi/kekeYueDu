<template>
  <div class="box">
    <div class="titlebar">
      <div class="tagList">
        <el-tag
          v-for="(tag, index) in tags"
          :key="tag.name"
          :type="tag.type"
          round
          :closable="tag.TagId > 2"
          :class="[tag.TagId === selectedMenu ? 'flash-tag' : 'gradient-tag']"
          @click="
            () => {
              console.log(tag)
              if (tag.TagId <= 2 && tag.TagId != 0 && selectedMenu <= 2) {
                return
              }
              console.log(tag.path)
              menuStore.setSelectedMenu(tag.TagId)
              changeChildrenRouterPath(tag.path)
            }
          "
          @close="closeTag(tag)"
          size="large"
        >
          {{ tag.name }}
        </el-tag>
        <div class="dragArea"></div>
      </div>
      <div class="menuBar">
        <ElButton id="minimize-btn" @click="miniWindowClick">_ </ElButton>
        <ElButton id="maximize-btn" @click="maxWindowClick">[ ]</ElButton>
        <ElButton id="close-btn" @click="closeWindowClick">X</ElButton>
      </div>
    </div>
    <div class="content">
      <router-view />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMenuStore } from '@/store/menuStore'

import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElButton } from 'element-plus'

const router = useRouter()
const { ipcRenderer } = window
interface Tag {
  name: string
  type: string
  path: string
}

const changeChildrenRouterPath = (path: string) => {
  router.push(path)
}
const allTags = ref([
  { name: '工作台', type: 'success', path: '/workspace/all-books' },
  { name: '工作台', type: 'success', path: '/workspace/writing-stats' },
  { name: '工作台', type: 'success', path: '/workspace/store' },
  { name: '订阅统计', type: 'success', path: '/subscription-stats' },
  { name: '评论管理', type: 'warning', path: '/commitManage' },
  { name: '通知', type: 'info', path: '/writer-consultation' },
  { name: '帮助中心', type: 'warning', path: '/help-center' },
  { name: '反馈', type: 'warning', path: '' },
])
const tags = ref<(Tag & { TagId: number })[]>([
  { ...allTags.value[0], TagId: 0 },
])
const menuStore = useMenuStore()
const { selectedMenu } = storeToRefs(menuStore)

// 监听 selectedMenu 变化
watch(selectedMenu, (newTagId) => {
  // 检查新菜单项是否已经存在于 tags 中
  const existingTag = tags.value.find((tag) => {
    //如果前面有过工作台Tag，现在也有，并且是不相等的两个，那么让后面的tag覆盖前面
    if (tag.TagId <= 2 && newTagId <= 2 && tag.TagId !== newTagId) {
      //后一个tag覆盖前面的tag
      tag.TagId = newTagId
      tag.path = allTags.value[newTagId].path
    }
    return tag.TagId === newTagId
  })

  if (!existingTag) {
    // 不存在则添加新的 tag
    const newTag = { ...allTags.value[newTagId], TagId: newTagId }
    tags.value.push(newTag)
  }
})

const closeTag = (tag: Tag & { TagId: number }) => {
  //关闭，将当前tag从Tags中删除，并且设置前一个tag为选中状态,
  let closeIndex = tags.value.findIndex((temp) => temp.TagId === tag.TagId)

  tags.value.splice(closeIndex, 1)

  closeIndex > 0 ? --closeIndex : closeIndex

  menuStore.setSelectedMenu(tags.value[closeIndex].TagId)
}

onMounted(() => {
  //初始化
})

const miniWindowClick = () => {
  ipcRenderer.invoke('minimize-window')
}
const maxWindowClick = () => {
  ipcRenderer.invoke('maximize-window')
}
const closeWindowClick = () => {
  ipcRenderer.invoke('close-window')
}
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
  justify-content: flex-end;
  padding: 10px;

  height: 100%;
  width: 200px;

  button {
    width: 40px;
    height: 30px;
    background: linear-gradient(45deg, #a03da4, #4c3195, #da55bb);
    color: white;
    border: none;
    cursor: pointer;
    margin-left: 5px;
  }

  button:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transform: scale(1.1);
  }
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
