<template>
  <div class="content">
    <el-carousel
      trigger="click"
      height="200px"
      class="test"
      motion-blur
      type="card"
      cardScale="1.5"
      interval="5000"
    >
      <el-carousel-item v-for="item in carouselPaths2" :key="item">
        <img :src="item" class="carouselImage" />
      </el-carousel-item>
    </el-carousel>
    <div class="addBookEdit">
      <el-button
        style="margin-left: 10px"
        type="primary"
        color="#626aef"
        :icon="Plus"
        >新建作品</el-button
      >
      <el-button :icon="Plus" color="#626aef" plain>新建草稿</el-button>
      <el-button
        style="
          margin-left: auto; /* 将元素推到最右 */
          margin-right: 10px; /* 离容器右边10px */
        "
        :icon="Grid"
        color="#626aef"
        plain
        >书籍管理</el-button
      >
    </div>
    <div class="bookList">
      <div class="book" v-for="item in bookTemplates" :key="item.src">
        <el-image :src="item.src" />
        <div class="bookDescription">
          <div class="description">{{ item.bookName }}</div>
          <div class="iconMore"><setting class="starIcon" /></div>
        </div>
        <div class="textCount">{{ item.fontCount }}万字</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Grid, Plus, Setting } from '@element-plus/icons-vue'
import { ElButton, ElImage } from 'element-plus'
import { ref } from 'vue'

const carouselPaths2 = [
  '/allBooks/banner/carousel1.png',
  '/allBooks/banner/carousel2.png',
  '/allBooks/banner/carousel3.png',
  '/allBooks/banner/carousel4.png',
]
interface book {
  bookName: String
  fontCount: number
  src: string
}
const bookTemplates = ref<book[]>([
  {
    bookName: '虽随便白色大是大非快疯了分开了开放；群里看到',
    fontCount: 1,
    src: '/allBooks/bookList/bookTemplate1.png',
  },
  {
    bookName: '虽随便白色大是大非快疯了分开了开放；群里看到asdasasdasd',
    fontCount: 2,
    src: '/allBooks/bookList/bookTemplate2.png',
  },
  {
    bookName: '虽随便白爱大叔大叔的开了开放；群里看到',
    fontCount: 3.5,
    src: '/allBooks/bookList/bookTemplate3.png',
  },
  {
    bookName: '奥萨达实打实的',
    fontCount: 0.5,
    src: '/allBooks/bookList/bookTemplate4.png',
  },
  {
    bookName: '奥萨达',
    fontCount: 1.6,
    src: '/allBooks/bookList/bookTemplate1.png',
  },

  {
    bookName: '爱上打扫打扫打扫大',
    fontCount: 5.5,
    src: '/allBooks/bookList/bookTemplate2.png',
  },
])
const carouselPaths = ref<String[]>()
</script>
<style lang="scss" scoped>
.content {
  height: 100%;
  width: 90%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;

  .addBookEdit {
    height: 80px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .bookList {
    display: flex;
    flex: 1;
    gap: 30px;
    flex-wrap: wrap; /* 自动换行 */
    justify-content: flex-start;
    .book {
      height: 250px;
      width: calc(20% - 30px);
      display: flex;
      flex-direction: column;

      .el-image {
        display: flex;
        border-radius: 5px;
        height: 150px;
        width: 100%;
        // object-fit: cover; /* 保持图片的宽高比 */
      }
      .bookDescription {
        margin-top: 5px;
        display: flex;
        height: 60px;
        overflow: hidden; /* 溢出隐藏 */
        text-overflow: ellipsis; /* 溢出时显示省略号 */
        text-align: left;
      }
      .description {
        flex: 1;
        height: 100%;
        overflow: hidden; /* 溢出隐藏 */
        text-overflow: ellipsis; /* 溢出时显示省略号 */
        text-align: left;
      }
      .iconMore {
        height: 100%;
        width: 20px;

        .starIcon:hover {
          animation: colorChange 3s linear infinite;
        }
      }
      .textCount {
        margin-top: 10px;
        height: 20px;
        color: rgb(148, 145, 145);
        font-size: small;
        text-align: left;
      }
    }
  }

  .el-carousel {
    margin-top: 20px;
  }
  .carouselImage {
    height: 100%;
    width: 100%;
    border-radius: 20px;
  }
  .el-carousel-item {
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
