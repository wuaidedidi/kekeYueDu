<template>
  <div class="container">
    <div class="left-panel">
      <div class="logo">
        <el-icon size="25" class="starIcon" style="margin: 0px 10px 0px 30px"
          ><Star /></el-icon
        >可可助手
      </div>
      <div
        class="menuList"
        v-for="(menu, index) in menus"
        @click="selectMenu(index)"
        :key="index"
        :class="{ menuActive: selectedMenu === index }"
      >
        <el-icon size="20" style="margin: 0px 10px 0px 30px"
          ><component :is="menu.preIcon" />
        </el-icon>
        {{ menu.name }}
        <el-icon size="20"
          ><component v-if="menu.fixIcon" :is="menu.fixIcon" />
        </el-icon>
      </div>
    </div>
    <div class="main-panel"><router-view></router-view></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Star,
  Notebook,
  Shop,
  Platform,
  CaretRight,
  Comment,
  Promotion,
  HelpFilled,
  Collection,
} from '@element-plus/icons-vue'
import { DefineComponent } from 'vue'
import { useMenuStore } from '@/store/menuStore'
import { storeToRefs } from 'pinia'
import router from '@/router'

interface Menu {
  name: string
  preIcon: DefineComponent<any, any, any> | null
  fixIcon: DefineComponent<any, any, any> | null
  isEject: boolean
  routePath: string
}

let menus = [
  {
    name: '全部作品',
    preIcon: Star as DefineComponent<any, any, any>,
    fixIcon: null,
    isEject: false,
    routePath: '/workspace/all-books',
  },
  {
    name: '码字统计',
    preIcon: Notebook as DefineComponent<any, any, any>,
    fixIcon: null,
    isEject: false,
    routePath: '/workspace/writing-stats',
  },
  {
    name: '墨水商店',
    preIcon: Shop,
    fixIcon: null,
    isEject: false,
    routePath: '/workspace/store',
  },
  {
    name: '订阅统计',
    preIcon: Platform,
    fixIcon: CaretRight,
    isEject: true,
    routePath: '/subscription-stats',
  },
  {
    name: '评论管理',
    preIcon: Comment,
    fixIcon: CaretRight,
    isEject: true,
    routePath: '/commitManage',
  },
  {
    name: '通知',
    preIcon: Promotion,
    fixIcon: CaretRight,
    isEject: true,
    routePath: '/writer-consultation',
  },
  {
    name: '帮助中心',
    preIcon: HelpFilled,
    fixIcon: null,
    isEject: true,
    routePath: '/help-center',
  },
  {
    name: '反馈',
    preIcon: Collection,
    isEject: false,
    fixIcon: null,
    routePath: '',
  },
]

const menuStore = useMenuStore()
const { selectedMenu } = storeToRefs(menuStore)
const selectMenu = (index: number) => {
  // 通过 Store 更新 selectedMenu
  menuStore.setSelectedMenu(index)
  router.push(menus[index].routePath)
}
</script>
<style lang="scss" scoped>
.container {
  height: 100%;
  width: 100%;
  display: flex;

  .left-panel {
    width: 200px;
    background: repeating-linear-gradient(
      90deg,
      #a6cb91,
      #e293c9 214px,
      #a792e7 222px,
      #9d85e4 222px
    );
    .logo {
      display: flex;
      height: 80px;
      width: 100%;
      justify-content: flex-start;
      align-items: center;

      font-size: 20px;
      font-weight: bolder;

      .starIcon {
        animation: colorChange 3s linear infinite;
      }
    }
    .menuList {
      display: flex;
      height: 40px;
      width: 100%;
      justify-content: flex-start;
      align-items: center;
      font-size: 20px;
      font-weight: bold;

      &:hover {
        background-color: #f0f0f0; /* 悬停时的背景颜色 */
        color: #ff7f50; /* 悬停时的文本颜色 */
      }

      &.menuActive {
        animation: glowEffect 1.5s ease-in-out infinite;
        border-radius: 5px; /* 使光环效果更柔和 */
        animation: checkedMenuChangeAnimal 7s linear infinite;
      }
    }
  }
  .main-panel {
    flex: 1;
  }
}

@keyframes checkedMenuChangeAnimal {
  0% {
    box-shadow:
      0 0 2px #d49d6d,
      0 0 5px #ce9c71,
      0 0 10px #d9ad87;
    background-color: #d1945f;
    color: white;
  }
  50% {
    box-shadow:
      0 0 2px #750983,
      0 0 7px #750983,
      0 0 15px #750983;
    background-color: #750983;
    color: rgb(224, 201, 201);
  }
  100% {
    box-shadow:
      0 0 2px #ffcc00,
      0 0 5px #ffcc00,
      0 0 10px #ffcc00;
    background-color: #dc8c45;
    color: white;
  }
}
@keyframes colorChange {
  0% {
    color: #ffcc00; /* 起始颜色 */
    transform: rotate(0deg);
  }
  50% {
    color: #750983; /* 中间颜色 */
    transform: rotate(180deg);
  }
  100% {
    color: #ffcc00; /* 结束颜色，与起始颜色一致，形成循环 */
    transform: rotate(360deg);
  }
}
</style>
