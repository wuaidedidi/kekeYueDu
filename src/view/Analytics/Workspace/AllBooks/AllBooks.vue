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
import axios from 'axios'
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

        .popperSet {
        }
        .starIcon:hover {
          animation: colorChange 3s linear infinite;
        }
        .starIcon {
          outline: none; /* 取消默认的选中边框 */
          border: none; /* 如果有其他类型的边框，也一并取消 */
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
<style lang="scss">
.el-message-box__btns .confirmButtonStyle {
  border-color: red;
  background-color: white;
  color: #eb4355;
}
</style>
