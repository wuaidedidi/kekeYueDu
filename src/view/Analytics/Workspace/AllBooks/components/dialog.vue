<template>
  <el-dialog
    :model-value="visible"
    title="草稿信息"
    align-center
    width="500"
    @closed="handleClose"
  >
    <template #header>
      <div style="text-align: left; font-weight: bolder">title</div>
    </template>
    <el-form :model="form">
      <div class="draftInfoSet">
        <el-image :src="form.src" class="draftEditImage" />
        <div class="draftInfoSetInput">
          <el-form-item label="草稿名称" label-width="80px">
            <el-input
              v-model="form.bookName"
              autocomplete="off"
              placeholder="请输入"
              show-word-limit
              maxlength="20"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleConfirm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElButton, ElImage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { reactive, watch } from 'vue'
import type { Book } from '@/typings/book'

// 接收父组件传来的 props
const { visible, title, formData, formIndex, currentForm } = defineProps<{
  currentForm?: Book
  formIndex?: number
  visible: boolean
  title?: string // title 是可选的
  formData: Book[]
}>()

const form = reactive<Book>({
  id: 0,
  bookName: '',
  fontCount: 0,
  src: '/allBooks/bookList/bookTemplate1.png'
})

// 如果是编辑模式，初始化表单数据
if (formIndex !== undefined && formData[formIndex]) {
  Object.assign(form, formData[formIndex])
}
// 定义 emits，用于通知父组件
const emit = defineEmits(['update:visible', 'confirm'])

let firstOpen = true

// 当 props 的 formData 发生变化时，更新本地 form 数据
watch(
  () => formData,
  (newVal) => {
    Object.assign(form, newVal)
  }
)

watch(
  () => formIndex,
  (newIndex) => {
    if (firstOpen && currentForm) {
      Object.assign(currentForm, form)
      firstOpen = false
    }

    if (newIndex !== undefined && formData[newIndex]) {
      Object.assign(form, formData[newIndex])
    }
  }
)

// 关闭对话框时，通知父组件
const handleClose = () => {
  emit('update:visible', false) // 通知父组件更新 visible 的值为 false

  if (currentForm) {
    Object.assign(form, currentForm)
  }
}

// 点击确认时，提交表单并关闭对话框
const handleConfirm = () => {
  emit('update:visible', false) // 通知父组件更新 visible 的值为 false
  emit('confirm', form)
}
</script>
<style lang="scss" scoped>
.draftInfoSet {
  display: flex;
  height: clamp(150px, 25vh, 200px); // 响应式高度
  gap: clamp(1rem, 2vw, 1.5rem); // 添加间距
  align-items: center;

  .draftInfoSetInput {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex: 1;
  }

  .draftEditImage {
    width: clamp(120px, 20vw, 180px); // 响应式宽度
    height: auto; // 保持宽高比
    border-radius: clamp(4px, 1vw, 8px);
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

// 响应式弹窗样式
:deep(.el-dialog) {
  width: clamp(400px, 80vw, 600px); // 响应式宽度
  max-width: 90vw;
  border-radius: clamp(8px, 2vw, 16px);

  @media screen and (max-width: 480px) {
    width: 95vw;
    margin: 0 auto;
  }
}

:deep(.el-dialog__header) {
  padding: clamp(1rem, 2vh, 1.5rem);
  border-bottom: 1px solid #f0f0f0;

  .el-dialog__title {
    font-size: clamp(1rem, 2vw, 1.25rem);
    font-weight: 600;
  }
}

:deep(.el-dialog__body) {
  padding: clamp(1.5rem, 3vh, 2rem);
}

:deep(.el-dialog__footer) {
  padding: clamp(1rem, 2vh, 1.5rem) clamp(1.5rem, 3vh, 2rem);
  border-top: 1px solid #f0f0f0;
}

// 表单响应式样式
:deep(.el-form) {
  .el-form-item {
    margin-bottom: 0;

    .el-form-item__label {
      font-size: clamp(0.875rem, 1.2vw, 1rem);
      line-height: 1.4;
      padding-bottom: 0.5rem;
    }

    .el-input {
      .el-input__wrapper {
        border-radius: clamp(6px, 1vw, 8px);
        padding: clamp(0.5rem, 1vh, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover, &.is-focus {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
      }

      .el-input__inner {
        font-size: clamp(0.875rem, 1.2vw, 1rem);
        line-height: 1.4;
      }
    }
  }
}

// 按钮响应式样式
:deep(.dialog-footer) {
  .el-button {
    height: clamp(2.25rem, 4vh, 2.75rem);
    border-radius: clamp(6px, 1.5vw, 8px);
    font-size: clamp(0.875rem, 1.2vw, 1rem);
    padding: clamp(0.5rem, 1vh, 0.75rem) clamp(1.5rem, 3vw, 2rem);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(98, 106, 239, 0.3);
    }
  }
}

// 移动端优化
@media screen and (max-width: 768px) {
  .draftInfoSet {
    flex-direction: column;
    height: auto;
    text-align: center;

    .draftInfoSetInput {
      width: 100%;
      justify-content: center;
    }

    .draftEditImage {
      width: 120px;
      height: 120px;
      margin-bottom: 1rem;
    }
  }
}
</style>
