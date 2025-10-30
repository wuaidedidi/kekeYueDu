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
        @click="createNewBook"
        >新建作品</el-button
      >
      <el-button :icon="Plus" color="#626aef" plain @click="CreateDraft"
        >新建草稿</el-button
      >
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
      <div
        class="book"
        v-for="(item, index) in bookTemplates"
        :key="item.src"
        @click="clickBookHandler(item.id)"
      >
        <el-image :src="item.src" />
        <div class="bookDescription">
          <div class="description">{{ item.bookName }}</div>
          <div class="iconMore">
            <el-popover
              popper-class="popperSet"
              placement="bottom"
              :width="200"
              trigger="click"
            >
              <template #reference>
                <setting class="starIcon" />
              </template>
              <div style="color: lightgray">
                2024-09-26&nbsp;19:32更新魔女兵器爱好者，段落
              </div>
              <el-divider style="margin: 5px 0" />
              <div
                @click="
                  () => {
                    checkEditFormIndex = index
                    dialogFormVisible = true
                    reset = true
                    form = bookTemplates[index]
                  }
                "
              >
                草稿设置
              </div>
              <el-divider style="margin: 5px 0" />

              <div style="color: red" @click="openMessAge">删除草稿</div>
            </el-popover>
          </div>
        </div>
        <div class="textCount">{{ item.fontCount }}万字</div>
      </div>
    </div>
  </div>

  <!-- 使用封装的 Dialog 组件 -->
  <Dialog
    v-model:visible="dialogFormVisible"
    :title="'草稿信息'"
    :formData="bookTemplates"
    @update:visible="dialogFormVisible = $event"
    @confirm="handleConfirm"
    :formIndex="checkEditFormIndex"
    :currentForm="bookTemplates[checkEditFormIndex]"
  />
  <!-- 新增组件的 Dialog -->
  <Dialog
    v-model:visible="dialogAddFormVisible"
    :title="'新增草稿'"
    :formData="bookTemplates"
    @update:visible="dialogAddFormVisible = $event"
    @confirm="handleAddConfirm"
  />
  <!-- 使用封装的 Dialog 组件 -->
  <!-- <Dialog
    v-model:visible="dialogFormVisible"
    :title="'草稿信息'"
    :formData="bookTemplates"
    @update:visible="dialogFormVisible = $event"
    @confirm="handleConfirm"
  /> -->
</template>

<script setup lang="ts">
import { Grid, Plus, Setting } from '@element-plus/icons-vue'
import { ElButton, ElImage, ElNotification, ElMessageBox, ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import Dialog from './components/dialog.vue'
import type { Book } from '@/typings/book'
import router from '@/router'
import http from '@/utils/http'

const dialogFormVisible = ref(false)
const dialogAddFormVisible = ref(false)

const dialogDeleteFormVisible = ref(false)

const carouselPaths2 = [
  './allBooks/banner/carousel1.png',
  './allBooks/banner/carousel2.png',
  './allBooks/banner/carousel3.png',
  './allBooks/banner/carousel4.png',
]

const bookTemplates = ref<Book[]>([])

onMounted(() => {
  initAllDraft()
})
const initAllDraft = async () => {
  try {
    const res = await http.get('/allDraft')

    // 确保API响应数据正确
    const draftsData = res.data?.data || res.data || []

    // 将API返回的数据转换为Book格式
    const drafts = draftsData.map((draft: any, index: number) => ({
      id: draft.id || index + 1,
      bookName: draft.bookName || '未命名草稿',
      fontCount: draft.fontCount || 0,
      src: draft.src || `./allBooks/banner/carousel${(index % 4) + 1}.png`
    }))

    bookTemplates.value = drafts
    console.log('加载的草稿数据:', drafts)
  } catch (error) {
    console.error('加载草稿失败:', error)
    ElMessage.error('加载草稿失败，请稍后重试')
    // 设置默认数据防止页面崩溃
    bookTemplates.value = []
  }
}

const checkEditFormIndex = ref()

const reset = ref(false)
const form = reactive<Book>({
  ...bookTemplates.value[checkEditFormIndex.value],
})
const carouselPaths = ref<String[]>()

const openMessAge = () => {
  ElMessageBox.confirm('彻底删除不可恢复?', '删除' + form.bookName + '的大纲', {
    confirmButtonClass: 'confirmButtonStyle',
    confirmButtonText: '彻底删除',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    type: 'warning',
  })
    .then(() => {
      ElNotification.success({
        title: 'Success',
        message: '删除成功',
        offset: 200,
      })
      const deleteIndex = bookTemplates.value.findIndex((item) => {
        return item.bookName === form.bookName
      })

      bookTemplates.value.splice(deleteIndex, 1)
    })
    .catch(() => {
      ElNotification.error({
        title: 'Error',
        message: '删除失败',
        offset: 200,
      })
    })
}

const CreateDraft = () => {
  dialogAddFormVisible.value = true
}

const createNewBook = async () => {
  try {
    console.log('新建作品')

    // 直接创建一个新作品
    const res = await http.post('/createBook', {
      bookName: '新作品',
      fontCount: 0,
      src: './allBooks/bookList/bookTemplate1.png'
    })

    if (res.data.success) {
      ElMessage.success('作品创建成功')

      // 刷新草稿列表
      await initAllDraft()

      // 跳转到新作品的编辑页面
      const newBookId = res.data.data.id
      router.push({ name: 'draftDetail', params: { id: newBookId.toString() } })
    } else {
      ElMessage.error(res.data.message || '创建作品失败')
    }
  } catch (error) {
    console.error('创建作品失败:', error)
    ElMessage.error('创建作品失败，请稍后重试')
  }
}

// 处理确认事件
const handleConfirm = (formData: { name: string }) => {
  // 找到要更新的书籍索引

  // 直接更新 bookTemplates 中的对象
  bookTemplates.value[checkEditFormIndex.value] = {
    ...bookTemplates.value[checkEditFormIndex.value],
    ...formData,
  }

  console.log('更新后的书籍数据:', bookTemplates.value)
  // 这里可以进行进一步的处理
}

const handleAddConfirm = async (formData: Book) => {
  try {
    // 调用后端API创建草稿
    const res = await http.post('/createDraft', {
      bookName: formData.bookName,
      fontCount: formData.fontCount,
      src: formData.src
    })

    if (res.data.success) {
      // 刷新草稿列表
      await initAllDraft()
      dialogAddFormVisible.value = false
      ElMessage.success('草稿创建成功')
    } else {
      ElMessage.error(res.data.message || '创建草稿失败')
    }
  } catch (error) {
    console.error('创建草稿失败:', error)
    ElMessage.error('创建草稿失败，请稍后重试')
  }
}

const clickBookHandler = (id: number) => {
  console.log('点击书籍，ID:', id)

  if (!id || isNaN(id) || id <= 0) {
    ElMessage.warning('无效的书籍ID')
    return
  }

  try {
    router.push({ name: 'draftDetail', params: { id: id.toString() } })
  } catch (error) {
    console.error('路由跳转失败:', error)
    ElMessage.error('页面跳转失败，请重试')
  }
}

onMounted(() => {
  // 组件挂载时的初始化逻辑
  console.log('AllBooks component mounted')
})
</script>
<style lang="scss" scoped>
.content {
  height: 100%;
  width: min(90%, 1400px); // 限制最大宽度，防止超宽屏幕变形
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0 1rem; // 添加内边距防止贴边

  .addBookEdit {
    height: clamp(4rem, 8vh, 6rem); // 响应式高度
    min-height: 60px; // 最小高度
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-shrink: 0; // 防止压缩

    // 按钮间距使用相对单位
    .el-button {
      margin: 0 clamp(0.5rem, 1vw, 1rem);
      font-size: clamp(0.875rem, 1vw, 1rem); // 响应式字体
      height: auto;
      padding: clamp(0.5rem, 1vh, 0.75rem) clamp(1rem, 2vw, 1.5rem);
    }
  }

  .bookList {
    display: flex;
    flex: 1;
    gap: clamp(1rem, 2vw, 2rem); // 响应式间距
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start; // 内容从顶部开始

    .book {
      // 使用响应式尺寸，基于rem和vw
      width: clamp(280px, 18vw, 320px);
      min-width: 280px; // 最小宽度
      max-width: 320px; // 最大宽度
      height: clamp(200px, 25vw, 280px); // 保持宽高比
      display: flex;
      flex-direction: column;

      // 图片容器
      .el-image {
        display: flex;
        border-radius: clamp(4px, 1vw, 8px);
        height: 60%; // 使用百分比而非固定像素
        width: 100%;
        overflow: hidden;

        :deep(img) {
          width: 100%;
          height: 100%;
          object-fit: cover; // 保持图片比例
          transition: transform 0.3s ease;
        }

        &:hover :deep(img) {
          transform: scale(1.05); // 悬停微缩放效果
        }
      }

      // 描述区域
      .bookDescription {
        margin-top: clamp(0.5rem, 1vh, 0.75rem);
        display: flex;
        height: 30%; // 使用百分比
        overflow: hidden;
        text-align: left;

        .description {
          flex: 1;
          font-size: clamp(0.875rem, 1.2vw, 1rem); // 响应式字体
          line-height: 1.4;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2; // 最多显示2行
          -webkit-box-orient: vertical;
          word-break: break-word; // 防止长单词破坏布局
        }

        .iconMore {
          height: 100%;
          width: clamp(1.25rem, 2vw, 1.5rem);
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          padding-top: 0.25rem;

          .popperSet {
          }

          .starIcon {
            outline: none;
            border: none;
            cursor: pointer;
            font-size: clamp(0.875rem, 1.2vw, 1rem);
            transition: all 0.3s ease;

            &:hover {
              animation: colorChange 3s linear infinite;
              transform: scale(1.1);
            }
          }
        }
      }

      // 文字计数
      .textCount {
        margin-top: clamp(0.5rem, 1vh, 0.75rem);
        height: auto;
        color: rgb(148, 145, 145);
        font-size: clamp(0.75rem, 1vw, 0.875rem); // 响应式字体
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  // 轮播图响应式
  .el-carousel {
    margin-top: clamp(1rem, 2vh, 1.5rem);
    height: clamp(150px, 20vh, 200px);
    border-radius: clamp(12px, 2vw, 20px);
    overflow: hidden;

    .carouselImage {
      height: 100%;
      width: 100%;
      border-radius: inherit;
      object-fit: cover;
    }

    .el-carousel-item {
      border-radius: inherit;
      overflow: hidden;
    }
  }
}

// 优化的动画
@keyframes colorChange {
  0% {
    color: #ffcc00;
    transform: rotate(0deg);
  }
  50% {
    color: #750983;
    transform: rotate(180deg);
  }
  100% {
    color: #ffcc00;
    transform: rotate(360deg);
  }
}

// 响应式断点
@media screen and (max-width: 1400px) {
  .content .bookList .book {
    width: calc(25% - 1rem);
    max-width: none;
  }
}

@media screen and (max-width: 1200px) {
  .content .bookList .book {
    width: calc(33.333% - 1rem);
    max-width: none;
  }
}

@media screen and (max-width: 768px) {
  .content {
    width: 95%;
    padding: 0 0.5rem;
  }

  .content .bookList .book {
    width: calc(50% - 0.5rem);
    max-width: none;
  }
}

@media screen and (max-width: 480px) {
  .content {
    width: 98%;
    padding: 0 0.25rem;
  }

  .content .bookList .book {
    width: 100%;
    max-width: none;
  }

  .content .addBookEdit .el-button {
    margin: 0.25rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}
</style>
<style lang="scss">
.el-message-box__btns .confirmButtonStyle {
  border-color: red;
  background-color: white;
  color: #eb4355;
}
</style>
